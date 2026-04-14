

## Repeat Characters Across Multiple Factions (and Coteries)

### What changes

When "Group by Faction" is selected, a character belonging to multiple factions should appear in **each** faction group (not just the first one). The same fix applies to "Group by Coterie" for consistency.

### Steps

1. **Update grouping logic** in `src/pages/Characters.tsx` (the `groupedCharacters` useMemo around lines 202-239)
   - For `faction` and `coterie` cases, instead of returning a single key, return **multiple keys** (one per membership)
   - Change the iteration from `getKey(c)` returning one string to a `getKeys(c)` returning `string[]`
   - For each key returned, push the character into that group
   - Characters with no faction/coterie still go into "No Faction"/"No Coterie"

### Technical detail

Single file changed: `src/pages/Characters.tsx`. The `getKey` function becomes `getKeys` returning `string[]`, and the `forEach` loop iterates over all returned keys per character.

