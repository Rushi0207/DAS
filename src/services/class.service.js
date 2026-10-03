const prisma = require('../config/prisma');
const AppError = require('../utils/AppError');

function safeClass(c) {
  return {
    id: c.id,
    name: c.name,
    academicYear: c.academicYear,
    division: c.division ?? null,
    isActive: c.isActive,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  };
}

async function getAllClasses(filters = {}) {
  const where = {};
  if (filters.academicYear !== undefined) where.academicYear = filters.academicYear;
  if (filters.isActive     !== undefined) where.isActive     = filters.isActive;

  const classes = await prisma.class.findMany({
    where,
    orderBy: [{ academicYear: 'desc' }, { name: 'asc' }],
  });

  return classes.map(safeClass);
}

async function getClassById(id) {
  const cls = await prisma.class.findUnique({ where: { id } });
  if (!cls) throw new AppError('Class not found', 404, 'CLASS_NOT_FOUND');
  return safeClass(cls);
}


async function createClass({ name, academicYear, division }) {
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

  const cls = await prisma.class.create({
    data: { name, academicYear, division: division ?? null, isActive: true },
  });

  return safeClass(cls);
}

async function updateClass(id, { name, academicYear, division, isActive }) {
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

  const data = {};
  if (name         !== undefined) data.name         = name;
  if (academicYear !== undefined) data.academicYear = academicYear;
  if (division     !== undefined) data.division     = division;
  if (isActive     !== undefined) data.isActive     = isActive;

  const updated = await prisma.class.update({ where: { id }, data });
  return safeClass(updated);
}

module.exports = { getAllClasses, getClassById, createClass, updateClass };
