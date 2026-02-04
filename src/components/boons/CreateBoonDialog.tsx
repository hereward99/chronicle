import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MentionInput } from "@/components/mentions/MentionInput";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Character } from "@/hooks/useCharacters";
import { useBoons, BoonSeverity } from "@/hooks/useBoons";
import { usePlots } from "@/hooks/usePlots";
import { useSessions } from "@/hooks/useSessions";
interface CreateBoonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  characters: Character[];
  chronicleId: string;
  preselectedCreditorId?: string;
  preselectedDebtorId?: string;
  mode: "held" | "owed"; // "held" = character is creditor, "owed" = character is debtor
  characterId: string; // The character we're adding the boon for
}

export function CreateBoonDialog({
  open,
  onOpenChange,
  characters,
  chronicleId,
  preselectedCreditorId,
  preselectedDebtorId,
  mode,
  characterId,
}: CreateBoonDialogProps) {
  const { createBoon } = useBoons(chronicleId);
  const { plots } = usePlots();
  const { sessions } = useSessions();

  const [creditorId, setCreditorId] = useState(preselectedCreditorId || "");
  const [debtorId, setDebtorId] = useState(preselectedDebtorId || "");
  const [severity, setSeverity] = useState<BoonSeverity>("minor");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [plotId, setPlotId] = useState<string>("");
  const [sessionId, setSessionId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter to only show other characters (not the current one)
  const otherCharacters = characters.filter(c => c.id !== characterId);

  // Filter sessions by selected plot
  const filteredSessions = plotId 
    ? sessions.filter(s => s.plot_id === plotId)
    : sessions;

  const handleSubmit = async () => {
    // Validate
    const finalCreditorId = mode === "held" ? characterId : creditorId;
    const finalDebtorId = mode === "owed" ? characterId : debtorId;

    if (!finalCreditorId || !finalDebtorId || !description.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await createBoon({
        chronicle_id: chronicleId,
        creditor_id: finalCreditorId,
        debtor_id: finalDebtorId,
        severity,
        description: description.trim(),
        notes: notes.trim() || null,
        plot_id: plotId || null,
        session_id: sessionId || null,
        status: "outstanding",
      });
      onOpenChange(false);
      resetForm();
    } catch (error) {
      // Error handled in hook
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setCreditorId("");
    setDebtorId("");
    setSeverity("minor");
    setDescription("");
    setNotes("");
    setPlotId("");
    setSessionId("");
  };

  const title = mode === "held" 
    ? "Add Boon Held (Someone Owes You)" 
    : "Add Debt Owed (You Owe Someone)";

  const characterLabel = mode === "held" ? "Who owes this boon?" : "Who is owed this boon?";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Character selector */}
          <div className="space-y-2">
            <Label>{characterLabel}</Label>
            <Select 
              value={mode === "held" ? debtorId : creditorId} 
              onValueChange={(val) => mode === "held" ? setDebtorId(val) : setCreditorId(val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select character..." />
              </SelectTrigger>
              <SelectContent>
                {otherCharacters.map(char => (
                  <SelectItem key={char.id} value={char.id}>
                    {char.name} ({char.clan})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Severity */}
          <div className="space-y-2">
            <Label>Severity</Label>
            <Select value={severity} onValueChange={(val) => setSeverity(val as BoonSeverity)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="trivial">Trivial - A small favor</SelectItem>
                <SelectItem value="minor">Minor - A notable favor</SelectItem>
                <SelectItem value="major">Major - A significant debt</SelectItem>
                <SelectItem value="life">Life - A life debt</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>What is the boon?</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Safe passage through Nosferatu territory"
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes (how was it accrued?)</Label>
            <MentionInput
              value={notes}
              onChange={setNotes}
              placeholder="Brief explanation of how this boon came to be... Use @ to mention entities"
              className="min-h-16 resize-none"
              maxLength={2000}
            />
            <p className="text-xs text-muted-foreground">Type @ to mention characters, stories, sessions, etc.</p>
          </div>

          {/* Story link */}
          <div className="space-y-2">
            <Label>Story (optional)</Label>
            <Select value={plotId} onValueChange={setPlotId}>
              <SelectTrigger>
                <SelectValue placeholder="Link to a story..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {plots.map(plot => (
                  <SelectItem key={plot.id} value={plot.id}>
                    {plot.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Session link */}
          <div className="space-y-2">
            <Label>Session (optional)</Label>
            <Select value={sessionId} onValueChange={setSessionId}>
              <SelectTrigger>
                <SelectValue placeholder="Link to a session..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {filteredSessions.map(session => (
                  <SelectItem key={session.id} value={session.id}>
                    {session.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting || !description.trim() || (mode === "held" ? !debtorId : !creditorId)}
          >
            {isSubmitting ? "Creating..." : "Create Boon"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
