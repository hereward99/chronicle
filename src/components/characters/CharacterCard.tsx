import {
  EntityCard,
  EntityCardContent,
  EntityCardHeaderBar,
  CardIconAction,
} from "@/components/ui/entity-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Crown, User, Skull, FileText, Eye, Pencil } from "lucide-react";
import { Character } from "@/hooks/useCharacters";
import { TextHighlight } from "@/components/ui/text-highlight";
import { statusBadgeClass } from "@/lib/statusColors";

interface CharacterCardProps {
  character: Character;
  highlightQuery: string;
  onView: (character: Character) => void;
  onEdit: (character: Character) => void;
}

const getClanIcon = (clan: string) => {
  switch (clan) {
    case "Ventrue":
      return <Crown className="h-4 w-4" />;
    case "Nosferatu":
      return <Skull className="h-4 w-4" />;
    default:
      return <User className="h-4 w-4" />;
  }
};

const getImageAttachments = (attachments: any[]) =>
  attachments?.filter((att) => att.type?.startsWith("image/")) || [];

const getDocumentAttachments = (attachments: any[]) =>
  attachments?.filter(
    (att) =>
      att.type?.includes("pdf") ||
      att.type?.includes("document") ||
      att.type?.includes("text") ||
      att.name?.match(/\.(pdf|doc|docx|txt|rtf)$/i),
  ) || [];

export function CharacterCard({
  character,
  highlightQuery,
  onView,
  onEdit,
}: CharacterCardProps) {
  return (
    <EntityCard entityId={character.id} variant="panel">
      <EntityCardHeaderBar
        leading={
          <Avatar className="h-12 w-12 border-2 border-border">
            <AvatarImage src={character.avatar_url || ""} />
            <AvatarFallback className="bg-secondary text-secondary-foreground">
              {character.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
        }
        title={<TextHighlight text={character.name} highlight={highlightQuery} />}
        subtitle={
          <>
            {getClanIcon(character.clan)}
            <span>{character.clan}</span>
          </>
        }
        badge={
          <Badge className={statusBadgeClass("character", character.status)}>
            {character.status}
          </Badge>
        }
        actions={
          <>
            <CardIconAction label="View character" onClick={() => onView(character)}>
              <Eye className="h-4 w-4" />
            </CardIconAction>
            <CardIconAction label="Edit character" onClick={() => onEdit(character)}>
              <Pencil className="h-4 w-4" />
            </CardIconAction>
          </>
        }
      />
      <EntityCardContent className="space-y-3">
        {character.clan !== "Human" && character.clan !== "Ghoul" && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Generation</span>
            <Badge variant="outline">
              {character.generation ? `${character.generation}th` : "N/A"}
            </Badge>
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Type</span>
          <Badge variant={character.type === "PC" ? "default" : "secondary"}>
            {character.type}
          </Badge>
        </div>

        <div className="pt-2 border-t border-border">
          <p className="text-sm text-muted-foreground italic">
            "{character.concept}"
          </p>
        </div>

        {getImageAttachments(character.attachments || []).length > 0 && (
          <div className="flex gap-2 pt-2">
            {getImageAttachments(character.attachments || [])
              .slice(0, 3)
              .map((img, idx) => (
                <div
                  key={idx}
                  className="relative w-16 h-16 rounded overflow-hidden border border-border bg-secondary"
                >
                  <img
                    src={img.url}
                    alt={img.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                </div>
              ))}
            {getImageAttachments(character.attachments || []).length > 3 && (
              <div className="w-16 h-16 rounded border border-border flex items-center justify-center bg-secondary">
                <span className="text-xs text-muted-foreground">
                  +{getImageAttachments(character.attachments || []).length - 3}
                </span>
              </div>
            )}
          </div>
        )}

        {getDocumentAttachments(character.attachments || []).length > 0 && (
          <div className="pt-2">
            {getDocumentAttachments(character.attachments || []).map(
              (doc, idx) => (
                <Button
                  key={idx}
                  size="sm"
                  variant="outline"
                  className="w-full justify-start mb-1"
                  onClick={() => window.open(doc.url, "_blank")}
                >
                  <FileText className="h-3 w-3 mr-2" />
                  <span className="truncate text-xs">{doc.name}</span>
                </Button>
              ),
            )}
          </div>
        )}
      </EntityCardContent>
    </EntityCard>
  );
}
