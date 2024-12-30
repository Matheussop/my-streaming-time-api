export const HttpStatus = {
  // Success responses
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,

  // Client error responses
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,

  // Server error responses
  INTERNAL_SERVER_ERROR: 500,
  NOT_IMPLEMENTED: 501,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504
} as const;

// Type para usar com TypeScript
export type HttpStatusCode = typeof HttpStatus[keyof typeof HttpStatus];


export const Messages = {
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
