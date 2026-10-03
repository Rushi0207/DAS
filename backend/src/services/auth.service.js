const bcrypt = require('bcryptjs');
const prisma = require('../config/prisma');
const { signToken } = require('../utils/jwt');
const AppError = require('../utils/AppError');

async function login(login, password) {
  const user = await prisma.user.findFirst({
    where: {
      OR: [{ username: login }, { email: login }],
    },
    include: { role: true },
  });

  if (!user) {
    throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
  }

  if (!user.isActive) {
    throw new AppError('Account is inactive', 403, 'ACCOUNT_INACTIVE');
  }

  const passwordMatch = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatch) {
    throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
  }

  const tokenPayload = {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role.name,
  };

  const token = signToken(tokenPayload);

  const safeUser = {
    id: user.id,
    username: user.username,
    email: user.email,
    isActive: user.isActive,
    role: user.role.name,
    createdAt: user.createdAt,
  };

  return { token, user: safeUser };
}

async function getProfile(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { role: true },
  });

  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    isActive: user.isActive,
    role: user.role.name,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

module.exports = { login, getProfile };
