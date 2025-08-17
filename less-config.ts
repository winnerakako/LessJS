export const LessConfig = {
  port: process.env.PORT ? parseInt(process.env.PORT) : 8000,
  timezone: process.env.TZ || "Africa/Lagos",
  host: process.env.HOST || "0.0.0.0",
  apiPrefix: process.env.API_PREFIX || "/api",
  appVersion: process.env.APP_VERSION || "v1",
};
