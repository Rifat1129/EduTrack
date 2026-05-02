import client from "../../api/client";
import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function StudentDashboard() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await client.get("/student/dashboard");
        setData(res.data);
      } catch (e) {
        setErr(e?.response?.data?.error || "Failed to load dashboard");
      }
    }
    load();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 p-6 pb-24">
      <div className="max-w-md mx-auto">
        
        {/* ✅ Header (Figma Style) */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-emerald-600 font-semibold mb-1">Welcome back,</p>
            <h1 className="text-3xl font-bold text-slate-900">{user?.full_name}</h1>
            <p className="text-sm text-slate-600 font-mono mt-1 tracking-wide">
              ID: {user?.university_id || "Loading..."}
            </p>
          </div>

          <button
            onClick={logout}
            className="rounded-xl bg-slate-900 text-white px-5 py-2.5 text-sm font-semibold shadow hover:bg-slate-800"
          >
            Logout
          </button>
        </div>

        {/* ✅ Stats Cards */}
        <div className="mt-6 rounded-2xl bg-white shadow-sm border p-5">
          {!data ? (
            <div className="text-slate-600">{err || "Loading..."}</div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <Card label="Total Points" value={data.total_points} />
              <Card label="Classes Attended" value={data.classes_attended} />
              <Card label="Late Count" value={data.late_count} />
              <Card
                label="Consistency"
                value={`${Number(data.consistency_rate || 0).toFixed(1)}%`}
              />
            </div>
          )}
        </div>

        {/* ✅ Navigation Buttons */}
        <button
          onClick={() => navigate("/student/scan")}
          className="mt-6 w-full rounded-2xl bg-emerald-600 text-white py-4 font-semibold shadow hover:bg-emerald-700 flex flex-col items-center justify-center gap-1"
        >
          <span className="text-lg">Scan QR Code</span>
          <span className="text-xs font-normal opacity-90">
            Mark attendance / task / exit
          </span>
        </button>
        
        <button
          onClick={() => navigate("/student/courses")}
          className="mt-3 w-full rounded-2xl bg-white border shadow-sm py-3 font-semibold text-slate-800 hover:bg-slate-50"
        >
          My Courses & Join
        </button>
        
        <button
          onClick={() => navigate("/student/marks")}
          className="mt-3 w-full rounded-2xl bg-white border shadow-sm py-3 font-semibold text-slate-800 hover:bg-slate-50"
        >
          My Marks & Grades
        </button>
        
        <button
          onClick={() => navigate("/student/tasks")}
          className="mt-3 w-full rounded-2xl bg-slate-900 text-white py-3 font-semibold shadow hover:bg-slate-800"
        >
          My Tasks & Assignments
        </button>

        {/* ✅ Recent Scans */}
        <div className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-lg text-slate-800">Recent Scans</h2>
            <button
              onClick={() => navigate("/student/history")}
              className="text-sm font-semibold text-emerald-700 hover:underline"
            >
              View all
            </button>
          </div>

          <div className="mt-4 rounded-2xl bg-white shadow-sm border p-4">
            {!data ? (
              <div className="text-slate-600">Loading...</div>
            ) : (data.recent_scans || []).length === 0 ? (
              <div className="text-slate-600 text-center py-4">No scans yet.</div>
            ) : (
              <div className="space-y-3">
                {data.recent_scans.map((r) => (
                  <div key={r.id} className="border rounded-xl p-3 hover:bg-slate-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-bold capitalize text-slate-800">{r.type}</div>
                        <div className="text-sm text-slate-600 mt-1">
                          {r.course_code} • {r.course_title}
                        </div>
                        <div className="text-xs text-slate-500 mt-1 font-medium">
                          {r.scanned_at}
                        </div>
                      </div>
                      <div className="font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg">
                        +{r.points_awarded} pts
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Card({ label, value }) {
  return (
    <div className="rounded-xl border p-4 bg-slate-50/50">
      <div className="text-sm text-slate-500 font-medium">{label}</div>
      <div className="text-2xl font-bold mt-1 text-slate-800">{value}</div>
    </div>
  );
}