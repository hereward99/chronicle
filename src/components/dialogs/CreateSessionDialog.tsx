import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSessions } from "@/hooks/useSessions";
import { useChronicles } from "@/hooks/useChronicles";
import { Calendar } from "lucide-react";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";

const sessionSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200, "Title must be less than 200 characters"),
  summary: z.string().max(2000, "Summary must be less than 2000 characters").optional(),
  date_played: z.string().min(1, "Date is required"),
  experience_awarded: z.number().int().min(0).max(10),
});

interface CreateSessionDialogProps {
  children: React.ReactNode;
}

export function CreateSessionDialog({ children }: CreateSessionDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    summary: "",
    date_played: new Date().toISOString().split('T')[0], // Today's date
    experience_awarded: 1,
  });
  
  const { createSession } = useSessions();
  const { currentChronicle, createDefaultChronicle } = useChronicles();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const validated = sessionSchema.parse({
        ...formData,
        summary: formData.summary || undefined,
      });
      
      setLoading(true);

      // Ensure we have a chronicle
      let chronicleId = currentChronicle?.id;
      if (!chronicleId) {
        const defaultChronicle = await createDefaultChronicle();
        chronicleId = defaultChronicle.id;
      }

      await createSession({
        title: validated.title,
        summary: validated.summary || null,
        date_played: validated.date_played,
        experience_awarded: validated.experience_awarded,
        chronicle_id: chronicleId,
      });

      // Reset form
      setFormData({
        title: "",
        summary: "",
        date_played: new Date().toISOString().split('T')[0],
        experience_awarded: 1,
      });
      
      setOpen(false);
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto bg-gradient-subtle border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Log New Session</DialogTitle>
          <DialogDescription>
            Record a gaming session for your chronicle
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="session-title">Session Title *</Label>
            <Input
              id="session-title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Session title"
              className="bg-input border-border"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date-played">Date Played *</Label>
              <Input
                id="date-played"
                type="date"
                value={formData.date_played}
                onChange={(e) => setFormData(prev => ({ ...prev, date_played: e.target.value }))}
                className="bg-input border-border"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="experience">Experience Awarded</Label>
              <Input
                id="experience"
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
            <Label htmlFor="session-summary">Session Summary</Label>
            <Textarea
              id="session-summary"
              value={formData.summary}
              onChange={(e) => setFormData(prev => ({ ...prev, summary: e.target.value }))}
              placeholder="What happened in this session? (optional)"
              className="bg-input border-border min-h-24 resize-none"
              maxLength={2000}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" className="bg-gradient-blood hover:opacity-90" disabled={loading}>
              {loading ? "Logging..." : "Log Session"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}