import api from "./axios";

const normalizeLoginResponse = (data, defaultRole) => ({
  accessToken: data.accessToken || data.token || data,
  refreshToken: data.refreshToken || null,
  role: data.role || defaultRole,
  username: data.username || data?.rollNumber || null,
  mustChangePassword: Boolean(data.mustChangePassword),
});

export const adminLogin = async (payload) => {
  const { data } = await api.post("/auth/admin/login", payload);
  return normalizeLoginResponse(data, "ADMIN");
};

export const studentLogin = async (payload) => {
  const { data } = await api.post("/auth/student/login", payload);
  return normalizeLoginResponse(data, "STUDENT");
};

export const login = async (identifier, password) => {
  const { data } = await api.post("/auth/login", { identifier, password });
  return normalizeLoginResponse(data, null);
};

export const changeStudentPassword = async (payload) => {
  const { data } = await api.post("/student/change-password", payload);
  return data;
};

export const changeAdminPassword = async (payload) => {
  const { data } = await api.post("/admin/change-password", payload);
  return data;
};

export const resetAdminPassword = async (adminId, payload) => {
  const { data } = await api.put(`/principal/admins/${adminId}/reset-password`, payload);
  return data;
};

export const fetchAdmins = async (page = 0, size = 10) => {
  const { data } = await api.get(`/principal/admins?page=${page}&size=${size}`);
  return data;
};

