/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Modal } from "../common/Modal";
import { Button } from "../common/Button";
import {
  PlusCircle,
  Calendar,
  Sparkles,
  Info,
  CheckCircle2,
  Wrench,
  UserCheck,
  Building2,
  Sliders,
} from "lucide-react";
import { useSchedule } from "../../context/ScheduleContext";
import {
  matchClinicalKeywords,
  CLINICAL_KEYWORD_PROFILES,
} from "../../utils/clinicalKeywordMatcher";

export function ProcedureFormModal({ isOpen, onClose, onAdded }) {
  const {
    surgeons,
    operatingRooms,
    addLocalProcedure,
    scheduleProcedureDirectly,
    selectedDate,
  } = useSchedule();

  const [form, setForm] = useState({
    procedureId: `PROC-${Math.floor(Math.random() * 900 + 100)}`,
    procedureName: "",
    patientMockId: `PAT-00${Math.floor(Math.random() * 90 + 10)}`,
    priority: "MEDIUM",
    surgeonId: surgeons[0]?.id || "SURG-01",
    preferredOr: "OR-1",
    specialty: "General Surgery",
    requiredEquipment: "Laparoscopy Tower",
    historicalAverage: 75,
    patientComplexity: 2,
    scheduledDate: selectedDate || "2026-09-18",
    preferredTime: "10:30",
  });

  const [autoDetectEnabled, setAutoDetectEnabled] = useState(true);
  const [detectedProfile, setDetectedProfile] = useState(null);
  const [directSchedule, setDirectSchedule] = useState(true); // Schedule straight to timeline or queue
  const [error, setError] = useState("");

  // Reset or initialize on open
  useEffect(() => {
    if (isOpen) {
      setForm((prev) => ({
        ...prev,
        procedureId: `PROC-${Math.floor(Math.random() * 900 + 100)}`,
        patientMockId: `PAT-00${Math.floor(Math.random() * 90 + 10)}`,
      }));
      setError("");
      setDetectedProfile(null);
    }
  }, [isOpen]);

  const handleProcedureNameChange = (e) => {
    const value = e.target.value;
    setForm((prev) => ({ ...prev, procedureName: value }));

    if (autoDetectEnabled) {
      const match = matchClinicalKeywords(value);
      if (match) {
        setDetectedProfile(match);
        setForm((prev) => ({
          ...prev,
          specialty: match.specialty,
          preferredOr: match.preferredOr,
          surgeonId: match.surgeonId,
          requiredEquipment: match.requiredEquipment.join(", "),
          historicalAverage: match.defaultDuration,
          priority: match.priority,
          patientComplexity: match.patientComplexity,
        }));
      } else {
        setDetectedProfile(null);
      }
    }
  };

  const applyProfile = (profile) => {
    setDetectedProfile(profile);
    setForm((prev) => ({
      ...prev,
      procedureName:
        profile.id === "cardiac"
          ? "Coronary Artery Bypass Graft (CABG)"
          : profile.id === "orthopedic"
          ? "Total Knee Arthroplasty Revision"
          : profile.id === "trauma"
          ? "Emergency Trauma Exploratory Laparotomy"
          : profile.id === "neurosurgery"
          ? "Craniotomy for Subdural Evacuation"
          : "Laparoscopic Cholecystectomy",
      specialty: profile.specialty,
      preferredOr: profile.preferredOr,
      surgeonId: profile.surgeonId,
      requiredEquipment: profile.requiredEquipment.join(", "),
      historicalAverage: profile.defaultDuration,
      priority: profile.priority,
      patientComplexity: profile.patientComplexity,
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]:
        name === "historicalAverage" || name === "patientComplexity"
          ? Number(value)
          : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.procedureName.trim()) {
      setError("Please enter a procedure name or select a clinical keyword preset.");
      return;
    }

    const assignedSurgeon = surgeons.find((s) => s.id === form.surgeonId);

    // AI duration prediction formula:
    // duration = historicalAverage + (patientComplexity * 4) - (surgeonExperience > 10 ? 5 : 0)
    const surgExp = assignedSurgeon?.experience || 10;
    const estimatedPredicted = Math.round(
      form.historicalAverage + form.patientComplexity * 4 - (surgExp > 10 ? 5 : 0)
    );

    const procPayload = {
      procedureId: form.procedureId,
      procedureName: form.procedureName,
      patientMockId: form.patientMockId,
      priority: form.priority,
      surgeonId: form.surgeonId,
      surgeonName: assignedSurgeon ? assignedSurgeon.name : form.surgeonId,
      specialty: form.specialty,
      orId: form.preferredOr,
      preferredOr: form.preferredOr,
      historicalAverage: form.historicalAverage,
      predictedDuration: estimatedPredicted,
      duration: estimatedPredicted,
      durationSource: "AI Predicted",
      difference: estimatedPredicted - form.historicalAverage,
      surgeonExperience: surgExp,
      patientComplexity: form.patientComplexity,
      requiredEquipment: form.requiredEquipment
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      scheduledDate: form.scheduledDate,
      preferredTime: form.preferredTime,
    };

    let resultProc;
    if (directSchedule) {
      // Schedule directly into live OR timeline
      resultProc = scheduleProcedureDirectly(procPayload);
    } else {
      // Add to local draft caseload queue
      resultProc = addLocalProcedure(procPayload);
    }

    if (onAdded) onAdded(resultProc);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Staff Data Entry: New Surgical Procedure"
      subtitle="Register a surgical case. Type clinical keywords (e.g., 'cardiac') to auto-collect equipment & kits, or configure manually."
      maxWidth="max-w-2xl"
    >
      {/* Informational Guidance Banner */}
      <div className="mb-4 p-3 bg-sky-50 dark:bg-sky-950/50 border border-sky-200 dark:border-sky-800 rounded-lg text-xs text-sky-800 dark:text-sky-300 flex items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <Sparkles className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
          <span>
            <strong>Keyword Auto-Collection Engine:</strong> Type medical terms like{" "}
            <code className="px-1 py-0.5 rounded bg-white/70 dark:bg-slate-800 font-mono text-sky-900 dark:text-sky-200 font-bold">
              cardiac
            </code>
            ,{" "}
            <code className="px-1 py-0.5 rounded bg-white/70 dark:bg-slate-800 font-mono text-sky-900 dark:text-sky-200 font-bold">
              ortho
            </code>
            , or{" "}
            <code className="px-1 py-0.5 rounded bg-white/70 dark:bg-slate-800 font-mono text-sky-900 dark:text-sky-200 font-bold">
              trauma
            </code>
            . The system automatically populates required surgical kits, equipment, specialty, certified surgeon, and preferred OR.
          </span>
        </div>
        <button
          type="button"
          onClick={() => setAutoDetectEnabled(!autoDetectEnabled)}
          className={`shrink-0 text-[11px] font-semibold px-2 py-1 rounded border transition-colors ${
            autoDetectEnabled
              ? "bg-sky-600 text-white border-sky-600"
              : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700"
          }`}
        >
          {autoDetectEnabled ? "Auto-Collect: ON" : "Auto-Collect: OFF"}
        </button>
      </div>

      {/* Quick-Click Clinical Keyword Presets */}
      <div className="mb-4">
        <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
          Quick Clinical Keyword Presets (Click to Auto-Populate):
        </label>
        <div className="flex flex-wrap gap-1.5">
          {CLINICAL_KEYWORD_PROFILES.map((p) => {
            const isSelected = detectedProfile?.id === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => applyProfile(p)}
                className={`text-xs px-2.5 py-1.5 rounded-lg border font-medium transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-sky-100 dark:bg-sky-900/60 border-sky-400 dark:border-sky-500 text-sky-900 dark:text-sky-200 shadow-xs ring-1 ring-sky-400"
                    : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                }`}
              >
                {p.id === "cardiac" && "❤️"}
                {p.id === "orthopedic" && "🦴"}
                {p.id === "trauma" && "🚨"}
                {p.id === "general" && "🔬"}
                {p.id === "neurosurgery" && "🧠"}
                <span>{p.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Live Auto-Inference Feedback Banner */}
      {detectedProfile && (
        <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 rounded-lg text-xs text-emerald-900 dark:text-emerald-200 flex flex-col gap-1.5 animate-fadeIn">
          <div className="flex items-center justify-between">
            <span className="font-bold flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Auto-Matched: {detectedProfile.name}
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-200/60 dark:bg-emerald-800/60 text-emerald-800 dark:text-emerald-300 font-mono">
              Auto-Inferred Kits & Resources
            </span>
          </div>
          <p className="text-[11.5px] leading-relaxed text-emerald-800 dark:text-emerald-300">
            {detectedProfile.description}
          </p>
          <div className="flex flex-wrap gap-2 text-[11px] pt-1 border-t border-emerald-200 dark:border-emerald-900/60 font-medium">
            <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
              <Building2 className="w-3.5 h-3.5" /> Suite: {detectedProfile.preferredOr}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
              <UserCheck className="w-3.5 h-3.5" /> Surgeon: {detectedProfile.surgeonName}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
              <Wrench className="w-3.5 h-3.5" /> Equipment: {detectedProfile.requiredEquipment.length} items
            </span>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 p-2.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Row 1: Procedure Name & ID */}
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Procedure Name / Clinical Keyword *
            </label>
            <input
              type="text"
              name="procedureName"
              value={form.procedureName}
              onChange={handleProcedureNameChange}
              placeholder="e.g. Cardiac Bypass (CABG) or Knee Arthroplasty"
              required
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
            <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 block">
              💡 Try typing &quot;cardiac&quot;, &quot;heart&quot;, &quot;bypass&quot;, &quot;ortho&quot;, &quot;trauma&quot;, or &quot;laparoscopic&quot;
            </span>
          </div>
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Procedure ID
            </label>
            <input
              type="text"
              name="procedureId"
              value={form.procedureId}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 font-mono text-slate-600 dark:text-slate-300 focus:outline-none"
            />
          </div>
        </div>

        {/* Row 2: Patient Identifier & Priority */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Synthetic Patient ID *
            </label>
            <input
              type="text"
              name="patientMockId"
              value={form.patientMockId}
              onChange={handleChange}
              placeholder="PAT-XXX"
              required
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Clinical Priority
            </label>
            <select
              name="priority"
              value={form.priority}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-sky-500 focus:outline-none font-semibold"
            >
              <option value="LOW">LOW (Elective)</option>
              <option value="MEDIUM">MEDIUM (Standard)</option>
              <option value="HIGH">HIGH (Urgent)</option>
              <option value="CRITICAL">CRITICAL (Emergency)</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Patient Complexity (1-5)
            </label>
            <select
              name="patientComplexity"
              value={form.patientComplexity}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-sky-500 focus:outline-none"
            >
              <option value="1">1 - Minimal Risk</option>
              <option value="2">2 - Low Complexity</option>
              <option value="3">3 - Moderate Risk</option>
              <option value="4">4 - High Comorbidities</option>
              <option value="5">5 - Critical Severity</option>
            </select>
          </div>
        </div>

        {/* Row 3: Surgeon & Preferred OR */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Assigned Surgeon (Manual or Auto)
            </label>
            <select
              name="surgeonId"
              value={form.surgeonId}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-sky-500 focus:outline-none"
            >
              {surgeons.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.specialty})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Preferred Operating Room (Manual or Auto)
            </label>
            <select
              name="preferredOr"
              value={form.preferredOr}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-sky-500 focus:outline-none"
            >
              {operatingRooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.id} — {r.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 4: Historical Average Duration & Specialty */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Historical Average Duration (Minutes) *
            </label>
            <input
              type="number"
              name="historicalAverage"
              min="15"
              max="480"
              value={form.historicalAverage}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Surgical Specialty
            </label>
            <input
              type="text"
              name="specialty"
              value={form.specialty}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Row 5: Required Equipment & Kits (Auto-Collected) */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="font-semibold text-slate-700 dark:text-slate-300">
              Required Equipment & Surgical Kits (Auto-Collected or Editable)
            </label>
            <span className="text-[10.5px] text-sky-600 dark:text-sky-400 font-medium">
              Auto-mapped from clinical keyword
            </span>
          </div>
          <input
            type="text"
            name="requiredEquipment"
            value={form.requiredEquipment}
            onChange={handleChange}
            placeholder="e.g. Heart-Lung Machine, Vascular Doppler, Trauma Kit"
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-sky-500 focus:outline-none font-medium"
          />
        </div>

        {/* Scheduling Destination Mode */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700">
          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={directSchedule}
              onChange={(e) => setDirectSchedule(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded text-sky-600 focus:ring-sky-500 border-slate-300 dark:border-slate-600"
            />
            <div>
              <span className="font-bold text-slate-900 dark:text-white block">
                Schedule Directly onto Live OR Timeline
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                Automatically slots this case into the next open window in{" "}
                <strong className="text-slate-700 dark:text-slate-300">{form.preferredOr}</strong>, verifies kit availability, and adjusts real-time department utilization. (Uncheck to keep as draft queue only).
              </span>
            </div>
          </label>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            icon={directSchedule ? Calendar : PlusCircle}
          >
            {directSchedule ? "Auto-Schedule to Timeline" : "Save to Caseload Queue"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
