export { Bootstrap } from "./bootstrap";
export { SetupRoutes } from "./route";
export { Dto } from "./dto";

// Unified Router System - All routing functionality consolidated
export {
  // Core router classes and functions
  SimpleRouter,
  router,
  routes,

  // Controllers
  SmartController,
  Controller, // Legacy support
  Get,
  Post,
  Put,
  Patch,
  Delete,

  // Response helpers
  Ok,
  Created,
  NoContent,

  // Error helpers
  NotFound,
  BadRequest,
  Unauthorized,
  Forbidden,
  Conflict,
  UnprocessableEntity,
} from "./router";
