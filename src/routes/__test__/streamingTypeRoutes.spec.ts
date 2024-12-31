import express from 'express';
import request from 'supertest';
import { HttpStatus } from '../../constants/httpStatus';
import { Messages } from '../../constants/messages';
import * as validateModule from '../../util/validate';

const mockImplementations = {
  getStreamingTypes: jest.fn(),
  getStreamingTypeById: jest.fn(),
  createStreamingType: jest.fn(),
  updateStreamingType: jest.fn(),
  addCategoryToStreamingType: jest.fn(),
  removeCategoryFromStreamingType: jest.fn(),
  deleteStreamingType: jest.fn(),
};

jest.mock('../../controllers/streamingTypeController', () => ({
  StreamingTypeController: jest.fn().mockImplementation(() => mockImplementations),
}));
jest.mock('../../util/validate', () => ({
  validateRequest: jest.fn(),
}));

import router from '../streamingTypeRoutes';
describe('Streaming Types Routes', () => {
  let app: express.Application;
  let mockValidateRequest: jest.Mock;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/streamingTypes', router);
    mockValidateRequest = validateModule.validateRequest as jest.Mock;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockValidateRequest.mockImplementation((req, res, next) => next());
  });

  describe('GET /', () => {
    it('should return 200 and list of streaming types', async () => {
      const mockTypes = [
        { id: '1', name: 'Netflix', categories: ['Movies', 'Series'] },
        { id: '2', name: 'Prime Video', categories: ['Movies'] },
      ];

      mockImplementations.getStreamingTypes.mockImplementation((req, res) => {
        res.status(HttpStatus.OK).json(mockTypes);
      });

      const response = await request(app).get('/streamingTypes').expect(HttpStatus.OK);

      expect(response.body).toEqual(mockTypes);
    });
  });

  describe('GET /:id', () => {
    it('should return 200 and streaming type when found', async () => {
      const mockType = { id: '1', name: 'Netflix', categories: ['Movies', 'Series'] };

      mockImplementations.getStreamingTypeById.mockImplementation((req, res) => {
        res.status(HttpStatus.OK).json(mockType);
      });

      const response = await request(app).get('/streamingTypes/1').expect(HttpStatus.OK);

      expect(response.body).toEqual(mockType);
    });
  });

  describe('POST /', () => {
    const validStreamingType = {
      name: 'Disney+',
      categories: ['Movies', 'Series', 'Kids'],
    };

    it('should return 200 when streaming type is created', async () => {
      mockImplementations.createStreamingType.mockImplementation((req, res) => {
        res.status(HttpStatus.ACCEPTED).json({ id: '3', ...validStreamingType });
      });

      await request(app).post('/streamingTypes').send(validStreamingType).expect(HttpStatus.ACCEPTED);
    });
  });

  describe('PUT /:id', () => {
    const updateData = {
      name: 'Updated Netflix',
      categories: ['Movies', 'Series', 'Documentaries'],
    };

    it('should return 200 when streaming type is updated', async () => {
      mockImplementations.updateStreamingType.mockImplementation((req, res) => {
        res.status(HttpStatus.OK).json({ id: '1', ...updateData });
      });

      await request(app).put('/streamingTypes/1').send(updateData).expect(HttpStatus.OK);
    });
  });

  describe('PUT /addCategory/:id', () => {
    const newCategories = {
      categories: [
        { id: 1, name: 'Anime' },
        { id: 2, name: 'Sports' },
      ],
    };

    it('should return 200 when categories are added', async () => {
      mockImplementations.addCategoryToStreamingType.mockImplementation((req, res) => {
        res.status(HttpStatus.OK).json({ message: Messages.STREAMING_TYPE_CATEGORIES_ADDED_SUCCESSFULLY });
      });

      await request(app).put('/streamingTypes/addCategory/1').send(newCategories).expect(HttpStatus.OK);
    });
  });

  describe('PUT /removeCategory/:id', () => {
    const categoriesToRemove = {
      categories: [{ id: 1 }, { id: 2 }],
    };

    it('should return 200 when categories are removed', async () => {
      mockImplementations.removeCategoryFromStreamingType.mockImplementation((req, res) => {
        res.status(HttpStatus.OK).json({ message: Messages.STREAMING_TYPE_CATEGORIES_REMOVED_SUCCESSFULLY });
      });

      await request(app).put('/streamingTypes/removeCategory/1').send(categoriesToRemove).expect(HttpStatus.OK);
    });
  });

  describe('DELETE /:id', () => {
    it('should return 200 when streaming type is deleted', async () => {
      mockImplementations.deleteStreamingType.mockImplementation((req, res) => {
        res.status(HttpStatus.OK).json({ message: Messages.STREAMING_TYPE_DELETED_SUCCESSFULLY });
      });

      await request(app).delete('/streamingTypes/1').expect(HttpStatus.OK);
    });
  });
});
