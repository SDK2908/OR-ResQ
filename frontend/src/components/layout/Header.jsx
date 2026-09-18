/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Link } from "react-router-dom";
import {
  Calendar,
  AlertOctagon,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  Sun,
  Moon,
} from "lucide-react";
import { useSchedule } from "../../context/ScheduleContext";
import { useTheme } from "../../context/ThemeContext";
import { StatusIndicator } from "../common/StatusIndicator";
import { Button } from "../common/Button";

export function Header() {
  const {
    activeRecovery,
    selectedDate,
    handleResetSchedule,
    isResetting,
  } = useSchedule();

  const { theme, toggleTheme } = useTheme();

  return (
    <header
      id="app-header"
      className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between shrink-0 sticky top-0 z-30 transition-colors"
    >
      {/* Title & Architecture Tag */}
      <div className="flex items-center gap-3 sm:gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
              OR-ResQ
            </h1>
            <span className="hidden md:inline-block text-xs text-slate-300 dark:text-slate-700">|</span>
            <span className="hidden md:inline-block text-xs font-medium text-slate-600 dark:text-slate-300">
              Dynamic OR Optimization & Emergency Recovery
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono hidden sm:inline-block">
              AI Duration Prediction + Greedy Constraint Engine
            </span>
          </div>
        </div>

        {/* Schedule Mode Badge */}
        {activeRecovery ? (
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-700 rounded-full">
            <AlertOctagon className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 animate-pulse" />
            <span className="text-xs font-bold text-amber-900 dark:text-amber-300">
              RECOVERY ACTIVE: {activeRecovery.plan?.name || "PLAN APPLIED"}
            </span>
          </div>
        ) : (
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-full">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs font-medium text-emerald-800 dark:text-emerald-300">
              BASELINE SCHEDULE
            </span>
          </div>
        )}
      </div>

      {/* Right Controls: Theme Toggle, Date, Status, Quick Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Bright / Dark Theme Switcher */}
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === "dark" ? "bright" : "dark"} theme`}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-semibold transition-all cursor-pointer shadow-2xs"
          title={`Currently on ${theme === "dark" ? "Dark Theme" : "Bright Theme"}. Click to toggle.`}
        >
          {theme === "dark" ? (
            <>
              <Sun className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Bright</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-sky-600" />
              <span className="hidden sm:inline">Dark</span>
            </>
          )}
        </button>

        {/* Date Display */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>{selectedDate || "2026-09-18"}</span>
        </div>

        {/* System & ML Status */}
        <StatusIndicator />

        {/* Reset Simulation button if recovery active */}
        {activeRecovery && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleResetSchedule}
            loading={isResetting}
            icon={RotateCcw}
            className="text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/50"
            title="Reset schedule to baseline"
          >
            Reset
          </Button>
        )}

        {/* Simulate Emergency Direct CTA */}
        <Link to="/recovery">
          <Button
            size="sm"
            variant="danger"
            icon={AlertOctagon}
            id="header-simulate-emergency-btn"
          >
            Simulate Emergency
          </Button>
        </Link>
      </div>
    </header>
  );
}

