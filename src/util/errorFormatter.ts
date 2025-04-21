import { ZodError } from 'zod';

interface FormattedError {
  field: string;
  message: string;
}

export function formatZodError(error: ZodError): FormattedError[] {
  return error.errors.map(err => {
    const field = err.path.join('.');
    
    // Customize error message to be more user-friendly
    let message = err.message;
    
    if (err.code === 'invalid_type') {
      if (err.expected === 'string') {
        message = `This field must be text`;
      } else if (err.expected === 'number') {
        message = `This field must be a number`;
      }
    } else if (err.code === 'unrecognized_keys') {
      message = `Field not allowed`;
    }
    
    return { field, message };
  });
}

/**
 * Error handling utility for API responses
 */
export function handleApiError(error: unknown) {
  if (error instanceof ZodError) {
    const formattedErrors = formatZodError(error);
    return {
      status: 400,
      body: {
        success: false,
        errors: formattedErrors,
        message: 'Invalid input data'
      }
    };
  }
  // Other error types...
  console.error('Unhandled error:', error);
  return {
    status: 500,
    body: {
      success: false,
      message: 'Internal server error'
    }
  };
}