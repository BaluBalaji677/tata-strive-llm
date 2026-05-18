import api from "./axios";
import { API_ENDPOINTS } from "./endpoints";

export const getStudentTasks = async () => {
  const { data } = await api.get(API_ENDPOINTS.STUDENT.TASKS);
  return data;
};

