import { CronJob } from 'cron';
import { SeasonRepository } from '../repositories/seasonRepository';
import { TMDBService } from './tmdbService';
import { IEpisode, ISeasonResponse, SeasonStatus } from '../interfaces/series/season';
import logger from '../config/logger';
import { Types } from 'mongoose';

// Definitions of TTL in milliseconds
const TTL_COMPLETED = 15552000000;  // 6 months
const TTL_ONGOING = 86400000;       // 1 day
const TTL_UPCOMING = 1209600000;    // 2 weeks
const TTL_SPECIAL = 43200000;       // 12 hours - for very popular series

interface CachePolicy {
  ttl: number;
  updateStrategy: 'aggressive' | 'passive' | 'on_access';
  updateSchedule?: string; // Cron expression for scheduled updates
}

const cachePolicies: Record<SeasonStatus, CachePolicy> = {
  COMPLETED: { 
    ttl: TTL_COMPLETED, 
    updateStrategy: 'passive' 
  },
  ONGOING: { 
    ttl: TTL_ONGOING, 
    updateStrategy: 'aggressive',
    updateSchedule: '0 0 * * *' // Update daily at midnight
  },
  UPCOMING: { 
    ttl: TTL_UPCOMING, 
    updateStrategy: 'passive',
    updateSchedule: '0 0 * * 1' // Update every Monday at midnight
  },
  SPECIAL_INTEREST: {
    ttl: TTL_SPECIAL,
    updateStrategy: 'on_access'
  }
};

export class SeasonCacheService {
  private updateJobs: Map<string, CronJob> = new Map();
  
  constructor(
    private seasonRepository: SeasonRepository,
    private tmdbService: TMDBService
  ) {
    this.initStateTransitionJob();
    this.initPopularSeriesJob();
  }
  
  async shouldUpdateSeason(season: ISeasonResponse): Promise<boolean> {
    if (!season.lastUpdated || !season.status) return true;
    
    await this.recordAccess(season._id);
    const policy = cachePolicies[season.status as SeasonStatus];
    const dataAge = Date.now() - new Date(season.lastUpdated).getTime();
    
    switch (policy.updateStrategy) {
      case 'on_access':
        return dataAge > 3600000; // 1 hour minimum interval
        
      case 'aggressive':
        // For ongoing seasons, check if today is the release day
        if (season.releaseWeekday === new Date().getDay()) {
          return true;
        }
        return dataAge > policy.ttl;
        
      case 'passive':
      default:
        return dataAge > policy.ttl;
    }
  }
  
  private async recordAccess(seasonId: string | Types.ObjectId): Promise<void> {
    const numberPopularityThreshold: number = Number(process.env.NUMBER_POPULARITY_THRESHOLD) || 7;

    try {
      await this.seasonRepository.updateSeasonAccessCount(seasonId);
      
      // Check if we need to update status to SPECIAL_INTEREST
      const season = await this.seasonRepository.findById(seasonId);
      if (season && season.accessCount && season.accessCount > numberPopularityThreshold && season.status !== 'SPECIAL_INTEREST') {
        await this.seasonRepository.update(seasonId, {
          status: 'SPECIAL_INTEREST'
        });
        
        this.updateSeasonData(season);
      }
    } catch (error: any) {
      logger.error({
        message: 'Error recording season access',
        seasonId,
        error: error.message
      });
    }
  }
  
  async updateSeasonData(season: ISeasonResponse): Promise<boolean> {
    try {
      if (!season.tmdbId ) {
        logger.error({
          message: 'Missing required season data for update',
          seasonId: season._id
        });
        return false;
      }
      
      const episodesData = await this.tmdbService.fetchEpisodes(season.tmdbId, season.seasonNumber);
      if (!episodesData || !episodesData.episodes) {
        return false;
      }
      
      const newEpisodes: IEpisode[] = episodesData.episodes.map((episode: any) => ({
        _id: new Types.ObjectId().toString(),
        episodeNumber: episode.episode_number,
        title: episode.name,
        plot: episode.overview || '',
        durationInMinutes: episode.runtime || 0,
        releaseDate: episode.air_date || '',
        poster: episode.still_path ? `https://image.tmdb.org/t/p/w500${episode.still_path}` : '',
      }));
      let updatedEpisodes: IEpisode[] = [];
      
      // If the season already has episodes, update only the necessary ones
      if (season.episodes && season.episodes.length > 0) {
        updatedEpisodes = [...season.episodes];
        // For each new episode, check if it already exists and update or add
        newEpisodes.forEach(newEpisode => {
          const existingIndex = updatedEpisodes.findIndex(e => e.episodeNumber === newEpisode.episodeNumber);
          
            if (existingIndex >= 0) {
              // Update only if there are significant changes
              const existingEpisode = updatedEpisodes[existingIndex];
              const needsUpdate = 
                (existingEpisode.durationInMinutes !== newEpisode.durationInMinutes) ||
                (existingEpisode.plot !== newEpisode.plot) ||
                (existingEpisode.poster !== newEpisode.poster) ||
                (existingEpisode.releaseDate !== newEpisode.releaseDate) ||
                (existingEpisode.title !== newEpisode.title);

              if (needsUpdate) {
                updatedEpisodes[existingIndex] = {
                  ...existingEpisode,
                  ...newEpisode,
                  // Keep the original ID
                  _id: existingEpisode._id
                };
              }
            } else {
              updatedEpisodes.push(newEpisode);
            }
        });
      } else {
        updatedEpisodes = newEpisodes;
      }
      // Determine the next season status
      const newStatus = this.determineSeasonStatus(season, updatedEpisodes);
      
      // Calculate the release weekday of the episodes
      const releaseWeekday = this.calculateReleaseWeekday(updatedEpisodes);
      
      // Update the season with new data and status
      await this.seasonRepository.update(season._id, {
        episodes: updatedEpisodes,
        episodeCount: updatedEpisodes.length,
        status: newStatus,
        lastUpdated: new Date(),
        releaseWeekday,
        nextEpisodeDate: this.calculateNextEpisodeDate(updatedEpisodes)
      });
      
      // If the status changed, we can schedule updates based on the new status
      if (season.status !== newStatus) {
        this.scheduleSeasonUpdates(season._id.toString(), newStatus);
      }
      
      return true;
    } catch (error: any) {
      logger.error({
        message: 'Error updating season data',
        seasonId: season._id,
        error: error.message
      });
      return false;
    }
  }
  
  // Determine the status of a season based on the episodes
  private determineSeasonStatus(season: ISeasonResponse, episodes: IEpisode[]): SeasonStatus {
    if (!episodes || episodes.length === 0) {
      return 'UPCOMING';
    }
    
    // Check if all episodes have complete data and have been released
    const allComplete = episodes.every(e => 
      e.durationInMinutes && 
      e.plot && 
      e.releaseDate && 
      new Date(e.releaseDate) < new Date()
    );
    
    if (allComplete) {
      return 'COMPLETED';
    }
    
    // Check if any episode has been released
    const anyReleased = episodes.some(e => 
      e.releaseDate && new Date(e.releaseDate) < new Date()
    );
    
    return anyReleased ? 'ONGOING' : 'UPCOMING';
  }
  
  private calculateReleaseWeekday(episodes: IEpisode[]): number | undefined {
    const releasedEpisodes = episodes.filter(e => e.releaseDate);
    if (releasedEpisodes.length < 2) return undefined;
    
    const weekdayCounts = new Map<number, number>();
    
    for (const episode of releasedEpisodes) {
      const weekday = new Date(episode.releaseDate).getDay();
      weekdayCounts.set(weekday, (weekdayCounts.get(weekday) || 0) + 1);
    }
    
    let mostCommonWeekday: number | undefined;
    let highestCount = 0;
    
    weekdayCounts.forEach((count, weekday) => {
      if (count > highestCount) {
        highestCount = count;
        mostCommonWeekday = weekday;
      }
    });
    
    return mostCommonWeekday;
  }
  
  private calculateNextEpisodeDate(episodes: IEpisode[]): Date | undefined {
    const futureDates = episodes
      .filter(e => e.releaseDate && new Date(e.releaseDate) > new Date())
      .map(e => new Date(e.releaseDate));
    
    if (futureDates.length === 0) {
      return undefined;
    }
    
    futureDates.sort((a, b) => a.getTime() - b.getTime());
    return futureDates[0];
  }
  
  private scheduleSeasonUpdates(seasonId: string, status: SeasonStatus): void {
    if (this.updateJobs.has(seasonId)) {
      this.updateJobs.get(seasonId)?.stop();
      this.updateJobs.delete(seasonId);
    }
    
    const policy = cachePolicies[status];
    if (!policy.updateSchedule) {
      return;
    }
    
    const job = new CronJob(policy.updateSchedule, async () => {
      const season = await this.seasonRepository.findById(seasonId);
      if (season) {
        await this.updateSeasonData(season);
      } else {
        job.stop();
        this.updateJobs.delete(seasonId);
      }
    });
    
    job.start();
    this.updateJobs.set(seasonId, job);
  }
  
  private initStateTransitionJob(): void {
    new CronJob('0 0 * * 0', async () => {
      try {
        const seasons = await this.seasonRepository.findByStatus(['ONGOING', 'UPCOMING']);
        
        for (const season of seasons) {
          await this.updateSeasonData(season);
        }
      } catch (error: any) {
        logger.error({
          message: 'Error in state transition job',
          error: error.message
        });
      }
    }).start();
  }
  
  // Job to identify popular series (runs daily)
  private initPopularSeriesJob(): void {
    new CronJob('0 2 * * *', async () => {
      try {
        const popularSeasons = await this.seasonRepository.findPopularSeasons();
        
        for (const season of popularSeasons) {
          if (season.status !== 'SPECIAL_INTEREST') {
            await this.seasonRepository.update(season._id, {
              status: 'SPECIAL_INTEREST'
            });
          }
        }
      } catch (error: any) {
        logger.error({
          message: 'Error in popular series job',
          error: error.message
        });
      }
    }).start();
  }
} 