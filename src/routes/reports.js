const { Router } = require('express');
const reportController = require('../controllers/report.controller');
const authenticate     = require('../middleware/authenticate');
const authorize        = require('../middleware/authorize');

const router = Router();

router.use(authenticate);

/**
 * GET /api/v1/reports/student?studentId=&academicYear=
 * Student-wise report: one student's attendance across all class-subjects.
 * Accessible by: Administrator, Class Advisor, Subject Teacher
 */
router.get(
  '/student',
  authorize('Administrator', 'Class Advisor', 'Subject Teacher'),
  reportController.studentReport,
);

/**
 * GET /api/v1/reports/subject?classSubjectId=
 * Subject-wise report: all students' attendance for one class-subject.
 * Accessible by: Administrator, Class Advisor, Subject Teacher
 */
router.get(
  '/subject',
  authorize('Administrator', 'Class Advisor', 'Subject Teacher'),
  reportController.subjectReport,
);

/**
 * GET /api/v1/reports/class?classId=&academicYear=
 * Class-wise report: all students' aggregated attendance across all subjects.
 * Accessible by: Administrator, Class Advisor
 */
router.get(
  '/class',
  authorize('Administrator', 'Class Advisor'),
  reportController.classReport,
);

/**
 * GET /api/v1/reports/low-attendance?classSubjectId=&threshold=
 * Low-attendance report: students below the threshold percentage.
 * Accessible by: Administrator, Class Advisor, Subject Teacher
 */
router.get(
  '/low-attendance',
  authorize('Administrator', 'Class Advisor', 'Subject Teacher'),
  reportController.lowAttendanceReport,
);

module.exports = router;
