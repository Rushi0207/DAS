const { z } = require('zod');
const studentService = require('../services/student.service');
const AppError = require('../utils/AppError');

const createStudentSchema = z.object({
  firstName: z
    .string({ required_error: 'firstName is required' })
    .min(1, 'firstName must not be empty').max(100),
  lastName: z
    .string({ required_error: 'lastName is required' })
    .min(1, 'lastName must not be empty').max(100),
  studentId: z
    .string({ required_error: 'studentId is required' })
    .min(1, 'studentId must not be empty').max(50),
  email: z
    .string().email('email must be a valid email address').optional(),
});

const updateStudentSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName:  z.string().min(1).max(100).optional(),
  studentId: z.string().min(1).max(50).optional(),
  email:     z.string().email('email must be a valid email address').nullable().optional(),
  isActive:  z.boolean({ invalid_type_error: 'isActive must be a boolean' }).optional(),
}).refine(
  (d) => Object.keys(d).length > 0,
  { message: 'At least one field must be provided for update' },
);


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
    if (req.query.isActive !== undefined) filters.isActive = req.query.isActive === 'true';
    if (req.query.search)                 filters.search   = req.query.search;

    const students = await studentService.getAllStudents(filters);
    res.status(200).json({ success: true, data: { students } });
  } catch (err) { next(err); }
}

async function getById(req, res, next) {
  try {
    const id = parseId(req.params.id);
    const student = await studentService.getStudentById(id);
    res.status(200).json({ success: true, data: { student } });
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const data = validate(createStudentSchema, req.body);
    const student = await studentService.createStudent(data);
    res.status(201).json({ success: true, data: { student } });
  } catch (err) { next(err); }
}

async function update(req, res, next) {
  try {
    const id = parseId(req.params.id);
    const data = validate(updateStudentSchema, req.body);
    const student = await studentService.updateStudent(id, data);
    res.status(200).json({ success: true, data: { student } });
  } catch (err) { next(err); }
}

async function deactivate(req, res, next) {
  try {
    const id = parseId(req.params.id);
    const student = await studentService.deactivateStudent(id);
    res.status(200).json({ success: true, data: { student } });
  } catch (err) { next(err); }
}

const importRowSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName:  z.string().min(1).max(100),
  studentId: z.string().min(1).max(50),
  email:     z.string().email().optional().or(z.literal('')),
})

async function importStudents(req, res, next) {
  try {
    const { rows } = req.body
    if (!Array.isArray(rows) || rows.length === 0) {
      throw new AppError('rows must be a non-empty array', 422, 'VALIDATION_ERROR')
    }
    if (rows.length > 500) {
      throw new AppError('Maximum 500 rows per import', 422, 'IMPORT_TOO_LARGE')
    }

    // Sanitise each row — strip empty email so it becomes undefined
    const sanitised = rows.map(r => ({
      firstName: String(r.firstName ?? '').trim(),
      lastName:  String(r.lastName  ?? '').trim(),
      studentId: String(r.studentId ?? '').trim(),
      email:     String(r.email     ?? '').trim() || undefined,
    }))

    const result = await studentService.importStudents(sanitised)
    res.status(200).json({ success: true, data: result })
  } catch (err) { next(err) }
}

module.exports = { getAll, getById, create, update, deactivate, importStudents };
