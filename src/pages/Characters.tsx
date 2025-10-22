import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, Crown, User, Skull, Users, FileText, Image as ImageIcon } from "lucide-react";
import { useCharacters, Character } from "@/hooks/useCharacters";
import { CreateCharacterDialog } from "@/components/dialogs/CreateCharacterDialog";
import { ViewCharacterDialog } from "@/components/dialogs/ViewCharacterDialog";
import { EditCharacterDialog } from "@/components/dialogs/EditCharacterDialog";

export default function Characters() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [viewCharacter, setViewCharacter] = useState<Character | null>(null);
  const [editCharacter, setEditCharacter] = useState<Character | null>(null);
  const { characters, loading, updateCharacter, deleteCharacter } = useCharacters();

  const filteredCharacters = characters.filter(character => {
    const matchesSearch = character.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         character.clan.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === "all" || 
                      (activeTab === "pcs" && character.type === "PC") ||
                      (activeTab === "npcs" && character.type === "NPC");
    
    return matchesSearch && matchesTab;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active": return "default";
      case "Ally": return "secondary";
      case "Enemy": return "destructive";
      default: return "outline";
    }
  };

  const getClanIcon = (clan: string) => {
    switch (clan) {
      case "Ventrue": return <Crown className="h-4 w-4" />;
      case "Nosferatu": return <Skull className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  };

  const getImageAttachments = (attachments: any[]) => {
    return attachments?.filter(att => att.type?.startsWith('image/')) || [];
  };

  const getDocumentAttachments = (attachments: any[]) => {
    return attachments?.filter(att => 
      att.type?.includes('pdf') || 
      att.type?.includes('document') || 
      att.type?.includes('text') ||
      att.name?.match(/\.(pdf|doc|docx|txt|rtf)$/i)
    ) || [];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Characters</h1>
          <p className="text-muted-foreground">Manage your chronicle's characters</p>
        </div>
        <CreateCharacterDialog>
          <Button className="bg-gradient-blood hover:opacity-90 shadow-crimson">
            <Plus className="w-4 h-4 mr-2" />
            New Character
          </Button>
        </CreateCharacterDialog>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search characters..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-input border-border"
          />
        </div>
      </div>

      {/* Character Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-secondary border-border">
          <TabsTrigger value="all">All Characters</TabsTrigger>
          <TabsTrigger value="pcs">Player Characters</TabsTrigger>
          <TabsTrigger value="npcs">NPCs</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="bg-gradient-subtle border-border">
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <Skeleton className="h-6 w-full" />
                      <Skeleton className="h-6 w-full" />
                      <Skeleton className="h-6 w-full" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCharacters.map((character) => (
              <Card key={character.id} className="bg-gradient-subtle border-border shadow-gothic hover:shadow-deep transition-all duration-300">
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-12 w-12 border-2 border-border">
                      <AvatarImage src={character.avatar_url || ""} />
                      <AvatarFallback className="bg-secondary text-secondary-foreground">
                        {character.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <CardTitle className="text-lg text-foreground">{character.name}</CardTitle>
                      <div className="flex items-center space-x-2 mt-1">
                        {getClanIcon(character.clan)}
                        <span className="text-sm text-muted-foreground">{character.clan}</span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Generation</span>
                    <Badge variant="outline">{character.generation ? `${character.generation}th` : 'N/A'}</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Type</span>
                    <Badge variant={character.type === "PC" ? "default" : "secondary"}>
                      {character.type}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <Badge variant={getStatusColor(character.status) as any}>
                      {character.status}
                    </Badge>
                  </div>
                  
                  <div className="pt-2 border-t border-border">
                    <p className="text-sm text-muted-foreground italic">
                      "{character.concept}"
                    </p>
                  </div>

                  {/* Image Thumbnails */}
                  {getImageAttachments(character.attachments || []).length > 0 && (
                    <div className="flex gap-2 pt-2">
                      {getImageAttachments(character.attachments || []).slice(0, 3).map((img, idx) => (
                        <div key={idx} className="relative w-16 h-16 rounded overflow-hidden border border-border bg-secondary">
                          <img 
                            src={img.url} 
                            alt={img.name} 
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              console.error('Failed to load image:', img.url);
                              e.currentTarget.style.display = 'none';
                            }}
                            onLoad={() => console.log('Image loaded:', img.url)}
                          />
                        </div>
                      ))}
                      {getImageAttachments(character.attachments || []).length > 3 && (
                        <div className="w-16 h-16 rounded border border-border flex items-center justify-center bg-secondary">
                          <span className="text-xs text-muted-foreground">
                            +{getImageAttachments(character.attachments || []).length - 3}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Document Buttons */}
                  {getDocumentAttachments(character.attachments || []).length > 0 && (
                    <div className="pt-2">
                      {getDocumentAttachments(character.attachments || []).map((doc, idx) => (
                        <Button
                          key={idx}
                          size="sm"
                          variant="outline"
                          className="w-full justify-start mb-1"
                          onClick={() => window.open(doc.url, '_blank')}
                        >
                          <FileText className="h-3 w-3 mr-2" />
                          <span className="truncate text-xs">{doc.name}</span>
                        </Button>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex space-x-2 pt-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex-1 border-border hover:bg-secondary"
                      onClick={() => setViewCharacter(character)}
                    >
                      View
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex-1 border-border hover:bg-secondary"
                      onClick={() => setEditCharacter(character)}
                    >
                      Edit
                    </Button>
                  </div>
                </CardContent>
              </Card>
                ))}
              </div>
            )}

          {!loading && filteredCharacters.length === 0 && (
            <div className="text-center py-12">
              <div className="mb-4">
                <Users className="h-12 w-12 text-muted-foreground mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">No characters found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm ? "Try adjusting your search terms." : "Create your first character to get started."}
              </p>
              <Button className="bg-gradient-blood hover:opacity-90 shadow-crimson">
                <Plus className="w-4 h-4 mr-2" />
                Add Character
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <ViewCharacterDialog
        character={viewCharacter}
        open={!!viewCharacter}
        onOpenChange={(open) => !open && setViewCharacter(null)}
      />

      <EditCharacterDialog
        character={editCharacter}
        open={!!editCharacter}
        onOpenChange={(open) => !open && setEditCharacter(null)}
        onUpdate={updateCharacter}
        onDelete={deleteCharacter}
      />
    </div>
  );
}