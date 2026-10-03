const { z } = require('zod');
const enrollmentService = require('../services/enrollment.service');
const AppError = require('../utils/AppError');

const createEnrollmentSchema = z.object({
  studentId: z
    .number({ required_error: 'studentId is required', invalid_type_error: 'studentId must be a number' })
    .int().positive(),
  academicYear: z
    .string({ required_error: 'academicYear is required' })
    .regex(/^\d{4}-\d{2,4}$/, 'academicYear must be in format YYYY-YY or YYYY-YYYY'),
  rollNumber: z
    .string({ required_error: 'rollNumber is required' })
    .min(1, 'rollNumber must not be empty').max(20),
});

const updateEnrollmentSchema = z.object({
  rollNumber: z.string().min(1).max(20).optional(),
  isActive:   z.boolean({ invalid_type_error: 'isActive must be a boolean' }).optional(),
}).refine((d) => Object.keys(d).length > 0, { message: 'At least one field must be provided' });


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

async function getAll(req, res, next) {
  try {
    const filters = {};
    if (req.query.academicYear !== undefined) filters.academicYear = req.query.academicYear;
    if (req.query.isActive     !== undefined) filters.isActive     = req.query.isActive === 'true';
    const enrollments = await enrollmentService.getAllEnrollments(filters);
    res.status(200).json({ success: true, data: { enrollments } });
  } catch (err) { next(err); }
}

async function getById(req, res, next) {
  try {
    const id = parseId(req.params.id);
    const enrollment = await enrollmentService.getEnrollmentById(id);
    res.status(200).json({ success: true, data: { enrollment } });
  } catch (err) { next(err); }
}

async function getByClassId(req, res, next) {
  try {
    const classId = parseId(req.params.classId);
    const filters = {};
    if (req.query.academicYear !== undefined) filters.academicYear = req.query.academicYear;
    if (req.query.isActive     !== undefined) filters.isActive     = req.query.isActive === 'true';
    const enrollments = await enrollmentService.getEnrollmentsByClassId(classId, filters);
    res.status(200).json({ success: true, data: { enrollments } });
  } catch (err) { next(err); }
}

async function getByStudentId(req, res, next) {
  try {
    const studentId = parseId(req.params.studentId);
    const filters = {};
    if (req.query.isActive !== undefined) filters.isActive = req.query.isActive === 'true';
    const enrollments = await enrollmentService.getEnrollmentsByStudentId(studentId, filters);
    res.status(200).json({ success: true, data: { enrollments } });
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const classId = parseId(req.params.classId);
    const { studentId, academicYear, rollNumber } = validate(createEnrollmentSchema, req.body);
    const enrollment = await enrollmentService.createEnrollment({ studentId, classId, academicYear, rollNumber });
    res.status(201).json({ success: true, data: { enrollment } });
  } catch (err) { next(err); }
}

async function update(req, res, next) {
  try {
    const id = parseId(req.params.id);
    const data = validate(updateEnrollmentSchema, req.body);
    const enrollment = await enrollmentService.updateEnrollment(id, data);
    res.status(200).json({ success: true, data: { enrollment } });
  } catch (err) { next(err); }
}

module.exports = { getAll, getById, getByClassId, getByStudentId, create, update };
