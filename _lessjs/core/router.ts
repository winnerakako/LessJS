import { NextFunction, Request, Response, Router } from 'express';
import { LessError } from '../common/less-error';
import { LessResponse } from '../common/less-response';
import { LessTryCatch } from '../common/less-try-catch';

// Enhanced controller types
type ControllerHandler = (
  req: Request,
  res: Response,
  next?: NextFunction
) => any;

type Middleware = (req: Request, res: Response, next: NextFunction) => void;

interface ControllerOptions {
  statusCode?: number;
  successMessage?: string;
  errorMessage?: string;
}

// Smart Controller with automatic status code detection
export const SmartController = (
  handler: ControllerHandler,
  options: ControllerOptions = {}
) =>
  LessTryCatch(async (req, res, next) => {
    const responseData = await handler(req, res, next);

    // Auto-detect status code based on HTTP method if not provided
    let statusCode = options.statusCode;
    if (!statusCode) {
      const method = req.method.toLowerCase();
      switch (method) {
        case 'post':
          statusCode = 201; // Created
          break;
        case 'put':
        case 'patch':
          statusCode = 200; // OK
          break;
        case 'delete':
          statusCode = 204; // No Content
          break;
        default:
          statusCode = 200; // OK
      }
    }

    // If handler returns null/undefined for DELETE, use 204 with no content
    if (req.method.toLowerCase() === 'delete' && !responseData) {
      return res.status(204).send();
    }

    // Auto-add success message if not present
    if (
      responseData &&
      typeof responseData === 'object' &&
      !responseData.message &&
      options.successMessage
    ) {
      responseData.message = options.successMessage;
    }

    return LessResponse(res, statusCode, responseData);
  });

// HTTP Method-specific controllers
export const Get = (handler: ControllerHandler, options?: ControllerOptions) =>
  SmartController(handler, { statusCode: 200, ...options });

export const Post = (handler: ControllerHandler, options?: ControllerOptions) =>
  SmartController(handler, { statusCode: 201, ...options });

export const Put = (handler: ControllerHandler, options?: ControllerOptions) =>
  SmartController(handler, { statusCode: 200, ...options });

export const Patch = (
  handler: ControllerHandler,
  options?: ControllerOptions
) => SmartController(handler, { statusCode: 200, ...options });

export const Delete = (
  handler: ControllerHandler,
  options?: ControllerOptions
) => SmartController(handler, { statusCode: 204, ...options });

// Response helpers for common patterns
export const Ok = (data: any, message?: string) => ({ message, ...data });
export const Created = (data: any, message?: string) => ({ message, ...data });
export const NoContent = () => null;

// Quick error throwers
export const NotFound = (message = 'Resource not found') => {
  throw LessError.notFound(message);
};

export const BadRequest = (message = 'Bad request') => {
  throw LessError.badRequest(message);
};

export const Unauthorized = (message = 'Unauthorized') => {
  throw LessError.unauthorized(message);
};

export const Forbidden = (message = 'Forbidden') => {
  throw LessError.forbidden(message);
};

export const Conflict = (message = 'Conflict') => {
  throw LessError.conflict(message);
};

export const UnprocessableEntity = (
  message = 'Unprocessable entity',
  data?: any
) => {
  throw LessError.unprocessableEntity(message, data);
};

// Simple Router class - the preferred approach
export class SimpleRouter {
  private router: Router;

  constructor() {
    this.router = Router();
  }

  // Direct HTTP method wrappers with smart controllers
  get(path: string, handler: ControllerHandler, ...middlewares: Middleware[]) {
    this.router.get(path, ...middlewares, Get(handler));
    return this;
  }

  post(path: string, handler: ControllerHandler, ...middlewares: Middleware[]) {
    this.router.post(path, ...middlewares, Post(handler));
    return this;
  }

  put(path: string, handler: ControllerHandler, ...middlewares: Middleware[]) {
    this.router.put(path, ...middlewares, Put(handler));
    return this;
  }

  patch(
    path: string,
    handler: ControllerHandler,
    ...middlewares: Middleware[]
  ) {
    this.router.patch(path, ...middlewares, Patch(handler));
    return this;
  }

  delete(
    path: string,
    handler: ControllerHandler,
    ...middlewares: Middleware[]
  ) {
    this.router.delete(path, ...middlewares, Delete(handler));
    return this;
  }

  // Group routes with common prefix
  group(prefix: string, callback: (router: SimpleRouter) => void) {
    const groupRouter = new SimpleRouter();
    callback(groupRouter);
    this.router.use(prefix, groupRouter.build());
    return this;
  }

  // Apply middleware to all routes
  use(...middlewares: Middleware[]) {
    middlewares.forEach((middleware) => this.router.use(middleware));
    return this;
  }

  // Build the Express router
  build(): Router {
    return this.router;
  }
}

// Factory function for creating routers
export const router = () => new SimpleRouter();

// Ultra-simple object-based route definitions
export const routes = (routeDefinitions: Record<string, ControllerHandler>) => {
  const simpleRouter = new SimpleRouter();

  Object.entries(routeDefinitions).forEach(([key, handler]) => {
    const [method, path] = key.split(' ');
    const httpMethod = method.toLowerCase() as
      | 'get'
      | 'post'
      | 'put'
      | 'patch'
      | 'delete';

    // Directly call the appropriate method on SimpleRouter
    switch (httpMethod) {
      case 'get':
        simpleRouter.get(path, handler);
        break;
      case 'post':
        simpleRouter.post(path, handler);
        break;
      case 'put':
        simpleRouter.put(path, handler);
        break;
      case 'patch':
        simpleRouter.patch(path, handler);
        break;
      case 'delete':
        simpleRouter.delete(path, handler);
        break;
    }
  });

  return simpleRouter.build();
};

// Legacy Controller support for backward compatibility
export const Controller = (
  handlerOrStatusCode: ControllerHandler | number,
  handlerOrOptions?: ControllerHandler | ControllerOptions
) => {
  // Legacy support: Controller(statusCode, handler)
  if (typeof handlerOrStatusCode === 'number') {
    const statusCode = handlerOrStatusCode;
    const handler = handlerOrOptions as ControllerHandler;
    return SmartController(handler, { statusCode });
  }

  // New support: Controller(handler, options)
  const handler = handlerOrStatusCode;
  const options = (handlerOrOptions as ControllerOptions) || {};
  return SmartController(handler, options);
};
