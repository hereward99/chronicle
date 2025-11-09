import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Faction, CharacterFaction } from '@/hooks/useFactions';
import { Character } from '@/hooks/useCharacters';
import { Plus, X, Users } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>('');
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(false);

  const factionMembers = useMemo(() => {
    if (!faction) return [];
    return characterFactions
      .filter(cf => cf.faction_id === faction.id)
      .map(cf => {
        const character = characters.find(c => c.id === cf.character_id);
        return character ? { ...character, factionRole: cf.role } : null;
      })
      .filter(Boolean) as (Character & { factionRole: string | null })[];
  }, [faction, characterFactions, characters]);

  const availableCharacters = useMemo(() => {
    if (!faction) return [];
    const memberIds = new Set(factionMembers.map(m => m.id));
    return characters.filter(c => !memberIds.has(c.id));
  }, [faction, characters, factionMembers]);

  const handleAddCharacter = async () => {
    if (!faction || !selectedCharacterId) return;

    setLoading(true);
    try {
      await onAddCharacter(selectedCharacterId, faction.id, role || undefined);
      setSelectedCharacterId('');
      setRole('');
    } catch (error) {
      // Error handled by hook
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveCharacter = async (characterId: string) => {
    if (!faction) return;

    try {
      await onRemoveCharacter(characterId, faction.id);
    } catch (error) {
      // Error handled by hook
    }
  };

  if (!faction) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Manage {faction.name} Members
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Add Member Section */}
          <div className="space-y-3 p-4 border rounded-lg bg-muted/50">
            <Label>Add Character to Faction</Label>
            <div className="flex gap-2">
              <Select value={selectedCharacterId} onValueChange={setSelectedCharacterId}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select a character" />
                </SelectTrigger>
                <SelectContent>
                  {availableCharacters.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                      All characters are already members
                    </div>
                  ) : (
                    availableCharacters.map(char => (
                      <SelectItem key={char.id} value={char.id}>
                        {char.name} ({char.clan})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <Input
                placeholder="Role (optional)"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-40"
              />
              <Button
                onClick={handleAddCharacter}
                disabled={!selectedCharacterId || loading}
                size="icon"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Current Members Section */}
          <div className="space-y-3">
            <Label>Current Members ({factionMembers.length})</Label>
            <ScrollArea className="h-[300px] border rounded-lg">
              {factionMembers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Users className="w-12 h-12 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No characters in this faction yet
                  </p>
                </div>
              ) : (
                <div className="p-4 space-y-2">
                  {factionMembers.map(member => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 border rounded-lg bg-card hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div>
                          <p className="font-medium">{member.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs">
                              {member.clan}
                            </Badge>
                            {member.factionRole && (
                              <Badge variant="outline" className="text-xs">
                                {member.factionRole}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveCharacter(member.id)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          <div className="flex justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
