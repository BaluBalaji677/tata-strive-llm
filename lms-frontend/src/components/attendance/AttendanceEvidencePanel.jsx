import { useEffect, useMemo, useState } from "react";
import { getAttendanceEvidence } from "../../services/attendanceService";
import Card from "../common/Card";

function formatDateTime(dateTimeString) {
  try {
    return new Date(dateTimeString).toLocaleString();
  } catch {
    return dateTimeString;
  }
}

function AttendanceEvidencePanel() {
  const [evidenceList, setEvidenceList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedEvidence, setSelectedEvidence] = useState(null);

  const fetchEvidence = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getAttendanceEvidence();
      setEvidenceList(data);
    } catch (err) {
      console.error(err);
      setError("Unable to load attendance evidence. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvidence();
  }, []);

  const gridContent = useMemo(() => {
    if (loading) {
      return <p className="text-sm text-slate-300">Loading evidence...</p>;
    }
    if (error) {
      return <p className="text-sm text-rose-300">{error}</p>;
    }
    if (evidenceList.length === 0) {
      return <p className="text-sm text-slate-300">No attendance evidence found from the last 3 days.</p>;
    }
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {evidenceList.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setSelectedEvidence(item)}
            className="group overflow-hidden rounded-3xl border border-white/10 bg-slate-950/80 text-left transition hover:-translate-y-0.5 hover:border-cyan-400/30"
          >
            <div className="relative h-48 overflow-hidden bg-slate-900">
              <img
                src={item.imageUrl}
                alt={`Attendance evidence ${item.id}`}
                className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
              />
            </div>
            <div className="space-y-2 p-4">
              <div className="flex items-center justify-between gap-3 text-sm text-slate-300">
                <span className="rounded-full bg-white/5 px-2 py-1 text-xs uppercase tracking-[0.24em] text-slate-400">
                  Captured
                </span>
                <span className="text-xs text-slate-500">ID {item.id}</span>
              </div>
              <p className="text-sm font-medium text-white">
                {formatDateTime(item.capturedAt)}
              </p>
              <p className="text-xs text-slate-400">Expires {formatDateTime(item.expiresAt)}</p>
            </div>
          </button>
        ))}
      </div>
    );
  }, [evidenceList, error, loading]);

  return (
    <div className="space-y-5">
      <Card title="Attendance Evidence" className="p-0">
        <div className="p-6">
          <p className="mb-4 text-sm text-slate-300">
            Evidence images captured after successful face recognition. Only records from the last 3 days are shown.
          </p>
          {gridContent}
        </div>
      </Card>

      {selectedEvidence ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4">
          <div className="relative w-full max-w-4xl overflow-hidden rounded-[32px] bg-slate-900 shadow-2xl">
            <button
              type="button"
              onClick={() => setSelectedEvidence(null)}
              className="absolute right-4 top-4 rounded-full bg-slate-950/90 px-3 py-2 text-sm text-white shadow-lg"
            >
              Close
            </button>
            <img
              src={selectedEvidence.imageUrl}
              alt={`Evidence ${selectedEvidence.id}`}
              className="h-[70vh] w-full object-contain bg-slate-950"
            />
            <div className="space-y-2 border-t border-white/10 p-6 text-slate-300">
              <p className="text-sm text-white font-semibold">Evidence captured on</p>
              <p className="text-sm">{formatDateTime(selectedEvidence.capturedAt)}</p>
              <p className="text-sm">Expires on {formatDateTime(selectedEvidence.expiresAt)}</p>
              <p className="text-sm text-slate-500">Session ID: {selectedEvidence.attendanceSessionId || "N/A"}</p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default AttendanceEvidencePanel;
