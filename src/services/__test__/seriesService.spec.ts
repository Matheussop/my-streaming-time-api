import { Types } from "mongoose";
import { ISeasonSummary, ISeriesCreate, ISeriesResponse, ISeriesUpdate } from "../../interfaces/series/series";
import { SeriesRepository } from "../../repositories/seriesRepository";
import { SeriesService } from "../seriesService";
import { TMDBService } from "../tmdbService";
import { StreamingServiceError } from "../../middleware/errorHandler";
import { ErrorMessages } from "../../constants/errorMessages";
import { generateValidObjectId } from "../../util/__tests__/generateValidObjectId";
import axios from "axios";
import { IGenreReference } from "../../interfaces/content";
import { SeasonRepository } from "../../repositories/seasonRepository";
import { ISeasonResponse } from "../../interfaces/series/season";

jest.mock('axios');
jest.mock('../tmdbService');

describe('SeriesService', () => {
  let seriesService: SeriesService;
  let mockSeriesRepository: jest.Mocked<SeriesRepository>;
  let mockSeasonRepository: jest.Mocked<SeasonRepository>;
  let mockTMDBService: jest.Mocked<TMDBService>;

  const mockGenreId = generateValidObjectId() as Types.ObjectId;
  const mockGenreReference: IGenreReference = {
    _id: mockGenreId,
    name: 'Action',
    id: 1,
  };

  const mockSeries: Partial<ISeriesResponse> = {
    _id: generateValidObjectId() as Types.ObjectId,
    title: 'Test Series',
    releaseDate: '2024-03-20',
    plot: 'Test plot',
    cast: ['Actor 1', 'Actor 2'],
    genre: [mockGenreReference],
    rating: 8.5,
    poster: 'http://example.com/poster.jpg',
    url: 'http://example.com/series.mp4',
    totalEpisodes: 10,
    totalSeasons: 2,
    tmdbId: 12345,
    videoUrl: 'youtube-key',
    createdAt: new Date('2024-03-20'),
    updatedAt: new Date('2024-03-20')
  };

  const mockTMDBData = {
    number_of_seasons: 2,
    number_of_episodes: 10,
    videos: {
      results: [
        { type: 'Trailer', key: 'youtube-key' }
      ]
    },
    seasons: [
      {
        season_number: 1,
        name: 'Season 1',
        overview: 'Season 1 plot',
        episode_count: 5,
        air_date: '2024-03-20',
        poster_path: '/season1.jpg'
      },
      {
        season_number: 2,
        name: 'Season 2',
        overview: 'Season 2 plot',
        episode_count: 5,
        air_date: '2024-03-20',
        poster_path: '/season2.jpg'
      }
    ]
  };

  beforeEach(() => {
    mockSeriesRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByTitle: jest.fn(),
      findByGenre: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findByTMDBId: jest.fn()
    } as unknown as jest.Mocked<SeriesRepository>;

    mockSeasonRepository = {
      create: jest.fn(),
      findBySeriesId: jest.fn()
    } as unknown as jest.Mocked<SeasonRepository>;

    mockTMDBService = {
      fetchDataFromTMDB: jest.fn(),
      updateData: jest.fn()
    } as unknown as jest.Mocked<TMDBService>;

    seriesService = new SeriesService(mockSeriesRepository, mockSeasonRepository, mockTMDBService);
  });

  describe('getSeries', () => {
    it('should return all series with pagination', async () => {
      mockSeriesRepository.findAll.mockResolvedValue([mockSeries as ISeriesResponse]);
      const result = await seriesService.getSeries(1, 10);
      expect(result).toEqual([mockSeries as ISeriesResponse]);
      expect(mockSeriesRepository.findAll).toHaveBeenCalledWith(1, 10);
    });
  });

  describe('getSeriesById', () => {
    it('should return a series by id', async () => {
      mockSeriesRepository.findById.mockResolvedValue(mockSeries as ISeriesResponse);
      const result = await seriesService.getSeriesById(mockSeries._id as unknown as string);
      expect(result).toEqual(mockSeries as ISeriesResponse);
      expect(mockSeriesRepository.findById).toHaveBeenCalledWith(mockSeries._id);
    });

    it('should throw an error if series is not found', async () => {
      mockSeriesRepository.findById.mockResolvedValue(null);
      await expect(seriesService.getSeriesById(mockSeries._id as unknown as string))
        .rejects.toThrow(new StreamingServiceError(ErrorMessages.SERIE_NOT_FOUND, 404));
      expect(mockSeriesRepository.findById).toHaveBeenCalledWith(mockSeries._id);
    });

    it('should update series with TMDB data if totalSeasons is missing', async () => {
      const seriesWithoutSeasons = { ...mockSeries, totalSeasons: 0 } as ISeriesResponse;
      mockSeriesRepository.findById.mockResolvedValue(seriesWithoutSeasons);
      mockTMDBService.fetchDataFromTMDB.mockResolvedValue(mockTMDBData);
      mockSeriesRepository.update.mockResolvedValue(mockSeries as ISeriesResponse);
      mockSeasonRepository.create.mockResolvedValue([{
        _id: generateValidObjectId(),
        seriesId: mockSeries._id,
        seasonNumber: 1,
        title: 'Season 1',
        plot: 'Season 1 plot',
        episodeCount: 5,
        releaseDate: '2024-03-20',
        poster: 'https://image.tmdb.org/t/p/original/season1.jpg'
      } as ISeasonResponse]);

      const result = await seriesService.getSeriesById(mockSeries._id as unknown as string);
      
      expect(result).toEqual(expect.objectContaining({
        totalSeasons: mockTMDBData.number_of_seasons,
        totalEpisodes: mockTMDBData.number_of_episodes,
        videoUrl: mockTMDBData.videos.results[0].key,
        seasonsSummary: expect.any(Array) as ISeasonSummary[]
      }));
      
      expect(mockTMDBService.fetchDataFromTMDB).toHaveBeenCalledWith(mockSeries.tmdbId, "series");
      expect(mockSeriesRepository.update).toHaveBeenCalledWith(
        mockSeries._id,
        expect.objectContaining({
          totalSeasons: mockTMDBData.number_of_seasons,
          totalEpisodes: mockTMDBData.number_of_episodes,
          videoUrl: mockTMDBData.videos.results[0].key
        })
      );
      expect(mockSeasonRepository.create).toHaveBeenCalled();
    });

    it('should be able to save new series without a trailer', async () => {
      const seriesWithoutTrailer = { ...mockSeries, videoUrl: '', totalSeasons: 0 } as ISeriesResponse;
      mockSeriesRepository.findById.mockResolvedValue(seriesWithoutTrailer);
      const mockTMDBDataWithoutTrailer = { ...mockTMDBData, 
        seasons: [{
          ...mockTMDBData.seasons.slice(0, 1),
          plot: null,
          episode_count: null,
          release_date: null
        }], 
        videos: { results: [{}]}
      };
      mockTMDBService.fetchDataFromTMDB.mockResolvedValue(mockTMDBDataWithoutTrailer);
      mockSeriesRepository.update.mockResolvedValue(seriesWithoutTrailer);
      mockSeasonRepository.create.mockResolvedValue({
        _id: generateValidObjectId(),
        seriesId: mockSeries._id,
        seasonNumber: 1,
        title: 'Season 1',
        plot: 'Season 1 plot',
        releaseDate: '2024-03-20',
        poster: 'https://image.tmdb.org/t/p/original/season1.jpg',
       
      } as ISeasonResponse);
      
      const result = await seriesService.getSeriesById(mockSeries._id as unknown as string);
      expect(result).toEqual(seriesWithoutTrailer);
      expect(mockSeriesRepository.update).toHaveBeenCalledWith(
        mockSeries._id,
        expect.objectContaining({
          videoUrl: ''
        })
      );
    })
  });

  describe('getSeriesByTitle', () => {
    it('should return series by title', async () => {
      mockSeriesRepository.findByTitle.mockResolvedValue([mockSeries as ISeriesResponse]);
      const result = await seriesService.getSeriesByTitle('Test Series', 1, 10);
      expect(result).toEqual([mockSeries as ISeriesResponse]);
      expect(mockSeriesRepository.findByTitle).toHaveBeenCalledWith('Test Series', 1, 10);
    });

    it('should return empty array if no series are found', async () => {
      mockSeriesRepository.findByTitle.mockResolvedValue([]);
      const result = await seriesService.getSeriesByTitle('Test Series', 1, 10);
      expect(result).toEqual([]);
    });
  });

  describe('getSeriesByGenre', () => {
    it('should return series by genre', async () => {
      mockSeriesRepository.findByGenre.mockResolvedValue([mockSeries as ISeriesResponse]);
      const result = await seriesService.getSeriesByGenre('Action', 1, 10);
      expect(result).toEqual([mockSeries as ISeriesResponse]);
      expect(mockSeriesRepository.findByGenre).toHaveBeenCalledWith('Action', 1, 10);
    });

    it('should return empty array if no series are found', async () => {
      mockSeriesRepository.findByGenre.mockResolvedValue([]);
      const result = await seriesService.getSeriesByGenre('Action', 1, 10);
      expect(result).toEqual([]);
    });
  });

  describe('createSeries', () => {
    it('should create a series with valid data', async () => {
      const seriesData = {
        title: 'Test Series',
        releaseDate: '2024-03-20',
        plot: 'Test plot',
        cast: ['Actor 1', 'Actor 2'],
        genre: [1, 2],
        rating: 8.5,
        poster: 'http://example.com/poster.jpg',
        url: 'http://example.com/series.mp4',
        totalEpisodes: 10,
        totalSeasons: 2
      };

      mockSeriesRepository.findByTitle.mockResolvedValue([]);
      mockSeriesRepository.create.mockResolvedValue(mockSeries as ISeriesResponse);

      const result = await seriesService.createSerie(seriesData);

      expect(result).toEqual(mockSeries as ISeriesResponse);
      expect(mockSeriesRepository.create).toHaveBeenCalledWith(expect.objectContaining({
        title: seriesData.title.trim(),
        releaseDate: seriesData.releaseDate,
        plot: seriesData.plot,
        cast: seriesData.cast,
        genre: seriesData.genre,
        rating: seriesData.rating,
        poster: seriesData.poster,
        url: seriesData.url,
        totalEpisodes: seriesData.totalEpisodes,
        totalSeasons: seriesData.totalSeasons
      }));
    });

    it('should create a series with empty release date', async () => {
      const seriesData = {
        title: 'Test Series',
        releaseDate: '',
        plot: 'Test plot',
        cast: ['Actor 1', 'Actor 2'],
        genre: [1, 2],
        rating: 8.5,
        totalEpisodes: 10,
        totalSeasons: 2
      };

      mockSeriesRepository.findByTitle.mockResolvedValue([]);
      mockSeriesRepository.create.mockResolvedValue(mockSeries as ISeriesResponse);

      const result = await seriesService.createSerie(seriesData);

      expect(result).toEqual(mockSeries as ISeriesResponse);
      expect(mockSeriesRepository.create).toHaveBeenCalledWith(expect.objectContaining({
        ...seriesData,
        releaseDate: 'Without release date',
      }));
    });

    it('should create a series with poster and url as null', async () => {
      const seriesData = {
        title: 'Test Series',
        releaseDate: '2024-03-20',
        plot: 'Test plot',
        cast: ['Actor 1', 'Actor 2'],
        genre: [1, 2],
        rating: 8.5,
        totalEpisodes: 10,
        totalSeasons: 2,
        poster: '',
        url: ''
      };

      mockSeriesRepository.findByTitle.mockResolvedValue([]);
      mockSeriesRepository.create.mockResolvedValue(mockSeries as ISeriesResponse);

      const result = await seriesService.createSerie(seriesData as unknown as ISeriesCreate);

      expect(result).toEqual(mockSeries as ISeriesResponse);
      expect(mockSeriesRepository.create).toHaveBeenCalledWith(expect.objectContaining({
        ...seriesData,
        poster: '',
        url: ''
      }));
    });

  });

  describe('updateSeries', () => {
    it('should update a series with valid data', async () => {
      const updateData = {
        title: 'Updated Series',
        releaseDate: '2024-03-20',
        plot: 'Updated plot',
        cast: ['Actor 1', 'Actor 2'],
        genre: [mockGenreReference],
        url: 'http://example.com/series.mp4',
        rating: 9.0,
        totalEpisodes: 12,
        totalSeasons: 3,
        poster: 'http://example.com/poster.jpg',
        status: 'Ended',
        tmdbId: 12345,
        seasonsSummary: [] as ISeasonSummary[]
      };

      mockSeriesRepository.findById.mockResolvedValue(mockSeries as ISeriesResponse);
      mockSeriesRepository.findByTitle.mockResolvedValue([]);
      mockSeriesRepository.update.mockResolvedValue({ ...mockSeries, ...updateData } as ISeriesResponse);

      const result = await seriesService.updateSerie(mockSeries._id as unknown as string, updateData);

      expect(result).toEqual({ ...mockSeries, ...updateData } as ISeriesResponse);
      expect(mockSeriesRepository.update).toHaveBeenCalledWith(
        mockSeries._id,
        expect.objectContaining(updateData)
      );
    });

    it('should update a series with empty release date', async () => {
      const updateData = {
        title: 'Updated Series',
        releaseDate: '',
        plot: 'Updated plot',
        cast: ['Actor 1', 'Actor 2'],
        genre: [mockGenreReference],
        url: 'http://example.com/series.mp4',
        rating: 9.0,
        totalEpisodes: 12,
        totalSeasons: 3
      };
      const mockSeriesWithEmptyReleaseDate = { ...mockSeries, releaseDate: '' } as ISeriesResponse;

      mockSeriesRepository.findById.mockResolvedValue(mockSeriesWithEmptyReleaseDate);
      mockSeriesRepository.findByTitle.mockResolvedValue([]);
      mockSeriesRepository.update.mockResolvedValue({ ...mockSeriesWithEmptyReleaseDate, ...updateData } as ISeriesResponse);

      const result = await seriesService.updateSerie(mockSeries._id as unknown as string, updateData);

      expect(result).toEqual({ ...mockSeries, ...updateData } as ISeriesResponse);
      expect(mockSeriesRepository.update).toHaveBeenCalledWith(
        mockSeries._id,
        expect.objectContaining({
          ...updateData,
          releaseDate: 'Without release date'
        })
      );
    });

    it('should throw an error if series to update is not found', async () => {
      const updateData = {
        title: 'Updated Series',
        rating: 9.0
      };

      mockSeriesRepository.findById.mockResolvedValue(null);

      await expect(seriesService.updateSerie(mockSeries._id as unknown as string, updateData))
        .rejects.toThrow(new StreamingServiceError(ErrorMessages.SERIE_NOT_FOUND, 404));
    });

    it('should throw an error if series with same title exists', async () => {
      const updateData = {
        title: 'Updated Series',
        rating: 9.0
      };

      mockSeriesRepository.findById.mockResolvedValue(mockSeries as ISeriesResponse);
      mockSeriesRepository.findByTitle.mockResolvedValue([mockSeries as ISeriesResponse]);

      await expect(seriesService.updateSerie(mockSeries._id as unknown as string, updateData))
        .rejects.toThrow(new StreamingServiceError(ErrorMessages.SERIES_WITH_TITLE_EXISTS, 400));
    });

    it('should throw an error if series with invalid rating', async () => {
      const updateData = {
        rating: 10.5
      };
      
      mockSeriesRepository.findById.mockResolvedValue(mockSeries as ISeriesResponse);
      mockSeriesRepository.findByTitle.mockResolvedValue([mockSeries as ISeriesResponse]);

      await expect(seriesService.updateSerie(mockSeries._id as unknown as string, updateData))
        .rejects.toThrow(new StreamingServiceError(ErrorMessages.SERIES_RATING_INVALID, 400));
    });

    it('should throw an error if series with invalid release date', async () => {
      const updateData = {
        releaseDate: 'invalid-date'
      };
      
      mockSeriesRepository.findById.mockResolvedValue(mockSeries as ISeriesResponse);
      mockSeriesRepository.findByTitle.mockResolvedValue([mockSeries as ISeriesResponse]);

      await expect(seriesService.updateSerie(mockSeries._id as unknown as string, updateData))
        .rejects.toThrow(new StreamingServiceError(ErrorMessages.SERIES_RELEASE_DATE_INVALID, 400));
    });

    it('should throw an error if series with cast parameter is not an array', async () => {
      const updateData = {
        cast: 'not-an-array'
      } as unknown as ISeriesUpdate;
      
      mockSeriesRepository.findById.mockResolvedValue(mockSeries as ISeriesResponse);
      mockSeriesRepository.findByTitle.mockResolvedValue([mockSeries as ISeriesResponse]);

      await expect(seriesService.updateSerie(mockSeries._id as unknown as string, updateData))
        .rejects.toThrow(new StreamingServiceError(ErrorMessages.SERIES_CAST_INVALID, 400));
    });
  });

  describe('deleteSeries', () => {
    it('should delete a series', async () => {
      mockSeriesRepository.delete.mockResolvedValue(mockSeries as ISeriesResponse);
      const result = await seriesService.deleteSerie(mockSeries._id as unknown as string);
      expect(result).toEqual(mockSeries as ISeriesResponse);
      expect(mockSeriesRepository.delete).toHaveBeenCalledWith(mockSeries._id);
    });

    it('should throw an error if series to delete is not found', async () => {
      mockSeriesRepository.delete.mockResolvedValue(null);
      await expect(seriesService.deleteSerie(mockSeries._id as unknown as string))
        .rejects.toThrow(new StreamingServiceError(ErrorMessages.SERIE_NOT_FOUND, 404));
    });
  });

  describe('fetchAndSaveExternalSeries', () => {
    const mockTMDBResponse = {
      data: {
        results: [
          {
            ...mockTMDBData,
            id: 12345,
            name: 'Test Series',
            first_air_date: '2024-03-20',
            overview: 'Test plot',
            genre_ids: [1, 2],
            vote_average: 8.5,
            backdrop_path: '/series.jpg',
            poster_path: '/poster.jpg',
          }
        ]
      }
    };
    it('should fetch and save new series from TMDB', async () => {
      (axios.get as jest.Mock).mockResolvedValue(mockTMDBResponse);
      mockSeriesRepository.findByTitle.mockResolvedValue([]);
      mockSeriesRepository.create.mockResolvedValue(mockSeries as ISeriesResponse);

      const result = await seriesService.fetchAndSaveExternalSeries();

      expect(result).toEqual(expect.objectContaining({
        totalSeasons: mockTMDBResponse.data.results[0].number_of_seasons,
        totalEpisodes: mockTMDBResponse.data.results[0].number_of_episodes,
        videoUrl: mockTMDBResponse.data.results[0].videos.results[0].key,
      }));
      expect(mockSeriesRepository.create).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            title: 'Test Series',
            tmdbId: 12345,
            releaseDate: '2024-03-20',
            plot: 'Test plot',
            genre: [1, 2],
            rating: 8.5,
            poster: 'https://image.tmdb.org/t/p/original/series.jpg',
            url: 'https://image.tmdb.org/t/p/w500/poster.jpg',
            totalSeasons: 2,
            totalEpisodes: 10
          })
        ])
      );
    });

    it('should not save series that already exist', async () => {
      (axios.get as jest.Mock).mockResolvedValue(mockTMDBResponse);
      mockSeriesRepository.findByTitle.mockResolvedValue([mockSeries as ISeriesResponse]);

      const result = await seriesService.fetchAndSaveExternalSeries();

      expect(result).toBeNull();
      expect(mockSeriesRepository.create).not.toHaveBeenCalled();
    });

    it('should be able to save new series without number of seasons and episodes', async () => {
      const mockTMDBResponseWithoutSeasonsAndEpisodes = {
        data: {
          ...mockTMDBResponse.data,
          results: [
            { ...mockTMDBResponse.data.results[0], number_of_seasons: null, number_of_episodes: null }
          ]
        }
      };
      (axios.get as jest.Mock).mockResolvedValue(mockTMDBResponseWithoutSeasonsAndEpisodes);
      mockSeriesRepository.findByTitle.mockResolvedValue([]);
      mockSeriesRepository.create.mockResolvedValue(mockSeries as ISeriesResponse);

      const result = await seriesService.fetchAndSaveExternalSeries();
      expect(result).toEqual(expect.objectContaining({
        totalSeasons: mockTMDBResponse.data.results[0].number_of_seasons,
        totalEpisodes: mockTMDBResponse.data.results[0].number_of_episodes,
        videoUrl: mockTMDBResponse.data.results[0].videos.results[0].key,
      }));
      expect(mockSeriesRepository.create).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            title: 'Test Series',
            tmdbId: 12345,
            releaseDate: '2024-03-20',
            plot: 'Test plot',
            genre: [1, 2],
            rating: 8.5,
            poster: 'https://image.tmdb.org/t/p/original/series.jpg',
            url: 'https://image.tmdb.org/t/p/w500/poster.jpg',
            totalSeasons: 0,
            totalEpisodes: 0
          })
        ])
      );
    
    });
  });

  describe('getSeriesByTMDBId', () => {
    it('should return a series by TMDB id', async () => {
      mockSeriesRepository.findByTMDBId.mockResolvedValue([mockSeries as ISeriesResponse]);
      const result = await seriesService.getSeriesByTMDBId([12345]);
      expect(result).toEqual([mockSeries as ISeriesResponse]);
    });
  });

  describe('createManySeries', () => {
    it('should create many series with skipCheckTitle false', async () => {
      const mockSeriesArray = [mockSeries, mockSeries] as ISeriesResponse[];

      mockSeriesRepository.findByTitle.mockResolvedValue([mockSeries as ISeriesResponse]);
      mockSeriesRepository.create.mockResolvedValue(mockSeriesArray);
      const result = await seriesService.createManySeries(mockSeriesArray, false);
      expect(result).toEqual(mockSeriesArray);
    });

    it('should create many series with skipCheckTitle true', async () => {
      const mockSeriesArray = [mockSeries ,mockSeries ] as ISeriesResponse[];

      mockSeriesRepository.findByTitle.mockResolvedValue([]);
      mockSeriesRepository.create.mockResolvedValue(mockSeriesArray);
      const result = await seriesService.createManySeries(mockSeriesArray, true);
      expect(result).toEqual(mockSeriesArray);
    });
  });
}); 