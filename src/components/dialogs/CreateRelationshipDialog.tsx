import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { MentionInput } from "@/components/mentions/MentionInput";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Relationship } from "@/hooks/useRelationships";
import { Character } from "@/hooks/useCharacters";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface CreateRelationshipDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  characters: Character[];
  onCreate: (relationship: Omit<Relationship, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<any>;
  defaultCharacterId?: string;
  defaultRelatedCharacterId?: string;
}

const relationshipTypes = ['Ally', 'Rival', 'Contact', 'Friend', 'Enemy'];
const symmetricTypes = new Set(['Ally', 'Friend', 'Enemy', 'Rival']);

interface CharacterPickerProps {
  characters: Character[];
  value: string;
  onChange: (id: string) => void;
  placeholder: string;
  excludeId?: string;
}

function CharacterPicker({ characters, value, onChange, placeholder, excludeId }: CharacterPickerProps) {
  const [open, setOpen] = useState(false);
  const selected = characters.find((c) => c.id === value);
  const options = characters.filter((c) => c.id !== excludeId);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          {selected ? (
            <span className="truncate">
              {selected.name} <span className="text-muted-foreground">({selected.clan})</span>
            </span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search characters..." />
          <CommandList>
            <CommandEmpty>No characters found.</CommandEmpty>
            <CommandGroup>
              {options.map((char) => (
                <CommandItem
                  key={char.id}
                  value={`${char.name} ${char.clan}`}
                  onSelect={() => {
                    onChange(char.id);
                    setOpen(false);
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4", value === char.id ? "opacity-100" : "opacity-0")} />
                  <span className="truncate">
                    {char.name} <span className="text-muted-foreground">({char.clan})</span>
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export function CreateRelationshipDialog({ 
  open, 
  onOpenChange, 
  characters,
  onCreate,
  defaultCharacterId,
  defaultRelatedCharacterId,
}: CreateRelationshipDialogProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    character_id: "",
    related_character_id: "",
    relationship_type: "Contact",
    intensity: 3,
    description: "",
    is_mutual: false,
    notes: "",
  });

  // Apply pre-filled defaults each time the dialog opens
  useEffect(() => {
    if (open) {
      setFormData((prev) => ({
        ...prev,
        character_id: defaultCharacterId ?? prev.character_id,
        related_character_id: defaultRelatedCharacterId ?? prev.related_character_id,
        // Default mutual on for symmetric types
        is_mutual: symmetricTypes.has(prev.relationship_type),
      }));
    }
  }, [open, defaultCharacterId, defaultRelatedCharacterId]);

  const handleTypeChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      relationship_type: value,
      // Auto-toggle mutual based on symmetry, but only if user hasn't diverged
      is_mutual: symmetricTypes.has(value),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.character_id || !formData.related_character_id) {
      toast({
        title: "Validation error",
        description: "Please select both characters",
        variant: "destructive",
      });
      return;
    }

    if (formData.character_id === formData.related_character_id) {
      toast({
        title: "Validation error",
        description: "A character cannot have a relationship with themselves",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    try {
      await onCreate({
        character_id: formData.character_id,
        related_character_id: formData.related_character_id,
        relationship_type: formData.relationship_type,
        intensity: formData.intensity,
        description: formData.description || null,
        is_mutual: formData.is_mutual,
        notes: formData.notes || null,
      });
      
      setFormData({
        character_id: "",
        related_character_id: "",
        relationship_type: "Contact",
        intensity: 3,
        description: "",
        is_mutual: false,
        notes: "",
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating relationship:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Relationship</DialogTitle>
          <DialogDescription>
            Define a relationship between two characters
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>From Character *</Label>
            <CharacterPicker
              characters={characters}
              value={formData.character_id}
              onChange={(id) => setFormData((prev) => ({ ...prev, character_id: id }))}
              placeholder="Select character"
              excludeId={formData.related_character_id}
            />
          </div>

          <div className="space-y-2">
            <Label>To Character *</Label>
            <CharacterPicker
              characters={characters}
              value={formData.related_character_id}
              onChange={(id) => setFormData((prev) => ({ ...prev, related_character_id: id }))}
              placeholder="Select character"
              excludeId={formData.character_id}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="relationship_type">Relationship Type *</Label>
            <Select 
              value={formData.relationship_type} 
              onValueChange={handleTypeChange}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {relationshipTypes.map((type) => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Intensity: {formData.intensity} / 5</Label>
            <Slider
              value={[formData.intensity]}
              onValueChange={([value]) => setFormData(prev => ({ ...prev, intensity: value }))}
              min={1}
              max={5}
              step={1}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_mutual"
              checked={formData.is_mutual}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_mutual: checked }))}
            />
            <Label htmlFor="is_mutual">Mutual Relationship</Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <MentionInput
              id="description"
              value={formData.description}
              onChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
              placeholder="Describe the relationship... Use @ to mention entities"
              className="min-h-20 resize-none"
              maxLength={2000}
            />
            <p className="text-xs text-muted-foreground">Type @ to mention characters, stories, sessions, etc.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <MentionInput
              id="notes"
              value={formData.notes}
              onChange={(value) => setFormData(prev => ({ ...prev, notes: value }))}
              placeholder="Additional notes... Use @ to mention entities"
              className="min-h-16 resize-none"
              maxLength={2000}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Relationship"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
