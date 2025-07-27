import { NextFunction, Request, Response } from 'express';
import { GenreController } from '../genreController';
import { GenreService } from '../../services/genreService';
import { Types } from 'mongoose';
import { generateValidObjectId } from '../../util/__tests__/generateValidObjectId';
import { IGenreResponse } from '../../interfaces/genres';

jest.mock('../../services/genreService');

describe('GenreController', () => {
  let controller: GenreController;
  let mockService: jest.Mocked<GenreService>;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: jest.MockedFunction<NextFunction>;
  let validId: Types.ObjectId | string;
  let mockGenre: IGenreResponse;

  beforeEach(() => {
    validId = generateValidObjectId();
    mockGenre = {
      _id: validId as Types.ObjectId,
      id: 1,
      name: 'Action',
      poster: 'poster-url',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    mockService = new GenreService({} as any) as jest.Mocked<GenreService>;
    controller = new GenreController(mockService);
    mockReq = {
      body: {},
      params: {},
      validatedIds: { id: validId as Types.ObjectId, _id: validId as Types.ObjectId },
      method: 'GET',
      path: '/genres'
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockImplementation(() => mockRes),
      send: jest.fn(),
    };
    mockNext = jest.fn();
  });

  describe('getGenreByName', () => {
    it('should return genre by name', async () => {
      const genreName = 'Action';
      mockReq.params = { name: genreName };
      mockService.getGenreByName.mockResolvedValue(mockGenre);

      await controller.getGenreByName(mockReq as Request, mockRes as Response, mockNext);

      expect(mockService.getGenreByName).toHaveBeenCalledWith(genreName);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockGenre);
    });
  });

  describe('getGenreById', () => {
    it('should return genre by id', async () => {
      mockService.getGenreById.mockResolvedValue(mockGenre);

      await controller.getGenreById(mockReq as Request, mockRes as Response, mockNext);

      expect(mockService.getGenreById).toHaveBeenCalledWith(validId);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockGenre);
    });

    it('should handle error when id is undefined', async () => {
      mockReq.validatedIds = undefined;
      const error = new TypeError('Cannot read properties of undefined (reading \'id\')');
      mockService.getGenreById.mockRejectedValue(error);

      await controller.getGenreById(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockService.getGenreById).not.toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockRes.json).not.toHaveBeenCalled();
    });
  });

  describe('getAllGenre', () => {
    it('should return paginated genre list', async () => {
      const validSecondaryId = new Types.ObjectId();
      const paginatedGenres = [
        mockGenre,
        { ...mockGenre, _id: validSecondaryId, name: 'Adventure' }
      ];
      mockReq.body = { page: 1, limit: 10 };
      mockService.getAllGenres.mockResolvedValue(paginatedGenres);

      await controller.getAllGenre(mockReq as Request, mockRes as Response, mockNext);

      expect(mockService.getAllGenres).toHaveBeenCalledWith(0, 10);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(paginatedGenres);
    });

    it('should use default pagination values when not provided', async () => {
      const defaultGenres = [mockGenre];
      mockReq.body = {};
      mockService.getAllGenres.mockResolvedValue(defaultGenres);

      await controller.getAllGenre(mockReq as Request, mockRes as Response, mockNext);

      expect(mockService.getAllGenres).toHaveBeenCalledWith(0, 100);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(defaultGenres);
    });
  });

  describe('createGenre', () => {
    it('should create new genre successfully', async () => {
      const genreData = {
        id: 1,
        name: 'Action',
        poster: 'poster-url'
      };
      mockReq.body = genreData;
      mockService.createGenre.mockResolvedValue(mockGenre);

      await controller.createGenre(mockReq as Request, mockRes as Response, mockNext);

      expect(mockService.createGenre).toHaveBeenCalledWith(genreData);
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(mockGenre);
    });
  });

  describe('createManyGenre', () => {
    it('should create multiple genres successfully', async () => {
      const genresData = [mockGenre];
      mockReq.body = { genres: genresData};
      mockService.createGenre.mockResolvedValue(genresData);

      await controller.createManyGenre(mockReq as Request, mockRes as Response, mockNext);

      expect(mockService.createGenre).toHaveBeenCalledWith(genresData);
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({ 
        message: "Genres created", 
        genresCreated: genresData 
      });
    });
  });

  describe('updateGenre', () => {
    it('should update genre successfully', async () => {
      const updateData = {
        id: 1,
        name: 'Updated Action',
        poster: 'new-poster-url'
      };
      mockReq.body = updateData;
      mockService.updateGenre.mockResolvedValue(mockGenre);

      await controller.updateGenre(mockReq as Request, mockRes as Response, mockNext);

      expect(mockService.updateGenre).toHaveBeenCalledWith(validId, updateData);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockGenre);
    });

    it('should handle error when _id is undefined', async () => {
      mockReq.validatedIds = undefined;
      const error = new TypeError('Cannot read properties of undefined (reading \'_id\')');
      mockService.updateGenre.mockRejectedValue(error);

      await controller.updateGenre(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockService.updateGenre).not.toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockRes.json).not.toHaveBeenCalled();
    });
  });

  describe('deleteGenre', () => {
    it('should delete genre successfully', async () => {
      mockService.deleteGenre.mockResolvedValue(mockGenre);

      await controller.deleteGenre(mockReq as Request, mockRes as Response, mockNext);

      expect(mockService.deleteGenre).toHaveBeenCalledWith(validId);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ 
        message: "Genre Deleted", 
        genre: mockGenre 
      });
    });

    it('should handle error when id is undefined', async () => {
      mockReq.validatedIds = undefined;
      const error = new TypeError('Cannot read properties of undefined (reading \'id\')');
      mockService.deleteGenre.mockRejectedValue(error);

      await controller.deleteGenre(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockService.deleteGenre).not.toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockRes.json).not.toHaveBeenCalled();
    });
  });

  describe('syncGenresFromTMDB', ()=> {
    it("should sync genres from TMDB", async () => {
      const synchronizedGenres = { movieGenres: 20, tvGenres: 20}
      mockService.syncGenresFromTMDB.mockResolvedValue(synchronizedGenres);

      await controller.syncGenresFromTMDB(mockReq as Request, mockRes as Response, mockNext)

      expect(mockService.syncGenresFromTMDB).toHaveBeenCalled()
      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: expect.stringContaining("Genres synchronized"),
        result: expect.objectContaining(synchronizedGenres)
      })
    })
  })
});