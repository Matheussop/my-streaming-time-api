import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';
import { HttpStatus } from '../../constants/httpStatus';
import { Messages } from '../../constants/messages';
import { Types } from 'mongoose';
import { generateValidObjectId } from '../../util/__tests__/generateValidObjectId';

const mockImplementations = {
  getSeriesByTitle: jest.fn(),
  createSeries: jest.fn(),
  getSeries: jest.fn(),
  getSerieById: jest.fn(),
  updateSerie: jest.fn(),
  getSeriesByGenre: jest.fn(),
  deleteSerie: jest.fn(),
  findOrAddSerie: jest.fn(),
};

jest.mock('../../controllers/seriesController', () => ({
  SeriesController: jest.fn().mockImplementation(() => mockImplementations),
}));

jest.mock('../../middleware/validationMiddleware', () => ({
  validate: jest.fn().mockImplementation(() => (req: Request, res: Response, next: NextFunction) => next()),
}));

jest.mock('../../middleware/objectIdValidationMiddleware', () => ({
  validateObjectId: jest.fn().mockImplementation(() => (req: Request, res: Response, next: NextFunction) => {
    req.validatedIds = req.validatedIds || {};
    const id = req.params.id || req.params._id || '507f1f77bcf86cd799439011';
    req.validatedIds.id = new Types.ObjectId(id);
    next();
  }),
}));

import router from '../seriesRoutes';

describe('Series Routes', () => {
  let app: express.Application;
  let mockId: string | Types.ObjectId;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/series', router);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockId = generateValidObjectId();
  });

  describe('GET /title', () => {
    it('should return series by title', async () => {
      const mockSeries = [{ _id: mockId.toString(), title: 'Test Series', rating: 8.5 }];

      mockImplementations.getSeriesByTitle.mockImplementation((req: Request, res: Response) => {
        res.status(HttpStatus.OK).json(mockSeries);
      });

      const response = await request(app)
        .get('/series/title')
        .query({ title: 'Test Series' })
        .expect(HttpStatus.OK);

      expect(response.body).toEqual(mockSeries);
    });
  });

  describe('GET /', () => {
    it('should return list of series with pagination', async () => {
      const mockSeriesList = {
        data: [
          { _id: mockId.toString(), title: 'Series 1' },
          { _id: generateValidObjectId().toString(), title: 'Series 2' },
        ],
        total: 2,
        page: 1,
        limit: 10,
      };

      mockImplementations.getSeries.mockImplementation((req: Request, res: Response) => {
        res.status(HttpStatus.OK).json(mockSeriesList);
      });

      const response = await request(app)
        .get('/series')
        .query({ page: 1, limit: 10 })
        .expect(HttpStatus.OK);

      expect(response.body).toEqual(mockSeriesList);
    });
  });

  describe('POST /', () => {
    it('should create a new series', async () => {
      const newSeries = {
        title: 'New Series',
        plot: 'Test plot',
        cast: ['Actor 1', 'Actor 2'],
        rating: 9.0,
        url: 'http://series.com',
        releaseDate: '2024-01-01',
        genre: [{ id: 1, name: 'Action' }],
        totalEpisodes: 10,
        totalSeasons: 2,
      };

      mockImplementations.createSeries.mockImplementation((req: Request, res: Response) => {
        res.status(HttpStatus.CREATED).json({ _id: mockId.toString(), ...newSeries });
      });

      const response = await request(app)
        .post('/series')
        .send(newSeries)
        .expect(HttpStatus.CREATED);

      expect(response.body).toEqual({ _id: mockId.toString(), ...newSeries });
    });
  });

  describe('GET /:id', () => {
    it('should return a series by id', async () => {
      const mockSeries = {
        _id: mockId.toString(),
        title: 'Test Series',
        rating: 8.5,
      };

      mockImplementations.getSerieById.mockImplementation((req: Request, res: Response) => {
        res.status(HttpStatus.OK).json(mockSeries);
      });

      const response = await request(app)
        .get(`/series/${mockId}`)
        .expect(HttpStatus.OK);

      expect(response.body).toEqual(mockSeries);
    });
  });

  describe('POST /byGenre', () => {
    it('should return series by genre', async () => {
      const mockSeries = [{ 
        _id: mockId.toString(), 
        genre: [{id: 1, name: 'Action', _id: generateValidObjectId().toString() }], 
        rating: 8.5 
      }];

      mockImplementations.getSeriesByGenre.mockImplementation((req: Request, res: Response) => {
        res.status(HttpStatus.OK).json(mockSeries);
      });

      const response = await request(app)
        .post('/series/byGenre')
        .send({ genre: 'Action' })
        .expect(HttpStatus.OK);

      expect(response.body).toEqual(mockSeries);
    });
  });

  describe('PUT /:id', () => {
    it('should update a series', async () => {
      const updateData = {
        title: 'Updated Series',
        plot: 'Updated plot',
        cast: ['Actor 1', 'Actor 2'],
        rating: 9.5,
        url: 'http://updated-series.com',
        releaseDate: '2024-02-01',
      };

      mockImplementations.updateSerie.mockImplementation((req: Request, res: Response) => {
        res.status(HttpStatus.OK).json({ _id: mockId.toString(), ...updateData });
      });

      const response = await request(app)
        .put(`/series/${mockId}`)
        .send(updateData)
        .expect(HttpStatus.OK);

      expect(response.body).toEqual({ _id: mockId.toString(), ...updateData });
    });
  });

  describe('DELETE /:id', () => {
    it('should delete a series', async () => {
      mockImplementations.deleteSerie.mockImplementation((req: Request, res: Response) => {
        res.status(HttpStatus.OK).json({ message: Messages.SERIE_DELETED_SUCCESSFULLY });
      });

      const response = await request(app)
        .delete(`/series/${mockId}`)
        .expect(HttpStatus.OK);

      expect(response.body).toEqual({ message: Messages.SERIE_DELETED_SUCCESSFULLY });
    });
  });

  describe('POST /findOrAddSerie', () => {
    it('should find or add a series', async () => {
      const seriesData = {
        title: 'Series to Find',
        page: 1,
        limit: 10,
      };

      mockImplementations.findOrAddSerie.mockImplementation((req: Request, res: Response) => {
        res.status(HttpStatus.OK).json({ _id: mockId.toString(), title: 'Series to Find' });
      });

      const response = await request(app)
        .post('/series/findOrAddSerie')
        .send(seriesData)
        .expect(HttpStatus.OK);

      expect(response.body).toEqual({ _id: mockId.toString(), title: 'Series to Find' });
    });
  });
});
