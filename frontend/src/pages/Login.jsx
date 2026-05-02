import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const presetRole = params.get("role"); // optional
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const u = await login(email, password);

      // role based redirect
      if (u.role === "student") navigate("/student/dashboard");
      else navigate("/teacher/dashboard");
    } catch (err) {
      setError(err?.response?.data?.error || "Login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md rounded-2xl bg-white shadow p-6">
        <h1 className="text-2xl font-bold text-center">Login</h1>
        {presetRole && (
          <p className="text-center text-sm text-slate-500 mt-1">
            Logging in as: <span className="font-semibold">{presetRole}</span>
          </p>
        )}

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700">Email</label>
            <input
              className="mt-1 w-full rounded-xl border p-3 outline-none focus:ring-2 focus:ring-emerald-400"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@gmail.com"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              type="password"
              className="mt-1 w-full rounded-xl border p-3 outline-none focus:ring-2 focus:ring-emerald-400"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="******"
            />
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 text-red-700 p-3 text-sm">
              {error}
            </div>
          )}

          <button
            disabled={busy}
            className="w-full rounded-xl bg-emerald-600 text-white py-3 font-semibold hover:bg-emerald-700 disabled:opacity-60"
          >
            {busy ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-500">
          Don’t have an account?{" "}
          <Link className="text-emerald-700 font-semibold" to="/register">
            Register
          </Link>
        </div>
      </div>
    </div>
  );
}