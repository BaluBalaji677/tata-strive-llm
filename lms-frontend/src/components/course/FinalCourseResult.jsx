import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";
import { getCourseCertificate } from "../../api/certificateApi";

const FinalCourseResult = ({ courseId }) => {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [certificate, setCertificate] = useState(null);
  const [certificateLoading, setCertificateLoading] = useState(false);
  const [certificateError, setCertificateError] = useState("");

  useEffect(() => {
    if (!courseId) return;

    const fetchResult = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/api/student/progress/course/${courseId}/completion`);
        const resultData = response?.data;
        setResult(resultData);

        if (resultData?.status === "PASS") {
          setCertificateLoading(true);
          setCertificateError("");
          try {
            const certificateData = await getCourseCertificate(courseId);
            setCertificate(certificateData);
          } catch (certificateRequestError) {
            if (certificateRequestError?.response?.status !== 404) {
              console.error("Failed to load certificate", certificateRequestError);
            }
            setCertificate(null);
            if (certificateRequestError?.response?.status !== 404) {
              setCertificateError("Certificate is not available yet.");
            }
          } finally {
            setCertificateLoading(false);
          }
        }
      } catch (err) {
        setError("Failed to load final course result.");
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [courseId]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="animate-pulse text-slate-400">Calculating final course results...</p>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-rose-400">{error || "Result not available."}</p>
      </div>
    );
  }

  const isPass = result?.status === "PASS";

  return (
    <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col items-center justify-center p-8">
      <div className={`relative w-full overflow-hidden rounded-2xl border p-8 text-center ${
        isPass
          ? "border-emerald-500/30 bg-emerald-900/20 shadow-[0_0_50px_-12px_rgba(16,185,129,0.3)]"
          : "border-rose-500/30 bg-rose-900/20 shadow-[0_0_50px_-12px_rgba(244,63,94,0.3)]"
      }`}>
        <div className={`absolute left-1/2 top-0 -z-10 h-32 w-64 -translate-x-1/2 blur-[80px] ${isPass ? "bg-emerald-500/20" : "bg-rose-500/20"}`}></div>

        <div className="mb-6">
          <div className="group relative mb-6 inline-flex h-32 w-32 items-center justify-center">
            <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 100 100">
              <circle className="stroke-current text-white/10" strokeWidth="8" cx="50" cy="50" r="40" fill="transparent"></circle>
              <circle
                className={`${isPass ? "text-emerald-500" : "text-rose-500"} stroke-current transition-all duration-1000 ease-out`}
                strokeWidth="8"
                strokeLinecap="round"
                cx="50"
                cy="50"
                r="40"
                fill="transparent"
                strokeDasharray={`${2 * Math.PI * 40}`}
                strokeDashoffset={`${2 * Math.PI * 40 * (1 - (result?.percentage || 0) / 100)}`}
              ></circle>
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              {isPass ? (
                <svg className="mb-1 h-10 w-10 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="mb-1 h-10 w-10 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </div>
          </div>
          <h2 className="mb-2 text-3xl font-bold text-white">
            {isPass ? "Congratulations! Course Completed Successfully" : "Course Completed, but minimum score not achieved"}
          </h2>
          <p className="text-slate-400">
            {isPass
              ? "You've successfully completed all modules and passed the coding tasks. Great job!"
              : "You've completed the content, but your final score didn't meet the passing criteria (40%). Review the tasks and try again."}
          </p>
        </div>

        <div className="my-8 grid grid-cols-2 gap-4">
          <div className="rounded-xl border border-white/5 bg-black/30 p-4">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">Total Score</p>
            <p className="text-2xl font-mono text-white">{result?.obtainedScore} <span className="text-lg text-slate-500">/ {result?.totalScore}</span></p>
          </div>
          <div className="rounded-xl border border-white/5 bg-black/30 p-4">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">Percentage</p>
            <p className={`text-2xl font-mono font-bold ${isPass ? "text-emerald-400" : "text-rose-400"}`}>{result?.percentage}%</p>
          </div>
          <div className="rounded-xl border border-white/5 bg-black/30 p-4">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">Modules</p>
            <p className="text-xl font-mono text-white">{result?.completedModulesCount} <span className="text-base text-slate-500">/ {result?.totalModulesCount}</span></p>
          </div>
          <div className="rounded-xl border border-white/5 bg-black/30 p-4">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">Tasks Passed</p>
            <p className="text-xl font-mono text-white">{result?.completedTasksCount} <span className="text-base text-slate-500">/ {result?.totalTasksCount}</span></p>
          </div>
          <div className="col-span-2 rounded-xl border border-white/5 bg-black/30 p-4">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">Completion Date</p>
            <p className="text-lg font-mono text-white">{new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}</p>
          </div>
        </div>

        {isPass && (
          <div className="mb-8 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-5 text-left">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-amber-300">Certificate</p>
                <h3 className="mt-2 text-lg font-semibold text-white">
                  {certificate?.certificateName || "Course certificate pending"}
                </h3>
                <p className="mt-1 text-sm text-slate-300">
                  {certificate?.certificateUrl
                    ? "Your certificate is ready to download."
                    : certificateLoading
                    ? "Checking certificate availability..."
                    : "The admin has not uploaded a certificate yet."}
                </p>
                {certificateError && <p className="mt-2 text-sm text-rose-300">{certificateError}</p>}
              </div>
              <a
                href={certificate?.certificateUrl ? `http://localhost:8080${certificate.certificateUrl}` : undefined}
                target="_blank"
                rel="noreferrer"
                className={`inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold transition ${
                  certificate?.certificateUrl
                    ? "bg-amber-400 text-slate-950 hover:bg-amber-300"
                    : "cursor-not-allowed bg-white/10 text-slate-500"
                }`}
                onClick={(event) => {
                  if (!certificate?.certificateUrl) {
                    event.preventDefault();
                  }
                }}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v12m0 0l4-4m-4 4l-4-4M4 20h16" />
                </svg>
                {certificateLoading ? "Checking..." : "Download Certificate"}
              </a>
            </div>
          </div>
        )}

        <div className="mt-8 flex justify-center space-x-4 border-t border-white/10 pt-6">
          <Link
            to="/student/courses"
            className="rounded-lg bg-white/10 px-6 py-2.5 font-medium text-white transition-colors hover:bg-white/15"
          >
            Back to Dashboard
          </Link>
          {!isPass && (
            <button
              onClick={() => window.location.reload()}
              className="rounded-lg bg-rose-500/80 px-6 py-2.5 font-medium text-white shadow-sm shadow-rose-500/20 transition-colors hover:bg-rose-500"
            >
              Retry Tasks
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default FinalCourseResult;
