/**
 * HTTP Status Codes for LessJS
 */
export class LessStatusCodes {
  // 2xx Success
  static readonly OK = 200;
  static readonly CREATED = 201;
  static readonly ACCEPTED = 202;
  static readonly NO_CONTENT = 204;

  // 4xx Client Error
  static readonly BAD_REQUEST = 400;
  static readonly UNAUTHORIZED = 401;
  static readonly FORBIDDEN = 403;
  static readonly NOT_FOUND = 404;
  static readonly METHOD_NOT_ALLOWED = 405;
  static readonly CONFLICT = 409;
  static readonly UNPROCESSABLE_ENTITY = 422;
  static readonly TOO_MANY_REQUESTS = 429;

  // 5xx Server Error
  static readonly INTERNAL_SERVER_ERROR = 500;
  static readonly NOT_IMPLEMENTED = 501;
  static readonly BAD_GATEWAY = 502;
  static readonly SERVICE_UNAVAILABLE = 503;
  static readonly GATEWAY_TIMEOUT = 504;
}

export default LessStatusCodes;
