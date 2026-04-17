import api from "./axios";

export const markAttendance = async ({ rollNumber, present }) => {
  const { data } = await api.post("/admin/attendance", null, {
    params: { rollNumber, present },
  });
  return data;
};

export const getStudentAttendance = async () => {
  const { data } = await api.get("/student/attendance");
  return data;
};

export const getStudentAttendanceSummary = async () => {
  const { data } = await api.get("/student/attendance-summary");
  return data;
};

