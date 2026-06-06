import { useState, useEffect } from "react";
import { getAuth } from "../../utils/token";
import { fetchJson } from "../../api/fetchJson";

function PrincipalStudentsPage() {
  const [students, setStudents] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedAdminId, setSelectedAdminId] = useState("");

  useEffect(() => {
    fetchPageData();
  }, [page, selectedAdminId]);

  const fetchPageData = async () => {
    try {
      setLoading(true);
      setError("");
      const auth = getAuth();
      const selectedAdminQuery = selectedAdminId
        ? `&adminId=${selectedAdminId}`
        : "";

      const [studentsData, adminsData] = await Promise.all([
        fetchJson(
          `/api/principal/students?page=${page}&size=10${selectedAdminQuery}`,
          {
            headers: {
              Authorization: `Bearer ${auth?.accessToken}`,
            },
          }
        ),
        fetchJson("/api/principal/admins?page=0&size=100", {
          headers: {
            Authorization: `Bearer ${auth?.accessToken}`,
          },
        }),
      ]);

      setStudents(studentsData.content || []);
      setTotalPages(studentsData.totalPages || 1);
      setAdmins(adminsData.content || []);
    } catch (err) {
      setError(err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-white">All Students</h1>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-white/10 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">All Students</h1>
          <p className="mt-2 text-sm text-slate-400">
            Filter students by admin to view isolated student data for each admin.
          </p>
        </div>

        <div className="w-full max-w-sm">
          <label className="mb-2 block text-sm font-medium text-slate-200">
            Select admin
          </label>
          <select
            value={selectedAdminId}
            onChange={(e) => {
              setSelectedAdminId(e.target.value);
              setPage(0);
            }}
            className="w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-white outline-none transition focus:border-sky-400/60 focus:ring-2 focus:ring-sky-400/20"
          >
            <option value="" className="text-slate-900">
              All admins
            </option>
            {admins.map((admin) => (
              <option key={admin.id} value={admin.id} className="text-slate-900">
                {admin.fullName || admin.username} ({admin.username})
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 text-red-400">
          {error}
        </div>
      )}

      {/* Students Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-white">
          <thead>
            <tr className="border-b border-white/10">
              <th className="px-4 py-3">Roll Number</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {students.length === 0 ? (
              <tr>
                <td colSpan="4" className="px-4 py-8 text-center text-gray-400">
                  No students found
                </td>
              </tr>
            ) : (
              students.map((student) => (
                <tr
                  key={student.id}
                  className="border-b border-white/5 hover:bg-white/5 transition"
                >
                  <td className="px-4 py-3 font-mono text-sky-400">
                    {student.rollNumber}
                  </td>
                  <td className="px-4 py-3">{student.fullName}</td>
                  <td className="px-4 py-3 text-gray-400">{student.email}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded text-sm">
                      {student.status || "ACTIVE"}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center">
        <button
          onClick={() => setPage(Math.max(0, page - 1))}
          disabled={page === 0}
          className="px-4 py-2 bg-white/10 text-white rounded-lg disabled:opacity-50 hover:bg-white/20 transition"
        >
          Previous
        </button>
        <span className="text-gray-400">
          Page {page + 1} of {totalPages}
        </span>
        <button
          onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
          disabled={page >= totalPages - 1}
          className="px-4 py-2 bg-white/10 text-white rounded-lg disabled:opacity-50 hover:bg-white/20 transition"
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default PrincipalStudentsPage;
