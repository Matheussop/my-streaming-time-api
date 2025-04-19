import { Types } from 'mongoose';
import { StreamingTypeRepository } from '../streamingTypeRepository';
import StreamingTypes from '../../models/streamingTypesModel';
import { IStreamingTypeResponse, IStreamingTypeCreate, IStreamingTypeUpdate, IGenreReference } from '../../interfaces/streamingTypes';

// Mock do mongoose
jest.mock('../../models/streamingTypesModel');

describe('StreamingTypeRepository', () => {
  let streamingTypeRepository: StreamingTypeRepository;
  let mockStreamingType: IStreamingTypeResponse;
  let mockStreamingTypes: IStreamingTypeResponse[];
  let mockGenreReference: IGenreReference;

  beforeEach(() => {
    streamingTypeRepository = new StreamingTypeRepository();
    mockGenreReference = {
      _id: new Types.ObjectId(),
      id: 1,
      name: 'Action',
      poster: 'https://example.com/poster.jpg'
    };

    mockStreamingType = {
      _id: new Types.ObjectId(),
      name: 'Test Streaming Type',
      description: 'Test description',
      supportedGenres: [mockGenreReference],
      isActive: true,
      createdAt: new Date('2024-03-20T00:00:00.000Z'),
      updatedAt: new Date('2024-03-20T00:00:00.000Z')
    } as IStreamingTypeResponse;

    mockStreamingTypes = [
      mockStreamingType,
      {
        ...mockStreamingType,
        _id: new Types.ObjectId(),
        name: 'Test Streaming Type 2'
      }
    ];

    (StreamingTypes.find as jest.Mock).mockClear();
    (StreamingTypes.findById as jest.Mock).mockClear();
    (StreamingTypes.findByName as jest.Mock).mockClear();
    (StreamingTypes.create as jest.Mock).mockClear();
    (StreamingTypes.findByIdAndUpdate as jest.Mock).mockClear();
    (StreamingTypes.findByIdAndDelete as jest.Mock).mockClear();
    (StreamingTypes.findByGenreName as jest.Mock).mockClear();
    (StreamingTypes.deleteByGenresName as jest.Mock).mockClear();
  });

  describe('findAll', () => {
    it('should return all streaming types with pagination', async () => {
      (StreamingTypes.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue(mockStreamingTypes)
            })
          })
        })
      });

      const result = await streamingTypeRepository.findAll(0, 10);

      expect(StreamingTypes.find).toHaveBeenCalled();
      expect(result).toEqual(mockStreamingTypes);
    });
  });

  describe('findById', () => {
    it('should return streaming type by id', async () => {
      (StreamingTypes.findById as jest.Mock).mockResolvedValue(mockStreamingType);

      const result = await streamingTypeRepository.findById(mockStreamingType._id.toString());

      expect(StreamingTypes.findById).toHaveBeenCalledWith(mockStreamingType._id.toString());
      expect(result).toEqual(mockStreamingType);
    });

    it('should return null if streaming type not found', async () => {
      (StreamingTypes.findById as jest.Mock).mockResolvedValue(null);

      const result = await streamingTypeRepository.findById(mockStreamingType._id.toString());

      expect(StreamingTypes.findById).toHaveBeenCalledWith(mockStreamingType._id.toString());
      expect(result).toBeNull();
    });
  });

  describe('findByName', () => {
    it('should return streaming type by name', async () => {
      (StreamingTypes.findByName as jest.Mock).mockResolvedValue(mockStreamingType);

      const result = await streamingTypeRepository.findByName('Test Streaming Type');

      expect(StreamingTypes.findByName).toHaveBeenCalledWith('Test Streaming Type');
      expect(result).toEqual(mockStreamingType);
    });

    it('should return null if streaming type not found', async () => {
      (StreamingTypes.findByName as jest.Mock).mockResolvedValue(null);

      const result = await streamingTypeRepository.findByName('Test Streaming Type');

      expect(StreamingTypes.findByName).toHaveBeenCalledWith('Test Streaming Type');
      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create a new streaming type', async () => {
      const streamingTypeData: IStreamingTypeCreate = {
        name: 'Test Streaming Type',
        description: 'Test description',
        supportedGenres: [mockGenreReference],
        isActive: true
      };

      (StreamingTypes.create as jest.Mock).mockResolvedValue(mockStreamingType);

      const result = await streamingTypeRepository.create(streamingTypeData);

      expect(StreamingTypes.create).toHaveBeenCalledWith(streamingTypeData);
      expect(result).toEqual(mockStreamingType);
    });
  });

  describe('update', () => {
    it('should update streaming type', async () => {
      const updateData: IStreamingTypeUpdate = {
        name: 'Updated Streaming Type',
        description: 'Updated description'
      };

      (StreamingTypes.findByIdAndUpdate as jest.Mock).mockResolvedValue({
        ...mockStreamingType,
        ...updateData
      });

      const result = await streamingTypeRepository.update(mockStreamingType._id.toString(), updateData);

      expect(StreamingTypes.findByIdAndUpdate).toHaveBeenCalledWith(
        mockStreamingType._id.toString(),
        { $set: updateData },
        { new: true, runValidators: true }
      );
      expect(result).toEqual({
        ...mockStreamingType,
        ...updateData
      });
    });

    it('should return null if streaming type not found', async () => {
      const updateData: IStreamingTypeUpdate = {
        name: 'Updated Streaming Type'
      };

      (StreamingTypes.findByIdAndUpdate as jest.Mock).mockResolvedValue(null);

      const result = await streamingTypeRepository.update(mockStreamingType._id.toString(), updateData);

      expect(StreamingTypes.findByIdAndUpdate).toHaveBeenCalledWith(
        mockStreamingType._id.toString(),
        { $set: updateData },
        { new: true, runValidators: true }
      );
      expect(result).toBeNull();
    });
  });

  describe('addGenre', () => {
    it('should add genres to streaming type', async () => {
      const newGenres: IGenreReference[] = [
        {
          _id: new Types.ObjectId(),
          id: 2,
          name: 'Drama',
          poster: 'https://example.com/drama.jpg'
        }
      ];

      (StreamingTypes.findByIdAndUpdate as jest.Mock).mockResolvedValue({
        ...mockStreamingType,
        supportedGenres: [...(mockStreamingType.supportedGenres || []), ...newGenres]
      });

      const result = await streamingTypeRepository.addGenre(mockStreamingType._id.toString(), newGenres);

      expect(StreamingTypes.findByIdAndUpdate).toHaveBeenCalledWith(
        mockStreamingType._id.toString(),
        { $addToSet: { supportedGenres: { $each: newGenres } } },
        { new: true, runValidators: true }
      );
      expect(result).toEqual({
        ...mockStreamingType,
        supportedGenres: [...(mockStreamingType.supportedGenres || []), ...newGenres]
      });
    });

    it('should return null if streaming type not found', async () => {
      const newGenres: IGenreReference[] = [
        {
          _id: new Types.ObjectId(),
          id: 2,
          name: 'Drama',
          poster: 'https://example.com/drama.jpg'
        }
      ];

      (StreamingTypes.findByIdAndUpdate as jest.Mock).mockResolvedValue(null);

      const result = await streamingTypeRepository.addGenre(mockStreamingType._id.toString(), newGenres);

      expect(StreamingTypes.findByIdAndUpdate).toHaveBeenCalledWith(
        mockStreamingType._id.toString(),
        { $addToSet: { supportedGenres: { $each: newGenres } } },
        { new: true, runValidators: true }
      );
      expect(result).toBeNull();
    });
  });

  describe('findByGenreName', () => {
    it('should return streaming type by genre name', async () => {
      (StreamingTypes.findByGenreName as jest.Mock).mockResolvedValue(mockStreamingType);

      const result = await streamingTypeRepository.findByGenreName('Action', mockStreamingType._id.toString());

      expect(StreamingTypes.findByGenreName).toHaveBeenCalledWith('Action', mockStreamingType._id.toString());
      expect(result).toEqual(mockStreamingType);
    });

    it('should return null if streaming type not found', async () => {
      (StreamingTypes.findByGenreName as jest.Mock).mockResolvedValue(null);

      const result = await streamingTypeRepository.findByGenreName('Action', mockStreamingType._id.toString());

      expect(StreamingTypes.findByGenreName).toHaveBeenCalledWith('Action', mockStreamingType._id.toString());
      expect(result).toBeNull();
    });
  });

  describe('deleteByGenresName', () => {
    it('should delete genres from streaming type by name', async () => {
      const genreNames = ['Action'];

      (StreamingTypes.deleteByGenresName as jest.Mock).mockResolvedValue({
        ...mockStreamingType,
        supportedGenres: []
      });

      const result = await streamingTypeRepository.deleteByGenresName(genreNames, mockStreamingType._id.toString());

      expect(StreamingTypes.deleteByGenresName).toHaveBeenCalledWith(genreNames, mockStreamingType._id.toString());
      expect(result).toEqual({
        ...mockStreamingType,
        supportedGenres: []
      });
    });

    it('should return null if streaming type not found', async () => {
      const genreNames = ['Action'];

      (StreamingTypes.deleteByGenresName as jest.Mock).mockResolvedValue(null);

      const result = await streamingTypeRepository.deleteByGenresName(genreNames, mockStreamingType._id.toString());

      expect(StreamingTypes.deleteByGenresName).toHaveBeenCalledWith(genreNames, mockStreamingType._id.toString());
      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete streaming type', async () => {
      (StreamingTypes.findByIdAndDelete as jest.Mock).mockResolvedValue(mockStreamingType);

      const result = await streamingTypeRepository.delete(mockStreamingType._id.toString());

      expect(StreamingTypes.findByIdAndDelete).toHaveBeenCalledWith(mockStreamingType._id.toString());
      expect(result).toEqual(mockStreamingType);
    });

    it('should return null if streaming type not found', async () => {
      (StreamingTypes.findByIdAndDelete as jest.Mock).mockResolvedValue(null);

      const result = await streamingTypeRepository.delete(mockStreamingType._id.toString());

      expect(StreamingTypes.findByIdAndDelete).toHaveBeenCalledWith(mockStreamingType._id.toString());
      expect(result).toBeNull();
    });
  });
});
