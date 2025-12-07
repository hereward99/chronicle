import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Upload, FileJson, Users, BookOpen, Calendar, Scroll } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Template structures matching the database schema
const TEMPLATES = {
  chronicle: {
    name: "My Chronicle Name",
    description: "A brief description of your chronicle's story and setting",
    setting: "City name or location where the chronicle takes place"
  },
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
    
    // Attributes (1-5 scale)
    strength: 2,
    dexterity: 3,
    stamina: 2,
    charisma: 3,
    manipulation: 2,
    composure: 2,
    intelligence: 2,
    wits: 3,
    resolve: 2,
    
    // Skills object with values 0-5
    skills: {
      athletics: 2,
      brawl: 1,
      craft: 0,
      drive: 1,
      firearms: 0,
      melee: 2,
      larceny: 1,
      stealth: 2,
      survival: 1,
      animal_ken: 0,
      etiquette: 1,
      insight: 2,
      intimidation: 1,
      leadership: 0,
      performance: 0,
      persuasion: 2,
      streetwise: 2,
      subterfuge: 1,
      academics: 1,
      awareness: 2,
      finance: 0,
      investigation: 1,
      medicine: 0,
      occult: 1,
      politics: 0,
      science: 0,
      technology: 1
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
    experience_total: 15,
    experience_spent: 10
  },
  story: {
    title: "Story Title",
    description: "A detailed description of the plot, including major events, NPCs involved, and the current situation",
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
  stories: [TEMPLATES.story],
  sessions: [TEMPLATES.session]
};

export default function Import() {
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

  const templateCards = [
    {
      type: "chronicle" as const,
      batchType: "chronicles" as const,
      title: "Chronicle",
      description: "The overarching campaign or game setting",
      icon: BookOpen,
      filename: "chronicle-template.json",
      batchFilename: "chronicles-template.json"
    },
    {
      type: "character" as const,
      batchType: "characters" as const,
      title: "Character",
      description: "Full VTM 5e character sheet with attributes, skills, disciplines, and more",
      icon: Users,
      filename: "character-template.json",
      batchFilename: "characters-template.json"
    },
    {
      type: "story" as const,
      batchType: "stories" as const,
      title: "Story/Plot",
      description: "Story arcs, plots, and ongoing narratives",
      icon: Scroll,
      filename: "story-template.json",
      batchFilename: "stories-template.json"
    },
    {
      type: "session" as const,
      batchType: "sessions" as const,
      title: "Session",
      description: "Game session logs with summaries and XP awards",
      icon: Calendar,
      filename: "session-template.json",
      batchFilename: "sessions-template.json"
    }
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Import Data</h1>
          <p className="text-muted-foreground mt-1">
            Download JSON templates, populate them with another AI, then import them here
          </p>
        </div>

        <Tabs defaultValue="templates" className="w-full">
          <TabsList>
            <TabsTrigger value="templates">Download Templates</TabsTrigger>
            <TabsTrigger value="import" disabled>Import Data (Coming Soon)</TabsTrigger>
          </TabsList>

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
                <p>3. <strong>Import the JSON</strong> - Upload your populated file back here (import feature coming soon)</p>
                <p className="text-xs mt-4 p-3 bg-muted/50 rounded-lg">
                  <strong>Tip:</strong> For batch imports, the template contains an array. Simply add more items following the same structure.
                </p>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templateCards.map((card) => (
                <Card key={card.type} className="bg-card border-border hover:border-primary/50 transition-colors">
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
                      onClick={() => downloadTemplate(card.type, card.filename)}
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

            <Card className="bg-muted/30 border-dashed">
              <CardHeader>
                <CardTitle className="text-lg">Example AI Prompt</CardTitle>
                <CardDescription>Copy this prompt to use with your AI of choice</CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="text-xs bg-background p-4 rounded-lg overflow-x-auto whitespace-pre-wrap">
{`I have this JSON template for a Vampire: The Masquerade 5th Edition character. 
Please fill it out for a character with these details:

[Describe your character here - their concept, clan, background, personality, etc.]

Here's the template to fill:
[Paste the downloaded template here]

Please return only the completed JSON, maintaining the exact structure.`}
                </pre>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="import">
            <Card>
              <CardContent className="p-12 text-center text-muted-foreground">
                <Upload className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Import functionality coming soon</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
