import { Request, Response, NextFunction } from 'express';

import { ThrowException } from './less-error';
import { LessResponse } from './less-response';

// Async Error Handler Middleware with TypeScript types
export const LessTryCatch = (
  func: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    func(req, res, next).catch((err: Error | ThrowException) => {
      if (err instanceof ThrowException) {
        // If it's already a ThrowException, pass it through
        next(err);

        // LessResponse(res, err.statusCode, {
        //   message: err.message,
        //   data: err.data,
        // });

        // return;
        // Return immediately to stop execution
      } else {
        // // For other errors, wrap them in a ThrowException with 500 status
        // const wrappedError = new ThrowException(
        //   err?.message || "Internal Server Error",
        //   500,
        //   null,
        //   "INTERNAL_SERVER_ERROR"
        // );
        // next(wrappedError);
        // return; // Return immediately to stop execution

        next(err);
      }
    });
  };
};
