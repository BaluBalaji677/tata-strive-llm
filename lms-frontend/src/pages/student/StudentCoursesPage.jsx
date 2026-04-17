import { useEffect, useState } from "react";
import { getCourses } from "../../api/courseApi";
import CourseCard from "../../components/course/CourseCard";

const normalizeCourse = (course) => ({
  id: course?.id ?? `${course?.name ?? course?.title ?? "course"}`,
  name: course?.name ?? course?.title ?? "Untitled Course",
  description: course?.description ?? "No description available.",
  instructor: course?.instructor ?? course?.instructorName ?? null,
});

function StudentCoursesPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCourses()
      .then((data) => {
        const list = Array.isArray(data) ? data.map(normalizeCourse) : [];
        setCourses(list);
      })
      .catch(() => setCourses([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">My Courses</h1>
        <p className="text-sm text-slate-300">Browse your enrolled courses.</p>
      </div>

      {loading ? (
        <p className="text-sm text-slate-300">Loading courses...</p>
      ) : courses.length === 0 ? (
        <div className="glass rounded-2xl p-4">
          <p className="text-sm text-slate-300">No courses available.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      )}
    </div>
  );
}

export default StudentCoursesPage;

