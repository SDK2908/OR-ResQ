/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import {
  FileText,
  Plus,
  Search,
  Filter,
  Trash2,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Building2,
  Tag,
} from "lucide-react";
import { useSchedule } from "../context/ScheduleContext";
import { ProcedureFormModal } from "../components/forms/ProcedureFormModal";
import { Button } from "../components/common/Button";
import { formatMinutesToTime, formatDuration, getPriorityBadge, getStatusBadge } from "../utils/formatters";

export function Procedures() {
  const {
    currentSchedule,
    localProcedures,
    deleteLocalProcedure,
    setSelectedProcedure,
  } = useSchedule();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterPriority, setFilterPriority] = useState("ALL");
  const [filterSource, setFilterSource] = useState("ALL"); // "ALL" | "BACKEND" | "LOCAL"
  const [search, setSearch] = useState("");

  // Combine backend schedule and local drafts
  const allProcedures = useMemo(() => {
    const combined = [
      ...currentSchedule.map((p) => ({ ...p, isLocalDraft: false })),
      ...localProcedures.map((p) => ({ ...p, isLocalDraft: true })),
    ];

    return combined.filter((p) => {
      if (filterPriority !== "ALL" && p.priority !== filterPriority) return false;
      if (filterSource === "BACKEND" && p.isLocalDraft) return false;
      if (filterSource === "LOCAL" && !p.isLocalDraft) return false;
      if (
        search &&
        !p.procedureName.toLowerCase().includes(search.toLowerCase()) &&
        !p.procedureId?.toLowerCase().includes(search.toLowerCase()) &&
        !p.patientMockId?.toLowerCase().includes(search.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [currentSchedule, localProcedures, filterPriority, filterSource, search]);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-sky-700 dark:text-sky-400 uppercase tracking-wider bg-sky-50 dark:bg-sky-950/60 px-2 py-0.5 rounded border border-sky-200 dark:border-sky-800">
              Department Caseload
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              Staff Registration Layer
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Surgical Procedures & Case Queue
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            View active scheduled procedures and register new surgical cases through the hospital staff entry form.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setIsModalOpen(true)}
          icon={Plus}
          id="btn-add-procedure"
        >
          Add Procedure
        </Button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-3.5 border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs transition-colors">
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px] mr-1">
            <Filter className="w-3 h-3 text-slate-400" />
            Filters:
          </div>

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
          >
            <option value="ALL">All Urgencies</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          <select
            value={filterSource}
            onChange={(e) => setFilterSource(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
          >
            <option value="ALL">All Sources (Backend + Local)</option>
            <option value="BACKEND">Backend Scheduled Only</option>
            <option value="LOCAL">Staff Local Drafts Only</option>
          </select>
        </div>

        <div className="w-full sm:w-64 relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          <input
            type="text"
            placeholder="Search procedure, ID, or patient..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none focus:bg-white dark:focus:bg-slate-800"
          />
        </div>
      </div>

      {/* Procedures Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                <th className="p-3 pl-4">Procedure</th>
                <th className="p-3">Patient Mock ID</th>
                <th className="p-3">Priority</th>
                <th className="p-3">Surgeon</th>
                <th className="p-3">Allocated OR</th>
                <th className="p-3">Hist / ML Duration</th>
                <th className="p-3">Source & Status</th>
                <th className="p-3 pr-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {allProcedures.map((proc) => {
                const priorityStyle = getPriorityBadge(proc.priority);
                const statusStyle = getStatusBadge(proc.status);

                return (
                  <tr
                    key={proc.procedureId || proc.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="p-3 pl-4">
                      <span className="font-semibold text-slate-900 dark:text-white block">
                        {proc.procedureName}
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                        {proc.procedureId || proc.id}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-slate-600 dark:text-slate-400">
                      {proc.patientMockId || "PAT-XXX"}
                    </td>
                    <td className="p-3">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${priorityStyle.solidBg}`}
                      >
                        {proc.priority}
                      </span>
                    </td>
                    <td className="p-3 text-slate-700 dark:text-slate-300">
                      {proc.surgeonName || proc.surgeonId || "Pending"}
                    </td>
                    <td className="p-3">
                      <span className="font-bold text-sky-800 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 px-2 py-0.5 rounded border border-sky-200 dark:border-sky-800 font-mono">
                        {proc.orId || proc.preferredOr || "Unassigned"}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-slate-700 dark:text-slate-300">
                      <div>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {proc.predictedDuration || proc.duration}m
                        </span>
                        {proc.historicalAverage && (
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 block">
                            Hist: {proc.historicalAverage}m
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex flex-col gap-1">
                        <span
                          className={`text-[10px] font-medium px-2 py-0.5 rounded border w-fit ${statusStyle.badge}`}
                        >
                          {statusStyle.label}
                        </span>
                        {proc.isLocalDraft ? (
                          <span className="text-[10px] text-purple-700 dark:text-purple-300 font-medium bg-purple-50 dark:bg-purple-950/50 px-1.5 py-0.2 rounded border border-purple-200 dark:border-purple-800 w-fit">
                            Local Staff Draft
                          </span>
                        ) : (
                          <span className="text-[10px] text-sky-700 dark:text-sky-300 font-medium bg-sky-50 dark:bg-sky-950/50 px-1.5 py-0.2 rounded border border-sky-200 dark:border-sky-800 w-fit">
                            Backend Scheduled
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 pr-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedProcedure(proc)}
                          className="text-sky-600 dark:text-sky-400 hover:text-sky-800 dark:hover:text-sky-300 font-semibold hover:underline cursor-pointer"
                        >
                          Inspect
                        </button>
                        {proc.isLocalDraft && (
                          <button
                            type="button"
                            onClick={() => deleteLocalProcedure(proc.id)}
                            title="Remove draft"
                            className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {allProcedures.length === 0 && (
                <tr>
                  <td
                    colSpan="8"
                    className="p-8 text-center text-xs text-slate-400 dark:text-slate-500 italic"
                  >
                    No surgical procedures match the active filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ProcedureFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
