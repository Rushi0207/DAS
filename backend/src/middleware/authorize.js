const AppError = require('../utils/AppError');

/**
 * authorize(...roles) — role-based access control middleware factory.
 *
 * Must be used AFTER authenticate middleware (relies on req.user).
 *
 * @param {...string} roles  Allowed role names, e.g. 'Administrator', 'Class Advisor'
 * @returns Express middleware
 *
 * Usage:
 *   router.post('/users', authenticate, authorize('Administrator'), handler);
 *   router.get('/classes', authenticate, authorize('Administrator', 'Class Advisor'), handler);
 */
function authorize(...roles) {
  return function (req, res, next) {
    if (!req.user) {
      // Should never happen if authenticate runs first, but guard anyway
      return next(new AppError('Authentication required', 401, 'TOKEN_MISSING'));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(
          `Access denied. Required role(s): ${roles.join(', ')}`,
          403,
          'FORBIDDEN',
        ),
      );
    }

    next();
  };
}

module.exports = authorize;
