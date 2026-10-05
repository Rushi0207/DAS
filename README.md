# DAS — Digital Attendance System

A web-based college attendance management system that replaces manual attendance recording with a centralised digital workflow.

---

## Project Structure

```
DAS/
├── backend/          Node.js + Express REST API
├── frontend/         React + Vite SPA
└── API_DOCUMENTATION.md
```

---

## Tech Stack

### Backend
| | |
|---|---|
| Runtime | Node.js |
| Framework | Express.js |
| Language | JavaScript (CommonJS) |
| ORM | Prisma |
| Database | PostgreSQL (hosted on Supabase) |
| Auth | JWT + bcrypt |
| Validation | Zod |
| Testing | Vitest |

### Frontend
| | |
|---|---|
| Framework | React 19 |
| Bundler | Vite |
| Language | TypeScript |
| Routing | React Router DOM |
| State | Zustand |
| Styling | Tailwind CSS |
| Icons | Lucide React |
| Package manager | pnpm |

---

## Roles

| Role | Responsibilities |
|---|---|
| **Administrator** | Manages users, teachers, classes, subjects, assignments, enrollments. Full system control. |
| **Class Advisor** | Manages their assigned class — students, subjects, teacher assignments, attendance, reports. |
| **Subject Teacher** | Takes attendance for assigned subjects. Views their own sessions and reports. |

---

## Features

- JWT authentication with bcrypt password hashing
- Role-based access control (route-level + resource-level)
- Student management with CSV/Excel bulk import
- Class advisor assignment to classes
- Subject creation and class-subject linking
- Teacher assignment to class-subjects (with self-assign for advisors)
- Student enrollment with roll numbers
- Attendance sessions — create, submit present list, auto-mark absent
- Roll number quick entry for fast attendance marking
- Edit past attendance records (toggle PRESENT/ABSENT)
- Reports: student-wise, subject-wise, class-wise, low-attendance
- Role-aware dashboard with real-time stats

---

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 8+ (frontend)
- A Supabase project with PostgreSQL

---

### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy environment file and fill in your values
cp .env.example .env
```

**`.env` variables:**
```env
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...

PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173

JWT_SECRET=your-long-random-secret
JWT_EXPIRES_IN=1d
BCRYPT_ROUNDS=12

SEED_ADMIN_USERNAME=admin
SEED_ADMIN_EMAIL=admin@example.com
SEED_ADMIN_PASSWORD=your-admin-password
```

```bash
# Apply database migration
node node_modules/prisma/build/index.js migrate deploy

# Generate Prisma client
node node_modules/prisma/build/index.js generate

# Seed roles and admin user
node prisma/seed.js

# Start dev server (with nodemon)
npm run dev

# Start production server
npm start
```

The backend runs on `http://localhost:5000`.  
Health check: `GET http://localhost:5000/api/v1/health`

---

### Frontend Setup

```bash
cd frontend

# Install dependencies
pnpm install

# Create environment file
echo "VITE_API_BASE_URL=http://localhost:5000/api/v1" > .env

# Start dev server
pnpm dev

# Build for production
pnpm build
```

The frontend runs on `http://localhost:5173`.

---

## Database

All migrations live in `backend/prisma/migrations/`.

| Migration | Description |
|---|---|
| `20261002170051_init_schema` | Initial schema — all 12 tables |
| `20261004091636_add_advisor_to_classes` | `advisor_id` FK on classes table |

**Core entities:**

```
roles → users → teachers
                     ↓
classes ──────── teacher_assignments ── class_subjects ── subjects
   │                                         │
enrollments ── students          attendance_sessions
                                       │
                               attendance_records
```

---

## API

Full documentation: [`API_DOCUMENTATION.md`](./API_DOCUMENTATION.md)

Base URL: `http://localhost:5000/api/v1`

**Quick reference:**

| Group | Endpoints |
|---|---|
| Auth | `POST /auth/login` · `GET /auth/me` |
| Users | `GET/POST/PATCH/DELETE /users` |
| Teachers | `GET/POST/PATCH /teachers` · `GET /teachers/me` |
| Students | `GET/POST/PATCH/DELETE /students` · `POST /students/import` |
| Classes | `GET/POST/PATCH /classes` · nested subjects & enrollments |
| Subjects | `GET/POST/PATCH /subjects` |
| Class-Subjects | `GET/PATCH /class-subjects` · `POST /class-subjects/:id/assignments` |
| Assignments | `GET/PATCH /assignments` |
| Enrollments | `GET/PATCH /enrollments` |
| Attendance | `POST /attendance/sessions` · submit · records · `PATCH /attendance/records/:id` |
| Reports | `/reports/student` · `/reports/subject` · `/reports/class` · `/reports/low-attendance` |
| Dashboard | `GET /dashboard` |

---

## Scripts

### Backend

| Script | Command |
|---|---|
| Dev server (nodemon) | `npm run dev` |
| Production start | `npm start` |
| Run migration | `npm run db:migrate` |
| Apply migration (prod) | `npm run db:migrate:deploy` |
| Generate Prisma client | `npm run db:generate` |
| Seed database | `npm run db:seed` |
| Prisma Studio | `npm run db:studio` |
| Run tests | `npm test` |

### Frontend

| Script | Command |
|---|---|
| Dev server | `pnpm dev` |
| Production build | `pnpm build` |
| Preview build | `pnpm preview` |

---

## SOP — How the System Works

1. **Admin** creates user accounts and assigns roles
2. **Admin** creates teacher profiles linked to user accounts
3. **Admin** creates classes and assigns a Class Advisor to each class
4. **Admin** creates subjects and links them to classes
5. **Admin or Advisor** assigns Subject Teachers to class-subjects
6. **Advisor** enrolls students into their class (manually or via CSV import)
7. **Teacher** selects their assigned class-subject, creates an attendance session
8. **Teacher** enters roll numbers of present students (or toggles individually)
9. System marks all remaining enrolled students as absent automatically
10. **Advisor/Teacher** views reports — student-wise, subject-wise, low-attendance
11. **Admin** monitors system-wide dashboard and manages all records

---

## Security Notes

- Never commit `.env` — it is in `.gitignore`
- `DATABASE_URL` and `DIRECT_URL` are backend-only — never put them in the frontend
- JWT secret must be a long random string in production
- All business rules are enforced server-side — frontend role checks are UX only

---

## License

Private project. Not for redistribution.
