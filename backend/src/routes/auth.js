const { Router } = require('express');
const authController = require('../controllers/auth.controller');
const authenticate = require('../middleware/authenticate');
const authorize    = require('../middleware/authorize');

const router = Router();

/**
 * POST /api/v1/auth/login
 * Public — no auth required.
 * Body: { login: string, password: string }
 * Returns: { success: true, data: { token, user } }
 */
router.post('/login', authController.login);

/**
 * GET /api/v1/auth/me
 * Protected — requires valid JWT.
 * Returns the authenticated user's own profile.
 */
router.get('/me', authenticate, authController.getMe);

module.exports = router;
