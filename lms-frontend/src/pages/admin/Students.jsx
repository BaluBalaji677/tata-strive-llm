import { useEffect, useMemo, useRef, useState } from "react";
import StudentTable from "../../components/students/StudentTable";
import StudentForm from "../../components/students/StudentForm";
import Card from "../../components/common/Card";
import {
  addStudent,
  deleteStudent,
  getAllStudents,
  updateStudent,
} from "../../services/studentService";

function Students() {
  const [students, setStudents] = useState([]);
  const [editingStudent, setEditingStudent] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const didFetchRef = useRef(false);

  const loadStudents = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getAllStudents();
      setStudents(data);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load students");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (didFetchRef.current) return;
    didFetchRef.current = true;
    loadStudents();
  }, []);

  const handleSubmit = async (payload) => {
    setError("");
    try {
      if (editingStudent?.id) {
        await updateStudent(editingStudent.id, payload);
      } else {
        await addStudent(payload);
      }
      setEditingStudent(null);
      await loadStudents();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to save student");
    }
  };

  const handleDelete = async (student) => {
    if (!student?.id) return;
    const studentName = student?.fullName || student?.username || "this student";
    const shouldDelete = window.confirm(`Are you sure you want to delete ${studentName}?`);
    if (!shouldDelete) return;
    setError("");
    try {
      await deleteStudent(student.id);
      if (editingStudent?.id === student.id) {
        setEditingStudent(null);
      }
      await loadStudents();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to delete student");
    }
  };

  const filtered = useMemo(() => {
    const key = search.trim().toLowerCase();
    if (!key) return students;
    return students.filter((s) =>
      [s?.fullName, s?.username, s?.status, s?.rollNumber]
        .filter(Boolean)
        .some((val) => String(val).toLowerCase().includes(key))
    );
  }, [students, search]);

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Student Management</h1>
        <p className="text-sm text-slate-300">Create, update, delete and search registered students.</p>
      </div>

      <StudentForm onSubmit={handleSubmit} initialData={editingStudent} />

      {editingStudent ? (
        <button
          type="button"
          onClick={() => setEditingStudent(null)}
          className="rounded-lg bg-white/10 px-3 py-1.5 text-sm transition hover:bg-white/20"
        >
          Cancel Edit
        </button>
      ) : null}

      <Card>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, username, status, roll number..."
          className="w-full rounded-lg border border-white/20 bg-black/20 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:outline-none"
        />
      </Card>

      {loading ? (
        <Card>
          <div className="space-y-3">
            <div className="h-4 w-1/3 animate-pulse rounded bg-white/20" />
            <div className="h-10 w-full animate-pulse rounded bg-white/10" />
            <div className="h-10 w-full animate-pulse rounded bg-white/10" />
            <div className="h-10 w-full animate-pulse rounded bg-white/10" />
          </div>
        </Card>
      ) : null}
      {error ? <Card className="text-rose-300">{error}</Card> : null}
      {!loading && !error ? (
        <StudentTable
          students={filtered}
          onEdit={setEditingStudent}
          onDelete={handleDelete}
        />
      ) : null}
    </div>
  );
}

export default Students;

