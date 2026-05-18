import api from "../api/axios";
import { API_ENDPOINTS } from "../api/endpoints";

// Admin: mark attendance for a student
export const markStudentAttendance = async ({ rollNumber, present }) => {
  const { data } = await api.post(API_ENDPOINTS.ATTENDANCE.ADMIN, null, {
    params: { rollNumber, present },
  });
  return data;
};

// Admin: fetch all attendance history
export const getAllAttendanceHistory = async (rollNumber = "") => {
  const { data } = await api.get(API_ENDPOINTS.ATTENDANCE.ADMIN, {
    params: { rollNumber: rollNumber || undefined },
  });
  return Array.isArray(data) ? data : [];
};

// Student: own attendance list
export const getMyAttendance = async () => {
  const { data } = await api.get(API_ENDPOINTS.ATTENDANCE.STUDENT);
  return Array.isArray(data) ? data : [];
};

// Student: own attendance summary
export const getMyAttendanceSummary = async () => {
  const { data } = await api.get(API_ENDPOINTS.ATTENDANCE.STUDENT_SUMMARY);
  return data;
};

// Admin: download today's attendance Excel report
export const downloadTodayReport = async () => {
  return api.get(API_ENDPOINTS.ATTENDANCE.ADMIN_REPORT_TODAY, {
    responseType: "blob",
  });
};

