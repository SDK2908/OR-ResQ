/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Loader2 } from "lucide-react";

export function LoadingSpinner({
  message = "Loading...",
  subtext,
  size = "md",
  className = "",
  id,
}) {
  const sizeMap = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-10 h-10",
  };

  return (
    <div
      id={id || "loading-spinner"}
      className={`flex flex-col items-center justify-center p-8 text-center ${className}`}
    >
      <Loader2
        className={`${sizeMap[size] || sizeMap.md} animate-spin text-sky-600 mb-3`}
      />
      <p className="text-sm font-medium text-slate-800">{message}</p>
      {subtext && <p className="text-xs text-slate-500 mt-1 max-w-xs">{subtext}</p>}
    </div>
  );
}
