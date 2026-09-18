/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Modal } from "../common/Modal";
import { Button } from "../common/Button";
import { DoorClosed } from "lucide-react";
import { useSchedule } from "../../context/ScheduleContext";

export function OperatingRoomFormModal({ isOpen, onClose }) {
  const { addLocalOperatingRoom } = useSchedule();

  const [form, setForm] = useState({
    id: `OR-${Math.floor(Math.random() * 5 + 5)}`,
    name: "Surgical Suite",
    availability: "Available 08:00 - 18:00",
    equipmentAvailable: "Laparoscopy Tower, C-Arm Fluoroscopy",
    status: "ACTIVE",
  });

  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Please enter room name.");
      return;
    }

    addLocalOperatingRoom({
      id: form.id,
      name: form.name.trim(),
      availability: form.availability,
      equipmentAvailable: form.equipmentAvailable
        .split(",")
        .map((e) => e.trim())
        .filter(Boolean),
      status: form.status,
      utilizationRate: 0,
    });

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Staff Data Entry: Add Operating Room"
      subtitle="Define a new surgical suite or procedure room in the facility."
      maxWidth="max-w-lg"
    >
      {error && (
        <div className="mb-4 p-2 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              OR Identifier *
            </label>
            <input
              type="text"
              required
              value={form.id}
              onChange={(e) => setForm({ ...form, id: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>

          <div className="col-span-2">
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Suite Name / Designation *
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Neurosurgery Suite 5"
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Standard Daily Operating Hours
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
            Installed / Available Equipment
          </label>
          <input
            type="text"
            value={form.equipmentAvailable}
            onChange={(e) =>
              setForm({ ...form, equipmentAvailable: e.target.value })
            }
            placeholder="e.g. C-Arm, Robotic System, Perfusion Pump"
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-sky-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" icon={DoorClosed}>
            Register Operating Room
          </Button>
        </div>
      </form>
    </Modal>
  );
}
