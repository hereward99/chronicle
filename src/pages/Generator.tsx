import { useState } from "react";
import { notify } from "@/lib/notify";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, Copy, RefreshCw, Users, BookOpen, MapPin, Scroll, Save, Check, Bot, Cloud } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useChronicles } from "@/hooks/useChronicles";
import { useCharacters } from "@/hooks/useCharacters";
import { usePlots } from "@/hooks/usePlots";
import { useGeneratorSettings } from "@/hooks/useGeneratorSettings";
import { generateWithOllama } from "@/lib/ollama";
import { GenerateNPCDialog } from "@/components/dialogs/GenerateNPCDialog";
import { NPCWizardDialog } from "@/components/dialogs/NPCWizardDialog";
import { BulkNPCDialog } from "@/components/dialogs/BulkNPCDialog";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { copyText } from "@/lib/clipboard";

type CreationMethod = "full" | "simple" | "general" | "standard";
type CreatureType = "vampire" | "human" | "ghoul";

interface GeneratedData {
  content: string;
  parsed: any | null;
  contentType: string;
}

export default function Generator() {
  const [prompt, setPrompt] = useState("");
  const [generatedData, setGeneratedData] = useState<GeneratedData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState("scene");
  const { currentChronicle } = useChronicles();
  const { createCharacter } = useCharacters();
  const { createPlot } = usePlots();
  const { settings: generatorSettings } = useGeneratorSettings();
  const { requireOnline } = useOnlineStatus();
  
  // NPC Generation Dialog State
  const [showNPCDialog, setShowNPCDialog] = useState(false);
  const [showBulkNPCDialog, setShowBulkNPCDialog] = useState(false);
  const [showNPCWizard, setShowNPCWizard] = useState(false);
  const [npcGeneratedData, setNPCGeneratedData] = useState<any>(null);
  const [npcCreationMethod, setNPCCreationMethod] = useState<CreationMethod>("full");
  const [npcCreatureType, setNPCCreatureType] = useState<CreatureType>("vampire");

  const handleNPCGenerated = (data: any, method: CreationMethod, creatureType: CreatureType) => {
    setNPCGeneratedData(data);
    setNPCCreationMethod(method);
    setNPCCreatureType(creatureType);
    setShowNPCWizard(true);
  };

  const generateContent = async () => {
    if (!prompt.trim()) return;
    if (!generatorSettings.useLocalLLM && !requireOnline("Generate content")) return;
    
    setIsGenerating(true);
    setGeneratedData(null);
    setSaved(false);

    try {
      let data;

      if (generatorSettings.useLocalLLM) {
        // Use local Ollama
        data = await generateWithOllama(
          prompt,
          activeTab,
          generatorSettings.ollamaUrl,
          generatorSettings.ollamaModel
        );
      } else {
        // Use cloud AI via edge function
        const { data: edgeData, error } = await supabase.functions.invoke('generate-content', {
          body: { prompt, contentType: activeTab }
        });

        if (error) {
          throw new Error(error.message || 'Failed to generate content');
        }

        if (edgeData?.error) {
          throw new Error(edgeData.error);
        }

        data = edgeData;
      }

      setGeneratedData({
        content: data.content,
        parsed: data.parsed,
        contentType: data.contentType || activeTab
      });
    } catch (error) {
      console.error('Generation error:', error);
      const errorMessage = error instanceof Error ? error.message : "Failed to generate content. Please try again.";
      
      // Provide helpful hints for common Ollama errors
      let description = errorMessage;
      if (generatorSettings.useLocalLLM && errorMessage.includes('Failed to fetch')) {
        description = "Cannot connect to Ollama. Make sure it's running with CORS enabled: OLLAMA_ORIGINS=* ollama serve";
      }
      
      notify.error("Generation Failed", description);
    } finally {
      setIsGenerating(false);
    }
  };

  const saveToChronicle = async () => {
    if (!generatedData?.parsed || !currentChronicle) {
      notify.error("Cannot Save", currentChronicle ? "No valid content to save." : "Please select a chronicle first.");
      return;
    }

    setIsSaving(true);
    try {
      const { contentType, parsed } = generatedData;

      if (contentType === "npc") {
        // Save as character
        await createCharacter({
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
        });

        notify.success("NPC Saved", `${parsed.name} has been added to your characters.`);
      } else {
        // Save as plot/story (scene, story, location)
        await createPlot({
          chronicle_id: currentChronicle.id,
          title: parsed.title || "Generated Content",
          summary: null,
          description: parsed.description || "",
          status: parsed.status || "Active",
          priority: parsed.priority || "Medium"
        });

        notify.success("Story Saved", `"${parsed.title}" has been added to your stories.`);
      }

      setSaved(true);
    } catch (error) {
      console.error('Save error:', error);
      notify.error("Save Failed", error instanceof Error ? error.message : "Failed to save content.");
    } finally {
      setIsSaving(false);
    }
  };

  const copyToClipboard = () => {
    if (generatedData?.content) {
      copyText(generatedData.content, "Content");
    }
  };


  const generatorTypes = [
    { id: "scene", label: "Scene", icon: MapPin },
    { id: "npc", label: "NPC", icon: Users },
    { id: "story", label: "Story Hook", icon: BookOpen },
    { id: "location", label: "Location", icon: Scroll }
  ];

  const getSaveButtonText = () => {
    if (saved) return "Saved";
    if (isSaving) return "Saving...";
    if (activeTab === "npc") return "Add to Characters";
    return "Add to Stories";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <h1 className="text-3xl font-bold text-foreground">Content Generator</h1>
          <p className="text-muted-foreground flex flex-wrap items-center gap-2">
            <span>Generate scenes, NPCs, and stories for your chronicle</span>
            <Badge variant="outline" className="text-xs">
              {generatorSettings.useLocalLLM ? (
                <>
                  <Bot className="h-3 w-3 mr-1" />
                  Ollama ({generatorSettings.ollamaModel})
                </>
              ) : (
                <>
                  <Cloud className="h-3 w-3 mr-1" />
                  Cloud AI
                </>
              )}
            </Badge>
          </p>
        </div>
      </div>


      {/* Generator Tabs */}
      <Tabs value={activeTab} onValueChange={(tab) => { setActiveTab(tab); setSaved(false); }}>
        <TabsList className="bg-secondary border-border grid w-full grid-cols-4">
          {generatorTypes.map((type) => {
            const Icon = type.icon;
            return (
              <TabsTrigger key={type.id} value={type.id} className="flex items-center space-x-2">
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{type.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {generatorTypes.map((type) => (
          <TabsContent key={type.id} value={type.id} className="mt-6">
            {/* Special NPC Tab with Wizard Flow */}
            {type.id === "npc" ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* NPC Generation Panel */}
                <Card className="bg-gradient-subtle border-border shadow-gothic">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-foreground">
                      <Users className="h-5 w-5" />
                      <span>Generate NPC</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <p className="text-muted-foreground">
                      Create an NPC using AI generation, then customize them through a guided wizard.
                    </p>
                    
                    <Button 
                      onClick={() => setShowNPCDialog(true)}
                      className="w-full bg-gradient-blood hover:opacity-90 shadow-crimson"
                      size="lg"
                    >
                      <Sparkles className="w-5 h-5 mr-2" />
                      Generate New NPC
                    </Button>

                    <Button
                      onClick={() => setShowBulkNPCDialog(true)}
                      variant="outline"
                      className="w-full"
                      size="lg"
                    >
                      <Users className="w-5 h-5 mr-2" />
                      Generate Group
                    </Button>

                    <div className="space-y-3 pt-4 border-t">
                      <h4 className="font-medium text-sm">How it works:</h4>
                      <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                        <li>Choose a creation method (Full V5 or simplified dice pools)</li>
                        <li>Describe the NPC you want to create</li>
                        <li>AI generates the character details</li>
                        <li>Review and customize through the wizard</li>
                        <li>Save the NPC to your chronicle</li>
                      </ol>
                    </div>
                  </CardContent>
                </Card>

                {/* Info Panel */}
                <Card className="bg-gradient-subtle border-border shadow-gothic">
                  <CardHeader>
                    <CardTitle className="text-foreground">Creation Methods</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="p-3 bg-muted/30 rounded-lg">
                        <h4 className="font-medium text-sm">Full V5 Rules</h4>
                        <p className="text-xs text-muted-foreground">
                          Complete character with attributes, skills, and disciplines. Best for important recurring NPCs.
                        </p>
                      </div>
                      <div className="p-3 bg-muted/30 rounded-lg">
                        <h4 className="font-medium text-sm">Simple Pool</h4>
                        <p className="text-xs text-muted-foreground">
                          Single difficulty number. Perfect for quick antagonists or minor characters.
                        </p>
                      </div>
                      <div className="p-3 bg-muted/30 rounded-lg">
                        <h4 className="font-medium text-sm">General Pool</h4>
                        <p className="text-xs text-muted-foreground">
                          Primary and secondary pools. Good balance of simplicity and flexibility.
                        </p>
                      </div>
                      <div className="p-3 bg-muted/30 rounded-lg">
                        <h4 className="font-medium text-sm">Standard Pools</h4>
                        <p className="text-xs text-muted-foreground">
                          Physical, Social, and Mental category pools. Great for varied encounters.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              /* Other content types use the original flow */
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Input Panel */}
                <Card className="bg-gradient-subtle border-border shadow-gothic">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-foreground">
                      <type.icon className="h-5 w-5" />
                      <span>Generate {type.label}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Textarea
                      placeholder={`Describe what kind of ${type.label.toLowerCase()} you want to create...`}
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      className="min-h-32 bg-input border-border resize-none"
                    />
                    
                    <div className="flex items-center space-x-2">
                      <Button 
                        onClick={generateContent}
                        disabled={!prompt.trim() || isGenerating}
                        className="bg-gradient-blood hover:opacity-90 shadow-crimson flex-1"
                      >
                        {isGenerating ? (
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Sparkles className="w-4 h-4 mr-2" />
                        )}
                        Generate
                      </Button>
                    </div>

                    {/* Example Prompts */}
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Example prompts:</p>
                      <div className="flex flex-wrap gap-1">
                        {type.id === "scene" && (
                          <>
                            <Badge variant="outline" className="text-xs cursor-pointer hover:bg-secondary" 
                                   onClick={() => setPrompt("A tense Elysium gathering where accusations fly")}>
                              Tense Elysium gathering
                            </Badge>
                            <Badge variant="outline" className="text-xs cursor-pointer hover:bg-secondary"
                                   onClick={() => setPrompt("A feeding scene in a crowded nightclub")}>
                              Nightclub feeding scene
                            </Badge>
                          </>
                        )}
                        {type.id === "story" && (
                          <>
                            <Badge variant="outline" className="text-xs cursor-pointer hover:bg-secondary"
                                   onClick={() => setPrompt("A mysterious elder arrives in the city with a dangerous agenda")}>
                              Mysterious elder
                            </Badge>
                            <Badge variant="outline" className="text-xs cursor-pointer hover:bg-secondary"
                                   onClick={() => setPrompt("Second Inquisition hunters are closing in on the local Kindred")}>
                              Inquisition threat
                            </Badge>
                          </>
                        )}
                        {type.id === "location" && (
                          <>
                            <Badge variant="outline" className="text-xs cursor-pointer hover:bg-secondary"
                                   onClick={() => setPrompt("An underground Elysium in an abandoned subway station")}>
                              Underground Elysium
                            </Badge>
                            <Badge variant="outline" className="text-xs cursor-pointer hover:bg-secondary"
                                   onClick={() => setPrompt("A penthouse haven overlooking the city")}>
                              Penthouse haven
                            </Badge>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Output Panel */}
                <Card className="bg-gradient-subtle border-border shadow-gothic">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-foreground">Generated Content</CardTitle>
                      {generatedData?.content && activeTab !== "npc" && (
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={copyToClipboard}
                            className="border-border hover:bg-secondary"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          {generatedData?.parsed && currentChronicle && (
                            <Button 
                              size="sm" 
                              variant={saved ? "secondary" : "default"}
                              onClick={saveToChronicle}
                              disabled={isSaving || saved}
                              className={saved ? "" : "bg-gradient-blood hover:opacity-90"}
                            >
                              {saved ? (
                                <Check className="h-4 w-4 mr-1" />
                              ) : (
                                <Save className="h-4 w-4 mr-1" />
                              )}
                              {getSaveButtonText()}
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {isGenerating ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="text-center">
                          <RefreshCw className="h-8 w-8 text-primary animate-spin mx-auto mb-2" />
                          <p className="text-muted-foreground">Generating your content...</p>
                        </div>
                      </div>
                    ) : generatedData?.content && activeTab !== "npc" ? (
                      <div className="space-y-4">
                        {!currentChronicle && generatedData.parsed && (
                          <div className="text-sm text-warning bg-warning/10 p-2 rounded">
                            Select a chronicle to save this content.
                          </div>
                        )}
                        <div className="prose prose-invert max-w-none max-h-[500px] overflow-y-auto">
                          <pre className="whitespace-pre-wrap text-sm text-foreground font-body leading-relaxed bg-muted/30 p-4 rounded-lg">
                            {generatedData.content}
                          </pre>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">
                          Enter a prompt and click generate to create content for your chronicle
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* NPC Generation Dialogs */}
      <GenerateNPCDialog 
        open={showNPCDialog}
        onOpenChange={setShowNPCDialog}
        onComplete={handleNPCGenerated}
      />
      <NPCWizardDialog
        open={showNPCWizard}
        onOpenChange={setShowNPCWizard}
        generatedData={npcGeneratedData}
        creationMethod={npcCreationMethod}
        creatureType={npcCreatureType}
      />
      <BulkNPCDialog
        open={showBulkNPCDialog}
        onOpenChange={setShowBulkNPCDialog}
      />
    </div>
  );
}
