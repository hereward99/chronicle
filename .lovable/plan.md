## Goal — Option A: Roster vs. Web

Treat **Characters** as the *roster* (entities & groupings) and **Relationships** as the *web* (connections only).

| Page | Tabs (after) |
|---|---|
| **Characters & Groups** | Characters · Coteries · **Factions** |
| **Relationship Map** | **Map** · List |

---

## Changes

### 1. `src/pages/Characters.tsx`
- **Add a `factions` tab** alongside Characters & Coteries.
- Move the entire Factions tab UI from `Relationships.tsx` into this new tab — header, "Create Faction" button, empty state, and faction grid (cards with color border, member badges, Manage/Edit buttons).
- Wire in the faction state already returned by the existing `useFactions(currentChronicle?.id)` hook (currently only used for the Faction filter dropdown). Add the missing pieces: `createFaction`, `updateFaction`, `deleteFaction`, `addCharacterToFaction`, `removeCharacterFromFaction`.
- Add the dialogs at the bottom: `CreateFactionDialog`, `EditFactionDialog`, `ManageFactionMembersDialog` (all guarded by `currentChronicle`).
- Add local state: `createFactionDialogOpen`, `editFactionDialogOpen`, `selectedFaction`, `manageMembersDialogOpen`.
- **Auto-switch to `factions` tab** when global search highlights a faction (mirror existing coterie auto-switch in `useEffect` on `highlightId`).
- Update the page header subtitle from "Manage your chronicle's characters and coteries" to "Manage your chronicle's characters, coteries, and factions".
- Optional polish: small summary strip above the tabs — "X characters · Y coteries · Z factions".

### 2. `src/pages/Relationships.tsx`
- **Remove the `factions` `TabsTrigger` and `TabsContent`** entirely (lines ~654–657 and ~946–1049).
- **Rename the `graph` tab to `Map`** (label only — keep `value="graph"` to avoid breaking any deep links, or change to `value="map"` if there are no external references; quick rg shows none).
- **Remove the entire bottom Coteries section** (lines ~1052–1164) — it's already on the Characters page, so this eliminates the duplicate.
- Remove now-unused imports/state related to factions UI: `CreateFactionDialog`, `EditFactionDialog`, `ManageFactionMembersDialog`, `EmptyState`, `Flag`, `UserPlus`, faction dialog state. **Keep** `useFactions` and `factions`/`characterFactions` — they're still needed for the Map filter sidebar and the SuggestedRelationships component.
- Remove unused coterie UI bits: `CreateCoterieDialog`, `ManageCoterieDialog`, `showCreateCoterieDialog`, `selectedCoterie`, `memberCounts`, `setPrimaryCoterie`, `getCoterieMembers`, `Star`, `MapPin`, `MentionText`, `TextHighlight` if no longer referenced. **Keep** `coteries`, `allCoterieMembers` and `primaryCharacterIds` — still needed for Map filters and graph centering.
- Update header subtitle to clarify focus: "Visualize and manage connections between characters" (factions/coteries are managed on the Characters page).

### 3. `src/hooks/useGlobalSearch.tsx`
- Change the navigation route for type `faction` from `/relationships` → `/characters` (line 19) so ⌘K-jumping to a faction lands on the new tab.
- Coterie route already points to `/characters` after this change… actually it currently points to `/relationships` (line 20) — update it to `/characters` too, since the Coteries section is being removed from Relationships.

### 4. `src/components/CommandPalette.tsx`
- Update the help hint copy (line 113) — no functional change, just keeps wording consistent.

---

## Why this works
- **Single source of truth**: every "grouping of characters" (coterie, faction) lives in one place — the roster page.
- **Relationships page becomes lean**: just the Map + List of edges, with Map filters still able to filter by faction/coterie membership (data still loaded via hooks).
- **No data model changes** — purely a UI reshuffle. All hooks, dialogs, and DB tables are untouched.
- **Global search stays correct** because we update the route mapping for faction/coterie results.

## Out of scope (can be follow-ups)
- Renaming the `graph` tab value to `map` if you want cleaner internals.
- Adding "View on map →" shortcuts on Coterie/Faction cards.
- Summary strip ("12 characters · 2 coteries · 3 factions").

Let me know if you want any of those folded in before I implement.
