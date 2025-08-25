import compression from 'compression';
import cors from 'cors';
import express, { Application, NextFunction, Request, Response } from 'express';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import hpp from 'hpp';
import morgan from 'morgan';
import xss from 'xss';
import { LessConfig } from '../../less-config';

// 1. HTTPS Redirect in production - SECURE VERSION
const isSecureRequest = (req: Request): boolean => {
  return !!(
    req.secure ||
    req.headers['x-forwarded-proto'] === 'https' ||
    req.headers['x-forwarded-ssl'] === 'on' ||
    req.headers['x-arr-ssl'] ||
    req.headers['cloudfront-forwarded-proto'] === 'https'
  );
};

const validateHost = (host: string | undefined): string | null => {
  if (!host) return null;

  // Get allowed hosts from config or use defaults
  const allowedHosts = LessConfig.securityConfig?.httpsRedirect
    ?.allowedHosts || ['localhost', '127.0.0.1'];

  // Remove port and convert to lowercase
  const cleanHost = host.split(':')[0].toLowerCase();

  // Check if host is in whitelist
  return allowedHosts.some((allowed) => {
    if (allowed.startsWith('*.')) {
      // Wildcard subdomain matching
      const domain = allowed.slice(2);
      return (
        cleanHost.endsWith(domain) &&
        (cleanHost === domain || cleanHost.endsWith('.' + domain))
      );
    }
    return cleanHost === allowed;
  })
    ? cleanHost
    : null;
};

const httpsRedirect = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Check if HTTPS redirect is enabled in config
  if (
    LessConfig.securityConfig?.httpsRedirect?.enabled &&
    LessConfig.securityConfig?.httpsRedirect?.environments.includes(
      process.env.NODE_ENV || ''
    ) &&
    !isSecureRequest(req)
  ) {
    // Validate and sanitize the host header
    const validHost = validateHost(req.headers.host);
    if (validHost) {
      // Use 301 permanent redirect and sanitize URL
      const sanitizedUrl = req.url.replace(/[<>"']/g, '');
      res.redirect(301, `https://${validHost}${sanitizedUrl}`);
      return;
    } else {
      // Invalid host - reject the request
      res.status(400).json({ error: 'Invalid host header' });
      return;
    }
  }
  next();
};

// 2. Helmet for security headers - ENHANCED VERSION
const createHelmetMiddleware = () => {
  const helmetConfig = LessConfig.securityConfig?.helmet;

  // Enhanced security headers configuration
  const defaultHelmetOptions = {
    // Content Security Policy
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"], // Consider removing unsafe-inline in production
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        fontSrc: ["'self'", 'https:', 'data:'],
        connectSrc: ["'self'"],
        mediaSrc: ["'self'"],
        objectSrc: ["'none'"],
        childSrc: ["'self'"],
        frameSrc: ["'self'"],
        workerSrc: ["'self'"],
        manifestSrc: ["'self'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
      },
    },
    // HTTP Strict Transport Security
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    },
    // X-Frame-Options
    frameguard: {
      action: 'deny' as const,
    },
    // X-Content-Type-Options
    noSniff: true,
    // X-XSS-Protection
    xssFilter: true,
    // Referrer Policy
    referrerPolicy: {
      policy: 'no-referrer' as const,
    },
    // Feature Policy / Permissions Policy
    permissionsPolicy: {
      camera: [],
      microphone: [],
      geolocation: [],
      gyroscope: [],
      magnetometer: [],
      payment: [],
      usb: [],
    },
    // Cross-Origin-Opener-Policy
    crossOriginOpenerPolicy: {
      policy: 'same-origin' as const,
    },
    // Cross-Origin-Resource-Policy
    crossOriginResourcePolicy: {
      policy: 'cross-origin' as const,
    },
    // Cross-Origin-Embedder-Policy
    crossOriginEmbedderPolicy: false, // Set to true if you need cross-origin isolation
    // Remove X-Powered-By header
    hidePoweredBy: true,
    // DNS Prefetch Control
    dnsPrefetchControl: {
      allow: false,
    },
  };

  // Merge with user-provided options
  const mergedOptions = {
    ...defaultHelmetOptions,
    ...helmetConfig?.options,
  };

  return helmet(mergedOptions);
};

const helmetMiddleware = createHelmetMiddleware();

// 3. CORS middleware - SECURE VERSION with origin validation
const createCorsMiddleware = () => {
  const corsOptions = LessConfig.securityConfig?.cors?.options;

  if (corsOptions && typeof corsOptions.origin === 'function') {
    return cors(corsOptions);
  }

  // Fallback to secure default CORS configuration
  return cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) {
        callback(null, true);
        return;
      }

      const allowedOrigins = corsOptions?.origin || ['http://localhost:3000'];

      if (Array.isArray(allowedOrigins)) {
        // Remove dangerous 'null' origin and validate
        const safeOrigins = allowedOrigins.filter(
          (o) => o !== 'null' && typeof o === 'string'
        );

        if (safeOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error(`Origin ${origin} not allowed by CORS policy`));
        }
      } else {
        callback(new Error('Invalid CORS origin configuration'));
      }
    },
    methods: corsOptions?.methods || ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: corsOptions?.credentials || false,
    optionsSuccessStatus: 200,
    maxAge: 86400, // Cache preflight for 24 hours
  });
};

const corsMiddleware = createCorsMiddleware();

// 4. HPP (HTTP Parameter Pollution) Protection
const hppMiddleware = hpp(LessConfig.securityConfig?.hpp?.options);

// 5. Rate Limiting - SECURE VERSION with endpoint-specific limits
const createRateLimiter = () => {
  const rateLimitConfig = LessConfig.securityConfig?.rateLimit;

  if (!rateLimitConfig?.enabled) {
    return (req: Request, res: Response, next: NextFunction) => next();
  }

  return rateLimit({
    windowMs: rateLimitConfig.options?.windowMs || 60 * 1000, // 1 minute
    max: ((req: any) => {
      // Endpoint-specific rate limits
      const path = req.path.toLowerCase();
      // Authentication endpoints - per minute, not per hour
      if (path.includes('/auth/login') || path.includes('/auth/signin')) {
        return 50; // 50 attempts per minute (allows ~1 attempt every 1.2 seconds)
      }
      // Other auth endpoints - strict
      if (path.includes('/auth/')) {
        return 50;
      }
      // Password reset - per minute
      if (path.includes('/password') || path.includes('/reset')) {
        return 50; // 50 attempts per minute
      }
      // Registration - per minute
      if (path.includes('/register') || path.includes('/signup')) {
        return 50; // 50 attempts per minute
      }

      // API endpoints - moderate
      if (path.startsWith('/api/')) {
        return rateLimitConfig.options?.max || 100;
      }

      // Static resources - lenient
      if (
        path.match(/\.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)
      ) {
        return 1000;
      }
      // Default limit
      return rateLimitConfig.options?.max || 100;
    }) as any,
    message: {
      error: 'Too many requests from this IP, please try again later.',
      retryAfter: Math.ceil(
        (rateLimitConfig.options?.windowMs || 60 * 1000) / 1000
      ),
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    // Skip successful requests for static resources
    skipSuccessfulRequests: (req: Request) => {
      return (
        req.path.match(
          /\.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/
        ) !== null
      );
    },
    // Custom key generator for better tracking
    keyGenerator: (req: Request) => {
      // Use real IP behind proxies
      return (
        req.ip ||
        req.headers['x-forwarded-for']?.toString().split(',')[0] ||
        req.headers['x-real-ip']?.toString() ||
        req.socket.remoteAddress ||
        'unknown'
      );
    },
    // Custom handler for rate limit exceeded
    handler: (req: Request, res: Response) => {
      res.status(429).json({
        error: 'Rate limit exceeded',
        message: 'Too many requests from this IP, please try again later.',
        retryAfter: Math.ceil(
          (rateLimitConfig.options?.windowMs || 60 * 1000) / 1000
        ),
      });
    },
  });
};

const limiter = createRateLimiter();

// 6. Body parsers
const bodyParsers: express.RequestHandler[] = [];
if (LessConfig.securityConfig?.bodyParsers?.json) {
  bodyParsers.push(express.json());
}
if (LessConfig.securityConfig?.bodyParsers?.urlencoded?.enabled) {
  bodyParsers.push(
    express.urlencoded({
      extended: LessConfig.securityConfig?.bodyParsers?.urlencoded?.extended,
    })
  );
}

// 7. Compression middleware
const compressionMiddleware = compression(
  LessConfig.securityConfig?.compression?.options
);

// 8. Input sanitization with xss - ENHANCED VERSION with depth limiting
const sanitizeInput = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const MAX_DEPTH = 10; // Prevent deep recursion attacks
  const MAX_KEYS = 100; // Prevent object explosion attacks

  const sanitize = (data: any, depth = 0): any => {
    // Prevent excessive recursion
    if (depth > MAX_DEPTH) {
      return '[MAX_DEPTH_EXCEEDED]';
    }

    if (typeof data === 'string') {
      // Enhanced XSS protection
      return xss(data, {
        whiteList: {}, // No HTML tags allowed
        stripIgnoreTag: true,
        stripIgnoreTagBody: ['script', 'style'],
      });
    } else if (Array.isArray(data)) {
      // Limit array size to prevent DoS
      if (data.length > MAX_KEYS) {
        return data.slice(0, MAX_KEYS).map((item) => sanitize(item, depth + 1));
      }
      return data.map((item) => sanitize(item, depth + 1));
    } else if (typeof data === 'object' && data !== null) {
      const keys = Object.keys(data);

      // Limit object keys to prevent DoS
      if (keys.length > MAX_KEYS) {
        return '[OBJECT_TOO_LARGE]';
      }

      // Recursively sanitize objects
      return keys.reduce<Record<string, any>>((acc, key) => {
        // Sanitize the key itself
        const sanitizedKey = typeof key === 'string' ? xss(key) : key;

        acc[sanitizedKey] = sanitize(data[key], depth + 1);
        return acc;
      }, {});
    }
    return data; // Return as-is if not a string, array, or object
  };

  // Sanitize body, query, and params
  if (req.body) {
    req.body = sanitize(req.body);
  }

  if (req.query) {
    req.query = sanitize(req.query);
  }

  if (req.params) {
    req.params = sanitize(req.params);
  }

  next();
};

// 9. Mongo Sanitize
const sanitizeDB = mongoSanitize(
  LessConfig.securityConfig?.mongoSanitize?.options
);

// Setup Middlewares
export const SecurityMiddlewares = (app: Application): void => {
  // Logging middleware
  if (LessConfig.securityConfig?.logging?.enabled) {
    app.use(morgan(LessConfig.securityConfig?.logging?.format));
  }

  // 1. Enable HTTPS Redirect in production
  if (LessConfig.securityConfig?.httpsRedirect?.enabled) {
    app.use(httpsRedirect);
  }

  // 2. Security Headers using Helmet
  if (LessConfig.securityConfig?.helmet?.enabled) {
    app.use(helmetMiddleware);
  }

  // 3. CORS configuration
  if (LessConfig.securityConfig?.cors?.enabled) {
    app.use(corsMiddleware);
  } else {
    app.use(cors());
  }

  // 4. HTTP Parameter Pollution Prevention using HPP
  if (LessConfig.securityConfig?.hpp?.enabled) {
    app.use(hppMiddleware);
  }

  // 5. Rate limiting for brute-force protection
  if (LessConfig.securityConfig?.rateLimit?.enabled) {
    app.use(limiter);
  }

  // 6. Body parsers
  if (LessConfig.securityConfig?.bodyParsers?.enabled) {
    bodyParsers.forEach((parser) => app.use(parser));
  }

  // 7. Compression middleware
  if (LessConfig.securityConfig?.compression?.enabled) {
    app.use(compressionMiddleware);
  }

  // 8. Input sanitization with XSS
  if (LessConfig.securityConfig?.xssSanitization?.enabled) {
    app.use(sanitizeInput);
  }

  // 9. DATA Sanitization against NoSQL query injection
  if (LessConfig.securityConfig?.mongoSanitize?.enabled) {
    app.use(sanitizeDB);
  }

  // Debugging - SECURE VERSION with sanitized logging
  if (
    process.env.NODE_ENV !== 'production' &&
    LessConfig.securityConfig?.debug?.enabled &&
    LessConfig.securityConfig?.debug?.logRequests
  ) {
    app.use((req: Request, res: Response, next: NextFunction): void => {
      // Sanitize sensitive data before logging
      const sanitizeForLogging = (obj: any): any => {
        if (!obj || typeof obj !== 'object') return obj;

        const sanitized = { ...obj };
        const sensitiveFields = [
          'password',
          'token',
          'authorization',
          'cookie',
          'session',
          'secret',
          'key',
          'pin',
          'otp',
          'ssn',
          'credit_card',
          'cvv',
        ];

        Object.keys(sanitized).forEach((key) => {
          const lowerKey = key.toLowerCase();
          if (sensitiveFields.some((field) => lowerKey.includes(field))) {
            sanitized[key] = '[REDACTED]';
          } else if (typeof sanitized[key] === 'object') {
            sanitized[key] = sanitizeForLogging(sanitized[key]);
          }
        });

        return sanitized;
      };

      console.log(
        'Request received:',
        'method:',
        req.method,
        'url:',
        req.url,
        'ip:',
        req.ip,
        'user-agent:',
        req.get('user-agent'),
        'params:',
        sanitizeForLogging(req.params),
        'query:',
        sanitizeForLogging(req.query),
        'body:',
        sanitizeForLogging(req.body)
      );
      next();
    });
  }
};
