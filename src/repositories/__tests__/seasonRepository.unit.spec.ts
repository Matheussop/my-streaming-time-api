import { Types } from 'mongoose';
import { SeasonRepository } from '../seasonRepository';
import Season from '../../models/series/season';
import { ISeasonResponse, ISeasonCreate, ISeasonUpdate, IEpisode } from '../../interfaces/series/season';

jest.mock('../../models/series/season');

describe('SeasonRepository', () => {
  let seasonRepository: SeasonRepository;
  let mockSeason: ISeasonResponse;
  let mockSeasons: ISeasonResponse[];
  let mockEpisode: IEpisode;
  let mockSeriesId: Types.ObjectId;

  beforeEach(() => {
    seasonRepository = new SeasonRepository();
    mockSeriesId = new Types.ObjectId();
    mockEpisode = {
      _id: new Types.ObjectId(),
      title: 'Test Episode',
      episodeNumber: 1,
      plot: 'Test plot',
      durationInMinutes: 45,
      releaseDate: '2024-03-20T00',
      poster: 'https://example.com/poster.jpg'
    };

    mockSeason = {
      _id: new Types.ObjectId(),
      seriesId: mockSeriesId,
      seasonNumber: 1,
      title: 'Test Season',
      releaseDate: '2024-03-20T00:00:00.000Z',
      plot: 'Test plot',
      episodes: [mockEpisode],
      createdAt: new Date('2024-03-20T00:00:00.000Z'),
      updatedAt: new Date('2024-03-20T00:00:00.000Z')
    } as ISeasonResponse;

    mockSeasons = [
      mockSeason,
      {
        ...mockSeason,
        _id: new Types.ObjectId(),
        seasonNumber: 2,
        title: 'Test Season 2'
      }
    ];

    (Season.findBySeriesId as jest.Mock).mockClear();
    (Season.find as jest.Mock).mockClear();
    (Season.findById as jest.Mock).mockClear();
    (Season.findEpisodesBySeasonNumber as jest.Mock).mockClear();
    (Season.create as jest.Mock).mockClear();
    (Season.findByIdAndUpdate as jest.Mock).mockClear();
    (Season.findByIdAndDelete as jest.Mock).mockClear();
  });

  describe('findBySeriesId', () => {
    it('should return seasons by series id with pagination', async () => {
      (Season.findBySeriesId as jest.Mock).mockResolvedValue(mockSeasons);

      const result = await seasonRepository.findBySeriesId(mockSeriesId.toString(), 0, 10);

      expect(Season.findBySeriesId).toHaveBeenCalledWith(mockSeriesId.toString(), 0, 10);
      expect(result).toEqual(mockSeasons);
    });

    it('should return null if no seasons found', async () => {
      (Season.findBySeriesId as jest.Mock).mockResolvedValue(null);

      const result = await seasonRepository.findBySeriesId(mockSeriesId.toString(), 0, 10);

      expect(Season.findBySeriesId).toHaveBeenCalledWith(mockSeriesId.toString(), 0, 10);
      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return all seasons with pagination', async () => {
      (Season.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue(mockSeasons)
          })
        })
      });

      const result = await seasonRepository.findAll(0, 10);

      expect(Season.find).toHaveBeenCalled();
      expect(result).toEqual(mockSeasons);
    });
  });

  describe('findById', () => {
    it('should return season by id', async () => {
      (Season.findById as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockSeason)
      });

      const result = await seasonRepository.findById(mockSeason._id.toString());

      expect(Season.findById).toHaveBeenCalledWith(mockSeason._id.toString());
      expect(result).toEqual(mockSeason);
    });

    it('should return null if season not found', async () => {
      (Season.findById as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(null)
      });

      const result = await seasonRepository.findById(mockSeason._id.toString());

      expect(Season.findById).toHaveBeenCalledWith(mockSeason._id.toString());
      expect(result).toBeNull();
    });
  });

  describe('findEpisodesBySeasonNumber', () => {
    it('should return episodes by season number', async () => {
      (Season.findEpisodesBySeasonNumber as jest.Mock).mockResolvedValue(mockSeason);

      const result = await seasonRepository.findEpisodesBySeasonNumber(mockSeriesId.toString(), 1);

      expect(Season.findEpisodesBySeasonNumber).toHaveBeenCalledWith(mockSeriesId.toString(), 1);
      expect(result).toEqual(mockSeason);
    });

    it('should return null if no episodes found', async () => {
      (Season.findEpisodesBySeasonNumber as jest.Mock).mockResolvedValue(null);

      const result = await seasonRepository.findEpisodesBySeasonNumber(mockSeriesId.toString(), 1);

      expect(Season.findEpisodesBySeasonNumber).toHaveBeenCalledWith(mockSeriesId.toString(), 1);
      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create a new season', async () => {
      const seasonData: ISeasonCreate = {
        seriesId: mockSeriesId,
        seasonNumber: 1,
        title: 'Test Season',
        releaseDate: '2024-03-20T00:00:00.000Z',
        plot: 'Test plot',
        episodes: [mockEpisode],
        tmdbId: 12345
      };

      (Season.create as jest.Mock).mockResolvedValue(mockSeason);

      const result = await seasonRepository.create(seasonData);

      expect(Season.create).toHaveBeenCalledWith(seasonData);
      expect(result).toEqual(mockSeason);
    });

    it('should create multiple seasons', async () => {
      const seasonsData: ISeasonCreate[] = [
        {
          seriesId: mockSeriesId,
          seasonNumber: 1,
          title: 'Test Season',
          releaseDate: '2024-03-20T00:00:00.000Z',
          plot: 'Test plot',
          episodes: [mockEpisode],
          tmdbId: 12345
        },
        {
          seriesId: mockSeriesId,
          seasonNumber: 2,
          title: 'Test Season 2',
          releaseDate: '2024-03-20T00:00:00.000Z',
          plot: 'Test plot',
          episodes: [mockEpisode],
          tmdbId: 12346
        }
      ];

      (Season.create as jest.Mock).mockResolvedValue(mockSeasons);

      const result = await seasonRepository.create(seasonsData);

      expect(Season.create).toHaveBeenCalledWith(seasonsData);
      expect(result).toEqual(mockSeasons);
    });
  });

  describe('update', () => {
    it('should update season', async () => {
      const updateData: ISeasonUpdate = {
        title: 'Updated Season',
        plot: 'Updated plot'
      };

      (Season.findByIdAndUpdate as jest.Mock).mockResolvedValue({
        ...mockSeason,
        ...updateData
      });

      const result = await seasonRepository.update(mockSeason._id.toString(), updateData);

      expect(Season.findByIdAndUpdate).toHaveBeenCalledWith(
        mockSeason._id.toString(),
        updateData,
        { new: true }
      );
      expect(result).toEqual({
        ...mockSeason,
        ...updateData
      });
    });

    it('should return null if season not found', async () => {
      const updateData: ISeasonUpdate = {
        title: 'Updated Season'
      };

      (Season.findByIdAndUpdate as jest.Mock).mockResolvedValue(null);

      const result = await seasonRepository.update(mockSeason._id.toString(), updateData);

      expect(Season.findByIdAndUpdate).toHaveBeenCalledWith(
        mockSeason._id.toString(),
        updateData,
        { new: true }
      );
      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete season', async () => {
      (Season.findByIdAndDelete as jest.Mock).mockResolvedValue(mockSeason);

      const result = await seasonRepository.delete(mockSeason._id.toString());

      expect(Season.findByIdAndDelete).toHaveBeenCalledWith(mockSeason._id.toString());
      expect(result).toEqual(mockSeason);
    });

    it('should return null if season not found', async () => {
      (Season.findByIdAndDelete as jest.Mock).mockResolvedValue(null);

      const result = await seasonRepository.delete(mockSeason._id.toString());

      expect(Season.findByIdAndDelete).toHaveBeenCalledWith(mockSeason._id.toString());
      expect(result).toBeNull();
    });
  });

  describe('findByStatus', () => {
    it('should return seasons by status', async () => {
      (Season.findByStatus as jest.Mock).mockResolvedValue(mockSeasons);

      const result = await seasonRepository.findByStatus(['ONGOING']);

      expect(Season.findByStatus).toHaveBeenCalledWith(['ONGOING']);
      expect(result).toEqual(mockSeasons);
    });
  });

  describe('findPopularSeasons', () => {
    it('should return popular seasons', async () => {
      (Season.findPopularSeasons as jest.Mock).mockResolvedValue(mockSeasons);

      const result = await seasonRepository.findPopularSeasons();

      expect(Season.findPopularSeasons).toHaveBeenCalled();
      expect(result).toEqual(mockSeasons);
    });
  });

  describe('updateSeasonAccessCount', () => {
    it('should update season access count', async () => {
      (Season.findByIdAndUpdate as jest.Mock).mockResolvedValue({
        ...mockSeason,
        accessCount: 1
      });

      const result = await seasonRepository.updateSeasonAccessCount(mockSeason._id.toString());

      expect(Season.findByIdAndUpdate).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ $inc: { accessCount: 1 }, lastAccessed: expect.any(Date) }), { new: true });
      expect(result).toEqual(expect.objectContaining({ accessCount: 1 }));
    });
  });
  
}); 