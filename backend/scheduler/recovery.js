/**
 * OR-ResQ — Dynamic Operating Room Optimization & Recovery Engine
 * Emergency Recovery Engine
 *
 * Requirements:
 * 1. Treat emergency as CRITICAL and schedule it first.
 * 2. Validate emergency placement across all hard constraints:
 *    - OR operating hours & turnover buffer
 *    - Surgeon credentials, specialty, & shift hours
 *    - Equipment compatibility & capacity
 * 3. Detect conflicting baseline elective procedures.
 * 4. Generate multiple candidate recovery plans:
 *    - PLAN_A: Selective cancellation of lower-priority conflicting electives
 *    - PLAN_B: Cross-OR relocation to an alternate suite
 *    - PLAN_C: Sequential delay past the emergency window
 * 5. Validate every candidate recovery schedule via validatePlacement().
 * 6. Compute disruption metrics and select the lowest-cost feasible plan.
 *    (Cancellation is only selected if non-cancellation plans cannot satisfy constraints).
 * 7. Synthesize human-readable explanation dynamically from actual calculations.
 */

import { OPERATIONAL_DEFAULTS, DISRUPTION_WEIGHTS } from "../config/weights.js";
import { validatePlacement, isTimeOverlapping } from "./constraints.js";
import { calculateRecoveryMetrics } from "./cost.js";

/**
 * Finds which baseline scheduled procedures conflict with an emergency slot.
 * Procedures that completed prior to the emergency start time are not disrupted.
 */
export function findConflictingProcedures(baselineSchedule = [], emergencySlot = {}, equipmentInventory = {}) {
  const conflicts = [];

  for (const slot of baselineSchedule) {
    if (slot.status === "CANCELLED") continue;

    // Completed procedures before the emergency start are untouched
    if (slot.endTime <= emergencySlot.startTime) continue;

    // 1. OR Suite Conflict (with 15-minute turnover buffer)
    if (slot.orId === emergencySlot.orId) {
      if (isTimeOverlapping(emergencySlot.startTime, emergencySlot.endTime, slot.startTime, slot.endTime, OPERATIONAL_DEFAULTS.TURNOVER_MINUTES)) {
        conflicts.push({
          slot,
          conflictType: "OR_OVERLAP",
          reason: `Occupies ${emergencySlot.orName} during emergency window [${emergencySlot.startTime}-${emergencySlot.endTime}]`
        });
        continue;
      }
    }

    // 2. Surgeon Concurrent Booking Conflict
    if (slot.surgeonId === emergencySlot.surgeonId) {
      if (isTimeOverlapping(emergencySlot.startTime, emergencySlot.endTime, slot.startTime, slot.endTime, 0)) {
        conflicts.push({
          slot,
          conflictType: "SURGEON_OVERLAP",
          reason: `${emergencySlot.surgeonName} is required for the emergency procedure`
        });
        continue;
      }
    }

    // 3. Shared Limited Equipment Capacity Conflict
    const sharedEquipment = (slot.equipment || []).filter(eq => (emergencySlot.equipment || []).includes(eq));
    for (const eq of sharedEquipment) {
      const cap = equipmentInventory[eq]?.totalCapacity || 1;
      if (cap <= 1 && isTimeOverlapping(emergencySlot.startTime, emergencySlot.endTime, slot.startTime, slot.endTime, 0)) {
        conflicts.push({
          slot,
          conflictType: "EQUIPMENT_CAPACITY",
          reason: `Requires single-capacity equipment "${eq}" needed by emergency`
        });
        break;
      }
    }
  }

  return conflicts;
}

/**
 * Finds a feasible placement slot for a procedure within constraints.
 */
export function findFeasiblePlacement({
  procedure,
  candidateOr,
  surgeon,
  targetStartTime,
  currentSchedule = [],
  equipmentInventory = {},
  enforceTurnover = true,
  stepMinutes = OPERATIONAL_DEFAULTS.SLOT_STEP_MINUTES
}) {
  const duration = procedure.duration;

  // Ensure turnover buffer is satisfied from any preceding procedure in this OR
  let earliestStart = targetStartTime;
  for (const slot of currentSchedule) {
    if (slot.status === "CANCELLED") continue;
    if (slot.orId === candidateOr.id && slot.endTime <= targetStartTime) {
      const bufferEnd = slot.endTime + (enforceTurnover ? OPERATIONAL_DEFAULTS.TURNOVER_MINUTES : 0);
      if (bufferEnd > earliestStart) {
        earliestStart = bufferEnd;
      }
    }
  }

  for (let t = earliestStart; t + duration <= candidateOr.closeTime; t += stepMinutes) {
    const check = validatePlacement({
      procedure,
      or: candidateOr,
      surgeon,
      startTime: t,
      endTime: t + duration,
      currentSchedule,
      equipmentInventory,
      enforceTurnover
    });

    if (check.valid) {
      return { feasible: true, startTime: t, endTime: t + duration };
    }
  }

  return { feasible: false, reason: "No feasible window found satisfying all constraints" };
}

/**
 * Validates and places the emergency procedure.
 */
export function validateEmergencyProcedure(emergencyProcedure, baselineSchedule, operatingRooms, surgeons, equipmentInventory) {
  if (!emergencyProcedure.duration || emergencyProcedure.duration <= 0) {
    return { valid: false, reason: "Emergency procedure must have a positive duration" };
  }

  const arrivalTime = emergencyProcedure.emergencyTime;

  // Find assigned surgeon
  const surgeon = surgeons.find(s => s.id === emergencyProcedure.surgeonId);
  if (!surgeon) {
    return { valid: false, reason: `Assigned surgeon ${emergencyProcedure.surgeonId} not found` };
  }

  // Surgeon specialty check
  if (emergencyProcedure.requiredSpecialty && !surgeon.specialties.includes(emergencyProcedure.requiredSpecialty)) {
    return { valid: false, reason: `${surgeon.name} does not hold required specialty "${emergencyProcedure.requiredSpecialty}"` };
  }

  // Find candidate OR
  const candidateOr = operatingRooms.find(r => r.id === (emergencyProcedure.preferredOrId || emergencyProcedure.orId));
  if (!candidateOr) {
    return { valid: false, reason: "No valid operating room found for emergency placement" };
  }

  // Equipment capability check on OR
  for (const eq of (emergencyProcedure.requiredEquipment || [])) {
    if (!candidateOr.supportedEquipment.includes(eq)) {
      return { valid: false, reason: `${candidateOr.name} does not support required equipment "${eq}"` };
    }
  }

  // Account for prior completed cases in this room and 15m turnover
  let earliestStart = arrivalTime;
  for (const slot of baselineSchedule) {
    if (slot.status === "CANCELLED") continue;
    if (slot.orId === candidateOr.id && slot.endTime <= arrivalTime) {
      const bufferEnd = slot.endTime + OPERATIONAL_DEFAULTS.TURNOVER_MINUTES;
      if (bufferEnd > earliestStart) {
        earliestStart = bufferEnd;
      }
    }
  }

  const endTime = earliestStart + emergencyProcedure.duration;

  // Operating room window check
  if (earliestStart < candidateOr.openTime || endTime > candidateOr.closeTime) {
    return { valid: false, reason: `Emergency [${earliestStart}-${endTime}] exceeds ${candidateOr.name} operating hours` };
  }

  // Surgeon shift window check
  if (earliestStart < surgeon.workingHours.start || endTime > surgeon.workingHours.end) {
    return { valid: false, reason: `Emergency [${earliestStart}-${endTime}] exceeds ${surgeon.name}'s working hours` };
  }

  return {
    valid: true,
    or: candidateOr,
    surgeon,
    startTime: earliestStart,
    endTime
  };
}

/**
 * Validates an entire candidate schedule using validatePlacement().
 */
export function validateCandidateSchedule(schedule, operatingRooms, surgeons, equipmentInventory) {
  const orMap = new Map(operatingRooms.map(r => [r.id, r]));
  const surgMap = new Map(surgeons.map(s => [s.id, s]));

  for (let i = 0; i < schedule.length; i++) {
    const slot = schedule[i];
    if (slot.status === "CANCELLED") continue;

    const or = orMap.get(slot.orId);
    const surgeon = surgMap.get(slot.surgeonId);
    const otherSlots = schedule.filter((_, idx) => idx !== i);

    const check = validatePlacement({
      procedure: {
        id: slot.procedureId,
        name: slot.procedureName,
        duration: slot.duration,
        priority: slot.priority,
        requiredSpecialty: slot.requiredSpecialty,
        requiredEquipment: slot.equipment
      },
      or,
      surgeon,
      startTime: slot.startTime,
      endTime: slot.endTime,
      currentSchedule: otherSlots,
      equipmentInventory,
      enforceTurnover: true
    });

    if (!check.valid) {
      return {
        feasible: false,
        rejectionReason: `Constraint violation for ${slot.procedureName} (${slot.procedureId}) in ${slot.orId}: ${check.reason}`
      };
    }
  }

  return { feasible: true, rejectionReason: null };
}

/**
 * PLAN A: Selective Cancellation Candidate
 * Cancels conflicting lower-priority elective procedure(s), keeping non-conflicting baseline procedures.
 */
export function createCancellationCandidate({
  baselineSchedule,
  emergencySlot,
  conflictingProcedures,
  operatingRooms,
  surgeons,
  equipmentInventory,
  weights
}) {
  const conflictingIds = new Set(conflictingProcedures.map(c => c.slot.procedureId));
  const candidateSchedule = [emergencySlot];

  for (const slot of baselineSchedule) {
    if (conflictingIds.has(slot.procedureId)) {
      candidateSchedule.push({
        ...slot,
        status: "CANCELLED",
        cancellationReason: `Cancelled to accommodate critical emergency ${emergencySlot.procedureName}`
      });
    } else {
      candidateSchedule.push({ ...slot });
    }
  }

  const validation = validateCandidateSchedule(candidateSchedule, operatingRooms, surgeons, equipmentInventory);
  const metrics = calculateRecoveryMetrics({
    baselineSchedule,
    recoverySchedule: candidateSchedule,
    operatingRooms,
    surgeons,
    emergencyProcedureId: emergencySlot.procedureId,
    weights
  });

  return {
    planId: "PLAN_A",
    strategy: "CANCEL_LOWER_PRIORITY",
    name: "Selective Cancellation of Conflicting Electives",
    feasible: validation.feasible,
    rejectionReason: validation.rejectionReason,
    schedule: candidateSchedule,
    metrics,
    affectedProcedures: conflictingProcedures.map(c => ({
      procedureId: c.slot.procedureId,
      procedureName: c.slot.procedureName,
      conflictType: c.conflictType,
      action: "CANCELLED",
      reason: c.reason
    }))
  };
}

/**
 * PLAN B: Cross-OR Relocation Candidate
 * Relocates conflicting elective procedure(s) to another compatible OR suite that has an idle gap.
 */
export function createMoveCandidate({
  baselineSchedule,
  emergencySlot,
  conflictingProcedures,
  operatingRooms,
  surgeons,
  equipmentInventory,
  weights,
  stepMinutes = OPERATIONAL_DEFAULTS.SLOT_STEP_MINUTES
}) {
  const candidateSchedule = [emergencySlot];
  const conflictingIds = new Set(conflictingProcedures.map(c => c.slot.procedureId));

  // Add non-conflicting baseline procedures
  for (const slot of baselineSchedule) {
    if (!conflictingIds.has(slot.procedureId)) {
      candidateSchedule.push({ ...slot });
    }
  }

  const surgMap = new Map(surgeons.map(s => [s.id, s]));
  const affectedDetails = [];
  let allMovedFeasible = true;
  let rejectionReason = null;

  for (const { slot } of conflictingProcedures) {
    let relocated = false;
    const procedure = {
      id: slot.procedureId,
      name: slot.procedureName,
      duration: slot.duration,
      priority: slot.priority,
      requiredSpecialty: slot.requiredSpecialty,
      requiredEquipment: slot.equipment
    };

    // Candidate target ORs (different from original OR)
    const targetOrs = operatingRooms.filter(r => r.id !== slot.orId);

    // Eligible surgeons (prefer original surgeon, otherwise credentialed backup)
    const eligibleSurgeons = surgeons.filter(s =>
      !slot.requiredSpecialty || s.specialties.includes(slot.requiredSpecialty)
    ).sort((a, b) => {
      if (a.id === slot.surgeonId) return -1;
      if (b.id === slot.surgeonId) return 1;
      return a.id.localeCompare(b.id);
    });

    moveSearch:
    for (const targetOr of targetOrs) {
      const hasEquip = (slot.equipment || []).every(eq => targetOr.supportedEquipment.includes(eq));
      if (!hasEquip) continue;

      for (let t = targetOr.openTime; t + slot.duration <= targetOr.closeTime; t += stepMinutes) {
        for (const surg of eligibleSurgeons) {
          const test = validatePlacement({
            procedure,
            or: targetOr,
            surgeon: surg,
            startTime: t,
            endTime: t + slot.duration,
            currentSchedule: candidateSchedule,
            equipmentInventory,
            enforceTurnover: true
          });

          if (test.valid) {
            candidateSchedule.push({
              ...slot,
              orId: targetOr.id,
              orName: targetOr.name,
              surgeonId: surg.id,
              surgeonName: surg.name,
              startTime: t,
              endTime: t + slot.duration,
              status: "MOVED",
              reassignmentNote: `Reassigned from ${slot.orId} to ${targetOr.id}`
            });
            affectedDetails.push({
              procedureId: slot.procedureId,
              procedureName: slot.procedureName,
              conflictType: "OR_OVERLAP",
              action: "MOVED",
              fromOr: slot.orId,
              toOr: targetOr.id,
              startTime: t,
              delayMinutes: Math.max(0, t - slot.startTime)
            });
            relocated = true;
            break moveSearch;
          }
        }
      }
    }

    if (!relocated) {
      allMovedFeasible = false;
      rejectionReason = `Could not find feasible target OR/slot to relocate ${slot.procedureName}`;
      break;
    }
  }

  const validation = allMovedFeasible
    ? validateCandidateSchedule(candidateSchedule, operatingRooms, surgeons, equipmentInventory)
    : { feasible: false, rejectionReason };

  const metrics = calculateRecoveryMetrics({
    baselineSchedule,
    recoverySchedule: candidateSchedule,
    operatingRooms,
    surgeons,
    emergencyProcedureId: emergencySlot.procedureId,
    weights
  });

  return {
    planId: "PLAN_B",
    strategy: "MOVE_TO_IDLE_OR",
    name: "Cross-OR Relocation to Alternate Suite",
    feasible: validation.feasible,
    rejectionReason: validation.rejectionReason,
    schedule: candidateSchedule,
    metrics,
    affectedProcedures: affectedDetails
  };
}

/**
 * PLAN C: Sequential Delay Candidate
 * Keeps conflicting elective procedure(s) in their assigned OR/surgeon, but delays start
 * time sequentially past the emergency completion (plus turnover buffer).
 */
export function createDelayCandidate({
  baselineSchedule,
  emergencySlot,
  conflictingProcedures,
  operatingRooms,
  surgeons,
  equipmentInventory,
  weights,
  stepMinutes = OPERATIONAL_DEFAULTS.SLOT_STEP_MINUTES
}) {
  const candidateSchedule = [emergencySlot];
  const conflictingIds = new Set(conflictingProcedures.map(c => c.slot.procedureId));

  // Add non-conflicting baseline procedures
  for (const slot of baselineSchedule) {
    if (!conflictingIds.has(slot.procedureId)) {
      candidateSchedule.push({ ...slot });
    }
  }

  const orMap = new Map(operatingRooms.map(r => [r.id, r]));
  const surgMap = new Map(surgeons.map(s => [s.id, s]));
  const affectedDetails = [];
  let allDelayedFeasible = true;
  let rejectionReason = null;

  for (const { slot } of conflictingProcedures) {
    let delayedPlaced = false;
    const procedure = {
      id: slot.procedureId,
      name: slot.procedureName,
      duration: slot.duration,
      priority: slot.priority,
      requiredSpecialty: slot.requiredSpecialty,
      requiredEquipment: slot.equipment
    };

    const targetOr = orMap.get(slot.orId);
    const assignedSurgeon = surgMap.get(slot.surgeonId);

    // Earliest possible start is emergency end + turnover buffer
    const earliestFeasibleStart = Math.max(
      slot.startTime,
      emergencySlot.endTime + OPERATIONAL_DEFAULTS.TURNOVER_MINUTES
    );

    for (let t = earliestFeasibleStart; t + slot.duration <= targetOr.closeTime; t += stepMinutes) {
      const test = validatePlacement({
        procedure,
        or: targetOr,
        surgeon: assignedSurgeon,
        startTime: t,
        endTime: t + slot.duration,
        currentSchedule: candidateSchedule,
        equipmentInventory,
        enforceTurnover: true
      });

      if (test.valid) {
        candidateSchedule.push({
          ...slot,
          startTime: t,
          endTime: t + slot.duration,
          status: "DELAYED",
          delayMinutes: t - slot.startTime,
          delayNote: `Delayed by ${t - slot.startTime} min due to emergency`
        });
        affectedDetails.push({
          procedureId: slot.procedureId,
          procedureName: slot.procedureName,
          conflictType: "OR_OVERLAP",
          action: "DELAYED",
          originalStart: slot.startTime,
          newStart: t,
          delayMinutes: t - slot.startTime
        });
        delayedPlaced = true;
        break;
      }
    }

    if (!delayedPlaced) {
      allDelayedFeasible = false;
      rejectionReason = `Delay for ${slot.procedureName} exceeds OR operating window or conflicts with subsequent bookings`;
      break;
    }
  }

  const validation = allDelayedFeasible
    ? validateCandidateSchedule(candidateSchedule, operatingRooms, surgeons, equipmentInventory)
    : { feasible: false, rejectionReason };

  const metrics = calculateRecoveryMetrics({
    baselineSchedule,
    recoverySchedule: candidateSchedule,
    operatingRooms,
    surgeons,
    emergencyProcedureId: emergencySlot.procedureId,
    weights
  });

  return {
    planId: "PLAN_C",
    strategy: "DELAY_SEQUENTIALLY",
    name: "Sequential Delay Post-Emergency",
    feasible: validation.feasible,
    rejectionReason: validation.rejectionReason,
    schedule: candidateSchedule,
    metrics,
    affectedProcedures: affectedDetails
  };
}

/**
 * Generates all candidate recovery plans.
 */
export function generateRecoveryCandidates({
  baselineSchedule,
  emergencySlot,
  conflictingProcedures,
  operatingRooms,
  surgeons,
  equipmentInventory,
  weights
}) {
  const planA = createCancellationCandidate({
    baselineSchedule,
    emergencySlot,
    conflictingProcedures,
    operatingRooms,
    surgeons,
    equipmentInventory,
    weights
  });

  const planB = createMoveCandidate({
    baselineSchedule,
    emergencySlot,
    conflictingProcedures,
    operatingRooms,
    surgeons,
    equipmentInventory,
    weights
  });

  const planC = createDelayCandidate({
    baselineSchedule,
    emergencySlot,
    conflictingProcedures,
    operatingRooms,
    surgeons,
    equipmentInventory,
    weights
  });

  return [planA, planB, planC];
}

export const SELECTION_POLICY = "Minimize cancellations first, then minimize disruption cost, then maximize schedule stability.";

/**
 * Selects the feasible recovery candidate using an explicit LEXICOGRAPHIC objective:
 * 1. Minimize elective cancellations.
 * 2. Among plans with equal cancellations, minimize total disruption cost.
 * 3. If still tied, maximize schedule stability.
 * 4. If still tied, select deterministically by planId.
 */
export function selectLowestCostPlan(candidates = []) {
  const feasible = candidates.filter(c => c.feasible);

  if (feasible.length === 0) {
    return null;
  }

  return [...feasible].sort((a, b) => {
    // 1. Minimize Cancellations
    const cancelsA = a.metrics?.cancellationsCount ?? 0;
    const cancelsB = b.metrics?.cancellationsCount ?? 0;
    if (cancelsA !== cancelsB) {
      return cancelsA - cancelsB;
    }

    // 2. Minimize Total Disruption Cost
    const costA = a.metrics?.disruptionCost ?? Infinity;
    const costB = b.metrics?.disruptionCost ?? Infinity;
    if (costA !== costB) {
      return costA - costB;
    }

    // 3. Maximize Schedule Stability
    const stabA = a.metrics?.scheduleStability ?? -Infinity;
    const stabB = b.metrics?.scheduleStability ?? -Infinity;
    if (stabB !== stabA) {
      return stabB - stabA;
    }

    // 4. Deterministic tie-breaker
    return a.planId.localeCompare(b.planId);
  })[0];
}

/**
 * Converts integer minutes from midnight to a 24-hour formatted string (e.g. 585 => "09:45").
 */
function formatMinuteOfDay(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const padH = String(h).padStart(2, "0");
  const padM = String(m).padStart(2, "0");
  return `${padH}:${padM}`;
}

/**
 * Synthesizes a human-readable, transparent explanation from calculated metrics.
 */
export function generatePlanExplanation(selectedPlan, emergencySlot, baselineSchedule) {
  const m = selectedPlan.metrics;
  const timeStr = formatMinuteOfDay(emergencySlot.startTime);

  const lines = [
    `Emergency inserted into ${emergencySlot.orId} at ${timeStr}.`,
    `${m.delayedProceduresCount} elective procedure${m.delayedProceduresCount === 1 ? ' was' : 's were'} delayed by ${m.totalDelayMinutes} minutes.`,
    `${m.movedProceduresCount} elective procedure${m.movedProceduresCount === 1 ? ' was' : 's were'} moved.`,
    `${m.cancellationsCount} procedures were cancelled.`,
    `Schedule stability: ${m.scheduleStability}%.`,
    `Total disruption cost: ${m.disruptionCost}.`
  ];

  return lines.join("\n");
}

/**
 * Master Recovery Engine Endpoint Function.
 * Orchestrates full disruption detection, multi-plan generation, evaluation, and selection.
 */
export function recoverSchedule({
  baselineSchedule = [],
  emergencyProcedure = {},
  operatingRooms = [],
  surgeons = [],
  equipmentInventory = {},
  weights = DISRUPTION_WEIGHTS
}) {
  // 1. Validate Emergency Procedure
  const emergencyCheck = validateEmergencyProcedure(
    emergencyProcedure,
    baselineSchedule,
    operatingRooms,
    surgeons,
    equipmentInventory
  );

  if (!emergencyCheck.valid) {
    return {
      success: false,
      error: `Emergency placement infeasible: ${emergencyCheck.reason}`,
      emergency: emergencyProcedure
    };
  }

  const emergencySlot = {
    id: `SLOT-${emergencyProcedure.id || "EMERGENCY"}`,
    procedureId: emergencyProcedure.id || "EMERGENCY",
    procedureName: emergencyProcedure.procedureName,
    orId: emergencyCheck.or.id,
    orName: emergencyCheck.or.name,
    surgeonId: emergencyCheck.surgeon.id,
    surgeonName: emergencyCheck.surgeon.name,
    priority: "CRITICAL",
    requiredSpecialty: emergencyProcedure.requiredSpecialty,
    startTime: emergencyCheck.startTime,
    endTime: emergencyCheck.endTime,
    duration: emergencyProcedure.duration,
    equipment: emergencyProcedure.requiredEquipment || [],
    status: "SCHEDULED",
    isEmergency: true
  };

  // 2. Detect Conflicting Baseline Procedures
  const conflictingProcedures = findConflictingProcedures(
    baselineSchedule,
    emergencySlot,
    equipmentInventory
  );

  // 3. Generate Multiple Feasible Recovery Candidates
  const candidates = generateRecoveryCandidates({
    baselineSchedule,
    emergencySlot,
    conflictingProcedures,
    operatingRooms,
    surgeons,
    equipmentInventory,
    weights
  });

  // 4. Select Lowest-Cost Feasible Plan
  const selectedPlan = selectLowestCostPlan(candidates);

  if (!selectedPlan) {
    return {
      success: false,
      error: "No feasible recovery plan could satisfy all OR, surgeon, equipment, and window constraints without violating patient safety.",
      emergency: emergencySlot,
      candidates
    };
  }

  // Sort final recovered schedule by start time and room
  const recoveredSchedule = [...selectedPlan.schedule].sort((a, b) =>
    a.startTime - b.startTime || a.orId.localeCompare(b.orId)
  );

  // 5. Generate Explanation
  const explanation = generatePlanExplanation(selectedPlan, emergencySlot, baselineSchedule);

  return {
    success: true,
    emergency: emergencySlot,
    affectedProcedures: conflictingProcedures.map(c => ({
      procedureId: c.slot.procedureId,
      procedureName: c.slot.procedureName,
      conflictType: c.conflictType,
      reason: c.reason
    })),
    candidates: candidates.map(c => ({
      planId: c.planId,
      strategy: c.strategy,
      name: c.name,
      feasible: c.feasible,
      schedule: c.schedule,
      rejectionReason: c.rejectionReason,
      disruptionCost: c.metrics?.disruptionCost ?? null,
      scheduleStability: c.metrics?.scheduleStability ?? null,
      metrics: c.metrics,
      affectedProcedures: c.affectedProcedures
    })),
    selectedPlan: {
      planId: selectedPlan.planId,
      strategy: selectedPlan.strategy,
      name: selectedPlan.name,
      disruptionCost: selectedPlan.metrics.disruptionCost,
      scheduleStability: selectedPlan.metrics.scheduleStability
    },
    baselineSchedule,
    recoveredSchedule,
    metrics: selectedPlan.metrics,
    explanation,
    selectionPolicy: SELECTION_POLICY
  };
}
