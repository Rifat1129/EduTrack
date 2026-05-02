import { Link } from "react-router-dom";

export default function RoleSelect() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md rounded-2xl bg-white shadow p-6">
        <h1 className="text-2xl font-bold text-center">EduTrack</h1>
        <p className="text-center text-slate-500 mt-2">
          Select your role to continue
        </p>

        <div className="mt-6 space-y-3">
          <Link
            to="/login?role=student"
            className="block w-full rounded-xl bg-emerald-600 text-white text-center py-3 font-semibold hover:bg-emerald-700"
          >
            I’m a Student
          </Link>

          <Link
            to="/login?role=teacher"
            className="block w-full rounded-xl bg-slate-900 text-white text-center py-3 font-semibold hover:bg-slate-800"
          >
            I’m a Teacher
          </Link>
        </div>

        <div className="mt-6 text-center text-sm text-slate-500">
          New here?{" "}
          <Link className="text-emerald-700 font-semibold" to="/register">
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
}