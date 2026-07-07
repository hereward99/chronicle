import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Edit, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useFactions } from "@/hooks/useFactions";
import { useCharacters } from "@/hooks/useCharacters";
import { EditFactionDialog } from "@/components/dialogs/EditFactionDialog";
import { MentionText } from "@/components/mentions/MentionText";
import { DetailPageHeader, DetailNotFound } from "@/components/DetailPageHeader";

export default function FactionDetail() {
  const { id } = useParams<{ id: string }>();
  const { factions, loading, characterFactions, updateFaction, deleteFaction } = useFactions();
  const { characters } = useCharacters();
  const [editOpen, setEditOpen] = useState(false);

  const faction = factions.find(f => f.id === id);
  if (loading) return <Skeleton className="h-96 w-full" />;
  if (!faction) return <DetailNotFound label="Faction" backTo="/relationships" />;

  const memberIds = (characterFactions || []).filter(cf => cf.faction_id === faction.id).map(cf => cf.character_id);
  const members = characters.filter(c => memberIds.includes(c.id));

  return (
    <div>
      <DetailPageHeader
        title={faction.name}
        backTo="/relationships"
        parentLabel="Factions"
        subtitle={
          <span className="inline-flex items-center gap-2">
            <span className="w-3 h-3 rounded-full border" style={{ background: faction.color }} />
            <span className="text-sm text-muted-foreground">Faction color</span>
          </span>
        }
        actions={
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
            <Edit className="h-4 w-4 mr-1" /> Edit
          </Button>
        }
      />

      <div className="space-y-6 max-w-4xl">
        {faction.description && (
          <section className="space-y-2">
            <h3 className="text-sm font-medium">Description</h3>
            <MentionText text={faction.description} className="text-sm text-muted-foreground whitespace-pre-wrap" />
          </section>
        )}

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
      </div>

      <EditFactionDialog
        faction={editOpen ? faction : null}
        open={editOpen}
        onOpenChange={setEditOpen}
        onUpdate={updateFaction}
        onDelete={deleteFaction}
      />
    </div>
  );
}
