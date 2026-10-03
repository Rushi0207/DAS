const prisma = require('../config/prisma');
const AppError = require('../utils/AppError');

function safeSubject(s) {
  return {
    id: s.id,
    name: s.name,
    code: s.code,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
  };
}

async function getAllSubjects(filters = {}) {
  const where = {};

  if (filters.search) {
    const s = filters.search;
    where.OR = [
      { name: { contains: s, mode: 'insensitive' } },
      { code: { contains: s, mode: 'insensitive' } },
    ];
  }

  const subjects = await prisma.subject.findMany({
    where,
    orderBy: { code: 'asc' },
  });

  return subjects.map(safeSubject);
}

async function getSubjectById(id) {
  const subject = await prisma.subject.findUnique({ where: { id } });
  if (!subject) throw new AppError('Subject not found', 404, 'SUBJECT_NOT_FOUND');
  return safeSubject(subject);
}

async function createSubject({ name, code }) {
  const existing = await prisma.subject.findUnique({ where: { code } });
  if (existing) {
    throw new AppError(`Subject code "${code}" is already in use`, 409, 'DUPLICATE_SUBJECT_CODE');
  }

  const subject = await prisma.subject.create({ data: { name, code } });
  return safeSubject(subject);
}

async function updateSubject(id, { name, code }) {
  const existing = await prisma.subject.findUnique({ where: { id } });
  if (!existing) throw new AppError('Subject not found', 404, 'SUBJECT_NOT_FOUND');

  if (code && code !== existing.code) {
    const conflict = await prisma.subject.findUnique({ where: { code } });
    if (conflict) {
      throw new AppError(`Subject code "${code}" is already in use`, 409, 'DUPLICATE_SUBJECT_CODE');
    }
  }

  const data = {};
  if (name !== undefined) data.name = name;
  if (code !== undefined) data.code = code;

  const updated = await prisma.subject.update({ where: { id }, data });
  return safeSubject(updated);
}

module.exports = { getAllSubjects, getSubjectById, createSubject, updateSubject };
