/**
 * OR-ResQ — Dynamic Operating Room Optimization & Recovery Engine
 * Configuration: Disruption Cost Weights & Operational Constants
 *
 * NOTE: These numbers represent transparent demo weights used by the
 * objective cost function for comparing candidate recovery plans.
 * They are operational scheduling weights, not medical or financial claims.
 */

export const DISRUPTION_WEIGHTS = { 
  delayPerMinute: 5,        // Penalty per minute an affected procedure is delayed past its baseline start
  cancellation: 100,        // Penalty for cancelling a procedure (used as absolute last resort)
  overtimePerMinute: 2,     // Penalty per minute a procedure extends beyond the OR closing window
  procedureMoved: 10,       // Penalty for reassigning a procedure to a different OR room
  surgeonIdlePerMinute: 1   // Penalty for surgeon idle gap created by schedule disruptions
};

/**
 * Operational priority hierarchy.
 * Used strictly for scheduling order and conflict arbitration.
 * Higher number = higher operational scheduling priority.
 */
export const PRIORITY_RANKS = Object.freeze({
  CRITICAL: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1
});

/**
 * Standard operating time window constants (in minutes from midnight).
 * 08:00 AM = 480 minutes
 * 05:00 PM = 1020 minutes
 */
export const OPERATIONAL_DEFAULTS = Object.freeze({
  DAY_START_MINUTE: 480,    // 08:00
  DAY_END_MINUTE: 1020,     // 17:00
  SLOT_STEP_MINUTES: 15,    // Discretization step for search heuristic
  TURNOVER_MINUTES: 15      // Buffer between consecutive procedures in the same OR for cleaning/turnover
});
