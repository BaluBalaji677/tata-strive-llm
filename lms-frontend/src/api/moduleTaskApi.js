import api from "./axios";
import { API_ENDPOINTS } from "./endpoints";

export const createModuleTask = async (taskData) => {
  const response = await api.post(API_ENDPOINTS.MODULE_TASK.TASKS, taskData);
  return response.data;
};

export const updateModuleTask = async (taskId, taskData) => {
  const response = await api.put(`${API_ENDPOINTS.MODULE_TASK.TASKS}/${taskId}`, taskData);
  return response.data;
};

export const deleteModuleTask = async (taskId) => {
  await api.delete(`${API_ENDPOINTS.MODULE_TASK.TASKS}/${taskId}`);
};

export const getTasksByModule = async (moduleId) => {
  const response = await api.get(`${API_ENDPOINTS.MODULE_TASK.TASKS_BY_MODULE}/${moduleId}`);
  return response.data;
};

export const submitTaskCode = async (studentId, taskId, code) => {
  const response = await api.post(API_ENDPOINTS.MODULE_TASK.SUBMISSIONS, { studentId, taskId, code });
  return response.data;
};

export const getStudentSubmissions = async (studentId) => {
  const response = await api.get(`${API_ENDPOINTS.MODULE_TASK.SUBMISSIONS_BY_STUDENT}/${studentId}`);
  return response.data;
};

export const getModuleLockStatus = async (moduleId) => {
  const response = await api.get(`${API_ENDPOINTS.MODULE_TASK.MODULE_STATUS}/${moduleId}/status`);
  return response.data;
};
