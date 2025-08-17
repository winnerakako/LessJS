import { readdirSync } from "fs";
import { Express, Router } from "express";
import { LessConfig } from "../../less-config";
import path from "path";

// Setup routes function with optimized performance using async loading
export const SetupRoutes = async (app: Express) => {
  try {
    // Start timer
    const startTime = process.hrtime();

    console.log("Setting up routes...");
    const routesPath = path.join(__dirname, "../../src/routes");

    // Get router files synchronously - this is usually fast
    const readDirStart = process.hrtime();
    const routeFiles = readdirSync(routesPath).filter(
      (file) => file.endsWith(".ts") || file.endsWith(".js")
    );
    const readDirEnd = process.hrtime(readDirStart);
    const readDirDuration = readDirEnd[0] * 1000 + readDirEnd[1] / 1000000;
    console.log(`readdirSync completed in ${readDirDuration.toFixed(2)}ms`);

    console.log(`Found ${routeFiles.length} route files`);

    // Create a single master router
    const masterRouter = Router();

    // Load all routes concurrently using dynamic import()
    const routePromises = routeFiles.map(async (file) => {
      const routePath = path.join(routesPath, file);
      const startImportTime = process.hrtime(); // Start timing for this route
      try {
        // Use dynamic import() for asynchronous loading
        const routeModule = await import(routePath);
        const route = routeModule.default; // Assuming routes export default

        const endImportTime = process.hrtime(startImportTime);
        const importDuration =
          endImportTime[0] * 1000 + endImportTime[1] / 1000000;
        // console.log(`Loaded route ${file} in ${importDuration.toFixed(2)}ms`); // Log duration

        // Basic validation: Check if the default export is a function (likely a router or middleware)
        if (typeof route === "function") {
          return { route, file }; // Return the loaded route and filename
        } else {
          console.error(
            `Error loading route ${file}: Default export is not a function or router.`
          );
          return null;
        }
      } catch (err) {
        const endImportTime = process.hrtime(startImportTime); // Still record time on error
        const importDuration =
          endImportTime[0] * 1000 + endImportTime[1] / 1000000;
        console.error(
          `Error loading route ${file} after ${importDuration.toFixed(2)}ms:`,
          err
        );
        return null; // Return null on error to filter out later
      }
    });

    // Wait for all route loading promises to settle
    const settledRoutes = await Promise.allSettled(routePromises);

    // Process results and mount successfully loaded routes
    let loadedCount = 0;
    settledRoutes.forEach((result, index) => {
      if (result.status === "fulfilled" && result.value) {
        // Add the successfully loaded route to the master router
        masterRouter.use("/", result.value.route);
        loadedCount++;
      } else if (result.status === "rejected") {
        // Error already logged in the map function, but we can log the file again if needed
        console.error(
          `Failed to process route ${routeFiles[index]}: ${result.reason}`
        );
      }
      // Cases where result.status is 'fulfilled' but result.value is null (due to validation fail) are ignored here
    });

    // Mount the master router once
    app.use(LessConfig.apiPrefix, masterRouter);
    console.log(
      `Successfully mounted ${loadedCount} out of ${routeFiles.length} routes`
    );

    // End timer and calculate duration
    const endTime = process.hrtime(startTime);
    const duration = endTime[0] * 1000 + endTime[1] / 1000000; // Convert to milliseconds
    console.log(`Routes setup completed in ${duration.toFixed(2)}ms`);
  } catch (error) {
    console.error("Error setting up routes:", error);
  }
};
