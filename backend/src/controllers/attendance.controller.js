const { z } = require('zod');
const attendanceService = require('../services/attendance.service');
const AppError = require('../utils/AppError');


const createSessionSchema = z.object({
  classSubjectId: z
    .number({ required_error: 'classSubjectId is required', invalid_type_error: 'classSubjectId must be a number' })
    .int().positive(),
  sessionDate: z
    .string({ required_error: 'sessionDate is required' })
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'sessionDate must be in format YYYY-MM-DD'),
  startTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, 'startTime must be in format HH:MM')
    .optional(),
  notes: z.string().max(500).optional(),
});

const submitAttendanceSchema = z.object({
  presentStudentIds: z
    .array(
      z.number({ invalid_type_error: 'Each student id must be a number' }).int().positive(),
      { required_error: 'presentStudentIds is required' },
    )
    .describe('Array of student internal ids who are present. Can be empty (all absent).'),
});


function validate(schema, data) {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new AppError('Validation failed', 422, 'VALIDATION_ERROR', result.error.flatten().fieldErrors);
  }
  return result.data;
}

function parseId(param) {
  const id = parseInt(param, 10);
  if (isNaN(id) || id < 1) throw new AppError('Invalid id', 400, 'INVALID_ID');
  return id;
}

async function createSession(req, res, next) {
  try {
    const data = validate(createSessionSchema, req.body);
    const session = await attendanceService.createSession(data, req.user);
    res.status(201).json({ success: true, data: { session } });
  } catch (err) { next(err); }
}

async function submitAttendance(req, res, next) {
  try {
    const sessionId = parseId(req.params.sessionId);
    const { presentStudentIds } = validate(submitAttendanceSchema, req.body);
    const result = await attendanceService.submitAttendance(sessionId, presentStudentIds, req.user);
    res.status(200).json({ success: true, data: result });
  } catch (err) { next(err); }
}

async function listSessions(req, res, next) {
  try {
    const filters = {};
    if (req.query.classSubjectId) filters.classSubjectId = parseInt(req.query.classSubjectId, 10);
    if (req.query.teacherId)      filters.teacherId      = parseInt(req.query.teacherId, 10);
    if (req.query.sessionDate)    filters.sessionDate    = req.query.sessionDate;

    const sessions = await attendanceService.listSessions(filters, req.user);
    res.status(200).json({ success: true, data: { sessions } });
  } catch (err) { next(err); }
}

async function getSession(req, res, next) {
  try {
    const sessionId = parseId(req.params.sessionId);
    const session = await attendanceService.getSessionById(sessionId, req.user);
    res.status(200).json({ success: true, data: { session } });
  } catch (err) { next(err); }
}

async function getAttendanceRecords(req, res, next) {
  try {
    const sessionId = parseId(req.params.sessionId);
    const result = await attendanceService.getAttendanceBySession(sessionId, req.user);
    res.status(200).json({ success: true, data: result });
  } catch (err) { next(err); }
}

async function getStudentSummary(req, res, next) {
  try {
    const studentId      = parseInt(req.query.studentId, 10);
    const classSubjectId = parseInt(req.query.classSubjectId, 10);

    if (isNaN(studentId) || studentId < 1)      throw new AppError('Valid studentId query param is required', 400, 'INVALID_PARAM');
    if (isNaN(classSubjectId) || classSubjectId < 1) throw new AppError('Valid classSubjectId query param is required', 400, 'INVALID_PARAM');

    const summary = await attendanceService.getStudentAttendanceSummary(studentId, classSubjectId);
    res.status(200).json({ success: true, data: { summary } });
  } catch (err) { next(err); }
}

module.exports = {
  createSession,
  submitAttendance,
  listSessions,
  getSession,
  getAttendanceRecords,
  getStudentSummary,
};
