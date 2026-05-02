import { useEffect, useState } from "react";
import client from "../../api/client";
import { Link } from "react-router-dom";

export default function TeacherSessions() {
  const [rows, setRows] = useState([]);
  const [courses, setCourses] = useState([]); // dropdown এর জন্য
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // Create Form States
  const [courseId, setCourseId] = useState("");
  const [room, setRoom] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [creating, setCreating] = useState(false);
  const [createErr, setCreateErr] = useState("");

  async function loadData() {
    setLoading(true);
    setErr("");
    try {
      const [sessRes, courseRes] = await Promise.all([
        client.get("/teacher/sessions"),
        client.get("/teacher/courses"),
      ]);
      setRows(sessRes.data || []);
      const courseList = courseRes.data || [];
      setCourses(courseList);
      
      // Default first course select করে রাখা
      if (courseList.length > 0 && !courseId) {
        setCourseId(courseList[0].id);
      }
    } catch (e) {
      setErr(e?.response?.data?.error || "Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    if (!courseId || !room || !startTime || !endTime) return;

    setCreating(true);
    setCreateErr("");
    try {
      // HTML datetime-local format "YYYY-MM-DDTHH:MM" দেয়
      // Backend এ "YYYY-MM-DD HH:MM" দরকার, তাই "T" কে space দিয়ে replace করছি
      const st = startTime.replace("T", " ");
      const et = endTime.replace("T", " ");

      await client.post("/sessions", {
        course_id: Number(courseId),
        room: room,
        start_time: st,
        end_time: et,
      });

      setRoom("");
      setStartTime("");
      setEndTime("");
      loadData(); // reload list
    } catch (e) {
      setCreateErr(e?.response?.data?.error || "Failed to create session");
    } finally {
      setCreating(false);
    }
  }

  async function handleStatusChange(sessionId, action) {
    try {
      await client.post(`/sessions/${sessionId}/${action}`);
      loadData(); // Refresh list to see updated status
    } catch (e) {
      alert(e?.response?.data?.error || `Failed to ${action} session`);
    }
  }

  return (
    <div className="max-w-5xl mx-auto p-6 pb-24">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Class Sessions</h1>
      </div>
      <p className="text-slate-600 mt-2">Create and manage your live classes</p>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Create Session Form */}
        <div className="lg:col-span-1 h-fit rounded-2xl bg-white border shadow-sm p-5">
          <h2 className="font-bold mb-4">Create New Session</h2>
          {courses.length === 0 ? (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-xl">
              You need to create a Course first!
            </div>
          ) : (
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="text-sm font-medium text-slate-700">Course</label>
                <select
                  className="mt-1 w-full rounded-xl border p-3 outline-none focus:ring-2 focus:ring-emerald-400"
                  value={courseId}
                  onChange={(e) => setCourseId(e.target.value)}
                  required
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} - {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Room / Lab</label>
                <input
                  className="mt-1 w-full rounded-xl border p-3 outline-none focus:ring-2 focus:ring-emerald-400"
                  value={room}
                  onChange={(e) => setRoom(e.target.value)}
                  placeholder="e.g. Lab 301"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Start Time</label>
                <input
                  type="datetime-local"
                  className="mt-1 w-full rounded-xl border p-3 outline-none focus:ring-2 focus:ring-emerald-400 text-sm"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">End Time</label>
                <input
                  type="datetime-local"
                  className="mt-1 w-full rounded-xl border p-3 outline-none focus:ring-2 focus:ring-emerald-400 text-sm"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                />
              </div>

              {createErr && (
                <div className="rounded-xl bg-red-50 text-red-700 p-3 text-sm">
                  {createErr}
                </div>
              )}

              <button
                disabled={creating}
                type="submit"
                className="w-full rounded-xl bg-emerald-600 text-white py-3 font-semibold hover:bg-emerald-700 disabled:opacity-60"
              >
                {creating ? "Creating..." : "Create Session"}
              </button>
            </form>
          )}
        </div>

        {/* Sessions List */}
        <div className="lg:col-span-2 rounded-2xl bg-white border shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold">Recent Sessions</h2>
            <button onClick={loadData} className="text-sm font-semibold text-emerald-700">Refresh</button>
          </div>

          {loading ? (
            <div className="text-slate-600">Loading...</div>
          ) : err ? (
            <div className="text-red-700 bg-red-50 p-3 rounded-xl text-sm">{err}</div>
          ) : rows.length === 0 ? (
            <div className="text-slate-600">No sessions found.</div>
          ) : (
            <div className="space-y-4">
              {rows.map((s) => (
                <div key={s.id} className="rounded-xl border p-4 flex flex-col md:flex-row items-start justify-between gap-4">
                  <div>
                    <div className="font-bold text-lg">
                      {s.course_code} <span className="text-sm font-normal text-slate-600">• {s.course_title}</span>
                    </div>
                    <div className="text-sm text-slate-600 mt-1">Room: {s.room}</div>
                    <div className="text-xs text-slate-500 mt-1">
                      {s.start_time} to {s.end_time}
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <span
                        className={`inline-block text-xs font-semibold px-2 py-1 rounded-lg ${
                          s.status === "live"
                            ? "bg-emerald-100 text-emerald-700"
                            : s.status === "ended"
                            ? "bg-slate-100 text-slate-700"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {s.status.toUpperCase()}
                      </span>
                      
                      {/* Status Control Buttons */}
                      {s.status === "scheduled" && (
                        <button onClick={() => handleStatusChange(s.id, "start")} className="text-xs font-bold text-blue-600 hover:underline">
                          ▶ Start Session
                        </button>
                      )}
                      {s.status === "live" && (
                        <button onClick={() => handleStatusChange(s.id, "end")} className="text-xs font-bold text-red-600 hover:underline">
                          ⏹ End Session
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 w-full md:w-auto min-w-[140px]">
                    {s.status === "live" ? (
                      <Link
                        to={`/teacher/sessions/${s.id}/qrcodes`}
                        className="text-center rounded-xl bg-emerald-600 text-white py-2 px-4 text-sm font-semibold hover:bg-emerald-700 shadow-sm"
                      >
                        Generate QR
                      </Link>
                    ) : (
                      <button disabled className="text-center rounded-xl bg-slate-100 text-slate-400 py-2 px-4 text-sm font-semibold cursor-not-allowed">
                        Generate QR
                      </button>
                    )}

                    <a
                      href={`/api/teacher/sessions/${s.id}/export`}
                      className="text-center rounded-xl bg-slate-900 text-white py-2 px-4 text-sm font-semibold hover:bg-slate-800"
                    >
                      Export CSV
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}