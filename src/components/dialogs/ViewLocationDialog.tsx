 import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
 } from '@/components/ui/dialog';
 import { Location } from '@/hooks/useLocations';
 import { MentionText } from '@/components/mentions/MentionText';
 import { MapPin } from 'lucide-react';
 
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
 
           {location.notes && (
             <div className="space-y-2">
               <h3 className="text-sm font-medium text-foreground">Notes</h3>
               <MentionText 
                 text={location.notes} 
                 className="text-sm text-muted-foreground whitespace-pre-wrap" 
               />
             </div>
           )}
 
           {!location.description && !location.notes && (
             <p className="text-sm text-muted-foreground italic">
               No additional details for this location.
             </p>
           )}
         </div>
       </DialogContent>
     </Dialog>
   );
 }