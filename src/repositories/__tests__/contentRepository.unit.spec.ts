import { Types } from 'mongoose';
import { ContentRepository } from '../contentRepository';
import Content from '../../models/contentModel';
import { IContentResponse } from '../../interfaces/content';
import { StreamingServiceError } from '../../middleware/errorHandler';
import { ErrorMessages } from '../../constants/errorMessages';
import { IGenreReference } from '../../interfaces/streamingTypes';

jest.mock('../../models/contentModel');

describe('ContentRepository', () => {
  let contentRepository: ContentRepository;
  let mockContent: IContentResponse;
  let mockContents: IContentResponse[];
  let mockGenre: IGenreReference;

  beforeEach(() => {
    contentRepository = new ContentRepository();
    mockGenre = {
      _id: new Types.ObjectId(),
      name: 'Action',
      id: 1,
      poster: 'poster.jpg'
    };

    mockContent = {
      _id: new Types.ObjectId(),
      title: 'Test Content',
      contentType: 'movie',
      releaseDate: '2024-03-20T00:00:00.000Z',
      plot: 'Test plot',
      cast: ['Actor 1', 'Actor 2'],
      genre: [mockGenre],
      rating: 8.5,
      poster: 'poster.jpg',
      url: 'content.mp4',
      createdAt: new Date('2024-03-20T00:00:00.000Z'),
      updatedAt: new Date('2024-03-20T00:00:00.000Z')
    } as IContentResponse;

    mockContents = [
      mockContent,
      {
        ...mockContent,
        _id: new Types.ObjectId(),
        title: 'Test Content 2'
      }
    ];

    (Content.find as jest.Mock).mockClear();
    (Content.findById as jest.Mock).mockClear();
    (Content.create as jest.Mock).mockClear();
    (Content.insertMany as jest.Mock).mockClear();
    (Content.findByIdAndUpdate as jest.Mock).mockClear();
    (Content.findByIdAndDelete as jest.Mock).mockClear();
    (Content.findOne as jest.Mock).mockClear();
  });

  describe('findAll', () => {
    it('should return all contents with pagination', async () => {
      (Content.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue(mockContents)
          })
        })
      });

      const result = await contentRepository.findAll(0, 10);

      expect(Content.find).toHaveBeenCalled();
      expect(result).toEqual(mockContents);
    });
  });

  describe('findById', () => {
    it('should return content by id', async () => {
      (Content.findById as jest.Mock).mockResolvedValue(mockContent);

      const result = await contentRepository.findById(mockContent._id.toString());

      expect(Content.findById).toHaveBeenCalledWith(mockContent._id.toString());
      expect(result).toEqual(mockContent);
    });

    it('should return null if content not found', async () => {
      (Content.findById as jest.Mock).mockResolvedValue(null);

      const result = await contentRepository.findById(mockContent._id.toString());

      expect(Content.findById).toHaveBeenCalledWith(mockContent._id.toString());
      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create a new content', async () => {
      (Content.findOne as jest.Mock).mockResolvedValue(null);
      (Content.create as jest.Mock).mockResolvedValue(mockContent);

      const result = await contentRepository.create(mockContent);

      expect(Content.findOne).toHaveBeenCalledWith({
        title: mockContent.title,
        contentType: mockContent.contentType
      });
      expect(Content.create).toHaveBeenCalledWith(mockContent);
      expect(result).toEqual(mockContent);
    });

    it('should throw error if content with same title and type exists', async () => {
      (Content.findOne as jest.Mock).mockResolvedValue(mockContent);

      await expect(contentRepository.create(mockContent))
        .rejects
        .toThrow(new StreamingServiceError(
          `${ErrorMessages.CONTENT_TITLE_ALREADY_EXISTS} for the type ${mockContent.contentType}`,
          400
        ));
    });
  });

  describe('createManyMovies', () => {
    it('should create multiple contents', async () => {
      (Content.find as jest.Mock).mockResolvedValue([]);
      (Content.insertMany as jest.Mock).mockResolvedValue(mockContents);

      const result = await contentRepository.createManyMovies(mockContents);

      expect(Content.insertMany).toHaveBeenCalledWith(mockContents);
      expect(result).toEqual(mockContents);
    });

    it('should create multiple contents with void type', async () => {
      (Content.find as jest.Mock).mockResolvedValue([]);
      const mockContents = [{
        title: 'Test Content',
        contentType: null,
        releaseDate: '2024-03-20T00:00:00.000Z',
        plot: 'Test plot',
        cast: ['Actor 1', 'Actor 2'],
      }] as unknown as IContentResponse[];
      (Content.insertMany as jest.Mock).mockResolvedValue(mockContents);

      const result = await contentRepository.createManyMovies(mockContents);

      expect(Content.insertMany).toHaveBeenCalledWith(mockContents);
      expect(result).toEqual(mockContents);
    });

    it('should throw error if any content with same title and type exists', async () => {
      (Content.find as jest.Mock).mockResolvedValue([mockContent]);

      await expect(contentRepository.createManyMovies(mockContents))
        .rejects
        .toThrow(new StreamingServiceError(
          `Duplicate titles found: Tipo ${mockContent.contentType}: ${mockContent.title}`,
          400
        ));
    });
  });

  describe('update', () => {
    it('should update content', async () => {
      (Content.findByIdAndUpdate as jest.Mock).mockResolvedValue(mockContent);

      const result = await contentRepository.update(mockContent._id.toString(), mockContent);

      expect(Content.findByIdAndUpdate).toHaveBeenCalledWith(
        mockContent._id.toString(),
        { $set: mockContent },
        { new: true, runValidators: true }
      );
      expect(result).toEqual(mockContent);
    });

    it('should return null if content not found', async () => {
      (Content.findByIdAndUpdate as jest.Mock).mockResolvedValue(null);

      const result = await contentRepository.update(mockContent._id.toString(), mockContent);

      expect(Content.findByIdAndUpdate).toHaveBeenCalledWith(
        mockContent._id.toString(),
        { $set: mockContent },
        { new: true, runValidators: true }
      );
      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete content', async () => {
      (Content.findByIdAndDelete as jest.Mock).mockResolvedValue(mockContent);

      const result = await contentRepository.delete(mockContent._id.toString());

      expect(Content.findByIdAndDelete).toHaveBeenCalledWith(mockContent._id.toString());
      expect(result).toEqual(mockContent);
    });

    it('should return null if content not found', async () => {
      (Content.findByIdAndDelete as jest.Mock).mockResolvedValue(null);

      const result = await contentRepository.delete(mockContent._id.toString());

      expect(Content.findByIdAndDelete).toHaveBeenCalledWith(mockContent._id.toString());
      expect(result).toBeNull();
    });
  });

  describe('findByGenre', () => {
    it('should return contents by genre with pagination', async () => {
      (Content.findByGenre as jest.Mock).mockResolvedValue(mockContents);

      const result = await contentRepository.findByGenre('Action', 0, 10);

      expect(Content.findByGenre).toHaveBeenCalledWith('Action', 0, 10);
      expect(result).toEqual(mockContents);
    });

    it('should return null if no contents found', async () => {
      (Content.findByGenre as jest.Mock).mockResolvedValue(null);

      const result = await contentRepository.findByGenre('Action', 0, 10);

      expect(Content.findByGenre).toHaveBeenCalledWith('Action', 0, 10);
      expect(result).toBeNull();
    });
  });

  describe('findByTitle', () => {
    it('should return contents by title with pagination', async () => {
      (Content.findByTitle as jest.Mock).mockResolvedValue(mockContents);

      const result = await contentRepository.findByTitle('Test', 0, 10);

      expect(Content.findByTitle).toHaveBeenCalledWith('Test', 0, 10);
      expect(result).toEqual(mockContents);
    });

    it('should return null if no contents found', async () => {
      (Content.findByTitle as jest.Mock).mockResolvedValue(null);

      const result = await contentRepository.findByTitle('Test', 0, 10);

      expect(Content.findByTitle).toHaveBeenCalledWith('Test', 0, 10);
      expect(result).toBeNull();
    });
  });
}); 