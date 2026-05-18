import api from "./axios";
import { API_ENDPOINTS } from "./endpoints";

export const getCourses = async () => {
  const { data } = await api.get(API_ENDPOINTS.COURSE.COURSES);
  return data;
};

