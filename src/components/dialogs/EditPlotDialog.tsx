import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MentionInput } from "@/components/mentions/MentionInput";
import { usePlots, Plot } from "@/hooks/usePlots";
import { useCharacters } from "@/hooks/useCharacters";
import { usePlotCharacters } from "@/hooks/usePlotCharacters";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { FileUpload } from "@/components/ui/file-upload";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2 } from "lucide-react";

const plotSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200, "Title must be less than 200 characters"),
  summary: z.string().max(500, "Summary must be less than 500 characters").optional(),
  description: z.string().max(10000, "Description must be less than 10000 characters").optional(),
  status: z.enum(["Active", "Planned", "Completed", "Critical"]),
  priority: z.enum(["Low", "Medium", "High", "Critical"]),
});

interface EditPlotDialogProps {
  plot: Plot;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated?: () => void;
}

export function EditPlotDialog({ plot, open, onOpenChange, onUpdated }: EditPlotDialogProps) {
  const [loading, setLoading] = useState(false);
  const [selectedCharacters, setSelectedCharacters] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    title: plot.title,
    summary: (plot as any).summary || "",
    description: plot.description || "",
    status: plot.status as "Active" | "Planned" | "Completed" | "Critical",
    priority: plot.priority as "Low" | "Medium" | "High" | "Critical",
    attachments: (plot as any).attachments || []
  });
  
  const { updatePlot, deletePlot } = usePlots();
  const { characters } = useCharacters();
  const { assignCharacter, unassignCharacter, getCharactersForPlot, refetch: refetchPlotCharacters } = usePlotCharacters(plot.id);
  const { toast } = useToast();

  const handleDelete = async () => {
    try {
      await deletePlot(plot.id);
      onOpenChange(false);
      onUpdated?.();
    } catch (error) {
      // Error already handled by deletePlot
    }
  };

  const handleAttachmentsChange = async (attachments: any[]) => {
    setFormData(prev => ({ ...prev, attachments }));
    
    // Auto-save attachments to database and refresh parent list so tiles update immediately
    try {
      await updatePlot(plot.id, { attachments });
      onUpdated?.();
    } catch (error) {
      // Error already handled by updatePlot
    }
  };
  // Load currently assigned characters when dialog opens
  useState(() => {
    if (open) {
      refetchPlotCharacters().then(() => {
        const assigned = getCharactersForPlot(plot.id);
        setSelectedCharacters(assigned);
      });
    }
  });

  const handleCharacterToggle = async (characterId: string, checked: boolean) => {
    try {
      if (checked) {
        await assignCharacter(plot.id, characterId);
      } else {
        await unassignCharacter(plot.id, characterId);
      }
      
      setSelectedCharacters(prev => 
        checked 
          ? [...prev, characterId]
          : prev.filter(id => id !== characterId)
      );
    } catch (error) {
      // Error already handled by assignCharacter/unassignCharacter
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const validated = plotSchema.parse({
        ...formData,
        summary: formData.summary || undefined,
        description: formData.description || undefined,
      });
      
      setLoading(true);

      await updatePlot(plot.id, {
        title: validated.title,
        summary: validated.summary || null,
        description: validated.description || null,
        status: validated.status,
        priority: validated.priority,
        attachments: formData.attachments,
      });

      onOpenChange(false);
      onUpdated?.();
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation error",
          description: error.issues[0].message,
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto bg-gradient-subtle border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Edit Story</DialogTitle>
          <DialogDescription>
            Update your storyline details
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="plot-title">Story Title *</Label>
            <Input
              id="plot-title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Story title"
              className="bg-input border-border"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select value={formData.status} onValueChange={(value: "Active" | "Planned" | "Completed" | "Critical") => setFormData(prev => ({ ...prev, status: value }))}>
                <SelectTrigger className="bg-input border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Planned">Planned</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Critical">Critical</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority *</Label>
              <Select value={formData.priority} onValueChange={(value: "Low" | "Medium" | "High" | "Critical") => setFormData(prev => ({ ...prev, priority: value }))}>
                <SelectTrigger className="bg-input border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="plot-summary">Summary</Label>
            <MentionInput
              id="plot-summary"
              value={formData.summary}
              onChange={(value) => setFormData(prev => ({ ...prev, summary: value }))}
              placeholder="A brief summary for the story tile... Use @ to mention entities (optional)"
              className="bg-input border-border min-h-16 resize-none"
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground">{formData.summary.length}/500 characters</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="plot-description">Description</Label>
            <MentionInput
              id="plot-description"
              value={formData.description}
              onChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
              placeholder="Describe the story, its themes, and key elements... Use @ to mention entities (optional)"
              className="bg-input border-border min-h-24 resize-none"
              maxLength={10000}
            />
            <p className="text-xs text-muted-foreground">Type @ to mention characters, sessions, etc.</p>
          </div>

          <FileUpload
            bucket="story-files"
            entityId={plot.id}
            entityType="story"
            attachments={formData.attachments}
            onAttachmentsChange={handleAttachmentsChange}
            accept=".pdf,.doc,.docx,.txt,.md,image/*"
            maxFiles={15}
            maxSize={10}
          />

          <div className="space-y-2">
            <Label>Assigned Characters</Label>
            <div className="border border-border rounded-md p-3 max-h-48 overflow-y-auto space-y-2 bg-input">
              {characters.length === 0 ? (
                <p className="text-sm text-muted-foreground">No characters available</p>
              ) : (
                characters.map((character) => (
                  <div key={character.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`char-${character.id}`}
                      checked={selectedCharacters.includes(character.id)}
                      onCheckedChange={(checked) => handleCharacterToggle(character.id, checked as boolean)}
                    />
                    <Label
                      htmlFor={`char-${character.id}`}
                      className="text-sm font-normal cursor-pointer flex-1"
                    >
                      {character.name} ({character.clan})
                    </Label>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-border">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" variant="destructive" size="sm" disabled={loading}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Story
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Story</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete "{plot.title}"? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            
            <div className="flex space-x-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" className="bg-gradient-blood hover:opacity-90" disabled={loading}>
                {loading ? "Updating..." : "Update Story"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}