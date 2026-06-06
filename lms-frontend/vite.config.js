import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const target = "https://tata-strive-llm-1.onrender.com";
const bypass = (req) => {
  if (req.headers.accept?.includes("text/html") || req.headers.accept?.includes("html")) {
    return "/index.html";
  }
};

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": { target },
      "/auth": { target },
      "/admin/attendance": { target, bypass },
      "/admin/tasks": { target, bypass },
      "/admin/quizzes": { target, bypass },
      "/admin/student-progress": { target, bypass },
      "^/admin/course(?:/.*)?$": { target, bypass },
      "^/admin/module(?:/.*)?$": { target, bypass },
      "^/admin/lesson(?:/.*)?$": { target, bypass },
      "/admin/submissions": { target, bypass },
      "/admin/change-password": { target, bypass },
      "/admin/students": { target, bypass },
      "/student/attendance": { target, bypass },
      "/student/tasks": { target, bypass },
      "/student/quizzes": { target, bypass },
      "/student/submissions": { target, bypass },
      "/student/change-password": { target, bypass },
      "/principal": { target, bypass },
      "/students": { target, bypass },
      "/courses": { target, bypass },
      "/course": { target, bypass },
      "/lesson": { target, bypass },
      "/face": { target, bypass },
      "/uploads": { target },
    },
  },
});

