import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronLeft, ChevronRight, Check, Wand2, Plus, X } from "lucide-react";
import { useCharacters, DicePoolConfig, SimpleDicePool, GeneralDicePool, StandardDicePool, ExceptionalPool } from "@/hooks/useCharacters";
import { useChronicles } from "@/hooks/useChronicles";
import { useToast } from "@/hooks/use-toast";

type CreationMethod = "full" | "simple" | "general" | "standard";
type CreatureType = "vampire" | "human" | "ghoul";

interface NPCWizardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  generatedData: any;
  creationMethod: CreationMethod;
  creatureType: CreatureType;
}

const CLANS = [
  "Human", "Ghoul", "Banu Haqim", "Brujah", "Gangrel", "Hecata", "Lasombra", "Malkavian",
  "Ministry", "Nosferatu", "Ravnos", "Salubri", "Toreador", "Tremere",
  "Tzimisce", "Ventrue", "Caitiff", "Thin-Blood"
];

const PREDATOR_TYPES = [
  "None", "Alleycat", "Bagger", "Blood Leech", "Cleaver", "Consensualist",
  "Farmer", "Osiris", "Sandman", "Scene Queen", "Siren"
];

const DISCIPLINES = [
  "Animalism", "Auspex", "Blood Sorcery", "Celerity", "Dominate", "Fortitude",
  "Obfuscate", "Oblivion", "Potence", "Presence", "Protean", "Thin-Blood Alchemy"
];

const FULL_STEPS = ["Review Basics", "Attributes", "Powers", "Background", "Confirm"];
const POOL_STEPS = ["Review Basics", "Dice Pools", "Powers", "Background", "Confirm"];
const SIMPLE_STEPS = ["Review Basics", "Dice Pool", "Powers", "Confirm"];

export function NPCWizardDialog({ open, onOpenChange, generatedData, creationMethod, creatureType }: NPCWizardDialogProps) {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const { createCharacter } = useCharacters();
  const { currentChronicle, createDefaultChronicle } = useChronicles();
  const { toast } = useToast();

  // Determine steps based on creation method
  const getSteps = () => {
    if (creationMethod === "full") return FULL_STEPS;
    if (creationMethod === "simple") return SIMPLE_STEPS;
    return POOL_STEPS;
  };
  const STEPS = getSteps();

  // Character data state
  const [characterData, setCharacterData] = useState({
    // Basic Info
    name: "",
    clan: "",
    concept: "",
    generation: 13,
    predatorType: "",
    sire: "",
    
    // Dice Pool Options
    simplePoolDifficulty: 3,
    generalPoolPrimary: 6,
    generalPoolSecondary: 4,
    standardPoolPhysical: 5,
    standardPoolSocial: 5,
    standardPoolMental: 5,
    exceptionalPools: [] as ExceptionalPool[],
    manualHealthMax: 6,
    manualWillpowerMax: 6,
    
    // Attributes
    strength: 2,
    dexterity: 2,
    stamina: 2,
    charisma: 2,
    manipulation: 2,
    composure: 2,
    intelligence: 2,
    wits: 2,
    resolve: 2,
    
    // Disciplines & Powers
    disciplines: [] as Array<{ name: string; level: number; powers: string[] }>,
    
    // Background
    appearance: "",
    distinguishing_features: "",
    history: "",
    notes: "",
    ambition: "",
    desire: "",
    convictions: [] as string[],
    touchstones: [] as Array<{ name: string; conviction?: string }>,
    
    // Trackers
    humanity: 7,
    resonance: "",
    blood_potency: 1,
  });

  // Initialize from generated data
  useEffect(() => {
    if (generatedData && open) {
      const isVampire = generatedData.clan && !["Human", "Ghoul"].includes(generatedData.clan);
      
      // Extract disciplines with powers
      let disciplines: Array<{ name: string; level: number; powers: string[] }> = [];
      if (generatedData.disciplines) {
        if (Array.isArray(generatedData.disciplines)) {
          disciplines = generatedData.disciplines.map((d: any) => ({
            name: typeof d === 'string' ? d : (d.name || ''),
            level: d.level || 1,
            powers: d.powers || []
          }));
        }
      }

      setCharacterData({
        name: generatedData.name || "",
        clan: generatedData.clan || "",
        concept: generatedData.concept || "",
        generation: generatedData.generation || 13,
        predatorType: generatedData.predator_type || "",
        sire: generatedData.sire || "",
        
        simplePoolDifficulty: 3,
        generalPoolPrimary: 6,
        generalPoolSecondary: 4,
        standardPoolPhysical: 5,
        standardPoolSocial: 5,
        standardPoolMental: 5,
        exceptionalPools: [],
        manualHealthMax: (generatedData.stamina || 2) + 3,
        manualWillpowerMax: (generatedData.composure || 2) + (generatedData.resolve || 2),
        
        strength: generatedData.strength || 2,
        dexterity: generatedData.dexterity || 2,
        stamina: generatedData.stamina || 2,
        charisma: generatedData.charisma || 2,
        manipulation: generatedData.manipulation || 2,
        composure: generatedData.composure || 2,
        intelligence: generatedData.intelligence || 2,
        wits: generatedData.wits || 2,
        resolve: generatedData.resolve || 2,
        
        disciplines,
        
        appearance: generatedData.appearance || "",
        distinguishing_features: generatedData.distinguishing_features || "",
        history: generatedData.history || "",
        notes: generatedData.notes || "",
        ambition: generatedData.ambition || "",
        desire: generatedData.desire || "",
        convictions: generatedData.convictions || [],
        touchstones: generatedData.touchstones || [],
        
        humanity: generatedData.humanity || 7,
        resonance: generatedData.resonance || "",
        blood_potency: generatedData.blood_potency || 1,
      });
      setStep(0);
    }
  }, [generatedData, open, creatureType]);

  const progress = ((step + 1) / STEPS.length) * 100;
  
  // Determine vampire status based on creature type prop (more reliable than clan parsing)
  const isVampire = creatureType === "vampire";
  const isGhoul = creatureType === "ghoul";
  const isHuman = creatureType === "human";

  const nextStep = () => {
    if (step < STEPS.length - 1) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 0) setStep(step - 1);
  };

  const canProceed = () => {
    if (step === 0) {
      // Name is always required, clan only required for vampires
      if (characterData.name.trim() === "") return false;
      if (isVampire && characterData.clan === "") return false;
      return true;
    }
    return true;
  };

  const handleComplete = async () => {
    try {
      setLoading(true);

      let chronicleId = currentChronicle?.id;
      if (!chronicleId) {
        const defaultChronicle = await createDefaultChronicle();
        chronicleId = defaultChronicle.id;
      }

      const useDicePools = creationMethod !== "full";
      const skipAttributes = creationMethod !== "full";

      // Calculate health and willpower
      let healthMax: number;
      let willpowerMax: number;
      
      if (useDicePools) {
        if (creationMethod === "simple") {
          healthMax = characterData.simplePoolDifficulty * 2;
          willpowerMax = characterData.simplePoolDifficulty * 2;
        } else {
          healthMax = characterData.manualHealthMax;
          willpowerMax = characterData.manualWillpowerMax;
        }
      } else {
        healthMax = characterData.stamina + 3;
        willpowerMax = characterData.composure + characterData.resolve;
      }

      // Build dice pool config
      let dicePoolConfig: DicePoolConfig | null = null;
      if (useDicePools) {
        switch (creationMethod) {
          case "simple":
            dicePoolConfig = { 
              type: "simple", 
              difficulty: characterData.simplePoolDifficulty 
            } as SimpleDicePool;
            break;
          case "general":
            dicePoolConfig = { 
              type: "general", 
              primary: characterData.generalPoolPrimary, 
              secondary: characterData.generalPoolSecondary 
            } as GeneralDicePool;
            break;
          case "standard":
            dicePoolConfig = { 
              type: "standard", 
              physical: characterData.standardPoolPhysical, 
              social: characterData.standardPoolSocial, 
              mental: characterData.standardPoolMental, 
              exceptional: characterData.exceptionalPools 
            } as StandardDicePool;
            break;
        }
      }

      await createCharacter({
        name: characterData.name,
        clan: characterData.clan,
        concept: characterData.concept || null,
        type: "NPC",
        generation: isVampire ? characterData.generation : null,
        status: "Active",
        sire: characterData.sire || null,
        coterie: null,
        chronicle_id: chronicleId,
        avatar_url: null,
        predator_type: isVampire ? characterData.predatorType : null,
        
        use_dice_pools: useDicePools,
        skip_attributes: skipAttributes,
        dice_pools: dicePoolConfig,
        
        strength: characterData.strength,
        dexterity: characterData.dexterity,
        stamina: characterData.stamina,
        charisma: characterData.charisma,
        manipulation: characterData.manipulation,
        composure: characterData.composure,
        intelligence: characterData.intelligence,
        wits: characterData.wits,
        resolve: characterData.resolve,
        
        skills: {},
        
        disciplines: isVampire 
          ? characterData.disciplines.map(d => ({ name: d.name, level: d.level })) 
          : [],
        powers: isVampire
          ? characterData.disciplines.flatMap(d => 
              d.powers.map(p => ({ discipline: d.name, name: p }))
            )
          : [],
        
        advantages: generatedData?.advantages || [],
        flaws: generatedData?.flaws || [],
        
        convictions: characterData.convictions,
        touchstones: characterData.touchstones,
        ambition: characterData.ambition || null,
        desire: characterData.desire || null,
        
        appearance: characterData.appearance || null,
        distinguishing_features: characterData.distinguishing_features || null,
        history: characterData.history || null,
        notes: characterData.notes || null,
        
        humanity: characterData.humanity,
        health_max: healthMax,
        willpower_max: willpowerMax,
        hunger: isVampire ? 1 : 0,
        blood_potency: isVampire ? characterData.blood_potency : 0,
        resonance: isVampire ? characterData.resonance : null,
      } as any);

      toast({
        title: "NPC Created!",
        description: `${characterData.name} has been added to your chronicle.`,
      });

      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error creating NPC",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addDiscipline = () => {
    setCharacterData(prev => ({
      ...prev,
      disciplines: [...prev.disciplines, { name: "", level: 1, powers: [] }]
    }));
  };

  const updateDiscipline = (index: number, field: string, value: any) => {
    setCharacterData(prev => ({
      ...prev,
      disciplines: prev.disciplines.map((d, i) => 
        i === index ? { ...d, [field]: value } : d
      )
    }));
  };

  const removeDiscipline = (index: number) => {
    setCharacterData(prev => ({
      ...prev,
      disciplines: prev.disciplines.filter((_, i) => i !== index)
    }));
  };

  const renderStepContent = () => {
    const currentStepName = STEPS[step];

    switch (currentStepName) {
      case "Review Basics":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input
                  value={characterData.name}
                  onChange={(e) => setCharacterData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Character name"
                />
              </div>
              <div className="space-y-2">
                <Label>Clan {isVampire ? "*" : ""}</Label>
                {isVampire ? (
                  <Select
                    value={characterData.clan}
                    onValueChange={(v) => setCharacterData(prev => ({ ...prev, clan: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select clan" />
                    </SelectTrigger>
                    <SelectContent>
                      {CLANS.filter(c => !["Human", "Ghoul"].includes(c)).map(clan => (
                        <SelectItem key={clan} value={clan}>{clan}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    value={isGhoul ? "Ghoul" : "Human"}
                    disabled
                    className="bg-muted text-muted-foreground"
                  />
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Concept</Label>
              <Input
                value={characterData.concept}
                onChange={(e) => setCharacterData(prev => ({ ...prev, concept: e.target.value }))}
                placeholder="Brief character concept"
              />
            </div>

            {isVampire && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Generation</Label>
                  <Input
                    type="number"
                    min={4}
                    max={16}
                    value={characterData.generation}
                    onChange={(e) => setCharacterData(prev => ({ ...prev, generation: parseInt(e.target.value) || 13 }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Predator Type</Label>
                  <Select
                    value={characterData.predatorType}
                    onValueChange={(v) => setCharacterData(prev => ({ ...prev, predatorType: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {PREDATOR_TYPES.map(pt => (
                        <SelectItem key={pt} value={pt}>{pt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label className={isHuman ? "text-muted-foreground" : ""}>
                {isGhoul ? "Domitor" : "Sire"}
              </Label>
              <Input
                value={characterData.sire}
                onChange={(e) => setCharacterData(prev => ({ ...prev, sire: e.target.value }))}
                placeholder={isHuman ? "N/A for humans" : isGhoul ? "Domitor's name (optional)" : "Sire's name (optional)"}
                disabled={isHuman}
                className={isHuman ? "bg-muted text-muted-foreground" : ""}
              />
            </div>
          </div>
        );

      case "Attributes":
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Review and adjust the AI-generated attributes (1-5 scale).
            </p>
            
            <div className="grid grid-cols-3 gap-4">
              {["Physical", "Social", "Mental"].map((category, catIdx) => {
                const attrs = catIdx === 0 
                  ? [["strength", "Strength"], ["dexterity", "Dexterity"], ["stamina", "Stamina"]]
                  : catIdx === 1
                  ? [["charisma", "Charisma"], ["manipulation", "Manipulation"], ["composure", "Composure"]]
                  : [["intelligence", "Intelligence"], ["wits", "Wits"], ["resolve", "Resolve"]];
                
                return (
                  <div key={category} className="space-y-3">
                    <h4 className="font-semibold text-sm">{category}</h4>
                    {attrs.map(([key, label]) => (
                      <div key={key} className="space-y-1">
                        <Label className="text-xs">{label}</Label>
                        <Input
                          type="number"
                          min={1}
                          max={5}
                          value={(characterData as any)[key]}
                          onChange={(e) => setCharacterData(prev => ({ 
                            ...prev, 
                            [key]: parseInt(e.target.value) || 1 
                          }))}
                          className="h-8"
                        />
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        );

      case "Dice Pool":
      case "Dice Pools":
        return (
          <div className="space-y-4">
            {creationMethod === "simple" && (
              <div className="space-y-2">
                <Label>Difficulty (players roll against this)</Label>
                <div className="flex items-center gap-3">
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    value={characterData.simplePoolDifficulty}
                    onChange={(e) => setCharacterData(prev => ({
                      ...prev,
                      simplePoolDifficulty: parseInt(e.target.value) || 3
                    }))}
                    className="w-24"
                  />
                  <span className="text-sm text-muted-foreground">
                    NPC rolls {characterData.simplePoolDifficulty * 2} dice
                  </span>
                </div>
              </div>
            )}

            {creationMethod === "general" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Primary Pool (areas of expertise)</Label>
                    <Input
                      type="number"
                      min={1}
                      max={15}
                      value={characterData.generalPoolPrimary}
                      onChange={(e) => setCharacterData(prev => ({
                        ...prev,
                        generalPoolPrimary: parseInt(e.target.value) || 6
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Secondary Pool (other areas)</Label>
                    <Input
                      type="number"
                      min={1}
                      max={15}
                      value={characterData.generalPoolSecondary}
                      onChange={(e) => setCharacterData(prev => ({
                        ...prev,
                        generalPoolSecondary: parseInt(e.target.value) || 4
                      }))}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Health Max</Label>
                    <Input
                      type="number"
                      min={1}
                      max={15}
                      value={characterData.manualHealthMax}
                      onChange={(e) => setCharacterData(prev => ({
                        ...prev,
                        manualHealthMax: parseInt(e.target.value) || 6
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Willpower Max</Label>
                    <Input
                      type="number"
                      min={1}
                      max={15}
                      value={characterData.manualWillpowerMax}
                      onChange={(e) => setCharacterData(prev => ({
                        ...prev,
                        manualWillpowerMax: parseInt(e.target.value) || 6
                      }))}
                    />
                  </div>
                </div>
              </div>
            )}

            {creationMethod === "standard" && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Physical Pool</Label>
                    <Input
                      type="number"
                      min={1}
                      max={15}
                      value={characterData.standardPoolPhysical}
                      onChange={(e) => setCharacterData(prev => ({
                        ...prev,
                        standardPoolPhysical: parseInt(e.target.value) || 5
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Social Pool</Label>
                    <Input
                      type="number"
                      min={1}
                      max={15}
                      value={characterData.standardPoolSocial}
                      onChange={(e) => setCharacterData(prev => ({
                        ...prev,
                        standardPoolSocial: parseInt(e.target.value) || 5
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Mental Pool</Label>
                    <Input
                      type="number"
                      min={1}
                      max={15}
                      value={characterData.standardPoolMental}
                      onChange={(e) => setCharacterData(prev => ({
                        ...prev,
                        standardPoolMental: parseInt(e.target.value) || 5
                      }))}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Health Max</Label>
                    <Input
                      type="number"
                      min={1}
                      max={15}
                      value={characterData.manualHealthMax}
                      onChange={(e) => setCharacterData(prev => ({
                        ...prev,
                        manualHealthMax: parseInt(e.target.value) || 6
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Willpower Max</Label>
                    <Input
                      type="number"
                      min={1}
                      max={15}
                      value={characterData.manualWillpowerMax}
                      onChange={(e) => setCharacterData(prev => ({
                        ...prev,
                        manualWillpowerMax: parseInt(e.target.value) || 6
                      }))}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case "Powers":
        return (
          <div className="space-y-4">
            {isVampire ? (
              <>
                <div className="flex items-center justify-between">
                  <Label>Disciplines & Powers</Label>
                  <Button size="sm" variant="outline" onClick={addDiscipline}>
                    <Plus className="h-4 w-4 mr-1" /> Add Discipline
                  </Button>
                </div>
                
                <ScrollArea className="h-[250px]">
                  <div className="space-y-3">
                    {characterData.disciplines.map((disc, idx) => (
                      <Card key={idx} className="p-3">
                        <div className="flex items-start gap-2">
                          <div className="flex-1 space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                              <Select
                                value={disc.name}
                                onValueChange={(v) => updateDiscipline(idx, "name", v)}
                              >
                                <SelectTrigger className="h-8">
                                  <SelectValue placeholder="Discipline" />
                                </SelectTrigger>
                                <SelectContent>
                                  {DISCIPLINES.map(d => (
                                    <SelectItem key={d} value={d}>{d}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Input
                                type="number"
                                min={1}
                                max={5}
                                value={disc.level}
                                onChange={(e) => updateDiscipline(idx, "level", parseInt(e.target.value) || 1)}
                                placeholder="Level"
                                className="h-8"
                              />
                            </div>
                            <Input
                              value={disc.powers.join(", ")}
                              onChange={(e) => updateDiscipline(idx, "powers", e.target.value.split(",").map(p => p.trim()).filter(Boolean))}
                              placeholder="Powers (comma-separated)"
                              className="h-8 text-sm"
                            />
                          </div>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-8 w-8"
                            onClick={() => removeDiscipline(idx)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </Card>
                    ))}
                    {characterData.disciplines.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No disciplines added yet. Click "Add Discipline" to begin.
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                Non-vampire characters don't have disciplines.
              </p>
            )}
          </div>
        );

      case "Background":
        return (
          <ScrollArea className="h-[300px]">
            <div className="space-y-4 pr-4">
              <div className="space-y-2">
                <Label>Appearance</Label>
                <Textarea
                  value={characterData.appearance}
                  onChange={(e) => setCharacterData(prev => ({ ...prev, appearance: e.target.value }))}
                  placeholder="Physical description..."
                  className="min-h-16 resize-none"
                />
              </div>

              <div className="space-y-2">
                <Label>Distinguishing Features</Label>
                <Input
                  value={characterData.distinguishing_features}
                  onChange={(e) => setCharacterData(prev => ({ ...prev, distinguishing_features: e.target.value }))}
                  placeholder="Notable features..."
                />
              </div>

              <div className="space-y-2">
                <Label>History</Label>
                <Textarea
                  value={characterData.history}
                  onChange={(e) => setCharacterData(prev => ({ ...prev, history: e.target.value }))}
                  placeholder="Character background..."
                  className="min-h-20 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Ambition</Label>
                  <Input
                    value={characterData.ambition}
                    onChange={(e) => setCharacterData(prev => ({ ...prev, ambition: e.target.value }))}
                    placeholder="Long-term goal..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Desire</Label>
                  <Input
                    value={characterData.desire}
                    onChange={(e) => setCharacterData(prev => ({ ...prev, desire: e.target.value }))}
                    placeholder="Immediate want..."
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={characterData.notes}
                  onChange={(e) => setCharacterData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional notes..."
                  className="min-h-16 resize-none"
                />
              </div>
            </div>
          </ScrollArea>
        );

      case "Confirm":
        return (
          <div className="space-y-4">
            <div className="bg-muted/30 p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Name:</span>
                <span className="font-medium">{characterData.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Clan:</span>
                <span className="font-medium">{characterData.clan}</span>
              </div>
              {characterData.concept && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Concept:</span>
                  <span className="font-medium">{characterData.concept}</span>
                </div>
              )}
              {isVampire && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Generation:</span>
                  <span className="font-medium">{characterData.generation}th</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Creation Method:</span>
                <Badge variant="outline">
                  {creationMethod === "full" ? "Full V5" : 
                   creationMethod === "simple" ? "Simple Pool" :
                   creationMethod === "general" ? "General Pool" : "Standard Pools"}
                </Badge>
              </div>
              {isVampire && characterData.disciplines.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Disciplines:</span>
                  <span className="font-medium">
                    {characterData.disciplines.map(d => d.name).join(", ")}
                  </span>
                </div>
              )}
            </div>

            <p className="text-sm text-muted-foreground text-center">
              Click "Create NPC" to add this character to your chronicle.
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-primary" />
            Finalize NPC: {characterData.name || "New NPC"}
          </DialogTitle>
          <DialogDescription>
            Review and customize the AI-generated NPC before saving.
          </DialogDescription>
        </DialogHeader>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Step {step + 1} of {STEPS.length}</span>
            <span className="font-medium">{STEPS[step]}</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step Content */}
        <div className="min-h-[300px] py-4">
          {renderStepContent()}
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={step === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>

          {step === STEPS.length - 1 ? (
            <Button
              onClick={handleComplete}
              disabled={loading || !canProceed()}
              className="bg-gradient-blood hover:opacity-90"
            >
              {loading ? "Creating..." : (
                <>
                  <Check className="h-4 w-4 mr-1" />
                  Create NPC
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={nextStep}
              disabled={!canProceed()}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
