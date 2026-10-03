const prisma = require('../config/prisma');
const AppError = require('../utils/AppError');


async function adminDashboard() {
  const [
    totalUsers,
    totalActiveUsers,
    totalTeachers,
    totalStudents,
    totalActiveStudents,
    totalClasses,
    totalSubjects,
    totalClassSubjects,
    totalAssignments,
    totalEnrollments,
    totalSessions,
    totalRecords,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isActive: true } }),
    prisma.teacher.count(),
    prisma.student.count(),
    prisma.student.count({ where: { isActive: true } }),
    prisma.class.count({ where: { isActive: true } }),
    prisma.subject.count(),
    prisma.classSubject.count({ where: { isActive: true } }),
    prisma.teacherAssignment.count({ where: { isActive: true } }),
    prisma.enrollment.count({ where: { isActive: true } }),
    prisma.attendanceSession.count(),
    prisma.attendanceRecord.count(),
  ]);

  const presentCount = await prisma.attendanceRecord.count({ where: { status: 'PRESENT' } });
  const overallRate  = totalRecords > 0
    ? Math.round((presentCount / totalRecords) * 10000) / 100
    : null;

  const recentSessions = await prisma.attendanceSession.findMany({
    take: 5,
    orderBy: { sessionDate: 'desc' },
    include: {
      classSubject: {
        select: {
          class:   { select: { name: true, academicYear: true } },
          subject: { select: { name: true, code: true } },
        },
      },
      teacher: { select: { firstName: true, lastName: true, employeeId: true } },
    },
  });

  return {
    role: 'Administrator',
    stats: {
      users:          { total: totalUsers, active: totalActiveUsers },
      teachers:       { total: totalTeachers },
      students:       { total: totalStudents, active: totalActiveStudents },
      classes:        { total: totalClasses },
      subjects:       { total: totalSubjects },
      classSubjects:  { total: totalClassSubjects },
      assignments:    { total: totalAssignments },
      enrollments:    { total: totalEnrollments },
      sessions:       { total: totalSessions },
      attendanceRate: overallRate,
    },
    recentSessions: recentSessions.map(s => ({
      id:          s.id,
      sessionDate: s.sessionDate,
      class:       s.classSubject.class,
      subject:     s.classSubject.subject,
      teacher:     s.teacher,
    })),
  };
}

async function advisorDashboard(userId) {
  const teacher = await prisma.teacher.findUnique({ where: { userId } });
  if (!teacher) throw new AppError('Teacher profile not found', 403, 'TEACHER_PROFILE_NOT_FOUND');

  const assignments = await prisma.teacherAssignment.findMany({
    where: { teacherId: teacher.id, isActive: true },
    include: {
      classSubject: {
        include: {
          class:   { select: { id: true, name: true, academicYear: true, division: true } },
          subject: { select: { id: true, name: true, code: true } },
        },
      },
    },
  });

  const classIds = [...new Set(assignments.map(a => a.classSubject.classId))];

  const classStats = await Promise.all(
    classIds.map(async classId => {
      const cls = assignments.find(a => a.classSubject.classId === classId)?.classSubject.class;
      const enrolledCount = await prisma.enrollment.count({
        where: { classId, isActive: true },
      });
      const csIdsForClass = assignments
        .filter(a => a.classSubject.classId === classId)
        .map(a => a.classSubjectId);
      const sessions = await prisma.attendanceSession.findMany({
        where: { classSubjectId: { in: csIdsForClass } },
        select: { id: true },
      });
      return {
        class:             cls,
        enrolledStudents:  enrolledCount,
        sessionsConducted: sessions.length,
      };
    }),
  );

  const assignedClassSubjectIds = assignments.map(a => a.classSubjectId);
  const recentSessions = await prisma.attendanceSession.findMany({
    where: { classSubjectId: { in: assignedClassSubjectIds } },
    take: 5,
    orderBy: { sessionDate: 'desc' },
    include: {
      classSubject: {
        select: {
          class:   { select: { name: true } },
          subject: { select: { name: true, code: true } },
        },
      },
    },
  });

  let totalLowAttendance = 0;
  for (const csId of assignedClassSubjectIds) {
    const sessions = await prisma.attendanceSession.findMany({
      where: { classSubjectId: csId },
      select: { id: true },
    });
    if (sessions.length === 0) continue;

    const sessionIds    = sessions.map(s => s.id);
    const totalSessions = sessions.length;

    const cs = await prisma.classSubject.findUnique({
      where: { id: csId },
      select: { classId: true, academicYear: true },
    });
    const enrolled = await prisma.enrollment.findMany({
      where: { classId: cs.classId, academicYear: cs.academicYear, isActive: true },
      select: { studentId: true },
    });

    for (const e of enrolled) {
      const present = await prisma.attendanceRecord.count({
        where: { sessionId: { in: sessionIds }, studentId: e.studentId, status: 'PRESENT' },
      });
      const pct = (present / totalSessions) * 100;
      if (pct < 75) totalLowAttendance++;
    }
  }

  return {
    role: 'Class Advisor',
    teacher: {
      id:         teacher.id,
      firstName:  teacher.firstName,
      lastName:   teacher.lastName,
      employeeId: teacher.employeeId,
    },
    stats: {
      assignedClassSubjects: assignments.length,
      totalLowAttendanceStudents: totalLowAttendance,
    },
    classes: classStats,
    recentSessions: recentSessions.map(s => ({
      id:          s.id,
      sessionDate: s.sessionDate,
      class:       s.classSubject.class,
      subject:     s.classSubject.subject,
    })),
  };
}


async function teacherDashboard(userId) {
  const teacher = await prisma.teacher.findUnique({ where: { userId } });
  if (!teacher) throw new AppError('Teacher profile not found', 403, 'TEACHER_PROFILE_NOT_FOUND');

  const assignments = await prisma.teacherAssignment.findMany({
    where: { teacherId: teacher.id, isActive: true },
    include: {
      classSubject: {
        include: {
          class:   { select: { id: true, name: true, academicYear: true, division: true } },
          subject: { select: { id: true, name: true, code: true } },
        },
      },
    },
  });

  const subjectStats = await Promise.all(
    assignments.map(async a => {
      const cs = a.classSubject;

      const sessions = await prisma.attendanceSession.findMany({
        where: { classSubjectId: cs.id, teacherId: teacher.id },
        select: { id: true },
      });
      const sessionIds    = sessions.map(s => s.id);
      const totalSessions = sessions.length;

      const enrolledCount = await prisma.enrollment.count({
        where: { classId: cs.classId, academicYear: cs.academicYear, isActive: true },
      });

      let presentCount = 0;
      let totalRecords = 0;
      if (totalSessions > 0) {
        totalRecords = await prisma.attendanceRecord.count({
          where: { sessionId: { in: sessionIds } },
        });
        presentCount = await prisma.attendanceRecord.count({
          where: { sessionId: { in: sessionIds }, status: 'PRESENT' },
        });
      }

      const attendanceRate = totalRecords > 0
        ? Math.round((presentCount / totalRecords) * 10000) / 100
        : null;

      return {
        assignmentId:    a.id,
        classSubjectId:  cs.id,
        class:           cs.class,
        subject:         cs.subject,
        enrolledStudents: enrolledCount,
        sessionsConducted: totalSessions,
        attendanceRate,
      };
    }),
  );

  const recentSessions = await prisma.attendanceSession.findMany({
    where: { teacherId: teacher.id },
    take: 5,
    orderBy: { sessionDate: 'desc' },
    include: {
      classSubject: {
        select: {
          class:   { select: { name: true } },
          subject: { select: { name: true, code: true } },
        },
      },
    },
  });

  return {
    role: 'Subject Teacher',
    teacher: {
      id:         teacher.id,
      firstName:  teacher.firstName,
      lastName:   teacher.lastName,
      employeeId: teacher.employeeId,
    },
    stats: {
      assignedSubjects:  assignments.length,
      totalSessions:     subjectStats.reduce((sum, s) => sum + s.sessionsConducted, 0),
    },
    subjects: subjectStats,
    recentSessions: recentSessions.map(s => ({
      id:          s.id,
      sessionDate: s.sessionDate,
      class:       s.classSubject.class,
      subject:     s.classSubject.subject,
    })),
  };
}

module.exports = { adminDashboard, advisorDashboard, teacherDashboard };
