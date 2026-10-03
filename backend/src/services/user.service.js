const bcrypt = require('bcryptjs');
const prisma = require('../config/prisma');
const AppError = require('../utils/AppError');
const env = require('../config/env');

function safeUser(user) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    isActive: user.isActive,
    role: user.role.name,
    roleId: user.roleId,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

const USER_INCLUDE = { role: { select: { id: true, name: true } } };

async function getAllUsers(filters = {}) {
  const where = {};
  if (filters.roleId !== undefined) where.roleId = filters.roleId;
  if (filters.isActive !== undefined) where.isActive = filters.isActive;

  const users = await prisma.user.findMany({
    where,
    include: USER_INCLUDE,
    orderBy: { id: 'asc' },
  });

  return users.map(safeUser);
}

async function getUserById(id) {
  const user = await prisma.user.findUnique({
    where: { id },
    include: USER_INCLUDE,
  });

  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  return safeUser(user);
}

async function createUser({ username, email, password, roleId }) {
  // Verify role exists
  const role = await prisma.role.findUnique({ where: { id: roleId } });
  if (!role) {
    throw new AppError('Role not found', 404, 'ROLE_NOT_FOUND');
  }

  const existing = await prisma.user.findFirst({
    where: { OR: [{ username }, { email }] },
  });
  if (existing) {
    const field = existing.username === username ? 'username' : 'email';
    throw new AppError(`${field} is already taken`, 409, 'DUPLICATE_USER');
  }

  const passwordHash = await bcrypt.hash(password, env.bcryptRounds);

  const user = await prisma.user.create({
    data: { username, email, passwordHash, roleId, isActive: true },
    include: USER_INCLUDE,
  });

  return safeUser(user);
}

async function updateUser(id, { username, email, roleId, isActive }) {
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  if (roleId !== undefined) {
    const role = await prisma.role.findUnique({ where: { id: roleId } });
    if (!role) {
      throw new AppError('Role not found', 404, 'ROLE_NOT_FOUND');
    }
  }

  if (username || email) {
    const conflict = await prisma.user.findFirst({
      where: {
        AND: [
          { id: { not: id } },
          { OR: [...(username ? [{ username }] : []), ...(email ? [{ email }] : [])] },
        ],
      },
    });
    if (conflict) {
      const field = conflict.username === username ? 'username' : 'email';
      throw new AppError(`${field} is already taken`, 409, 'DUPLICATE_USER');
    }
  }

  const data = {};
  if (username !== undefined) data.username = username;
  if (email !== undefined) data.email = email;
  if (roleId !== undefined) data.roleId = roleId;
  if (isActive !== undefined) data.isActive = isActive;

  const updated = await prisma.user.update({
    where: { id },
    data,
    include: USER_INCLUDE,
  });

  return safeUser(updated);
}

async function deactivateUser(id, requestingUserId) {
  if (id === requestingUserId) {
    throw new AppError('You cannot deactivate your own account', 400, 'SELF_DEACTIVATE');
  }

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  if (!user.isActive) {
    throw new AppError('User is already inactive', 409, 'ALREADY_INACTIVE');
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { isActive: false },
    include: USER_INCLUDE,
  });

  return safeUser(updated);
}

async function getAllRoles() {
  return prisma.role.findMany({ orderBy: { id: 'asc' } });
}

module.exports = { getAllUsers, getUserById, createUser, updateUser, deactivateUser, getAllRoles };
