const { verifyToken } = require('../utils/jwt');
const AppError = require('../utils/AppError');

/**
 * authenticate — JWT verification middleware.
 *
 * Extracts Bearer token from Authorization header, verifies it,
 * and attaches the decoded payload to req.user.
 *
 * req.user shape after this middleware:
 *   { id, username, email, role, iat, exp }
 *
 * Usage:
 *   router.get('/protected', authenticate, handler);
 */
function authenticate(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Authentication token required', 401, 'TOKEN_MISSING'));
  }

  const token = authHeader.slice(7); // strip "Bearer "

  try {
    const decoded = verifyToken(token);
    req.user = decoded; // { id, username, email, role, iat, exp }
    next();
  } catch (err) {
    next(err); // AppError from verifyToken (TOKEN_EXPIRED | TOKEN_INVALID)
  }
}

module.exports = authenticate;
