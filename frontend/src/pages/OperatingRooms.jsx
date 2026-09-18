/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { DoorClosed, Plus, Stethoscope, Percent, Activity, CheckCircle2 } from "lucide-react";
import { useSchedule } from "../context/ScheduleContext";
import { OperatingRoomFormModal } from "../components/forms/OperatingRoomFormModal";
import { Button } from "../components/common/Button";

export function OperatingRooms() {
  const { operatingRooms, localOperatingRooms, currentSchedule } = useSchedule();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const allRooms = [...operatingRooms, ...localOperatingRooms];

  // Calculate live utilization for each room
  const getRoomStats = (orId) => {
    const procs = currentSchedule.filter((p) => p.orId === orId);
    const totalMinutes = procs.reduce((sum, p) => sum + (p.duration || 0), 0);
    const capacity = 600; // 10 hours
    const utilization = Math.min(100, Math.round((totalMinutes / capacity) * 100));
    return {
      procedureCount: procs.length,
      totalMinutes,
      utilization,
    };
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-sky-700 dark:text-sky-400 uppercase tracking-wider bg-sky-50 dark:bg-sky-950/60 px-2 py-0.5 rounded border border-sky-200 dark:border-sky-800">
              Facility Infrastructure
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              Surgical Suites Capacity
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Operating Rooms & Surgical Suites
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time capacity tracking, installed biomedical instrumentation, and procedure distribution.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setIsModalOpen(true)}
          icon={Plus}
          id="btn-add-room"
        >
          Add Operating Room
        </Button>
      </div>

      {/* Operating Rooms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {allRooms.map((room) => {
          const stats = getRoomStats(room.id);

          return (
            <div
              key={room.id}
              className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-all"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-400 flex items-center justify-center font-bold font-mono">
                      <DoorClosed className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        {room.id}
                      </h3>
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        {room.name}
                      </p>
                    </div>
                  </div>

                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    {room.status || "ACTIVE"}
                  </span>
                </div>

                {/* Utilization Metric & Bar */}
                <div className="mt-4 p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-semibold text-slate-600 dark:text-slate-300">
                      Day Utilization (10h Shift)
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white font-mono text-sm">
                      {stats.utilization}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        stats.utilization > 80
                          ? "bg-amber-500"
                          : stats.utilization > 0
                          ? "bg-sky-600 dark:bg-sky-500"
                          : "bg-slate-300 dark:bg-slate-600"
                      }`}
                      style={{ width: `${stats.utilization}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                    <span>
                      Scheduled Time:{" "}
                      <strong className="text-slate-700 dark:text-slate-200">
                        {stats.totalMinutes} min
                      </strong>
                    </span>
                    <span>
                      Caseload:{" "}
                      <strong className="text-slate-700 dark:text-slate-200">
                        {stats.procedureCount} Surgeries
                      </strong>
                    </span>
                  </div>
                </div>

                {/* Operating Hours & Equipment */}
                <div className="mt-4 space-y-2 text-xs">
                  <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400">Operating Window:</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {room.availability || "08:00 - 18:00"}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block mb-1">
                      Installed Instruments & Equipment:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {room.equipmentAvailable && room.equipmentAvailable.length > 0 ? (
                        room.equipmentAvailable.map((eq, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 font-medium"
                          >
                            <Stethoscope className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                            {eq}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500 italic">
                          Standard surgical apparatus
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {room.isLocalDraft && (
                <div className="mt-4 pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-purple-700 dark:text-purple-400 font-medium">
                  Staff Local Entry
                </div>
              )}
            </div>
          );
        })}
      </div>

      <OperatingRoomFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
