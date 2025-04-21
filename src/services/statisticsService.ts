import _ from 'lodash';
import {
  WatchTimeStats,
  ContentTypeDistribution,
  SeriesProgressStats,
  WatchingPatternStats,
  UserWatchingStats,
  SeriesProgressItem,
  GenrePreferenceStats
} from '../interfaces/statistics';
import { IStatisticsService } from '../interfaces/services';
import { EpisodeWatched, IUserStreamingHistoryResponse, SeriesProgress, WatchHistoryEntry } from '../interfaces/userStreamingHistory';
import { ContentService } from './commonService';

export class StatisticsService implements IStatisticsService {
  constructor(private contentService: ContentService) {}
  /**
   * Calcula estatísticas de tempo de visualização
   */
  getWatchTimeStats(userData: IUserStreamingHistoryResponse): WatchTimeStats {
    const totalWatchTimeInMinutes = userData.totalWatchTimeInMinutes || 0;
    
    // Calcular tempo de visualização por tipo de conteúdo
    const watchTimeByContentType = _.reduce(
      userData.watchHistory || [],
      (result: Record<string, number>, item: any) => {
        const contentType = item.contentType || 'unknown';
        const watchTime = item.watchedDurationInMinutes || 0;
        result[contentType] = (result[contentType] || 0) + watchTime;
        return result;
      },
      {} as Record<string, number>
    );
    
    // Calcular média por dia
    const watchDates = this.extractWatchDates(userData);
    const uniqueDays = _.uniqBy(watchDates, (date: Date) => date.toDateString()).length;
    const averageWatchTimePerDay = uniqueDays ? totalWatchTimeInMinutes / uniqueDays : 0;
    
    // Calcular média por sessão
    const totalSessions = (userData.watchHistory || []).length;
    const averageWatchTimePerSession = totalSessions ? totalWatchTimeInMinutes / totalSessions : 0;
    
    return {
      totalWatchTimeInMinutes,
      averageWatchTimePerDay,
      averageWatchTimePerSession,
      watchTimeByContentType
    };
  }
  
  /**
   * Calcula estatísticas de distribuição de tipos de conteúdo
   */
  getContentTypeDistribution(userData: IUserStreamingHistoryResponse): ContentTypeDistribution {
    const watchHistory = userData.watchHistory || [];
    const totalContent = watchHistory.length;
    
    // Contagem por tipo, usando 'unknown' como valor padrão
    const byType = _.countBy(
      watchHistory.map(item => item.contentType || 'unknown'),
      _.identity
    );
    
    // Porcentagem por tipo
    const percentageByType = _.mapValues(
      byType,
      (count: number) => totalContent && (count / totalContent) * 100
    );
    
    return {
      totalContent,
      byType,
      percentageByType
    };
  }
  
  /**
   * Calcula estatísticas de preferências de gênero
   */
  async getGenrePreferences(userData: IUserStreamingHistoryResponse): Promise<GenrePreferenceStats> {
    const watchHistory = userData.watchHistory || [];
    
    const contentGenres: Record<string, string[]> = {};
    
    await Promise.all(watchHistory.map(async (item: any) => {
      const contentId = item.contentId;
      
      const content = await this.contentService.getContentById(contentId);
      const genres: string[] = content?.genre.map((genre) => genre.name) || ['unknown'];
      contentGenres[contentId] = genres;
    }));

    // Agora contamos as ocorrências de cada gênero
    const genreCounts: Record<string, number> = {};
    const watchTimeByGenre: Record<string, number> = {};
    const completionByGenre: Record<string, number[]> = {};
    
    watchHistory.forEach((item: any) => {
      const contentId = item.contentId;
      const genres = contentGenres[contentId];
      const watchTime = item.watchedDurationInMinutes || 0;
      const completion = item.completionPercentage || 0;
      
      genres.forEach(genre => {
        // Contagem de gêneros
        genreCounts[genre] = (genreCounts[genre] || 0) + 1;
        
        // Tempo de visualização por gênero
        watchTimeByGenre[genre] = (watchTimeByGenre[genre] || 0) + watchTime;
        
        // Armazenar taxas de conclusão para calcular médias posteriormente
        if (!completionByGenre[genre]) {
          completionByGenre[genre] = [];
        }
        completionByGenre[genre].push(completion);
      });
    });
    
    // Calcular porcentagens
    const totalGenreCounts = _.sum(Object.values(genreCounts));
    const genrePercentages = _.mapValues(
      genreCounts, 
      count => totalGenreCounts && (count / totalGenreCounts) * 100 
    );
    
    // Calcular média de conclusão por gênero
    const averageCompletionByGenre = _.mapValues(
      completionByGenre,
      completionRates => {
        const sum = _.sum(completionRates);
        return completionRates.length && sum / completionRates.length;
      }
    );
    
    // Ordenar gêneros por contagem para encontrar os top gêneros
    const topGenres = Object.entries(genreCounts)
      .map(([genre, count]) => ({
        genre,
        count,
        percentage: genrePercentages[genre]
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10 gêneros
    
    return {
      genreCounts,
      genrePercentages,
      topGenres,
      watchTimeByGenre,
      averageCompletionByGenre
    };
  }
  
  /**
   * Calcula estatísticas de progresso de séries
   */
  getSeriesProgressStats(userData: IUserStreamingHistoryResponse): SeriesProgressStats {
    const watchHistory = userData.watchHistory || [];
    const seriesItems = watchHistory.filter(item => item.contentType === 'series');
    const series: SeriesProgressItem[] = seriesItems.map(item => {
      const seriesId = item.contentId;
      const seriesProgress = item.seriesProgress?.get(seriesId as string) as SeriesProgress;
      const watchedEpisodes = seriesProgress?.watchedEpisodes || 0;
      const totalEpisodes = seriesProgress?.totalEpisodes || 0;
      const completionPercentage = totalEpisodes ? (watchedEpisodes / totalEpisodes) * 100 : 0;
      
      // Calcular tempo total assistido na série
      let totalWatchTimeInMinutes = 0;
      const episodesWatched = seriesProgress?.episodesWatched;
      if (episodesWatched) {
        episodesWatched.forEach((episode: EpisodeWatched) => {
          totalWatchTimeInMinutes += episode.watchedDurationInMinutes || 0;
        });
      }
      
      // Calcular duração média dos episódios
      const averageEpisodeLength = watchedEpisodes ? totalWatchTimeInMinutes / watchedEpisodes : 0;
      
      return {
        title: item.title,
        totalEpisodes,
        watchedEpisodes,
        completionPercentage,
        totalWatchTimeInMinutes,
        averageEpisodeLength
      };
    });
    
    // Calcular média de conclusão
    const totalCompletionPercentage = series.reduce((sum, item) => sum + item.completionPercentage, 0);
    const averageCompletionPercentage = series.length ? totalCompletionPercentage / series.length : 0;
    
    // Encontrar série mais/menos assistida
    const mostWatchedSeries = _.maxBy(series, 'watchedEpisodes');
    const leastWatchedSeries = _.minBy(series, 'watchedEpisodes');
    
    return {
      series,
      mostWatchedSeries,
      leastWatchedSeries,
      averageCompletionPercentage
    };
  }
  
  /**
   * Calcula estatísticas de padrões de visualização
   */
  getWatchingPatterns(userData: IUserStreamingHistoryResponse): WatchingPatternStats {
    const watchDates = this.extractWatchDates(userData);
    // Obter contagem por dia da semana
    const daysOfWeek = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    
    // Ajustar para usar UTC ao invés do fuso horário local
    const watchCountByDay = _.countBy(watchDates, (date: Date) => {
      const utcDay = date.getUTCDay();
      return daysOfWeek[utcDay];
    });

    // Obter contagem por hora usando UTC
    const watchCountByHour = _.countBy(watchDates, (date: Date) => date.getHours());
    
    // Encontrar dia/hora mais ativos usando UTC
    const mostActiveDay = this.findMostFrequent(watchDates.map(date => daysOfWeek[date.getUTCDay()]));

    const findMostFrequentHour = this.findMostFrequent(watchDates.map(date => date.getHours().toString()));
    const mostActiveHour = parseInt(findMostFrequentHour || '0');
    
    // Encontrar data mais ativa usando UTC
    const dateCount = _.countBy(watchDates, (date: Date) => {
      const utcDate = new Date(Date.UTC(
        date.getUTCFullYear(),
        date.getUTCMonth(),
        date.getUTCDate()
      ));
      return utcDate.toISOString().split('T')[0];
    });
    
    const mostActiveDateStr = _.maxBy(Object.entries(dateCount), ([_, count]: [any, number]) => count)?.[0];
    const mostActiveDate = mostActiveDateStr ? new Date(mostActiveDateStr) : undefined;
    
    // Calcular tempo médio entre episódios
    const watchDatesSorted = [...watchDates].sort((a, b) => a.getTime() - b.getTime());
    const timeBetweenEpisodes: number[] = [];
    
    for (let i = 1; i < watchDatesSorted.length; i++) {
      const timeDiff = watchDatesSorted[i].getTime() - watchDatesSorted[i-1].getTime();
      // Converter de milissegundos para minutos
      timeBetweenEpisodes.push(timeDiff / (1000 * 60));
    }
    
    const averageTimeBetweenEpisodes = timeBetweenEpisodes.length 
      ? _.sum(timeBetweenEpisodes) / timeBetweenEpisodes.length
      : undefined;
    
    return {
      mostActiveDate,
      mostActiveDay,
      mostActiveHour,
      watchCountByDay,
      watchCountByHour,
      averageTimeBetweenEpisodes
    };
  }
  
  /**
   * Agrega todas as estatísticas em um único objeto
   */
  async getAllStats(userData: any): Promise<UserWatchingStats> {
    return {
      watchTimeStats: this.getWatchTimeStats(userData),
      contentTypeDistribution: this.getContentTypeDistribution(userData),
      seriesProgressStats: this.getSeriesProgressStats(userData),
      watchingPatternStats: this.getWatchingPatterns(userData),
      genrePreferenceStats: await this.getGenrePreferences(userData)
    };
  }
  
  /**
   * Extrai todas as datas de visualização do histórico do usuário
   */
  private extractWatchDates(userData: any): Date[] {
    const watchDates: Date[] = [];
    const watchHistory = userData.watchHistory || [];
    // Pegar datas de visualização do histórico
    watchHistory.forEach((item: WatchHistoryEntry) => {
      // Verificar episódios para séries
      if (item.contentType === 'series' && item.seriesProgress) {
        const seriesId = item.contentId;
        const seriesProgress = item.seriesProgress.get(seriesId.toString());
        if (seriesProgress) {
          const episodesWatched = seriesProgress.episodesWatched;
          episodesWatched.forEach((episode: EpisodeWatched) => {
            if (episode.watchedAt) {
              watchDates.push(new Date(episode.watchedAt));
            }
          });
        }
      } else {
        if (item.watchedAt) {
          watchDates.push(new Date(item.watchedAt));
        }
      }
    });
    return watchDates;
  }
  
  /**
   * Encontra o elemento mais frequente em um array
   */
  private findMostFrequent<T>(arr: T[]): T | undefined {
    if (!arr.length) return undefined;
    
    const frequency = _.countBy(arr);
    return _.maxBy(Object.entries(frequency), ([_, count]: [any, number]) => count)![0] as T;
  }
  
}
