/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Converts minutes from midnight (e.g. 570) to standard time string "09:30 AM" or "09:30"
 * Handles numbers and strings.
 */
export function formatMinutesToTime(minutes, includeAmPm = true) {
  if (minutes === null || minutes === undefined || isNaN(Number(minutes))) {
    return "N/A";
  }

  const totalMin = Math.round(Number(minutes));
  const hours = Math.floor(totalMin / 60) % 24;
  const mins = totalMin % 60;

  const paddedMins = mins.toString().padStart(2, "0");

  if (!includeAmPm) {
    return `${hours.toString().padStart(2, "0")}:${paddedMins}`;
  }

  const ampm = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;
  return `${displayHours.toString().padStart(2, "0")}:${paddedMins} ${ampm}`;
}

/**
 * Converts a time string "09:30" or "14:15" to minutes from midnight
 */
export function timeToMinutes(timeStr) {
  if (!timeStr || typeof timeStr !== "string") return 0;
  const parts = timeStr.split(":");
  if (parts.length < 2) return 0;
  const hours = parseInt(parts[0], 10) || 0;
  const minutes = parseInt(parts[1], 10) || 0;
  return hours * 60 + minutes;
}

/**
 * Format duration in minutes into a readable string (e.g., "90 min" or "1h 30m")
 */
export function formatDuration(minutes) {
  if (!minutes && minutes !== 0) return "Not provided";
  const m = Math.round(Number(minutes));
  if (m < 60) return `${m} min`;
  const hours = Math.floor(m / 60);
  const rem = m % 60;
  return rem === 0 ? `${hours}h` : `${hours}h ${rem}m (${m} min)`;
}

/**
 * Priority styling and label helper
 */
export function getPriorityBadge(priority) {
  const p = (priority || "").toUpperCase();
  switch (p) {
    case "CRITICAL":
      return {
        label: "CRITICAL",
        bg: "bg-red-50 text-red-700 border border-red-200",
        solidBg: "bg-red-600 text-white",
        dot: "bg-red-500",
      };
    case "HIGH":
      return {
        label: "HIGH",
        bg: "bg-amber-50 text-amber-800 border border-amber-200",
        solidBg: "bg-amber-600 text-white",
        dot: "bg-amber-500",
      };
    case "MEDIUM":
      return {
        label: "MEDIUM",
        bg: "bg-blue-50 text-blue-700 border border-blue-200",
        solidBg: "bg-blue-600 text-white",
        dot: "bg-blue-500",
      };
    case "LOW":
    default:
      return {
        label: "LOW",
        bg: "bg-slate-50 text-slate-700 border border-slate-200",
        solidBg: "bg-slate-500 text-white",
        dot: "bg-slate-400",
      };
  }
}

/**
 * Status styling and label helper
 */
export function getStatusBadge(status) {
  const s = (status || "").toUpperCase();
  switch (s) {
    case "EMERGENCY":
      return {
        label: "Emergency",
        badge: "bg-red-100 text-red-800 border-red-300 font-semibold animate-pulse",
        bgLight: "bg-red-500",
      };
    case "SCHEDULED":
      return {
        label: "Scheduled",
        badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
        bgLight: "bg-emerald-500",
      };
    case "IN_PROGRESS":
    case "IN PROGRESS":
      return {
        label: "In Progress",
        badge: "bg-cyan-50 text-cyan-700 border-cyan-200",
        bgLight: "bg-cyan-500",
      };
    case "COMPLETED":
      return {
        label: "Completed",
        badge: "bg-slate-100 text-slate-700 border-slate-200",
        bgLight: "bg-slate-400",
      };
    case "MOVED":
      return {
        label: "Moved OR",
        badge: "bg-purple-50 text-purple-700 border-purple-200",
        bgLight: "bg-purple-500",
      };
    case "DELAYED":
      return {
        label: "Delayed",
        badge: "bg-amber-50 text-amber-800 border-amber-200",
        bgLight: "bg-amber-500",
      };
    case "CANCELLED":
      return {
        label: "Cancelled",
        badge: "bg-rose-50 text-rose-800 border-rose-300 line-through opacity-80",
        bgLight: "bg-rose-500",
      };
    default:
      return {
        label: status || "Pending",
        badge: "bg-slate-100 text-slate-600 border-slate-200",
        bgLight: "bg-slate-400",
      };
  }
}
