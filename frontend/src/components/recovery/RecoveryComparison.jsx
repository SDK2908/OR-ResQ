/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Check, ArrowRight, AlertTriangle } from "lucide-react";
import { Button } from "../common/Button";

export function RecoveryComparison({
  plans = [],
  activePlanId = null,
  onApplyPlan,
  isApplying = false,
}) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs transition-colors">
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850/80 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Recovery Strategy Decision Matrix
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Objective evaluation metrics computed by deterministic cost & stability functions.
          </p>
        </div>
        <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">
          3 Feasible Plans
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50/50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
              <th className="p-3 pl-4">Plan</th>
              <th className="p-3">Strategy Heuristic</th>
              <th className="p-3 text-center">Cancellations</th>
              <th className="p-3 text-center">Moved OR</th>
              <th className="p-3 text-center">Total Delay</th>
              <th className="p-3 text-center">Disruption Cost</th>
              <th className="p-3 text-center">Stability</th>
              <th className="p-3 text-center">Overtime</th>
              <th className="p-3 pr-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {plans.map((plan) => {
              const isSelected = activePlanId === plan.id;
              return (
                <tr
                  key={plan.id}
                  className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors ${
                    isSelected ? "bg-sky-50/50 dark:bg-sky-950/40 font-medium" : ""
                  }`}
                >
                  <td className="p-3 pl-4">
                    <span className="font-bold text-slate-900 dark:text-white font-mono">
                      {plan.id || plan.name}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {plan.strategy}
                    </span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-xs">
                      {plan.impactSummary || plan.description}
                    </p>
                  </td>
                  <td className="p-3 text-center">
                    <span
                      className={`px-2 py-0.5 rounded font-semibold ${
                        plan.cancellations > 0
                          ? "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                          : "text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      {plan.cancellations}
                    </span>
                  </td>
                  <td className="p-3 text-center text-slate-700 dark:text-slate-300 font-mono">
                    {plan.movedProcedures}
                  </td>
                  <td className="p-3 text-center text-slate-700 dark:text-slate-300 font-mono">
                    {plan.totalDelay || 0} min
                  </td>
                  <td className="p-3 text-center font-bold text-slate-900 dark:text-white font-mono">
                    {plan.disruptionCost}
                  </td>
                  <td className="p-3 text-center font-bold text-emerald-700 dark:text-emerald-400 font-mono">
                    {plan.scheduleStability}%
                  </td>
                  <td className="p-3 text-center text-slate-600 dark:text-slate-400 font-mono">
                    {plan.overtime || 0}m
                  </td>
                  <td className="p-3 pr-4 text-right">
                    <Button
                      size="sm"
                      variant={isSelected ? "secondary" : "primary"}
                      disabled={isSelected}
                      loading={isApplying && isSelected}
                      onClick={() => onApplyPlan(plan.id)}
                    >
                      {isSelected ? "Active" : "Apply"}
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
