/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { UserCheck, Plus, Stethoscope, Award, Clock, ShieldCheck } from "lucide-react";
import { useSchedule } from "../context/ScheduleContext";
import { SurgeonFormModal } from "../components/forms/SurgeonFormModal";
import { Button } from "../components/common/Button";

export function Surgeons() {
  const { surgeons, localSurgeons, currentSchedule } = useSchedule();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const allSurgeons = [...surgeons, ...localSurgeons];

  // Count assigned procedures for each surgeon
  const getAssignedCount = (surgeonId) => {
    return currentSchedule.filter((p) => p.surgeonId === surgeonId).length;
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-sky-700 dark:text-sky-400 uppercase tracking-wider bg-sky-50 dark:bg-sky-950/60 px-2 py-0.5 rounded border border-sky-200 dark:border-sky-800">
              Surgical Faculty
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              Staff Registration Layer
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Surgeon Roster & Specializations
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            On-duty attending surgeons eligible for automated constraint-based procedure matching.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setIsModalOpen(true)}
          icon={Plus}
          id="btn-add-surgeon"
        >
          Add Surgeon
        </Button>
      </div>

      {/* Surgeon Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {allSurgeons.map((surg) => {
          const assignedCount = getAssignedCount(surg.id);

          return (
            <div
              key={surg.id}
              className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="w-10 h-10 rounded-full bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-400 font-bold flex items-center justify-center text-sm shrink-0">
                    {surg.name
                      .split(" ")
                      .slice(-1)[0]
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    {surg.id}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                  {surg.name}
                </h3>
                <p className="text-xs font-medium text-sky-700 dark:text-sky-400 mt-0.5">
                  {surg.specialty}
                </p>

                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                      <Award className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                      Experience:
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {surg.experience} Years
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                      <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                      Shift:
                    </span>
                    <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[120px]">
                      {surg.availability}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                      <Stethoscope className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                      Today's Cases:
                    </span>
                    <span className="font-bold text-sky-800 dark:text-sky-300 font-mono">
                      {assignedCount} Scheduled
                    </span>
                  </div>
                </div>

                {/* Eligible Procedures */}
                <div className="mt-3">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
                    Eligible Procedures:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {surg.eligibleProcedures?.slice(0, 2).map((p, i) => (
                      <span
                        key={i}
                        className="text-[10px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded truncate max-w-[180px]"
                      >
                        {p}
                      </span>
                    ))}
                    {(surg.eligibleProcedures?.length || 0) > 2 && (
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                        +{surg.eligibleProcedures.length - 2} more
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {surg.isLocalDraft && (
                <div className="mt-4 pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-purple-700 dark:text-purple-400 font-medium">
                  Staff Local Entry
                </div>
              )}
            </div>
          );
        })}
      </div>

      <SurgeonFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
