import { Messages } from "./httpStatus";

export const ErrorMessages = {
  // Authentication & Authorization errors
  INVALID_CREDENTIALS: 'Invalid email or password',
  UNAUTHORIZED_ACCESS: 'Unauthorized access',
  TOKEN_EXPIRED: 'Token expired',
  TOKEN_INVALID: 'Invalid token',
  TOKEN_REQUIRED: 'Authentication token is required',

  // User related errors
  USER_NOT_FOUND: 'User not found',
  USER_ALREADY_EXISTS: 'User already exists with this email',
  USER_CREATION_FAILED: 'Unable to create user',
  USER_UPDATE_FAILED: 'Unable to update user',
  USER_DELETION_FAILED: 'Unable to delete user',
  
  // Validation errors
  INVALID_EMAIL: 'Invalid email format',
  INVALID_PASSWORD: 'Password must contain at least 8 characters, including numbers, uppercase and lowercase letters',
  INVALID_NAME: 'Name is required',
  REQUIRED_FIELD: 'Required field',
  INVALID_DATA: 'Invalid data',

  // Request errors
  INVALID_REQUEST: 'Invalid request',
  MISSING_PARAMETERS: 'Missing required parameters',
  INVALID_PARAMETERS: 'Invalid parameters',

  // Server errors
  INTERNAL_SERVER_ERROR: 'Internal server error',
  DATABASE_ERROR: 'Database access error',
  SERVICE_UNAVAILABLE: 'Service temporarily unavailable',
  
  // Rate limiting
  TOO_MANY_REQUESTS: 'Too many requests. Please try again later',

  // Generic errors
  OPERATION_FAILED: 'Operation failed',
  UNKNOWN_ERROR: 'Unknown error'
} as const;

// Types for TypeScript
export type MessageKey = keyof typeof Messages;
export type Message = typeof Messages[MessageKey];
export type ErrorMessageKey = keyof typeof ErrorMessages;
export type ErrorMessage = typeof ErrorMessages[ErrorMessageKey];