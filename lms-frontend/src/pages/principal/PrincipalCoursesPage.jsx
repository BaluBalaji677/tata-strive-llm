import { useState, useEffect } from "react";
import { getAuth } from "../../utils/token";

function PrincipalCoursesPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const auth = getAuth();
      const response = await fetch("/api/principal/courses", {
        headers: {
          Authorization: `Bearer ${auth?.accessToken}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch courses");
      const data = await response.json();
      setCourses(data.courses || []);
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
        <h1 className="text-3xl font-bold text-white">All Courses</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-48 bg-white/10 rounded-lg animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">All Courses</h1>

      {error && (
        <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 text-red-400">
          {error}
        </div>
      )}

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.length === 0 ? (
          <div className="col-span-full bg-white/5 border border-white/10 rounded-lg p-8 text-center text-gray-400">
            No courses found
          </div>
        ) : (
          courses.map((course) => (
            <div
              key={course.id}
              className="bg-gradient-to-br from-white/10 to-white/5 border border-white/10 rounded-lg p-6 hover:border-white/20 transition"
            >
              <h3 className="text-white font-bold text-lg mb-2">
                {course.title}
              </h3>
              <p className="text-gray-400 text-sm mb-4 line-clamp-3">
                {course.description || "No description"}
              </p>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">
                  ID: {course.id}
                </span>
                <span className="px-2 py-1 bg-sky-500/20 text-sky-400 rounded text-xs">
                  Active
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default PrincipalCoursesPage;
