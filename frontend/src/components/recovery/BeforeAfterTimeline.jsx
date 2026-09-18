/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from "react";
import {
  AlertTriangle,
  MoveRight,
  Clock,
  CheckCircle2,
  XCircle,
  AlertOctagon,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { computeScheduleDiff } from "../../utils/scheduleHelpers";
import { formatMinutesToTime, formatDuration } from "../../utils/formatters";
import { ScheduleTimeline } from "../schedule/ScheduleTimeline";

export function BeforeAfterTimeline({
  baselineSchedule = [],
  currentSchedule = [],
  operatingRooms = [],
  activePlan = null,
  onSelectProcedure,
}) {
  const diffs = useMemo(() => {
    return computeScheduleDiff(baselineSchedule, currentSchedule);
  }, [baselineSchedule, currentSchedule]);

  // Group diff summary counters
  const summary = useMemo(() => {
    let emergencies = 0;
    let moved = 0;
    let delayed = 0;
    let cancelled = 0;
    let unchanged = 0;
    let overrun = 0;
    let substituted = 0;

    diffs.forEach((d) => {
      if (d.statusChange === "EMERGENCY") emergencies++;
      else if (d.statusChange === "OVERRUN") overrun++;
      else if (d.statusChange === "SUBSTITUTED") substituted++;
      else if (d.statusChange === "MOVED") moved++;
      else if (d.statusChange === "DELAYED") delayed++;
      else if (d.statusChange === "CANCELLED") cancelled++;
      else if (d.statusChange === "UNCHANGED") unchanged++;
    });

    return { emergencies, moved, delayed, cancelled, unchanged, overrun, substituted };
  }, [diffs]);

  return (
    <div className="space-y-6">
      {/* Top Impact Tally Badges */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs transition-colors">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              Schedule Disruption & Recovery Impact Analysis
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Comparing original baseline against recovered OR schedule (
              {activePlan ? activePlan.strategy : "Current Plan"}).
            </p>
          </div>
          <span className="text-xs font-mono font-semibold px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md border border-slate-200 dark:border-slate-700">
            Engine: Greedy Constraint Recovery
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800">
            <span className="text-[11px] font-semibold text-red-700 dark:text-red-400 block flex items-center gap-1">
              <AlertOctagon className="w-3 h-3" />
              Emergency
            </span>
            <span className="text-lg font-bold text-red-900 dark:text-red-300 font-mono">
              {summary.emergencies} Case
            </span>
          </div>

          <div className="p-2.5 rounded-lg bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800">
            <span className="text-[11px] font-semibold text-purple-700 dark:text-purple-400 block flex items-center gap-1">
              <MoveRight className="w-3 h-3" />
              Moved OR
            </span>
            <span className="text-lg font-bold text-purple-900 dark:text-purple-300 font-mono">
              {summary.moved} Surgeries
            </span>
          </div>

          <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800">
            <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 block flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Delayed
            </span>
            <span className="text-lg font-bold text-amber-900 dark:text-amber-300 font-mono">
              {summary.delayed} Surgeries
            </span>
          </div>

          <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800">
            <span className="text-[11px] font-semibold text-rose-700 dark:text-rose-400 block flex items-center gap-1">
              <XCircle className="w-3 h-3" />
              Cancelled
            </span>
            <span className="text-lg font-bold text-rose-900 dark:text-rose-300 font-mono">
              {summary.cancelled} Surgeries
            </span>
          </div>

          <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800">
            <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 block flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Unchanged
            </span>
            <span className="text-lg font-bold text-emerald-900 dark:text-emerald-300 font-mono">
              {summary.unchanged} Surgeries
            </span>
          </div>
        </div>

        {/* Dynamic disruption tags for Overrun & Substitution */}
        {(summary.overrun > 0 || summary.substituted > 0) && (
          <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex-wrap">
            {summary.overrun > 0 && (
              <span className="text-xs px-2.5 py-1 rounded bg-orange-50 dark:bg-orange-950/60 text-orange-800 dark:text-orange-300 border border-orange-200 dark:border-orange-800 font-semibold flex items-center gap-1.5">
                <span>⏱️</span>
                <span>{summary.overrun} Overrunning Case Absorbed</span>
              </span>
            )}
            {summary.substituted > 0 && (
              <span className="text-xs px-2.5 py-1 rounded bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800 font-semibold flex items-center gap-1.5">
                <span>👨‍⚕️</span>
                <span>{summary.substituted} Surgeon Substitutions</span>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Procedure-by-Procedure Transition Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs transition-colors">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850/80">
          <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Detailed Procedure State Transitions
          </h4>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                <th className="p-3 pl-4">Procedure</th>
                <th className="p-3">Patient ID</th>
                <th className="p-3">Surgeon</th>
                <th className="p-3 text-center">Baseline Slot</th>
                <th className="p-3 text-center">Recovered Slot</th>
                <th className="p-3">Transition Impact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {diffs.map((diff) => {
                let badgeStyle = "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700";
                if (diff.statusChange === "EMERGENCY") {
                  badgeStyle = "bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300 border-red-300 dark:border-red-800 font-bold animate-pulse";
                } else if (diff.statusChange === "OVERRUN") {
                  badgeStyle = "bg-orange-100 dark:bg-orange-950 text-orange-800 dark:text-orange-300 border-orange-300 dark:border-orange-800 font-bold";
                } else if (diff.statusChange === "SUBSTITUTED") {
                  badgeStyle = "bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 border-teal-300 dark:border-teal-800 font-bold";
                } else if (diff.statusChange === "MOVED") {
                  badgeStyle = "bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-800 font-bold";
                } else if (diff.statusChange === "DELAYED") {
                  badgeStyle = "bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800 font-bold";
                } else if (diff.statusChange === "CANCELLED") {
                  badgeStyle = "bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800 font-bold";
                } else if (diff.statusChange === "UNCHANGED") {
                  badgeStyle = "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800";
                }

                return (
                  <tr
                    key={diff.id}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="p-3 pl-4">
                      <span className="font-semibold text-slate-900 dark:text-white block">
                        {diff.procedureName}
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                        {diff.id}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-slate-600 dark:text-slate-400">
                      {diff.patientMockId}
                    </td>
                    <td className="p-3 text-slate-700 dark:text-slate-300 font-medium">
                      {diff.surgeonName || "Surgeon"}
                    </td>
                    <td className="p-3 text-center text-slate-600 dark:text-slate-400 font-mono">
                      {diff.baselineOr ? (
                        <span>
                          <strong>{diff.baselineOr}</strong> @{" "}
                          {formatMinutesToTime(diff.baselineStart, false)}
                        </span>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-600 italic">None</span>
                      )}
                    </td>
                    <td className="p-3 text-center text-slate-800 dark:text-slate-200 font-mono">
                      {diff.recoveredOr ? (
                        <span className="font-bold text-sky-800 dark:text-sky-300">
                          <strong>{diff.recoveredOr}</strong> @{" "}
                          {formatMinutesToTime(diff.recoveredStart, false)}
                        </span>
                      ) : (
                        <span className="text-rose-600 dark:text-rose-400 font-bold">Cancelled</span>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] uppercase px-2 py-0.5 rounded border ${badgeStyle}`}
                        >
                          {diff.statusChange}
                        </span>
                        <span className="text-[11px] text-slate-600 dark:text-slate-400 truncate max-w-xs">
                          {diff.detailText}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Side-by-Side Synchronized Timelines: BEFORE vs AFTER */}
      <div className="space-y-4">
        {/* Baseline (Before) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                1. BEFORE EMERGENCY (Baseline Constraint Schedule)
              </h4>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              Uninterrupted 8 Procedures Scheduled
            </span>
          </div>
          <ScheduleTimeline
            schedule={baselineSchedule}
            operatingRooms={operatingRooms}
            onSelectProcedure={onSelectProcedure}
            showLegend={false}
          />
        </div>

        {/* Recovered (After) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                2. AFTER RECOVERY (Emergency Accommodated via {activePlan ? activePlan.strategy : "Selected Strategy"})
              </h4>
            </div>
            <span className="text-xs text-red-600 dark:text-red-400 font-semibold font-mono">
              Emergency Accommodated in OR-1 at 09:30
            </span>
          </div>
          <ScheduleTimeline
            schedule={currentSchedule}
            operatingRooms={operatingRooms}
            onSelectProcedure={onSelectProcedure}
            showEmergencyMarker={true}
            emergencyTime={570}
            showLegend={true}
          />
        </div>
      </div>
    </div>
  );
}
