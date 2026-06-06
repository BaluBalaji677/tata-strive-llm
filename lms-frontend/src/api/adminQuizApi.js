import api from "./axios";
import { API_ENDPOINTS } from "./endpoints";

export const getAdminQuizzes = async (params) => {
  const { data } = await api.get(API_ENDPOINTS.QUIZ.ADMIN_BASE, { params });
  return data;
};

export const getAdminQuizDetails = async (id) => {
  const { data } = await api.get(`${API_ENDPOINTS.QUIZ.ADMIN_BASE}/${id}`);
  return data;
};

export const createAdminQuiz = async (quizData) => {
  const { data } = await api.post(API_ENDPOINTS.QUIZ.ADMIN_BASE, quizData);
  return data;
};

export const updateAdminQuiz = async (id, quizData) => {
  const { data } = await api.put(`${API_ENDPOINTS.QUIZ.ADMIN_BASE}/${id}`, quizData);
  return data;
};

export const deleteAdminQuiz = async (id) => {
  const { data } = await api.delete(`${API_ENDPOINTS.QUIZ.ADMIN_BASE}/${id}`);
  return data;
};

export const getQuizSubmissions = async (params) => {
  const { data } = await api.get(API_ENDPOINTS.QUIZ.ADMIN_SUBMISSIONS, { params });
  return data;
};

export const getQuizAnalytics = async (id) => {
  const { data } = await api.get(`${API_ENDPOINTS.QUIZ.ADMIN_BASE}/${id}/analytics`);
  return data;
};
