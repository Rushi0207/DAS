const prisma = require('../config/prisma');
const AppError = require('../utils/AppError');

const SESSION_INCLUDE = {
  classSubject: {
    select: {
      id: true,
      academicYear: true,
      class:   { select: { id: true, name: true, academicYear: true, division: true } },
      subject: { select: { id: true, name: true, code: true } },
    },
  },
  teacher: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      employeeId: true,
    },
  },
};

const RECORD_INCLUDE = {
  student: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      studentId: true,
    },
  },
};

function safeSession(s) {
  return {
    id: s.id,
    classSubjectId: s.classSubjectId,
    teacherId: s.teacherId,
    sessionDate: s.sessionDate,
    startTime: s.startTime ?? null,
    notes: s.notes ?? null,
    classSubject: s.classSubject,
    teacher: s.teacher,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
  };
}

function safeRecord(r) {
  return {
    id: r.id,
    sessionId: r.sessionId,
    studentId: r.studentId,
    status: r.status,
    student: r.student,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

async function resolveTeacherFromUserId(userId) {
  const teacher = await prisma.teacher.findUnique({ where: { userId } });
  if (!teacher) throw new AppError('Teacher profile not found for this user', 403, 'TEACHER_PROFILE_NOT_FOUND');
  return teacher;
}

async function createSession({ classSubjectId, sessionDate, startTime, notes }, requestingUser) {

  const cs = await prisma.classSubject.findUnique({
    where: { id: classSubjectId },
    include: { class: true, subject: true },
  });
  if (!cs) throw new AppError('Class-subject not found', 404, 'CLASS_SUBJECT_NOT_FOUND');
  if (!cs.isActive) throw new AppError('Class-subject is inactive', 400, 'CLASS_SUBJECT_INACTIVE');

  let teacher;
  if (requestingUser.role === 'Administrator') {
    const assignment = await prisma.teacherAssignment.findFirst({
      where: { classSubjectId, isActive: true },
      include: { teacher: true },
    });
    if (!assignment) throw new AppError('No active teacher assignment found for this class-subject', 400, 'NO_ACTIVE_ASSIGNMENT');
    teacher = assignment.teacher;
  } else {
    teacher = await resolveTeacherFromUserId(requestingUser.id);
    const assignment = await prisma.teacherAssignment.findUnique({
      where: { uq_teacher_class_subject: { teacherId: teacher.id, classSubjectId } },
    });
    if (!assignment || !assignment.isActive) {
      throw new AppError('You are not assigned to this class-subject', 403, 'NOT_ASSIGNED');
    }
  }

  const session = await prisma.attendanceSession.create({
    data: {
      classSubjectId,
      teacherId: teacher.id,
      sessionDate: new Date(sessionDate),
      startTime: startTime ? new Date(`1970-01-01T${startTime}:00Z`) : null,
      notes: notes ?? null,
    },
    include: SESSION_INCLUDE,
  });

  return safeSession(session);
}

async function submitAttendance(sessionId, presentStudentIds, requestingUser) {
  const session = await prisma.attendanceSession.findUnique({
    where: { id: sessionId },
    include: {
      classSubject: { include: { class: true, subject: true } },
      teacher: true,
    },
  });
  if (!session) throw new AppError('Attendance session not found', 404, 'SESSION_NOT_FOUND');

  if (requestingUser.role !== 'Administrator') {
    const teacher = await resolveTeacherFromUserId(requestingUser.id);
    if (session.teacherId !== teacher.id) {
      throw new AppError('You are not the assigned teacher for this session', 403, 'NOT_SESSION_TEACHER');
    }
  }

  const existingRecords = await prisma.attendanceRecord.count({ where: { sessionId } });
  if (existingRecords > 0) {
    throw new AppError(
      'Attendance has already been submitted for this session',
      409,
      'ATTENDANCE_ALREADY_SUBMITTED',
    );
  }

  const enrollments = await prisma.enrollment.findMany({
    where: {
      classId:      session.classSubject.classId,
      academicYear: session.classSubject.academicYear,
      isActive:     true,
    },
    include: { student: true },
  });

  if (enrollments.length === 0) {
    throw new AppError('No active enrollments found for this class', 400, 'NO_ENROLLMENTS');
  }

  const enrolledStudentIds = new Set(enrollments.map(e => e.studentId));
  const presentSet = new Set(presentStudentIds);

  const invalidIds = [...presentSet].filter(id => !enrolledStudentIds.has(id));
  if (invalidIds.length > 0) {
    throw new AppError(
      `The following student IDs are not enrolled in this class: ${invalidIds.join(', ')}`,
      400,
      'STUDENTS_NOT_ENROLLED',
    );
  }

  const presentRecords = [...enrolledStudentIds]
    .filter(id => presentSet.has(id))
    .map(studentId => ({ sessionId, studentId, status: 'PRESENT' }));

  const absentRecords = [...enrolledStudentIds]
    .filter(id => !presentSet.has(id))
    .map(studentId => ({ sessionId, studentId, status: 'ABSENT' }));

  const allRecords = [...presentRecords, ...absentRecords];

  await prisma.$transaction(
    allRecords.map(record =>
      prisma.attendanceRecord.create({ data: record }),
    ),
  );

  return {
    sessionId,
    classSubjectId: session.classSubjectId,
    class: session.classSubject.class,
    subject: session.classSubject.subject,
    sessionDate: session.sessionDate,
    totalEnrolled: enrollments.length,
    totalPresent: presentRecords.length,
    totalAbsent: absentRecords.length,
    presentStudentIds: presentRecords.map(r => r.studentId),
    absentStudentIds: absentRecords.map(r => r.studentId),
  };
}


async function getSessionById(sessionId, requestingUser) {
  const session = await prisma.attendanceSession.findUnique({
    where: { id: sessionId },
    include: SESSION_INCLUDE,
  });
  if (!session) throw new AppError('Attendance session not found', 404, 'SESSION_NOT_FOUND');

  if (requestingUser.role === 'Subject Teacher') {
    const teacher = await resolveTeacherFromUserId(requestingUser.id);
    if (session.teacherId !== teacher.id) {
      throw new AppError('Access denied to this session', 403, 'FORBIDDEN');
    }
  }

  return safeSession(session);
}

async function listSessions(filters = {}, requestingUser) {
  const where = {};

  if (filters.classSubjectId) where.classSubjectId = filters.classSubjectId;
  if (filters.sessionDate)    where.sessionDate     = new Date(filters.sessionDate);

  if (requestingUser.role === 'Subject Teacher') {
    const teacher = await resolveTeacherFromUserId(requestingUser.id);
    where.teacherId = teacher.id;
  } else if (filters.teacherId) {
    where.teacherId = filters.teacherId;
  }

  const sessions = await prisma.attendanceSession.findMany({
    where,
    include: SESSION_INCLUDE,
    orderBy: [{ sessionDate: 'desc' }, { id: 'desc' }],
  });

  return sessions.map(safeSession);
}


async function getAttendanceBySession(sessionId, requestingUser) {
  const session = await prisma.attendanceSession.findUnique({
    where: { id: sessionId },
    include: SESSION_INCLUDE,
  });
  if (!session) throw new AppError('Attendance session not found', 404, 'SESSION_NOT_FOUND');

  if (requestingUser.role === 'Subject Teacher') {
    const teacher = await resolveTeacherFromUserId(requestingUser.id);
    if (session.teacherId !== teacher.id) {
      throw new AppError('Access denied to this session', 403, 'FORBIDDEN');
    }
  }

  const records = await prisma.attendanceRecord.findMany({
    where: { sessionId },
    include: RECORD_INCLUDE,
    orderBy: { student: { studentId: 'asc' } },
  });

  const present = records.filter(r => r.status === 'PRESENT').map(safeRecord);
  const absent  = records.filter(r => r.status === 'ABSENT').map(safeRecord);

  return {
    session: safeSession(session),
    summary: {
      totalRecords: records.length,
      totalPresent: present.length,
      totalAbsent:  absent.length,
    },
    records: {
      present,
      absent,
    },
  };
}

async function getStudentAttendanceSummary(studentId, classSubjectId) {
  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) throw new AppError('Student not found', 404, 'STUDENT_NOT_FOUND');

  const cs = await prisma.classSubject.findUnique({
    where: { id: classSubjectId },
    include: { class: true, subject: true },
  });
  if (!cs) throw new AppError('Class-subject not found', 404, 'CLASS_SUBJECT_NOT_FOUND');

  const sessions = await prisma.attendanceSession.findMany({
    where: { classSubjectId },
    select: { id: true },
  });

  const sessionIds = sessions.map(s => s.id);
  const totalSessions = sessionIds.length;

  if (totalSessions === 0) {
    return {
      student: { id: student.id, firstName: student.firstName, lastName: student.lastName, studentId: student.studentId },
      classSubject: { id: cs.id, class: cs.class, subject: cs.subject, academicYear: cs.academicYear },
      totalSessions: 0,
      present: 0,
      absent: 0,
      percentage: null,
    };
  }

  const presentCount = await prisma.attendanceRecord.count({
    where: { sessionId: { in: sessionIds }, studentId, status: 'PRESENT' },
  });

  const absentCount = totalSessions - presentCount;
  const percentage  = Math.round((presentCount / totalSessions) * 100 * 100) / 100; // 2 decimal places

  return {
    student: { id: student.id, firstName: student.firstName, lastName: student.lastName, studentId: student.studentId },
    classSubject: { id: cs.id, class: cs.class, subject: cs.subject, academicYear: cs.academicYear },
    totalSessions,
    present: presentCount,
    absent: absentCount,
    percentage,
  };
}

module.exports = {
  createSession,
  submitAttendance,
  getSessionById,
  listSessions,
  getAttendanceBySession,
  getStudentAttendanceSummary,
};
