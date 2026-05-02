import { NavLink, Outlet } from "react-router-dom";

export default function StudentLayout() {
  const linkClass = ({ isActive }) =>
    `flex-1 text-center py-3 text-sm font-semibold ${
      isActive ? "text-emerald-700" : "text-slate-500"
    }`;

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      <Outlet />

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t flex">
        <NavLink className={linkClass} to="/student/dashboard">
          Home
        </NavLink>
        <NavLink className={linkClass} to="/student/scan">
          Scan
        </NavLink>
        <NavLink className={linkClass} to="/student/leaderboard">
          Leaderboard
        </NavLink>
        <NavLink className={linkClass} to="/student/history">
          History
        </NavLink>
      </div>
    </div>
  );
}