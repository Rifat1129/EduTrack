import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState("student");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // Specific fields
  const [universityId, setUniversityId] = useState("");
  const [designation, setDesignation] = useState("Lecturer");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);

    try {
      const payload = {
        full_name: fullName,
        email,
        password,
        role,
      };
      
      if (role === "student") payload.university_id = universityId;
      if (role === "teacher") payload.designation = designation; // ✅ Send Designation

      await register(payload);
      navigate("/login?role=" + role);
    } catch (err) {
      setError(err?.response?.data?.error || "Registration failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md rounded-2xl bg-white shadow p-6">
        <h1 className="text-2xl font-bold text-center">Register</h1>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700">Role</label>
            <select
              className="mt-1 w-full rounded-xl border p-3"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Full Name</label>
            <input
              className="mt-1 w-full rounded-xl border p-3"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your full name"
              required
            />
          </div>

          {/* Student Specific Field */}
          {role === "student" && (
            <div>
              <label className="text-sm font-medium text-slate-700">University ID</label>
              <input
                className="mt-1 w-full rounded-xl border p-3"
                value={universityId}
                onChange={(e) => setUniversityId(e.target.value)}
                placeholder="2023xxxxx"
                required
              />
            </div>
          )}

          {/* ✅ Teacher Specific Field */}
          {role === "teacher" && (
            <div>
              <label className="text-sm font-medium text-slate-700">Designation</label>
              <select
                className="mt-1 w-full rounded-xl border p-3"
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
              >
                <option value="Lecturer">Lecturer</option>
                <option value="Senior Lecturer">Senior Lecturer</option>
                <option value="Assistant Professor">Assistant Professor</option>
                <option value="Associate Professor">Associate Professor</option>
                <option value="Professor">Professor</option>
              </select>
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-slate-700">Email</label>
            <input
              className="mt-1 w-full rounded-xl border p-3"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@gmail.com"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Password</label>
            <input
              type="password"
              className="mt-1 w-full rounded-xl border p-3"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="min 6 chars"
              required
            />
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 text-red-700 p-3 text-sm">
              {error}
            </div>
          )}

          <button
            disabled={busy}
            type="submit"
            className="w-full rounded-xl bg-emerald-600 text-white py-3 font-semibold hover:bg-emerald-700 disabled:opacity-60"
          >
            {busy ? "Creating..." : "Create Account"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link className="text-emerald-700 font-semibold" to="/login">
            Login
          </Link>
        </div>
      </div>
    </div>
  );
}