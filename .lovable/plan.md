

## Add Rouse Re-roll to Blood Potency Effects

### What changes

Add the missing "Rouse Re-roll" column from the V5 corebook Blood Potency table to both the data model and the character sheet display.

### Steps

1. **Update data model** (`src/lib/v5/bloodPotencyData.ts`)
   - Add `rouseReroll: number` to `BloodPotencyEffects` interface
   - Add the value to each entry in `BLOOD_POTENCY_TABLE` (0, 1, 1, 1, 2, 2, 3, 3, 4, 4, 5)

2. **Update character sheet** (`src/components/character/CharacterSheetView.tsx`)
   - Add a fifth stat tile in the Blood Potency Effects grid showing the Rouse Re-roll value
   - Change grid from `grid-cols-2 sm:grid-cols-4` to `grid-cols-2 sm:grid-cols-5`
   - Include a `RuleTooltip` explaining: "Discipline powers at or below this level allow you to re-roll a failed Rouse Check (roll two dice, keep the best result)."

### Technical detail

Two files changed, zero new files, no database changes.

