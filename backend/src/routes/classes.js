const { Router } = require('express');
const classController        = require('../controllers/class.controller');
const classSubjectController = require('../controllers/classSubject.controller');
const enrollmentController   = require('../controllers/enrollment.controller');
const authenticate           = require('../middleware/authenticate');
const authorize              = require('../middleware/authorize');

const router = Router();

router.use(authenticate);

/** GET /api/v1/classes — all roles */
router.get('/', authorize('Administrator', 'Class Advisor', 'Subject Teacher'), classController.getAll);

/**
 * Nested: GET  /api/v1/classes/:classId/subjects
 *         POST /api/v1/classes/:classId/subjects
 * Must be BEFORE /:id to avoid param collision
 */
router.get(
  '/:classId/subjects',
  authorize('Administrator', 'Class Advisor', 'Subject Teacher'),
  classSubjectController.getByClassId,
);
router.post(
  '/:classId/subjects',
  authorize('Administrator'),
  classSubjectController.create,
);

/**
 * Nested: GET  /api/v1/classes/:classId/enrollments
 *         POST /api/v1/classes/:classId/enrollments
 */
router.get(
  '/:classId/enrollments',
  authorize('Administrator', 'Class Advisor', 'Subject Teacher'),
  enrollmentController.getByClassId,
);
router.post(
  '/:classId/enrollments',
  authorize('Administrator', 'Class Advisor'),
  enrollmentController.create,
);

/** GET /api/v1/classes/:id */
router.get('/:id', authorize('Administrator', 'Class Advisor', 'Subject Teacher'), classController.getById);

/** POST /api/v1/classes */
router.post('/', authorize('Administrator'), classController.create);

/** PATCH /api/v1/classes/:id */
router.patch('/:id', authorize('Administrator'), classController.update);

module.exports = router;

