/**
 * OR-ResQ — Dynamic Operating Room Optimization & Recovery Engine
 * Constraint-based optimization engine using a deterministic priority-first greedy heuristic.
 *
 * Algorithm Overview:
 * 1. Filter and sort input procedures by operational priority (CRITICAL > HIGH > MEDIUM > LOW),
 *    then by duration descending, using procedure ID as a deterministic tie-breaker.
 * 2. For each procedure, evaluate qualified candidate surgeons holding the required specialty.
 * 3. Search candidate OR suites capable of supporting required equipment.
 * 4. Scan candidate start times in 15-minute increments from room opening time.
 * 5. Apply rigorous constraint checks (OR window, turnover buffer, surgeon working shift & overlap,
 *    and shared equipment hospital-wide capacity).
 * 6. Deterministically select the earliest feasible placement.
 * 7. Dynamically calculate operational utilization metrics across all suites.
 */

import { PRIORITY_RANKS, OPERATIONAL_DEFAULTS } from "../config/weights.js";
import { validatePlacement } from "./constraints.js";

/**
 * Sorts procedures deterministically for priority-first scheduling.
 */
export function sortProceduresByPriority(procedures) {
  return [...procedures].sort((a, b) => {
    const rankA = PRIORITY_RANKS[a.priority] || 0;
    const rankB = PRIORITY_RANKS[b.priority] || 0;
    if (rankB !== rankA) return rankB - rankA; // Highest priority first
    if (b.duration !== a.duration) return b.duration - a.duration; // Longer procedures first
    return String(a.id).localeCompare(String(b.id)); // Deterministic tie-breaker
  });
}

/**
 * Finds all surgeons credentialed in the required procedure specialty.
 * Orders preferred surgeon first if specified, then by ID.
 */
export function getEligibleSurgeons(procedure, surgeons) {
  const eligible = surgeons.filter(s =>
    !procedure.requiredSpecialty || s.specialties.includes(procedure.requiredSpecialty)
  );

  return eligible.sort((a, b) => {
    if (procedure.preferredSurgeonId) {
      if (a.id === procedure.preferredSurgeonId) return -1;
      if (b.id === procedure.preferredSurgeonId) return 1;
    }
    return a.id.localeCompare(b.id);
  });
}

/**
 * Orders candidate operating rooms, placing preferred OR first if specified.
 */
export function getCandidateOperatingRooms(procedure, operatingRooms) {
  return [...operatingRooms].sort((a, b) => {
    if (procedure.preferredOrId) {
      if (a.id === procedure.preferredOrId) return -1;
      if (b.id === procedure.preferredOrId) return 1;
    }
    return a.id.localeCompare(b.id);
  });
}

/**
 * Generates a baseline feasible schedule using constraint-based priority optimization.
 */
export function generateSchedule({
  procedures = [],
  operatingRooms = [],
  surgeons = [],
  equipmentInventory = {},
  date = new Date().toISOString().split("T")[0],
  stepMinutes = OPERATIONAL_DEFAULTS.SLOT_STEP_MINUTES
}) {
  const sortedProcedures = sortProceduresByPriority(procedures);
  const schedule = [];
  const unassigned = [];

  for (const procedure of sortedProcedures) {
    const eligibleSurgeons = getEligibleSurgeons(procedure, surgeons);
    const candidateOrs = getCandidateOperatingRooms(procedure, operatingRooms);

    let assigned = false;

    if (eligibleSurgeons.length === 0) {
      unassigned.push({
        procedure,
        reason: `No surgeon holds required specialty "${procedure.requiredSpecialty}"`
      });
      continue;
    }

    // Deterministic earliest-slot search
    outerSearch:
    for (const or of candidateOrs) {
      // Quick check: can this OR support the equipment?
      const hasEquipmentSupport = (procedure.requiredEquipment || []).every(eq =>
        or.supportedEquipment.includes(eq)
      );
      if (!hasEquipmentSupport) continue;

      for (let startTime = or.openTime; startTime + procedure.duration <= or.closeTime; startTime += stepMinutes) {
        const endTime = startTime + procedure.duration;

        for (const surgeon of eligibleSurgeons) {
          const validation = validatePlacement({
            procedure,
            or,
            surgeon,
            startTime,
            endTime,
            currentSchedule: schedule,
            equipmentInventory,
            enforceTurnover: true
          });

          if (validation.valid) {
            schedule.push({
              id: `SLOT-${procedure.id}`,
              procedureId: procedure.id,
              procedureName: procedure.name,
              orId: or.id,
              orName: or.name,
              surgeonId: surgeon.id,
              surgeonName: surgeon.name,
              priority: procedure.priority,
              requiredSpecialty: procedure.requiredSpecialty,
              startTime,
              endTime,
              duration: procedure.duration,
              equipment: procedure.requiredEquipment || [],
              status: "SCHEDULED"
            });
            assigned = true;
            break outerSearch;
          }
        }
      }
    }

    if (!assigned) {
      unassigned.push({
        procedure,
        reason: "No feasible slot satisfies all OR, surgeon, equipment, and turnover constraints"
      });
    }
  }

  // Sort final schedule by start time and OR ID
  schedule.sort((a, b) => a.startTime - b.startTime || a.orId.localeCompare(b.orId));

  // Dynamic Operational Metrics
  const totalOrMinutesAvailable = operatingRooms.reduce(
    (sum, r) => sum + Math.max(0, r.closeTime - r.openTime),
    0
  );
  const totalScheduledMinutes = schedule.reduce((sum, s) => sum + s.duration, 0);
  const utilizationRate = totalOrMinutesAvailable > 0
    ? Number(((totalScheduledMinutes / totalOrMinutesAvailable) * 100).toFixed(1))
    : 0;

  return {
    success: true,
    engine: "constraint-based optimization engine using a deterministic priority-first greedy heuristic",
    date,
    schedule,
    unassigned,
    metrics: {
      totalProcedures: procedures.length,
      scheduledProcedures: schedule.length,
      unassignedProcedures: unassigned.length,
      totalOrMinutesAvailable,
      totalScheduledMinutes,
      utilizationRate
    }
  };
}

export { generateSchedule as generateBaselineSchedule };

