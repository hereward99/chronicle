
## Plan: Fix password login + add hybrid auth & recovery

### Diagnosis update
You clarified: the Sign In button does nothing — no spinner, no error, no network call. That changes the diagnosis. It's not a service-worker hang; it's that `handleLogin` is silently exiting before reaching `signInWithPassword`. Most likely cause: the Zod schema in `Auth.tsx` rejects the input but the `catch` only toasts on `ZodError` — and a stray whitespace, a non-`ZodError` throw, or a state issue causes a silent no-op. We'll fix this by:
- Trimming inputs before validation
- Adding explicit error logging and a fallback toast for any non-Zod error
- Keeping the existing Supabase call path intact

This means **no `vite.config.ts` change is needed**. PWA service worker stays as-is. You keep magic-link login on Lovable.

### What gets built (single file: `src/pages/Auth.tsx`)

**1. Hybrid Sign In tab**
- Primary button: **Sign In** (existing `signInWithPassword`, with the fixes above)
- Secondary link-style button below it: **Send magic link instead** → `signInWithOtp({ email, options: { emailRedirectTo: getRedirectUrl() } })`
- Small **Forgot password?** link next to the password label → `resetPasswordForEmail(email, { redirectTo: getRedirectUrl() })`

**2. Smart redirect helper**
```ts
const getRedirectUrl = () => `${window.location.origin}${window.location.pathname}`;
```
Returns user to whichever host they started from — Lovable preview, GitHub Pages subpath, or future custom domain. No hardcoded URLs, no env vars needed.

**3. Password recovery in-place**
- Subscribe to `supabase.auth.onAuthStateChange`; when event is `PASSWORD_RECOVERY`, swap the Tabs UI for a "Set a new password" form (two password inputs + submit → `supabase.auth.updateUser({ password })`).
- Existing "redirect if logged in" check skips when in recovery mode.
- After successful update: toast + navigate to `/`.

**4. Robustness fixes for the silent-fail bug**
- `email.trim()` and `password` passed through validation
- `try/catch` always toasts on unknown errors (not just ZodError)
- `console.error` traces around the sign-in call so the next attempt produces actionable logs if anything else is wrong

### What stays untouched
- `vite.config.ts` (PWA + service worker)
- `App.tsx` routing, no new routes, no `basename` change
- `useAuth.tsx`, `ProtectedRoute.tsx`
- `src/integrations/supabase/client.ts`

### GitHub Pages compatibility
- Magic link & password reset emails will redirect to `window.location.origin + pathname`, so a GitHub Pages deployment at `https://you.github.io/chronicle-keeper/auth` returns users to that exact URL.
- Each hosted instance has its own Supabase auth session (separate origin = separate localStorage), so testers on GitHub Pages get a "clean" environment isolated from your Lovable session.
- **One config step you'll do in Supabase dashboard** (not code): add your GitHub Pages URL to **Authentication → URL Configuration → Redirect URLs**. I'll remind you with a link after the change.

### Verification checklist (after switch to default mode)
1. Sign In with email + password — works or shows a clear error toast (no more silent no-op)
2. Click **Send magic link instead** — email arrives, link returns you to the same host logged in
3. Click **Forgot password?** — email arrives, link opens the auth page in recovery mode showing "Set new password", submission logs you in
4. From a GitHub Pages deployment, repeat 2 and 3 — emails return to the GitHub Pages URL, not Lovable

### Files touched
- `src/pages/Auth.tsx` (modify only)
