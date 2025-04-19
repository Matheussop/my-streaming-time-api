import { Types } from 'mongoose';
import { SeriesRepository } from '../seriesRepository';
import Series from '../../models/series/seriesModel';
import { ISeriesResponse, ISeriesCreate, ISeriesUpdate } from '../../interfaces/series/series';
import { IContentModel } from '../../interfaces/content';

jest.mock('../../models/series/seriesModel');

const createMockGenreReference = (name: string, id: number) => ({
  _id: new Types.ObjectId(),
  name,
  id,
});

describe('SeriesRepository', () => {
  let seriesRepository: SeriesRepository;
  let mockSeries: ISeriesResponse;
  let mockSeriesArray: ISeriesResponse[];

  beforeEach(() => {
    seriesRepository = new SeriesRepository();
    mockSeries = {
      _id: new Types.ObjectId(),
      title: 'Test Series',
      contentType: 'series',
      releaseDate: '2024-03-20T00:00:00.000Z',
      plot: 'Test plot',
      cast: ['Actor 1', 'Actor 2'],
      genre: ['Action', 'Drama'],
      rating: 8.5,
      poster: 'https://example.com/poster.jpg',
      url: 'https://example.com/series.mp4',
      totalSeasons: 1,
      totalEpisodes: 10,
      seasonsSummary: [{
        seasonId: new Types.ObjectId(),
        seasonNumber: 1,
        title: 'Season 1',
        episodeCount: 10,
        releaseDate: '2024-03-20T00:00:00.000Z'
      }],
      createdAt: new Date('2024-03-20T00:00:00.000Z'),
      updatedAt: new Date('2024-03-20T00:00:00.000Z')
    } as unknown as ISeriesResponse;

    mockSeriesArray = [
      mockSeries,
      {
        ...mockSeries,
        _id: new Types.ObjectId(),
        title: 'Test Series 2'
      }
    ];

    (Series.find as jest.Mock).mockClear();
    (Series.findById as jest.Mock).mockClear();
    (Series.create as jest.Mock).mockClear();
    (Series.findByIdAndUpdate as jest.Mock).mockClear();
    (Series.findByIdAndDelete as jest.Mock).mockClear();
    ((Series as unknown as IContentModel).findByTitle as jest.Mock).mockClear();
    ((Series as unknown as IContentModel).findByGenre as jest.Mock).mockClear();
  });

  describe('findAll', () => {
    it('should return all series with pagination', async () => {
      (Series.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue(mockSeriesArray)
          })
        })
      });

      const result = await seriesRepository.findAll(0, 10);

      expect(Series.find).toHaveBeenCalled();
      expect(result).toEqual(mockSeriesArray);
    });
  });

  describe('findById', () => {
    it('should return series by id', async () => {
      (Series.findById as jest.Mock).mockResolvedValue(mockSeries);

      const result = await seriesRepository.findById(mockSeries._id.toString());

      expect(Series.findById).toHaveBeenCalledWith(mockSeries._id.toString());
      expect(result).toEqual(mockSeries);
    });

    it('should return null if series not found', async () => {
      (Series.findById as jest.Mock).mockResolvedValue(null);

      const result = await seriesRepository.findById(mockSeries._id.toString());

      expect(Series.findById).toHaveBeenCalledWith(mockSeries._id.toString());
      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create a new series', async () => {
      const mockGenreReferenceAction = createMockGenreReference('Action', 1);
      const mockGenreReferenceDrama = createMockGenreReference('Drama', 2);
      const seriesData: ISeriesCreate = {
        title: 'Test Series',
        releaseDate: '2024-03-20T00:00:00.000Z',
        plot: 'Test plot',
        cast: ['Actor 1', 'Actor 2'],
        genre: [mockGenreReferenceAction, mockGenreReferenceDrama],
        rating: 8.5,
        poster: 'https://example.com/poster.jpg',
        url: 'https://example.com/series.mp4',
        totalSeasons: 1,
        totalEpisodes: 10
      };

      (Series.create as jest.Mock).mockResolvedValue(mockSeries);

      const result = await seriesRepository.create(seriesData);

      expect(Series.create).toHaveBeenCalledWith(seriesData);
      expect(result).toEqual(mockSeries);
    });

    it('should create multiple series', async () => {
      const [mockGenreReferenceComedy, mockGenreReferenceRomance, mockGenreReferenceAction, mockGenreReferenceDrama] = [
        createMockGenreReference('Comedy', 3),
        createMockGenreReference('Romance', 4),
        createMockGenreReference('Action', 1),
        createMockGenreReference('Drama', 2),
      ];
      const seriesDataArray: ISeriesCreate[] = [
        {
          title: 'Test Series 1',
          releaseDate: '2024-03-20T00:00:00.000Z',
          plot: 'Test plot 1',
          cast: ['Actor 1', 'Actor 2'],
          genre: [mockGenreReferenceAction, mockGenreReferenceDrama],
          rating: 8.5,
          poster: 'https://example.com/poster1.jpg',
          url: 'https://example.com/series1.mp4',
          totalSeasons: 1,
          totalEpisodes: 10
        },
        {
          title: 'Test Series 2',
          releaseDate: '2024-03-21T00:00:00.000Z',
          plot: 'Test plot 2',
          cast: ['Actor 3', 'Actor 4'],
          genre: [mockGenreReferenceComedy, mockGenreReferenceRomance],
          rating: 7.5,
          poster: 'https://example.com/poster2.jpg',
          url: 'https://example.com/series2.mp4',
          totalSeasons: 2,
          totalEpisodes: 20
        }
      ];

      (Series.create as jest.Mock).mockResolvedValue(mockSeriesArray);

      const result = await seriesRepository.create(seriesDataArray);

      expect(Series.create).toHaveBeenCalledWith(seriesDataArray);
      expect(result).toEqual(mockSeriesArray);
    });
  });

  describe('update', () => {
    it('should update series', async () => {
      const updateData: ISeriesUpdate = {
        title: 'Updated Series',
        plot: 'Updated plot'
      };

      (Series.findByIdAndUpdate as jest.Mock).mockResolvedValue({
        ...mockSeries,
        ...updateData
      });

      const result = await seriesRepository.update(mockSeries._id.toString(), updateData);

      expect(Series.findByIdAndUpdate).toHaveBeenCalledWith(
        mockSeries._id.toString(),
        { $set: updateData },
        { new: true, runValidators: true }
      );
      expect(result).toEqual({
        ...mockSeries,
        ...updateData
      });
    });

    it('should return null if series not found', async () => {
      const updateData: ISeriesUpdate = {
        title: 'Updated Series'
      };

      (Series.findByIdAndUpdate as jest.Mock).mockResolvedValue(null);

      const result = await seriesRepository.update(mockSeries._id.toString(), updateData);

      expect(Series.findByIdAndUpdate).toHaveBeenCalledWith(
        mockSeries._id.toString(),
        { $set: updateData },
        { new: true, runValidators: true }
      );
      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete series', async () => {
      (Series.findByIdAndDelete as jest.Mock).mockResolvedValue(mockSeries);

      const result = await seriesRepository.delete(mockSeries._id.toString());

      expect(Series.findByIdAndDelete).toHaveBeenCalledWith(mockSeries._id.toString());
      expect(result).toEqual(mockSeries);
    });

    it('should return null if series not found', async () => {
      (Series.findByIdAndDelete as jest.Mock).mockResolvedValue(null);

      const result = await seriesRepository.delete(mockSeries._id.toString());

      expect(Series.findByIdAndDelete).toHaveBeenCalledWith(mockSeries._id.toString());
      expect(result).toBeNull();
    });
  });

  describe('findByTitle', () => {
    it('should return series by title with pagination', async () => {
      (Series.findByTitle as jest.Mock).mockResolvedValue(mockSeriesArray);

      const result = await seriesRepository.findByTitle('Test', 0, 10);

      expect(Series.findByTitle).toHaveBeenCalledWith('Test', 0, 10);
      expect(result).toEqual(mockSeriesArray);
    });

    it('should return null if no series found', async () => {
      (Series.findByTitle as jest.Mock).mockResolvedValue(null);

      const result = await seriesRepository.findByTitle('Test', 0, 10);

      expect(Series.findByTitle).toHaveBeenCalledWith('Test', 0, 10);
      expect(result).toBeNull();
    });
  });

  describe('findByGenre', () => {
    it('should return series by genre with pagination', async () => {
      (Series.findByGenre as jest.Mock).mockResolvedValue(mockSeriesArray);

      const result = await seriesRepository.findByGenre('Action', 0, 10);

      expect(Series.findByGenre).toHaveBeenCalledWith('Action', 0, 10);
      expect(result).toEqual(mockSeriesArray);
    });

    it('should return null if no series found', async () => {
      (Series.findByGenre as jest.Mock).mockResolvedValue(null);

      const result = await seriesRepository.findByGenre('Action', 0, 10);

      expect(Series.findByGenre).toHaveBeenCalledWith('Action', 0, 10);
      expect(result).toBeNull();
    });
  });

  describe('findByTMDBId', () => {
    it('should return series by TMDB ID', async () => {
      (Series.find as jest.Mock).mockResolvedValue(mockSeriesArray);

      const result = await seriesRepository.findByTMDBId([12345, 67890]);

      expect(Series.find).toHaveBeenCalledWith({ tmdbId: { $in: [12345, 67890] } });
      expect(result).toEqual(mockSeriesArray);
    });

    it('should return null if no series found', async () => {
      (Series.find as jest.Mock).mockResolvedValue(null);

      const result = await seriesRepository.findByTMDBId([12345, 67890]);

      expect(Series.find).toHaveBeenCalledWith({ tmdbId: { $in: [12345, 67890] } });
      expect(result).toBeNull();
    });
  });
}); 