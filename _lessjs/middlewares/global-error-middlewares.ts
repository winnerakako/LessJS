import { LessError, ThrowException } from '../common/less-error';
import { LessResponse } from '../common/less-response';

import { NextFunction, Request, Response } from 'express';
// import { processMongoDBError } from "./mongodb-errors-handler";

// NODE UNHANDLED ERRORS
export const UnhandledExceptionMiddleware = (): void => {
  // Uncaught Exception
  process.on('uncaughtException', (error: Error) => {
    console.error('[Middleware] Uncaught Exception:', error.message);
    console.error(error.stack);

    // Log to monitoring service if you have one
    // Example: Sentry.captureException(error);

    // Check if it's a critical TypeScript-related error
    const isTypeScriptError =
      error.message.includes('Cannot read property') ||
      error.message.includes('undefined') ||
      error.message.includes('null') ||
      error.message.includes('is not a function') ||
      error.message.includes('Cannot read properties of');

    if (isTypeScriptError) {
      console.error('[Middleware] TypeScript Runtime Error detected');

      // Attempt to recover for TypeScript errors
      try {
        // Clear any cached modules that might be causing issues
        if (require.cache) {
          Object.keys(require.cache).forEach((key) => {
            delete require.cache[key];
          });
        }
        console.log('[Middleware] Module cache cleared for recovery');
      } catch (recoveryError) {
        console.error('[Middleware] Recovery failed:', recoveryError);
      }
    }

    // Note: Graceful shutdown for critical errors is now handled
    // by ApplicationLifecycle automatically via process signals
  });

  // Unhandled Rejection
  process.on(
    'unhandledRejection',
    (reason: unknown, promise: Promise<unknown>) => {
      // Convert reason to Error object if it isn't already
      const error =
        reason instanceof Error ? reason : new Error(String(reason));

      console.error('[Middleware] Unhandled Rejection:', error.message);
      console.error(error.stack);
      console.error('[Middleware] Promise:', promise);

      // Log to monitoring service if you have one
      // Example: Sentry.captureException(error);

      // Attempt to recover
      try {
        // You could add recovery logic here
        // For example, reconnecting to databases, clearing caches, etc.
        console.log(
          '[Middleware] Attempting recovery from unhandled rejection'
        );
      } catch (recoveryError) {
        console.error('[Middleware] Recovery failed:', recoveryError);
      }

      // Note: Critical error handling is managed by ApplicationLifecycle
    }
  );

  // Handle worker errors in cluster mode
  if (process.env.WORKER_ROLE) {
    process.on('error', (error: Error) => {
      console.error('[Middleware] Worker Error:', error.message);
      console.error(error.stack);
      // Don't exit, let the cluster manager handle worker restarts
    });
  }

  // Handle MongoDB connection errors
  process.on('MongoError', (error: Error) => {
    console.error('[Middleware] MongoDB Error:', error.message);
    console.error(error.stack);
    // Don't exit, let the connection retry logic handle it
  });

  // Handle process warnings
  process.on('warning', (warning: Error) => {
    console.warn('[Middleware] Process Warning:', warning.message);
    console.warn(warning.stack);
    // Don't exit, just log the warning
  });

  // Handle process exit
  process.on('exit', (code: number) => {
    console.log(`[Middleware] Process exiting with code ${code}`);
    // Don't prevent exit, but log it
  });

  // Note: Only one uncaughtException handler should exist
  // The main handler above already covers TypeScript runtime errors

  // Keep SIGTERM and SIGINT handlers commented out to prevent shutdown
  // This is good for your use case
};

// Not Found Handler for unknown routes
export const NotFoundErrorMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const err = LessError.notFound(
    `Can't find ${req.originalUrl} on this server!`
  );
  next(err);
};

export const GlobalErrorMiddleware = (
  err: ThrowException | Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.log('GLOBAL ERROR INTERCEPTOR REACHED');

  let statusCode = 500;
  const message = err.message || 'Internal Server Error';
  let status = 'error';
  let data = {};

  // If it's a ThrowException, use its properties
  if (err instanceof ThrowException) {
    console.log('ERROR ThrowException', err);
    statusCode = err.statusCode;
    status = err.status;
    data = err.data || {};
  }

  console.log('Global Error Interceptor:', message);

  // Process MongoDB errors
  // const { message: processedMessage, statusCode: processedStatusCode } =
  //   processMongoDBError(message, statusCode);

  // // if (processedMessage !== "none" && processedStatusCode !== 0) {
  // message = processedMessage;
  // statusCode = processedStatusCode;
  // // }

  // Default Error Handling for Non-Operational Errors
  if (!(err as ThrowException).isOperational) {
    console.error('Unexpected Error:', err);
    status = 'error'; // Set status to error for unexpected errors
  }

  // Send the error response
  LessResponse(res, statusCode, { message, data });

  // Ensure no further middleware is called
  return;
};
