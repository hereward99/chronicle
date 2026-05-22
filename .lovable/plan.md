# Issue 1: Unified Entity Card Pattern

## The problem

List/grid cards across the app look related but drift in small, visible ways. Sample:

| Card | Surface | Hover | Status badge source |
|---|---|---|---|
| CharacterCard | `bg-gradient-subtle shadow-gothic` | `shadow-deep` | hardcoded Tailwind (`bg-emerald-600`, `bg-red-600`…) |
| CoterieCard | plain `bg-card` | `shadow-lg` | n/a |
| Session card (in Sessions.tsx) | `bg-card shadow-gothic` | `shadow-crimson` | inline |
| Story card (in Stories.tsx) | `bg-card shadow-gothic` | `shadow-crimson` | inline |
| Chronicle dashboard cards | `bg-gradient-subtle shadow-gothic` | none | n/a |
| Note card (in Chronicle.tsx) | plain `border-border` | none | n/a |
| LocationCard | custom | custom | inline |

Three different surface styles, three different hover shadows, and status-color logic duplicated with slightly different palettes in 4+ places.

## Goal

One shared shell + one shared status-badge helper so every list/grid card on the app reads as part of the same family. No behavioral changes, no layout rewrites of card *contents* — just the wrapper, hover state, and status colors.

## Scope (this step only)

In scope:
- New `src/components/ui/entity-card.tsx` — thin wrapper over shadcn `Card` with two variants (`list` for grid items, `panel` for dashboard sections) and a `highlighted` prop for the primary/ring state.
- New `src/lib/statusColors.ts` — single source for `character.status`, `plot.status`, `session.status` → semantic Tailwind classes (using existing tokens; no new HSL).
- Migrate the obvious offenders to use both:
  - `CharacterCard`, `CoterieCard`, `LocationCard` (Locations.tsx inline), session card (Sessions.tsx `renderSessionCard`), story card (Stories.tsx `renderStoryCard`), note card (Chronicle.tsx).
- Chronicle dashboard section cards → `EntityCard variant="panel"` so the gradient + shadow is defined in one place.

Out of scope (later issues will handle these):
- Restructuring card *contents* or actions placement.
- Touching dialogs, forms, or PDF export.
- Replacing hardcoded mention colors (that's issue #4).
- Detail-page redesigns.

## Technical details

**`EntityCard` API**

```tsx
type Variant = "list" | "panel";
interface EntityCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: Variant;        // default "list"
  highlighted?: boolean;    // ring-2 ring-primary (e.g. primary coterie)
  interactive?: boolean;    // adds hover shadow + cursor (default true for list)
  entityId?: string;        // sets data-entity-id for search highlight
}
```

Resolved classes:
- `list`: `bg-card border-border shadow-gothic` + (interactive ? `hover:shadow-crimson transition-shadow` : "")
- `panel`: `bg-gradient-subtle border-border shadow-gothic`
- `highlighted`: append `ring-2 ring-primary`

Re-exports `CardHeader/Content/Footer/Title/Description` unchanged so call sites only change the outer element name.

**`statusColors.ts`**

```ts
export type EntityStatusKind = "character" | "plot" | "session";
export function statusBadgeClass(kind, status): string
```

Returns classes built from semantic tokens where possible (`bg-primary`, `bg-muted`, `bg-destructive`, `text-*-foreground`) and falls back to a small fixed palette for distinct states (Ally=blue, Rival=amber). All HSL values added to `index.css` as `--status-*` tokens if not already present — no raw Tailwind color literals in components.

**Migrations** are mechanical: replace `<Card className="bg-gradient-subtle …">` with `<EntityCard variant="panel">`, replace inline status switch with `statusBadgeClass(...)`.

## Files

New:
- `src/components/ui/entity-card.tsx`
- `src/lib/statusColors.ts`

Edited:
- `src/components/characters/CharacterCard.tsx`
- `src/components/characters/CoterieCard.tsx`
- `src/pages/Locations.tsx` (the inline `LocationCard`)
- `src/pages/Sessions.tsx` (the `renderSessionCard` shell only)
- `src/pages/Stories.tsx` (the `renderStoryCard` shell only)
- `src/pages/Chronicle.tsx` (dashboard section cards + the inline note card)
- `src/index.css` (only if new status tokens are needed)

## Verification

- Build passes.
- Visually re-check Characters grid, Coteries grid, Stories list, Sessions list, Locations grid, Chronicle dashboard, and note list — all cards should share the same border, surface gradient, and hover shadow.
- Primary coterie still shows its ring.
- Character status badges still render with appropriate colors for Active / Ally / Enemy / Dead / Missing / Inactive / Unknown.

## After this step

I'll stop and confirm with you before moving on to issue #2 (standardized dialog sizes & layout).
