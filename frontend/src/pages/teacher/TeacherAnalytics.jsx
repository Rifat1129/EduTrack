import { useEffect, useMemo, useState } from "react";
import client from "../../api/client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#a855f7", "#ef4444"];

export default function TeacherAnalytics() {
  const [courses, setCourses] = useState([]);
  const [courseId, setCourseId] = useState("");

  const [weekly, setWeekly] = useState([]);
  const [dist, setDist] = useState([]);
  const [top, setTop] = useState([]);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // load teacher courses
  useEffect(() => {
    async function loadCourses() {
      try {
        const res = await client.get("/teacher/courses");
        const list = res.data || [];
        setCourses(list);
        if (list.length > 0) setCourseId(String(list[0].id));
      } catch (e) {
        setErr(e?.response?.data?.error || "Failed to load courses");
      }
    }
    loadCourses();
  }, []);

  // load analytics when course changes
  useEffect(() => {
    async function load() {
      if (!courseId) return;
      setLoading(true);
      setErr("");

      try {
        const [w, d, t] = await Promise.all([
          client.get(`/teacher/analytics/weekly-attendance?course_id=${courseId}`),
          client.get(`/teacher/analytics/scan-distribution?course_id=${courseId}`),
          client.get(`/teacher/analytics/top-performers?course_id=${courseId}`),
        ]);

        // weekly: [{day,on_time,late}]
        setWeekly((w.data || []).map((x) => ({
          day: x.day,
          on_time: Number(x.on_time || 0),
          late: Number(x.late || 0),
        })));

        // dist: [{type,count}]
        setDist((d.data || []).map((x) => ({
          name: x.type,
          value: Number(x.count || 0),
        })));

        // top: [{student_id, full_name, points}]
        setTop((t.data || []).map((x, idx) => ({
          rank: idx + 1,
          student_id: x.student_id,
          full_name: x.full_name,
          points: Number(x.points || 0),
        })));
      } catch (e) {
        setErr(e?.response?.data?.error || "Failed to load analytics");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [courseId]);

  const selectedCourse = useMemo(
    () => courses.find((c) => String(c.id) === String(courseId)),
    [courses, courseId]
  );

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-xl font-bold">Analytics</h1>
      <p className="text-slate-600 mt-2">Track student engagement</p>

      {/* course selector */}
      <div className="mt-4 rounded-2xl bg-white border shadow-sm p-4">
        <label className="text-sm font-medium text-slate-700">
          Select Course
        </label>
        <select
          className="mt-1 w-full rounded-xl border p-3"
          value={courseId}
          onChange={(e) => setCourseId(e.target.value)}
        >
          {courses.length === 0 ? (
            <option value="">No courses</option>
          ) : (
            courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} - {c.title}
              </option>
            ))
          )}
        </select>

        {selectedCourse && (
          <div className="text-xs text-slate-500 mt-2">
            Join Code: <span className="font-semibold">{selectedCourse.join_code}</span>
          </div>
        )}
      </div>

      {err && (
        <div className="mt-4 rounded-xl bg-red-50 text-red-700 p-3 text-sm">
          {err}
        </div>
      )}

      {loading ? (
        <div className="mt-6 text-slate-600">Loading analytics...</div>
      ) : (
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Weekly attendance */}
          <div className="rounded-2xl bg-white border shadow-sm p-5">
            <h2 className="font-bold">Weekly Attendance</h2>
            <div className="mt-4 h-64">
              {weekly.length === 0 ? (
                <div className="text-slate-600">No data yet.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weekly}>
                    <XAxis dataKey="day" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="on_time" fill="#10b981" name="On Time" />
                    <Bar dataKey="late" fill="#f59e0b" name="Late" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Scan distribution */}
          <div className="rounded-2xl bg-white border shadow-sm p-5">
            <h2 className="font-bold">Scan Type Distribution</h2>
            <div className="mt-4 h-64">
              {dist.length === 0 ? (
                <div className="text-slate-600">No data yet.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dist}
                      dataKey="value"
                      nameKey="name"
                      outerRadius={90}
                      label
                    >
                      {dist.map((_, idx) => (
                        <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Top performers */}
          <div className="rounded-2xl bg-white border shadow-sm p-5 lg:col-span-2">
            <h2 className="font-bold">Top Performers</h2>
            <div className="mt-4">
              {top.length === 0 ? (
                <div className="text-slate-600">No data yet.</div>
              ) : (
                <div className="space-y-2">
                  {top.map((s) => (
                    <div
                      key={s.student_id}
                      className="flex items-center justify-between border rounded-xl p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center font-bold text-emerald-700">
                          {s.rank}
                        </div>
                        <div>
                          <div className="font-semibold">{s.full_name}</div>
                          <div className="text-xs text-slate-500">
                            Student ID: {s.student_id}
                          </div>
                        </div>
                      </div>

                      <div className="font-bold">{s.points} pts</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}