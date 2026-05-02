import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import client from "../../api/client";
import QRCode from "qrcode";

export default function TeacherQRCodes() {
  const { id } = useParams(); // session_id
  const sessionId = useMemo(() => Number(id), [id]);

  const [type, setType] = useState("entry");
  const [duration, setDuration] = useState(15);
  const [points, setPoints] = useState(10);

  const [token, setToken] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

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

      const url = await QRCode.toDataURL(t, { margin: 1, width: 280 });
      setQrDataUrl(url);
      setMsg("QR generated");
    } catch (e) {
      setMsg("");
      setErr(e?.response?.data?.error || "Failed to generate QR");
    }
  }

  async function loadAttendance() {
    setLoadingAttendance(true);
    try {
      const res = await client.get(`/teacher/sessions/${sessionId}/attendance`);
      setAttendance(res.data || []);
    } catch (_) {
      // ignore
    } finally {
      setLoadingAttendance(false);
    }
  }

  useEffect(() => {
    loadAttendance();
    // refresh every 5 seconds (basic realtime)
    const t = setInterval(loadAttendance, 5000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  async function copyToken() {
    if (!token) return;
    await navigator.clipboard.writeText(token);
    setMsg("Token copied");
    setTimeout(() => setMsg(""), 1200);
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-xl font-bold">QR Codes</h1>
      <p className="text-slate-600 mt-2">Session ID: {sessionId}</p>

      <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Generator */}
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
              <label className="text-sm font-medium text-slate-700">
                Points
              </label>
              <input
                type="number"
                className="mt-1 w-full rounded-xl border p-3"
                value={points}
                onChange={(e) => setPoints(e.target.value)}
              />
              <p className="text-xs text-slate-500 mt-1">
                Entry/Exit points will be time-based on student scan. Task/Prep
                can use this points value.
              </p>
            </div>
          </div>

          <button
            onClick={generate}
            className="mt-4 w-full rounded-xl bg-emerald-600 text-white py-3 font-semibold hover:bg-emerald-700"
          >
            Generate
          </button>

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

        {/* Preview */}
        <div className="rounded-2xl bg-white border shadow-sm p-5">
          <h2 className="font-bold">Preview</h2>

          {!qrDataUrl ? (
            <div className="mt-4 text-slate-600">Generate a QR to preview.</div>
          ) : (
            <div className="mt-4 flex flex-col items-center">
              <img
                src={qrDataUrl}
                alt="QR Code"
                className="rounded-xl border bg-white"
              />

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

      {/* Attendance */}
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
                        {r.entry_points ?? ""}
                      </div>
                    </td>
                    <td className="py-2">
                      <div className="text-xs text-slate-600">
                        {r.exit_time || "-"}
                      </div>
                      <div className="font-bold text-emerald-700">
                        {r.exit_points ?? ""}
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
          Download CSV
        </a>
      </div>
    </div>
  );
}