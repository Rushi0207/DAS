const env = require('../config/env');

/**
 * Central Express error-handling middleware.
 *
 * All errors thrown or passed via next(err) arrive here.
 * Never expose stack traces or internal details in production.
 *
 * Standard error shape:
 * {
 *   success: false,
 *   error: {
 *     code:    string   — stable machine-readable code
 *     message: string   — human-readable message
 *     details: any      — optional validation details
 *   }
 * }
 */
function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  // Operational errors carry a statusCode we set deliberately
  const statusCode = err.statusCode || 500;
  const code = err.code || 'INTERNAL_ERROR';
  const message = err.message || 'An unexpected error occurred';
  const details = err.details || undefined;

  // Log full error internally (never send stack to client in production)
  if (env.isDevelopment) {
    console.error(`[error] ${req.method} ${req.originalUrl}`, err);
  } else {
    console.error(`[error] ${statusCode} ${code}: ${message}`);
  }

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      ...(details !== undefined && { details }),
    },
  });
}

module.exports = errorHandler;
