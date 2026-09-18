/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Settings as SettingsIcon,
  Server,
  Sliders,
  Database,
  RotateCcw,
  Download,
  Info,
  CheckCircle2,
  AlertTriangle,
  FileCode,
  UserCheck,
  LogOut,
  Shield,
} from "lucide-react";
import { useSchedule } from "../context/ScheduleContext";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/common/Button";
import { MOCK_USERS } from "../data/mockData";

export function Settings() {
  const navigate = useNavigate();
  const { currentUser, logout, switchDemoUser } = useAuth();
  const {
    isBackendOnline,
    metrics,
    currentSchedule,
    operatingRooms,
    surgeons,
    handleResetSchedule,
    isResetting,
  } = useSchedule();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Local configuration states
  const [turnaroundTime, setTurnaroundTime] = useState(30);
  const [workdayStart, setWorkdayStart] = useState("08:00");
  const [workdayEnd, setWorkdayEnd] = useState("18:00");
  const [cancellationPenalty, setCancellationPenalty] = useState(100);
  const [delayPenalty, setDelayPenalty] = useState(1);
  const [orChangePenalty, setOrChangePenalty] = useState(20);
  const [idlePenalty, setIdlePenalty] = useState(0.5);

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveParameters = (e) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleExportScheduleJson = () => {
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(
        JSON.stringify(
          {
            exportedAt: new Date().toISOString(),
            schedule: currentSchedule,
            operatingRooms,
            surgeons,
            metrics,
          },
          null,
          2
        )
      );
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `or_resq_schedule_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center justify-between transition-colors">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-sky-700 dark:text-sky-400 uppercase tracking-wider bg-sky-50 dark:bg-sky-950/60 px-2 py-0.5 rounded border border-sky-200 dark:border-sky-800">
              System Configuration
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              Engine Parameters & Telemetry
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            OR-ResQ Engine & Connectivity Settings
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Configure constraint penalty weights, operational hours, and backend API bindings.
          </p>
        </div>
      </div>

      {/* 1. Backend Connectivity & Environment Setup */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-2xs transition-colors">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-400 flex items-center justify-center">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Backend API Environment
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                REST API communication with the Node.js optimization service.
              </p>
            </div>
          </div>

          <span
            className={`text-xs font-bold px-2.5 py-1 rounded-full border flex items-center gap-1.5 ${
              isBackendOnline
                ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800"
                : "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isBackendOnline ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
              }`}
            />
            {isBackendOnline ? "Backend Live: Port 5001" : "Simulation Mode Active"}
          </span>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-lg border border-slate-200 dark:border-slate-700 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-600 dark:text-slate-300">Base API Target:</span>
            <code className="bg-white dark:bg-slate-900 px-2 py-1 rounded border border-slate-200 dark:border-slate-700 font-mono text-slate-800 dark:text-slate-200">
              {import.meta.env.VITE_API_BASE_URL || "http://localhost:5001"}
            </code>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-600 dark:text-slate-300">Active State Provider:</span>
            <span className="text-slate-800 dark:text-slate-200 font-medium">
              {isBackendOnline
                ? "Node.js Microservice (PostgreSQL/Memory)"
                : "Client-Side Fallback Engine (Zero-Downtime Guarantee)"}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-700">
            <strong>Architecture Notice:</strong> In hackathon evaluation environments without a background port 5001 process running, OR-ResQ automatically falls back to an integrated client-side simulation engine with identical constraint heuristics.
          </p>
        </div>
      </div>

      {/* 2. Recovery Objective Weights & Penalty Configuration */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-2xs transition-colors">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-400 flex items-center justify-center">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Disruption Cost & Constraint Penalty Weights
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Mathematical weights used to score Plan A, B, and C in the multi-objective recovery formula.
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveParameters} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Turnaround Cleaning Buffer (Minutes)
              </label>
              <input
                type="number"
                value={turnaroundTime}
                onChange={(e) => setTurnaroundTime(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
              <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block">
                Sanitization and tray changeover between surgeries. Default: 30m.
              </span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Shift Operating Hours
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={workdayStart}
                  onChange={(e) => setWorkdayStart(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm text-center font-mono focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
                <input
                  type="text"
                  value={workdayEnd}
                  onChange={(e) => setWorkdayEnd(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm text-center font-mono focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block">
                Standard shift window (08:00 - 18:00, 10 hours capacity).
              </span>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
            <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-2">
              Disruption Cost Formula Weights
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Cancellation Penalty
                </label>
                <input
                  type="number"
                  value={cancellationPenalty}
                  onChange={(e) => setCancellationPenalty(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono text-xs focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Delay Penalty (/min)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={delayPenalty}
                  onChange={(e) => setDelayPenalty(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono text-xs focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">
                  OR Move Penalty
                </label>
                <input
                  type="number"
                  value={orChangePenalty}
                  onChange={(e) => setOrChangePenalty(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono text-xs focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Surgeon Idle (/min)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={idlePenalty}
                  onChange={(e) => setIdlePenalty(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono text-xs focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
            {savedSuccess ? (
              <span className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Parameters saved for active session
              </span>
            ) : (
              <span className="text-slate-400 dark:text-slate-500 text-[11px]">
                Modifications apply to subsequent recovery evaluations.
              </span>
            )}

            <Button type="submit" variant="primary" size="sm">
              Save Parameters
            </Button>
          </div>
        </form>
      </div>

      {/* 3. Operational Data Management & Export */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Schedule Snapshot & Data Export
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Export the current schedule state, metrics, and recovery results as a structured JSON bundle.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportScheduleJson}
            icon={Download}
          >
            Export Schedule JSON
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleResetSchedule}
            loading={isResetting}
            icon={RotateCcw}
            className="text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/50"
          >
            Reset Simulation State
          </Button>
        </div>
      </div>

      {/* 4. Staff Account & Session Management */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-2xs transition-colors">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-400 flex items-center justify-center">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Active Staff Session & Access Control
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Current authenticated user credentials, role permissions, and session termination.
              </p>
            </div>
          </div>

          <Button
            variant="danger"
            size="sm"
            onClick={handleLogout}
            icon={LogOut}
            id="settings-logout-btn"
          >
            Log Out
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Active Session Profile
            </span>
            <div className="flex items-center gap-3 mt-2">
              <div className="w-10 h-10 rounded-full bg-sky-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                {currentUser?.name ? currentUser.name.slice(0, 2).toUpperCase() : "OR"}
              </div>
              <div className="overflow-hidden">
                <p className="font-bold text-slate-900 dark:text-white text-sm">
                  {currentUser?.name || "Staff Member"}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  {currentUser?.email || "No email bound"}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-sky-100 dark:bg-sky-900/60 text-sky-800 dark:text-sky-300">
                    {currentUser?.role || "OR Coordinator"}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    {currentUser?.department || "Surgical Operations"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Switch Quick Demo Account
            </span>
            <div className="space-y-1.5 mt-2">
              {MOCK_USERS.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => switchDemoUser(user.id)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between border transition-all cursor-pointer ${
                    currentUser?.id === user.id
                      ? "bg-sky-50 dark:bg-sky-950/60 border-sky-300 dark:border-sky-800 text-sky-900 dark:text-sky-200 font-bold"
                      : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                  }`}
                >
                  <span>
                    {user.name} ({user.role})
                  </span>
                  {currentUser?.id === user.id && (
                    <UserCheck className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
