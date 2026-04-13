// V5 Blood Potency mechanical effects — corebook reference data

export interface BloodPotencyEffects {
  level: number;
  bloodSurge: number;
  powerBonus: number;
  rouseReroll: number;
  mending: number;
  baneSeverity: number;
  feedingPenalty: string;
}

/**
 * Blood Potency table from V5 Core Rulebook (p.216).
 * Index = Blood Potency level (0–10).
 */
export const BLOOD_POTENCY_TABLE: BloodPotencyEffects[] = [
  { level: 0, bloodSurge: 1, powerBonus: 0, rouseReroll: 0, mending: 1, baneSeverity: 0, feedingPenalty: "No effect" },
  { level: 1, bloodSurge: 2, powerBonus: 0, rouseReroll: 1, mending: 1, baneSeverity: 2, feedingPenalty: "No effect" },
  { level: 2, bloodSurge: 2, powerBonus: 1, rouseReroll: 1, mending: 2, baneSeverity: 2, feedingPenalty: "Animal and bagged blood slakes no Hunger" },
  { level: 3, bloodSurge: 3, powerBonus: 1, rouseReroll: 1, mending: 2, baneSeverity: 3, feedingPenalty: "Animal and bagged blood slakes no Hunger" },
  { level: 4, bloodSurge: 3, powerBonus: 2, rouseReroll: 2, mending: 3, baneSeverity: 3, feedingPenalty: "Animal and bagged blood slakes no Hunger; must drain and kill a human to reduce Hunger below 2" },
  { level: 5, bloodSurge: 4, powerBonus: 2, rouseReroll: 2, mending: 3, baneSeverity: 4, feedingPenalty: "Animal and bagged blood slakes no Hunger; must drain and kill a human to reduce Hunger below 2" },
  { level: 6, bloodSurge: 4, powerBonus: 3, rouseReroll: 3, mending: 3, baneSeverity: 4, feedingPenalty: "Animal and bagged blood slakes no Hunger; must drain and kill a human to reduce Hunger below 2; Kindred blood slakes half Hunger" },
  { level: 7, bloodSurge: 5, powerBonus: 3, rouseReroll: 3, mending: 3, baneSeverity: 5, feedingPenalty: "Animal and bagged blood slakes no Hunger; must drain and kill a human to reduce Hunger below 2; Kindred blood slakes half Hunger" },
  { level: 8, bloodSurge: 5, powerBonus: 4, rouseReroll: 4, mending: 4, baneSeverity: 5, feedingPenalty: "Animal and bagged blood slakes no Hunger; must drain and kill a human to reduce Hunger below 3; Kindred blood slakes half Hunger" },
  { level: 9, bloodSurge: 6, powerBonus: 4, rouseReroll: 4, mending: 4, baneSeverity: 6, feedingPenalty: "Animal and bagged blood slakes no Hunger; must drain and kill a human to reduce Hunger below 3; Kindred blood slakes half Hunger" },
  { level: 10, bloodSurge: 6, powerBonus: 5, rouseReroll: 5, mending: 5, baneSeverity: 6, feedingPenalty: "Animal and bagged blood slakes no Hunger; must drain and kill a human to reduce Hunger below 4; Kindred blood slakes half Hunger" },
];

/**
 * Get Blood Potency effects for a given level.
 */
export function getBloodPotencyEffects(bp: number): BloodPotencyEffects {
  const clamped = Math.max(0, Math.min(10, bp));
  return BLOOD_POTENCY_TABLE[clamped];
}

/**
 * Maximum Blood Potency by Generation (V5 Core Rulebook p.216).
 * Generations below 4th or above 16th are clamped.
 */
const GENERATION_BP_CAP: Record<number, number> = {
  4: 10,
  5: 9,
  6: 8,
  7: 7,
  8: 6,
  9: 5,
  10: 4,
  11: 3,
  12: 2,
  13: 1,
  14: 0,
  15: 0,
  16: 0,
};

/**
 * Get the maximum Blood Potency allowed for a given Generation.
 * Returns null if generation is unknown/not set.
 */
export function getMaxBloodPotency(generation: number | null | undefined): number | null {
  if (generation == null) return null;
  if (generation <= 4) return 10;
  if (generation >= 16) return 0;
  return GENERATION_BP_CAP[generation] ?? null;
}
