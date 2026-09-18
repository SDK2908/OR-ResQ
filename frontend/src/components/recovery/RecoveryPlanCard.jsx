/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import {
  CheckCircle,
  AlertTriangle,
  MoveRight,
  Clock,
  TrendingDown,
  ShieldCheck,
  Check,
} from "lucide-react";
import { Button } from "../common/Button";

export function RecoveryPlanCard({
  plan,
  isActive = false,
  onApply,
  isApplying = false,
}) {
  return (
    <div
      className={`relative bg-white dark:bg-slate-900 rounded-xl border transition-all p-5 flex flex-col justify-between ${
        isActive
          ? "border-sky-500 ring-2 ring-sky-200 dark:ring-sky-900 shadow-md"
          : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xs"
      }`}
    >
      {/* Active Flag */}
      {isActive && (
        <div className="absolute -top-3 right-4 bg-sky-600 text-white text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full shadow-xs flex items-center gap-1">
          <Check className="w-3 h-3" />
          Active Schedule
        </div>
      )}

      <div>
        {/* Header: Plan ID + Strategy */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <span className="text-xs font-mono font-bold text-sky-700 dark:text-sky-400 uppercase bg-sky-50 dark:bg-sky-950/60 px-2 py-0.5 rounded border border-sky-200 dark:border-sky-800">
              {plan.id || plan.name}
            </span>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1.5 leading-snug">
              {plan.strategy}
            </h3>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
          {plan.description}
        </p>

        {/* Primary Impact KPIs */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="bg-slate-50 dark:bg-slate-800/70 p-2.5 rounded-lg border border-slate-200/80 dark:border-slate-700/80">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Disruption Cost</span>
            <span className="text-base font-bold text-slate-800 dark:text-white font-mono">
              {plan.disruptionCost ?? "N/A"}
            </span>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800/70 p-2.5 rounded-lg border border-slate-200/80 dark:border-slate-700/80">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Schedule Stability</span>
            <span className="text-base font-bold text-emerald-700 dark:text-emerald-400 font-mono">
              {plan.scheduleStability ? `${plan.scheduleStability}%` : "100%"}
            </span>
          </div>
        </div>

        {/* Secondary Metrics List */}
        <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 border-t border-slate-100 dark:border-slate-800 pt-3 mb-4">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
              Cancellations:
            </span>
            <span
              className={`font-semibold ${
                plan.cancellations > 0 ? "text-rose-700 dark:text-rose-400" : "text-slate-800 dark:text-slate-200"
              }`}
            >
              {plan.cancellations}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
              <MoveRight className="w-3.5 h-3.5 text-purple-500" />
              Moved Procedures:
            </span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {plan.movedProcedures}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              Delayed Procedures:
            </span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {plan.delayedProcedures} ({plan.totalDelay || 0}m total)
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
              <TrendingDown className="w-3.5 h-3.5 text-slate-400" />
              Overtime / Idle:
            </span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {plan.overtime || 0}m / {plan.surgeonIdleTime || 0}m
            </span>
          </div>
        </div>

        {/* Recommended For Note */}
        {plan.recommendedFor && (
          <div className="p-2.5 bg-slate-50 dark:bg-slate-850 rounded-lg text-[11px] text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-800 mb-4">
            <strong className="text-slate-700 dark:text-slate-300">Use Case:</strong> {plan.recommendedFor}
          </div>
        )}
      </div>

      {/* Action CTA */}
      <Button
        variant={isActive ? "secondary" : "primary"}
        onClick={() => onApply(plan.id)}
        disabled={isActive}
        loading={isApplying}
        className="w-full"
      >
        {isActive ? "Currently Applied" : `Apply ${plan.name || plan.id}`}
      </Button>
    </div>
  );
}
