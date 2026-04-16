
The remaining issue likely sits inside the shared `MentionText` component, not the coterie card container. The tile wrappers are already mostly left-aligned, but mention segments still render as default `<button>` elements. Default button layout can center wrapped text and shrink the clickable area to content width, which matches the “Anarchs in Vancouver” behavior.

1. Fix the root cause in `src/components/mentions/MentionText.tsx`
   - Keep mention navigation working.
   - Reset mention buttons to behave like inline text links instead of default buttons: no button chrome, no centered text, normal wrapping, baseline alignment, and left-aligned content.
   - Make sure mixed plain text + @mentions wrap as one continuous text block.

2. Tighten the coterie tile markup in `src/pages/Relationships.tsx`
   - Keep full-width `min-w-0` wrappers on title, description, and map-pin rows.
   - Ensure description/domain blocks are explicitly `w-full text-left`.
   - Make the map-pin row a single interactive link target so the icon is active too, not just the linked text.

3. Re-check shared usage after the component-level fix
   - Verify the exact failing “Anarchs in Vancouver” tile.
   - Spot-check another mention-heavy view using `MentionText` so the global fix doesn’t regress line clamping or wrapping elsewhere.

Technical details
- Likely files: `src/components/mentions/MentionText.tsx`, `src/pages/Relationships.tsx`
- Why the previous attempts missed it: they mostly changed card containers, but the inner mention element still had browser-default button behavior that can cause centered wrapped text and non-full-width lines.
