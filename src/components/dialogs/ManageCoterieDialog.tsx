import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { MentionInput } from "@/components/mentions/MentionInput";
import { DotRating } from "@/components/characters/DotRating";
import { FileUpload } from "@/components/ui/file-upload";
import { useCoteries, Coterie } from "@/hooks/useCoteries";
import { useCharacters } from "@/hooks/useCharacters";
import { Users, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface ManageCoterieDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  coterie: Coterie | null;
}

export function ManageCoterieDialog({ open, onOpenChange, coterie }: ManageCoterieDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [domain, setDomain] = useState("");
  const [coterieType, setCoterieType] = useState("");
  const [city, setCity] = useState("");
  const [chasse, setChasse] = useState(0);
  const [portillon, setPortillon] = useState(0);
  const [lien, setLien] = useState(0);
  const [domainMerits, setDomainMerits] = useState("");
  const [domainResonance, setDomainResonance] = useState("");
  const [havenLocation, setHavenLocation] = useState("");
  const [havenMeritsAndFlaws, setHavenMeritsAndFlaws] = useState("");
  const [coterieAdvantagesAndFlaws, setCoterieAdvantagesAndFlaws] = useState("");
  const [coterieBoonsAndDebts, setCoterieBoonsAndDebts] = useState("");
  const [chronicleTenets, setChronicleTenets] = useState("");
  const [coterieGoals, setCoterieGoals] = useState("");
  const [attachments, setAttachments] = useState<any[]>([]);
  const [memberIds, setMemberIds] = useState<Set<string>>(new Set());
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);

  const { updateCoterie, deleteCoterie, addMember, removeMember, getCoterieMembers } = useCoteries();
  const { characters } = useCharacters();

  useEffect(() => {
    if (coterie) {
      setName(coterie.name);
      setDescription(coterie.description || "");
      setDomain(coterie.domain || "");
      setCoterieType(coterie.coterie_type || "");
      setCity(coterie.city || "");
      setChasse(coterie.chasse || 0);
      setPortillon(coterie.portillon || 0);
      setLien(coterie.lien || 0);
      setDomainMerits(coterie.domain_merits || "");
      setDomainResonance(coterie.domain_resonance || "");
      setHavenLocation(coterie.haven_location || "");
      setHavenMeritsAndFlaws(coterie.haven_merits_and_flaws || "");
      setCoterieAdvantagesAndFlaws(coterie.coterie_advantages_and_flaws || "");
      setCoterieBoonsAndDebts(coterie.coterie_boons_and_debts || "");
      setChronicleTenets(coterie.chronicle_tenets || "");
      setCoterieGoals(coterie.coterie_goals || "");
      setAttachments(Array.isArray(coterie.attachments) ? coterie.attachments : []);
      getCoterieMembers(coterie.id).then(ids => setMemberIds(new Set(ids)));
    }
  }, [coterie]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coterie || !name.trim()) return;

    try {
      await updateCoterie(coterie.id, {
        name: name.trim(),
        description: description.trim() || null,
        domain: domain.trim() || null,
        coterie_type: coterieType.trim() || null,
        city: city.trim() || null,
        chasse, portillon, lien,
        domain_merits: domainMerits.trim() || null,
        domain_resonance: domainResonance.trim() || null,
        haven_location: havenLocation.trim() || null,
        haven_merits_and_flaws: havenMeritsAndFlaws.trim() || null,
        coterie_advantages_and_flaws: coterieAdvantagesAndFlaws.trim() || null,
        coterie_boons_and_debts: coterieBoonsAndDebts.trim() || null,
        chronicle_tenets: chronicleTenets.trim() || null,
        coterie_goals: coterieGoals.trim() || null,
        attachments,
      });

      const currentMembers = await getCoterieMembers(coterie.id);
      const currentSet = new Set(currentMembers);
      for (const charId of memberIds) {
        if (!currentSet.has(charId)) await addMember(coterie.id, charId);
      }
      for (const charId of currentSet) {
        if (!memberIds.has(charId)) await removeMember(coterie.id, charId);
      }

      onOpenChange(false);
    } catch (error) {
      console.error("Error updating coterie:", error);
    }
  };

  const handleDelete = async () => {
    if (!coterie) return;
    try {
      await deleteCoterie(coterie.id);
      setShowDeleteAlert(false);
      onOpenChange(false);
    } catch (error) {
      console.error("Error deleting coterie:", error);
    }
  };

  const toggleMember = (characterId: string) => {
    setMemberIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(characterId)) newSet.delete(characterId);
      else newSet.add(characterId);
      return newSet;
    });
  };

  if (!coterie) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Manage Coterie</DialogTitle>
            <DialogDescription>Update coterie details, members, and attachments.</DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-1 pr-4">
            <form onSubmit={handleSubmit} className="space-y-6 pb-4">
              {/* Basic Info */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Details</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Name *</Label>
                    <Input value={name} onChange={e => setName(e.target.value)} required />
                  </div>
                  <div className="space-y-1">
                    <Label>Coterie Type</Label>
                    <Input value={coterieType} onChange={e => setCoterieType(e.target.value)} placeholder="Hunting pack, Watchmen..." />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label>City</Label>
                  <Input value={city} onChange={e => setCity(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Description</Label>
                  <MentionInput value={description} onChange={setDescription} placeholder="Describe the coterie..." className="min-h-20 resize-none" maxLength={3000} />
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
                  <Input value={domain} onChange={e => setDomain(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Domain Resonance</Label>
                  <Input value={domainResonance} onChange={e => setDomainResonance(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Domain Merits</Label>
                  <Textarea value={domainMerits} onChange={e => setDomainMerits(e.target.value)} className="min-h-16" />
                </div>
              </div>

              {/* Haven */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Haven / Hangout</h3>
                <div className="space-y-1">
                  <Label>Location</Label>
                  <Input value={havenLocation} onChange={e => setHavenLocation(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Haven Merits & Flaws</Label>
                  <Textarea value={havenMeritsAndFlaws} onChange={e => setHavenMeritsAndFlaws(e.target.value)} className="min-h-16" />
                </div>
              </div>

              {/* Social Ledger */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Social Ledger</h3>
                <div className="space-y-1">
                  <Label>Coterie Advantages & Flaws</Label>
                  <Textarea value={coterieAdvantagesAndFlaws} onChange={e => setCoterieAdvantagesAndFlaws(e.target.value)} className="min-h-16" />
                </div>
                <div className="space-y-1">
                  <Label>Boons & Debts</Label>
                  <Textarea value={coterieBoonsAndDebts} onChange={e => setCoterieBoonsAndDebts(e.target.value)} className="min-h-16" />
                </div>
              </div>

              {/* Ideology */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Ideology & Ambition</h3>
                <div className="space-y-1">
                  <Label>Chronicle Tenets</Label>
                  <Textarea value={chronicleTenets} onChange={e => setChronicleTenets(e.target.value)} className="min-h-16" />
                </div>
                <div className="space-y-1">
                  <Label>Coterie Goals</Label>
                  <Textarea value={coterieGoals} onChange={e => setCoterieGoals(e.target.value)} className="min-h-16" />
                </div>
              </div>

              {/* Members */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Users className="h-4 w-4" /> Members
                </h3>
                <ScrollArea className="h-[200px] border rounded-md">
                  <div className="p-4 space-y-3">
                    {characters.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No characters available</p>
                    ) : (
                      characters.map(character => (
                        <div key={character.id} className="flex items-center gap-2">
                          <Checkbox
                            id={`char-${character.id}`}
                            checked={memberIds.has(character.id)}
                            onCheckedChange={() => toggleMember(character.id)}
                          />
                          <Label htmlFor={`char-${character.id}`} className="flex-1 cursor-pointer">
                            {character.name} ({character.clan})
                          </Label>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>

              {/* Attachments */}
              <FileUpload
                bucket="coterie-files"
                entityId={coterie.id}
                entityType="coterie"
                attachments={attachments}
                onAttachmentsChange={setAttachments}
              />

              <div className="flex justify-between pt-2">
                <Button type="button" variant="destructive" onClick={() => setShowDeleteAlert(true)}>
                  <Trash2 className="h-4 w-4 mr-2" /> Delete Coterie
                </Button>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                  <Button type="submit">Save Changes</Button>
                </div>
              </div>
            </form>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Coterie</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{coterie.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
