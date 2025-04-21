import { z, ZodError } from 'zod';
import { formatZodError, handleApiError } from '../errorFormatter';

describe('Error Formatter Utilities', () => {
  describe('formatZodError', () => {
    it('should format validation error for missing required field', () => {
      // Arrange
      const schema = z.object({
        name: z.string(),
        email: z.string().email(),
      });
      
      let error: ZodError;
      try {
        schema.parse({});
      } catch (err) {
        error = err as ZodError;
      }

      // Act
      const formattedErrors = formatZodError(error!);

      // Assert
      expect(formattedErrors).toHaveLength(2);
      expect(formattedErrors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'name',
            message: expect.any(String)
          }),
          expect.objectContaining({
            field: 'email',
            message: expect.any(String)
          })
        ])
      );
    });

    it('should format validation error for invalid string type', () => {
      // Arrange
      const schema = z.object({
        name: z.string(),
      });
      
      let error: ZodError;
      try {
        schema.parse({ name: 123 });
      } catch (err) {
        error = err as ZodError;
      }

      // Act
      const formattedErrors = formatZodError(error!);

      // Assert
      expect(formattedErrors).toHaveLength(1);
      expect(formattedErrors[0].field).toBe('name');
      expect(formattedErrors[0].message).toBe('This field must be text');
    });

    it('should format validation error for invalid number type', () => {
      // Arrange
      const schema = z.object({
        age: z.number(),
      });
      
      let error: ZodError;
      try {
        schema.parse({ age: 'twenty' });
      } catch (err) {
        error = err as ZodError;
      }

      // Act
      const formattedErrors = formatZodError(error!);

      // Assert
      expect(formattedErrors).toHaveLength(1);
      expect(formattedErrors[0].field).toBe('age');
      expect(formattedErrors[0].message).toBe('This field must be a number');
    });

    it('should format validation error for unrecognized keys', () => {
      // Arrange
      const schema = z.object({
        name: z.string(),
      }).strict();
      
      let error: ZodError;
      try {
        schema.parse({ name: 'John', extraField: 'value' });
      } catch (err) {
        error = err as ZodError;
      }

      // Act
      const formattedErrors = formatZodError(error!);

      // Assert
      expect(formattedErrors).toHaveLength(1);
      expect(formattedErrors[0].message).toBe('Field not allowed');
    });

    it('should format validation error for nested fields', () => {
      // Arrange
      const schema = z.object({
        user: z.object({
          profile: z.object({
            firstName: z.string(),
          }),
        }),
      });
      
      let error: ZodError;
      try {
        schema.parse({ user: { profile: { firstName: 123 } } });
      } catch (err) {
        error = err as ZodError;
      }

      // Act
      const formattedErrors = formatZodError(error!);

      // Assert
      expect(formattedErrors).toHaveLength(1);
      expect(formattedErrors[0].field).toBe('user.profile.firstName');
      expect(formattedErrors[0].message).toBe('This field must be text');
    });

    it('should format validation error for array items', () => {
      // Arrange
      const schema = z.object({
        tags: z.array(z.string()),
      });
      
      let error: ZodError;
      try {
        schema.parse({ tags: ['tag1', 123, 'tag3'] });
      } catch (err) {
        error = err as ZodError;
      }

      // Act
      const formattedErrors = formatZodError(error!);

      // Assert
      expect(formattedErrors).toHaveLength(1);
      expect(formattedErrors[0].field).toBe('tags.1');
      expect(formattedErrors[0].message).toBe('This field must be text');
    });

    it('should keep original message for other validation errors', () => {
      // Arrange
      const schema = z.object({
        email: z.string().email(),
      });
      
      let error: ZodError;
      try {
        schema.parse({ email: 'not-an-email' });
      } catch (err) {
        error = err as ZodError;
      }

      // Act
      const formattedErrors = formatZodError(error!);

      // Assert
      expect(formattedErrors).toHaveLength(1);
      expect(formattedErrors[0].field).toBe('email');
      // The original message from Zod should be preserved
      expect(formattedErrors[0].message).toBe(error!.errors[0].message);
    });
  });

  describe('handleApiError', () => {
    it('should handle ZodError and return formatted response', () => {
      // Arrange
      const schema = z.object({
        name: z.string(),
      });
      
      let error: ZodError;
      try {
        schema.parse({ name: 123 });
      } catch (err) {
        error = err as ZodError;
      }

      // Mock console.error to prevent test output noise
      const originalConsoleError = console.error;
      console.error = jest.fn();

      // Act
      const response = handleApiError(error!);

      // Restore console.error
      console.error = originalConsoleError;

      // Assert
      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        errors: expect.arrayContaining([
          expect.objectContaining({
            field: 'name',
            message: 'This field must be text'
          })
        ]),
        message: 'Invalid input data'
      });
    });

    it('should handle unknown errors and return 500 response', () => {
      // Arrange
      const error = new Error('Unexpected error');
      
      // Mock console.error to prevent test output noise
      const originalConsoleError = console.error;
      console.error = jest.fn();

      // Act
      const response = handleApiError(error);

      // Restore console.error
      console.error = originalConsoleError;

      // Assert
      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        success: false,
        message: 'Internal server error'
      });
      expect(console.error).toHaveBeenCalledWith('Unhandled error:', error);
    });

    it('should handle string errors and return 500 response', () => {
      // Arrange
      const error = 'Something went wrong';
      
      // Mock console.error to prevent test output noise
      const originalConsoleError = console.error;
      console.error = jest.fn();

      // Act
      const response = handleApiError(error);

      // Restore console.error
      console.error = originalConsoleError;

      // Assert
      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        success: false,
        message: 'Internal server error'
      });
    });
  });
}); 