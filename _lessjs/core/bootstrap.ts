import { Express } from 'express';
import { LessConfig } from '../../less-config';
import {
  GlobalErrorMiddleware,
  NotFoundErrorMiddleware,
  UnhandledExceptionMiddleware,
} from '../middlewares/global-error-middlewares';
import { SecurityMiddlewares } from '../middlewares/security-middlewares';
import { SetupRoutes } from './route';

export const Bootstrap = async (app: Express) => {
  console.log('Bootstrap');

  // Trust proxy
  app.set('trust proxy', 1);

  // security middlewares
  SecurityMiddlewares(app);
  // Global Unhandled Exception Handlers
  UnhandledExceptionMiddleware();

  // CONNECT DB

  // DEFINE ROUTES - now asynchronous
  await SetupRoutes(app);

  // ERROR HANDLERS
  // Catch 404 Errors
  app.use(NotFoundErrorMiddleware);
  // Global Error Handling Middleware
  app.use(GlobalErrorMiddleware);

  app.listen(LessConfig.port, LessConfig.host, () =>
    console.log(
      `Server running on http://${LessConfig.host}:${LessConfig.port}`
    )
  );
};
