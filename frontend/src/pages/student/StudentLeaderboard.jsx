import { useEffect, useState } from "react";
import client from "../../api/client";

export default function StudentLeaderboard() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await client.get("/leaderboard");
        setRows(res.data || []);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 p-6 pb-24">
      <div className="max-w-md mx-auto">
        <h1 className="text-xl font-bold">Leaderboard</h1>

        <div className="mt-5 rounded-2xl bg-white shadow p-4">
          {loading ? (
            <div className="text-slate-600">Loading...</div>
          ) : rows.length === 0 ? (
            <div className="text-slate-600">No data yet.</div>
          ) : (
            <div className="space-y-2">
              {rows.map((r) => (
                <div
                  key={r.student_id}
                  className="flex items-center justify-between border rounded-xl p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center font-bold text-emerald-700">
                      {r.rank}
                    </div>
                    <div>
                      <div className="font-semibold">{r.full_name}</div>
                      <div className="text-xs text-slate-500">
                        Student ID: {r.student_id}
                      </div>
                    </div>
                  </div>
                  <div className="font-bold text-slate-900">
                    {r.total_points} pts
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