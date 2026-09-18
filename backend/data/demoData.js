/**
 * OR-ResQ — Dynamic Operating Room Optimization & Recovery Engine
 * Deterministic Synthetic Demonstration Dataset
 *
 * NOTE: This is purely synthetic operational benchmark data for hackathon
 * demonstration. It contains NO real patient or identifiable clinical information.
 */

/**
 * Operating Rooms (4 Suites)
 * Each OR has designated operating windows and supported physical equipment.
 */
export const OPERATING_ROOMS = [
  {
    id: "OR-1",
    name: "OR 1 (General & Trauma Suite)",
    openTime: 480,   // 08:00 AM
    closeTime: 1020, // 05:00 PM
    supportedEquipment: ["Trauma Kit", "Laparoscopic Tower", "Electrocautery", "Minor Surgery Kit"]
  },
  {
    id: "OR-2",
    name: "OR 2 (Minimally Invasive Suite)",
    openTime: 480,   // 08:00 AM
    closeTime: 1020, // 05:00 PM
    supportedEquipment: ["Laparoscopic Tower", "Electrocautery", "Endoscopy Cart"]
  },
  {
    id: "OR-3",
    name: "OR 3 (Orthopedic & Imaging Suite)",
    openTime: 480,   // 08:00 AM
    closeTime: 1020, // 05:00 PM
    supportedEquipment: ["C-Arm Fluoroscope", "Ortho Table", "Electrocautery"]
  },
  {
    id: "OR-4",
    name: "OR 4 (Ambulatory & Minor Suite)",
    openTime: 480,   // 08:00 AM
    closeTime: 1020, // 05:00 PM
    supportedEquipment: ["Electrocautery", "Minor Surgery Kit"]
  }
];

/**
 * Hospital Shared Equipment Inventory & Global Capacity Limits.
 * Single-capacity equipment cannot be scheduled in multiple ORs concurrently.
 */
export const EQUIPMENT_INVENTORY = {
  "Trauma Kit": { totalCapacity: 1 },
  "C-Arm Fluoroscope": { totalCapacity: 1 },
  "Ortho Table": { totalCapacity: 1 },
  "Laparoscopic Tower": { totalCapacity: 2 },
  "Endoscopy Cart": { totalCapacity: 1 },
  "Minor Surgery Kit": { totalCapacity: 2 },
  "Electrocautery": { totalCapacity: 4 }
};

/**
 * Surgical Staff / Surgeons
 * Each surgeon has authorized specialties and available working hours.
 */
export const SURGEONS = [
  {
    id: "SURG-01",
    name: "Dr. Kumar",
    specialties: ["General Surgery", "Trauma Surgery"],
    workingHours: { start: 480, end: 1020 } // 08:00 - 17:00
  },
  {
    id: "SURG-02",
    name: "Dr. Patel",
    specialties: ["Orthopedic Surgery"],
    workingHours: { start: 480, end: 1020 } // 08:00 - 17:00
  },
  {
    id: "SURG-03",
    name: "Dr. Chen",
    specialties: ["General Surgery", "Minimally Invasive Surgery"],
    workingHours: { start: 480, end: 1020 } // 08:00 - 17:00
  },
  {
    id: "SURG-04",
    name: "Dr. Rodriguez",
    specialties: ["General Surgery", "Ambulatory Surgery"],
    workingHours: { start: 480, end: 1020 } // 08:00 - 17:00
  }
];

/**
 * Baseline Elective Procedures for the Day
 * Ordered with deterministic IDs, durations, priorities, equipment, and required specialty.
 */
export const BASELINE_PROCEDURES = [
  {
    id: "PROC-01",
    name: "Laparoscopic Cholecystectomy",
    priority: "HIGH",
    duration: 90,
    requiredSpecialty: "General Surgery",
    requiredEquipment: ["Laparoscopic Tower"],
    preferredOrId: "OR-1",
    preferredSurgeonId: "SURG-01"
  },
  {
    id: "PROC-02",
    name: "Appendectomy",
    priority: "HIGH",
    duration: 60,
    requiredSpecialty: "General Surgery",
    requiredEquipment: ["Laparoscopic Tower"],
    preferredOrId: "OR-1",
    preferredSurgeonId: "SURG-01"
  },
  {
    id: "PROC-03",
    name: "Inguinal Hernia Repair",
    priority: "MEDIUM",
    duration: 75,
    requiredSpecialty: "General Surgery",
    requiredEquipment: ["Electrocautery"],
    preferredOrId: "OR-2",
    preferredSurgeonId: "SURG-03"
  },
  {
    id: "PROC-04",
    name: "Total Knee Arthroplasty",
    priority: "HIGH",
    duration: 120,
    requiredSpecialty: "Orthopedic Surgery",
    requiredEquipment: ["C-Arm Fluoroscope", "Ortho Table"],
    preferredOrId: "OR-3",
    preferredSurgeonId: "SURG-02"
  },
  {
    id: "PROC-05",
    name: "Carpal Tunnel Release",
    priority: "LOW",
    duration: 45,
    requiredSpecialty: "Orthopedic Surgery",
    requiredEquipment: ["Electrocautery"],
    preferredOrId: "OR-3",
    preferredSurgeonId: "SURG-02"
  },
  {
    id: "PROC-06",
    name: "Diagnostic Laparoscopy",
    priority: "MEDIUM",
    duration: 60,
    requiredSpecialty: "Minimally Invasive Surgery",
    requiredEquipment: ["Laparoscopic Tower"],
    preferredOrId: "OR-2",
    preferredSurgeonId: "SURG-03"
  },
  {
    id: "PROC-07",
    name: "Excision of Lipoma",
    priority: "LOW",
    duration: 45,
    requiredSpecialty: "Ambulatory Surgery",
    requiredEquipment: ["Minor Surgery Kit"],
    preferredOrId: "OR-4",
    preferredSurgeonId: "SURG-04"
  },
  {
    id: "PROC-08",
    name: "Umbilical Hernia Repair",
    priority: "MEDIUM",
    duration: 60,
    requiredSpecialty: "General Surgery",
    requiredEquipment: ["Electrocautery"],
    preferredOrId: "OR-4",
    preferredSurgeonId: "SURG-04"
  }
];

/**
 * Standard Demo Emergency Scenario
 * Arrival: 09:30 AM (minute 570)
 * Demands OR-1 (Trauma Suite), Dr. Kumar (Trauma Surgeon), and the Trauma Kit.
 */
export const DEMO_EMERGENCY_SCENARIO = {
  id: "EMERG-999",
  procedureName: "Emergency Trauma Laparotomy",
  priority: "CRITICAL",
  duration: 90,
  requiredSpecialty: "Trauma Surgery",
  surgeonId: "SURG-01",       // Dr. Kumar
  requiredEquipment: ["Trauma Kit"],
  emergencyTime: 570,          // 09:30 AM
  preferredOrId: "OR-1"
};

/**
 * Deep-clone helper to return a pristine dataset for scheduling
 */
export function getFreshDemoData() {
  return {
    operatingRooms: JSON.parse(JSON.stringify(OPERATING_ROOMS)),
    equipmentInventory: JSON.parse(JSON.stringify(EQUIPMENT_INVENTORY)),
    surgeons: JSON.parse(JSON.stringify(SURGEONS)),
    procedures: JSON.parse(JSON.stringify(BASELINE_PROCEDURES)),
    emergencyScenario: JSON.parse(JSON.stringify(DEMO_EMERGENCY_SCENARIO))
  };
}
