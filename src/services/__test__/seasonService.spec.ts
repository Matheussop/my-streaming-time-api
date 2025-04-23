import { Types } from "mongoose";
import { IEpisode, ISeasonCreate, ISeasonResponse, ISeasonUpdate } from "../../interfaces/series/season";
import { SeasonRepository } from "../../repositories/seasonRepository";
import { SeasonService } from "../seasonService";
import { TMDBService } from "../tmdbService";
import { generateValidObjectId } from "../../util/__tests__/generateValidObjectId";
import { SeasonCacheService } from "../seasonCacheService";

jest.mock('../tmdbService');
jest.mock('../seasonCacheService', () => {
  return {
    SeasonCacheService: jest.fn().mockImplementation(() => {
      return {
        shouldUpdateSeason: jest.fn(),
        updateSeasonData: jest.fn()
      };
    })
  };
});

describe('SeasonService', () => {
  let seasonService: SeasonService;
  let mockSeasonRepository: jest.Mocked<SeasonRepository>;
  let mockTMDBService: jest.Mocked<TMDBService>;
  let mockSeasonCacheService: jest.Mocked<SeasonCacheService>;

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
    updatedAt: new Date('2024-03-20'),
    status: 'ONGOING'
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
      delete: jest.fn(),
      findByStatus: jest.fn(),
      findPopularSeasons: jest.fn(),
      updateSeasonAccessCount: jest.fn()
    } as unknown as jest.Mocked<SeasonRepository>;

    mockTMDBService = {
      fetchEpisodes: jest.fn()
    } as unknown as jest.Mocked<TMDBService>;

    // Garantir que o mock seja redefinido entre os testes
    jest.clearAllMocks();
    
    // Criar o serviço
    seasonService = new SeasonService(mockSeasonRepository, mockTMDBService);
    
    // Obter o mock do seasonCacheService que foi criado dentro do construtor
    mockSeasonCacheService = (SeasonCacheService as unknown as jest.Mock).mock.results[0].value;
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
      mockSeasonCacheService.shouldUpdateSeason.mockResolvedValue(false);

      const result = await seasonService.getEpisodesBySeasonNumber(
        mockSeriesId.toString(),
        mockSeason.seasonNumber
      );
      expect(result).toEqual(mockSeason);
      expect(mockSeasonRepository.findEpisodesBySeasonNumber).toHaveBeenCalledWith(
        mockSeriesId,
        mockSeason.seasonNumber
      );
      expect(mockSeasonCacheService.shouldUpdateSeason).toHaveBeenCalledWith(mockSeason);
      expect(mockSeasonCacheService.updateSeasonData).not.toHaveBeenCalled();
    });

    it('should trigger cache update if shouldUpdateSeason returns true', async () => {
      mockSeasonRepository.findEpisodesBySeasonNumber.mockResolvedValue(mockSeason);
      mockSeasonCacheService.shouldUpdateSeason.mockResolvedValue(true);
      mockSeasonCacheService.updateSeasonData.mockResolvedValue(true);

      const result = await seasonService.getEpisodesBySeasonNumber(
        mockSeriesId.toString(),
        mockSeason.seasonNumber
      );
      
      expect(result).toEqual(mockSeason);
      expect(mockSeasonCacheService.shouldUpdateSeason).toHaveBeenCalledWith(mockSeason);
      expect(mockSeasonCacheService.updateSeasonData).toHaveBeenCalledWith(mockSeason);
    });

    it('should be able to log errors if updateSeasonData fails', async () => {
      mockSeasonRepository.findEpisodesBySeasonNumber.mockResolvedValue(mockSeason);
      mockSeasonCacheService.shouldUpdateSeason.mockResolvedValue(true);
      mockSeasonCacheService.updateSeasonData.mockResolvedValue(true);
      mockSeasonCacheService.updateSeasonData.mockRejectedValue(new Error('Error'));
      const result = await seasonService.getEpisodesBySeasonNumber(
        mockSeriesId.toString(),
        mockSeason.seasonNumber
      );
      expect(result).toEqual(mockSeason);
      expect(mockSeasonCacheService.updateSeasonData).toHaveBeenCalledWith(mockSeason);
    });

    it('should update season info if episodes are missing but episodeCount exists', async () => {
      const seasonWithoutEpisodes = {
        ...mockSeason,
        episodes: [],
        episodeCount: 10
      };

      mockSeasonRepository.findEpisodesBySeasonNumber.mockResolvedValue(seasonWithoutEpisodes);
      mockSeasonCacheService.updateSeasonData.mockResolvedValue(true);
      mockSeasonRepository.findById.mockResolvedValue(mockSeason);
      mockSeasonRepository.update.mockResolvedValue(mockSeason);

      const result = await seasonService.getEpisodesBySeasonNumber(
        mockSeriesId.toString(),
        mockSeason.seasonNumber
      );

      expect(result).toEqual(mockSeason);
      expect(mockSeasonCacheService.updateSeasonData).toHaveBeenCalledWith(seasonWithoutEpisodes);
      expect(mockSeasonRepository.findById).toHaveBeenCalledWith(seasonWithoutEpisodes._id);
      expect(mockSeasonRepository.update).toHaveBeenCalledWith(
        mockSeasonId,
        { episodes: mockSeason.episodes }
      );
    });

    it('should return null if episodes are not found in cache update', async () => {
      const seasonWithoutEpisodes = {
        ...mockSeason,
        episodes: [],
        episodeCount: 10
      };

      mockSeasonRepository.findEpisodesBySeasonNumber.mockResolvedValue(seasonWithoutEpisodes);
      mockSeasonCacheService.updateSeasonData.mockResolvedValue(false);

      const result = await seasonService.getEpisodesBySeasonNumber(
        mockSeriesId.toString(),
        mockSeason.seasonNumber
      );
      
      expect(result).toBeNull();
      expect(mockSeasonCacheService.updateSeasonData).toHaveBeenCalledWith(seasonWithoutEpisodes);
    });

    it('should return null if findById returns null', async () => {
      const seasonWithoutEpisodes = {
        ...mockSeason,
        episodes: [],
        episodeCount: 10
      };

      mockSeasonRepository.findEpisodesBySeasonNumber.mockResolvedValue(seasonWithoutEpisodes);
      mockSeasonCacheService.updateSeasonData.mockResolvedValue(true);
      mockSeasonRepository.findById.mockResolvedValue(null);
      const result = await seasonService.getEpisodesBySeasonNumber(
        mockSeriesId.toString(),
        mockSeason.seasonNumber
      );
      
      expect(result).toBeNull();
      expect(mockSeasonCacheService.updateSeasonData).toHaveBeenCalledWith(seasonWithoutEpisodes);
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