# Bring-your-own Google API key for AI generation

Yes — and the cleanest version works for every user of the app, not just you.

## How it works

Today the generator has two providers, chosen in Settings:

- **Lovable AI** (default) — an edge function calls the shared gateway; billed to the app's credits.
- **Ollama** — a local model, configured per user in browser storage.

We add a third: **Google AI (your own key)**. Each user pastes their own Gemini API key into Settings. The key is stored only in that user's browser (same place the Ollama URL/model already live), never in the database and never on the server. Generation calls go straight from the browser to Google's API using that key, so each person pays for their own usage on their own Google account.

## What the user sees

- Settings > AI Generation gets a provider selector: Lovable AI / Google AI (own key) / Ollama.
- Choosing Google AI reveals an API key field (masked, with show/hide), a model selector (Gemini Flash by default), a short "get a key at aistudio.google.com" hint, and a "Test key" button.
- A clear note: the key is stored in this browser only; clearing site data removes it.
- All existing generation surfaces respect the choice — Generator page, Generate NPC dialog, Bulk NPC wizard.

## Security notes worth knowing

- A key held in the browser is visible to anyone with access to that browser profile; it is not shared with other users of the app.
- Google keys can be restricted and rate-limited in Google AI Studio; the Settings hint will recommend that.
- Character portrait generation stays on Lovable AI for now (image generation has a different request shape); can be extended later if you want.

## Technical outline

- Extend `src/hooks/useGeneratorSettings.tsx`: replace the `useLocalLLM` boolean with a `provider: 'lovable' | 'google' | 'ollama'` field (migrating existing stored values), plus `googleApiKey` and `googleModel`.
- New `src/lib/gemini.ts` mirroring `src/lib/ollama.ts`: shares the system prompts from `ollama.ts`, POSTs to the Gemini `generateContent` endpoint with `responseMimeType: application/json`, cleans and parses the JSON, returns the same `{ content, parsed, contentType }` shape.
- Update the three call sites (`src/pages/Generator.tsx`, `src/components/dialogs/GenerateNPCDialog.tsx`, `src/components/dialogs/BulkNPCDialog.tsx`) to branch on `provider` instead of the boolean.
- Update the AI Generation card in `src/pages/Settings.tsx` with the provider radio/select, key field, model field, and test action.
- Surface friendly errors for 400 (bad key), 429 (quota), and network failures.
- No database, edge function, or Supabase secret changes.
