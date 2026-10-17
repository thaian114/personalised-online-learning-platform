// Server Entry Point
// Node.js handles backend APIs and business logic

import app from './app.js';

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`🚀 Luma Backend API Server running on port ${PORT}`);
  console.log(`👉 Health check: http://localhost:${PORT}/api/health`);
  console.log(`👉 Courses API:  http://localhost:${PORT}/api/courses`);
  console.log(`===============================================`);
});
