import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, X, Users } from "lucide-react";
import type { Character } from "@/hooks/useCharacters";
import { undoableAction } from "@/lib/undoableAction";

export interface GroupMember {
  characterId: string;
  role?: string | null;
}

interface GroupMembersPanelProps {
  /** All characters available to pick from (typically scoped to chronicle). */
  characters: Character[];
  /** Currently assigned members. */
  members: GroupMember[];
  /** Add a character to the group. */
  onAdd: (characterId: string, role?: string) => Promise<void> | void;
  /** Remove a character from the group. */
  onRemove: (characterId: string) => Promise<void> | void;
  /** Show optional "role" input next to the picker (default false). */
  showRole?: boolean;
  /** Label above the picker. */
  addLabel?: string;
  /** Label above the members list. */
  membersLabel?: string;
  /** Empty-state copy. */
  emptyCopy?: string;
  /** Height of the members list. */
  listHeight?: string;
  /** Disable interactions while parent is busy. */
  disabled?: boolean;
}

/**
 * Standardized panel for managing a group's character membership.
 * Used by Coteries, Factions, Stories, and Sessions for a consistent UX.
 */
export function GroupMembersPanel({
  characters,
  members,
  onAdd,
  onRemove,
  showRole = false,
  addLabel = "Add Character",
  membersLabel,
  emptyCopy = "No members yet",
  listHeight = "h-[240px]",
  disabled = false,
}: GroupMembersPanelProps) {
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>("");
  const [role, setRole] = useState("");
  const [busy, setBusy] = useState(false);

  const memberMap = useMemo(() => {
    const map = new Map<string, string | null | undefined>();
    members.forEach(m => map.set(m.characterId, m.role));
    return map;
  }, [members]);

  const enrichedMembers = useMemo(() => {
    return members
      .map(m => {
        const character = characters.find(c => c.id === m.characterId);
        return character ? { character, role: m.role } : null;
      })
      .filter(Boolean) as { character: Character; role: string | null | undefined }[];
  }, [members, characters]);

  const availableCharacters = useMemo(
    () => characters.filter(c => !memberMap.has(c.id)),
    [characters, memberMap],
  );

  const handleAdd = async () => {
    if (!selectedCharacterId) return;
    setBusy(true);
    try {
      await onAdd(selectedCharacterId, showRole ? role.trim() || undefined : undefined);
      setSelectedCharacterId("");
      setRole("");
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = (characterId: string) => {
    const member = characters.find(c => c.id === characterId);
    const name = member?.name ?? "Member";
    undoableAction({
      description: `Removed ${name}`,
      perform: () => onRemove(characterId),
    });
  };


  const isDisabled = disabled || busy;

  return (
    <div className="space-y-3">
      <div className="space-y-2 rounded-md border border-border bg-muted/30 p-3">
        <Label className="text-xs uppercase tracking-wider text-muted-foreground">
          {addLabel}
        </Label>
        <div className="flex gap-2">
          <Select
            value={selectedCharacterId}
            onValueChange={setSelectedCharacterId}
            disabled={isDisabled || availableCharacters.length === 0}
          >
            <SelectTrigger className="flex-1 bg-input border-border">
              <SelectValue
                placeholder={
                  availableCharacters.length === 0
                    ? "All characters added"
                    : "Select a character..."
                }
              />
            </SelectTrigger>
            <SelectContent>
              {availableCharacters.map(char => (
                <SelectItem key={char.id} value={char.id}>
                  {char.name} ({char.clan})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {showRole && (
            <Input
              placeholder="Role (optional)"
              value={role}
              onChange={e => setRole(e.target.value)}
              className="w-40 bg-input border-border"
              disabled={isDisabled}
            />
          )}
          <Button
            type="button"
            onClick={handleAdd}
            disabled={isDisabled || !selectedCharacterId}
            size="icon"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {membersLabel && (
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            {membersLabel} ({enrichedMembers.length})
          </Label>
        )}
        <ScrollArea className={`${listHeight} rounded-md border border-border`}>
          {enrichedMembers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Users className="mb-2 h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{emptyCopy}</p>
            </div>
          ) : (
            <div className="space-y-2 p-3">
              {enrichedMembers.map(({ character, role }) => (
                <div
                  key={character.id}
                  className="flex items-center justify-between rounded-md border border-border bg-card p-2 hover:bg-accent/40 transition-colors"
                >
                  <div className="flex flex-1 flex-wrap items-center gap-2">
                    <span className="text-sm font-medium">{character.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      {character.clan}
                    </Badge>
                    {showRole && role && (
                      <Badge variant="outline" className="text-xs">
                        {role}
                      </Badge>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemove(character.id)}
                    disabled={isDisabled}
                    className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}
