import { Express } from 'express';
import { Server } from 'http';
import { LessConfig } from '../../less-config';
import {
  GlobalErrorMiddleware,
  NotFoundErrorMiddleware,
  UnhandledExceptionMiddleware,
} from '../middlewares/global-error-middlewares';
import { SecurityMiddlewares } from '../middlewares/security-middlewares';
import {
  ApplicationLifecycle,
  applicationLifecycle,
} from './application-lifecycle';

import { SetupRoutes } from './route';

export const Bootstrap = async (app: Express) => {
  console.log('[Bootstrap] Starting application...');

  // Trust proxy
  app.set('trust proxy', 1);

  // Security middlewares
  SecurityMiddlewares(app);

  // Global Unhandled Exception Handlers
  // Note: Signal handling is now managed by ApplicationLifecycle
  UnhandledExceptionMiddleware();

  // CONNECT DB
  // TODO: Add database cleanup hook
  // applicationLifecycle.addCleanupHook(async () => {
  //   await database.close();
  // });

  // DEFINE ROUTES - now asynchronous
  await SetupRoutes(app);

  // ERROR HANDLERS
  // Catch 404 Errors
  app.use(NotFoundErrorMiddleware);
  // Global Error Handling Middleware
  app.use(GlobalErrorMiddleware);

  // Start server with professional error handling
  return new Promise<Server>((resolve, reject) => {
    const server = app.listen(LessConfig.port, LessConfig.host, () => {
      console.log(
        `[Bootstrap] Server running on http://${LessConfig.host}:${LessConfig.port}`
      );
      console.log(
        `[Bootstrap] Environment: ${process.env.NODE_ENV || 'development'}`
      );
      console.log(`[Bootstrap] Process ID: ${process.pid}`);

      // Register server with lifecycle manager
      applicationLifecycle.setServer(server);

      resolve(server);
    });

    server.on('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE') {
        // Handle port conflict professionally (no process killing)
        ApplicationLifecycle.handlePortConflict(LessConfig.port, error);
      } else if (error.code === 'EACCES') {
        console.error(
          `❌ Permission denied to bind to port ${LessConfig.port}`
        );
        console.error(
          '💡 Try using a port number above 1024 or run with elevated privileges'
        );
      } else {
        console.error('❌ Server startup error:', error.message);
      }

      reject(error);
    });

    // Handle server close events
    server.on('close', () => {
      console.log('[Bootstrap] Server closed');
    });
  });
};
