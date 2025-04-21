import { Types } from "mongoose";
import { IEpisode, ISeasonCreate, ISeasonResponse, ISeasonUpdate } from "../../interfaces/series/season";
import { SeasonRepository } from "../../repositories/seasonRepository";
import { SeasonService } from "../seasonService";
import { TMDBService } from "../tmdbService";
import { generateValidObjectId } from "../../util/__tests__/generateValidObjectId";

jest.mock('../tmdbService');

describe('SeasonService', () => {
  let seasonService: SeasonService;
  let mockSeasonRepository: jest.Mocked<SeasonRepository>;
  let mockTMDBService: jest.Mocked<TMDBService>;

  const mockEpisode: IEpisode = {
    _id: generateValidObjectId() as Types.ObjectId,
    episodeNumber: 1,
    title: 'Test Episode',
    plot: 'Test plot',
    durationInMinutes: 45,
    releaseDate: '2024-03-20',
    poster: '/poster.jpg'
  };

  const mockSeasonId = generateValidObjectId() as Types.ObjectId;
  const mockSeriesId = generateValidObjectId() as Types.ObjectId;

  const mockSeason: ISeasonResponse = {
    _id: mockSeasonId,
    seriesId: mockSeriesId,
    seasonNumber: 1,
    title: 'Test Season',
    plot: 'Test plot',
    releaseDate: '2024-03-20',
    poster: '/poster.jpg',
    episodeCount: 10,
    episodes: [mockEpisode],
    tmdbId: 12345,
    createdAt: new Date('2024-03-20'),
    updatedAt: new Date('2024-03-20')
  };

  const mockTMDBEpisodes = {
    episodes: [
      {
        episode_number: 1,
        name: 'Test Episode',
        overview: 'Test plot',
        runtime: 45,
        air_date: '2024-03-20',
        still_path: '/poster.jpg'
      }
    ]
  };

  beforeEach(() => {
    mockSeasonRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findBySeriesId: jest.fn(),
      findEpisodesBySeasonNumber: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    } as unknown as jest.Mocked<SeasonRepository>;

    mockTMDBService = {
      fetchEpisodes: jest.fn()
    } as unknown as jest.Mocked<TMDBService>;

    seasonService = new SeasonService(mockSeasonRepository, mockTMDBService);
  });

  describe('getSeasons', () => {
    it('should return all seasons with pagination', async () => {
      mockSeasonRepository.findAll.mockResolvedValue([mockSeason]);
      const result = await seasonService.getSeasons(1, 10);
      expect(result).toEqual([mockSeason]);
      expect(mockSeasonRepository.findAll).toHaveBeenCalledWith(1, 10);
    });
  });

  describe('getSeasonsBySeriesId', () => {
    it('should return seasons by series id', async () => {
      mockSeasonRepository.findBySeriesId.mockResolvedValue([mockSeason]);
      const result = await seasonService.getSeasonsBySeriesId(mockSeriesId.toString(), 1, 10);
      expect(result).toEqual([mockSeason]);
      expect(mockSeasonRepository.findBySeriesId).toHaveBeenCalledWith(mockSeriesId, 1, 10);
    });
  });

  describe('getSeasonById', () => {
    it('should return a season by id', async () => {
      mockSeasonRepository.findById.mockResolvedValue(mockSeason);
      const result = await seasonService.getSeasonById(mockSeasonId.toString());
      expect(result).toEqual(mockSeason);
      expect(mockSeasonRepository.findById).toHaveBeenCalledWith(mockSeasonId);
    });

    it('should return null if season is not found', async () => {
      mockSeasonRepository.findById.mockResolvedValue(null);
      const result = await seasonService.getSeasonById(mockSeasonId.toString());
      expect(result).toBeNull();
      expect(mockSeasonRepository.findById).toHaveBeenCalledWith(mockSeasonId);
    });
  });

  describe('getEpisodesBySeasonNumber', () => {
    it('should return episodes for a season', async () => {
      mockSeasonRepository.findEpisodesBySeasonNumber.mockResolvedValue(mockSeason);
      const result = await seasonService.getEpisodesBySeasonNumber(
        mockSeriesId.toString(),
        mockSeason.seasonNumber
      );
      expect(result).toEqual(mockSeason);
      expect(mockSeasonRepository.findEpisodesBySeasonNumber).toHaveBeenCalledWith(
        mockSeriesId,
        mockSeason.seasonNumber
      );
    });

    it('should update season info if episodes are missing but episodeCount exists', async () => {
      const seasonWithoutEpisodes = {
        ...mockSeason,
        episodes: [],
        episodeCount: 10
      };

      mockSeasonRepository.findEpisodesBySeasonNumber.mockResolvedValue(seasonWithoutEpisodes);
      mockTMDBService.fetchEpisodes.mockResolvedValue(mockTMDBEpisodes);
      mockSeasonRepository.update.mockResolvedValue(mockSeason);

      const result = await seasonService.getEpisodesBySeasonNumber(
        mockSeriesId.toString(),
        mockSeason.seasonNumber
      );

      expect(result).toEqual(mockSeason);
      expect(mockTMDBService.fetchEpisodes).toHaveBeenCalledWith(
        mockSeason.tmdbId,
        mockSeason.seasonNumber
      );
      expect(mockSeasonRepository.update).toHaveBeenCalledWith(
        mockSeasonId,
        expect.objectContaining({
          episodes: expect.arrayContaining([
            expect.objectContaining({
              episodeNumber: mockEpisode.episodeNumber,
              title: mockEpisode.title,
              plot: mockEpisode.plot,
              durationInMinutes: mockEpisode.durationInMinutes,
              releaseDate: mockEpisode.releaseDate,
              poster: `https://image.tmdb.org/t/p/w500${mockEpisode.poster}`
            })
          ])
        })
      );
    });

    it('should return null if episodes are not found in TMDB', async () => {
      const updateSeasonInfoSpy = jest.spyOn(seasonService as any, 'updateSeasonInfo');
      const seasonWithoutEpisodes = {
        ...mockSeason,
        episodes: [],
        episodeCount: 10
      };

      mockSeasonRepository.findEpisodesBySeasonNumber.mockResolvedValue(seasonWithoutEpisodes);
      mockTMDBService.fetchEpisodes.mockResolvedValue(null);
      const result = await seasonService.getEpisodesBySeasonNumber(
        mockSeriesId.toString(),
        mockSeason.seasonNumber
      );
      expect(updateSeasonInfoSpy).toHaveBeenCalledWith(seasonWithoutEpisodes);
      expect(result).toBeNull();
    });

    it('should return null if season is not found', async () => {
      mockSeasonRepository.findEpisodesBySeasonNumber.mockResolvedValue(null);
      const result = await seasonService.getEpisodesBySeasonNumber(
        mockSeriesId.toString(),
        mockSeason.seasonNumber
      );
      expect(result).toBeNull();
    });

    it('should return null if required fields are missing', async () => {
      const invalidSeason = {
        ...mockSeason,
        episodes: [],
        episodeCount: 0,
        tmdbId: 0
      };

      mockSeasonRepository.findEpisodesBySeasonNumber.mockResolvedValue(invalidSeason);
      const result = await seasonService.getEpisodesBySeasonNumber(
        mockSeriesId.toString(),
        mockSeason.seasonNumber
      );
      expect(result).toBeNull();
    });
  });

  describe('createSeason', () => {
    it('should create a single season', async () => {
      const seasonCreate: ISeasonCreate = { ...mockSeason };

      mockSeasonRepository.create.mockResolvedValue(mockSeason);
      const result = await seasonService.createSeason(seasonCreate);
      expect(result).toEqual(mockSeason);
      expect(mockSeasonRepository.create).toHaveBeenCalledWith({
        ...seasonCreate,
        seriesId: mockSeriesId
      });
    });

    it('should create multiple seasons', async () => {
      const mockSeasons = [
        { ...mockSeason, seasonNumber: 1 },
        { ...mockSeason, seasonNumber: 2 }
      ];

      mockSeasonRepository.create.mockResolvedValue(mockSeasons);
      const result = await seasonService.createSeason(mockSeasons);
      expect(result).toEqual(mockSeasons);
      expect(mockSeasonRepository.create).toHaveBeenCalledWith(
        mockSeasons.map(season => ({
          ...season,
          seriesId: mockSeriesId
        }))
      );
    });
  });

  describe('updateSeason', () => {
    it('should update a season', async () => {
      const seasonUpdate: ISeasonUpdate = {
        episodeCount: 12
      };

      const updatedSeason = { ...mockSeason, episodeCount: 12 };
      mockSeasonRepository.update.mockResolvedValue(updatedSeason);
      const result = await seasonService.updateSeason(mockSeasonId.toString(), seasonUpdate);
      expect(result).toEqual(updatedSeason);
      expect(mockSeasonRepository.update).toHaveBeenCalledWith(mockSeasonId, seasonUpdate);
    });

    it('should return null if season is not found for update', async () => {
      const seasonUpdate: ISeasonUpdate = {
        episodeCount: 12
      };

      mockSeasonRepository.update.mockResolvedValue(null);
      const result = await seasonService.updateSeason(mockSeasonId.toString(), seasonUpdate);
      expect(result).toBeNull();
      expect(mockSeasonRepository.update).toHaveBeenCalledWith(mockSeasonId, seasonUpdate);
    });
  });

  describe('deleteSeason', () => {
    it('should delete a season', async () => {
      mockSeasonRepository.delete.mockResolvedValue(mockSeason);
      const result = await seasonService.deleteSeason(mockSeasonId.toString());
      expect(result).toEqual(mockSeason);
      expect(mockSeasonRepository.delete).toHaveBeenCalledWith(mockSeasonId);
    });

    it('should return null if season is not found for deletion', async () => {
      mockSeasonRepository.delete.mockResolvedValue(null);
      const result = await seasonService.deleteSeason(mockSeasonId.toString());
      expect(result).toBeNull();
      expect(mockSeasonRepository.delete).toHaveBeenCalledWith(mockSeasonId);
    });
  });
}); 