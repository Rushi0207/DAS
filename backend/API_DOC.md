# DAS Backend API Documentation

**Base URL:** `http://localhost:5000/api/v1`  
**Content-Type:** `application/json`  
**Authentication:** Bearer token in `Authorization` header

---

## Table of Contents

1. [Authentication](#1-authentication)
2. [Users](#2-users)
3. [Teachers](#3-teachers)
4. [Students](#4-students)
5. [Classes](#5-classes)
6. [Subjects](#6-subjects)
7. [Class-Subjects](#7-class-subjects)
8. [Assignments](#8-assignments)
9. [Enrollments](#9-enrollments)
10. [Attendance](#10-attendance)
11. [Reports](#11-reports)
12. [Dashboard](#12-dashboard)
13. [Response Format](#13-response-format)
14. [Error Codes](#14-error-codes)
15. [Role Summary](#15-role-summary)

---

## Authentication

Every protected route requires:
```
Authorization: Bearer <token>
```

The token is obtained from `POST /auth/login` and expires in `1d` by default.

**JWT payload contains:**
```json
{
  "id": 1,
  "username": "admin",
  "email": "admin@example.com",
  "role": "Administrator"
}
```

**Three roles exist:**
- `Administrator`
- `Class Advisor`
- `Subject Teacher`

---

## 1. Authentication

### POST /auth/login
Public. No token required.

**Request body:**
```json
{
  "login": "admin",
  "password": "yourpassword"
}
```
> `login` accepts either `username` or `email`.

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "token": "eyJ...",
    "user": {
      "id": 1,
      "username": "admin",
      "email": "admin@example.com",
      "isActive": true,
      "role": "Administrator",
      "createdAt": "2026-10-02T17:01:41.844Z"
    }
  }
}
```

---

### GET /auth/me
Returns the authenticated user's profile.

**Access:** All roles

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "username": "admin",
      "email": "admin@example.com",
      "isActive": true,
      "role": "Administrator",
      "createdAt": "...",
      "updatedAt": "..."
    }
  }
}
```

---

## 2. Users

**Access:** Administrator only (all endpoints)

### GET /users
List all users.

**Query params:**
| Param | Type | Description |
|---|---|---|
| `roleId` | number | Filter by role id |
| `isActive` | boolean | Filter by active status |

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": 1,
        "username": "admin",
        "email": "admin@example.com",
        "isActive": true,
        "role": "Administrator",
        "roleId": 1,
        "createdAt": "...",
        "updatedAt": "..."
      }
    ]
  }
}
```

---

### GET /users/roles
List all available roles.

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "roles": [
      { "id": 1, "name": "Administrator" },
      { "id": 2, "name": "Class Advisor" },
      { "id": 3, "name": "Subject Teacher" }
    ]
  }
}
```

---

### GET /users/:id
Get a single user by id.

---

### POST /users
Create a new user.

**Request body:**
```json
{
  "username": "teacher1",
  "email": "teacher1@school.com",
  "password": "Password@123",
  "roleId": 3
}
```

**Validation:**
- `username`: 3–50 chars, letters/numbers/underscores only
- `email`: valid email
- `password`: minimum 8 characters
- `roleId`: must exist

**Response `201`**

---

### PATCH /users/:id
Update a user. Send only the fields to change.

**Request body (all optional):**
```json
{
  "username": "newname",
  "email": "new@email.com",
  "roleId": 2,
  "isActive": false
}
```

---

### DELETE /users/:id
Soft-deactivate a user (sets `isActive = false`).

> Cannot deactivate your own account.

**Response `200`** — returns the updated user with `isActive: false`

---

## 3. Teachers

Teacher profiles are linked 1-to-1 to a User account. Only users with role `Subject Teacher` or `Class Advisor` can have a teacher profile.

### GET /teachers
List all teacher profiles.

**Access:** Administrator, Class Advisor

**Query params:**
| Param | Type | Description |
|---|---|---|
| `department` | string | Filter by department |

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "teachers": [
      {
        "id": 1,
        "userId": 4,
        "firstName": "John",
        "lastName": "Doe",
        "fullName": "John Doe",
        "employeeId": "EMP001",
        "department": "Computer Science",
        "user": {
          "id": 4,
          "username": "teacher2",
          "email": "teacher2@das.com",
          "isActive": true,
          "role": { "name": "Subject Teacher" }
        },
        "createdAt": "...",
        "updatedAt": "..."
      }
    ]
  }
}
```

---

### GET /teachers/me
Returns the teacher profile for the currently authenticated teacher/advisor.

**Access:** Subject Teacher, Class Advisor

---

### GET /teachers/:id
Get a teacher by id.

**Access:** Administrator, Class Advisor

---

### GET /teachers/:teacherId/assignments
List all class-subject assignments for a teacher.

**Access:** Administrator, Class Advisor, Subject Teacher

**Query params:**
| Param | Type | Description |
|---|---|---|
| `isActive` | boolean | Filter by active status |

---

### POST /teachers
Create a teacher profile for an existing user.

**Access:** Administrator

**Request body:**
```json
{
  "userId": 4,
  "firstName": "John",
  "lastName": "Doe",
  "employeeId": "EMP001",
  "department": "Computer Science"
}
```

**Validation:**
- `userId` must exist, be active, and have role `Subject Teacher` or `Class Advisor`
- `employeeId` must be unique
- User must not already have a teacher profile

**Response `201`**

---

### PATCH /teachers/:id
Update a teacher profile.

**Access:** Administrator

**Request body (all optional):**
```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "employeeId": "EMP002",
  "department": "Mathematics"
}
```

---

## 4. Students

Students do not have user accounts (no login portal).

### GET /students
List all students.

**Access:** Administrator, Class Advisor

**Query params:**
| Param | Type | Description |
|---|---|---|
| `isActive` | boolean | Filter by active status |
| `search` | string | Search by firstName, lastName, or studentId |

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "students": [
      {
        "id": 1,
        "firstName": "Alice",
        "lastName": "Sharma",
        "fullName": "Alice Sharma",
        "studentId": "STU001",
        "email": "alice@college.com",
        "isActive": true,
        "createdAt": "...",
        "updatedAt": "..."
      }
    ]
  }
}
```

---

### GET /students/:id
Get a student by id.

**Access:** Administrator, Class Advisor, Subject Teacher

---

### GET /students/:studentId/enrollments
List all class enrollments for a student.

**Access:** Administrator, Class Advisor, Subject Teacher

**Query params:**
| Param | Type | Description |
|---|---|---|
| `isActive` | boolean | Filter by active status |

---

### POST /students
Create a new student.

**Access:** Administrator, Class Advisor

**Request body:**
```json
{
  "firstName": "Alice",
  "lastName": "Sharma",
  "studentId": "STU001",
  "email": "alice@college.com"
}
```

**Validation:**
- `studentId` must be unique
- `email` must be unique (optional field)

**Response `201`**

---

### PATCH /students/:id
Update a student.

**Access:** Administrator, Class Advisor

**Request body (all optional):**
```json
{
  "firstName": "Alice",
  "lastName": "Sharma-Updated",
  "studentId": "STU001",
  "email": "newemail@college.com",
  "isActive": true
}
```

---

### DELETE /students/:id
Soft-deactivate a student.

**Access:** Administrator

---

### POST /students/import
Bulk import students from a parsed CSV/Excel file. The frontend parses the file client-side and sends the rows as a JSON array.

**Access:** Administrator, Class Advisor

**Request body:**
```json
{
  "rows": [
    { "firstName": "Alice", "lastName": "Sharma", "studentId": "STU001", "email": "alice@college.com" },
    { "firstName": "Bob",   "lastName": "Patil",  "studentId": "STU002" }
  ]
}
```

**Validation:**
- `rows` must be a non-empty array, maximum 500 rows
- Each row must have `firstName`, `lastName`, `studentId`
- `email` is optional per row
- Rows with duplicate `studentId` are skipped (not an error)

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "created": [ { "id": 5, "firstName": "Alice", ... } ],
    "skipped": [ { "studentId": "STU001", "reason": "Student ID already exists" } ],
    "errors":  []
  }
}
```

> The import never fails the whole batch. Each row is processed independently — duplicates go to `skipped`, unexpected errors go to `errors`.

---

## 5. Classes

### GET /classes
List all classes.

**Access:** All roles

**Query params:**
| Param | Type | Description |
|---|---|---|
| `academicYear` | string | Filter e.g. `2025-26` |
| `isActive` | boolean | Filter by active status |

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "classes": [
      {
        "id": 1,
        "name": "TYCS-A",
        "academicYear": "2025-26",
        "division": "A",
        "advisorId": 1,
        "advisor": {
          "id": 1,
          "firstName": "Sarah",
          "lastName": "Advisor",
          "employeeId": "EMP003"
        },
        "isActive": true,
        "createdAt": "...",
        "updatedAt": "..."
      }
    ]
  }
}
```

> `advisorId` and `advisor` are `null` when no advisor is assigned.

---

### GET /classes/:id
Get a class by id.

**Access:** All roles

---

### GET /classes/:classId/subjects
List all subjects linked to a class.

**Access:** All roles

**Query params:**
| Param | Type | Description |
|---|---|---|
| `isActive` | boolean | Filter by active status |

---

### GET /classes/:classId/enrollments
List all student enrollments in a class.

**Access:** All roles

**Query params:**
| Param | Type | Description |
|---|---|---|
| `academicYear` | string | Filter by year |
| `isActive` | boolean | Filter by active status |

---

### POST /classes
Create a new class.

**Access:** Administrator

**Request body:**
```json
{
  "name": "TYCS-A",
  "academicYear": "2025-26",
  "division": "A",
  "advisorId": 1
}
```

**Validation:**
- `academicYear` format: `YYYY-YY` or `YYYY-YYYY` (e.g. `2025-26`)
- `name` + `academicYear` must be unique together
- `advisorId` is optional — must reference an existing teacher if provided

**Response `201`**

---

### POST /classes/:classId/subjects
Link a subject to a class.

**Access:** Administrator

**Request body:**
```json
{
  "subjectId": 1,
  "academicYear": "2025-26"
}
```

**Response `201`**

---

### POST /classes/:classId/enrollments
Enroll a student in a class.

**Access:** Administrator, Class Advisor

**Request body:**
```json
{
  "studentId": 1,
  "academicYear": "2025-26",
  "rollNumber": "1"
}
```

**Validation:**
- Student must be active
- Class must be active
- Student cannot be enrolled in the same class + year twice
- `rollNumber` must be unique within the same class + year

**Response `201`**

---

### PATCH /classes/:id
Update a class.

**Access:** Administrator

**Request body (all optional):**
```json
{
  "name": "TYCS-A",
  "academicYear": "2025-26",
  "division": "A",
  "advisorId": 1,
  "isActive": true
}
```

> Set `advisorId` to `null` to remove the assigned advisor.

---

## 6. Subjects

### GET /subjects
List all subjects.

**Access:** All roles

**Query params:**
| Param | Type | Description |
|---|---|---|
| `search` | string | Search by name or code |

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "subjects": [
      {
        "id": 1,
        "name": "Data Structures",
        "code": "CS301",
        "createdAt": "...",
        "updatedAt": "..."
      }
    ]
  }
}
```

---

### GET /subjects/:id
Get a subject by id.

**Access:** All roles

---

### POST /subjects
Create a new subject.

**Access:** Administrator, Class Advisor

**Request body:**
```json
{
  "name": "Data Structures",
  "code": "CS301"
}
```

**Validation:**
- `code` must be unique
- `code` format: uppercase letters, numbers, underscores, hyphens only (e.g. `CS301`, `MATH-101`)

**Response `201`**

---

### PATCH /subjects/:id
Update a subject.

**Access:** Administrator

**Request body (all optional):**
```json
{
  "name": "Data Structures and Algorithms",
  "code": "CS301"
}
```

---

## 7. Class-Subjects

A class-subject is the link between a Class and a Subject for a specific academic year. It is the entity that sessions, assignments, and attendance hang off.

### GET /class-subjects
Global list of all class-subjects.

**Access:** Administrator, Class Advisor

**Query params:**
| Param | Type | Description |
|---|---|---|
| `isActive` | boolean | Filter by active status |
| `academicYear` | string | Filter by year |

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "classSubjects": [
      {
        "id": 1,
        "classId": 1,
        "subjectId": 1,
        "academicYear": "2025-26",
        "isActive": true,
        "class": { "id": 1, "name": "TYCS-A", "academicYear": "2025-26", "division": "A" },
        "subject": { "id": 1, "name": "Data Structures", "code": "CS301" },
        "createdAt": "...",
        "updatedAt": "..."
      }
    ]
  }
}
```

---

### GET /class-subjects/:id
Get a class-subject by id.

**Access:** All roles

---

### GET /class-subjects/:classSubjectId/assignments
List all teacher assignments for a class-subject.

**Access:** All roles

**Query params:**
| Param | Type | Description |
|---|---|---|
| `isActive` | boolean | Filter by active status |

---

### POST /class-subjects/:classSubjectId/assignments
Assign a teacher to a class-subject.

**Access:** Administrator, Class Advisor

**Request body:**
```json
{
  "teacherId": 1
}
```

**Validation:**
- Teacher must exist and have role `Subject Teacher` or `Class Advisor`
- Class-subject must be active
- Cannot assign same teacher to same class-subject twice

**Response `201`**

---

### PATCH /class-subjects/:id
Toggle `isActive` on a class-subject.

**Access:** Administrator

**Request body:**
```json
{
  "isActive": false
}
```

---

## 8. Assignments

Teacher assignments link a teacher to a class-subject and authorize them to take attendance.

### GET /assignments
Global list of all assignments.

**Access:** Administrator, Class Advisor

**Query params:**
| Param | Type | Description |
|---|---|---|
| `isActive` | boolean | Filter by active status |

---

### GET /assignments/:id
Get a single assignment by id.

**Access:** Administrator, Class Advisor, Subject Teacher

---

### PATCH /assignments/:id
Toggle `isActive` on an assignment.

**Access:** Administrator

**Request body:**
```json
{
  "isActive": false
}
```

---

## 9. Enrollments

### GET /enrollments
Global list of all enrollments.

**Access:** Administrator, Class Advisor

**Query params:**
| Param | Type | Description |
|---|---|---|
| `academicYear` | string | Filter by year |
| `isActive` | boolean | Filter by active status |

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "enrollments": [
      {
        "id": 1,
        "studentId": 1,
        "classId": 1,
        "academicYear": "2025-26",
        "rollNumber": "1",
        "isActive": true,
        "student": { "id": 1, "firstName": "Alice", "lastName": "Sharma", "studentId": "STU001", "email": "..." },
        "class": { "id": 1, "name": "TYCS-A", "academicYear": "2025-26", "division": "A" },
        "createdAt": "...",
        "updatedAt": "..."
      }
    ]
  }
}
```

---

### GET /enrollments/:id
Get a single enrollment by id.

**Access:** All roles

---

### PATCH /enrollments/:id
Update rollNumber or toggle isActive.

**Access:** Administrator, Class Advisor

**Request body (all optional):**
```json
{
  "rollNumber": "10",
  "isActive": false
}
```

---

## 10. Attendance

### POST /attendance/sessions
Create a new attendance session.

**Access:** All roles (resource-level: teacher must be assigned to the class-subject)

**Request body:**
```json
{
  "classSubjectId": 1,
  "sessionDate": "2026-10-03",
  "startTime": "09:00",
  "notes": "Lecture 1"
}
```

**Validation:**
- `sessionDate` format: `YYYY-MM-DD`
- `startTime` format: `HH:MM` (optional)
- Teacher must have an active assignment to this class-subject
- Administrator can create on behalf of any assigned teacher

**Response `201`:**
```json
{
  "success": true,
  "data": {
    "session": {
      "id": 1,
      "classSubjectId": 1,
      "teacherId": 1,
      "sessionDate": "2026-10-03T00:00:00.000Z",
      "startTime": "...",
      "notes": "Lecture 1",
      "classSubject": { ... },
      "teacher": { ... },
      "createdAt": "...",
      "updatedAt": "..."
    }
  }
}
```

---

### GET /attendance/sessions
List attendance sessions.

**Access:** All roles (Subject Teachers only see their own sessions)

**Query params:**
| Param | Type | Description |
|---|---|---|
| `classSubjectId` | number | Filter by class-subject |
| `teacherId` | number | Filter by teacher (admin/advisor only) |
| `sessionDate` | string | Filter by date `YYYY-MM-DD` |

---

### GET /attendance/sessions/:sessionId
Get a single session by id.

**Access:** All roles (Subject Teachers limited to their own sessions)

---

### POST /attendance/sessions/:sessionId/submit
**The core attendance submission endpoint.**

Submit the list of present students. The backend automatically marks all other enrolled students as absent. All records are saved in a single database transaction.

**Access:** All roles (resource-level: must be the session's assigned teacher)

**Request body:**
```json
{
  "presentStudentIds": [1, 4]
}
```

> `presentStudentIds` is an array of internal student `id` values (not `studentId` strings). Pass an empty array `[]` to mark all students absent.

**Validation:**
- Session must not already have attendance submitted
- All submitted IDs must be enrolled in the session's class
- Students from other classes are rejected

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "sessionId": 1,
    "classSubjectId": 1,
    "class": { "id": 1, "name": "TYCS-A", "academicYear": "2025-26" },
    "subject": { "id": 1, "name": "Data Structures", "code": "CS301" },
    "sessionDate": "2026-10-03T00:00:00.000Z",
    "totalEnrolled": 2,
    "totalPresent": 1,
    "totalAbsent": 1,
    "presentStudentIds": [1],
    "absentStudentIds": [4]
  }
}
```

---

### GET /attendance/sessions/:sessionId/records
Get all present and absent records for a session.

**Access:** All roles (Subject Teachers limited to their own sessions)

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "session": { ... },
    "summary": {
      "totalRecords": 2,
      "totalPresent": 1,
      "totalAbsent": 1
    },
    "records": {
      "present": [
        {
          "id": 1,
          "sessionId": 1,
          "studentId": 1,
          "status": "PRESENT",
          "student": { "id": 1, "firstName": "Alice", "lastName": "Sharma", "studentId": "STU001" }
        }
      ],
      "absent": [ ... ]
    }
  }
}
```

---

### GET /attendance/summary
Get a student's attendance percentage for a specific class-subject.

**Access:** All roles

**Query params:**
| Param | Type | Required | Description |
|---|---|---|---|
| `studentId` | number | ✅ | Internal student id |
| `classSubjectId` | number | ✅ | Class-subject id |

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "student": { "id": 1, "firstName": "Alice", "lastName": "Sharma", "studentId": "STU001" },
      "classSubject": { "id": 1, "class": { ... }, "subject": { ... }, "academicYear": "2025-26" },
      "totalSessions": 4,
      "present": 2,
      "absent": 2,
      "percentage": 50.00
    }
  }
}
```

> `percentage` is `null` when no sessions have been conducted yet.

---

### PATCH /attendance/records/:recordId
Update a single attendance record — toggle a student between PRESENT and ABSENT after submission.

**Access:** All roles (resource-level: only the session's assigned teacher or Administrator)

**Request body:**
```json
{
  "status": "PRESENT"
}
```

> `status` must be exactly `"PRESENT"` or `"ABSENT"`.

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "record": {
      "id": 1,
      "sessionId": 1,
      "studentId": 1,
      "status": "PRESENT",
      "student": { "id": 1, "firstName": "Alice", "lastName": "Sharma", "studentId": "STU001" },
      "createdAt": "...",
      "updatedAt": "..."
    }
  }
}
```

---

## 11. Reports

All reports read from authoritative attendance records.

### GET /reports/student
One student's attendance across all enrolled class-subjects.

**Access:** All roles

**Query params:**
| Param | Type | Required | Description |
|---|---|---|---|
| `studentId` | number | ✅ | Internal student id |
| `academicYear` | string | ❌ | Filter e.g. `2025-26` |

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "report": {
      "student": { "id": 1, "firstName": "Alice", "lastName": "Sharma", "studentId": "STU001", "email": "..." },
      "subjects": [
        {
          "classSubjectId": 1,
          "class": { "id": 1, "name": "TYCS-A", "academicYear": "2025-26" },
          "subject": { "id": 1, "name": "Data Structures", "code": "CS301" },
          "academicYear": "2025-26",
          "rollNumber": "1",
          "totalSessions": 4,
          "present": 2,
          "absent": 2,
          "percentage": 50.00
        }
      ]
    }
  }
}
```

---

### GET /reports/subject
All students' attendance for a specific class-subject.

**Access:** All roles

**Query params:**
| Param | Type | Required | Description |
|---|---|---|---|
| `classSubjectId` | number | ✅ | Class-subject id |

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "report": {
      "classSubject": { "id": 1, "academicYear": "2025-26", "class": { ... }, "subject": { ... } },
      "totalSessions": 4,
      "totalStudents": 2,
      "students": [
        {
          "enrollmentId": 1,
          "rollNumber": "1",
          "student": { "id": 1, "firstName": "Alice", "lastName": "Sharma", "studentId": "STU001" },
          "totalSessions": 4,
          "present": 2,
          "absent": 2,
          "percentage": 50.00
        }
      ]
    }
  }
}
```

---

### GET /reports/class
All students' aggregated attendance across all subjects for a class.

**Access:** Administrator, Class Advisor

**Query params:**
| Param | Type | Required | Description |
|---|---|---|---|
| `classId` | number | ✅ | Class id |
| `academicYear` | string | ✅ | e.g. `2025-26` |

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "report": {
      "class": { "id": 1, "name": "TYCS-A", "academicYear": "2025-26", "division": "A" },
      "academicYear": "2025-26",
      "subjects": [
        { "id": 1, "subject": { "name": "Data Structures", "code": "CS301" }, "sessionCount": 4 }
      ],
      "totalSessions": 4,
      "totalStudents": 2,
      "students": [
        {
          "enrollmentId": 1,
          "rollNumber": "1",
          "student": { "id": 1, "firstName": "Alice", "lastName": "Sharma", "studentId": "STU001" },
          "totalSessions": 4,
          "present": 2,
          "absent": 2,
          "percentage": 50.00
        }
      ]
    }
  }
}
```

---

### GET /reports/low-attendance
Students below a given attendance threshold for a class-subject.

**Access:** All roles

**Query params:**
| Param | Type | Required | Description |
|---|---|---|---|
| `classSubjectId` | number | ✅ | Class-subject id |
| `threshold` | number | ❌ | Percentage 0–100, default `75` |

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "report": {
      "classSubject": { ... },
      "totalSessions": 4,
      "threshold": 75,
      "totalStudents": 2,
      "lowAttendanceCount": 2,
      "students": [
        {
          "enrollmentId": 1,
          "rollNumber": "1",
          "student": { "id": 1, "firstName": "Alice", "studentId": "STU001" },
          "totalSessions": 4,
          "present": 2,
          "absent": 2,
          "percentage": 50.00
        }
      ]
    }
  }
}
```

> Students with `percentage: null` (no sessions yet) are excluded from this list.

---

## 12. Dashboard

Single endpoint. Returns different data based on the authenticated user's role.

### GET /dashboard
**Access:** All roles

**Response shape varies by role:**

#### Administrator
```json
{
  "success": true,
  "data": {
    "dashboard": {
      "role": "Administrator",
      "stats": {
        "users":         { "total": 9, "active": 8 },
        "teachers":      { "total": 3 },
        "students":      { "total": 4, "active": 3 },
        "classes":       { "total": 2 },
        "subjects":      { "total": 3 },
        "classSubjects": { "total": 3 },
        "assignments":   { "total": 3 },
        "enrollments":   { "total": 3 },
        "sessions":      { "total": 4 },
        "attendanceRate": 50.00
      },
      "recentSessions": [
        {
          "id": 4,
          "sessionDate": "2026-10-06T00:00:00.000Z",
          "class":   { "name": "TYCS-A", "academicYear": "2025-26" },
          "subject": { "name": "Data Structures", "code": "CS301" },
          "teacher": { "firstName": "John", "lastName": "Doe", "employeeId": "EMP001" }
        }
      ]
    }
  }
}
```

#### Subject Teacher
```json
{
  "success": true,
  "data": {
    "dashboard": {
      "role": "Subject Teacher",
      "teacher": { "id": 1, "firstName": "John", "lastName": "Doe", "employeeId": "EMP001" },
      "stats": {
        "assignedSubjects": 2,
        "totalSessions": 4
      },
      "subjects": [
        {
          "assignmentId": 1,
          "classSubjectId": 1,
          "class":   { "id": 1, "name": "TYCS-A", "academicYear": "2025-26" },
          "subject": { "id": 1, "name": "Data Structures", "code": "CS301" },
          "enrolledStudents": 2,
          "sessionsConducted": 4,
          "attendanceRate": 50.00
        }
      ],
      "recentSessions": [ ... ]
    }
  }
}
```

#### Class Advisor
```json
{
  "success": true,
  "data": {
    "dashboard": {
      "role": "Class Advisor",
      "teacher": { "id": 3, "firstName": "Sarah", "lastName": "Advisor", "employeeId": "EMP003" },
      "stats": {
        "assignedClassSubjects": 1,
        "totalLowAttendanceStudents": 2
      },
      "classes": [
        {
          "class": { "id": 1, "name": "TYCS-A", "academicYear": "2025-26", "division": "A" },
          "enrolledStudents": 2,
          "sessionsConducted": 4
        }
      ],
      "recentSessions": [ ... ]
    }
  }
}
```

---

## 13. Response Format

All responses follow this envelope:

**Success:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Error:**
```json
{
  "success": false,
  "error": {
    "code": "STABLE_ERROR_CODE",
    "message": "Human-readable message",
    "details": { }
  }
}
```

> `details` is only present for `422 VALIDATION_ERROR` responses and contains field-level errors.

---

## 14. Error Codes

| HTTP | Code | Meaning |
|---|---|---|
| 400 | `INVALID_ID` | Path param id is not a valid integer |
| 400 | `INVALID_PARAM` | Query param is missing or invalid |
| 400 | `SELF_DEACTIVATE` | Cannot deactivate your own account |
| 400 | `USER_INACTIVE` | User account is inactive |
| 400 | `STUDENT_INACTIVE` | Student is inactive |
| 400 | `CLASS_INACTIVE` | Class is inactive |
| 400 | `CLASS_SUBJECT_INACTIVE` | Class-subject is inactive |
| 400 | `NO_ENROLLMENTS` | No active enrollments in session's class |
| 400 | `INVALID_USER_ROLE` | User's role cannot have a teacher profile |
| 400 | `INVALID_TEACHER_ROLE` | Teacher's role cannot be assigned |
| 400 | `NO_ACTIVE_ASSIGNMENT` | No active teacher assignment for class-subject |
| 400 | `STUDENTS_NOT_ENROLLED` | Submitted student(s) not enrolled in this class |
| 401 | `TOKEN_MISSING` | Authorization header missing or malformed |
| 401 | `TOKEN_INVALID` | Token is invalid or tampered |
| 401 | `TOKEN_EXPIRED` | Token has expired |
| 401 | `INVALID_CREDENTIALS` | Wrong username/email or password |
| 403 | `FORBIDDEN` | Role not permitted for this endpoint |
| 403 | `ACCOUNT_INACTIVE` | Account exists but is inactive |
| 403 | `NOT_ASSIGNED` | Teacher not assigned to this class-subject |
| 403 | `NOT_SESSION_TEACHER` | Not the teacher for this session |
| 403 | `TEACHER_PROFILE_NOT_FOUND` | No teacher profile for this user |
| 404 | `USER_NOT_FOUND` | User does not exist |
| 404 | `TEACHER_NOT_FOUND` | Teacher does not exist |
| 404 | `STUDENT_NOT_FOUND` | Student does not exist |
| 404 | `CLASS_NOT_FOUND` | Class does not exist |
| 404 | `SUBJECT_NOT_FOUND` | Subject does not exist |
| 404 | `CLASS_SUBJECT_NOT_FOUND` | Class-subject does not exist |
| 404 | `ASSIGNMENT_NOT_FOUND` | Assignment does not exist |
| 404 | `ENROLLMENT_NOT_FOUND` | Enrollment does not exist |
| 404 | `SESSION_NOT_FOUND` | Attendance session does not exist |
| 404 | `RECORD_NOT_FOUND` | Attendance record does not exist |
| 404 | `ROLE_NOT_FOUND` | Role id does not exist |
| 409 | `DUPLICATE_USER` | Username or email already taken |
| 409 | `DUPLICATE_EMPLOYEE_ID` | Employee ID already in use |
| 409 | `DUPLICATE_STUDENT_ID` | Student ID already in use |
| 409 | `DUPLICATE_EMAIL` | Email already in use |
| 409 | `DUPLICATE_CLASS` | Class name + year already exists |
| 409 | `DUPLICATE_SUBJECT_CODE` | Subject code already in use |
| 409 | `DUPLICATE_CLASS_SUBJECT` | Subject already linked to class for this year |
| 409 | `DUPLICATE_ASSIGNMENT` | Teacher already assigned to this class-subject |
| 409 | `DUPLICATE_ENROLLMENT` | Student already enrolled in this class for this year |
| 409 | `DUPLICATE_ROLL_NUMBER` | Roll number taken in this class for this year |
| 409 | `TEACHER_PROFILE_EXISTS` | User already has a teacher profile |
| 409 | `ALREADY_INACTIVE` | Record is already inactive |
| 409 | `ATTENDANCE_ALREADY_SUBMITTED` | Attendance already submitted for this session |
| 422 | `IMPORT_TOO_LARGE` | Import rows exceed maximum of 500 |
| 422 | `VALIDATION_ERROR` | Request body failed Zod validation |
| 500 | `INTERNAL_ERROR` | Unexpected server error |

---

## 15. Role Summary

| Endpoint Group | Administrator | Class Advisor | Subject Teacher |
|---|---|---|---|
| Auth (login, me) | ✅ | ✅ | ✅ |
| Users (CRUD) | ✅ | ❌ | ❌ |
| Teachers (list, get) | ✅ | ✅ | ❌ |
| Teachers (create, update) | ✅ | ❌ | ❌ |
| Teachers (me) | ❌ | ✅ | ✅ |
| Students (list, create, update) | ✅ | ✅ | ❌ |
| Students (get by id) | ✅ | ✅ | ✅ |
| Students (delete) | ✅ | ❌ | ❌ |
| Classes (read) | ✅ | ✅ | ✅ |
| Classes (create, update) | ✅ | ❌ | ❌ |
| Subjects (read) | ✅ | ✅ | ✅ |
| Subjects (create) | ✅ | ✅ | ❌ |
| Subjects (update) | ✅ | ❌ | ❌ |
| Class-Subjects (read) | ✅ | ✅ | ✅ |
| Class-Subjects (create, toggle) | ✅ | ❌ | ❌ |
| Assignments (read) | ✅ | ✅ | ✅ |
| Assignments (create) | ✅ | ✅ | ❌ |
| Assignments (toggle) | ✅ | ❌ | ❌ |
| Students (import CSV) | ✅ | ✅ | ❌ |
| Enrollments (list, create, update) | ✅ | ✅ | ❌ |
| Enrollments (get by id) | ✅ | ✅ | ✅ |
| Attendance sessions (all) | ✅ | ✅ | ✅ (own only) |
| Attendance submit | ✅ | ✅ | ✅ (own session) |
| Attendance record edit | ✅ | ✅ | ✅ (own session) |
| Reports (student, subject, low-attendance) | ✅ | ✅ | ✅ |
| Reports (class-wise) | ✅ | ✅ | ❌ |
| Dashboard | ✅ | ✅ | ✅ |
