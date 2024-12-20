import { StreamingTypeRepository } from '../streamingTypeRepository';
import StreamingTypes from '../../models/streamingTypesModel';
import { IStreamingTypeCreate, IStreamingTypeResponse, ICategory } from '../../interfaces/streamingTypes';

// Mock do mongoose
jest.mock('../../models/streamingTypesModel');

describe('StreamingTypeRepository', () => {
  let repository: StreamingTypeRepository;
  
  const mockCategory: ICategory = {
    id: 1,
    name: 'Ação'
  };

  const mockStreamingType: IStreamingTypeResponse = {
    _id: '123',
    name: 'Netflix',
    categories: [mockCategory],
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockCreateData: IStreamingTypeCreate = {
    name: 'Netflix',
    categories: [mockCategory]
  };

  beforeEach(() => {
    repository = new StreamingTypeRepository();
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return a paginated list of streaming types', async () => {
      const mockFind = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([mockStreamingType])
      };

      (StreamingTypes.find as jest.Mock).mockReturnValue(mockFind);

      const result = await repository.findAll(0, 10);

      expect(result).toEqual([mockStreamingType]);
      expect(StreamingTypes.find).toHaveBeenCalled();
      expect(mockFind.sort).toHaveBeenCalledWith({ createdAt: -1 });
      expect(mockFind.skip).toHaveBeenCalledWith(0);
      expect(mockFind.limit).toHaveBeenCalledWith(10);
    });
  });

  describe('findById', () => {
    it('should return a streaming type by ID', async () => {
      (StreamingTypes.findById as jest.Mock).mockResolvedValue(mockStreamingType);

      const result = await repository.findById('123');

      expect(result).toEqual(mockStreamingType);
      expect(StreamingTypes.findById).toHaveBeenCalledWith('123');
    });

    it('should return null when ID is not found', async () => {
      (StreamingTypes.findById as jest.Mock).mockResolvedValue(null);

      const result = await repository.findById('999');

      expect(result).toBeNull();
    });
  });

  describe('findByName', () => {
    it('should return a streaming type by name', async () => {
      (StreamingTypes.findOne as jest.Mock).mockResolvedValue(mockStreamingType);

      const result = await repository.findByName('Netflix');

      expect(result).toEqual(mockStreamingType);
      expect(StreamingTypes.findOne).toHaveBeenCalledWith({
        name: new RegExp('^Netflix$', 'i')
      });
    });

    it('should return null when name is not found', async () => {
      (StreamingTypes.findOne as jest.Mock).mockResolvedValue(null);

      const result = await repository.findByName('InvalidName');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create a new streaming type', async () => {
      const mockSave = jest.fn().mockResolvedValue(mockStreamingType);
      (StreamingTypes as unknown as jest.Mock).mockImplementation(() => ({
        save: mockSave
      }));

      const result = await repository.create(mockCreateData);

      expect(result).toEqual(mockStreamingType);
      expect(StreamingTypes).toHaveBeenCalledWith(mockCreateData);
      expect(mockSave).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update an existing streaming type', async () => {
      const updateData = { name: 'Netflix Updated' };
      (StreamingTypes.findByIdAndUpdate as jest.Mock).mockResolvedValue({
        ...mockStreamingType,
        ...updateData
      });

      const result = await repository.update('123', updateData);

      expect(result?.name).toBe('Netflix Updated');
      expect(StreamingTypes.findByIdAndUpdate).toHaveBeenCalledWith(
        '123',
        { $set: updateData },
        { new: true, runValidators: true }
      );
    });
  });

  describe('delete', () => {
    it('should delete a streaming type', async () => {
      (StreamingTypes.findByIdAndDelete as jest.Mock).mockResolvedValue(mockStreamingType);

      const result = await repository.delete('123');

      expect(result).toEqual(mockStreamingType);
      expect(StreamingTypes.findByIdAndDelete).toHaveBeenCalledWith('123');
    });

    it('should return null when ID is not found for deletion', async () => {
      (StreamingTypes.findByIdAndDelete as jest.Mock).mockResolvedValue(null);

      const result = await repository.delete('999');

      expect(result).toBeNull();
    });
  });

  describe('addCategory', () => {
    it('should add categories to a streaming type', async () => {
      const newCategory: ICategory = { id: 2, name: 'Drama' };
      const updatedStreamingType = {
        ...mockStreamingType,
        categories: [...mockStreamingType.categories, newCategory]
      };

      (StreamingTypes.findByIdAndUpdate as jest.Mock).mockResolvedValue(updatedStreamingType);

      const result = await repository.addCategory('123', [newCategory]);

      expect(result?.categories).toContainEqual(newCategory);
      expect(StreamingTypes.findByIdAndUpdate).toHaveBeenCalledWith(
        '123',
        { $addToSet: { categories: [newCategory] } },
        { new: true, runValidators: true }
      );
    });
  });

  describe('removeCategory', () => {
    it('should remove categories from a streaming type', async () => {
      const categoriesToRemove: Partial<ICategory>[] = [{ id: 1 }];
      const updatedStreamingType = {
        ...mockStreamingType,
        categories: []
      };

      (StreamingTypes.findByIdAndUpdate as jest.Mock).mockResolvedValue(updatedStreamingType);

      const result = await repository.removeCategory('123', categoriesToRemove);

      expect(result?.categories).toHaveLength(0);
      expect(StreamingTypes.findByIdAndUpdate).toHaveBeenCalledWith(
        '123',
        { $pull: { categories: { id: { $in: [1] } } } },
        { new: true }
      );
    });
  });
}); 