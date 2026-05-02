import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

import RoleSelect from "./pages/RoleSelect";
import Login from "./pages/Login";
import Register from "./pages/Register";

// Student
import StudentLayout from "./layouts/StudentLayout";
import StudentDashboard from "./pages/student/StudentDashboard";
import StudentScan from "./pages/student/StudentScan";
import StudentLeaderboard from "./pages/student/StudentLeaderboard";
import StudentHistory from "./pages/student/StudentHistory";
import StudentMarks from "./pages/student/StudentMarks";
import StudentCourses from "./pages/student/StudentCourses";
import StudentTasks from "./pages/student/StudentTasks";

// Teacher
import TeacherLayout from "./layouts/TeacherLayout";
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import TeacherCourses from "./pages/teacher/TeacherCourses"; // ✅ Import যোগ করা হয়েছে
import TeacherSessions from "./pages/teacher/TeacherSessions";
import TeacherQRCodes from "./pages/teacher/TeacherQRCodes";
import TeacherAnalytics from "./pages/teacher/TeacherAnalytics";
import TeacherGrading from "./pages/teacher/TeacherGrading";
import TeacherTasks from "./pages/teacher/TeacherTasks";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/" element={<RoleSelect />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Student (nested under /student) */}
          <Route
            path="/student"
            element={
              <ProtectedRoute role="student">
                <StudentLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<StudentDashboard />} />
            <Route path="scan" element={<StudentScan />} />
            <Route path="leaderboard" element={<StudentLeaderboard />} />
            <Route path="history" element={<StudentHistory />} />
            <Route path="marks" element={<StudentMarks />} />
            <Route path="courses" element={<StudentCourses />} />
            <Route path="tasks" element={<StudentTasks />} />
          </Route>

          {/* Teacher (nested under /teacher) */}
          <Route
            path="/teacher"
            element={
              <ProtectedRoute role="teacher">
                <TeacherLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<TeacherDashboard />} />
            <Route path="courses" element={<TeacherCourses />} /> {/* ✅ Route যোগ করা হয়েছে */}
            <Route path="sessions" element={<TeacherSessions />} />
            <Route path="sessions/:id/qrcodes" element={<TeacherQRCodes />} />
            <Route path="analytics" element={<TeacherAnalytics />} />
            <Route path="grading" element={<TeacherGrading />} />
            <Route path="tasks" element={<TeacherTasks />} />
          </Route>

          {/* Fallback সর্বশেষে */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}