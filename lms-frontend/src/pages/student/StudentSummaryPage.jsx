import { useEffect, useState } from "react";
import { getStudentAttendanceSummary } from "../../api/attendanceApi";

function StudentSummaryPage() {
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getStudentAttendanceSummary()
      .then((data) => setSummary(data))
      .catch(() => setError("Failed to load summary"));
  }, []);

  return (
    <div className="max-w-xl space-y-4">
      <h1 className="text-2xl font-bold">Attendance Summary</h1>
      {error ? <p className="text-sm text-rose-300">{error}</p> : null}
      <div className="glass rounded-2xl p-5">
        <p className="text-sm text-slate-300">Percentage</p>
        <p className="text-3xl font-bold">{summary ? `${summary.percentage}%` : "--"}</p>
        <p className="mt-3 text-sm text-slate-300">Status</p>
        <p className="text-xl font-semibold">{summary ? summary.status : "--"}</p>
      </div>
    </div>
  );
}

export default StudentSummaryPage;

