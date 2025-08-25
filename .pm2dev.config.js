// Simplified PM2 config for development
const { LessConfig } = require('./less-config.ts');

module.exports = {
  apps: [
    {
      name: 'lessjs-dev',
      script: 'less-server.ts',
      interpreter: 'node',
      interpreter_args:
        '--require tsconfig-paths/register --require @swc-node/register',
      instances: 1,
      autorestart: true,
      watch: true,
      watch_delay: 1000,
      ignore_watch: ['node_modules', 'dist', 'logs', '.git', '*.log', '*.md'],
      max_memory_restart: '200M',
      env: {
        NODE_ENV: 'development',
        PORT: LessConfig.port,
        HOST: LessConfig.host,
      },
      error_file: './logs/pm2/dev-error.log',
      out_file: './logs/pm2/dev-out.log',
      log_file: './logs/pm2/dev-combined.log',
      time: true,
      merge_logs: true,
      kill_timeout: 5000,
      listen_timeout: 3000,
    },
  ],
};
