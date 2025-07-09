import { GenreRepository } from './../repositories/genreRepository';
import { IGenreService } from "./../interfaces/services";
import { IGenreCreate, IGenreResponse, IGenreUpdate } from '../interfaces/genres';
import { StreamingServiceError } from '../middleware/errorHandler';
import { ErrorMessages } from '../constants/errorMessages';
import logger from '../config/logger';
import { Types } from 'mongoose';
import { TMDBService } from './tmdbService';

export class GenreService implements IGenreService {
  constructor(
    private genreRepository: GenreRepository,
    private tmdbService?: TMDBService
  ) {}

  async getGenreById(id: string | Types.ObjectId): Promise<IGenreResponse | null>{
    const genre = await this.genreRepository.findById(id);
    if (!genre) {
      logger.warn({
        message: ErrorMessages.GENRE_NOT_FOUND,
        genreId: id,
      })

      throw new StreamingServiceError(ErrorMessages.GENRE_NOT_FOUND, 404)
    }
    return genre
  };
  async getGenreByName(name: string): Promise<IGenreResponse | null>{
    const genre = await this.genreRepository.findByName(name);
    if (!genre) {
      logger.warn({
        message: ErrorMessages.GENRE_NOT_FOUND,
        genreName: name,
      })

      throw new StreamingServiceError(ErrorMessages.GENRE_NOT_FOUND, 404)
    }
    return genre
  };
  async getAllGenres(skip: number, limit: number): Promise<IGenreResponse[]>{
    return this.genreRepository.findAll(skip, limit);
  };

  async createGenre(genre: IGenreCreate | IGenreCreate[]): Promise<IGenreResponse | IGenreResponse[]>{
    return this.genreRepository.create(genre);
  };

  async updateGenre(id: string | Types.ObjectId, genre: IGenreUpdate): Promise<IGenreResponse | null>{
    return this.genreRepository.update(id, genre);
  };

  async deleteGenre(genreId: string | Types.ObjectId): Promise<IGenreResponse | null>{
    return this.genreRepository.delete(genreId);
  };

  /**
   * Sincroniza os gêneros do TMDB com a base de dados local
   * Busca gêneros de filmes e séries do TMDB e os salva localmente
   */
  async syncGenresFromTMDB(): Promise<{ movieGenres: number, tvGenres: number }> {
    if (!this.tmdbService) {
      throw new StreamingServiceError('TMDBService not available', 500);
    }

    try {
      logger.info('Starting genre synchronization from TMDB...');

      // Buscar gêneros de filmes e séries do TMDB
      const [movieGenres, tvGenres] = await Promise.all([
        this.tmdbService.fetchMovieGenres(),
        this.tmdbService.fetchTVGenres()
      ]);

      // Combinar todos os gêneros únicos
      const allGenres = new Map<number, { id: number; name: string }>();
      
      // Adicionar gêneros de filmes
      movieGenres.forEach((genre: any) => {
        allGenres.set(genre.id, { id: genre.id, name: genre.name });
      });
      
      // Adicionar gêneros de séries (pode haver sobreposição de IDs)
      tvGenres.forEach((genre: any) => {
        allGenres.set(genre.id, { id: genre.id, name: genre.name });
      });

      const genresToCreate: IGenreCreate[] = Array.from(allGenres.values()).map(genre => ({
        id: genre.id,
        name: genre.name,
        poster: '' // Será preenchido posteriormente se necessário
      }));

      // Verificar quais gêneros já existem
      const existingGenres = await this.genreRepository.findAll(0, 1000); // Buscar todos os gêneros
      const existingGenreIds = new Set(existingGenres.map(g => g.id));
      
      // Filtrar apenas gêneros que não existem
      const newGenres = genresToCreate.filter(genre => !existingGenreIds.has(genre.id));

      if (newGenres.length > 0) {
        await this.genreRepository.create(newGenres);
        logger.info(`Created ${newGenres.length} new genres from TMDB`);
      } else {
        logger.info('All genres are already synchronized');
      }

      return {
        movieGenres: movieGenres.length,
        tvGenres: tvGenres.length
      };

    } catch (error: any) {
      logger.error({
        message: 'Error synchronizing genres from TMDB',
        error: error.message,
      });
      throw new StreamingServiceError('Error synchronizing genres from TMDB', 500);
    }
  }
}