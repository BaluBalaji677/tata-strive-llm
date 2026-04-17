import { useEffect, useMemo, useRef, useState } from "react";
import StatCard from "../../components/StatCard";
import AttendanceChart from "../../charts/AttendanceChart";
import StudentStatusChart from "../../charts/StudentStatusChart";
import { getAllStudents } from "../../services/studentService";
import ProfileCard from "../../components/ProfileCard";
import { getProfile } from "../../services/profileService";
import { getCourses } from "../../api/courseApi";

function AdminDashboardPage() {
  const [students, setStudents] = useState([]);
  const [coursesCount, setCoursesCount] = useState(0);
  const [profile, setProfile] = useState(null);
  const didFetchRef = useRef(false);

  useEffect(() => {
    if (didFetchRef.current) return;
    didFetchRef.current = true;
    
    Promise.allSettled([
      getAllStudents(),
      getProfile(),
      getCourses()
    ]).then(([studentsRes, profileRes, coursesRes]) => {
      if (studentsRes.status === "fulfilled" && Array.isArray(studentsRes.value)) {
        setStudents(studentsRes.value);
      }
      if (profileRes.status === "fulfilled" && profileRes.value) {
        setProfile(profileRes.value);
      }
      if (coursesRes.status === "fulfilled" && Array.isArray(coursesRes.value)) {
        setCoursesCount(coursesRes.value.length);
      }
    });
  }, []);

  const statusCounts = useMemo(() => {
    return students.reduce(
      (acc, s) => {
        if (s?.status === "ACTIVE") acc.ACTIVE += 1;
        else if (s?.status === "WARNING") acc.WARNING += 1;
        else if (s?.status === "REJECTED") acc.REJECTED += 1;
        return acc;
      },
      { ACTIVE: 0, WARNING: 0, REJECTED: 0 }
    );
  }, [students]);

  const presentCount = statusCounts.ACTIVE + statusCounts.WARNING;
  const absentCount = statusCounts.REJECTED;

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-sm text-slate-300">Attendance Overview and student health insights.</p>
      </div>

      {profile && (
        <ProfileCard 
          profile={profile} 
          stats={[
            { label: "Total Students", value: students.length },
            { label: "Total Courses", value: coursesCount }
          ]} 
        />
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Total Students" value={students.length} hint="From student management API" />
        <StatCard title="Active Students" value={statusCounts.ACTIVE} hint="Status = ACTIVE" />
        <StatCard title="System Health" value="Backend Connected" hint="Spring Boot API live" />
      </div>

      {students.length === 0 ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-white/20 bg-white/10 p-4 shadow-lg backdrop-blur-xl">
            <div className="mb-3 h-5 w-44 animate-pulse rounded bg-white/20" />
            <div className="h-64 animate-pulse rounded bg-white/10" />
          </div>
          <div className="rounded-xl border border-white/20 bg-white/10 p-4 shadow-lg backdrop-blur-xl">
            <div className="mb-3 h-5 w-56 animate-pulse rounded bg-white/20" />
            <div className="h-64 animate-pulse rounded bg-white/10" />
          </div>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <AttendanceChart presentCount={presentCount} absentCount={absentCount} />
          <StudentStatusChart students={students} />
        </div>
      )}
    </div>
  );
}

export default AdminDashboardPage;

