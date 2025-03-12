import { IContentService } from "../interfaces/services";
import { ContentRepository } from "../repositories/contentRepository";

export class ContentService implements IContentService {
  constructor(private contentRepository: ContentRepository) {}

  async getContentList(page: number, limit: number) {
    const mediaList = await this.contentRepository.findAll(page, limit);
    return mediaList; 
  }

  async getContentById(id: string) {
    const media = await this.contentRepository.findById(id);
    return media;
  }

  async getContentByGenre(genre: string, page: number, limit: number) {
    const mediaList = await this.contentRepository.findByGenre(genre, page, limit);
    return mediaList;
  }

  async getContentByTitle(title: string, page: number, limit: number) {
    const mediaList = await this.contentRepository.findByTitle(title, page, limit);
    return mediaList;
  }
}
