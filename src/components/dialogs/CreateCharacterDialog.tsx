import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCharacters } from "@/hooks/useCharacters";
import { useChronicles } from "@/hooks/useChronicles";
import { Plus } from "lucide-react";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { FileUpload } from "@/components/ui/file-upload";

const characterSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  clan: z.string().min(1, "Clan is required"),
  concept: z.string().max(200, "Concept must be less than 200 characters").optional(),
  type: z.enum(["PC", "NPC"]),
  generation: z.number().int().min(1).max(15),
  status: z.string().min(1, "Status is required"),
  sire: z.string().max(100, "Sire name must be less than 100 characters").optional(),
  coterie: z.string().max(100, "Coterie name must be less than 100 characters").optional(),
});

const clans = [
  "Banu Haqim", "Brujah", "Gangrel", "Hecata", "Lasombra", "Malkavian", 
  "Ministry", "Nosferatu", "Ravnos", "Salubri", "Toreador", "Tremere", 
  "Tzimisce", "Ventrue", "Caitiff", "Thin-Blood"
];

const statuses = ["Active", "Ally", "Enemy", "Neutral", "Dead"];

interface CreateCharacterDialogProps {
  children: React.ReactNode;
}

export function CreateCharacterDialog({ children }: CreateCharacterDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    clan: "",
    concept: "",
    type: "PC" as "PC" | "NPC",
    generation: 13,
    status: "Active",
    sire: "",
    coterie: "",
    attachments: [] as any[]
  });
  
  const { createCharacter } = useCharacters();
  const { currentChronicle, createDefaultChronicle } = useChronicles();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const validated = characterSchema.parse({
        ...formData,
        concept: formData.concept || undefined,
        sire: formData.sire || undefined,
        coterie: formData.coterie || undefined,
      });
      
      setLoading(true);

      // Ensure we have a chronicle
      let chronicleId = currentChronicle?.id;
      if (!chronicleId) {
        const defaultChronicle = await createDefaultChronicle();
        chronicleId = defaultChronicle.id;
      }

      await createCharacter({
        name: validated.name,
        clan: validated.clan,
        concept: validated.concept || null,
        type: validated.type,
        generation: validated.generation,
        status: validated.status,
        sire: validated.sire || null,
        coterie: validated.coterie || null,
        chronicle_id: chronicleId,
        avatar_url: null,
      } as any); // Type assertion to handle attachments

      // Reset form
      setFormData({
        name: "",
        clan: "",
        concept: "",
        type: "PC",
        generation: 13,
        status: "Active",
        sire: "",
        coterie: "",
        attachments: []
      });
      
      setOpen(false);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation error",
          description: error.issues[0].message,
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto bg-gradient-subtle border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Create New Character</DialogTitle>
          <DialogDescription>
            Add a new character to your chronicle
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Character name"
              className="bg-input border-border"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="clan">Clan *</Label>
              <Select value={formData.clan} onValueChange={(value) => setFormData(prev => ({ ...prev, clan: value }))}>
                <SelectTrigger className="bg-input border-border">
                  <SelectValue placeholder="Select clan" />
                </SelectTrigger>
                <SelectContent>
                  {clans.map((clan) => (
                    <SelectItem key={clan} value={clan}>{clan}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Type *</Label>
              <Select value={formData.type} onValueChange={(value: "PC" | "NPC") => setFormData(prev => ({ ...prev, type: value }))}>
                <SelectTrigger className="bg-input border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PC">Player Character</SelectItem>
                  <SelectItem value="NPC">Non-Player Character</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="generation">Generation</Label>
              <Input
                id="generation"
                type="number"
                min="1"
                max="15"
                value={formData.generation}
                onChange={(e) => setFormData(prev => ({ ...prev, generation: parseInt(e.target.value) || 13 }))}
                className="bg-input border-border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                <SelectTrigger className="bg-input border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((status) => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="concept">Concept</Label>
            <Input
              id="concept"
              value={formData.concept}
              onChange={(e) => setFormData(prev => ({ ...prev, concept: e.target.value }))}
              placeholder="Character concept (optional)"
              className="bg-input border-border"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sire">Sire</Label>
              <Input
                id="sire"
                value={formData.sire}
                onChange={(e) => setFormData(prev => ({ ...prev, sire: e.target.value }))}
                placeholder="Sire name (optional)"
                className="bg-input border-border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="coterie">Coterie</Label>
              <Input
                id="coterie"
                value={formData.coterie}
                onChange={(e) => setFormData(prev => ({ ...prev, coterie: e.target.value }))}
                placeholder="Coterie name (optional)"
                className="bg-input border-border"
              />
            </div>
          </div>

          <FileUpload
            bucket="character-files"
            entityId="new-character"
            entityType="character"
            attachments={formData.attachments}
            onAttachmentsChange={(attachments) => setFormData(prev => ({ ...prev, attachments }))}
            accept="image/*,.pdf,.doc,.docx,.txt,.md"
            maxFiles={5}
            maxSize={10}
          />

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" className="bg-gradient-blood hover:opacity-90" disabled={loading}>
              {loading ? "Creating..." : "Create Character"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}