import React, { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { getCourseById } from "../services/courseService";
import { getCompletedLessons, getCourseProgress } from "../services/progressService";
import { getStudentSubmissions, getModuleLockStatus } from "../api/moduleTaskApi";
import { getProfile as getStudentProfile } from "../services/profileService";
import CourseSidebar from "../components/CourseSidebar";
import LessonViewerPage from "./LessonViewerPage";
import ModuleTaskViewer from "../components/course/ModuleTaskViewer";
import FinalCourseResult from "../components/course/FinalCourseResult";
import { SidebarSkeleton, ContentSkeleton } from "../components/common/Skeletons";

const CourseDetailPage = () => {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  
  const [completedLessons, setCompletedLessons] = useState([]);
  const [taskSubmissions, setTaskSubmissions] = useState([]);
  const [progressData, setProgressData] = useState({ percentage: 0, completedLessons: 0, totalLessons: 0 });
  const [isAuthenticatedStudent, setIsAuthenticatedStudent] = useState(false);
  const [moduleStatuses, setModuleStatuses] = useState({});
  const [showFinalResult, setShowFinalResult] = useState(false);
  const [courseCompletion, setCourseCompletion] = useState(null);

  const statusesCacheRef = React.useRef({ id: null, length: -1, auth: null, statuses: null });

  const fetchModuleStatuses = async (forceRefetch = false) => {
    if (!course?.modules || !isAuthenticatedStudent) {
      if (course?.modules && !isAuthenticatedStudent) {
        const statuses = {};
        course.modules.forEach(m => statuses[m.id] = true);
        setModuleStatuses(statuses);
      }
      return;
    }

    if (!forceRefetch) {
      const cache = statusesCacheRef.current;
      if (cache.id === course?.id && cache.length === taskSubmissions.length && cache.auth === isAuthenticatedStudent) {
        if (cache.statuses) setModuleStatuses(cache.statuses);
        return;
      }
    }

    try {
      const results = await Promise.all(
        course.modules.map(m =>
          getModuleLockStatus(m.id)
            .then(res => ({ id: m.id, completed: res.completed }))
            .catch(() => ({ id: m.id, completed: true }))
        )
      );
      const statuses = {};
      results.forEach(r => statuses[r.id] = r.completed);
      setModuleStatuses(statuses);
      statusesCacheRef.current = { id: course.id, length: taskSubmissions.length, auth: isAuthenticatedStudent, statuses };
    } catch (err) {
      console.error("Error fetching module statuses", err);
    }
  };

  useEffect(() => {
    fetchModuleStatuses();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [course?.id, taskSubmissions.length, isAuthenticatedStudent]);

  useEffect(() => {
    const fetchCourseAndProgress = async () => {
      setLoading(true);
      try {
        const [courseData, completedData, progressStats, profile] = await Promise.all([
          getCourseById(id),
          getCompletedLessons(id).catch(() => []),
          getCourseProgress(id).catch(() => ({ percentage: 0, completedLessons: 0, totalLessons: 0 })),
          getStudentProfile().catch(() => null)
        ]);
        
        if (profile) {
          console.log("Resolved Student Profile:", profile);
          if (profile.id) {
            setIsAuthenticatedStudent(true);
            const submissions = await getStudentSubmissions(profile.id).catch(() => []);
            setTaskSubmissions(submissions);
          } else {
            console.warn("Student ID is missing in profile, skipping getStudentSubmissions");
          }
        }

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
      handleLessonSelect(nextLesson);
    }
  };

  const handleLessonSelect = (lesson) => {
    setShowFinalResult(false);
    setSelectedTask(null);
    setSelectedLesson(lesson);
  };

  const handleTaskSelect = (task) => {
    setShowFinalResult(false);
    setSelectedLesson(null);
    setSelectedTask(task);
  };

  const handleTaskSubmissionSuccess = async () => {
    try {
      // Refresh module lock statuses after task pass
      await fetchModuleStatuses(true);

      // Refresh course progress
      await fetchProgressStats?.();

      // We should also refresh task submissions so the new score is in our state
      if (isAuthenticatedStudent && course) {
        const profile = await getStudentProfile().catch(() => null);
        if (profile?.id) {
           const submissions = await getStudentSubmissions(profile.id).catch(() => []);
           setTaskSubmissions(submissions);
        }
      }

      console.log("Task submission success handled");
    } catch (error) {
      console.error("Failed to refresh module status:", error);
    }
  };

  const flatLessons = useMemo(() => {
    if (!course?.modules) return [];
    return course.modules.flatMap(m => m.lessons || []);
  }, [course]);

  const currentLessonIndex = flatLessons.findIndex(l => l.id === selectedLesson?.id);
  const prevLesson = currentLessonIndex > 0 ? flatLessons[currentLessonIndex - 1] : null;
  const nextLessonCandidate = currentLessonIndex >= 0 && currentLessonIndex < flatLessons.length - 1 ? flatLessons[currentLessonIndex + 1] : null;
  
  const isNextModuleLocked = useMemo(() => {
    if (!nextLessonCandidate || !course?.modules) return false;
    const nextModuleIndex = course.modules.findIndex(m => m.id === nextLessonCandidate.module?.id || m.lessons?.some(l => l.id === nextLessonCandidate.id));
    if (nextModuleIndex > 0) {
      const prevModuleId = course.modules[nextModuleIndex - 1].id;
      if (moduleStatuses[prevModuleId] === false) {
        return true;
      }
    }
    return false;
  }, [nextLessonCandidate, course, moduleStatuses]);

  const nextLesson = isNextModuleLocked ? null : nextLessonCandidate;

  if (loading) {
    return (
      <div className="flex flex-col h-screen bg-[#0b0f19] text-white overflow-hidden">
        <div className="flex flex-1 overflow-hidden relative">
          <div className="w-80 border-r border-white/10 flex flex-col h-full shrink-0">
            <SidebarSkeleton />
          </div>
          <div className="flex-1 h-full overflow-y-auto pb-6 relative">
            <ContentSkeleton />
          </div>
        </div>
      </div>
    );
  }

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
            selectedTask={selectedTask}
            onSelectLesson={handleLessonSelect}
            onSelectTask={handleTaskSelect}
            completedLessons={completedLessons}
            taskSubmissions={taskSubmissions}
            isAuthenticatedStudent={isAuthenticatedStudent}
            moduleStatuses={moduleStatuses}
            onShowFinalResult={setShowFinalResult}
          />
        </div>

        <div className="flex-1 h-full overflow-y-auto bg-[#0b0f19] flex flex-col">
          <div className="block md:hidden mb-4 border-b border-white/10 pb-2 px-4 shadow-sm bg-white/5">
            <h3 className="font-semibold text-slate-200 py-2">Course Modules</h3>
            <div className="h-40 overflow-y-auto w-full border border-white/10 rounded-lg bg-black/20">
              <CourseSidebar 
                course={course} 
                selectedLesson={selectedLesson}
                selectedTask={selectedTask}
                onSelectLesson={handleLessonSelect}
                onSelectTask={handleTaskSelect}
                completedLessons={completedLessons}
                taskSubmissions={taskSubmissions}
                isAuthenticatedStudent={isAuthenticatedStudent}
                moduleStatuses={moduleStatuses}
                onShowFinalResult={setShowFinalResult}
              />
            </div>
          </div>
          
          <div className="flex-1 h-full overflow-y-auto pb-6 relative">
              {selectedLesson ? (
                <LessonViewerPage 
                  lessonId={selectedLesson?.id} 
                  prevLesson={prevLesson}
                  nextLesson={nextLessonCandidate}
                  isNextModuleLocked={isNextModuleLocked}
                  onNavigate={handleLessonSelect}
                  isCompleted={completedLessons.includes(selectedLesson?.id)}
                  onLessonCompleted={handleLessonCompleted}
                />
              ) : showFinalResult ? (
                <FinalCourseResult courseId={id} />
              ) : selectedTask ? (
                <ModuleTaskViewer 
                  task={selectedTask}
                  courseId={id}
                  submissions={taskSubmissions}
                  onSubmissionSuccess={handleTaskSubmissionSuccess}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-slate-500 text-lg">Select a lesson or task from the sidebar to begin.</p>
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetailPage;
