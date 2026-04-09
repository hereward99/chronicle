

## Item 7: Migrate `useChecklists` to React Query

### Problem
`useChecklists` is the only CRUD hook still using manual `useState`/`useEffect` state management. Every other entity hook (`useCharacters`, `useNotes`, `usePlots`, `useSessions`, `useBoons`, etc.) uses TanStack React Query with `useQuery`/`useMutation`. This causes:

- **No automatic cache invalidation** -- after creating/deleting a checklist, it manually calls `fetchChecklists()` or does optimistic `setState`, which can drift out of sync
- **No background refetching** -- stale data stays until a manual refetch
- **Inconsistent API** -- every other hook returns `{ data, isLoading }` from `useQuery`; this one returns `{ checklists, loading }`
- **No query key isolation** -- switching chronicles requires the `useEffect` dependency to fire, rather than React Query's automatic key-based cache separation

### What changes

**Single file**: `src/hooks/useChecklists.tsx`

The exported interfaces (`ChecklistItem`, `SessionChecklist`) and `CHECKLIST_TEMPLATES` stay identical. The returned API shape stays identical (`checklists`, `loading`, `createChecklist`, `updateChecklist`, `deleteChecklist`, `toggleItem`, `addItem`, `updateItem`, `deleteItem`, `refetch`) so no consumer changes are needed.

**Internal changes**:
1. Replace `useState`/`useEffect` with `useQuery` for fetching checklists + items (query key: `['checklists', chronicleId]`)
2. Replace each mutation (`createChecklist`, `updateChecklist`, `deleteChecklist`, `toggleItem`, `addItem`, `updateItem`, `deleteItem`) with `useMutation` calls that invalidate the `['checklists', chronicleId]` query on success
3. Keep the optimistic update on `toggleItem` using React Query's `onMutate`/`onError` rollback pattern
4. Map the return values to match the current API: `checklists: data ?? []`, `loading: isLoading`

### No other files change
The consumers (`ChecklistCard.tsx`, `CreateChecklistDialog.tsx`, `EditChecklistDialog.tsx`, and the Sessions page) all consume the same function signatures, so they need no updates.

### Technical detail
```text
Current pattern:
  useState([]) → useEffect fetches → setState → manual refetch after mutations

New pattern:
  useQuery(['checklists', chronicleId], fetchFn) → useMutation with queryClient.invalidateQueries
```

This is a straightforward 1-file refactor that brings the last holdout hook in line with the rest of the codebase.

