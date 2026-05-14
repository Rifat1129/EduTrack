import { useEffect, useState } from "react";
import client from "../../api/client";

export default function StudentTasks() {
  const [courses, setCourses] = useState([]);
  const [courseId, setCourseId] = useState("");
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    async function loadCourses() {
      try {
        const res = await client.get("/student/courses");
        const list = res.data || [];
        setCourses(list);
        if (list.length > 0) setCourseId(String(list[0].id));
      } catch (e) {
        setErr("Failed to load courses");
      }
    }
    loadCourses();
  }, []);

  useEffect(() => {
    async function loadTasks() {
      if (!courseId) return;
      setLoading(true);
      try {
        const res = await client.get(`/me/tasks?course_id=${courseId}`);
        setTasks(res.data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadTasks();
  }, [courseId]);

  return (
    <div className="min-h-screen bg-slate-50 p-6 pb-24">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-xl font-bold">My Tasks & Assignments</h1>

        <div className="mt-4 rounded-2xl bg-white shadow-sm border p-4">
          <label className="text-sm font-medium text-slate-700">Select Course</label>
          <select
            className="mt-1 w-full rounded-xl border p-3"
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
          >
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} - {c.title}
              </option>
            ))}
          </select>
        </div>

        {err && (
          <div className="mt-4 text-red-600 bg-red-50 p-3 rounded-xl">{err}</div>
        )}

        <div className="mt-6 space-y-4">
          {loading ? (
            <div className="text-slate-600">Loading tasks...</div>
          ) : tasks.length === 0 ? (
            <div className="text-slate-600 bg-white p-6 rounded-2xl border text-center">
              No tasks available for this course.
            </div>
          ) : (
            tasks.map((task) => <TaskCard key={task.id} task={task} />)
          )}
        </div>
      </div>
    </div>
  );
}

function TaskCard({ task }) {
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(task.submitted);

  async function handleSubmit(e) {
    e.preventDefault();
    if (task.task_mode === "file_required" && !file) {
      setMsg("Please select a file to upload");
      return;
    }

    setSubmitting(true);
    setMsg("");

    try {
      const formData = new FormData();
      if (file) formData.append("file", file);

      await client.post(`/tasks/${task.id}/submit`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setIsSubmitted(true);
      setMsg("Submitted successfully!");
    } catch (e) {
      setMsg(e?.response?.data?.error || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-2xl bg-white border shadow-sm p-5">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="font-bold text-lg">{task.title}</h2>
          <p className="text-sm text-slate-600 mt-1">{task.description}</p>

          {/* ✅ Teacher এর Attached File (Assignment instruction/resource) */}
          {task.file_url && (
            <a
              href={`https://edutrack-z7gs.onrender.com${task.file_url}`}
              target="_blank"
              rel="noreferrer"
              className="inline-block mt-2 text-xs font-semibold text-blue-600 hover:underline"
            >
              📎 Download Assignment File
            </a>
          )}
        </div>
        <div className="text-emerald-700 font-bold bg-emerald-50 px-3 py-1 rounded-lg">
          {task.max_points} Pts
        </div>
      </div>

      <div className="mt-3 text-xs text-slate-500 flex gap-4">
        <span>
          <span className="font-semibold text-slate-700">Mode:</span>{" "}
          {task.task_mode.replace("_", " ")}
        </span>
        <span>
          <span className="font-semibold text-slate-700">Due:</span>{" "}
          {new Date(task.due_at).toLocaleString()}
        </span>
      </div>

      <div className="mt-4 border-t pt-4">
        {isSubmitted ? (
          <div className="flex items-center gap-2 text-emerald-600 font-semibold bg-emerald-50 p-3 rounded-xl justify-center">
            ✅ You have submitted this task.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            {task.task_mode === "file_required" && (
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">
                  Upload File
                </label>
                <input
                  type="file"
                  onChange={(e) => setFile(e.target.files[0])}
                  className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                  required
                />
              </div>
            )}

            {msg && (
              <div className="text-sm text-center text-red-600">{msg}</div>
            )}

            <button
              disabled={submitting}
              type="submit"
              className="w-full rounded-xl bg-slate-900 text-white py-3 font-semibold hover:bg-slate-800 disabled:opacity-60"
            >
              {submitting ? "Submitting..." : "Submit Task"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}