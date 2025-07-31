import { Request, Response } from 'express';
import throttlingMiddleware, { getLastRequestTime, setLastRequestTime } from '../throttlingMiddleware';
import LastRequestTime from '../../models/lastRequestTimeModel';
import { SeriesService } from '../../services/seriesService';
import { MovieService } from '../../services/movieService';
import { StreamingServiceError } from '../errorHandler';


let mockFetchAndSaveExternalSeries = jest.fn().mockResolvedValue(undefined);
// Mock dos serviços
jest.mock('../../services/seriesService', () => ({
  SeriesService: jest.fn().mockImplementation(() => ({
    fetchAndSaveExternalSeries: mockFetchAndSaveExternalSeries,
  })),
}));

let mockFetchAndSaveExternalMovies = jest.fn().mockResolvedValue(undefined);
jest.mock('../../services/movieService', () => ({
  MovieService: jest.fn().mockImplementation(() => ({
    fetchAndSaveExternalMovies: mockFetchAndSaveExternalMovies,
  })),
}));

// Mock do modelo LastRequestTime
jest.mock('../../models/lastRequestTimeModel', () => ({
  findOne: jest.fn(),
  updateOne: jest.fn().mockResolvedValue({}),
}));

describe('Throttling Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;
  let originalConsoleLog: any;
  let originalConsoleError: any;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();

    originalConsoleLog = console.log;
    originalConsoleError = console.error;
    console.log = jest.fn();
    console.error = jest.fn();

    jest.clearAllMocks();
    
    throttlingMiddleware.setLastRequestTime(0);
  });

  afterEach(() => {
    // Restaurar console.log e console.error
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
  });

  describe('throttlingMiddleware function', () => {
    it('should call next() without fetching data if not enough time has passed', async () => {
      const now = Date.now();
      throttlingMiddleware.setLastRequestTime(now - 1000); // apenas 1 segundo atrás

      await throttlingMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockFetchAndSaveExternalSeries).not.toHaveBeenCalled();

      expect(mockFetchAndSaveExternalMovies).not.toHaveBeenCalled();

      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('should fetch data if enough time has passed', async () => {
      const now = Date.now();
      // Define o último tempo de requisição para 8 dias atrás (mais que o requestInterval de 7 dias)
      const eightDaysAgo = now - (8 * 24 * 60 * 60 * 1000);
      throttlingMiddleware.setLastRequestTime(eightDaysAgo);

      await throttlingMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(SeriesService).toHaveBeenCalled();
      expect(mockFetchAndSaveExternalSeries).toHaveBeenCalledTimes(1);

      expect(MovieService).toHaveBeenCalled();
      expect(mockFetchAndSaveExternalMovies).toHaveBeenCalledTimes(1);

      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('should not fetch data if already fetching', async () => {
      const now = Date.now();
      const eightDaysAgo = now - (8 * 24 * 60 * 60 * 1000);
      throttlingMiddleware.setLastRequestTime(eightDaysAgo);

      const firstPromise = throttlingMiddleware(mockRequest as Request, mockResponse as Response, mockNext);
      
      const secondPromise = throttlingMiddleware(mockRequest as Request, mockResponse as Response, mockNext);
      
      await Promise.all([firstPromise, secondPromise]);

      expect(mockFetchAndSaveExternalSeries).toHaveBeenCalledTimes(1);

      expect(mockFetchAndSaveExternalMovies).toHaveBeenCalledTimes(1);

      expect(mockNext).toHaveBeenCalledTimes(2);
    });

    it('should update lastRequestTime after fetching data', async () => {
      const now = Date.now();
      const eightDaysAgo = now - (8 * 24 * 60 * 60 * 1000);
      throttlingMiddleware.setLastRequestTime(eightDaysAgo);

      const mockNow = Date.now();
      const originalDateNow = Date.now;
      Date.now = jest.fn(() => mockNow);

      await throttlingMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      Date.now = originalDateNow;

      expect(throttlingMiddleware.getLastRequestTime()).toBe(mockNow);
    });

    it('should handle errors during data fetching', async () => {
      const now = Date.now();
      const eightDaysAgo = now - (8 * 24 * 60 * 60 * 1000);
      throttlingMiddleware.setLastRequestTime(eightDaysAgo);

      mockFetchAndSaveExternalSeries.mockRejectedValueOnce(new StreamingServiceError('Test error', 500));

      await throttlingMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(console.error).toHaveBeenCalled();
      
      expect(mockNext).toHaveBeenCalledTimes(1);
    });
  });

  describe('getLastRequestTime function', () => {
    it('should return value from database when record exists', async () => {
      const mockTimestamp = 1234567890;
      (LastRequestTime.findOne as jest.Mock).mockResolvedValueOnce({ lastRequestTime: mockTimestamp });

      const result = await getLastRequestTime();
      
      expect(LastRequestTime.findOne).toHaveBeenCalled();
      expect(result).toBe(mockTimestamp);
    });

    it('should return 0 when no record exists', async () => {
      (LastRequestTime.findOne as jest.Mock).mockResolvedValueOnce(null);

      const result = await getLastRequestTime();
      
      expect(LastRequestTime.findOne).toHaveBeenCalled();
      expect(result).toBe(0);
    });
  });

  describe('setLastRequestTime function', () => {
    it('should update or create lastRequestTime record', async () => {
      const mockTimestamp = 1234567890;
      
      await setLastRequestTime(mockTimestamp);
      
      expect(LastRequestTime.updateOne).toHaveBeenCalledWith(
        {},
        { lastRequestTime: mockTimestamp },
        { upsert: true }
      );
    });

    it('should log when setting lastRequestTime', async () => {
      const mockTimestamp = 1234567890;
      
      await setLastRequestTime(mockTimestamp);
      
      expect(console.log).toHaveBeenCalledWith('Setting lastRequestTime:', mockTimestamp);
      expect(console.log).toHaveBeenCalledWith('lastRequestTime set successfully');
    });
  });

  describe('Getter and setter methods', () => {
    it('should get and set lastRequestTime', () => {
      const mockTimestamp = 1234567890;
      
      throttlingMiddleware.setLastRequestTime(mockTimestamp);
      const result = throttlingMiddleware.getLastRequestTime();
      
      expect(result).toBe(mockTimestamp);
    });
  });
}); 