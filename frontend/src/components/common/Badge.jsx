/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";

export function Badge({
  children,
  variant = "slate", // "red" | "amber" | "emerald" | "sky" | "purple" | "slate"
  size = "md", // "sm" | "md"
  dot = false,
  className = "",
  id,
}) {
  const variantMap = {
    red: "bg-red-50 text-red-700 border-red-200",
    amber: "bg-amber-50 text-amber-800 border-amber-200",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
    sky: "bg-sky-50 text-sky-700 border-sky-200",
    purple: "bg-purple-50 text-purple-700 border-purple-200",
    slate: "bg-slate-100 text-slate-700 border-slate-200",
  };

  const dotColorMap = {
    red: "bg-red-500",
    amber: "bg-amber-500",
    emerald: "bg-emerald-500",
    sky: "bg-sky-500",
    purple: "bg-purple-500",
    slate: "bg-slate-400",
  };

  const sizeClasses = size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs";

  return (
    <span
      id={id}
      className={`inline-flex items-center gap-1.5 font-medium rounded-md border ${
        variantMap[variant] || variantMap.slate
      } ${sizeClasses} ${className}`}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${
            dotColorMap[variant] || dotColorMap.slate
          }`}
        />
      )}
      {children}
    </span>
  );
}
