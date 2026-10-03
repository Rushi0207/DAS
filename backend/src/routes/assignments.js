const { Router } = require('express');
const assignmentController = require('../controllers/assignment.controller');
const authenticate         = require('../middleware/authenticate');
const authorize            = require('../middleware/authorize');

const router = Router();

router.use(authenticate);

/**
 * GET /api/v1/assignments
 * Global list of all teacher assignments.
 * Accessible by: Administrator, Class Advisor
 */
router.get(
  '/',
  authorize('Administrator', 'Class Advisor'),
  assignmentController.getAll,
);

/**
 * GET /api/v1/assignments/:id
 * Get a single assignment by id.
 * Accessible by: Administrator, Class Advisor, Subject Teacher
 */
router.get(
  '/:id',
  authorize('Administrator', 'Class Advisor', 'Subject Teacher'),
  assignmentController.getById,
);

/**
 * PATCH /api/v1/assignments/:id
 * Toggle isActive on an assignment.
 * Accessible by: Administrator only
 */
router.patch(
  '/:id',
  authorize('Administrator'),
  assignmentController.update,
);

module.exports = router;
