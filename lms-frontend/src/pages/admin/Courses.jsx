import { useEffect, useState } from "react";
import Card from "../../components/common/Card";
import CourseForm from "../../components/courses/CourseForm";
import CourseTable from "../../components/courses/CourseTable";
import {
  getCourses,
  addCourse,
  updateCourse,
  deleteCourse,
} from "../../services/courseService";

function Courses() {
  const [courses, setCourses] = useState([]);
  const [editingCourse, setEditingCourse] = useState(null);
  const [error, setError] = useState("");

  const loadCourses = async () => {
    try {
      const data = await getCourses();
      setCourses(data);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load courses");
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  const handleSubmit = async (payload) => {
    setError("");
    try {
      if (editingCourse) {
        await updateCourse(editingCourse.id, payload);
      } else {
        await addCourse(payload);
      }
      setEditingCourse(null);
      await loadCourses();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to save course");
    }
  };

  const handleDelete = async (id) => {
    setError("");
    try {
      await deleteCourse(id);
      await loadCourses();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to delete course");
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Course Management</h1>
        <p className="text-sm text-slate-300">Create and maintain course details from the admin panel.</p>
      </div>

      <CourseForm onSubmit={handleSubmit} initialData={editingCourse} />

      {editingCourse ? (
        <button
          type="button"
          onClick={() => setEditingCourse(null)}
          className="rounded-lg bg-white/10 px-3 py-1.5 text-sm transition hover:bg-white/20"
        >
          Cancel Edit
        </button>
      ) : null}

      {error ? <Card className="text-rose-300">{error}</Card> : null}

      <CourseTable courses={courses} onEdit={setEditingCourse} onDelete={handleDelete} />
    </div>
  );
}

export default Courses;

