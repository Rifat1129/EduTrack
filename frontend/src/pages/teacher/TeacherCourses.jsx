import { useEffect, useState } from "react";
import client from "../../api/client";

export default function TeacherCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // For Create Form
  const [title, setTitle] = useState("");
  const [code, setCode] = useState("");
  const [creating, setCreating] = useState(false);
  const [createErr, setCreateErr] = useState("");

  async function loadCourses() {
    setLoading(true);
    setErr("");
    try {
      const res = await client.get("/teacher/courses");
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

  async function handleCreate(e) {
    e.preventDefault();
    if (!title || !code) return;

    setCreating(true);
    setCreateErr("");
    try {
      await client.post("/courses", { title, code });
      setTitle("");
      setCode("");
      // reload list after create
      loadCourses();
    } catch (e) {
      setCreateErr(e?.response?.data?.error || "Failed to create course");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">My Courses</h1>
      </div>
      <p className="text-slate-600 mt-2">Manage your classes and join codes</p>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Create Course Form */}
        <div className="lg:col-span-1 h-fit rounded-2xl bg-white border shadow-sm p-5">
          <h2 className="font-bold">Create New Course</h2>
          <form onSubmit={handleCreate} className="mt-4 space-y-3">
            <div>
              <label className="text-sm font-medium text-slate-700">Course Code</label>
              <input
                className="mt-1 w-full rounded-xl border p-3 outline-none focus:ring-2 focus:ring-emerald-400"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. CSE101"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Course Title</label>
              <input
                className="mt-1 w-full rounded-xl border p-3 outline-none focus:ring-2 focus:ring-emerald-400"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Intro to Computer Science"
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
              {creating ? "Creating..." : "Create Course"}
            </button>
          </form>
        </div>

        {/* Course List */}
        <div className="lg:col-span-2 rounded-2xl bg-white border shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold">Active Courses</h2>
            <button onClick={loadCourses} className="text-sm font-semibold text-emerald-700">Refresh</button>
          </div>

          {loading ? (
            <div className="text-slate-600">Loading...</div>
          ) : err ? (
            <div className="text-red-700 bg-red-50 p-3 rounded-xl text-sm">{err}</div>
          ) : courses.length === 0 ? (
            <div className="text-slate-600">You haven't created any courses yet.</div>
          ) : (
            <div className="space-y-3">
              {courses.map((c) => (
                <div key={c.id} className="border rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-lg">{c.code}</div>
                    <div className="text-slate-600">{c.title}</div>
                    <div className="mt-2 text-sm">
                      Join Code: <span className="font-mono bg-slate-100 px-2 py-1 rounded font-bold text-emerald-800 tracking-widest">{c.join_code}</span>
                    </div>
                  </div>
                  <div>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${c.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      {c.is_active ? "ACTIVE" : "INACTIVE"}
                    </span>
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