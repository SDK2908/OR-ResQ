/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
  LineChart,
  Line,
} from "recharts";
import {
  BarChart3,
  TrendingUp,
  Percent,
  Clock,
  ShieldCheck,
  Sparkles,
  AlertTriangle,
  Layers,
} from "lucide-react";
import { useSchedule } from "../context/ScheduleContext";
import { MetricCard } from "../components/dashboard/MetricCard";

export function Analytics() {
  const {
    currentSchedule,
    baselineSchedule,
    operatingRooms,
    metrics,
    activeRecovery,
    activePlanId,
    recoveryPlans,
  } = useSchedule();

  // 1. OR Utilization Data by Room
  const orUtilizationData = useMemo(() => {
    return operatingRooms.map((room) => {
      const procs = currentSchedule.filter((p) => p.orId === room.id);
      const minutes = procs.reduce((sum, p) => sum + (p.duration || 0), 0);
      const utilization = Math.min(100, Math.round((minutes / 600) * 100)); // 600 min cap
      return {
        room: room.id,
        name: room.name,
        minutes,
        utilization,
        procedures: procs.length,
      };
    });
  }, [operatingRooms, currentSchedule]);

  // 2. Historical vs AI Predicted Duration Comparison for each procedure
  const durationComparisonData = useMemo(() => {
    return currentSchedule.slice(0, 6).map((proc) => ({
      name:
        proc.procedureName.length > 18
          ? proc.procedureName.slice(0, 16) + "..."
          : proc.procedureName,
      historical: proc.historicalAverage || proc.duration,
      predicted: proc.predictedDuration || proc.duration,
      source: proc.durationSource || "AI Predicted",
    }));
  }, [currentSchedule]);

  // 3. Recovery Plans Disruption Matrix Chart
  const recoveryMatrixData = useMemo(() => {
    return recoveryPlans.map((plan) => ({
      plan: plan.id,
      disruptionCost: plan.disruptionCost,
      stability: plan.scheduleStability,
      delay: plan.totalDelay,
      cancellations: plan.cancellations * 20, // scale for visual comparison
    }));
  }, [recoveryPlans]);

  // 4. Procedures by Priority
  const priorityDistribution = useMemo(() => {
    const counts = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
    currentSchedule.forEach((p) => {
      const pr = (p.priority || "MEDIUM").toUpperCase();
      if (counts[pr] !== undefined) counts[pr]++;
    });
    return [
      { priority: "Critical", count: counts.CRITICAL, color: "#dc2626" },
      { priority: "High", count: counts.HIGH, color: "#d97706" },
      { priority: "Medium", count: counts.MEDIUM, color: "#2563eb" },
      { priority: "Low", count: counts.LOW, color: "#64748b" },
    ];
  }, [currentSchedule]);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-sky-700 dark:text-sky-400 uppercase tracking-wider bg-sky-50 dark:bg-sky-950/60 px-2 py-0.5 rounded border border-sky-200 dark:border-sky-800">
              Operations Intelligence
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              Empirical Performance Metrics
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            OR Efficiency & Recovery Impact Analytics
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Statistical breakdown of OR capacity utilization, AI duration regressions, and schedule disruption costs.
          </p>
        </div>

        {activeRecovery && (
          <div className="px-3 py-1.5 bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 rounded-lg text-xs text-amber-900 dark:text-amber-300 font-semibold flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            Impact Metrics for {activeRecovery.plan?.name || activePlanId}
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Facility Utilization"
          value={`${metrics?.utilizationRate ?? 35.5}%`}
          subtext="Aggregate OR block efficiency"
          icon={Percent}
          badgeText="Active Shift"
          badgeColor="bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800"
        />

        <MetricCard
          title="Scheduled Minutes"
          value={`${metrics?.totalScheduledMinutes ?? 851}m`}
          subtext={`Of ${metrics?.totalOrMinutesAvailable ?? 2400}m available`}
          icon={Clock}
          badgeText="Day Shift"
          badgeColor="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
        />

        <MetricCard
          title="Disruption Cost"
          value={activeRecovery ? activeRecovery.plan?.disruptionCost ?? 18.5 : "0.0"}
          subtext={activeRecovery ? "Penalty incurred by emergency" : "Optimal baseline state"}
          icon={TrendingUp}
          badgeText={activeRecovery ? "Recovery Active" : "Minimal Friction"}
          badgeColor={activeRecovery ? "bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800" : "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"}
        />

        <MetricCard
          title="Schedule Stability"
          value={`${activeRecovery ? activeRecovery.plan?.scheduleStability ?? 94.2 : 100}%`}
          subtext="Baseline schedule preserved"
          icon={ShieldCheck}
          badgeText="High Reliability"
          badgeColor="bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
        />
      </div>

      {/* Charts Row 1: OR Utilization & Duration Regressions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* OR Utilization Chart */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Operating Room Utilization Rate (%)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Scheduled surgery duration versus 600-minute standard shift capacity.
              </p>
            </div>
            <span className="text-xs font-mono text-sky-700 dark:text-sky-300 font-semibold bg-sky-50 dark:bg-sky-950/60 px-2 py-0.5 rounded border border-sky-200 dark:border-sky-800">
              Rooms 1-4
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={orUtilizationData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.2} />
                <XAxis dataKey="room" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} unit="%" />
                <Tooltip
                  formatter={(value) => [`${value}%`, "Utilization"]}
                  contentStyle={{ backgroundColor: "rgba(15, 23, 42, 0.9)", color: "#f8fafc", borderRadius: "8px", border: "1px solid #334155", fontSize: "12px" }}
                />
                <Bar dataKey="utilization" fill="#0284c7" radius={[4, 4, 0, 0]}>
                  {orUtilizationData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.utilization > 70 ? "#0284c7" : entry.utilization > 40 ? "#38bdf8" : "#94a3b8"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Historical vs AI Predicted Duration Chart */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Historical Average vs AI Predicted Duration (Minutes)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Random Forest duration adjustments based on surgeon experience & complexity.
              </p>
            </div>
            <span className="text-xs font-mono text-purple-700 dark:text-purple-300 font-semibold bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded border border-purple-200 dark:border-purple-800">
              ML Engine
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={durationComparisonData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.2} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} interval={0} />
                <YAxis stroke="#64748b" fontSize={11} unit="m" />
                <Tooltip
                  contentStyle={{ backgroundColor: "rgba(15, 23, 42, 0.9)", color: "#f8fafc", borderRadius: "8px", border: "1px solid #334155", fontSize: "12px" }}
                />
                <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                <Bar dataKey="historical" name="Historical Average" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="predicted" name="AI Predicted" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts Row 2: Recovery Plan Tradeoffs & Case Priority */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recovery Plan Disruption & Stability Comparison */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Recovery Strategies: Disruption Cost & Stability
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Lower disruption cost and higher stability indicate superior recovery tradeoff.
              </p>
            </div>
            <span className="text-xs font-mono text-emerald-700 dark:text-emerald-300 font-semibold bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
              Cost Heuristic
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={recoveryMatrixData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.2} />
                <XAxis dataKey="plan" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ backgroundColor: "rgba(15, 23, 42, 0.9)", color: "#f8fafc", borderRadius: "8px", border: "1px solid #334155", fontSize: "12px" }}
                />
                <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                <Bar dataKey="disruptionCost" name="Disruption Cost (Lower is better)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="stability" name="Schedule Stability % (Higher is better)" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Priority Caseload Distribution */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Current Caseload by Clinical Urgency
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Breakdown of active procedures by triage priority.
              </p>
            </div>
            <span className="text-xs font-mono text-slate-600 dark:text-slate-300 font-semibold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
              Triage Mix
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priorityDistribution} layout="vertical" margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.2} />
                <XAxis type="number" stroke="#64748b" fontSize={11} allowDecimals={false} />
                <YAxis dataKey="priority" type="category" stroke="#64748b" fontSize={11} />
                <Tooltip
                  formatter={(value) => [`${value} Surgeries`, "Count"]}
                  contentStyle={{ backgroundColor: "rgba(15, 23, 42, 0.9)", color: "#f8fafc", borderRadius: "8px", border: "1px solid #334155", fontSize: "12px" }}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {priorityDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
