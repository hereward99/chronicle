You're right — it's mechanical, not hard. ~150 call sites across ~22 files, and ~95% follow one of two patterns:

```ts
toast({ title: "X", description: "Y" })                          → notify.success("X", "Y")
toast({ title: "X", description: e.message, variant: "destructive" }) → notify.error("X", e.message)
```

## Scope

| Area | Files | Approx call sites |
|---|---|---|
| Data hooks | useSessions, useCoteries, useRelationships, useChronicles, useChecklists, useCharacters, useBoons, usePlots, usePlotCharacters, useNotes, useLocations, useFiles, useFactions, useImport | ~95 |
| Pages | Auth, Import, Generator | ~35 |
| Components | CharacterWizard, PortraitGenerator, EditCharacterDialog, EditSessionDialog, CreateNoteDialog, EditNoteDialog, CreateRelationshipDialog, NPCWizardDialog, file-upload | ~20 |
| **Already done** | App.tsx, useOnlineStatus | — |

## Migration rules

1. **Success** — `toast({ title, description })` → `notify.success(title, description)`
2. **Error** — anything with `variant: "destructive"` that's a failure → `notify.error(title, description)`
3. **Offline** — destructive toasts whose message is "requires an internet connection" / "you're offline" → `notify.offline(actionName)` (very few; mostly Auth's network errors stay as `notify.error`)
4. **Undo opportunities** — out of scope for this pass. We're standardising shapes, not changing behaviour. (I'll flag candidates like "Note deleted" / "Relationship deleted" in a follow-up so we can convert to `notify.undo` deliberately.)
5. Remove the now-unused `import { toast } from "@/hooks/use-toast"` from each migrated file; replace with `import { notify } from "@/lib/notify"`.
6. Leave `src/hooks/use-toast.ts` and `src/components/ui/toaster.tsx` in place — `notify` is built on them.

## Edge cases I'll handle explicitly

- **Auth.tsx** has a long sign-in/sign-up flow with conditional titles. Each branch maps 1:1 to success/error — no logic changes.
- **Generator.tsx** has a "Generation cancelled" info-style toast (no variant). That doesn't fit success/error cleanly — I'll map it to `notify.success("Generation cancelled")` (neutral title, no destructive styling) unless you prefer I add a 5th `notify.info` shape.
- **useChecklists.tsx** line 377 ("No chronicle selected") is a validation guard, not an action failure. Still `notify.error` — same visual, same intent.
- **useFiles.tsx** upload progress toasts (line 50/68/86) — straightforward success/error.

## Verification

After migration:
- `rg "from \"@/hooks/use-toast\"" src` should return only `src/lib/notify.ts` (and `src/components/ui/toaster.tsx`).
- `rg "^\s*toast\(" src` should be empty outside `src/lib/notify.ts` and `src/hooks/use-toast.ts` itself.
- Build passes; smoke-test create/edit/delete on one entity to confirm toasts render.

## One question before I start

Generator's "Generation cancelled" toast — neutral info, not a success or error. Pick one:

- **(a) Map to `notify.success`** — slight semantic stretch but no new API surface. *My recommendation.*
- **(b) Add a 5th `notify.info` shape** — breaks the "4 canonical shapes" goal of taxonomy #10.
- **(c) Leave that one call as raw `toast(...)`** — single exception, defeats the lint-it-out goal.

Tell me which, and I'll do the full sweep in one pass.