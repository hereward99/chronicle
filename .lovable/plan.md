
Yes — Stories (Plots) and Sessions should adopt the same standardized membership pattern as Coteries and Factions. They already use junction tables (`plot_characters`, `session_characters`) so the data model is aligned; only the UI is inconsistent.

## Current state

- **Sessions**: Uses a checkbox list inside `EditSessionDialog` (height-32 ScrollArea) for character participation. No way to manage from the character side.
- **Stories (Plots)**: Uses checkbox-style selection inside the plot dialog for "characters involved." Same pattern as sessions.
- **Coteries / Factions** (after upcoming refactor): Will use the shared `<GroupMembersPanel>` (Select dropdown + scrollable member list with optional role + remove buttons).

## Proposal: extend the shared pattern

Reuse the same `<GroupMembersPanel>` component for Sessions and Stories, with small per-entity tweaks:

1. **Sessions** — replace the checkbox grid in `EditSessionDialog` and `CreateSessionDialog` with `<GroupMembersPanel>` bound to `session_characters`. No `role` field needed (session_characters has no role column).
2. **Stories** — replace the checkbox grid in `CreatePlotDialog` and `EditPlotDialog` with `<GroupMembersPanel>` bound to `plot_characters`. No `role` field needed either.
3. **Character-side memberships** — extend the "Memberships" section on the character edit dialog (planned for coteries/factions) to also surface their **active stories** and **recent sessions**, with add/remove for stories. Sessions are usually transient, so character-side editing for sessions is optional — recommend read-only list with a link to the session.

## Component variant

`<GroupMembersPanel>` accepts a `showRole` prop (default false). Coteries/Factions pass `showRole={true}`; Sessions/Stories pass `showRole={false}`. Same dropdown picker, same scrollable list, same empty state.

## Tradeoffs

- **Pro**: One mental model across all "group of characters" features. Easier to add new groups later (covens, packs, hunting parties).
- **Pro**: Searchable dropdown scales better than checkboxes when the chronicle has many characters.
- **Con**: Sessions currently show every chronicle character at a glance (checkbox grid). Switching to a picker hides non-members behind a dropdown. Mitigation: keep the scrollable list of selected members visible, and the picker is one click away.

## Decisions to confirm

1. Apply to **both** Stories and Sessions, or just one?
2. For sessions specifically, do you prefer the checkbox grid (good for "tick everyone who showed up") or the picker pattern (consistent, scales better)? A hybrid is possible: picker + "Add all PCs" quick button.
3. Should the character edit dialog's Memberships section include Stories (editable) and Sessions (read-only list)?

## Files affected

- `src/components/groups/GroupMembersPanel.tsx` (new, shared — already planned)
- `src/components/dialogs/CreateSessionDialog.tsx`, `EditSessionDialog.tsx`
- `src/components/dialogs/CreatePlotDialog.tsx`, `EditPlotDialog.tsx`
- `src/hooks/useSessionCharacters.tsx`, `usePlotCharacters.tsx` — align hook surface (`addMember`/`removeMember`/`getMembers`) to match coteries/factions
- Character edit dialog — extend Memberships section
