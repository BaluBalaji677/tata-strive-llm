import { Link } from "react-router-dom";

function CourseTable({ courses = [], onEdit, onDelete }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-white/20 bg-white/10 shadow-lg backdrop-blur-xl">
      <table className="min-w-full text-left text-sm text-slate-100">
        <thead className="border-b border-white/20 text-slate-200">
          <tr>
            <th className="px-4 py-3">Course Name</th>
            <th className="px-4 py-3">Duration (days)</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {courses.length === 0 ? (
            <tr>
              <td className="px-4 py-8 text-center text-slate-300" colSpan={3}>
                No courses found.
              </td>
            </tr>
          ) : (
            courses.map((course) => (
              <tr
                key={course?.id ?? course?.name}
                className="border-b border-white/10 transition hover:bg-white/5"
              >
                <td className="px-4 py-3">{course?.title || course?.name || "-"}</td>
                <td className="px-4 py-3">{course?.duration ?? "-"}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <Link
                      to={`/admin/course/${course?.id}`}
                      className="rounded-lg bg-indigo-500/70 px-3 py-1.5 text-xs font-medium transition hover:-translate-y-0.5 hover:bg-indigo-500"
                    >
                      View
                    </Link>
                    <button
                      type="button"
                      onClick={() => onEdit?.(course)}
                      className="rounded-lg bg-sky-500/70 px-3 py-1.5 text-xs font-medium transition hover:-translate-y-0.5 hover:bg-sky-500"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete?.(course?.id)}
                      className="rounded-lg bg-rose-500/70 px-3 py-1.5 text-xs font-medium transition hover:-translate-y-0.5 hover:bg-rose-500"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default CourseTable;

