declare module 'morgan' {
  import { RequestHandler } from 'express';

  interface TokenIndexer {
    [tokenName: string]: string;
  }

  type FormatFn = (tokens: TokenIndexer, req: any, res: any) => string;

  function morgan(
    format: string | FormatFn,
    options?: morgan.Options
  ): RequestHandler;

  namespace morgan {
    export interface Options {
      stream?: { write: (str: string) => void };
      skip?: (req: any, res: any) => boolean;
      [key: string]: any;
    }

    export function token(
      name: string,
      callback: (req: any, res: any, arg?: any) => string
    ): morgan;
    export function format(name: string, fmt: string | FormatFn): morgan;

    export const combined: string;
    export const common: string;
    export const dev: string;
    export const short: string;
    export const tiny: string;
  }

  export = morgan;
}
