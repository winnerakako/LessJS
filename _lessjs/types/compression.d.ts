declare module 'compression' {
  import { RequestHandler } from 'express';

  interface CompressionOptions {
    threshold?: number;
    level?: number;
    filter?: (req: any, res: any) => boolean;
    chunkSize?: number;
    [key: string]: any;
  }

  function compression(options?: CompressionOptions): RequestHandler;

  namespace compression {
    export interface CompressionOptions {
      threshold?: number;
      level?: number;
      filter?: (req: any, res: any) => boolean;
      chunkSize?: number;
      [key: string]: any;
    }
  }

  export = compression;
}
