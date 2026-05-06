import { Routes, Route, Navigate } from 'react-router-dom';

import AdminLayout from './layouts/AdminLayout';
import StaffLayout from './layouts/StaffLayout';
import HomePage from './pages/HomePage';
import AdminLogin from './pages/AdminLogin';
import Dashboard from './pages/Dashboard';
import RegistrationManagement from './pages/RegistrationManagement';
import CourseManagement from './pages/CourseManagement';
import TeacherManagement from './pages/TeacherManagement';
import FeedbackManagement from './pages/FeedbackManagement';
import Statistics from './pages/Statistics';
import AdminHistory from './pages/AdminHistory';
import AnnouncementManagement from './pages/AnnouncementManagement';
import TimetableEditor from './pages/TimetableEditor';
import StudentManagement from './pages/StudentManagement';
import CourseStudentList from './pages/CourseStudentList';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import NotFound from './pages/NotFound/NotFound';
import ProtectedRoute from './components/ProtectedRoute';
import FlameButton from './components/FlameButton';
import AccountManagement from './pages/AccountManagement';
import ChatConfigPage from './pages/Admin/ChatConfigPage'; // ← THÊM

// Staff pages
import TeacherDashboard from './pages/Teacher/TeacherDashboard';
import MarketingDashboard from './pages/Marketing/MarketingDashboard';
import MktAnnouncementPage from './pages/Marketing/MktAnnouncementPage';

// Attendance
import StaffAttendance from './pages/Attendance/StaffAttendance';
import AttendanceManagement from './pages/Admin/AttendanceManagement';
import SalaryConfig from './pages/Admin/SalaryConfig';
import SalaryReport from './pages/Admin/SalaryReport';

import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  return (
    <>
      <FlameButton />
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
      <Routes>
        {/* Public */}
        <Route path="/" element={<HomePage />} />

        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />

        {/* ─── Admin routes ─────────────────────────────────────────────────── */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="registrations" element={<RegistrationManagement />} />
          <Route path="courses" element={<CourseManagement />} />
          <Route path="teachers" element={<TeacherManagement />} />
          <Route path="feedback" element={<FeedbackManagement />} />
          <Route path="statistics" element={<Statistics />} />
          <Route path="students" element={<StudentManagement />} />
          <Route path="students/course/:courseId" element={<CourseStudentList />} />
          <Route path="announcements" element={<AnnouncementManagement />} />
          <Route path="timetable" element={<TimetableEditor />} />
          <Route path="accounts" element={<AccountManagement />} />
          <Route path="history" element={<AdminHistory />} />
          <Route path="attendance" element={<AttendanceManagement />} />
          <Route path="salary-config" element={<SalaryConfig />} />
          <Route path="salary-report" element={<SalaryReport />} />
          <Route path="chat-config" element={<ChatConfigPage />} />
        </Route>

        {/* ─── Teacher routes ───────────────────────────────────────────────── */}
        <Route
          path="/teacher"
          element={
            <ProtectedRoute allowedRoles={['teacher']}>
              <StaffLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<TeacherDashboard />} />
          <Route path="attendance" element={<Navigate to="/attendance" replace />} />
          <Route path="students/course/:courseId" element={<CourseStudentList />} />
        </Route>

        {/* ─── Marketing routes ─────────────────────────────────────────────── */}
        <Route
          path="/marketing"
          element={
            <ProtectedRoute allowedRoles={['marketing']}>
              <StaffLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<MarketingDashboard />} />
          <Route path="attendance" element={<Navigate to="/attendance" replace />} />
          <Route path="announcements" element={<MktAnnouncementPage />} />
        </Route>

        {/* ─── Shared staff attendance ──────────────────────────────────────── */}
        <Route
          path="/attendance"
          element={
            <ProtectedRoute allowedRoles={['teacher', 'marketing']}>
              <StaffLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<StaffAttendance />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

export default App;