/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Outlet, Navigate } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { ProcedureDetailsPanel } from "../schedule/ProcedureDetailsPanel";
import { useSchedule } from "../../context/ScheduleContext";
import { useAuth } from "../../context/AuthContext";

export function MainLayout({ children }) {
  const { selectedProcedure, setSelectedProcedure, isLiveBackend } = useSchedule();
  const { currentUser } = useAuth();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 antialiased transition-colors">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main App Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50 dark:bg-slate-950">
        {/* Top Header */}
        <Header />

        {/* Offline / Simulation notice banner if backend is not detected on localhost:5001 */}
        {!isLiveBackend && (
          <div className="bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-800 px-6 py-1.5 flex items-center justify-between text-xs text-amber-800 dark:text-amber-300">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 animate-pulse" />
              <span>
                <strong>Simulation Sandbox:</strong> Node.js microservice on localhost:5001 is offline. Running in deterministic client simulation engine. All scheduling, constraint optimization and emergency recovery features are fully active.
              </span>
            </div>
            <span className="text-[11px] font-mono text-amber-700 dark:text-amber-400 hidden md:inline">
              VITE_API_BASE_URL: http://localhost:5001/api
            </span>
          </div>
        )}

        {/* Scrollable Page Body */}
        <main className="flex-1 overflow-y-auto relative bg-slate-50 dark:bg-slate-950">
          {children || <Outlet />}
        </main>

        {/* Slide-out Procedure Inspection Drawer */}
        {selectedProcedure && (
          <ProcedureDetailsPanel
            procedure={selectedProcedure}
            onClose={() => setSelectedProcedure(null)}
          />
        )}
      </div>
    </div>
  );
}
