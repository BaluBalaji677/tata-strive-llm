import api from "./axios";
import { API_ENDPOINTS } from "./endpoints";

export const getMySubmissions = async () => {
  const { data } = await api.get(API_ENDPOINTS.SUBMISSION.STUDENT_SUBMISSIONS);
  return data;
};

