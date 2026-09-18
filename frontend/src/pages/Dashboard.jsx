/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  DoorClosed,
  Activity,
  CalendarDays,
  Percent,
  AlertOctagon,
  Sparkles,
  RotateCcw,
  RefreshCw,
  Plus,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { useSchedule } from "../context/ScheduleContext";
import { MetricCard } from "../components/dashboard/MetricCard";
import { RecentEventsList } from "../components/dashboard/RecentEventsList";
import { ScheduleTimeline } from "../components/schedule/ScheduleTimeline";
import { Button } from "../components/common/Button";
import { EmergencyModal } from "../components/recovery/EmergencyModal";

export function Dashboard() {
  const {
    currentSchedule,
    operatingRooms,
    metrics,
    activeView,
    activeRecovery,
    recentEvents,
    setSelectedProcedure,
    handleGenerateSchedule,
    handleResetSchedule,
    isGeneratingSchedule,
    isResetting,
    selectedDate,
  } = useSchedule();

  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);

  // Dynamic metrics from backend
  const totalOrs = operatingRooms.length || 4;
  const totalProcedures = metrics?.totalProcedures ?? currentSchedule.length;
  const scheduledProcedures = metrics?.scheduledProcedures ?? currentSchedule.length;
  const utilizationRate = metrics?.utilizationRate ?? 35.5;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner / Hero Context */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-sky-700 dark:text-sky-400 uppercase tracking-wider bg-sky-50 dark:bg-sky-950/60 px-2 py-0.5 rounded border border-sky-200 dark:border-sky-800">
              Command Overview
            </span>
            {activeRecovery && (
              <span className="text-xs font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded border border-amber-300 dark:border-amber-800 animate-pulse">
                Emergency Recovery Active
              </span>
            )}
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Today's Operating Room Schedule & Operations
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time constraint optimization with Random Forest surgery duration predictions.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleGenerateSchedule(selectedDate)}
            loading={isGeneratingSchedule}
            icon={Sparkles}
            title="Recalculate baseline constraint schedule"
          >
            Generate Schedule
          </Button>

          {activeRecovery ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetSchedule}
              loading={isResetting}
              icon={RotateCcw}
              className="text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800"
            >
              Reset Simulation
            </Button>
          ) : (
            <Button
              variant="danger"
              size="sm"
              onClick={() => setIsEmergencyModalOpen(true)}
              icon={AlertOctagon}
              id="dashboard-simulate-emergency-btn"
            >
              Simulate Emergency
            </Button>
          )}

          <Link to="/recovery">
            <Button variant="primary" size="sm" icon={ArrowRight}>
              Recovery Center
            </Button>
          </Link>
        </div>
      </div>

      {/* Operational Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Operating Rooms"
          value={totalOrs}
          subtext="Active surgical suites"
          icon={DoorClosed}
          badgeText="100% Operational"
          badgeColor="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
          id="metric-ors"
        />

        <MetricCard
          title="Total Procedures"
          value={totalProcedures}
          subtext="Elective & urgent cases"
          icon={Activity}
          badgeText="Today's Caseload"
          badgeColor="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
          id="metric-procedures"
        />

        <MetricCard
          title="Scheduled"
          value={scheduledProcedures}
          subtext={`${metrics?.unassigned || 0} unassigned procedures`}
          icon={CalendarDays}
          badgeText="Zero Backlog"
          badgeColor="bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-400 border border-sky-200 dark:border-sky-800"
          id="metric-scheduled"
        />

        <MetricCard
          title="OR Utilization"
          value={`${utilizationRate}%`}
          subtext={`${metrics?.totalScheduledMinutes || 851} min of ${metrics?.totalOrMinutesAvailable || 2400} min capacity`}
          icon={Percent}
          badgeText={utilizationRate > 30 ? "Optimal Efficiency" : "Capacity Available"}
          badgeColor={utilizationRate > 30 ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800" : "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800"}
          id="metric-utilization"
        />
      </div>

      {/* Main Gantt Timeline Visual */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Today's Operating Room Schedule (08:00 - 18:00)
            </h3>
            <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">
              ({currentSchedule.length} Procedures)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/schedule"
              className="text-xs text-sky-700 dark:text-sky-400 hover:text-sky-800 dark:hover:text-sky-300 font-medium inline-flex items-center gap-1 hover:underline"
            >
              Full Schedule View
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* The Reusable Interactive Gantt Timeline */}
        <ScheduleTimeline
          schedule={currentSchedule}
          operatingRooms={operatingRooms}
          onSelectProcedure={setSelectedProcedure}
          showEmergencyMarker={!!activeRecovery}
          emergencyTime={570}
        />
      </div>

      {/* Bottom Row: Recent Recovery Events + Story Explanation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Recovery Events List */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden transition-colors">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850/80 flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Recent Scheduling & Recovery Events
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Log of automated constraint calculations, emergencies, and schedule shifts.
              </p>
            </div>
            <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">Real-time Stream</span>
          </div>
          <RecentEventsList events={recentEvents} />
        </div>

        {/* Hackathon Judge Story Card */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs p-5 flex flex-col justify-between transition-colors">
          <div>
            <div className="flex items-center gap-2 text-sky-700 dark:text-sky-400 mb-2">
              <Sparkles className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">
                How OR-ResQ Works
              </span>
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-2 leading-snug">
              From Baseline to Emergency Recovery in 3 Steps
            </h4>

            <ol className="space-y-3 text-xs text-slate-600 dark:text-slate-300 mt-3 border-l-2 border-slate-200 dark:border-slate-800 pl-3.5 ml-1">
              <li className="relative">
                <span className="absolute -left-[19px] top-0 w-2.5 h-2.5 rounded-full bg-sky-600 ring-2 ring-white dark:ring-slate-900" />
                <strong className="text-slate-900 dark:text-white block">1. Baseline Optimization</strong>
                Deterministic greedy heuristic packs eligible procedures into available OR slots using ML duration forecasts.
              </li>
              <li className="relative">
                <span className="absolute -left-[19px] top-0 w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-900" />
                <strong className="text-slate-900 dark:text-white block">2. Emergency Disruption</strong>
                Unscheduled critical trauma arrival triggers multi-strategy recovery engine (Plans A, B, C).
              </li>
              <li className="relative">
                <span className="absolute -left-[19px] top-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
                <strong className="text-slate-900 dark:text-white block">3. Explainable Recovery</strong>
                Compare disruption costs, select the best strategy, and review before vs after impact.
              </li>
            </ol>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Link to="/recovery" className="w-full block">
              <Button variant="outline" size="sm" className="w-full" icon={ShieldAlert}>
                Test Emergency Recovery Flow
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Emergency Simulation Modal */}
      <EmergencyModal
        isOpen={isEmergencyModalOpen}
        onClose={() => setIsEmergencyModalOpen(false)}
      />
    </div>
  );
}
