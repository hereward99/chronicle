import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Location } from '@/hooks/useLocations';
import { MentionText } from '@/components/mentions/MentionText';
import { CharacterAttachmentsGallery } from '@/components/character/CharacterAttachmentsGallery';
import { MapPin, ExternalLink } from 'lucide-react';
import { getZoomForCoordinates } from '@/lib/coordinateZoom';

 interface ViewLocationDialogProps {
   location: Location | null;
   open: boolean;
   onOpenChange: (open: boolean) => void;
 }

 export function ViewLocationDialog({ location, open, onOpenChange }: ViewLocationDialogProps) {
   if (!location) return null;

   return (
     <Dialog open={open} onOpenChange={onOpenChange}>
       <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
         <DialogHeader>
           <div className="flex items-center gap-2">
             <MapPin className="h-5 w-5 text-primary" />
             <DialogTitle>{location.name}</DialogTitle>
           </div>
         </DialogHeader>
         
         <div className="space-y-4">
           {location.description && (
             <div className="space-y-2">
               <h3 className="text-sm font-medium text-foreground">Description</h3>
               <MentionText 
                 text={location.description} 
                 className="text-sm text-muted-foreground whitespace-pre-wrap" 
               />
             </div>
           )}

            {location.coordinates && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-foreground">Coordinates</h3>
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
              </div>
            )}

            {location.notes && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-foreground">Notes</h3>
                <MentionText 
                  text={location.notes} 
                  className="text-sm text-muted-foreground whitespace-pre-wrap" 
                />
              </div>
            )}

           {location.attachments && location.attachments.length > 0 && (
             <CharacterAttachmentsGallery attachments={location.attachments} />
           )}

           {!location.description && !location.notes && (!location.attachments || location.attachments.length === 0) && (
             <p className="text-sm text-muted-foreground italic">
               No additional details for this location.
             </p>
           )}
         </div>
       </DialogContent>
     </Dialog>
   );
 }
