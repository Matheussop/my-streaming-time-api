import request from 'supertest';
import express from 'express';
import { HttpStatus } from '../../constants/httpStatus';
import { Messages } from '../../constants/messages';
import * as validateModule from '../../util/validate';

const mockImplementations = {
  getSeriesByTitle: jest.fn(),
  createSeries: jest.fn(),
  getSerieById: jest.fn(),
  updateSerie: jest.fn(),
  deleteSerie: jest.fn(),
  findOrAddSerie: jest.fn(),
};

jest.mock('../../controllers/seriesController', () => ({
  SeriesController: jest.fn().mockImplementation(() => mockImplementations),
}));

jest.mock('../../util/validate', () => ({
  validateRequest: jest.fn(),
}));

import router from '../seriesRoutes';
describe('Serie Routes', () => {
  let app: express.Application;
  let mockValidateRequest: jest.Mock;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/series', router);
    mockValidateRequest = validateModule.validateRequest as jest.Mock;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockValidateRequest.mockImplementation((req, res, next) => next());
  });

  describe('GET /title', () => {
    it('should return series by title', async () => {
      const mockSeries = [{ id: '1', title: 'Test Serie', rating: 8.5 }];

      mockImplementations.getSeriesByTitle.mockImplementation((req, res) => {
        res.status(HttpStatus.OK).json(mockSeries);
      });

      const response = await request(app).get('/series/title').query({ title: 'Test Serie' }).expect(HttpStatus.OK);

      expect(response.body).toEqual(mockSeries);
    });
  });

  describe('POST /', () => {
    it('should create a new serie', async () => {
      const newSerie = {
        title: 'New Serie',
        plot: 'Test plot',
        cast: ['Actor 1', 'Actor 2'],
        rating: 9.0,
        url: 'http://serie.com',
        release_date: '2024-01-01',
      };

      mockImplementations.createSeries.mockImplementation((req, res) => {
        res.status(HttpStatus.ACCEPTED).json({ id: '1', ...newSerie });
      });

      await request(app).post('/series').send(newSerie).expect(HttpStatus.ACCEPTED);
    });
  });

  describe('GET /:id', () => {
    it('should return a serie by id', async () => {
      const mockSerie = {
        id: '1',
        title: 'Test Serie',
        rating: 8.5,
      };

      mockImplementations.getSerieById.mockImplementation((req, res) => {
        res.status(HttpStatus.OK).json(mockSerie);
      });

      const response = await request(app).get('/series/1').expect(HttpStatus.OK);

      expect(response.body).toEqual(mockSerie);
    });
  });

  describe('PUT /:id', () => {
    it('should update a serie', async () => {
      const updateData = {
        title: 'Updated Serie',
        plot: 'Updated plot',
        cast: ['Actor 1', 'Actor 2'],
        rating: 9.5,
        url: 'http://updated-serie.com',
        release_date: '2024-02-01',
      };

      mockImplementations.updateSerie.mockImplementation((req, res) => {
        res.status(HttpStatus.OK).json({ id: '1', ...updateData });
      });

      await request(app).put('/series/1').send(updateData).expect(HttpStatus.OK);
    });
  });

  describe('DELETE /:id', () => {
    it('should delete a serie', async () => {
      mockImplementations.deleteSerie.mockImplementation((req, res) => {
        res.status(HttpStatus.OK).json({ message: Messages.MOVIE_DELETED_SUCCESSFULLY });
      });

      await request(app).delete('/series/1').expect(HttpStatus.OK);
    });
  });

  describe('POST /findOrAddSerie', () => {
    it('should find or add a movie', async () => {
      const serieData = {
        title: 'Serie to Find',
        page: 1,
        limit: 10,
      };

      mockImplementations.findOrAddSerie.mockImplementation((req, res) => {
        res.status(HttpStatus.OK).json({ id: '1', title: 'Serie to Find' });
      });

      await request(app).post('/series/findOrAddSerie').send(serieData).expect(HttpStatus.OK);
    });
  });
});
