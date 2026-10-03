const jwt = require('jsonwebtoken');
const env = require('../config/env');
const AppError = require('./AppError');

function signToken(payload) {
  return jwt.sign(payload, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
    issuer: 'das-api',
  });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, env.jwtSecret, { issuer: 'das-api' });
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw new AppError('Token has expired', 401, 'TOKEN_EXPIRED');
    }
    throw new AppError('Invalid token', 401, 'TOKEN_INVALID');
  }
}

module.exports = { signToken, verifyToken };
