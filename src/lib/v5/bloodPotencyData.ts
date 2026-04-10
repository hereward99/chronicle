// V5 Blood Potency mechanical effects — corebook reference data

export interface BloodPotencyEffects {
  level: number;
  bloodSurge: number;
  powerBonus: number;
  mending: number;
  baneSeverity: number;
  feedingPenalty: string;
}

/**
 * Blood Potency table from V5 Core Rulebook (p.216).
 * Index = Blood Potency level (0–10).
 */
export const BLOOD_POTENCY_TABLE: BloodPotencyEffects[] = [
  { level: 0, bloodSurge: 1, powerBonus: 0, mending: 1, baneSeverity: 0, feedingPenalty: "No effect" },
  { level: 1, bloodSurge: 2, powerBonus: 0, mending: 1, baneSeverity: 2, feedingPenalty: "No effect" },
  { level: 2, bloodSurge: 2, powerBonus: 1, mending: 2, baneSeverity: 2, feedingPenalty: "Animal and bagged blood slakes no Hunger" },
  { level: 3, bloodSurge: 3, powerBonus: 1, mending: 2, baneSeverity: 3, feedingPenalty: "Animal and bagged blood slakes no Hunger" },
  { level: 4, bloodSurge: 3, powerBonus: 2, mending: 3, baneSeverity: 3, feedingPenalty: "Animal and bagged blood slakes no Hunger; must drain and kill a human to reduce Hunger below 2" },
  { level: 5, bloodSurge: 4, powerBonus: 2, mending: 3, baneSeverity: 4, feedingPenalty: "Animal and bagged blood slakes no Hunger; must drain and kill a human to reduce Hunger below 2" },
  { level: 6, bloodSurge: 4, powerBonus: 3, mending: 3, baneSeverity: 4, feedingPenalty: "Animal and bagged blood slakes no Hunger; must drain and kill a human to reduce Hunger below 2; Kindred blood slakes half Hunger" },
  { level: 7, bloodSurge: 5, powerBonus: 3, mending: 3, baneSeverity: 5, feedingPenalty: "Animal and bagged blood slakes no Hunger; must drain and kill a human to reduce Hunger below 2; Kindred blood slakes half Hunger" },
  { level: 8, bloodSurge: 5, powerBonus: 4, mending: 4, baneSeverity: 5, feedingPenalty: "Animal and bagged blood slakes no Hunger; must drain and kill a human to reduce Hunger below 3; Kindred blood slakes half Hunger" },
  { level: 9, bloodSurge: 6, powerBonus: 4, mending: 4, baneSeverity: 6, feedingPenalty: "Animal and bagged blood slakes no Hunger; must drain and kill a human to reduce Hunger below 3; Kindred blood slakes half Hunger" },
  { level: 10, bloodSurge: 6, powerBonus: 5, mending: 5, baneSeverity: 6, feedingPenalty: "Animal and bagged blood slakes no Hunger; must drain and kill a human to reduce Hunger below 4; Kindred blood slakes half Hunger" },
];

/**
 * Get Blood Potency effects for a given level.
 */
export function getBloodPotencyEffects(bp: number): BloodPotencyEffects {
  const clamped = Math.max(0, Math.min(10, bp));
  return BLOOD_POTENCY_TABLE[clamped];
}
