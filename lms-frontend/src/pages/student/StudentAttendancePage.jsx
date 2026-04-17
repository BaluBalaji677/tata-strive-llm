import { useEffect, useState } from "react";
import { getStudentAttendance } from "../../api/attendanceApi";

function StudentAttendancePage() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    getStudentAttendance()
      .then((data) => setRows(Array.isArray(data) ? data : []))
      .catch(() => setError("Failed to load attendance"));
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">My Attendance</h1>
      {error ? <p className="text-sm text-rose-300">{error}</p> : null}
      <div className="glass overflow-x-auto rounded-2xl">
        <table className="min-w-full text-sm">
          <thead className="border-b border-white/20 text-left">
            <tr>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Present</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-white/10">
                <td className="px-4 py-2">{r.id}</td>
                <td className="px-4 py-2">{r.date}</td>
                <td className="px-4 py-2">{r.present ? "Yes" : "No"}</td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td className="px-4 py-4 text-slate-300" colSpan={3}>
                  No attendance records found.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default StudentAttendancePage;

