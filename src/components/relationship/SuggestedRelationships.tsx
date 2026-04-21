import { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, Check, X, ChevronDown, ChevronUp, UsersRound, Flag, GitBranch } from 'lucide-react';
import type { Character } from '@/hooks/useCharacters';
import type { Relationship } from '@/hooks/useRelationships';
import type { CharacterFaction, Faction } from '@/hooks/useFactions';
import type { CoterieMember, Coterie } from '@/hooks/useCoteries';

interface SuggestedRelationshipsProps {
  characters: Character[];
  relationships: Relationship[];
  factions: Faction[];
  characterFactions: CharacterFaction[];
  coteries: Coterie[];
  allCoterieMembers: CoterieMember[];
  chronicleId?: string;
  onAccept: (rel: Omit<Relationship, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<unknown>;
}

type Reason =
  | { kind: 'coterie'; label: string }
  | { kind: 'faction'; label: string; color: string }
  | { kind: 'sire'; label: string };

interface Suggestion {
  key: string; // canonical pair key
  fromId: string;
  toId: string;
  type: 'Ally' | 'Sire';
  isMutual: boolean;
  reasons: Reason[];
}

const DISMISS_KEY = 'relationship-suggestions-dismissed';
const ALLY_TYPE_OPTIONS = ['Ally', 'Friend', 'Rival', 'Enemy', 'Contact'];
const SYMMETRIC_TYPES = new Set(['Ally', 'Friend', 'Enemy', 'Rival']);

function loadDismissed(): Set<string> {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

function saveDismissed(set: Set<string>) {
  try {
    localStorage.setItem(DISMISS_KEY, JSON.stringify(Array.from(set)));
  } catch {
    /* ignore */
  }
}

function pairKey(a: string, b: string) {
  return [a, b].sort().join('|');
}

function normalizeName(s: string | null | undefined) {
  return (s || '').trim().toLowerCase();
}

export function SuggestedRelationships({
  characters,
  relationships,
  factions,
  characterFactions,
  coteries,
  allCoterieMembers,
  chronicleId,
  onAccept,
}: SuggestedRelationshipsProps) {
  const [dismissed, setDismissed] = useState<Set<string>>(() => loadDismissed());
  const [open, setOpen] = useState(true);
  const [acceptingKey, setAcceptingKey] = useState<string | null>(null);
  const [typeOverrides, setTypeOverrides] = useState<Record<string, string>>({});

  // Re-load dismissed when chronicle changes (defensive)
  useEffect(() => {
    setDismissed(loadDismissed());
  }, [chronicleId]);

  const suggestions = useMemo<Suggestion[]>(() => {
    if (characters.length < 2) return [];

    // Existing pairs (any direction) — skip these.
    const existing = new Set(
      relationships.map(r => pairKey(r.character_id, r.related_character_id))
    );

    const charById = new Map(characters.map(c => [c.id, c]));
    const map = new Map<string, Suggestion>();

    const addReason = (
      a: string,
      b: string,
      type: 'Ally' | 'Sire',
      reason: Reason,
      isMutual: boolean
    ) => {
      if (a === b) return;
      if (!charById.has(a) || !charById.has(b)) return;
      const key = pairKey(a, b);
      if (existing.has(key)) return;
      // For Sire suggestions we keep direction (sire -> childe). For Ally we use sorted pair.
      const fromId = type === 'Sire' ? a : (a < b ? a : b);
      const toId = type === 'Sire' ? b : (a < b ? b : a);
      const compositeKey = `${type}:${key}`;
      const existingSug = map.get(compositeKey);
      if (existingSug) {
        // Avoid duplicate reason of identical kind+label
        if (!existingSug.reasons.some(r => r.kind === reason.kind && r.label === reason.label)) {
          existingSug.reasons.push(reason);
        }
      } else {
        map.set(compositeKey, {
          key: compositeKey,
          fromId,
          toId,
          type,
          isMutual,
          reasons: [reason],
        });
      }
    };

    // 1. Shared coteries → Ally (mutual)
    for (const coterie of coteries) {
      const memberIds = allCoterieMembers
        .filter(cm => cm.coterie_id === coterie.id)
        .map(cm => cm.character_id);
      for (let i = 0; i < memberIds.length; i++) {
        for (let j = i + 1; j < memberIds.length; j++) {
          addReason(
            memberIds[i],
            memberIds[j],
            'Ally',
            { kind: 'coterie', label: coterie.name },
            true
          );
        }
      }
    }

    // 2. Shared factions → Ally (mutual)
    for (const faction of factions) {
      const memberIds = characterFactions
        .filter(cf => cf.faction_id === faction.id)
        .map(cf => cf.character_id);
      for (let i = 0; i < memberIds.length; i++) {
        for (let j = i + 1; j < memberIds.length; j++) {
          addReason(
            memberIds[i],
            memberIds[j],
            'Ally',
            { kind: 'faction', label: faction.name, color: faction.color },
            true
          );
        }
      }
    }

    // 3. Sire field → Sire relationship (directional, non-mutual).
    // characters[i].sire (free text) matches another character's name.
    const byName = new Map<string, Character[]>();
    for (const c of characters) {
      const n = normalizeName(c.name);
      if (!n) continue;
      const arr = byName.get(n) || [];
      arr.push(c);
      byName.set(n, arr);
    }
    for (const childe of characters) {
      const sireName = normalizeName(childe.sire);
      if (!sireName) continue;
      const matches = byName.get(sireName) || [];
      for (const sire of matches) {
        if (sire.id === childe.id) continue;
        addReason(
          sire.id,
          childe.id,
          'Sire',
          { kind: 'sire', label: `${sire.name} → ${childe.name}` },
          false
        );
      }
    }

    // Filter dismissed and sort: most reasons first, then alphabetical
    const list = Array.from(map.values())
      .filter(s => !dismissed.has(s.key))
      .sort((a, b) => {
        if (b.reasons.length !== a.reasons.length) return b.reasons.length - a.reasons.length;
        const an = charById.get(a.fromId)?.name || '';
        const bn = charById.get(b.fromId)?.name || '';
        return an.localeCompare(bn);
      });

    return list;
  }, [characters, relationships, factions, characterFactions, coteries, allCoterieMembers, dismissed]);

  if (suggestions.length === 0) return null;

  const charName = (id: string) => characters.find(c => c.id === id)?.name || 'Unknown';

  const handleAccept = async (s: Suggestion) => {
    setAcceptingKey(s.key);
    try {
      // Default intensity: 3 (moderate). Description summarises why it was suggested.
      const reasonText = s.reasons
        .map(r => {
          if (r.kind === 'coterie') return `shared coterie "${r.label}"`;
          if (r.kind === 'faction') return `shared faction "${r.label}"`;
          return `sire link (${r.label})`;
        })
        .join('; ');
      const chosenType = s.type === 'Sire' ? 'Sire' : (typeOverrides[s.key] ?? s.type);
      const isMutual = s.type === 'Sire' ? s.isMutual : SYMMETRIC_TYPES.has(chosenType);
      await onAccept({
        character_id: s.fromId,
        related_character_id: s.toId,
        relationship_type: chosenType,
        intensity: 3,
        description: `Auto-suggested from ${reasonText}.`,
        is_mutual: isMutual,
        notes: null,
      });
      // After accept, mark dismissed so it doesn't reappear briefly before refetch.
      const next = new Set(dismissed);
      next.add(s.key);
      setDismissed(next);
      saveDismissed(next);
    } finally {
      setAcceptingKey(null);
    }
  };

  const handleDismiss = (s: Suggestion) => {
    const next = new Set(dismissed);
    next.add(s.key);
    setDismissed(next);
    saveDismissed(next);
  };

  const handleResetDismissed = () => {
    setDismissed(new Set());
    saveDismissed(new Set());
  };

  const reasonIcon = (kind: Reason['kind']) => {
    if (kind === 'coterie') return <UsersRound className="w-3 h-3" />;
    if (kind === 'faction') return <Flag className="w-3 h-3" />;
    return <GitBranch className="w-3 h-3" />;
  };

  return (
    <Card>
      <Collapsible open={open} onOpenChange={setOpen}>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">Suggested Relationships</CardTitle>
              <Badge variant="secondary">{suggestions.length}</Badge>
            </div>
            <div className="flex items-center gap-1">
              {dismissed.size > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResetDismissed}
                  title="Show previously dismissed suggestions"
                >
                  Reset dismissed
                </Button>
              )}
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="icon">
                  {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </Button>
              </CollapsibleTrigger>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Derived from shared coteries, factions, and sire links. One click to accept or dismiss.
          </p>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="space-y-2">
            {suggestions.map(s => {
              const chosenType = s.type === 'Sire' ? 'Sire' : (typeOverrides[s.key] ?? s.type);
              const chosenMutual = s.type === 'Sire' ? s.isMutual : SYMMETRIC_TYPES.has(chosenType);
              return (
                <div
                  key={s.key}
                  className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-md border border-border bg-muted/20"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium truncate">{charName(s.fromId)}</span>
                      <span className="text-muted-foreground">
                        {s.type === 'Sire' ? 'sired' : '↔'}
                      </span>
                      <span className="font-medium truncate">{charName(s.toId)}</span>
                      <Badge variant="outline" className="text-xs">
                        {chosenType}
                        {chosenMutual ? ' · mutual' : ''}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {s.reasons.map((r, idx) => (
                        <Badge
                          key={`${r.kind}-${r.label}-${idx}`}
                          variant="secondary"
                          className="text-xs gap-1"
                          style={
                            r.kind === 'faction'
                              ? { borderLeft: `3px solid ${(r as { color: string }).color}` }
                              : undefined
                          }
                        >
                          {reasonIcon(r.kind)}
                          {r.kind === 'sire' ? 'Sire link' : r.label}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {s.type !== 'Sire' && (
                      <Select
                        value={chosenType}
                        onValueChange={(value) =>
                          setTypeOverrides(prev => ({ ...prev, [s.key]: value }))
                        }
                        disabled={acceptingKey === s.key}
                      >
                        <SelectTrigger className="h-9 w-[120px]" aria-label="Relationship type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ALLY_TYPE_OPTIONS.map((type) => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    <Button
                      size="sm"
                      onClick={() => handleAccept(s)}
                      disabled={acceptingKey === s.key}
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDismiss(s)}
                      disabled={acceptingKey === s.key}
                    >
                      <X className="w-4 h-4 mr-1" />
                      Dismiss
                    </Button>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
