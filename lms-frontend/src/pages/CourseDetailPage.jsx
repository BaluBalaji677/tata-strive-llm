import React, { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { getCourseById } from "../services/courseService";
import { getCompletedLessons, getCourseProgress } from "../services/progressService";
import CourseSidebar from "../components/CourseSidebar";
import LessonViewerPage from "./LessonViewerPage";

const CourseDetailPage = () => {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedLesson, setSelectedLesson] = useState(null);
  
  const [completedLessons, setCompletedLessons] = useState([]);
  const [progressData, setProgressData] = useState({ percentage: 0, completedLessons: 0, totalLessons: 0 });

  useEffect(() => {
    const fetchCourseAndProgress = async () => {
      setLoading(true);
      try {
        const [courseData, completedData, progressStats] = await Promise.all([
          getCourseById(id),
          getCompletedLessons(id).catch(() => []),
          getCourseProgress(id).catch(() => ({ percentage: 0, completedLessons: 0, totalLessons: 0 }))
        ]);
        
        setCourse(courseData);
        setCompletedLessons(completedData);
        setProgressData(progressStats);

        const flat = courseData?.modules?.flatMap(m => m.lessons || []) || [];
        if (flat.length > 0) {
          // Resume Logic: find first uncompleted lesson
          const firstUncompleted = flat.find(l => !completedData.includes(l.id));
          if (firstUncompleted) {
            setSelectedLesson(firstUncompleted);
          } else {
            // all completed, show last
            setSelectedLesson(flat[flat.length - 1]);
          }
        }
      } catch (err) {
        setError("Failed to load course details.");
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchCourseAndProgress();
    }
  }, [id]);

  const fetchProgressStats = async () => {
    try {
      const stats = await getCourseProgress(id);
      setProgressData(stats);
    } catch {}
  };

  const handleLessonCompleted = (lessonId) => {
    if (!completedLessons.includes(lessonId)) {
      setCompletedLessons((prev) => [...prev, lessonId]);
      fetchProgressStats(); // update percentage directly from DB
    }
    
    // Auto-navigate to next lesson
    if (nextLesson) {
      setSelectedLesson(nextLesson);
    }
  };

  const flatLessons = useMemo(() => {
    if (!course?.modules) return [];
    return course.modules.flatMap(m => m.lessons || []);
  }, [course]);

  const currentLessonIndex = flatLessons.findIndex(l => l.id === selectedLesson?.id);
  const prevLesson = currentLessonIndex > 0 ? flatLessons[currentLessonIndex - 1] : null;
  const nextLesson = currentLessonIndex >= 0 && currentLessonIndex < flatLessons.length - 1 ? flatLessons[currentLessonIndex + 1] : null;

  if (loading) return <div className="p-6 text-center text-gray-500">Loading course...</div>;
  if (error) return <div className="p-6 text-center text-red-500">{error}</div>;
  if (!course) return <div className="p-6 text-center text-gray-500">Course not found.</div>;

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-slate-900 text-slate-200">
      <div className="bg-white/5 border-b border-white/10 px-6 flex flex-col justify-center shadow-sm z-10 shrink-0 backdrop-blur-xl">
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center text-sm font-medium">
            <Link to="/student/courses" className="text-indigo-400 hover:text-indigo-300 transition-colors">Courses</Link>
            <span className="mx-2 text-slate-500">/</span>
            <span className="text-white font-semibold">{course.name || course.title}</span>
          </div>
          <div className="flex items-center space-x-3 text-sm">
            <span className="text-slate-400">
              {progressData.completedLessons} / {progressData.totalLessons} Lessons
            </span>
            <span className="text-emerald-400 font-bold">{progressData.percentage}%</span>
          </div>
        </div>
        {/* Progress Bar */}
        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mb-[-1px]">
          <div 
            className="h-full bg-emerald-500 transition-all duration-500 ease-out" 
            style={{ width: `${progressData?.percentage || 0}%` }}
          />
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="hidden md:block w-full md:w-1/3 lg:w-[30%] xl:w-1/4 h-full shrink-0 shadow-lg border-r border-white/10 z-0 relative bg-white/5 backdrop-blur-sm">
          <CourseSidebar 
            course={course} 
            selectedLesson={selectedLesson}
            onSelectLesson={setSelectedLesson}
            completedLessons={completedLessons}
          />
        </div>

        <div className="flex-1 h-full overflow-y-auto bg-[#0b0f19] flex flex-col">
          <div className="block md:hidden mb-4 border-b border-white/10 pb-2 px-4 shadow-sm bg-white/5">
            <h3 className="font-semibold text-slate-200 py-2">Course Modules</h3>
            <div className="h-40 overflow-y-auto w-full border border-white/10 rounded-lg bg-black/20">
              <CourseSidebar 
                course={course} 
                selectedLesson={selectedLesson}
                onSelectLesson={setSelectedLesson}
                completedLessons={completedLessons}
              />
            </div>
          </div>
          
          <div className="flex-1 h-full overflow-y-auto pb-6 relative">
            <LessonViewerPage 
              lessonId={selectedLesson?.id} 
              prevLesson={prevLesson}
              nextLesson={nextLesson}
              onNavigate={setSelectedLesson}
              isCompleted={completedLessons.includes(selectedLesson?.id)}
              onLessonCompleted={handleLessonCompleted}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetailPage;
