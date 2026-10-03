const { z } = require('zod');
const userService = require('../services/user.service');
const AppError = require('../utils/AppError');


const createUserSchema = z.object({
  username: z
    .string({ required_error: 'username is required' })
    .min(3, 'username must be at least 3 characters')
    .max(50, 'username must be at most 50 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'username may only contain letters, numbers and underscores'),
  email: z
    .string({ required_error: 'email is required' })
    .email('email must be a valid email address'),
  password: z
    .string({ required_error: 'password is required' })
    .min(8, 'password must be at least 8 characters'),
  roleId: z
    .number({ required_error: 'roleId is required', invalid_type_error: 'roleId must be a number' })
    .int('roleId must be an integer')
    .positive('roleId must be positive'),
});

const updateUserSchema = z.object({
  username: z
    .string()
    .min(3, 'username must be at least 3 characters')
    .max(50, 'username must be at most 50 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'username may only contain letters, numbers and underscores')
    .optional(),
  email: z
    .string()
    .email('email must be a valid email address')
    .optional(),
  roleId: z
    .number({ invalid_type_error: 'roleId must be a number' })
    .int('roleId must be an integer')
    .positive('roleId must be positive')
    .optional(),
  isActive: z
    .boolean({ invalid_type_error: 'isActive must be a boolean' })
    .optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
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
  if (isNaN(id) || id < 1) {
    throw new AppError('Invalid user id', 400, 'INVALID_ID');
  }
  return id;
}

async function getAll(req, res, next) {
  try {
    const filters = {};
    if (req.query.roleId) {
      const rid = parseInt(req.query.roleId, 10);
      if (!isNaN(rid)) filters.roleId = rid;
    }
    if (req.query.isActive !== undefined) {
      filters.isActive = req.query.isActive === 'true';
    }

    const users = await userService.getAllUsers(filters);
    res.status(200).json({ success: true, data: { users } });
  } catch (err) {
    next(err);
  }
}

async function getRoles(req, res, next) {
  try {
    const roles = await userService.getAllRoles();
    res.status(200).json({ success: true, data: { roles } });
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const id = parseId(req.params.id);
    const user = await userService.getUserById(id);
    res.status(200).json({ success: true, data: { user } });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const data = validate(createUserSchema, req.body);
    const user = await userService.createUser(data);
    res.status(201).json({ success: true, data: { user } });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const id = parseId(req.params.id);
    const data = validate(updateUserSchema, req.body);
    const user = await userService.updateUser(id, data);
    res.status(200).json({ success: true, data: { user } });
  } catch (err) {
    next(err);
  }
}

async function deactivate(req, res, next) {
  try {
    const id = parseId(req.params.id);
    const user = await userService.deactivateUser(id, req.user.id);
    res.status(200).json({ success: true, data: { user } });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAll, getRoles, getById, create, update, deactivate };
