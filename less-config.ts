import dotenv from 'dotenv';
import path from 'path';

import { SecurityConfig } from './_lessjs/types/security.config';

// Load environment variables depending on the NODE_ENV value
if (process.env.NODE_ENV === 'production') {
  dotenv.config({ path: path.resolve(__dirname, '.env') });
} else if (process.env.NODE_ENV === 'staging') {
  dotenv.config({ path: path.resolve(__dirname, '.env.staging') });
} else {
  dotenv.config({ path: path.resolve(__dirname, '.env.dev') });
}

const ALLOWED_ORIGINS: string[] = [
  'https://yourdomain.com',
  'https://www.yourdomain.com',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  // Remove 'null' for security - it allows file:// protocol attacks
];

const ALLOWED_HOSTS: string[] = [
  'yourdomain.com',
  'www.yourdomain.com',
  'api.yourdomain.com',
  'localhost',
  '127.0.0.1',
  // Add wildcard subdomain support with '*.yourdomain.com'
];
const RATE_LIMIT_MAX: number = 100;
const RATE_LIMIT_WINDOW_MS: number = parseInt((60 * 1000).toString(), 10); // 1 minute
const LOGGING_FORMAT: string = 'dev';
const CLUSTER_MODE: boolean = true;
const VERSION: string = 'v1';
const API_PREFIX: string = '/api';
const PORT: number = 8000;
const HOST: string = '0.0.0.0';
const TIMEZONE: string = 'Africa/Lagos';
const ENABLE_CRON: boolean = true;
const ENABLE_HTTPS_REDIRECT: boolean = true;
const ENABLE_CORS: boolean = true;
const ENABLE_BODY_PARSERS: boolean = true;
const ENABLE_COMPRESSION: boolean = true;
const ENABLE_XSS_SANITIZATION: boolean = true;
const ENABLE_MONGO_SANITIZE: boolean = true;
const ENABLE_LOGGING: boolean = true;
const ENABLE_DEBUG: boolean = process.env.NODE_ENV !== 'production';
const ENABLE_HPP: boolean = true;
const ENABLE_RATE_LIMIT: boolean = true;
const ENABLE_HELMET: boolean = true;

export const LessConfig = {
  port: process.env.PORT ? parseInt(process.env.PORT) : PORT,
  timezone: process.env.TZ || TIMEZONE,
  host: process.env.HOST || HOST,
  apiPrefix: process.env.API_PREFIX || API_PREFIX,
  appVersion: process.env.APP_VERSION || VERSION,
  enableCluster: CLUSTER_MODE,
  enableCron: ENABLE_CRON,
  securityConfig: {
    // HTTPS redirect settings
    httpsRedirect: {
      enabled: ENABLE_HTTPS_REDIRECT,
      environments: ['production', 'staging'],
      allowedHosts: ALLOWED_HOSTS,
    },
    // Helmet security headers
    helmet: {
      enabled: ENABLE_HELMET,
      options: {}, // Additional helmet options can be specified here
    },
    // CORS settings
    cors: {
      enabled: ENABLE_CORS,
      options: {
        origin: (
          origin: string | undefined,
          callback: (err: Error | null, allow?: boolean) => void
        ) => {
          // Allow requests with no origin (mobile apps, Postman, etc.)
          if (!origin) {
            callback(null, true);
            return;
          }

          // Check if origin is in allowed list
          if (ALLOWED_ORIGINS.includes(origin)) {
            callback(null, true);
          } else {
            callback(new Error(`Origin ${origin} not allowed by CORS policy`));
          }
        },
        optionsSuccessStatus: 200,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        credentials: true,
        maxAge: 86400, // Cache preflight for 24 hours
      },
    },
    // HTTP Parameter Pollution protection
    hpp: {
      enabled: ENABLE_HPP,
      options: {}, // Additional hpp options
    },
    // Rate limiting
    rateLimit: {
      enabled: ENABLE_RATE_LIMIT,
      options: {
        windowMs: RATE_LIMIT_WINDOW_MS,
        max: RATE_LIMIT_MAX,
        message:
          'Too many requests from this IP, please try again after 1 minute',
      },
    },
    // Body parsers
    bodyParsers: {
      enabled: ENABLE_BODY_PARSERS,
      json: true,
      urlencoded: {
        enabled: true,
        extended: true,
      },
    },
    // Response compression
    compression: {
      enabled: ENABLE_COMPRESSION,
      options: {
        filter: (req: any) => {
          if (req.headers['x-no-compression']) {
            return false;
          }
          return true;
        },
      },
    },
    // XSS protection
    xssSanitization: {
      enabled: ENABLE_XSS_SANITIZATION,
    },
    // MongoDB sanitization
    mongoSanitize: {
      enabled: ENABLE_MONGO_SANITIZE,
      options: {},
    },
    // Request logging
    logging: {
      enabled: ENABLE_LOGGING,
      format: LOGGING_FORMAT,
    },
    // Debug mode
    debug: {
      enabled: ENABLE_DEBUG,
      logRequests: true,
    },
  } as SecurityConfig,
};
