import { StreamingTypeService } from '../streamingTypeService';
import { IStreamingTypeRepository } from '../../interfaces/repositories';
import { IGenreRepository } from '../../interfaces/repositories';
import { StreamingServiceError } from '../../middleware/errorHandler';
import { IStreamingType } from '../../models/streamingTypesModel';
import { ICategory, IStreamingTypeCreate, IStreamingTypeResponse, IGenreReference } from '../../interfaces/streamingTypes';
import { ErrorMessages } from '../../constants/errorMessages';
import { Types } from 'mongoose';

describe('StreamingTypeService', () => {
  let streamingTypeService: StreamingTypeService;
  let mockRepository: jest.Mocked<IStreamingTypeRepository>;
  let mockGenreRepository: jest.Mocked<IGenreRepository>;

  const mockStreamingType: Partial<IStreamingType> = {
    _id: 'type1',
    name: 'Netflix',
    categories: [
      { id: 1, name: 'Movies' },
      { id: 2, name: 'Series' },
    ],
  };

  beforeEach(() => {
    mockRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByName: jest.fn(),
      findByGenreName: jest.fn(),
      getIdGenreByName: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      addCategory: jest.fn(),
      removeCategory: jest.fn(),
      addGenre: jest.fn(),
    } as jest.Mocked<IStreamingTypeRepository>;

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

  describe('getAllStreamingTypes', () => {
    it('should return all streaming types', async () => {
      const mockTypes = [mockStreamingType];
      mockRepository.findAll.mockResolvedValue(mockTypes as IStreamingTypeResponse[]);

      const result = await streamingTypeService.getAllStreamingTypes();

      expect(result).toEqual(mockTypes);
      expect(mockRepository.findAll).toHaveBeenCalledWith(0, 10);
    });
  });

  describe('getStreamingTypeById', () => {
    it('should return streaming type when found', async () => {
      mockRepository.findById.mockResolvedValue(mockStreamingType as IStreamingTypeResponse);

      const result = await streamingTypeService.getStreamingTypeById('type1');

      expect(result).toEqual(mockStreamingType);
      expect(mockRepository.findById).toHaveBeenCalledWith('type1');
    });

    it('should throw error when streaming type not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(streamingTypeService.getStreamingTypeById('invalid')).rejects.toThrow(
        new StreamingServiceError(ErrorMessages.STREAMING_TYPE_NOT_FOUND, 404),
      );
    });
  });

  describe('getStreamingTypeByName', () => {
    it('should return streaming type when found by name', async () => {
      mockRepository.findByName.mockResolvedValue(mockStreamingType as IStreamingTypeResponse);

      const result = await streamingTypeService.getStreamingTypeByName('Netflix');

      expect(result).toEqual(mockStreamingType);
      expect(mockRepository.findByName).toHaveBeenCalledWith('Netflix');
    });

    it('should throw error when streaming type not found by name', async () => {
      mockRepository.findByName.mockResolvedValue(null);

      await expect(streamingTypeService.getStreamingTypeByName('invalid')).rejects.toThrow(
        new StreamingServiceError(ErrorMessages.STREAMING_TYPE_NOT_FOUND, 404),
      );
    });
  });

  describe('createStreamingType', () => {
    it('should create streaming type with valid data', async () => {
      const newType: IStreamingTypeCreate = {
        name: 'Disney+',
        categories: [{ id: 1, name: 'Movies' }],
      };
      mockRepository.findByName.mockResolvedValue(null);
      mockRepository.create.mockResolvedValue({ ...newType, _id: 'new1' } as IStreamingType);

      const result = await streamingTypeService.createStreamingType(newType);

      expect(result).toBeDefined();
      expect(mockRepository.create).toHaveBeenCalledWith(newType);
    });

    it('should throw error if name already exists', async () => {
      const newType: IStreamingTypeCreate = {
        name: 'Netflix',
        categories: [{ id: 1, name: 'Movies' }],
      };
      mockRepository.findByName.mockResolvedValue(mockStreamingType as IStreamingTypeResponse);
      await expect(streamingTypeService.createStreamingType(newType)).rejects.toThrow(
        new StreamingServiceError(ErrorMessages.STREAMING_TYPE_NAME_EXISTS, 400),
      );
    });

    it('should throw error if name is missing', async () => {
      const invalidType: IStreamingTypeCreate = {
        categories: [{ id: 1, name: 'Movies' }],
      } as IStreamingTypeCreate;
      await expect(streamingTypeService.createStreamingType(invalidType)).rejects.toThrow(
        new StreamingServiceError(ErrorMessages.STREAMING_TYPE_NAME_REQUIRED, 400),
      );
    });

    it('should throw error if categories are missing', async () => {
      const invalidType: IStreamingTypeCreate = {
        name: 'Netflix',
      } as IStreamingTypeCreate;
      await expect(streamingTypeService.createStreamingType(invalidType)).rejects.toThrow(
        new StreamingServiceError(ErrorMessages.STREAMING_TYPE_CATEGORIES_REQUIRED, 400),
      );
    });

    it('should throw error if a category name is empty', async () => {
      const invalidType: IStreamingTypeCreate = {
        name: 'Netflix',
        categories: [{ id: 1 }],
      } as IStreamingTypeCreate;
      await expect(streamingTypeService.createStreamingType(invalidType)).rejects.toThrow(
        new StreamingServiceError(ErrorMessages.STREAMING_TYPE_INVALID_DATA, 400),
      );
    });

    it('should throw error if has two categories with the same id', async () => {
      const invalidType: IStreamingTypeCreate = {
        name: 'Netflix',
        categories: [
          { id: 1, name: 'Movies' },
          { id: 1, name: 'Series' },
        ],
      };
      await expect(streamingTypeService.createStreamingType(invalidType)).rejects.toThrow(
        new StreamingServiceError(ErrorMessages.STREAMING_TYPE_DUPLICATE_CATEGORY, 400),
      );
    });
  });

  describe('addCategoryToStreamingType', () => {
    it('should add new categories successfully', async () => {
      const newCategories: ICategory[] = [{ id: 3, name: 'Documentaries' }];
      mockRepository.findById.mockResolvedValue(mockStreamingType as IStreamingTypeResponse);
      mockRepository.addCategory.mockResolvedValue({
        ...mockStreamingType,
        categories: [...(mockStreamingType.categories || []), ...newCategories],
      } as IStreamingTypeResponse);

      const result = await streamingTypeService.addCategoryToStreamingType('type1', newCategories);

      expect(result).toBeDefined();
      expect(mockRepository.addCategory).toHaveBeenCalledWith('type1', newCategories);
    });

    it('should throw error if streaming type not found', async () => {
      const newCategories: ICategory[] = [{ id: 3, name: 'Documentaries' }];
      mockRepository.findById.mockResolvedValue(null);
      await expect(streamingTypeService.addCategoryToStreamingType('type1', newCategories)).rejects.toThrow(
        new StreamingServiceError(ErrorMessages.STREAMING_TYPE_NOT_FOUND, 404),
      );
    });

    it('should throw error if categories already exist', async () => {
      const existingCategories: ICategory[] = [{ id: 1, name: 'Movies' }];
      mockRepository.findById.mockResolvedValue(mockStreamingType as IStreamingTypeResponse);
      await expect(streamingTypeService.addCategoryToStreamingType('type1', existingCategories)).rejects.toThrow(
        new StreamingServiceError(ErrorMessages.STREAMING_TYPE_CATEGORY_ALREADY_EXISTS, 400),
      );
    });
  });

  describe('updateStreamingType', () => {
    it('should update streaming type with valid data', async () => {
      const updatedType: Partial<IStreamingType> = {
        _id: 'type2',
        name: 'Netflix',
        categories: [{ id: 1, name: 'Movies' }],
      };
      mockRepository.findById.mockResolvedValue(mockStreamingType as IStreamingTypeResponse);
      mockRepository.update.mockResolvedValue({
        ...mockStreamingType,
        ...updatedType,
      } as IStreamingTypeResponse);

      const result = await streamingTypeService.updateStreamingType('type1', updatedType);

      expect(result).toEqual({ ...mockStreamingType, ...updatedType });
      expect(mockRepository.update).toHaveBeenCalledWith('type1', updatedType);
    });

    it('should throw error if streaming type not found', async () => {
      const updatedType: Partial<IStreamingType> = {
        _id: 'type2',
        name: 'Netflix',
      };
      mockRepository.findById.mockResolvedValue(null);
      await expect(streamingTypeService.updateStreamingType('type1', updatedType)).rejects.toThrow(
        new StreamingServiceError(ErrorMessages.STREAMING_TYPE_NOT_FOUND, 404),
      );
    });
  });

  describe('removeCategoryFromStreamingType', () => {
    it('should remove categories successfully', async () => {
      const categoriesToRemove: Partial<ICategory>[] = [{ id: 1 }];
      mockRepository.findById.mockResolvedValue(mockStreamingType as IStreamingTypeResponse);
      mockRepository.removeCategory.mockResolvedValue({
        ...mockStreamingType,
        categories: [mockStreamingType.categories?.[1]],
      } as IStreamingTypeResponse);

      const result = await streamingTypeService.removeCategoryFromStreamingType('type1', categoriesToRemove);

      expect(result).toBeDefined();
      expect(mockRepository.removeCategory).toHaveBeenCalledWith('type1', categoriesToRemove);
    });

    it('should throw error if categories not found in streaming type', async () => {
      const invalidCategories: Partial<ICategory>[] = [{ id: 3 }];
      mockRepository.findById.mockResolvedValue(mockStreamingType as IStreamingTypeResponse);

      await expect(streamingTypeService.removeCategoryFromStreamingType('type1', invalidCategories)).rejects.toThrow(
        new StreamingServiceError(`${ErrorMessages.STREAMING_TYPE_CATEGORY_NOT_FOUND}: 3`, 404),
      );
    });
  });

  describe('deleteStreamingType', () => {
    it('should delete streaming type successfully', async () => {
      const deletedType: Partial<IStreamingTypeResponse> = {
        _id: 'type1',
        name: 'Netflix',
        categories: [{ id: 1, name: 'Movies' }],
      };
      mockRepository.delete.mockResolvedValue(deletedType as IStreamingTypeResponse);
      const result = await streamingTypeService.deleteStreamingType('type1');
      expect(result).toEqual(deletedType);
      expect(mockRepository.delete).toHaveBeenCalledWith('type1');
    });

    it('should throw error if streaming type not found', async () => {
      mockRepository.delete.mockResolvedValue(null);
      await expect(streamingTypeService.deleteStreamingType('type1')).rejects.toThrow(
        new StreamingServiceError(ErrorMessages.STREAMING_TYPE_NOT_FOUND, 404),
      );
    });
  });

  describe('addGenreToStreamingType', () => {
    const mockGenres: IGenreReference[] = [
      { _id: new Types.ObjectId(), id: 1, name: 'Action' },
      { _id: new Types.ObjectId(), id: 2, name: 'Comedy' }
    ];

    it('should add genres to streaming type when valid', async () => {
      const streamingTypeId = 'validId';
      const updatedStreamingType = { ...mockStreamingType, supportedGenres: mockGenres };
      
      mockRepository.addGenre.mockResolvedValue(updatedStreamingType as IStreamingTypeResponse);
      mockGenreRepository.findById.mockResolvedValue({ _id: 'genreId', name: 'Action', id: 1 });
      
      const result = await streamingTypeService.addGenreToStreamingType(streamingTypeId, mockGenres);
      
      expect(result).toEqual(updatedStreamingType);
      expect(mockRepository.addGenre).toHaveBeenCalledWith(streamingTypeId, mockGenres);
      expect(mockGenreRepository.findById).toHaveBeenCalledTimes(2);
    });

    it('should throw error when streaming type not found', async () => {
      mockRepository.addGenre.mockResolvedValue(null);
      mockGenreRepository.findById.mockResolvedValue({ _id: 'genreId', name: 'Action', id: 1 });
      
      await expect(streamingTypeService.addGenreToStreamingType('invalidId', mockGenres))
        .rejects.toThrow(new StreamingServiceError(ErrorMessages.STREAMING_TYPE_NOT_FOUND, 404));
    });

    it('should throw error when genres array is empty', async () => {
      await expect(streamingTypeService.addGenreToStreamingType('validId', []))
        .rejects.toThrow(new StreamingServiceError(ErrorMessages.STREAMING_TYPE_CATEGORIES_REQUIRED, 400));
    });

    it('should throw error when genre has invalid _id', async () => {
      const invalidGenres = [{ id: 1, name: 'Action' }] as IGenreReference[];
      
      await expect(streamingTypeService.addGenreToStreamingType('validId', invalidGenres))
        .rejects.toThrow(new StreamingServiceError(ErrorMessages.STREAMING_TYPE_CATEGORIES_INVALID_ID, 400));
    });

    it('should throw error when genre does not exist in database', async () => {
      mockGenreRepository.findById.mockResolvedValue(null);
      
      await expect(streamingTypeService.addGenreToStreamingType('validId', mockGenres))
        .rejects.toThrow(new StreamingServiceError(ErrorMessages.GENRE_NOT_FOUND, 404));
    });

    it('should throw error when genre already exists in streaming type', async () => {
      const streamingTypeId = 'validId';
      const existingGenres = [
        { _id: new Types.ObjectId(), id: 1, name: 'Action' }
      ];
      
      // Mock the streaming type with existing genres
      mockRepository.findById.mockResolvedValue({
        _id: streamingTypeId,
        name: 'Netflix',
        supportedGenres: existingGenres
      } as IStreamingTypeResponse);
      
      // Mock the genre repository to validate the genre
      mockGenreRepository.findById.mockResolvedValue({ 
        _id: 'genreId', 
        id: 1, 
        name: 'Action' 
      });
      
      // Try to add the same genre again
      await expect(streamingTypeService.addGenreToStreamingType(streamingTypeId, existingGenres))
        .rejects.toThrow(new StreamingServiceError(ErrorMessages.STREAMING_TYPE_GENRE_NAME_EXISTS('Action'), 400));
    });
  });
});
