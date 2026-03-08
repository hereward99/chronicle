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
   });
 
   const handleSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
     if (!chronicleId || !userId) return;
 
     await createLocation.mutateAsync({
       ...formData,
       chronicle_id: chronicleId,
       user_id: userId,
     });
 
     setFormData({ name: '', description: '', notes: '' });
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
 
           <DialogFooter>
             <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
               Cancel
             </Button>
             <Button type="submit" disabled={!formData.name || createLocation.isPending}>
               {createLocation.isPending ? 'Creating...' : 'Create Location'}
             </Button>
           </DialogFooter>
         </form>
       </DialogContent>
     </Dialog>
   );
 }