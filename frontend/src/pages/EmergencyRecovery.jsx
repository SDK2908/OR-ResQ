/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import {
  AlertOctagon,
  RotateCcw,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  TrendingDown,
  Layers,
  Scale,
  ListFilter,
  UserX,
  DoorClosed,
  Clock,
} from "lucide-react";
import { useSchedule } from "../context/ScheduleContext";
import { EmergencyModal } from "../components/recovery/EmergencyModal";
import { RecoveryPlanCard } from "../components/recovery/RecoveryPlanCard";
import { RecoveryComparison } from "../components/recovery/RecoveryComparison";
import { BeforeAfterTimeline } from "../components/recovery/BeforeAfterTimeline";
import { Button } from "../components/common/Button";

export function EmergencyRecovery() {
  const {
    baselineSchedule,
    currentSchedule,
    operatingRooms,
    recoveryPlans,
    activeRecovery,
    activePlanId,
    lastSimulatedEmergency,
    handleApplyRecoveryPlan,
    handleResetSchedule,
    isApplyingRecovery,
    isResetting,
    setSelectedProcedure,
  } = useSchedule();

  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("compare"); // "compare" | "before_after"

  const activePlan = recoveryPlans.find((p) => p.id === activePlanId);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header & Overview */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xs transition-colors">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-bold text-red-700 dark:text-red-400 uppercase tracking-wider bg-red-50 dark:bg-red-950/60 px-2 py-0.5 rounded border border-red-200 dark:border-red-800 flex items-center gap-1">
                <AlertOctagon className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                Emergency Recovery Center
              </span>
              {activeRecovery && (
                <span className="text-xs font-bold text-sky-700 dark:text-sky-400 uppercase tracking-wider bg-sky-50 dark:bg-sky-950/60 px-2 py-0.5 rounded border border-sky-200 dark:border-sky-800">
                  Plan Applied: {activeRecovery.plan?.name || activePlanId}
                </span>
              )}
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Dynamic OR Emergency Recovery & Disruption Mitigation
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-3xl leading-relaxed">
              Simulate an emergency and evaluate how the existing OR schedule can be recovered with minimal unnecessary disruption. The engine computes 3 distinct constraint-based recovery heuristics without manual re-rostering.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <Button
              variant="danger"
              size="md"
              onClick={() => setIsEmergencyModalOpen(true)}
              icon={AlertOctagon}
              id="recovery-simulate-btn"
            >
              Simulate Emergency
            </Button>

            {activeRecovery && (
              <Button
                variant="outline"
                size="md"
                onClick={handleResetSchedule}
                loading={isResetting}
                icon={RotateCcw}
                className="text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800 hover:bg-amber-50 dark:hover:bg-amber-950/40"
              >
                Reset Simulation
              </Button>
            )}
          </div>
        </div>

        {/* Emergency Alert Context Banner */}
        {lastSimulatedEmergency && (() => {
          const type = lastSimulatedEmergency.disruptionType || "EMERGENCY_CASE";

          if (type === "SURGEON_UNAVAILABLE") {
            return (
              <div className="mt-5 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs animate-pulse">
                    <UserX className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-rose-900 dark:text-rose-300 uppercase">
                        Surgeon Unavailable Disruption Active
                      </span>
                      <span className="text-[10px] font-mono bg-rose-200 dark:bg-rose-900 text-rose-900 dark:text-rose-200 px-1.5 py-0.5 rounded">
                        Absence: {lastSimulatedEmergency.duration || 180} min
                      </span>
                    </div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                      {lastSimulatedEmergency.surgeonName || "Specialist"} • Reason: {lastSimulatedEmergency.reason || "Shift Absence"}
                    </p>
                  </div>
                </div>
                <div className="text-xs text-rose-800 dark:text-rose-300 font-medium bg-white/80 dark:bg-slate-900/80 px-3 py-1.5 rounded-lg border border-rose-200 dark:border-rose-800">
                  Surgeon Reallocation & Substitute Plans Ready
                </div>
              </div>
            );
          }

          if (type === "OR_UNAVAILABLE") {
            return (
              <div className="mt-5 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-xs animate-pulse">
                    <DoorClosed className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-amber-900 dark:text-amber-300 uppercase">
                        Operating Suite Outage Active
                      </span>
                      <span className="text-[10px] font-mono bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200 px-1.5 py-0.5 rounded">
                        Downtime: {lastSimulatedEmergency.duration || 180} min
                      </span>
                    </div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                      {lastSimulatedEmergency.orId || "Suite"} Offline • Reason: {lastSimulatedEmergency.reason || "Technical fault"}
                    </p>
                  </div>
                </div>
                <div className="text-xs text-amber-800 dark:text-amber-300 font-medium bg-white/80 dark:bg-slate-900/80 px-3 py-1.5 rounded-lg border border-amber-200 dark:border-amber-800">
                  Suite Redistribution & Evacuation Plans Ready
                </div>
              </div>
            );
          }

          if (type === "SURGERY_OVERRUN") {
            return (
              <div className="mt-5 p-4 rounded-xl bg-orange-50 dark:bg-orange-950/50 border border-orange-200 dark:border-orange-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-600 text-white flex items-center justify-center shrink-0 shadow-xs animate-pulse">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-orange-900 dark:text-orange-300 uppercase">
                        Surgery Overrun Disruption Active
                      </span>
                      <span className="text-[10px] font-mono bg-orange-200 dark:bg-orange-900 text-orange-900 dark:text-orange-200 px-1.5 py-0.5 rounded">
                        Overrun: +{lastSimulatedEmergency.overrunMinutes || 60} min
                      </span>
                    </div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                      {lastSimulatedEmergency.procedureName} in {lastSimulatedEmergency.orId} • Cause: {lastSimulatedEmergency.reason || "Intraoperative complications"}
                    </p>
                  </div>
                </div>
                <div className="text-xs text-orange-800 dark:text-orange-300 font-medium bg-white/80 dark:bg-slate-900/80 px-3 py-1.5 rounded-lg border border-orange-200 dark:border-orange-800">
                  Cascade Ripple Mitigation Plans Ready
                </div>
              </div>
            );
          }

          // Default: EMERGENCY_CASE
          return (
            <div className="mt-5 p-4 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-600 text-white flex items-center justify-center shrink-0 shadow-xs animate-pulse">
                  <AlertOctagon className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-red-900 dark:text-red-300 uppercase">
                      Critical Emergency Case Arrival Active
                    </span>
                    <span className="text-[10px] font-mono bg-red-200 dark:bg-red-900 text-red-900 dark:text-red-200 px-1.5 py-0.5 rounded">
                      Arrival: 09:30 AM (T=570m)
                    </span>
                  </div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                    {lastSimulatedEmergency.procedureName} • {lastSimulatedEmergency.duration} min • Specialty: {lastSimulatedEmergency.requiredSpecialty}
                  </p>
                </div>
              </div>

              <div className="text-xs text-red-800 dark:text-red-300 font-medium bg-white/80 dark:bg-slate-900/80 px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-800">
                Immediate Preemption & Buffer Rebalance Ready
              </div>
            </div>
          );
        })()}
      </div>

      {/* Tabs: Plan Comparison Cards & Matrix vs Before/After Synchronized View */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("compare")}
            className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 ${
              activeTab === "compare"
                ? "bg-slate-900 dark:bg-sky-600 text-white shadow-xs"
                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800"
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            1. Recovery Options & Metrics Comparison
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("before_after")}
            className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 ${
              activeTab === "before_after"
                ? "bg-slate-900 dark:bg-sky-600 text-white shadow-xs"
                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            2. Before vs After Timeline Impact
            {activeRecovery && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            )}
          </button>
        </div>

        <span className="text-xs text-slate-400 dark:text-slate-500 font-mono hidden md:inline">
          Backend Heuristic: Priority-First Multi-Objective Optimization
        </span>
      </div>

      {/* TAB 1: Plan Comparison */}
      {activeTab === "compare" && (
        <div className="space-y-6">
          {/* 3 Strategy Comparison Cards */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                Select a Feasible Recovery Plan
              </h3>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Each plan optimizes different operational tradeoffs.
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {recoveryPlans.map((plan) => (
                <RecoveryPlanCard
                  key={plan.id}
                  plan={plan}
                  isActive={activePlanId === plan.id}
                  onApply={handleApplyRecoveryPlan}
                  isApplying={isApplyingRecovery}
                />
              ))}
            </div>
          </div>

          {/* Decision Matrix Table */}
          <RecoveryComparison
            plans={recoveryPlans}
            activePlanId={activePlanId}
            onApplyPlan={handleApplyRecoveryPlan}
            isApplying={isApplyingRecovery}
          />

          {/* Quick CTA to jump to Before/After View if plan is applied */}
          {activeRecovery && (
            <div className="p-4 bg-sky-50 dark:bg-sky-950/50 border border-sky-200 dark:border-sky-800 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-sky-900 dark:text-sky-300">
                  Recovery Strategy Applied Successfully!
                </p>
                <p className="text-xs text-sky-700 dark:text-sky-400 mt-0.5">
                  Review the exact surgery relocations, time shifts, and cancellations in the Before vs After view.
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setActiveTab("before_after")}
                icon={ArrowRight}
              >
                View Before / After Timeline
              </Button>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Dedicated Before vs After Comparison */}
      {activeTab === "before_after" && (
        <BeforeAfterTimeline
          baselineSchedule={baselineSchedule}
          currentSchedule={currentSchedule}
          operatingRooms={operatingRooms}
          activePlan={activePlan}
          onSelectProcedure={setSelectedProcedure}
        />
      )}

      {/* Emergency Simulation Modal */}
      <EmergencyModal
        isOpen={isEmergencyModalOpen}
        onClose={() => setIsEmergencyModalOpen(false)}
        onSuccess={() => {
          setActiveTab("compare");
        }}
      />
    </div>
  );
}
