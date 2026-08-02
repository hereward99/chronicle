## Goal

Every entity hook (`useNotes`, `usePlots`, `useSessions`, `useLocations`, `useFactions`, `useCoteries`, `useBoons`, `useCharacters`) hand-writes the same three mutations: insert/update/delete against Supabase, `invalidateQueries`, a success toast, an error toast. That is roughly 90 near-identical lines per hook, and the drift shows: some inject `user_id` from `supabase.auth.getUser()`, some expect the caller to pass it; `updatePlot(id, updates)` vs `updateLocation({ id, ...updates })`; toast wording varies ("Location deleted" vs "The story has been removed from your chronicle").

## What gets built

**1. `src/hooks/useEntityCrud.tsx` — one generic factory**

```
useEntityCrud<T>({
  table,               // supabase table name
  queryKey,            // e.g. 'plots'
  label,               // 'Story' — drives all toast copy
  select?,             // default '*'
  orderBy?,            // { column, ascending }
  transform?,          // row -> T (e.g. default attachments to [])
  injectUserId?,       // default true
  extraInvalidate?,    // sibling keys, e.g. ['session-characters']
  undoDelete?,         // route delete through undoableAction
})
```

Returns `{ items, loading, error, create, update, remove, refetch, chronicleId, userId }`. Internally it does exactly what the hooks do today: scope the query by `currentChronicle.id`, `enabled: !!chronicleId`, invalidate on success, and emit `notify.success` / `notify.error` with copy derived from `label`.

**2. Standard toast copy**

- create → `"{Label} created"` + `"{name} has been added to your chronicle."`
- update → `"{Label} updated"`
- delete → `"{Label} deleted"`
- errors → `"Failed to create/update/delete {label}"` + the Supabase message

Story keeps saying "Story" even though the table is `plots`, per the terminology lock.

**3. Refactor the hooks, keep their public APIs unchanged**

Each hook becomes a thin wrapper: it declares its interface type and its factory config, then re-exports the existing function names and argument shapes (`updatePlot(id, updates)` stays as-is, `updateLocation({ id, ... })` stays as-is). No component or page changes are required, so this is a low-risk refactor.

Order of work, one hook at a time with a typecheck between each:
`useNotes` → `useLocations` → `usePlots` → `useSessions` → `useBoons` → `useFactions` → `useCoteries` → `useCharacters`.

**4. Keep hook-specific logic where it is**

`useFactions` (character-faction junction), `useCoteries` (members, primary coterie), `useSessions` (`reorderSessions`), and `useCharacters` (import normalization, derived stats) keep their bespoke mutations untouched — only the plain create/update/delete trio moves to the factory. `useChecklists`, `useRelationships`, `usePlotCharacters` and `useDevNotes` are out of scope; they are junction/nested models with a different shape.

**5. Optional undo on delete**

The factory accepts `undoDelete: true`, wiring the existing `undoableAction` helper so delete flows get the 5-second Undo toast instead of a plain success. I will not switch any entity onto it in this pass — just make it available so a later change is one flag.

### Technical notes

- Type safety: the factory is generic over the row type, and the Supabase client is typed per table, so table names are passed through a narrow `keyof Database['public']['Tables']` type rather than `as any`.
- Query keys keep their current `[key, chronicleId]` shape, so cached data and every existing `invalidateQueries` call elsewhere in the app keep working.
- No database changes.

### Verification

After each hook: typecheck, then exercise the affected screen in the preview (create, edit, delete one record) to confirm the list refreshes and the toast fires.
