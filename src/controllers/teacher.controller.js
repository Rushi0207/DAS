const { z } = require('zod');
const teacherService = require('../services/teacher.service');
const AppError = require('../utils/AppError');

const createTeacherSchema = z.object({
  userId: z
    .number({ required_error: 'userId is required', invalid_type_error: 'userId must be a number' })
    .int().positive(),
  firstName: z
    .string({ required_error: 'firstName is required' })
    .min(1, 'firstName must not be empty')
    .max(100),
  lastName: z
    .string({ required_error: 'lastName is required' })
    .min(1, 'lastName must not be empty')
    .max(100),
  employeeId: z
    .string({ required_error: 'employeeId is required' })
    .min(1, 'employeeId must not be empty')
    .max(50),
  department: z.string().max(100).optional(),
});

const updateTeacherSchema = z.object({
  firstName:  z.string().min(1).max(100).optional(),
  lastName:   z.string().min(1).max(100).optional(),
  employeeId: z.string().min(1).max(50).optional(),
  department: z.string().max(100).nullable().optional(),
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
    if (req.query.department) filters.department = req.query.department;

    const teachers = await teacherService.getAllTeachers(filters);
    res.status(200).json({ success: true, data: { teachers } });
  } catch (err) { next(err); }
}

async function getById(req, res, next) {
  try {
    const id = parseId(req.params.id);
    const teacher = await teacherService.getTeacherById(id);
    res.status(200).json({ success: true, data: { teacher } });
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const data = validate(createTeacherSchema, req.body);
    const teacher = await teacherService.createTeacher(data);
    res.status(201).json({ success: true, data: { teacher } });
  } catch (err) { next(err); }
}

async function update(req, res, next) {
  try {
    const id = parseId(req.params.id);
    const data = validate(updateTeacherSchema, req.body);
    const teacher = await teacherService.updateTeacher(id, data);
    res.status(200).json({ success: true, data: { teacher } });
  } catch (err) { next(err); }
}

async function getMe(req, res, next) {
  try {
    const teacher = await teacherService.getTeacherByUserId(req.user.id);
    res.status(200).json({ success: true, data: { teacher } });
  } catch (err) { next(err); }
}

module.exports = { getAll, getById, create, update, getMe };
