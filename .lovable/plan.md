

## Restyling Kindred Chronicle Scribe to Match "The Sanctum"

### Style Comparison

The Sanctum uses a warmer, more atmospheric gothic palette compared to the current app's cooler blue-gray tones. Key differences:

| Aspect | Current App | The Sanctum |
|--------|------------|-------------|
| Background | Cool blue-gray (`220 13% 8%`) | Warm black-purple (`#0a0608`) with blood-red radial glows and noise texture |
| Cards | Blue-gray (`220 13% 12%`) | Warm purple-black (`#1a1015`) with warm border (`#3a2830`) |
| Text | Pure white/gray | Ivory/parchment (`#f0e6d3`) with dim ivory (`#c8b99a`) |
| Accent color | Crimson only | Gold (`#c9a84c`) for labels/headings, blood-red for actions |
| Headings font | Cinzel | Cinzel Decorative (display) + Cinzel (labels) |
| Body font | Inter | IM Fell English (serif) |
| Border radius | 0.75rem (rounded) | 2-4px (nearly square) |
| Borders | Cool gray | Warm mauve (`#3a2830`) |
| Badges | Rounded pills | Cinzel uppercase, pill-shaped, gold/green/neutral variants |
| Buttons | Flat with hover opacity | Blood gradient with glow shadow on hover |
| Section titles | Standard weight | Cinzel, tiny uppercase, letterspaced, with trailing gradient line |

### What I Would Change

**1. CSS Variables (src/index.css)**
Remap all root variables to Sanctum's warm palette in HSL:
- `--background` → warm near-black (`350 20% 3%`)
- `--card` → warm panel (`330 18% 8%`)
- `--border` → warm mauve (`340 16% 19%`)
- `--foreground` → ivory (`36 44% 90%`)
- `--muted-foreground` → dim ivory/mauve (`330 8% 45%`)
- Add `--gold: 43 50% 54%` as a new accent for headings/labels
- `--primary` stays blood-red but shifts warmer to match `#8b0000` / `#c0392b`
- `--radius` → `0.25rem` (nearly square corners throughout)
- Add background texture (radial blood glows + SVG noise) to body

**2. Fonts (index.html + tailwind.config.ts)**
- Import Cinzel Decorative, Cinzel, IM Fell English, and Cormorant Garamond from Google Fonts
- Change `--font-gothic` to `'Cinzel Decorative', serif` for main titles
- Change `--font-body` to `'IM Fell English', Georgia, serif`
- Add a `--font-label` for `'Cinzel', serif` used on card titles, badges, buttons
- Apply body font globally

**3. Tailwind Config (tailwind.config.ts)**
- Add `gold` color token
- Reduce `--radius` to `0.25rem`
- Add `font-label` family
- Update gradient/shadow utilities to match Sanctum's warm glows

**4. Component-Level Tweaks**
- **Buttons**: Primary gets blood gradient + glow shadow; secondary gets warm panel bg with gold hover
- **Card titles/section headers**: Cinzel, tiny uppercase, wide letter-spacing, with trailing gradient divider line (CSS `::after`)
- **Badges**: Cinzel font, smaller text, gold/green/neutral color variants
- **Navigation**: Gold accent for active states instead of crimson
- **Body background**: Add radial gradient overlays and noise texture SVG

**5. No structural changes** — all changes are purely in the design tokens, fonts, and a handful of utility classes. The component architecture and Tailwind approach remain the same.

### Files Modified

| File | Change |
|------|--------|
| `index.html` | Add Google Fonts link for Cinzel Decorative, IM Fell English, Cormorant Garamond |
| `src/index.css` | Remap all CSS variables to Sanctum palette; add body texture; add card-title utility class |
| `tailwind.config.ts` | Add gold color, font-label family, reduce radius, update shadows/gradients |
| Various components | Minimal — swap a few hardcoded color classes to use new gold accent where appropriate (nav active states, section headers) |

