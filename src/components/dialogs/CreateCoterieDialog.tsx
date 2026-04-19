import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MentionInput } from "@/components/mentions/MentionInput";
import { DotRating } from "@/components/characters/DotRating";
import { DotRatedList, DotRatedItem, serializeDotRatedItems } from "@/components/characters/DotRatedList";
import { FileUpload } from "@/components/ui/file-upload";
import { useCoteries } from "@/hooks/useCoteries";
import { useChronicles } from "@/hooks/useChronicles";

interface CreateCoterieDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateCoterieDialog({ open, onOpenChange }: CreateCoterieDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [domain, setDomain] = useState("");
  const [coterieType, setCoterieType] = useState("");
  const [city, setCity] = useState("");
  const [chasse, setChasse] = useState(0);
  const [portillon, setPortillon] = useState(0);
  const [lien, setLien] = useState(0);
  const [domainMerits, setDomainMerits] = useState<DotRatedItem[]>([]);
  const [domainResonance, setDomainResonance] = useState("");
  const [havenLocation, setHavenLocation] = useState("");
  const [havenMeritsAndFlaws, setHavenMeritsAndFlaws] = useState<DotRatedItem[]>([]);
  const [coterieAdvantagesAndFlaws, setCoterieAdvantagesAndFlaws] = useState("");
  const [coterieBoonsAndDebts, setCoterieBoonsAndDebts] = useState("");
  const [chronicleTenets, setChronicleTenets] = useState("");
  const [coterieGoals, setCoterieGoals] = useState("");
  const [attachments, setAttachments] = useState<any[]>([]);
  const [tempId] = useState(() => `new-${Date.now()}`);

  const { createCoterie } = useCoteries();
  const { chronicles } = useChronicles();

  const resetForm = () => {
    setName("");
    setDescription("");
    setDomain("");
    setCoterieType("");
    setCity("");
    setChasse(0);
    setPortillon(0);
    setLien(0);
    setDomainMerits([]);
    setDomainResonance("");
    setHavenLocation("");
    setHavenMeritsAndFlaws([]);
    setCoterieAdvantagesAndFlaws("");
    setCoterieBoonsAndDebts("");
    setChronicleTenets("");
    setCoterieGoals("");
    setAttachments([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const chronicleId = chronicles[0]?.id;
    if (!chronicleId) {
      alert("Please create a chronicle first");
      return;
    }

    try {
      await createCoterie({
        name: name.trim(),
        description: description.trim() || null,
        domain: domain.trim() || null,
        chronicle_id: chronicleId,
        is_primary: false,
        coterie_type: coterieType.trim() || null,
        city: city.trim() || null,
        chasse,
        portillon,
        lien,
        domain_merits: serializeDotRatedItems(domainMerits),
        domain_resonance: domainResonance.trim() || null,
        haven_location: havenLocation.trim() || null,
        haven_merits_and_flaws: serializeDotRatedItems(havenMeritsAndFlaws),
        coterie_advantages_and_flaws: coterieAdvantagesAndFlaws.trim() || null,
        coterie_boons_and_debts: coterieBoonsAndDebts.trim() || null,
        chronicle_tenets: chronicleTenets.trim() || null,
        coterie_goals: coterieGoals.trim() || null,
        attachments,
      });
      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error("Error creating coterie:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0">
        {" "}
        {/* p-0 allows the ScrollArea to hit the edges */}
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>Create Coterie</DialogTitle>
          <DialogDescription>Create a new coterie using the V5 Coterie Sheet format.</DialogDescription>
        </DialogHeader>
        {/* The form starts before the ScrollArea so the submit event still works */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <ScrollArea className="flex-1 px-6">
            <div className="space-y-6 py-4">
              {/* Basic Info */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Details</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="The Midnight Circle"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="type">Coterie Type</Label>
                    <Input
                      id="type"
                      value={coterieType}
                      onChange={(e) => setCoterieType(e.target.value)}
                      placeholder="Hunting pack, Watchmen..."
                    />
                  </div>
                </div>
                {/* ... Keep all your other form fields here exactly as they were ... */}

                {/* Ensure the fields like Haven, Social Ledger, etc., stay inside this ScrollArea */}
              </div>

              {/* Ideology, Attachments, etc. */}
              {/* ... */}
            </div>
          </ScrollArea>

          {/* This Footer stays pinned to the bottom */}
          <div className="flex justify-end gap-2 p-6 border-t bg-muted/20">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Coterie</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
