import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { createModuleTask, updateModuleTask } from "../../api/moduleTaskApi";

const DEFAULT_TEST_CASE = { input: "", expectedOutput: "", isHidden: false };

const normalizeTestCases = (testCases) => {
  if (!Array.isArray(testCases) || testCases.length === 0) {
    return [{ ...DEFAULT_TEST_CASE }];
  }

  return testCases.map((testCase) => ({
    input: testCase?.input ?? "",
    expectedOutput: testCase?.expectedOutput ?? "",
    isHidden: Boolean(testCase?.isHidden),
  }));
};

const buildInitialState = (task) => ({
  title: task?.title ?? "",
  description: task?.description ?? "",
  language: task?.language ?? "java",
  difficulty: task?.difficulty ?? "MEDIUM",
  maxScore: task?.maxScore ?? 10,
  testCases: normalizeTestCases(task?.testCases),
});

function ModuleTaskFormModal({ isVisible, onClose, moduleId, task, mode = "create", onTaskSaved }) {
  const isEditMode = mode === "edit";
  const [formState, setFormState] = useState(() => buildInitialState(task));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const modalTitle = useMemo(
    () => (isEditMode ? "Edit Coding Task" : "Create New Coding Task"),
    [isEditMode]
  );

  useEffect(() => {
    if (!isVisible) return;
    setFormState(buildInitialState(task));
    setError("");
    setIsSubmitting(false);
  }, [isVisible, task, mode]);

  if (!isVisible) return null;

  const handleFieldChange = (field, value) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddTestCase = () => {
    setFormState((prev) => ({
      ...prev,
      testCases: [...prev.testCases, { ...DEFAULT_TEST_CASE }],
    }));
  };

  const handleTestCaseChange = (index, field, value) => {
    setFormState((prev) => ({
      ...prev,
      testCases: prev.testCases.map((testCase, testIndex) =>
        testIndex === index ? { ...testCase, [field]: value } : testCase
      ),
    }));
  };

  const handleRemoveTestCase = (index) => {
    setFormState((prev) => ({
      ...prev,
      testCases:
        prev.testCases.length === 1
          ? [{ ...DEFAULT_TEST_CASE }]
          : prev.testCases.filter((_, testIndex) => testIndex !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const payload = {
        moduleId,
        title: formState.title.trim(),
        description: formState.description.trim(),
        language: formState.language,
        difficulty: formState.difficulty,
        maxScore: Number(formState.maxScore),
        testCases: (formState.testCases ?? []).filter(
          (testCase) => testCase?.input?.trim() || testCase?.expectedOutput?.trim()
        ),
      };

      const savedTask = isEditMode
        ? await updateModuleTask(task?.id, payload)
        : await createModuleTask(payload);

      onTaskSaved?.(savedTask);
      onClose?.();
    } catch (submitError) {
      console.error(`Failed to ${isEditMode ? "update" : "create"} task`, submitError);
      setError(submitError?.response?.data?.message || `Failed to ${isEditMode ? "update" : "create"} task.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.98 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.98),rgba(2,6,23,0.98))] p-6 shadow-[0_32px_90px_-36px_rgba(15,23,42,1)]"
        >
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-white">{modalTitle}</h2>
              <p className="mt-2 text-sm text-slate-400">
                {isEditMode ? "Update the problem details and test cases." : "Add a new coding challenge to this module."}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-300 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-400">
            Module ID: <span className="font-medium text-slate-200">{moduleId ?? "Unavailable"}</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">Task Title</label>
              <input
                required
                value={formState.title}
                onChange={(e) => handleFieldChange("title", e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-white outline-none transition focus:border-emerald-400/50 focus:bg-black/35"
                placeholder="Two Sum Variant"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">Description</label>
              <textarea
                required
                rows={5}
                value={formState.description}
                onChange={(e) => handleFieldChange("description", e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-white outline-none transition focus:border-emerald-400/50 focus:bg-black/35"
                placeholder="Describe the problem statement, input format, and expected output."
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Language</label>
                <select
                  value={formState.language}
                  onChange={(e) => handleFieldChange("language", e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-white outline-none transition focus:border-emerald-400/50"
                >
                  <option value="java">Java</option>
                  <option value="python">Python</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Difficulty</label>
                <select
                  value={formState.difficulty}
                  onChange={(e) => handleFieldChange("difficulty", e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-white outline-none transition focus:border-emerald-400/50"
                >
                  <option value="EASY">Easy</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HARD">Hard</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Max Score</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formState.maxScore}
                  onChange={(e) => handleFieldChange("maxScore", e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-white outline-none transition focus:border-emerald-400/50"
                />
              </div>
            </div>

            <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-white">Test Cases</h3>
                  <p className="text-sm text-slate-400">Each expected output is used to grade submissions.</p>
                </div>
                <button
                  type="button"
                  onClick={handleAddTestCase}
                  className="inline-flex h-10 items-center gap-2 rounded-2xl border border-indigo-400/20 bg-indigo-500/15 px-4 text-sm font-semibold text-indigo-200 transition hover:border-indigo-300/40 hover:bg-indigo-500/25"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Test Case
                </button>
              </div>

              <div className="space-y-4">
                {(formState.testCases ?? []).map((testCase, index) => (
                  <motion.div
                    key={`test-case-${index}`}
                    layout
                    className="rounded-2xl border border-white/10 bg-black/20 p-4"
                  >
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div className="text-sm font-semibold text-slate-200">Case {index + 1}</div>
                      <button
                        type="button"
                        onClick={() => handleRemoveTestCase(index)}
                        className="inline-flex h-9 items-center gap-2 rounded-xl border border-rose-400/15 bg-rose-500/10 px-3 text-xs font-semibold text-rose-200 transition hover:border-rose-300/40 hover:bg-rose-500/20"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18 18 6M6 6l12 12" />
                        </svg>
                        Remove
                      </button>
                    </div>

                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Input</label>
                        <textarea
                          rows={3}
                          value={testCase.input}
                          onChange={(e) => handleTestCaseChange(index, "input", e.target.value)}
                          className="w-full rounded-xl border border-white/10 bg-slate-950/80 p-3 font-mono text-sm text-white outline-none transition focus:border-indigo-400/40"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Expected Output</label>
                        <textarea
                          required
                          rows={3}
                          value={testCase.expectedOutput}
                          onChange={(e) => handleTestCaseChange(index, "expectedOutput", e.target.value)}
                          className="w-full rounded-xl border border-white/10 bg-slate-950/80 p-3 font-mono text-sm text-white outline-none transition focus:border-emerald-400/40"
                        />
                      </div>
                    </div>

                    <label className="mt-3 inline-flex items-center gap-2 text-sm text-slate-400">
                      <input
                        type="checkbox"
                        checked={Boolean(testCase.isHidden)}
                        onChange={(e) => handleTestCaseChange(index, "isHidden", e.target.checked)}
                        className="h-4 w-4 rounded border-white/20 bg-slate-950 text-emerald-400 focus:ring-emerald-400/40"
                      />
                      Hidden test case
                    </label>
                  </motion.div>
                ))}
              </div>
            </div>

            {error && (
              <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                {error}
              </div>
            )}

            <div className="flex flex-wrap justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-11 items-center rounded-2xl border border-white/10 bg-white/5 px-5 text-sm font-medium text-slate-300 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !moduleId}
                className="inline-flex h-11 items-center rounded-2xl bg-emerald-500 px-5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? (isEditMode ? "Saving..." : "Creating...") : isEditMode ? "Save Changes" : "Create Task"}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default ModuleTaskFormModal;
