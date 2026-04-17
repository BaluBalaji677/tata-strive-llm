import api from "../api/axios";

// Admin: mark attendance for a student
export const markStudentAttendance = async ({ rollNumber, present }) => {
  const { data } = await api.post("/admin/attendance", null, {
    params: { rollNumber, present },
  });
  return data;
};

// Admin: fetch all attendance history
export const getAllAttendanceHistory = async (rollNumber = "") => {
  const { data } = await api.get("/admin/attendance", {
    params: { rollNumber: rollNumber || undefined },
  });
  return Array.isArray(data) ? data : [];
};

// Student: own attendance list
export const getMyAttendance = async () => {
  const { data } = await api.get("/student/attendance");
  return Array.isArray(data) ? data : [];
};

// Student: own attendance summary
export const getMyAttendanceSummary = async () => {
  const { data } = await api.get("/student/attendance-summary");
  return data;
};

