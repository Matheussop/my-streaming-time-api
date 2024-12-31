import request from 'supertest';
import express from 'express';
import { HttpStatus } from '../../constants/httpStatus';
import { Messages } from '../../constants/messages';
import * as validateModule from '../../util/validate';

const mockImplementations = {
  getUserStreamingHistory: jest.fn(),
  addStreamingToHistory: jest.fn(),
  removeStreamingFromHistory: jest.fn(),
  calculateTotalWatchTime: jest.fn(),
};

jest.mock('../../controllers/userStreamingHistoryController', () => ({
  UserStreamingHistoryController: jest.fn().mockImplementation(() => mockImplementations)
}));

jest.mock('../../services/userStreamingHistoryService');
jest.mock('../../util/validate', () => ({
  validateRequest: jest.fn(),
}));
import router from '../userStreamingHistoryRoutes';

describe('Streaming History Routes', () => {
  let app: express.Application;
  let mockValidateRequest: jest.Mock;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/streaming-history', router);
    mockValidateRequest = validateModule.validateRequest as jest.Mock;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockValidateRequest.mockImplementation((req, res, next) => next());
  });

  describe('GET /:userId', () => {
    it('should return 200 and streaming history when user exists', async () => {
      const mockHistory = [
        { streamingId: '1', title: 'Movie 1', durationInMinutes: 120 },
        { streamingId: '2', title: 'Movie 2', durationInMinutes: 90 }
      ];

      mockImplementations.getUserStreamingHistory.mockImplementation((req, res) => {
        res.status(HttpStatus.ACCEPTED).json(mockHistory);
      });

      const response = await request(app)
        .get('/streaming-history/user123')
        .expect(HttpStatus.ACCEPTED);

      expect(response.body).toEqual(mockHistory);
    });
  });

  describe('POST /', () => {
    const validStreamingEntry = {
      userId: 'user123',
      streamingId: 'stream123',
      title: 'Test Movie',
      durationInMinutes: 120
    };

    it('should return 201 when streaming entry is added successfully', async () => {
      mockImplementations.addStreamingToHistory
        .mockImplementation((req, res) => {
          res.status(HttpStatus.CREATED).json({ message: Messages.STREAMING_ADDED_SUCCESSFULLY });
        });

      await request(app)
        .post('/streaming-history')
        .send(validStreamingEntry)
        .expect(HttpStatus.CREATED);
    });
  });

  describe('DELETE /', () => {
    const validDeleteRequest = {
      userId: 'user123',
      streamingId: 'stream123'
    };

    it('should return 200 when streaming entry is removed successfully', async () => {
      mockImplementations.removeStreamingFromHistory
        .mockImplementation((req, res) => {
          res.status(HttpStatus.ACCEPTED).json({ message: Messages.STREAMING_REMOVED_SUCCESSFULLY });
        });

      await request(app)
        .delete('/streaming-history')
        .send(validDeleteRequest)
        .expect(HttpStatus.ACCEPTED);
    });
  });

  describe('GET /:userId/total-watch-time', () => {
    it('should return 200 and total watch time when user exists', async () => {
      const mockTotalTime = { totalWatchTimeMinutes: 210 };

      mockImplementations.calculateTotalWatchTime
        .mockImplementation((req, res) => {
          res.status(HttpStatus.ACCEPTED).json(mockTotalTime);
        });

      const response = await request(app)
        .get('/streaming-history/user123/total-watch-time')
        .expect(HttpStatus.ACCEPTED);

      expect(response.body).toEqual(mockTotalTime);
    });
  });
});