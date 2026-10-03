const prisma = require('../config/prisma');
const AppError = require('../utils/AppError');


const ENROLLMENT_INCLUDE = {
  student: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      studentId: true,
      email: true,
    },
  },
  class: {
    select: {
      id: true,
      name: true,
      academicYear: true,
      division: true,
    },
  },
};

function safeEnrollment(e) {
  return {
    id: e.id,
    studentId: e.studentId,
    classId: e.classId,
    academicYear: e.academicYear,
    rollNumber: e.rollNumber,
    isActive: e.isActive,
    student: e.student,
    class: e.class,
    createdAt: e.createdAt,
    updatedAt: e.updatedAt,
  };
}

async function getEnrollmentsByClassId(classId, filters = {}) {
  const cls = await prisma.class.findUnique({ where: { id: classId } });
  if (!cls) throw new AppError('Class not found', 404, 'CLASS_NOT_FOUND');

  const where = { classId };
  if (filters.academicYear !== undefined) where.academicYear = filters.academicYear;
  if (filters.isActive     !== undefined) where.isActive     = filters.isActive;

  const results = await prisma.enrollment.findMany({
    where,
    include: ENROLLMENT_INCLUDE,
    orderBy: { rollNumber: 'asc' },
  });

  return results.map(safeEnrollment);
}

async function getEnrollmentsByStudentId(studentId, filters = {}) {
  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) throw new AppError('Student not found', 404, 'STUDENT_NOT_FOUND');

  const where = { studentId };
  if (filters.isActive !== undefined) where.isActive = filters.isActive;

  const results = await prisma.enrollment.findMany({
    where,
    include: ENROLLMENT_INCLUDE,
    orderBy: { id: 'asc' },
  });

  return results.map(safeEnrollment);
}

async function getAllEnrollments(filters = {}) {
  const where = {};
  if (filters.academicYear !== undefined) where.academicYear = filters.academicYear;
  if (filters.isActive     !== undefined) where.isActive     = filters.isActive;

  const results = await prisma.enrollment.findMany({
    where,
    include: ENROLLMENT_INCLUDE,
    orderBy: [{ classId: 'asc' }, { rollNumber: 'asc' }],
  });

  return results.map(safeEnrollment);
}

async function getEnrollmentById(id) {
  const e = await prisma.enrollment.findUnique({
    where: { id },
    include: ENROLLMENT_INCLUDE,
  });
  if (!e) throw new AppError('Enrollment not found', 404, 'ENROLLMENT_NOT_FOUND');
  return safeEnrollment(e);
}

async function createEnrollment({ studentId, classId, academicYear, rollNumber }) {
  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) throw new AppError('Student not found', 404, 'STUDENT_NOT_FOUND');
  if (!student.isActive) throw new AppError('Student account is inactive', 400, 'STUDENT_INACTIVE');

  const cls = await prisma.class.findUnique({ where: { id: classId } });
  if (!cls) throw new AppError('Class not found', 404, 'CLASS_NOT_FOUND');
  if (!cls.isActive) throw new AppError('Class is inactive', 400, 'CLASS_INACTIVE');

  const dupEnrollment = await prisma.enrollment.findUnique({
    where: { uq_enrollment_student_class_year: { studentId, classId, academicYear } },
  });
  if (dupEnrollment) {
    throw new AppError(
      'Student is already enrolled in this class for the given academic year',
      409,
      'DUPLICATE_ENROLLMENT',
    );
  }

  const dupRoll = await prisma.enrollment.findUnique({
    where: { uq_enrollment_roll_class_year: { classId, academicYear, rollNumber } },
  });
  if (dupRoll) {
    throw new AppError(
      `Roll number "${rollNumber}" is already taken in this class for ${academicYear}`,
      409,
      'DUPLICATE_ROLL_NUMBER',
    );
  }

  const enrollment = await prisma.enrollment.create({
    data: { studentId, classId, academicYear, rollNumber, isActive: true },
    include: ENROLLMENT_INCLUDE,
  });

  return safeEnrollment(enrollment);
}

async function updateEnrollment(id, { rollNumber, isActive }) {
  const existing = await prisma.enrollment.findUnique({ where: { id } });
  if (!existing) throw new AppError('Enrollment not found', 404, 'ENROLLMENT_NOT_FOUND');

  if (rollNumber && rollNumber !== existing.rollNumber) {
    const conflict = await prisma.enrollment.findUnique({
      where: {
        uq_enrollment_roll_class_year: {
          classId: existing.classId,
          academicYear: existing.academicYear,
          rollNumber,
        },
      },
    });
    if (conflict) {
      throw new AppError(
        `Roll number "${rollNumber}" is already taken in this class for ${existing.academicYear}`,
        409,
        'DUPLICATE_ROLL_NUMBER',
      );
    }
  }

  const data = {};
  if (rollNumber !== undefined) data.rollNumber = rollNumber;
  if (isActive   !== undefined) data.isActive   = isActive;

  const updated = await prisma.enrollment.update({
    where: { id },
    data,
    include: ENROLLMENT_INCLUDE,
  });

  return safeEnrollment(updated);
}

module.exports = {
  getEnrollmentsByClassId,
  getEnrollmentsByStudentId,
  getAllEnrollments,
  getEnrollmentById,
  createEnrollment,
  updateEnrollment,
};
