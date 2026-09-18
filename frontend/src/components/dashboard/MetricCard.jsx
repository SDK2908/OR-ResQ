/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";

export function MetricCard({
  title,
  value,
  subtext,
  icon: Icon,
  trend,
  trendPositive = true,
  badgeText,
  badgeColor = "bg-slate-100 text-slate-700",
  className = "",
  id,
}) {
  return (
    <div
      id={id}
      className={`bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col justify-between transition-colors ${className}`}
    >
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          {title}
        </span>
        {Icon && (
          <div className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-400 flex items-center justify-center shrink-0 border border-sky-100 dark:border-sky-900/50">
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="flex items-baseline justify-between gap-2 mt-1">
        <span className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight font-mono">
          {value}
        </span>
        {badgeText && (
          <span
            className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${badgeColor}`}
          >
            {badgeText}
          </span>
        )}
      </div>

      {subtext && (
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 truncate flex items-center gap-1">
          {subtext}
        </p>
      )}
    </div>
  );
}
