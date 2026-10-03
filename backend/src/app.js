const express = require('express');
const cors = require('cors');
const env = require('./config/env');
const errorHandler = require('./middleware/errorHandler');
const AppError = require('./utils/AppError');

const healthRouter        = require('./routes/health');
const authRouter          = require('./routes/auth');
const usersRouter         = require('./routes/users');
const teachersRouter      = require('./routes/teachers');
const studentsRouter      = require('./routes/students');
const classesRouter       = require('./routes/classes');
const subjectsRouter      = require('./routes/subjects');
const classSubjectsRouter = require('./routes/classSubjects');
const assignmentsRouter   = require('./routes/assignments');
const enrollmentsRouter   = require('./routes/enrollments');
const attendanceRouter    = require('./routes/attendance');
const reportsRouter       = require('./routes/reports');
const dashboardRouter     = require('./routes/dashboard');

const app = express();

app.use(cors({
  origin: env.corsOrigin,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const API_PREFIX = '/api/v1';

app.use(`${API_PREFIX}/health`,         healthRouter);
app.use(`${API_PREFIX}/auth`,           authRouter);
app.use(`${API_PREFIX}/users`,          usersRouter);
app.use(`${API_PREFIX}/teachers`,       teachersRouter);
app.use(`${API_PREFIX}/students`,       studentsRouter);
app.use(`${API_PREFIX}/classes`,        classesRouter);
app.use(`${API_PREFIX}/subjects`,       subjectsRouter);
app.use(`${API_PREFIX}/class-subjects`, classSubjectsRouter);
app.use(`${API_PREFIX}/assignments`,    assignmentsRouter);
app.use(`${API_PREFIX}/enrollments`,    enrollmentsRouter);
app.use(`${API_PREFIX}/attendance`,     attendanceRouter);
app.use(`${API_PREFIX}/reports`,        reportsRouter);
app.use(`${API_PREFIX}/dashboard`,      dashboardRouter);

app.use((req, res, next) => {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404, 'ROUTE_NOT_FOUND'));
});

app.use(errorHandler);

module.exports = app;
