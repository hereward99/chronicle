 import { useState } from 'react';
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
 import { useLocations } from '@/hooks/useLocations';

 interface CreateLocationDialogProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
 }

 export function CreateLocationDialog({ open, onOpenChange }: CreateLocationDialogProps) {
   const { createLocation, chronicleId, userId } = useLocations();
     const [formData, setFormData] = useState({
       name: '',
       description: '',
       notes: '',
       coordinates: '',
       country: '',
       city_region: '',
       attachments: [] as Array<{ id: string; name: string; url: string; type: string; size: number; uploaded_at: string }>,
     });

   const handleSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
     if (!chronicleId || !userId) return;

      await createLocation({
        ...formData,
        chronicle_id: chronicleId,
        user_id: userId,
      });

     setFormData({ name: '', description: '', notes: '', coordinates: '', country: '', city_region: '', attachments: [] });
     onOpenChange(false);
   };

   return (
     <Dialog open={open} onOpenChange={onOpenChange}>
       <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
         <DialogHeader>
           <DialogTitle>Create Location</DialogTitle>
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

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                  placeholder="e.g. Canada"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city_region">City / Region</Label>
                <Input
                  id="city_region"
                  value={formData.city_region}
                  onChange={(e) => setFormData(prev => ({ ...prev, city_region: e.target.value }))}
                  placeholder="e.g. Vancouver"
                />
              </div>
            </div>

           <div className="space-y-2">
             <Label htmlFor="description">Description</Label>
             <MentionInput
               id="description"
               value={formData.description}
               onChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
               placeholder="Describe this location..."
               className="min-h-[100px]"
               maxLength={2000}
             />
             <p className="text-xs text-muted-foreground">Type <kbd className="px-1 py-0.5 rounded bg-muted text-foreground font-mono text-[10px]">@</kbd> to link characters, stories, and more.</p>
           </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <MentionInput
                id="notes"
                value={formData.notes}
                onChange={(value) => setFormData(prev => ({ ...prev, notes: value }))}
                placeholder="Additional notes..."
                className="min-h-[100px]"
                maxLength={3000}
              />
              <p className="text-xs text-muted-foreground">Type <kbd className="px-1 py-0.5 rounded bg-muted text-foreground font-mono text-[10px]">@</kbd> to cross-reference other entities.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="coordinates">Google Maps Coordinates</Label>
              <Input
                id="coordinates"
                value={formData.coordinates}
                onChange={(e) => setFormData(prev => ({ ...prev, coordinates: e.target.value }))}
                placeholder="e.g. 51.5074, -0.1278"
              />
              <p className="text-xs text-muted-foreground">Paste latitude, longitude (e.g. <span className="font-mono">48.8566, 2.3522</span>) to link directly to Google Maps.</p>
            </div>

           <FileUpload
             bucket="location-files"
             entityId="new"
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
            <Button type="submit" disabled={!formData.name}>
              Create Location
             </Button>
           </DialogFooter>
         </form>
       </DialogContent>
     </Dialog>
   );
 }
