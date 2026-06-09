import { useState, useRef } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Upload, FileJson, Users, BookOpen, Calendar, Scroll, Check, Loader2, AlertCircle, Save, RefreshCw } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useImport, ImportType, ImportMode } from "@/hooks/useImport";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useChronicles } from "@/hooks/useChronicles";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
// Template structures matching the database schema
// =============================================================================
// CHARACTER CREATION METHODS & TEMPLATES
// =============================================================================
// Method 1: Full V5 - Complete character with all attributes, skills, disciplines
// Method 2: Simple Pool - One difficulty number (Core Rulebook)
// Method 3: General Pool - Two numbers primary/secondary (Forbidden Religions style)
// Method 4: Standard Pool - Physical/Social/Mental + Exceptional + optional full attributes

const TEMPLATES = {
  chronicle: {
    name: "My Chronicle Name",
    description: "A brief description of your chronicle's story and setting",
    setting: "City name or location where the chronicle takes place"
  },
  
  // METHOD 1: Full V5 Character (Complete character sheet)
  character: {
    name: "Character Name",
    clan: "Brujah",
    generation: 13,
    type: "PC",
    status: "Active",
    concept: "A short concept describing who this character is",
    sire: "Name of the character's sire",
    predator_type: "Alleycat",
    ambition: "What the character wants to achieve long-term",
    desire: "What the character wants right now",
    resonance: "Choleric",
    appearance: "Physical description of the character",
    distinguishing_features: "Notable features that stand out",
    history: "The character's backstory and how they became a vampire",
    notes: "Any additional notes about the character",
    
    // Full Attributes (1-5 scale)
    strength: 2,
    dexterity: 3,
    stamina: 2,
    charisma: 3,
    manipulation: 2,
    composure: 2,
    intelligence: 2,
    wits: 3,
    resolve: 2,
    
    // Skills object with rating (0-5) and optional specialty
    // Keys must be lowercase with underscores (e.g., "animal_ken")
    skills: {
      athletics: { rating: 2 },
      brawl: { rating: 1 },
      craft: { rating: 0 },
      drive: { rating: 1 },
      firearms: { rating: 0 },
      melee: { rating: 2, specialty: "Swords" },
      larceny: { rating: 1 },
      stealth: { rating: 2 },
      survival: { rating: 1 },
      animal_ken: { rating: 0 },
      etiquette: { rating: 1 },
      insight: { rating: 2 },
      intimidation: { rating: 1 },
      leadership: { rating: 0 },
      performance: { rating: 0 },
      persuasion: { rating: 2, specialty: "Fast Talk" },
      streetwise: { rating: 2 },
      subterfuge: { rating: 1 },
      academics: { rating: 1 },
      awareness: { rating: 2 },
      finance: { rating: 0 },
      investigation: { rating: 1 },
      medicine: { rating: 0 },
      occult: { rating: 1 },
      politics: { rating: 0 },
      science: { rating: 0 },
      technology: { rating: 1 }
    },
    
    // Disciplines array
    disciplines: [
      { name: "Celerity", level: 2, powers: ["Cat's Grace", "Rapid Reflexes"] },
      { name: "Potence", level: 1, powers: ["Lethal Body"] }
    ],
    
    // Advantages and Flaws
    advantages: [
      { name: "Contacts", rating: 2, description: "Street-level informants" },
      { name: "Haven", rating: 1, description: "Small apartment" }
    ],
    flaws: [
      { name: "Enemy", rating: 2, description: "A rival vampire hunter" }
    ],
    
    // Beliefs
    convictions: ["Never harm the innocent", "Protect my mortal family"],
    touchstones: [
      { name: "Sarah", description: "Mortal sister who doesn't know the truth", conviction: "Protect my mortal family" }
    ],
    
    // Loresheets
    loresheets: [
      { name: "Descendant of...", dots: 2, benefits: ["Benefit description"] }
    ],
    
    // Trackers
    blood_potency: 1,
    humanity: 7,
    hunger: 1,
    
    // NOT a dice pool character
    use_dice_pools: false,
    skip_attributes: false
  },
  
  // METHOD 2: Simple Pool (Core Rulebook style - just a difficulty)
  // Health and Willpower = difficulty × 2
  simplePoolCharacter: {
    name: "Simple NPC Name",
    clan: "Brujah",
    generation: 12,
    type: "NPC",
    status: "Active",
    concept: "A brief concept for this antagonist",
    appearance: "Physical description",
    history: "Brief background",
    notes: "Additional notes",
    
    // Dice pool configuration - SIMPLE format
    use_dice_pools: true,
    skip_attributes: true,
    dice_pools: {
      type: "simple",
      difficulty: 3  // Players roll against this; NPC rolls 2× this (6 dice)
    },
    
    // Health and Willpower derived from difficulty (difficulty × 2)
    // For difficulty 3: health_max = 6, willpower_max = 6
    
    // Disciplines (optional)
    disciplines: [
      { name: "Potence", level: 1, powers: ["Lethal Body"] }
    ],
    
    // Trackers
    blood_potency: 1,
    humanity: 6,
    hunger: 2
  },
  
  // METHOD 3: General Pool (Forbidden Religions/Blood Sigils style)
  // Two pools: Primary (areas of expertise) / Secondary (mediocre areas)
  // Optional: Can include full attributes for Secondary Attributes calculation
  generalPoolCharacter: {
    name: "General Pool NPC",
    clan: "Ventrue",
    generation: 11,
    type: "NPC",
    status: "Active",
    concept: "A powerful elder with specialized expertise",
    sire: "Optional sire name",
    predator_type: "Sandman",
    ambition: "NPC's long-term goal",
    desire: "NPC's immediate goal",
    resonance: "Melancholic",
    appearance: "Physical description of the NPC",
    distinguishing_features: "Notable features",
    history: "Background and role in the story",
    notes: "Additional notes",
    
    // Dice pool configuration - GENERAL format (Primary/Secondary)
    use_dice_pools: true,
    skip_attributes: true,  // Set to false if including full attributes below
    dice_pools: {
      type: "general",
      primary: 7,    // Pool for areas of expertise (e.g., "7/4" = 7 here)
      secondary: 4   // Pool for mediocre/poor areas (e.g., "7/4" = 4 here)
    },
    
    // OPTIONAL: Include attributes if skip_attributes is false
    // If included, Health = Stamina + 3, Willpower = Composure + Resolve
    // strength: 2,
    // dexterity: 3,
    // stamina: 3,
    // charisma: 4,
    // manipulation: 3,
    // composure: 3,
    // intelligence: 3,
    // wits: 3,
    // resolve: 2,
    
    // Disciplines
    disciplines: [
      { name: "Dominate", level: 3, powers: ["Compel", "Mesmerize", "The Forgetful Mind"] },
      { name: "Presence", level: 2, powers: ["Awe", "Lingering Kiss"] }
    ],
    
    // Advantages and Flaws
    advantages: [
      { name: "Status", rating: 3, description: "Prince's right hand" }
    ],
    flaws: [
      { name: "Prey Exclusion", rating: 1, description: "Cannot feed on the poor" }
    ],
    
    // Trackers
    blood_potency: 3,
    humanity: 5,
    hunger: 2,
    health_max: 6,      // Set manually if skip_attributes is true
    willpower_max: 6,   // Set manually if skip_attributes is true
  },
  
  // METHOD 4: Standard Pool (Fall of London/Let the Streets Run Red style)
  // Physical/Social/Mental pools + Exceptional pools for standout abilities
  // Optionally includes full attributes for derived stats
  standardPoolCharacter: {
    name: "Standard Pool NPC",
    clan: "Tremere",
    generation: 10,
    type: "NPC",
    status: "Active",
    concept: "A powerful blood sorcerer with specific expertise",
    sire: "Ancient Tremere Regent",
    predator_type: "Blood Leech",
    ambition: "Uncover forbidden blood magic",
    desire: "Find the missing grimoire",
    resonance: "Phlegmatic",
    appearance: "Pale, scholarly appearance with knowing eyes",
    distinguishing_features: "Ritual scars on forearms",
    history: "Former Chantry scholar turned rogue researcher",
    notes: "Dangerous but can be reasoned with",
    
    // Dice pool configuration - STANDARD format
    use_dice_pools: true,
    skip_attributes: false,  // Including full attributes
    dice_pools: {
      type: "standard",
      physical: 4,   // Standard Dice Pool for physical actions (4-8 typical)
      social: 6,     // Standard Dice Pool for social actions
      mental: 8,     // Standard Dice Pool for mental actions
      exceptional: [
        { name: "Blood Sorcery", pool: 10 },  // Exceptional pools can go 10-11
        { name: "Occult", pool: 9 },
        { name: "Intimidation", pool: 8 }
      ]
    },
    
    // Full attributes (used for derived stats when skip_attributes is false)
    strength: 2,
    dexterity: 2,
    stamina: 3,     // Health = 3 + 3 = 6
    charisma: 3,
    manipulation: 4,
    composure: 3,   // Willpower = 3 + 4 = 7
    intelligence: 5,
    wits: 4,
    resolve: 4,
    
    // Disciplines
    disciplines: [
      { name: "Blood Sorcery", level: 4, powers: ["A Taste for Blood", "Extinguish Vitae", "Blood of Potency", "Theft of Vitae"] },
      { name: "Auspex", level: 3, powers: ["Heightened Senses", "Premonition", "Scry the Soul"] },
      { name: "Dominate", level: 2, powers: ["Compel", "Mesmerize"] }
    ],
    
    // Advantages and Flaws
    advantages: [
      { name: "Occult Library", rating: 3, description: "Extensive collection of forbidden texts" },
      { name: "Resources", rating: 2, description: "Modest wealth from investments" }
    ],
    flaws: [
      { name: "Hunted", rating: 2, description: "The Tremere hierarchy wants them silenced" },
      { name: "Obvious Predator", rating: 1, description: "Something unnerving about their presence" }
    ],
    
    // Trackers
    blood_potency: 4,
    humanity: 5,
    hunger: 2,
    // health_max and willpower_max calculated from attributes when skip_attributes is false
  },
  
  story: {
    title: "Story Title",
    description: "A detailed description of the story, including major events, NPCs involved, and the current situation",
    status: "Active",
    priority: "High"
  },
  session: {
    title: "Session 1: The Beginning",
    summary: "A detailed summary of what happened during this session, including key events, NPC interactions, and player decisions",
    date_played: "2024-01-15",
    experience_awarded: 3
  }
};

// Multiple items template for batch import
const BATCH_TEMPLATES = {
  chronicles: [TEMPLATES.chronicle],
  characters: [TEMPLATES.character],
  simplePoolCharacters: [TEMPLATES.simplePoolCharacter],
  generalPoolCharacters: [TEMPLATES.generalPoolCharacter],
  standardPoolCharacters: [TEMPLATES.standardPoolCharacter],
  stories: [TEMPLATES.story],
  sessions: [TEMPLATES.session]
};

interface ImportCardConfig {
  type: ImportType;
  templateType: keyof typeof TEMPLATES;
  batchType: keyof typeof BATCH_TEMPLATES;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  filename: string;
  batchFilename: string;
  requiresChronicle: boolean;
}

export default function Import() {
  const { importing, parseAndImport, currentChronicle } = useImport();
  const { currentChronicle: chronicleForExport } = useChronicles();
  const { toast } = useToast();
  const [importResults, setImportResults] = useState<Record<string, { success: boolean; message: string } | null>>({});
  const [exporting, setExporting] = useState(false);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const handleExport = async () => {
    if (!chronicleForExport) {
      notify.error("No chronicle selected", "Please select a chronicle first.");
      return;
    }

    setExporting(true);
    try {
      const chronicleId = chronicleForExport.id;

      const [
        chronicleRes,
        charactersRes,
        relationshipsRes,
        factionsRes,
        characterFactionsRes,
        coteriesRes,
        coterieMembersRes,
        sessionsRes,
        plotsRes,
        plotCharactersRes,
        notesRes,
      ] = await Promise.all([
        supabase.from('chronicles').select('*').eq('id', chronicleId).single(),
        supabase.from('characters').select('*').eq('chronicle_id', chronicleId),
        supabase.from('relationships').select('*'),
        supabase.from('factions').select('*').eq('chronicle_id', chronicleId),
        supabase.from('character_factions').select('*'),
        supabase.from('coteries').select('*').eq('chronicle_id', chronicleId),
        supabase.from('coterie_members').select('*'),
        supabase.from('sessions').select('*').eq('chronicle_id', chronicleId),
        supabase.from('plots').select('*').eq('chronicle_id', chronicleId),
        supabase.from('plot_characters').select('*'),
        supabase.from('notes').select('*').eq('chronicle_id', chronicleId),
      ]);

      const characterIds = new Set((charactersRes.data || []).map(c => c.id));
      const filteredRelationships = (relationshipsRes.data || []).filter(
        r => characterIds.has(r.character_id) || characterIds.has(r.related_character_id)
      );
      const filteredCharacterFactions = (characterFactionsRes.data || []).filter(
        cf => characterIds.has(cf.character_id)
      );

      const coterieIds = new Set((coteriesRes.data || []).map(c => c.id));
      const filteredCoterieMembers = (coterieMembersRes.data || []).filter(
        cm => coterieIds.has(cm.coterie_id)
      );

      const plotIds = new Set((plotsRes.data || []).map(p => p.id));
      const filteredPlotCharacters = (plotCharactersRes.data || []).filter(
        pc => plotIds.has(pc.plot_id)
      );

      const backupData = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        chronicle: chronicleRes.data,
        characters: charactersRes.data || [],
        relationships: filteredRelationships,
        factions: factionsRes.data || [],
        characterFactions: filteredCharacterFactions,
        coteries: coteriesRes.data || [],
        coterieMembers: filteredCoterieMembers,
        sessions: sessionsRes.data || [],
        plots: plotsRes.data || [],
        plotCharacters: filteredPlotCharacters,
        notes: notesRes.data || [],
      };

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const now = new Date();
      const timestamp = `${now.toISOString().split('T')[0]}_${now.toTimeString().slice(0, 8).replace(/:/g, '-')}`;
      a.download = `chronicle-backup-${chronicleForExport.name.replace(/\s+/g, '-').toLowerCase()}-${timestamp}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      notify.success("Export successful", `Exported ${backupData.characters.length} characters, ${backupData.relationships.length} relationships, and more.`);
    } catch (error: any) {
      console.error('Export error:', error);
      notify.error("Export failed", error.message);
    } finally {
      setExporting(false);
    }
  };

  const downloadTemplate = (type: keyof typeof TEMPLATES, filename: string) => {
    const template = TEMPLATES[type];
    const blob = new Blob([JSON.stringify(template, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadBatchTemplate = (type: keyof typeof BATCH_TEMPLATES, filename: string) => {
    const template = BATCH_TEMPLATES[type];
    const blob = new Blob([JSON.stringify(template, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFileSelect = async (importType: ImportType, file: File, mode: ImportMode = "create") => {
    const result = await parseAndImport(file, importType, mode);
    setImportResults((prev) => ({
      ...prev,
      [importType + (mode === "update" ? "_update" : "")]: { success: result.success, message: result.message },
    }));
  };

  const triggerFileInput = (type: ImportType, mode: ImportMode = "create") => {
    const key = type + (mode === "update" ? "_update" : "");
    fileInputRefs.current[key]?.click();
  };

  const templateCards: ImportCardConfig[] = [
    {
      type: "chronicle",
      templateType: "chronicle",
      batchType: "chronicles",
      title: "Chronicle",
      description: "The overarching campaign or game setting",
      icon: BookOpen,
      filename: "chronicle-template.json",
      batchFilename: "chronicles-template.json",
      requiresChronicle: false,
    },
    {
      type: "character",
      templateType: "character",
      batchType: "characters",
      title: "Method 1: Full V5 Character",
      description: "Complete character sheet with all attributes, skills, and disciplines",
      icon: Users,
      filename: "full-character-template.json",
      batchFilename: "full-characters-template.json",
      requiresChronicle: true,
    },
    {
      type: "character",
      templateType: "simplePoolCharacter",
      batchType: "simplePoolCharacters",
      title: "Method 2: Simple Pool",
      description: "One difficulty number (Core Rulebook style) - Health/Willpower = 2×Difficulty",
      icon: Users,
      filename: "simple-pool-character-template.json",
      batchFilename: "simple-pool-characters-template.json",
      requiresChronicle: true,
    },
    {
      type: "character",
      templateType: "generalPoolCharacter",
      batchType: "generalPoolCharacters",
      title: "Method 3: General Pool",
      description: "Primary/Secondary pools (e.g., 7/4) with optional attributes",
      icon: Users,
      filename: "general-pool-character-template.json",
      batchFilename: "general-pool-characters-template.json",
      requiresChronicle: true,
    },
    {
      type: "character",
      templateType: "standardPoolCharacter",
      batchType: "standardPoolCharacters",
      title: "Method 4: Standard Pool",
      description: "Physical/Social/Mental pools + Exceptional, optional full attributes",
      icon: Users,
      filename: "standard-pool-character-template.json",
      batchFilename: "standard-pool-characters-template.json",
      requiresChronicle: true,
    },
    {
      type: "story",
      templateType: "story",
      batchType: "stories",
      title: "Story",
      description: "Story arcs, plots, and ongoing narratives",
      icon: Scroll,
      filename: "story-template.json",
      batchFilename: "stories-template.json",
      requiresChronicle: true,
    },
    {
      type: "session",
      templateType: "session",
      batchType: "sessions",
      title: "Session",
      description: "Game session logs with summaries and XP awards",
      icon: Calendar,
      filename: "session-template.json",
      batchFilename: "sessions-template.json",
      requiresChronicle: true,
    },
  ];

  return (
    <>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Import & Export</h1>
          <p className="text-muted-foreground mt-1">
            Export your chronicle data for backup, or import data from JSON templates
          </p>
        </div>

        <Tabs defaultValue="export" className="w-full">
          <TabsList>
            <TabsTrigger value="export">Export Backup</TabsTrigger>
            <TabsTrigger value="templates">Download Templates</TabsTrigger>
            <TabsTrigger value="import">Import Data</TabsTrigger>
          </TabsList>

          <TabsContent value="export" className="space-y-6 mt-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Save className="h-5 w-5 text-primary" />
                  Backup Chronicle Data
                </CardTitle>
                <CardDescription>
                  Export all your chronicle data as a JSON file for safekeeping or transfer
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-muted-foreground space-y-2">
                  <p>This backup includes:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Chronicle details</li>
                    <li>All characters with full sheets</li>
                    <li>Relationships between characters</li>
                    <li>Factions and faction memberships</li>
                    <li>Coteries and members</li>
                    <li>Sessions and plots</li>
                    <li>Notes</li>
                  </ul>
                </div>

                {!chronicleForExport ? (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Please select a chronicle first to export its data.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert>
                    <Check className="h-4 w-4" />
                    <AlertDescription>
                      Ready to export: <strong>{chronicleForExport.name}</strong>
                    </AlertDescription>
                  </Alert>
                )}

                <Button 
                  onClick={handleExport} 
                  disabled={exporting || !chronicleForExport}
                  className="w-full sm:w-auto"
                >
                  {exporting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Export Chronicle Backup
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

          </TabsContent>

          <TabsContent value="templates" className="space-y-6 mt-6">
            <Card className="bg-card/50 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileJson className="h-5 w-5 text-primary" />
                  How to Use Templates
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>1. <strong>Download a template</strong> - Choose single item or batch format</p>
                <p>2. <strong>Use an AI to populate it</strong> - Give the template to ChatGPT, Claude, or another AI with your content</p>
                <p>3. <strong>Import the JSON</strong> - Go to the Import Data tab and upload your populated file</p>
                <p className="text-xs mt-4 p-3 bg-muted/50 rounded-lg">
                  <strong>Tip:</strong> For batch imports, the template contains an array. Simply add more items following the same structure.
                </p>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templateCards.map((card) => (
                <Card key={card.templateType} className="bg-card border-border hover:border-primary/50 transition-colors">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <card.icon className="h-5 w-5 text-primary" />
                      {card.title} Template
                    </CardTitle>
                    <CardDescription>{card.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => downloadTemplate(card.templateType, card.filename)}
                      className="flex-1"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Single
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => downloadBatchTemplate(card.batchType, card.batchFilename)}
                      className="flex-1"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Batch
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">AI Prompts by Template Type</h3>
              <p className="text-sm text-muted-foreground">Copy the relevant prompt for your template type. Each includes field restrictions.</p>
              
              <Card className="bg-muted/30 border-dashed">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <BookOpen className="h-5 w-5 text-primary" />
                    Chronicle Prompt
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs bg-background p-4 rounded-lg overflow-x-auto whitespace-pre-wrap">
{`Create a Vampire: The Masquerade 5th Edition chronicle in JSON format.

FIELD RESTRICTIONS:
- name: Required, max 200 characters
- description: Optional, max 2000 characters  
- setting: Optional, max 200 characters (city/location name)

[Describe your chronicle - the city, themes, factions, major conflicts, and setting details]

Here's the template:
[Paste the downloaded chronicle template here]

Return ONLY the completed JSON, maintaining the exact structure.`}
                  </pre>
                </CardContent>
              </Card>

              <Card className="bg-muted/30 border-dashed">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Users className="h-5 w-5 text-primary" />
                    Character Prompt
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs bg-background p-4 rounded-lg overflow-x-auto whitespace-pre-wrap">
{`Create a Vampire: The Masquerade 5th Edition character in JSON format.

FIELD RESTRICTIONS:
- name: Required, max 200 characters
- clan: Required (Human, Brujah, Gangrel, Malkavian, Nosferatu, Toreador, Tremere, Ventrue, Caitiff, Thin-Blood, Lasombra, Tzimisce, Ravnos, Salubri, Hecata, Ministry, Banu Haqim)
  - Use "Human" for mortal characters (no generation, predator_type, hunger, blood_potency, resonance, or disciplines)
- generation: Number 4-16 (default 13) - OMIT for Human characters
- type: "PC" or "NPC" (default "PC")
- status: "Active", "Inactive", "Retired", or "Dead" (default "Active")
- concept: Max 500 characters
- sire: Max 200 characters - OMIT for Human characters
- predator_type: "None", "Alleycat", "Bagger", etc. - Use "None" or OMIT for Human characters
- resonance: Max 200 characters - OMIT for Human characters
- ambition, desire: Max 500 characters each
- appearance, distinguishing_features, history, notes: Max 5000 characters each

ATTRIBUTES (all 1-5, default 1):
- Physical: strength, dexterity, stamina
- Social: charisma, manipulation, composure  
- Mental: intelligence, wits, resolve

SKILLS (all 0-5, in skills object):
- Physical: athletics, brawl, craft, drive, firearms, melee, larceny, stealth, survival
- Social: animal_ken, etiquette, insight, intimidation, leadership, performance, persuasion, streetwise, subterfuge
- Mental: academics, awareness, finance, investigation, medicine, occult, politics, science, technology

DISCIPLINES: Array of {name, level (1-5), powers: []} - OMIT for Human characters
ADVANTAGES/FLAWS: Array of {name, rating (1-5), description}
CONVICTIONS: Array of strings (max 3 items, each max 200 chars)
TOUCHSTONES: Array of {name, description, conviction}
LORESHEETS: Array of {name, dots (1-5), benefits: []}

TRACKERS:
- blood_potency: 0-10 (default 0) - OMIT for Human characters
- humanity: 0-10 (default 7)
- hunger: 0-5 (default 1) - OMIT for Human characters

[Describe your character - concept, clan, background, personality, goals]

Here's the template:
[Paste the downloaded character template here]

Return ONLY the completed JSON, maintaining the exact structure.`}
                  </pre>
                </CardContent>
              </Card>

              <Card className="bg-muted/30 border-dashed">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Users className="h-5 w-5 text-primary" />
                    Dice Pool Character Prompt (Storyteller NPCs)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs bg-background p-4 rounded-lg overflow-x-auto whitespace-pre-wrap">
{`Create a Vampire: The Masquerade 5th Edition NPC using dice pools in JSON format.

This is for Storyteller Characters (NPCs) that don't need full attribute/skill sheets.

FIELD RESTRICTIONS:
- name: Required, max 200 characters
- clan: Required (same options as full characters)
- type: Always "NPC"
- status: "Active", "Ally", "Enemy", "Neutral", or "Dead"
- concept, appearance, history, notes: Max 5000 characters each
- use_dice_pools: Must be true
- skip_attributes: Set true for very minor NPCs (skips attribute display)

DICE POOL FORMATS (choose ONE):

1. SIMPLE (Core Rulebook) - for background characters:
   dice_pools: { type: "simple", difficulty: 3 }
   - difficulty: 1-6 (players roll against this; NPC rolls 2× this)

2. GENERAL (from Forbidden Religions, Blood Sigils, Chicago by Night):
   dice_pools: { type: "general", primary: 6, secondary: 4 }
   - primary: 4-8 (areas of expertise)
   - secondary: 2-5 (mediocre areas)

3. STANDARD (from Fall of London, Let the Streets Run Red):
   dice_pools: { type: "standard", physical: 5, social: 6, mental: 4, exceptional: [...] }
   - physical/social/mental: 4-8 each
   - exceptional: Array of { name: "Skill/Discipline", pool: 7-11 }

4. COMBINED (General + Standard together):
   dice_pools: {
     type: "combined",
     general: { primary: 6, secondary: 4 },
     standard: { physical: 5, social: 6, mental: 4, exceptional: [...] }
   }

SIZING GUIDELINES:
- Standard Pools: 4-8
- Secondary Attributes (Health/Willpower): 5-8  
- Exceptional Pools: 7-11 for powerful characters

DISCIPLINES: Array of { name, level (1-5), powers: [] }
- humanity: 0-10 (default 6)

[Describe your NPC - role in the story, capabilities, personality, threat level]

Here's the template:
[Paste the downloaded dice pool character template here]

Return ONLY the completed JSON, maintaining the exact structure.`}
                  </pre>
                </CardContent>
              </Card>

              <Card className="bg-muted/30 border-dashed">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Scroll className="h-5 w-5 text-primary" />
                    Story Prompt
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs bg-background p-4 rounded-lg overflow-x-auto whitespace-pre-wrap">
{`Create a Vampire: The Masquerade 5th Edition story in JSON format.

FIELD RESTRICTIONS:
- title: Required, max 200 characters
- description: Optional, max 10000 characters (use this for the full story details, NPCs, locations, events)
- status: "Active", "Planned", "Completed", or "Critical" (default "Active")
- priority: "Low", "Medium", "High", or "Critical" (default "Medium")

[Describe your story — the hook, major NPCs, locations, conflicts, and how it might unfold]

Here's the template:
[Paste the downloaded story template here]

Return ONLY the completed JSON, maintaining the exact structure.`}
                  </pre>
                </CardContent>
              </Card>

              <Card className="bg-muted/30 border-dashed">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Calendar className="h-5 w-5 text-primary" />
                    Session Prompt
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs bg-background p-4 rounded-lg overflow-x-auto whitespace-pre-wrap">
{`Create a Vampire: The Masquerade 5th Edition session log in JSON format.

FIELD RESTRICTIONS:
- title: Required, max 200 characters (e.g., "Session 1: The Gathering Storm")
- summary: Optional, max 10000 characters (detailed session recap with events, decisions, NPC interactions)
- date_played: Date in YYYY-MM-DD format (e.g., "2024-01-15")
- experience_awarded: Number 0-10 (typical: 1-3 per session)

[Describe what happened in the session - key events, player decisions, NPC encounters, combat, dramatic moments]

Here's the template:
[Paste the downloaded session template here]

Return ONLY the completed JSON, maintaining the exact structure.`}
                  </pre>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="import" className="space-y-6 mt-6">
            {!currentChronicle && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Please select a chronicle from the Chronicle page before importing characters, stories, or sessions.
                </AlertDescription>
              </Alert>
            )}

            {currentChronicle && (
              <Alert>
                <Check className="h-4 w-4" />
                <AlertDescription>
                  Importing to chronicle: <strong>{currentChronicle.name}</strong>
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templateCards.map((card) => {
                const result = importResults[card.templateType];
                const isDisabled = card.requiresChronicle && !currentChronicle;

                return (
                  <Card 
                    key={card.templateType} 
                    className={`bg-card border-border transition-colors ${isDisabled ? 'opacity-50' : 'hover:border-primary/50'}`}
                  >
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <card.icon className="h-5 w-5 text-primary" />
                        Import {card.title}
                      </CardTitle>
                      <CardDescription>
                        {card.requiresChronicle 
                          ? `Upload ${card.title.toLowerCase()} JSON to add to current chronicle`
                          : `Upload ${card.title.toLowerCase()} JSON to create new`
                        }
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {card.type === "chronicle" && (
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle>Important</AlertTitle>
                          <AlertDescription>
                            Importing a backup will create a new chronicle with "(Restored)" suffix. 
                            Your existing data will not be modified.
                          </AlertDescription>
                        </Alert>
                      )}
                      <input
                        ref={(el) => (fileInputRefs.current[card.templateType] = el)}
                        type="file"
                        accept=".json,application/json"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileSelect(card.type, file, "create");
                          e.target.value = "";
                        }}
                      />
                      <Button 
                        variant="default"
                        size="sm"
                        onClick={() => triggerFileInput(card.type, "create")}
                        disabled={importing || isDisabled}
                        className="w-full"
                      >
                        {importing ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Upload className="h-4 w-4 mr-2" />
                        )}
                        Import New
                      </Button>
                      
                      {card.type === "character" && (
                        <>
                          <input
                            ref={(el) => (fileInputRefs.current[card.type + "_update"] = el)}
                            type="file"
                            accept=".json,application/json"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleFileSelect(card.type, file, "update");
                              e.target.value = "";
                            }}
                          />
                          <Button 
                            variant="outline"
                            size="sm"
                            onClick={() => triggerFileInput(card.type, "update")}
                            disabled={importing || isDisabled}
                            className="w-full"
                          >
                            {importing ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <RefreshCw className="h-4 w-4 mr-2" />
                            )}
                            Re-import (Update by Name)
                          </Button>
                          {importResults[card.type + "_update"] && (
                            <p className={`text-xs ${importResults[card.type + "_update"]?.success ? 'text-success' : 'text-destructive'}`}>
                              {importResults[card.type + "_update"]?.message}
                            </p>
                          )}
                        </>
                      )}
                      
                      {result && (
                        <p className={`text-xs ${result.success ? 'text-success' : 'text-destructive'}`}>
                          {result.message}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <Card className="bg-muted/30 border-dashed">
              <CardHeader>
                <CardTitle className="text-lg">Import Tips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>• Upload either a single item JSON or a batch array</p>
                <p>• Characters, stories, and sessions will be added to your current chronicle</p>
                <p>• <strong>Re-import (Update)</strong> matches characters by name and updates their details</p>
                <p>• Health and Willpower are auto-calculated from attributes</p>
                <p>• Invalid fields will use default values</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
