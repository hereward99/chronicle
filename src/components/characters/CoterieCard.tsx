import { useState } from "react";
import {
  EntityCard,
  EntityCardContent,
  EntityCardHeaderBar,
  CardIconAction,
} from "@/components/ui/entity-card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { DotRating } from "./DotRating";
import { DotRatedDisplay } from "./DotRatedList";
import { Users, MapPin, ChevronDown, Pencil, Star, FileText } from "lucide-react";
import type { Coterie } from "@/hooks/useCoteries";
import type { Character } from "@/hooks/useCharacters";
import { MentionText } from "@/components/mentions/MentionText";
import { exportCoterieToPDF } from "@/lib/pdfExport";
import { PdfExportButton } from "@/components/PdfExportButton";

interface CoterieCardProps {
  coterie: Coterie;
  members: Character[];
  onEdit: (coterie: Coterie) => void;
  onSetPrimary: (id: string) => void;
}

export function CoterieCard({ coterie, members, onEdit, onSetPrimary }: CoterieCardProps) {
  const [open, setOpen] = useState(false);

  const attachments = Array.isArray(coterie.attachments) ? coterie.attachments : [];
  const images = attachments.filter((a: Record<string, unknown>) => typeof a.type === 'string' && (a.type as string).startsWith("image/"));
  const docs = attachments.filter((a: Record<string, unknown>) => typeof a.type !== 'string' || !(a.type as string).startsWith("image/"));

  return (
    <EntityCard entityId={coterie.id} highlighted={coterie.is_primary}>
      <EntityCardHeaderBar
        leading={<Users className="h-5 w-5 text-primary" />}
        title={
          <span className="flex items-center gap-2">
            {coterie.name}
            {coterie.is_primary && (
              <Badge variant="default" className="text-xs">Primary</Badge>
            )}
          </span>
        }
        subtitle={
          (coterie.coterie_type || coterie.city) && (
            <>
              {coterie.coterie_type && <span>{coterie.coterie_type}</span>}
              {coterie.city && (
                <>
                  {coterie.coterie_type && <span>·</span>}
                  <MapPin className="h-3 w-3" />
                  <span><MentionText text={coterie.city} /></span>
                </>
              )}
            </>
          )
        }
        actions={
          <>
            <CardIconAction
              label={coterie.is_primary ? "Primary coterie" : "Set as primary coterie"}
              onClick={() => onSetPrimary(coterie.id)}
            >
              <Star className={`h-4 w-4 ${coterie.is_primary ? "fill-primary text-primary" : ""}`} />
            </CardIconAction>
            <PdfExportButton
              variant="ghost"
              iconOnly
              toolbar
              title="Export as PDF"
              onExport={(theme) => exportCoterieToPDF(coterie, members, theme)}
            />
            <CardIconAction label="Edit coterie" onClick={() => onEdit(coterie)}>
              <Pencil className="h-4 w-4" />
            </CardIconAction>
          </>
        }
      />
      {coterie.description && (
        <div className="px-6 -mt-2 pb-3">
          <p className="text-sm text-muted-foreground">
            <MentionText text={coterie.description} />
          </p>
        </div>
      )}


      <EntityCardContent className="space-y-3 pt-0">
        {/* Domain */}
        {(coterie.chasse > 0 || coterie.portillon > 0 || coterie.lien > 0 || coterie.domain_merits || coterie.domain_resonance) && (
          <div className="space-y-2 p-3 rounded-md bg-secondary/30">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Domain</h4>
            <DotRating value={coterie.chasse} label="Chasse" />
            <DotRating value={coterie.portillon} label="Portillon" />
            <DotRating value={coterie.lien} label="Lien" />
            {coterie.domain_resonance && (
              <p className="text-sm"><span className="text-muted-foreground">Resonance:</span> {coterie.domain_resonance}</p>
            )}
            <DotRatedDisplay value={coterie.domain_merits} />
          </div>
        )}

        {/* Haven */}
        {(coterie.haven_location || coterie.haven_merits_and_flaws) && (
          <div className="space-y-1 p-3 rounded-md bg-secondary/30">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Haven / Hangout</h4>
            {coterie.haven_location && <p className="text-sm"><MentionText text={coterie.haven_location} /></p>}
            <DotRatedDisplay value={coterie.haven_merits_and_flaws} />
          </div>
        )}

        {/* Social Ledger */}
        {(coterie.coterie_advantages_and_flaws || coterie.coterie_boons_and_debts) && (
          <div className="space-y-1 p-3 rounded-md bg-secondary/30">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Social Ledger</h4>
            {coterie.coterie_advantages_and_flaws && (
              <p className="text-sm">{coterie.coterie_advantages_and_flaws}</p>
            )}
            {coterie.coterie_boons_and_debts && (
              <p className="text-sm text-muted-foreground">{coterie.coterie_boons_and_debts}</p>
            )}
          </div>
        )}

        {/* Ideology */}
        {(coterie.chronicle_tenets || coterie.coterie_goals) && (
          <div className="space-y-1 p-3 rounded-md bg-secondary/30">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ideology & Ambition</h4>
            {coterie.chronicle_tenets && (
              <p className="text-sm"><span className="text-muted-foreground">Tenets:</span> {coterie.chronicle_tenets}</p>
            )}
            {coterie.coterie_goals && (
              <p className="text-sm"><span className="text-muted-foreground">Goals:</span> {coterie.coterie_goals}</p>
            )}
          </div>
        )}

        {/* Members */}
        <Collapsible open={open} onOpenChange={setOpen}>
          <CollapsibleTrigger className="flex items-center gap-2 w-full text-left py-1 group">
            <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=closed]:-rotate-90" />
            <span className="text-sm font-medium">{members.length} Members</span>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-2 space-y-1">
              {members.map(m => (
                <div key={m.id} className="flex items-center gap-2 text-sm px-6">
                  <span className="font-medium">{m.name}</span>
                  <span className="text-muted-foreground">· {m.clan}</span>
                </div>
              ))}
              {members.length === 0 && (
                <p className="text-sm text-muted-foreground px-6">No members yet</p>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Attachments */}
        {attachments.length > 0 && (
          <div className="space-y-2 pt-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Attachments</h4>
            {images.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {images.map((img: any) => (
                  <a key={img.id} href={img.url} target="_blank" rel="noopener noreferrer">
                    <img src={img.url} alt={img.name} className="h-16 w-16 object-cover rounded border border-border" />
                  </a>
                ))}
              </div>
            )}
            {docs.map((doc: any) => (
              <a
                key={doc.id}
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-primary hover:underline"
              >
                <FileText className="h-3 w-3" />
                {doc.name}
              </a>
            ))}
          </div>
        )}
      </EntityCardContent>
    </EntityCard>
  );
}
