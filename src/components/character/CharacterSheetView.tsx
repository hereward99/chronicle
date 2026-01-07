import { Character, DicePoolConfig, SimpleDicePool, GeneralDicePool, StandardDicePool } from "@/hooks/useCharacters";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircle, Droplet, Download, Dices } from "lucide-react";
import { CharacterAttachmentsGallery } from "./CharacterAttachmentsGallery";
import { exportCharacterToPDF } from "@/lib/pdfExport";

interface CharacterSheetViewProps {
  character: Character;
}

// Rules reference data
const rulesReference = {
  attributes: {
    strength: "Physical power and ability to exert force. Used for melee damage and feats of strength.",
    dexterity: "Agility, reflexes, and hand-eye coordination. Used for ranged attacks and dodging.",
    stamina: "Endurance and resilience. Determines Health tracker capacity and resisting physical hardship.",
    charisma: "Charm, magnetism, and force of personality. Used to inspire and lead.",
    manipulation: "Ability to influence and deceive others. Used for social maneuvering.",
    composure: "Self-control and emotional stability. Determines Willpower capacity and resisting frenzy.",
    intelligence: "Reasoning and learning capacity. Used for analysis and knowledge.",
    wits: "Quick thinking and awareness. Determines initiative and perception.",
    resolve: "Focus and determination. Used to resist mental influence and maintain concentration."
  },
  trackers: {
    health: "Physical damage capacity. Stamina + 3. Superficial (/) damage heals quickly; Aggravated (×) damage takes time.",
    willpower: "Mental fortitude. Composure + Resolve. Spend to reroll failures or resist compulsions.",
    humanity: "Moral compass and connection to morality. Lose when breaking Convictions. At 0, you're a mindless monster.",
    hunger: "Need for blood. Ranges 0-5. At 5, must make Hunger Frenzy tests. Rises when using disciplines or taking damage.",
    bloodPotency: "Power of vitae. Affects discipline strength, feeding restrictions, and blood surge capacity.",
    experience: "Character progression points. Spend to increase traits, learn disciplines, or gain advantages."
  },
  disciplines: {
    general: "Supernatural vampire powers. Each dot unlocks new powers. Some require Blood Potency minimums."
  },
  resonance: {
    general: "The emotional state of blood. Affects discipline usage and can grant temporary benefits.",
    choleric: "Angry, aggressive, violent emotions. Resonates with Celerity and Potence.",
    melancholic: "Sad, fearful, depressed emotions. Resonates with Fortitude and Obfuscate.",
    phlegmatic: "Calm, apathetic, peaceful emotions. Resonates with Auspex and Dominate.",
    sanguine: "Happy, joyful, passionate emotions. Resonates with Blood Sorcery and Presence.",
    animal: "Beast blood. Slakes less Hunger but no risk of killing. Resonates with Animalism and Protean."
  }
};

const RuleTooltip = ({ title, description, children }: { title: string; description: string; children: React.ReactNode }) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <span className="cursor-help border-b border-dotted border-muted-foreground/50 inline-flex items-center gap-1">
        {children}
        <HelpCircle className="h-3 w-3 text-muted-foreground" />
      </span>
    </TooltipTrigger>
    <TooltipContent className="max-w-xs">
      <p className="font-semibold mb-1">{title}</p>
      <p className="text-xs">{description}</p>
    </TooltipContent>
  </Tooltip>
);

const ResonanceDisplay = ({ resonance }: { resonance?: string }) => {
  const resonanceTypes = resonance?.toLowerCase().split(',').map(r => r.trim()) || [];
  
  const getResonanceColor = (type: string) => {
    switch(type) {
      case 'choleric': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'melancholic': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'phlegmatic': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'sanguine': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'animal': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };
  
  if (!resonance || resonanceTypes.length === 0) {
    return <span className="text-xs text-muted-foreground">No resonance</span>;
  }
  
  return (
    <div className="flex flex-wrap gap-1">
      {resonanceTypes.map((type, idx) => (
        <Tooltip key={idx}>
          <TooltipTrigger asChild>
            <Badge 
              variant="outline" 
              className={`text-xs capitalize ${getResonanceColor(type)}`}
            >
              <Droplet className="h-3 w-3 mr-1" />
              {type}
            </Badge>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="font-semibold mb-1 capitalize">{type} Resonance</p>
            <p className="text-xs">
              {rulesReference.resonance[type as keyof typeof rulesReference.resonance] || 
               rulesReference.resonance.general}
            </p>
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
};

const DotRating = ({ current, max = 5, filled = false }: { current: number; max?: number; filled?: boolean }) => {
  return (
    <div className="flex gap-1">
      {Array.from({ length: max }).map((_, i) => (
        <div
          key={i}
          className={`w-3 h-3 rounded-full border-2 transition-colors ${
            i < current
              ? filled 
                ? "bg-primary border-primary" 
                : "border-primary bg-background"
              : "border-muted-foreground/30 bg-background"
          }`}
        />
      ))}
    </div>
  );
};

const HealthTracker = ({ 
  max, 
  superficial = 0, 
  aggravated = 0 
}: { 
  max: number; 
  superficial?: number; 
  aggravated?: number;
}) => {
  return (
    <div className="flex gap-1">
      {Array.from({ length: max }).map((_, i) => {
        const isAggravated = i < aggravated;
        const isSuperficial = !isAggravated && i < (aggravated + superficial);
        
        return (
          <div
            key={i}
            className={`w-5 h-5 border-2 transition-colors flex items-center justify-center text-xs font-bold ${
              isAggravated
                ? "border-destructive bg-destructive text-destructive-foreground"
                : isSuperficial
                ? "border-primary bg-primary/20 text-primary"
                : "border-muted-foreground/30 bg-background"
            }`}
          >
            {isAggravated ? "×" : isSuperficial ? "/" : ""}
          </div>
        );
      })}
    </div>
  );
};

// Dice Pools Display Component
const DicePoolsDisplay = ({ dicePools }: { dicePools: DicePoolConfig }) => {
  if (dicePools.type === 'simple') {
    return (
      <div className="space-y-4">
        <div className="p-4 bg-muted/50 rounded-lg">
          <div className="text-center">
            <div className="text-sm text-muted-foreground mb-2">Simple Antagonist</div>
            <div className="text-4xl font-bold text-primary">{dicePools.difficulty}</div>
            <div className="text-sm text-muted-foreground mt-2">Difficulty</div>
          </div>
        </div>
        <div className="text-sm text-muted-foreground text-center">
          Players roll against Difficulty {dicePools.difficulty}. This character rolls <strong>{dicePools.difficulty * 2} dice</strong>.
        </div>
      </div>
    );
  }

  if (dicePools.type === 'general') {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-muted/50 rounded-lg text-center">
            <div className="text-sm text-muted-foreground mb-2">Primary</div>
            <div className="text-3xl font-bold text-primary">{dicePools.primary}</div>
            <div className="text-xs text-muted-foreground mt-1">Areas of Expertise</div>
          </div>
          <div className="p-4 bg-muted/50 rounded-lg text-center">
            <div className="text-sm text-muted-foreground mb-2">Secondary</div>
            <div className="text-3xl font-bold text-muted-foreground">{dicePools.secondary}</div>
            <div className="text-xs text-muted-foreground mt-1">Other Areas</div>
          </div>
        </div>
        <div className="text-sm text-muted-foreground text-center">
          Format: {dicePools.primary}/{dicePools.secondary}
        </div>
      </div>
    );
  }

  if (dicePools.type === 'standard') {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-muted/50 rounded-lg text-center">
            <div className="text-sm text-muted-foreground mb-2">Physical</div>
            <div className="text-3xl font-bold text-primary">{dicePools.physical}</div>
          </div>
          <div className="p-4 bg-muted/50 rounded-lg text-center">
            <div className="text-sm text-muted-foreground mb-2">Social</div>
            <div className="text-3xl font-bold text-primary">{dicePools.social}</div>
          </div>
          <div className="p-4 bg-muted/50 rounded-lg text-center">
            <div className="text-sm text-muted-foreground mb-2">Mental</div>
            <div className="text-3xl font-bold text-primary">{dicePools.mental}</div>
          </div>
        </div>
        {dicePools.exceptional && dicePools.exceptional.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-semibold">Exceptional Pools</div>
            <div className="grid grid-cols-2 gap-2">
              {dicePools.exceptional.map((exc, idx) => (
                <div key={idx} className="flex justify-between items-center p-2 bg-primary/10 rounded border border-primary/20">
                  <span className="text-sm font-medium">{exc.name}</span>
                  <span className="text-lg font-bold text-primary">{exc.pool}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
};

export function CharacterSheetView({ character }: CharacterSheetViewProps) {
  return (
    <TooltipProvider>
      <div className="space-y-6">
        <CharacterSheetContent character={character} />
      </div>
    </TooltipProvider>
  );
}

function CharacterSheetContent({ character }: CharacterSheetViewProps) {
  // Auto-compute Health and Willpower from attributes
  const computedHealthMax = (character.stamina || 1) + 3;
  const computedWillpowerMax = (character.composure || 1) + (character.resolve || 1);

  const physicalAttributes = [
    { name: "Strength", value: character.strength || 1 },
    { name: "Dexterity", value: character.dexterity || 1 },
    { name: "Stamina", value: character.stamina || 1 },
  ];

  const socialAttributes = [
    { name: "Charisma", value: character.charisma || 1 },
    { name: "Manipulation", value: character.manipulation || 1 },
    { name: "Composure", value: character.composure || 1 },
  ];

  const mentalAttributes = [
    { name: "Intelligence", value: character.intelligence || 1 },
    { name: "Wits", value: character.wits || 1 },
    { name: "Resolve", value: character.resolve || 1 },
  ];

  // VtM 5th Edition Skills organized by category
  const skillCategories = {
    Physical: ["athletics", "brawl", "craft", "drive", "firearms", "melee", "larceny", "stealth", "survival"],
    Social: ["animal_ken", "etiquette", "insight", "intimidation", "leadership", "performance", "persuasion", "streetwise", "subterfuge"],
    Mental: ["academics", "awareness", "finance", "investigation", "medicine", "occult", "politics", "science", "technology"]
  };

  return (
    <>
      {/* Character Header */}
      <Card className="p-6">
        <div className="flex gap-6">
          <div className="flex-shrink-0 flex flex-col items-center gap-2">
            {character.avatar_url ? (
              <div className="w-32 h-32 rounded-lg overflow-hidden border-2 border-border shadow-lg">
                <img 
                  src={character.avatar_url} 
                  alt={character.name}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <Avatar className="w-32 h-32">
                <AvatarFallback className="text-3xl">{character.name.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
            )}
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => { exportCharacterToPDF(character); }}
              className="w-full"
            >
              <Download className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
          </div>
          
          <div className="flex-1 space-y-3">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">{character.name}</h2>
              <p className="text-muted-foreground">{character.concept || "No concept"}</p>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">{character.clan}</Badge>
              {character.clan !== "Human" && character.clan !== "Ghoul" && (
                <Badge variant="outline">Generation {character.generation || 13}</Badge>
              )}
              {character.predator_type && character.predator_type !== "None" && (
                <Badge variant="outline">{character.predator_type}</Badge>
              )}
              <Badge variant={character.type === "PC" ? "default" : "secondary"}>{character.type}</Badge>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              {character.sire && (
                <div>
                  <span className="text-muted-foreground">Sire:</span> {character.sire}
                </div>
              )}
              {character.coterie && (
                <div>
                  <span className="text-muted-foreground">Coterie:</span> {character.coterie}
                </div>
              )}
            </div>
            
            {character.clan !== "Human" && (
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm text-muted-foreground">Resonance:</span>
                </div>
                <ResonanceDisplay resonance={character.resonance} />
              </div>
            )}
          </div>
        </div>
      </Card>

      <Tabs defaultValue="stats" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="stats">Stats</TabsTrigger>
          <TabsTrigger value="disciplines">Disciplines</TabsTrigger>
          <TabsTrigger value="advantages">Advantages</TabsTrigger>
          <TabsTrigger value="beliefs">Beliefs</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
        </TabsList>

        {/* Stats Tab */}
        <TabsContent value="stats" className="space-y-6">
          {/* Trackers */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Trackers</h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <RuleTooltip title="Health" description={rulesReference.trackers.health}>
                    <span className="text-sm font-medium">Health</span>
                  </RuleTooltip>
                  <span className="text-xs text-muted-foreground">
                    {(character.health_aggravated || 0) + (character.health_superficial || 0)}/{computedHealthMax} damage
                  </span>
                </div>
                <HealthTracker 
                  max={computedHealthMax}
                  superficial={character.health_superficial}
                  aggravated={character.health_aggravated}
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <RuleTooltip title="Willpower" description={rulesReference.trackers.willpower}>
                    <span className="text-sm font-medium">Willpower</span>
                  </RuleTooltip>
                  <span className="text-xs text-muted-foreground">
                    {(character.willpower_aggravated || 0) + (character.willpower_superficial || 0)}/{computedWillpowerMax} damage
                  </span>
                </div>
                <HealthTracker 
                  max={computedWillpowerMax}
                  superficial={character.willpower_superficial}
                  aggravated={character.willpower_aggravated}
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <RuleTooltip title="Humanity" description={rulesReference.trackers.humanity}>
                    <span className="text-sm font-medium">Humanity</span>
                  </RuleTooltip>
                  <span className="text-xs text-muted-foreground">{character.humanity || 7}/10</span>
                </div>
                <DotRating current={character.humanity || 7} max={10} />
              </div>

              {character.clan !== "Human" && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <RuleTooltip title="Hunger" description={rulesReference.trackers.hunger}>
                      <span className="text-sm font-medium">Hunger</span>
                    </RuleTooltip>
                    <span className="text-xs text-muted-foreground">{character.hunger || 1}/5</span>
                  </div>
                  <DotRating current={character.hunger || 1} max={5} filled />
                </div>
              )}

              {character.clan !== "Human" && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <RuleTooltip title="Blood Potency" description={rulesReference.trackers.bloodPotency}>
                      <span className="text-sm font-medium">Blood Potency</span>
                    </RuleTooltip>
                    <span className="text-xs text-muted-foreground">{character.blood_potency || 0}</span>
                  </div>
                  <DotRating current={character.blood_potency || 0} max={10} />
                </div>
              )}

              <div>
                <div className="flex justify-between items-center mb-2">
                  <RuleTooltip title="Experience" description={rulesReference.trackers.experience}>
                    <span className="text-sm font-medium">Experience</span>
                  </RuleTooltip>
                  <span className="text-xs text-muted-foreground">
                    {(character.experience_total || 0) - (character.experience_spent || 0)} unspent
                  </span>
                </div>
                <div className="text-2xl font-bold text-primary">{character.experience_total || 0}</div>
              </div>
            </div>
          </Card>

          {/* Attributes */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Attributes</h3>
            <div className="grid grid-cols-3 gap-6">
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground mb-3">Physical</h4>
                <div className="space-y-2">
                  {physicalAttributes.map((attr) => (
                    <div key={attr.name} className="flex justify-between items-center">
                      <RuleTooltip 
                        title={attr.name} 
                        description={rulesReference.attributes[attr.name.toLowerCase() as keyof typeof rulesReference.attributes]}
                      >
                        <span className="text-sm">{attr.name}</span>
                      </RuleTooltip>
                      <DotRating current={attr.value} />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-muted-foreground mb-3">Social</h4>
                <div className="space-y-2">
                  {socialAttributes.map((attr) => (
                    <div key={attr.name} className="flex justify-between items-center">
                      <RuleTooltip 
                        title={attr.name} 
                        description={rulesReference.attributes[attr.name.toLowerCase() as keyof typeof rulesReference.attributes]}
                      >
                        <span className="text-sm">{attr.name}</span>
                      </RuleTooltip>
                      <DotRating current={attr.value} />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-muted-foreground mb-3">Mental</h4>
                <div className="space-y-2">
                  {mentalAttributes.map((attr) => (
                    <div key={attr.name} className="flex justify-between items-center">
                      <RuleTooltip 
                        title={attr.name} 
                        description={rulesReference.attributes[attr.name.toLowerCase() as keyof typeof rulesReference.attributes]}
                      >
                        <span className="text-sm">{attr.name}</span>
                      </RuleTooltip>
                      <DotRating current={attr.value} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Skills or Dice Pools */}
          {character.use_dice_pools && character.dice_pools ? (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Dices className="h-5 w-5" />
                Dice Pools
              </h3>
              <DicePoolsDisplay dicePools={character.dice_pools} />
            </Card>
          ) : (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Skills</h3>
              <div className="grid grid-cols-3 gap-6">
                {Object.entries(skillCategories).map(([category, skillList]) => (
                  <div key={category}>
                    <h4 className="text-sm font-semibold text-muted-foreground mb-3">{category}</h4>
                    <div className="space-y-2">
                      {skillList.map((skillKey) => {
                        const skill = character.skills?.[skillKey];
                        const rating = skill?.rating || 0;
                        const displayName = skillKey.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                        
                        return (
                          <div key={skillKey} className="flex justify-between items-center">
                            <div className="flex-1">
                              <span className="text-sm">{displayName}</span>
                              {skill?.specialty && (
                                <span className="text-xs text-muted-foreground ml-1">({skill.specialty})</span>
                              )}
                            </div>
                            {rating > 0 && <DotRating current={rating} />}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </TabsContent>

        {/* Disciplines Tab */}
        <TabsContent value="disciplines" className="space-y-6">
          <Card className="p-6">
            <RuleTooltip title="Disciplines" description={rulesReference.disciplines.general}>
              <h3 className="text-lg font-semibold mb-4">Disciplines</h3>
            </RuleTooltip>
            {character.disciplines && character.disciplines.length > 0 ? (
              <div className="space-y-4">
                {character.disciplines.map((disc, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">{disc.name}</span>
                      <DotRating current={disc.level} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No disciplines assigned yet</p>
            )}
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Powers</h3>
            {character.powers && character.powers.length > 0 ? (
              <div className="space-y-4">
                {character.powers.map((power, idx) => (
                  <div key={idx} className="border-l-2 border-primary pl-4">
                    <div className="flex items-start justify-between mb-1">
                      <div>
                        <h4 className="font-medium">{power.name}</h4>
                        <p className="text-xs text-muted-foreground">
                          {power.discipline} {power.level && `• Level ${power.level}`}
                          {power.cost && ` • ${power.cost}`}
                        </p>
                      </div>
                    </div>
                    {power.description && (
                      <p className="text-sm text-muted-foreground mt-2">{power.description}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No powers assigned yet</p>
            )}
          </Card>
        </TabsContent>

        {/* Advantages Tab */}
        <TabsContent value="advantages" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Advantages</h3>
            {character.advantages && character.advantages.length > 0 ? (
              <div className="space-y-3">
                {character.advantages.map((adv, idx) => (
                  <div key={idx} className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{adv.name}</span>
                        <Badge variant="outline" className="text-xs">{adv.type}</Badge>
                      </div>
                      {adv.description && (
                        <p className="text-sm text-muted-foreground mt-1">{adv.description}</p>
                      )}
                    </div>
                    {adv.rating && <DotRating current={adv.rating} />}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No advantages assigned yet</p>
            )}
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Flaws</h3>
            {character.flaws && character.flaws.length > 0 ? (
              <div className="space-y-3">
                {character.flaws.map((flaw, idx) => (
                  <div key={idx} className="flex justify-between items-start">
                    <div className="flex-1">
                      <span className="font-medium">{flaw.name}</span>
                      {flaw.description && (
                        <p className="text-sm text-muted-foreground mt-1">{flaw.description}</p>
                      )}
                    </div>
                    {flaw.rating && <DotRating current={flaw.rating} />}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No flaws assigned yet</p>
            )}
          </Card>

          {character.loresheets && character.loresheets.length > 0 && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Loresheets</h3>
              <div className="space-y-4">
                {character.loresheets.map((loresheet, idx) => (
                  <div key={idx}>
                    <h4 className="font-medium mb-2">{loresheet.name}</h4>
                    {loresheet.benefits && loresheet.benefits.length > 0 && (
                      <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                        {loresheet.benefits.map((benefit, bIdx) => (
                          <li key={bIdx}>{benefit}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}
        </TabsContent>

        {/* Beliefs Tab */}
        <TabsContent value="beliefs" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Convictions</h3>
            {character.convictions && character.convictions.length > 0 ? (
              <ul className="space-y-2">
                {character.convictions.map((conviction, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span className="text-sm">{conviction}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No convictions defined yet</p>
            )}
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Touchstones</h3>
            {character.touchstones && character.touchstones.length > 0 ? (
              <div className="space-y-4">
                {character.touchstones.map((touchstone, idx) => (
                  <div key={idx} className="border-l-2 border-primary pl-4">
                    <h4 className="font-medium">{touchstone.name}</h4>
                    {touchstone.conviction && (
                      <p className="text-sm text-muted-foreground">
                        Conviction: {touchstone.conviction}
                      </p>
                    )}
                    {touchstone.description && (
                      <p className="text-sm text-muted-foreground mt-1">{touchstone.description}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No touchstones defined yet</p>
            )}
          </Card>

          {character.ambition && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-2">Ambition</h3>
              <p className="text-sm">{character.ambition}</p>
            </Card>
          )}

          {character.desire && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-2">Desire</h3>
              <p className="text-sm">{character.desire}</p>
            </Card>
          )}
        </TabsContent>

        {/* Details Tab */}
        <TabsContent value="details" className="space-y-6">
          {character.appearance && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-2">Appearance</h3>
              <p className="text-sm whitespace-pre-wrap">{character.appearance}</p>
            </Card>
          )}

          {character.distinguishing_features && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-2">Distinguishing Features</h3>
              <p className="text-sm whitespace-pre-wrap">{character.distinguishing_features}</p>
            </Card>
          )}

          {character.history && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-2">History</h3>
              <p className="text-sm whitespace-pre-wrap">{character.history}</p>
            </Card>
          )}

          {character.notes && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-2">Notes</h3>
              <p className="text-sm whitespace-pre-wrap">{character.notes}</p>
            </Card>
          )}

          {character.resonance && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-2">Resonance</h3>
              <Badge>{character.resonance}</Badge>
            </Card>
          )}

          {/* Attachments Gallery */}
          <CharacterAttachmentsGallery attachments={character.attachments as any} />
        </TabsContent>
      </Tabs>
    </>
  );
}
