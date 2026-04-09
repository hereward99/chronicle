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
    setName(""); setDescription(""); setDomain(""); setCoterieType(""); setCity("");
    setChasse(0); setPortillon(0); setLien(0); setDomainMerits([]); setDomainResonance("");
    setHavenLocation(""); setHavenMeritsAndFlaws([]); setCoterieAdvantagesAndFlaws("");
    setCoterieBoonsAndDebts(""); setChronicleTenets(""); setCoterieGoals(""); setAttachments([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const chronicleId = chronicles[0]?.id;
    if (!chronicleId) { alert("Please create a chronicle first"); return; }

    try {
      await createCoterie({
        name: name.trim(),
        description: description.trim() || null,
        domain: domain.trim() || null,
        chronicle_id: chronicleId,
        is_primary: false,
        coterie_type: coterieType.trim() || null,
        city: city.trim() || null,
        chasse, portillon, lien,
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
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Create Coterie</DialogTitle>
          <DialogDescription>Create a new coterie using the V5 Coterie Sheet format.</DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-1 pr-4">
          <form onSubmit={handleSubmit} className="space-y-6 pb-4">
            {/* Basic Info */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Details</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="name">Name *</Label>
                  <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="The Midnight Circle" required />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="type">Coterie Type</Label>
                  <Input id="type" value={coterieType} onChange={e => setCoterieType(e.target.value)} placeholder="Hunting pack, Watchmen..." />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="city">City</Label>
                <Input id="city" value={city} onChange={e => setCity(e.target.value)} placeholder="Chicago" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="description">Description</Label>
                <MentionInput id="description" value={description} onChange={setDescription} placeholder="Describe the coterie... Use @ to mention entities" className="min-h-20 resize-none" maxLength={3000} />
              </div>
            </div>

            {/* Domain */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Domain</h3>
              <DotRating value={chasse} onChange={setChasse} label="Chasse" />
              <DotRating value={portillon} onChange={setPortillon} label="Portillon" />
              <DotRating value={lien} onChange={setLien} label="Lien" />
              <div className="space-y-1">
                <Label>Domain / Territory</Label>
                <Input value={domain} onChange={e => setDomain(e.target.value)} placeholder="Downtown District" />
              </div>
              <div className="space-y-1">
                <Label>Domain Resonance</Label>
                <Input value={domainResonance} onChange={e => setDomainResonance(e.target.value)} placeholder="Choleric" />
              </div>
              <DotRatedList items={domainMerits} onChange={setDomainMerits} label="Domain Merits" placeholder="e.g. Herd, Rack..." />
            </div>

            {/* Haven */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Haven / Hangout</h3>
              <div className="space-y-1">
                <Label>Location</Label>
                <Input value={havenLocation} onChange={e => setHavenLocation(e.target.value)} placeholder="Abandoned warehouse on 5th Street" />
              </div>
              <DotRatedList items={havenMeritsAndFlaws} onChange={setHavenMeritsAndFlaws} label="Haven Merits & Flaws" placeholder="e.g. Postern, Cell..." />
            </div>

            {/* Social Ledger */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Social Ledger</h3>
              <div className="space-y-1">
                <Label>Coterie Advantages & Flaws</Label>
                <Textarea value={coterieAdvantagesAndFlaws} onChange={e => setCoterieAdvantagesAndFlaws(e.target.value)} placeholder="Advantages and flaws..." className="min-h-16" />
              </div>
              <div className="space-y-1">
                <Label>Boons & Debts</Label>
                <Textarea value={coterieBoonsAndDebts} onChange={e => setCoterieBoonsAndDebts(e.target.value)} placeholder="Boons owed and debts..." className="min-h-16" />
              </div>
            </div>

            {/* Ideology */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Ideology & Ambition</h3>
              <div className="space-y-1">
                <Label>Chronicle Tenets</Label>
                <Textarea value={chronicleTenets} onChange={e => setChronicleTenets(e.target.value)} placeholder="Chronicle tenets..." className="min-h-16" />
              </div>
              <div className="space-y-1">
                <Label>Coterie Goals</Label>
                <Textarea value={coterieGoals} onChange={e => setCoterieGoals(e.target.value)} placeholder="What does the coterie want to achieve?" className="min-h-16" />
              </div>
            </div>

            {/* Attachments */}
            <FileUpload
              bucket="coterie-files"
              entityId={tempId}
              entityType="coterie"
              attachments={attachments}
              onAttachmentsChange={setAttachments}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit">Create Coterie</Button>
            </div>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
