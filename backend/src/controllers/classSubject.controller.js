const { z } = require('zod');
const classSubjectService = require('../services/classSubject.service');
const AppError = require('../utils/AppError');

const createClassSubjectSchema = z.object({
  subjectId: z
    .number({ required_error: 'subjectId is required', invalid_type_error: 'subjectId must be a number' })
    .int().positive(),
  academicYear: z
    .string({ required_error: 'academicYear is required' })
    .regex(/^\d{4}-\d{2,4}$/, 'academicYear must be in format YYYY-YY or YYYY-YYYY'),
});

const updateClassSubjectSchema = z.object({
  isActive: z.boolean({ required_error: 'isActive is required', invalid_type_error: 'isActive must be a boolean' }),
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

async function getByClassId(req, res, next) {
  try {
    const classId = parseId(req.params.classId);
    const filters = {};
    if (req.query.isActive !== undefined) filters.isActive = req.query.isActive === 'true';

    const classSubjects = await classSubjectService.getClassSubjectsByClassId(classId, filters);
    res.status(200).json({ success: true, data: { classSubjects } });
  } catch (err) { next(err); }
}

async function getAll(req, res, next) {
  try {
    const filters = {};
    if (req.query.isActive     !== undefined) filters.isActive     = req.query.isActive === 'true';
    if (req.query.academicYear !== undefined) filters.academicYear = req.query.academicYear;

    const classSubjects = await classSubjectService.getAllClassSubjects(filters);
    res.status(200).json({ success: true, data: { classSubjects } });
  } catch (err) { next(err); }
}

async function getById(req, res, next) {
  try {
    const id = parseId(req.params.id);
    const cs = await classSubjectService.getClassSubjectById(id);
    res.status(200).json({ success: true, data: { classSubject: cs } });
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const classId = parseId(req.params.classId);
    const { subjectId, academicYear } = validate(createClassSubjectSchema, req.body);
    const cs = await classSubjectService.createClassSubject({ classId, subjectId, academicYear });
    res.status(201).json({ success: true, data: { classSubject: cs } });
  } catch (err) { next(err); }
}

async function update(req, res, next) {
  try {
    const id = parseId(req.params.id);
    const { isActive } = validate(updateClassSubjectSchema, req.body);
    const cs = await classSubjectService.updateClassSubject(id, { isActive });
    res.status(200).json({ success: true, data: { classSubject: cs } });
  } catch (err) { next(err); }
}

module.exports = { getByClassId, getAll, getById, create, update };
