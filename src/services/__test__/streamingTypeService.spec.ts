import { StreamingTypeService } from '../streamingTypeService';
import { IStreamingTypeRepository } from '../../interfaces/repositories';
import { StreamingServiceError } from '../../middleware/errorHandler';
import { IStreamingType } from '../../models/streamingTypesModel';
import { ICategory, IStreamingTypeCreate, IStreamingTypeResponse } from '../../interfaces/streamingTypes';

describe('StreamingTypeService', () => {
  let streamingTypeService: StreamingTypeService;
  let mockRepository: jest.Mocked<IStreamingTypeRepository>;

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
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      addCategory: jest.fn(),
      removeCategory: jest.fn(),
    } as jest.Mocked<IStreamingTypeRepository>;

    streamingTypeService = new StreamingTypeService(mockRepository);
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
        new StreamingServiceError('Streaming type not found', 404),
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
        new StreamingServiceError('Streaming type name already exists', 400),
      );
    });

    it('should throw error if name is missing', async () => {
      const invalidType: IStreamingTypeCreate = {
        categories: [{ id: 1, name: 'Movies' }],
      } as IStreamingTypeCreate;
      await expect(streamingTypeService.createStreamingType(invalidType)).rejects.toThrow(
        new StreamingServiceError('Name is required', 400),
      );
    });

    it('should throw error if categories are missing', async () => {
      const invalidType: IStreamingTypeCreate = {
        name: 'Netflix',
      } as IStreamingTypeCreate;
      await expect(streamingTypeService.createStreamingType(invalidType)).rejects.toThrow(
        new StreamingServiceError('At least one category is required', 400),
      );
    });

    it('should throw error if a category name is empty', async () => {
      const invalidType: IStreamingTypeCreate = {
        name: 'Netflix',
        categories: [{ id: 1 }],
      } as IStreamingTypeCreate;
      await expect(streamingTypeService.createStreamingType(invalidType)).rejects.toThrow(
        new StreamingServiceError('Invalid category data', 400),
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
        new StreamingServiceError('Duplicate category ID', 400),
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
        new StreamingServiceError('Streaming type not found', 404),
      );
    });

    it('should throw error if categories already exist', async () => {
      const existingCategories: ICategory[] = [{ id: 1, name: 'Movies' }];
      mockRepository.findById.mockResolvedValue(mockStreamingType as IStreamingTypeResponse);
      await expect(streamingTypeService.addCategoryToStreamingType('type1', existingCategories)).rejects.toThrow(
        new StreamingServiceError('Categories already exist', 400),
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
        new StreamingServiceError('Streaming type not found', 404),
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
        new StreamingServiceError('Categories not found in streaming type: 3', 404),
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
        new StreamingServiceError('Streaming type not found', 404),
      );
    });
  });
});
