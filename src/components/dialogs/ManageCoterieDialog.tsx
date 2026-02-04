import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MentionInput } from "@/components/mentions/MentionInput";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCoteries, Coterie } from "@/hooks/useCoteries";
import { useCharacters } from "@/hooks/useCharacters";
import { Users, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface ManageCoterieDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  coterie: Coterie | null;
}

export function ManageCoterieDialog({ open, onOpenChange, coterie }: ManageCoterieDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [domain, setDomain] = useState("");
  const [memberIds, setMemberIds] = useState<Set<string>>(new Set());
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  
  const { updateCoterie, deleteCoterie, addMember, removeMember, getCoterieMembers } = useCoteries();
  const { characters } = useCharacters();

  useEffect(() => {
    if (coterie) {
      setName(coterie.name);
      setDescription(coterie.description || "");
      setDomain(coterie.domain || "");
      
      getCoterieMembers(coterie.id).then(ids => {
        setMemberIds(new Set(ids));
      });
    }
  }, [coterie]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!coterie || !name.trim()) return;

    try {
      await updateCoterie(coterie.id, {
        name: name.trim(),
        description: description.trim() || null,
        domain: domain.trim() || null,
      });

      const currentMembers = await getCoterieMembers(coterie.id);
      const currentSet = new Set(currentMembers);
      
      for (const charId of memberIds) {
        if (!currentSet.has(charId)) {
          await addMember(coterie.id, charId);
        }
      }
      
      for (const charId of currentSet) {
        if (!memberIds.has(charId)) {
          await removeMember(coterie.id, charId);
        }
      }
      
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating coterie:", error);
    }
  };

  const handleDelete = async () => {
    if (!coterie) return;
    
    try {
      await deleteCoterie(coterie.id);
      setShowDeleteAlert(false);
      onOpenChange(false);
    } catch (error) {
      console.error("Error deleting coterie:", error);
    }
  };

  const toggleMember = (characterId: string) => {
    setMemberIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(characterId)) {
        newSet.delete(characterId);
      } else {
        newSet.add(characterId);
      }
      return newSet;
    });
  };

  if (!coterie) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Manage Coterie</DialogTitle>
            <DialogDescription>
              Update coterie details and manage members.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-4 overflow-hidden">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Name *</Label>
                <Input
                  id="edit-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <MentionInput
                  id="edit-description"
                  value={description}
                  onChange={setDescription}
                  placeholder="Describe the coterie... Use @ to mention entities"
                  className="min-h-20 resize-none"
                  maxLength={3000}
                />
                <p className="text-xs text-muted-foreground">Type @ to mention characters, stories, sessions, etc.</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-domain">Domain</Label>
                <Input
                  id="edit-domain"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Members
              </Label>
              <ScrollArea className="h-[200px] border rounded-md">
                <div className="p-4 space-y-3">
                  {characters.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No characters available</p>
                  ) : (
                    characters.map((character) => (
                      <div key={character.id} className="flex items-center gap-2">
                        <Checkbox
                          id={`char-${character.id}`}
                          checked={memberIds.has(character.id)}
                          onCheckedChange={() => toggleMember(character.id)}
                        />
                        <Label
                          htmlFor={`char-${character.id}`}
                          className="flex-1 cursor-pointer"
                        >
                          {character.name} ({character.clan})
                        </Label>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>

            <div className="flex justify-between">
              <Button
                type="button"
                variant="destructive"
                onClick={() => setShowDeleteAlert(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Coterie
              </Button>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit">Save Changes</Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Coterie</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{coterie.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
