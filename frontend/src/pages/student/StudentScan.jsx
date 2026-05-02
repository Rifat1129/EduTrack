import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import client from "../../api/client";

export default function StudentScan() {
  const [status, setStatus] = useState("Ready to scan");
  const [lastResult, setLastResult] = useState(null);
  const [error, setError] = useState("");

  const qrRef = useRef(null);
  const isRunningRef = useRef(false);
  const isMountedRef = useRef(true);

  async function startScanner() {
    setError("");
    setStatus("Starting camera...");

    const qrRegionId = "qr-reader";

    // Create instance once
    if (!qrRef.current) {
      qrRef.current = new Html5Qrcode(qrRegionId);
    }
    const html5QrCode = qrRef.current;

    try {
      const cameras = await Html5Qrcode.getCameras();
      if (!cameras || cameras.length === 0) throw new Error("No camera found");

      const backCam = cameras.find((c) =>
        /back|rear|environment/i.test(c.label)
      );
      const cameraId = (backCam || cameras[0]).id;

      await html5QrCode.start(
        cameraId,
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText) => {
          if (!isMountedRef.current) return;

          setStatus("QR detected, submitting...");
          setLastResult(decodedText);

          // stop first to prevent multiple scans
          try {
            await html5QrCode.stop();
            isRunningRef.current = false;
            await html5QrCode.clear();
          } catch (_) {}

          try {
            const res = await client.post("/scan", { token: decodedText });
            setStatus(
              `Success: ${res.data.type} (+${res.data.points_awarded} pts)`
            );
          } catch (e) {
            setStatus("Scan failed");
            setError(e?.response?.data?.error || "Failed to submit scan");
          }
        },
        () => {}
      );

      isRunningRef.current = true;
      setStatus("Camera started. Scan a QR code.");
    } catch (e) {
      setStatus("Camera failed");
      setError(e?.message || "Failed to start camera");
    }
  }

  useEffect(() => {
    isMountedRef.current = true;
    startScanner();

    return () => {
      isMountedRef.current = false;

      const html5QrCode = qrRef.current;
      if (!html5QrCode) return;

      // Only stop if running; and never crash if stop fails
      if (isRunningRef.current) {
        html5QrCode
          .stop()
          .then(() => {
            isRunningRef.current = false;
            return html5QrCode.clear();
          })
          .catch(() => {});
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 p-6 pb-24">
      <div className="max-w-md mx-auto">
        <h1 className="text-xl font-bold">QR Scanner</h1>
        <p className="text-slate-600 mt-2">{status}</p>

        <div className="mt-4 rounded-2xl bg-white shadow p-4">
          <div id="qr-reader" className="w-full min-h-[320px]" />
        </div>

        {lastResult && (
          <div className="mt-4 text-sm text-slate-600 break-all">
            <span className="font-semibold">Last QR:</span> {lastResult}
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-xl bg-red-50 text-red-700 p-3 text-sm">
            {error}
          </div>
        )}

        <button
          onClick={() => window.location.reload()}
          className="mt-4 w-full rounded-xl bg-slate-900 text-white py-3 font-semibold"
        >
          Scan Again
        </button>

        <p className="mt-6 text-xs text-slate-500">
          Tip: Ensure good lighting and hold steady. QR must be active and not
          expired.
        </p>
      </div>
    </div>
  );
}