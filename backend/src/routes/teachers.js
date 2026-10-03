const { Router } = require('express');
const teacherController    = require('../controllers/teacher.controller');
const assignmentController = require('../controllers/assignment.controller');
const authenticate         = require('../middleware/authenticate');
const authorize            = require('../middleware/authorize');

const router = Router();

router.use(authenticate);

/** GET /api/v1/teachers/me — must be BEFORE /:id */
router.get('/me', authorize('Subject Teacher', 'Class Advisor'), teacherController.getMe);

/** GET /api/v1/teachers */
router.get('/', authorize('Administrator', 'Class Advisor'), teacherController.getAll);

/**
 * Nested: GET /api/v1/teachers/:teacherId/assignments
 * Must be BEFORE /:id
 */
router.get(
  '/:teacherId/assignments',
  authorize('Administrator', 'Class Advisor', 'Subject Teacher'),
  assignmentController.getByTeacherId,
);

/** GET /api/v1/teachers/:id */
router.get('/:id', authorize('Administrator', 'Class Advisor'), teacherController.getById);

/** POST /api/v1/teachers */
router.post('/', authorize('Administrator'), teacherController.create);

/** PATCH /api/v1/teachers/:id */
router.patch('/:id', authorize('Administrator'), teacherController.update);

module.exports = router;

