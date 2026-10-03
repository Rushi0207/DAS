const reportService = require('../services/report.service');
const AppError = require('../utils/AppError');


function requireIntParam(query, name) {
  const val = parseInt(query[name], 10);
  if (isNaN(val) || val < 1) throw new AppError(`Valid ${name} query param is required`, 400, 'INVALID_PARAM');
  return val;
}

function optionalIntParam(query, name) {
  if (!query[name]) return undefined;
  const val = parseInt(query[name], 10);
  if (isNaN(val) || val < 1) throw new AppError(`${name} must be a positive integer`, 400, 'INVALID_PARAM');
  return val;
}

async function studentReport(req, res, next) {
  try {
    const studentId    = requireIntParam(req.query, 'studentId');
    const academicYear = req.query.academicYear || undefined;

    const report = await reportService.studentWiseReport({ studentId, academicYear });
    res.status(200).json({ success: true, data: { report } });
  } catch (err) { next(err); }
}

async function subjectReport(req, res, next) {
  try {
    const classSubjectId = requireIntParam(req.query, 'classSubjectId');

    const report = await reportService.subjectWiseReport({ classSubjectId });
    res.status(200).json({ success: true, data: { report } });
  } catch (err) { next(err); }
}

async function classReport(req, res, next) {
  try {
    const classId      = requireIntParam(req.query, 'classId');
    const academicYear = req.query.academicYear;
    if (!academicYear) throw new AppError('academicYear query param is required', 400, 'INVALID_PARAM');

    const report = await reportService.classWiseReport({ classId, academicYear });
    res.status(200).json({ success: true, data: { report } });
  } catch (err) { next(err); }
}

async function lowAttendanceReport(req, res, next) {
  try {
    const classSubjectId = requireIntParam(req.query, 'classSubjectId');
    const threshold      = req.query.threshold ? parseFloat(req.query.threshold) : 75;

    if (isNaN(threshold) || threshold < 0 || threshold > 100) {
      throw new AppError('threshold must be a number between 0 and 100', 400, 'INVALID_PARAM');
    }

    const report = await reportService.lowAttendanceReport({ classSubjectId, threshold });
    res.status(200).json({ success: true, data: { report } });
  } catch (err) { next(err); }
}

module.exports = { studentReport, subjectReport, classReport, lowAttendanceReport };
