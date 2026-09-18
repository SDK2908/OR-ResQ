/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Activity, Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "../components/common/Button";

export function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email) {
      setSubmitted(true);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-400 mb-3">
          <Activity className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Reset Password
        </h1>
        <p className="mt-1 text-xs text-slate-400">
          Enter your staff email to receive password reset instructions
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl sm:px-8 border border-slate-200">
          {submitted ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 mx-auto bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-3">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Reset Link Dispatched
              </h3>
              <p className="text-xs text-slate-600 mt-2">
                If an account exists for <strong className="text-slate-900">{email}</strong>, you will receive reset instructions shortly.
              </p>
              <div className="mt-6">
                <Link to="/login">
                  <Button variant="outline" className="w-full">
                    Return to Login
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Staff Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="coordinator@or-resq.health"
                    className="pl-9 w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <Button type="submit" variant="primary" className="w-full">
                Send Reset Link
              </Button>

              <div className="pt-2 text-center">
                <Link
                  to="/login"
                  className="text-xs text-slate-600 hover:text-slate-900 font-medium inline-flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back to Login
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
