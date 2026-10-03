const { z } = require('zod');
const subjectService = require('../services/subject.service');
const AppError = require('../utils/AppError');

const createSubjectSchema = z.object({
  name: z
    .string({ required_error: 'name is required' })
    .min(1, 'name must not be empty').max(150),
  code: z
    .string({ required_error: 'code is required' })
    .min(1, 'code must not be empty').max(20)
    .regex(/^[A-Z0-9_-]+$/, 'code must be uppercase letters, numbers, underscores or hyphens'),
});

const updateSubjectSchema = z.object({
  name: z.string().min(1).max(150).optional(),
  code: z.string().min(1).max(20).regex(/^[A-Z0-9_-]+$/, 'code must be uppercase letters, numbers, underscores or hyphens').optional(),
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
    if (req.query.search) filters.search = req.query.search;

    const subjects = await subjectService.getAllSubjects(filters);
    res.status(200).json({ success: true, data: { subjects } });
  } catch (err) { next(err); }
}

async function getById(req, res, next) {
  try {
    const id = parseId(req.params.id);
    const subject = await subjectService.getSubjectById(id);
    res.status(200).json({ success: true, data: { subject } });
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const data = validate(createSubjectSchema, req.body);
    const subject = await subjectService.createSubject(data);
    res.status(201).json({ success: true, data: { subject } });
  } catch (err) { next(err); }
}

async function update(req, res, next) {
  try {
    const id = parseId(req.params.id);
    const data = validate(updateSubjectSchema, req.body);
    const subject = await subjectService.updateSubject(id, data);
    res.status(200).json({ success: true, data: { subject } });
  } catch (err) { next(err); }
}

module.exports = { getAll, getById, create, update };
