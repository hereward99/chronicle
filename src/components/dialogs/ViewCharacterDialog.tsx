import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Crown, User, Skull, Calendar, Users, X } from "lucide-react";
import { Character } from "@/hooks/useCharacters";
import { Button } from "@/components/ui/button";

interface ViewCharacterDialogProps {
  character: Character | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const getClanIcon = (clan: string) => {
  switch (clan) {
    case "Ventrue": return <Crown className="h-4 w-4" />;
    case "Nosferatu": return <Skull className="h-4 w-4" />;
    default: return <User className="h-4 w-4" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "Active": return "default";
    case "Ally": return "secondary";
    case "Enemy": return "destructive";
    default: return "outline";
  }
};

const getImageAttachments = (attachments: any[]) => {
  return attachments?.filter(att => att.type?.startsWith('image/')) || [];
};

export function ViewCharacterDialog({ character, open, onOpenChange }: ViewCharacterDialogProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  if (!character) return null;

  const imageAttachments = getImageAttachments(character.attachments || []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gradient-subtle border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground">Character Details</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Character Header */}
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16 border-2 border-border">
              <AvatarImage src={character.avatar_url || ""} />
              <AvatarFallback className="bg-secondary text-secondary-foreground text-lg">
                {character.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-foreground">{character.name}</h3>
              <div className="flex items-center space-x-2 mt-1">
                {getClanIcon(character.clan)}
                <span className="text-muted-foreground">{character.clan}</span>
              </div>
            </div>
          </div>

          <Separator className="bg-border" />

          {/* Character Details */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Type</span>
              <Badge variant={character.type === "PC" ? "default" : "secondary"}>
                {character.type}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Generation</span>
              <Badge variant="outline">{character.generation}th</Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Status</span>
              <Badge variant={getStatusColor(character.status) as any}>
                {character.status}
              </Badge>
            </div>

            {character.concept && (
              <div>
                <span className="text-sm font-medium text-muted-foreground">Concept</span>
                <p className="text-sm text-foreground mt-1 italic">"{character.concept}"</p>
              </div>
            )}

            {character.sire && (
              <div>
                <span className="text-sm font-medium text-muted-foreground">Sire</span>
                <p className="text-sm text-foreground mt-1">{character.sire}</p>
              </div>
            )}

            {character.coterie && (
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">Coterie</span>
                <span className="text-sm text-foreground">{character.coterie}</span>
              </div>
            )}

            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>Created {new Date(character.created_at).toLocaleDateString()}</span>
            </div>

            {/* Image Gallery */}
            {imageAttachments.length > 0 && (
              <div>
                <Separator className="bg-border mb-4" />
                <span className="text-sm font-medium text-muted-foreground block mb-3">
                  Images ({imageAttachments.length})
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {imageAttachments.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(img.url)}
                      className="relative aspect-square rounded overflow-hidden border border-border bg-secondary hover:opacity-80 transition-opacity cursor-pointer"
                    >
                      <img 
                        src={img.url} 
                        alt={img.name} 
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>

      {/* Full-size Image Dialog */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl w-full p-0 bg-background/95 border-border">
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 z-10 bg-background/80 hover:bg-background"
              onClick={() => setSelectedImage(null)}
            >
              <X className="h-4 w-4" />
            </Button>
            {selectedImage && (
              <img 
                src={selectedImage} 
                alt="Full size" 
                className="w-full h-auto max-h-[80vh] object-contain"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}