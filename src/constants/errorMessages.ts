export const ErrorMessages = {
  // TMDB errors
  TMDB_TOKEN_INVALID: 'Invalid TMDB_Bearer_Token',
  TMDB_COVER_FETCH_ERROR: 'Error fetching cover from TMDB',

  // Common Media erros 
  COMMON_MEDIA_NOT_FOUND: 'Common media not found', 
  COMMON_MEDIA_ID_INVALID: 'Invalid common media ID format',

  //History
  HISTORY_CONTENT_ID_REQUIRED: "Content ID is required",
  HISTORY_CONTENT_TYPE_REQUIRED: "Content TYPE is required",
  HISTORY_TITLE_REQUIRED: "Streaming Title is required",
  HISTORY_DURATION_REQUIRED: "Streaming duration is required",
  HISTORY_DURATION_NEGATIVE: "Streaming duration must be positive",
  HISTORY_TOTAL_DURATION_NEGATIVE: "Streaming total duration must be positive",

  // Genre errors
  GENRE_NOT_FOUND: "Genre is not found",
  GENRE_NAME_REQUIRED: "Genre name is required",
  GENRE_ID_REQUIRED: "Genre id is required",
  GENRE_FETCH_LIMIT_EXCEEDED: "Limit cannot exceed 100 items",
  GENRE_INTERNAL_ID_INVALID: "Genre internal id is invalid",
  GENRE_REQUIRED: "Genre is required",
  GENRE_ID_INVALID: "Genre id is invalid",
  GENRE_ID_MISMATCH: (provided: number, stored: number) => `Genre externalID mismatch: provided ${provided}, but stored is ${stored}`,
  GENRE_NAME_MISMATCH: (provided: string, stored: string) => `Genre name mismatch: provided "${provided}", but stored is "${stored}"`,
  // Season erros
  SEASON_NUMBER_REQUIRED: "Season number is required",
  SEASON_TITLE_REQUIRED: "Season title is required",
  SEASON_ID_REQUIRED: "Season id is required",
  SEASON_ID_INVALID: "Season id is invalid",
  SEASON_LIMIT_EXCEEDED: "Limit cannot exceed 100 items",
  SERIE_ID_REQUIRED: "Serie id is required",
  // Series erros
  SERIE_NOT_FOUND: 'Serie not found',
  SERIES_NOT_FOUND: 'Series not found',
  SERIES_TITLE_REQUIRED: 'Title is required',
  SERIES_NUMBER_OF_EPISODES_REQUIRED: 'Number of episodes is required',
  SERIES_NUMBER_OF_SEASONS_REQUIRED: 'Number of seasons is required',
  SERIES_ID_INVALID: 'Invalid series ID format',
  TMDB_ID_REQUIRED: 'TMDB id is required',
  SERIES_WITH_TITLE_EXISTS: 'Movie with this title already exists',
  SERIES_RATING_INVALID: 'Rating must be a number between 0 and 10',
  SERIES_RELEASE_DATE_INVALID: 'Release date must be a valid date format',
  SERIES_URL_INVALID: 'Invalid URL format',
  SERIES_CAST_INVALID: 'Invalid cast format, must be an array of strings',
  SERIES_GENRE_REQUIRED: 'Genre is required',
  SERIES_GENRE_INVALID: 'Genre is not valid or not registered in the database',
  SERIES_FETCH_LIMIT_EXCEEDED: 'Limit cannot exceed 100 items',

  // Movies errors
  MOVIE_NOT_FOUND: 'Movie not found',
  MOVIES_NOT_FOUND: 'Movies not found',
  MOVIE_ALREADY_EXISTS: 'Movie already exists',
  MOVIE_CREATION_FAILED: 'Unable to create movie',
  MOVIE_UPDATE_FAILED: 'Unable to update movie',
  MOVIE_DELETION_FAILED: 'Unable to delete movie',
  MOVIE_FETCH_FAILED: 'Unable to fetch movie',
  MOVIE_SAVE_FAILED: 'Unable to save movie',
  MOVIE_FETCH_AND_SAVE_FAILED: 'Unable to fetch and save movie',
  MOVIE_EXTERNAL_FETCH_FAILED: 'Unable to fetch external movies',
  MOVIE_EXTERNAL_SAVE_FAILED: 'Unable to save external movies',
  MOVIE_FETCH_LIMIT_EXCEEDED: 'Limit cannot exceed 100 items',
  MOVIE_ID_INVALID: 'Invalid movie ID format',
  MOVIE_WITH_TITLE_EXISTS: 'Movie with this title already exists',
  MOVIE_RATING_INVALID: 'Rating must be a number between 0 and 10',
  MOVIE_RELEASE_DATE_INVALID: 'Release date must be a valid date format',
  MOVIE_RELEASE_DATE_REQUIRED: 'Release date is required',
  MOVIE_RELEASE_DATE_FUTURE: 'Release date cannot be in the future',
  MOVIE_URL_INVALID: 'Invalid URL format',
  MOVIE_CAST_INVALID: 'Invalid cast format, must be an array of strings',
  MOVIE_TITLE_REQUIRED: 'Title is required',
  MOVIE_GENRE_REQUIRED: 'Genre is required',
  MOVIE_GENRE_INVALID: 'Genre is not valid or not registered in the database',

  // Streaming Type errors
  STREAMING_TYPE_NOT_FOUND: 'Streaming type not found',
  STREAMING_TYPE_ALREADY_EXISTS: 'Streaming type already exists',
  STREAMING_TYPE_CREATION_FAILED: 'Unable to create streaming type',
  STREAMING_TYPE_UPDATE_FAILED: 'Unable to update streaming type',
  STREAMING_TYPE_DELETION_FAILED: 'Unable to delete streaming type',
  STREAMING_TYPE_CATEGORY_NOT_FOUND: 'Category not found in streaming type',
  STREAMING_TYPE_CATEGORY_ALREADY_EXISTS: 'Category already exists in streaming type',
  STREAMING_TYPE_CATEGORY_ADDITION_FAILED: 'Unable to add category to streaming type',
  STREAMING_TYPE_CATEGORY_REMOVAL_FAILED: 'Unable to remove category from streaming type',
  STREAMING_TYPE_NAME_REQUIRED: 'Name is required',
  STREAMING_TYPE_CATEGORIES_REQUIRED: 'At least one category are required',
  STREAMING_TYPE_CATEGORIES_NAME_REQUIRED: 'Category name is required',
  STREAMING_TYPE_CATEGORIES_INVALID_ID: 'Invalid category type ID',
  STREAMING_TYPE_INVALID_DATA: 'Invalid streaming type data',
  STREAMING_TYPE_DUPLICATE_CATEGORY: 'Duplicate category ID',
  STREAMING_TYPE_NAME_EXISTS: 'Streaming type name already exists',
  STREAMING_TYPE_GENRE_NAME_EXISTS: (genreName: string) => `Streaming type genre name "${genreName}" already exists`,
  
  // Content errors
  CONTENT_TYPE_REQUIRED: 'Content type is required',
  CONTENT_TITLE_ALREADY_EXISTS: "Já existe um conteúdo com este título",

  // Authentication & Authorization errors
  INVALID_CREDENTIALS: 'Invalid email or password',
  UNAUTHORIZED_ACCESS: 'Unauthorized access',
  TOKEN_EXPIRED: 'Token expired',
  TOKEN_INVALID: 'Invalid token',
  TOKEN_REQUIRED: 'Authentication token is required',

  // User related errors
  USER_ID_REQUIRED: 'User id required',
  USER_NOT_FOUND: 'User not found',
  USER_ALREADY_EXISTS: 'User already exists with this email',
  USER_CREATION_FAILED: 'Unable to create user',
  USER_UPDATE_FAILED: 'Unable to update user',
  USER_DELETION_FAILED: 'Unable to delete user',
  USER_USERNAME_REQUIRED: "Username is required",
  USER_USERNAME_MIN_LENGTH: "Username must be at least 3 characters long",
  USER_USERNAME_MAX_LENGTH: "Username cannot be more than 20 characters long",
  USER_USERNAME_VALIDATE: "Username can only contain letters, numbers, and underscores",
  USER_EMAIL_REQUIRED: "Email is required",
  USER_INVALID_EMAIL: "Email is invalid",
  USER_PASSWORD_REQUIRED: "Password is required",
  USER_PASSWORD_MIN_LENGTH: "Password must be at least 6 characters long",

  // Validation User errors
  INVALID_EMAIL: 'Invalid email format',
  INVALID_PASSWORD: 'Password must contain at least 8 characters, including numbers, uppercase and lowercase letters',
  INVALID_NAME: 'Name is required',
  REQUIRED_FIELD: 'Required field',
  INVALID_DATA: 'Invalid data',

  // Request errors
  INVALID_ID: `Missing or invalid id`,
  INVALID_ID_FORMAT: (params: string) => `Failed to format id, param: '${params}' is not a valid id`,
  INVALID_REQUEST: 'Invalid request',
  REQUIRED_PARAMETERS: 'The following parameters are required:',
  MISSING_PARAMETERS: 'Missing required parameters',
  INVALID_PARAMETERS: 'Invalid parameters',
  BODY_REQUIRED: 'Request body is required',

  // Server errors
  INTERNAL_SERVER_ERROR: 'Internal server error',
  DATABASE_ERROR: 'Database access error',
  SERVICE_UNAVAILABLE: 'Service temporarily unavailable',

  // Rate limiting
  TOO_MANY_REQUESTS: 'Too many requests. Please try again later',

  // Generic errors
  OPERATION_FAILED: 'Operation failed',
  UNKNOWN_ERROR: 'Unknown error',
} as const;

// Types for TypeScript
export type ErrorMessageKey = keyof typeof ErrorMessages;
export type ErrorMessage = (typeof ErrorMessages)[ErrorMessageKey];
