const { Router } = require('express');
const userController = require('../controllers/user.controller');
const authenticate   = require('../middleware/authenticate');
const authorize      = require('../middleware/authorize');

const router = Router();

// All user management routes require: valid JWT + Administrator role
router.use(authenticate);
router.use(authorize('Administrator'));

/**
 * GET /api/v1/users
 * List all users. Optional filters: ?roleId=&isActive=
 */
router.get('/', userController.getAll);

/**
 * GET /api/v1/users/roles
 * List all roles (helper for create/update forms).
 * Must be defined BEFORE /:id to avoid 'roles' being parsed as an id.
 */
router.get('/roles', userController.getRoles);

/**
 * GET /api/v1/users/:id
 * Get a single user by id.
 */
router.get('/:id', userController.getById);

/**
 * POST /api/v1/users
 * Create a new user.
 * Body: { username, email, password, roleId }
 */
router.post('/', userController.create);

/**
 * PATCH /api/v1/users/:id
 * Update username, email, roleId, or isActive.
 * Body: (any subset of the above fields)
 */
router.patch('/:id', userController.update);

/**
 * DELETE /api/v1/users/:id
 * Soft-deactivate a user (sets isActive = false).
 */
router.delete('/:id', userController.deactivate);

module.exports = router;
