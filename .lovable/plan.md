
# Detail Page vs. Dialog Policy

## Policy (locked in)

- **View = route.** Character, Coterie, Plot, Session, Location, Faction each get their own `/entity/:id` page.
- **Create & Edit = dialog.** No `/new` or `/:id/edit` routes. Existing Create*/Edit* dialogs stay as-is and continue to be opened from list pages and detail pages.
- **@Mentions and global search navigate to the detail route** instead of opening a view dialog.
- **Small/associative entities stay dialog-only:** Note, Relationship, Boon/Debt, Checklist item.

## New routes

```text
/characters/:id     -> CharacterDetail
/coteries/:id       -> CoterieDetail
/stories/:id        -> PlotDetail        (matches existing /stories list)
/sessions/:id       -> SessionDetail
/locations/:id      -> LocationDetail
/factions/:id       -> FactionDetail     (new; factions currently have no list page — accessed only via characters/coteries)
```

All routes wrapped in `<ProtectedRoute><Layout>...` like today's pages. Registered above the `*` catch-all in `src/App.tsx`.

## Detail pages

Each detail page is a thin wrapper that:

1. Reads `:id` from `useParams`.
2. Uses the existing hook (`useCharacters`, `usePlots`, etc.) to find the entity in the active chronicle's cached list — no new fetch-by-id hooks needed for v1.
3. If not found (bad id, wrong chronicle, still loading) → skeleton, then a "Not found" state with a Back button.
4. Renders the same content the current View*Dialog renders, but full-page:
   - Reuses `CharacterSheetView` for `/characters/:id`.
   - Reuses the JSX bodies of `ViewPlotDialog`, `ViewLocationDialog`, etc. — extracted into `*View` components so both the dialog (if kept anywhere) and the page can render them.
5. Page header includes:
   - Back button (`navigate(-1)` with a list-page fallback).
   - Title + status badges.
   - Edit button → opens the existing Edit dialog inline on the page.
   - PDF export where applicable (reuse `PdfExportButton`).

## Wiring existing entry points

- **List cards** (`CharacterCard`, `CoterieCard`, plot cards on `Stories`, session cards, location cards, faction chips): clicking the card body navigates to the detail route. Explicit "Edit" / "Delete" buttons on the card still open the dialog / confirm.
- **@Mentions** (`src/components/mentions/MentionText.tsx` + `src/lib/mentions.ts`): resolve `type:id` to the matching route and `navigate()` on click. Types with no route (note, relationship, boon) keep current dialog/no-op behavior.
- **Global search** (`src/components/CommandPalette.tsx` + `useGlobalSearch`): selecting a result navigates to the detail route instead of setting a "view" dialog id.
- **Recent activity** and dashboard links: same treatment where they currently open dialogs.

## Migration approach (per entity, in order)

Ship one entity at a time so each PR is reviewable and reversible:

1. Character (biggest win — mentions/search use it most)
2. Plot
3. Session
4. Location
5. Coterie
6. Faction

For each: add route + page → extract `*View` component from the dialog → repoint cards/mentions/search → keep the old View dialog file until nothing imports it, then delete.

## Out of scope

- No fetch-by-id hooks / server-side 404s (rely on cached chronicle lists for now; can add later if we want shareable links across users).
- No URL params for open dialogs.
- No changes to Create/Edit dialogs or their validation.
- No changes to the mobile bottom nav.

## Technical notes

- `stories` route already lives at `/stories`; the plot detail lives at `/stories/:id` to stay consistent with the label users see.
- `Factions` has no list page today; `/factions/:id` is reachable only via links from characters and coteries. That's fine — no new list page in this pass.
- Reusing hooks means detail pages inherit the active-chronicle filter automatically. If the user switches chronicle while on a detail page, we show the "Not found" state with a Back button (acceptable for v1).
- No route-level code splitting changes; pages are small.

## Deliverables checklist

- [ ] 6 new route files under `src/pages/` (`CharacterDetail.tsx`, etc.)
- [ ] 6 route registrations in `src/App.tsx`
- [ ] 6 extracted `*View` components (from existing View dialogs)
- [ ] `MentionText` navigates on click for supported types
- [ ] `CommandPalette` / `useGlobalSearch` navigates on select
- [ ] List card click handlers navigate; Edit/Delete buttons unchanged
- [ ] Old View*Dialog files removed once unreferenced
