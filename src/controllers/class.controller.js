const { z } = require('zod');
const classService = require('../services/class.service');
const AppError = require('../utils/AppError');

const createClassSchema = z.object({
  name: z
    .string({ required_error: 'name is required' })
    .min(1, 'name must not be empty').max(100),
  academicYear: z
    .string({ required_error: 'academicYear is required' })
    .regex(/^\d{4}-\d{2,4}$/, 'academicYear must be in format YYYY-YY or YYYY-YYYY (e.g. 2025-26)'),
  division: z.string().max(10).optional(),
});

const updateClassSchema = z.object({
  name:         z.string().min(1).max(100).optional(),
  academicYear: z.string().regex(/^\d{4}-\d{2,4}$/, 'academicYear must be in format YYYY-YY or YYYY-YYYY').optional(),
  division:     z.string().max(10).nullable().optional(),
  isActive:     z.boolean({ invalid_type_error: 'isActive must be a boolean' }).optional(),
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
    if (req.query.academicYear) filters.academicYear = req.query.academicYear;
    if (req.query.isActive !== undefined) filters.isActive = req.query.isActive === 'true';

    const classes = await classService.getAllClasses(filters);
    res.status(200).json({ success: true, data: { classes } });
  } catch (err) { next(err); }
}

async function getById(req, res, next) {
  try {
    const id = parseId(req.params.id);
    const cls = await classService.getClassById(id);
    res.status(200).json({ success: true, data: { class: cls } });
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const data = validate(createClassSchema, req.body);
    const cls = await classService.createClass(data);
    res.status(201).json({ success: true, data: { class: cls } });
  } catch (err) { next(err); }
}

async function update(req, res, next) {
  try {
    const id = parseId(req.params.id);
    const data = validate(updateClassSchema, req.body);
    const cls = await classService.updateClass(id, data);
    res.status(200).json({ success: true, data: { class: cls } });
  } catch (err) { next(err); }
}

module.exports = { getAll, getById, create, update };
