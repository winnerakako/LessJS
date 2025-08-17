import "module-alias/register";
import express from "express";
import { LessConfig } from "./less-config";
import { Bootstrap } from "_lessjs/core";

// Set Timezone
process.env.TZ = LessConfig.timezone;

const app = express();

(async () => {
  try {
    await Bootstrap(app);
  } catch (error) {
    console.error("Error starting server:", error);
  }
})();
