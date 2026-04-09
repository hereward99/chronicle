

## Item 1: Clan Banes & Compulsions Reference Cards

### What it does
Adds a static V5 reference data file with every clan's Bane and Compulsion text, then displays them as a read-only reference card on the character sheet — automatically keyed to the character's clan.

### Changes

**New file: `src/lib/v5/clanData.ts`**
- A single exported `CLAN_DATA` map keyed by clan name (Brujah, Gangrel, Malkavian, Nosferatu, Toreador, Tremere, Ventrue, Caitiff, Thin-Blood, Lasombra, Tzimisce, Hecata, Ravnos, Salubri, Ministry, Banu Haqim)
- Each entry contains `{ bane: string, compulsion: string }` — short corebook-accurate descriptions
- Human and Ghoul entries return null/empty (no bane or compulsion)

**Modified file: `src/components/character/CharacterSheetView.tsx`**
- Import `CLAN_DATA` from the new file
- Add a "Clan Bane & Compulsion" card in the Stats tab, below the header/above attributes (only shown for vampire clans)
- Two collapsible sections: **Bane** (with a skull/warning icon) and **Compulsion** (with a brain/alert icon)
- Styled consistently with existing reference tooltips — muted background, small text, thematic coloring (destructive tint for bane, orange tint for compulsion)
- Caitiff shows "No inherent Bane" note; Thin-Bloods show their unique rules

### No database changes
All data is static reference content — no new columns or tables needed.

### Technical detail
```text
CLAN_DATA['Brujah'] = {
  bane: "The Fury: Brujah subtract dice equal to their Bane Severity from pools to resist Fury Frenzy...",
  compulsion: "Rebellion: The Brujah must stand against whatever the current status quo is..."
}

CharacterSheetView renders:
  if (CLAN_DATA[character.clan]) → show Bane & Compulsion card
```

