import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Trash2 } from "lucide-react";
import { Character } from "@/hooks/useCharacters";
import { usePlots } from "@/hooks/usePlots";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { FileUpload } from "@/components/ui/file-upload";

interface EditCharacterDialogProps {
  character: Character | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (id: string, updates: Partial<Character>) => Promise<any>;
  onDelete: (id: string) => Promise<void>;
}

const clans = [
  "Brujah", "Gangrel", "Malkavian", "Nosferatu", "Toreador", 
  "Tremere", "Ventrue", "Caitiff", "Thin-Blood"
];

const statuses = ["Active", "Inactive", "Dead", "Missing", "Ally", "Enemy"];

export function EditCharacterDialog({ 
  character, 
  open, 
  onOpenChange, 
  onUpdate, 
  onDelete 
}: EditCharacterDialogProps) {
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const { plots } = usePlots();
  
  const [formData, setFormData] = useState({
    name: "",
    clan: "",
    generation: 13,
    type: "PC" as "PC" | "NPC",
    status: "Active",
    concept: "",
    sire: "",
    coterie: "",
    avatar_url: "",
    connected_stories: [] as string[],
    attachments: [] as any[]
  });

  useEffect(() => {
    if (character) {
      setFormData({
        name: character.name,
        clan: character.clan,
        generation: character.generation,
        type: character.type,
        status: character.status,
        concept: character.concept || "",
        sire: character.sire || "",
        coterie: character.coterie || "",
        avatar_url: character.avatar_url || "",
        connected_stories: [], // We'll implement story connections later
        attachments: (character as any).attachments || []
      });
    }
  }, [character]);

  const handleSubmit = async () => {
    if (!character) return;
    
    setLoading(true);
    try {
      const updates = {
        name: formData.name,
        clan: formData.clan,
        generation: formData.generation,
        type: formData.type,
        status: formData.status,
        concept: formData.concept || null,
        sire: formData.sire || null,
        coterie: formData.coterie || null,
        avatar_url: formData.avatar_url || null,
        attachments: formData.attachments,
      };
      
      await onUpdate(character.id, updates);
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating character:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!character) return;
    
    setDeleteLoading(true);
    try {
      await onDelete(character.id);
      onOpenChange(false);
    } catch (error) {
      console.error('Error deleting character:', error);
    } finally {
      setDeleteLoading(false);
    }
  };

  const addStoryConnection = (plotId: string) => {
    if (!formData.connected_stories.includes(plotId)) {
      setFormData(prev => ({
        ...prev,
        connected_stories: [...prev.connected_stories, plotId]
      }));
    }
  };

  const removeStoryConnection = (plotId: string) => {
    setFormData(prev => ({
      ...prev,
      connected_stories: prev.connected_stories.filter(id => id !== plotId)
    }));
  };

  if (!character) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gradient-subtle border-border max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground">Edit Character</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-foreground">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="bg-input border-border"
              />
            </div>

            <div>
              <Label htmlFor="clan" className="text-foreground">Clan</Label>
              <Select value={formData.clan} onValueChange={(value) => setFormData(prev => ({ ...prev, clan: value }))}>
                <SelectTrigger className="bg-input border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {clans.map((clan) => (
                    <SelectItem key={clan} value={clan}>{clan}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="generation" className="text-foreground">Generation</Label>
              <Input
                id="generation"
                type="number"
                min="1"
                max="16"
                value={formData.generation}
                onChange={(e) => setFormData(prev => ({ ...prev, generation: parseInt(e.target.value) || 13 }))}
                className="bg-input border-border"
              />
            </div>

            <div>
              <Label htmlFor="type" className="text-foreground">Type</Label>
              <Select value={formData.type} onValueChange={(value: "PC" | "NPC") => setFormData(prev => ({ ...prev, type: value }))}>
                <SelectTrigger className="bg-input border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="PC">Player Character</SelectItem>
                  <SelectItem value="NPC">Non-Player Character</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status" className="text-foreground">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                <SelectTrigger className="bg-input border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {statuses.map((status) => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
        </div>

        <div className="col-span-1 md:col-span-2">
          <FileUpload
            bucket="character-files"
            entityId={character.id}
            entityType="character"
            attachments={formData.attachments}
            onAttachmentsChange={(attachments) => setFormData(prev => ({ ...prev, attachments }))}
            accept="image/*,.pdf,.doc,.docx,.txt,.md"
            maxFiles={15}
            maxSize={10}
          />
        </div>
      </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="concept" className="text-foreground">Concept</Label>
              <Input
                id="concept"
                value={formData.concept}
                onChange={(e) => setFormData(prev => ({ ...prev, concept: e.target.value }))}
                className="bg-input border-border"
                placeholder="e.g., Rebellious artist, Corporate executive"
              />
            </div>

            <div>
              <Label htmlFor="sire" className="text-foreground">Sire</Label>
              <Input
                id="sire"
                value={formData.sire}
                onChange={(e) => setFormData(prev => ({ ...prev, sire: e.target.value }))}
                className="bg-input border-border"
                placeholder="Name of the character's sire"
              />
            </div>

            <div>
              <Label htmlFor="coterie" className="text-foreground">Coterie</Label>
              <Input
                id="coterie"
                value={formData.coterie}
                onChange={(e) => setFormData(prev => ({ ...prev, coterie: e.target.value }))}
                className="bg-input border-border"
                placeholder="Name of the coterie"
              />
            </div>

            <div>
              <Label htmlFor="avatar_url" className="text-foreground">Avatar URL</Label>
              <Input
                id="avatar_url"
                value={formData.avatar_url}
                onChange={(e) => setFormData(prev => ({ ...prev, avatar_url: e.target.value }))}
                className="bg-input border-border"
                placeholder="https://example.com/avatar.jpg"
              />
            </div>

            <div>
              <Label className="text-foreground">Connected Stories</Label>
              <Select onValueChange={addStoryConnection}>
                <SelectTrigger className="bg-input border-border">
                  <SelectValue placeholder="Add story connection..." />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {plots.filter(plot => !formData.connected_stories.includes(plot.id)).map((plot) => (
                    <SelectItem key={plot.id} value={plot.id}>{plot.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {formData.connected_stories.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.connected_stories.map((plotId) => {
                    const plot = plots.find(p => p.id === plotId);
                    return plot ? (
                      <Badge key={plotId} variant="secondary" className="flex items-center gap-1">
                        {plot.title}
                        <X 
                          className="h-3 w-3 cursor-pointer" 
                          onClick={() => removeStoryConnection(plotId)}
                        />
                      </Badge>
                    ) : null;
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteLoading}
            className="flex items-center gap-2"
          >
            {deleteLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            Delete
          </Button>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Update Character
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}