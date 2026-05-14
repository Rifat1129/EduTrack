import { useEffect, useState } from "react";
import client from "../../api/client";

export default function TeacherGrading() {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // Grade Form State for the selected submission
  const [selectedSub, setSelectedSub] = useState(null);
  const [points, setPoints] = useState("");
  const [gradeLabel, setGradeLabel] = useState("Excellent");
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [gradeErr, setGradeErr] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  async function loadPending() {
    setLoading(true);
    setErr("");
    try {
      const res = await client.get("/teacher/pending-submissions");
      setPending(res.data || []);
    } catch (e) {
      setErr(e?.response?.data?.error || "Failed to load pending submissions");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPending();
  }, []);

  function handleSelect(sub) {
    setSelectedSub(sub);
    setPoints("");
    setGradeLabel("Excellent");
    setFeedback("");
    setGradeErr("");
    setSuccessMsg("");
  }

  async function handleGrade(e) {
    e.preventDefault();
    if (!selectedSub || points === "") return;

    setSubmitting(true);
    setGradeErr("");
    setSuccessMsg("");

    try {
      await client.post("/teacher/grade", {
        task_id: selectedSub.task_id,
        student_id: selectedSub.student_id,
        points: Number(points),
        grade_label: gradeLabel,
        feedback: feedback,
      });

      setSuccessMsg("Graded successfully!");
      setTimeout(() => setSuccessMsg(""), 3000);
      
      setSelectedSub(null); // Clear selection
      loadPending(); // Reload list to remove the graded item
    } catch (e) {
      setGradeErr(e?.response?.data?.error || "Failed to submit grade");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto p-6 pb-24">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Grading & Tasks</h1>
        <button onClick={loadPending} className="text-sm font-semibold text-emerald-700">Refresh</button>
      </div>
      <p className="text-slate-600 mt-2">Evaluate pending assignments and tasks</p>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Pending Submissions List */}
        <div className="rounded-2xl bg-white border shadow-sm p-5 max-h-[600px] overflow-y-auto">
          <h2 className="font-bold mb-4">Pending Submissions ({pending.length})</h2>

          {loading ? (
            <div className="text-slate-600">Loading...</div>
          ) : err ? (
            <div className="text-red-700 bg-red-50 p-3 rounded-xl text-sm">{err}</div>
          ) : pending.length === 0 ? (
            <div className="text-slate-600">No pending submissions right now! 🎉</div>
          ) : (
            <div className="space-y-3">
              {pending.map((p) => (
                <div 
                  key={`${p.task_id}-${p.student_id}`} 
                  onClick={() => handleSelect(p)}
                  className={`border rounded-xl p-4 cursor-pointer transition-colors ${
                    selectedSub?.task_id === p.task_id && selectedSub?.student_id === p.student_id
                      ? "border-emerald-500 bg-emerald-50"
                      : "hover:bg-slate-50"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold text-slate-900">{p.task_title || "Task Name"}</div>
                      <div className="text-sm text-slate-600 mt-1">Student: <span className="font-semibold">{p.student_name}</span></div>
                    </div>
                    <span className="text-xs font-semibold px-2 py-1 rounded-lg bg-amber-100 text-amber-700">
                      {p.status?.toUpperCase() || "PENDING"}
                    </span>
                  </div>

                  {p.file_url && (
                    <div className="mt-3">
                      <a 
                        href={`https://edutrack-z7gs.onrender.com${p.file_url}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-xs font-semibold text-blue-600 hover:underline"
                        onClick={(e) => e.stopPropagation()} // Prevent selecting row when clicking link
                      >
                        📎 View Submitted File
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Grading Form Panel */}
        <div className="h-fit rounded-2xl bg-white border shadow-sm p-5 sticky top-6">
          <h2 className="font-bold mb-4">Grade Assignment</h2>
          
          {!selectedSub ? (
            <div className="text-sm text-slate-500 text-center py-10 bg-slate-50 rounded-xl border border-dashed">
              Select a submission from the left panel to start grading.
            </div>
          ) : (
            <form onSubmit={handleGrade} className="space-y-4">
              <div className="p-3 bg-slate-50 rounded-xl border mb-2">
                <div className="text-sm font-semibold">{selectedSub.task_title}</div>
                <div className="text-xs text-slate-500 mt-1">Student: {selectedSub.student_name}</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700">Points</label>
                  <input
                    type="number"
                    className="mt-1 w-full rounded-xl border p-3 outline-none focus:ring-2 focus:ring-emerald-400"
                    value={points}
                    onChange={(e) => setPoints(e.target.value)}
                    placeholder="e.g. 20"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Grade Label</label>
                  <select
                    className="mt-1 w-full rounded-xl border p-3 outline-none focus:ring-2 focus:ring-emerald-400"
                    value={gradeLabel}
                    onChange={(e) => setGradeLabel(e.target.value)}
                  >
                    <option value="Excellent">Excellent</option>
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                    <option value="Poor">Poor</option>
                    <option value="Penalty">Penalty</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Feedback (Optional)</label>
                <textarea
                  rows="3"
                  className="mt-1 w-full rounded-xl border p-3 outline-none focus:ring-2 focus:ring-emerald-400 text-sm"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Great job on the UI structure..."
                />
              </div>

              {gradeErr && (
                <div className="rounded-xl bg-red-50 text-red-700 p-3 text-sm">
                  {gradeErr}
                </div>
              )}
              {successMsg && (
                <div className="rounded-xl bg-emerald-50 text-emerald-700 p-3 text-sm font-medium">
                  {successMsg}
                </div>
              )}

              <button
                disabled={submitting}
                type="submit"
                className="w-full rounded-xl bg-slate-900 text-white py-3 font-semibold hover:bg-slate-800 disabled:opacity-60"
              >
                {submitting ? "Submitting..." : "Submit Grade"}
              </button>
            </form>
          )}
        </div>

      </div>
    </div>
  );
}