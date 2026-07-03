import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Edit, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { useCoteries } from "@/hooks/useCoteries";
import { useCharacters } from "@/hooks/useCharacters";
import { ManageCoterieDialog } from "@/components/dialogs/ManageCoterieDialog";
import { MentionText } from "@/components/mentions/MentionText";
import { CharacterAttachmentsGallery } from "@/components/character/CharacterAttachmentsGallery";
import { DetailPageHeader, DetailNotFound } from "@/components/DetailPageHeader";

const Field = ({ label, value }: { label: string; value: React.ReactNode }) =>
  value ? (
    <div className="space-y-1">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</h4>
      <div className="text-sm">{value}</div>
    </div>
  ) : null;

const Dots = ({ value, label }: { value: number; label: string }) => (
  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
    <span className="text-sm font-medium">{label}</span>
    <div className="flex gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className={`w-3 h-3 rounded-full border-2 ${i < value ? "bg-primary border-primary" : "border-muted-foreground/30"}`} />
      ))}
    </div>
  </div>
);

export default function CoterieDetail() {
  const { id } = useParams<{ id: string }>();
  const { coteries, loading, allCoterieMembers } = useCoteries();
  const { characters } = useCharacters();
  const [editOpen, setEditOpen] = useState(false);

  const coterie = coteries.find(c => c.id === id);
  if (loading) return <Skeleton className="h-96 w-full" />;
  if (!coterie) return <DetailNotFound label="Coterie" backTo="/characters" />;

  const memberIds = allCoterieMembers.filter(m => m.coterie_id === coterie.id).map(m => m.character_id);
  const members = characters.filter(c => memberIds.includes(c.id));

  return (
    <div>
      <DetailPageHeader
        title={coterie.name}
        backTo="/characters"
        subtitle={
          <div className="flex flex-wrap gap-2 items-center">
            {coterie.is_primary && <Badge variant="default">Primary</Badge>}
            {coterie.coterie_type && <span className="text-sm">{coterie.coterie_type}</span>}
            {coterie.city && <span className="text-sm text-muted-foreground">· {coterie.city}</span>}
          </div>
        }
        actions={
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
            <Edit className="h-4 w-4 mr-1" /> Manage
          </Button>
        }
      />

      <div className="space-y-6 max-w-4xl">
        {coterie.description && (
          <section className="space-y-2">
            <h3 className="text-sm font-medium">Description</h3>
            <MentionText text={coterie.description} className="text-sm text-muted-foreground whitespace-pre-wrap" />
          </section>
        )}

        <Card className="p-4 space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Domain</h3>
          <Dots value={coterie.chasse} label="Chasse" />
          <Dots value={coterie.portillon} label="Portillon" />
          <Dots value={coterie.lien} label="Lien" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <Field label="Territory" value={coterie.domain} />
            <Field label="Resonance" value={coterie.domain_resonance} />
          </div>
        </Card>

        <Card className="p-4 space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Haven / Hangout</h3>
          <Field label="Location" value={coterie.haven_location} />
        </Card>

        <section className="space-y-2">
          <h3 className="text-sm font-medium flex items-center gap-2"><Users className="h-4 w-4" /> Members</h3>
          {members.length ? (
            <div className="flex flex-wrap gap-2">
              {members.map(m => (
                <Link key={m.id} to={`/characters/${m.id}`}>
                  <Badge variant="outline" className="cursor-pointer hover:bg-accent">{m.name}</Badge>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No members yet</p>
          )}
        </section>

        {coterie.coterie_advantages_and_flaws && (
          <Field label="Advantages & Flaws" value={<MentionText text={coterie.coterie_advantages_and_flaws} className="whitespace-pre-wrap text-muted-foreground" />} />
        )}
        {coterie.coterie_boons_and_debts && (
          <Field label="Boons & Debts" value={<MentionText text={coterie.coterie_boons_and_debts} className="whitespace-pre-wrap text-muted-foreground" />} />
        )}
        {coterie.chronicle_tenets && (
          <Field label="Chronicle Tenets" value={<MentionText text={coterie.chronicle_tenets} className="whitespace-pre-wrap text-muted-foreground" />} />
        )}
        {coterie.coterie_goals && (
          <Field label="Coterie Goals" value={<MentionText text={coterie.coterie_goals} className="whitespace-pre-wrap text-muted-foreground" />} />
        )}

        {coterie.attachments && coterie.attachments.length > 0 && (
          <CharacterAttachmentsGallery attachments={coterie.attachments} />
        )}
      </div>

      <ManageCoterieDialog coterie={editOpen ? coterie : null} open={editOpen} onOpenChange={setEditOpen} />
    </div>
  );
}
