export const Messages = {
  COVER_CHANGED_SUCCESSFULLY: 'Cover changed successfully',

  // Series 
  SERIE_FOUND: 'Serie found',
  SERIES_FOUND: 'Series found',
  SERIE_CREATED_SUCCESSFULLY: 'Serie created successfully',
  SERIE_UPDATED_SUCCESSFULLY: 'Serie updated successfully',
  SERIE_DELETED_SUCCESSFULLY: 'Serie deleted successfully',
  SERIE_FETCHED_SUCCESSFULLY: 'Serie fetched successfully',
  SERIE_SAVED_SUCCESSFULLY: 'Serie saved successfully',
  SERIE_FETCHED_AND_SAVED_SUCCESSFULLY: 'Serie fetched and saved successfully',

  // Movies messages
  MOVIE_FOUND: 'Movie found',
  MOVIES_FOUND: 'Movies found',
  MOVIE_CREATED_SUCCESSFULLY: 'Movie created successfully',
  MOVIE_UPDATED_SUCCESSFULLY: 'Movie updated successfully',
  MOVIE_DELETED_SUCCESSFULLY: 'Movie deleted successfully',
  MOVIE_FETCHED_SUCCESSFULLY: 'Movie fetched successfully',
  MOVIE_SAVED_SUCCESSFULLY: 'Movie saved successfully',
  MOVIE_FETCHED_AND_SAVED_SUCCESSFULLY: 'Movie fetched and saved successfully',

  // Streaming Type messages
  STREAMING_TYPE_FOUND: 'Streaming type found',
  STREAMING_TYPES_FOUND: 'Streaming types found',
  STREAMING_TYPE_CREATED_SUCCESSFULLY: 'Streaming type created successfully',
  STREAMING_TYPE_UPDATED_SUCCESSFULLY: 'Streaming type updated successfully',
  STREAMING_TYPE_DELETED_SUCCESSFULLY: 'Streaming type deleted successfully',
  STREAMING_TYPE_CATEGORIES_ADDED_SUCCESSFULLY: 'Categories added successfully',
  STREAMING_TYPE_CATEGORIES_REMOVED_SUCCESSFULLY: 'Categories removed successfully',
  STREAMING_TYPE_COVER_CHANGE_SUCCESSFULLY: "Covers changed successfully",
  // History Streaming messages
  STREAMING_HISTORY_FOUND: 'Streaming history found',
  STREAMING_ADDED_SUCCESSFULLY: 'Streaming added successfully',
  STREAMING_REMOVED_SUCCESSFULLY: 'Streaming removed successfully',
  STREAMING_NOT_FOUND: 'Streaming not found or failed to update history',

  // Authentication & Authorization messages
  AUTHENTICATION_SUCCESS: 'Authentication successful',
  LOGOUT_SUCCESS: 'Logout successful',
  TOKEN_REFRESH_SUCCESS: 'Token refreshed successfully',

  // User related messages
  USER_FOUND: 'User found',
  USER_CREATED_SUCCESSFULLY: 'User created successfully',
  USER_UPDATED_SUCCESSFULLY: 'User updated successfully',
  USER_DELETED_SUCCESSFULLY: 'User deleted successfully',

  // Validation messages
  VALID_EMAIL: 'Email format is valid',
  VALID_PASSWORD: 'Password meets all requirements',
  VALID_NAME: 'Name is valid',
  ALL_FIELDS_VALID: 'All fields are valid',

  // Request messages
  REQUEST_SUCCESSFUL: 'Request processed successfully',
  PARAMETERS_VALID: 'Parameters are valid',

  // Server messages
  SERVER_OPERATION_SUCCESS: 'Operation completed successfully on the server',
  DATABASE_OPERATION_SUCCESS: 'Database operation completed successfully',
  SERVICE_AVAILABLE: 'Service is available',

  // Rate limiting
  RATE_LIMIT_RESOLVED: 'Request rate within limits',

  // Generic messages
  OPERATION_SUCCESSFUL: 'Operation completed successfully',
  NO_ERROR: 'No errors encountered',
} as const;

export type MessageKey = keyof typeof Messages;
export type Message = (typeof Messages)[MessageKey];
