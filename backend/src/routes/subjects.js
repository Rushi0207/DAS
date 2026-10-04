const { Router } = require('express');
const subjectController = require('../controllers/subject.controller');
const authenticate      = require('../middleware/authenticate');
const authorize         = require('../middleware/authorize');

const router = Router();

router.use(authenticate);

/**
 * GET /api/v1/subjects
 * List all subjects. Optional: ?search=<string>
 * Accessible by: all roles
 */
router.get(
  '/',
  authorize('Administrator', 'Class Advisor', 'Subject Teacher'),
  subjectController.getAll,
);

/**
 * GET /api/v1/subjects/:id
 * Accessible by: all roles
 */
router.get(
  '/:id',
  authorize('Administrator', 'Class Advisor', 'Subject Teacher'),
  subjectController.getById,
);

/**
 * POST /api/v1/subjects
 * Create a subject.
 * Accessible by: Administrator only
 */
router.post(
  '/',
  authorize('Administrator', 'Class Advisor'),
  subjectController.create,
);

/**
 * PATCH /api/v1/subjects/:id
 * Update a subject.
 * Accessible by: Administrator only
 */
router.patch(
  '/:id',
  authorize('Administrator'),
  subjectController.update,
);

module.exports = router;
