import { createHash } from 'crypto';
import { Express, Router } from 'express';
import { readdir, stat } from 'fs/promises';
import path from 'path';
import { LessConfig } from '../../less-config';

// Interface for route cache
interface RouteCache {
  files: string[];
  hash: string;
  timestamp: number;
}

// In-memory cache for route discovery
let routeCache: RouteCache | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

// Generate directory hash for cache validation
const generateDirectoryHash = async (dir: string): Promise<string> => {
  try {
    const items = await readdir(dir);
    const sortedItems = items.sort();
    const hash = createHash('md5');
    hash.update(sortedItems.join('|'));
    return hash.digest('hex');
  } catch (error) {
    console.warn(`Could not generate hash for ${dir}:`, error);
    return Date.now().toString(); // Fallback to timestamp
  }
};

// Check if file is a route file based on naming convention
const isRouteFile = (filename: string): boolean => {
  return (
    filename.endsWith('.routes.ts') ||
    filename.endsWith('.routes.js') ||
    filename.endsWith('.route.ts') ||
    filename.endsWith('.route.js') ||
    (filename.includes('route') &&
      (filename.endsWith('.ts') || filename.endsWith('.js')))
  );
};

// Recursively find all route files in a directory with async operations and batch processing
const findRouteFiles = async (
  dir: string,
  batchSize: number = 10
): Promise<string[]> => {
  const files: string[] = [];

  try {
    const items = await readdir(dir);

    // Process items in batches to avoid overwhelming the system
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);

      const batchPromises = batch.map(async (item): Promise<string[]> => {
        const fullPath = path.join(dir, item);

        try {
          const statResult = await stat(fullPath);

          if (statResult.isDirectory()) {
            // Recursively search subdirectories
            return await findRouteFiles(fullPath, batchSize);
          } else if (isRouteFile(item)) {
            // Only include actual route files
            return [fullPath];
          }
        } catch (error) {
          console.warn(`Skipping ${fullPath}: ${(error as Error).message}`);
        }

        return [];
      });

      const batchResults = await Promise.all(batchPromises);
      files.push(...batchResults.flat());
    }
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, (error as Error).message);
  }

  return files;
};

// Get route files with caching mechanism
const getRouteFilesWithCache = async (
  routesPath: string
): Promise<string[]> => {
  const currentTime = Date.now();

  // Check if cache is valid
  if (routeCache && currentTime - routeCache.timestamp < CACHE_TTL) {
    const currentHash = await generateDirectoryHash(routesPath);

    if (currentHash === routeCache.hash) {
      console.log('Using cached route discovery results');
      return routeCache.files;
    } else {
      console.log('Directory structure changed, invalidating cache');
    }
  }

  // Discover routes and update cache
  const files = await findRouteFiles(routesPath);
  const hash = await generateDirectoryHash(routesPath);

  routeCache = {
    files,
    hash,
    timestamp: currentTime,
  };

  return files;
};

// Enhanced route validation
const validateRouteModule = (routeModule: any, filePath: string): boolean => {
  if (!routeModule) {
    console.error(`Route module is null/undefined: ${filePath}`);
    return false;
  }

  if (!routeModule.default) {
    console.error(`Route module missing default export: ${filePath}`);
    return false;
  }

  if (typeof routeModule.default !== 'function') {
    console.error(`Route default export is not a function: ${filePath}`);
    return false;
  }

  return true;
};

// Setup routes function with optimized performance using async loading
export const SetupRoutes = async (app: Express) => {
  try {
    // Start timer
    const startTime = process.hrtime();

    // console.log('🚀 Setting up routes...');
    const routesPath = path.join(__dirname, '../../src/shared/routes');

    // Get router files with caching
    const readDirStart = process.hrtime();
    const routeFilePaths = await getRouteFilesWithCache(routesPath);
    const readDirEnd = process.hrtime(readDirStart);
    const readDirDuration = readDirEnd[0] * 1000 + readDirEnd[1] / 1000000;
    // console.log(
    //   `📁 Route discovery completed in ${readDirDuration.toFixed(2)}ms`
    // );

    // console.log(`📄 Found ${routeFilePaths.length} route files`);

    // Early exit if no routes found
    if (routeFilePaths.length === 0) {
      console.warn('⚠️  No route files found');
      return;
    }

    // Create a single master router
    const masterRouter = Router();

    // Memory optimization: Process routes in smaller batches to avoid memory spikes
    const ROUTE_BATCH_SIZE = 5;
    const routeBatches: string[][] = [];

    for (let i = 0; i < routeFilePaths.length; i += ROUTE_BATCH_SIZE) {
      routeBatches.push(routeFilePaths.slice(i, i + ROUTE_BATCH_SIZE));
    }

    // console.log(`⚡ Processing ${routeBatches.length} route batches`);

    let totalLoadedCount = 0;
    const loadingStartTime = process.hrtime();

    // Process each batch sequentially to manage memory usage
    for (let batchIndex = 0; batchIndex < routeBatches.length; batchIndex++) {
      const batch = routeBatches[batchIndex];

      const batchPromises = batch.map(async (routePath: string) => {
        const file = path.basename(routePath);
        const startImportTime = process.hrtime();

        try {
          // Use dynamic import() for asynchronous loading
          const routeModule = await import(routePath);

          const endImportTime = process.hrtime(startImportTime);
          const importDuration =
            endImportTime[0] * 1000 + endImportTime[1] / 1000000;

          // Enhanced validation
          if (!validateRouteModule(routeModule, routePath)) {
            return null;
          }

          return {
            route: routeModule.default,
            file,
            path: routePath,
            loadTime: importDuration,
          };
        } catch (err) {
          const endImportTime = process.hrtime(startImportTime);
          const importDuration =
            endImportTime[0] * 1000 + endImportTime[1] / 1000000;

          console.error(
            `❌ Error loading route ${file} after ${importDuration.toFixed(2)}ms:`,
            (err as Error).message
          );
          return null;
        }
      });

      // Wait for current batch to complete
      const batchResults = await Promise.allSettled(batchPromises);

      // Mount successfully loaded routes from this batch
      batchResults.forEach((result) => {
        if (result.status === 'fulfilled' && result.value) {
          try {
            masterRouter.use('/', result.value.route);
            totalLoadedCount++;
            // console.log(
            //   `✅ Mounted route: ${result.value.file} (${result.value.loadTime.toFixed(2)}ms)`
            // );
          } catch (mountError) {
            console.error(
              `❌ Error mounting route ${result.value.file}:`,
              (mountError as Error).message
            );
          }
        }
      });

      // Optional: Small delay between batches to prevent overwhelming the system
      if (batchIndex < routeBatches.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1));
      }
    }

    const loadingEndTime = process.hrtime(loadingStartTime);
    const loadingDuration =
      loadingEndTime[0] * 1000 + loadingEndTime[1] / 1000000;

    // console.log(
    //   `⚡ Route loading completed in ${loadingDuration.toFixed(2)}ms`
    // );

    // Mount the master router once
    app.use(LessConfig.apiPrefix, masterRouter);

    // Calculate success rate
    const successRate = (
      (totalLoadedCount / routeFilePaths.length) *
      100
    ).toFixed(1);

    console.log(
      `🎯 Successfully mounted ${totalLoadedCount} out of ${routeFilePaths.length} routes (${successRate}%)`
    );

    // End timer and calculate total duration
    const endTime = process.hrtime(startTime);
    const totalDuration = endTime[0] * 1000 + endTime[1] / 1000000;

    // Enhanced completion logging with performance metrics
    console.log(`🚀 Routes setup completed in ${totalDuration.toFixed(2)}ms`);
    // console.log(`📊 Performance Summary:`);
    // console.log(`   - Discovery: ${readDirDuration.toFixed(2)}ms`);
    // console.log(`   - Loading: ${loadingDuration.toFixed(2)}ms`);
    // console.log(`   - Success Rate: ${successRate}%`);
    // console.log(
    //   `   - Average per route: ${(loadingDuration / totalLoadedCount).toFixed(2)}ms`
    // );

    // Memory usage hint
    if (process.memoryUsage) {
      const memUsage = process.memoryUsage();
      console.log(
        `   - Memory (RSS): ${(memUsage.rss / 1024 / 1024).toFixed(2)}MB`
      );
    }
  } catch (error) {
    console.error(
      '❌ Critical error setting up routes:',
      (error as Error).message
    );
    console.error('Stack trace:', (error as Error).stack);

    // In production, you might want to exit gracefully or implement fallback routes
    if (process.env.NODE_ENV === 'production') {
      console.error('🚨 Route setup failed in production environment');
    }
  }
};
