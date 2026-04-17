import { useMemo, useState, useEffect } from "react";
import AttendanceTable from "../../components/attendance/AttendanceTable";
import Card from "../../components/common/Card";
import { markStudentAttendance, getAllAttendanceHistory } from "../../services/attendanceService";

function AdminAttendancePage() {
  const [rollNumber, setRollNumber] = useState("");
  const [present, setPresent] = useState(true);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [filterDate, setFilterDate] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
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
        <h1 className="text-2xl font-bold">Attendance Overview</h1>
        <p className="text-sm text-slate-300">Mark daily student attendance and review recent entries.</p>
      </div>

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

