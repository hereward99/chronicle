import { useState } from "react";
import { useParams } from "react-router-dom";
import { MapPin, ExternalLink, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocations } from "@/hooks/useLocations";
import { EditLocationDialog } from "@/components/dialogs/EditLocationDialog";
import { MentionText } from "@/components/mentions/MentionText";
import { CharacterAttachmentsGallery } from "@/components/character/CharacterAttachmentsGallery";
import { getZoomForCoordinates } from "@/lib/coordinateZoom";
import { DetailPageHeader, DetailNotFound } from "@/components/DetailPageHeader";

export default function LocationDetail() {
  const { id } = useParams<{ id: string }>();
  const { locations, isLoading } = useLocations();
  const [editOpen, setEditOpen] = useState(false);

  const location = locations.find(l => l.id === id);
  if (isLoading) return <Skeleton className="h-96 w-full" />;
  if (!location) return <DetailNotFound label="Location" backTo="/locations" />;

  return (
    <div>
      <DetailPageHeader
        title={location.name}
        backTo="/locations"
        subtitle={
          (location.country || location.city_region) && (
            <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" /> {[location.city_region, location.country].filter(Boolean).join(", ")}</span>
          )
        }
        actions={
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
            <Edit className="h-4 w-4 mr-1" /> Edit
          </Button>
        }
      />

      <div className="space-y-4 max-w-4xl">
        {location.description && (
          <section className="space-y-2">
            <h3 className="text-sm font-medium">Description</h3>
            <MentionText text={location.description} className="text-sm text-muted-foreground whitespace-pre-wrap" />
          </section>
        )}

        {location.coordinates && (
          <section className="space-y-2">
            <h3 className="text-sm font-medium">Coordinates</h3>
            <a
              href={`https://www.google.com/maps/d/u/0/viewer?mid=1Y2Zyar_gNkgjPoLZ7Q9Vmo5x-obp4WA&ll=${encodeURIComponent(location.coordinates)}&z=${getZoomForCoordinates(location.coordinates)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
            >
              <MapPin className="h-3.5 w-3.5" />
              {location.coordinates}
              <ExternalLink className="h-3 w-3" />
            </a>
          </section>
        )}

        {location.notes && (
          <section className="space-y-2">
            <h3 className="text-sm font-medium">Notes</h3>
            <MentionText text={location.notes} className="text-sm text-muted-foreground whitespace-pre-wrap" />
          </section>
        )}

        {location.attachments && location.attachments.length > 0 && (
          <CharacterAttachmentsGallery attachments={location.attachments} />
        )}
      </div>

      <EditLocationDialog location={editOpen ? location : null} open={editOpen} onOpenChange={setEditOpen} />
    </div>
  );
}
