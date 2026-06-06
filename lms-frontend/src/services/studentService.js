import api from "../api/axios";
import { API_ENDPOINTS } from "../api/endpoints";
import { getUsername } from "../utils/token";

const getLocalStudentsKey = () => `lms_admin_students_ui_${getUsername() || "anonymous"}`;

const readLocalStudents = () => {
  try {
    const raw = localStorage.getItem(getLocalStudentsKey());
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeLocalStudents = (students) => {
  localStorage.setItem(getLocalStudentsKey(), JSON.stringify(students));
};

const normalizeStudent = (student) => ({
  id: student?.id,
  fullName: student?.fullName ?? student?.name ?? "",
  email: student?.email ?? student?.username ?? "",
  username: student?.username ?? student?.email ?? "",
  rollNumber: student?.rollNumber ?? "",
  status: student?.status ?? "ACTIVE",
  courseId: student?.courseId ?? null,
  courseTitle: student?.courseTitle ?? "",
});

// Admin: get all students list
export const getAllStudents = async () => {
  try {
    const response = await api.get(API_ENDPOINTS.STUDENT.BASE);
    if (Array.isArray(response.data)) {
      return response.data.map((student) =>
        normalizeStudent({
          ...student,
          email: student?.email ?? student?.username ?? "",
        })
      );
    }
    throw new Error("Unexpected students response");
  } catch (error) {
    if (error?.response) {
      throw error;
    }
    return readLocalStudents();
  }
};

export const addStudent = async (payload) => {
  const requestBody = {
    fullName: payload?.fullName ?? "",
    username: payload?.username ?? "",
    rollNumber: payload?.rollNumber ?? "",
    status: payload?.status ?? "ACTIVE",
    courseId: payload?.courseId ?? null,
  };

  try {
    const { data } = await api.post(API_ENDPOINTS.STUDENT.BASE, requestBody);
    return normalizeStudent(data ?? requestBody);
  } catch (error) {
    if (error?.response) {
      throw error;
    }
    const list = readLocalStudents();
    const student = {
      id: Date.now(),
      ...requestBody,
      email: requestBody.username ?? "",
      courseTitle: payload?.courseTitle ?? "",
    };
    const next = [student, ...list];
    writeLocalStudents(next);
    return student;
  }
};

export const updateStudent = async (id, payload) => {
  const requestBody = {
    fullName: payload?.fullName ?? "",
    username: payload?.username ?? "",
    rollNumber: payload?.rollNumber ?? "",
    status: payload?.status ?? "ACTIVE",
    courseId: payload?.courseId ?? null,
  };

  try {
    const { data } = await api.put(`${API_ENDPOINTS.STUDENT.BASE}/${id}`, requestBody);
    return normalizeStudent(data ?? { id, ...requestBody });
  } catch (error) {
    if (error?.response) {
      throw error;
    }
    const list = readLocalStudents();
    const next = list.map((s) =>
      s.id === id
        ? {
            ...s,
            fullName: requestBody.fullName || s.fullName,
            email: requestBody.username || s.email,
            username: requestBody.username || s.username,
            rollNumber: requestBody.rollNumber || s.rollNumber,
            status: requestBody.status || s.status,
            courseId: requestBody.courseId ?? s.courseId,
            courseTitle: payload?.courseTitle ?? s.courseTitle,
          }
        : s
    );
    writeLocalStudents(next);
    return next.find((s) => s.id === id) ?? null;
  }
};

export const deleteStudent = async (id) => {
  try {
    await api.delete(`${API_ENDPOINTS.STUDENT.BASE}/${id}`);
    return { success: true };
  } catch (error) {
    if (error?.response) {
      throw error;
    }
    const list = readLocalStudents();
    const next = list.filter((s) => s.id !== id);
    writeLocalStudents(next);
    return { success: true };
  }
};

export const resetStudentPassword = async (studentId, payload) => {
  const { data } = await api.put(`/admin/students/${studentId}/reset-password`, payload);
  return data;
};
