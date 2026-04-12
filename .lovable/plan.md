

## Bulk NPC Generation — with "Create as Coterie" Option

### Updated Plan

Everything from the previously approved plan remains. This revision adds one feature to Step 3 (Review):

### New: "Create as Coterie" toggle

On the Review step, after all NPCs are generated and before the user hits "Accept All", a toggle/checkbox appears:

**"Create as Coterie"** (off by default)

When enabled:
- A text input appears asking for the **Coterie Name** (required)
- An optional **Description** field
- On "Accept All":
  1. All accepted NPCs are saved as characters (existing logic)
  2. A new Coterie is created using `createCoterie()` from `useCoteries`, with the given name, description, and the active chronicle ID
  3. Each saved NPC is added as a member via `addMember(coterieId, characterId)`
  4. The coterie immediately appears on the Characters > Coteries tab

### Implementation detail

**Files to create:**
1. `src/components/dialogs/BulkNPCDialog.tsx` — 3-step wizard with group template, individual guidance, and review/accept flow. Includes the "Create as Coterie" toggle and name input in the review step.

**Files to modify:**
2. `src/pages/Generator.tsx` — Add "Generate Group" button on NPC tab
3. `supabase/functions/generate-content/index.ts` — Add `bulk-npc` prompt variant with group context, clan constraints, and duplicate-name avoidance

**Save flow (Accept All):**
```text
For each NPC:
  1. createCharacter(npcData) → character.id
  
If "Create as Coterie" is checked:
  2. createCoterie({ name, description, chronicle_id }) → coterie.id
  3. For each character.id:
       addMember(coterie.id, character.id)
```

**No database changes needed** — uses existing `coteries` and `coterie_members` tables.

### Wizard flow summary

```text
Step 1: Group Template
  - Theme, count (2-8), creature type, clan filter, generation range, status

Step 2: Individual Guidance (optional)
  - Per-NPC role/concept hints

Step 3: Review & Save
  - Progress bar during generation
  - NPC cards with Accept/Edit/Regenerate/Remove
  - [Toggle] Create as Coterie → Name input, optional Description
  - [Accept All] button saves NPCs + optionally creates coterie
```

### Rate-limit handling
- Sequential API calls with 1-second delay between each
- Max 8 NPCs per batch
- Per-NPC retry on failure; others unaffected

