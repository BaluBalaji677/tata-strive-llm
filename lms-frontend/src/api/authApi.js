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

export const changeStudentPassword = async (payload) => {
  const { data } = await api.post("/student/change-password", payload);
  return data;
};

