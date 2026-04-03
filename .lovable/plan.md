

## Mortal Templates for Human Characters

### Context

In VtM 5e, mortal (Human/Ghoul) characters can use predefined power-level templates instead of full attribute/skill builds:

| Template | Dice Pool | Health | Willpower | Notes |
|----------|-----------|--------|-----------|-------|
| **Weak** | 3 dice | 2 | 2 | Children, elderly, infirm |
| **Average** | 5 dice | 4 | 3 | Ordinary mortals |
| **Gifted** | 7 dice | 5 | 4 | Trained professionals |
| **Deadly** | 10 dice | 6 | 5 | Elite soldiers, martial artists |

### Proposed Approach

When clan is "Human" or "Ghoul" in the Create Character dialog, show an optional **Mortal Template** selector (dropdown or radio group). Selecting a template will:

1. Set `use_dice_pools: true` and `skip_attributes: true` (same pattern already used for quick NPCs)
2. Store a `simple` dice pool config where the difficulty equals half the pool (matching the NPC pattern)
3. Pre-fill `health_max` and `willpower_max` from the template values
4. Store the template name in the `concept` field or a dedicated metadata field

If "Custom" is selected (or no template), the character is created normally with full attributes.

### Changes

1. **`src/components/dialogs/CreateCharacterDialog.tsx`**
   - Add a `mortalTemplate` field to form state (values: `none | weak | average | gifted | deadly`)
   - Show the template selector when `clan` is "Human" or "Ghoul"
   - When a template is selected, pass the corresponding dice pool config, health, and willpower values to `createCharacter`
   - When "None/Custom" is selected, create as a normal full-attribute character

2. **No database changes needed** -- the existing `dice_pools`, `use_dice_pools`, `skip_attributes`, `health_max`, and `willpower_max` columns already support this pattern.

3. **Character sheet display** -- the existing dice pool display logic for `skip_attributes` characters will handle rendering these correctly, since it already handles the simple dice pool type.

### Template Data (hardcoded constant)

```text
MORTAL_TEMPLATES = {
  weak:    { pool: 3, health: 2, willpower: 2, label: "Weak (children, elderly)" },
  average: { pool: 5, health: 4, willpower: 3, label: "Average (ordinary mortal)" },
  gifted:  { pool: 7, health: 5, willpower: 4, label: "Gifted (trained professional)" },
  deadly:  { pool: 10, health: 6, willpower: 5, label: "Deadly (elite combatant)" },
}
```

### Summary

This reuses the existing NPC dice pool infrastructure to support mortal templates. One file changes, no migrations, no new columns. The template selector only appears for Human/Ghoul clans.

