import api from "./axios";
import { API_ENDPOINTS } from "./endpoints";

const normalizeLoginResponse = (data, defaultRole) => ({
  accessToken: data.accessToken || data.token || data,
  refreshToken: data.refreshToken || null,
  role: data.role || defaultRole,
  username: data.username || data?.rollNumber || null,
  mustChangePassword: Boolean(data.mustChangePassword),
});

export const adminLogin = async (payload) => {
  const { data } = await api.post(API_ENDPOINTS.AUTH.ADMIN_LOGIN, payload);
  return normalizeLoginResponse(data, "ADMIN");
};

export const studentLogin = async (payload) => {
  const { data } = await api.post(API_ENDPOINTS.AUTH.STUDENT_LOGIN, payload);
  return normalizeLoginResponse(data, "STUDENT");
};

export const changeStudentPassword = async (payload) => {
  const { data } = await api.post(API_ENDPOINTS.STUDENT.CHANGE_PASSWORD, payload);
  return data;
};

