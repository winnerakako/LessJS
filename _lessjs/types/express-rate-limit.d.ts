declare module 'express-rate-limit' {
  import { RequestHandler } from 'express';

  interface Options {
    windowMs?: number;
    max?: number;
    message?: string | object;
    statusCode?: number;
    headers?: boolean;
    keyGenerator?: (req: any) => string;
    skip?: (req: any) => boolean;
    handler?: (req: any, res: any, next: any) => void;
    onLimitReached?: (req: any, res: any, options: Options) => void;
    [key: string]: any;
  }

  function rateLimit(options?: Options): RequestHandler;

  export = rateLimit;
}
