import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MentionInput } from "@/components/mentions/MentionInput";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSessions, Session } from "@/hooks/useSessions";
import { usePlots } from "@/hooks/usePlots";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";

const sessionSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200, "Title must be less than 200 characters"),
  summary: z.string().max(3000, "Summary must be less than 3000 characters").optional(),
  date_played: z.string().min(1, "Date is required"),
  experience_awarded: z.number().int().min(0).max(10),
  plot_id: z.string().nullable(),
});

interface EditSessionDialogProps {
  session: Session;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditSessionDialog({ session, open, onOpenChange }: EditSessionDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: session.title,
    summary: session.summary || "",
    date_played: session.date_played,
    experience_awarded: session.experience_awarded || 0,
    plot_id: session.plot_id,
  });
  
  const { updateSession } = useSessions();
  const { plots } = usePlots();
  const { toast } = useToast();

  // Filter plots for current chronicle
  const chroniclePlots = plots.filter(p => p.chronicle_id === session.chronicle_id);

  // Reset form when session changes
  useEffect(() => {
    setFormData({
      title: session.title,
      summary: session.summary || "",
      date_played: session.date_played,
      experience_awarded: session.experience_awarded || 0,
      plot_id: session.plot_id,
    });
  }, [session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const validated = sessionSchema.parse({
        ...formData,
        summary: formData.summary || undefined,
        plot_id: formData.plot_id,
      });
      
      setLoading(true);

      await updateSession(session.id, {
        title: validated.title,
        summary: validated.summary || null,
        date_played: validated.date_played,
        experience_awarded: validated.experience_awarded,
        plot_id: validated.plot_id,
      });
      
      onOpenChange(false);
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
          <DialogTitle className="text-foreground">Edit Session</DialogTitle>
          <DialogDescription>
            Update session details
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-session-title">Session Title *</Label>
            <Input
              id="edit-session-title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Session title"
              className="bg-input border-border"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-story">Story (Optional)</Label>
            <Select
              value={formData.plot_id || "none"}
              onValueChange={(value) => setFormData(prev => ({ ...prev, plot_id: value === "none" ? null : value }))}
            >
              <SelectTrigger className="bg-input border-border">
                <SelectValue placeholder="Select a story..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No story</SelectItem>
                {chroniclePlots.map((plot) => (
                  <SelectItem key={plot.id} value={plot.id}>
                    {plot.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-date-played">Date Played *</Label>
              <Input
                id="edit-date-played"
                type="date"
                value={formData.date_played}
                onChange={(e) => setFormData(prev => ({ ...prev, date_played: e.target.value }))}
                className="bg-input border-border"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-experience">Experience Awarded</Label>
              <Input
                id="edit-experience"
                type="number"
                min="0"
                max="10"
                value={formData.experience_awarded}
                onChange={(e) => setFormData(prev => ({ ...prev, experience_awarded: parseInt(e.target.value) || 0 }))}
                className="bg-input border-border"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-session-summary">Session Summary</Label>
            <MentionInput
              id="edit-session-summary"
              value={formData.summary}
              onChange={(value) => setFormData(prev => ({ ...prev, summary: value }))}
              placeholder="What happened in this session? Use @ to mention characters (optional)"
              className="bg-input border-border min-h-24 resize-none"
              maxLength={3000}
            />
            <p className="text-xs text-muted-foreground">Type @ to mention characters, stories, etc.</p>
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
