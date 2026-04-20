
## Revised Plan: Fix Password Login Hang + Add Hybrid Auth

### Direct answer to your question
The original plan (magic links + password recovery) does **not** fix password login. So I'm folding a real fix for the hang into the same pass.

### Diagnosis of the hang
- `Auth.tsx` calls `supabase.auth.signInWithPassword` and awaits the promise. The button stays in `loading` state until the promise resolves or rejects.
- Supabase auth analytics shows **no recent auth requests** for this project — meaning the POST to `/auth/v1/token` either never leaves the browser or never gets a response back.
- This project is a PWA (`vite-plugin-pwa`, mentioned in memory). The most common cause of a "spinner that never resolves" on a PWA + Supabase app is the **service worker intercepting the auth request** — either caching it, returning a stale offline response, or stalling the fetch.
- `useAuth.tsx` and `ProtectedRoute.tsx` are correct (listener set up before `getSession`, no deadlocks), so the bug is in the network layer, not state management.

### Fix strategy (two layers)

**Layer 1 — Unblock the auth network call (the actual bug)**
1. Add a Workbox `navigateFallbackDenylist` / runtime route in `vite.config.ts` PWA config that **explicitly excludes** `https://*.supabase.co/auth/v1/*` and `/rest/v1/*` from any service-worker caching or interception. This is the single most likely fix.
2. Add a client-side **timeout wrapper** around `signInWithPassword` (e.g. `Promise.race` with a 15s timeout). If the call hangs, we surface a clear toast ("Login is taking too long — check your connection or try the magic link") instead of an infinite spinner. This is defensive insurance even after fix #1.
3. Add temporary `console.debug` traces around the sign-in call so the next attempt produces actionable logs in `code--read_console_logs` if the issue persists.

You said don't modify `vite.config.ts` — but **the fix lives there** because the service worker is configured there. I will make the *minimum* possible change: add one Workbox option, no behavioral changes to dev server, base path, plugins order, etc. If you want me to leave `vite.config.ts` untouched, the alternative is to unregister the service worker entirely on `/auth`, which is uglier and breaks offline mode.

**Layer 2 — Hybrid auth & recovery (original plan, unchanged)**
Same as before, applied to `src/pages/Auth.tsx` only:
- Magic-link button calling `signInWithOtp` with `emailRedirectTo: ${origin}${pathname}`
- "Forgot password?" link calling `resetPasswordForEmail` with same redirect pattern
- `onAuthStateChange` listener detects `PASSWORD_RECOVERY` event → swaps the form to a "Set New Password" view (`updateUser({ password })`)
- No new routes, no router changes, no `useAuth` changes

### Files touched
- `src/pages/Auth.tsx` — hybrid UI, recovery form, timeout wrapper, debug logs
- `vite.config.ts` — **one-line addition** to Workbox config to exclude Supabase auth/REST URLs from SW interception (skip if you forbid this; we'll fall back to the SW-unregister approach)

### What you'll need to verify after the change
1. Sign in with email + password — spinner resolves and you land on `/`
2. Click "Send Magic Link" — receive email, click link, land logged in
3. Click "Forgot password?" — receive email, click link, see "Set New Password" form, submit, land logged in
4. Open DevTools → Application → Service Workers, confirm `/auth/v1/*` requests bypass the SW

### Open question
If the hang persists after the SW fix, the next suspect is Supabase email confirmation being required while confirmation emails aren't being delivered — in which case the user *appears* registered but `signInWithPassword` returns `Email not confirmed` (which would actually error fast, not hang, so this is lower probability). I'll know from the new debug logs.
