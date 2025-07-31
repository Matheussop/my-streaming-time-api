import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '../validationMiddleware';

/**
 * Important to mock catchAsync so that the test is not impacted
 * by the promise that catchAsync returns
 */
jest.mock('../../util/catchAsync', () => ({
  catchAsync: (fn: Function) => fn
}));

describe('Validation Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock<NextFunction>;
  let mockSchema: z.ZodObject<any>;


  beforeEach(() => {
    mockRequest = {
      body: {},
      params: {},
      query: {},
    };
    
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    
    mockNext = jest.fn() as jest.Mock<NextFunction>;

    // Criar um schema básico para testes
    mockSchema = z.object({
      name: z.string().min(3),
      email: z.string().email(),
      age: z.number().int().positive().optional(),
    });
  });

  it('should validate valid body data and call next()', async () => {
    const validateMiddleware = validate(mockSchema);
    mockRequest.body = {
      name: 'Test User',
      email: 'test@example.com',
      age: 25,
    };

    await validateMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockNext).toHaveBeenCalledWith();
    expect(mockRequest.body).toEqual({
      name: 'Test User',
      email: 'test@example.com',
      age: 25,
    });
  });

  it('should validate valid params data and call next() with params', async () => {
    const validateMiddleware = validate(mockSchema, 'params');
    const mockParams = {
      name: 'Test User',
      email: 'test@example.com',
      age: '25', // params são strings no Express
    };

    mockRequest.params = mockParams;
    // Mock parse para lidar com a conversão de string para number
    const mockParseAsync = jest.fn().mockImplementation(async (data) => {
      return {
        ...data,
        age: Number(data.age),
      };
    });
    mockSchema.parseAsync = mockParseAsync;

    await validateMiddleware(mockRequest as Request, mockResponse as Response, mockNext);


    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockParseAsync).toHaveBeenCalledWith(mockParams);
  });

  it('should validate valid query data and call next() with query', async () => {
    const validateMiddleware = validate(mockSchema, 'query');
    const mockQuery = {
      name: 'Test User',
      email: 'test@example.com',
      age: '25', // query params são strings no Express
    };

    mockRequest = {
      ...mockRequest,
      query: mockQuery,
    };

    // Mock parse para lidar com a conversão de string para number
    const mockParseAsync = jest.fn().mockResolvedValue(
      {
        ...mockRequest.query,
        age: Number(mockRequest.query?.age),
      }
    );
    mockSchema.parseAsync = mockParseAsync;

    await validateMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

    const mockRequestWithNumberAge = {
      ...mockRequest,
      query: {
        ...mockRequest.query,
        age: Number(mockRequest.query?.age),
      },
    };
    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockSchema.parseAsync).toHaveBeenCalledWith(mockQuery);
    expect(mockRequest.query).toEqual(mockRequestWithNumberAge.query);
  });

  it('should pass zod error to error handler when validation fails for body', async () => {
    const validateMiddleware = validate(mockSchema);
    mockRequest.body = {
      name: 'Te', // nome muito curto
      email: 'invalid-email', // email inválido
      age: -5, // idade negativa
    };

    // Simular erro do Zod
    const zodError = new z.ZodError([
      {
        code: 'too_small',
        minimum: 3,
        type: 'string',
        inclusive: true,
        exact: false,
        message: 'String must contain at least 3 character(s)',
        path: ['name'],
      },
      {
        code: 'invalid_string',
        validation: 'email',
        message: 'Invalid email',
        path: ['email'],
      },
      {
        code: 'too_small',
        minimum: 1,
        type: 'number',
        inclusive: true,
        exact: false,
        message: 'Number must be greater than 0',
        path: ['age'],
      },
    ]);

    mockSchema.parseAsync = jest.fn().mockRejectedValue(zodError);

    await expect(
      validateMiddleware(mockRequest as Request, mockResponse as Response, mockNext)
    ).rejects.toThrow(zodError);

    expect(mockSchema.parseAsync).toHaveBeenCalledWith(mockRequest.body);
  });

  it('should transform data according to schema transformations', async () => {
    const transformSchema = z.object({
      email: z.string().email().toLowerCase(),
      age: z.string().transform(val => parseInt(val, 10)),
      createdAt: z.string().transform(val => new Date(val)),
    });

    const validateMiddleware = validate(transformSchema);
    
    mockRequest.body = {
      email: 'TEST@EXAMPLE.COM',
      age: '25',
      createdAt: '2023-01-01T00:00:00Z',
    };

    const expectedTransformedData = {
      email: 'test@example.com',
      age: 25,
      createdAt: new Date('2023-01-01T00:00:00Z'),
    };

    // Mock do parseAsync para simular a transformação
    transformSchema.parseAsync = jest.fn().mockResolvedValue(expectedTransformedData);

    await validateMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockRequest.body).toEqual(expectedTransformedData);
  });

  it('should handle optional fields correctly', async () => {
    const validateMiddleware = validate(mockSchema);
    mockRequest.body = {
      name: 'Test User',
      email: 'test@example.com',
      // age is omitted (optional)
    };

    await validateMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockRequest.body).toEqual({
      name: 'Test User',
      email: 'test@example.com',
    });
  });

  it('should validate nested objects correctly', async () => {
    const nestedSchema = z.object({
      user: z.object({
        name: z.string().min(3),
        contact: z.object({
          email: z.string().email(),
          phone: z.string().optional(),
        }),
      }),
      preferences: z.object({
        theme: z.enum(['light', 'dark']),
        notifications: z.boolean(),
      }).optional(),
    });

    const validateMiddleware = validate(nestedSchema);
    
    mockRequest.body = {
      user: {
        name: 'Test User',
        contact: {
          email: 'test@example.com',
          phone: '123-456-7890',
        },
      },
      preferences: {
        theme: 'dark',
        notifications: true,
      },
    };

    await validateMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockRequest.body).toEqual({
      user: {
        name: 'Test User',
        contact: {
          email: 'test@example.com',
          phone: '123-456-7890',
        },
      },
      preferences: {
        theme: 'dark',
        notifications: true,
      },
    });
  });
}); 