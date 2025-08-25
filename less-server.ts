import { Bootstrap } from '_lessjs/core';
import express from 'express';
import 'module-alias/register';
import { LessConfig } from './less-config';

// Set Timezone
process.env.TZ = LessConfig.timezone;

const app = express();

(async () => {
  try {
    const server = await Bootstrap(app);
    console.log('✅ Server started successfully');
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
})();
