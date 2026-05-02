import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function TeacherLayout() {
  const { logout } = useAuth();

  const linkClass = ({ isActive }) =>
    `px-3 py-2 rounded-xl text-sm font-semibold ${
      isActive
        ? "bg-emerald-600 text-white"
        : "text-slate-700 hover:bg-slate-100"
    }`;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b">
        <div className="max-w-5xl mx-auto p-4 flex items-center justify-between">
          <div className="font-bold">EduTrack (Teacher)</div>

          <div className="flex items-center gap-2">
            <NavLink to="/teacher/dashboard" className={linkClass}>
              Dashboard
            </NavLink>

            <NavLink to="/teacher/sessions" className={linkClass}>
              Sessions
            </NavLink>
            <NavLink to="/teacher/courses" className={linkClass}>
              Courses
            </NavLink>
            <NavLink to="/teacher/tasks" className={linkClass}>
              Tasks
            </NavLink>

            <NavLink to="/teacher/analytics" className={linkClass}>
              Analytics
            </NavLink>
            <NavLink to="/teacher/grading" className={linkClass}>
              Grading
            </NavLink>

            <button
              onClick={logout}
              className="px-3 py-2 rounded-xl text-sm font-semibold bg-slate-900 text-white"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <Outlet />
    </div>
  );
}
