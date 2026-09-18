/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { request } from "./api";
import {
  MOCK_OPERATING_ROOMS,
  MOCK_SURGEONS,
  MOCK_EQUIPMENT,
  MOCK_BASELINE_SCHEDULE,
  MOCK_RECOVERY_PLANS,
  MOCK_METRICS,
} from "../data/mockData";

// Local in-memory state fallback if backend server is not running
let localCurrentState = {
  hasBaseline: true,
  hasRecovery: false,
  activeView: "BASELINE",
  baselineSchedule: JSON.parse(JSON.stringify(MOCK_BASELINE_SCHEDULE)),
  currentSchedule: JSON.parse(JSON.stringify(MOCK_BASELINE_SCHEDULE)),
  currentRecovery: null,
  activePlanId: null,
  recoveryPlans: JSON.parse(JSON.stringify(MOCK_RECOVERY_PLANS)),
  metrics: { ...MOCK_METRICS },
  lastUpdated: new Date().toISOString(),
};

/**
 * Health Check: GET /api/health
 */
export async function checkHealth() {
  try {
    const res = await request("/health");
    return { ok: true, data: res, isLiveBackend: true };
  } catch (err) {
    return {
      ok: false,
      error: err.message,
      isLiveBackend: false,
      fallbackMessage: "Node backend at localhost:5001 is offline. Running in local simulation mode.",
    };
  }
}

/**
 * Get Demo Data: GET /api/demo-data
 */
export async function getDemoData() {
  try {
    const res = await request("/demo-data");
    return { success: true, ...res, isLiveBackend: true };
  } catch {
    // Return mock demo data if backend offline
    return {
      success: true,
      operatingRooms: MOCK_OPERATING_ROOMS,
      surgeons: MOCK_SURGEONS,
      procedures: MOCK_BASELINE_SCHEDULE,
      equipment: MOCK_EQUIPMENT,
      isLiveBackend: false,
    };
  }
}

/**
 * Generate Baseline Schedule: POST /api/schedule/generate
 * Request body: { date: "2026-09-18" }
 */
export async function generateSchedule(date = "2026-09-18") {
  try {
    const res = await request("/schedule/generate", {
      method: "POST",
      body: JSON.stringify({ date }),
    });
    return { success: true, ...res, isLiveBackend: true };
  } catch {
    // Deterministic simulation fallback
    localCurrentState = {
      hasBaseline: true,
      hasRecovery: false,
      activeView: "BASELINE",
      baselineSchedule: JSON.parse(JSON.stringify(MOCK_BASELINE_SCHEDULE)),
      currentSchedule: JSON.parse(JSON.stringify(MOCK_BASELINE_SCHEDULE)),
      currentRecovery: null,
      activePlanId: null,
      recoveryPlans: JSON.parse(JSON.stringify(MOCK_RECOVERY_PLANS)),
      metrics: {
        totalProcedures: 8,
        scheduledProcedures: 8,
        unassigned: 0,
        totalOrMinutesAvailable: 2400,
        totalScheduledMinutes: 851,
        utilizationRate: 35.5,
      },
      lastUpdated: new Date().toISOString(),
    };

    return {
      success: true,
      engine: "Deterministic Greedy Constraint Scheduler",
      date,
      schedule: localCurrentState.currentSchedule,
      unassigned: [],
      metrics: localCurrentState.metrics,
      isLiveBackend: false,
      note: "Generated via local deterministic scheduler fallback",
    };
  }
}

/**
 * Get Current Schedule: GET /api/schedule/current
 */
export async function getCurrentSchedule() {
  try {
    const res = await request("/schedule/current");
    return { success: true, ...res, isLiveBackend: true };
  } catch {
    return {
      success: true,
      ...localCurrentState,
      isLiveBackend: false,
    };
  }
}

/**
 * Simulate Emergency & Recovery: POST /api/recovery/simulate
 * Request body: {
 *   procedureName: "Emergency Trauma Laparotomy",
 *   priority: "CRITICAL",
 *   duration: 90,
 *   requiredSpecialty: "Trauma Surgery",
 *   surgeonId: "SURG-01",
 *   requiredEquipment: ["Trauma Kit"],
 *   emergencyTime: 570
 * }
 */
export async function simulateRecovery(emergencyPayload) {
  try {
    const res = await request("/recovery/simulate", {
      method: "POST",
      body: JSON.stringify(emergencyPayload),
    });
    return { success: true, ...res, isLiveBackend: true };
  } catch {
    const disruptionType = emergencyPayload.disruptionType || "EMERGENCY_CASE";
    let plans = [];

    if (disruptionType === "SURGEON_UNAVAILABLE") {
      const surgeonName = emergencyPayload.surgeonName || "Assigned Surgeon";
      const reason = emergencyPayload.reason || "Emergency department call-in";
      plans = [
        {
          id: "PLAN_A",
          name: "PLAN A",
          strategy: "Emergency Backup Surgeon",
          description: `Activate on-call certified specialist (Dr. Priya Nair) to perform ${surgeonName}'s scheduled caseload on time in the assigned OR suite. Zero patient delays or cancellations.`,
          cancellations: 0,
          cancelledProcedures: [],
          movedProcedures: 0,
          delayedProcedures: 0,
          totalDelay: 0,
          disruptionCost: 14.0,
          scheduleStability: 96.5,
          overtime: 0,
          surgeonIdleTime: 10,
          recommendedFor: "Preserves patient satisfaction, operational flow, and room utilization without schedule shifting.",
          impactSummary: `0 cancellations, 0 delays. On-call backup surgeon activated for ${surgeonName}.`,
        },
        {
          id: "PLAN_B",
          name: "PLAN B",
          strategy: "Reallocate to Afternoon Slots",
          description: `Reschedule ${surgeonName}'s non-critical procedures to open afternoon capacity in Day Suite OR-4 with a 45-minute setup buffer.`,
          cancellations: 0,
          cancelledProcedures: [],
          movedProcedures: 1,
          delayedProcedures: 1,
          totalDelay: 45,
          disruptionCost: 25.0,
          scheduleStability: 87.5,
          overtime: 0,
          surgeonIdleTime: 30,
          recommendedFor: "Optimal when on-call cross-specialty surgeons are unavailable.",
          impactSummary: "0 cancellations, 1 procedure relocated to afternoon open slot (+45 min delay).",
        },
        {
          id: "PLAN_C",
          name: "PLAN C",
          strategy: "Defer Elective Procedure",
          description: `Postpone low-priority elective procedure(s) of ${surgeonName} to the next operating day, protecting all emergency and urgent cases across remaining suites.`,
          cancellations: 1,
          cancelledProcedures: ["PROC-102"],
          movedProcedures: 0,
          delayedProcedures: 0,
          totalDelay: 0,
          disruptionCost: 36.0,
          scheduleStability: 82.0,
          overtime: 0,
          surgeonIdleTime: 40,
          recommendedFor: "When no backup staff or afternoon slots exist, ensuring zero cascading overtime.",
          impactSummary: "1 elective case deferred to next morning, zero delays to remaining surgeries.",
        },
      ];
    } else if (disruptionType === "OR_UNAVAILABLE") {
      const orId = emergencyPayload.orId || "OR-2";
      const orName = emergencyPayload.orName || "Operating Suite";
      const reason = emergencyPayload.reason || "Equipment breakdown";
      plans = [
        {
          id: "PLAN_A",
          name: "PLAN A",
          strategy: "Parallel Suite Redistribution",
          description: `Evacuate scheduled surgeries from ${orId} (${reason}) and redistribute into available capacity across OR-4 (Day Suite) and OR-1 with minimal stagger.`,
          cancellations: 0,
          cancelledProcedures: [],
          movedProcedures: 2,
          delayedProcedures: 1,
          totalDelay: 20,
          disruptionCost: 21.0,
          scheduleStability: 91.5,
          overtime: 0,
          surgeonIdleTime: 15,
          recommendedFor: "Maintains full daily surgical caseload despite facility hardware downtime.",
          impactSummary: `0 cancellations, 2 procedures relocated from ${orId} into operational suites.`,
        },
        {
          id: "PLAN_B",
          name: "PLAN B",
          strategy: "Evening Shift Extension",
          description: `Consolidate ${orId}'s caseload into active suites extending into evening shift (+45 min overtime). Preserves all patient bookings.`,
          cancellations: 0,
          cancelledProcedures: [],
          movedProcedures: 1,
          delayedProcedures: 2,
          totalDelay: 90,
          disruptionCost: 33.5,
          scheduleStability: 84.0,
          overtime: 45,
          surgeonIdleTime: 20,
          recommendedFor: "Best when daytime suites are fully booked and cases cannot be deferred.",
          impactSummary: "0 cancellations, 1 procedure moved, 45 min OR overtime authorized.",
        },
        {
          id: "PLAN_C",
          name: "PLAN C",
          strategy: "Prioritize Critical & Defer Elective",
          description: `Protect high-urgency procedures in operational rooms, and postpone elective non-urgent procedures from ${orId} until decontamination or repairs finish.`,
          cancellations: 2,
          cancelledProcedures: ["PROC-104", "PROC-108"],
          movedProcedures: 0,
          delayedProcedures: 0,
          totalDelay: 0,
          disruptionCost: 44.0,
          scheduleStability: 78.0,
          overtime: 0,
          surgeonIdleTime: 25,
          recommendedFor: "Strict adherence to hospital shift boundaries and sterile field containment.",
          impactSummary: "2 elective cases deferred; urgent procedures preserved without overtime.",
        },
      ];
    } else if (disruptionType === "SURGERY_OVERRUN") {
      const procName = emergencyPayload.procedureName || "Active Case";
      const orId = emergencyPayload.orId || "OR-1";
      const overrunMin = Number(emergencyPayload.overrunMinutes) || 60;
      plans = [
        {
          id: "PLAN_A",
          name: "PLAN A",
          strategy: "Dynamic Room Bump",
          description: `Allow ${procName} in ${orId} to complete with +${overrunMin}m overrun. Immediately reroute the next scheduled surgery to open Day Suite OR-4 so it starts on time.`,
          cancellations: 0,
          cancelledProcedures: [],
          movedProcedures: 1,
          delayedProcedures: 0,
          totalDelay: 0,
          disruptionCost: 16.5,
          scheduleStability: 95.0,
          overtime: 0,
          surgeonIdleTime: 10,
          recommendedFor: "Zero patient delay for downstream surgeries by leveraging empty Day Suite OR-4.",
          impactSummary: `0 cancellations, 0 delay. Blocked subsequent surgery bumped to OR-4 on time.`,
        },
        {
          id: "PLAN_B",
          name: "PLAN B",
          strategy: "Cascade Ripple Delay & Rapid Turnover",
          description: `Absorb +${overrunMin}m overrun in ${orId}. Accelerate turnover sterilization to 15m and cascade subsequent procedures sequentially with minimal schedule skew.`,
          cancellations: 0,
          cancelledProcedures: [],
          movedProcedures: 0,
          delayedProcedures: 2,
          totalDelay: overrunMin,
          disruptionCost: 29.0,
          scheduleStability: 86.0,
          overtime: Math.max(0, overrunMin - 30),
          surgeonIdleTime: 15,
          recommendedFor: "Preserves room consistency and equipment configurations without room migration.",
          impactSummary: `0 cancellations, subsequent surgeries in ${orId} delayed by +${overrunMin} min.`,
        },
        {
          id: "PLAN_C",
          name: "PLAN C",
          strategy: "Defer Last Elective Surgery",
          description: `Permit +${overrunMin}m overrun in ${orId}, delay intermediate case slightly, and defer the final elective case to prevent OR nursing shift overtime.`,
          cancellations: 1,
          cancelledProcedures: ["PROC-107"],
          movedProcedures: 0,
          delayedProcedures: 1,
          totalDelay: 15,
          disruptionCost: 37.0,
          scheduleStability: 79.5,
          overtime: 0,
          surgeonIdleTime: 20,
          recommendedFor: "Avoids evening nursing overtime penalties when cases overrun significantly.",
          impactSummary: "1 end-of-day elective procedure deferred, eliminating OR team overtime.",
        },
      ];
    } else {
      // Default: EMERGENCY_CASE
      plans = JSON.parse(JSON.stringify(MOCK_RECOVERY_PLANS));
    }

    localCurrentState.lastEmergency = {
      ...emergencyPayload,
      disruptionType,
      procedureId: emergencyPayload.procedureId || "EMERGENCY-01",
      patientMockId: emergencyPayload.patientMockId || "PAT-EMERGENCY-99",
      status: "EMERGENCY",
      isEmergency: disruptionType === "EMERGENCY_CASE",
    };
    localCurrentState.recoveryPlans = plans;

    return {
      success: true,
      emergency: localCurrentState.lastEmergency,
      plans,
      disruptionEvaluated: true,
      isLiveBackend: false,
      message: `${disruptionType.replace(/_/g, " ")} recovery strategies simulated successfully`,
    };
  }
}

/**
 * Apply Recovery Plan: POST /api/recovery/apply
 * Request body: { planId: "PLAN_A" | "PLAN_B" | "PLAN_C" | "BASELINE" }
 */
export async function applyRecoveryPlan(planId) {
  try {
    const res = await request("/recovery/apply", {
      method: "POST",
      body: JSON.stringify({ planId }),
    });
    return { success: true, ...res, isLiveBackend: true };
  } catch {
    const disruption = localCurrentState.lastEmergency || {
      disruptionType: "EMERGENCY_CASE",
      procedureId: "EMERGENCY-01",
      procedureName: "Emergency Trauma Laparotomy",
      priority: "CRITICAL",
      patientMockId: "PAT-EMERGENCY-99",
      surgeonId: "SURG-01",
      surgeonName: "Dr. Marcus Vance",
      specialty: "Trauma Surgery",
      orId: "OR-1",
      startTime: 570,
      endTime: 660,
      duration: 90,
      historicalAverage: 90,
      predictedDuration: 90,
      durationSource: "Historical Fallback",
      requiredEquipment: ["Trauma Kit"],
      status: "EMERGENCY",
      isEmergency: true,
    };

    let updatedSchedule = JSON.parse(JSON.stringify(MOCK_BASELINE_SCHEDULE));
    let appliedPlan =
      localCurrentState.recoveryPlans?.find((p) => p.id === planId) ||
      MOCK_RECOVERY_PLANS.find((p) => p.id === planId) ||
      MOCK_RECOVERY_PLANS[1];

    if (planId === "BASELINE") {
      localCurrentState.currentSchedule = JSON.parse(JSON.stringify(MOCK_BASELINE_SCHEDULE));
      localCurrentState.hasRecovery = false;
      localCurrentState.activeView = "BASELINE";
      localCurrentState.activePlanId = null;
      localCurrentState.currentRecovery = null;
      return { success: true, planApplied: "BASELINE", isLiveBackend: false };
    }

    const disruptionType = disruption.disruptionType || "EMERGENCY_CASE";

    if (disruptionType === "SURGEON_UNAVAILABLE") {
      const targetSurgeonId = disruption.surgeonId || "SURG-01";
      if (planId === "PLAN_A") {
        // Substitute backup surgeon (Dr. Priya Nair / on-call)
        updatedSchedule = updatedSchedule.map((p) => {
          if (p.surgeonId === targetSurgeonId) {
            return {
              ...p,
              surgeonId: "SURG-04",
              surgeonName: "Dr. Priya Nair (On-Call Sub)",
              status: "SUBSTITUTED",
            };
          }
          return p;
        });
      } else if (planId === "PLAN_B") {
        // Reallocate to afternoon open slot in OR-4
        updatedSchedule = updatedSchedule.map((p) => {
          if (p.surgeonId === targetSurgeonId && p.priority !== "CRITICAL") {
            return {
              ...p,
              orId: "OR-4",
              startTime: 660, // 11:00 AM
              endTime: 660 + (p.duration || 75),
              status: "MOVED",
            };
          }
          return p;
        });
      } else if (planId === "PLAN_C") {
        // Defer non-critical elective case
        updatedSchedule = updatedSchedule.filter(
          (p) => !(p.surgeonId === targetSurgeonId && p.priority === "LOW")
        );
      }
    } else if (disruptionType === "OR_UNAVAILABLE") {
      const targetOr = disruption.orId || "OR-2";
      if (planId === "PLAN_A") {
        // Parallel Suite Redistribution: Move stranded cases to OR-4 and OR-1
        let movedCount = 0;
        updatedSchedule = updatedSchedule.map((p) => {
          if (p.orId === targetOr) {
            movedCount++;
            if (movedCount === 1) {
              return {
                ...p,
                orId: "OR-4",
                startTime: 585, // 09:45
                endTime: 585 + (p.duration || 90),
                status: "MOVED",
              };
            } else {
              return {
                ...p,
                orId: "OR-1",
                startTime: 735, // 12:15
                endTime: 735 + (p.duration || 90),
                status: "MOVED",
              };
            }
          }
          return p;
        });
      } else if (planId === "PLAN_B") {
        // Evening shift extension in OR-1
        updatedSchedule = updatedSchedule.map((p) => {
          if (p.orId === targetOr && p.priority !== "CRITICAL") {
            return {
              ...p,
              orId: "OR-1",
              startTime: 750, // 12:30
              endTime: 750 + (p.duration || 90),
              status: "MOVED",
            };
          }
          return p;
        });
      } else if (planId === "PLAN_C") {
        // Defer non-urgent electives in that room
        updatedSchedule = updatedSchedule.filter(
          (p) => !(p.orId === targetOr && (p.priority === "LOW" || p.priority === "MEDIUM"))
        );
      }
    } else if (disruptionType === "SURGERY_OVERRUN") {
      const targetProcId = disruption.procedureId || "PROC-101";
      const targetOr = disruption.orId || "OR-1";
      const overrunMin = Number(disruption.overrunMinutes) || 60;

      // Extend duration and endTime of the overrunning case
      updatedSchedule = updatedSchedule.map((p) => {
        if (p.procedureId === targetProcId) {
          const newDur = (p.duration || 75) + overrunMin;
          return {
            ...p,
            duration: newDur,
            endTime: p.startTime + newDur,
            status: "OVERRUN",
          };
        }
        return p;
      });

      if (planId === "PLAN_A") {
        // Dynamic Room Bump: Bump the very next procedure in that OR to open OR-4 on schedule
        let foundOverrun = false;
        let bumpedOne = false;
        updatedSchedule = updatedSchedule.map((p) => {
          if (p.procedureId === targetProcId) {
            foundOverrun = true;
            return p;
          }
          if (foundOverrun && p.orId === targetOr && !bumpedOne) {
            bumpedOne = true;
            return {
              ...p,
              orId: "OR-4",
              startTime: 585, // 09:45
              endTime: 585 + (p.duration || 75),
              status: "MOVED",
            };
          }
          return p;
        });
      } else if (planId === "PLAN_B") {
        // Cascade Ripple Delay in that OR
        let foundOverrun = false;
        updatedSchedule = updatedSchedule.map((p) => {
          if (p.procedureId === targetProcId) {
            foundOverrun = true;
            return p;
          }
          if (foundOverrun && p.orId === targetOr) {
            return {
              ...p,
              startTime: p.startTime + overrunMin,
              endTime: p.endTime + overrunMin,
              status: "DELAYED",
            };
          }
          return p;
        });
      } else if (planId === "PLAN_C") {
        // Defer last elective case in that OR
        const casesInOr = updatedSchedule.filter((p) => p.orId === targetOr);
        const lastCase = casesInOr[casesInOr.length - 1];
        if (lastCase && lastCase.procedureId !== targetProcId) {
          updatedSchedule = updatedSchedule.filter(
            (p) => p.procedureId !== lastCase.procedureId
          );
        }
      }
    } else {
      // Standard EMERGENCY_CASE logic
      const emergency = {
        procedureId: "EMERGENCY-01",
        procedureName: disruption.procedureName || "Emergency Trauma Laparotomy",
        priority: disruption.priority || "CRITICAL",
        patientMockId: "PAT-EMERGENCY-99",
        surgeonId: disruption.surgeonId || "SURG-01",
        surgeonName: disruption.surgeonName || "Dr. Marcus Vance",
        specialty: disruption.requiredSpecialty || "Trauma Surgery",
        orId: disruption.preferredOr || "OR-1",
        startTime: Number(disruption.emergencyTime) || 570,
        endTime: (Number(disruption.emergencyTime) || 570) + (Number(disruption.duration) || 90),
        duration: Number(disruption.duration) || 90,
        historicalAverage: Number(disruption.duration) || 90,
        predictedDuration: Number(disruption.duration) || 90,
        durationSource: "Emergency Preemption",
        requiredEquipment: disruption.requiredEquipment || ["Trauma Kit"],
        status: "EMERGENCY",
        isEmergency: true,
      };

      const targetOr = emergency.orId || "OR-1";

      if (planId === "PLAN_A") {
        // Cancel lower priority elective hernia repair
        updatedSchedule = updatedSchedule.filter((p) => p.procedureId !== "PROC-102");
        updatedSchedule.push(emergency);
      } else if (planId === "PLAN_B") {
        // Move elective hernia repair to idle OR-4 at 09:45
        updatedSchedule = updatedSchedule.map((p) => {
          if (p.procedureId === "PROC-102") {
            return {
              ...p,
              orId: "OR-4",
              startTime: 585,
              endTime: 660,
              status: "MOVED",
            };
          }
          return p;
        });
        updatedSchedule.push(emergency);
      } else if (planId === "PLAN_C") {
        // Delay subsequent cases sequentially in target OR
        const dur = emergency.duration;
        updatedSchedule = updatedSchedule.map((p) => {
          if (p.orId === targetOr && p.startTime >= emergency.startTime) {
            return {
              ...p,
              startTime: p.startTime + dur,
              endTime: p.endTime + dur,
              status: "DELAYED",
            };
          }
          return p;
        });
        updatedSchedule.push(emergency);
      }
    }

    localCurrentState.hasRecovery = true;
    localCurrentState.activeView = "RECOVERY";
    localCurrentState.activePlanId = planId;
    localCurrentState.currentSchedule = updatedSchedule;
    localCurrentState.currentRecovery = {
      planId,
      plan: appliedPlan,
      appliedAt: new Date().toISOString(),
      emergency: disruption,
      disruptionType,
    };

    return {
      success: true,
      planApplied: planId,
      schedule: updatedSchedule,
      metrics: {
        disruptionCost: appliedPlan.disruptionCost,
        scheduleStability: appliedPlan.scheduleStability,
        cancellations: appliedPlan.cancellations,
        movedProcedures: appliedPlan.movedProcedures,
        delayedProcedures: appliedPlan.delayedProcedures,
        totalDelay: appliedPlan.totalDelay,
      },
      isLiveBackend: false,
    };
  }
}

/**
 * Reset Schedule: POST /api/schedule/reset
 */
export async function resetSchedule() {
  try {
    const res = await request("/schedule/reset", {
      method: "POST",
    });
    return { success: true, ...res, isLiveBackend: true };
  } catch {
    localCurrentState = {
      hasBaseline: true,
      hasRecovery: false,
      activeView: "BASELINE",
      baselineSchedule: JSON.parse(JSON.stringify(MOCK_BASELINE_SCHEDULE)),
      currentSchedule: JSON.parse(JSON.stringify(MOCK_BASELINE_SCHEDULE)),
      currentRecovery: null,
      activePlanId: null,
      recoveryPlans: JSON.parse(JSON.stringify(MOCK_RECOVERY_PLANS)),
      metrics: { ...MOCK_METRICS },
      lastUpdated: new Date().toISOString(),
    };
    return {
      success: true,
      message: "Schedule reset to baseline successfully",
      isLiveBackend: false,
    };
  }
}
