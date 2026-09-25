import { Component } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Guard, HomeRedirect, Layout } from './Layout';
import { StoreProvider } from './store';
import { Button, Empty } from './components';
import { Auth, Goals, Notifications, PlacementIntro, Profile } from './pages/Account';
import {
  Catalog,
  CourseDetail,
  Dashboard,
  LearningPath,
  MyCourses,
  StudentProgress,
} from './pages/Student';
import { Assignment, Lesson, Quiz, QuizResult } from './pages/Learning';
import {
  AssessmentEditor,
  CourseEditor,
  Grading,
  InstructorCourses,
  InstructorStudents,
  LessonEditor,
  Submissions,
} from './pages/Instructor';
import { AdminCourses, AdminDashboard, AdminReports, AdminUsers, AuditLog } from './pages/Admin';

class ErrorBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <main className="error-page">
        <h1>Trang chưa thể hiển thị</h1>
        <p>Thử tải lại trang để tiếp tục. Dữ liệu đã lưu vẫn được giữ.</p>
        <button className="button button-primary" onClick={() => window.location.reload()}>
          Tải lại trang
        </button>
      </main>
    ) : (
      this.props.children
    );
  }
}

// EXTEND(ROUTES): Thêm page vào đúng Guard(role)/Layout; cập nhật navigation + mobileItems
// trong Layout.jsx và roleHome nếu thêm vai trò mới. Checklist: docs/HANDOFF.md.
export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <StoreProvider>
          <Routes>
            <Route path="/" element={<HomeRedirect />} />
            <Route path="/login" element={<Auth key="login" />} />
            <Route path="/register" element={<Auth register key="register" />} />
            <Route element={<Guard />}>
              <Route element={<Layout />}>
                <Route path="/profile" element={<Profile />} />
                <Route path="/notifications" element={<Notifications />} />
              </Route>
            </Route>
            <Route element={<Guard role="student" />}>
              <Route element={<Layout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/path" element={<LearningPath />} />
                <Route path="/courses" element={<Catalog />} />
                <Route path="/courses/:courseId" element={<CourseDetail />} />
                <Route path="/my-courses" element={<MyCourses />} />
                <Route path="/progress" element={<StudentProgress />} />
                <Route path="/learn/:courseId/:lessonId" element={<Lesson />} />
                <Route path="/assignments/:courseId" element={<Assignment />} />
                <Route path="/quiz/:courseId/:lessonId/result" element={<QuizResult />} />
              </Route>
              <Route element={<Layout focus />}>
                <Route path="/onboarding/goal" element={<Goals />} />
                <Route path="/placement" element={<PlacementIntro />} />
                <Route path="/placement/test" element={<Quiz placement />} />
                <Route path="/placement/result" element={<QuizResult placement />} />
                <Route path="/quiz/:courseId/:lessonId" element={<Quiz />} />
              </Route>
            </Route>
            <Route element={<Guard role="instructor" />}>
              <Route element={<Layout />}>
                <Route path="/instructor/courses" element={<InstructorCourses />} />
                <Route path="/instructor/courses/:courseId/edit" element={<CourseEditor />} />
                <Route path="/instructor/courses/:courseId/lessons" element={<LessonEditor />} />
                <Route
                  path="/instructor/courses/:courseId/assessments"
                  element={<AssessmentEditor />}
                />
                <Route path="/instructor/submissions" element={<Submissions />} />
                <Route path="/instructor/submissions/:submissionId" element={<Grading />} />
                <Route path="/instructor/students" element={<InstructorStudents />} />
              </Route>
            </Route>
            <Route element={<Guard role="admin" />}>
              <Route element={<Layout />}>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/users" element={<AdminUsers />} />
                <Route path="/admin/courses" element={<AdminCourses />} />
                <Route path="/admin/reports" element={<AdminReports />} />
                <Route path="/admin/logs" element={<AuditLog />} />
              </Route>
            </Route>
            <Route
              path="*"
              element={
                <main className="error-page">
                  <Empty
                    title="Không tìm thấy trang"
                    description="Đường dẫn này không tồn tại. Hãy quay về trang chính."
                    action={<Button to="/">Về trang chính</Button>}
                  />
                </main>
              }
            />
          </Routes>
        </StoreProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
