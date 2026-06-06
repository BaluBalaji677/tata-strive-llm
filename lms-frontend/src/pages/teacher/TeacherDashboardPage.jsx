import { useEffect, useState } from "react";
import StatCard from "../../components/StatCard";
import ProfileCard from "../../components/ProfileCard";
import { getCourses } from "../../api/courseApi";
import { getProfile } from "../../services/profileService";

function TeacherDashboardPage() {
  const [stats, setStats] = useState({
    courses: 0,
    students: 0,
  });
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [coursesData, profileData] = await Promise.all([
          getCourses(),
          getProfile(),
        ]);

        setStats({
          courses: coursesData.length || 0,
          students: 0, // Can be populated later with actual student count
        });
        setProfile(profileData);
      } catch (err) {
        setError(err?.message || "Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <p className="text-center text-gray-400">Loading...</p>;
  if (error) return <p className="text-center text-rose-400">{error}</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Teacher Dashboard</h1>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <StatCard label="Courses" value={stats.courses} />
        <StatCard label="Students" value={stats.students} />
      </div>

      {profile && <ProfileCard profile={profile} />}

      <div className="rounded-lg border border-white/10 bg-white/5 p-6">
        <h2 className="mb-4 text-xl font-semibold">Quick Links</h2>
        <ul className="space-y-2 text-sm text-gray-300">
          <li>• Manage your assigned courses</li>
          <li>• Track student progress</li>
          <li>• Review submitted tasks</li>
          <li>• Manage attendance records</li>
        </ul>
      </div>
    </div>
  );
}

export default TeacherDashboardPage;
