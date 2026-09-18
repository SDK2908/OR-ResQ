/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import {
  Calendar,
  Sparkles,
  RotateCcw,
  RefreshCw,
  Filter,
  List,
  LayoutGrid,
  Clock,
  User,
  DoorClosed,
  ChevronDown,
  Info,
} from "lucide-react";
import { useSchedule } from "../context/ScheduleContext";
import { ScheduleTimeline } from "../components/schedule/ScheduleTimeline";
import { Button } from "../components/common/Button";
import { formatMinutesToTime, formatDuration, getPriorityBadge, getStatusBadge } from "../utils/formatters";

export function Schedule() {
  const {
    currentSchedule,
    operatingRooms,
    surgeons,
    selectedDate,
    setSelectedDate,
    handleGenerateSchedule,
    handleResetSchedule,
    refreshCurrentSchedule,
    isGeneratingSchedule,
    isResetting,
    setSelectedProcedure,
    activeRecovery,
  } = useSchedule();

  const [viewMode, setViewMode] = useState("timeline"); // "timeline" | "table"
  const [selectedOr, setSelectedOr] = useState("ALL");
  const [selectedSurgeon, setSelectedSurgeon] = useState("ALL");
  const [selectedPriority, setSelectedPriority] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Filtered schedule list
  const filteredSchedule = useMemo(() => {
    return currentSchedule.filter((proc) => {
      if (selectedOr !== "ALL" && proc.orId !== selectedOr) return false;
      if (selectedSurgeon !== "ALL" && proc.surgeonId !== selectedSurgeon)
        return false;
      if (selectedPriority !== "ALL" && proc.priority !== selectedPriority)
        return false;
      if (
        searchQuery &&
        !proc.procedureName.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !proc.patientMockId?.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [currentSchedule, selectedOr, selectedSurgeon, selectedPriority, searchQuery]);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header & Controls */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 transition-colors">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-sky-700 dark:text-sky-400 uppercase tracking-wider bg-sky-50 dark:bg-sky-950/60 px-2 py-0.5 rounded border border-sky-200 dark:border-sky-800">
              OR Timetable
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              Constraint-Based Scheduling Engine
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Operating Room Master Schedule
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            AI duration-adjusted surgery slots prioritized by clinical urgency and surgeon eligibility.
          </p>
        </div>

        {/* Primary Action Toolbar */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Date Selector */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300">
            <Calendar className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent border-none p-0 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none"
            />
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={() => handleGenerateSchedule(selectedDate)}
            loading={isGeneratingSchedule}
            icon={Sparkles}
            id="btn-generate-optimized-schedule"
          >
            Generate Optimized Schedule
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={refreshCurrentSchedule}
            icon={RefreshCw}
            title="Refresh current schedule state from backend"
          >
            Refresh
          </Button>

          {activeRecovery && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetSchedule}
              loading={isResetting}
              icon={RotateCcw}
              className="text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800 hover:bg-amber-50 dark:hover:bg-amber-950/40"
            >
              Reset Simulation
            </Button>
          )}

          {/* View Toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setViewMode("timeline")}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1 ${
                viewMode === "timeline"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-semibold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Gantt
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1 ${
                viewMode === "table"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-semibold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <List className="w-3.5 h-3.5" />
              Table
            </button>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-3.5 border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs transition-colors">
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px] mr-1">
            <Filter className="w-3 h-3 text-slate-400" />
            Filters:
          </div>

          {/* Filter by OR */}
          <select
            value={selectedOr}
            onChange={(e) => setSelectedOr(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
          >
            <option value="ALL">All Suites (OR 1-4)</option>
            {operatingRooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.id} ({r.name})
              </option>
            ))}
          </select>

          {/* Filter by Surgeon */}
          <select
            value={selectedSurgeon}
            onChange={(e) => setSelectedSurgeon(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
          >
            <option value="ALL">All Surgeons</option>
            {surgeons.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          {/* Filter by Priority */}
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
          >
            <option value="ALL">All Priorities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>

        {/* Quick Search */}
        <div className="w-full sm:w-64">
          <input
            type="text"
            placeholder="Search procedure or patient ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 placeholder-slate-400 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none focus:bg-white dark:focus:bg-slate-900"
          />
        </div>
      </div>

      {/* Main View Area: Gantt or Table */}
      {viewMode === "timeline" ? (
        <ScheduleTimeline
          schedule={filteredSchedule}
          operatingRooms={
            selectedOr === "ALL"
              ? operatingRooms
              : operatingRooms.filter((r) => r.id === selectedOr)
          }
          onSelectProcedure={setSelectedProcedure}
          showEmergencyMarker={!!activeRecovery}
          emergencyTime={570}
        />
      ) : (
        /* Table View */
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs transition-colors">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="p-3 pl-4">Procedure</th>
                  <th className="p-3">Patient ID</th>
                  <th className="p-3">Suite</th>
                  <th className="p-3">Surgeon</th>
                  <th className="p-3">Priority</th>
                  <th className="p-3">Scheduled Time</th>
                  <th className="p-3">Duration</th>
                  <th className="p-3">ML Forecast</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 pr-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredSchedule.map((proc) => {
                  const priorityStyle = getPriorityBadge(proc.priority);
                  const statusStyle = getStatusBadge(proc.status);

                  return (
                    <tr
                      key={proc.procedureId || proc.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="p-3 pl-4 font-semibold text-slate-900 dark:text-white">
                        {proc.procedureName}
                        <span className="block text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                          {proc.procedureId || proc.id}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-slate-600 dark:text-slate-400">
                        {proc.patientMockId || "PAT-XXX"}
                      </td>
                      <td className="p-3">
                        <span className="font-bold text-sky-800 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 px-2 py-0.5 rounded border border-sky-200 dark:border-sky-800">
                          {proc.orId || "Unassigned"}
                        </span>
                      </td>
                      <td className="p-3 text-slate-700 dark:text-slate-300">
                        {proc.surgeonName || proc.surgeonId}
                      </td>
                      <td className="p-3">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${priorityStyle.solidBg}`}
                        >
                          {proc.priority}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-slate-700 dark:text-slate-300 font-medium">
                        {formatMinutesToTime(proc.startTime)} -{" "}
                        {formatMinutesToTime(proc.endTime)}
                      </td>
                      <td className="p-3 font-mono text-slate-700 dark:text-slate-300">
                        {formatDuration(proc.duration)}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-sky-700 dark:text-sky-400 font-mono">
                            {proc.predictedDuration || proc.duration}m
                          </span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500">
                            ({proc.durationSource === "AI Predicted" ? "AI" : "Hist"})
                          </span>
                        </div>
                      </td>
                      <td className="p-3">
                        <span
                          className={`text-[10px] font-medium px-2 py-0.5 rounded border ${statusStyle.badge}`}
                        >
                          {statusStyle.label}
                        </span>
                      </td>
                      <td className="p-3 pr-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedProcedure(proc)}
                          className="text-sky-600 dark:text-sky-400 hover:text-sky-800 dark:hover:text-sky-300 font-semibold hover:underline"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
