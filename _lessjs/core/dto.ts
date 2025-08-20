import { NextFunction, Request, Response } from 'express';
import { LessError } from '../common/less-error';

import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

// Enhanced validation middleware with better error handling
export const Dto =
  (dtoClass: any) =>
  async (req: Request, res: Response, next?: NextFunction) => {
    console.log('Dto middleware called');

    try {
      // Ensure req.body exists and is an object
      if (!req.body || typeof req.body !== 'object') {
        req.body = {};
      }

      const dtoObject = plainToInstance(dtoClass, req.body);
      const errors = await validate(dtoObject);

      if (errors.length > 0) {
        // Map validation errors to a structured format
        const formattedErrors = errors.map((error) => ({
          property: error.property,
          constraints: error.constraints,
        }));

        // Get the first error message to use as the main error message
        let firstErrorMessage = 'Validation failed';
        if (formattedErrors[0]?.constraints) {
          // Get the first constraint message from the first error
          const firstConstraint = Object.values(
            formattedErrors[0].constraints
          )[0];
          if (firstConstraint) {
            firstErrorMessage = firstConstraint;
          }
        }

        // Instead of throwing directly, pass the error to Express error handler
        const validationError = LessError.custom(
          firstErrorMessage,
          400,
          { errors: formattedErrors },
          'VALIDATION_ERROR'
        );

        next?.(validationError);
        return; // Return immediately to stop execution
      }

      // Add validated data to request body
      req.body = dtoObject;
      next?.();
    } catch (error) {
      // Handle any unexpected errors during validation
      console.error('DTO validation error:', error);
      const validationError = LessError.custom(
        'Validation processing failed',
        500,
        { originalError: error },
        'VALIDATION_PROCESSING_ERROR'
      );
      next?.(validationError);
    }
  };
