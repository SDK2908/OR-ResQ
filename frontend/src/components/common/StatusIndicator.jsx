/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Server, Zap, RefreshCw } from "lucide-react";
import { useSchedule } from "../../context/ScheduleContext";

export function StatusIndicator({ compact = false }) {
  const { backendStatus, isLiveBackend, refreshBackendHealth } = useSchedule();

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <span
          className={`w-2.5 h-2.5 rounded-full ${
            backendStatus === "connected"
              ? "bg-emerald-500 ring-4 ring-emerald-100"
              : backendStatus === "checking"
              ? "bg-amber-400 animate-ping"
              : "bg-amber-500 ring-4 ring-amber-100"
          }`}
          title={
            backendStatus === "connected"
              ? "Node.js Backend Connected (:5001)"
              : "Backend Offline (Local Simulation Active)"
          }
        />
        <span className="text-xs font-medium text-slate-600">
          {backendStatus === "connected" ? "Backend Online" : "Local Mode"}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-2xs">
      {/* Node.js Backend Connection */}
      <div className="flex items-center gap-2">
        <Server className="w-3.5 h-3.5 text-slate-500" />
        <div className="flex items-center gap-1.5">
          <span
            className={`w-2 h-2 rounded-full ${
              isLiveBackend ? "bg-emerald-500" : "bg-amber-500"
            }`}
          />
          <span className="text-xs font-semibold text-slate-700">
            {isLiveBackend ? "Backend Connected (Port 5001)" : "Simulation Mode"}
          </span>
        </div>
      </div>

      <span className="w-px h-3.5 bg-slate-200" />

      {/* ML Pipeline Status */}
      <div className="flex items-center gap-1.5" title="ML Service (Port 8000 via Node Backend)">
        <Zap className="w-3.5 h-3.5 text-sky-600" />
        <span className="text-xs text-slate-600">
          ML Random Forest: <span className="font-medium text-slate-800">Active</span>
        </span>
      </div>

      <button
        type="button"
        onClick={refreshBackendHealth}
        className="text-slate-400 hover:text-slate-600 p-1 rounded transition-colors"
        title="Check Backend Connection"
      >
        <RefreshCw className="w-3 h-3" />
      </button>
    </div>
  );
}
