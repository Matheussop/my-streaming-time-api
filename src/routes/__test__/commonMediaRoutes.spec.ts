import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';
import { HttpStatus } from '../../constants/httpStatus';
import { Types } from 'mongoose';
import { generateValidObjectId } from '../../util/__tests__/generateValidObjectId';

const mockImplementations = {
  getCommonMediaList: jest.fn(),
  getCommonMediaByGenre: jest.fn(),
};

jest.mock('../../controllers/commonMediaController', () => ({
  CommonMediaController: jest.fn().mockImplementation(() => mockImplementations),
}));

jest.mock('../../middleware/validationMiddleware', () => ({
  validate: jest.fn().mockImplementation(() => (req: Request, res: Response, next: NextFunction) => next()),
}));

import router from '../commonMediaRoutes';


describe('Common Media Routes', () => {
  let app: express.Application;
  let mockId: string | Types.ObjectId;
  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/commonMedia', router);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockId = generateValidObjectId();
  });

  describe('GET /', () => {
    it('should return a list of common media with pagination', async () => {
      const mockMediaList = [
        { 
          _id: mockId, 
          title: 'Media 1',
          plot: 'Test plot 1',
          cast: ['Actor 1', 'Actor 2'],
          rating: 8.5,
          releaseDate: '2021-01-01',
          poster: 'poster1.jpg',
          url: 'http://media1.com',
          contentType: 'movie'
        },
        { 
          _id: generateValidObjectId(), 
          title: 'Media 2',
          plot: 'Test plot 2',
          cast: ['Actor 3', 'Actor 4'],
          rating: 7.5,
          releaseDate: '2022-01-01',
          poster: 'poster2.jpg',
          url: 'http://media2.com',
          contentType: 'series'
        },
      ];

      mockImplementations.getCommonMediaList.mockImplementation((req: Request, res: Response) => {
        res.status(HttpStatus.OK).json(mockMediaList);
      });

      const response = await request(app)
        .get('/commonMedia')
        .query({ page: 1, limit: 10 })
        .expect(HttpStatus.OK);

      expect(response.body).toEqual(mockMediaList);
    });
  });

  describe('POST /byGenre', () => {
    it('should return common media filtered by genre', async () => {
      const mockMediaByGenre = [
        { 
          _id: mockId, 
          title: 'Media 1',
          plot: 'Test plot 1',
          cast: ['Actor 1', 'Actor 2'],
          rating: 8.5,
          releaseDate: '2021-01-01',
          poster: 'poster1.jpg',
          url: 'http://media1.com',
          contentType: 'movie',
          genre: [{id: 1, name: 'Action', _id: 'genre1' }]
        }
      ];

      mockImplementations.getCommonMediaByGenre.mockImplementation((req: Request, res: Response) => {
        res.status(HttpStatus.OK).json(mockMediaByGenre);
      });

      const response = await request(app)
        .post('/commonMedia/byGenre')
        .send({ genre: 'Action' })
        .expect(HttpStatus.OK);

      expect(response.body).toEqual(mockMediaByGenre);
    });

    it('should return common media filtered by genre with pagination', async () => {
      const mockMediaByGenre = [
        { 
          _id: mockId, 
          title: 'Media 1',
          plot: 'Test plot 1',
          cast: ['Actor 1', 'Actor 2'],
          rating: 8.5,
          releaseDate: '2021-01-01',
          poster: 'poster1.jpg',
          url: 'http://media1.com',
          contentType: 'movie',
          genre: [{id: 1, name: 'Action', _id: 'genre1' }]
        }
      ];

      mockImplementations.getCommonMediaByGenre.mockImplementation((req: Request, res: Response) => {
        res.status(HttpStatus.OK).json(mockMediaByGenre);
      });

      const response = await request(app)
        .post('/commonMedia/byGenre')
        .send({ genre: 'Action' })
        .query({ page: 1, limit: 10 })
        .expect(HttpStatus.OK);

      expect(response.body).toEqual(mockMediaByGenre);
    });
  });
}); 