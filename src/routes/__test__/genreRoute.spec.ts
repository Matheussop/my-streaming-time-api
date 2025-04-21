import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';
import { HttpStatus } from '../../constants/httpStatus';
import { Types } from 'mongoose';

const mockImplementations = {
  getAllGenre: jest.fn(),
  getGenreById: jest.fn(),
  getGenreByName: jest.fn(),
  createGenre: jest.fn(),
  createManyGenre: jest.fn(),
  updateGenre: jest.fn(),
  deleteGenre: jest.fn(),
};

jest.mock('../../controllers/genreController', () => ({
  GenreController: jest.fn().mockImplementation(() => mockImplementations),
}));

jest.mock('../../middleware/validationMiddleware', () => ({
  validate: jest.fn().mockImplementation(() => (req: Request, res: Response, next: NextFunction) => next()),
}));

jest.mock('../../middleware/objectIdValidationMiddleware', () => ({
  validateObjectId: jest.fn().mockImplementation(() => (req: Request, res: Response, next: NextFunction) => {
    req.validatedIds = req.validatedIds || {};
    const id = req.params.id || req.params._id || '507f1f77bcf86cd799439011';
    req.validatedIds.id = new Types.ObjectId(id);
    req.validatedIds._id = new Types.ObjectId(id);
    next();
  }),
}));

import router from '../genreRoute';
import { generateValidObjectId } from '../../util/test/generateValidObjectId';

describe('Genre Routes', () => {
  let app: express.Application;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/genre', router);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /', () => {
    it('should return a list of genres with pagination', async () => {
      const mockGenres = [
        { _id: '1', id: 1, name: 'Action', poster: 'poster1.jpg' },
        { _id: '2', id: 2, name: 'Comedy', poster: 'poster2.jpg' },
      ];

      mockImplementations.getAllGenre.mockImplementation((req: Request, res: Response) => {
        res.status(HttpStatus.OK).json(mockGenres);
      });

      const response = await request(app).get('/genre').query({ page: 1, limit: 10 }).expect(HttpStatus.OK);

      expect(response.body).toEqual(mockGenres);
    });
  });

  describe('GET /:id', () => {
    it('should return a genre by ID', async () => {
      const id = generateValidObjectId();
      const mockGenre = { _id: id, id: 1, name: 'Action', poster: 'poster1.jpg' };

      mockImplementations.getGenreById.mockImplementation((req: Request, res: Response) => {
        res.status(HttpStatus.OK).json(mockGenre);
      });

      const response = await request(app).get(`/genre/${id}`).expect(HttpStatus.OK);

      expect(response.body).toEqual(mockGenre);
    });
  });

  describe('GET /byName/:name', () => {
    it('should return a genre by name', async () => {
      const mockGenre = { _id: '1', id: 1, name: 'Action', poster: 'poster1.jpg' };

      mockImplementations.getGenreByName.mockImplementation((req: Request, res: Response) => {
        res.status(HttpStatus.OK).json(mockGenre);
      });

      const response = await request(app).get('/genre/byName/Action').expect(HttpStatus.OK);

      expect(response.body).toEqual(mockGenre);
    });
  });

  describe('POST /', () => {
    it('should create a new genre', async () => {
      const newGenre = {
        id: 3,
        name: 'Horror',
        poster: 'poster3.jpg'
      };

      mockImplementations.createGenre.mockImplementation((req: Request, res: Response) => {
        res.status(HttpStatus.CREATED).json({ _id: '3', ...newGenre });
      });

      const response = await request(app).post('/genre').send(newGenre).expect(HttpStatus.CREATED);

      expect(response.body).toEqual({ _id: '3', ...newGenre });
    });
  });

  describe('POST /many', () => {
    it('should create multiple genres', async () => {
      const newGenres = [
        { id: 4, name: 'Sci-Fi', poster: 'poster4.jpg' },
        { id: 5, name: 'Romance', poster: 'poster5.jpg' }
      ];

      mockImplementations.createManyGenre.mockImplementation((req: Request, res: Response) => {
        res.status(HttpStatus.CREATED).json({ 
          message: 'Genres created', 
          genresCreated: newGenres.map((genre, index) => ({ _id: `${index + 4}`, ...genre }))
        });
      });

      const response = await request(app).post('/genre/many').send(newGenres).expect(HttpStatus.CREATED);

      expect(response.body).toEqual({
        message: 'Genres created',
        genresCreated: newGenres.map((genre, index) => ({ _id: `${index + 4}`, ...genre }))
      });
    });
  });

  describe('PUT /:_id', () => {
    it('should update a genre', async () => {
      const updateData = {
        name: 'Updated Action',
        poster: 'updated-poster.jpg'
      };

      const updatedId = generateValidObjectId();

      mockImplementations.updateGenre.mockImplementation((req: Request, res: Response) => {
        res.status(HttpStatus.OK).json({ _id: updatedId.toString(), id: 1, ...updateData });
      });

      const response = await request(app).put(`/genre/${updatedId}`).send(updateData).expect(HttpStatus.OK);

      expect(response.body).toEqual({ _id: updatedId.toString(), id: 1, ...updateData });
    });
  });

  describe('DELETE /:id', () => {
    it('should delete a genre', async () => {
      const deletedGenre = { _id: '1', id: 1, name: 'Action', poster: 'poster1.jpg' };

      mockImplementations.deleteGenre.mockImplementation((req: Request, res: Response) => {
        res.status(HttpStatus.OK).json({ 
          message: 'Genre Deleted', 
          genre: deletedGenre 
        });
      });

      const deletedId = generateValidObjectId();
      const response = await request(app).delete(`/genre/${deletedId}`).expect(HttpStatus.OK);

      expect(response.body).toEqual({ 
        message: 'Genre Deleted', 
        genre: deletedGenre 
      });
    });
  });
}); 