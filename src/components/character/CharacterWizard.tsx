import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useCharacters } from "@/hooks/useCharacters";
import { useChronicles } from "@/hooks/useChronicles";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, ChevronRight, Check, Wand2 } from "lucide-react";
import { Card } from "@/components/ui/card";

const STEPS = [
  "Character Type",
  "Basic Info",
  "Attributes",
  "Skills",
  "Powers",
  "Advantages",
  "Beliefs",
  "Review"
];

const CLANS = [
  "Banu Haqim", "Brujah", "Gangrel", "Hecata", "Lasombra", "Malkavian",
  "Ministry", "Nosferatu", "Ravnos", "Salubri", "Toreador", "Tremere",
  "Tzimisce", "Ventrue", "Caitiff", "Thin-Blood"
];

const PREDATOR_TYPES = [
  "Alleycat", "Bagger", "Blood Leech", "Cleaver", "Consensualist",
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
    
    // Disciplines
    disciplines: [] as Array<{ name: string; level: number }>,
    
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

      // Calculate health and willpower based on attributes
      const healthMax = characterData.stamina + 3;
      const willpowerMax = characterData.composure + characterData.resolve;

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
        avatar_url: null,
        predator_type: characterData.characterType === "vampire" ? characterData.predatorType : null,
        
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
        
        // Skills
        skills: characterData.skills,
        
        // Disciplines (only for vampires)
        disciplines: characterData.characterType === "vampire" ? characterData.disciplines : [],
        
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
      } as any);

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
    setStep(0);
    setCharacterData({
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
    switch (step) {
      case 0:
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
                    onClick={() => setCharacterData(prev => ({ ...prev, characterType: type as any }))}
                  >
                    <div className="text-center">
                      <div className="font-semibold capitalize">{type}</div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

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
                    onClick={() => setCharacterData(prev => ({ ...prev, pcOrNpc: role as any }))}
                  >
                    <div className="text-center">
                      <div className="font-semibold">{role === "PC" ? "Player Character" : "Non-Player Character"}</div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-4">
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

      case 2:
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

      case 3:
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

      case 4:
        return (
          <div className="space-y-4">
            {characterData.characterType === "vampire" ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <Label>Disciplines</Label>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      setCharacterData(prev => ({
                        ...prev,
                        disciplines: [...prev.disciplines, { name: "", level: 1 }]
                      }));
                    }}
                  >
                    Add Discipline
                  </Button>
                </div>

                {characterData.disciplines.map((disc, idx) => (
                  <Card key={idx} className="p-4 space-y-3">
                    <div className="flex gap-2">
                      <Select
                        value={disc.name}
                        onValueChange={(value) => {
                          const newDisciplines = [...characterData.disciplines];
                          newDisciplines[idx].name = value;
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
                          const newDisciplines = [...characterData.disciplines];
                          newDisciplines[idx].level = parseInt(e.target.value) || 1;
                          setCharacterData(prev => ({ ...prev, disciplines: newDisciplines }));
                        }}
                        className="w-20"
                      />
                    </div>
                  </Card>
                ))}

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

      case 5:
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

      case 6:
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

      case 7:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Review Your Character</h3>
            
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
