import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import client from "../../api/client";
import QRCode from "qrcode";

export default function TeacherQRCodes() {
  const { id } = useParams();
  const sessionId = useMemo(() => Number(id), [id]);

  const [type, setType] = useState("entry");
  const [duration, setDuration] = useState(15);
  const [points, setPoints] = useState(10);

  const [token, setToken] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [lastQRCodeId, setLastQRCodeId] = useState(null);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const [autoRefresh, setAutoRefresh] = useState(false);
  const autoRefreshRef = useRef(null);

  const [attendance, setAttendance] = useState([]);
  const [loadingAttendance, setLoadingAttendance] = useState(false);

  async function generate() {
    setErr("");
    setMsg("Generating...");
    try {
      const res = await client.post("/qrcodes", {
        session_id: sessionId,
        type,
        duration: Number(duration),
        points: Number(points),
      });
      const t = res.data.qr_string;
      setToken(t);
      setLastQRCodeId(res.data.qr_code.id);
      const url = await QRCode.toDataURL(t, { margin: 1, width: 280 });
      setQrDataUrl(url);
      setMsg("QR generated successfully");
    } catch (e) {
      setMsg("");
      setErr(e?.response?.data?.error || "Failed to generate QR");
    }
  }

  async function generateAuto() {
    try {
      const res = await client.post("/qrcodes/auto", {
        session_id: sessionId,
        type,
        duration: 10,
        points: Number(points),
      });
      const t = res.data.qr_string;
      setToken(t);
      setLastQRCodeId(res.data.qr_code.id);
      const url = await QRCode.toDataURL(t, { margin: 1, width: 280 });
      setQrDataUrl(url);
      setMsg("QR auto-refreshed");
    } catch (e) {
      setErr(e?.response?.data?.error || "Auto-refresh failed");
      setAutoRefresh(false);
    }
  }

  useEffect(() => {
    if (autoRefresh) {
      generateAuto();
      autoRefreshRef.current = setInterval(() => {
        generateAuto();
      }, 10000);
    } else {
      if (autoRefreshRef.current) {
        clearInterval(autoRefreshRef.current);
        autoRefreshRef.current = null;
      }
    }
    return () => {
      if (autoRefreshRef.current) clearInterval(autoRefreshRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRefresh]);

  async function applyPenalty() {
    if (!lastQRCodeId) {
      setErr("Generate a Bonus QR first");
      return;
    }
    try {
      const res = await client.post("/bonus/penalty", {
        session_id: sessionId,
        qr_code_id: lastQRCodeId,
        penalty_points: -10,
      });
      setMsg(
        `Penalty applied! ${res.data.students_penalized} penalized, ${res.data.students_rewarded} rewarded.`
      );
    } catch (e) {
      setErr(e?.response?.data?.error || "Failed to apply penalty");
    }
  }

  async function loadAttendance() {
    setLoadingAttendance(true);
    try {
      const res = await client.get(`/teacher/sessions/${sessionId}/attendance`);
      setAttendance(res.data || []);
    } catch (_) {
    } finally {
      setLoadingAttendance(false);
    }
  }

  useEffect(() => {
    loadAttendance();
    const t = setInterval(loadAttendance, 5000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  async function copyToken() {
    if (!token) return;
    await navigator.clipboard.writeText(token);
    setMsg("Token copied!");
    setTimeout(() => setMsg(""), 1200);
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-xl font-bold">QR Codes</h1>
      <p className="text-slate-600 mt-2">Session ID: {sessionId}</p>

      <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl bg-white border shadow-sm p-5">
          <h2 className="font-bold">Generate QR</h2>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-slate-700">Type</label>
              <select
                className="mt-1 w-full rounded-xl border p-3"
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                <option value="entry">Entry</option>
                <option value="task">Task</option>
                <option value="exit">Exit</option>
                <option value="prep">Prep</option>
                <option value="bonus">🎯 Bonus (Attention Check)</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">
                Duration (min)
              </label>
              <input
                type="number"
                className="mt-1 w-full rounded-xl border p-3"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
            </div>

            <div className="col-span-2">
              <label className="text-sm font-medium text-slate-700">Points</label>
              <input
                type="number"
                className="mt-1 w-full rounded-xl border p-3"
                value={points}
                onChange={(e) => setPoints(e.target.value)}
              />
              <p className="text-xs text-slate-500 mt-1">
                {type === "bonus"
                  ? "Bonus: Students who scan get these points. Non-scanners get -10 penalty."
                  : "Entry/Exit uses time-based auto points. Task/Prep uses this value."}
              </p>
            </div>
          </div>

          <button
            onClick={generate}
            disabled={autoRefresh}
            className="mt-4 w-full rounded-xl bg-emerald-600 text-white py-3 font-semibold hover:bg-emerald-700 disabled:opacity-50"
          >
            Generate QR
          </button>

          <div className="mt-3">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`w-full rounded-xl py-3 font-semibold ${
                autoRefresh
                  ? "bg-red-600 text-white hover:bg-red-700"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              {autoRefresh
                ? "⏹ Stop Auto-Refresh"
                : "🔄 Auto-Refresh QR (every 10s — Screenshot Proof!)"}
            </button>
          </div>

          {autoRefresh && (
            <div className="mt-2 text-xs text-blue-600 font-semibold animate-pulse text-center">
              🔄 QR refreshing every 10 seconds... Screenshots will NOT work!
            </div>
          )}

          {type === "bonus" && lastQRCodeId && (
            <button
              onClick={applyPenalty}
              className="mt-3 w-full rounded-xl bg-red-600 text-white py-3 font-semibold hover:bg-red-700"
            >
              ⚠️ Apply Penalty (-10 pts to students who didn't scan)
            </button>
          )}

          {err && (
            <div className="mt-4 rounded-xl bg-red-50 text-red-700 p-3 text-sm">
              {err}
            </div>
          )}
          {msg && (
            <div className="mt-4 rounded-xl bg-emerald-50 text-emerald-800 p-3 text-sm">
              {msg}
            </div>
          )}
        </div>

        <div className="rounded-2xl bg-white border shadow-sm p-5">
          <h2 className="font-bold">Preview</h2>

          {!qrDataUrl ? (
            <div className="mt-4 text-slate-600">Generate a QR to preview.</div>
          ) : (
            <div className="mt-4 flex flex-col items-center">
              <div className="relative">
                <img
                  src={qrDataUrl}
                  alt="QR Code"
                  className="rounded-xl border bg-white"
                />
                {autoRefresh && (
                  <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-lg animate-pulse">
                    LIVE
                  </div>
                )}
              </div>

              {type === "bonus" && (
                <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl p-3 text-center w-full">
                  <div className="text-amber-800 font-bold text-sm">
                    🎯 BONUS CHALLENGE
                  </div>
                  <div className="text-xs text-amber-600 mt-1">
                    Scan within time → +{points} pts | Miss → -10 pts
                  </div>
                </div>
              )}

              <div className="mt-4 w-full">
                <div className="text-xs text-slate-500">Token</div>
                <div className="mt-1 p-3 rounded-xl border text-xs break-all bg-slate-50">
                  {token}
                </div>
                <button
                  onClick={copyToken}
                  className="mt-3 w-full rounded-xl bg-slate-900 text-white py-3 font-semibold hover:bg-slate-800"
                >
                  Copy Token
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 rounded-2xl bg-white border shadow-sm p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-bold">Real-time Attendance</h2>
          <button
            onClick={loadAttendance}
            className="rounded-xl border px-3 py-2 text-sm font-semibold"
          >
            Refresh
          </button>
        </div>

        {loadingAttendance ? (
          <div className="mt-4 text-slate-600">Loading...</div>
        ) : attendance.length === 0 ? (
          <div className="mt-4 text-slate-600">No data yet.</div>
        ) : (
          <div className="mt-4 overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="py-2">Student</th>
                  <th className="py-2">University ID</th>
                  <th className="py-2">Entry</th>
                  <th className="py-2">Exit</th>
                </tr>
              </thead>
              <tbody>
                {attendance.map((r) => (
                  <tr key={r.student_id} className="border-t">
                    <td className="py-2 font-semibold">{r.student_name}</td>
                    <td className="py-2">{r.university_id}</td>
                    <td className="py-2">
                      <div className="text-xs text-slate-600">
                        {r.entry_time || "-"}
                      </div>
                      <div className="font-bold text-emerald-700">
                        {r.entry_points != null ? `+${r.entry_points}` : ""}
                      </div>
                    </td>
                    <td className="py-2">
                      <div className="text-xs text-slate-600">
                        {r.exit_time || "-"}
                      </div>
                      <div className="font-bold text-emerald-700">
                        {r.exit_points != null ? `+${r.exit_points}` : ""}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <a
          href={`/api/teacher/sessions/${sessionId}/export`}
          className="inline-block mt-4 rounded-xl bg-slate-900 text-white px-4 py-2 text-sm font-semibold hover:bg-slate-800"
        >
          Download Attendance CSV
        </a>
      </div>
    </div>
  );
}