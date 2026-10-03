const { Router } = require('express');
const attendanceController = require('../controllers/attendance.controller');
const authenticate         = require('../middleware/authenticate');
const authorize            = require('../middleware/authorize');

const router = Router();

router.use(authenticate);

/**
 * POST /api/v1/attendance/sessions
 * Create an attendance session.
 * Accessible by: Administrator, Class Advisor, Subject Teacher
 * Resource-level check (teacher must be assigned) enforced in service.
 */
router.post(
  '/sessions',
  authorize('Administrator', 'Class Advisor', 'Subject Teacher'),
  attendanceController.createSession,
);

/**
 * GET /api/v1/attendance/sessions
 * List sessions. Teachers only see their own.
 * Accessible by: all roles
 */
router.get(
  '/sessions',
  authorize('Administrator', 'Class Advisor', 'Subject Teacher'),
  attendanceController.listSessions,
);

/**
 * GET /api/v1/attendance/sessions/:sessionId
 * Get a session by id.
 * Accessible by: all roles (teachers limited to their own sessions)
 */
router.get(
  '/sessions/:sessionId',
  authorize('Administrator', 'Class Advisor', 'Subject Teacher'),
  attendanceController.getSession,
);

/**
 * POST /api/v1/attendance/sessions/:sessionId/submit
 * Submit present list. Backend generates absent records automatically.
 * Accessible by: Administrator, Class Advisor, Subject Teacher
 * Resource-level check (must be the session's teacher) enforced in service.
 */
router.post(
  '/sessions/:sessionId/submit',
  authorize('Administrator', 'Class Advisor', 'Subject Teacher'),
  attendanceController.submitAttendance,
);

/**
 * GET /api/v1/attendance/sessions/:sessionId/records
 * Get present + absent records for a session.
 * Accessible by: all roles (teachers limited to their own sessions)
 */
router.get(
  '/sessions/:sessionId/records',
  authorize('Administrator', 'Class Advisor', 'Subject Teacher'),
  attendanceController.getAttendanceRecords,
);

/**
 * GET /api/v1/attendance/summary?studentId=&classSubjectId=
 * Get a student's attendance percentage for a class-subject.
 * Accessible by: all roles
 */
router.get(
  '/summary',
  authorize('Administrator', 'Class Advisor', 'Subject Teacher'),
  attendanceController.getStudentSummary,
);

module.exports = router;
