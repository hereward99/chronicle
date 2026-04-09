

## Items 1–4: Chronicle Filtering, Toast Cleanup, Location Hook Alignment, Dead Code Removal

### 1. Add `chronicle_id` filtering to 7 hooks

Each of these hooks will import `useChronicles` and filter queries by the active chronicle:

| Hook | Current behavior | Fix |
|------|-----------------|-----|
| `useCharacters` | Fetches all user's characters | Add `.eq('chronicle_id', chronicleId)`, include `chronicleId` in query key, disable query when no chronicle |
| `useSessions` | Fetches all sessions | Same pattern |
| `usePlots` | Fetches all plots | Same pattern |
| `useNotes` | Fetches all notes | Same pattern |
| `useRelationships` | Fetches all relationships | Same pattern |
| `useChronicleStats` | Counts everything | Add `.eq('chronicle_id', chronicleId)` to all 4 stat queries |
| `useRecentActivity` | Shows all recent items | Add `.eq('chronicle_id', chronicleId)` to all 4 activity queries |

The pattern follows what `useLocations` and `useBoons` already do.

### 2. Standardize toast imports

7 files import from `@/components/ui/use-toast` (a 2-line re-export wrapper). Change all to import directly from `@/hooks/use-toast`:
- `useChronicleStats.tsx`
- `useBoons.tsx`
- `useCharacters.tsx`
- `useCoteries.tsx`
- `useFactions.tsx`
- `useRelationships.tsx`
- `Settings.tsx`

1 file (`useLocations.tsx`) imports from `sonner` — replace with `@/hooks/use-toast` and convert `toast.success()`/`toast.error()` calls to the standard `toast({ title, variant })` pattern.

Delete the wrapper file `src/components/ui/use-toast.ts` afterward.

### 3. Align `useLocations` API

`useLocations` currently returns raw mutation objects (`createLocation.mutate(...)`). Wrap them in async helper functions like every other hook does:
```
const createLocation = async (loc) => createLocationMutation.mutateAsync(loc);
```

### 4. Delete dead files

- Delete `src/pages/Index.tsx` — unused, no imports reference it
- Delete `src/components/ui/use-toast.ts` — the re-export wrapper (after step 2 redirects all imports)

Also remove the duplicate `<Sonner />` toaster from `App.tsx` since the app standardizes on the shadcn toast system, not sonner. Remove the sonner import as well.

---

**After implementation**: We pause and review before proceeding to items 5–7 (CRUD factory hook, Supabase type regeneration, useChecklists migration).

