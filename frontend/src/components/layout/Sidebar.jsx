/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  CalendarDays,
  AlertTriangle,
  FileText,
  UserCheck,
  DoorClosed,
  Stethoscope,
  BarChart3,
  Settings,
  LogOut,
  Activity,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useSchedule } from "../../context/ScheduleContext";

export function Sidebar() {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const { activeView, activeRecovery } = useSchedule();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navItems = [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "OR Schedule",
      path: "/schedule",
      icon: CalendarDays,
      badge: "Gantt",
    },
    {
      name: "Emergency Recovery",
      path: "/recovery",
      icon: AlertTriangle,
      badge: activeRecovery ? "Active Plan" : "Simulate",
      badgeColor: activeRecovery
        ? "bg-amber-100 text-amber-800 border-amber-300"
        : "bg-red-50 text-red-700 border-red-200",
    },
    {
      name: "Procedures",
      path: "/procedures",
      icon: FileText,
    },
    {
      name: "Surgeons",
      path: "/surgeons",
      icon: UserCheck,
    },
    {
      name: "Operating Rooms",
      path: "/operating-rooms",
      icon: DoorClosed,
    },
    {
      name: "Equipment",
      path: "/equipment",
      icon: Stethoscope,
    },
    {
      name: "Analytics",
      path: "/analytics",
      icon: BarChart3,
    },
    {
      name: "Settings",
      path: "/settings",
      icon: Settings,
    },
  ];

  return (
    <aside
      id="app-sidebar"
      className="w-64 bg-slate-900 text-slate-200 flex flex-col shrink-0 border-r border-slate-800 select-none"
    >
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-400 font-bold">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base text-white tracking-tight">
                OR-ResQ
              </span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-400/30">
                Engine
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-tight truncate">
              OR Optimization & Recovery
            </p>
          </div>
        </div>
      </div>

      {/* Navigation List */}
      <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
          Command Operations
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                  isActive
                    ? "bg-sky-600 text-white shadow-xs"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-colors ${
                        isActive
                          ? "text-white"
                          : "text-slate-400 group-hover:text-slate-200"
                      }`}
                    />
                    <span>{item.name}</span>
                  </div>

                  {item.badge ? (
                    <span
                      className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${
                        isActive
                          ? "bg-white/20 text-white border-white/30"
                          : item.badgeColor || "bg-slate-800 text-slate-300 border-slate-700"
                      }`}
                    >
                      {item.badge}
                    </span>
                  ) : isActive ? (
                    <ChevronRight className="w-3.5 h-3.5 text-white/70" />
                  ) : null}
                </>
              )}
            </NavLink>
          );
        })}
      </div>

      {/* Bottom User Profile & Logout */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/50">
        <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-semibold text-sky-400 shrink-0">
              {currentUser?.name ? currentUser.name.slice(0, 2).toUpperCase() : "OR"}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-medium text-white truncate">
                {currentUser?.name || "Staff Member"}
              </p>
              <p className="text-[11px] text-slate-400 truncate">
                {currentUser?.role || "OR Coordinator"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            title="Log Out"
            id="sidebar-logout-btn"
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
