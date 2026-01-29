import { useState, useEffect } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Character } from "@/hooks/useCharacters";
import { Boon, useBoons, BoonSeverity, BoonStatus } from "@/hooks/useBoons";
import { usePlots } from "@/hooks/usePlots";
import { useSessions } from "@/hooks/useSessions";
import { Trash2 } from "lucide-react";

interface EditBoonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  boon: Boon | null;
  characters: Character[];
  chronicleId: string;
}

export function EditBoonDialog({
  open,
  onOpenChange,
  boon,
  characters,
  chronicleId,
}: EditBoonDialogProps) {
  const { updateBoon, deleteBoon } = useBoons(chronicleId);
  const { plots } = usePlots();
  const { sessions } = useSessions();

  const [creditorId, setCreditorId] = useState("");
  const [debtorId, setDebtorId] = useState("");
  const [severity, setSeverity] = useState<BoonSeverity>("minor");
  const [status, setStatus] = useState<BoonStatus>("outstanding");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [plotId, setPlotId] = useState<string>("");
  const [sessionId, setSessionId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load boon data when dialog opens
  useEffect(() => {
    if (boon) {
      setCreditorId(boon.creditor_id);
      setDebtorId(boon.debtor_id);
      setSeverity(boon.severity);
      setStatus(boon.status);
      setDescription(boon.description);
      setNotes(boon.notes || "");
      setPlotId(boon.plot_id || "");
      setSessionId(boon.session_id || "");
    }
  }, [boon]);

  // Filter sessions by selected plot
  const filteredSessions = plotId 
    ? sessions.filter(s => s.plot_id === plotId)
    : sessions;

  const handleSubmit = async () => {
    if (!boon || !description.trim() || !creditorId || !debtorId) {
      return;
    }

    setIsSubmitting(true);
    try {
      await updateBoon(boon.id, {
        creditor_id: creditorId,
        debtor_id: debtorId,
        severity,
        status,
        description: description.trim(),
        notes: notes.trim() || null,
        plot_id: plotId || null,
        session_id: sessionId || null,
      });
      onOpenChange(false);
    } catch (error) {
      // Error handled in hook
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!boon) return;
    try {
      await deleteBoon(boon.id);
      onOpenChange(false);
    } catch (error) {
      // Error handled in hook
    }
  };

  const getCharacterName = (id: string) => {
    return characters.find(c => c.id === id)?.name || "Unknown";
  };

  if (!boon) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Boon</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Creditor */}
          <div className="space-y-2">
            <Label>Owed to (Creditor)</Label>
            <Select value={creditorId} onValueChange={setCreditorId}>
              <SelectTrigger>
                <SelectValue placeholder="Select character..." />
              </SelectTrigger>
              <SelectContent>
                {characters.filter(c => c.id !== debtorId).map(char => (
                  <SelectItem key={char.id} value={char.id}>
                    {char.name} ({char.clan})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Debtor */}
          <div className="space-y-2">
            <Label>Owed by (Debtor)</Label>
            <Select value={debtorId} onValueChange={setDebtorId}>
              <SelectTrigger>
                <SelectValue placeholder="Select character..." />
              </SelectTrigger>
              <SelectContent>
                {characters.filter(c => c.id !== creditorId).map(char => (
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
                <SelectItem value="trivial">Trivial</SelectItem>
                <SelectItem value="minor">Minor</SelectItem>
                <SelectItem value="major">Major</SelectItem>
                <SelectItem value="life">Life</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={(val) => setStatus(val as BoonStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="outstanding">Outstanding</SelectItem>
                <SelectItem value="fulfilled">Fulfilled</SelectItem>
                <SelectItem value="forgiven">Forgiven</SelectItem>
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
            <Label>Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="How was this boon accrued..."
              rows={2}
            />
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

        <DialogFooter className="flex justify-between">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="icon">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this boon?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently remove the boon record between {getCharacterName(creditorId)} and {getCharacterName(debtorId)}.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={isSubmitting || !description.trim()}
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
