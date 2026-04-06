import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCharacters, SimpleDicePool, DicePoolConfig } from "@/hooks/useCharacters";
import { useChronicles } from "@/hooks/useChronicles";
import { Plus } from "lucide-react";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { PortraitGenerator } from "@/components/character/PortraitGenerator";

const MORTAL_TEMPLATES = {
  none: { pool: 0, health: 0, willpower: 0, label: "Custom (full attributes)" },
  weak: { pool: 3, health: 2, willpower: 2, label: "Weak (children, elderly, infirm)" },
  average: { pool: 5, health: 4, willpower: 3, label: "Average (ordinary mortal)" },
  gifted: { pool: 7, health: 5, willpower: 4, label: "Gifted (trained professional)" },
  deadly: { pool: 10, health: 6, willpower: 5, label: "Deadly (elite combatant)" },
} as const;

type MortalTemplateKey = keyof typeof MORTAL_TEMPLATES;

const characterSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  clan: z.string().min(1, "Clan is required"),
  concept: z.string().max(200, "Concept must be less than 200 characters").optional(),
  type: z.enum(["PC", "NPC"]),
  generation: z.number().int().min(1).max(15),
  status: z.string().min(1, "Status is required"),
});

const clans = [
  "Human", "Ghoul", "Banu Haqim", "Brujah", "Gangrel", "Hecata", "Lasombra", "Malkavian", 
  "Ministry", "Nosferatu", "Ravnos", "Salubri", "Toreador", "Tremere", 
  "Tzimisce", "Ventrue", "Caitiff", "Thin-Blood"
];

const statuses = ["Active", "Ally", "Enemy", "Neutral", "Unknown", "Inactive", "Missing", "Dead"];

interface CreateCharacterDialogProps {
  children: React.ReactNode;
}

export function CreateCharacterDialog({ children }: CreateCharacterDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    name: "",
    clan: "",
    concept: "",
    type: "PC" as "PC" | "NPC",
    generation: 13,
    status: "Active",
    difficulty: 3,
    avatarUrl: null as string | null,
    mortalTemplate: "none" as MortalTemplateKey,
  });
  
  const { createCharacter } = useCharacters();
  const { currentChronicle, createDefaultChronicle } = useChronicles();
  const { toast } = useToast();

  const clearFieldError = (field: string) => {
    setErrors(prev => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    try {
      const validated = characterSchema.parse({
        ...formData,
        concept: formData.concept || undefined,
      });
      
      setLoading(true);

      let chronicleId = currentChronicle?.id;
      if (!chronicleId) {
        const defaultChronicle = await createDefaultChronicle();
        chronicleId = defaultChronicle.id;
      }

      const isMortal = (validated.clan === "Human" || validated.clan === "Ghoul") && formData.mortalTemplate !== "none";
      const isNpcWithDicePools = validated.type === "NPC";
      const usesDicePools = isNpcWithDicePools || isMortal;

      let dicePoolConfig: DicePoolConfig | null = null;
      let healthMax: number | undefined;
      let willpowerMax: number | undefined;

      if (isMortal) {
        const tmpl = MORTAL_TEMPLATES[formData.mortalTemplate];
        dicePoolConfig = { type: "simple", difficulty: Math.ceil(tmpl.pool / 2) } as SimpleDicePool;
        healthMax = tmpl.health;
        willpowerMax = tmpl.willpower;
      } else if (isNpcWithDicePools) {
        dicePoolConfig = { type: "simple", difficulty: formData.difficulty } as SimpleDicePool;
      }

      await createCharacter({
        name: validated.name,
        clan: validated.clan,
        concept: validated.concept || null,
        type: validated.type,
        generation: validated.type === "NPC" || validated.clan === "Human" ? null : validated.generation,
        status: validated.status,
        sire: null,
        coterie: null,
        chronicle_id: chronicleId,
        avatar_url: formData.avatarUrl,
        use_dice_pools: usesDicePools,
        skip_attributes: usesDicePools,
        dice_pools: dicePoolConfig,
        skills: usesDicePools ? {} : undefined,
        health_max: healthMax,
        willpower_max: willpowerMax,
      } as any);

      setFormData({
        name: "",
        clan: "",
        concept: "",
        type: "PC",
        generation: 13,
        status: "Active",
        difficulty: 3,
        avatarUrl: null,
        mortalTemplate: "none",
      });
      
      setOpen(false);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.issues.forEach(issue => {
          const field = issue.path[0]?.toString();
          if (field) fieldErrors[field] = issue.message;
        });
        setErrors(fieldErrors);
      }
    } finally {
      setLoading(false);
    }
  };

  const FieldError = ({ field }: { field: string }) => 
    errors[field] ? <p className="text-xs text-destructive mt-1">{errors[field]}</p> : null;

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setErrors({}); }}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto bg-gradient-subtle border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Quick Create Character</DialogTitle>
          <DialogDescription>
            {formData.type === "NPC" 
              ? "Quickly add an NPC with simple dice pools" 
              : "Add a new character to your chronicle"}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* AI Portrait Generator */}
          <div className="flex justify-center py-1">
            <PortraitGenerator
              details={{
                name: formData.name,
                clan: formData.clan,
                concept: formData.concept,
              }}
              avatarUrl={formData.avatarUrl}
              onPortraitGenerated={(url) => setFormData(prev => ({ ...prev, avatarUrl: url }))}
              onPortraitRemoved={() => setFormData(prev => ({ ...prev, avatarUrl: null }))}
              size="sm"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => { setFormData(prev => ({ ...prev, name: e.target.value })); clearFieldError('name'); }}
              placeholder="Character name"
              className={`bg-input border-border ${errors.name ? 'border-destructive' : ''}`}
              required
            />
            <FieldError field="name" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="clan">Clan *</Label>
              <Select value={formData.clan} onValueChange={(value) => { setFormData(prev => ({ ...prev, clan: value, mortalTemplate: (value === "Human" || value === "Ghoul") ? prev.mortalTemplate : "none" })); clearFieldError('clan'); }}>
                <SelectTrigger className={`bg-input border-border ${errors.clan ? 'border-destructive' : ''}`}>
                  <SelectValue placeholder="Select clan" />
                </SelectTrigger>
                <SelectContent>
                  {clans.map((clan) => (
                    <SelectItem key={clan} value={clan}>{clan}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError field="clan" />
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

          {(formData.clan === "Human" || formData.clan === "Ghoul") && (
            <Card className="p-4 bg-muted/30 space-y-3">
              <div className="text-sm font-medium">Mortal Template</div>
              <p className="text-xs text-muted-foreground">
                Use a V5 mortal template for quick stats, or choose Custom for full attributes.
              </p>
              <Select 
                value={formData.mortalTemplate} 
                onValueChange={(value: MortalTemplateKey) => setFormData(prev => ({ ...prev, mortalTemplate: value }))}
              >
                <SelectTrigger className="bg-input border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(MORTAL_TEMPLATES) as [MortalTemplateKey, typeof MORTAL_TEMPLATES[MortalTemplateKey]][]).map(([key, tmpl]) => (
                    <SelectItem key={key} value={key}>{tmpl.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formData.mortalTemplate !== "none" && (
                <div className="text-xs text-muted-foreground">
                  <strong>{MORTAL_TEMPLATES[formData.mortalTemplate].pool} dice</strong> pool · 
                  Health <strong>{MORTAL_TEMPLATES[formData.mortalTemplate].health}</strong> · 
                  Willpower <strong>{MORTAL_TEMPLATES[formData.mortalTemplate].willpower}</strong>
                </div>
              )}
            </Card>
          )}

          {formData.type === "PC" && (
            <div className="grid grid-cols-2 gap-4">
              {formData.clan !== "Human" && (
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
              )}

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
          )}

          {formData.type === "NPC" && formData.clan !== "Human" && formData.clan !== "Ghoul" && (
            <Card className="p-4 bg-muted/30 space-y-4">
              <div className="text-sm font-medium">Dice Pool Settings</div>
              <p className="text-xs text-muted-foreground">
                Quick NPCs use simple dice pools. Players roll against the difficulty; the NPC rolls 2× that value.
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="difficulty">Difficulty</Label>
                  <Input
                    id="difficulty"
                    type="number"
                    min="1"
                    max="10"
                    value={formData.difficulty}
                    onChange={(e) => setFormData(prev => ({ ...prev, difficulty: parseInt(e.target.value) || 3 }))}
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

              <div className="text-xs text-muted-foreground">
                NPC rolls <strong>{formData.difficulty * 2} dice</strong> for actions
              </div>
            </Card>
          )}

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
