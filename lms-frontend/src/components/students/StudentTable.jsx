const statusClasses = {
  ACTIVE: "bg-emerald-500/20 text-emerald-300 border border-emerald-400/40",
  WARNING: "bg-amber-500/20 text-amber-300 border border-amber-400/40",
  REJECTED: "bg-rose-500/20 text-rose-300 border border-rose-400/40",
};

function StudentTable({ students = [], onEdit, onDelete }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-white/20 bg-white/10 shadow-lg backdrop-blur-xl">
      <table className="min-w-full text-left text-sm text-slate-100">
        <thead className="border-b border-white/20 text-slate-200">
          <tr>
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Username / Email</th>
            <th className="px-4 py-3">Roll Number</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {students.length === 0 ? (
            <tr>
              <td className="px-4 py-8 text-center text-slate-300" colSpan={5}>
                No students found. Try a different search.
              </td>
            </tr>
          ) : (
            students.map((student) => {
              const status = student?.status ?? "UNKNOWN";
              const cls = statusClasses[status] ?? "bg-slate-500/20 text-slate-200 border border-slate-400/40";
              return (
                <tr
                  key={student?.id ?? `${student?.rollNumber}-${student?.username}`}
                  className="border-b border-white/10 transition hover:bg-white/5"
                >
                  <td className="px-4 py-3">{student?.fullName ?? "-"}</td>
                  <td className="px-4 py-3">{student?.email || student?.username || "N/A"}</td>
                  <td className="px-4 py-3">{student?.rollNumber ?? "-"}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${cls}`}>
                      {status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => onEdit?.(student)}
                        className="rounded-lg bg-sky-500/70 px-3 py-1.5 text-xs font-medium transition hover:-translate-y-0.5 hover:bg-sky-500"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete?.(student)}
                        className="rounded-lg bg-rose-500/70 px-3 py-1.5 text-xs font-medium transition hover:-translate-y-0.5 hover:bg-rose-500"
                      >
                        Delete
                      </button>
                    </div>
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

export default StudentTable;

