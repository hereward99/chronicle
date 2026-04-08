

## Character Grouping, Filtering, and Sorting Toolbar

### What changes

Replace the current PC/NPC tabs and bare search bar with a compact toolbar that provides **filter dropdowns**, a **group-by selector**, and a **sort-by selector** — all in one row beneath the search bar.

### Toolbar layout

```text
[ Search ..._________________________ ]
[ Type ▼ ] [ Clan ▼ ] [ Status ▼ ] [ Coterie ▼ ] [ Faction ▼ ] [ Story ▼ ]  |  Group by ▼  |  Sort by ▼  | [Clear filters]
```

### Filter dropdowns

Each dropdown is populated dynamically from the current character data (plus linked data for Factions and Stories):

| Filter | Source | Values |
|--------|--------|--------|
| Type | `character.type` | All, PC, NPC |
| Clan | `character.clan` | Distinct clans from data |
| Status | `character.status` | Active, Ally, Enemy, Unknown, Dead, Missing, Inactive |
| Coterie | `character.coterie` + coterie_members | Distinct coterie names |
| Sire | `character.sire` | Distinct sire names |
| Faction | `character_factions` join | Distinct faction names |
| Story | `plot_characters` join | Distinct story titles |

Filters combine with AND logic. A "Clear filters" button resets all.

### Group-by selector

Options: None, Clan, Status, Type, Coterie, Sire, Generation.

When active, characters render in collapsible sections with a header showing the group name and count. Cards within each group follow the current sort order.

### Sort-by selector

Options: Name (A-Z), Name (Z-A), Clan, Status, Recently Updated, Generation.

### Technical approach

**Single file change**: `src/pages/Characters.tsx`

1. Add state variables: `filterClan`, `filterStatus`, `filterCoterie`, `filterFaction`, `filterStory`, `groupBy`, `sortBy`.
2. Import linked data hooks (`useFactions`, `usePlotCharacters`, `useCoteries`) to populate the Faction and Story filter options and to match characters against them.
3. Replace the `<Tabs>` component with the toolbar row of `<Select>` dropdowns.
4. Extend the `filteredCharacters` logic to apply all active filters.
5. Add a `groupedCharacters` computation that buckets the filtered list by the selected `groupBy` field, then sorts within each group by `sortBy`.
6. Render grouped output as collapsible `<Collapsible>` sections when grouping is active, or a flat sorted grid when grouping is "None".
7. Persist toolbar state to `localStorage` so selections survive page navigation.

No database changes or new hooks required — all data is already available client-side.

