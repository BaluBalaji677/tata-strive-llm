import { useMemo, useState, useEffect } from "react";
import AttendanceTable from "../../components/attendance/AttendanceTable";
import Card from "../../components/common/Card";
import FaceAttendance from "../../components/attendance/FaceAttendance";
import { markStudentAttendance, getAllAttendanceHistory, downloadTodayReport } from "../../services/attendanceService";

function AdminAttendancePage() {
  const FACE_ATTENDANCE_ENABLED = true;
  const [mode, setMode] = useState(FACE_ATTENDANCE_ENABLED ? "face" : "manual");
  const [rollNumber, setRollNumber] = useState("");
  const [present, setPresent] = useState(true);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [filterDate, setFilterDate] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [searchRoll, setSearchRoll] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setResult(null);
    setLoading(true);
    try {
      const data = await markStudentAttendance({ rollNumber, present });
      console.log("Attendance marked successfully:", data);
      setResult(data);
      // Fetch history again to ensure data stays persistent
      fetchHistory(searchRoll);
      setRollNumber("");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to mark attendance");
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async (roll = "") => {
    try {
      console.log("Fetching attendance history for:", roll || "ALL");
      const data = await getAllAttendanceHistory(roll);
      // Reverse to show latest first
      setHistory(data.reverse());
    } catch (err) {
      console.error("Error fetching history:", err);
    }
  };

  const handleDownloadReport = async () => {
    setError("");
    setReportLoading(true);

    try {
      const res = await downloadTodayReport();
      const blob = new Blob([res.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const today = new Date().toISOString().split("T")[0];
      link.setAttribute("download", `attendance_${today}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Report download failed", err);
      if (err?.response?.status === 403) {
        setError("You do not have permission to download this report.");
      } else if (err?.response?.status === 401) {
        setError("Session expired. Please login again.");
      } else {
        setError("Failed to download report. Please try again.");
      }
    } finally {
      setReportLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchHistory(searchRoll);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchRoll]);

  const filteredHistory = useMemo(() => {
    if (!filterDate) return history;
    return history.filter((item) => item.date === filterDate);
  }, [history, filterDate]);

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Attendance Overview</h1>
            <p className="text-sm text-slate-300">Mark daily student attendance and review recent entries.</p>
          </div>
          <button
            type="button"
            onClick={handleDownloadReport}
            disabled={reportLoading}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {reportLoading ? "Downloading..." : "Download Attendance Report 📥"}
          </button>
        </div>
      </div>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMode("manual")}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${mode === "manual" ? "bg-slate-700 text-white" : "bg-white/5 text-slate-300 hover:bg-white/10"}`}
            >
              Manual Mode
            </button>
            <button
              type="button"
              onClick={() => setMode("face")}
              disabled={!FACE_ATTENDANCE_ENABLED}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${mode === "face" ? "bg-sky-600 text-white" : "bg-white/5 text-slate-300 hover:bg-white/10"} ${!FACE_ATTENDANCE_ENABLED ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              Face Mode
            </button>
          </div>
          {!FACE_ATTENDANCE_ENABLED ? (
            <p className="text-sm text-slate-400">Face attendance is disabled by feature flag.</p>
          ) : null}
        </div>
      </Card>

      {mode === "face" ? (
        <FaceAttendance />
      ) : (
        <Card>
          <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-3">
            <input
              value={rollNumber}
              onChange={(e) => setRollNumber(e.target.value)}
              placeholder="Roll Number (e.g. RN001)"
              className="rounded-lg border border-white/20 bg-black/20 px-3 py-2"
              required
            />

            <div className="flex items-center gap-4 rounded-lg border border-white/20 bg-black/20 px-3 py-2 text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="attendanceType"
                  checked={present === true}
                  onChange={() => setPresent(true)}
                  className="h-4 w-4"
                />
                Present
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="attendanceType"
                  checked={present === false}
                  onChange={() => setPresent(false)}
                  className="h-4 w-4"
                />
                Absent
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-sky-500 px-4 py-2 font-semibold transition hover:-translate-y-0.5 hover:bg-sky-400 disabled:opacity-60"
            >
              {loading ? "Saving..." : "Mark Attendance"}
            </button>
          </form>
        </Card>
      )}

      {result ? (
        <Card className="text-sm">
          Saved: ID {result.id}, Date {result.date}, Present: {String(result.present)}
        </Card>
      ) : null}
      {error ? <Card className="text-sm text-rose-300">{error}</Card> : null}

      <Card title="Marked Attendance History">
        <div className="mb-4 flex flex-col md:flex-row gap-4 max-w-lg">
          <div className="flex-1">
            <label className="mb-1 block text-xs text-slate-300">Filter by Date</label>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-full rounded-lg border border-white/20 bg-black/20 px-3 py-2 text-sm"
            />
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-xs text-slate-300">Filter by Roll Number 🔍</label>
            <input
              type="text"
              placeholder="e.g. RN001"
              value={searchRoll}
              onChange={(e) => setSearchRoll(e.target.value)}
              className="w-full rounded-lg border border-white/20 bg-black/20 px-3 py-2 text-sm"
            />
          </div>
        </div>
        {history.length === 0 ? (
          <p className="rounded-lg bg-black/20 px-3 py-3 text-sm text-slate-300">
            No attendance has been marked yet.
          </p>
        ) : null}
        <AttendanceTable attendanceList={filteredHistory} />
      </Card>
    </div>
  );
}

export default AdminAttendancePage;

