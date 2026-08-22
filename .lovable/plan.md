# UI Polish Plan — Next Improvements

## Goal
A focused pass on small, visible UI inconsistencies and polish items that are cheap to fix and improve perceived quality across the app.

## Findings & Proposed Changes

### 1. EmptyState — remove emoji, use icon
The tip currently renders `💡` inline. Replace it with a `Lightbulb` icon so every empty state stays on-brand for the gothic aesthetic.
- File: `src/components/onboarding/EmptyState.tsx`
- Change: swap `<span>💡</span>` for `<Lightbulb className="h-3 w-3" />`

### 2. Generator — fix provider badge
The header badge still reads `generatorSettings.useLocalLLM`, which no longer exists after the three-provider refactor. It can show the wrong label (always "Ollama" or crash). Update it to branch on `provider` and show correct icon/label for Lovable AI, Google Gemini, or Ollama.
- File: `src/pages/Generator.tsx` (around line 235)
- Change: replace boolean branch with `provider === 'lovable' | 'google' | 'ollama'`

### 3. Settings — standardize category chips
The Dev Notes category picker uses raw `<button>` elements with hand-rolled colors and focus rings. Convert them to a consistent chip pattern (using `ToggleGroup` or styled `Button` variants) so they match the rest of the design system and behave correctly with keyboard/screen readers.
- File: `src/pages/Settings.tsx` (Dev Notes section)
- Change: replace raw buttons with `ToggleGroup` or small `Button`/`Badge` toggles

### 4. Chronicle dashboard — fix lingering "Plots" label
The stats card still says "Plots" and "active plots". Since the terminology pass renamed user-facing Plot to Story, this card should read "Stories" / "active stories".
- File: `src/pages/Chronicle.tsx` (stats cards)
- Change: label text only

### 5. DetailPageHeader — subtle visual anchor
The breadcrumb + title area is plain. Add a very subtle treatment: a thin gold-left-border accent or a soft gradient background behind the header block, so detail pages feel more "landed" and less like raw text.
- File: `src/components/DetailPageHeader.tsx`
- Change: add `border-l-2 border-primary/40 pl-4` or a `bg-gradient-subtle` wrapper

### 6. Characters toolbar — collapse filters on mobile
At 375 px the filter/group/sort row wraps into a tall stack. Add a "Filters" toggle button on small screens that collapses the toolbar into a compact panel, preserving the current desktop layout.
- File: `src/pages/Characters.tsx`
- Change: wrap toolbar in a `Collapsible` triggered by a button on `sm:` breakpoint

## Suggested Order
1. Fix Generator provider badge (functional bug, one-liner)
2. Fix "Plots" → "Stories" label (terminology consistency)
3. EmptyState icon swap (visual consistency)
4. Settings category chips (component consistency)
5. DetailPageHeader polish (page-level polish)
6. Characters mobile toolbar collapse (responsive UX)

## Out of Scope (for now)
- Larger layout redesigns
- New features or data model changes
- Animation/motion overhauls
