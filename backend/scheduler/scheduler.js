/**
 * OR-ResQ — Dynamic Operating Room Optimization & Recovery Engine
 * Constraint-based optimization engine using a deterministic priority-first greedy heuristic.
 *
 * Algorithm Overview:
 * 1. Filter and sort input procedures by operational priority
 *    (CRITICAL > HIGH > MEDIUM > LOW), then by duration descending,
 *    using procedure ID as a deterministic tie-breaker.
 * 2. For each procedure, obtain an ML-predicted surgery duration.
 * 3. Evaluate qualified candidate surgeons holding the required specialty.
 * 4. Search candidate OR suites capable of supporting required equipment.
 * 5. Scan candidate start times in 15-minute increments from room opening time.
 * 6. Apply rigorous constraint checks (OR window, turnover buffer,
 *    surgeon working shift & overlap, and shared equipment hospital-wide capacity).
 * 7. Deterministically select the earliest feasible placement.
 * 8. Dynamically calculate operational utilization metrics across all suites.
 *
 * ML Integration:
 * - The ML service predicts surgery duration using procedure type,
 *   surgeon experience, patient complexity, and historical average.
 * - If the ML service is unavailable, mlClient.js falls back to the
 *   historical average duration.
 */

import { PRIORITY_RANKS, OPERATIONAL_DEFAULTS } from "../config/weights.js";
import { validatePlacement } from "./constraints.js";
import { getPredictedSurgeryDuration } from "../services/mlClient.js";

/**
 * Sorts procedures deterministically for priority-first scheduling.
 *
 * Note:
 * The initial sort uses the historical duration because ML prediction
 * happens asynchronously inside generateSchedule().
 */
export function sortProceduresByPriority(procedures) {
  return [...procedures].sort((a, b) => {
    const rankA = PRIORITY_RANKS[a.priority] || 0;
    const rankB = PRIORITY_RANKS[b.priority] || 0;

    // Highest priority first
    if (rankB !== rankA) {
      return rankB - rankA;
    }

    // Longer historical procedures first
    if (b.duration !== a.duration) {
      return b.duration - a.duration;
    }

    // Deterministic tie-breaker
    return String(a.id).localeCompare(String(b.id));
  });
}

/**
 * Finds all surgeons credentialed in the required procedure specialty.
 * Orders preferred surgeon first if specified, then by ID.
 */
export function getEligibleSurgeons(procedure, surgeons) {
  const eligible = surgeons.filter((surgeon) =>
    !procedure.requiredSpecialty ||
    surgeon.specialties.includes(procedure.requiredSpecialty)
  );

  return eligible.sort((a, b) => {
    if (procedure.preferredSurgeonId) {
      if (a.id === procedure.preferredSurgeonId) {
        return -1;
      }

      if (b.id === procedure.preferredSurgeonId) {
        return 1;
      }
    }

    return a.id.localeCompare(b.id);
  });
}

/**
 * Orders candidate operating rooms,
 * placing preferred OR first if specified.
 */
export function getCandidateOperatingRooms(procedure, operatingRooms) {
  return [...operatingRooms].sort((a, b) => {
    if (procedure.preferredOrId) {
      if (a.id === procedure.preferredOrId) {
        return -1;
      }

      if (b.id === procedure.preferredOrId) {
        return 1;
      }
    }

    return a.id.localeCompare(b.id);
  });
}

/**
 * Generates a baseline feasible schedule using
 * constraint-based priority optimization.
 *
 * The function is asynchronous because each procedure
 * may require a call to the ML duration prediction service.
 */
export async function generateSchedule({
  procedures = [],
  operatingRooms = [],
  surgeons = [],
  equipmentInventory = {},
  date = new Date().toISOString().split("T")[0],
  stepMinutes = OPERATIONAL_DEFAULTS.SLOT_STEP_MINUTES
}) {
  /**
   * Sort procedures using the deterministic priority-first policy.
   */
  const sortedProcedures = sortProceduresByPriority(procedures);

  const schedule = [];
  const unassigned = [];

  /**
   * Process each procedure sequentially.
   *
   * Sequential processing is intentional because each successfully
   * scheduled procedure affects the availability of ORs, surgeons,
   * equipment, and turnover windows for subsequent procedures.
   */
  for (const procedure of sortedProcedures) {
    /**
     * ---------------------------------------------------------------
     * STEP 1: GET ML-PREDICTED DURATION
     * ---------------------------------------------------------------
     *
     * Existing `procedure.duration` is treated as the historical
     * average duration.
     *
     * If surgeonExperience or patientComplexity are not present
     * in demo data, safe defaults are used.
     *
     * mlClient.js handles timeout/errors and falls back to
     * historicalAverage when the ML service is unavailable.
     */
    const historicalAverage = Number(procedure.duration);

    const predictedDuration = await getPredictedSurgeryDuration({
      procedure_type: procedure.name,
      surgeon_experience: Number(
        procedure.surgeonExperience ?? 8
      ),
      patient_complexity: Number(
        procedure.patientComplexity ?? 3
      ),
      historical_average: historicalAverage
    });

    /**
     * Create the procedure actually used by the scheduling engine.
     *
     * `duration` becomes the ML-predicted duration.
     *
     * The original historical duration is preserved separately
     * for transparency and debugging.
     */
    const schedulingProcedure = {
      ...procedure,
      historicalAverage,
      predictedDuration: Number(predictedDuration),
      duration: Number(predictedDuration)
    };

    /**
     * ---------------------------------------------------------------
     * STEP 2: FIND ELIGIBLE SURGEONS AND CANDIDATE ORs
     * ---------------------------------------------------------------
     */
    const eligibleSurgeons = getEligibleSurgeons(
      schedulingProcedure,
      surgeons
    );

    const candidateOrs = getCandidateOperatingRooms(
      schedulingProcedure,
      operatingRooms
    );

    let assigned = false;

    /**
     * No qualified surgeon available.
     */
    if (eligibleSurgeons.length === 0) {
      unassigned.push({
        procedure: schedulingProcedure,
        reason: `No surgeon holds required specialty "${schedulingProcedure.requiredSpecialty}"`
      });

      continue;
    }

    /**
     * ---------------------------------------------------------------
     * STEP 3: DETERMINISTIC EARLIEST-SLOT SEARCH
     * ---------------------------------------------------------------
     *
     * Search ORs in deterministic order.
     * Within each OR, scan time in fixed increments.
     * Within each time slot, evaluate eligible surgeons.
     */
    outerSearch:
    for (const or of candidateOrs) {
      /**
       * Quick equipment compatibility check.
       *
       * The OR itself must support every piece of equipment
       * required by the procedure.
       */
      const hasEquipmentSupport = (
        schedulingProcedure.requiredEquipment || []
      ).every((equipment) =>
        or.supportedEquipment.includes(equipment)
      );

      if (!hasEquipmentSupport) {
        continue;
      }

      /**
       * Scan candidate start times.
       *
       * The predicted ML duration is used here.
       */
      for (
        let startTime = or.openTime;
        startTime + schedulingProcedure.duration <= or.closeTime;
        startTime += stepMinutes
      ) {
        const endTime =
          startTime + schedulingProcedure.duration;

        /**
         * Evaluate every eligible surgeon for this slot.
         */
        for (const surgeon of eligibleSurgeons) {
          const validation = validatePlacement({
            procedure: schedulingProcedure,
            or,
            surgeon,
            startTime,
            endTime,
            currentSchedule: schedule,
            equipmentInventory,
            enforceTurnover: true
          });

          /**
           * Valid placement found.
           */
          if (validation.valid) {
            schedule.push({
              id: `SLOT-${schedulingProcedure.id}`,

              procedureId: schedulingProcedure.id,
              procedureName: schedulingProcedure.name,

              orId: or.id,
              orName: or.name,

              surgeonId: surgeon.id,
              surgeonName: surgeon.name,

              priority: schedulingProcedure.priority,
              requiredSpecialty:
                schedulingProcedure.requiredSpecialty,

              startTime,
              endTime,

              /**
               * Actual duration used by the scheduler.
               * This is the ML prediction, or the historical
               * average if ML fallback was triggered.
               */
              duration: schedulingProcedure.duration,

              /**
               * Preserve duration provenance.
               */
              historicalAverage:
                schedulingProcedure.historicalAverage,

              predictedDuration:
                schedulingProcedure.predictedDuration,

              /**
               * Preserve ML input values when available.
               */
              surgeonExperience:
                schedulingProcedure.surgeonExperience ?? 8,

              patientComplexity:
                schedulingProcedure.patientComplexity ?? 3,

              equipment:
                schedulingProcedure.requiredEquipment || [],

              status: "SCHEDULED"
            });

            assigned = true;

            /**
             * Stop searching once the earliest deterministic
             * feasible placement has been found.
             */
            break outerSearch;
          }
        }
      }
    }

    /**
     * No feasible placement found anywhere.
     */
    if (!assigned) {
      unassigned.push({
        procedure: schedulingProcedure,
        reason:
          "No feasible slot satisfies all OR, surgeon, equipment, and turnover constraints"
      });
    }
  }

  /**
   * ---------------------------------------------------------------
   * STEP 4: SORT FINAL SCHEDULE
   * ---------------------------------------------------------------
   *
   * Sort primarily by start time and then OR ID to keep
   * output deterministic.
   */
  schedule.sort(
    (a, b) =>
      a.startTime - b.startTime ||
      a.orId.localeCompare(b.orId)
  );

  /**
   * ---------------------------------------------------------------
   * STEP 5: CALCULATE OPERATIONAL METRICS
   * ---------------------------------------------------------------
   */

  const totalOrMinutesAvailable = operatingRooms.reduce(
    (sum, room) =>
      sum + Math.max(0, room.closeTime - room.openTime),
    0
  );

  const totalScheduledMinutes = schedule.reduce(
    (sum, slot) => sum + slot.duration,
    0
  );

  const utilizationRate =
    totalOrMinutesAvailable > 0
      ? Number(
          (
            (totalScheduledMinutes /
              totalOrMinutesAvailable) *
            100
          ).toFixed(1)
        )
      : 0;

  /**
   * ---------------------------------------------------------------
   * STEP 6: RETURN FINAL SCHEDULE RESULT
   * ---------------------------------------------------------------
   */
  return {
    success: true,

    engine:
      "constraint-based optimization engine using a deterministic priority-first greedy heuristic",

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

/**
 * Backward-compatible alias used by scheduleRoutes.js.
 */
export {
  generateSchedule as generateBaselineSchedule
};