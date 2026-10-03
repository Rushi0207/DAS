const prisma = require('../config/prisma');
const AppError = require('../utils/AppError');

const CLASS_SUBJECT_INCLUDE = {
  class:   { select: { id: true, name: true, academicYear: true, division: true } },
  subject: { select: { id: true, name: true, code: true } },
};

function safeClassSubject(cs) {
  return {
    id: cs.id,
    classId: cs.classId,
    subjectId: cs.subjectId,
    academicYear: cs.academicYear,
    isActive: cs.isActive,
    class: cs.class,
    subject: cs.subject,
    createdAt: cs.createdAt,
    updatedAt: cs.updatedAt,
  };
}

async function getClassSubjectsByClassId(classId, filters = {}) {
  const cls = await prisma.class.findUnique({ where: { id: classId } });
  if (!cls) throw new AppError('Class not found', 404, 'CLASS_NOT_FOUND');

  const where = { classId };
  if (filters.isActive !== undefined) where.isActive = filters.isActive;

  const results = await prisma.classSubject.findMany({
    where,
    include: CLASS_SUBJECT_INCLUDE,
    orderBy: { id: 'asc' },
  });

  return results.map(safeClassSubject);
}

async function getClassSubjectById(id) {
  const cs = await prisma.classSubject.findUnique({
    where: { id },
    include: CLASS_SUBJECT_INCLUDE,
  });
  if (!cs) throw new AppError('Class-subject not found', 404, 'CLASS_SUBJECT_NOT_FOUND');
  return safeClassSubject(cs);
}

async function createClassSubject({ classId, subjectId, academicYear }) {
  const cls = await prisma.class.findUnique({ where: { id: classId } });
  if (!cls) throw new AppError('Class not found', 404, 'CLASS_NOT_FOUND');

  const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
  if (!subject) throw new AppError('Subject not found', 404, 'SUBJECT_NOT_FOUND');

  const existing = await prisma.classSubject.findUnique({
    where: { uq_class_subject_year: { classId, subjectId, academicYear } },
  });
  if (existing) {
    throw new AppError(
      `Subject "${subject.code}" is already linked to this class for ${academicYear}`,
      409,
      'DUPLICATE_CLASS_SUBJECT',
    );
  }

  const cs = await prisma.classSubject.create({
    data: { classId, subjectId, academicYear, isActive: true },
    include: CLASS_SUBJECT_INCLUDE,
  });

  return safeClassSubject(cs);
}

async function updateClassSubject(id, { isActive }) {
  const existing = await prisma.classSubject.findUnique({ where: { id } });
  if (!existing) throw new AppError('Class-subject not found', 404, 'CLASS_SUBJECT_NOT_FOUND');

  const updated = await prisma.classSubject.update({
    where: { id },
    data: { isActive },
    include: CLASS_SUBJECT_INCLUDE,
  });

  return safeClassSubject(updated);
}

async function getAllClassSubjects(filters = {}) {
  const where = {};
  if (filters.isActive     !== undefined) where.isActive     = filters.isActive;
  if (filters.academicYear !== undefined) where.academicYear = filters.academicYear;

  const results = await prisma.classSubject.findMany({
    where,
    include: CLASS_SUBJECT_INCLUDE,
    orderBy: [{ classId: 'asc' }, { id: 'asc' }],
  });

  return results.map(safeClassSubject);
}

module.exports = {
  getClassSubjectsByClassId,
  getClassSubjectById,
  createClassSubject,
  updateClassSubject,
  getAllClassSubjects,
};
