function AttendanceTable({ attendanceList = [] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-white/20 bg-white/10 shadow-lg backdrop-blur-xl">
      <table className="min-w-full text-left text-sm text-slate-100">
        <thead className="border-b border-white/20 text-slate-200">
          <tr>
            <th className="px-4 py-3">Roll Number</th>
            <th className="px-4 py-3">Student Name</th>
            <th className="px-4 py-3">Date</th>
            <th className="px-4 py-3">Status</th>
          </tr>
        </thead>
        <tbody>
          {attendanceList.length === 0 ? (
            <tr>
              <td className="px-4 py-8 text-center text-slate-300" colSpan={4}>
                No attendance records found.
              </td>
            </tr>
          ) : (
            attendanceList.map((row) => {
              const present = Boolean(row?.present);
              return (
                <tr
                  key={row?.id ?? `${row?.date}-${present}`}
                  className="border-b border-white/10 transition hover:bg-white/5"
                >
                  <td className="px-4 py-3">{row?.rollNumber ?? "-"}</td>
                  <td className="px-4 py-3">{row?.studentName ?? "-"}</td>
                  <td className="px-4 py-3">{row?.date ?? "-"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                        present
                          ? "border border-emerald-400/40 bg-emerald-500/20 text-emerald-300"
                          : "border border-rose-400/40 bg-rose-500/20 text-rose-300"
                      }`}
                    >
                      {present ? "Present" : "Absent"}
                    </span>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

export default AttendanceTable;

