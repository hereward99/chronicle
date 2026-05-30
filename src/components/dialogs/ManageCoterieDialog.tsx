import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MentionInput } from "@/components/mentions/MentionInput";
import { DotRating } from "@/components/characters/DotRating";
import { DotRatedList, DotRatedItem, parseDotRatedItems, serializeDotRatedItems } from "@/components/characters/DotRatedList";
import { FileUpload } from "@/components/ui/file-upload";
import { useCoteries, Coterie } from "@/hooks/useCoteries";
import { useCharacters } from "@/hooks/useCharacters";
import { Users, Trash2 } from "lucide-react";
import { GroupMembersPanel, type GroupMember } from "@/components/groups/GroupMembersPanel";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  const [domainMerits, setDomainMerits] = useState<DotRatedItem[]>([]);
  const [domainResonance, setDomainResonance] = useState("");
  const [havenLocation, setHavenLocation] = useState("");
  const [havenMeritsAndFlaws, setHavenMeritsAndFlaws] = useState<DotRatedItem[]>([]);
  const [coterieAdvantagesAndFlaws, setCoterieAdvantagesAndFlaws] = useState("");
  const [coterieBoonsAndDebts, setCoterieBoonsAndDebts] = useState("");
  const [chronicleTenets, setChronicleTenets] = useState("");
  const [coterieGoals, setCoterieGoals] = useState("");
  const [attachments, setAttachments] = useState<any[]>([]);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);

  const { updateCoterie, deleteCoterie, addMember, removeMember, allCoterieMembers } = useCoteries();
  const { characters } = useCharacters();

  const coterieMembers = useMemo<GroupMember[]>(() => {
    if (!coterie) return [];
    return allCoterieMembers
      .filter(m => m.coterie_id === coterie.id)
      .map(m => ({ characterId: m.character_id, role: m.role }));
  }, [coterie, allCoterieMembers]);

  const chronicleCharacters = useMemo(
    () => (coterie ? characters.filter(c => c.chronicle_id === coterie.chronicle_id) : []),
    [coterie, characters],
  );

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
      setDomainMerits(parseDotRatedItems(coterie.domain_merits));
      setDomainResonance(coterie.domain_resonance || "");
      setHavenLocation(coterie.haven_location || "");
      setHavenMeritsAndFlaws(parseDotRatedItems(coterie.haven_merits_and_flaws));
      setCoterieAdvantagesAndFlaws(coterie.coterie_advantages_and_flaws || "");
      setCoterieBoonsAndDebts(coterie.coterie_boons_and_debts || "");
      setChronicleTenets(coterie.chronicle_tenets || "");
      setCoterieGoals(coterie.coterie_goals || "");
      setAttachments(Array.isArray(coterie.attachments) ? coterie.attachments : []);
      
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coterie?.id]);

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
  if (!coterie) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent size="md">
          <DialogHeader>
            <DialogTitle>Manage Coterie</DialogTitle>
            <DialogDescription>Update coterie details, members, and attachments.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6 pb-2">
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
                <MentionInput value={city} onChange={setCity} placeholder="City name or @mention a location..." className="min-h-10 resize-none" maxLength={500} />
              </div>
              <div className="space-y-1">
                <Label>Description</Label>
                <MentionInput value={description} onChange={setDescription} placeholder="Describe the coterie..." className="min-h-20 resize-none" maxLength={3000} />
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Domain</h3>
              <DotRating value={chasse} onChange={setChasse} label="Chasse" />
              <DotRating value={portillon} onChange={setPortillon} label="Portillon" />
              <DotRating value={lien} onChange={setLien} label="Lien" />
              <div className="space-y-1">
                <Label>Domain / Territory</Label>
                <MentionInput value={domain} onChange={setDomain} placeholder="Domain area or @mention a location..." className="min-h-10 resize-none" maxLength={500} />
              </div>
              <div className="space-y-1">
                <Label>Domain Resonance</Label>
                <Input value={domainResonance} onChange={e => setDomainResonance(e.target.value)} />
              </div>
              <DotRatedList items={domainMerits} onChange={setDomainMerits} label="Domain Merits" placeholder="e.g. Herd, Rack..." />
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Haven / Hangout</h3>
              <div className="space-y-1">
                <Label>Location</Label>
                <MentionInput value={havenLocation} onChange={setHavenLocation} placeholder="Haven location or @mention..." className="min-h-10 resize-none" maxLength={500} />
              </div>
              <DotRatedList items={havenMeritsAndFlaws} onChange={setHavenMeritsAndFlaws} label="Haven Merits & Flaws" placeholder="e.g. Postern, Cell..." />
            </div>

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

            <div className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" /> Members
              </h3>
              <GroupMembersPanel
                characters={chronicleCharacters}
                members={coterieMembers}
                showRole
                emptyCopy="No characters in this coterie yet"
                listHeight="h-[220px]"
                onAdd={async (characterId, role) => {
                  await addMember(coterie.id, characterId, role);
                }}
                onRemove={async (characterId) => {
                  await removeMember(coterie.id, characterId);
                }}
              />
            </div>

            <FileUpload
              bucket="coterie-files"
              entityId={coterie.id}
              entityType="coterie"
              attachments={attachments}
              onAttachmentsChange={setAttachments}
            />

            <div className="flex justify-between border-t pt-4">
              <Button type="button" variant="destructive" onClick={() => setShowDeleteAlert(true)}>
                <Trash2 className="mr-2 h-4 w-4" /> Delete Coterie
              </Button>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit">Save Changes</Button>
              </div>
            </div>
          </form>
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
