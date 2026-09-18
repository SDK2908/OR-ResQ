/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Loader2 } from "lucide-react";

export function Button({
  children,
  onClick,
  variant = "primary", // "primary" | "secondary" | "danger" | "outline" | "ghost" | "amber"
  size = "md", // "sm" | "md" | "lg"
  loading = false,
  disabled = false,
  icon: Icon,
  className = "",
  type = "button",
  id,
  ...props
}) {
  const baseClasses =
    "inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap";

  const sizeClasses = {
    sm: "px-3 py-1.5 text-xs gap-1.5",
    md: "px-4 py-2 text-sm gap-2",
    lg: "px-5 py-2.5 text-base gap-2.5",
  };

  const variantClasses = {
    primary:
      "bg-sky-700 hover:bg-sky-800 text-white focus:ring-sky-500 shadow-sm",
    secondary:
      "bg-slate-100 hover:bg-slate-200 text-slate-800 focus:ring-slate-400 border border-slate-200",
    danger:
      "bg-rose-600 hover:bg-rose-700 text-white focus:ring-rose-500 shadow-sm",
    amber:
      "bg-amber-600 hover:bg-amber-700 text-white focus:ring-amber-500 shadow-sm",
    outline:
      "border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 focus:ring-sky-500 shadow-xs",
    ghost:
      "bg-transparent hover:bg-slate-100 text-slate-700 focus:ring-slate-300",
  };

  return (
    <button
      id={id}
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
      ) : Icon ? (
        <Icon className="w-4 h-4 shrink-0" />
      ) : null}
      <span>{children}</span>
    </button>
  );
}
