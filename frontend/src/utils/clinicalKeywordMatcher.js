/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Clinical Keyword & Equipment Profile Knowledge Base
 * Automatically maps medical keywords (e.g., "cardiac", "ortho", "trauma", "laparoscopic")
 * to required surgical equipment, sterile kits, specialized operating rooms,
 * surgeon credentials, historical duration baselines, and clinical complexity.
 */

export const CLINICAL_KEYWORD_PROFILES = [
  {
    id: "cardiac",
    name: "Cardiothoracic & Vascular",
    category: "Cardiac",
    icon: "HeartPulse",
    keywords: [
      "cardiac",
      "heart",
      "coronary",
      "cabg",
      "bypass",
      "valve",
      "aortic",
      "aneurysm",
      "thoracotomy",
      "sternotomy",
      "perfusion",
      "mitral",
      "vascular",
      "angioplasty",
      "cardiothoracic",
      "carotid",
      "pacemaker",
    ],
    specialty: "Cardiothoracic Surgery",
    surgeonId: "SURG-03", // Dr. James Thornton (18 yrs experience)
    surgeonName: "Dr. James Thornton",
    preferredOr: "OR-3", // Cardiothoracic & Vascular Suite 3
    preferredOrName: "OR-3 (Cardiothoracic & Vascular Suite)",
    requiredEquipment: [
      "Heart-Lung Machine",
      "Vascular Doppler",
      "Sternal Saw Kit",
      "Perfusion System",
      "Trauma Kit",
    ],
    defaultDuration: 180,
    priority: "HIGH",
    patientComplexity: 4,
    description:
      "Automatic detection: Cardiac cases require cardiopulmonary bypass (Heart-Lung Machine), Vascular Doppler, and dedicated sternotomy kits in OR-3.",
  },
  {
    id: "orthopedic",
    name: "Orthopedic & Joint Surgery",
    category: "Orthopedic",
    icon: "Bone",
    keywords: [
      "ortho",
      "orthopedic",
      "knee",
      "hip",
      "arthroplasty",
      "fracture",
      "joint",
      "rotator",
      "femur",
      "bone",
      "tendon",
      "ligament",
      "meniscus",
      "shoulder",
      "tibia",
      "arthroscopy",
    ],
    specialty: "Orthopedic Surgery",
    surgeonId: "SURG-02", // Dr. Elena Rostova
    surgeonName: "Dr. Elena Rostova",
    preferredOr: "OR-2", // Orthopedic & Robotic Suite 2
    preferredOrName: "OR-2 (Orthopedic & Robotic Suite)",
    requiredEquipment: [
      "Orthopedic Drill",
      "Robotic Arm",
      "C-Arm Fluoroscopy",
      "Joint Replacement Kit",
    ],
    defaultDuration: 105,
    priority: "MEDIUM",
    patientComplexity: 3,
    description:
      "Automatic detection: Orthopedic cases require high-speed bone drills, C-Arm intraoperative fluoroscopy, and robotic navigation in OR-2.",
  },
  {
    id: "trauma",
    name: "Trauma & Acute Resuscitation",
    category: "Trauma",
    icon: "AlertOctagon",
    keywords: [
      "trauma",
      "laparotomy",
      "splenectomy",
      "hemorrhage",
      "rupture",
      "emergency",
      "stab",
      "gunshot",
      "peritonitis",
      "bleeding",
      "resuscitation",
      "exploratory",
    ],
    specialty: "Trauma Surgery",
    surgeonId: "SURG-01", // Dr. Marcus Vance
    surgeonName: "Dr. Marcus Vance",
    preferredOr: "OR-1", // Trauma & General Suite 1
    preferredOrName: "OR-1 (Trauma & General Suite)",
    requiredEquipment: [
      "Trauma Kit",
      "Rapid Infuser",
      "C-Arm Fluoroscopy",
      "Laparoscopy Tower",
    ],
    defaultDuration: 90,
    priority: "CRITICAL",
    patientComplexity: 5,
    description:
      "Automatic detection: Critical trauma protocols pre-stage sterile Trauma Kits, rapid infusers, and high-flow suction in Trauma Suite OR-1.",
  },
  {
    id: "general",
    name: "Minimally Invasive & General Surgery",
    category: "General / MIS",
    icon: "Layers",
    keywords: [
      "laparoscopic",
      "cholecystectomy",
      "appendectomy",
      "hernia",
      "gallbladder",
      "endoscopy",
      "colon",
      "colectomy",
      "biopsy",
      "general",
      "appendix",
      "bowel",
    ],
    specialty: "General Surgery",
    surgeonId: "SURG-04", // Dr. Priya Nair
    surgeonName: "Dr. Priya Nair",
    preferredOr: "OR-4", // Minimally Invasive Day Suite 4
    preferredOrName: "OR-4 (Minimally Invasive Day Suite)",
    requiredEquipment: [
      "Laparoscopy Tower",
      "Endoscopy Rack",
      "Insufflator Kit",
      "HD Camera Monitor",
    ],
    defaultDuration: 75,
    priority: "MEDIUM",
    patientComplexity: 2,
    description:
      "Automatic detection: Minimally invasive procedures automatically allocate Laparoscopy Towers and video endoscopy systems in Suite 4.",
  },
  {
    id: "neurosurgery",
    name: "Neurosurgery & Spine",
    category: "Neurosurgery",
    icon: "Brain",
    keywords: [
      "neuro",
      "brain",
      "craniotomy",
      "spine",
      "spinal",
      "subdural",
      "hematoma",
      "microdiscectomy",
      "laminectomy",
    ],
    specialty: "Neurosurgery",
    surgeonId: "SURG-01",
    surgeonName: "Dr. Marcus Vance",
    preferredOr: "OR-1",
    preferredOrName: "OR-1 (Trauma & General Suite)",
    requiredEquipment: [
      "Surgical Microscope",
      "Neuro Navigation Kit",
      "C-Arm Fluoroscopy",
      "Micro-Bipolar System",
    ],
    defaultDuration: 210,
    priority: "CRITICAL",
    patientComplexity: 5,
    description:
      "Automatic detection: Neuro/spine procedures automatically bundle 3D neuro-navigation suites and high-magnification optical microscopes.",
  },
];

/**
 * Match clinical text against keyword profiles
 * @param {string} text - User inputted procedure name or keywords
 * @returns {object|null} Matched profile with highlighted matched keywords
 */
export function matchClinicalKeywords(text) {
  if (!text || typeof text !== "string" || text.trim().length < 2) {
    return null;
  }

  const normalized = text.toLowerCase();

  for (const profile of CLINICAL_KEYWORD_PROFILES) {
    const matched = profile.keywords.filter((kw) => {
      // Check full word or phrase boundary
      const regex = new RegExp(`\\b${kw}`, "i");
      return regex.test(normalized);
    });

    if (matched.length > 0) {
      return {
        ...profile,
        matchedKeywords: matched,
      };
    }
  }

  return null;
}
