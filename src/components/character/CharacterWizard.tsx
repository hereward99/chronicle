import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useCharacters, DicePoolConfig, SimpleDicePool, GeneralDicePool, StandardDicePool, CombinedDicePool, ExceptionalPool } from "@/hooks/useCharacters";
import { useChronicles } from "@/hooks/useChronicles";
import { useToast } from "@/hooks/use-toast";
import { useFormDraft } from "@/hooks/useFormDraft";
import { ChevronLeft, ChevronRight, Check, Wand2 } from "lucide-react";
import { PortraitGenerator } from "@/components/character/PortraitGenerator";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

const MORTAL_TEMPLATES = {
  none: { pool: 0, health: 0, willpower: 0, label: "Custom (full attributes)" },
  weak: { pool: 3, health: 2, willpower: 2, label: "Weak (children, elderly, infirm)" },
  average: { pool: 5, health: 4, willpower: 3, label: "Average (ordinary mortal)" },
  gifted: { pool: 7, health: 5, willpower: 4, label: "Gifted (trained professional)" },
  deadly: { pool: 10, health: 6, willpower: 5, label: "Deadly (elite combatant)" },
} as const;

type MortalTemplateKey = keyof typeof MORTAL_TEMPLATES;
const FULL_STEPS = [
  "Character Type",
  "Basic Info",
  "Attributes",
  "Skills",
  "Powers",
  "Advantages",
  "Beliefs",
  "Review"
];

const DICE_POOL_STEPS = [
  "Character Type",
  "Basic Info",
  "Dice Pools",
  "Powers",
  "Advantages",
  "Beliefs",
  "Review"
];

const DICE_POOL_NO_ATTR_STEPS = [
  "Character Type",
  "Basic Info",
  "Dice Pools",
  "Powers",
  "Review"
];

const CLANS = [
  "Human", "Ghoul", "Banu Haqim", "Brujah", "Gangrel", "Hecata", "Lasombra", "Malkavian",
  "Ministry", "Nosferatu", "Ravnos", "Salubri", "Toreador", "Tremere",
  "Tzimisce", "Ventrue", "Caitiff", "Thin-Blood"
];

const PREDATOR_TYPES = [
  "None", "Alleycat", "Bagger", "Blood Leech", "Cleaver", "Consensualist",
  "Farmer", "Osiris", "Sandman", "Scene Queen", "Siren"
];

const SKILLS = {
  physical: ["Athletics", "Brawl", "Craft", "Drive", "Firearms", "Larceny", "Melee", "Stealth", "Survival"],
  social: ["Animal Ken", "Etiquette", "Insight", "Intimidation", "Leadership", "Performance", "Persuasion", "Streetwise", "Subterfuge"],
  mental: ["Academics", "Awareness", "Finance", "Investigation", "Medicine", "Occult", "Politics", "Science", "Technology"]
};

const DISCIPLINES = [
  "Animalism", "Auspex", "Blood Sorcery", "Celerity", "Dominate", "Fortitude",
  "Obfuscate", "Oblivion", "Potence", "Presence", "Protean", "Thin-Blood Alchemy"
];

// VTM 5e Core Powers by Discipline and Level
const DISCIPLINE_POWERS: Record<string, Record<number, string[]>> = {
  "Animalism": {
    1: ["Bond Famulus", "Sense the Beast"],
    2: ["Feral Whispers"],
    3: ["Animal Succulence", "Quell the Beast"],
    4: ["Subsume the Spirit", "Unliving Hive"],
    5: ["Drawing Out the Beast"],
  },
  "Auspex": {
    1: ["Heightened Senses", "Sense the Unseen"],
    2: ["Premonition"],
    3: ["Scry the Soul", "Share the Senses"],
    4: ["Spirit's Touch"],
    5: ["Clairvoyance", "Possession", "Telepathy"],
  },
  "Blood Sorcery": {
    1: ["Corrosive Vitae", "A Taste for Blood"],
    2: ["Extinguish Vitae"],
    3: ["Blood of Potency", "Scorpion's Touch"],
    4: ["Theft of Vitae"],
    5: ["Baal's Caress", "Cauldron of Blood"],
  },
  "Celerity": {
    1: ["Cat's Grace", "Rapid Reflexes"],
    2: ["Fleetness"],
    3: ["Blink", "Traversal"],
    4: ["Draught of Elegance", "Unerring Aim"],
    5: ["Lightning Strike", "Split Second"],
  },
  "Dominate": {
    1: ["Cloud Memory", "Compel"],
    2: ["Mesmerize"],
    3: ["Dementation", "The Forgetful Mind"],
    4: ["Submerged Directive"],
    5: ["Mass Manipulation", "Terminal Decree"],
  },
  "Fortitude": {
    1: ["Resilience", "Unswayable Mind"],
    2: ["Toughness"],
    3: ["Defy Bane", "Fortify the Inner Facade"],
    4: ["Draught of Endurance"],
    5: ["Flesh of Marble", "Prowess from Pain"],
  },
  "Obfuscate": {
    1: ["Cloak of Shadows", "Silence of Death"],
    2: ["Unseen Passage"],
    3: ["Ghost in the Machine", "Mask of a Thousand Faces"],
    4: ["Conceal", "Vanish"],
    5: ["Cloak the Gathering", "Imposter's Guise"],
  },
  "Oblivion": {
    1: ["Ashes to Ashes", "Oblivion's Sight", "Shadow Cloak", "The Binding Fetter"],
    2: ["Arms of Ahriman", "Shadow Cast", "Where the Shroud Thins"],
    3: ["Aura of Decay", "Passion Feast", "Shadow Perspective", "Touch of Oblivion"],
    4: ["Necrotic Plague", "Stygian Shroud", "Tenebrous Avatar"],
    5: ["Withering Spirit", "Skuld Fulfilled", "Shadow Step"],
  },
  "Potence": {
    1: ["Lethal Body", "Soaring Leap"],
    2: ["Prowess"],
    3: ["Brutal Feed", "Uncanny Grip"],
    4: ["Draught of Might"],
    5: ["Earthshock", "Fist of Caine"],
  },
  "Presence": {
    1: ["Awe", "Daunt"],
    2: ["Lingering Kiss"],
    3: ["Dread Gaze", "Entrancement"],
    4: ["Irresistible Voice", "Summon"],
    5: ["Majesty", "Star Magnetism"],
  },
  "Protean": {
    1: ["Eyes of the Beast", "Weight of the Feather"],
    2: ["Feral Weapons"],
    3: ["Earth Meld", "Shapechange"],
    4: ["Metamorphosis"],
    5: ["Mist Form", "The Unfettered Heart"],
  },
  "Thin-Blood Alchemy": {
    1: ["Far Reach", "Haze"],
    2: ["Envelop", "Profane Hieros Gamos"],
    3: ["Airborne Momentum", "Defractionate"],
    4: ["Awaken the Sleeper"],
    5: ["Cauldron of Rebirth"],
  },
};

interface CharacterWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CharacterWizard({ open, onOpenChange }: CharacterWizardProps) {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const { createCharacter } = useCharacters();
  const { currentChronicle, createDefaultChronicle } = useChronicles();
  const { toast } = useToast();

  const [characterData, setCharacterData] = useState({
    // Creation Method: "full" | "simple" | "general" | "standard"
    creationMethod: "full" as "full" | "simple" | "general" | "standard",
    
    // Portrait
    avatarUrl: null as string | null,
    
    // Type & Basic Info
    characterType: "vampire" as "vampire" | "ghoul" | "human",
    pcOrNpc: "PC" as "PC" | "NPC",
    name: "",
    concept: "",
    clan: "",
    generation: 13,
    predatorType: "",
    status: "Active",
    sire: "",
    coterie: "",
    mortalTemplate: "none" as MortalTemplateKey,
    
    // Dice Pool Options
    skipAttributes: false,
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
    skills: {} as Record<string, { rating: number; specialty?: string }>,
    
    // Disciplines & Powers
    disciplines: [] as Array<{ name: string; level: number; powers: string[] }>,
    
    // Advantages & Flaws
    advantages: [] as Array<{ name: string; type: string; rating?: number }>,
    flaws: [] as Array<{ name: string; rating?: number }>,
    
    // Beliefs
    convictions: [] as string[],
    touchstones: [] as Array<{ name: string; conviction?: string }>,
    ambition: "",
    desire: "",
    
    // Trackers
    humanity: 7,
    health_max: 3,
    willpower_max: 3,
  });

  const { clearDraft } = useFormDraft(
    'character-wizard',
    characterData,
    setCharacterData,
    { enabled: open }
  );

  // Check if using a mortal template
  const isMortalTemplate = (characterData.characterType === "human" || characterData.characterType === "ghoul") && characterData.mortalTemplate !== "none";

  // Determine which steps to use based on creation method
  const getSteps = () => {
    if (isMortalTemplate) {
      // Mortal templates skip attributes, skills, and dice pool config
      return ["Character Type", "Basic Info", "Powers", "Review"];
    }
    if (characterData.creationMethod !== "full") {
      if (characterData.skipAttributes) {
        return DICE_POOL_NO_ATTR_STEPS;
      }
      return DICE_POOL_STEPS;
    }
    return FULL_STEPS;
  };

  const STEPS = getSteps();
  const progress = ((step + 1) / STEPS.length) * 100;

  const nextStep = () => {
    if (step < STEPS.length - 1) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 0) setStep(step - 1);
  };

  const canProceed = () => {
    switch (step) {
      case 0: return true;
      case 1: 
        return characterData.name.trim() !== "" && 
               (characterData.characterType !== "vampire" || characterData.clan !== "");
      case 2: return true;
      case 3: return true;
      case 4: return true;
      case 5: return true;
      case 6: return true;
      case 7: return true;
      default: return true;
    }
  };

  const handleComplete = async () => {
    try {
      setLoading(true);

      let chronicleId = currentChronicle?.id;
      if (!chronicleId) {
        const defaultChronicle = await createDefaultChronicle();
        chronicleId = defaultChronicle.id;
      }

      // Determine if using dice pools (methods 2, 3, 4 or mortal template)
      const useDicePools = characterData.creationMethod !== "full" || isMortalTemplate;
      const skipAttributes = (characterData.skipAttributes && useDicePools) || isMortalTemplate;

      // Calculate health and willpower based on method
      let healthMax: number;
      let willpowerMax: number;
      
      if (isMortalTemplate) {
        const tmpl = MORTAL_TEMPLATES[characterData.mortalTemplate];
        healthMax = tmpl.health;
        willpowerMax = tmpl.willpower;
      } else if (useDicePools && skipAttributes) {
        // Dice pool methods without attributes
        if (characterData.creationMethod === "simple") {
          // Simple: health/willpower = difficulty × 2
          healthMax = characterData.simplePoolDifficulty * 2;
          willpowerMax = characterData.simplePoolDifficulty * 2;
        } else {
          // General/Standard: use manual values
          healthMax = characterData.manualHealthMax;
          willpowerMax = characterData.manualWillpowerMax;
        }
      } else {
        // Full method or dice pool with attributes: calculate from attributes
        healthMax = characterData.stamina + 3;
        willpowerMax = characterData.composure + characterData.resolve;
      }

      // Normalize skill keys to lowercase with underscores (e.g., "Animal Ken" -> "animal_ken")
      const normalizedSkills: Record<string, { rating: number; specialty?: string }> = {};
      for (const [skillName, skillData] of Object.entries(characterData.skills)) {
        const normalizedKey = skillName.toLowerCase().replace(/\s+/g, '_');
        normalizedSkills[normalizedKey] = skillData;
      }

      // Determine dice pool configuration
      let dicePoolConfig: DicePoolConfig | null = null;
      if (isMortalTemplate) {
        const tmpl = MORTAL_TEMPLATES[characterData.mortalTemplate];
        dicePoolConfig = { type: "simple", difficulty: Math.ceil(tmpl.pool / 2) } as SimpleDicePool;
      } else if (useDicePools) {
        switch (characterData.creationMethod) {
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
        clan: characterData.characterType === "vampire" ? characterData.clan : characterData.characterType.charAt(0).toUpperCase() + characterData.characterType.slice(1),
        concept: characterData.concept || null,
        type: characterData.pcOrNpc,
        generation: characterData.characterType === "vampire" ? characterData.generation : null,
        status: characterData.status,
        sire: characterData.sire || null,
        coterie: characterData.coterie || null,
        chronicle_id: chronicleId,
        avatar_url: characterData.avatarUrl,
        predator_type: characterData.characterType === "vampire" ? characterData.predatorType : null,
        
        // Dice Pools
        use_dice_pools: useDicePools,
        skip_attributes: skipAttributes,
        dice_pools: dicePoolConfig,
        
        // Attributes
        strength: characterData.strength,
        dexterity: characterData.dexterity,
        stamina: characterData.stamina,
        charisma: characterData.charisma,
        manipulation: characterData.manipulation,
        composure: characterData.composure,
        intelligence: characterData.intelligence,
        wits: characterData.wits,
        resolve: characterData.resolve,
        
        // Skills (normalized keys) - only if using full method
        skills: characterData.creationMethod === "full" ? normalizedSkills : {},
        
        // Disciplines (only for vampires) - extract powers into separate array
        disciplines: characterData.characterType === "vampire" 
          ? characterData.disciplines.map(d => ({ name: d.name, level: d.level })) 
          : [],
        powers: characterData.characterType === "vampire"
          ? characterData.disciplines.flatMap(d => 
              d.powers.map(p => ({ discipline: d.name, name: p }))
            )
          : [],
        
        // Advantages & Flaws
        advantages: characterData.advantages,
        flaws: characterData.flaws,
        
        // Beliefs
        convictions: characterData.convictions,
        touchstones: characterData.touchstones,
        ambition: characterData.ambition || null,
        desire: characterData.desire || null,
        
        // Trackers
        humanity: characterData.humanity,
        health_max: healthMax,
        willpower_max: willpowerMax,
        hunger: characterData.characterType === "vampire" ? 1 : 0,
        blood_potency: characterData.characterType === "vampire" ? 0 : 0,
      });

      toast({
        title: "Character created!",
        description: `${characterData.name} has been added to your chronicle.`,
      });

      onOpenChange(false);
      resetWizard();
    } catch (error: any) {
      toast({
        title: "Error creating character",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetWizard = () => {
    clearDraft();
    setStep(0);
    setCharacterData({
      creationMethod: "full",
      avatarUrl: null,
      characterType: "vampire",
      pcOrNpc: "PC",
      name: "",
      concept: "",
      clan: "",
      generation: 13,
      predatorType: "",
      status: "Active",
      sire: "",
      coterie: "",
      mortalTemplate: "none" as MortalTemplateKey,
      skipAttributes: false,
      simplePoolDifficulty: 3,
      generalPoolPrimary: 6,
      generalPoolSecondary: 4,
      standardPoolPhysical: 5,
      standardPoolSocial: 5,
      standardPoolMental: 5,
      exceptionalPools: [],
      manualHealthMax: 6,
      manualWillpowerMax: 6,
      strength: 1,
      dexterity: 1,
      stamina: 1,
      charisma: 1,
      manipulation: 1,
      composure: 1,
      intelligence: 1,
      wits: 1,
      resolve: 1,
      skills: {},
      disciplines: [],
      advantages: [],
      flaws: [],
      convictions: [],
      touchstones: [],
      ambition: "",
      desire: "",
      humanity: 7,
      health_max: 3,
      willpower_max: 3,
    });
  };

  const renderStepContent = () => {
    const currentStepName = STEPS[step];
    
    switch (currentStepName) {
      case "Character Type":
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Character Type *</Label>
              <div className="grid grid-cols-3 gap-3">
                {["vampire", "ghoul", "human"].map((type) => (
                  <Card
                    key={type}
                    className={`p-4 cursor-pointer transition-all ${
                      characterData.characterType === type
                        ? "border-primary bg-primary/10"
                        : "hover:border-primary/50"
                    }`}
                    onClick={() => setCharacterData(prev => ({ ...prev, characterType: type as "vampire" | "ghoul" | "human" }))}
                  >
                    <div className="text-center">
                      <div className="font-semibold capitalize">{type}</div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Mortal Template Selector */}
            {(characterData.characterType === "human" || characterData.characterType === "ghoul") && (
              <Card className="p-4 bg-muted/30 space-y-3">
                <div className="text-sm font-medium">Mortal Template (V5)</div>
                <p className="text-xs text-muted-foreground">
                  Use a predefined power level, or choose Custom for full attribute builds.
                </p>
                <Select 
                  value={characterData.mortalTemplate} 
                  onValueChange={(value: MortalTemplateKey) => setCharacterData(prev => ({ ...prev, mortalTemplate: value }))}
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
                {characterData.mortalTemplate !== "none" && (
                  <div className="text-xs text-muted-foreground">
                    <strong>{MORTAL_TEMPLATES[characterData.mortalTemplate].pool} dice</strong> pool · 
                    Health <strong>{MORTAL_TEMPLATES[characterData.mortalTemplate].health}</strong> · 
                    Willpower <strong>{MORTAL_TEMPLATES[characterData.mortalTemplate].willpower}</strong>
                  </div>
                )}
              </Card>
            )}

            <div className="space-y-2">
              <Label>Role *</Label>
              <div className="grid grid-cols-2 gap-3">
                {["PC", "NPC"].map((role) => (
                  <Card
                    key={role}
                    className={`p-4 cursor-pointer transition-all ${
                      characterData.pcOrNpc === role
                        ? "border-primary bg-primary/10"
                        : "hover:border-primary/50"
                    }`}
                    onClick={() => setCharacterData(prev => ({ 
                      ...prev, 
                      pcOrNpc: role as "PC" | "NPC",
                      // Reset to full method when switching to PC
                      creationMethod: role === "PC" ? "full" : prev.creationMethod,
                      skipAttributes: role === "PC" ? false : prev.skipAttributes
                    }))}
                  >
                    <div className="text-center">
                      <div className="font-semibold">{role === "PC" ? "Player Character" : "Non-Player Character"}</div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Creation Method Selection - hidden when mortal template is active */}
            {!isMortalTemplate && (
            <div className="space-y-2">
              <Label>Creation Method *</Label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: "full", label: "Full V5", desc: "Attributes, Skills, Disciplines (Core Rulebook)" },
                  { id: "simple", label: "Simple Pool", desc: "Single difficulty number for all rolls" },
                  { id: "general", label: "General Pool", desc: "Primary/Secondary format (e.g., 6/4)" },
                  { id: "standard", label: "Standard Pool", desc: "Physical/Social/Mental + Exceptional" }
                ].map((method) => (
                  <Card
                    key={method.id}
                    className={`p-3 cursor-pointer transition-all ${
                      characterData.creationMethod === method.id
                        ? "border-primary bg-primary/10"
                        : "hover:border-primary/50"
                    } ${characterData.pcOrNpc === "PC" && method.id !== "full" ? "opacity-50 cursor-not-allowed" : ""}`}
                    onClick={() => {
                      if (characterData.pcOrNpc === "PC" && method.id !== "full") return;
                      setCharacterData(prev => ({ ...prev, creationMethod: method.id as "full" | "simple" | "general" | "standard" }));
                    }}
                  >
                    <div className="text-center">
                      <div className="font-semibold text-sm">{method.label}</div>
                      <div className="text-xs text-muted-foreground">{method.desc}</div>
                    </div>
                  </Card>
                ))}
              </div>
              {characterData.pcOrNpc === "PC" && (
                <p className="text-xs text-muted-foreground">Player Characters use the Full V5 method.</p>
              )}
            </div>
            )}

            {/* Skip Attributes Option (for dice pool methods) */}
            {!isMortalTemplate && characterData.creationMethod !== "full" && (
              <div className="space-y-4 border-t pt-4">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="skipAttributes"
                    checked={characterData.skipAttributes}
                    onChange={(e) => setCharacterData(prev => ({ ...prev, skipAttributes: e.target.checked }))}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="skipAttributes" className="cursor-pointer">
                    Skip Attributes (optional – for simpler antagonists)
                  </Label>
                </div>

                {/* Simple Pool Configuration */}
                {characterData.creationMethod === "simple" && (
                  <div className="space-y-2">
                    <Label>Difficulty (players roll against this; NPC rolls 2× this)</Label>
                    <div className="flex items-center gap-3">
                      <Input
                        type="number"
                        min="1"
                        max="10"
                        value={characterData.simplePoolDifficulty}
                        onChange={(e) => setCharacterData(prev => ({
                          ...prev,
                          simplePoolDifficulty: parseInt(e.target.value) || 3
                        }))}
                        className="w-24"
                      />
                      <span className="text-sm text-muted-foreground">
                        (NPC rolls {characterData.simplePoolDifficulty * 2} dice)
                      </span>
                    </div>
                  </div>
                )}

                {/* General Pool Configuration */}
                {characterData.creationMethod === "general" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Primary Pool (areas of expertise)</Label>
                        <Input
                          type="number"
                          min="1"
                          max="15"
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
                          min="1"
                          max="15"
                          value={characterData.generalPoolSecondary}
                          onChange={(e) => setCharacterData(prev => ({
                            ...prev,
                            generalPoolSecondary: parseInt(e.target.value) || 4
                          }))}
                        />
                      </div>
                    </div>
                    {characterData.skipAttributes && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Health (Max)</Label>
                          <Input
                            type="number"
                            min="1"
                            max="15"
                            value={characterData.manualHealthMax}
                            onChange={(e) => setCharacterData(prev => ({
                              ...prev,
                              manualHealthMax: parseInt(e.target.value) || 6
                            }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Willpower (Max)</Label>
                          <Input
                            type="number"
                            min="1"
                            max="15"
                            value={characterData.manualWillpowerMax}
                            onChange={(e) => setCharacterData(prev => ({
                              ...prev,
                              manualWillpowerMax: parseInt(e.target.value) || 6
                            }))}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Standard Pool Configuration */}
                {characterData.creationMethod === "standard" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Physical Pool</Label>
                        <Input
                          type="number"
                          min="1"
                          max="15"
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
                          min="1"
                          max="15"
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
                          min="1"
                          max="15"
                          value={characterData.standardPoolMental}
                          onChange={(e) => setCharacterData(prev => ({
                            ...prev,
                            standardPoolMental: parseInt(e.target.value) || 5
                          }))}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label>Exceptional Pools</Label>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => setCharacterData(prev => ({
                            ...prev,
                            exceptionalPools: [...prev.exceptionalPools, { name: "", pool: 7 }]
                          }))}
                        >
                          Add Exceptional
                        </Button>
                      </div>
                      {characterData.exceptionalPools.map((exc, idx) => (
                        <div key={idx} className="flex gap-2 items-center">
                          <Input
                            placeholder="Skill or Discipline name"
                            value={exc.name}
                            onChange={(e) => {
                              const newExc = [...characterData.exceptionalPools];
                              newExc[idx] = { ...newExc[idx], name: e.target.value };
                              setCharacterData(prev => ({ ...prev, exceptionalPools: newExc }));
                            }}
                            className="flex-1"
                          />
                          <Input
                            type="number"
                            min="1"
                            max="15"
                            value={exc.pool}
                            onChange={(e) => {
                              const newExc = [...characterData.exceptionalPools];
                              newExc[idx] = { ...newExc[idx], pool: parseInt(e.target.value) || 7 };
                              setCharacterData(prev => ({ ...prev, exceptionalPools: newExc }));
                            }}
                            className="w-20"
                          />
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              setCharacterData(prev => ({
                                ...prev,
                                exceptionalPools: prev.exceptionalPools.filter((_, i) => i !== idx)
                              }));
                            }}
                          >
                            ×
                          </Button>
                        </div>
                      ))}
                    </div>

                    {characterData.skipAttributes && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Health (Max)</Label>
                          <Input
                            type="number"
                            min="1"
                            max="15"
                            value={characterData.manualHealthMax}
                            onChange={(e) => setCharacterData(prev => ({
                              ...prev,
                              manualHealthMax: parseInt(e.target.value) || 6
                            }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Willpower (Max)</Label>
                          <Input
                            type="number"
                            min="1"
                            max="15"
                            value={characterData.manualWillpowerMax}
                            onChange={(e) => setCharacterData(prev => ({
                              ...prev,
                              manualWillpowerMax: parseInt(e.target.value) || 6
                            }))}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Pool Guidelines:</strong> Standard Pools range 4–8. Health/Willpower range 5–8. 
                    Exceptional Pools can reach 10–11 for powerful characters.
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </div>
        );

      case "Basic Info":
        return (
          <div className="space-y-4">
            {/* AI Portrait Generator */}
            <div className="flex justify-center py-2">
              <PortraitGenerator
                details={{
                  name: characterData.name,
                  clan: characterData.clan,
                  concept: characterData.concept,
                  characterType: characterData.characterType,
                  predatorType: characterData.predatorType,
                  generation: characterData.generation,
                  strength: characterData.strength,
                  dexterity: characterData.dexterity,
                  stamina: characterData.stamina,
                  charisma: characterData.charisma,
                  manipulation: characterData.manipulation,
                  composure: characterData.composure,
                  intelligence: characterData.intelligence,
                  wits: characterData.wits,
                  resolve: characterData.resolve,
                }}
                avatarUrl={characterData.avatarUrl}
                onPortraitGenerated={(url) => setCharacterData(prev => ({ ...prev, avatarUrl: url }))}
                onPortraitRemoved={() => setCharacterData(prev => ({ ...prev, avatarUrl: null }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={characterData.name}
                onChange={(e) => setCharacterData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Character name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="concept">Concept</Label>
              <Input
                id="concept"
                value={characterData.concept}
                onChange={(e) => setCharacterData(prev => ({ ...prev, concept: e.target.value }))}
                placeholder="e.g., Idealistic journalist, Street-smart detective"
              />
            </div>

            {characterData.characterType === "vampire" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="clan">Clan *</Label>
                  <Select value={characterData.clan} onValueChange={(value) => setCharacterData(prev => ({ ...prev, clan: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select clan" />
                    </SelectTrigger>
                    <SelectContent>
                      {CLANS.map((clan) => (
                        <SelectItem key={clan} value={clan}>{clan}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="generation">Generation</Label>
                    <Input
                      id="generation"
                      type="number"
                      min="1"
                      max="15"
                      value={characterData.generation}
                      onChange={(e) => setCharacterData(prev => ({ ...prev, generation: parseInt(e.target.value) || 13 }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="predatorType">Predator Type</Label>
                    <Select value={characterData.predatorType} onValueChange={(value) => setCharacterData(prev => ({ ...prev, predatorType: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {PREDATOR_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sire">Sire</Label>
                <Input
                  id="sire"
                  value={characterData.sire}
                  onChange={(e) => setCharacterData(prev => ({ ...prev, sire: e.target.value }))}
                  placeholder="Sire name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="coterie">Coterie</Label>
                <Input
                  id="coterie"
                  value={characterData.coterie}
                  onChange={(e) => setCharacterData(prev => ({ ...prev, coterie: e.target.value }))}
                  placeholder="Coterie name"
                />
              </div>
            </div>
          </div>
        );

      case "Attributes":
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="font-semibold">Physical Attributes</div>
              {["strength", "dexterity", "stamina"].map((attr) => (
                <div key={attr} className="flex items-center justify-between">
                  <Label className="capitalize">{attr}</Label>
                  <div className="flex gap-2 items-center">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setCharacterData(prev => ({ ...prev, [attr]: Math.max(1, prev[attr as keyof typeof prev] as number - 1) }))}
                    >
                      -
                    </Button>
                    <span className="w-8 text-center font-bold">{characterData[attr as keyof typeof characterData] as number}</span>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setCharacterData(prev => ({ ...prev, [attr]: Math.min(5, prev[attr as keyof typeof prev] as number + 1) }))}
                    >
                      +
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <div className="font-semibold">Social Attributes</div>
              {["charisma", "manipulation", "composure"].map((attr) => (
                <div key={attr} className="flex items-center justify-between">
                  <Label className="capitalize">{attr}</Label>
                  <div className="flex gap-2 items-center">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setCharacterData(prev => ({ ...prev, [attr]: Math.max(1, prev[attr as keyof typeof prev] as number - 1) }))}
                    >
                      -
                    </Button>
                    <span className="w-8 text-center font-bold">{characterData[attr as keyof typeof characterData] as number}</span>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setCharacterData(prev => ({ ...prev, [attr]: Math.min(5, prev[attr as keyof typeof prev] as number + 1) }))}
                    >
                      +
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <div className="font-semibold">Mental Attributes</div>
              {["intelligence", "wits", "resolve"].map((attr) => (
                <div key={attr} className="flex items-center justify-between">
                  <Label className="capitalize">{attr}</Label>
                  <div className="flex gap-2 items-center">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setCharacterData(prev => ({ ...prev, [attr]: Math.max(1, prev[attr as keyof typeof prev] as number - 1) }))}
                    >
                      -
                    </Button>
                    <span className="w-8 text-center font-bold">{characterData[attr as keyof typeof characterData] as number}</span>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setCharacterData(prev => ({ ...prev, [attr]: Math.min(5, prev[attr as keyof typeof prev] as number + 1) }))}
                    >
                      +
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case "Skills":
        return (
          <div className="space-y-6">
            {Object.entries(SKILLS).map(([category, skillList]) => (
              <div key={category} className="space-y-3">
                <div className="font-semibold capitalize">{category} Skills</div>
                {skillList.map((skill) => (
                  <div key={skill} className="flex items-center justify-between">
                    <Label>{skill}</Label>
                    <div className="flex gap-2 items-center">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const currentRating = characterData.skills[skill]?.rating || 0;
                          if (currentRating > 0) {
                            setCharacterData(prev => ({
                              ...prev,
                              skills: {
                                ...prev.skills,
                                [skill]: { ...prev.skills[skill], rating: currentRating - 1 }
                              }
                            }));
                          }
                        }}
                      >
                        -
                      </Button>
                      <span className="w-8 text-center font-bold">{characterData.skills[skill]?.rating || 0}</span>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const currentRating = characterData.skills[skill]?.rating || 0;
                          if (currentRating < 5) {
                            setCharacterData(prev => ({
                              ...prev,
                              skills: {
                                ...prev.skills,
                                [skill]: { ...prev.skills[skill], rating: currentRating + 1 }
                              }
                            }));
                          }
                        }}
                      >
                        +
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        );

      case "Dice Pools":
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label className="text-lg font-semibold">Current Creation Method: {characterData.creationMethod.charAt(0).toUpperCase() + characterData.creationMethod.slice(1)}</Label>
              <p className="text-sm text-muted-foreground">
                Configure your dice pool values below. You selected this method in the Character Type step.
              </p>
            </div>

            {/* Simple Pool Configuration */}
            {characterData.creationMethod === "simple" && (
              <div className="space-y-2">
                <Label>Difficulty (players roll against this; NPC rolls 2× this)</Label>
                <div className="flex items-center gap-3">
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    value={characterData.simplePoolDifficulty}
                    onChange={(e) => setCharacterData(prev => ({
                      ...prev,
                      simplePoolDifficulty: parseInt(e.target.value) || 3
                    }))}
                    className="w-24"
                  />
                  <span className="text-sm text-muted-foreground">
                    (NPC rolls {characterData.simplePoolDifficulty * 2} dice)
                  </span>
                </div>
              </div>
            )}

            {/* General Pool Configuration */}
            {characterData.creationMethod === "general" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Primary Pool (areas of expertise)</Label>
                    <Input
                      type="number"
                      min="1"
                      max="15"
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
                      min="1"
                      max="15"
                      value={characterData.generalPoolSecondary}
                      onChange={(e) => setCharacterData(prev => ({
                        ...prev,
                        generalPoolSecondary: parseInt(e.target.value) || 4
                      }))}
                    />
                  </div>
                </div>
                {characterData.skipAttributes && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Health (Max)</Label>
                      <Input
                        type="number"
                        min="1"
                        max="15"
                        value={characterData.manualHealthMax}
                        onChange={(e) => setCharacterData(prev => ({
                          ...prev,
                          manualHealthMax: parseInt(e.target.value) || 6
                        }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Willpower (Max)</Label>
                      <Input
                        type="number"
                        min="1"
                        max="15"
                        value={characterData.manualWillpowerMax}
                        onChange={(e) => setCharacterData(prev => ({
                          ...prev,
                          manualWillpowerMax: parseInt(e.target.value) || 6
                        }))}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Standard Pool Configuration */}
            {characterData.creationMethod === "standard" && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Physical Pool</Label>
                    <Input
                      type="number"
                      min="1"
                      max="15"
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
                      min="1"
                      max="15"
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
                      min="1"
                      max="15"
                      value={characterData.standardPoolMental}
                      onChange={(e) => setCharacterData(prev => ({
                        ...prev,
                        standardPoolMental: parseInt(e.target.value) || 5
                      }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label>Exceptional Pools</Label>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setCharacterData(prev => ({
                        ...prev,
                        exceptionalPools: [...prev.exceptionalPools, { name: "", pool: 7 }]
                      }))}
                    >
                      Add Exceptional
                    </Button>
                  </div>
                  {characterData.exceptionalPools.map((exc, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <Input
                        placeholder="Skill or Discipline name"
                        value={exc.name}
                        onChange={(e) => {
                          const newExc = [...characterData.exceptionalPools];
                          newExc[idx] = { ...newExc[idx], name: e.target.value };
                          setCharacterData(prev => ({ ...prev, exceptionalPools: newExc }));
                        }}
                        className="flex-1"
                      />
                      <Input
                        type="number"
                        min="1"
                        max="15"
                        value={exc.pool}
                        onChange={(e) => {
                          const newExc = [...characterData.exceptionalPools];
                          newExc[idx] = { ...newExc[idx], pool: parseInt(e.target.value) || 7 };
                          setCharacterData(prev => ({ ...prev, exceptionalPools: newExc }));
                        }}
                        className="w-20"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          setCharacterData(prev => ({
                            ...prev,
                            exceptionalPools: prev.exceptionalPools.filter((_, i) => i !== idx)
                          }));
                        }}
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>

                {characterData.skipAttributes && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Health (Max)</Label>
                      <Input
                        type="number"
                        min="1"
                        max="15"
                        value={characterData.manualHealthMax}
                        onChange={(e) => setCharacterData(prev => ({
                          ...prev,
                          manualHealthMax: parseInt(e.target.value) || 6
                        }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Willpower (Max)</Label>
                      <Input
                        type="number"
                        min="1"
                        max="15"
                        value={characterData.manualWillpowerMax}
                        onChange={(e) => setCharacterData(prev => ({
                          ...prev,
                          manualWillpowerMax: parseInt(e.target.value) || 6
                        }))}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Pool Guidelines:</strong> Standard Pools range 4–8. Health/Willpower range 5–8. 
                Exceptional Pools can reach 10–11 for powerful characters.
              </AlertDescription>
            </Alert>
          </div>
        );

      case "Powers":
        return (
          <div className="space-y-4">
            {characterData.characterType === "vampire" ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <Label>Disciplines & Powers</Label>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      setCharacterData(prev => ({
                        ...prev,
                        disciplines: [...prev.disciplines, { name: "", level: 1, powers: [] }]
                      }));
                    }}
                  >
                    Add Discipline
                  </Button>
                </div>

                {characterData.disciplines.map((disc, idx) => {
                  // Get available powers for the selected discipline up to its level
                  const availablePowers: string[] = [];
                  if (disc.name && DISCIPLINE_POWERS[disc.name]) {
                    for (let lvl = 1; lvl <= disc.level; lvl++) {
                      const powersAtLevel = DISCIPLINE_POWERS[disc.name][lvl] || [];
                      availablePowers.push(...powersAtLevel);
                    }
                  }

                  return (
                    <Card key={idx} className="p-4 space-y-3">
                      <div className="flex gap-2">
                        <Select
                          value={disc.name}
                          onValueChange={(value) => {
                            const newDisciplines = [...characterData.disciplines];
                            newDisciplines[idx].name = value;
                            newDisciplines[idx].powers = []; // Reset powers when discipline changes
                            setCharacterData(prev => ({ ...prev, disciplines: newDisciplines }));
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select discipline" />
                          </SelectTrigger>
                          <SelectContent>
                            {DISCIPLINES.map((d) => (
                              <SelectItem key={d} value={d}>{d}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            setCharacterData(prev => ({
                              ...prev,
                              disciplines: prev.disciplines.filter((_, i) => i !== idx)
                            }));
                          }}
                        >
                          Remove
                        </Button>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Label>Level</Label>
                        <Input
                          type="number"
                          min="1"
                          max="5"
                          value={disc.level}
                          onChange={(e) => {
                            const newLevel = Math.min(5, Math.max(1, parseInt(e.target.value) || 1));
                            const newDisciplines = [...characterData.disciplines];
                            newDisciplines[idx].level = newLevel;
                            // Filter out powers that are now above the new level
                            if (disc.name && DISCIPLINE_POWERS[disc.name]) {
                              const validPowers: string[] = [];
                              for (let lvl = 1; lvl <= newLevel; lvl++) {
                                validPowers.push(...(DISCIPLINE_POWERS[disc.name][lvl] || []));
                              }
                              newDisciplines[idx].powers = disc.powers.filter(p => 
                                validPowers.includes(p) || !Object.values(DISCIPLINE_POWERS[disc.name] || {}).flat().includes(p)
                              );
                            }
                            setCharacterData(prev => ({ ...prev, disciplines: newDisciplines }));
                          }}
                          className="w-20"
                        />
                      </div>

                      {disc.name && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-sm text-muted-foreground">Powers</Label>
                          </div>
                          
                          {/* Selected powers */}
                          <div className="flex flex-wrap gap-2">
                            {disc.powers.map((power, powerIdx) => (
                              <Badge key={powerIdx} variant="secondary" className="flex items-center gap-1">
                                {power}
                                <button
                                  type="button"
                                  className="ml-1 hover:text-destructive"
                                  onClick={() => {
                                    const newDisciplines = [...characterData.disciplines];
                                    newDisciplines[idx].powers = disc.powers.filter((_, i) => i !== powerIdx);
                                    setCharacterData(prev => ({ ...prev, disciplines: newDisciplines }));
                                  }}
                                >
                                  ×
                                </button>
                              </Badge>
                            ))}
                          </div>

                          {/* Power selector dropdown */}
                          <div className="flex gap-2">
                            <Select
                              value=""
                              onValueChange={(value) => {
                                if (value === "__custom__") {
                                  // Will be handled by custom input
                                  return;
                                }
                                if (value && !disc.powers.includes(value)) {
                                  const newDisciplines = [...characterData.disciplines];
                                  newDisciplines[idx].powers = [...disc.powers, value];
                                  setCharacterData(prev => ({ ...prev, disciplines: newDisciplines }));
                                }
                              }}
                            >
                              <SelectTrigger className="flex-1">
                                <SelectValue placeholder="Add a power..." />
                              </SelectTrigger>
                              <SelectContent>
                                {[1, 2, 3, 4, 5].filter(lvl => lvl <= disc.level).map(lvl => {
                                  const powersAtLevel = DISCIPLINE_POWERS[disc.name]?.[lvl] || [];
                                  const unselectedPowers = powersAtLevel.filter(p => !disc.powers.includes(p));
                                  if (unselectedPowers.length === 0) return null;
                                  return (
                                    <div key={lvl}>
                                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                                        Level {lvl}
                                      </div>
                                      {unselectedPowers.map(power => (
                                        <SelectItem key={power} value={power}>
                                          {power}
                                        </SelectItem>
                                      ))}
                                    </div>
                                  );
                                })}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Custom power input */}
                          <div className="flex gap-2">
                            <Input
                              placeholder="Add custom power..."
                              id={`custom-power-${idx}`}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  const input = e.target as HTMLInputElement;
                                  const customPower = input.value.trim();
                                  if (customPower && !disc.powers.includes(customPower)) {
                                    const newDisciplines = [...characterData.disciplines];
                                    newDisciplines[idx].powers = [...disc.powers, customPower];
                                    setCharacterData(prev => ({ ...prev, disciplines: newDisciplines }));
                                    input.value = '';
                                  }
                                }
                              }}
                            />
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const input = document.getElementById(`custom-power-${idx}`) as HTMLInputElement;
                                const customPower = input?.value.trim();
                                if (customPower && !disc.powers.includes(customPower)) {
                                  const newDisciplines = [...characterData.disciplines];
                                  newDisciplines[idx].powers = [...disc.powers, customPower];
                                  setCharacterData(prev => ({ ...prev, disciplines: newDisciplines }));
                                  input.value = '';
                                }
                              }}
                            >
                              Add
                            </Button>
                          </div>
                        </div>
                      )}
                    </Card>
                  );
                })}

                {characterData.disciplines.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No disciplines added yet. Click "Add Discipline" to get started.
                  </p>
                )}
              </>
            ) : (
              <p className="text-center py-8 text-muted-foreground">
                {characterData.characterType === "ghoul" 
                  ? "Ghouls can learn disciplines from their domitor. Add them after creation."
                  : "Humans don't have disciplines. You can skip this step."}
              </p>
            )}
          </div>
        );

      case "Advantages":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Advantages</Label>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    setCharacterData(prev => ({
                      ...prev,
                      advantages: [...prev.advantages, { name: "", type: "Merit", rating: 1 }]
                    }));
                  }}
                >
                  Add Advantage
                </Button>
              </div>

              {characterData.advantages.map((adv, idx) => (
                <Card key={idx} className="p-3 space-y-2">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Advantage name"
                      value={adv.name}
                      onChange={(e) => {
                        const newAdvantages = [...characterData.advantages];
                        newAdvantages[idx].name = e.target.value;
                        setCharacterData(prev => ({ ...prev, advantages: newAdvantages }));
                      }}
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        setCharacterData(prev => ({
                          ...prev,
                          advantages: prev.advantages.filter((_, i) => i !== idx)
                        }));
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                </Card>
              ))}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Flaws</Label>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    setCharacterData(prev => ({
                      ...prev,
                      flaws: [...prev.flaws, { name: "", rating: 1 }]
                    }));
                  }}
                >
                  Add Flaw
                </Button>
              </div>

              {characterData.flaws.map((flaw, idx) => (
                <Card key={idx} className="p-3 space-y-2">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Flaw name"
                      value={flaw.name}
                      onChange={(e) => {
                        const newFlaws = [...characterData.flaws];
                        newFlaws[idx].name = e.target.value;
                        setCharacterData(prev => ({ ...prev, flaws: newFlaws }));
                      }}
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        setCharacterData(prev => ({
                          ...prev,
                          flaws: prev.flaws.filter((_, i) => i !== idx)
                        }));
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        );

      case "Beliefs":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Ambition</Label>
              <Textarea
                value={characterData.ambition}
                onChange={(e) => setCharacterData(prev => ({ ...prev, ambition: e.target.value }))}
                placeholder="What does your character strive for?"
              />
            </div>

            <div className="space-y-2">
              <Label>Desire</Label>
              <Textarea
                value={characterData.desire}
                onChange={(e) => setCharacterData(prev => ({ ...prev, desire: e.target.value }))}
                placeholder="What does your character want right now?"
              />
            </div>

            <div className="space-y-2">
              <Label>Humanity</Label>
              <div className="flex items-center gap-4">
                <Input
                  type="number"
                  min="0"
                  max="10"
                  value={characterData.humanity}
                  onChange={(e) => setCharacterData(prev => ({ ...prev, humanity: parseInt(e.target.value) || 7 }))}
                  className="w-20"
                />
                <span className="text-sm text-muted-foreground">Current humanity rating (0-10)</span>
              </div>
            </div>
          </div>
        );

      case "Review":
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Review Your Character</h3>
            
            {characterData.avatarUrl && (
              <div className="flex justify-center">
                <img src={characterData.avatarUrl} alt={characterData.name} className="h-24 w-24 rounded-full object-cover border-2 border-border" />
              </div>
            )}

            <Card className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="font-semibold">Name:</div>
                <div>{characterData.name || "Not set"}</div>
                
                <div className="font-semibold">Type:</div>
                <div className="capitalize">{characterData.characterType} {characterData.pcOrNpc}</div>
                
                {characterData.characterType === "vampire" && (
                  <>
                    <div className="font-semibold">Clan:</div>
                    <div>{characterData.clan || "Not selected"}</div>
                    
                    <div className="font-semibold">Generation:</div>
                    <div>{characterData.generation}th</div>
                  </>
                )}
                
                <div className="font-semibold">Concept:</div>
                <div>{characterData.concept || "None"}</div>
              </div>
            </Card>

            <Card className="p-4 space-y-2">
              <div className="font-semibold">Attributes</div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Physical</div>
                  <div>Str {characterData.strength}, Dex {characterData.dexterity}, Sta {characterData.stamina}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Social</div>
                  <div>Cha {characterData.charisma}, Man {characterData.manipulation}, Com {characterData.composure}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Mental</div>
                  <div>Int {characterData.intelligence}, Wits {characterData.wits}, Res {characterData.resolve}</div>
                </div>
              </div>
            </Card>

            <Card className="p-4 space-y-2">
              <div className="font-semibold">Skills</div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(characterData.skills)
                  .filter(([_, skill]) => skill.rating > 0)
                  .map(([name, skill]) => (
                    <Badge key={name} variant="secondary">
                      {name} {skill.rating}
                    </Badge>
                  ))}
                {Object.keys(characterData.skills).length === 0 && (
                  <span className="text-sm text-muted-foreground">No skills selected</span>
                )}
              </div>
            </Card>

            {characterData.characterType === "vampire" && characterData.disciplines.length > 0 && (
              <Card className="p-4 space-y-2">
                <div className="font-semibold">Disciplines</div>
                <div className="flex flex-wrap gap-2">
                  {characterData.disciplines.map((disc, idx) => (
                    <Badge key={idx} variant="secondary">
                      {disc.name} {disc.level}
                    </Badge>
                  ))}
                </div>
              </Card>
            )}

            <p className="text-sm text-muted-foreground">
              You can edit all details after creation using the character sheet.
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[90vh] flex flex-col min-h-0">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5" />
            Character Creation Wizard
          </DialogTitle>
          <DialogDescription>
            Step {step + 1} of {STEPS.length}: {STEPS[step]}
          </DialogDescription>
        </DialogHeader>

        <div className="mb-4">
          <Progress value={progress} className="h-2" />
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto pr-4">
          {renderStepContent()}
        </div>

        <div className="flex justify-between pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={prevStep}
            disabled={step === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          {step < STEPS.length - 1 ? (
            <Button
              type="button"
              onClick={nextStep}
              disabled={!canProceed()}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleComplete}
              disabled={loading || !canProceed()}
              className="bg-gradient-blood"
            >
              <Check className="h-4 w-4 mr-2" />
              {loading ? "Creating..." : "Create Character"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
