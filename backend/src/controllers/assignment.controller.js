const { z } = require('zod');
const assignmentService = require('../services/assignment.service');
const AppError = require('../utils/AppError');

const createAssignmentSchema = z.object({
  teacherId: z
    .number({ required_error: 'teacherId is required', invalid_type_error: 'teacherId must be a number' })
    .int().positive(),
});

const updateAssignmentSchema = z.object({
  isActive: z.boolean({
    required_error: 'isActive is required',
    invalid_type_error: 'isActive must be a boolean',
  }),
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

async function getAll(req, res, next) {
  try {
    const filters = {};
    if (req.query.isActive !== undefined) filters.isActive = req.query.isActive === 'true';
    const assignments = await assignmentService.getAllAssignments(filters);
    res.status(200).json({ success: true, data: { assignments } });
  } catch (err) { next(err); }
}

async function getById(req, res, next) {
  try {
    const id = parseId(req.params.id);
    const assignment = await assignmentService.getAssignmentById(id);
    res.status(200).json({ success: true, data: { assignment } });
  } catch (err) { next(err); }
}

async function getByClassSubjectId(req, res, next) {
  try {
    const classSubjectId = parseId(req.params.classSubjectId);
    const filters = {};
    if (req.query.isActive !== undefined) filters.isActive = req.query.isActive === 'true';
    const assignments = await assignmentService.getAssignmentsByClassSubjectId(classSubjectId, filters);
    res.status(200).json({ success: true, data: { assignments } });
  } catch (err) { next(err); }
}

async function getByTeacherId(req, res, next) {
  try {
    const teacherId = parseId(req.params.teacherId);
    const filters = {};
    if (req.query.isActive !== undefined) filters.isActive = req.query.isActive === 'true';
    const assignments = await assignmentService.getAssignmentsByTeacherId(teacherId, filters);
    res.status(200).json({ success: true, data: { assignments } });
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const classSubjectId = parseId(req.params.classSubjectId);
    const { teacherId } = validate(createAssignmentSchema, req.body);
    const assignment = await assignmentService.createAssignment({ teacherId, classSubjectId });
    res.status(201).json({ success: true, data: { assignment } });
  } catch (err) { next(err); }
}

async function update(req, res, next) {
  try {
    const id = parseId(req.params.id);
    const { isActive } = validate(updateAssignmentSchema, req.body);
    const assignment = await assignmentService.updateAssignment(id, { isActive });
    res.status(200).json({ success: true, data: { assignment } });
  } catch (err) { next(err); }
}

module.exports = { getAll, getById, getByClassSubjectId, getByTeacherId, create, update };
