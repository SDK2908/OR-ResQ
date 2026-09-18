/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import {
  Stethoscope,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Wrench,
  PackageCheck,
  Search,
  Filter,
  Layers,
  Sparkles,
  ShieldCheck,
  Activity,
} from "lucide-react";
import { useSchedule } from "../context/ScheduleContext";
import {
  EquipmentFormModal,
  SURGICAL_KIT_BUNDLES,
} from "../components/forms/EquipmentFormModal";
import { Button } from "../components/common/Button";

export function Equipment() {
  const { equipment, localEquipment, operatingRooms } = useSchedule();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterOr, setFilterOr] = useState("ALL");
  const [filterBundle, setFilterBundle] = useState("ALL");

  const allEquipment = useMemo(() => {
    return [...equipment, ...localEquipment];
  }, [equipment, localEquipment]);

  // Infer or match kit bundle for each equipment item
  const getEquipmentBundle = (eq) => {
    if (eq.bundle) return eq.bundle;
    const nameLower = (eq.name || "").toLowerCase();
    if (nameLower.includes("heart-lung") || nameLower.includes("perfusion") || nameLower.includes("sternal") || nameLower.includes("vascular doppler")) {
      return "❤️ Cardiac & Perfusion Bundle";
    }
    if (nameLower.includes("drill") || nameLower.includes("robotic") || nameLower.includes("davinci") || nameLower.includes("arthroplasty") || nameLower.includes("reamer")) {
      return "🦴 Orthopedic & Robotic Kit";
    }
    if (nameLower.includes("trauma") || nameLower.includes("infuser") || nameLower.includes("laparotomy")) {
      return "🚨 Critical Trauma Bundle";
    }
    if (nameLower.includes("laparoscopy") || nameLower.includes("endoscopy") || nameLower.includes("insufflator") || nameLower.includes("harmonic")) {
      return "🔬 Laparoscopy Tower Suite";
    }
    if (nameLower.includes("microscope") || nameLower.includes("navigation") || nameLower.includes("cusa") || nameLower.includes("cranial")) {
      return "🧠 Neurosurgery Micro Kit";
    }
    return "Standard Biomedical Unit";
  };

  const filteredEquipment = useMemo(() => {
    return allEquipment.filter((item) => {
      const matchSearch =
        search === "" ||
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.id.toLowerCase().includes(search.toLowerCase()) ||
        (item.assignedOr || "").toLowerCase().includes(search.toLowerCase());

      const matchStatus =
        filterStatus === "ALL" ||
        item.status === filterStatus ||
        item.availability === filterStatus;

      const matchOr =
        filterOr === "ALL" ||
        (filterOr === "STORAGE"
          ? (item.assignedOr || "").includes("Storage")
          : item.assignedOr === filterOr);

      const itemBundle = getEquipmentBundle(item);
      const matchBundle =
        filterBundle === "ALL" || itemBundle.includes(filterBundle);

      return matchSearch && matchStatus && matchOr && matchBundle;
    });
  }, [allEquipment, search, filterStatus, filterOr, filterBundle]);

  const sterilizedCount = allEquipment.filter(
    (e) => e.status === "STERILIZED" || e.availability === "Available"
  ).length;

  const inUseCount = allEquipment.filter(
    (e) => e.availability === "In Use" || e.status === "ACTIVE"
  ).length;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-sky-700 dark:text-sky-400 uppercase tracking-wider bg-sky-50 dark:bg-sky-950/60 px-2 py-0.5 rounded border border-sky-200 dark:border-sky-800">
              Surgical Inventory & Sterile Kits
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              Biomedical Resource Tracking
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Specialized Surgical Equipment & Sterile Kits
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Provision complete pre-bundled surgical kits (Cardiac, Orthopedic, Trauma, Laparoscopy) or batch import multi-equipment packages.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="primary"
            onClick={() => setIsModalOpen(true)}
            icon={PackageCheck}
            id="btn-provision-bundle"
          >
            Provision Kit Bundle / Batch
          </Button>
        </div>
      </div>

      {/* KPI Stats Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Total Equipment Units
            </span>
            <Wrench className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {allEquipment.length}
          </p>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            Across 4 OR Suites & Mobile Carts
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              Sterilized & Ready
            </span>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300 mt-1">
            {sterilizedCount}
          </p>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            Autoclave verified & sterile
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-sky-600 dark:text-sky-400">
              Active in OR Suites
            </span>
            <Activity className="w-4 h-4 text-sky-500" />
          </div>
          <p className="text-2xl font-bold text-sky-700 dark:text-sky-300 mt-1">
            {inUseCount}
          </p>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            Assigned to active cases
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-purple-600 dark:text-purple-400">
              Pre-Configured Bundles
            </span>
            <PackageCheck className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-2xl font-bold text-purple-700 dark:text-purple-300 mt-1">
            {SURGICAL_KIT_BUNDLES.length}
          </p>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            Cardiac, Ortho, Trauma, Laparo, Neuro
          </span>
        </div>
      </div>

      {/* Quick Surgical Kit Bundle Provisioning Banner */}
      <div className="p-4 bg-linear-to-r from-sky-50 to-indigo-50 dark:from-sky-950/40 dark:to-indigo-950/30 border border-sky-200 dark:border-sky-800/80 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-sky-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 dark:text-white text-sm">
              Pre-Bundled Surgical Kit Packages Available
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
              Instead of adding items individually, provision entire surgical sets in 1 click (e.g., <strong>Cardiac Perfusion Bundle</strong> with Heart-Lung Machine, Vascular Doppler, and Sternal Saw Kit).
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsModalOpen(true)}
          icon={Plus}
          className="shrink-0 bg-white dark:bg-slate-800"
        >
          Explore Bundles
        </Button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-3.5 border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs transition-colors">
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px] mr-1">
            <Filter className="w-3 h-3 text-slate-400" />
            Filters:
          </div>

          {/* Bundle Filter */}
          <select
            value={filterBundle}
            onChange={(e) => setFilterBundle(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
          >
            <option value="ALL">All Surgical Bundles</option>
            <option value="Cardiac">❤️ Cardiac Bundles</option>
            <option value="Orthopedic">🦴 Orthopedic Bundles</option>
            <option value="Trauma">🚨 Trauma Bundles</option>
            <option value="Laparoscopy">🔬 Laparoscopy Bundles</option>
            <option value="Neurosurgery">🧠 Neurosurgery Bundles</option>
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="STERILIZED">Sterilized & Ready</option>
            <option value="ACTIVE">Active / In Use</option>
            <option value="STANDBY">Standby</option>
          </select>

          {/* Location Filter */}
          <select
            value={filterOr}
            onChange={(e) => setFilterOr(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
          >
            <option value="ALL">All Locations</option>
            <option value="OR-1">OR-1 (Trauma & General)</option>
            <option value="OR-2">OR-2 (Orthopedic & Robotic)</option>
            <option value="OR-3">OR-3 (Cardiothoracic)</option>
            <option value="OR-4">OR-4 (Laparoscopic)</option>
            <option value="STORAGE">Storage / Mobile Cart</option>
          </select>
        </div>

        <div className="w-full sm:w-64 relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          <input
            type="text"
            placeholder="Search equipment, ID, or bundle..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none focus:bg-white dark:focus:bg-slate-800"
          />
        </div>
      </div>

      {/* Equipment Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                <th className="p-3 pl-4">Equipment Unit & Kit Package</th>
                <th className="p-3">Unit ID</th>
                <th className="p-3">Assigned Location</th>
                <th className="p-3">Kit Bundle Category</th>
                <th className="p-3">Operational Status</th>
                <th className="p-3">Sterilization State</th>
                <th className="p-3 pr-4 text-right">Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredEquipment.map((eq) => {
                const isReady =
                  eq.status === "STERILIZED" || eq.status === "ACTIVE";
                const bundleCategory = getEquipmentBundle(eq);

                return (
                  <tr
                    key={eq.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="p-3 pl-4 font-semibold text-slate-900 dark:text-white flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-400 flex items-center justify-center shrink-0 border border-sky-100 dark:border-sky-800">
                        <Stethoscope className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-medium text-slate-900 dark:text-slate-100">
                          {eq.name}
                        </span>
                        {eq.isLocalDraft && (
                          <span className="text-[10px] text-purple-600 dark:text-purple-400 block font-mono">
                            Provisioned by Staff
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 font-mono text-slate-600 dark:text-slate-300 font-medium">
                      {eq.id}
                    </td>
                    <td className="p-3 text-slate-700 dark:text-slate-300">
                      <span className="inline-flex items-center gap-1.5 font-medium">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        {eq.assignedOr || "Storage / Mobile"}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        {bundleCategory}
                      </span>
                    </td>
                    <td className="p-3">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                          eq.availability === "Available"
                            ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                            : eq.availability === "In Use"
                            ? "bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800"
                            : "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                        }`}
                      >
                        {eq.availability || "Available"}
                      </span>
                    </td>
                    <td className="p-3">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          isReady
                            ? "bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        {eq.status || "STERILIZED"}
                      </span>
                    </td>
                    <td className="p-3 pr-4 text-right">
                      <span className="text-emerald-700 dark:text-emerald-400 text-[11px] font-medium inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        OR Ready
                      </span>
                    </td>
                  </tr>
                );
              })}

              {filteredEquipment.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="p-8 text-center text-slate-500 dark:text-slate-400"
                  >
                    No equipment matched the active filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <EquipmentFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
