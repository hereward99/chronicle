

## Make Chronicle Header Visibly Editable

### Problem
The page header (title + subtitle) is pulled from the current chronicle's `name` and `description`, but there's no visual cue that these are editable or that they come from the Chronicle Management section at the bottom of the page.

### Proposal
Add a subtle **edit affordance** directly on the header text — a small pencil icon that appears on hover (desktop) or is always visible (mobile). Clicking it opens the existing Edit Chronicle dialog inline, right from the header. This avoids duplicating any logic; it reuses the same `updateChronicle` flow already in `ChronicleManager`.

Specifically:
- Wrap the header title + subtitle in a clickable/hoverable group
- Show a small `Pencil` icon on hover (or tap target on mobile) with a tooltip "Edit chronicle details"
- On click, open a dialog pre-filled with the current chronicle's name, description, and setting (same form as the existing edit dialog in `ChronicleManager`)
- Add a subtle dashed underline or slight opacity change on hover to signal editability

### Technical Details

| File | Change |
|------|--------|
| `src/pages/Chronicle.tsx` | Add local state for an inline edit dialog. Wrap the `<h1>` and `<p>` in a `group` div with `cursor-pointer` and hover styles. Show a `Pencil` icon on `group-hover`. On click, open a small dialog with Name/Description/Setting fields that calls `updateChronicle`. |

No new components needed — the edit form is simple (3 fields) and can be a local dialog within `Chronicle.tsx`, reusing `useChronicles().updateChronicle`. The `ChronicleManager` card at the bottom remains unchanged for full chronicle CRUD (create, switch, delete).

