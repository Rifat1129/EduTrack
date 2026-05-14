import { useEffect, useState } from "react";
import client from "../../api/client";

export default function TeacherTasks() {
  const [courses, setCourses] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(true);

  const [courseId, setCourseId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [taskMode, setTaskMode] = useState("file_required");
  const [openAt, setOpenAt] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [maxPoints, setMaxPoints] = useState(25);
  const [file, setFile] = useState(null);

  const [creating, setCreating] = useState(false);
  const [err, setErr] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  async function loadData() {
    setLoadingTasks(true);
    try {
      const [cRes, tRes] = await Promise.all([
        client.get("/teacher/courses"),
        client.get("/teacher/tasks"),
      ]);
      const courseList = cRes.data || [];
      setCourses(courseList);
      if (courseList.length > 0 && !courseId) setCourseId(courseList[0].id);
      setTasks(tRes.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingTasks(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setCreating(true);
    setErr("");
    setSuccessMsg("");

    try {
      const formData = new FormData();
      formData.append("course_id", courseId);
      formData.append("title", title);
      formData.append("description", description);
      formData.append("task_mode", taskMode);
      formData.append("max_points", maxPoints);

      // datetime-local gives "2026-05-15T00:57"
      // backend wants "2026-05-15 00:57"
      if (openAt) formData.append("open_at", openAt.replace("T", " "));
      if (dueAt) formData.append("due_at", dueAt.replace("T", " "));

      if (file) formData.append("file", file);

      await client.post("/tasks", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setSuccessMsg("Task created!");
      setTitle("");
      setDescription("");
      setOpenAt("");
      setDueAt("");
      setFile(null);
      loadData();
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (e) {
      setErr(e?.response?.data?.error || "Failed to create task");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto p-6 pb-24">
      <h1 className="text-xl font-bold">Tasks & Assignments</h1>
      <p className="text-slate-600 mt-2">Create tasks and track submissions</p>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ========== Create Form ========== */}
        <div className="lg:col-span-1 h-fit rounded-2xl bg-white border shadow-sm p-5">
          <h2 className="font-bold mb-4">Create New Task</h2>
          {courses.length === 0 ? (
            <div className="text-red-600 bg-red-50 p-3 rounded-xl text-sm">
              Create a course first!
            </div>
          ) : (
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="text-sm font-medium text-slate-700">
                  Course
                </label>
                <select
                  className="mt-1 w-full rounded-xl border p-3"
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
                <label className="text-sm font-medium text-slate-700">
                  Title
                </label>
                <input
                  className="mt-1 w-full rounded-xl border p-3"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Deadlock Assignment"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">
                  Description / Instructions
                </label>
                <textarea
                  className="mt-1 w-full rounded-xl border p-3"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Write what students need to do..."
                  rows={3}
                />
              </div>

              {/* File Attachment (Optional) */}
              <div>
                <label className="text-sm font-medium text-slate-700">
                  Attach File (Optional)
                </label>
                <p className="text-xs text-slate-500 mb-1">
                  PDF, images, docs — assignment resource হিসেবে
                </p>
                <input
                  type="file"
                  onChange={(e) => setFile(e.target.files[0])}
                  className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Mode
                  </label>
                  <select
                    className="mt-1 w-full rounded-xl border p-3"
                    value={taskMode}
                    onChange={(e) => setTaskMode(e.target.value)}
                  >
                    <option value="file_required">File Upload</option>
                    <option value="scan_only">QR Scan Only</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Max Points
                  </label>
                  <input
                    type="number"
                    className="mt-1 w-full rounded-xl border p-3"
                    value={maxPoints}
                    onChange={(e) => setMaxPoints(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Open At
                  </label>
                  <input
                    type="datetime-local"
                    className="mt-1 w-full rounded-xl border p-3 text-sm"
                    value={openAt}
                    onChange={(e) => setOpenAt(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Due At
                  </label>
                  <input
                    type="datetime-local"
                    className="mt-1 w-full rounded-xl border p-3 text-sm"
                    value={dueAt}
                    onChange={(e) => setDueAt(e.target.value)}
                    required
                  />
                </div>
              </div>

              {err && (
                <div className="rounded-xl bg-red-50 text-red-700 p-3 text-sm">
                  {err}
                </div>
              )}
              {successMsg && (
                <div className="rounded-xl bg-emerald-50 text-emerald-700 p-3 text-sm">
                  {successMsg}
                </div>
              )}

              <button
                disabled={creating}
                type="submit"
                className="w-full rounded-xl bg-emerald-600 text-white py-3 font-semibold hover:bg-emerald-700 disabled:opacity-60"
              >
                {creating ? "Creating..." : "Publish Task"}
              </button>
            </form>
          )}
        </div>

        {/* ========== Task List (CSV button removed) ========== */}
        <div className="lg:col-span-2 rounded-2xl bg-white border shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold">All Tasks ({tasks.length})</h2>
            <button
              onClick={loadData}
              className="text-sm font-semibold text-emerald-700"
            >
              Refresh
            </button>
          </div>

          {loadingTasks ? (
            <div className="text-slate-600">Loading...</div>
          ) : tasks.length === 0 ? (
            <div className="text-slate-600">No tasks created yet.</div>
          ) : (
            <div className="space-y-3">
              {tasks.map((t) => (
                <div key={t.id} className="border rounded-xl p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-bold text-lg">{t.title}</div>
                      <div className="text-sm text-slate-600 mt-1">
                        {t.course_code} • {t.course_title}
                      </div>
                      {t.description && (
                        <div className="text-xs text-slate-500 mt-1">
                          {t.description}
                        </div>
                      )}
                      <div className="text-xs text-slate-500 mt-2">
                        Open: {t.open_at} | Due: {t.due_at}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        Mode: {t.task_mode.replace("_", " ")} | Max:{" "}
                        {t.max_points} pts
                      </div>

                      {/* Teacher Attached File */}
                      {t.file_url && (
                        <a
                          href={`https://edutrack-z7gs.onrender.com${t.file_url}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-block mt-2 text-xs font-semibold text-blue-600 hover:underline"
                        >
                          📎 View Attached File
                        </a>
                      )}
                    </div>
                    <div className="text-right min-w-[110px]">
                      <div className="text-sm font-bold text-emerald-700">
                        {t.submitted}/{t.total}
                      </div>
                      <div className="text-xs text-slate-500">submitted</div>
                      <div className="text-sm font-bold text-blue-700 mt-1">
                        {t.graded}/{t.total}
                      </div>
                      <div className="text-xs text-slate-500">graded</div>
                    </div>
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