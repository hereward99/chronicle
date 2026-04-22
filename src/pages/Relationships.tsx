import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useRelationships, Relationship } from '@/hooks/useRelationships';
import { useCharacters, Character } from '@/hooks/useCharacters';
import { useFactions, Faction } from '@/hooks/useFactions';
import { useCoteries } from '@/hooks/useCoteries';
import { useChronicles } from '@/hooks/useChronicles';
import { useSearchHighlight } from '@/hooks/useSearchHighlight';
import { TextHighlight } from '@/components/ui/text-highlight';
import { Plus, Users, Heart, Swords, Handshake, UserCircle, Edit, Network, Flag, UserPlus, Search, Filter, X, UsersRound, MapPin, Trash2, Star } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { CreateRelationshipDialog } from '@/components/dialogs/CreateRelationshipDialog';
import { EditRelationshipDialog } from '@/components/dialogs/EditRelationshipDialog';
import { CreateCoterieDialog } from '@/components/dialogs/CreateCoterieDialog';
import { ManageCoterieDialog } from '@/components/dialogs/ManageCoterieDialog';
import { RelationshipGraph } from '@/components/relationship/RelationshipGraph';
import { ReactFlowProvider } from 'reactflow';
import { ViewCharacterDialog } from '@/components/dialogs/ViewCharacterDialog';
import { CreateFactionDialog } from '@/components/dialogs/CreateFactionDialog';
import { EditFactionDialog } from '@/components/dialogs/EditFactionDialog';
import { ManageFactionMembersDialog } from '@/components/dialogs/ManageFactionMembersDialog';
import { EmptyState } from '@/components/onboarding/EmptyState';
import type { Coterie } from '@/hooks/useCoteries';
import { MentionText } from '@/components/mentions/MentionText';
import { SuggestedRelationships } from '@/components/relationship/SuggestedRelationships';
import { getRelationshipBadgeClassName } from '@/lib/relationshipStyles';

const relationshipIcons: Record<string, any> = {
  'Ally': Handshake,
  'Rival': Swords,
  'Contact': UserCircle,
  'Friend': Heart,
  'Enemy': Swords,
};

export default function Relationships() {
  const { relationships, loading, createRelationship, updateRelationship, deleteRelationship } = useRelationships();
  const { characters } = useCharacters();
  const { currentChronicle } = useChronicles();
  const { 
    factions, 
    characterFactions, 
    createFaction, 
    updateFaction, 
    deleteFaction,
    addCharacterToFaction,
    removeCharacterFromFaction 
  } = useFactions(currentChronicle?.id);
  const { coteries, loading: coteriesLoading, getCoterieMembers, allCoterieMembers, setPrimaryCoterie } = useCoteries();
  const { searchQuery: highlightQuery } = useSearchHighlight();
  
  const [selectedCharacter, setSelectedCharacter] = useState<string>('all');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createDialogDefaults, setCreateDialogDefaults] = useState<{ from?: string; to?: string }>({});
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedRelationship, setSelectedRelationship] = useState<Relationship | null>(null);
  const [viewCharacterDialogOpen, setViewCharacterDialogOpen] = useState(false);
  const [viewCharacter, setViewCharacter] = useState<Character | null>(null);
  const [createFactionDialogOpen, setCreateFactionDialogOpen] = useState(false);
  const [editFactionDialogOpen, setEditFactionDialogOpen] = useState(false);
  const [selectedFaction, setSelectedFaction] = useState<Faction | null>(null);
  const [manageMembersDialogOpen, setManageMembersDialogOpen] = useState(false);
  const [showCreateCoterieDialog, setShowCreateCoterieDialog] = useState(false);
  const [selectedCoterie, setSelectedCoterie] = useState<Coterie | null>(null);
  const [memberCounts, setMemberCounts] = useState<Record<string, number>>({});

  const openCreateDialog = (from?: string, to?: string) => {
    setCreateDialogDefaults({ from, to });
    setCreateDialogOpen(true);
  };

  const handleCreateDialogChange = (open: boolean) => {
    setCreateDialogOpen(open);
    if (!open) setCreateDialogDefaults({});
  };

  useEffect(() => {
    const fetchMemberCounts = async () => {
      for (const coterie of coteries) {
        const members = await getCoterieMembers(coterie.id);
        setMemberCounts(prev => ({ ...prev, [coterie.id]: members.length }));
      }
    };
    if (coteries.length > 0) {
      fetchMemberCounts();
    }
  }, [coteries]);

  // Primary coterie member IDs for graph centering
  const primaryCharacterIds = useMemo(() => {
    const primaryCoterie = coteries.find(c => c.is_primary);
    if (!primaryCoterie) return [];
    return allCoterieMembers
      .filter(cm => cm.coterie_id === primaryCoterie.id)
      .map(cm => cm.character_id);
  }, [coteries, allCoterieMembers]);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedRelTypes, setSelectedRelTypes] = useState<string[]>([]);
  const [selectedFactions, setSelectedFactions] = useState<string[]>([]);
  const [selectedCoteries, setSelectedCoteries] = useState<string[]>([]);
  const [selectedCharTypes, setSelectedCharTypes] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedClans, setSelectedClans] = useState<string[]>([]);

  const handleEdit = (relationship: Relationship) => {
    setSelectedRelationship(relationship);
    setEditDialogOpen(true);
  };

  const handleNodeClick = (characterId: string) => {
    const character = characters.find(c => c.id === characterId);
    if (character) {
      setViewCharacter(character);
      setViewCharacterDialogOpen(true);
    }
  };

  const handleEditFaction = (faction: Faction) => {
    setSelectedFaction(faction);
    setEditFactionDialogOpen(true);
  };

  const handleManageMembers = (faction: Faction) => {
    setSelectedFaction(faction);
    setManageMembersDialogOpen(true);
  };

  const handleCreateRelationshipFromGraph = (sourceId: string, targetId: string) => {
    openCreateDialog(sourceId, targetId);
  };

  const getCharacterName = (id: string) => {
    return characters.find(c => c.id === id)?.name || 'Unknown';
  };

  // Get unique values for filters
  const uniqueClans = useMemo(() => 
    Array.from(new Set(characters.map(c => c.clan))).sort(),
    [characters]
  );
  
  const relationshipTypes = ['Ally', 'Rival', 'Contact', 'Friend', 'Enemy'];
  const characterTypes = ['PC', 'NPC'];
  const characterStatuses = ['Active', 'Inactive', 'Retired', 'Dead'];

  // Advanced filtering logic
  const filteredRelationships = useMemo(() => {
    let filtered = relationships;

    // Filter by selected character (existing functionality)
    if (selectedCharacter !== 'all') {
      filtered = filtered.filter(r => 
        r.character_id === selectedCharacter || r.related_character_id === selectedCharacter
      );
    }

    // Filter by relationship type
    if (selectedRelTypes.length > 0) {
      filtered = filtered.filter(r => selectedRelTypes.includes(r.relationship_type));
    }

    // Filter by character search, faction, type, status, or clan
    if (searchQuery || selectedFactions.length > 0 || selectedCoteries.length > 0 || selectedCharTypes.length > 0 || 
        selectedStatuses.length > 0 || selectedClans.length > 0) {
      filtered = filtered.filter(r => {
        const char1 = characters.find(c => c.id === r.character_id);
        const char2 = characters.find(c => c.id === r.related_character_id);
        
        if (!char1 || !char2) return false;

        // Search query
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          const matchesSearch = 
            char1.name.toLowerCase().includes(query) ||
            char2.name.toLowerCase().includes(query);
          if (!matchesSearch) return false;
        }

        // Faction filter
        if (selectedFactions.length > 0) {
          const char1Factions = characterFactions
            .filter(cf => cf.character_id === char1.id)
            .map(cf => cf.faction_id);
          const char2Factions = characterFactions
            .filter(cf => cf.character_id === char2.id)
            .map(cf => cf.faction_id);
          
          const hasMatchingFaction = 
            char1Factions.some(f => selectedFactions.includes(f)) ||
            char2Factions.some(f => selectedFactions.includes(f));
          
          if (!hasMatchingFaction) return false;
        }

        // Coterie filter
        if (selectedCoteries.length > 0) {
          const char1Coteries = allCoterieMembers
            .filter(cm => cm.character_id === char1.id)
            .map(cm => cm.coterie_id);
          const char2Coteries = allCoterieMembers
            .filter(cm => cm.character_id === char2.id)
            .map(cm => cm.coterie_id);
          
          const hasMatchingCoterie = 
            char1Coteries.some(c => selectedCoteries.includes(c)) ||
            char2Coteries.some(c => selectedCoteries.includes(c));
          
          if (!hasMatchingCoterie) return false;
        }

        // Character type filter
        if (selectedCharTypes.length > 0) {
          const matchesType = 
            selectedCharTypes.includes(char1.type) ||
            selectedCharTypes.includes(char2.type);
          if (!matchesType) return false;
        }

        // Status filter
        if (selectedStatuses.length > 0) {
          const matchesStatus = 
            selectedStatuses.includes(char1.status) ||
            selectedStatuses.includes(char2.status);
          if (!matchesStatus) return false;
        }

        // Clan filter
        if (selectedClans.length > 0) {
          const matchesClan = 
            selectedClans.includes(char1.clan) ||
            selectedClans.includes(char2.clan);
          if (!matchesClan) return false;
        }

        return true;
      });
    }

    return filtered;
  }, [
    relationships, 
    selectedCharacter, 
    selectedRelTypes, 
    searchQuery, 
    selectedFactions,
    selectedCoteries,
    selectedCharTypes, 
    selectedStatuses, 
    selectedClans,
    characters,
    characterFactions,
    allCoterieMembers
  ]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedRelTypes([]);
    setSelectedFactions([]);
    setSelectedCoteries([]);
    setSelectedCharTypes([]);
    setSelectedStatuses([]);
    setSelectedClans([]);
  };

  const activeFilterCount = 
    (searchQuery ? 1 : 0) +
    selectedRelTypes.length +
    selectedFactions.length +
    selectedCoteries.length +
    selectedCharTypes.length +
    selectedStatuses.length +
    selectedClans.length;

  const getIntensityLabel = (intensity: number) => {
    const labels = ['Very Weak', 'Weak', 'Moderate', 'Strong', 'Very Strong'];
    return labels[intensity - 1] || 'Unknown';
  };

  return (
    <div className="space-y-6 overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold mb-2">Relationship Map</h1>
          <p className="text-muted-foreground">
            Track connections, alliances, and rivalries between characters
          </p>
        </div>
        <Button
          onClick={() => openCreateDialog(selectedCharacter !== 'all' ? selectedCharacter : undefined)}
          className="shrink-0 self-start"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Relationship
        </Button>
      </div>

      {/* Filter Panel */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Search className="w-5 h-5 text-muted-foreground" />
              <CardTitle className="text-lg">Search & Filter</CardTitle>
              {activeFilterCount > 0 && (
                <Badge variant="secondary">{activeFilterCount} active</Badge>
              )}
            </div>
            {activeFilterCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="w-4 h-4 mr-2" />
                Clear All
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search characters..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={selectedCharacter} onValueChange={setSelectedCharacter}>
              <SelectTrigger className="w-full sm:w-[250px]">
                <SelectValue placeholder="Focus on character" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Characters</SelectItem>
                {characters.map(char => (
                  <SelectItem key={char.id} value={char.id}>
                    {char.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Collapsible open={filterOpen} onOpenChange={setFilterOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full">
                <Filter className="w-4 h-4 mr-2" />
                Advanced Filters
                {activeFilterCount > 0 && ` (${activeFilterCount})`}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Relationship Type Filter */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Relationship Type</Label>
                  <div className="space-y-2">
                    {relationshipTypes.map(type => (
                      <div key={type} className="flex items-center space-x-2">
                        <Checkbox
                          id={`rel-${type}`}
                          checked={selectedRelTypes.includes(type)}
                          onCheckedChange={(checked) => {
                            setSelectedRelTypes(
                              checked 
                                ? [...selectedRelTypes, type]
                                : selectedRelTypes.filter(t => t !== type)
                            );
                          }}
                        />
                        <label htmlFor={`rel-${type}`} className="text-sm cursor-pointer">
                          {type}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Faction Filter */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Faction</Label>
                  <div className="space-y-2">
                    {factions.map(faction => (
                      <div key={faction.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`faction-${faction.id}`}
                          checked={selectedFactions.includes(faction.id)}
                          onCheckedChange={(checked) => {
                            setSelectedFactions(
                              checked 
                                ? [...selectedFactions, faction.id]
                                : selectedFactions.filter(f => f !== faction.id)
                            );
                          }}
                        />
                        <label htmlFor={`faction-${faction.id}`} className="text-sm cursor-pointer flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: faction.color }}
                          />
                          {faction.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Coterie Filter */}
                {coteries.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Coterie</Label>
                    <div className="space-y-2">
                      {coteries.map(coterie => (
                        <div key={coterie.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`coterie-${coterie.id}`}
                            checked={selectedCoteries.includes(coterie.id)}
                            onCheckedChange={(checked) => {
                              setSelectedCoteries(
                                checked 
                                  ? [...selectedCoteries, coterie.id]
                                  : selectedCoteries.filter(c => c !== coterie.id)
                              );
                            }}
                          />
                          <label htmlFor={`coterie-${coterie.id}`} className="text-sm cursor-pointer">
                            {coterie.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Character Type Filter */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Character Type</Label>
                  <div className="space-y-2">
                    {characterTypes.map(type => (
                      <div key={type} className="flex items-center space-x-2">
                        <Checkbox
                          id={`type-${type}`}
                          checked={selectedCharTypes.includes(type)}
                          onCheckedChange={(checked) => {
                            setSelectedCharTypes(
                              checked 
                                ? [...selectedCharTypes, type]
                                : selectedCharTypes.filter(t => t !== type)
                            );
                          }}
                        />
                        <label htmlFor={`type-${type}`} className="text-sm cursor-pointer">
                          {type}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Status Filter */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Status</Label>
                  <div className="space-y-2">
                    {characterStatuses.map(status => (
                      <div key={status} className="flex items-center space-x-2">
                        <Checkbox
                          id={`status-${status}`}
                          checked={selectedStatuses.includes(status)}
                          onCheckedChange={(checked) => {
                            setSelectedStatuses(
                              checked 
                                ? [...selectedStatuses, status]
                                : selectedStatuses.filter(s => s !== status)
                            );
                          }}
                        />
                        <label htmlFor={`status-${status}`} className="text-sm cursor-pointer">
                          {status}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Clan Filter */}
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-sm font-medium">Clan</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {uniqueClans.map(clan => (
                      <div key={clan} className="flex items-center space-x-2">
                        <Checkbox
                          id={`clan-${clan}`}
                          checked={selectedClans.includes(clan)}
                          onCheckedChange={(checked) => {
                            setSelectedClans(
                              checked 
                                ? [...selectedClans, clan]
                                : selectedClans.filter(c => c !== clan)
                            );
                          }}
                        />
                        <label htmlFor={`clan-${clan}`} className="text-sm cursor-pointer">
                          {clan}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>

      <SuggestedRelationships
        characters={characters}
        relationships={relationships}
        factions={factions}
        characterFactions={characterFactions}
        coteries={coteries}
        allCoterieMembers={allCoterieMembers}
        chronicleId={currentChronicle?.id}
        onAccept={createRelationship}
      />

      <Tabs defaultValue="graph" className="space-y-4">
        <TabsList className="w-full flex-wrap h-auto gap-1">
          <TabsTrigger value="graph" className="gap-2 flex-1 min-w-0">
            <Network className="w-4 h-4 shrink-0" />
            <span className="truncate">Graph View</span>
          </TabsTrigger>
          <TabsTrigger value="list" className="gap-2 flex-1 min-w-0">
            <Users className="w-4 h-4 shrink-0" />
            <span className="truncate">List View</span>
          </TabsTrigger>
          <TabsTrigger value="factions" className="gap-2 flex-1 min-w-0">
            <Flag className="w-4 h-4 shrink-0" />
            <span className="truncate">Factions</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="graph" className="space-y-4">
          {loading ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">Loading graph...</p>
              </CardContent>
            </Card>
          ) : filteredRelationships.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Network className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">No relationships to display</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Create relationships to see the network graph
                </p>
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Relationship
                </Button>
              </CardContent>
            </Card>
          ) : (
            <ReactFlowProvider>
              <RelationshipGraph
                relationships={filteredRelationships}
                characters={characters}
                factions={factions}
                characterFactions={characterFactions}
                primaryCharacterIds={primaryCharacterIds}
                onNodeClick={handleNodeClick}
                onEdgeClick={handleEdit}
                onCreateRelationship={handleCreateRelationshipFromGraph}
              />
            </ReactFlowProvider>
          )}
        </TabsContent>

        <TabsContent value="list" className="space-y-4">

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-6 bg-muted rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-20 bg-muted rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredRelationships.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">No relationships found</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Start building your character network
                </p>
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Relationship
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredRelationships.map(relationship => {
                const Icon = relationshipIcons[relationship.relationship_type] || UserCircle;
                const colorClass = getRelationshipBadgeClassName(relationship.relationship_type);
                
                return (
                  <Card key={relationship.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-xl mb-2">
                            {getCharacterName(relationship.character_id)}
                            <span className="mx-2 text-muted-foreground">→</span>
                            {getCharacterName(relationship.related_character_id)}
                          </CardTitle>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className={colorClass}>
                              <Icon className="w-3 h-3 mr-1" />
                              {relationship.relationship_type}
                            </Badge>
                            <Badge variant="secondary">
                              {getIntensityLabel(relationship.intensity)}
                            </Badge>
                            {relationship.is_mutual && (
                              <Badge variant="outline">Mutual</Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Add another relationship from this character"
                            onClick={() => openCreateDialog(relationship.character_id)}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Edit relationship"
                            onClick={() => handleEdit(relationship)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    {relationship.description && (
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          {relationship.description}
                        </p>
                        {relationship.notes && (
                          <p className="text-xs text-muted-foreground mt-2 italic">
                            Note: {relationship.notes}
                          </p>
                        )}
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="factions" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Factions & Groups</h2>
              <p className="text-sm text-muted-foreground">
                Organize characters into factions and see group dynamics
              </p>
            </div>
            <Button onClick={() => setCreateFactionDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Faction
            </Button>
          </div>

          {factions.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Flag className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">No factions yet</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Create factions to organize your characters into groups
                </p>
                <Button onClick={() => setCreateFactionDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Faction
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {factions.map(faction => {
                const members = characterFactions
                  .filter(cf => cf.faction_id === faction.id)
                  .map(cf => characters.find(c => c.id === cf.character_id))
                  .filter(Boolean) as Character[];

                return (
                  <Card 
                    key={faction.id} 
                    className="hover:shadow-lg transition-shadow overflow-hidden min-w-0"
                    style={{ borderTop: `4px solid ${faction.color}` }}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: faction.color }}
                            />
                            {faction.name}
                          </CardTitle>
                          {faction.description && (
                            <CardDescription className="mt-2">
                              {faction.description}
                            </CardDescription>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditFaction(faction)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">
                            {members.length} member{members.length !== 1 ? 's' : ''}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleManageMembers(faction)}
                          >
                            <UserPlus className="w-4 h-4 mr-2" />
                            Manage
                          </Button>
                        </div>
                        {members.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {members.slice(0, 5).map(member => (
                              <Badge key={member.id} variant="secondary" className="text-xs">
                                {member.name}
                              </Badge>
                            ))}
                            {members.length > 5 && (
                              <Badge variant="outline" className="text-xs">
                                +{members.length - 5} more
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Coteries Section */}
      <div className="border-t border-border pt-8 mt-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <UsersRound className="h-6 w-6" />
              Coteries
            </h2>
            <p className="text-muted-foreground text-sm mt-1">
              Manage your vampire coteries and their members
            </p>
          </div>
          <Button onClick={() => setShowCreateCoterieDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Coterie
          </Button>
        </div>

        {coteriesLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : coteries.length === 0 ? (
          <EmptyState
            icon={<UsersRound className="h-7 w-7" />}
            title="No coteries yet"
            description="Coteries are groups of vampires who band together for survival, politics, or shared goals. Create one and assign characters to it."
            tip="Create your characters first, then group them into coteries. You can assign roles like Leader or Enforcer."
            action={
              <Button onClick={() => setShowCreateCoterieDialog(true)} className="bg-gradient-blood hover:opacity-90 shadow-crimson">
                <Plus className="h-4 w-4 mr-2" />
                Create First Coterie
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {coteries.map((coterie) => (
              <Card key={coterie.id} data-entity-id={coterie.id} className={`hover:shadow-lg transition-shadow overflow-hidden text-left ${coterie.is_primary ? 'ring-2 ring-primary' : ''}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3 w-full">
                    <div className="flex items-start gap-2 min-w-0 flex-1">
                      <UsersRound className="h-5 w-5 shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1 text-left">
                        <CardTitle className="text-lg leading-snug text-left [overflow-wrap:normal] [word-break:normal] hyphens-none">
                          <TextHighlight text={coterie.name} highlight={highlightQuery} />
                        </CardTitle>
                        {coterie.is_primary && (
                          <Badge variant="default" className="mt-2 inline-flex text-xs gap-1 align-middle">
                            <Star className="h-3 w-3" />
                            Primary
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      {!coterie.is_primary && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setPrimaryCoterie(coterie.id)}
                          title="Set as primary coterie"
                        >
                          <Star className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedCoterie(coterie)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {coterie.description && (
                    <MentionText
                      text={coterie.description}
                      className="mt-2 block w-full text-left text-sm text-muted-foreground break-words whitespace-pre-wrap"
                    />
                  )}
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  {coterie.domain && (
                    <div className="flex items-start gap-2 text-sm text-muted-foreground w-full text-left">
                      <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
                      <MentionText
                        text={coterie.domain}
                        className="block min-w-0 flex-1 text-left break-words whitespace-pre-wrap"
                      />
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {memberCounts[coterie.id] || 0} members
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <CreateRelationshipDialog
        open={createDialogOpen}
        onOpenChange={handleCreateDialogChange}
        characters={characters}
        onCreate={createRelationship}
        defaultCharacterId={createDialogDefaults.from}
        defaultRelatedCharacterId={createDialogDefaults.to}
      />

      <EditRelationshipDialog
        relationship={selectedRelationship}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        characters={characters}
        onUpdate={updateRelationship}
        onDelete={deleteRelationship}
      />

      <ViewCharacterDialog
        character={viewCharacter}
        open={viewCharacterDialogOpen}
        onOpenChange={setViewCharacterDialogOpen}
      />

      {currentChronicle && (
        <>
          <CreateFactionDialog
            open={createFactionDialogOpen}
            onOpenChange={setCreateFactionDialogOpen}
            chronicleId={currentChronicle.id}
            onCreate={createFaction}
          />

          <EditFactionDialog
            faction={selectedFaction}
            open={editFactionDialogOpen}
            onOpenChange={setEditFactionDialogOpen}
            onUpdate={updateFaction}
            onDelete={deleteFaction}
          />

          <ManageFactionMembersDialog
            faction={selectedFaction}
            open={manageMembersDialogOpen}
            onOpenChange={setManageMembersDialogOpen}
            characters={characters}
            characterFactions={characterFactions}
            onAddCharacter={addCharacterToFaction}
            onRemoveCharacter={removeCharacterFromFaction}
          />
        </>
      )}

      <CreateCoterieDialog
        open={showCreateCoterieDialog}
        onOpenChange={setShowCreateCoterieDialog}
      />

      <ManageCoterieDialog
        open={!!selectedCoterie}
        onOpenChange={(open) => !open && setSelectedCoterie(null)}
        coterie={selectedCoterie}
      />
    </div>
  );
}
