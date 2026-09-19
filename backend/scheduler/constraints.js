/**
 * OR-ResQ — Dynamic Operating Room Optimization & Recovery Engine
 * Constraint Validation Engine
 *
 * Enforces hard operational constraints:
 * 1. OR Operating Window (operating room open/close hours)
 * 2. OR Overlap (two procedures cannot occupy the same OR concurrently, plus cleaning buffer)
 * 3. Surgeon Specialty Qualification (surgeon must be credentialed in required specialty)
 * 4. Surgeon Availability & Overlap (surgeon working window & no concurrent assignments)
 * 5. OR Equipment Compatibility (OR suite must support required equipment)
 * 6. Hospital-wide Equipment Capacity Limits (shared physical equipment count cannot be exceeded)
 */

import { OPERATIONAL_DEFAULTS } from "../config/weights.js";

/**
 * Checks whether two time intervals overlap.
 * Considers a turnover/cleaning buffer between successive room bookings.
 */
export function isTimeOverlapping(
  startA,
  endA,
  startB,
  endB,
  buffer = 0
) {
  return startA < endB + buffer && endA + buffer > startB;
}

/**
 * Validates whether the proposed time fits within the OR's open working window.
 */
export function checkOrWindow(or, startTime, endTime) {
  if (startTime < or.openTime || endTime > or.closeTime) {
    return {
      valid: false,
      reason: `OR window violation: procedure [${startTime}-${endTime}] exceeds ${or.name} operating hours [${or.openTime}-${or.closeTime}]`
    };
  }
  return { valid: true };
}

/**
 * Validates that the OR has no overlapping procedures during the proposed slot.
 */
export function checkOrConflict(orId, startTime, endTime, currentSchedule, excludeProcedureId = null, buffer = OPERATIONAL_DEFAULTS.TURNOVER_MINUTES) {
  for (const slot of currentSchedule) {
    if (slot.status === "CANCELLED") continue;
    if (excludeProcedureId && slot.procedureId === excludeProcedureId) continue;
    if (slot.orId === orId) {
      if (isTimeOverlapping(startTime, endTime, slot.startTime, slot.endTime, buffer)) {
        return {
          valid: false,
          conflictingSlot: slot,
          reason: `OR conflict: ${orId} already occupied by procedure ${slot.procedureId} (${slot.procedureName}) from minute ${slot.startTime} to ${slot.endTime}`
        };
      }
    }
  }
  return { valid: true };
}

/**
 * Validates surgeon specialty credentialing, working hours, and concurrent bookings.
 */
export function checkSurgeonConflict(surgeon, procedure, startTime, endTime, currentSchedule, excludeProcedureId = null) {
  // 1. Specialty qualification
  if (procedure.requiredSpecialty && !surgeon.specialties.includes(procedure.requiredSpecialty)) {
    return {
      valid: false,
      reason: `Specialty mismatch: ${surgeon.name} does not hold required specialty "${procedure.requiredSpecialty}". Specialties: [${surgeon.specialties.join(", ")}]`
    };
  }

  // 2. Working hours window
  if (startTime < surgeon.workingHours.start || endTime > surgeon.workingHours.end) {
    return {
      valid: false,
      reason: `Surgeon shift violation: slot [${startTime}-${endTime}] is outside ${surgeon.name}'s working hours [${surgeon.workingHours.start}-${surgeon.workingHours.end}]`
    };
  }

  // 3. Concurrent surgeon assignment
  for (const slot of currentSchedule) {
    if (slot.status === "CANCELLED") continue;
    if (excludeProcedureId && slot.procedureId === excludeProcedureId) continue;
    if (slot.surgeonId === surgeon.id) {
      if (isTimeOverlapping(startTime, endTime, slot.startTime, slot.endTime, 0)) {
        return {
          valid: false,
          conflictingSlot: slot,
          reason: `Surgeon conflict: ${surgeon.name} is already performing procedure ${slot.procedureId} (${slot.procedureName}) from minute ${slot.startTime} to ${slot.endTime}`
        };
      }
    }
  }

  return { valid: true };
}

/**
 * Validates equipment compatibility in the selected OR and global inventory limits hospital-wide.
 */
export function checkEquipmentAvailability(or, requiredEquipment = [], startTime, endTime, currentSchedule, equipmentInventory = {}, excludeProcedureId = null) {
  // 1. Check if OR suite physically supports the required equipment
  for (const equip of requiredEquipment) {
    if (!or.supportedEquipment.includes(equip)) {
      return {
        valid: false,
        reason: `OR capability mismatch: ${or.name} does not support required equipment "${equip}"`
      };
    }
  }

  // 2. Check hospital-wide shared inventory limits
  for (const equip of requiredEquipment) {
    const equipInfo = equipmentInventory[equip];
    if (!equipInfo) continue; // Unconstrained or consumable equipment

    const maxCapacity = equipInfo.totalCapacity || 1;
    let concurrentUsage = 0;

    for (const slot of currentSchedule) {
      if (slot.status === "CANCELLED") continue;
      if (excludeProcedureId && slot.procedureId === excludeProcedureId) continue;
      if (slot.equipment && slot.equipment.includes(equip)) {
        if (isTimeOverlapping(startTime, endTime, slot.startTime, slot.endTime, 0)) {
          concurrentUsage++;
        }
      }
    }

    if (concurrentUsage >= maxCapacity) {
      return {
        valid: false,
        reason: `Equipment capacity exceeded: "${equip}" global limit (${maxCapacity}) is fully in use during [${startTime}-${endTime}]`
      };
    }
  }

  return { valid: true };
}

/**
 * Master constraint validator for a proposed slot placement.
 * Evaluates all 5 operational rules in sequence.
 */
export function validatePlacement({
  procedure,
  or,
  surgeon,
  startTime,
  endTime,
  currentSchedule = [],
  equipmentInventory = {},
  excludeProcedureId = null,
  enforceTurnover = true
}) {
  // 1. Duration check
  if (!procedure.duration || procedure.duration <= 0 || endTime - startTime !== procedure.duration) {
    return { valid: false, reason: `Invalid duration for procedure ${procedure.id}: required ${procedure.duration} min` };
  }

  // 2. OR operating window
  const windowCheck = checkOrWindow(or, startTime, endTime);
  if (!windowCheck.valid) return windowCheck;

  // 3. OR overlap conflict
  const buffer = enforceTurnover ? OPERATIONAL_DEFAULTS.TURNOVER_MINUTES : 0;
  const orConflictCheck = checkOrConflict(or.id, startTime, endTime, currentSchedule, excludeProcedureId, buffer);
  if (!orConflictCheck.valid) return orConflictCheck;

  // 4. Surgeon qualification & availability
  const surgeonCheck = checkSurgeonConflict(surgeon, procedure, startTime, endTime, currentSchedule, excludeProcedureId);
  if (!surgeonCheck.valid) return surgeonCheck;

  // 5. Equipment suitability & capacity
  const equipCheck = checkEquipmentAvailability(or, procedure.requiredEquipment, startTime, endTime, currentSchedule, equipmentInventory, excludeProcedureId);
  if (!equipCheck.valid) return equipCheck;

  return { valid: true };
}
