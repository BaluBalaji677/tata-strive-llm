import api from "./axios";

export const getStudentTasks = async () => {
  const { data } = await api.get("/student/tasks");
  return data;
};

