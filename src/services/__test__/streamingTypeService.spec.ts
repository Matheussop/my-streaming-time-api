import { Types } from "mongoose";
import { StreamingTypeService } from '../streamingTypeService';
import { IGenreRepository } from '../../interfaces/repositories';
import { StreamingServiceError } from '../../middleware/errorHandler';
import { IStreamingTypeCreate, IStreamingTypeResponse, IStreamingTypeUpdate, IGenreReference } from '../../interfaces/streamingTypes';
import { ErrorMessages } from '../../constants/errorMessages';
import { generateValidObjectId } from '../../util/__tests__/generateValidObjectId';
import { StreamingTypeRepository } from '../../repositories/streamingTypeRepository';
import { IGenreResponse } from "../../interfaces/genres";
import axios from "axios";

jest.mock('../../repositories/streamingTypeRepository');

describe('StreamingTypeService', () => {
  let streamingTypeService: StreamingTypeService;
  let mockRepository: jest.Mocked<StreamingTypeRepository>;
  let mockGenreRepository: jest.Mocked<IGenreRepository>;
  let originalToken: string | undefined;

  const mockGenreId = generateValidObjectId() as Types.ObjectId;
  const mockGenreReference: IGenreReference = {
    _id: generateValidObjectId() as Types.ObjectId,
    name: 'Action',
    id: 1,
    poster: 'https://example.com/poster.jpg'
  };

  const mockStreamingType: IStreamingTypeResponse = {
    _id: mockGenreId,
    name: 'series',
    description: 'Streaming service',
    isActive: true,
    supportedGenres: [mockGenreReference],
    createdAt: new Date('2024-03-20'),
    updatedAt: new Date('2024-03-20')
  };

  beforeEach(() => {
    originalToken = process.env.TMDB_Bearer_Token;
    process.env.TMDB_Bearer_Token = 'valid-token';
    mockRepository = new StreamingTypeRepository() as jest.Mocked<StreamingTypeRepository>;
    mockGenreRepository = {
      findById: jest.fn(),
      findByName: jest.fn(),
      findAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as jest.Mocked<IGenreRepository>;

    streamingTypeService = new StreamingTypeService(mockRepository, mockGenreRepository);
  });

  afterEach(() => {
    process.env.TMDB_Bearer_Token = originalToken;
  });

  describe('getAllStreamingTypes', () => {
    it('should return all streaming types', async () => {
      mockRepository.findAll.mockResolvedValue([mockStreamingType]);

      const result = await streamingTypeService.getAllStreamingTypes();

      expect(result).toEqual([mockStreamingType]);
      expect(mockRepository.findAll).toHaveBeenCalled();
    });
  });

  describe('getStreamingTypeById', () => {
    it('should return a streaming type by id', async () => {
      mockRepository.findById.mockResolvedValue(mockStreamingType);

      const result = await streamingTypeService.getStreamingTypeById(mockStreamingType._id.toString());

      expect(result).toEqual(mockStreamingType);
      expect(mockRepository.findById).toHaveBeenCalledWith(mockStreamingType._id);
    });

    it('should return null if streaming type not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(streamingTypeService.getStreamingTypeById(mockStreamingType._id.toString()))
        .rejects.toThrow(new StreamingServiceError(ErrorMessages.STREAMING_TYPE_NOT_FOUND, 404));

      expect(mockRepository.findById).toHaveBeenCalledWith(mockStreamingType._id);
    });
  });

  describe('getStreamingTypeByName', () => {
    it('should return streaming type when found by name', async () => {
      mockRepository.findByName.mockResolvedValue(mockStreamingType as IStreamingTypeResponse);
      const result = await streamingTypeService.getStreamingTypeByName('Netflix');
      expect(result).toEqual(mockStreamingType as IStreamingTypeResponse);
      expect(mockRepository.findByName).toHaveBeenCalledWith('Netflix');
    });

    it('should throw error when streaming type not found by name', async () => {
      mockRepository.findByName.mockResolvedValue(null);
      await expect(streamingTypeService.getStreamingTypeByName('Invalid'))
        .rejects.toThrow(new StreamingServiceError(ErrorMessages.STREAMING_TYPE_NOT_FOUND, 404));
    });
  });

  describe('createStreamingType', () => {
    it('should create a new streaming type', async () => {
      const createData: IStreamingTypeCreate = {
        name: 'Netflix',
        description: 'Streaming service',
        isActive: true,
        supportedGenres: [mockGenreReference]
      };

      mockRepository.create.mockResolvedValue(mockStreamingType);

      const result = await streamingTypeService.createStreamingType(createData);

      expect(result).toEqual(mockStreamingType);
      expect(mockRepository.create).toHaveBeenCalledWith(createData);
    });

    it('should throw error if name already exists', async () => {
      const newType: IStreamingTypeCreate = {
        name: 'Netflix',
        supportedGenres: [mockGenreReference],
        description: 'Streaming service',
        isActive: true
      };
      mockRepository.findByName.mockResolvedValue(mockStreamingType as IStreamingTypeResponse);
      await expect(streamingTypeService.createStreamingType(newType))
        .rejects.toThrow(new StreamingServiceError(ErrorMessages.STREAMING_TYPE_NAME_EXISTS, 400));
    });

    it('should throw error if name is missing', async () => {
      const invalidType = {
        supportedGenres: [mockGenreReference],
        description: 'Streaming service',
        isActive: true
      } as unknown as IStreamingTypeCreate;
      await expect(streamingTypeService.createStreamingType(invalidType))
        .rejects.toThrow(new StreamingServiceError(ErrorMessages.STREAMING_TYPE_NAME_REQUIRED, 400));
    });
  });

  describe('updateStreamingType', () => {
    it('should update a streaming type', async () => {
      const updateData: IStreamingTypeUpdate = {
        name: 'Netflix Updated',
        description: 'Updated description',
        isActive: 'true'
      };

      const updatedStreamingType: IStreamingTypeResponse = {
        ...mockStreamingType,
        ...updateData,
        isActive: true
      };

      mockRepository.findById.mockResolvedValue(mockStreamingType);
      mockRepository.update.mockResolvedValue(updatedStreamingType);

      const result = await streamingTypeService.updateStreamingType(
        mockStreamingType._id.toString(),
        updateData
      );

      expect(result).toEqual(updatedStreamingType);
      expect(mockRepository.update).toHaveBeenCalledWith(mockStreamingType._id, updateData);
    });

    it('should throw error if streaming type not found', async () => {
      const updateData: IStreamingTypeUpdate = {
        name: 'Netflix Updated',
        description: 'Updated description',
        isActive: 'true'
      };

      mockRepository.findById.mockResolvedValue(null);

      await expect(streamingTypeService.updateStreamingType(
        mockStreamingType._id.toString(),
        updateData
      )).rejects.toThrow(new StreamingServiceError(ErrorMessages.STREAMING_TYPE_NOT_FOUND, 404));

      expect(mockRepository.update).toHaveBeenCalledWith(mockStreamingType._id, updateData);
    });

    it('should throw error if new name already exists', async () => {
      const updateData = {
        name: 'Existing Name',
      };
      mockRepository.findById.mockResolvedValue(mockStreamingType as IStreamingTypeResponse);
      mockRepository.findByName.mockResolvedValue({ ...mockStreamingType, _id: generateValidObjectId() } as IStreamingTypeResponse);
      await expect(streamingTypeService.updateStreamingType(
        mockStreamingType._id as unknown as string,
        updateData
      )).rejects.toThrow(new StreamingServiceError(ErrorMessages.STREAMING_TYPE_NAME_EXISTS, 400));
    });
  });

  describe('deleteStreamingType', () => {
    it('should delete a streaming type', async () => {
      mockRepository.findById.mockResolvedValue(mockStreamingType);
      mockRepository.delete.mockResolvedValue(mockStreamingType as IStreamingTypeResponse);

      const result = await streamingTypeService.deleteStreamingType(mockStreamingType._id.toString());

      expect(result).toEqual(mockStreamingType);
      expect(mockRepository.delete).toHaveBeenCalledWith(mockStreamingType._id);
    });

    it('should throw error if streaming type not found', async () => {
      mockRepository.delete.mockResolvedValue(null);

      await expect(streamingTypeService.deleteStreamingType(mockStreamingType._id.toString()))
        .rejects.toThrow(new StreamingServiceError(ErrorMessages.STREAMING_TYPE_NOT_FOUND, 404));

      expect(mockRepository.delete).toHaveBeenCalledWith(mockStreamingType._id);
    });
  });

  describe('addGenreToStreamingType', () => {
    it('should add a genre to streaming type', async () => {
      const newGenre: IGenreReference = {
        _id: generateValidObjectId() as Types.ObjectId,
        name: 'Adventure',
        id: 3,
        poster: 'https://example.com/poster.jpg'
      };

      const mockGenreResponseWithSameGenre = {
        ...mockGenreReference,
        id: 3,
        name: 'Adventure'
      }

      const updatedStreamingType: IStreamingTypeResponse = {
        ...mockStreamingType,
        supportedGenres: [mockGenreReference, newGenre]
      };

      mockGenreRepository.findById.mockResolvedValue(mockGenreResponseWithSameGenre as IGenreResponse);
      mockRepository.findById.mockResolvedValue(mockStreamingType);
      mockRepository.addGenre.mockResolvedValue(updatedStreamingType);
      const result = await streamingTypeService.addGenreToStreamingType(
        mockStreamingType._id.toString(),
        [newGenre]
      );

      expect(result).toEqual(updatedStreamingType);
      expect(mockRepository.addGenre).toHaveBeenCalledWith(mockStreamingType._id, [newGenre]);
    });

    it('should throw error if streaming type not found', async () => {
      
      const newGenre: IGenreReference = {
        _id: generateValidObjectId() as Types.ObjectId,
        name: 'Adventure',
        id: 3,
        poster: 'https://example.com/poster.jpg'
      };

      const mockGenreResponseWithSameGenre = {
        ...mockGenreReference,
        id: 3,
        name: 'Adventure'
      }
      mockGenreRepository.findById.mockResolvedValue(mockGenreResponseWithSameGenre as IGenreResponse);
      mockRepository.findByGenreName.mockResolvedValue(mockStreamingType as IStreamingTypeResponse);
      mockRepository.addGenre.mockResolvedValue(null);
      await expect(streamingTypeService.addGenreToStreamingType(
        mockStreamingType._id.toString(),
        [newGenre]
      )).rejects.toThrow(new StreamingServiceError(ErrorMessages.STREAMING_TYPE_NOT_FOUND, 404));
    });

    it('should throw error if genre not found', async () => {
      const newGenre: IGenreReference = {
        _id: generateValidObjectId() as Types.ObjectId,
        name: 'Comedy',
        id: 2,
        poster: 'https://example.com/poster.jpg'
      };
      mockRepository.findById.mockResolvedValue(mockStreamingType as IStreamingTypeResponse);
      mockGenreRepository.findById.mockResolvedValue(null);
      await expect(streamingTypeService.addGenreToStreamingType(
        mockStreamingType._id as unknown as string,
        [newGenre]
      )).rejects.toThrow(new StreamingServiceError(ErrorMessages.GENRE_NOT_FOUND, 404));
    });

    it('should throw error if genre already exists with different id', async () => {
      const newGenre: IGenreReference = {
        _id: generateValidObjectId() as Types.ObjectId,
        name: 'Action',
        id: 2,
        poster: 'https://example.com/poster.jpg'
      };
      mockRepository.findById.mockResolvedValue(mockStreamingType as IStreamingTypeResponse);
      mockGenreRepository.findById.mockResolvedValue(mockGenreReference as IGenreResponse);
      await expect(streamingTypeService.addGenreToStreamingType(
        mockStreamingType._id as unknown as string,
        [newGenre]
      )).rejects.toThrow(new StreamingServiceError(ErrorMessages.GENRE_ID_MISMATCH(newGenre.id, mockGenreReference.id), 400));
    });

    it('should throw error if genre already exists with different name', async () => {
      const newGenre: IGenreReference = {
        _id: generateValidObjectId() as Types.ObjectId,
        name: 'Adventure',
        id: 1,
        poster: 'https://example.com/poster.jpg'
      };
      mockRepository.findById.mockResolvedValue(mockStreamingType as IStreamingTypeResponse);
      mockGenreRepository.findById.mockResolvedValue(mockGenreReference as IGenreResponse);
      await expect(streamingTypeService.addGenreToStreamingType(
        mockStreamingType._id as unknown as string,
        [newGenre]
      )).rejects.toThrow(new StreamingServiceError(ErrorMessages.GENRE_NAME_MISMATCH(newGenre.name, mockGenreReference.name), 400));
    });

    it('should throw error if genre does not have a _id', async () => {
      const newGenre: IGenreReference = {
        name: 'Adventure',
        id: 3,
        poster: 'https://example.com/poster.jpg'
      } as unknown as IGenreReference;
      mockRepository.findById.mockResolvedValue(mockStreamingType as IStreamingTypeResponse);
      mockGenreRepository.findById.mockResolvedValue(mockGenreReference as IGenreResponse);
      await expect(streamingTypeService.addGenreToStreamingType(
        mockStreamingType._id as unknown as string,
        [newGenre]
      )).rejects.toThrow(new StreamingServiceError(ErrorMessages.GENRE_INTERNAL_ID_INVALID, 400));
    });

    it('should throw error if genre does not have a genre', async () => {
      mockRepository.findById.mockResolvedValue(mockStreamingType as IStreamingTypeResponse);
      mockGenreRepository.findById.mockResolvedValue(mockGenreReference as IGenreResponse);
      await expect(streamingTypeService.addGenreToStreamingType(
        mockStreamingType._id as unknown as string,
        []
      )).rejects.toThrow(new StreamingServiceError(ErrorMessages.GENRE_REQUIRED, 400));
    });

    it('should throw error if genre _id is not a valid object id', async () => {
      const newGenre: IGenreReference = {
        _id: 'invalid-id' as unknown as Types.ObjectId,
        name: 'Adventure',
        id: 3,
        poster: 'https://example.com/poster.jpg'
      };
      mockRepository.findById.mockResolvedValue(mockStreamingType as IStreamingTypeResponse);
      mockGenreRepository.findById.mockResolvedValue(mockGenreReference as IGenreResponse);
      await expect(streamingTypeService.addGenreToStreamingType(
        mockStreamingType._id as unknown as string,
        [newGenre]
      )).rejects.toThrow(new StreamingServiceError(ErrorMessages.INVALID_ID_FORMAT('genre'), 400));
    });

    it('should throw error if genre name has on database', async () => {
      const newGenre: IGenreReference = {
        _id: generateValidObjectId() as Types.ObjectId,
        name: 'Action',
        id: 1,
        poster: 'https://example.com/poster.jpg'
      };
      mockGenreRepository.findById.mockResolvedValue(mockGenreReference as IGenreResponse);
      mockRepository.findByGenreName.mockResolvedValue(mockStreamingType as IStreamingTypeResponse);

      await expect(streamingTypeService.addGenreToStreamingType(
        mockStreamingType._id as unknown as string,
        [newGenre]
      )).rejects.toThrow(new StreamingServiceError(ErrorMessages.STREAMING_TYPE_GENRE_NAME_EXISTS(mockGenreReference.name), 400));  
    });
  });

  describe('deleteGenresFromStreamingTypeByName', () => {
    it('should delete genres from streaming type by name', async () => {
      const genreNames = ['Action'];
      mockRepository.findById.mockResolvedValue(mockStreamingType as IStreamingTypeResponse);
      mockRepository.deleteByGenresName.mockResolvedValue({
        ...mockStreamingType,
        supportedGenres: []
      } as IStreamingTypeResponse);

      const result = await streamingTypeService.deleteGenresFromStreamingTypeByName(
        mockStreamingType._id as unknown as string,
        genreNames
      );

      expect(result?.supportedGenres).not.toContainEqual(mockGenreReference);
      expect(mockRepository.deleteByGenresName).toHaveBeenCalledWith(genreNames, mockStreamingType._id);
    });

    it('should throw error if streaming type not found', async () => {
      const genreNames = ['Action'];
      mockRepository.deleteByGenresName.mockResolvedValue(null);
      await expect(streamingTypeService.deleteGenresFromStreamingTypeByName(
        mockStreamingType._id as unknown as string,
        genreNames
      )).rejects.toThrow(new StreamingServiceError(ErrorMessages.STREAMING_TYPE_NOT_FOUND, 404));
    });
  });

  describe('changeCover', () => {
    it('should change the cover of the streaming type series', async () => {
      mockRepository.findAll.mockResolvedValue([mockStreamingType]);
      jest.spyOn(axios, 'get').mockResolvedValue({
        data: {
          results: [{ backdrop_path: '/backdrop.jpg' }]
        }
      });
      mockRepository.update.mockResolvedValue(mockStreamingType);
      await streamingTypeService.changeCover();
      expect(mockRepository.update).toHaveBeenCalledWith(mockStreamingType._id, {
        supportedGenres: [{
          ...mockGenreReference,
          poster: 'https://image.tmdb.org/t/p/original/backdrop.jpg'
        }]
      });
    });

    it('should change the cover of the streaming type movies', async () => {
      mockRepository.findAll.mockResolvedValue([mockStreamingType]);
      jest.spyOn(axios, 'get').mockResolvedValue({
        data: {
          results: [{ backdrop_path: '/backdrop.jpg' }]
        }
      });
      mockStreamingType.name = 'movies';
      mockStreamingType.description = 'Movies description';
      mockRepository.update.mockResolvedValue(mockStreamingType);
      await streamingTypeService.changeCover();
      expect(mockRepository.update).toHaveBeenCalledWith(mockStreamingType._id, {
        supportedGenres: [{
          ...mockGenreReference,
          poster: 'https://image.tmdb.org/t/p/original/backdrop.jpg'
        }]
      });
    });

    it('should not change the cover if streaming type not has supportedGenres', async () => {
      const streamingTypeWithoutGenres = {
        ...mockStreamingType,
        supportedGenres: undefined
      } as unknown as IStreamingTypeResponse;
      mockRepository.findAll.mockResolvedValue([streamingTypeWithoutGenres]);
      jest.spyOn(axios, 'get').mockResolvedValue({
        data: {
          results: [{ backdrop_path: '/backdrop.jpg' }]
        }
      });
      const updateGenreCoversSpy = jest.spyOn(streamingTypeService as any, 'updateGenreCovers');
      mockRepository.update.mockResolvedValue(mockStreamingType);
      await streamingTypeService.changeCover();
      expect(updateGenreCoversSpy).not.toHaveBeenCalled();
    });

    it('should throw error if TMDB token is invalid', async () => {
      process.env.TMDB_Bearer_Token = '';
      await expect(streamingTypeService.changeCover()).rejects.toThrow(new StreamingServiceError(ErrorMessages.TMDB_TOKEN_INVALID, 401));
    });

    it('should original genre if TMDB api call fails', async () => {
      mockRepository.findAll.mockResolvedValue([mockStreamingType]);
      jest.spyOn(axios, 'get').mockRejectedValue(new Error('API call failed'));
      mockRepository.update.mockResolvedValue(mockStreamingType);

      await streamingTypeService.changeCover();
      expect(mockRepository.update).toHaveBeenCalledWith(mockStreamingType._id, {
        supportedGenres: [mockGenreReference]
      });
    });

    it('should original genre if TMDB api call returns empty array', async () => {
      mockRepository.findAll.mockResolvedValue([mockStreamingType]);
      jest.spyOn(axios, 'get').mockResolvedValue({
        data: {
          results: []
        }
      });
      mockRepository.update.mockResolvedValue(mockStreamingType);

      await streamingTypeService.changeCover();
      expect(mockRepository.update).toHaveBeenCalledWith(mockStreamingType._id, {
        supportedGenres: [mockGenreReference]
      });
    });

    it('should throw error if streaming types are not updated', async () => {
      mockRepository.findAll.mockResolvedValue([mockStreamingType]);
      jest.spyOn(axios, 'get').mockResolvedValue({
        data: {
          results: [{ backdrop_path: '/backdrop.jpg' }]
        }
      });
      mockRepository.update.mockResolvedValue(null);
      await expect(streamingTypeService.changeCover()).rejects.toThrow(new StreamingServiceError(ErrorMessages.STREAMING_TYPE_NOT_FOUND, 404));
    });
  });
});
