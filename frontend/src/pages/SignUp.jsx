/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Activity, ArrowRight, ShieldCheck, User } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/common/Button";

export function SignUp() {
  const navigate = useNavigate();
  const { signup, isLoading } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("OR Coordinator");
  const [department, setDepartment] = useState("Surgical Command");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await signup({ name, email, role, department });
    if (res.success) {
      navigate("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-400 mb-3">
          <Activity className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Create OR-ResQ Staff Account
        </h1>
        <p className="mt-1 text-xs text-slate-400">
          Register for the Operating Room Command & Recovery Platform
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl sm:px-8 border border-slate-200">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Dr. Jordan Hayes"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Staff Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="j.hayes@hospital.org"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Primary Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="OR Coordinator">OR Coordinator</option>
                  <option value="Surgeon">Surgeon</option>
                  <option value="Hospital Staff">Hospital Staff</option>
                  <option value="Nurse Supervisor">Nurse Supervisor</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Department
                </label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="Trauma / General"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
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
              >
                Register & Enter Dashboard
              </Button>
            </div>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
            Already have an account?{" "}
            <Link to="/login" className="text-sky-600 hover:text-sky-700 font-semibold">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
