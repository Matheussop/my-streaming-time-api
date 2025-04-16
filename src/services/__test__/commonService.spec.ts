import { Types } from "mongoose";
import { IContentResponse } from "../../interfaces/content";
import { ContentRepository } from "../../repositories/contentRepository";
import { ContentService } from "../commonService";
import { generateValidObjectId } from "../../util/test/generateValidObjectId";

describe('CommonService', () => {
  let commonService: ContentService;
  let mockContentRepository: jest.Mocked<ContentRepository>;

  const mockContent: Partial<IContentResponse> = {
    _id: generateValidObjectId() as Types.ObjectId,
    title: 'Test',
    genre: [{
      _id: generateValidObjectId(),
      name: 'Action',
      id: 1
    }],
    rating: 4.5,
  };
  beforeEach(() => {
    mockContentRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByGenre: jest.fn(),
      findByTitle: jest.fn()
    } as unknown as jest.Mocked<ContentRepository>;

    commonService = new ContentService(mockContentRepository);
  });

  describe('getContentList', () => {
    it('should return all content', async () => {
      mockContentRepository.findAll.mockResolvedValue([mockContent as IContentResponse]);
      const result = await commonService.getContentList(1, 10);
      expect(result).toEqual([mockContent as IContentResponse]);
      expect(mockContentRepository.findAll).toHaveBeenCalledWith(1, 10);
    });
  });

  describe('getContentById', () => {
    it('should return content by id', async () => {
      mockContentRepository.findById.mockResolvedValue(mockContent as IContentResponse);
      const result = await commonService.getContentById(mockContent._id as unknown as string);
      expect(result).toEqual(mockContent as IContentResponse);
      expect(mockContentRepository.findById).toHaveBeenCalledWith(mockContent._id as unknown as string);
    });
  });

  describe('getContentByGenre', () => {
    it('should return content by genre', async () => {
      mockContentRepository.findByGenre.mockResolvedValue([mockContent as IContentResponse]);
      const result = await commonService.getContentByGenre('Action', 1, 10);
      expect(result).toEqual([mockContent as IContentResponse]);
      expect(mockContentRepository.findByGenre).toHaveBeenCalledWith('Action', 1, 10);
    });
  });

  describe('getContentByTitle', () => {
    it('should return content by title', async () => {
      mockContentRepository.findByTitle.mockResolvedValue([mockContent as IContentResponse]);
      const result = await commonService.getContentByTitle('Test', 1, 10);
      expect(result).toEqual([mockContent as IContentResponse]);
      expect(mockContentRepository.findByTitle).toHaveBeenCalledWith('Test', 1, 10);
    });
  });
});
