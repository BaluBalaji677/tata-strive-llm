import React from "react";
import { motion } from "framer-motion";

function ModuleItemCard({
  index,
  title,
  subtitle,
  meta = [],
  isActive = false,
  accent = "indigo",
  onClick,
  actions,
}) {
  const accentStyles =
    accent === "emerald"
      ? {
          badge: "border-emerald-400/15 bg-emerald-500/12 text-emerald-200",
          bubble: isActive
            ? "bg-emerald-500 text-slate-950"
            : "bg-emerald-500/12 text-emerald-200 group-hover:bg-emerald-500/20",
          activeCard: "border-emerald-400/20 bg-emerald-500/[0.08]",
        }
      : {
          badge: "border-indigo-400/15 bg-indigo-500/12 text-indigo-100",
          bubble: isActive
            ? "bg-indigo-500 text-white"
            : "bg-indigo-500/12 text-indigo-100 group-hover:bg-indigo-500/20",
          activeCard: "border-indigo-400/20 bg-indigo-500/[0.08]",
        };

  return (
    <motion.div
      layout
      onClick={onClick}
      className={`group rounded-2xl border px-3 py-3.5 transition duration-200 ${
        isActive
          ? accentStyles.activeCard
          : "border-white/8 bg-white/[0.03] hover:-translate-y-0.5 hover:border-white/12 hover:bg-white/[0.05] hover:shadow-[0_14px_36px_-28px_rgba(148,163,184,0.8)]"
      } ${onClick ? "cursor-pointer" : ""}`}
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${accentStyles.badge} ${accentStyles.bubble}`}
          >
            {index}
          </div>

          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-slate-100" title={title}>
              {title}
            </div>
            {subtitle && (
              <div className="mt-1 text-xs text-slate-400">
                {subtitle}
              </div>
            )}
            {meta.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {meta.map((item, metaIndex) => (
                  <span
                    key={`${item?.label ?? "meta"}-${metaIndex}`}
                    className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-[11px] text-slate-300"
                  >
                    {item?.label}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {actions ? (
          <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto lg:justify-end">
            {actions}
          </div>
        ) : null}
      </div>
    </motion.div>
  );
}

export default ModuleItemCard;
