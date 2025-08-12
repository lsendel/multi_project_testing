import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { createApiResponse } from '@shared/index.js';

export function validateRequest(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = schema.safeParse(req.body);
      
      if (!result.success) {
        const errors = result.error.errors.map(err => ({
          path: err.path.join('.'),
          message: err.message,
        }));
        
        return res.status(400).json(
          createApiResponse(undefined, 'Validation failed', errors)
        );
      }
      
      req.body = result.data;
      next();
    } catch (error) {
      console.error('Validation middleware error:', error);
      res.status(500).json(
        createApiResponse(undefined, 'Internal validation error')
      );
    }
  };
}

export function validateQuery(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = schema.safeParse(req.query);
      
      if (!result.success) {
        const errors = result.error.errors.map(err => ({
          path: err.path.join('.'),
          message: err.message,
        }));
        
        return res.status(400).json(
          createApiResponse(undefined, 'Query validation failed', errors)
        );
      }
      
      req.query = result.data;
      next();
    } catch (error) {
      console.error('Query validation middleware error:', error);
      res.status(500).json(
        createApiResponse(undefined, 'Internal validation error')
      );
    }
  };
}