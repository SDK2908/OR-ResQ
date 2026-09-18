/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { formatMinutesToTime, formatDuration } from "../../utils/formatters";
import { AlertCircle, Clock, Sparkles } from "lucide-react";

export function ScheduleBlock({
  procedure,
  onClick,
  dayStartMinutes = 480, // 08:00
  totalDayMinutes = 600, // 10 hours: 08:00 to 18:00
  diffStatus = null, // "EMERGENCY" | "MOVED" | "DELAYED" | "UNCHANGED" | "CANCELLED"
}) {
  const startMin = procedure.startTime ?? 480;
  const durationMin = procedure.duration ?? 60;

  // Calculate percentage placement
  const leftPercent = Math.max(
    0,
    Math.min(100, ((startMin - dayStartMinutes) / totalDayMinutes) * 100)
  );
  const widthPercent = Math.max(
    3,
    Math.min(100 - leftPercent, (durationMin / totalDayMinutes) * 100)
  );

  const isEmergency =
    procedure.isEmergency ||
    procedure.status === "EMERGENCY" ||
    diffStatus === "EMERGENCY" ||
    (procedure.priority === "CRITICAL" && procedure.procedureName?.toLowerCase().includes("emergency"));

  const isMoved = procedure.status === "MOVED" || diffStatus === "MOVED";
  const isDelayed = procedure.status === "DELAYED" || diffStatus === "DELAYED";
  const isCancelled = procedure.status === "CANCELLED" || diffStatus === "CANCELLED";
  const isOverrun = procedure.status === "OVERRUN" || diffStatus === "OVERRUN";
  const isSubstituted = procedure.status === "SUBSTITUTED" || diffStatus === "SUBSTITUTED";

  // Visual Theme
  let blockStyles = "bg-sky-50 dark:bg-sky-950/60 border-sky-300 dark:border-sky-800/80 text-sky-950 dark:text-sky-100 hover:bg-sky-100 dark:hover:bg-sky-900/60";
  let badgeColor = "bg-sky-200 dark:bg-sky-900 text-sky-800 dark:text-sky-200";
  let borderLeft = "border-l-4 border-l-sky-600 dark:border-l-sky-400";

  if (isEmergency) {
    blockStyles =
      "bg-red-50 dark:bg-red-950/70 border-red-400 dark:border-red-700 text-red-950 dark:text-red-100 hover:bg-red-100 dark:hover:bg-red-900/70 shadow-md ring-2 ring-red-400 dark:ring-red-500 animate-pulse";
    badgeColor = "bg-red-600 text-white font-bold";
    borderLeft = "border-l-4 border-l-red-600 dark:border-l-red-500";
  } else if (isCancelled) {
    blockStyles =
      "bg-rose-50/70 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 opacity-60 line-through cursor-not-allowed";
    badgeColor = "bg-rose-200 dark:bg-rose-900 text-rose-800 dark:text-rose-200";
    borderLeft = "border-l-4 border-l-rose-400 dark:border-l-rose-600";
  } else if (isOverrun) {
    blockStyles =
      "bg-orange-50 dark:bg-orange-950/60 border-orange-400 dark:border-orange-700 text-orange-950 dark:text-orange-100 hover:bg-orange-100 dark:hover:bg-orange-900/60 shadow-xs ring-1 ring-orange-400 dark:ring-orange-600";
    badgeColor = "bg-orange-600 text-white font-bold";
    borderLeft = "border-l-4 border-l-orange-600 dark:border-l-orange-500";
  } else if (isSubstituted) {
    blockStyles =
      "bg-teal-50 dark:bg-teal-950/60 border-teal-300 dark:border-teal-800 text-teal-950 dark:text-teal-100 hover:bg-teal-100 dark:hover:bg-teal-900/60 shadow-xs";
    badgeColor = "bg-teal-600 text-white font-semibold";
    borderLeft = "border-l-4 border-l-teal-600 dark:border-l-teal-400";
  } else if (isMoved) {
    blockStyles =
      "bg-purple-50 dark:bg-purple-950/60 border-purple-300 dark:border-purple-800 text-purple-950 dark:text-purple-100 hover:bg-purple-100 dark:hover:bg-purple-900/60 shadow-xs";
    badgeColor = "bg-purple-600 text-white font-semibold";
    borderLeft = "border-l-4 border-l-purple-600 dark:border-l-purple-400";
  } else if (isDelayed) {
    blockStyles =
      "bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800 text-amber-950 dark:text-amber-100 hover:bg-amber-100 dark:hover:bg-amber-900/60 shadow-xs";
    badgeColor = "bg-amber-600 text-white font-semibold";
    borderLeft = "border-l-4 border-l-amber-600 dark:border-l-amber-400";
  } else if (procedure.priority === "HIGH") {
    blockStyles = "bg-blue-50 dark:bg-blue-950/60 border-blue-300 dark:border-blue-800 text-blue-950 dark:text-blue-100 hover:bg-blue-100 dark:hover:bg-blue-900/60";
    badgeColor = "bg-blue-200 dark:bg-blue-900 text-blue-800 dark:text-blue-200";
    borderLeft = "border-l-4 border-l-blue-600 dark:border-l-blue-400";
  }

  return (
    <div
      onClick={() => onClick(procedure)}
      className={`absolute top-1.5 bottom-1.5 rounded-md border text-left p-1.5 overflow-hidden transition-all duration-150 cursor-pointer select-none group z-10 ${blockStyles} ${borderLeft}`}
      style={{
        left: `${leftPercent}%`,
        width: `${widthPercent}%`,
        minWidth: "60px",
      }}
      title={`${procedure.procedureName} | ${procedure.surgeonName || procedure.surgeonId} (${formatMinutesToTime(startMin)} - ${formatMinutesToTime(startMin + durationMin)})`}
    >
      {/* Top row: Priority / Status Tag + Time */}
      <div className="flex items-center justify-between gap-1 mb-0.5 leading-none">
        <div className="flex items-center gap-1 overflow-hidden">
          {isEmergency && <AlertCircle className="w-3 h-3 text-red-600 dark:text-red-400 shrink-0" />}
          <span
            className={`text-[10px] uppercase tracking-wide px-1 py-0.2 rounded font-mono truncate ${badgeColor}`}
          >
            {isEmergency
              ? "CRITICAL"
              : isOverrun
              ? "OVERRUN"
              : isSubstituted
              ? "SUB SURGEON"
              : isMoved
              ? "MOVED"
              : isDelayed
              ? "DELAYED"
              : isCancelled
              ? "CANCELLED"
              : procedure.priority || "NORMAL"}
          </span>
        </div>
        <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 shrink-0 font-medium">
          {formatMinutesToTime(startMin, false)}
        </span>
      </div>

      {/* Procedure Name */}
      <div className="font-semibold text-xs leading-tight truncate">
        {procedure.procedureName}
      </div>

      {/* Surgeon & Duration */}
      <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 leading-none">
        <span className="truncate max-w-[70%] font-medium">
          {procedure.surgeonName || procedure.surgeonId}
        </span>
        <span className="shrink-0 text-slate-500 dark:text-slate-400 font-mono text-[10px]">
          {durationMin}m
        </span>
      </div>
    </div>
  );
}
