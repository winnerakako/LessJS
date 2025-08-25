const os = require('os');

// Simple config values for PM2 (avoids TypeScript dependency issues)
const PM2_CONFIG = {
  port: process.env.PORT ? parseInt(process.env.PORT) : 8000,
  host: process.env.HOST || '0.0.0.0',
};

module.exports = {
  apps: [
    {
      // Development - TypeScript with hot reload
      name: 'lessjs-dev',
      script: 'less-server.ts',
      interpreter: 'node',
      interpreter_args:
        '--require tsconfig-paths/register --require @swc-node/register',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: ['src/', '_lessjs/', 'less-server.ts', 'less-config.ts'],
      watch_delay: 1000,
      ignore_watch: ['node_modules', 'dist', 'logs', '.git', '*.log', '*.md'],
      max_memory_restart: '200M',
      env: {
        NODE_ENV: 'development',
        PORT: PM2_CONFIG.port,
        HOST: PM2_CONFIG.host,
      },
      error_file: './logs/pm2/dev-error.log',
      out_file: './logs/pm2/dev-out.log',
      log_file: './logs/pm2/dev-combined.log',
      time: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      kill_timeout: 5000,
      listen_timeout: 3000,
    },
    {
      // Production - Compiled JavaScript, clustered
      name: 'lessjs-prod',
      script: './dist/less-server.js',
      node_args: '--require module-alias/register',
      instances: Math.max(1, os.cpus().length - 1),
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env_production: {
        NODE_ENV: 'production',
        PORT: PM2_CONFIG.port,
        HOST: PM2_CONFIG.host,
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
      instances: Math.max(1, os.cpus().length - 1), // Same clustering as production
      exec_mode: 'cluster', // Same as production
      autorestart: true,
      watch: false,
      max_memory_restart: '500M', // Same as production
      env_staging: {
        NODE_ENV: 'staging',
        PORT: PM2_CONFIG.port + 1, // Staging runs on port + 1
        HOST: PM2_CONFIG.host,
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
