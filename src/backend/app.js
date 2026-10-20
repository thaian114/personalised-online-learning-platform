// Express Application Configuration
// Node.js handles backend APIs and business logic

import express from 'express';
import cors from 'cors';
import { authenticate } from './middleware/auth.js';
import coursesRouter from './modules/courses/courses.controller.js';
import enrollmentRouter from './modules/enrollment/enrollment.controller.js';
import assessmentsRouter from './modules/assessments/assessments.controller.js';

const app = express();

// Middlewares
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(authenticate);

// Health check endpoint (both /api/health and /health)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Luma English Platform Backend API',
  });
});
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Luma English Platform Backend API',
  });
});

// Module 1: Courses & Lessons routes (support both /api and root prefix)
app.use('/api', coursesRouter);
app.use('/', coursesRouter);

// Module 2: Enrollment & Progress routes (support both /api and root prefix)
app.use('/api', enrollmentRouter);
app.use('/', enrollmentRouter);

// Module 3: Assessments & Quizzes routes (support both /api and root prefix)
app.use('/api', assessmentsRouter);
app.use('/', assessmentsRouter);

// Global 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API route ${req.method} ${req.originalUrl} không tồn tại`,
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || 'Lỗi hệ thống';

  // Log in development
  if (process.env.NODE_ENV !== 'production') {
    console.error(`[Error] ${req.method} ${req.url} - ${status}:`, err.stack || err.message);
  }

  res.status(status).json({
    success: false,
    message,
    ...(err.details ? { details: err.details } : {}),
    ...(process.env.NODE_ENV !== 'production' ? { stack: err.stack } : {}),
  });
});

export default app;
