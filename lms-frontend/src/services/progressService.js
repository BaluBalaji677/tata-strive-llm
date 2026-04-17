import api from "../api/axios";

export const markLessonComplete = async (lessonId) => {
  try {
    const response = await api.post(`/api/student/progress/complete/${lessonId}`);
    return response.data;
  } catch (error) {
    console.error(`API ERROR marking lesson ${lessonId} complete:`, error.response || error);
    throw error;
  }
};

export const getCourseProgress = async (courseId) => {
  try {
    const response = await api.get(`/api/student/progress/course/${courseId}`);
    return response.data;
  } catch (error) {
    console.error(`API ERROR fetching course ${courseId} progress:`, error.response || error);
    throw error;
  }
};

export const getCompletedLessons = async (courseId) => {
  try {
    const response = await api.get(`/api/student/progress/completed/${courseId}`);
    return response.data;
  } catch (error) {
    console.error(`API ERROR fetching completed lessons for course ${courseId}:`, error.response || error);
    throw error;
  }
};
