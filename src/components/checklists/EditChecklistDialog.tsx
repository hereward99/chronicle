import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MentionInput } from "@/components/mentions/MentionInput";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SessionChecklist } from "@/hooks/useChecklists";
import { usePlots } from "@/hooks/usePlots";

interface EditChecklistDialogProps {
  checklist: SessionChecklist;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (id: string, updates: { title?: string; notes?: string; plot_id?: string | null }) => Promise<void>;
}

export function EditChecklistDialog({ checklist, open, onOpenChange, onSave }: EditChecklistDialogProps) {
  const [title, setTitle] = useState(checklist.title);
  const [notes, setNotes] = useState(checklist.notes || "");
  const [plotId, setPlotId] = useState<string | null>(checklist.plot_id);
  const [saving, setSaving] = useState(false);
  const { plots } = usePlots();

  useEffect(() => {
    if (open) {
      setTitle(checklist.title);
      setNotes(checklist.notes || "");
      setPlotId(checklist.plot_id);
    }
  }, [open, checklist]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    await onSave(checklist.id, {
      title: title.trim(),
      notes: notes.trim() || undefined,
      plot_id: plotId,
    });
    setSaving(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Checklist</DialogTitle>
            <DialogDescription>Update the checklist details.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-title">Title *</Label>
              <Input
                id="edit-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label>Link to Story (Optional)</Label>
              <Select value={plotId || "__none__"} onValueChange={(v) => setPlotId(v === "__none__" ? null : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="No story linked" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">No story linked</SelectItem>
                  {plots.map((plot) => (
                    <SelectItem key={plot.id} value={plot.id}>{plot.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-notes">Notes (Optional)</Label>
              <MentionInput
                id="edit-notes"
                value={notes}
                onChange={(value) => setNotes(value)}
                placeholder="Notes... Use @ to mention characters"
                className="min-h-[60px] resize-none"
                maxLength={2000}
              />
              <p className="text-xs text-muted-foreground">Type @ to mention characters, stories, etc.</p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={!title.trim() || saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
