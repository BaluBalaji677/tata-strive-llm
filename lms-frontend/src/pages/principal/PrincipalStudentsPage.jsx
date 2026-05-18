import { useState, useEffect } from "react";
import { getAuth } from "../../utils/token";

function PrincipalStudentsPage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchStudents();
  }, [page]);

  const fetchStudents = async () => {
    try {
      const auth = getAuth();
      const response = await fetch(
        `/api/principal/students?page=${page}&size=10`,
        {
          headers: {
            Authorization: `Bearer ${auth?.accessToken}`,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch students");
      const data = await response.json();
      setStudents(data.content || []);
      setTotalPages(data.totalPages || 1);
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
      <h1 className="text-3xl font-bold text-white">All Students</h1>

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
                      Active
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
