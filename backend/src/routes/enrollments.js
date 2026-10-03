const { Router } = require('express');
const enrollmentController = require('../controllers/enrollment.controller');
const authenticate         = require('../middleware/authenticate');
const authorize            = require('../middleware/authorize');

const router = Router();

router.use(authenticate);

/**
 * GET /api/v1/enrollments
 * Global list of all enrollments.
 * Accessible by: Administrator, Class Advisor
 */
router.get(
  '/',
  authorize('Administrator', 'Class Advisor'),
  enrollmentController.getAll,
);

/**
 * GET /api/v1/enrollments/:id
 * Get a single enrollment by id.
 * Accessible by: Administrator, Class Advisor, Subject Teacher
 */
router.get(
  '/:id',
  authorize('Administrator', 'Class Advisor', 'Subject Teacher'),
  enrollmentController.getById,
);

/**
 * PATCH /api/v1/enrollments/:id
 * Update rollNumber or toggle isActive.
 * Accessible by: Administrator, Class Advisor
 */
router.patch(
  '/:id',
  authorize('Administrator', 'Class Advisor'),
  enrollmentController.update,
);

module.exports = router;
