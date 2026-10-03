const { Router } = require('express');
const studentController    = require('../controllers/student.controller');
const enrollmentController = require('../controllers/enrollment.controller');
const authenticate         = require('../middleware/authenticate');
const authorize            = require('../middleware/authorize');

const router = Router();

router.use(authenticate);

/** GET /api/v1/students */
router.get('/', authorize('Administrator', 'Class Advisor'), studentController.getAll);

/**
 * Nested: GET /api/v1/students/:studentId/enrollments
 * Must be BEFORE /:id
 */
router.get(
  '/:studentId/enrollments',
  authorize('Administrator', 'Class Advisor', 'Subject Teacher'),
  enrollmentController.getByStudentId,
);

/** GET /api/v1/students/:id */
router.get('/:id', authorize('Administrator', 'Class Advisor', 'Subject Teacher'), studentController.getById);

/** POST /api/v1/students */
router.post('/', authorize('Administrator', 'Class Advisor'), studentController.create);

/** PATCH /api/v1/students/:id */
router.patch('/:id', authorize('Administrator', 'Class Advisor'), studentController.update);

/** DELETE /api/v1/students/:id */
router.delete('/:id', authorize('Administrator'), studentController.deactivate);

module.exports = router;

