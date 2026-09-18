/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import {
  X,
  Clock,
  User,
  Shield,
  Stethoscope,
  Sparkles,
  Building2,
  Calendar,
  Layers,
  AlertTriangle,
  ArrowRight,
  Activity,
} from "lucide-react";
import { formatMinutesToTime, formatDuration, getPriorityBadge, getStatusBadge } from "../../utils/formatters";

export function ProcedureDetailsPanel({ procedure, onClose }) {
  if (!procedure) return null;

  const priorityStyle = getPriorityBadge(procedure.priority);
  const statusStyle = getStatusBadge(procedure.status);

  const diff =
    procedure.difference !== undefined
      ? procedure.difference
      : procedure.predictedDuration && procedure.historicalAverage
      ? procedure.predictedDuration - procedure.historicalAverage
      : null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col animate-slideLeft transition-colors">
      {/* Drawer Header */}
      <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850/80 flex items-start justify-between">
        <div className="pr-4">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded ${priorityStyle.solidBg}`}
            >
              {procedure.priority || "MEDIUM"}
            </span>
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded border ${statusStyle.badge}`}
            >
              {statusStyle.label}
            </span>
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
              {procedure.procedureId || procedure.id}
            </span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-snug">
            {procedure.procedureName}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Synthetic Identifier:{" "}
            <span className="font-mono font-medium text-slate-700 dark:text-slate-300">
              {procedure.patientMockId || "PAT-XXX"}
            </span>
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-md transition-colors"
          aria-label="Close details"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Drawer Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {/* ML Prediction & Duration Callout */}
        <div className="p-4 bg-sky-50/70 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 rounded-xl">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <span className="text-xs font-bold text-sky-900 dark:text-sky-300 uppercase tracking-wide">
                Duration Intelligence
              </span>
            </div>
            <span
              className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                procedure.durationSource === "AI Predicted"
                  ? "bg-sky-600 text-white"
                  : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
              }`}
            >
              {procedure.durationSource || "AI Predicted"}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-sky-100 dark:border-sky-900/50">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Historical</span>
              <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                {procedure.historicalAverage ? `${procedure.historicalAverage}m` : "N/A"}
              </span>
            </div>
            <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-sky-100 dark:border-sky-900/50">
              <span className="text-[11px] text-sky-700 dark:text-sky-400 font-semibold block">
                AI Predicted
              </span>
              <span className="text-sm font-bold text-sky-800 dark:text-sky-300">
                {procedure.predictedDuration ? `${procedure.predictedDuration}m` : `${procedure.duration}m`}
              </span>
            </div>
            <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-sky-100 dark:border-sky-900/50">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Delta</span>
              <span
                className={`text-sm font-bold ${
                  diff > 0
                    ? "text-amber-600 dark:text-amber-400"
                    : diff < 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-slate-600 dark:text-slate-400"
                }`}
              >
                {diff !== null ? (diff > 0 ? `+${diff}m` : `${diff}m`) : "0m"}
              </span>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2.5 leading-relaxed">
            Derived via Random Forest regressor on surgeon experience (
            {procedure.surgeonExperience || "10"}y) & patient complexity (Level{" "}
            {procedure.patientComplexity || "2"}/5).
          </p>
        </div>

        {/* OR & Scheduling Slot */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            OR & Time Slot Allocation
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700/80">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-1">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <span>Operating Room</span>
              </div>
              <span className="text-base font-bold text-slate-800 dark:text-white">
                {procedure.orId || "Unassigned"}
              </span>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700/80">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Duration</span>
              </div>
              <span className="text-base font-bold text-slate-800 dark:text-white">
                {formatDuration(procedure.duration)}
              </span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700/80 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Start Time</span>
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                {formatMinutesToTime(procedure.startTime)}
              </span>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400" />
            <div className="text-right">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block">End Time</span>
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                {formatMinutesToTime(procedure.endTime)}
              </span>
            </div>
          </div>
        </div>

        {/* Surgical Team */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Surgical Personnel
          </h3>
          <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-900 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {procedure.surgeonName || procedure.surgeonId || "Assigned Surgeon"}
                </span>
              </div>
              <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                {procedure.surgeonId}
              </span>
            </div>

            <div className="text-xs text-slate-600 dark:text-slate-400 flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
              <span>Specialty</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">
                {procedure.specialty || "Trauma / General Surgery"}
              </span>
            </div>

            <div className="text-xs text-slate-600 dark:text-slate-400 flex items-center justify-between">
              <span>Surgeon Experience</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">
                {procedure.surgeonExperience ? `${procedure.surgeonExperience} years` : "12 years"}
              </span>
            </div>

            <div className="text-xs text-slate-600 dark:text-slate-400 flex items-center justify-between">
              <span>Patient Complexity</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">
                Score {procedure.patientComplexity || 2} / 5
              </span>
            </div>
          </div>
        </div>

        {/* Required Equipment */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Required Equipment & Resources
          </h3>
          <div className="flex flex-wrap gap-2">
            {procedure.requiredEquipment && procedure.requiredEquipment.length > 0 ? (
              procedure.requiredEquipment.map((eq, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700"
                >
                  <Stethoscope className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                  {eq}
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-500 dark:text-slate-400 italic">
                Standard surgical instrument tray
              </span>
            )}
          </div>
        </div>

        {/* Prototype Safety Notice */}
        <div className="p-3 bg-slate-100/70 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 rounded-lg text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
          <Shield className="w-3.5 h-3.5 inline mr-1 text-slate-400" />
          Prototype Operational Record: Synthetic patient identifier. All timings
          optimized by deterministic greedy constraint heuristic.
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-end">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-sm font-medium rounded-lg transition-colors cursor-pointer"
        >
          Close Panel
        </button>
      </div>
    </div>
  );
}
