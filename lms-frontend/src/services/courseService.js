import api from "../api/axios";

const LOCAL_COURSES_KEY = "lms_admin_courses_ui";

const readLocalCourses = () => {
  try {
    const raw = localStorage.getItem(LOCAL_COURSES_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeLocalCourses = (courses) => {
  localStorage.setItem(LOCAL_COURSES_KEY, JSON.stringify(courses));
};

const normalizeCourse = (course) => ({
  id: course?.id,
  // Backend may return "title" while frontend expects "name"
  name: course?.name ?? course?.title ?? "",
  duration: Number(course?.duration ?? 0),
});

// If backend course list API exists, use it. Otherwise fallback to local UI data.
export const getCourses = async () => {
  try {
    const response = await api.get("/courses");
    // Don't arbitrarily strip fields like description via normalizeCourse
    return response.data;
  } catch (error) {
    console.error("API ERROR:", error.response || error);
    // Fallback to local courses if API absolutely fails
    return readLocalCourses();
  }
};

// Frontend-only CRUD fallback (no backend changes required)
export const addCourse = async (payload) => {
  const requestBody = {
    title: payload?.title ?? "",
    description: payload?.description ?? "",
    duration: Number(payload?.duration ?? 0),
  };

  // Try backend first
  try {
    const { data } = await api.post("/admin/course", requestBody);
    return data;
  } catch {
    // Frontend fallback storage only if API is unavailable
    const list = readLocalCourses();
    const course = {
      id: Date.now(),
      title: requestBody.title,
      description: requestBody.description,
      duration: requestBody.duration,
    };
    const next = [course, ...list];
    writeLocalCourses(next);
    return course;
  }
};

export const updateCourse = async (id, payload) => {
  const requestBody = {
    name: payload?.name ?? "",
    duration: Number(payload?.duration ?? 0),
  };

  // Try backend first
  try {
    const { data } = await api.put(`/courses/${id}`, requestBody);
    return normalizeCourse(data ?? { id, ...requestBody });
  } catch {
    // Frontend fallback storage only if API is unavailable
    const list = readLocalCourses();
    const next = list.map((c) =>
      c.id === id
        ? { ...c, name: requestBody.name || c.name, duration: requestBody.duration }
        : c
    );
    writeLocalCourses(next);
    return next.find((c) => c.id === id) ?? null;
  }
};

export const deleteCourse = async (id) => {
  // Try backend first
  try {
    await api.delete(`/courses/${id}`);
    return { success: true };
  } catch {
    // Frontend fallback storage only if API is unavailable
    const list = readLocalCourses();
    const next = list.filter((c) => c.id !== id);
    writeLocalCourses(next);
    return { success: true };
  }
};

export const getCourseById = async (id) => {
  try {
    const { data } = await api.get(`/course/${id}`);
    return data;
  } catch (error) {
    console.error(`API ERROR fetching course ${id}:`, error.response || error);
    throw error;
  }
};

export const getLessonById = async (id) => {
  try {
    const { data } = await api.get(`/lesson/${id}`);
    return data;
  } catch (error) {
    console.error(`API ERROR fetching lesson ${id}:`, error.response || error);
    throw error;
  }
};

export const addModule = async (payload) => {
  try {
    const { data } = await api.post("/admin/module", payload);
    return data;
  } catch (error) {
    console.error("API ERROR adding module:", error.response || error);
    throw error;
  }
};

export const addLesson = async (payload) => {
  try {
    const { data } = await api.post("/admin/lesson", payload);
    return data;
  } catch (error) {
    console.error("API ERROR adding lesson:", error.response || error);
    throw error;
  }
};

export const updateAdminCourse = async (id, payload) => {
  try {
    const { data } = await api.put(`/admin/course/${id}`, payload);
    return data;
  } catch (error) {
    console.error(`API ERROR updating admin course ${id}:`, error.response || error);
    throw error;
  }
};

export const deleteAdminCourse = async (id) => {
  try {
    const { data } = await api.delete(`/admin/course/${id}`);
    return data;
  } catch (error) {
    console.error(`API ERROR deleting admin course ${id}:`, error.response || error);
    throw error;
  }
};

export const updateModule = async (id, title) => {
  try {
    const { data } = await api.put(`/admin/module/${id}`, { title });
    return data;
  } catch (error) {
    console.error(`API ERROR updating module ${id}:`, error.response || error);
    throw error;
  }
};

export const deleteModule = async (id) => {
  try {
    const { data } = await api.delete(`/admin/module/${id}`);
    return data;
  } catch (error) {
    console.error(`API ERROR deleting module ${id}:`, error.response || error);
    throw error;
  }
};

export const updateLesson = async (id, payload) => {
  try {
    const { data } = await api.put(`/admin/lesson/${id}`, payload);
    return data;
  } catch (error) {
    console.error(`API ERROR updating lesson ${id}:`, error.response || error);
    throw error;
  }
};

export const deleteLesson = async (id) => {
  try {
    const { data } = await api.delete(`/admin/lesson/${id}`);
    return data;
  } catch (error) {
    console.error(`API ERROR deleting lesson ${id}:`, error.response || error);
    throw error;
  }
};
