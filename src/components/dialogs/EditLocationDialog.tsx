 import { useState, useEffect } from 'react';
 import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
   DialogFooter,
 } from '@/components/ui/dialog';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Label } from '@/components/ui/label';
 import { MentionInput } from '@/components/mentions/MentionInput';
 import { FileUpload } from '@/components/ui/file-upload';
 import { useLocations, Location } from '@/hooks/useLocations';

 interface EditLocationDialogProps {
   location: Location | null;
   open: boolean;
   onOpenChange: (open: boolean) => void;
 }

 export function EditLocationDialog({ location, open, onOpenChange }: EditLocationDialogProps) {
   const { updateLocation } = useLocations();
     const [formData, setFormData] = useState({
       name: '',
       description: '',
       notes: '',
       coordinates: '',
       country: '',
       city_region: '',
       attachments: [] as any[],
     });

   useEffect(() => {
     if (location) {
        setFormData({
          name: location.name,
          description: location.description || '',
          notes: location.notes || '',
          coordinates: location.coordinates || '',
          attachments: location.attachments || [],
        });
     }
   }, [location]);

   const handleSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
     if (!location) return;

     await updateLocation.mutateAsync({
       id: location.id,
       ...formData,
     });

     onOpenChange(false);
   };

   return (
     <Dialog open={open} onOpenChange={onOpenChange}>
       <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
         <DialogHeader>
           <DialogTitle>Edit Location</DialogTitle>
         </DialogHeader>
         <form onSubmit={handleSubmit} className="space-y-4">
           <div className="space-y-2">
             <Label htmlFor="name">Name *</Label>
             <Input
               id="name"
               value={formData.name}
               onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
               placeholder="Location name"
               required
             />
           </div>

           <div className="space-y-2">
             <Label htmlFor="description">Description</Label>
             <MentionInput
               id="description"
               value={formData.description}
               onChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
               placeholder="Describe this location... (Type @ to mention)"
               className="min-h-[100px]"
               maxLength={2000}
             />
           </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <MentionInput
                id="notes"
                value={formData.notes}
                onChange={(value) => setFormData(prev => ({ ...prev, notes: value }))}
                placeholder="Additional notes... (Type @ to mention)"
                className="min-h-[100px]"
                maxLength={3000}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="coordinates">Google Maps Coordinates</Label>
              <Input
                id="coordinates"
                value={formData.coordinates}
                onChange={(e) => setFormData(prev => ({ ...prev, coordinates: e.target.value }))}
                placeholder="e.g. 51.5074, -0.1278"
              />
              <p className="text-xs text-muted-foreground">Paste latitude, longitude to link directly to Google Maps.</p>
            </div>

           <FileUpload
             bucket="location-files"
             entityId={location?.id || 'new'}
             entityType="location"
             attachments={formData.attachments}
             onAttachmentsChange={(attachments) => setFormData(prev => ({ ...prev, attachments }))}
             accept="image/*,.pdf,.doc,.docx,.txt,.md"
             maxFiles={20}
             maxSize={10}
           />

           <DialogFooter>
             <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
               Cancel
             </Button>
             <Button type="submit" disabled={!formData.name || updateLocation.isPending}>
               {updateLocation.isPending ? 'Saving...' : 'Save Changes'}
             </Button>
           </DialogFooter>
         </form>
       </DialogContent>
     </Dialog>
   );
 }
