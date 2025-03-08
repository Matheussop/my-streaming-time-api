import { Types } from 'mongoose';

// Extends Express Request interface
declare namespace Express {
  export interface Request {
    // Stores validated IDs as ObjectId
    validatedIds: Record<string, Types.ObjectId>;
    
    // Stores validated body
    validatedBody?: any;
    
    // Stores authenticated user (for future use)
    user?: any;
  }
} 