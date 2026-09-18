/**
 * OR-ResQ — Dynamic Operating Room Optimization & Recovery Engine
 * Disruption Cost Function & Operational Stability Metrics
 *
 * Pure, deterministic mathematical evaluation of schedule disruptions.
 * Compares candidate recovery plans against the baseline schedule.
 */

import { DISRUPTION_WEIGHTS } from "../config/weights.js";

/**
 * Calculates delay minutes and penalty for an elective procedure.
 */
export function calculateDelayCost(baselineSlot, recoverySlot, weights = DISRUPTION_WEIGHTS) {
  if (!baselineSlot || !recoverySlot || recoverySlot.status === "CANCELLED") {
    return { delayMinutes: 0, cost: 0 };
  }
  const delayMinutes = Math.max(0, recoverySlot.startTime - baselineSlot.startTime);
  const cost = delayMinutes * (weights.delayPerMinute || 0);
  return { delayMinutes, cost };
}

/**
 * Calculates cancellation penalty for an elective procedure.
 */
export function calculateCancellationCost(recoverySlot, weights = DISRUPTION_WEIGHTS) {
  if (recoverySlot && recoverySlot.status === "CANCELLED") {
    return { isCancelled: true, cost: weights.cancellation || 0 };
  }
  return { isCancelled: false, cost: 0 };
}

/**
 * Calculates overtime minutes and penalty when a slot extends past OR closing time.
 */
export function calculateOvertimeCost(recoverySlot, or, weights = DISRUPTION_WEIGHTS) {
  if (!recoverySlot || !or || recoverySlot.status === "CANCELLED") {
    return { overtimeMinutes: 0, cost: 0 };
  }
  const overtimeMinutes = Math.max(0, recoverySlot.endTime - or.closeTime);
  const cost = overtimeMinutes * (weights.overtimePerMinute || 0);
  return { overtimeMinutes, cost };
}

/**
 * Calculates penalty for reassigning a procedure to a different operating room.
 */
export function calculateMovedCost(baselineSlot, recoverySlot, weights = DISRUPTION_WEIGHTS) {
  if (!baselineSlot || !recoverySlot || recoverySlot.status === "CANCELLED") {
    return { isMoved: false, cost: 0 };
  }
  const isMoved = recoverySlot.orId !== baselineSlot.orId;
  const cost = isMoved ? (weights.procedureMoved || 0) : 0;
  return { isMoved, cost };
}

/**
 * Calculates idle time gaps between consecutive procedures for a surgeon.
 */
function getSurgeonTotalIdleMinutes(surgeonId, schedule) {
  const slots = schedule
    .filter(s => s.surgeonId === surgeonId && s.status !== "CANCELLED")
    .sort((a, b) => a.startTime - b.startTime);

  if (slots.length <= 1) return 0;

  let idleMinutes = 0;
  for (let i = 0; i < slots.length - 1; i++) {
    const gap = slots[i + 1].startTime - slots[i].endTime;
    if (gap > 0) {
      idleMinutes += gap;
    }
  }
  return idleMinutes;
}

/**
 * Calculates disruption-caused increase in surgeon idle minutes across all surgeons.
 */
export function calculateSurgeonIdleCost(baselineSchedule = [], recoverySchedule = [], surgeons = [], weights = DISRUPTION_WEIGHTS) {
  let totalDisruptionIdleMinutes = 0;

  for (const surgeon of surgeons) {
    const baselineIdle = getSurgeonTotalIdleMinutes(surgeon.id, baselineSchedule);
    const recoveryIdle = getSurgeonTotalIdleMinutes(surgeon.id, recoverySchedule);
    const idleIncrease = Math.max(0, recoveryIdle - baselineIdle);
    totalDisruptionIdleMinutes += idleIncrease;
  }

  const cost = totalDisruptionIdleMinutes * (weights.surgeonIdlePerMinute || 0);
  return { idleMinutes: totalDisruptionIdleMinutes, cost };
}

/**
 * Dynamic Schedule Stability:
 * stability = (unaffectedOriginalProcedures / totalOriginalProcedures) * 100
 *
 * An original procedure is "unaffected" if it maintains its exact original OR,
 * exact start time, exact end time, and remains SCHEDULED.
 */
export function calculateScheduleStability(baselineSchedule = [], recoverySchedule = [], emergencyProcedureId = null) {
  const baselineElectives = baselineSchedule.filter(s => s.procedureId !== emergencyProcedureId);
  const totalOriginal = baselineElectives.length;

  if (totalOriginal === 0) {
    return {
      totalOriginal: 0,
      unaffectedCount: 0,
      stabilityPercentage: 100.0
    };
  }

  const recoveryMap = new Map(recoverySchedule.map(s => [s.procedureId, s]));
  let unaffectedCount = 0;

  for (const baseSlot of baselineElectives) {
    const recSlot = recoveryMap.get(baseSlot.procedureId);
    if (!recSlot) continue;

    const isIdentical =
      recSlot.status !== "CANCELLED" &&
      recSlot.orId === baseSlot.orId &&
      recSlot.startTime === baseSlot.startTime &&
      recSlot.endTime === baseSlot.endTime &&
      recSlot.surgeonId === baseSlot.surgeonId;

    if (isIdentical) {
      unaffectedCount++;
    }
  }

  const stabilityPercentage = Number(((unaffectedCount / totalOriginal) * 100).toFixed(1));
  return {
    totalOriginal,
    unaffectedCount,
    stabilityPercentage
  };
}

/**
 * Evaluates comprehensive disruption costs and operational metrics by comparing
 * a baseline schedule against a candidate recovery schedule.
 */
export function calculateRecoveryMetrics({
  baselineSchedule = [],
  recoverySchedule = [],
  operatingRooms = [],
  surgeons = [],
  emergencyProcedureId = null,
  weights = DISRUPTION_WEIGHTS
}) {
  const orMap = new Map(operatingRooms.map(r => [r.id, r]));
  const recoveryMap = new Map(recoverySchedule.map(s => [s.procedureId, s]));

  let totalDelayMinutes = 0;
  let delayCostTotal = 0;
  let cancelledCount = 0;
  let cancellationCostTotal = 0;
  let overtimeMinutesTotal = 0;
  let overtimeCostTotal = 0;
  let movedCount = 0;
  let movedCostTotal = 0;

  const finalChangedProcedures = [];
  const baselineElectives = baselineSchedule.filter(s => s.procedureId !== emergencyProcedureId);

  for (const baseSlot of baselineElectives) {
    const recSlot = recoveryMap.get(baseSlot.procedureId);

    if (!recSlot || recSlot.status === "CANCELLED") {
      cancelledCount++;
      cancellationCostTotal += (weights.cancellation || 0);
      finalChangedProcedures.push({
        procedureId: baseSlot.procedureId,
        procedureName: baseSlot.procedureName,
        originalOr: baseSlot.orId,
        changeType: "CANCELLED",
        delayMinutes: 0,
        originalStart: baseSlot.startTime,
        newStart: null
      });
      continue;
    }

    // Delay evaluation
    const { delayMinutes, cost: dCost } = calculateDelayCost(baseSlot, recSlot, weights);
    totalDelayMinutes += delayMinutes;
    delayCostTotal += dCost;

    // Room relocation evaluation
    const { isMoved, cost: mCost } = calculateMovedCost(baseSlot, recSlot, weights);
    if (isMoved) {
      movedCount++;
      movedCostTotal += mCost;
    }

    // Room overtime evaluation
    const or = orMap.get(recSlot.orId);
    const { overtimeMinutes, cost: oCost } = calculateOvertimeCost(recSlot, or, weights);
    overtimeMinutesTotal += overtimeMinutes;
    overtimeCostTotal += oCost;

    // Check if slot changed in any way from baseline
    const isChanged =
      recSlot.orId !== baseSlot.orId ||
      recSlot.startTime !== baseSlot.startTime ||
      recSlot.endTime !== baseSlot.endTime;

    if (isChanged) {
      finalChangedProcedures.push({
        procedureId: baseSlot.procedureId,
        procedureName: baseSlot.procedureName,
        originalOr: baseSlot.orId,
        newOr: recSlot.orId,
        originalStart: baseSlot.startTime,
        newStart: recSlot.startTime,
        delayMinutes,
        changeType: isMoved && delayMinutes > 0 ? "MOVED_AND_DELAYED" : isMoved ? "MOVED" : "DELAYED"
      });
    }
  }

  // Also check if emergency procedure caused overtime
  if (emergencyProcedureId) {
    const emergSlot = recoveryMap.get(emergencyProcedureId);
    if (emergSlot) {
      const or = orMap.get(emergSlot.orId);
      const { overtimeMinutes, cost: oCost } = calculateOvertimeCost(emergSlot, or, weights);
      overtimeMinutesTotal += overtimeMinutes;
      overtimeCostTotal += oCost;
    }
  }

  // Surgeon idle time increase
  const { idleMinutes: surgeonIdleMinutes, cost: idleCostTotal } = calculateSurgeonIdleCost(
    baselineSchedule,
    recoverySchedule,
    surgeons,
    weights
  );

  const totalDisruptionCost =
    delayCostTotal +
    cancellationCostTotal +
    overtimeCostTotal +
    movedCostTotal +
    idleCostTotal;

  const stability = calculateScheduleStability(baselineSchedule, recoverySchedule, emergencyProcedureId);

  return {
    disruptionCost: totalDisruptionCost,
    scheduleStability: stability.stabilityPercentage,
    totalOriginalProcedures: stability.totalOriginal,
    unaffectedOriginalProcedures: stability.unaffectedCount,
    finalChangedProceduresCount: finalChangedProcedures.length,
    finalChangedProcedures,
    delayedProceduresCount: finalChangedProcedures.filter(p => p.delayMinutes > 0).length,
    movedProceduresCount: movedCount,
    cancellationsCount: cancelledCount,
    totalDelayMinutes,
    overtimeMinutes: overtimeMinutesTotal,
    surgeonIdleMinutes,
    costBreakdown: {
      delayCost: delayCostTotal,
      cancellationCost: cancellationCostTotal,
      overtimeCost: overtimeCostTotal,
      movedCost: movedCostTotal,
      surgeonIdleCost: idleCostTotal
    }
  };
}
