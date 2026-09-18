/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Activity, Lock, Mail, ArrowRight, ShieldCheck, UserCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/common/Button";
import { MOCK_USERS } from "../data/mockData";

export function Login() {
  const navigate = useNavigate();
  const { login, isLoading, authError } = useAuth();

  const [email, setEmail] = useState("coordinator@or-resq.health");
  const [password, setPassword] = useState("hackathon2026");
  const [localError, setLocalError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError("");
    const res = await login(email, password);
    if (res.success) {
      navigate("/dashboard");
    } else {
      setLocalError(res.error || "Login failed");
    }
  };

  const handleQuickLogin = async (user) => {
    setEmail(user.email);
    setPassword("hackathon2026");
    const res = await login(user.email, "hackathon2026");
    if (res.success) {
      navigate("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Brand Icon */}
        <div className="w-14 h-14 mx-auto rounded-2xl bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-400 mb-4 shadow-lg shadow-sky-500/10">
          <Activity className="w-8 h-8" />
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          OR-ResQ
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Dynamic Operating Room Optimization & Recovery Engine
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl sm:px-8 border border-slate-200">
          {/* Form Header */}
          <div className="mb-6">
            <h2 className="text-lg font-bold text-slate-900">
              Operating Room Command Access
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Sign in to manage schedules, view ML predictions & emergency recovery.
            </p>
          </div>

          {/* Quick Demo Role Selectors for Judges */}
          <div className="mb-6 p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">
              1-Click Demo Profiles (For Hackathon Reviewers):
            </span>
            <div className="grid grid-cols-1 gap-1.5">
              {MOCK_USERS.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => handleQuickLogin(user)}
                  className="w-full text-left px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-sky-400 hover:bg-sky-50/50 transition-colors flex items-center justify-between group"
                >
                  <div>
                    <span className="text-xs font-semibold text-slate-800 block">
                      {user.name}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {user.role} ({user.department})
                    </span>
                  </div>
                  <UserCheck className="w-4 h-4 text-slate-400 group-hover:text-sky-600 shrink-0" />
                </button>
              ))}
            </div>
          </div>

          {(localError || authError) && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg">
              {localError || authError}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Staff Work Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9 w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="coordinator@or-resq.health"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold text-slate-700"
                >
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-sky-600 hover:text-sky-700 font-medium"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                loading={isLoading}
                className="w-full"
                icon={ArrowRight}
                id="login-submit-btn"
              >
                Sign In to Command Center
              </Button>
            </div>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>New surgical staff?</span>
            <Link
              to="/signup"
              className="text-sky-600 hover:text-sky-700 font-semibold"
            >
              Create Account
            </Link>
          </div>
        </div>

        {/* Prototype footnote */}
        <div className="text-center mt-6 text-xs text-slate-500 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-slate-400" />
          <span>Demo Authentication • Prototype Session</span>
        </div>
      </div>
    </div>
  );
}
