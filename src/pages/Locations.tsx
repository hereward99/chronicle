import { useState, useMemo } from 'react';
import { EmptyState } from '@/components/onboarding/EmptyState';
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Plus, Search, MapPin, MoreVertical, Eye, Pencil, Trash2, ChevronRight } from 'lucide-react';
import { useLocations, Location } from '@/hooks/useLocations';
import { CreateLocationDialog } from '@/components/dialogs/CreateLocationDialog';
import { EditLocationDialog } from '@/components/dialogs/EditLocationDialog';
import { ViewLocationDialog } from '@/components/dialogs/ViewLocationDialog';
import { MentionText } from '@/components/mentions/MentionText';
import { useSearchHighlight } from '@/hooks/useSearchHighlight';
import { TextHighlight } from '@/components/ui/text-highlight';
import { getZoomForCoordinates } from '@/lib/coordinateZoom';

interface GroupedLocations {
  [country: string]: {
    [cityRegion: string]: Location[];
  };
}

function LocationCard({
  location,
  highlightQuery,
  onView,
  onEdit,
  onDelete,
}: {
  location: Location;
  highlightQuery: string;
  onView: (l: Location) => void;
  onEdit: (l: Location) => void;
  onDelete: (l: Location) => void;
}) {
  return (
    <Card
      data-entity-id={location.id}
      className="p-4 hover:border-primary/50 transition-colors cursor-pointer group"
      onClick={() => onView(location)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <MapPin className="h-4 w-4 text-primary shrink-0" />
          <h3 className="font-medium truncate">
            <TextHighlight text={location.name} highlight={highlightQuery} />
          </h3>
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
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onView(location); }}>
              <Eye className="h-4 w-4 mr-2" />
              View
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(location); }}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={(e) => { e.stopPropagation(); onDelete(location); }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {location.coordinates && (
        <a
          href={`https://www.google.com/maps/d/u/0/viewer?mid=1Y2Zyar_gNkgjPoLZ7Q9Vmo5x-obp4WA&ll=${encodeURIComponent(location.coordinates)}&z=${getZoomForCoordinates(location.coordinates)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1"
          onClick={(e) => e.stopPropagation()}
        >
          <MapPin className="h-3 w-3" />
          {location.coordinates}
        </a>
      )}
      {location.description && (
        <MentionText
          text={location.description}
          className="text-sm text-muted-foreground mt-2 line-clamp-2"
        />
      )}
    </Card>
  );
}

export default function Locations() {
  const { locations, isLoading, deleteLocation } = useLocations();
  const [searchQuery, setSearchQuery] = useState('');
  const { searchQuery: highlightQuery } = useSearchHighlight();
  const [createOpen, setCreateOpen] = useState(false);
  const [editLocation, setEditLocation] = useState<Location | null>(null);
  const [viewLocation, setViewLocation] = useState<Location | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Location | null>(null);

  const filteredLocations = locations.filter(loc =>
    loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    loc.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    loc.country?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    loc.city_region?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const grouped = useMemo<GroupedLocations>(() => {
    const result: GroupedLocations = {};
    for (const loc of filteredLocations) {
      const country = loc.country?.trim() || 'Ungrouped';
      const city = loc.city_region?.trim() || 'Other';
      if (!result[country]) result[country] = {};
      if (!result[country][city]) result[country][city] = [];
      result[country][city].push(loc);
    }
    return result;
  }, [filteredLocations]);

  const hasGroups = Object.keys(grouped).some(k => k !== 'Ungrouped');
  const sortedCountries = Object.keys(grouped).sort((a, b) => {
    if (a === 'Ungrouped') return 1;
    if (b === 'Ungrouped') return -1;
    return a.localeCompare(b);
  });

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteLocation(deleteTarget.id);
    setDeleteTarget(null);
  };

  const cardProps = {
    highlightQuery,
    onView: setViewLocation,
    onEdit: setEditLocation,
    onDelete: setDeleteTarget,
  };

  return (
    <>
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
          searchQuery ? (
            <EmptyState
              icon={<MapPin className="h-7 w-7" />}
              title="No locations found"
              description="Try adjusting your search."
            />
          ) : (
            <EmptyState
              icon={<MapPin className="h-7 w-7" />}
              title="No locations yet"
              description="Locations ground your chronicle in the real (or imagined) world — Elysiums, havens, hunting grounds, and contested domains."
              tip="Use @ in location notes to link characters who frequent or control each place."
              action={
                <Button onClick={() => setCreateOpen(true)} className="bg-gradient-blood hover:opacity-90 shadow-crimson">
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Location
                </Button>
              }
            />
          )
        ) : !hasGroups ? (
          // No grouping data — flat grid like before
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredLocations.map(location => (
              <LocationCard key={location.id} location={location} {...cardProps} />
            ))}
          </div>
        ) : (
          // Grouped view
          <div className="space-y-4">
            {sortedCountries.map(country => {
              const cities = grouped[country];
              const sortedCities = Object.keys(cities).sort((a, b) => {
                if (a === 'Other') return 1;
                if (b === 'Other') return -1;
                return a.localeCompare(b);
              });

              return (
                <Collapsible key={country} defaultOpen>
                  <CollapsibleTrigger className="flex items-center gap-2 w-full text-left group/country py-2">
                    <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]/country:rotate-90" />
                    <h2 className="text-lg font-semibold">{country}</h2>
                    <span className="text-xs text-muted-foreground">
                      ({Object.values(cities).flat().length})
                    </span>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pl-4 space-y-3 mt-1">
                    {sortedCities.map(city => {
                      const locs = cities[city];
                      const showCityHeader = sortedCities.length > 1 || city !== 'Other';

                      return (
                        <div key={city}>
                          {showCityHeader && (
                            <Collapsible defaultOpen>
                              <CollapsibleTrigger className="flex items-center gap-2 w-full text-left group/city py-1">
                                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground transition-transform group-data-[state=open]/city:rotate-90" />
                                <h3 className="text-sm font-medium text-muted-foreground">{city}</h3>
                                <span className="text-xs text-muted-foreground">({locs.length})</span>
                              </CollapsibleTrigger>
                              <CollapsibleContent>
                                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 mt-2 pl-2">
                                  {locs.map(location => (
                                    <LocationCard key={location.id} location={location} {...cardProps} />
                                  ))}
                                </div>
                              </CollapsibleContent>
                            </Collapsible>
                          )}
                          {!showCityHeader && (
                            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                              {locs.map(location => (
                                <LocationCard key={location.id} location={location} {...cardProps} />
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
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
    </>
  );
}