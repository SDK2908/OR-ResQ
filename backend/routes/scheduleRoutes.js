/**
 * OR-ResQ — Dynamic Operating Room Optimization & Recovery Engine
 * Backend API Routes: scheduleRoutes.js
 *
 * Exposes deterministic constraint-based optimization scheduling,
 * emergency conflict simulation, multi-plan recovery evaluation,
 * and transparent operational metrics.
 */

import { Router } from "express";
import { generateBaselineSchedule } from "../scheduler/scheduler.js";
import { recoverSchedule, SELECTION_POLICY } from "../scheduler/recovery.js";
import {
  OPERATING_ROOMS,
  SURGEONS,
  EQUIPMENT_INVENTORY,
  BASELINE_PROCEDURES,
  DEMO_EMERGENCY_SCENARIO,
  getFreshDemoData
} from "../data/demoData.js";
import { DISRUPTION_WEIGHTS } from "../config/weights.js";

const router = Router();

/**
 * In-memory operational schedule state
 */
let activeState = {
  baselineSchedule: null,
  currentSchedule: null,
  currentRecovery: null,
  lastBaselineResult: null,
  lastEmergency: null,
  lastUpdated: new Date().toISOString()
};

/**
 * Initializes baseline schedule if not present.
 */
async function ensureBaselineSchedule() {
  if (!activeState.baselineSchedule) {
    const demo = getFreshDemoData();

    const result = await generateBaselineSchedule({
      procedures: demo.procedures,
      operatingRooms: demo.operatingRooms,
      surgeons: demo.surgeons,
      equipmentInventory: demo.equipmentInventory,
      date: "2026-09-18"
    });

    activeState.baselineSchedule = result.schedule;
    activeState.currentSchedule = result.schedule;
    activeState.lastBaselineResult = result;
    activeState.currentRecovery = null;
    activeState.lastUpdated = new Date().toISOString();
  }

  return activeState.baselineSchedule;
}

/**
 * GET /api/health
 * Service heartbeat, version, and optimization engine identity.
 */
router.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    service: "OR-ResQ Optimization & Recovery Engine",
    engine:
      "constraint-based optimization engine using a deterministic priority-first greedy heuristic",
    version: "1.0.0",
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString()
  });
});

/**
 * GET /api/demo-data
 * Returns the deterministic demo dataset
 * (ORs, surgeons, equipment inventory, procedures,
 * emergency scenario, weights).
 */
router.get("/demo-data", (req, res) => {
  const data = getFreshDemoData();

  res.status(200).json({
    success: true,
    data: {
      ...data,
      weights: { ...DISRUPTION_WEIGHTS }
    }
  });
});

/**
 * POST /api/schedule/generate
 *
 * Generates the baseline schedule using deterministic
 * priority-first greedy heuristic.
 *
 * Accepts optional custom procedures, ORs, surgeons,
 * and equipment.
 */
router.post("/schedule/generate", async (req, res) => {
  try {
    const fresh = getFreshDemoData();

    const procedures = req.body?.procedures || fresh.procedures;
    const operatingRooms =
      req.body?.operatingRooms || fresh.operatingRooms;
    const surgeons = req.body?.surgeons || fresh.surgeons;
    const equipmentInventory =
      req.body?.equipmentInventory || fresh.equipmentInventory;
    const date = req.body?.date || "2026-09-18";

    const result = await generateBaselineSchedule({
      procedures,
      operatingRooms,
      surgeons,
      equipmentInventory,
      date
    });

    // Update in-memory state
    activeState.baselineSchedule = result.schedule;
    activeState.currentSchedule = result.schedule;
    activeState.lastBaselineResult = result;
    activeState.currentRecovery = null;
    activeState.lastEmergency = null;
    activeState.lastUpdated = new Date().toISOString();

    res.status(200).json({
      success: true,
      engine: result.engine,
      date: result.date,
      schedule: result.schedule,
      unassigned: result.unassigned,
      metrics: result.metrics
    });
  } catch (error) {
    console.error("[Schedule] Failed to generate baseline:", error);

    res.status(500).json({
      success: false,
      error:
        error.message || "Failed to generate baseline schedule"
    });
  }
});

/**
 * POST /api/recovery/simulate
 *
 * Simulates emergency arrival, detects resource conflicts,
 * evaluates candidate recovery plans,
 * and returns the lexicographically optimal recovery plan.
 */
router.post("/recovery/simulate", async (req, res) => {
  try {
    // 1. Ensure baseline exists
    await ensureBaselineSchedule();

    // 2. Parse emergency procedure payload
    // or fallback to DEMO_EMERGENCY_SCENARIO
    const fresh = getFreshDemoData();

    const payloadEmergency =
      req.body?.emergencyProcedure ||
      req.body?.emergency ||
      (req.body?.procedureName ? req.body : null);

    const emergencyProcedure = payloadEmergency
      ? {
          ...DEMO_EMERGENCY_SCENARIO,
          ...payloadEmergency
        }
      : fresh.emergencyScenario;

    const operatingRooms =
      req.body?.operatingRooms || fresh.operatingRooms;

    const surgeons =
      req.body?.surgeons || fresh.surgeons;

    const equipmentInventory =
      req.body?.equipmentInventory ||
      fresh.equipmentInventory;

    const weights =
      req.body?.weights || DISRUPTION_WEIGHTS;

    // 3. Execute Recovery Engine
    const recoveryResult = recoverSchedule({
      baselineSchedule: activeState.baselineSchedule,
      emergencyProcedure,
      operatingRooms,
      surgeons,
      equipmentInventory,
      weights
    });

    if (!recoveryResult.success) {
      return res.status(422).json({
        success: false,
        error: recoveryResult.error,
        emergency: recoveryResult.emergency,
        candidates: recoveryResult.candidates || []
      });
    }

    // 4. Update in-memory active state
    activeState.currentRecovery = recoveryResult;
    activeState.currentSchedule =
      recoveryResult.recoveredSchedule;
    activeState.lastEmergency =
      recoveryResult.emergency;
    activeState.lastUpdated =
      new Date().toISOString();

    res.status(200).json({
      success: true,
      emergency: recoveryResult.emergency,
      affectedProcedures:
        recoveryResult.affectedProcedures,
      candidates: recoveryResult.candidates,
      selectedPlan: recoveryResult.selectedPlan,
      baselineSchedule:
        recoveryResult.baselineSchedule,
      recoveredSchedule:
        recoveryResult.recoveredSchedule,
      metrics: recoveryResult.metrics,
      explanation: recoveryResult.explanation,
      selectionPolicy:
        recoveryResult.selectionPolicy ||
        SELECTION_POLICY
    });
  } catch (error) {
    console.error(
      "[Recovery] Failed to execute simulation:",
      error
    );

    res.status(500).json({
      success: false,
      error:
        error.message ||
        "Failed to execute recovery simulation"
    });
  }
});

/**
 * GET /api/schedule/current
 *
 * Returns the currently active schedule
 * (recovered or baseline), active recovery,
 * and metrics.
 */
router.get("/schedule/current", async (req, res) => {
  try {
    await ensureBaselineSchedule();

    res.status(200).json({
      success: true,
      hasBaseline: !!activeState.baselineSchedule,
      hasRecovery: !!activeState.currentRecovery,
      activeView: activeState.currentRecovery
        ? "RECOVERED"
        : "BASELINE",

      baselineSchedule:
        activeState.baselineSchedule || [],

      currentSchedule:
        activeState.currentSchedule || [],

      currentRecovery:
        activeState.currentRecovery || null,

      metrics: activeState.currentRecovery
        ? activeState.currentRecovery.metrics
        : activeState.lastBaselineResult?.metrics ||
          null,

      lastUpdated:
        activeState.lastUpdated
    });
  } catch (error) {
    console.error(
      "[Schedule] Failed to retrieve current schedule:",
      error
    );

    res.status(500).json({
      success: false,
      error:
        error.message ||
        "Failed to retrieve current schedule"
    });
  }
});

/**
 * POST /api/recovery/apply
 *
 * Applies a specific candidate plan
 * (PLAN_A, PLAN_B, PLAN_C)
 * or resets view to BASELINE.
 */
router.post("/recovery/apply", (req, res) => {
  try {
    const { planId } = req.body;

    if (!planId) {
      return res.status(400).json({
        success: false,
        error: "Missing required planId"
      });
    }

    // Reset to baseline
    if (planId === "BASELINE") {
      activeState.currentSchedule =
        activeState.baselineSchedule;

      activeState.currentRecovery = null;

      activeState.lastUpdated =
        new Date().toISOString();

      return res.status(200).json({
        success: true,
        activePlanId: "BASELINE",
        currentSchedule:
          activeState.currentSchedule
      });
    }

    // Make sure a recovery simulation exists
    if (
      !activeState.currentRecovery ||
      !activeState.currentRecovery.candidates
    ) {
      return res.status(400).json({
        success: false,
        error:
          "No active recovery simulation found. Simulate recovery first."
      });
    }

    // Find requested candidate plan
    const candidate =
      activeState.currentRecovery.candidates.find(
        (c) => c.planId === planId
      );

    if (!candidate) {
      return res.status(404).json({
        success: false,
        error:
          `Candidate plan ${planId} not found in current recovery.`
      });
    }

    // Reject infeasible plans
    if (!candidate.feasible) {
      return res.status(422).json({
        success: false,
        error:
          `Candidate plan ${planId} is infeasible: ${candidate.rejectionReason}`
      });
    }

    // Apply candidate schedule
    activeState.currentSchedule =
      candidate.schedule;

    activeState.currentRecovery.selectedPlan = {
      planId: candidate.planId,
      strategy: candidate.strategy,
      name: candidate.name,
      disruptionCost:
        candidate.disruptionCost,
      scheduleStability:
        candidate.scheduleStability
    };

    activeState.currentRecovery.metrics =
      candidate.metrics;

    activeState.lastUpdated =
      new Date().toISOString();

    res.status(200).json({
      success: true,
      activePlanId: candidate.planId,
      selectedPlan:
        activeState.currentRecovery.selectedPlan,
      currentSchedule:
        activeState.currentSchedule,
      metrics: candidate.metrics
    });
  } catch (error) {
    console.error(
      "[Recovery] Failed to apply candidate plan:",
      error
    );

    res.status(500).json({
      success: false,
      error:
        error.message ||
        "Failed to apply candidate plan"
    });
  }
});

/**
 * POST /api/schedule/reset
 *
 * Resets state to clean default demo baseline.
 */
router.post("/schedule/reset", async (req, res) => {
  try {
    activeState = {
      baselineSchedule: null,
      currentSchedule: null,
      currentRecovery: null,
      lastBaselineResult: null,
      lastEmergency: null,
      lastUpdated:
        new Date().toISOString()
    };

    await ensureBaselineSchedule();

    res.status(200).json({
      success: true,
      message:
        "State reset to pristine baseline schedule",
      baselineSchedule:
        activeState.baselineSchedule,
      metrics:
        activeState.lastBaselineResult?.metrics
    });
  } catch (error) {
    console.error(
      "[Schedule] Failed to reset schedule:",
      error
    );

    res.status(500).json({
      success: false,
      error:
        error.message ||
        "Failed to reset schedule"
    });
  }
});

export default router;