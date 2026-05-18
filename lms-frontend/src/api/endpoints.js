export const API_ENDPOINTS = {
  AUTH: {
    ADMIN_LOGIN: "/auth/admin/login",
    STUDENT_LOGIN: "/auth/student/login",
    REFRESH: "/auth/refresh",
  },
  STUDENT: {
    BASE: "/students",
    CHANGE_PASSWORD: "/student/change-password",
    TASKS: "/student/tasks",
  },
  COURSE: {
    COURSES: "/courses",
    COURSE_BY_ID: "/course",
    ADMIN_COURSE: "/admin/course",
  },
  MODULE: {
    ADMIN_MODULE: "/admin/module",
  },
  LESSON: {
    LESSON_BY_ID: "/lesson",
    ADMIN_LESSON: "/admin/lesson",
  },
  MODULE_TASK: {
    TASKS: "/api/tasks",
    TASKS_BY_MODULE: "/api/tasks/module",
    SUBMISSIONS: "/api/submissions",
    SUBMISSIONS_BY_STUDENT: "/api/submissions/student",
    MODULE_STATUS: "/api/modules", 
  },
  SUBMISSION: {
    STUDENT_SUBMISSIONS: "/student/submissions",
    ADMIN_SUBMISSIONS: "/admin/submissions",
  },
  ATTENDANCE: {
    ADMIN: "/admin/attendance",
    STUDENT: "/student/attendance",
    STUDENT_SUMMARY: "/student/attendance-summary",
    ADMIN_REPORT_TODAY: "/admin/attendance/report/today",
    FACE_RECOGNIZE_MULTIPLE: "/api/attendance/face-recognition",
    FACE_REGISTER: "/face/register",
    FACE_RECOGNIZE: "/face/recognize",
  },
  PROGRESS: {
    COMPLETE_LESSON: "/api/student/progress/complete",
    COURSE_PROGRESS: "/api/student/progress/course",
    COMPLETED_LESSONS: "/api/student/progress/completed",
    ADMIN_STUDENT_PROGRESS: "/admin/student-progress",
  },
  PROFILE: {
    BASE: "/api/profile",
    UPLOAD_IMAGE: "/api/profile/upload-image",
  },
  CERTIFICATE: {
    ADMIN_UPLOAD: "/api/admin/courses",
    COURSE_CERTIFICATE: "/api/courses",
  }
};
