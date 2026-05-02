import { useEffect, useState } from "react";
import client from "../../api/client";
import { useAuth } from "../../context/AuthContext"; // ✅ AuthContext ইম্পোর্ট করা হলো

export default function TeacherDashboard() {
  const { user } = useAuth(); // ✅ User ডাটা নেওয়া হলো
  const [data, setData] = useState(null);

  useEffect(() => {
    client.get("/teacher/dashboard").then((res) => setData(res.data));
  }, []);

  return (
    <div className="max-w-5xl mx-auto p-6">
      
      {/* ✅ নতুন Header Section */}
      <div className="mb-6">
        <p className="text-sm text-emerald-600 font-semibold mb-1">Welcome back,</p>
        <h1 className="text-3xl font-bold text-slate-900">{user?.full_name}</h1>
        <p className="text-sm text-slate-600 mt-1">
          {user?.designation || "Assistant Professor"} • {user?.department || "CSE Department"}
        </p>
      </div>

      {!data ? (
        <p className="text-slate-600 mt-2 bg-white p-4 rounded-xl border">Loading dashboard data...</p>
      ) : (
        <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card label="Total Students" value={data.total_students} />
          <Card label="Sessions" value={data.sessions_count} />
          <Card label="Total Scans" value={data.total_scans} />
          <Card label="Avg Attendance" value={`${data.avg_attendance}%`} />
        </div>
      )}
    </div>
  );
}

// ✅ Card ডিজাইন একটু পলিশ করা হলো
function Card({ label, value }) {
  return (
    <div className="rounded-2xl bg-white border shadow-sm p-5">
      <div className="text-sm text-slate-500 font-medium">{label}</div>
      <div className="text-3xl font-bold text-slate-800 mt-2">{value}</div>
    </div>
  );
}