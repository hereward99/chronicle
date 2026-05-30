import { useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Faction, CharacterFaction } from '@/hooks/useFactions';
import { Character } from '@/hooks/useCharacters';
import { Users } from 'lucide-react';
import { GroupMembersPanel, type GroupMember } from '@/components/groups/GroupMembersPanel';

interface ManageFactionMembersDialogProps {
  faction: Faction | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  characters: Character[];
  characterFactions: CharacterFaction[];
  onAddCharacter: (characterId: string, factionId: string, role?: string) => Promise<any>;
  onRemoveCharacter: (characterId: string, factionId: string) => Promise<void>;
}

export function ManageFactionMembersDialog({
  faction,
  open,
  onOpenChange,
  characters,
  characterFactions,
  onAddCharacter,
  onRemoveCharacter,
}: ManageFactionMembersDialogProps) {
  const members = useMemo<GroupMember[]>(() => {
    if (!faction) return [];
    return characterFactions
      .filter(cf => cf.faction_id === faction.id)
      .map(cf => ({ characterId: cf.character_id, role: cf.role }));
  }, [faction, characterFactions]);

  if (!faction) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Manage {faction.name} Members
          </DialogTitle>
          <DialogDescription>
            Add or remove characters from this faction. Roles are optional.
          </DialogDescription>
        </DialogHeader>

        <GroupMembersPanel
          characters={characters}
          members={members}
          showRole
          membersLabel="Current Members"
          emptyCopy="No characters in this faction yet"
          listHeight="h-[300px]"
          onAdd={async (characterId, role) => {
            await onAddCharacter(characterId, faction.id, role);
          }}
          onRemove={async (characterId) => {
            await onRemoveCharacter(characterId, faction.id);
          }}
        />

        <div className="flex justify-end pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
