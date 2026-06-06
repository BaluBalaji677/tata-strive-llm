import api from "./axios";
import { API_ENDPOINTS } from "./endpoints";

export const getAdminTasks = async (params) => {
  const { data } = await api.get(API_ENDPOINTS.ADMIN_TASK.BASE, { params });
  return data;
};

export const getAdminTaskDetails = async (id) => {
  const { data } = await api.get(`${API_ENDPOINTS.ADMIN_TASK.BASE}/${id}`);
  return data;
};

export const createAdminTask = async (taskData) => {
  const { data } = await api.post(API_ENDPOINTS.ADMIN_TASK.BASE, taskData);
  return data;
};

export const updateAdminTask = async (id, taskData) => {
  const { data } = await api.put(`${API_ENDPOINTS.ADMIN_TASK.BASE}/${id}`, taskData);
  return data;
};

export const deleteAdminTask = async (id) => {
  const { data } = await api.delete(`${API_ENDPOINTS.ADMIN_TASK.BASE}/${id}`);
  return data;
};
