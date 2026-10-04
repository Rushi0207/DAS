const { Router } = require('express');
const classSubjectController = require('../controllers/classSubject.controller');
const assignmentController   = require('../controllers/assignment.controller');
const authenticate           = require('../middleware/authenticate');
const authorize              = require('../middleware/authorize');

const router = Router();

router.use(authenticate);

/** GET /api/v1/class-subjects — global list */
router.get('/', authorize('Administrator', 'Class Advisor'), classSubjectController.getAll);

/**
 * Nested: GET  /api/v1/class-subjects/:classSubjectId/assignments
 *         POST /api/v1/class-subjects/:classSubjectId/assignments
 * Must be BEFORE /:id to avoid param collision
 */
router.get(
  '/:classSubjectId/assignments',
  authorize('Administrator', 'Class Advisor', 'Subject Teacher'),
  assignmentController.getByClassSubjectId,
);
router.post(
  '/:classSubjectId/assignments',
  authorize('Administrator', 'Class Advisor'),
  assignmentController.create,
);

/** GET /api/v1/class-subjects/:id */
router.get(
  '/:id',
  authorize('Administrator', 'Class Advisor', 'Subject Teacher'),
  classSubjectController.getById,
);

/** PATCH /api/v1/class-subjects/:id */
router.patch('/:id', authorize('Administrator'), classSubjectController.update);

module.exports = router;

