/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { formatMinutesToTime } from "./formatters";

/**
 * Compares a baseline schedule with a recovered schedule to identify exact impacts:
 * - EMERGENCY: newly added emergency surgery
 * - CANCELLED: present in baseline but absent or marked cancelled in recovered
 * - MOVED: assigned to a different OR
 * - DELAYED: same OR, but start time is shifted later
 * - UNCHANGED: exact same OR and start/end times
 */
export function computeScheduleDiff(baselineSchedule = [], recoveredSchedule = []) {
  const baselineMap = new Map();
  baselineSchedule.forEach((item) => {
    const id = item.procedureId || item.id;
    baselineMap.set(id, item);
  });

  const recoveredMap = new Map();
  recoveredSchedule.forEach((item) => {
    const id = item.procedureId || item.id;
    recoveredMap.set(id, item);
  });

  const results = [];

  // 1. Process items in recovered schedule
  recoveredSchedule.forEach((recoveredItem) => {
    const id = recoveredItem.procedureId || recoveredItem.id;
    const baselineItem = baselineMap.get(id);

    if (
      recoveredItem.isEmergency ||
      recoveredItem.priority === "CRITICAL" && !baselineItem
    ) {
      results.push({
        id,
        procedureName: recoveredItem.procedureName,
        patientMockId: recoveredItem.patientMockId || "EMERGENCY",
        statusChange: "EMERGENCY",
        baselineOr: null,
        recoveredOr: recoveredItem.orId,
        baselineStart: null,
        recoveredStart: recoveredItem.startTime,
        baselineEnd: null,
        recoveredEnd: recoveredItem.endTime,
        duration: recoveredItem.duration,
        surgeonName: recoveredItem.surgeonName,
        priority: recoveredItem.priority || "CRITICAL",
        detailText: `Emergency inserted in ${recoveredItem.orId} at ${formatMinutesToTime(recoveredItem.startTime)}`,
      });
      return;
    }

    if (!baselineItem) {
      // Newly added non-emergency (e.g. from local draft)
      results.push({
        id,
        procedureName: recoveredItem.procedureName,
        patientMockId: recoveredItem.patientMockId,
        statusChange: "ADDED",
        baselineOr: null,
        recoveredOr: recoveredItem.orId,
        baselineStart: null,
        recoveredStart: recoveredItem.startTime,
        baselineEnd: null,
        recoveredEnd: recoveredItem.endTime,
        duration: recoveredItem.duration,
        surgeonName: recoveredItem.surgeonName,
        priority: recoveredItem.priority,
        detailText: `Added to ${recoveredItem.orId} at ${formatMinutesToTime(recoveredItem.startTime)}`,
      });
      return;
    }

    // Compare with baseline
    const orChanged = baselineItem.orId !== recoveredItem.orId;
    const timeShift = (recoveredItem.startTime || 0) - (baselineItem.startTime || 0);
    const durationDelta = (recoveredItem.duration || 0) - (baselineItem.duration || 0);
    const surgeonChanged =
      recoveredItem.status === "SUBSTITUTED" ||
      (recoveredItem.surgeonId && baselineItem.surgeonId && recoveredItem.surgeonId !== baselineItem.surgeonId);
    const isOverrun = recoveredItem.status === "OVERRUN" || durationDelta > 0;

    if (orChanged) {
      results.push({
        id,
        procedureName: recoveredItem.procedureName,
        patientMockId: recoveredItem.patientMockId,
        statusChange: "MOVED",
        baselineOr: baselineItem.orId,
        recoveredOr: recoveredItem.orId,
        baselineStart: baselineItem.startTime,
        recoveredStart: recoveredItem.startTime,
        baselineEnd: baselineItem.endTime,
        recoveredEnd: recoveredItem.endTime,
        duration: recoveredItem.duration,
        surgeonName: recoveredItem.surgeonName,
        priority: recoveredItem.priority,
        detailText: `Moved from ${baselineItem.orId} to ${recoveredItem.orId}${
          timeShift !== 0 ? ` (${timeShift > 0 ? "+" : ""}${timeShift} min shift)` : ""
        }`,
      });
    } else if (isOverrun) {
      results.push({
        id,
        procedureName: recoveredItem.procedureName,
        patientMockId: recoveredItem.patientMockId,
        statusChange: "OVERRUN",
        baselineOr: baselineItem.orId,
        recoveredOr: recoveredItem.orId,
        baselineStart: baselineItem.startTime,
        recoveredStart: recoveredItem.startTime,
        baselineEnd: baselineItem.endTime,
        recoveredEnd: recoveredItem.endTime,
        duration: recoveredItem.duration,
        surgeonName: recoveredItem.surgeonName,
        priority: recoveredItem.priority,
        detailText: `Surgery overrun by +${durationDelta || 60} min (Extended duration: ${recoveredItem.duration} min)`,
      });
    } else if (surgeonChanged) {
      results.push({
        id,
        procedureName: recoveredItem.procedureName,
        patientMockId: recoveredItem.patientMockId,
        statusChange: "SUBSTITUTED",
        baselineOr: baselineItem.orId,
        recoveredOr: recoveredItem.orId,
        baselineStart: baselineItem.startTime,
        recoveredStart: recoveredItem.startTime,
        baselineEnd: baselineItem.endTime,
        recoveredEnd: recoveredItem.endTime,
        duration: recoveredItem.duration,
        surgeonName: recoveredItem.surgeonName,
        priority: recoveredItem.priority,
        detailText: `Surgeon substituted: ${recoveredItem.surgeonName} (was ${baselineItem.surgeonName})`,
      });
    } else if (timeShift > 0) {
      results.push({
        id,
        procedureName: recoveredItem.procedureName,
        patientMockId: recoveredItem.patientMockId,
        statusChange: "DELAYED",
        baselineOr: baselineItem.orId,
        recoveredOr: recoveredItem.orId,
        baselineStart: baselineItem.startTime,
        recoveredStart: recoveredItem.startTime,
        baselineEnd: baselineItem.endTime,
        recoveredEnd: recoveredItem.endTime,
        duration: recoveredItem.duration,
        surgeonName: recoveredItem.surgeonName,
        priority: recoveredItem.priority,
        detailText: `Delayed by +${timeShift} min (New start: ${formatMinutesToTime(recoveredItem.startTime)})`,
      });
    } else {
      results.push({
        id,
        procedureName: recoveredItem.procedureName,
        patientMockId: recoveredItem.patientMockId,
        statusChange: "UNCHANGED",
        baselineOr: baselineItem.orId,
        recoveredOr: recoveredItem.orId,
        baselineStart: baselineItem.startTime,
        recoveredStart: recoveredItem.startTime,
        baselineEnd: baselineItem.endTime,
        recoveredEnd: recoveredItem.endTime,
        duration: recoveredItem.duration,
        surgeonName: recoveredItem.surgeonName,
        priority: recoveredItem.priority,
        detailText: `On schedule at ${formatMinutesToTime(recoveredItem.startTime)} in ${recoveredItem.orId}`,
      });
    }
  });

  // 2. Identify cancelled procedures (in baseline but missing from recovered)
  baselineSchedule.forEach((baselineItem) => {
    const id = baselineItem.procedureId || baselineItem.id;
    if (!recoveredMap.has(id)) {
      results.push({
        id,
        procedureName: baselineItem.procedureName,
        patientMockId: baselineItem.patientMockId,
        statusChange: "CANCELLED",
        baselineOr: baselineItem.orId,
        recoveredOr: null,
        baselineStart: baselineItem.startTime,
        recoveredStart: null,
        baselineEnd: baselineItem.endTime,
        recoveredEnd: null,
        duration: baselineItem.duration,
        surgeonName: baselineItem.surgeonName,
        priority: baselineItem.priority,
        detailText: `Cancelled to accommodate emergency slot (was ${baselineItem.orId} at ${formatMinutesToTime(baselineItem.startTime)})`,
      });
    }
  });

  return results;
}
