/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Modal } from "../common/Modal";
import { Button } from "../common/Button";
import {
  Stethoscope,
  Layers,
  PackageCheck,
  CheckCircle2,
  Wrench,
  Sparkles,
  Plus,
  Trash2,
  Building2,
} from "lucide-react";
import { useSchedule } from "../../context/ScheduleContext";

export const SURGICAL_KIT_BUNDLES = [
  {
    id: "cardiac_bundle",
    name: "Full Cardiac & Perfusion Kit Bundle",
    specialty: "Cardiothoracic Surgery",
    assignedOr: "OR-3",
    icon: "❤️",
    description: "Complete sterile setup for CABG, valve replacement, and aortic repair.",
    items: [
      { name: "Heart-Lung Perfusion Machine", status: "STERILIZED", code: "HLM" },
      { name: "Vascular Doppler System", status: "ACTIVE", code: "VDS" },
      { name: "Sternal Saw & Micro-Wire Kit", status: "STERILIZED", code: "SSK" },
      { name: "Coronary Perfusion Cannula System", status: "STERILIZED", code: "CPC" },
      { name: "Emergency Thoracotomy Tray", status: "STERILIZED", code: "ETT" },
    ],
  },
  {
    id: "ortho_bundle",
    name: "Orthopedic Reconstruction & Arthroplasty Bundle",
    specialty: "Orthopedic Surgery",
    assignedOr: "OR-2",
    icon: "🦴",
    description: "Specialized power tools, robotic navigation, and fluoroscopy for joint replacement.",
    items: [
      { name: "Orthopedic Power Drill System", status: "STERILIZED", code: "OPD" },
      { name: "Robotic Surgical System (DaVinci/Mako)", status: "STANDBY", code: "RSS" },
      { name: "Mobile C-Arm Fluoroscopy Unit", status: "ACTIVE", code: "CAF" },
      { name: "Total Joint Arthroplasty Instrument Set", status: "STERILIZED", code: "TJA" },
      { name: "Synthes Bone Reamer Set", status: "STERILIZED", code: "BRS" },
    ],
  },
  {
    id: "trauma_bundle",
    name: "Critical Trauma Resuscitation Bundle",
    specialty: "Trauma Surgery",
    assignedOr: "OR-1",
    icon: "🚨",
    description: "Rapid intervention kit for emergency laparotomy, hemorrhaging, and shock.",
    items: [
      { name: "Trauma Surgical Kit #1", status: "STERILIZED", code: "TSK" },
      { name: "Rapid Blood Infusion System (Belmont)", status: "ACTIVE", code: "RBI" },
      { name: "Mobile C-Arm Fluoroscopy Unit", status: "ACTIVE", code: "CAF" },
      { name: "Exploratory Laparotomy Retractor Tray", status: "STERILIZED", code: "ELT" },
      { name: "Vascular Shunt & Hemostatic Clamp Pack", status: "STERILIZED", code: "VHC" },
    ],
  },
  {
    id: "laparoscopy_bundle",
    name: "Minimally Invasive Laparoscopy Suite Bundle",
    specialty: "General Surgery / Laparoscopy",
    assignedOr: "OR-4",
    icon: "🔬",
    description: "High-definition endoscopic tower, insufflation, and ultrasonic dissection.",
    items: [
      { name: "HD Laparoscopy Video Tower", status: "ACTIVE", code: "LVT" },
      { name: "4K Endoscopy Camera & Medical Monitor", status: "ACTIVE", code: "ECM" },
      { name: "Automated CO2 Insufflator & Trocar Pack", status: "STERILIZED", code: "CIT" },
      { name: "Harmonic Ultrasonic Scalpel Generator", status: "STERILIZED", code: "USG" },
    ],
  },
  {
    id: "neurosurgery_bundle",
    name: "Neurosurgery Micro-Craniotomy Bundle",
    specialty: "Neurosurgery",
    assignedOr: "OR-1",
    icon: "🧠",
    description: "Microscopic magnification, cranial stabilization, and stereotactic navigation.",
    items: [
      { name: "High-Magnification Surgical Microscope", status: "ACTIVE", code: "HSM" },
      { name: "Stereotactic Neuro Navigation System", status: "STANDBY", code: "NNS" },
      { name: "Cavitron Ultrasonic Surgical Aspirator (CUSA)", status: "STERILIZED", code: "USA" },
      { name: "Mayfield Cranial Stabilization Headrest", status: "STERILIZED", code: "CSH" },
    ],
  },
];

export function EquipmentFormModal({ isOpen, onClose }) {
  const { operatingRooms, addLocalEquipment, addLocalEquipmentBatch } = useSchedule();

  // Mode: "BUNDLE" | "BATCH" | "SINGLE"
  const [entryMode, setEntryMode] = useState("BUNDLE");

  // Bundle selection
  const [selectedBundleId, setSelectedBundleId] = useState(SURGICAL_KIT_BUNDLES[0].id);
  const [bundleTargetOr, setBundleTargetOr] = useState(SURGICAL_KIT_BUNDLES[0].assignedOr);

  // Batch text entry
  const [batchText, setBatchText] = useState(
    "Heart-Lung Machine, Vascular Doppler, Sternal Saw Kit, Perfusion Cannula"
  );
  const [batchOr, setBatchOr] = useState("OR-3");
  const [batchStatus, setBatchStatus] = useState("STERILIZED");

  // Single form
  const [singleForm, setSingleForm] = useState({
    id: `EQ-${Math.floor(Math.random() * 900 + 100)}`,
    name: "",
    assignedOr: "OR-1",
    status: "STERILIZED",
  });

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const activeBundle =
    SURGICAL_KIT_BUNDLES.find((b) => b.id === selectedBundleId) ||
    SURGICAL_KIT_BUNDLES[0];

  const handleSelectBundle = (bundle) => {
    setSelectedBundleId(bundle.id);
    setBundleTargetOr(bundle.assignedOr);
  };

  const handleProvisionBundle = (e) => {
    e.preventDefault();
    setError("");

    const itemsToProvision = activeBundle.items.map((item, idx) => ({
      id: `EQ-${item.code}-${Math.floor(Math.random() * 900 + 100)}`,
      name: item.name,
      assignedOr: bundleTargetOr,
      status: item.status || "STERILIZED",
      availability: "Available",
      bundle: activeBundle.name,
    }));

    addLocalEquipmentBatch(itemsToProvision, activeBundle.name);
    setSuccessMessage(`Successfully provisioned ${itemsToProvision.length} equipment units for "${activeBundle.name}" into ${bundleTargetOr}!`);

    setTimeout(() => {
      setSuccessMessage("");
      onClose();
    }, 900);
  };

  const handleProvisionBatch = (e) => {
    e.preventDefault();
    setError("");

    const parsedNames = batchText
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter(Boolean);

    if (parsedNames.length === 0) {
      setError("Please enter at least one equipment or kit name.");
      return;
    }

    const itemsToProvision = parsedNames.map((name, idx) => ({
      id: `EQ-BATCH-${Math.floor(Math.random() * 900 + 100)}-${idx + 1}`,
      name,
      assignedOr: batchOr,
      status: batchStatus,
      availability: "Available",
      bundle: "Custom Batch Provisioning",
    }));

    addLocalEquipmentBatch(itemsToProvision, "Batch Multi-Equipment");
    setSuccessMessage(`Successfully provisioned ${itemsToProvision.length} equipment units into ${batchOr}!`);

    setTimeout(() => {
      setSuccessMessage("");
      onClose();
    }, 900);
  };

  const handleProvisionSingle = (e) => {
    e.preventDefault();
    setError("");

    if (!singleForm.name.trim()) {
      setError("Please enter equipment name.");
      return;
    }

    addLocalEquipment({
      id: singleForm.id,
      name: singleForm.name.trim(),
      assignedOr: singleForm.assignedOr,
      status: singleForm.status,
      availability: "Available",
    });

    setSuccessMessage(`Registered "${singleForm.name}" successfully!`);
    setTimeout(() => {
      setSuccessMessage("");
      onClose();
    }, 900);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Surgical Equipment & Sterile Kits Provisioning"
      subtitle="Register full surgical kit packages (e.g., Complete Cardiac Bundle), batch import multiple units, or add single devices."
      maxWidth="max-w-2xl"
    >
      {/* Mode Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 mb-4">
        <button
          type="button"
          onClick={() => {
            setEntryMode("BUNDLE");
            setError("");
          }}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
            entryMode === "BUNDLE"
              ? "border-sky-600 text-sky-700 dark:text-sky-400 bg-sky-50/50 dark:bg-sky-950/30"
              : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
          }`}
        >
          <PackageCheck className="w-4 h-4" />
          <span>Complete Kit Bundles (1-Click)</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setEntryMode("BATCH");
            setError("");
          }}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
            entryMode === "BATCH"
              ? "border-sky-600 text-sky-700 dark:text-sky-400 bg-sky-50/50 dark:bg-sky-950/30"
              : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Batch Multi-Equipment</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setEntryMode("SINGLE");
            setError("");
          }}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
            entryMode === "SINGLE"
              ? "border-sky-600 text-sky-700 dark:text-sky-400 bg-sky-50/50 dark:bg-sky-950/30"
              : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
          }`}
        >
          <Wrench className="w-4 h-4" />
          <span>Single Unit</span>
        </button>
      </div>

      {error && (
        <div className="mb-4 p-2.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs rounded-lg">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="mb-4 p-2.5 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs rounded-lg flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* =====================================================================
          MODE 1: PRE-CONFIGURED SURGICAL KIT BUNDLES (1-CLICK)
          ===================================================================== */}
      {entryMode === "BUNDLE" && (
        <form onSubmit={handleProvisionBundle} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Select Surgical Kit Bundle to Provision:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SURGICAL_KIT_BUNDLES.map((bundle) => {
                const isSelected = selectedBundleId === bundle.id;
                return (
                  <button
                    key={bundle.id}
                    type="button"
                    onClick={() => handleSelectBundle(bundle)}
                    className={`p-3 text-left rounded-lg border transition-all flex items-start gap-2.5 ${
                      isSelected
                        ? "bg-sky-50 dark:bg-sky-950/50 border-sky-500 dark:border-sky-400 ring-2 ring-sky-500/20 shadow-xs"
                        : "bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                    }`}
                  >
                    <span className="text-xl shrink-0 mt-0.5">{bundle.icon}</span>
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                        <span className="truncate">{bundle.name}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                        {bundle.description}
                      </p>
                      <div className="mt-1.5 flex items-center gap-2 text-[10.5px]">
                        <span className="font-semibold text-sky-700 dark:text-sky-300">
                          {bundle.items.length} Sterile Units
                        </span>
                        <span>•</span>
                        <span className="text-slate-500 dark:text-slate-400">
                          Default: {bundle.assignedOr}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bundle Content Breakdown Box */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                Bundle Inventory Checklist ({activeBundle.items.length} items):
              </span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-sky-100 dark:bg-sky-900/60 text-sky-800 dark:text-sky-300">
                {activeBundle.specialty}
              </span>
            </div>

            <div className="space-y-1.5 mb-3">
              {activeBundle.items.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-2 bg-white dark:bg-slate-800 rounded-md border border-slate-200/80 dark:border-slate-700/80 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {item.name}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-mono">
                    {item.status}
                  </span>
                </div>
              ))}
            </div>

            {/* Target Operating Room Selector */}
            <div className="flex items-center gap-3 pt-2.5 border-t border-slate-200 dark:border-slate-700">
              <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 shrink-0">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                Assign Destination Suite:
              </label>
              <select
                value={bundleTargetOr}
                onChange={(e) => setBundleTargetOr(e.target.value)}
                className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
              >
                <option value="Storage / Mobile">Storage / Mobile Central Cart</option>
                {operatingRooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.id} — {r.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" icon={PackageCheck}>
              Provision Full Bundle ({activeBundle.items.length} Units)
            </Button>
          </div>
        </form>
      )}

      {/* =====================================================================
          MODE 2: BATCH MULTI-EQUIPMENT (COMMA OR NEWLINE SEPARATED)
          ===================================================================== */}
      {entryMode === "BATCH" && (
        <form onSubmit={handleProvisionBatch} className="space-y-4 text-xs">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Equipment & Kit Names (Comma or Newline Separated) *
              </label>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Paste list or type multiple items
              </span>
            </div>
            <textarea
              rows={4}
              value={batchText}
              onChange={(e) => setBatchText(e.target.value)}
              placeholder="e.g. Heart-Lung Machine, Vascular Doppler, Sternal Saw Kit, Rapid Blood Infuser"
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-sky-500 focus:outline-none font-mono"
            />
          </div>

          {/* Quick Item Preview Tags */}
          <div>
            <span className="block font-semibold text-slate-600 dark:text-slate-400 text-[11px] uppercase tracking-wider mb-1.5">
              Detected Equipment Units Preview:
            </span>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
              {batchText
                .split(/[\n,]+/)
                .map((s) => s.trim())
                .filter(Boolean)
                .map((name, i) => (
                  <span
                    key={i}
                    className="px-2 py-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1 font-medium"
                  >
                    <CheckCircle2 className="w-3 h-3 text-sky-600" />
                    {name}
                  </span>
                ))}
              {batchText.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean).length === 0 && (
                <span className="text-slate-400 text-xs italic">
                  No items entered yet. Type above to preview items.
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Assigned OR Location
              </label>
              <select
                value={batchOr}
                onChange={(e) => setBatchOr(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
              >
                <option value="Storage / Mobile">Storage / Mobile Central Cart</option>
                {operatingRooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.id} ({r.name})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Sterilization & Readiness State
              </label>
              <select
                value={batchStatus}
                onChange={(e) => setBatchStatus(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
              >
                <option value="STERILIZED">STERILIZED & READY</option>
                <option value="ACTIVE">ACTIVE / IN USE</option>
                <option value="STANDBY">STANDBY / CALIBRATED</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" icon={Layers}>
              Batch Register All Equipment
            </Button>
          </div>
        </form>
      )}

      {/* =====================================================================
          MODE 3: SINGLE EQUIPMENT UNIT
          ===================================================================== */}
      {entryMode === "SINGLE" && (
        <form onSubmit={handleProvisionSingle} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Equipment Unit Name *
            </label>
            <input
              type="text"
              required
              value={singleForm.name}
              onChange={(e) =>
                setSingleForm({ ...singleForm, name: e.target.value })
              }
              placeholder="e.g. Ultrasonic Surgical Aspirator (CUSA)"
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Equipment Unit ID
              </label>
              <input
                type="text"
                value={singleForm.id}
                onChange={(e) =>
                  setSingleForm({ ...singleForm, id: e.target.value })
                }
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 font-mono text-slate-600 dark:text-slate-300 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Assigned OR Location
              </label>
              <select
                value={singleForm.assignedOr}
                onChange={(e) =>
                  setSingleForm({ ...singleForm, assignedOr: e.target.value })
                }
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-sky-500 focus:outline-none"
              >
                <option value="Storage / Mobile">Storage / Mobile</option>
                {operatingRooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.id} ({r.name})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Sterilization & Readiness Status
            </label>
            <select
              value={singleForm.status}
              onChange={(e) =>
                setSingleForm({ ...singleForm, status: e.target.value })
              }
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-sky-500 focus:outline-none"
            >
              <option value="STERILIZED">STERILIZED & READY</option>
              <option value="ACTIVE">ACTIVE / IN USE</option>
              <option value="STANDBY">STANDBY</option>
              <option value="MAINTENANCE">MAINTENANCE / CALIBRATION</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" icon={Stethoscope}>
              Save Equipment
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
