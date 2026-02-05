 import { useState } from 'react';
 import { Layout } from '@/components/Layout';
 import { Button } from '@/components/ui/button';
 import { Card } from '@/components/ui/card';
 import { Input } from '@/components/ui/input';
 import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuTrigger,
 } from '@/components/ui/dropdown-menu';
 import {
   AlertDialog,
   AlertDialogAction,
   AlertDialogCancel,
   AlertDialogContent,
   AlertDialogDescription,
   AlertDialogFooter,
   AlertDialogHeader,
   AlertDialogTitle,
 } from '@/components/ui/alert-dialog';
 import { Plus, Search, MapPin, MoreVertical, Eye, Pencil, Trash2 } from 'lucide-react';
 import { useLocations, Location } from '@/hooks/useLocations';
 import { CreateLocationDialog } from '@/components/dialogs/CreateLocationDialog';
 import { EditLocationDialog } from '@/components/dialogs/EditLocationDialog';
 import { ViewLocationDialog } from '@/components/dialogs/ViewLocationDialog';
 import { MentionText } from '@/components/mentions/MentionText';
 
 export default function Locations() {
   const { locations, isLoading, deleteLocation } = useLocations();
   const [searchQuery, setSearchQuery] = useState('');
   const [createOpen, setCreateOpen] = useState(false);
   const [editLocation, setEditLocation] = useState<Location | null>(null);
   const [viewLocation, setViewLocation] = useState<Location | null>(null);
   const [deleteTarget, setDeleteTarget] = useState<Location | null>(null);
 
   const filteredLocations = locations.filter(loc =>
     loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
     loc.description?.toLowerCase().includes(searchQuery.toLowerCase())
   );
 
   const handleDelete = async () => {
     if (!deleteTarget) return;
     await deleteLocation.mutateAsync(deleteTarget.id);
     setDeleteTarget(null);
   };
 
   return (
     <Layout>
       <div className="space-y-6">
         <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
           <div>
             <h1 className="text-3xl font-bold">Locations</h1>
             <p className="text-muted-foreground mt-1">
               Manage places in your chronicle
             </p>
           </div>
           <Button onClick={() => setCreateOpen(true)}>
             <Plus className="h-4 w-4 mr-2" />
             Add Location
           </Button>
         </div>
 
         <div className="relative max-w-md">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
           <Input
             placeholder="Search locations..."
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
             className="pl-10"
           />
         </div>
 
         {isLoading ? (
           <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
             {[1, 2, 3].map(i => (
               <Card key={i} className="p-4 animate-pulse">
                 <div className="h-5 bg-muted rounded w-1/2 mb-2" />
                 <div className="h-4 bg-muted rounded w-full" />
               </Card>
             ))}
           </div>
         ) : filteredLocations.length === 0 ? (
           <Card className="p-8 text-center">
             <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
             <h3 className="text-lg font-medium mb-2">
               {searchQuery ? 'No locations found' : 'No locations yet'}
             </h3>
             <p className="text-muted-foreground mb-4">
               {searchQuery
                 ? 'Try adjusting your search'
                 : 'Create your first location to start building your world'}
             </p>
             {!searchQuery && (
               <Button onClick={() => setCreateOpen(true)}>
                 <Plus className="h-4 w-4 mr-2" />
                 Add Location
               </Button>
             )}
           </Card>
         ) : (
           <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
             {filteredLocations.map(location => (
               <Card
                 key={location.id}
                 className="p-4 hover:border-primary/50 transition-colors cursor-pointer group"
                 onClick={() => setViewLocation(location)}
               >
                 <div className="flex items-start justify-between gap-2">
                   <div className="flex items-center gap-2 min-w-0">
                     <MapPin className="h-4 w-4 text-primary shrink-0" />
                     <h3 className="font-medium truncate">{location.name}</h3>
                   </div>
                   <DropdownMenu>
                     <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                       <Button
                         variant="ghost"
                         size="icon"
                         className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                       >
                         <MoreVertical className="h-4 w-4" />
                       </Button>
                     </DropdownMenuTrigger>
                     <DropdownMenuContent align="end">
                       <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setViewLocation(location); }}>
                         <Eye className="h-4 w-4 mr-2" />
                         View
                       </DropdownMenuItem>
                       <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setEditLocation(location); }}>
                         <Pencil className="h-4 w-4 mr-2" />
                         Edit
                       </DropdownMenuItem>
                       <DropdownMenuItem
                         className="text-destructive"
                         onClick={(e) => { e.stopPropagation(); setDeleteTarget(location); }}
                       >
                         <Trash2 className="h-4 w-4 mr-2" />
                         Delete
                       </DropdownMenuItem>
                     </DropdownMenuContent>
                   </DropdownMenu>
                 </div>
                 {location.description && (
                   <MentionText
                     text={location.description}
                     className="text-sm text-muted-foreground mt-2 line-clamp-2"
                   />
                 )}
               </Card>
             ))}
           </div>
         )}
       </div>
 
       <CreateLocationDialog open={createOpen} onOpenChange={setCreateOpen} />
       <EditLocationDialog location={editLocation} open={!!editLocation} onOpenChange={(open) => !open && setEditLocation(null)} />
       <ViewLocationDialog location={viewLocation} open={!!viewLocation} onOpenChange={(open) => !open && setViewLocation(null)} />
 
       <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
         <AlertDialogContent>
           <AlertDialogHeader>
             <AlertDialogTitle>Delete Location</AlertDialogTitle>
             <AlertDialogDescription>
               Are you sure you want to delete "{deleteTarget?.name}"? This action cannot be undone.
             </AlertDialogDescription>
           </AlertDialogHeader>
           <AlertDialogFooter>
             <AlertDialogCancel>Cancel</AlertDialogCancel>
             <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
               Delete
             </AlertDialogAction>
           </AlertDialogFooter>
         </AlertDialogContent>
       </AlertDialog>
     </Layout>
   );
 }