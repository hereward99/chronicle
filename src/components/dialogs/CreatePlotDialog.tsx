import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MentionInput } from "@/components/mentions/MentionInput";
import { InGameDateInput } from "@/components/InGameDateInput";
import { usePlots } from "@/hooks/usePlots";
import { useChronicles } from "@/hooks/useChronicles";
import { useCharacters } from "@/hooks/useCharacters";
import { usePlotCharacters } from "@/hooks/usePlotCharacters";
import { BookOpen } from "lucide-react";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { FileUpload } from "@/components/ui/file-upload";
import { GroupMembersPanel, type GroupMember } from "@/components/groups/GroupMembersPanel";
import { Label } from "@/components/ui/label";

const plotSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200, "Title must be less than 200 characters"),
  summary: z.string().max(500, "Summary must be less than 500 characters").optional(),
  description: z.string().max(10000, "Description must be less than 10000 characters").optional(),
  status: z.enum(["Active", "Planned", "Completed", "Critical"]),
  priority: z.enum(["Low", "Medium", "High", "Critical"]),
});

interface CreatePlotDialogProps {
  children: React.ReactNode;
  onCreated?: () => void;
}

export function CreatePlotDialog({ children, onCreated }: CreatePlotDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    title: "",
    summary: "",
    description: "",
    status: "Active" as "Active" | "Planned" | "Completed" | "Critical",
    priority: "Medium" as "Low" | "Medium" | "High" | "Critical",
    attachments: [] as Array<{ id: string; name: string; url: string; type: string; size: number; uploaded_at: string }>,
    in_game_date_start: "",
    in_game_date_end: "",
  });
  
  const { createPlot } = usePlots();
  const { currentChronicle, createDefaultChronicle } = useChronicles();
  const { toast } = useToast();

  const clearFieldError = (field: string) => {
    setErrors(prev => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    try {
      const validated = plotSchema.parse({
        ...formData,
        summary: formData.summary || undefined,
        description: formData.description || undefined,
      });
      
      setLoading(true);

      let chronicleId = currentChronicle?.id;
      if (!chronicleId) {
        const defaultChronicle = await createDefaultChronicle();
        chronicleId = defaultChronicle.id;
      }

      await createPlot({
        title: validated.title,
        summary: validated.summary || null,
        description: validated.description || null,
        status: validated.status,
        priority: validated.priority,
        chronicle_id: chronicleId,
        attachments: formData.attachments,
        in_game_date_start: formData.in_game_date_start || null,
        in_game_date_end: formData.in_game_date_end || null,
      });

      setFormData({
        title: "",
        summary: "",
        description: "",
        status: "Active",
        priority: "Medium",
        attachments: [],
        in_game_date_start: "",
        in_game_date_end: "",
      });
      
      setOpen(false);
      onCreated?.();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.issues.forEach(issue => {
          const field = issue.path[0]?.toString();
          if (field) fieldErrors[field] = issue.message;
        });
        setErrors(fieldErrors);
      }
    } finally {
      setLoading(false);
    }
  };

  const FieldError = ({ field }: { field: string }) => 
    errors[field] ? <p className="text-xs text-destructive mt-1">{errors[field]}</p> : null;

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setErrors({}); }}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto bg-gradient-subtle border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Create New Story</DialogTitle>
          <DialogDescription>
            Add a new storyline to your chronicle
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="plot-title">Story Title *</Label>
            <Input
              id="plot-title"
              value={formData.title}
              onChange={(e) => { setFormData(prev => ({ ...prev, title: e.target.value })); clearFieldError('title'); }}
              placeholder="Story title"
              className={`bg-input border-border ${errors.title ? 'border-destructive' : ''}`}
              required
            />
            <FieldError field="title" />
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

          <InGameDateInput
            startValue={formData.in_game_date_start}
            endValue={formData.in_game_date_end}
            onStartChange={(v) => setFormData(prev => ({ ...prev, in_game_date_start: v }))}
            onEndChange={(v) => setFormData(prev => ({ ...prev, in_game_date_end: v }))}
            className="space-y-2"
          />

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
            entityId="new"
            entityType="story"
            attachments={formData.attachments}
            onAttachmentsChange={(attachments) => setFormData(prev => ({ ...prev, attachments }))}
            accept=".pdf,.doc,.docx,.txt,.md,image/*"
            maxFiles={15}
            maxSize={10}
          />

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" className="bg-gradient-blood hover:opacity-90" disabled={loading}>
              {loading ? "Creating..." : "Create Story"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
