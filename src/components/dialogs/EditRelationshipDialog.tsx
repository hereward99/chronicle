import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MentionInput } from "@/components/mentions/MentionInput";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import { Relationship } from "@/hooks/useRelationships";
import { Character } from "@/hooks/useCharacters";
interface EditRelationshipDialogProps {
  relationship: Relationship | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  characters: Character[];
  onUpdate: (id: string, updates: Partial<Relationship>) => Promise<any>;
  onDelete: (id: string) => Promise<void>;
}

const relationshipTypes = ['Ally', 'Rival', 'Contact', 'Friend', 'Enemy'];

export function EditRelationshipDialog({ 
  relationship, 
  open, 
  onOpenChange, 
  characters,
  onUpdate,
  onDelete 
}: EditRelationshipDialogProps) {
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    character_id: "",
    related_character_id: "",
    relationship_type: "Contact",
    intensity: 3,
    description: "",
    is_mutual: false,
    notes: "",
  });

  useEffect(() => {
    if (relationship) {
      setFormData({
        character_id: relationship.character_id,
        related_character_id: relationship.related_character_id,
        relationship_type: relationship.relationship_type,
        intensity: relationship.intensity,
        description: relationship.description || "",
        is_mutual: relationship.is_mutual,
        notes: relationship.notes || "",
      });
    }
  }, [relationship]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!relationship) return;
    
    setLoading(true);
    try {
      await onUpdate(relationship.id, {
        character_id: formData.character_id,
        related_character_id: formData.related_character_id,
        relationship_type: formData.relationship_type,
        intensity: formData.intensity,
        description: formData.description || null,
        is_mutual: formData.is_mutual,
        notes: formData.notes || null,
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating relationship:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!relationship || !window.confirm('Are you sure you want to delete this relationship? This action cannot be undone.')) return;
    
    setDeleteLoading(true);
    try {
      await onDelete(relationship.id);
      onOpenChange(false);
    } catch (error) {
      console.error('Error deleting relationship:', error);
    } finally {
      setDeleteLoading(false);
    }
  };

  if (!relationship) return null;

  const getCharacterName = (id: string) => {
    return characters.find(c => c.id === id)?.name || 'Unknown';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Relationship</DialogTitle>
          <DialogDescription>
            {getCharacterName(formData.character_id)} → {getCharacterName(formData.related_character_id)}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="character_id">From Character *</Label>
            <Select 
              value={formData.character_id} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, character_id: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {characters.map((char) => (
                  <SelectItem key={char.id} value={char.id}>
                    {char.name} ({char.clan})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="related_character_id">To Character *</Label>
            <Select 
              value={formData.related_character_id} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, related_character_id: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {characters.map((char) => (
                  <SelectItem key={char.id} value={char.id}>
                    {char.name} ({char.clan})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="relationship_type">Relationship Type *</Label>
            <Select 
              value={formData.relationship_type} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, relationship_type: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {relationshipTypes.map((type) => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Intensity: {formData.intensity} / 5</Label>
            <Slider
              value={[formData.intensity]}
              onValueChange={([value]) => setFormData(prev => ({ ...prev, intensity: value }))}
              min={1}
              max={5}
              step={1}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_mutual"
              checked={formData.is_mutual}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_mutual: checked }))}
            />
            <Label htmlFor="is_mutual">Mutual Relationship</Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <MentionInput
              id="description"
              value={formData.description}
              onChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
              placeholder="Describe the relationship... Use @ to mention entities"
              className="min-h-20 resize-none"
              maxLength={2000}
            />
            <p className="text-xs text-muted-foreground">Type @ to mention characters, stories, sessions, etc.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <MentionInput
              id="notes"
              value={formData.notes}
              onChange={(value) => setFormData(prev => ({ ...prev, notes: value }))}
              placeholder="Additional notes... Use @ to mention entities"
              className="min-h-16 resize-none"
              maxLength={2000}
            />
          </div>

          <div className="flex justify-between pt-4">
            <Button 
              type="button" 
              variant="destructive" 
              onClick={handleDelete}
              disabled={deleteLoading || loading}
            >
              {deleteLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete"}
            </Button>
            <div className="flex space-x-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
