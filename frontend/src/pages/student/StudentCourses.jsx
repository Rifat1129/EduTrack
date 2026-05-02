import { useEffect, useState } from "react";
import client from "../../api/client";

export default function StudentCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // For Join Form
  const [joinCode, setJoinCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [joinErr, setJoinErr] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  async function loadCourses() {
    setLoading(true);
    setErr("");
    try {
      const res = await client.get("/student/courses");
      setCourses(res.data || []);
    } catch (e) {
      setErr(e?.response?.data?.error || "Failed to load courses");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCourses();
  }, []);

  async function handleJoin(e) {
    e.preventDefault();
    if (!joinCode) return;

    setJoining(true);
    setJoinErr("");
    setSuccessMsg("");
    
    try {
      const res = await client.post("/courses/join", { join_code: joinCode });
      setSuccessMsg(res.data.message || "Successfully joined!");
      setJoinCode("");
      // reload course list
      loadCourses();
      
      // hide success message after 3 seconds
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (e) {
      setJoinErr(e?.response?.data?.error || "Failed to join course");
    } finally {
      setJoining(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 pb-24">
      <div className="max-w-md mx-auto">
        <h1 className="text-xl font-bold">My Courses</h1>
        <p className="text-slate-600 mt-2">Join and view your enrolled courses</p>

        {/* Join Course Form */}
        <div className="mt-5 rounded-2xl bg-white border shadow-sm p-5">
          <h2 className="font-bold">Join a New Course</h2>
          <form onSubmit={handleJoin} className="mt-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Join Code</label>
              <div className="flex gap-2 mt-1">
                <input
                  className="flex-1 rounded-xl border p-3 outline-none focus:ring-2 focus:ring-emerald-400 uppercase"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  placeholder="e.g. A7K9P2"
                  required
                />
                <button
                  disabled={joining}
                  type="submit"
                  className="px-6 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 disabled:opacity-60"
                >
                  {joining ? "..." : "Join"}
                </button>
              </div>
            </div>

            {joinErr && (
              <div className="mt-3 rounded-xl bg-red-50 text-red-700 p-3 text-sm">
                {joinErr}
              </div>
            )}
            {successMsg && (
              <div className="mt-3 rounded-xl bg-emerald-50 text-emerald-700 p-3 text-sm font-medium">
                {successMsg}
              </div>
            )}
          </form>
        </div>

        {/* Enrolled Courses List */}
        <div className="mt-6 rounded-2xl bg-white border shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold">Enrolled Courses ({courses.length})</h2>
            <button onClick={loadCourses} className="text-sm font-semibold text-emerald-700">Refresh</button>
          </div>

          {loading ? (
            <div className="text-slate-600">Loading...</div>
          ) : err ? (
            <div className="text-red-700 bg-red-50 p-3 rounded-xl text-sm">{err}</div>
          ) : courses.length === 0 ? (
            <div className="text-slate-600">You haven't joined any courses yet.</div>
          ) : (
            <div className="space-y-3">
              {courses.map((c) => (
                <div key={c.id} className="border rounded-xl p-4">
                  <div className="font-bold text-lg text-slate-900">{c.code}</div>
                  <div className="text-slate-600 mt-1">{c.title}</div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}