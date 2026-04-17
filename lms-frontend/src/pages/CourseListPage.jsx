import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getCourses } from "../services/courseService";
import CourseCard from "../components/course/CourseCard";

const CourseListPage = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCourses = async () => {
      console.log("Fetching courses...");
      try {
        const data = await getCourses();
        console.log("Courses response:", data);
        setCourses(data);
      } catch (err) {
        console.error("Fetch courses error:", err);
        setError("Failed to load courses");
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  if (loading) return <div className="p-6 text-center text-gray-500">Loading courses...</div>;
  if (error) return <div className="p-6 text-center text-red-500">{error}</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">All Courses</h1>
      {courses.length === 0 ? (
        <p className="text-gray-500">No courses available.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      )}
    </div>
  );
};

export default CourseListPage;
