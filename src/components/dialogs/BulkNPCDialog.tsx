import { useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, RefreshCw, ArrowRight, ArrowLeft, Users, Check, X, Trash2, Edit, RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useChronicles } from "@/hooks/useChronicles";
import { useCharacters } from "@/hooks/useCharacters";
import { useCoteries } from "@/hooks/useCoteries";
import { useFactions } from "@/hooks/useFactions";
import { useGeneratorSettings } from "@/hooks/useGeneratorSettings";
import { generateWithOllama } from "@/lib/ollama";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { NPCWizardDialog } from "@/components/dialogs/NPCWizardDialog";

type CreationMethod = "full" | "simple" | "general" | "standard";
type CreatureType = "vampire" | "human" | "ghoul";

interface GeneratedNPC {
  data: any;
  status: "pending" | "generating" | "done" | "error" | "removed";
  error?: string;
}

const VAMPIRE_CLANS = [
  "Any", "Brujah", "Gangrel", "Malkavian", "Nosferatu", "Toreador", "Tremere", "Ventrue",
  "Caitiff", "Thin-Blood", "Lasombra", "Tzimisce", "Hecata", "Ravnos", "Salubri", "Ministry", "Banu Haqim"
];

interface BulkNPCDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BulkNPCDialog({ open, onOpenChange }: BulkNPCDialogProps) {
  const { toast } = useToast();
  const { currentChronicle } = useChronicles();
  const { createCharacter } = useCharacters();
  const { coteries, createCoterie, addMember } = useCoteries(currentChronicle?.id);
  const { factions, createFaction, addCharacterToFaction } = useFactions(currentChronicle?.id);
  const { settings: generatorSettings } = useGeneratorSettings();
  const { requireOnline } = useOnlineStatus();

  // Wizard step
  const [step, setStep] = useState<"template" | "guidance" | "review">("template");

  // Step 1: Group template
  const [groupTheme, setGroupTheme] = useState("");
  const [count, setCount] = useState(4);
  const [creatureType, setCreatureType] = useState<CreatureType>("vampire");
  const [creationMethod, setCreationMethod] = useState<CreationMethod>("full");
  const [clanFilter, setClanFilter] = useState("Any");
  const [generationMin, setGenerationMin] = useState(10);
  const [generationMax, setGenerationMax] = useState(13);
  const [npcStatus, setNpcStatus] = useState("Active");

  // Step 2: Individual guidance
  const [hints, setHints] = useState<string[]>([]);

  // Step 3: Review
  const [npcs, setNpcs] = useState<GeneratedNPC[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  // Coterie options
  const [createAsCoterie, setCreateAsCoterie] = useState(false);
  const [coterieName, setCoterieName] = useState("");
  const [coterieDescription, setCoterieDescription] = useState("");
  const [addToExistingCoterie, setAddToExistingCoterie] = useState(false);
  const [selectedCoterieId, setSelectedCoterieId] = useState("");

  // Faction options
  const [createAsFaction, setCreateAsFaction] = useState(false);
  const [factionName, setFactionName] = useState("");
  const [factionDescription, setFactionDescription] = useState("");
  const [factionColor, setFactionColor] = useState("#64748b");
  const [addToExistingFaction, setAddToExistingFaction] = useState(false);
  const [selectedFactionId, setSelectedFactionId] = useState("");

  // Edit individual NPC
  const [editingNPC, setEditingNPC] = useState<{ data: any; index: number } | null>(null);

  const resetDialog = useCallback(() => {
    setStep("template");
    setGroupTheme("");
    setCount(4);
    setCreatureType("vampire");
    setCreationMethod("full");
    setClanFilter("Any");
    setGenerationMin(10);
    setGenerationMax(13);
    setNpcStatus("Active");
    setHints([]);
    setNpcs([]);
    setIsGenerating(false);
    setGenerationProgress(0);
    setIsSaving(false);
    setCreateAsCoterie(false);
    setCoterieName("");
    setCoterieDescription("");
    setAddToExistingCoterie(false);
    setSelectedCoterieId("");
    setCreateAsFaction(false);
    setFactionName("");
    setFactionDescription("");
    setFactionColor("#64748b");
    setAddToExistingFaction(false);
    setSelectedFactionId("");
    setEditingNPC(null);
  }, []);

  const handleClose = () => {
    resetDialog();
    onOpenChange(false);
  };

  // Move to step 2
  const goToGuidance = () => {
    if (!groupTheme.trim()) return;
    setHints(Array(count).fill(""));
    setStep("guidance");
  };

  // Generate all NPCs
  const startGeneration = async () => {
    if (!generatorSettings.useLocalLLM && !requireOnline("Generate NPCs")) return;

    setStep("review");
    setIsGenerating(true);
    setGenerationProgress(0);

    const newNpcs: GeneratedNPC[] = Array(count).fill(null).map(() => ({ data: null, status: "pending" as const }));
    setNpcs([...newNpcs]);

    const generatedNames: string[] = [];

    for (let i = 0; i < count; i++) {
      newNpcs[i] = { data: null, status: "generating" };
      setNpcs([...newNpcs]);

      try {
        const npcData = await generateSingleNPC(i, generatedNames);
        newNpcs[i] = { data: npcData, status: "done" };
        if (npcData?.name) generatedNames.push(npcData.name);
      } catch (err: any) {
        newNpcs[i] = { data: null, status: "error", error: err.message };
      }

      setNpcs([...newNpcs]);
      setGenerationProgress(((i + 1) / count) * 100);

      // 1-second delay between calls
      if (i < count - 1) {
        await new Promise(r => setTimeout(r, 1000));
      }
    }

    setIsGenerating(false);
  };

  const generateSingleNPC = async (index: number, existingNames: string[]): Promise<any> => {
    const hint = hints[index] || "";
    
    let prompt = `Group theme: ${groupTheme}.`;
    if (hint) prompt += ` This specific NPC's role/concept: ${hint}.`;
    if (clanFilter !== "Any" && creatureType === "vampire") prompt += ` Clan: ${clanFilter}.`;
    if (creatureType === "vampire") prompt += ` Generation range: ${generationMin}th to ${generationMax}th.`;
    if (creatureType === "human") prompt += ` IMPORTANT: This is a HUMAN mortal character. Set clan to "Human", generation to null.`;
    if (creatureType === "ghoul") prompt += ` IMPORTANT: This is a GHOUL character. Set clan to "Ghoul", generation to null.`;
    if (creationMethod !== "full") prompt += ` This is a quick NPC, focus on concept and personality.`;
    if (existingNames.length > 0) prompt += ` Already generated NPCs in this group (avoid duplicate names): ${existingNames.join(", ")}.`;
    prompt += ` Status: ${npcStatus}.`;

    let data;
    if (generatorSettings.useLocalLLM) {
      data = await generateWithOllama(prompt, "npc", generatorSettings.ollamaUrl, generatorSettings.ollamaModel);
    } else {
      const { data: edgeData, error } = await supabase.functions.invoke('generate-content', {
        body: { prompt, contentType: "bulk-npc" }
      });
      if (error) throw new Error(error.message || 'Failed to generate');
      if (edgeData?.error) throw new Error(edgeData.error);
      data = edgeData;
    }

    if (!data?.parsed) throw new Error("Failed to parse generated content");

    // Enforce creature type
    if (creatureType === "human") {
      data.parsed.clan = "Human";
      data.parsed.generation = null;
    } else if (creatureType === "ghoul") {
      data.parsed.clan = "Ghoul";
      data.parsed.generation = null;
    }

    data.parsed.status = npcStatus;
    return data.parsed;
  };

  const retryNPC = async (index: number) => {
    const updated = [...npcs];
    updated[index] = { data: null, status: "generating" };
    setNpcs(updated);

    const existingNames = npcs
      .filter((n, i) => i !== index && n.status === "done" && n.data?.name)
      .map(n => n.data.name);

    try {
      const npcData = await generateSingleNPC(index, existingNames);
      updated[index] = { data: npcData, status: "done" };
    } catch (err: any) {
      updated[index] = { data: null, status: "error", error: err.message };
    }
    setNpcs([...updated]);
  };

  const removeNPC = (index: number) => {
    const updated = [...npcs];
    updated[index] = { ...updated[index], status: "removed" };
    setNpcs(updated);
  };

  const acceptableNPCs = npcs.filter(n => n.status === "done");

  const handleAcceptAll = async () => {
    if (!currentChronicle) {
      toast({ title: "No chronicle selected", description: "Please select a chronicle first.", variant: "destructive" });
      return;
    }
    if (createAsCoterie && !coterieName.trim()) {
      toast({ title: "Coterie name required", description: "Please enter a name for the coterie.", variant: "destructive" });
      return;
    }
    if (createAsFaction && !factionName.trim()) {
      toast({ title: "Faction name required", description: "Please enter a name for the faction.", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      const savedIds: string[] = [];

      for (const npc of acceptableNPCs) {
        const parsed = npc.data;
        const result = await createCharacter({
          chronicle_id: currentChronicle.id,
          name: parsed.name || "Generated NPC",
          clan: parsed.clan || "Caitiff",
          type: "NPC",
          status: parsed.status || "Active",
          generation: parsed.generation,
          concept: parsed.concept,
          sire: parsed.sire,
          coterie: parsed.coterie || null,
          avatar_url: parsed.avatar_url || null,
          predator_type: parsed.predator_type,
          ambition: parsed.ambition,
          desire: parsed.desire,
          resonance: parsed.resonance,
          appearance: parsed.appearance,
          distinguishing_features: parsed.distinguishing_features,
          history: parsed.history,
          notes: parsed.notes,
          strength: parsed.strength,
          dexterity: parsed.dexterity,
          stamina: parsed.stamina,
          charisma: parsed.charisma,
          manipulation: parsed.manipulation,
          composure: parsed.composure,
          intelligence: parsed.intelligence,
          wits: parsed.wits,
          resolve: parsed.resolve,
          skills: parsed.skills,
          disciplines: parsed.disciplines,
          advantages: parsed.advantages,
          flaws: parsed.flaws,
          convictions: parsed.convictions,
          touchstones: parsed.touchstones,
          loresheets: parsed.loresheets,
          blood_potency: parsed.blood_potency,
          humanity: parsed.humanity,
          hunger: parsed.hunger,
          experience_total: parsed.experience_total,
          experience_spent: parsed.experience_spent,
          health_max: (parsed.stamina || 2) + 3,
          willpower_max: (parsed.composure || 2) + (parsed.resolve || 2),
          use_dice_pools: creationMethod !== "full",
          skip_attributes: creationMethod !== "full",
          dice_pools: creationMethod !== "full" ? buildDicePools(parsed, creationMethod) : null,
        });
        if (result?.id) savedIds.push(result.id);
      }

      // Create new coterie if toggled
      if (createAsCoterie && savedIds.length > 0) {
        const coterieResult = await createCoterie({
          chronicle_id: currentChronicle.id,
          name: coterieName.trim(),
          description: coterieDescription.trim() || null,
          is_primary: false,
          chasse: 0,
          portillon: 0,
          lien: 0,
          domain: null,
          coterie_type: null,
          city: null,
          domain_merits: null,
          domain_resonance: null,
          haven_location: null,
          haven_merits_and_flaws: null,
          coterie_advantages_and_flaws: null,
          coterie_boons_and_debts: null,
          chronicle_tenets: null,
          coterie_goals: null,
          attachments: [],
        });

        if (coterieResult?.id) {
          for (const charId of savedIds) {
            await addMember(coterieResult.id, charId);
          }
        }
      }

      // Add to existing coterie if selected
      if (addToExistingCoterie && selectedCoterieId && savedIds.length > 0) {
        for (const charId of savedIds) {
          await addMember(selectedCoterieId, charId);
        }
      }

      // Create new faction if toggled
      if (createAsFaction && savedIds.length > 0) {
        const factionResult = await createFaction({
          chronicle_id: currentChronicle.id,
          name: factionName.trim(),
          description: factionDescription.trim() || null,
          color: factionColor,
        });

        if (factionResult?.id) {
          for (const charId of savedIds) {
            await addCharacterToFaction(charId, factionResult.id);
          }
        }
      }

      // Add to existing faction if selected
      if (addToExistingFaction && selectedFactionId && savedIds.length > 0) {
        for (const charId of savedIds) {
          await addCharacterToFaction(charId, selectedFactionId);
        }
      }

      const extras: string[] = [];
      if (createAsCoterie) extras.push(`coterie "${coterieName}" created`);
      if (addToExistingCoterie && selectedCoterieId) {
        const cot = coteries.find(c => c.id === selectedCoterieId);
        extras.push(`added to coterie "${cot?.name}"`);
      }
      if (createAsFaction) extras.push(`faction "${factionName}" created`);
      if (addToExistingFaction && selectedFactionId) {
        const fac = factions.find(f => f.id === selectedFactionId);
        extras.push(`added to faction "${fac?.name}"`);
      }

      toast({
        title: `${savedIds.length} NPCs saved`,
        description: extras.length > 0
          ? `Added to chronicle. ${extras.join("; ")}.`
          : "All NPCs added to your chronicle.",
      });

      handleClose();
    } catch (err: any) {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const buildDicePools = (_parsed: any, method: CreationMethod) => {
    if (method === "simple") return { type: "simple" as const, difficulty: 4 };
    if (method === "general") return { type: "general" as const, primary: 6, secondary: 4 };
    if (method === "standard") return { type: "standard" as const, physical: 5, social: 5, mental: 5, exceptional: [] };
    return null;
  };

  const handleEditComplete = (editedData: any) => {
    if (editingNPC !== null) {
      const updated = [...npcs];
      updated[editingNPC.index] = { data: editedData, status: "done" };
      setNpcs(updated);
      setEditingNPC(null);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent size="md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Generate NPC Group
            </DialogTitle>
            <DialogDescription>
              {step === "template" && "Define shared parameters for the group."}
              {step === "guidance" && "Optionally add role hints for individual NPCs."}
              {step === "review" && "Review generated NPCs before saving."}
            </DialogDescription>
          </DialogHeader>

          {/* STEP 1: Group Template */}
          {step === "template" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Group Theme / Context *</Label>
                <Textarea
                  placeholder="e.g. Camarilla Court of Chicago, Anarch cell in the Bronx, Second Inquisition strike team..."
                  value={groupTheme}
                  onChange={(e) => setGroupTheme(e.target.value)}
                  className="min-h-20 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Number of NPCs: {count}</Label>
                  <Slider
                    value={[count]}
                    onValueChange={([v]) => setCount(v)}
                    min={2}
                    max={8}
                    step={1}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Creature Type</Label>
                  <Select value={creatureType} onValueChange={(v) => setCreatureType(v as CreatureType)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vampire">Vampire</SelectItem>
                      <SelectItem value="human">Human</SelectItem>
                      <SelectItem value="ghoul">Ghoul</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Creation Method</Label>
                  <Select value={creationMethod} onValueChange={(v) => setCreationMethod(v as CreationMethod)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full">Full V5 Rules</SelectItem>
                      <SelectItem value="simple">Simple Pool</SelectItem>
                      <SelectItem value="general">General Pool</SelectItem>
                      <SelectItem value="standard">Standard Pools</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={npcStatus} onValueChange={setNpcStatus}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["Active", "Ally", "Enemy", "Neutral", "Unknown"].map(s => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {creatureType === "vampire" && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Clan Filter</Label>
                    <Select value={clanFilter} onValueChange={setClanFilter}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {VAMPIRE_CLANS.map(c => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Generation: {generationMin}th – {generationMax}th</Label>
                    <Slider
                      value={[generationMin, generationMax]}
                      onValueChange={([min, max]) => { setGenerationMin(min); setGenerationMax(max); }}
                      min={4}
                      max={16}
                      step={1}
                    />
                  </div>
                </div>
              )}

              <Button
                onClick={goToGuidance}
                disabled={!groupTheme.trim()}
                className="w-full bg-gradient-blood hover:opacity-90"
              >
                Next: Individual Guidance
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}

          {/* STEP 2: Individual Guidance */}
          {step === "guidance" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Optionally describe each NPC's role. Leave blank for AI to decide.
              </p>

              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                {hints.map((hint, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Badge variant="outline" className="shrink-0 w-16 justify-center">
                      NPC {i + 1}
                    </Badge>
                    <Input
                      placeholder="e.g. The Sheriff, a fledgling spy..."
                      value={hint}
                      onChange={(e) => {
                        const updated = [...hints];
                        updated[i] = e.target.value;
                        setHints(updated);
                      }}
                    />
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep("template")} className="flex-1">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={() => { setHints(Array(count).fill("")); }}
                  variant="ghost"
                  size="sm"
                >
                  Clear All
                </Button>
                <Button
                  onClick={startGeneration}
                  className="flex-1 bg-gradient-blood hover:opacity-90"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate {count} NPCs
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3: Review */}
          {step === "review" && (
            <div className="space-y-4">
              {isGenerating && (
                <div className="space-y-2">
                  <Progress value={generationProgress} />
                  <p className="text-sm text-muted-foreground text-center">
                    Generating NPCs... {Math.round(generationProgress)}%
                  </p>
                </div>
              )}

              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {npcs.map((npc, i) => (
                  <Card key={i} className={`p-3 ${npc.status === "removed" ? "opacity-40" : ""}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        {npc.status === "generating" && <RefreshCw className="h-4 w-4 animate-spin text-primary shrink-0" />}
                        {npc.status === "done" && <Check className="h-4 w-4 text-success shrink-0" />}
                        {npc.status === "error" && <X className="h-4 w-4 text-destructive shrink-0" />}
                        {npc.status === "pending" && <div className="h-4 w-4 rounded-full border border-muted-foreground shrink-0" />}
                        {npc.status === "removed" && <Trash2 className="h-4 w-4 text-muted-foreground shrink-0" />}
                        
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">
                            {npc.data?.name || (npc.status === "error" ? "Generation failed" : `NPC ${i + 1}`)}
                          </p>
                          {npc.data && (
                            <p className="text-xs text-muted-foreground truncate">
                              {npc.data.clan}{npc.data.concept ? ` — ${npc.data.concept}` : ""}
                            </p>
                          )}
                          {npc.error && <p className="text-xs text-destructive">{npc.error}</p>}
                        </div>
                      </div>

                      {npc.status !== "removed" && npc.status !== "generating" && npc.status !== "pending" && (
                        <div className="flex gap-1 shrink-0">
                          {npc.status === "done" && (
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingNPC({ data: npc.data, index: i })}>
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => retryNPC(i)}>
                            <RotateCcw className="h-3.5 w-3.5" />
                          </Button>
                          {npc.status === "done" && (
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => removeNPC(i)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>

              {/* Coterie & Faction options */}
              {!isGenerating && acceptableNPCs.length > 0 && (
                <div className="space-y-4 border-t pt-4">
                  {/* Coterie section */}
                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Coterie</p>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="coterie-toggle" className="cursor-pointer text-sm">Create new Coterie</Label>
                      <Switch
                        id="coterie-toggle"
                        checked={createAsCoterie}
                        onCheckedChange={(v) => { setCreateAsCoterie(v); if (v) setAddToExistingCoterie(false); }}
                      />
                    </div>
                    {createAsCoterie && (
                      <div className="space-y-2 pl-1">
                        <Input placeholder="Coterie name *" value={coterieName} onChange={(e) => setCoterieName(e.target.value)} />
                        <Input placeholder="Description (optional)" value={coterieDescription} onChange={(e) => setCoterieDescription(e.target.value)} />
                      </div>
                    )}

                    {coteries.length > 0 && (
                      <>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="existing-coterie-toggle" className="cursor-pointer text-sm">Add to existing Coterie</Label>
                          <Switch
                            id="existing-coterie-toggle"
                            checked={addToExistingCoterie}
                            onCheckedChange={(v) => { setAddToExistingCoterie(v); if (v) setCreateAsCoterie(false); }}
                          />
                        </div>
                        {addToExistingCoterie && (
                          <div className="pl-1">
                            <Select value={selectedCoterieId} onValueChange={setSelectedCoterieId}>
                              <SelectTrigger><SelectValue placeholder="Select coterie..." /></SelectTrigger>
                              <SelectContent>
                                {coteries.map(c => (
                                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Faction section */}
                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Faction</p>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="faction-toggle" className="cursor-pointer text-sm">Create new Faction</Label>
                      <Switch
                        id="faction-toggle"
                        checked={createAsFaction}
                        onCheckedChange={(v) => { setCreateAsFaction(v); if (v) setAddToExistingFaction(false); }}
                      />
                    </div>
                    {createAsFaction && (
                      <div className="space-y-2 pl-1">
                        <Input placeholder="Faction name *" value={factionName} onChange={(e) => setFactionName(e.target.value)} />
                        <Input placeholder="Description (optional)" value={factionDescription} onChange={(e) => setFactionDescription(e.target.value)} />
                        <div className="flex items-center gap-2">
                          <Label className="text-sm">Color</Label>
                          <input type="color" value={factionColor} onChange={(e) => setFactionColor(e.target.value)} className="h-8 w-10 rounded border border-border cursor-pointer" />
                        </div>
                      </div>
                    )}

                    {factions.length > 0 && (
                      <>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="existing-faction-toggle" className="cursor-pointer text-sm">Add to existing Faction</Label>
                          <Switch
                            id="existing-faction-toggle"
                            checked={addToExistingFaction}
                            onCheckedChange={(v) => { setAddToExistingFaction(v); if (v) setCreateAsFaction(false); }}
                          />
                        </div>
                        {addToExistingFaction && (
                          <div className="pl-1">
                            <Select value={selectedFactionId} onValueChange={setSelectedFactionId}>
                              <SelectTrigger><SelectValue placeholder="Select faction..." /></SelectTrigger>
                              <SelectContent>
                                {factions.map(f => (
                                  <SelectItem key={f.id} value={f.id}>
                                    <span className="flex items-center gap-2">
                                      <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: f.color }} />
                                      {f.name}
                                    </span>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  <Button
                    onClick={handleAcceptAll}
                    disabled={isSaving || acceptableNPCs.length === 0}
                    className="w-full bg-gradient-blood hover:opacity-90"
                  >
                    {isSaving ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4 mr-2" />
                    )}
                    {isSaving ? "Saving..." : `Accept ${acceptableNPCs.length} NPCs`}
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* NPC Edit Wizard */}
      {editingNPC && (
        <NPCWizardDialog
          open={!!editingNPC}
          onOpenChange={(open) => { if (!open) setEditingNPC(null); }}
          generatedData={editingNPC.data}
          creationMethod={creationMethod}
          creatureType={creatureType}
        />
      )}
    </>
  );
}
