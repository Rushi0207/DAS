const { z } = require('zod');
const authService = require('../services/auth.service');
const AppError = require('../utils/AppError');

const loginSchema = z.object({
  login: z
    .string({ required_error: 'login is required' })
    .min(1, 'login must not be empty'),
  password: z
    .string({ required_error: 'password is required' })
    .min(1, 'password must not be empty'),
});

async function login(req, res, next) {
  try {
    const result = loginSchema.safeParse(req.body);
    if (!result.success) {
      throw new AppError(
        'Validation failed',
        422,
        'VALIDATION_ERROR',
        result.error.flatten().fieldErrors,
      );
    }

    const { login, password } = result.data;
    const { token, user } = await authService.login(login, password);

    res.status(200).json({
      success: true,
      data: { token, user },
    });
  } catch (err) {
    next(err);
  }
}

async function getMe(req, res, next) {
  try {
    const user = await authService.getProfile(req.user.id);
    res.status(200).json({
      success: true,
      data: { user },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { login, getMe };
