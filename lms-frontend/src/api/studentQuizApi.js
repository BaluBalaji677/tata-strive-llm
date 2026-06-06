import api from "./axios";
import { API_ENDPOINTS } from "./endpoints";

export const getStudentQuizzes = async () => {
  const { data } = await api.get(API_ENDPOINTS.QUIZ.STUDENT_BASE);
  return data;
};

export const getStudentQuizDetails = async (id) => {
  const { data } = await api.get(`${API_ENDPOINTS.QUIZ.STUDENT_BASE}/${id}`);
  return data;
};

export const submitStudentQuiz = async (id, submissionData) => {
  const { data } = await api.post(`${API_ENDPOINTS.QUIZ.STUDENT_BASE}/${id}/submit`, submissionData);
  return data;
};
