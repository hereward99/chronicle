import { useState } from "react";
import { useParams } from "react-router-dom";
import { Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCharacters } from "@/hooks/useCharacters";
import { CharacterSheetView } from "@/components/character/CharacterSheetView";
import { EditCharacterDialog } from "@/components/dialogs/EditCharacterDialog";
import { DetailPageHeader, DetailNotFound } from "@/components/DetailPageHeader";

export default function CharacterDetail() {
  const { id } = useParams<{ id: string }>();
  const { characters, loading, updateCharacter, deleteCharacter } = useCharacters();
  const [editOpen, setEditOpen] = useState(false);

  const character = characters.find(c => c.id === id);

  if (loading) return <Skeleton className="h-96 w-full" />;
  if (!character) return <DetailNotFound label="Character" backTo="/characters" />;

  return (
    <div>
      <DetailPageHeader
        title={character.name}
        subtitle={character.concept || character.clan}
        backTo="/characters"
        actions={
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
            <Edit className="h-4 w-4 mr-1" /> Edit
          </Button>
        }
      />
      <CharacterSheetView character={character} />
      <EditCharacterDialog
        character={editOpen ? character : null}
        open={editOpen}
        onOpenChange={setEditOpen}
        onUpdate={updateCharacter}
        onDelete={deleteCharacter}
      />
    </div>
  );
}
