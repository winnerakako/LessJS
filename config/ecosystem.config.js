const { loadEnvironment } = require('../scripts/env-loader');

// Helper function to get config for a specific environment
function getConfigForEnvironment(env) {
  // Temporarily store current env vars
  const originalEnv = { ...process.env };

  // Load environment-specific variables
  loadEnvironment(env);

  const config = {
    port: process.env.PORT ? parseInt(process.env.PORT, 10) : 8000,
    host: process.env.HOST || '0.0.0.0',
  };

  // Restore original env vars to avoid conflicts
  Object.keys(process.env).forEach((key) => {
    if (!(key in originalEnv)) {
      // eslint-disable-next-line security/detect-object-injection
      delete process.env[key];
    }
  });
  Object.assign(process.env, originalEnv);

  return config;
}

// Get environment-specific configurations
const prodConfig = getConfigForEnvironment('production');
const stagingConfig = getConfigForEnvironment('staging');

module.exports = {
  apps: [
    {
      // Production - Compiled JavaScript, clustered
      name: 'lessjs-prod',
      script: './dist/less-server.js',
      node_args: '--require module-alias/register',
      // instances: Math.max(1, os.cpus().length - 1), // cluster mode
      instances: 1, // single instance mode
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env_production: {
        NODE_ENV: 'production',
        PORT: prodConfig.port,
        HOST: prodConfig.host,
      },
      error_file: './logs/pm2/prod-error.log',
      out_file: './logs/pm2/prod-out.log',
      log_file: './logs/pm2/prod-combined.log',
      time: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      kill_timeout: 30000,
      listen_timeout: 10000,
      restart_delay: 2000,
      min_uptime: '10s',
      max_restarts: 5,
    },
    {
      // Staging - Mirrors production configuration for accurate testing
      name: 'lessjs-staging',
      script: './dist/less-server.js',
      node_args: '--require module-alias/register',
      instances: 1, // Match production single instance mode
      exec_mode: 'cluster', // Same as production
      autorestart: true,
      watch: false,
      max_memory_restart: '500M', // Same as production
      env_staging: {
        NODE_ENV: 'staging',
        PORT: stagingConfig.port,
        HOST: stagingConfig.host,
      },
      error_file: './logs/pm2/staging-error.log',
      out_file: './logs/pm2/staging-out.log',
      log_file: './logs/pm2/staging-combined.log',
      time: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      kill_timeout: 30000, // Same as production
      listen_timeout: 10000, // Same as production
      restart_delay: 2000, // Same as production
      min_uptime: '10s', // Same as production
      max_restarts: 5, // Same as production
    },
  ],
};
