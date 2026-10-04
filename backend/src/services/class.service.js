const prisma = require('../config/prisma');
const AppError = require('../utils/AppError');

// ─── Includes ─────────────────────────────────────────────────────────────────

const CLASS_INCLUDE = {
  advisor: {
    select: {
      id:         true,
      firstName:  true,
      lastName:   true,
      employeeId: true,
    },
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function safeClass(c) {
  return {
    id:           c.id,
    name:         c.name,
    academicYear: c.academicYear,
    division:     c.division   ?? null,
    advisorId:    c.advisorId  ?? null,
    advisor:      c.advisor    ?? null,
    isActive:     c.isActive,
    createdAt:    c.createdAt,
    updatedAt:    c.updatedAt,
  };
}

// ─── Service functions ────────────────────────────────────────────────────────

async function getAllClasses(filters = {}) {
  const where = {};
  if (filters.academicYear !== undefined) where.academicYear = filters.academicYear;
  if (filters.isActive     !== undefined) where.isActive     = filters.isActive;

  const classes = await prisma.class.findMany({
    where,
    include: CLASS_INCLUDE,
    orderBy: [{ academicYear: 'desc' }, { name: 'asc' }],
  });

  return classes.map(safeClass);
}

async function getClassById(id) {
  const cls = await prisma.class.findUnique({
    where: { id },
    include: CLASS_INCLUDE,
  });
  if (!cls) throw new AppError('Class not found', 404, 'CLASS_NOT_FOUND');
  return safeClass(cls);
}

async function createClass({ name, academicYear, division, advisorId }) {
  // Uniqueness check
  const existing = await prisma.class.findUnique({
    where: { uq_class_name_year: { name, academicYear } },
  });
  if (existing) {
    throw new AppError(
      `Class "${name}" already exists for academic year ${academicYear}`,
      409,
      'DUPLICATE_CLASS',
    );
  }

  // Validate advisor exists if provided
  if (advisorId) {
    const teacher = await prisma.teacher.findUnique({ where: { id: advisorId } });
    if (!teacher) throw new AppError('Advisor (teacher) not found', 404, 'TEACHER_NOT_FOUND');
  }

  const cls = await prisma.class.create({
    data: {
      name,
      academicYear,
      division:  division  ?? null,
      advisorId: advisorId ?? null,
      isActive:  true,
    },
    include: CLASS_INCLUDE,
  });

  return safeClass(cls);
}

async function updateClass(id, { name, academicYear, division, isActive, advisorId }) {
  const existing = await prisma.class.findUnique({ where: { id } });
  if (!existing) throw new AppError('Class not found', 404, 'CLASS_NOT_FOUND');

  const newName = name         ?? existing.name;
  const newYear = academicYear ?? existing.academicYear;

  if (name || academicYear) {
    const conflict = await prisma.class.findUnique({
      where: { uq_class_name_year: { name: newName, academicYear: newYear } },
    });
    if (conflict && conflict.id !== id) {
      throw new AppError(
        `Class "${newName}" already exists for academic year ${newYear}`,
        409,
        'DUPLICATE_CLASS',
      );
    }
  }

  // Validate new advisor if provided
  if (advisorId) {
    const teacher = await prisma.teacher.findUnique({ where: { id: advisorId } });
    if (!teacher) throw new AppError('Advisor (teacher) not found', 404, 'TEACHER_NOT_FOUND');
  }

  const data = {};
  if (name         !== undefined) data.name         = name;
  if (academicYear !== undefined) data.academicYear = academicYear;
  if (division     !== undefined) data.division     = division;
  if (isActive     !== undefined) data.isActive     = isActive;
  // advisorId: allow setting (number) or clearing (null explicitly)
  if (advisorId !== undefined)    data.advisorId    = advisorId;

  const updated = await prisma.class.update({
    where: { id },
    data,
    include: CLASS_INCLUDE,
  });

  return safeClass(updated);
}

module.exports = { getAllClasses, getClassById, createClass, updateClass };
