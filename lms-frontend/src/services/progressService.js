import api from "../api/axios";
import { API_ENDPOINTS } from "../api/endpoints";

export const markLessonComplete = async (lessonId) => {
  try {
    const response = await api.post(`${API_ENDPOINTS.PROGRESS.COMPLETE_LESSON}/${lessonId}`);
    return response.data;
  } catch (error) {
    console.error(`API ERROR marking lesson ${lessonId} complete:`, error.response || error);
    throw error;
  }
};

export const getCourseProgress = async (courseId) => {
  try {
    const response = await api.get(`${API_ENDPOINTS.PROGRESS.COURSE_PROGRESS}/${courseId}`);
    return response.data;
  } catch (error) {
    console.error(`API ERROR fetching course ${courseId} progress:`, error.response || error);
    throw error;
  }
};

export const getCompletedLessons = async (courseId) => {
  try {
    const response = await api.get(`${API_ENDPOINTS.PROGRESS.COMPLETED_LESSONS}/${courseId}`);
    return response.data;
  } catch (error) {
    console.error(`API ERROR fetching completed lessons for course ${courseId}:`, error.response || error);
    throw error;
  }
};

export const getAdminStudentProgress = async () => {
  try {
    const response = await api.get(API_ENDPOINTS.PROGRESS.ADMIN_STUDENT_PROGRESS);
    return response.data;
  } catch (error) {
    console.error("API ERROR fetching admin student progress:", error.response || error);
    throw error;
  }
};
