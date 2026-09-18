/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Activity, AlertOctagon, CheckCircle2, RotateCcw, Clock } from "lucide-react";

export function RecentEventsList({ events = [] }) {
  if (!events || events.length === 0) {
    return (
      <div className="p-6 text-center text-xs text-slate-400 italic">
        No recent operational events recorded.
      </div>
    );
  }

  const getEventIcon = (type) => {
    switch (type) {
      case "EMERGENCY_DETECTED":
        return <AlertOctagon className="w-3.5 h-3.5 text-red-600" />;
      case "RECOVERY_APPLIED":
        return <CheckCircle2 className="w-3.5 h-3.5 text-sky-600" />;
      case "SIMULATION_RESET":
        return <RotateCcw className="w-3.5 h-3.5 text-amber-600" />;
      default:
        return <Activity className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  const getBadgeStyle = (badge) => {
    switch (badge) {
      case "Critical":
        return "bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800";
      case "Applied":
        return "bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800";
      case "Success":
        return "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800";
      case "Reset":
        return "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800";
      default:
        return "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700";
    }
  };

  return (
    <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-72 overflow-y-auto">
      {events.map((ev) => (
        <div
          key={ev.id}
          className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex items-start gap-3"
        >
          <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 mt-0.5">
            {getEventIcon(ev.type)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                {ev.title}
              </span>
              <div className="flex items-center gap-2 shrink-0">
                <span
                  className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${getBadgeStyle(
                    ev.badge
                  )}`}
                >
                  {ev.badge}
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono flex items-center gap-0.5">
                  <Clock className="w-2.5 h-2.5" />
                  {ev.timestamp}
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
              {ev.description}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
