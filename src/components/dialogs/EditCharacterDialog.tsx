import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MentionInput } from "@/components/mentions/MentionInput";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileUpload } from "@/components/ui/file-upload";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Trash2, X, Plus, Wand2, AlertTriangle } from "lucide-react";
import { getMaxBloodPotency } from "@/lib/v5/bloodPotencyData";
import { Character, DicePoolConfig, SimpleDicePool, GeneralDicePool, StandardDicePool, CombinedDicePool, ExceptionalPool, useCharacters } from "@/hooks/useCharacters";
import { useFiles } from "@/hooks/useFiles";
import { supabase } from "@/integrations/supabase/client";
import { DISCIPLINES, DISCIPLINE_POWERS, getPowersForDiscipline, type PowerInfo } from "@/lib/v5/disciplineData";
import { useToast } from "@/hooks/use-toast";
import { BoonsSection } from "@/components/boons/BoonsSection";

interface EditCharacterDialogProps {
  character: Character | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (id: string, updates: Partial<Character>) => Promise<any>;
  onDelete: (id: string) => Promise<void>;
}

const clans = [
  "Human", "Ghoul", "Banu Haqim", "Brujah", "Gangrel", "Hecata", "Lasombra", "Malkavian", 
  "Ministry", "Nosferatu", "Ravnos", "Salubri", "Toreador", "Tremere", 
  "Tzimisce", "Ventrue", "Caitiff", "Thin-Blood"
];

const statuses = ["Active", "Ally", "Enemy", "Neutral", "Unknown", "Inactive", "Missing", "Dead"];

const predatorTypes = [
  "None", "Alleycat", "Bagger", "Blood Leech", "Cleaver", "Consensualist", 
  "Farmer", "Osiris", "Sandman", "Scene Queen", "Siren", "Extortionist", "Graverobber"
];

const skillCategories = {
  Physical: ["athletics", "brawl", "craft", "drive", "firearms", "melee", "larceny", "stealth", "survival"],
  Social: ["animal_ken", "etiquette", "insight", "intimidation", "leadership", "performance", "persuasion", "streetwise", "subterfuge"],
  Mental: ["academics", "awareness", "finance", "investigation", "medicine", "occult", "politics", "science", "technology"]
};

const DotSelector = ({ value, max = 5, onChange }: { value: number; max?: number; onChange: (val: number) => void }) => {
  return (
    <div className="flex gap-1">
      {Array.from({ length: max }).map((_, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(i + 1)}
          className={`w-4 h-4 rounded-full border-2 transition-colors ${
            i < value
              ? "bg-primary border-primary" 
              : "border-muted-foreground/30 hover:border-primary/50"
          }`}
        />
      ))}
    </div>
  );
};

export function EditCharacterDialog({ 
  character, 
  open, 
  onOpenChange, 
  onUpdate, 
  onDelete 
}: EditCharacterDialogProps) {
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [generatingPortrait, setGeneratingPortrait] = useState(false);
  const [overrideHealthMax, setOverrideHealthMax] = useState(false);
  const [overrideWillpowerMax, setOverrideWillpowerMax] = useState(false);
  const [customDisciplineFlags, setCustomDisciplineFlags] = useState<Record<number, boolean>>({});
  const [customPowerFlags, setCustomPowerFlags] = useState<Record<number, boolean>>({});
  const { uploadFile } = useFiles();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState<Partial<Character>>({
    name: "",
    clan: "",
    generation: 13,
    type: "PC",
    status: "Active",
    concept: "",
    sire: "",
    coterie: "",
    avatar_url: "",
    attachments: [],
    // Attributes
    strength: 1,
    dexterity: 1,
    stamina: 1,
    charisma: 1,
    manipulation: 1,
    composure: 1,
    intelligence: 1,
    wits: 1,
    resolve: 1,
    // Skills
    skills: {},
    // Disciplines & Powers
    disciplines: [],
    powers: [],
    // Character Creation
    predator_type: "",
    chronicle_tenets: [],
    // Advantages & Flaws
    advantages: [],
    flaws: [],
    loresheets: [],
    // Beliefs
    convictions: [],
    touchstones: [],
    ambition: "",
    desire: "",
    // Trackers
    health_max: 3,
    health_superficial: 0,
    health_aggravated: 0,
    willpower_max: 3,
    willpower_superficial: 0,
    willpower_aggravated: 0,
    humanity: 7,
    hunger: 1,
    blood_potency: 0,
    // Experience
    experience_total: 0,
    experience_spent: 0,
    // Additional Details
    appearance: "",
    distinguishing_features: "",
    history: "",
    notes: "",
    resonance: "",
    // Dice Pools
    use_dice_pools: false,
    skip_attributes: false,
    dice_pools: null,
  });

  // Auto-compute health_max and willpower_max when attributes change (unless overridden)
  useEffect(() => {
    const stamina = formData.stamina || 1;
    const composure = formData.composure || 1;
    const resolve = formData.resolve || 1;
    
    const computedHealthMax = stamina + 3;
    const computedWillpowerMax = composure + resolve;
    
    const updates: Partial<typeof formData> = {};
    
    if (!overrideHealthMax && formData.health_max !== computedHealthMax) {
      updates.health_max = computedHealthMax;
    }
    if (!overrideWillpowerMax && formData.willpower_max !== computedWillpowerMax) {
      updates.willpower_max = computedWillpowerMax;
    }
    
    if (Object.keys(updates).length > 0) {
      setFormData(prev => ({ ...prev, ...updates }));
    }
  }, [formData.stamina, formData.composure, formData.resolve, overrideHealthMax, overrideWillpowerMax]);

  useEffect(() => {
    if (character) {
      const stamina = character.stamina || 1;
      const composure = character.composure || 1;
      const resolve = character.resolve || 1;
      
      const computedHealthMax = stamina + 3;
      const computedWillpowerMax = composure + resolve;
      
      // Detect if values were overridden (different from computed)
      const hasHealthOverride = character.health_max !== undefined && character.health_max !== computedHealthMax;
      const hasWillpowerOverride = character.willpower_max !== undefined && character.willpower_max !== computedWillpowerMax;
      
      setOverrideHealthMax(hasHealthOverride);
      setOverrideWillpowerMax(hasWillpowerOverride);
      setCustomDisciplineFlags({});
      setCustomPowerFlags({});
      
      setFormData({
        name: character.name,
        clan: character.clan,
        generation: character.generation || 13,
        type: character.type,
        status: character.status,
        concept: character.concept || "",
        sire: character.sire || "",
        coterie: character.coterie || "",
        avatar_url: character.avatar_url || "",
        attachments: character.attachments || [],
        strength: character.strength || 1,
        dexterity: character.dexterity || 1,
        stamina: character.stamina || 1,
        charisma: character.charisma || 1,
        manipulation: character.manipulation || 1,
        composure: character.composure || 1,
        intelligence: character.intelligence || 1,
        wits: character.wits || 1,
        resolve: character.resolve || 1,
        skills: character.skills || {},
        disciplines: character.disciplines || [],
        powers: character.powers || [],
        predator_type: character.predator_type || "",
        chronicle_tenets: character.chronicle_tenets || [],
        advantages: character.advantages || [],
        flaws: character.flaws || [],
        loresheets: character.loresheets || [],
        convictions: character.convictions || [],
        touchstones: character.touchstones || [],
        ambition: character.ambition || "",
        desire: character.desire || "",
        health_max: hasHealthOverride ? (character.health_max || computedHealthMax) : computedHealthMax,
        health_superficial: character.health_superficial || 0,
        health_aggravated: character.health_aggravated || 0,
        willpower_max: hasWillpowerOverride ? (character.willpower_max || computedWillpowerMax) : computedWillpowerMax,
        willpower_superficial: character.willpower_superficial || 0,
        willpower_aggravated: character.willpower_aggravated || 0,
        humanity: character.humanity || 7,
        hunger: character.hunger || 1,
        blood_potency: character.blood_potency || 0,
        experience_total: character.experience_total || 0,
        experience_spent: character.experience_spent || 0,
        appearance: character.appearance || "",
        distinguishing_features: character.distinguishing_features || "",
        history: character.history || "",
        notes: character.notes || "",
        resonance: character.resonance || "",
        use_dice_pools: character.use_dice_pools || false,
        skip_attributes: character.skip_attributes || false,
        dice_pools: character.dice_pools || null,
      });
    }
  }, [character]);

  const handleSubmit = async () => {
    if (!character) return;
    
    setLoading(true);
    try {
      await onUpdate(character.id, formData);
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating character:', error);
    } finally {
      setLoading(false);
    }
  };

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleDelete = async () => {
    if (!character) return;
    
    setDeleteLoading(true);
    try {
      await onDelete(character.id);
      setShowDeleteDialog(false);
      onOpenChange(false);
    } catch (error) {
      console.error('Error deleting character:', error);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleAvatarUpload = (attachments: any[]) => {
    if (attachments.length > 0) {
      setFormData(prev => ({ ...prev, avatar_url: attachments[0].url }));
    }
  };

  const updateSkill = (skillKey: string, rating: number, specialty?: string) => {
    setFormData(prev => ({
      ...prev,
      skills: {
        ...prev.skills,
        [skillKey]: { rating, specialty }
      }
    }));
  };

  const addDiscipline = () => {
    setFormData(prev => ({
      ...prev,
      disciplines: [...(prev.disciplines || []), { name: "", level: 1 }]
    }));
  };

  const updateDiscipline = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      disciplines: prev.disciplines?.map((d, i) => i === index ? { ...d, [field]: value } : d)
    }));
  };

  const removeDiscipline = (index: number) => {
    setFormData(prev => ({
      ...prev,
      disciplines: prev.disciplines?.filter((_, i) => i !== index)
    }));
  };

  const addPower = () => {
    setFormData(prev => ({
      ...prev,
      powers: [...(prev.powers || []), { name: "", discipline: "", level: 1, cost: "", description: "" }]
    }));
  };

  const updatePower = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      powers: prev.powers?.map((p, i) => i === index ? { ...p, [field]: value } : p)
    }));
  };

  const removePower = (index: number) => {
    setFormData(prev => ({
      ...prev,
      powers: prev.powers?.filter((_, i) => i !== index)
    }));
  };

  const addAdvantage = () => {
    setFormData(prev => ({
      ...prev,
      advantages: [...(prev.advantages || []), { name: "", type: "Merit", rating: 1, description: "" }]
    }));
  };

  const updateAdvantage = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      advantages: prev.advantages?.map((a, i) => i === index ? { ...a, [field]: value } : a)
    }));
  };

  const removeAdvantage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      advantages: prev.advantages?.filter((_, i) => i !== index)
    }));
  };

  const addFlaw = () => {
    setFormData(prev => ({
      ...prev,
      flaws: [...(prev.flaws || []), { name: "", rating: 1, description: "" }]
    }));
  };

  const updateFlaw = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      flaws: prev.flaws?.map((f, i) => i === index ? { ...f, [field]: value } : f)
    }));
  };

  const removeFlaw = (index: number) => {
    setFormData(prev => ({
      ...prev,
      flaws: prev.flaws?.filter((_, i) => i !== index)
    }));
  };

  const addConviction = () => {
    setFormData(prev => ({
      ...prev,
      convictions: [...(prev.convictions || []), ""]
    }));
  };

  const updateConviction = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      convictions: prev.convictions?.map((c, i) => i === index ? value : c)
    }));
  };

  const removeConviction = (index: number) => {
    setFormData(prev => ({
      ...prev,
      convictions: prev.convictions?.filter((_, i) => i !== index)
    }));
  };

  const addTouchstone = () => {
    setFormData(prev => ({
      ...prev,
      touchstones: [...(prev.touchstones || []), { name: "", conviction: "", description: "" }]
    }));
  };

  const updateTouchstone = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      touchstones: prev.touchstones?.map((t, i) => i === index ? { ...t, [field]: value } : t)
    }));
  };

  const removeTouchstone = (index: number) => {
    setFormData(prev => ({
      ...prev,
      touchstones: prev.touchstones?.filter((_, i) => i !== index)
    }));
  };

  const generatePortrait = async () => {
    if (!character) return;
    
    setGeneratingPortrait(true);
    try {
      // Build character description for the AI
      const description = `${formData.clan} vampire, ${formData.concept || 'mysterious character'}, generation ${formData.generation}. ${formData.appearance || ''} ${formData.distinguishing_features || ''}`.trim();
      
      const { data, error } = await supabase.functions.invoke('generate-portrait', {
        body: { characterDescription: description }
      });

      if (error) throw error;
      
      if (data?.imageUrl) {
        setFormData(prev => ({ ...prev, avatar_url: data.imageUrl }));
        toast({
          title: "Portrait generated",
          description: "AI-generated portrait has been created for your character.",
        });
      }
    } catch (error: any) {
      console.error('Error generating portrait:', error);
      toast({
        title: "Error generating portrait",
        description: error.message || "Failed to generate portrait. Please try again.",
        variant: "destructive",
      });
    } finally {
      setGeneratingPortrait(false);
    }
  };

  if (!character) return null;

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col min-h-0">
        <DialogHeader>
          <DialogTitle>Edit Character Sheet</DialogTitle>
          <DialogDescription>Update attributes, skills, and details.</DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-1 min-h-0 pr-4">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger value="basic">Basic</TabsTrigger>
              <TabsTrigger value="stats">Stats</TabsTrigger>
              <TabsTrigger value="disciplines">Disciplines</TabsTrigger>
              <TabsTrigger value="advantages">Advantages</TabsTrigger>
              <TabsTrigger value="beliefs">Beliefs</TabsTrigger>
              <TabsTrigger value="boons">Boons</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
            </TabsList>

            {/* Basic Info Tab */}
            <TabsContent value="basic" className="space-y-4">
              <Card className="p-4">
                <h3 className="text-lg font-semibold mb-4">Character Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Name</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>

                  <div>
                    <Label>Concept</Label>
                    <Input
                      value={formData.concept}
                      onChange={(e) => setFormData(prev => ({ ...prev, concept: e.target.value }))}
                      placeholder="e.g., Rebellious artist"
                    />
                  </div>

                  <div>
                    <Label>Clan</Label>
                    <Select value={formData.clan} onValueChange={(value) => setFormData(prev => ({ ...prev, clan: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {clans.map((clan) => (
                          <SelectItem key={clan} value={clan}>{clan}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Generation</Label>
                    <Input
                      type="number"
                      min="1"
                      max="16"
                      value={formData.generation}
                      onChange={(e) => setFormData(prev => ({ ...prev, generation: parseInt(e.target.value) || 13 }))}
                      disabled={formData.clan === "Human"}
                    />
                  </div>

                  <div>
                    <Label>Predator Type</Label>
                    <Select value={formData.predator_type} onValueChange={(value) => setFormData(prev => ({ ...prev, predator_type: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select predator type" />
                      </SelectTrigger>
                      <SelectContent>
                        {predatorTypes.map((type) => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Type</Label>
                    <Select value={formData.type} onValueChange={(value: "PC" | "NPC") => setFormData(prev => ({ ...prev, type: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PC">Player Character</SelectItem>
                        <SelectItem value="NPC">Non-Player Character</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Status</Label>
                    <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statuses.map((status) => (
                          <SelectItem key={status} value={status}>{status}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Sire</Label>
                    <Input
                      value={formData.sire}
                      onChange={(e) => setFormData(prev => ({ ...prev, sire: e.target.value }))}
                      placeholder="Name of the character's sire"
                    />
                  </div>

                  <div>
                    <Label>Coterie</Label>
                    <Input
                      value={formData.coterie}
                      onChange={(e) => setFormData(prev => ({ ...prev, coterie: e.target.value }))}
                      placeholder="Name of the coterie"
                    />
                  </div>

                  <div className="col-span-2">
                    <Label>Character Portrait</Label>
                    <div className="space-y-3">
                      {formData.avatar_url && (
                        <div className="relative w-48 h-48 mx-auto">
                          <img 
                            src={formData.avatar_url} 
                            alt={formData.name}
                            className="w-full h-full object-cover rounded-lg border-2 border-border"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute -top-2 -right-2"
                            onClick={() => setFormData(prev => ({ ...prev, avatar_url: "" }))}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          className="flex-1"
                          onClick={generatePortrait}
                          disabled={generatingPortrait}
                        >
                          {generatingPortrait ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <Wand2 className="mr-2 h-4 w-4" />
                              Generate Portrait
                            </>
                          )}
                        </Button>
                      </div>
                      <div className="text-sm text-muted-foreground text-center">
                        Or upload your own image below
                      </div>
                      <FileUpload
                        bucket="character-files"
                        entityId={character.id}
                        entityType="character"
                        attachments={[]}
                        onAttachmentsChange={handleAvatarUpload}
                        maxFiles={1}
                        accept="image/*"
                      />
                    </div>
                  </div>

                  <div className="col-span-2">
                    <Label>Resonance</Label>
                    <div className="space-y-2">
                      <Select 
                        value={formData.resonance?.split(',')[0]?.trim() || ""} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, resonance: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select blood resonance" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Choleric">Choleric (Angry, Violent)</SelectItem>
                          <SelectItem value="Melancholic">Melancholic (Sad, Fearful)</SelectItem>
                          <SelectItem value="Phlegmatic">Phlegmatic (Calm, Apathetic)</SelectItem>
                          <SelectItem value="Sanguine">Sanguine (Happy, Passionate)</SelectItem>
                          <SelectItem value="Animal">Animal (Beast Blood)</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Blood resonance affects discipline usage and provides temporary benefits
                      </p>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <h3 className="text-lg font-semibold mb-4">Avatar</h3>
                <FileUpload
                  bucket="character-files"
                  entityId={character.id}
                  entityType="character"
                  attachments={formData.avatar_url ? [{ name: "Avatar", url: formData.avatar_url, type: "image", size: 0, id: "avatar", uploaded_at: "" }] : []}
                  onAttachmentsChange={(attachments) => {
                    if (attachments.length > 0) {
                      setFormData(prev => ({ ...prev, avatar_url: attachments[0].url }));
                    } else {
                      setFormData(prev => ({ ...prev, avatar_url: "" }));
                    }
                  }}
                  accept="image/*"
                  maxFiles={1}
                  maxSize={5}
                />
              </Card>

              <Card className="p-4">
                <h3 className="text-lg font-semibold mb-4">Attachments & Documents</h3>
                <FileUpload
                  bucket="character-files"
                  entityId={character.id}
                  entityType="character"
                  attachments={formData.attachments || []}
                  onAttachmentsChange={(attachments) => setFormData(prev => ({ ...prev, attachments }))}
                  accept="image/*,.pdf,.doc,.docx,.txt,.md"
                  maxFiles={20}
                  maxSize={10}
                />
              </Card>
            </TabsContent>

            {/* Stats Tab */}
            <TabsContent value="stats" className="space-y-4">
              <Card className="p-4">
                <h3 className="text-lg font-semibold mb-4">Trackers</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Health (Max)</Label>
                      <div className="flex items-center gap-2">
                        <Checkbox 
                          id="override-health" 
                          checked={overrideHealthMax}
                          onCheckedChange={(checked) => {
                            setOverrideHealthMax(!!checked);
                            if (!checked) {
                              // Reset to computed value
                              const stamina = formData.stamina || 1;
                              setFormData(prev => ({ ...prev, health_max: stamina + 3 }));
                            }
                          }}
                        />
                        <Label htmlFor="override-health" className="text-xs text-muted-foreground cursor-pointer">Override</Label>
                      </div>
                    </div>
                    <Input
                      type="number"
                      min="1"
                      max="15"
                      value={formData.health_max}
                      onChange={(e) => setFormData(prev => ({ ...prev, health_max: parseInt(e.target.value) || 3 }))}
                      disabled={!overrideHealthMax}
                      className={!overrideHealthMax ? "opacity-50" : ""}
                    />
                    {!overrideHealthMax && (
                      <p className="text-xs text-muted-foreground">Auto: Stamina + 3</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Willpower (Max)</Label>
                      <div className="flex items-center gap-2">
                        <Checkbox 
                          id="override-willpower" 
                          checked={overrideWillpowerMax}
                          onCheckedChange={(checked) => {
                            setOverrideWillpowerMax(!!checked);
                            if (!checked) {
                              // Reset to computed value
                              const composure = formData.composure || 1;
                              const resolve = formData.resolve || 1;
                              setFormData(prev => ({ ...prev, willpower_max: composure + resolve }));
                            }
                          }}
                        />
                        <Label htmlFor="override-willpower" className="text-xs text-muted-foreground cursor-pointer">Override</Label>
                      </div>
                    </div>
                    <Input
                      type="number"
                      min="1"
                      max="15"
                      value={formData.willpower_max}
                      onChange={(e) => setFormData(prev => ({ ...prev, willpower_max: parseInt(e.target.value) || 3 }))}
                      disabled={!overrideWillpowerMax}
                      className={!overrideWillpowerMax ? "opacity-50" : ""}
                    />
                    {!overrideWillpowerMax && (
                      <p className="text-xs text-muted-foreground">Auto: Composure + Resolve</p>
                    )}
                  </div>
                  <div>
                    <Label>Humanity</Label>
                    <DotSelector 
                      value={formData.humanity || 7} 
                      max={10}
                      onChange={(val) => setFormData(prev => ({ ...prev, humanity: val }))}
                    />
                  </div>
                  <div>
                    <Label>Hunger</Label>
                    <DotSelector 
                      value={formData.hunger || 1} 
                      max={5}
                      onChange={(val) => setFormData(prev => ({ ...prev, hunger: val }))}
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Label>Blood Potency</Label>
                      {(() => {
                        const maxBP = getMaxBloodPotency(formData.generation);
                        if (maxBP !== null) {
                          return <span className="text-xs text-muted-foreground">(Max {maxBP} for Gen {formData.generation})</span>;
                        }
                        return null;
                      })()}
                    </div>
                    <DotSelector 
                      value={formData.blood_potency || 0} 
                      max={10}
                      onChange={(val) => setFormData(prev => ({ ...prev, blood_potency: val }))}
                    />
                    {(() => {
                      const maxBP = getMaxBloodPotency(formData.generation);
                      const currentBP = formData.blood_potency || 0;
                      if (maxBP !== null && currentBP > maxBP) {
                        return (
                          <div className="flex items-center gap-1.5 mt-1 text-amber-500">
                            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                            <span className="text-xs">Blood Potency {currentBP} exceeds the cap of {maxBP} for Generation {formData.generation}</span>
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                </div>
              </Card>

              {/* Dice Pools Section */}
              <Card className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Dice Pools (Storyteller Characters)</h3>
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      id="use-dice-pools" 
                      checked={formData.use_dice_pools || false}
                      onCheckedChange={(checked) => {
                        setFormData(prev => ({ 
                          ...prev, 
                          use_dice_pools: !!checked,
                          dice_pools: checked && !prev.dice_pools ? { type: 'simple', difficulty: 3 } : prev.dice_pools
                        }));
                      }}
                    />
                    <Label htmlFor="use-dice-pools" className="cursor-pointer">Enable Dice Pools</Label>
                  </div>
                </div>
                
                {formData.use_dice_pools && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                      <Checkbox 
                        id="skip-attributes" 
                        checked={formData.skip_attributes || false}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, skip_attributes: !!checked }))}
                      />
                      <Label htmlFor="skip-attributes" className="cursor-pointer text-sm">Skip full attributes (use dice pools only)</Label>
                    </div>
                    
                    <div>
                      <Label>Pool Type</Label>
                      <Select 
                        value={(formData.dice_pools as DicePoolConfig)?.type || 'simple'} 
                        onValueChange={(value: 'simple' | 'general' | 'standard' | 'combined') => {
                          let newPools: DicePoolConfig;
                          switch (value) {
                            case 'simple':
                              newPools = { type: 'simple', difficulty: 3 };
                              break;
                            case 'general':
                              newPools = { type: 'general', primary: 6, secondary: 4 };
                              break;
                            case 'standard':
                              newPools = { type: 'standard', physical: 4, social: 4, mental: 4, exceptional: [] };
                              break;
                            case 'combined':
                              newPools = { 
                                type: 'combined', 
                                general: { primary: 6, secondary: 4 },
                                standard: { physical: 4, social: 4, mental: 4, exceptional: [] }
                              };
                              break;
                          }
                          setFormData(prev => ({ ...prev, dice_pools: newPools }));
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="simple">Simple (Single Difficulty)</SelectItem>
                          <SelectItem value="general">General (Primary/Secondary)</SelectItem>
                          <SelectItem value="standard">Standard (Physical/Social/Mental)</SelectItem>
                          <SelectItem value="combined">Combined (General + Standard)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Simple Pool */}
                    {(formData.dice_pools as SimpleDicePool)?.type === 'simple' && (
                      <div>
                        <Label>Difficulty (Pool = 2× Difficulty)</Label>
                        <Input
                          type="number"
                          min="1"
                          max="10"
                          value={(formData.dice_pools as SimpleDicePool).difficulty}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            dice_pools: { type: 'simple', difficulty: parseInt(e.target.value) || 3 }
                          }))}
                        />
                      </div>
                    )}

                    {/* General Pool */}
                    {(formData.dice_pools as GeneralDicePool)?.type === 'general' && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Primary Pool (Areas of Excellence)</Label>
                          <Input
                            type="number"
                            min="1"
                            max="15"
                            value={(formData.dice_pools as GeneralDicePool).primary}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              dice_pools: { 
                                ...(prev.dice_pools as GeneralDicePool), 
                                primary: parseInt(e.target.value) || 6 
                              }
                            }))}
                          />
                        </div>
                        <div>
                          <Label>Secondary Pool (Standard Areas)</Label>
                          <Input
                            type="number"
                            min="1"
                            max="15"
                            value={(formData.dice_pools as GeneralDicePool).secondary}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              dice_pools: { 
                                ...(prev.dice_pools as GeneralDicePool), 
                                secondary: parseInt(e.target.value) || 4 
                              }
                            }))}
                          />
                        </div>
                      </div>
                    )}

                    {/* Standard Pool */}
                    {(formData.dice_pools as StandardDicePool)?.type === 'standard' && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <Label>Physical</Label>
                            <Input
                              type="number"
                              min="1"
                              max="15"
                              value={(formData.dice_pools as StandardDicePool).physical}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                dice_pools: { 
                                  ...(prev.dice_pools as StandardDicePool), 
                                  physical: parseInt(e.target.value) || 4 
                                }
                              }))}
                            />
                          </div>
                          <div>
                            <Label>Social</Label>
                            <Input
                              type="number"
                              min="1"
                              max="15"
                              value={(formData.dice_pools as StandardDicePool).social}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                dice_pools: { 
                                  ...(prev.dice_pools as StandardDicePool), 
                                  social: parseInt(e.target.value) || 4 
                                }
                              }))}
                            />
                          </div>
                          <div>
                            <Label>Mental</Label>
                            <Input
                              type="number"
                              min="1"
                              max="15"
                              value={(formData.dice_pools as StandardDicePool).mental}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                dice_pools: { 
                                  ...(prev.dice_pools as StandardDicePool), 
                                  mental: parseInt(e.target.value) || 4 
                                }
                              }))}
                            />
                          </div>
                        </div>
                        
                        {/* Exceptional Skills */}
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <Label>Exceptional Skills</Label>
                            <Button 
                              type="button"
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                const currentPools = formData.dice_pools as StandardDicePool;
                                setFormData(prev => ({
                                  ...prev,
                                  dice_pools: {
                                    ...currentPools,
                                    exceptional: [...(currentPools.exceptional || []), { name: '', pool: 6 }]
                                  }
                                }));
                              }}
                            >
                              <Plus className="w-4 h-4 mr-1" /> Add
                            </Button>
                          </div>
                          {((formData.dice_pools as StandardDicePool).exceptional || []).map((exc, idx) => (
                            <div key={idx} className="flex gap-2 mb-2">
                              <Input
                                placeholder="Skill name"
                                value={exc.name}
                                onChange={(e) => {
                                  const currentPools = formData.dice_pools as StandardDicePool;
                                  const updated = [...currentPools.exceptional];
                                  updated[idx] = { ...updated[idx], name: e.target.value };
                                  setFormData(prev => ({
                                    ...prev,
                                    dice_pools: { ...currentPools, exceptional: updated }
                                  }));
                                }}
                                className="flex-1"
                              />
                              <Input
                                type="number"
                                min="1"
                                max="15"
                                value={exc.pool}
                                onChange={(e) => {
                                  const currentPools = formData.dice_pools as StandardDicePool;
                                  const updated = [...currentPools.exceptional];
                                  updated[idx] = { ...updated[idx], pool: parseInt(e.target.value) || 6 };
                                  setFormData(prev => ({
                                    ...prev,
                                    dice_pools: { ...currentPools, exceptional: updated }
                                  }));
                                }}
                                className="w-20"
                              />
                              <Button 
                                type="button"
                                variant="ghost" 
                                size="sm"
                                onClick={() => {
                                  const currentPools = formData.dice_pools as StandardDicePool;
                                  setFormData(prev => ({
                                    ...prev,
                                    dice_pools: {
                                      ...currentPools,
                                      exceptional: currentPools.exceptional.filter((_, i) => i !== idx)
                                    }
                                  }));
                                }}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Combined Pool */}
                    {(formData.dice_pools as CombinedDicePool)?.type === 'combined' && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Primary Pool</Label>
                            <Input
                              type="number"
                              min="1"
                              max="15"
                              value={(formData.dice_pools as CombinedDicePool).general.primary}
                              onChange={(e) => {
                                const currentPools = formData.dice_pools as CombinedDicePool;
                                setFormData(prev => ({
                                  ...prev,
                                  dice_pools: {
                                    ...currentPools,
                                    general: { ...currentPools.general, primary: parseInt(e.target.value) || 6 }
                                  }
                                }));
                              }}
                            />
                          </div>
                          <div>
                            <Label>Secondary Pool</Label>
                            <Input
                              type="number"
                              min="1"
                              max="15"
                              value={(formData.dice_pools as CombinedDicePool).general.secondary}
                              onChange={(e) => {
                                const currentPools = formData.dice_pools as CombinedDicePool;
                                setFormData(prev => ({
                                  ...prev,
                                  dice_pools: {
                                    ...currentPools,
                                    general: { ...currentPools.general, secondary: parseInt(e.target.value) || 4 }
                                  }
                                }));
                              }}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <Label>Physical</Label>
                            <Input
                              type="number"
                              min="1"
                              max="15"
                              value={(formData.dice_pools as CombinedDicePool).standard.physical}
                              onChange={(e) => {
                                const currentPools = formData.dice_pools as CombinedDicePool;
                                setFormData(prev => ({
                                  ...prev,
                                  dice_pools: {
                                    ...currentPools,
                                    standard: { ...currentPools.standard, physical: parseInt(e.target.value) || 4 }
                                  }
                                }));
                              }}
                            />
                          </div>
                          <div>
                            <Label>Social</Label>
                            <Input
                              type="number"
                              min="1"
                              max="15"
                              value={(formData.dice_pools as CombinedDicePool).standard.social}
                              onChange={(e) => {
                                const currentPools = formData.dice_pools as CombinedDicePool;
                                setFormData(prev => ({
                                  ...prev,
                                  dice_pools: {
                                    ...currentPools,
                                    standard: { ...currentPools.standard, social: parseInt(e.target.value) || 4 }
                                  }
                                }));
                              }}
                            />
                          </div>
                          <div>
                            <Label>Mental</Label>
                            <Input
                              type="number"
                              min="1"
                              max="15"
                              value={(formData.dice_pools as CombinedDicePool).standard.mental}
                              onChange={(e) => {
                                const currentPools = formData.dice_pools as CombinedDicePool;
                                setFormData(prev => ({
                                  ...prev,
                                  dice_pools: {
                                    ...currentPools,
                                    standard: { ...currentPools.standard, mental: parseInt(e.target.value) || 4 }
                                  }
                                }));
                              }}
                            />
                          </div>
                        </div>
                        
                        {/* Exceptional Skills for Combined */}
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <Label>Exceptional Skills</Label>
                            <Button 
                              type="button"
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                const currentPools = formData.dice_pools as CombinedDicePool;
                                setFormData(prev => ({
                                  ...prev,
                                  dice_pools: {
                                    ...currentPools,
                                    standard: {
                                      ...currentPools.standard,
                                      exceptional: [...(currentPools.standard.exceptional || []), { name: '', pool: 6 }]
                                    }
                                  }
                                }));
                              }}
                            >
                              <Plus className="w-4 h-4 mr-1" /> Add
                            </Button>
                          </div>
                          {((formData.dice_pools as CombinedDicePool).standard.exceptional || []).map((exc, idx) => (
                            <div key={idx} className="flex gap-2 mb-2">
                              <Input
                                placeholder="Skill name"
                                value={exc.name}
                                onChange={(e) => {
                                  const currentPools = formData.dice_pools as CombinedDicePool;
                                  const updated = [...currentPools.standard.exceptional];
                                  updated[idx] = { ...updated[idx], name: e.target.value };
                                  setFormData(prev => ({
                                    ...prev,
                                    dice_pools: {
                                      ...currentPools,
                                      standard: { ...currentPools.standard, exceptional: updated }
                                    }
                                  }));
                                }}
                                className="flex-1"
                              />
                              <Input
                                type="number"
                                min="1"
                                max="15"
                                value={exc.pool}
                                onChange={(e) => {
                                  const currentPools = formData.dice_pools as CombinedDicePool;
                                  const updated = [...currentPools.standard.exceptional];
                                  updated[idx] = { ...updated[idx], pool: parseInt(e.target.value) || 6 };
                                  setFormData(prev => ({
                                    ...prev,
                                    dice_pools: {
                                      ...currentPools,
                                      standard: { ...currentPools.standard, exceptional: updated }
                                    }
                                  }));
                                }}
                                className="w-20"
                              />
                              <Button 
                                type="button"
                                variant="ghost" 
                                size="sm"
                                onClick={() => {
                                  const currentPools = formData.dice_pools as CombinedDicePool;
                                  setFormData(prev => ({
                                    ...prev,
                                    dice_pools: {
                                      ...currentPools,
                                      standard: {
                                        ...currentPools.standard,
                                        exceptional: currentPools.standard.exceptional.filter((_, i) => i !== idx)
                                      }
                                    }
                                  }));
                                }}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </Card>

              <Card className="p-4">
                <h3 className="text-lg font-semibold mb-4">Attributes</h3>
                <div className="grid grid-cols-3 gap-6">
                  <div>
                    <h4 className="text-sm font-semibold mb-3">Physical</h4>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm">Strength</Label>
                        <DotSelector value={formData.strength || 1} onChange={(val) => setFormData(prev => ({ ...prev, strength: val }))} />
                      </div>
                      <div>
                        <Label className="text-sm">Dexterity</Label>
                        <DotSelector value={formData.dexterity || 1} onChange={(val) => setFormData(prev => ({ ...prev, dexterity: val }))} />
                      </div>
                      <div>
                        <Label className="text-sm">Stamina</Label>
                        <DotSelector value={formData.stamina || 1} onChange={(val) => setFormData(prev => ({ ...prev, stamina: val }))} />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold mb-3">Social</h4>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm">Charisma</Label>
                        <DotSelector value={formData.charisma || 1} onChange={(val) => setFormData(prev => ({ ...prev, charisma: val }))} />
                      </div>
                      <div>
                        <Label className="text-sm">Manipulation</Label>
                        <DotSelector value={formData.manipulation || 1} onChange={(val) => setFormData(prev => ({ ...prev, manipulation: val }))} />
                      </div>
                      <div>
                        <Label className="text-sm">Composure</Label>
                        <DotSelector value={formData.composure || 1} onChange={(val) => setFormData(prev => ({ ...prev, composure: val }))} />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold mb-3">Mental</h4>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm">Intelligence</Label>
                        <DotSelector value={formData.intelligence || 1} onChange={(val) => setFormData(prev => ({ ...prev, intelligence: val }))} />
                      </div>
                      <div>
                        <Label className="text-sm">Wits</Label>
                        <DotSelector value={formData.wits || 1} onChange={(val) => setFormData(prev => ({ ...prev, wits: val }))} />
                      </div>
                      <div>
                        <Label className="text-sm">Resolve</Label>
                        <DotSelector value={formData.resolve || 1} onChange={(val) => setFormData(prev => ({ ...prev, resolve: val }))} />
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <h3 className="text-lg font-semibold mb-4">Skills</h3>
                <div className="grid grid-cols-3 gap-6">
                  {Object.entries(skillCategories).map(([category, skillList]) => (
                    <div key={category}>
                      <h4 className="text-sm font-semibold mb-3">{category}</h4>
                      <div className="space-y-2">
                        {skillList.map((skillKey) => {
                          const skill = formData.skills?.[skillKey];
                          const displayName = skillKey.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                          
                          return (
                            <div key={skillKey} className="space-y-1">
                              <div className="flex justify-between items-center">
                                <Label className="text-sm">{displayName}</Label>
                                <DotSelector 
                                  value={skill?.rating || 0} 
                                  onChange={(val) => updateSkill(skillKey, val, skill?.specialty)}
                                />
                              </div>
                              {(skill?.rating || 0) > 0 && (
                                <Input
                                  placeholder="Specialty"
                                  value={skill?.specialty || ""}
                                  onChange={(e) => updateSkill(skillKey, skill?.rating || 0, e.target.value)}
                                  className="text-xs h-7"
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>

            {/* Disciplines Tab */}
            <TabsContent value="disciplines" className="space-y-4">
              <Card className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Disciplines</h3>
                  <Button onClick={addDiscipline} size="sm">
                    <Plus className="w-4 h-4 mr-1" /> Add Discipline
                  </Button>
                </div>
                <div className="space-y-3">
                  {formData.disciplines?.map((disc, idx) => {
                    const isCustom = disc.name !== "" && !DISCIPLINES.includes(disc.name as any);
                    return (
                      <div key={idx} className="space-y-2">
                        <div className="flex gap-2 items-center">
                          <Select
                            value={isCustom ? "__custom__" : disc.name}
                            onValueChange={(value) => {
                              if (value === "__custom__") {
                                updateDiscipline(idx, 'name', '');
                                // Mark as needing custom input
                                setCustomDisciplineFlags(prev => ({ ...prev, [idx]: true }));
                              } else {
                                updateDiscipline(idx, 'name', value);
                                setCustomDisciplineFlags(prev => ({ ...prev, [idx]: false }));
                              }
                            }}
                          >
                            <SelectTrigger className="flex-1">
                              <SelectValue placeholder="Select discipline" />
                            </SelectTrigger>
                            <SelectContent>
                              {DISCIPLINES.map((d) => (
                                <SelectItem key={d} value={d}>{d}</SelectItem>
                              ))}
                              <SelectItem value="__custom__">✏️ Custom (Homebrew)</SelectItem>
                            </SelectContent>
                          </Select>
                          <DotSelector 
                            value={disc.level} 
                            onChange={(val) => updateDiscipline(idx, 'level', val)}
                          />
                          <Button variant="ghost" size="sm" onClick={() => {
                            removeDiscipline(idx);
                            setCustomDisciplineFlags(prev => {
                              const next = { ...prev };
                              delete next[idx];
                              return next;
                            });
                          }}>
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                        {(isCustom || customDisciplineFlags[idx]) && (
                          <Input
                            placeholder="Custom discipline name"
                            value={disc.name}
                            onChange={(e) => updateDiscipline(idx, 'name', e.target.value)}
                            className="ml-0"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Powers</h3>
                  <Button onClick={addPower} size="sm">
                    <Plus className="w-4 h-4 mr-1" /> Add Power
                  </Button>
                </div>
                <div className="space-y-4">
                  {formData.powers?.map((power, idx) => {
                    const isCustomPower = power.name !== "" && !Object.values(DISCIPLINE_POWERS).flat().some(p => p.name === power.name);
                    // Get available powers for the selected discipline
                    const availablePowers = power.discipline ? getPowersForDiscipline(power.discipline) : [];
                    
                    return (
                      <div key={idx} className="border rounded-lg p-3 space-y-2">
                        <div className="flex justify-between items-start gap-2">
                          <Select
                            value={power.discipline}
                            onValueChange={(value) => {
                              updatePower(idx, 'discipline', value);
                              // Reset power name when discipline changes
                              updatePower(idx, 'name', '');
                              setCustomPowerFlags(prev => ({ ...prev, [idx]: false }));
                            }}
                          >
                            <SelectTrigger className="w-[180px]">
                              <SelectValue placeholder="Discipline" />
                            </SelectTrigger>
                            <SelectContent>
                              {(formData.disciplines || []).filter(d => d.name).map((disc) => (
                                <SelectItem key={disc.name} value={disc.name}>{disc.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <div className="flex-1">
                            {availablePowers.length > 0 && !customPowerFlags[idx] ? (
                              <Select
                                value={isCustomPower ? "__custom__" : power.name}
                                onValueChange={(value) => {
                                  if (value === "__custom__") {
                                    updatePower(idx, 'name', '');
                                    setCustomPowerFlags(prev => ({ ...prev, [idx]: true }));
                                  } else {
                                    updatePower(idx, 'name', value);
                                    // Auto-fill level from data
                                    const powerInfo = availablePowers.find(p => p.name === value);
                                    if (powerInfo) {
                                      updatePower(idx, 'level', powerInfo.level);
                                    }
                                    setCustomPowerFlags(prev => ({ ...prev, [idx]: false }));
                                  }
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select power" />
                                </SelectTrigger>
                                <SelectContent>
                                  {availablePowers.map((p) => (
                                    <SelectItem key={p.name} value={p.name}>
                                      {p.name} (Lv{p.level}){p.amalgam ? ` [${p.amalgam}]` : ''}{p.source && p.source !== 'CR' ? ` · ${p.source}` : ''}
                                    </SelectItem>
                                  ))}
                                  <SelectItem value="__custom__">✏️ Custom (Homebrew)</SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              <div className="flex gap-2">
                                <Input
                                  placeholder="Custom power name"
                                  value={power.name}
                                  onChange={(e) => updatePower(idx, 'name', e.target.value)}
                                  className="flex-1"
                                />
                                {availablePowers.length > 0 && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setCustomPowerFlags(prev => ({ ...prev, [idx]: false }))}
                                    title="Switch back to dropdown"
                                  >
                                    ↩
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => {
                            removePower(idx);
                            setCustomPowerFlags(prev => {
                              const next = { ...prev };
                              delete next[idx];
                              return next;
                            });
                          }}>
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            type="number"
                            placeholder="Level"
                            min={1}
                            max={5}
                            value={power.level}
                            onChange={(e) => updatePower(idx, 'level', parseInt(e.target.value) || 1)}
                          />
                          <Input
                            placeholder="Cost"
                            value={power.cost}
                            onChange={(e) => updatePower(idx, 'cost', e.target.value)}
                          />
                        </div>
                        <Textarea
                          placeholder="Description (optional)"
                          value={power.description}
                          onChange={(e) => updatePower(idx, 'description', e.target.value)}
                          rows={2}
                        />
                      </div>
                    );
                  })}
                </div>
              </Card>
            </TabsContent>

            {/* Advantages Tab */}
            <TabsContent value="advantages" className="space-y-4">
              <Card className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Advantages</h3>
                  <Button onClick={addAdvantage} size="sm">
                    <Plus className="w-4 h-4 mr-1" /> Add Advantage
                  </Button>
                </div>
                <div className="space-y-3">
                  {formData.advantages?.map((adv, idx) => (
                    <div key={idx} className="border rounded-lg p-3 space-y-2">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Name"
                          value={adv.name}
                          onChange={(e) => updateAdvantage(idx, 'name', e.target.value)}
                          className="flex-1"
                        />
                        <Select value={adv.type} onValueChange={(val) => updateAdvantage(idx, 'type', val)}>
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Merit">Merit</SelectItem>
                            <SelectItem value="Background">Background</SelectItem>
                            <SelectItem value="Status">Status</SelectItem>
                          </SelectContent>
                        </Select>
                        <DotSelector 
                          value={adv.rating || 1} 
                          onChange={(val) => updateAdvantage(idx, 'rating', val)}
                        />
                        <Button variant="ghost" size="sm" onClick={() => removeAdvantage(idx)}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      <Textarea
                        placeholder="Description"
                        value={adv.description}
                        onChange={(e) => updateAdvantage(idx, 'description', e.target.value)}
                        rows={2}
                      />
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Flaws</h3>
                  <Button onClick={addFlaw} size="sm">
                    <Plus className="w-4 h-4 mr-1" /> Add Flaw
                  </Button>
                </div>
                <div className="space-y-3">
                  {formData.flaws?.map((flaw, idx) => (
                    <div key={idx} className="border rounded-lg p-3 space-y-2">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Flaw name"
                          value={flaw.name}
                          onChange={(e) => updateFlaw(idx, 'name', e.target.value)}
                          className="flex-1"
                        />
                        <DotSelector 
                          value={flaw.rating || 1} 
                          onChange={(val) => updateFlaw(idx, 'rating', val)}
                        />
                        <Button variant="ghost" size="sm" onClick={() => removeFlaw(idx)}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      <Textarea
                        placeholder="Description"
                        value={flaw.description}
                        onChange={(e) => updateFlaw(idx, 'description', e.target.value)}
                        rows={2}
                      />
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>

            {/* Beliefs Tab */}
            <TabsContent value="beliefs" className="space-y-4">
              <Card className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Convictions</h3>
                  <Button onClick={addConviction} size="sm">
                    <Plus className="w-4 h-4 mr-1" /> Add Conviction
                  </Button>
                </div>
                <div className="space-y-2">
                  {formData.convictions?.map((conviction, idx) => (
                    <div key={idx} className="flex gap-2">
                      <Input
                        placeholder="Conviction"
                        value={conviction}
                        onChange={(e) => updateConviction(idx, e.target.value)}
                      />
                      <Button variant="ghost" size="sm" onClick={() => removeConviction(idx)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Touchstones</h3>
                  <Button onClick={addTouchstone} size="sm">
                    <Plus className="w-4 h-4 mr-1" /> Add Touchstone
                  </Button>
                </div>
                <div className="space-y-3">
                  {formData.touchstones?.map((touchstone, idx) => (
                    <div key={idx} className="border rounded-lg p-3 space-y-2">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Touchstone name"
                          value={touchstone.name}
                          onChange={(e) => updateTouchstone(idx, 'name', e.target.value)}
                          className="flex-1"
                        />
                        <Button variant="ghost" size="sm" onClick={() => removeTouchstone(idx)}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      <Input
                        placeholder="Related conviction"
                        value={touchstone.conviction}
                        onChange={(e) => updateTouchstone(idx, 'conviction', e.target.value)}
                      />
                      <Textarea
                        placeholder="Description"
                        value={touchstone.description}
                        onChange={(e) => updateTouchstone(idx, 'description', e.target.value)}
                        rows={2}
                      />
                    </div>
                  ))}
                </div>
              </Card>

              <div className="grid grid-cols-2 gap-4">
                <Card className="p-4">
                  <Label>Ambition</Label>
                  <Textarea
                    value={formData.ambition}
                    onChange={(e) => setFormData(prev => ({ ...prev, ambition: e.target.value }))}
                    placeholder="Character's long-term goal"
                    rows={3}
                  />
                </Card>

                <Card className="p-4">
                  <Label>Desire</Label>
                  <Textarea
                    value={formData.desire}
                    onChange={(e) => setFormData(prev => ({ ...prev, desire: e.target.value }))}
                    placeholder="Character's short-term want"
                    rows={3}
                  />
                </Card>
              </div>
            </TabsContent>

            {/* Boons Tab */}
            <TabsContent value="boons" className="space-y-4">
              <BoonsTabContent character={character} />
            </TabsContent>

            {/* Details Tab */}
            <TabsContent value="details" className="space-y-4">
              <Card className="p-4">
                <Label>Appearance</Label>
                <Textarea
                  value={formData.appearance}
                  onChange={(e) => setFormData(prev => ({ ...prev, appearance: e.target.value }))}
                  placeholder="Physical description"
                  rows={3}
                />
              </Card>

              <Card className="p-4">
                <Label>Distinguishing Features</Label>
                <Textarea
                  value={formData.distinguishing_features}
                  onChange={(e) => setFormData(prev => ({ ...prev, distinguishing_features: e.target.value }))}
                  placeholder="Notable features, scars, tattoos, etc."
                  rows={3}
                />
              </Card>

              <Card className="p-4">
                <Label>History</Label>
                <MentionInput
                  value={formData.history || ""}
                  onChange={(value) => setFormData(prev => ({ ...prev, history: value }))}
                  placeholder="Character background and history... Use @ to mention entities"
                  className="min-h-32 resize-none"
                  maxLength={5000}
                />
                <p className="text-xs text-muted-foreground mt-1">Type @ to mention characters, stories, sessions, etc.</p>
              </Card>

              <Card className="p-4">
                <Label>Notes</Label>
                <MentionInput
                  value={formData.notes || ""}
                  onChange={(value) => setFormData(prev => ({ ...prev, notes: value }))}
                  placeholder="Additional notes... Use @ to mention entities"
                  className="min-h-32 resize-none"
                  maxLength={5000}
                />
                <p className="text-xs text-muted-foreground mt-1">Type @ to mention characters, stories, sessions, etc.</p>
              </Card>
            </TabsContent>
          </Tabs>
        </ScrollArea>

        <DialogFooter className="flex justify-between border-t pt-4">
          <Button
            variant="destructive"
            onClick={() => setShowDeleteDialog(true)}
            disabled={deleteLoading}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Save Changes
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Character</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "{character?.name}"? This will also remove all associated relationships, session tags, and boons. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Delete Character
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </>
  );
}

// Separate component for Boons tab to use hooks
function BoonsTabContent({ character }: { character: Character }) {
  const { characters } = useCharacters();
  
  // Filter to only characters in the same chronicle
  const chronicleCharacters = characters.filter(c => c.chronicle_id === character.chronicle_id);
  
  return (
    <BoonsSection 
      character={character} 
      characters={chronicleCharacters} 
      editable={true} 
    />
  );
}
