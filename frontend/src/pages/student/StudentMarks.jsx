import { useEffect, useState } from "react";
import client from "../../api/client";

export default function StudentMarks() {
  const [courses, setCourses] = useState([]);
  const [courseId, setCourseId] = useState("");
  const [marks, setMarks] = useState([]);
  const [pending, setPending] = useState([]);
  const [tab, setTab] = useState("marks");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // load my courses once
  useEffect(() => {
    async function loadCourses() {
      try {
        const res = await client.get("/student/courses");
        const list = res.data || [];
        setCourses(list);

        // auto select first course
        if (list.length > 0) setCourseId(String(list[0].id));
      } catch (e) {
        setErr(e?.response?.data?.error || "Failed to load courses");
      }
    }
    loadCourses();
  }, []);

  // load marks + pending when course changes
  useEffect(() => {
    async function load() {
      if (!courseId) return;
      setLoading(true);
      setErr("");
      try {
        const [m, p] = await Promise.all([
          client.get(`/me/marks?course_id=${courseId}`),
          client.get(`/me/pending?course_id=${courseId}`),
        ]);
        setMarks(m.data || []);
        setPending(p.data || []);
      } catch (e) {
        setErr(e?.response?.data?.error || "Failed to load marks");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [courseId]);

  return (
    <div className="min-h-screen bg-slate-50 p-6 pb-24">
      <div className="max-w-md mx-auto">
        <h1 className="text-xl font-bold">My Marks & Grades</h1>

        <div className="mt-4 rounded-2xl bg-white shadow p-4">
          <label className="text-sm font-medium text-slate-700">
            Select Course
          </label>
          <select
            className="mt-1 w-full rounded-xl border p-3"
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
          >
            {courses.length === 0 ? (
              <option value="">No courses found</option>
            ) : (
              courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} - {c.title}
                </option>
              ))
            )}
          </select>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            onClick={() => setTab("marks")}
            className={`flex-1 rounded-xl py-3 text-sm font-semibold border ${
              tab === "marks"
                ? "bg-emerald-600 text-white border-emerald-600"
                : "bg-white text-slate-700"
            }`}
          >
            All Assessments
          </button>
          <button
            onClick={() => setTab("pending")}
            className={`flex-1 rounded-xl py-3 text-sm font-semibold border ${
              tab === "pending"
                ? "bg-emerald-600 text-white border-emerald-600"
                : "bg-white text-slate-700"
            }`}
          >
            Pending ({pending.length})
          </button>
        </div>

        <div className="mt-4 rounded-2xl bg-white shadow p-4">
          {err && (
            <div className="mb-3 rounded-xl bg-red-50 text-red-700 p-3 text-sm">
              {err}
            </div>
          )}

          {loading ? (
            <div className="text-slate-600">Loading...</div>
          ) : tab === "marks" ? (
            marks.length === 0 ? (
              <div className="text-slate-600">No graded tasks yet.</div>
            ) : (
              <div className="space-y-3">
                {marks.map((x, idx) => (
                  <MarkCard key={idx} x={x} />
                ))}
              </div>
            )
          ) : pending.length === 0 ? (
            <div className="text-slate-600">No pending tasks.</div>
          ) : (
            <div className="space-y-3">
              {pending.map((x, idx) => (
                <PendingCard key={idx} x={x} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MarkCard({ x }) {
  // NOTE: field names depend on your backend response.
  // If something shows undefined, send me the API JSON, I'll map it perfectly.
  return (
    <div className="border rounded-xl p-3">
      <div className="font-bold">{x.title || x.task_title || "Task"}</div>
      <div className="text-xs text-slate-500 mt-1">
        Task ID: {x.task_id ?? x.id ?? "-"}
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <Box label="My" value={x.my_points ?? x.points ?? "-"} />
        <Box label="Highest" value={x.highest ?? "-"} />
        <Box label="Lowest" value={x.lowest ?? "-"} />
      </div>

      {x.grade_label && (
        <div className="mt-3 text-sm text-emerald-700 font-semibold">
          {x.grade_label}
        </div>
      )}

      {x.feedback && (
        <div className="mt-3 text-sm rounded-xl bg-slate-50 p-3">
          <span className="font-semibold">Feedback:</span> {x.feedback}
        </div>
      )}
    </div>
  );
}

function PendingCard({ x }) {
  return (
    <div className="border rounded-xl p-3">
      <div className="font-bold">{x.title || x.task_title || "Task"}</div>
      <div className="text-xs text-slate-500 mt-1">
        Task ID: {x.task_id ?? x.id ?? "-"}
      </div>
      <div className="text-sm text-slate-600 mt-2">
        Status: {x.status || "pending"}
      </div>
    </div>
  );
}

function Box({ label, value }) {
  return (
    <div className="rounded-xl border p-2">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="font-bold">{value}</div>
    </div>
  );
}