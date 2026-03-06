import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MentionInput } from "@/components/mentions/MentionInput";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSessions } from "@/hooks/useSessions";
import { useChronicles } from "@/hooks/useChronicles";
import { usePlots } from "@/hooks/usePlots";
import { useCharacters } from "@/hooks/useCharacters";
import { useSessionCharacters } from "@/hooks/useSessionCharacters";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useFormDraft } from "@/hooks/useFormDraft";

const sessionSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200, "Title must be less than 200 characters"),
  summary: z.string().max(3000, "Summary must be less than 3000 characters").optional(),
  date_played: z.string().min(1, "Date is required"),
  experience_awarded: z.number().int().min(0).max(10),
  plot_id: z.string().nullable(),
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
    date_played: new Date().toISOString().split('T')[0],
    experience_awarded: 1,
    plot_id: null as string | null,
  });
  const [selectedCharacterIds, setSelectedCharacterIds] = useState<string[]>([]);
  
  const { createSession } = useSessions();
  const { currentChronicle, createDefaultChronicle } = useChronicles();
  const { plots } = usePlots();
  const { characters } = useCharacters();
  const { setSessionCharacters } = useSessionCharacters();
  const { toast } = useToast();

  const { clearDraft, hasDraft } = useFormDraft(
    'create-session',
    formData,
    setFormData,
    { enabled: open }
  );

  const chronicleCharacters = characters.filter(c => c.chronicle_id === currentChronicle?.id);

  // Filter plots for current chronicle
  const chroniclePlots = plots.filter(p => p.chronicle_id === currentChronicle?.id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const validated = sessionSchema.parse({
        ...formData,
        summary: formData.summary || undefined,
        plot_id: formData.plot_id,
      });
      
      setLoading(true);

      // Ensure we have a chronicle
      let chronicleId = currentChronicle?.id;
      if (!chronicleId) {
        const defaultChronicle = await createDefaultChronicle();
        chronicleId = defaultChronicle.id;
      }

      const newSession = await createSession({
        title: validated.title,
        summary: validated.summary || null,
        date_played: validated.date_played,
        experience_awarded: validated.experience_awarded,
        chronicle_id: chronicleId,
        plot_id: validated.plot_id,
      });

      // Save character associations
      if (selectedCharacterIds.length > 0 && newSession?.id) {
        await setSessionCharacters(newSession.id, selectedCharacterIds);
      }

      // Clear draft and reset form
      clearDraft();
      setFormData({
        title: "",
        summary: "",
        date_played: new Date().toISOString().split('T')[0],
        experience_awarded: 1,
        plot_id: null,
      });
      setSelectedCharacterIds([]);
      
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

          <div className="space-y-2">
            <Label htmlFor="story">Story (Optional)</Label>
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

          {/* Character Picker */}
          <div className="space-y-2">
            <Label>Characters in Session</Label>
            {chronicleCharacters.length > 0 ? (
              <ScrollArea className="h-32 border border-border rounded-md p-2">
                <div className="space-y-1">
                  {chronicleCharacters.map((char) => (
                    <label key={char.id} className="flex items-center gap-2 py-1 px-1 rounded hover:bg-muted/50 cursor-pointer text-sm">
                      <Checkbox
                        checked={selectedCharacterIds.includes(char.id)}
                        onCheckedChange={(checked) => {
                          setSelectedCharacterIds(prev =>
                            checked ? [...prev, char.id] : prev.filter(id => id !== char.id)
                          );
                        }}
                      />
                      <span>{char.name}</span>
                      <span className="text-xs text-muted-foreground ml-auto">{char.clan}</span>
                    </label>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <p className="text-xs text-muted-foreground">No characters in this chronicle yet.</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="session-summary">Session Summary</Label>
            <MentionInput
              id="session-summary"
              value={formData.summary}
              onChange={(value) => setFormData(prev => ({ ...prev, summary: value }))}
              placeholder="What happened in this session? Use @ to mention characters (optional)"
              className="bg-input border-border min-h-24 resize-none"
              maxLength={3000}
            />
            <p className="text-xs text-muted-foreground">Type @ to mention characters, stories, etc.</p>
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