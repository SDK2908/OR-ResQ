/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { Modal } from "../common/Modal";
import { Button } from "../common/Button";
import {
  AlertOctagon,
  Sparkles,
  Clock,
  AlertTriangle,
  UserX,
  DoorClosed,
  Activity,
  CheckCircle2,
  Calendar,
  Layers,
} from "lucide-react";
import { useSchedule } from "../../context/ScheduleContext";
import { matchClinicalKeywords } from "../../utils/clinicalKeywordMatcher";

const DISRUPTION_TYPES = [
  {
    id: "EMERGENCY_CASE",
    label: "Emergency Case",
    icon: AlertOctagon,
    badgeColor: "text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/60 border-red-200 dark:border-red-800",
    desc: "Unscheduled critical trauma arrival requiring immediate OR preemption",
  },
  {
    id: "SURGEON_UNAVAILABLE",
    label: "Surgeon Not Available",
    icon: UserX,
    badgeColor: "text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800",
    desc: "Attending surgeon emergency absence, illness, or emergency room call",
  },
  {
    id: "OR_UNAVAILABLE",
    label: "OR Suite Breakdown",
    icon: DoorClosed,
    badgeColor: "text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800",
    desc: "HVAC contamination, robotic hardware malfunction, or room outage",
  },
  {
    id: "SURGERY_OVERRUN",
    label: "Surgery Overrun",
    icon: Clock,
    badgeColor: "text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-950/60 border-orange-200 dark:border-orange-800",
    desc: "Active procedure running past scheduled end due to complications",
  },
];

export function EmergencyModal({ isOpen, onClose, onSuccess }) {
  const {
    surgeons,
    operatingRooms,
    currentSchedule,
    handleSimulateEmergency,
    isSimulatingEmergency,
  } = useSchedule();

  const [disruptionType, setDisruptionType] = useState("EMERGENCY_CASE");

  // Form states for all disruption modes
  const [formData, setFormData] = useState({
    // Emergency Case fields
    procedureName: "Emergency Trauma Laparotomy",
    priority: "CRITICAL",
    duration: 90,
    requiredSpecialty: "Trauma Surgery",
    surgeonId: "SURG-01",
    targetOrId: "OR-1",
    requiredEquipment: "Trauma Kit",
    emergencyTime: 570, // 09:30 AM

    // Surgeon Unavailable fields
    unavailableSurgeonId: "SURG-01",
    surgeonAbsenceReason: "Emergency Department Trauma Call & Resuscitation",
    absenceStartTime: 570, // 09:30 AM
    absenceDuration: 180, // 3 hours

    // OR Suite Unavailable fields
    unavailableOrId: "OR-2",
    roomFailureReason: "DaVinci Robotic & C-Arm Power Supply Failure",
    outageStartTime: 585, // 09:45 AM
    outageDuration: 240, // 4 hours

    // Surgery Overrun fields
    overrunProcedureId: "PROC-101",
    overrunMinutes: 60,
    overrunReason: "Extensive dense adhesions & unexpected bleeding requiring hemostasis",
  });

  const [simulationStage, setSimulationStage] = useState(0); // 0=idle, 1=detected, 2=analyzing, 3=generating
  const [error, setError] = useState("");
  const [detectedEmergencyProfile, setDetectedEmergencyProfile] = useState(null);

  const formatMinutesToTime = (min) => {
    const hours = Math.floor(min / 60);
    const mins = min % 60;
    const period = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 === 0 ? 12 : hours % 12;
    return `${displayHours.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")} ${period}`;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const numFields = [
      "duration",
      "emergencyTime",
      "absenceStartTime",
      "absenceDuration",
      "outageStartTime",
      "outageDuration",
      "overrunMinutes",
    ];

    if (name === "procedureName" && disruptionType === "EMERGENCY_CASE") {
      const match = matchClinicalKeywords(value);
      if (match) {
        setDetectedEmergencyProfile(match);
        setFormData((prev) => ({
          ...prev,
          procedureName: value,
          requiredSpecialty: match.specialty,
          surgeonId: match.surgeonId,
          targetOrId: match.preferredOr,
          requiredEquipment: match.requiredEquipment.join(", "),
          duration: match.defaultDuration,
          priority: "CRITICAL",
        }));
        return;
      } else {
        setDetectedEmergencyProfile(null);
      }
    }

    setFormData((prev) => ({
      ...prev,
      [name]: numFields.includes(name) ? Number(value) : value,
    }));
  };

  // Find procedure details for Surgery Overrun
  const selectedOverrunProcedure = useMemo(() => {
    return currentSchedule.find((p) => p.id === formData.overrunProcedureId) || currentSchedule[0];
  }, [currentSchedule, formData.overrunProcedureId]);

  // Affected procedures preview for Surgeon Unavailable
  const affectedSurgeonProcedures = useMemo(() => {
    const sId = formData.unavailableSurgeonId;
    return currentSchedule.filter(
      (p) =>
        p.surgeonId === sId &&
        (p.startTime || 0) < formData.absenceStartTime + formData.absenceDuration &&
        (p.endTime || 0) > formData.absenceStartTime
    );
  }, [currentSchedule, formData.unavailableSurgeonId, formData.absenceStartTime, formData.absenceDuration]);

  // Affected procedures preview for OR Suite Unavailable
  const affectedRoomProcedures = useMemo(() => {
    const rId = formData.unavailableOrId;
    return currentSchedule.filter(
      (p) =>
        p.orId === rId &&
        (p.startTime || 0) < formData.outageStartTime + formData.outageDuration &&
        (p.endTime || 0) > formData.outageStartTime
    );
  }, [currentSchedule, formData.unavailableOrId, formData.outageStartTime, formData.outageDuration]);

  // Affected downstream procedures for Overrun
  const downstreamOverrunProcedures = useMemo(() => {
    if (!selectedOverrunProcedure) return [];
    const origEnd = selectedOverrunProcedure.endTime || 0;
    const newEnd = origEnd + formData.overrunMinutes;
    return currentSchedule.filter(
      (p) =>
        p.id !== selectedOverrunProcedure.id &&
        p.orId === selectedOverrunProcedure.orId &&
        (p.startTime || 0) < newEnd &&
        (p.endTime || 0) > origEnd
    );
  }, [currentSchedule, selectedOverrunProcedure, formData.overrunMinutes]);

  // Presets
  const setPresetEmergencyTrauma = () => {
    setFormData((prev) => ({
      ...prev,
      procedureName: "Emergency Trauma Laparotomy",
      priority: "CRITICAL",
      duration: 90,
      requiredSpecialty: "Trauma Surgery",
      surgeonId: "SURG-01",
      targetOrId: "OR-1",
      requiredEquipment: "Trauma Kit",
      emergencyTime: 570,
    }));
  };

  const setPresetEmergencyAortic = () => {
    setFormData((prev) => ({
      ...prev,
      procedureName: "Ruptured Abdominal Aortic Aneurysm",
      priority: "CRITICAL",
      duration: 120,
      requiredSpecialty: "Cardiothoracic Surgery",
      surgeonId: "SURG-03",
      targetOrId: "OR-3",
      requiredEquipment: "Heart-Lung Machine, Trauma Kit",
      emergencyTime: 600,
    }));
  };

  const setPresetSurgeonAbsenceTrauma = () => {
    setFormData((prev) => ({
      ...prev,
      unavailableSurgeonId: "SURG-01",
      surgeonAbsenceReason: "Level-1 Mass Casualty Trauma Resuscitation Call",
      absenceStartTime: 570,
      absenceDuration: 180,
    }));
  };

  const setPresetSurgeonAbsenceOrtho = () => {
    setFormData((prev) => ({
      ...prev,
      unavailableSurgeonId: "SURG-02",
      surgeonAbsenceReason: "Acute Illness / Shift Medical Emergency",
      absenceStartTime: 570,
      absenceDuration: 240,
    }));
  };

  const setPresetOROutageOrtho = () => {
    setFormData((prev) => ({
      ...prev,
      unavailableOrId: "OR-2",
      roomFailureReason: "DaVinci Robotic & C-Arm System Electrical Fault",
      outageStartTime: 585,
      outageDuration: 240,
    }));
  };

  const setPresetOROutageHVAC = () => {
    setFormData((prev) => ({
      ...prev,
      unavailableOrId: "OR-1",
      roomFailureReason: "HEPA Laminar Airflow Bio-Contamination Alarm",
      outageStartTime: 570,
      outageDuration: 180,
    }));
  };

  const setPresetOverrunLapChole = () => {
    setFormData((prev) => ({
      ...prev,
      overrunProcedureId: "PROC-101",
      overrunMinutes: 60,
      overrunReason: "Extensive dense scar adhesions & hemostasis requirement",
    }));
  };

  const setPresetOverrunKnee = () => {
    const kneeProc = currentSchedule.find((p) => p.procedureName?.toLowerCase().includes("knee")) || currentSchedule[1];
    setFormData((prev) => ({
      ...prev,
      overrunProcedureId: kneeProc?.id || "PROC-103",
      overrunMinutes: 75,
      overrunReason: "Complex bone revision & component size realignment",
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    setSimulationStage(1); // "Disruption detected"
    await new Promise((r) => setTimeout(r, 400));

    setSimulationStage(2); // "Analyzing constraints & schedule buffer..."
    await new Promise((r) => setTimeout(r, 450));

    setSimulationStage(3); // "Generating deterministic recovery plans..."
    await new Promise((r) => setTimeout(r, 450));

    let payload = {
      disruptionType,
    };

    if (disruptionType === "EMERGENCY_CASE") {
      if (!formData.procedureName.trim()) {
        setError("Please enter a procedure name.");
        setSimulationStage(0);
        return;
      }
      payload = {
        disruptionType: "EMERGENCY_CASE",
        procedureName: formData.procedureName,
        priority: formData.priority,
        duration: Number(formData.duration) || 90,
        requiredSpecialty: formData.requiredSpecialty,
        surgeonId: formData.surgeonId,
        targetOrId: formData.targetOrId,
        requiredEquipment: formData.requiredEquipment
          ? formData.requiredEquipment.split(",").map((s) => s.trim()).filter(Boolean)
          : ["Trauma Kit"],
        emergencyTime: Number(formData.emergencyTime) || 570,
      };
    } else if (disruptionType === "SURGEON_UNAVAILABLE") {
      const surgeonObj = surgeons.find((s) => s.id === formData.unavailableSurgeonId);
      payload = {
        disruptionType: "SURGEON_UNAVAILABLE",
        surgeonId: formData.unavailableSurgeonId,
        surgeonName: surgeonObj ? surgeonObj.name : "Dr. Marcus Vance",
        reason: formData.surgeonAbsenceReason || "Emergency room shift absence",
        absenceStartTime: Number(formData.absenceStartTime) || 570,
        duration: Number(formData.absenceDuration) || 180,
      };
    } else if (disruptionType === "OR_UNAVAILABLE") {
      payload = {
        disruptionType: "OR_UNAVAILABLE",
        orId: formData.unavailableOrId,
        reason: formData.roomFailureReason || "Equipment calibration failure",
        outageStartTime: Number(formData.outageStartTime) || 570,
        duration: Number(formData.outageDuration) || 240,
      };
    } else if (disruptionType === "SURGERY_OVERRUN") {
      const proc = selectedOverrunProcedure || currentSchedule[0];
      payload = {
        disruptionType: "SURGERY_OVERRUN",
        procedureId: proc ? proc.id : "PROC-101",
        procedureName: proc ? proc.procedureName : "Laparoscopic Cholecystectomy",
        orId: proc ? proc.orId : "OR-1",
        surgeonId: proc ? proc.surgeonId : "SURG-01",
        overrunMinutes: Number(formData.overrunMinutes) || 60,
        reason: formData.overrunReason || "Intraoperative complications",
      };
    }

    const result = await handleSimulateEmergency(payload);
    setSimulationStage(0);

    if (result && result.success) {
      onClose();
      if (onSuccess) onSuccess();
    } else {
      setError(result?.error || "Could not simulate recovery strategies.");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="OR Disruption & Emergency Simulator"
      subtitle="Select an operational disruption scenario to compute deterministic schedule recovery strategies."
      maxWidth="max-w-2xl"
    >
      {/* Scenario Selection Tabs */}
      <div className="mb-5">
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
          Select Disruption Scenario:
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {DISRUPTION_TYPES.map((type) => {
            const Icon = type.icon;
            const isSelected = disruptionType === type.id;
            return (
              <button
                key={type.id}
                type="button"
                onClick={() => {
                  setDisruptionType(type.id);
                  setError("");
                }}
                className={`p-2.5 rounded-xl border text-left transition-all flex flex-col items-start gap-1.5 ${
                  isSelected
                    ? "bg-sky-50 dark:bg-sky-950/60 border-sky-400 dark:border-sky-600 ring-2 ring-sky-400/50 shadow-xs"
                    : "bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                }`}
              >
                <div className="flex items-center gap-1.5 w-full">
                  <div
                    className={`p-1 rounded-md ${
                      isSelected
                        ? "bg-sky-600 text-white"
                        : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-bold truncate">{type.label}</span>
                </div>
                <span className="text-[10.5px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-tight">
                  {type.desc}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Scenario-specific Presets bar */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800 flex-wrap gap-2">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
          Quick Demo Presets:
        </span>
        <div className="flex gap-2 flex-wrap">
          {disruptionType === "EMERGENCY_CASE" && (
            <>
              <button
                type="button"
                onClick={setPresetEmergencyTrauma}
                className="text-xs px-2.5 py-1 rounded bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/80 font-medium border border-red-200 dark:border-red-800 transition-colors"
              >
                🚨 Trauma Laparotomy (09:30 AM)
              </button>
              <button
                type="button"
                onClick={setPresetEmergencyAortic}
                className="text-xs px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 font-medium border border-slate-200 dark:border-slate-700 transition-colors"
              >
                Aortic Rupture (10:00 AM)
              </button>
            </>
          )}

          {disruptionType === "SURGEON_UNAVAILABLE" && (
            <>
              <button
                type="button"
                onClick={setPresetSurgeonAbsenceTrauma}
                className="text-xs px-2.5 py-1 rounded bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/80 font-medium border border-rose-200 dark:border-rose-800 transition-colors"
              >
                👨‍⚕️ Dr. Vance (Trauma Dept Call)
              </button>
              <button
                type="button"
                onClick={setPresetSurgeonAbsenceOrtho}
                className="text-xs px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 font-medium border border-slate-200 dark:border-slate-700 transition-colors"
              >
                Dr. Rostova (Medical Leave)
              </button>
            </>
          )}

          {disruptionType === "OR_UNAVAILABLE" && (
            <>
              <button
                type="button"
                onClick={setPresetOROutageOrtho}
                className="text-xs px-2.5 py-1 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/80 font-medium border border-amber-200 dark:border-amber-800 transition-colors"
              >
                🏥 OR-2 Robot Hardware Fault (4h)
              </button>
              <button
                type="button"
                onClick={setPresetOROutageHVAC}
                className="text-xs px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 font-medium border border-slate-200 dark:border-slate-700 transition-colors"
              >
                OR-1 HEPA HVAC Contamination
              </button>
            </>
          )}

          {disruptionType === "SURGERY_OVERRUN" && (
            <>
              <button
                type="button"
                onClick={setPresetOverrunLapChole}
                className="text-xs px-2.5 py-1 rounded bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 hover:bg-orange-100 dark:hover:bg-orange-900/80 font-medium border border-orange-200 dark:border-orange-800 transition-colors"
              >
                ⏱️ Lap Chole Overrun (+60 min)
              </button>
              <button
                type="button"
                onClick={setPresetOverrunKnee}
                className="text-xs px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 font-medium border border-slate-200 dark:border-slate-700 transition-colors"
              >
                Knee Arthroplasty (+75 min)
              </button>
            </>
          )}
        </div>
      </div>

      {/* Progressive Simulation Feedback Banner */}
      {simulationStage > 0 && (
        <div className="mb-4 p-3 bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 rounded-lg flex items-center gap-3 animate-pulse">
          <Sparkles className="w-5 h-5 text-sky-600 dark:text-sky-400 shrink-0" />
          <div className="text-xs">
            <p className="font-bold text-sky-900 dark:text-sky-300">
              {simulationStage === 1 && "Disruption Event Registered..."}
              {simulationStage === 2 && "Analyzing schedule constraints, OR capacity & idle windows..."}
              {simulationStage === 3 && "Computing 3 deterministic recovery plans (Plans A, B, C)..."}
            </p>
            <p className="text-sky-700 dark:text-sky-400 text-[11px] mt-0.5">
              Optimizing for minimal schedule disruption cost, staff overtime, and turnover delay.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* =========================================================================
            SCENARIO 1: EMERGENCY CASE ARRIVAL
           ========================================================================= */}
        {disruptionType === "EMERGENCY_CASE" && (
          <>
            {/* Procedure Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Emergency Procedure Name *
              </label>
              <input
                type="text"
                name="procedureName"
                value={formData.procedureName}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                placeholder="e.g. Emergency Trauma Laparotomy"
              />
              <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 block">
                💡 Type &quot;cardiac&quot;, &quot;aortic&quot;, &quot;ortho&quot;, or &quot;trauma&quot; to auto-assign equipment, kits, room &amp; surgeon.
              </span>

              {detectedEmergencyProfile && (
                <div className="mt-2 p-2.5 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 rounded-lg text-xs text-emerald-900 dark:text-emerald-200 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-semibold text-[11.5px]">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Auto-Detected {detectedEmergencyProfile.name}: Kits &amp; Suite {detectedEmergencyProfile.preferredOr} Auto-Assigned</span>
                  </div>
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-mono">
                    {detectedEmergencyProfile.requiredEquipment.length} kits allocated
                  </span>
                </div>
              )}
            </div>

            {/* Priority & Duration */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Clinical Priority
                </label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 font-semibold text-red-700 dark:text-red-400"
                >
                  <option value="CRITICAL">CRITICAL (Immediate OR Preemption)</option>
                  <option value="HIGH">HIGH (Urgent within 2 Hours)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Estimated Duration (Minutes) *
                </label>
                <input
                  type="number"
                  name="duration"
                  min="15"
                  max="480"
                  value={formData.duration}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            {/* Surgeon & Emergency Arrival Time */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Assigned On-Duty Surgeon
                </label>
                <select
                  name="surgeonId"
                  value={formData.surgeonId}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  {surgeons.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.specialty})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Emergency Arrival Time
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    name="emergencyTime"
                    min="480"
                    max="1080"
                    step="15"
                    value={formData.emergencyTime}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                  <span className="text-xs font-mono text-slate-500 dark:text-slate-400 shrink-0">
                    ({formatMinutesToTime(formData.emergencyTime)})
                  </span>
                </div>
              </div>
            </div>

            {/* Target OR & Required Equipment */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Preferred / Primary Target OR
                </label>
                <select
                  name="targetOrId"
                  value={formData.targetOrId}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  {operatingRooms.map((or) => (
                    <option key={or.id} value={or.id}>
                      {or.name} ({or.id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Required Equipment (comma separated)
                </label>
                <input
                  type="text"
                  name="requiredEquipment"
                  value={formData.requiredEquipment}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="e.g. Trauma Kit, Laparoscopy Tower"
                />
              </div>
            </div>
          </>
        )}

        {/* =========================================================================
            SCENARIO 2: SURGEON UNAVAILABLE
           ========================================================================= */}
        {disruptionType === "SURGEON_UNAVAILABLE" && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Unavailable Attending Surgeon *
                </label>
                <select
                  name="unavailableSurgeonId"
                  value={formData.unavailableSurgeonId}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  {surgeons.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} — {s.specialty}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Absence Start Time & Duration
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    name="absenceStartTime"
                    min="480"
                    max="1080"
                    step="15"
                    value={formData.absenceStartTime}
                    onChange={handleChange}
                    className="w-1/2 px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                  <select
                    name="absenceDuration"
                    value={formData.absenceDuration}
                    onChange={handleChange}
                    className="w-1/2 px-2 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
                  >
                    <option value={120}>2 Hours (120m)</option>
                    <option value={180}>3 Hours (180m)</option>
                    <option value={240}>4 Hours (240m)</option>
                    <option value={360}>Rest of Shift (360m)</option>
                  </select>
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 block">
                  Effective from {formatMinutesToTime(formData.absenceStartTime)} until{" "}
                  {formatMinutesToTime(formData.absenceStartTime + formData.absenceDuration)}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Reason / Disruption Cause
              </label>
              <input
                type="text"
                name="surgeonAbsenceReason"
                value={formData.surgeonAbsenceReason}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                placeholder="e.g. Level-1 Trauma Resuscitation Call, Acute Illness"
              />
            </div>

            {/* Live Impact Preview */}
            <div className="p-3 bg-rose-50/70 dark:bg-rose-950/40 rounded-lg border border-rose-200 dark:border-rose-900/60">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-rose-900 dark:text-rose-300 flex items-center gap-1.5">
                  <UserX className="w-3.5 h-3.5" />
                  Scheduled Procedures at Risk ({affectedSurgeonProcedures.length}):
                </span>
                <span className="text-[10px] text-rose-700 dark:text-rose-400">
                  {affectedSurgeonProcedures.length > 0
                    ? "Requires substitute or postponement"
                    : "No direct conflicts in window"}
                </span>
              </div>
              {affectedSurgeonProcedures.length > 0 ? (
                <div className="space-y-1 mt-1">
                  {affectedSurgeonProcedures.map((proc) => (
                    <div
                      key={proc.id}
                      className="text-xs flex items-center justify-between p-1.5 rounded bg-white/80 dark:bg-slate-900/80 border border-rose-200 dark:border-rose-800 font-mono"
                    >
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {proc.procedureName}
                      </span>
                      <span className="text-slate-500 dark:text-slate-400">
                        {proc.orId} @ {formatMinutesToTime(proc.startTime)} ({proc.duration}m)
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                  Surgeon has no overlapping cases scheduled during this absence window.
                </p>
              )}
            </div>
          </>
        )}

        {/* =========================================================================
            SCENARIO 3: OR BREAKDOWN / OUTAGE
           ========================================================================= */}
        {disruptionType === "OR_UNAVAILABLE" && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Operating Room Experiencing Outage *
                </label>
                <select
                  name="unavailableOrId"
                  value={formData.unavailableOrId}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-semibold text-amber-700 dark:text-amber-400"
                >
                  {operatingRooms.map((or) => (
                    <option key={or.id} value={or.id}>
                      {or.name} ({or.id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Outage Start Time & Duration
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    name="outageStartTime"
                    min="480"
                    max="1080"
                    step="15"
                    value={formData.outageStartTime}
                    onChange={handleChange}
                    className="w-1/2 px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                  <select
                    name="outageDuration"
                    value={formData.outageDuration}
                    onChange={handleChange}
                    className="w-1/2 px-2 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
                  >
                    <option value={120}>2 Hours (120m)</option>
                    <option value={180}>3 Hours (180m)</option>
                    <option value={240}>4 Hours (240m)</option>
                    <option value={360}>Rest of Day (360m)</option>
                  </select>
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 block">
                  Offline from {formatMinutesToTime(formData.outageStartTime)} until{" "}
                  {formatMinutesToTime(formData.outageStartTime + formData.outageDuration)}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Breakdown / Hardware Outage Reason
              </label>
              <input
                type="text"
                name="roomFailureReason"
                value={formData.roomFailureReason}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                placeholder="e.g. DaVinci Robotic System Failure, Laminar Flow Contamination"
              />
            </div>

            {/* Live Impact Preview */}
            <div className="p-3 bg-amber-50/70 dark:bg-amber-950/40 rounded-lg border border-amber-200 dark:border-amber-900/60">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                  <DoorClosed className="w-3.5 h-3.5" />
                  Displaced Room Caseload ({affectedRoomProcedures.length}):
                </span>
                <span className="text-[10px] text-amber-700 dark:text-amber-400">
                  Reroutes to available suites (e.g. OR-4 Day Surgery)
                </span>
              </div>
              {affectedRoomProcedures.length > 0 ? (
                <div className="space-y-1 mt-1">
                  {affectedRoomProcedures.map((proc) => (
                    <div
                      key={proc.id}
                      className="text-xs flex items-center justify-between p-1.5 rounded bg-white/80 dark:bg-slate-900/80 border border-amber-200 dark:border-amber-800 font-mono"
                    >
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {proc.procedureName}
                      </span>
                      <span className="text-slate-500 dark:text-slate-400">
                        {proc.surgeonName || proc.surgeonId} @ {formatMinutesToTime(proc.startTime)} ({proc.duration}m)
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                  No procedures scheduled in this room during the specified downtime.
                </p>
              )}
            </div>
          </>
        )}

        {/* =========================================================================
            SCENARIO 4: SURGERY OVERRUN
           ========================================================================= */}
        {disruptionType === "SURGERY_OVERRUN" && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Active Procedure Running Late *
                </label>
                <select
                  name="overrunProcedureId"
                  value={formData.overrunProcedureId}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-semibold"
                >
                  {currentSchedule.map((proc) => (
                    <option key={proc.id} value={proc.id}>
                      {proc.procedureName} ({proc.orId} @ {formatMinutesToTime(proc.startTime)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Expected Overrun Time (Minutes) *
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    name="overrunMinutes"
                    min="15"
                    max="180"
                    step="15"
                    value={formData.overrunMinutes}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono font-bold text-orange-600 dark:text-orange-400"
                  />
                  <div className="flex gap-1 shrink-0">
                    {[30, 45, 60, 90].map((mins) => (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, overrunMinutes: mins }))}
                        className={`text-[11px] px-1.5 py-1 rounded font-mono ${
                          formData.overrunMinutes === mins
                            ? "bg-orange-600 text-white font-bold"
                            : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
                        }`}
                      >
                        +{mins}m
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Intraoperative Complication / Reason
              </label>
              <input
                type="text"
                name="overrunReason"
                value={formData.overrunReason}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                placeholder="e.g. Extensive adhesions, complex anatomical revision, hemostasis"
              />
            </div>

            {/* Live Impact Preview */}
            <div className="p-3 bg-orange-50/70 dark:bg-orange-950/40 rounded-lg border border-orange-200 dark:border-orange-900/60">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-orange-900 dark:text-orange-300 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Downstream Cases at Risk in {selectedOverrunProcedure?.orId} ({downstreamOverrunProcedures.length}):
                </span>
                <span className="text-[10px] text-orange-700 dark:text-orange-400">
                  Mitigated via room reassignment or sequential compression
                </span>
              </div>
              {downstreamOverrunProcedures.length > 0 ? (
                <div className="space-y-1 mt-1">
                  {downstreamOverrunProcedures.map((proc) => (
                    <div
                      key={proc.id}
                      className="text-xs flex items-center justify-between p-1.5 rounded bg-white/80 dark:bg-slate-900/80 border border-orange-200 dark:border-orange-800 font-mono"
                    >
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {proc.procedureName}
                      </span>
                      <span className="text-slate-500 dark:text-slate-400">
                        Scheduled Start: {formatMinutesToTime(proc.startTime)} (Directly blocked)
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                  No subsequent procedures are scheduled immediately after in this OR.
                </p>
              )}
            </div>
          </>
        )}

        {/* Strategic Engine Context Box */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <span>
            The recovery engine will calculate 3 deterministic candidate plans (
            <strong className="text-slate-900 dark:text-white">Plan A</strong>: High-stability rebalance,{" "}
            <strong className="text-slate-900 dark:text-white">Plan B</strong>: Suite evacuation & parallel reroute, and{" "}
            <strong className="text-slate-900 dark:text-white">Plan C</strong>: Delay absorption & overtime containment)
            without requiring manual schedule rebuilds.
          </span>
        </div>

        {/* Modal Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button variant="outline" onClick={onClose} disabled={isSimulatingEmergency}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="danger"
            loading={isSimulatingEmergency || simulationStage > 0}
            icon={Sparkles}
          >
            Simulate & Compute Recovery
          </Button>
        </div>
      </form>
    </Modal>
  );
}
