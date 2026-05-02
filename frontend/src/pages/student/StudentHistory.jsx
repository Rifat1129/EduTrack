import { useEffect, useState } from "react";
import client from "../../api/client";

const TABS = ["all", "entry", "task", "exit", "prep"];

export default function StudentHistory() {
  const [type, setType] = useState("all");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await client.get(`/me/history?type=${type}`);
        setRows(res.data || []);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [type]);

  return (
    <div className="min-h-screen bg-slate-50 p-6 pb-24">
      <div className="max-w-md mx-auto">
        <h1 className="text-xl font-bold">Scan History</h1>

        <div className="mt-4 flex gap-2 flex-wrap">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`px-3 py-2 rounded-xl text-sm font-semibold border ${
                type === t
                  ? "bg-emerald-600 text-white border-emerald-600"
                  : "bg-white text-slate-700"
              }`}
            >
              {t.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="mt-5 rounded-2xl bg-white shadow p-4">
          {loading ? (
            <div className="text-slate-600">Loading...</div>
          ) : rows.length === 0 ? (
            <div className="text-slate-600">No history found.</div>
          ) : (
            <div className="space-y-3">
              {rows.map((r) => (
                <div key={r.id} className="border rounded-xl p-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-bold capitalize">{r.type}</div>
                      <div className="text-sm text-slate-600">
                        {r.course_code} • {r.course_title}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        {r.scanned_at}
                      </div>
                    </div>
                    <div className="font-bold text-emerald-700">
                      +{r.points_awarded}
                    </div>
                  </div>
                  {r.room && (
                    <div className="text-xs text-slate-500 mt-2">
                      Room: {r.room}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}