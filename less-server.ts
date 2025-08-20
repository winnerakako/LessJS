import { Bootstrap } from '_lessjs/core';
import express from 'express';
import 'module-alias/register';
import { LessConfig } from './less-config';

// Set Timezone
process.env.TZ = LessConfig.timezone;

const app = express();

(async () => {
  try {
    await Bootstrap(app);
  } catch (error) {
    console.error('Error starting server:', error);
  }
})();
