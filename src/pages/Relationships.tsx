import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { useRelationships } from '@/hooks/useRelationships';
import { useCharacters } from '@/hooks/useCharacters';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Heart, Sword, Users, MessageCircle, Shield, Zap } from 'lucide-react';

const relationshipIcons: Record<string, any> = {
  'Ally': Shield,
  'Rival': Sword,
  'Contact': MessageCircle,
  'Enemy': Zap,
  'Friend': Heart,
  'Neutral': Users,
};

const relationshipColors: Record<string, string> = {
  'Ally': 'bg-green-500/10 text-green-500 border-green-500/20',
  'Rival': 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  'Contact': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  'Enemy': 'bg-red-500/10 text-red-500 border-red-500/20',
  'Friend': 'bg-pink-500/10 text-pink-500 border-pink-500/20',
  'Neutral': 'bg-muted text-muted-foreground border-border',
};

export default function Relationships() {
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>('all');
  const { relationships, loading: relLoading } = useRelationships(
    selectedCharacterId === 'all' ? undefined : selectedCharacterId
  );
  const { characters, loading: charLoading } = useCharacters();

  const getCharacterById = (id: string) => {
    return characters.find(c => c.id === id);
  };

  const getIntensityDots = (intensity: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <div
        key={i}
        className={`w-2 h-2 rounded-full ${
          i < intensity ? 'bg-primary' : 'bg-muted'
        }`}
      />
    ));
  };

  if (charLoading || relLoading) {
    return (
      <Layout>
        <div className="container mx-auto p-6 space-y-6">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold mb-2">Relationship Map</h1>
            <p className="text-muted-foreground">
              Track connections, alliances, and rivalries between characters
            </p>
          </div>
          
          <Select value={selectedCharacterId} onValueChange={setSelectedCharacterId}>
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Filter by character" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Relationships</SelectItem>
              {characters.map((character) => (
                <SelectItem key={character.id} value={character.id}>
                  {character.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {relationships.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                No relationships found. Start building your network!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {relationships.map((relationship) => {
              const character = getCharacterById(relationship.character_id);
              const relatedCharacter = getCharacterById(relationship.related_character_id);
              
              if (!character || !relatedCharacter) return null;

              const Icon = relationshipIcons[relationship.relationship_type] || Users;
              const colorClass = relationshipColors[relationship.relationship_type] || relationshipColors['Neutral'];

              return (
                <Card key={relationship.id} className="overflow-hidden">
                  <CardHeader className="pb-4">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={character.avatar_url || undefined} />
                        <AvatarFallback>{character.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>

                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3 flex-wrap">
                          <CardTitle className="text-xl">{character.name}</CardTitle>
                          
                          <Badge variant="outline" className={colorClass}>
                            <Icon className="w-3 h-3 mr-1" />
                            {relationship.relationship_type}
                          </Badge>

                          {relationship.is_mutual && (
                            <Badge variant="secondary" className="text-xs">
                              Mutual
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Intensity:</span>
                          <div className="flex gap-1">
                            {getIntensityDots(relationship.intensity)}
                          </div>
                        </div>
                      </div>

                      <Avatar className="h-16 w-16">
                        <AvatarImage src={relatedCharacter.avatar_url || undefined} />
                        <AvatarFallback>
                          {relatedCharacter.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="space-y-3">
                      {relationship.description && (
                        <div>
                          <p className="text-sm font-medium mb-1">Connection:</p>
                          <p className="text-sm text-muted-foreground">{relationship.description}</p>
                        </div>
                      )}

                      {relationship.notes && (
                        <div>
                          <p className="text-sm font-medium mb-1">Notes:</p>
                          <p className="text-sm text-muted-foreground">{relationship.notes}</p>
                        </div>
                      )}

                      <div className="flex gap-2 text-xs text-muted-foreground pt-2 border-t">
                        <Badge variant="outline" className="font-normal">
                          {character.clan}
                        </Badge>
                        <span>→</span>
                        <Badge variant="outline" className="font-normal">
                          {relatedCharacter.clan}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
