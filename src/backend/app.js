// Express Application Configuration
// Node.js handles backend APIs and business logic

import express from 'express';
import cors from 'cors';
import { authenticate } from './middleware/auth.js';
import coursesRouter from './modules/courses/courses.controller.js';

const app = express();

// Middlewares
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(authenticate);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Luma English Platform Backend API',
  });
});

// Module 1: Courses & Lessons routes
app.use('/api', coursesRouter);

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
    ...(process.env.NODE_ENV !== 'production' ? { stack: err.stack } : {}),
  });
});

export default app;
