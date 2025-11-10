import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRelationships, Relationship } from '@/hooks/useRelationships';
import { useCharacters, Character } from '@/hooks/useCharacters';
import { useFactions, Faction } from '@/hooks/useFactions';
import { useChronicles } from '@/hooks/useChronicles';
import { Plus, Users, Heart, Swords, Handshake, UserCircle, Edit, Network, Flag, UserPlus } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CreateRelationshipDialog } from '@/components/dialogs/CreateRelationshipDialog';
import { EditRelationshipDialog } from '@/components/dialogs/EditRelationshipDialog';
import { RelationshipGraph } from '@/components/relationship/RelationshipGraph';
import { ReactFlowProvider } from 'reactflow';
import { ViewCharacterDialog } from '@/components/dialogs/ViewCharacterDialog';
import { CreateFactionDialog } from '@/components/dialogs/CreateFactionDialog';
import { EditFactionDialog } from '@/components/dialogs/EditFactionDialog';
import { ManageFactionMembersDialog } from '@/components/dialogs/ManageFactionMembersDialog';

const relationshipIcons: Record<string, any> = {
  'Ally': Handshake,
  'Rival': Swords,
  'Contact': UserCircle,
  'Friend': Heart,
  'Enemy': Swords,
};

const relationshipColors: Record<string, string> = {
  'Ally': 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  'Rival': 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  'Contact': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  'Friend': 'bg-pink-500/10 text-pink-500 border-pink-500/20',
  'Enemy': 'bg-red-500/10 text-red-500 border-red-500/20',
};

export default function Relationships() {
  const { relationships, loading, createRelationship, updateRelationship, deleteRelationship } = useRelationships();
  const { characters } = useCharacters();
  const { chronicles } = useChronicles();
  const defaultChronicle = chronicles[0];
  const { 
    factions, 
    characterFactions, 
    createFaction, 
    updateFaction, 
    deleteFaction,
    addCharacterToFaction,
    removeCharacterFromFaction 
  } = useFactions(defaultChronicle?.id);
  
  const [selectedCharacter, setSelectedCharacter] = useState<string>('all');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedRelationship, setSelectedRelationship] = useState<Relationship | null>(null);
  const [viewCharacterDialogOpen, setViewCharacterDialogOpen] = useState(false);
  const [viewCharacter, setViewCharacter] = useState<Character | null>(null);
  const [createFactionDialogOpen, setCreateFactionDialogOpen] = useState(false);
  const [editFactionDialogOpen, setEditFactionDialogOpen] = useState(false);
  const [selectedFaction, setSelectedFaction] = useState<Faction | null>(null);
  const [manageMembersDialogOpen, setManageMembersDialogOpen] = useState(false);

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
    // Pre-populate the create dialog with the selected characters
    setCreateDialogOpen(true);
  };

  const getCharacterName = (id: string) => {
    return characters.find(c => c.id === id)?.name || 'Unknown';
  };

  const filteredRelationships = selectedCharacter === 'all' 
    ? relationships 
    : relationships.filter(r => 
        r.character_id === selectedCharacter || r.related_character_id === selectedCharacter
      );

  const getIntensityLabel = (intensity: number) => {
    const labels = ['Very Weak', 'Weak', 'Moderate', 'Strong', 'Very Strong'];
    return labels[intensity - 1] || 'Unknown';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2">Relationship Map</h1>
          <p className="text-muted-foreground">
            Track connections, alliances, and rivalries between characters
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Relationship
        </Button>
      </div>

      <Tabs defaultValue="graph" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="graph" className="gap-2">
              <Network className="w-4 h-4" />
              Graph View
            </TabsTrigger>
            <TabsTrigger value="list" className="gap-2">
              <Users className="w-4 h-4" />
              List View
            </TabsTrigger>
            <TabsTrigger value="factions" className="gap-2">
              <Flag className="w-4 h-4" />
              Factions
            </TabsTrigger>
          </TabsList>
          
          <div className="flex items-center gap-4">
            <Users className="w-5 h-5 text-muted-foreground" />
            <Select value={selectedCharacter} onValueChange={setSelectedCharacter}>
              <SelectTrigger className="w-[280px]">
                <SelectValue placeholder="Filter by character" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Characters</SelectItem>
                {characters.map(char => (
                  <SelectItem key={char.id} value={char.id}>
                    {char.name} ({char.clan})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

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
                const colorClass = relationshipColors[relationship.relationship_type] || 'bg-muted/50 text-muted-foreground border-border';
                
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
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(relationship)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
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
                    className="hover:shadow-lg transition-shadow"
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

      <CreateRelationshipDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        characters={characters}
        onCreate={createRelationship}
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

      {defaultChronicle && (
        <>
          <CreateFactionDialog
            open={createFactionDialogOpen}
            onOpenChange={setCreateFactionDialogOpen}
            chronicleId={defaultChronicle.id}
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
    </div>
  );
}
