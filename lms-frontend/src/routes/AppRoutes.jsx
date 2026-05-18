import { Navigate, Route, Routes } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import LoginPage from "../pages/auth/LoginPage";
import ChangePasswordPage from "../pages/auth/ChangePasswordPage";
import AdminDashboardPage from "../pages/admin/AdminDashboardPage";
import AdminAttendancePage from "../pages/admin/AdminAttendancePage";
import Students from "../pages/admin/Students";
import Courses from "../pages/admin/Courses";
import AdminCourseDetailPage from "../pages/admin/AdminCourseDetailPage";
import AdminStudentProgressPage from "../pages/admin/AdminStudentProgressPage";
import StudentDashboardPage from "../pages/student/StudentDashboardPage";
import StudentAttendancePage from "../pages/student/StudentAttendancePage";
import StudentSummaryPage from "../pages/student/StudentSummaryPage";
import StudentTasksPage from "../pages/student/StudentTasksPage";
import StudentCoursesPage from "../pages/student/StudentCoursesPage";
import StudentNotificationsPage from "../pages/student/StudentNotificationsPage";
import StudentLayout from "../layouts/StudentLayout";
import ProtectedRoute from "./ProtectedRoute";
import ProfilePage from "../pages/common/ProfilePage";

import CourseListPage from "../pages/CourseListPage";
import CourseDetailPage from "../pages/CourseDetailPage";

// Principal components (to be created)
import PrincipalDashboardPage from "../pages/principal/PrincipalDashboardPage";
import PrincipalTeachersPage from "../pages/principal/PrincipalTeachersPage";
import PrincipalStudentsPage from "../pages/principal/PrincipalStudentsPage";
import PrincipalCoursesPage from "../pages/principal/PrincipalCoursesPage";
import PrincipalAnalyticsPage from "../pages/principal/PrincipalAnalyticsPage";

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute allowedRoles={["STUDENT"]} />}>
        <Route path="/change-password" element={<ChangePasswordPage />} />
      </Route>

      {/* ============ PRINCIPAL ROUTES (Super Admin) ============ */}
      <Route element={<ProtectedRoute allowedRoles={["PRINCIPAL"]} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/principal/dashboard" element={<PrincipalDashboardPage />} />
          <Route path="/principal/teachers" element={<PrincipalTeachersPage />} />
          <Route path="/principal/students" element={<PrincipalStudentsPage />} />
          <Route path="/principal/courses" element={<PrincipalCoursesPage />} />
          <Route path="/principal/analytics" element={<PrincipalAnalyticsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
      </Route>

      {/* ============ SHARED ROUTES (Admin & Student) ============ */}
      <Route element={<ProtectedRoute allowedRoles={["ADMIN", "STUDENT"]} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/courses" element={<CourseListPage />} />
          <Route path="/course/:id" element={<CourseDetailPage />} />
        </Route>
      </Route>

      {/* ============ ADMIN ROUTES (Teachers) ============ */}
      <Route element={<ProtectedRoute allowedRoles={["ADMIN"]} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
          <Route path="/admin/attendance" element={<AdminAttendancePage />} />
          <Route path="/admin/students" element={<Students />} />
          <Route path="/admin/student-progress" element={<AdminStudentProgressPage />} />
          <Route path="/admin/courses" element={<Courses />} />
          <Route path="/admin/course/:id" element={<AdminCourseDetailPage />} />
        </Route>
      </Route>

      {/* ============ STUDENT ROUTES ============ */}
      <Route element={<ProtectedRoute allowedRoles={["STUDENT"]} />}>
        <Route element={<StudentLayout />}>
          <Route path="/student/dashboard" element={<StudentDashboardPage />} />
          <Route path="/student/courses" element={<StudentCoursesPage />} />
          <Route path="/student/tasks" element={<StudentTasksPage />} />
          <Route path="/student/notifications" element={<StudentNotificationsPage />} />
          <Route path="/student/attendance" element={<StudentAttendancePage />} />
          <Route path="/student/summary" element={<StudentSummaryPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default AppRoutes;

