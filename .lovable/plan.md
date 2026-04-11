

## Diagnosis: Excessive Supabase Requests

I identified three root causes draining your Supabase usage:

### Problem 1: No `staleTime` on QueryClient (BIGGEST ISSUE)
The `QueryClient` in `App.tsx` has no default `staleTime`, which means it defaults to **0 milliseconds**. Combined with `refetchOnWindowFocus` defaulting to `true`, every time you switch browser tabs or click back into the app, **every single query refetches from Supabase**. On the Chronicle dashboard alone, that's 8+ simultaneous requests (chronicles, stats [4 tables], recent activity [4 tables], plots, notes) — fired every single tab-focus.

### Problem 2: Unstable query key in `useRelationships`
The query key `['relationships', characterId, characterIds]` includes a `characterIds` array derived from `useCharacters()`. Since `characters.map(c => c.id)` creates a **new array reference on every render**, React Query sees a "new" query key each time, causing the relationships query to refetch in a loop whenever the Relationships page renders.

### Problem 3: `useFactions` missing `enabled` guard
Both queries in `useFactions` run even when `chronicleId` is `undefined` — fetching **all** factions and **all** character_factions across every chronicle, every time any component using factions mounts.

### Problem 4: Raw `useEffect` hooks bypass React Query caching
`useChronicleStats` and `useRecentActivity` use `useState` + `useEffect` instead of `useQuery`. They have no deduplication, no stale-time, and re-fire on every parent re-render that changes `chronicleId`. The stats hook alone makes **4 parallel Supabase calls** each time.

---

## Fix Plan

### Step 1: Add global `staleTime` and disable aggressive refetching
In `App.tsx`, configure the `QueryClient` with sensible defaults:
- `staleTime: 2 * 60 * 1000` (2 minutes) — queries won't refetch if data is less than 2 min old
- `refetchOnWindowFocus: false` — stop the tab-focus refetch storm

### Step 2: Stabilize `useRelationships` query key
Replace the raw `characterIds` array in the query key with a sorted, joined string (`characterIds.sort().join(',')`) so the key is referentially stable across renders.

### Step 3: Add `enabled` guard to `useFactions`
Add `enabled: !!chronicleId` to both queries in `useFactions`, and scope the `character_factions` query by joining through the factions table or filtering by chronicle.

### Step 4: Convert `useChronicleStats` and `useRecentActivity` to `useQuery`
Rewrite both hooks to use React Query instead of raw `useEffect` + `useState`. This gives them automatic deduplication, stale-time respect, and cache sharing.

---

### Technical detail

**File changes:**
1. `src/App.tsx` — add `defaultOptions.queries` to `QueryClient`
2. `src/hooks/useRelationships.tsx` — stabilize query key
3. `src/hooks/useFactions.tsx` — add `enabled` guards
4. `src/hooks/useChronicleStats.tsx` — rewrite with `useQuery`
5. `src/hooks/useRecentActivity.tsx` — rewrite with `useQuery`

**Estimated impact:** Should reduce Supabase requests by roughly 80-90% during normal usage (tab switching, page navigation).

