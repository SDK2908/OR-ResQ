/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { ScheduleBlock } from "./ScheduleBlock";
import { DoorClosed, Sparkles, AlertTriangle } from "lucide-react";
import { formatMinutesToTime } from "../../utils/formatters";

// Standard Operating Day: 08:00 (480) to 18:00 (1080) -> 600 min
const DAY_START = 480;
const DAY_END = 1080;
const TOTAL_MINUTES = DAY_END - DAY_START;

// Hours ticks: 08:00, 09:00, 10:00, 11:00, 12:00, 13:00, 14:00, 15:00, 16:00, 17:00, 18:00
const TIME_TICKS = Array.from({ length: 11 }, (_, i) => DAY_START + i * 60);

export function ScheduleTimeline({
  schedule = [],
  operatingRooms = [],
  onSelectProcedure,
  highlightEmergency = false,
  showLegend = true,
  className = "",
  emergencyTime = 570, // 09:30 AM
  showEmergencyMarker = false,
}) {
  // Map procedures by OR ID
  const proceduresByOr = React.useMemo(() => {
    const map = {};
    operatingRooms.forEach((room) => {
      map[room.id] = [];
    });

    schedule.forEach((proc) => {
      const orId = proc.orId || "OR-1";
      if (!map[orId]) map[orId] = [];
      map[orId].push(proc);
    });

    return map;
  }, [schedule, operatingRooms]);

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden transition-colors ${className}`}>
      {/* Horizontal Scrollable Timeline Area */}
      <div className="overflow-x-auto min-w-full">
        <div className="min-w-[920px]">
          {/* Time Header Axis */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/80 sticky top-0 z-20">
            {/* Left OR column header */}
            <div className="w-48 p-3 border-r border-slate-200 dark:border-slate-800 font-semibold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider shrink-0 flex items-center justify-between">
              <span>Operating Room</span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">Cap: 10h</span>
            </div>

            {/* Time ticks header */}
            <div className="flex-1 relative h-10 flex">
              {TIME_TICKS.map((minutes, idx) => {
                const percent = ((minutes - DAY_START) / TOTAL_MINUTES) * 100;
                return (
                  <div
                    key={minutes}
                    className="absolute top-0 bottom-0 flex flex-col justify-end pb-2 transform -translate-x-1/2"
                    style={{ left: `${percent}%` }}
                  >
                    <span className="text-[11px] font-mono font-medium text-slate-600 dark:text-slate-300 select-none">
                      {formatMinutesToTime(minutes, false)}
                    </span>
                    <div className="w-px h-1.5 bg-slate-300 dark:bg-slate-600 mx-auto mt-0.5" />
                  </div>
                );
              })}

              {/* Emergency indicator marker line on time axis */}
              {showEmergencyMarker && (
                <div
                  className="absolute top-0 bottom-0 z-30 flex flex-col items-center transform -translate-x-1/2"
                  style={{
                    left: `${((emergencyTime - DAY_START) / TOTAL_MINUTES) * 100}%`,
                  }}
                >
                  <span className="bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs animate-bounce">
                    09:30 EMERGENCY
                  </span>
                  <div className="w-0.5 flex-1 bg-red-500/80 dashed" />
                </div>
              )}
            </div>
          </div>

          {/* OR Schedule Rows */}
          <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {operatingRooms.map((room) => {
              const rowProcedures = proceduresByOr[room.id] || [];

              // Calculate room utilization from row procedures
              const totalScheduledMin = rowProcedures.reduce(
                (sum, p) => sum + (p.duration || 0),
                0
              );
              const utilization = Math.min(
                100,
                Math.round((totalScheduledMin / TOTAL_MINUTES) * 100)
              );

              return (
                <div key={room.id} className="flex min-h-[82px] hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors group">
                  {/* Left OR Info Column */}
                  <div className="w-48 p-3.5 border-r border-slate-200 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900 group-hover:bg-slate-50/50 dark:group-hover:bg-slate-800/40 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                          <DoorClosed className="w-4 h-4 text-sky-700 dark:text-sky-400" />
                          {room.id}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 font-mono">
                          {utilization}%
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5" title={room.name}>
                        {room.name}
                      </p>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden mt-1.5">
                      <div
                        className={`h-full rounded-full ${
                          utilization > 80
                            ? "bg-amber-500"
                            : utilization > 0
                            ? "bg-sky-600 dark:bg-sky-500"
                            : "bg-slate-200 dark:bg-slate-700"
                        }`}
                        style={{ width: `${utilization}%` }}
                      />
                    </div>
                  </div>

                  {/* Right Timeline Grid Row */}
                  <div className="flex-1 relative min-h-[82px] bg-slate-50/20 dark:bg-slate-950/20">
                    {/* Vertical Hour Grid Lines */}
                    {TIME_TICKS.map((minutes) => {
                      const percent = ((minutes - DAY_START) / TOTAL_MINUTES) * 100;
                      return (
                        <div
                          key={minutes}
                          className="absolute top-0 bottom-0 w-px bg-slate-100 dark:bg-slate-800/60 pointer-events-none"
                          style={{ left: `${percent}%` }}
                        />
                      );
                    })}

                    {/* Half-hour subtle dotted ticks */}
                    {TIME_TICKS.slice(0, -1).map((minutes) => {
                      const percent = ((minutes + 30 - DAY_START) / TOTAL_MINUTES) * 100;
                      return (
                        <div
                          key={`half-${minutes}`}
                          className="absolute top-0 bottom-0 w-px border-r border-dashed border-slate-100 dark:border-slate-800/40 pointer-events-none"
                          style={{ left: `${percent}%` }}
                        />
                      );
                    })}

                    {/* Emergency Time Guideline */}
                    {showEmergencyMarker && (
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-red-400/50 z-0 pointer-events-none border-l border-red-500 border-dashed"
                        style={{
                          left: `${((emergencyTime - DAY_START) / TOTAL_MINUTES) * 100}%`,
                        }}
                      />
                    )}

                    {/* Procedure Blocks */}
                    {rowProcedures.map((proc) => (
                      <ScheduleBlock
                        key={proc.procedureId || proc.id}
                        procedure={proc}
                        onClick={onSelectProcedure}
                        dayStartMinutes={DAY_START}
                        totalDayMinutes={TOTAL_MINUTES}
                      />
                    ))}

                    {/* Empty Slot Feedback if empty */}
                    {rowProcedures.length === 0 && (
                      <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-400 dark:text-slate-600 italic">
                        No procedures allocated for this suite
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Timeline Footer Legend */}
      {showLegend && (
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px]">
              Legend:
            </span>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-sky-100 dark:bg-sky-900 border border-sky-300 dark:border-sky-700" />
              <span className="text-slate-600 dark:text-slate-300">Scheduled</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700" />
              <span className="text-slate-700 dark:text-slate-200 font-medium">Critical Emergency</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-purple-100 dark:bg-purple-900 border border-purple-300 dark:border-purple-700" />
              <span className="text-slate-600 dark:text-slate-300">Moved OR</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-amber-100 dark:bg-amber-900 border border-amber-300 dark:border-amber-700" />
              <span className="text-slate-600 dark:text-slate-300">Delayed</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-rose-50 dark:bg-rose-950 border border-rose-200 dark:border-rose-900 line-through" />
              <span className="text-slate-400 dark:text-slate-500">Cancelled</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[11px]">
            <Sparkles className="w-3 h-3 text-sky-600 dark:text-sky-400" />
            <span>Click any surgery bar to inspect AI predicted duration & constraints</span>
          </div>
        </div>
      )}
    </div>
  );
}
