# Chronicle Keeper V2 — Layout and Experience Overhaul

A structural redesign built around how tabletop groups actually use a companion app: prep before a session, capture during play, and revisit afterwards. The warm gothic look stays, but evolves into a deeper, more atmospheric shell with a stronger typographic hierarchy. All art, wording and iconography stay original — no rulebook text, logos or published art.

## 1. The problem with the current shape

- Eleven flat sidebar links treat the dice roller and Settings as peers of the Chronicle itself. Nothing signals what matters right now.
- Every page is the same rhythm: title, search box, vertical stack of wide cards. Lists and detail pages feel identical.
- Sessions is the worst case — a long scroll of accordions where writing a record is a form-filling chore and re-reading it is a wall of text.
- There is no "at the table" mode. During play a user wants dice, notes and names, not navigation.

## 2. New navigation model

Replace the flat sidebar with a three-zone shell, which is where contemporary TTRPG companions have landed (Obsidian-style rail plus contextual panel).

```text
+------+---------------------------+--------------------+
| rail |  main content             |  context drawer    |
| 56px |                           |  (optional, 320px) |
|      |  chronicle switcher +     |                    |
| icon |  page header              |  quick dice        |
| nav  |                           |  scratch notes     |
|      |                           |  recent entities   |
+------+---------------------------+--------------------+
```

- **Icon rail (always visible, expands on hover/pin):** grouped into three bands.
  - *Chronicle*: Dashboard, Stories, Sessions, Timeline
  - *World*: Characters, Relationships, Locations, Factions/Coteries
  - *Tools*: Dice, Generator, Import & Export, Settings
- **Chronicle switcher** moves out of Settings into the rail head, so the active chronicle is always visible and swappable.
- **Context drawer** (toggled with `\`` or a rail button): a persistent side panel holding the dice roller, a scratch pad and recently-viewed entities. This is the "at the table" surface — it works on any page without losing your place.
- **Mobile:** keep the bottom nav but reduce to four (Dashboard, Characters, Sessions, More) and add a floating action button whose action is route-aware, reusing the existing `N` shortcut logic. The context drawer becomes a swipe-up sheet.

## 3. Page structure changes

- **Dashboard becomes a "Table" view:** next session card (date, prep checklist progress, participating characters), active stories, open threads, recent activity. Currently it is a stats grid; V2 leads with what to do next.
- **List pages get a consistent two-pane option on wide screens:** filter/list on the left, preview on the right, with the existing detail routes still working for deep links. Cards get a compact density toggle.
- **Detail pages** gain a right-hand meta column (relationships, appearances, linked stories) so the main column is pure prose.

## 4. Sessions — the priority rebuild

Recast Sessions from a records list into a **chronicle journal**.

**Reading**
- Timeline spine layout: sessions run down a vertical thread grouped by story arc, each entry a dated node with a title, a one-line hook, participating character portraits and an XP/consequence stamp.
- Two view modes: *Journal* (rich, image-forward, reads like a story so far) and *Log* (dense table for finding things fast).
- A generated "Previously on…" recap block at the top of the next session's prep, assembled from the last session's highlights.

**Writing (the chore-fix)**
- Replace the single long form with a **Session Recorder**: a focused, distraction-light page with three stacked capture lanes — *Beats* (short timestamped bullets you jot mid-play), *Consequences* (things that changed: boons, deaths, status, locations), and *Loose Ends* (auto-promoted into the next session's prep checklist).
- Beats accept @mentions and are one-keystroke to add, so recording during play is realistic.
- On save, beats compose into the session summary; the existing summary field remains editable for those who prefer prose.
- Attendance is a portrait picker rather than a dropdown list.

**Delight**
- Each session gets an auto-derived "session card" — date, title, attending characters, XP, a standout beat — usable as the PDF cover and as a shareable image.
- Small chronicle stats: sessions played, in-game time elapsed, most-mentioned character.

## 5. Visual evolution

Same palette family, more depth:
- Layered surfaces: three elevation tiers instead of the current single card treatment, using existing tokens plus two new surface tokens.
- Sharper type scale: display Cinzel for page titles only, tighter body measure (max ~68ch) so prose is readable.
- Restrained ornament: hairline rules, corner marks and a subtle vignette on the shell background rather than decorative art.
- Motion: 150–200ms crossfades on route change, drawer slide, and a single accent pulse when a beat is captured.

## 6. Delivery phases

1. **Shell** — rail nav, chronicle switcher, context drawer, mobile bottom nav trim, surface/type token evolution. All existing pages keep working inside the new shell.
2. **Sessions V2** — journal/log views, Session Recorder, session cards, recap block.
3. **Dashboard "Table" view** and list-page two-pane + density toggle.
4. **Detail page meta column** and consistency sweep across remaining pages.

Each phase ends in a reviewable state; nothing is removed until its replacement is live.

## Technical notes

- New `AppShell` composed of `NavRail`, `ContextDrawer` and the existing `Layout` responsibilities; `Navigation.tsx` is retired once the rail reaches parity. Drawer open/pin state persists via the existing `useRestorableState` pattern.
- Session beats need storage: a `session_beats` table (id, session_id, chronicle_id, kind: beat/consequence/loose_end, body, order_index, created_at) with GRANTs, RLS scoped to the owning chronicle, and a `useEntityCrud`-based hook to match existing entity patterns.
- Loose ends promote into the existing `checklists` tables rather than a new mechanism.
- New surface/elevation tokens added to `index.css` and `tailwind.config.ts`; `mem://design/tokens` updated in the same phase.
- Existing routes, detail pages, keyboard shortcuts, offline guards, draft autosave and PDF export all carry over unchanged.

## 7. Delivery as a separate project

Yes — V2 can be built as a new project so this one (V1) stays untouched and available. Two decisions follow:

**Moving the code.** The clean path is: connect this project to GitHub, then create a new Lovable project from that repo (or start the new project and paste in the source tree). The entire frontend ports as-is; the redesign work then happens only in the new project.

**The data is the real decision.** Your chronicles live in this project's Supabase backend, not in the code. Options:
- **Shared database (recommended):** connect the new project to the *same* Supabase backend. V1 and V2 then read and write identical chronicle data — you can open either app against your real games. Schema additions (e.g. `session_beats`) apply to the shared database and remain harmless to V1, which simply never reads them.
- **Fresh database:** the new project gets its own backend. Clean and zero-risk to V1, but V2 starts empty; you would seed it via the existing Import feature or keep it for design evaluation only.

Recommendation: shared database, and ship Phase 1 (shell) first so you can flip between V1 and V2 on real data from day one.
