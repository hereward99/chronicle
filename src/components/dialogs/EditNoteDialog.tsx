import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MentionInput } from "@/components/mentions/MentionInput";
import { useNotes, Note } from "@/hooks/useNotes";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";

const noteSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200, "Title must be less than 200 characters"),
  content: z.string().max(5000, "Content must be less than 5000 characters").optional(),
  category: z.string().max(50, "Category must be less than 50 characters").optional(),
});

const categories = [
  "General", "Session Notes", "Character Notes", "Plot Ideas",
  "World Building", "NPCs", "Locations", "Rules & Mechanics"
];

interface EditNoteDialogProps {
  note: Note | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditNoteDialog({ note, open, onOpenChange }: EditNoteDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ title: "", content: "", category: "General" });
  const { updateNote } = useNotes();
  const { toast } = useToast();

  useEffect(() => {
    if (note) {
      setFormData({
        title: note.title,
        content: note.content || "",
        category: note.category || "General",
      });
    }
  }, [note]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!note) return;

    try {
      const validated = noteSchema.parse({
        ...formData,
        content: formData.content || undefined,
        category: formData.category || undefined,
      });

      setLoading(true);
      await updateNote(note.id, {
        title: validated.title,
        content: validated.content || null,
        category: validated.category || null,
      });
      onOpenChange(false);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({ title: "Validation error", description: error.issues[0].message, variant: "destructive" });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle className="text-foreground">Edit Note</DialogTitle>
          <DialogDescription>Update your chronicle note</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-note-title">Note Title *</Label>
            <Input
              id="edit-note-title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Note title"
              className="bg-input border-border"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-category">Category</Label>
            <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
              <SelectTrigger className="bg-input border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-note-content">Content</Label>
            <MentionInput
              id="edit-note-content"
              value={formData.content}
              onChange={(value) => setFormData(prev => ({ ...prev, content: value }))}
              placeholder="Write your note content here... Use @ to mention entities (optional)"
              className="bg-input border-border min-h-32 resize-none"
              maxLength={5000}
            />
            <p className="text-xs text-muted-foreground">Type @ to mention characters, stories, sessions, etc.</p>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" className="bg-gradient-blood hover:opacity-90" disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
