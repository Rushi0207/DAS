const prisma = require('../config/prisma');
const AppError = require('../utils/AppError');


function safeStudent(s) {
  return {
    id: s.id,
    firstName: s.firstName,
    lastName: s.lastName,
    fullName: `${s.firstName} ${s.lastName}`,
    studentId: s.studentId,
    email: s.email ?? null,
    isActive: s.isActive,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
  };
}

async function getAllStudents(filters = {}) {
  const where = {};

  if (filters.isActive !== undefined) where.isActive = filters.isActive;

  if (filters.search) {
    const s = filters.search;
    where.OR = [
      { firstName:  { contains: s, mode: 'insensitive' } },
      { lastName:   { contains: s, mode: 'insensitive' } },
      { studentId:  { contains: s, mode: 'insensitive' } },
    ];
  }

  const students = await prisma.student.findMany({
    where,
    orderBy: { id: 'asc' },
  });

  return students.map(safeStudent);
}

async function getStudentById(id) {
  const student = await prisma.student.findUnique({ where: { id } });
  if (!student) throw new AppError('Student not found', 404, 'STUDENT_NOT_FOUND');
  return safeStudent(student);
}

async function getStudentByStudentId(studentId) {
  const student = await prisma.student.findUnique({ where: { studentId } });
  if (!student) throw new AppError('Student not found', 404, 'STUDENT_NOT_FOUND');
  return safeStudent(student);
}

async function createStudent({ firstName, lastName, studentId, email }) {
  const byStudentId = await prisma.student.findUnique({ where: { studentId } });
  if (byStudentId) throw new AppError('Student ID is already in use', 409, 'DUPLICATE_STUDENT_ID');

  if (email) {
    const byEmail = await prisma.student.findUnique({ where: { email } });
    if (byEmail) throw new AppError('Email is already in use', 409, 'DUPLICATE_EMAIL');
  }

  const student = await prisma.student.create({
    data: {
      firstName,
      lastName,
      studentId,
      email: email ?? null,
      isActive: true,
    },
  });

  return safeStudent(student);
}

async function updateStudent(id, { firstName, lastName, studentId, email, isActive }) {
  const existing = await prisma.student.findUnique({ where: { id } });
  if (!existing) throw new AppError('Student not found', 404, 'STUDENT_NOT_FOUND');

  if (studentId && studentId !== existing.studentId) {
    const conflict = await prisma.student.findUnique({ where: { studentId } });
    if (conflict) throw new AppError('Student ID is already in use', 409, 'DUPLICATE_STUDENT_ID');
  }

  if (email && email !== existing.email) {
    const conflict = await prisma.student.findUnique({ where: { email } });
    if (conflict) throw new AppError('Email is already in use', 409, 'DUPLICATE_EMAIL');
  }

  const data = {};
  if (firstName !== undefined) data.firstName = firstName;
  if (lastName  !== undefined) data.lastName  = lastName;
  if (studentId !== undefined) data.studentId = studentId;
  if (email     !== undefined) data.email     = email;
  if (isActive  !== undefined) data.isActive  = isActive;

  const updated = await prisma.student.update({ where: { id }, data });
  return safeStudent(updated);
}

async function deactivateStudent(id) {
  const student = await prisma.student.findUnique({ where: { id } });
  if (!student) throw new AppError('Student not found', 404, 'STUDENT_NOT_FOUND');
  if (!student.isActive) throw new AppError('Student is already inactive', 409, 'ALREADY_INACTIVE');

  const updated = await prisma.student.update({
    where: { id },
    data: { isActive: false },
  });
  return safeStudent(updated);
}

/**
 * Bulk import students from a parsed array.
 * Each row: { firstName, lastName, studentId, email? }
 *
 * Skips rows where studentId already exists (returns them as skipped).
 * Returns { created, skipped, errors }.
 */
async function importStudents(rows) {
  const created = [];
  const skipped = [];
  const errors  = [];

  for (const row of rows) {
    const { firstName, lastName, studentId, email } = row;

    if (!firstName || !lastName || !studentId) {
      errors.push({ studentId: studentId ?? '?', reason: 'Missing required fields (firstName, lastName, studentId)' });
      continue;
    }

    const existing = await prisma.student.findUnique({ where: { studentId } });
    if (existing) {
      skipped.push({ studentId, reason: 'Student ID already exists' });
      continue;
    }

    if (email) {
      const byEmail = await prisma.student.findUnique({ where: { email } });
      if (byEmail) {
        skipped.push({ studentId, reason: 'Email already in use' });
        continue;
      }
    }

    try {
      const student = await prisma.student.create({
        data: { firstName, lastName, studentId, email: email ?? null, isActive: true },
      });
      created.push(safeStudent(student));
    } catch (e) {
      errors.push({ studentId, reason: e.message });
    }
  }

  return { created, skipped, errors };
}

module.exports = {
  getAllStudents,
  getStudentById,
  getStudentByStudentId,
  createStudent,
  updateStudent,
  deactivateStudent,
  importStudents,
};

