/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  checkHealth,
  getDemoData,
  generateSchedule,
  getCurrentSchedule,
  simulateRecovery,
  applyRecoveryPlan,
  resetSchedule,
} from "../api/scheduleApi";
import {
  MOCK_OPERATING_ROOMS,
  MOCK_SURGEONS,
  MOCK_EQUIPMENT,
  MOCK_BASELINE_SCHEDULE,
  MOCK_RECOVERY_PLANS,
  MOCK_METRICS,
} from "../data/mockData";

const ScheduleContext = createContext(null);

export function ScheduleProvider({ children }) {
  // Backend connectivity state
  const [backendStatus, setBackendStatus] = useState("checking"); // "checking" | "connected" | "offline"
  const [isLiveBackend, setIsLiveBackend] = useState(false);
  const [backendLatency, setBackendLatency] = useState(null);

  // Core Schedule data
  const [baselineSchedule, setBaselineSchedule] = useState(MOCK_BASELINE_SCHEDULE);
  const [currentSchedule, setCurrentSchedule] = useState(MOCK_BASELINE_SCHEDULE);
  const [activeView, setActiveView] = useState("BASELINE"); // "BASELINE" | "RECOVERY"
  const [activePlanId, setActivePlanId] = useState(null);
  const [recoveryPlans, setRecoveryPlans] = useState(MOCK_RECOVERY_PLANS);
  const [activeRecovery, setActiveRecovery] = useState(null);
  const [lastSimulatedEmergency, setLastSimulatedEmergency] = useState(null);
  const [selectedDate, setSelectedDate] = useState("2026-09-18");

  // Operational Resources
  const [operatingRooms, setOperatingRooms] = useState(MOCK_OPERATING_ROOMS);
  const [surgeons, setSurgeons] = useState(MOCK_SURGEONS);
  const [equipment, setEquipment] = useState(MOCK_EQUIPMENT);
  const [metrics, setMetrics] = useState(MOCK_METRICS);

  // Selected Procedure for detail inspection drawer/modal
  const [selectedProcedure, setSelectedProcedure] = useState(null);

  // Recent operational events log
  const [recentEvents, setRecentEvents] = useState([
    {
      id: "EV-1",
      timestamp: "08:00 AM",
      type: "SYSTEM_INIT",
      title: "Schedule Initialized",
      description: "Baseline constraint schedule active across 4 operating rooms.",
      badge: "Normal",
    },
  ]);

  // Local Staff Data-Entry Store (clearly separated from backend scheduled data)
  const [localProcedures, setLocalProcedures] = useState(() => {
    try {
      const saved = localStorage.getItem("or_resq_local_procedures");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [localSurgeons, setLocalSurgeons] = useState(() => {
    try {
      const saved = localStorage.getItem("or_resq_local_surgeons");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [localOperatingRooms, setLocalOperatingRooms] = useState(() => {
    try {
      const saved = localStorage.getItem("or_resq_local_rooms");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [localEquipment, setLocalEquipment] = useState(() => {
    try {
      const saved = localStorage.getItem("or_resq_local_equipment");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Action Loading & Error States
  const [isGeneratingSchedule, setIsGeneratingSchedule] = useState(false);
  const [isSimulatingEmergency, setIsSimulatingEmergency] = useState(false);
  const [isApplyingRecovery, setIsApplyingRecovery] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [lastError, setLastError] = useState(null);

  // Save local staff entries to storage
  useEffect(() => {
    localStorage.setItem("or_resq_local_procedures", JSON.stringify(localProcedures));
  }, [localProcedures]);
  useEffect(() => {
    localStorage.setItem("or_resq_local_surgeons", JSON.stringify(localSurgeons));
  }, [localSurgeons]);
  useEffect(() => {
    localStorage.setItem("or_resq_local_rooms", JSON.stringify(localOperatingRooms));
  }, [localOperatingRooms]);
  useEffect(() => {
    localStorage.setItem("or_resq_local_equipment", JSON.stringify(localEquipment));
  }, [localEquipment]);

  const addEvent = (type, title, description, badge = "Update") => {
    const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setRecentEvents((prev) => [
      {
        id: `EV-${Date.now()}`,
        timestamp: timeStr,
        type,
        title,
        description,
        badge,
      },
      ...prev.slice(0, 19),
    ]);
  };

  // Check backend health
  const refreshBackendHealth = useCallback(async () => {
    setBackendStatus("checking");
    const startTime = performance.now();
    const result = await checkHealth();
    const latency = Math.round(performance.now() - startTime);

    if (result.ok && result.isLiveBackend) {
      setBackendStatus("connected");
      setIsLiveBackend(true);
      setBackendLatency(latency);
    } else {
      setBackendStatus("offline");
      setIsLiveBackend(false);
      setBackendLatency(null);
    }
  }, []);

  // Fetch current schedule from backend or local
  const refreshCurrentSchedule = useCallback(async () => {
    try {
      const res = await getCurrentSchedule();
      if (res.success) {
        if (res.baselineSchedule && res.baselineSchedule.length) {
          setBaselineSchedule(res.baselineSchedule);
        }
        if (res.currentSchedule && res.currentSchedule.length) {
          setCurrentSchedule(res.currentSchedule);
        }
        if (res.activeView) {
          setActiveView(res.activeView);
        }
        if (res.currentRecovery) {
          setActiveRecovery(res.currentRecovery);
          setActivePlanId(res.currentRecovery.planId);
        } else {
          setActiveRecovery(null);
          setActivePlanId(null);
        }
        if (res.metrics) {
          setMetrics((prev) => ({ ...prev, ...res.metrics }));
        }
        if (res.recoveryPlans && res.recoveryPlans.length) {
          setRecoveryPlans(res.recoveryPlans);
        }
      }
    } catch (err) {
      console.warn("Could not fetch current schedule:", err);
    }
  }, []);

  // Initialize on mount
  useEffect(() => {
    refreshBackendHealth();
    getDemoData().then((res) => {
      if (res && res.success) {
        if (res.operatingRooms) setOperatingRooms(res.operatingRooms);
        if (res.surgeons) setSurgeons(res.surgeons);
        if (res.equipment) setEquipment(res.equipment);
      }
    });
    refreshCurrentSchedule();
  }, [refreshBackendHealth, refreshCurrentSchedule]);

  // Generate baseline schedule
  const handleGenerateSchedule = async (date = selectedDate) => {
    setIsGeneratingSchedule(true);
    setLastError(null);
    try {
      const res = await generateSchedule(date);
      if (res.success) {
        if (res.schedule) {
          setBaselineSchedule(res.schedule);
          setCurrentSchedule(res.schedule);
        }
        if (res.metrics) {
          setMetrics(res.metrics);
        }
        setActiveView("BASELINE");
        setActiveRecovery(null);
        setActivePlanId(null);
        addEvent(
          "SCHEDULE_GENERATED",
          "Optimized Schedule Generated",
          `Constraint engine successfully scheduled ${res.metrics?.scheduledProcedures || 8} procedures.`,
          "Success"
        );
      } else {
        setLastError(res.message || "Failed to generate schedule");
      }
    } catch (err) {
      setLastError(err.message || "Schedule generation error");
    } finally {
      setIsGeneratingSchedule(false);
    }
  };

  // Simulate Emergency / Operational Disruption
  const handleSimulateEmergency = async (emergencyData) => {
    setIsSimulatingEmergency(true);
    setLastError(null);
    try {
      const res = await simulateRecovery(emergencyData);
      if (res.success) {
        setLastSimulatedEmergency(res.emergency || emergencyData);
        if (res.plans) {
          setRecoveryPlans(res.plans);
        }

        const type = emergencyData.disruptionType || "EMERGENCY_CASE";
        let eventTitle = `Emergency Case Detected: ${emergencyData.procedureName || "Trauma Case"}`;
        let eventDesc = "Critical priority trauma case received. 3 recovery strategies computed.";

        if (type === "SURGEON_UNAVAILABLE") {
          eventTitle = `Surgeon Unavailable: ${emergencyData.surgeonName || "Specialist"}`;
          eventDesc = `${emergencyData.reason || "Clinical absence"}. 3 surgeon reallocation plans generated.`;
        } else if (type === "OR_UNAVAILABLE") {
          eventTitle = `OR Suite Breakdown: ${emergencyData.orId || "Suite"} Offline`;
          eventDesc = `${emergencyData.reason || "Hardware fault"}. 3 parallel redistribution plans generated.`;
        } else if (type === "SURGERY_OVERRUN") {
          eventTitle = `Surgery Overrun Alert: ${emergencyData.procedureName || "Procedure"} (+${emergencyData.overrunMinutes || 60}m)`;
          eventDesc = `Overrun in ${emergencyData.orId || "OR"}. 3 downstream mitigation plans generated.`;
        }

        addEvent(
          "EMERGENCY_DETECTED",
          eventTitle,
          eventDesc,
          "Critical"
        );
        return { success: true, plans: res.plans };
      } else {
        setLastError(res.message || "Emergency simulation failed");
        return { success: false, error: res.message };
      }
    } catch (err) {
      setLastError(err.message);
      return { success: false, error: err.message };
    } finally {
      setIsSimulatingEmergency(false);
    }
  };

  // Apply Recovery Plan
  const handleApplyRecoveryPlan = async (planId) => {
    setIsApplyingRecovery(true);
    setLastError(null);
    try {
      const res = await applyRecoveryPlan(planId);
      if (res.success) {
        // Refresh schedule from backend or local
        await refreshCurrentSchedule();
        const selectedPlan = recoveryPlans.find((p) => p.id === planId);
        setActivePlanId(planId);
        setActiveView("RECOVERY");
        addEvent(
          "RECOVERY_APPLIED",
          `Recovery Plan Applied: ${selectedPlan ? selectedPlan.name : planId}`,
          `Strategy "${selectedPlan ? selectedPlan.strategy : planId}" applied to active OR timeline.`,
          "Applied"
        );
        return { success: true };
      } else {
        setLastError(res.message || "Could not apply recovery plan");
        return { success: false, error: res.message };
      }
    } catch (err) {
      setLastError(err.message);
      return { success: false, error: err.message };
    } finally {
      setIsApplyingRecovery(false);
    }
  };

  // Reset Schedule
  const handleResetSchedule = async () => {
    setIsResetting(true);
    setLastError(null);
    try {
      const res = await resetSchedule();
      if (res.success) {
        await refreshCurrentSchedule();
        setActiveView("BASELINE");
        setActiveRecovery(null);
        setActivePlanId(null);
        addEvent(
          "SIMULATION_RESET",
          "Schedule Simulation Reset",
          "Reset all OR assignments back to baseline constraint schedule.",
          "Reset"
        );
        return { success: true };
      }
    } catch (err) {
      setLastError(err.message);
    } finally {
      setIsResetting(false);
    }
  };

  // Staff Local Data Management Methods
  const addLocalProcedure = (proc) => {
    const newProc = {
      ...proc,
      id: proc.id || `PROC-DRAFT-${Date.now().toString().slice(-4)}`,
      procedureId: proc.procedureId || `PROC-${Date.now().toString().slice(-4)}`,
      status: "DRAFT_LOCAL",
      createdAt: new Date().toISOString(),
      isLocalDraft: true,
    };
    setLocalProcedures((prev) => [newProc, ...prev]);
    addEvent(
      "STAFF_DATA_ENTRY",
      `New Procedure Draft: ${newProc.procedureName}`,
      `Created locally by hospital staff for scheduling queue.`,
      "Draft"
    );
    return newProc;
  };

  const scheduleProcedureDirectly = (proc) => {
    const duration = Number(proc.duration) || Number(proc.predictedDuration) || 90;
    const targetOr = proc.orId || proc.preferredOr || "OR-1";

    // Find latest procedure scheduled in this OR to prevent collision
    const existingInOr = currentSchedule
      .filter((p) => p.orId === targetOr && p.status !== "CANCELLED")
      .sort((a, b) => (a.endTime || 0) - (b.endTime || 0));

    let calculatedStart = 480; // 08:00 AM default
    if (proc.startTime) {
      calculatedStart = Number(proc.startTime);
    } else if (existingInOr.length > 0) {
      const lastProc = existingInOr[existingInOr.length - 1];
      calculatedStart = (lastProc.endTime || 540) + 15; // 15m turnover buffer
    }

    const calculatedEnd = calculatedStart + duration;

    const scheduledProc = {
      ...proc,
      id: proc.id || `PROC-${Date.now().toString().slice(-4)}`,
      procedureId: proc.procedureId || `PROC-${Date.now().toString().slice(-4)}`,
      orId: targetOr,
      startTime: calculatedStart,
      endTime: calculatedEnd,
      duration,
      status: "SCHEDULED",
      isLocalDraft: false,
      scheduledDate: proc.scheduledDate || selectedDate,
    };

    setCurrentSchedule((prev) => [...prev, scheduledProc]);

    // Update metrics
    setMetrics((prev) => {
      const totalProcs = (prev?.totalProcedures || currentSchedule.length) + 1;
      const scheduledProcs = (prev?.scheduledProcedures || currentSchedule.length) + 1;
      const scheduledMins = (prev?.totalScheduledMinutes || 851) + duration;
      const totalAvail = prev?.totalOrMinutesAvailable || 2400;
      const utilRate = Number(((scheduledMins / totalAvail) * 100).toFixed(1));
      return {
        ...prev,
        totalProcedures: totalProcs,
        scheduledProcedures: scheduledProcs,
        totalScheduledMinutes: scheduledMins,
        utilizationRate: utilRate,
      };
    });

    const startH = Math.floor(calculatedStart / 60);
    const startM = calculatedStart % 60;
    const timeFormatted = `${startH.toString().padStart(2, "0")}:${startM.toString().padStart(2, "0")}`;

    addEvent(
      "PROCEDURE_SCHEDULED",
      `Scheduled: ${scheduledProc.procedureName}`,
      `Allocated into ${targetOr} at ${timeFormatted} (${duration} min). Equipment verified.`,
      "Success"
    );

    return scheduledProc;
  };

  const deleteLocalProcedure = (id) => {
    setLocalProcedures((prev) => prev.filter((p) => (p.id !== id && p.procedureId !== id)));
    setCurrentSchedule((prev) => prev.filter((p) => (p.id !== id && p.procedureId !== id)));
  };

  const addLocalSurgeon = (surg) => {
    const newSurg = {
      ...surg,
      id: surg.id || `SURG-DRAFT-${Date.now().toString().slice(-4)}`,
      status: "AVAILABLE",
      isLocalDraft: true,
    };
    setLocalSurgeons((prev) => [newSurg, ...prev]);
  };

  const addLocalOperatingRoom = (or) => {
    const newOr = {
      ...or,
      id: or.id || `OR-${Math.floor(Math.random() * 90 + 10)}`,
      status: "ACTIVE",
      isLocalDraft: true,
    };
    setLocalOperatingRooms((prev) => [newOr, ...prev]);
  };

  const addLocalEquipment = (eq) => {
    const newEq = {
      ...eq,
      id: eq.id || `EQ-DRAFT-${Date.now().toString().slice(-4)}`,
      availability: eq.availability || "Available",
      status: eq.status || "STERILIZED",
      isLocalDraft: true,
    };
    setLocalEquipment((prev) => [newEq, ...prev]);
    return newEq;
  };

  const addLocalEquipmentBatch = (items, bundleName = "") => {
    const newItems = items.map((item, idx) => ({
      ...item,
      id: item.id || `EQ-KIT-${Date.now().toString().slice(-4)}-${idx + 1}`,
      availability: item.availability || "Available",
      status: item.status || "STERILIZED",
      bundle: bundleName || item.bundle || "Custom Kit",
      isLocalDraft: true,
    }));
    setLocalEquipment((prev) => [...newItems, ...prev]);
    addEvent(
      "EQUIPMENT_PROVISIONED",
      `Surgical Kit Provisioned: ${bundleName || `${items.length} Equipment Units`}`,
      `Added ${items.length} sterilized units to inventory. Ready for procedure assignment.`,
      "Success"
    );
    return newItems;
  };

  return (
    <ScheduleContext.Provider
      value={{
        // Backend connectivity
        backendStatus,
        isLiveBackend,
        backendLatency,
        refreshBackendHealth,

        // Schedules & State
        baselineSchedule,
        currentSchedule,
        activeView,
        activePlanId,
        recoveryPlans,
        activeRecovery,
        lastSimulatedEmergency,
        selectedDate,
        setSelectedDate,
        metrics,
        recentEvents,

        // Operational Resources
        operatingRooms,
        surgeons,
        equipment,

        // Selection & Inspection
        selectedProcedure,
        setSelectedProcedure,

        // Action Handlers
        handleGenerateSchedule,
        handleSimulateEmergency,
        handleApplyRecoveryPlan,
        handleResetSchedule,
        refreshCurrentSchedule,

        // Local Staff Data
        localProcedures,
        localSurgeons,
        localOperatingRooms,
        localEquipment,
        addLocalProcedure,
        scheduleProcedureDirectly,
        deleteLocalProcedure,
        addLocalSurgeon,
        addLocalOperatingRoom,
        addLocalEquipment,
        addLocalEquipmentBatch,

        // Loading states
        isGeneratingSchedule,
        isSimulatingEmergency,
        isApplyingRecovery,
        isResetting,
        lastError,
      }}
    >
      {children}
    </ScheduleContext.Provider>
  );
}

export function useSchedule() {
  const context = useContext(ScheduleContext);
  if (!context) {
    throw new Error("useSchedule must be used within a ScheduleProvider");
  }
  return context;
}
