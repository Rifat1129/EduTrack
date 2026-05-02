import { useEffect, useState } from "react";
import client from "../../api/client";

export default function TeacherTasks() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form States
  const [courseId, setCourseId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [taskMode, setTaskMode] = useState("file_required");
  const [openAt, setOpenAt] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [maxPoints, setMaxPoints] = useState(25);
  
  const [creating, setCreating] = useState(false);
  const [err, setErr] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    async function loadCourses() {
      try {
        const res = await client.get("/teacher/courses");
        setCourses(res.data || []);
        if (res.data && res.data.length > 0) {
          setCourseId(res.data[0].id);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadCourses();
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setCreating(true);
    setErr("");
    setSuccessMsg("");

    try {
      // Format datetime for backend "YYYY-MM-DD HH:MM"
      const oAt = openAt.replace("T", " ");
      const dAt = dueAt.replace("T", " ");

      await client.post("/tasks", {
        course_id: Number(courseId),
        title,
        description,
        task_mode: taskMode,
        open_at: oAt,
        due_at: dAt,
        max_points: Number(maxPoints),
      });

      setSuccessMsg("Task created successfully!");
      setTitle("");
      setDescription("");
      setOpenAt("");
      setDueAt("");
      
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (e) {
      setErr(e?.response?.data?.error || "Failed to create task");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6 pb-24">
      <h1 className="text-xl font-bold">Create New Task / Assignment</h1>
      <p className="text-slate-600 mt-2">Assign homework or class tasks to your students.</p>

      <div className="mt-6 rounded-2xl bg-white border shadow-sm p-6">
        {loading ? (
          <div className="text-slate-600">Loading courses...</div>
        ) : courses.length === 0 ? (
          <div className="text-red-600 bg-red-50 p-3 rounded-xl">
            You need to create a course first!
          </div>
        ) : (
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Course</label>
              <select
                className="mt-1 w-full rounded-xl border p-3"
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                required
              >
                {courses.map(c => <option key={c.id} value={c.id}>{c.code} - {c.title}</option>)}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Task Title</label>
              <input
                className="mt-1 w-full rounded-xl border p-3 outline-none focus:ring-2 focus:ring-emerald-400"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. React Component Development"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Description / Instructions</label>
              <textarea
                className="mt-1 w-full rounded-xl border p-3 outline-none focus:ring-2 focus:ring-emerald-400"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Write what students need to do..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700">Task Mode</label>
                <select
                  className="mt-1 w-full rounded-xl border p-3"
                  value={taskMode}
                  onChange={(e) => setTaskMode(e.target.value)}
                >
                  <option value="file_required">File Upload Required</option>
                  <option value="scan_only">QR Scan Only (In-class)</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Max Points</label>
                <input
                  type="number"
                  className="mt-1 w-full rounded-xl border p-3"
                  value={maxPoints}
                  onChange={(e) => setMaxPoints(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700">Open At</label>
                <input
                  type="datetime-local"
                  className="mt-1 w-full rounded-xl border p-3 text-sm"
                  value={openAt}
                  onChange={(e) => setOpenAt(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Due At (Deadline)</label>
                <input
                  type="datetime-local"
                  className="mt-1 w-full rounded-xl border p-3 text-sm"
                  value={dueAt}
                  onChange={(e) => setDueAt(e.target.value)}
                  required
                />
              </div>
            </div>

            {err && <div className="rounded-xl bg-red-50 text-red-700 p-3 text-sm">{err}</div>}
            {successMsg && <div className="rounded-xl bg-emerald-50 text-emerald-700 p-3 text-sm font-medium">{successMsg}</div>}

            <button
              disabled={creating}
              type="submit"
              className="w-full rounded-xl bg-emerald-600 text-white py-3 font-semibold hover:bg-emerald-700 disabled:opacity-60 mt-2"
            >
              {creating ? "Creating Task..." : "Publish Task"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}