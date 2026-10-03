const prisma = require('../config/prisma');
const AppError = require('../utils/AppError');

const TEACHER_INCLUDE = {
  user: {
    select: {
      id: true,
      username: true,
      email: true,
      isActive: true,
      role: { select: { name: true } },
    },
  },
};

function safeTeacher(t) {
  return {
    id: t.id,
    userId: t.userId,
    firstName: t.firstName,
    lastName: t.lastName,
    fullName: `${t.firstName} ${t.lastName}`,
    employeeId: t.employeeId,
    department: t.department ?? null,
    user: t.user,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
  };
}

async function getAllTeachers(filters = {}) {
  const where = {};
  if (filters.department) where.department = filters.department;

  const teachers = await prisma.teacher.findMany({
    where,
    include: TEACHER_INCLUDE,
    orderBy: { id: 'asc' },
  });

  return teachers.map(safeTeacher);
}

async function getTeacherById(id) {
  const teacher = await prisma.teacher.findUnique({
    where: { id },
    include: TEACHER_INCLUDE,
  });

  if (!teacher) throw new AppError('Teacher not found', 404, 'TEACHER_NOT_FOUND');

  return safeTeacher(teacher);
}

async function getTeacherByUserId(userId) {
  const teacher = await prisma.teacher.findUnique({
    where: { userId },
    include: TEACHER_INCLUDE,
  });

  if (!teacher) throw new AppError('Teacher profile not found', 404, 'TEACHER_NOT_FOUND');

  return safeTeacher(teacher);
}

async function createTeacher({ userId, firstName, lastName, employeeId, department }) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { role: true },
  });

  if (!user) throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  if (!user.isActive) throw new AppError('User account is inactive', 400, 'USER_INACTIVE');

  const allowedRoles = ['Subject Teacher', 'Class Advisor'];
  if (!allowedRoles.includes(user.role.name)) {
    throw new AppError(
      `Teacher profile can only be created for users with role: ${allowedRoles.join(' or ')}`,
      400,
      'INVALID_USER_ROLE',
    );
  }

  const existingProfile = await prisma.teacher.findUnique({ where: { userId } });
  if (existingProfile) {
    throw new AppError('User already has a teacher profile', 409, 'TEACHER_PROFILE_EXISTS');
  }

  const existingEmpId = await prisma.teacher.findUnique({ where: { employeeId } });
  if (existingEmpId) {
    throw new AppError('Employee ID is already in use', 409, 'DUPLICATE_EMPLOYEE_ID');
  }

  const teacher = await prisma.teacher.create({
    data: { userId, firstName, lastName, employeeId, department: department ?? null },
    include: TEACHER_INCLUDE,
  });

  return safeTeacher(teacher);
}

async function updateTeacher(id, { firstName, lastName, employeeId, department }) {
  const existing = await prisma.teacher.findUnique({ where: { id } });
  if (!existing) throw new AppError('Teacher not found', 404, 'TEACHER_NOT_FOUND');

  // Check employeeId uniqueness against OTHER teachers
  if (employeeId && employeeId !== existing.employeeId) {
    const conflict = await prisma.teacher.findUnique({ where: { employeeId } });
    if (conflict) throw new AppError('Employee ID is already in use', 409, 'DUPLICATE_EMPLOYEE_ID');
  }

  const data = {};
  if (firstName  !== undefined) data.firstName  = firstName;
  if (lastName   !== undefined) data.lastName   = lastName;
  if (employeeId !== undefined) data.employeeId = employeeId;
  if (department !== undefined) data.department = department;

  const updated = await prisma.teacher.update({
    where: { id },
    data,
    include: TEACHER_INCLUDE,
  });

  return safeTeacher(updated);
}

module.exports = { getAllTeachers, getTeacherById, getTeacherByUserId, createTeacher, updateTeacher };
