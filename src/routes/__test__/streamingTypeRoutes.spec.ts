import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';
import { HttpStatus } from '../../constants/httpStatus';
import { Messages } from '../../constants/messages';
import { Types } from 'mongoose';
import { generateValidObjectId } from '../../util/test/generateValidObjectId';

const mockImplementations = {
  getStreamingTypes: jest.fn(),
  getStreamingTypeById: jest.fn(),
  getStreamingTypeByName: jest.fn(),
  createStreamingType: jest.fn(),
  updateStreamingType: jest.fn(),
  addGenreToStreamingType: jest.fn(),
  deleteGenreFromStreamingTypeByName: jest.fn(),
  deleteStreamingType: jest.fn(),
  changeCover: jest.fn()
};

jest.mock('../../controllers/streamingTypeController', () => ({
  StreamingTypeController: jest.fn().mockImplementation(() => mockImplementations),
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

import router from '../streamingTypeRoutes';

describe('Streaming Type Routes', () => {
  let app: express.Application;
  let mockId: string | Types.ObjectId;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/streamingTypes', router);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockId = generateValidObjectId();
  });

  describe('GET /', () => {
    it('should return list of streaming types with pagination', async () => {
      const mockStreamingTypes = [
        { _id: mockId.toString(), name: 'Netflix', supportedGenres: [] },
        { _id: generateValidObjectId().toString(), name: 'Disney+', supportedGenres: [] },
      ];

      mockImplementations.getStreamingTypes.mockImplementation((req: Request, res: Response) => {
        res.status(HttpStatus.OK).json(mockStreamingTypes);
      });

      const response = await request(app)
        .get('/streamingTypes')
        .query({ page: 1, limit: 10 })
        .expect(HttpStatus.OK);

      expect(response.body).toEqual(mockStreamingTypes);
    });
  });

  describe('GET /change-cover', () => {
    it('should change cover of genres', async () => {
      mockImplementations.changeCover.mockImplementation((req: Request, res: Response) => {
        res.status(HttpStatus.OK).json({ message: 'Cover changed successfully' });
      });

      const response = await request(app)
        .get('/streamingTypes/change-cover')
        .expect(HttpStatus.OK);

      expect(response.body).toEqual({ message: 'Cover changed successfully' });
    });
  });

  describe('GET /:id', () => {
    it('should return a streaming type by id', async () => {
      const mockStreamingType = {
        _id: mockId.toString(),
        name: 'Netflix',
        supportedGenres: [
          { id: 1, name: 'Action', _id: generateValidObjectId().toString() }
        ]
      };

      mockImplementations.getStreamingTypeById.mockImplementation((req: Request, res: Response) => {
        res.status(HttpStatus.OK).json(mockStreamingType);
      });

      const response = await request(app)
        .get(`/streamingTypes/${mockId}`)
        .expect(HttpStatus.OK);

      expect(response.body).toEqual(mockStreamingType);
    });
  });

  describe('GET /name/:name', () => {
    it('should return a streaming type by name', async () => {
      const mockStreamingType = {
        _id: mockId.toString(),
        name: 'Netflix',
        supportedGenres: [
          { id: 1, name: 'Action', _id: generateValidObjectId().toString() }
        ]
      };

      mockImplementations.getStreamingTypeByName.mockImplementation((req: Request, res: Response) => {
        res.status(HttpStatus.OK).json(mockStreamingType);
      });

      const response = await request(app)
        .get('/streamingTypes/name/Netflix')
        .expect(HttpStatus.OK);

      expect(response.body).toEqual(mockStreamingType);
    });
  });

  describe('POST /', () => {
    it('should create a new streaming type', async () => {
      const newStreamingType = {
        name: 'New Streaming Type',
        description: 'Test description'
      };

      mockImplementations.createStreamingType.mockImplementation((req: Request, res: Response) => {
        res.status(HttpStatus.CREATED).json({ _id: mockId.toString(), ...newStreamingType, supportedGenres: [] });
      });

      const response = await request(app)
        .post('/streamingTypes')
        .send(newStreamingType)
        .expect(HttpStatus.CREATED);

      expect(response.body).toEqual({ _id: mockId.toString(), ...newStreamingType, supportedGenres: [] });
    });
  });

  describe('PUT /:id', () => {
    it('should update a streaming type', async () => {
      const updateData = {
        name: 'Updated Streaming Type',
        description: 'Updated description'
      };

      mockImplementations.updateStreamingType.mockImplementation((req: Request, res: Response) => {
        res.status(HttpStatus.OK).json({ _id: mockId.toString(), ...updateData, supportedGenres: [] });
      });

      const response = await request(app)
        .put(`/streamingTypes/${mockId}`)
        .send(updateData)
        .expect(HttpStatus.OK);

      expect(response.body).toEqual({ _id: mockId.toString(), ...updateData, supportedGenres: [] });
    });
  });

  describe('PUT /add-genre/:id', () => {
    it('should add genre to a streaming type', async () => {
      const genreData = {
        supportedGenres: [
          { id: 1, name: 'Action' }
        ]
      };

      const updatedStreamingType = {
        _id: mockId.toString(),
        name: 'Netflix',
        supportedGenres: [
          { id: 1, name: 'Action', _id: generateValidObjectId().toString() }
        ]
      };

      mockImplementations.addGenreToStreamingType.mockImplementation((req: Request, res: Response) => {
        res.status(HttpStatus.OK).json(updatedStreamingType);
      });

      const response = await request(app)
        .put(`/streamingTypes/add-genre/${mockId}`)
        .send(genreData)
        .expect(HttpStatus.OK);

      expect(response.body).toEqual(updatedStreamingType);
    });
  });

  describe('DELETE /delete-genre/:id', () => {
    it('should delete genre from a streaming type', async () => {
      const updatedStreamingType = {
        _id: mockId.toString(),
        name: 'Netflix',
        supportedGenres: []
      };

      mockImplementations.deleteGenreFromStreamingTypeByName.mockImplementation((req: Request, res: Response) => {
        res.status(HttpStatus.OK).json(updatedStreamingType);
      });

      const response = await request(app)
        .delete(`/streamingTypes/delete-genre/${mockId}`)
        .send({ genresName: ['Action'] })
        .expect(HttpStatus.OK);

      expect(response.body).toEqual(updatedStreamingType);
    });
  });

  describe('DELETE /:id', () => {
    it('should delete a streaming type', async () => {
      mockImplementations.deleteStreamingType.mockImplementation((req: Request, res: Response) => {
        res.status(HttpStatus.NO_CONTENT).send(Messages.STREAMING_TYPE_DELETED_SUCCESSFULLY);
      });

      await request(app)
        .delete(`/streamingTypes/${mockId}`)
        .expect(HttpStatus.NO_CONTENT);
    });
  });
});
