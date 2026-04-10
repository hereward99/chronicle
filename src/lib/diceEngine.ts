// V5 Dice Roller Engine — Vampire: The Masquerade 5th Edition

export interface DieResult {
  value: number;
  isHunger: boolean;
  isSuccess: boolean;
  isCritical: boolean; // rolled a 10
  isBestial: boolean;  // hunger die showing 1
}

export type RollOutcome = 
  | "bestial-failure"   // Failed + hunger die shows 1
  | "total-failure"     // 0 successes, no bestial
  | "failure"           // Some successes but not enough
  | "success"           // Met or exceeded difficulty
  | "messy-critical"    // Critical with hunger die 10
  | "critical";         // Critical without hunger die 10

export interface RollResult {
  dice: DieResult[];
  totalSuccesses: number;
  regularSuccesses: number;
  criticalPairs: number;
  outcome: RollOutcome;
  difficulty: number;
  poolSize: number;
  hungerDice: number;
  hasMessyCritical: boolean;
  hasBestialFailure: boolean;
  margin: number; // successes - difficulty (positive = exceeded)
  willpowerReroll?: boolean; // true if this result came from a Willpower reroll
}

/**
 * Roll a single d10
 */
function rollD10(): number {
  return Math.floor(Math.random() * 10) + 1;
}

/**
 * Perform a V5 dice roll
 */
export function rollV5Dice(
  poolSize: number,
  hungerDice: number,
  difficulty: number = 1
): RollResult {
  // Hunger dice can't exceed pool size
  const actualHunger = Math.min(hungerDice, poolSize);
  const regularDiceCount = poolSize - actualHunger;

  const dice: DieResult[] = [];

  // Roll regular dice
  for (let i = 0; i < regularDiceCount; i++) {
    const value = rollD10();
    dice.push({
      value,
      isHunger: false,
      isSuccess: value >= 6,
      isCritical: value === 10,
      isBestial: false,
    });
  }

  // Roll hunger dice
  for (let i = 0; i < actualHunger; i++) {
    const value = rollD10();
    dice.push({
      value,
      isHunger: true,
      isSuccess: value >= 6,
      isCritical: value === 10,
      isBestial: value === 1,
    });
  }

  // Count successes
  let regularSuccesses = dice.filter(d => d.isSuccess && !d.isCritical).length;
  const criticalDice = dice.filter(d => d.isCritical);
  const criticalPairs = Math.floor(criticalDice.length / 2);
  
  // Each pair of 10s = 4 successes (instead of 2)
  // Remaining unpaired 10s = 1 success each
  const unpairedCriticals = criticalDice.length % 2;
  const totalSuccesses = regularSuccesses + (criticalPairs * 4) + unpairedCriticals;

  // Detect messy critical: critical pair exists AND at least one hunger die is a 10
  const hungerCriticals = dice.filter(d => d.isHunger && d.isCritical);
  const hasMessyCritical = criticalPairs > 0 && hungerCriticals.length > 0;

  // Detect bestial failure: failed AND any hunger die shows 1
  const hungerOnes = dice.filter(d => d.isHunger && d.isBestial);
  const failed = totalSuccesses < difficulty;
  const hasBestialFailure = failed && hungerOnes.length > 0;

  // Determine outcome
  let outcome: RollOutcome;
  if (hasBestialFailure) {
    outcome = "bestial-failure";
  } else if (totalSuccesses === 0) {
    outcome = "total-failure";
  } else if (failed) {
    outcome = "failure";
  } else if (hasMessyCritical) {
    outcome = "messy-critical";
  } else if (criticalPairs > 0) {
    outcome = "critical";
  } else {
    outcome = "success";
  }

  return {
    dice,
    totalSuccesses,
    regularSuccesses: regularSuccesses + unpairedCriticals,
    criticalPairs,
    outcome,
    difficulty,
    poolSize,
    hungerDice: actualHunger,
    hasMessyCritical,
    hasBestialFailure,
    margin: totalSuccesses - difficulty,
  };
}

/**
 * Roll a simple rouse check (1d10, success on 6+)
 */
export function rollRouseCheck(): { success: boolean; value: number } {
  const value = rollD10();
  return { success: value >= 6, value };
}

/**
 * Get a human-readable label for the outcome
 */
export function getOutcomeLabel(outcome: RollOutcome): string {
  switch (outcome) {
    case "bestial-failure": return "Bestial Failure";
    case "total-failure": return "Total Failure";
    case "failure": return "Failure";
    case "success": return "Success";
    case "messy-critical": return "Messy Critical";
    case "critical": return "Critical Win";
  }
}

/**
 * Get the theme color class for an outcome
 */
export function getOutcomeColor(outcome: RollOutcome): string {
  switch (outcome) {
    case "bestial-failure": return "text-destructive";
    case "total-failure": return "text-destructive";
    case "failure": return "text-muted-foreground";
    case "success": return "text-green-400";
    case "messy-critical": return "text-orange-400";
    case "critical": return "text-yellow-400";
  }
}

/**
 * Reroll selected non-hunger dice (Willpower reroll).
 * Up to 3 dice can be rerolled. Only non-hunger dice are valid targets.
 */
export function rerollWillpower(
  previousResult: RollResult,
  indicesToReroll: number[]
): RollResult {
  // Validate: max 3, only non-hunger dice
  const validIndices = indicesToReroll
    .filter(i => i >= 0 && i < previousResult.dice.length && !previousResult.dice[i].isHunger)
    .slice(0, 3);

  // Clone dice array and reroll selected
  const newDice: DieResult[] = previousResult.dice.map((die, idx) => {
    if (validIndices.includes(idx)) {
      const value = Math.floor(Math.random() * 10) + 1;
      return {
        value,
        isHunger: false,
        isSuccess: value >= 6,
        isCritical: value === 10,
        isBestial: false,
      };
    }
    return { ...die };
  });

  // Recalculate results
  let regularSuccesses = newDice.filter(d => d.isSuccess && !d.isCritical).length;
  const criticalDice = newDice.filter(d => d.isCritical);
  const criticalPairs = Math.floor(criticalDice.length / 2);
  const unpairedCriticals = criticalDice.length % 2;
  const totalSuccesses = regularSuccesses + (criticalPairs * 4) + unpairedCriticals;

  const hungerCriticals = newDice.filter(d => d.isHunger && d.isCritical);
  const hasMessyCritical = criticalPairs > 0 && hungerCriticals.length > 0;

  const hungerOnes = newDice.filter(d => d.isHunger && d.isBestial);
  const failed = totalSuccesses < previousResult.difficulty;
  const hasBestialFailure = failed && hungerOnes.length > 0;

  let outcome: RollOutcome;
  if (hasBestialFailure) {
    outcome = "bestial-failure";
  } else if (totalSuccesses === 0) {
    outcome = "total-failure";
  } else if (failed) {
    outcome = "failure";
  } else if (hasMessyCritical) {
    outcome = "messy-critical";
  } else if (criticalPairs > 0) {
    outcome = "critical";
  } else {
    outcome = "success";
  }

  return {
    dice: newDice,
    totalSuccesses,
    regularSuccesses: regularSuccesses + unpairedCriticals,
    criticalPairs,
    outcome,
    difficulty: previousResult.difficulty,
    poolSize: previousResult.poolSize,
    hungerDice: previousResult.hungerDice,
    hasMessyCritical,
    hasBestialFailure,
    margin: totalSuccesses - previousResult.difficulty,
    willpowerReroll: true,
  };
}
