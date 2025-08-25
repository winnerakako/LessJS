const dotenv = require('dotenv');
const path = require('path');

/**
 * Loads environment variables based on NODE_ENV
 * @param {string} env - The environment (production, staging, development)
 * @returns {void}
 */
function loadEnvironment(env = process.env.NODE_ENV || 'development') {
  const envFiles = {
    production: 'env/.env',
    staging: 'env/.env.staging',
    development: 'env/.env.dev',
  };

  // eslint-disable-next-line security/detect-object-injection
  const envFile = envFiles[env] || 'env/.env.dev';
  const envPath = path.resolve(__dirname, '..', envFile);

  try {
    dotenv.config({ path: envPath });
  } catch {
    console.warn(
      `Warning: Could not load ${envFile}, using defaults or system environment variables`
    );
  }
}

module.exports = { loadEnvironment };
