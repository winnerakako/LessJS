declare module 'hpp' {
  import { RequestHandler } from 'express';

  interface Options {
    whitelist?: string[];
    checkQuery?: boolean;
    checkBody?: boolean;
    checkParams?: boolean;
    [key: string]: any;
  }

  function hpp(options?: Options): RequestHandler;

  export = hpp;
}
