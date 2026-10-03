const prisma = require('../config/prisma');
const AppError = require('../utils/AppError');

function calcPercentage(present, total) {
  if (total === 0) return null;
  return Math.round((present / total) * 10000) / 100; // 2 decimal places
}

async function getPresentCountMap(sessionIds) {
  if (sessionIds.length === 0) return new Map();

  const records = await prisma.attendanceRecord.findMany({
    where: { sessionId: { in: sessionIds }, status: 'PRESENT' },
    select: { studentId: true },
  });

  const map = new Map();
  for (const r of records) {
    map.set(r.studentId, (map.get(r.studentId) ?? 0) + 1);
  }
  return map;
}

async function studentWiseReport({ studentId, academicYear }) {
  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) throw new AppError('Student not found', 404, 'STUDENT_NOT_FOUND');

  const enrollmentWhere = { studentId, isActive: true };
  if (academicYear) enrollmentWhere.academicYear = academicYear;

  const enrollments = await prisma.enrollment.findMany({
    where: enrollmentWhere,
    include: {
      class: { select: { id: true, name: true, academicYear: true, division: true } },
    },
  });

  const subjectRows = [];

  for (const enrollment of enrollments) {
    const classSubjects = await prisma.classSubject.findMany({
      where: { classId: enrollment.classId, academicYear: enrollment.academicYear, isActive: true },
      include: { subject: { select: { id: true, name: true, code: true } } },
    });

    for (const cs of classSubjects) {
      const sessions = await prisma.attendanceSession.findMany({
        where: { classSubjectId: cs.id },
        select: { id: true },
      });

      const totalSessions = sessions.length;
      const sessionIds    = sessions.map(s => s.id);

      const presentCount = totalSessions === 0 ? 0 : await prisma.attendanceRecord.count({
        where: { sessionId: { in: sessionIds }, studentId, status: 'PRESENT' },
      });

      subjectRows.push({
        classSubjectId: cs.id,
        class:          enrollment.class,
        subject:        cs.subject,
        academicYear:   cs.academicYear,
        rollNumber:     enrollment.rollNumber,
        totalSessions,
        present:        presentCount,
        absent:         totalSessions - presentCount,
        percentage:     calcPercentage(presentCount, totalSessions),
      });
    }
  }

  return {
    student: {
      id:        student.id,
      firstName: student.firstName,
      lastName:  student.lastName,
      studentId: student.studentId,
      email:     student.email,
    },
    subjects: subjectRows,
  };
}

async function subjectWiseReport({ classSubjectId }) {
  const cs = await prisma.classSubject.findUnique({
    where: { id: classSubjectId },
    include: {
      class:   { select: { id: true, name: true, academicYear: true, division: true } },
      subject: { select: { id: true, name: true, code: true } },
    },
  });
  if (!cs) throw new AppError('Class-subject not found', 404, 'CLASS_SUBJECT_NOT_FOUND');

  const sessions = await prisma.attendanceSession.findMany({
    where: { classSubjectId },
    select: { id: true },
  });
  const totalSessions = sessions.length;
  const sessionIds    = sessions.map(s => s.id);

  const enrollments = await prisma.enrollment.findMany({
    where: { classId: cs.classId, academicYear: cs.academicYear, isActive: true },
    include: {
      student: { select: { id: true, firstName: true, lastName: true, studentId: true } },
    },
    orderBy: { rollNumber: 'asc' },
  });

  const presentMap = await getPresentCountMap(sessionIds);

  const studentRows = enrollments.map(e => {
    const present = presentMap.get(e.studentId) ?? 0;
    return {
      enrollmentId: e.id,
      rollNumber:   e.rollNumber,
      student:      e.student,
      totalSessions,
      present,
      absent:       totalSessions - present,
      percentage:   calcPercentage(present, totalSessions),
    };
  });

  return {
    classSubject: {
      id:          cs.id,
      academicYear: cs.academicYear,
      class:       cs.class,
      subject:     cs.subject,
    },
    totalSessions,
    totalStudents: studentRows.length,
    students:      studentRows,
  };
}

async function classWiseReport({ classId, academicYear }) {
  const cls = await prisma.class.findUnique({ where: { id: classId } });
  if (!cls) throw new AppError('Class not found', 404, 'CLASS_NOT_FOUND');

  const classSubjects = await prisma.classSubject.findMany({
    where: { classId, academicYear, isActive: true },
    include: { subject: { select: { id: true, name: true, code: true } } },
  });

  const enrollments = await prisma.enrollment.findMany({
    where: { classId, academicYear, isActive: true },
    include: {
      student: { select: { id: true, firstName: true, lastName: true, studentId: true } },
    },
    orderBy: { rollNumber: 'asc' },
  });

  const subjectStats = [];
  const allSessionIds = [];

  for (const cs of classSubjects) {
    const sessions = await prisma.attendanceSession.findMany({
      where: { classSubjectId: cs.id },
      select: { id: true },
    });
    allSessionIds.push(...sessions.map(s => s.id));
    subjectStats.push({ classSubject: cs, sessionCount: sessions.length, sessionIds: sessions.map(s => s.id) });
  }

  const presentMap = await getPresentCountMap(allSessionIds);
  const totalSessions = allSessionIds.length;

  const studentRows = enrollments.map(e => {
    const present = presentMap.get(e.studentId) ?? 0;
    return {
      enrollmentId: e.id,
      rollNumber:   e.rollNumber,
      student:      e.student,
      totalSessions,
      present,
      absent:     totalSessions - present,
      percentage: calcPercentage(present, totalSessions),
    };
  });

  return {
    class:         { id: cls.id, name: cls.name, academicYear: cls.academicYear, division: cls.division },
    academicYear,
    subjects:      subjectStats.map(s => ({ id: s.classSubject.id, subject: s.classSubject.subject, sessionCount: s.sessionCount })),
    totalSessions,
    totalStudents: studentRows.length,
    students:      studentRows,
  };
}

async function lowAttendanceReport({ classSubjectId, threshold = 75 }) {
  const cs = await prisma.classSubject.findUnique({
    where: { id: classSubjectId },
    include: {
      class:   { select: { id: true, name: true, academicYear: true, division: true } },
      subject: { select: { id: true, name: true, code: true } },
    },
  });
  if (!cs) throw new AppError('Class-subject not found', 404, 'CLASS_SUBJECT_NOT_FOUND');

  const report = await subjectWiseReport({ classSubjectId });

  const lowStudents = report.students.filter(s => {
    if (s.percentage === null) return false;
    return s.percentage < threshold;
  });

  return {
    classSubject:  report.classSubject,
    totalSessions: report.totalSessions,
    threshold,
    totalStudents:    report.totalStudents,
    lowAttendanceCount: lowStudents.length,
    students:         lowStudents,
  };
}

module.exports = {
  studentWiseReport,
  subjectWiseReport,
  classWiseReport,
  lowAttendanceReport,
};
