const prisma = require('../config/prisma');
const AppError = require('../utils/AppError');

const ASSIGNMENT_INCLUDE = {
  teacher: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      employeeId: true,
      user: { select: { id: true, username: true, email: true } },
    },
  },
  classSubject: {
    select: {
      id: true,
      academicYear: true,
      class:   { select: { id: true, name: true, academicYear: true, division: true } },
      subject: { select: { id: true, name: true, code: true } },
    },
  },
};

function safeAssignment(a) {
  return {
    id: a.id,
    teacherId: a.teacherId,
    classSubjectId: a.classSubjectId,
    isActive: a.isActive,
    teacher: a.teacher,
    classSubject: a.classSubject,
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
  };
}

async function getAssignmentsByClassSubjectId(classSubjectId, filters = {}) {
  const cs = await prisma.classSubject.findUnique({ where: { id: classSubjectId } });
  if (!cs) throw new AppError('Class-subject not found', 404, 'CLASS_SUBJECT_NOT_FOUND');

  const where = { classSubjectId };
  if (filters.isActive !== undefined) where.isActive = filters.isActive;

  const results = await prisma.teacherAssignment.findMany({
    where,
    include: ASSIGNMENT_INCLUDE,
    orderBy: { id: 'asc' },
  });

  return results.map(safeAssignment);
}

async function getAssignmentsByTeacherId(teacherId, filters = {}) {
  const teacher = await prisma.teacher.findUnique({ where: { id: teacherId } });
  if (!teacher) throw new AppError('Teacher not found', 404, 'TEACHER_NOT_FOUND');

  const where = { teacherId };
  if (filters.isActive !== undefined) where.isActive = filters.isActive;

  const results = await prisma.teacherAssignment.findMany({
    where,
    include: ASSIGNMENT_INCLUDE,
    orderBy: { id: 'asc' },
  });

  return results.map(safeAssignment);
}

async function getAllAssignments(filters = {}) {
  const where = {};
  if (filters.isActive !== undefined) where.isActive = filters.isActive;

  const results = await prisma.teacherAssignment.findMany({
    where,
    include: ASSIGNMENT_INCLUDE,
    orderBy: { id: 'asc' },
  });

  return results.map(safeAssignment);
}

async function getAssignmentById(id) {
  const a = await prisma.teacherAssignment.findUnique({
    where: { id },
    include: ASSIGNMENT_INCLUDE,
  });
  if (!a) throw new AppError('Assignment not found', 404, 'ASSIGNMENT_NOT_FOUND');
  return safeAssignment(a);
}

async function createAssignment({ teacherId, classSubjectId }) {

  const teacher = await prisma.teacher.findUnique({
    where: { id: teacherId },
    include: { user: { include: { role: true } } },
  });
  if (!teacher) throw new AppError('Teacher not found', 404, 'TEACHER_NOT_FOUND');

  const allowedRoles = ['Subject Teacher', 'Class Advisor'];
  if (!allowedRoles.includes(teacher.user.role.name)) {
    throw new AppError(
      `Only users with role Subject Teacher or Class Advisor can be assigned`,
      400,
      'INVALID_TEACHER_ROLE',
    );
  }

  const cs = await prisma.classSubject.findUnique({ where: { id: classSubjectId } });
  if (!cs) throw new AppError('Class-subject not found', 404, 'CLASS_SUBJECT_NOT_FOUND');
  if (!cs.isActive) throw new AppError('Class-subject is inactive', 400, 'CLASS_SUBJECT_INACTIVE');

  const existing = await prisma.teacherAssignment.findUnique({
    where: { uq_teacher_class_subject: { teacherId, classSubjectId } },
  });
  if (existing) {
    throw new AppError(
      'Teacher is already assigned to this class-subject',
      409,
      'DUPLICATE_ASSIGNMENT',
    );
  }

  const assignment = await prisma.teacherAssignment.create({
    data: { teacherId, classSubjectId, isActive: true },
    include: ASSIGNMENT_INCLUDE,
  });

  return safeAssignment(assignment);
}

async function updateAssignment(id, { isActive }) {
  const existing = await prisma.teacherAssignment.findUnique({ where: { id } });
  if (!existing) throw new AppError('Assignment not found', 404, 'ASSIGNMENT_NOT_FOUND');

  const updated = await prisma.teacherAssignment.update({
    where: { id },
    data: { isActive },
    include: ASSIGNMENT_INCLUDE,
  });

  return safeAssignment(updated);
}

module.exports = {
  getAssignmentsByClassSubjectId,
  getAssignmentsByTeacherId,
  getAllAssignments,
  getAssignmentById,
  createAssignment,
  updateAssignment,
};
