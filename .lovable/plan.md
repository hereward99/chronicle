

## Item 6: Eliminate `as any` Casts

### Problem
There are 168 `as any` casts across 14 files. The Supabase types file is already up-to-date — the casts exist because of type mismatches between the app's TypeScript interfaces and Supabase's generic `Json` type.

### Root Causes (by category)

**Category A: `Json` vs specific types (characters, plots, sessions, coteries)**
The Supabase type for `characters.disciplines` is `Json | null`, but the app's `Character` interface declares it as `Array<{name: string; level: number}>`. When inserting/updating, TypeScript rejects the mismatch, so `as any` is used. Same for `attachments`, `skills`, `touchstones`, `advantages`, `flaws`, `loresheets`, `powers`, `dice_pools` on characters, and `attachments` on plots/sessions/coteries/locations.

**Category B: `dev_notes` — phantom casts**
The types file already includes `dev_notes` (lines 482-508), so all `from('dev_notes' as any)` casts are completely unnecessary and can simply be removed.

**Category C: App interface fields missing from Supabase Row type**
`EditPlotDialog` uses `(plot as any).summary` and `(plot as any).attachments` — but the Supabase `plots.Row` type already has `summary` and `attachments`. The issue is that the component receives a `Plot` interface (from `usePlots`) which already has these fields. So these casts are also unnecessary — the `Plot` interface just needs its `attachments` type fixed from `any[]` to `Json`.

**Category D: Wizard dialog casts**
`CharacterWizard` and `NPCWizardDialog` cast their entire `createCharacter()` argument `as any` because the object contains fields typed more specifically than the Supabase `Insert` type accepts.

### Solution

1. **Create a helper type** in `src/integrations/supabase/types.ts` (or a new `src/types/database.ts` file) that properly types the Supabase row types with the app's specific JSON structures. Use the `Tables` helper already exported from the types file, then extend with proper JSON field types.

2. **Update entity interfaces** (`Character`, `Plot`, `Session`, `Boon`) to use `Json` for their JSON fields at the Supabase boundary, or cast at the query boundary (one place) instead of at every usage site.

3. **Recommended approach — cast once at the query layer**: Keep the app interfaces with their specific types. In each hook's `queryFn`, cast the Supabase response once: `data as unknown as Character[]`. For inserts/updates, cast the payload once: `as Tables<'characters'>['Insert']`. This confines casts to one explicit boundary per hook.

### Files to change

| File | Changes |
|------|---------|
| `src/hooks/useDevNotes.tsx` | Remove all 8 `as any` casts — they're unnecessary since `dev_notes` is in the types |
| `src/hooks/useCharacters.tsx` | Replace `as any` on insert/update with typed cast to `Tables<'characters'>['Insert']` |
| `src/hooks/useBoons.tsx` | Same pattern — typed cast on insert/update |
| `src/hooks/usePlots.tsx` | Fix `Plot` interface: `attachments` from `any[]` to `Json[] | null` |
| `src/hooks/useSessions.tsx` | Fix `Session` interface: `attachments` from `any[]` to `Json[] | null` |
| `src/components/dialogs/EditPlotDialog.tsx` | Remove 4 unnecessary `(plot as any).summary` / `.attachments` casts |
| `src/components/dialogs/EditSessionDialog.tsx` | Remove 4 unnecessary `(session as any).in_game_date_*` casts |
| `src/components/dialogs/CreatePlotDialog.tsx` | Change `[] as any[]` to typed empty array |
| `src/components/dialogs/CreateLocationDialog.tsx` | Change `[] as any[]` to typed empty array |
| `src/components/dialogs/EditLocationDialog.tsx` | Change `[] as any[]` to typed empty array |
| `src/components/dialogs/CreateCharacterDialog.tsx` | Replace `as any` with typed Supabase insert cast |
| `src/components/dialogs/NPCWizardDialog.tsx` | Replace `as any` with typed insert cast; fix `(characterData as any)[key]` |
| `src/components/character/CharacterWizard.tsx` | Replace `as any` with typed insert cast; fix UI event handler casts |
| `src/components/character/CharacterSheetView.tsx` | Replace `attachments as any` with proper type |
| `src/components/characters/CoterieCard.tsx` | Replace `attachments as any[]` with `Json[]` cast |
| `src/lib/pdfExport.ts` | Replace `as any[]` length checks with proper `Array.isArray()` guards or typed casts |

### Technical detail
The key insight is that `Json` (Supabase's generic JSON type) is compatible with specific object types when reading, but not when writing. The fix pattern:

```text
// Reading (query): cast Supabase rows to app types (already done in most hooks)
return data as unknown as Character[];

// Writing (insert/update): cast app objects to Supabase insert type  
.insert([{ ...character, user_id: user.id } as Database['public']['Tables']['characters']['Insert']])
```

This eliminates all `as any` while preserving type safety at the app layer.

