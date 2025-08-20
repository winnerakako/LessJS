// Security middleware configuration
export interface SecurityConfig {
  httpsRedirect: {
    enabled: boolean;
    environments: string[];
    allowedHosts: string[];
  };
  helmet: {
    enabled: boolean;
    options: Record<string, any>;
  };
  cors: {
    enabled: boolean;
    options: {
      origin:
        | string[]
        | ((
            origin: string | undefined,
            callback: (err: Error | null, allow?: boolean) => void
          ) => void);
      optionsSuccessStatus: number;
      methods: string[];
      credentials: boolean;
      maxAge?: number;
    };
  };
  hpp: {
    enabled: boolean;
    options: Record<string, any>;
  };
  rateLimit: {
    enabled: boolean;
    options: {
      windowMs: number;
      max: number;
      message: string;
    };
  };
  bodyParsers: {
    enabled: boolean;
    json: boolean;
    urlencoded: {
      enabled: boolean;
      extended: boolean;
    };
  };
  compression: {
    enabled: boolean;
    options: {
      filter: (req: any, res: any) => boolean;
    };
  };
  xssSanitization: {
    enabled: boolean;
  };
  mongoSanitize: {
    enabled: boolean;
    options: Record<string, any>;
  };
  logging: {
    enabled: boolean;
    format: string;
  };
  debug: {
    enabled: boolean;
    logRequests: boolean;
  };
}
