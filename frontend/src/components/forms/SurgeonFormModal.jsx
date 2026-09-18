/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Modal } from "../common/Modal";
import { Button } from "../common/Button";
import { UserCheck } from "lucide-react";
import { useSchedule } from "../../context/ScheduleContext";

export function SurgeonFormModal({ isOpen, onClose }) {
  const { addLocalSurgeon } = useSchedule();

  const [form, setForm] = useState({
    id: `SURG-${Math.floor(Math.random() * 90 + 10)}`,
    name: "",
    specialty: "General Surgery",
    experience: 8,
    availability: "On Duty (08:00 - 18:00)",
    eligibleProcedures: "Laparoscopic Cholecystectomy, Appendectomy",
  });

  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Please enter surgeon name.");
      return;
    }

    addLocalSurgeon({
      id: form.id,
      name: form.name.trim(),
      specialty: form.specialty,
      experience: Number(form.experience) || 5,
      availability: form.availability,
      eligibleProcedures: form.eligibleProcedures
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean),
    });

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Staff Data Entry: Add Surgeon"
      subtitle="Register an attending surgeon for OR eligibility checks."
      maxWidth="max-w-lg"
    >
      {error && (
        <div className="mb-4 p-2 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Surgeon Full Name *
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Dr. Arthur Pendelton"
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Surgeon ID
            </label>
            <input
              type="text"
              value={form.id}
              onChange={(e) => setForm({ ...form, id: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 font-mono text-slate-600 dark:text-slate-300 focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Primary Specialty
            </label>
            <input
              type="text"
              value={form.specialty}
              onChange={(e) => setForm({ ...form, specialty: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Experience (Years)
            </label>
            <input
              type="number"
              min="1"
              max="40"
              value={form.experience}
              onChange={(e) =>
                setForm({ ...form, experience: Number(e.target.value) })
              }
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Duty Shift Availability
          </label>
          <input
            type="text"
            value={form.availability}
            onChange={(e) => setForm({ ...form, availability: e.target.value })}
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-sky-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Eligible Procedures (comma-separated)
          </label>
          <input
            type="text"
            value={form.eligibleProcedures}
            onChange={(e) =>
              setForm({ ...form, eligibleProcedures: e.target.value })
            }
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-sky-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" icon={UserCheck}>
            Save Surgeon Record
          </Button>
        </div>
      </form>
    </Modal>
  );
}
