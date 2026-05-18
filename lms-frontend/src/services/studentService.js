import api from "../api/axios";
import { API_ENDPOINTS } from "../api/endpoints";

const LOCAL_STUDENTS_KEY = "lms_admin_students_ui";

const readLocalStudents = () => {
  try {
    const raw = localStorage.getItem(LOCAL_STUDENTS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeLocalStudents = (students) => {
  localStorage.setItem(LOCAL_STUDENTS_KEY, JSON.stringify(students));
};

const normalizeStudent = (student) => ({
  id: student?.id,
  fullName: student?.fullName ?? student?.name ?? "",
  email: student?.email ?? student?.username ?? "",
  username: student?.username ?? student?.email ?? "",
  rollNumber: student?.rollNumber ?? "",
  status: student?.status ?? "ACTIVE",
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
    return readLocalStudents();
  } catch {
    return readLocalStudents();
  }
};

export const addStudent = async (payload) => {
  const requestBody = {
    fullName: payload?.fullName ?? "",
    username: payload?.username ?? "",
    rollNumber: payload?.rollNumber ?? "",
    status: payload?.status ?? "ACTIVE",
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
