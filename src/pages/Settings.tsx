import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useChronicles } from '@/hooks/useChronicles';
import { useGeneratorSettings } from '@/hooks/useGeneratorSettings';
import { Download, Upload, Loader2, AlertTriangle, Bot, AtSign } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface BackupData {
  version: string;
  exportedAt: string;
  chronicle: any;
  characters: any[];
  relationships: any[];
  factions: any[];
  characterFactions: any[];
  coteries: any[];
  coterieMembers: any[];
  sessions: any[];
  plots: any[];
  plotCharacters: any[];
  notes: any[];
}

export default function Settings() {
  const { toast } = useToast();
  const { currentChronicle } = useChronicles();
  const { settings: generatorSettings, updateSettings: updateGeneratorSettings } = useGeneratorSettings();
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [pendingImportData, setPendingImportData] = useState<BackupData | null>(null);

  const handleExport = async () => {
    if (!currentChronicle) {
      toast({
        title: "No chronicle selected",
        description: "Please select a chronicle first.",
        variant: "destructive",
      });
      return;
    }

    setExporting(true);
    try {
      const chronicleId = currentChronicle.id;

      // Fetch all data in parallel
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

      // Filter relationship data to only include characters from this chronicle
      const characterIds = new Set((charactersRes.data || []).map(c => c.id));
      const filteredRelationships = (relationshipsRes.data || []).filter(
        r => characterIds.has(r.character_id) || characterIds.has(r.related_character_id)
      );
      const filteredCharacterFactions = (characterFactionsRes.data || []).filter(
        cf => characterIds.has(cf.character_id)
      );

      // Filter coterie members to only include coteries from this chronicle
      const coterieIds = new Set((coteriesRes.data || []).map(c => c.id));
      const filteredCoterieMembers = (coterieMembersRes.data || []).filter(
        cm => coterieIds.has(cm.coterie_id)
      );

      // Filter plot characters to only include plots from this chronicle
      const plotIds = new Set((plotsRes.data || []).map(p => p.id));
      const filteredPlotCharacters = (plotCharactersRes.data || []).filter(
        pc => plotIds.has(pc.plot_id)
      );

      const backupData: BackupData = {
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

      // Create and download the file
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chronicle-backup-${currentChronicle.name.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Export successful",
        description: `Exported ${backupData.characters.length} characters, ${backupData.relationships.length} relationships, and more.`,
      });
    } catch (error: any) {
      console.error('Export error:', error);
      toast({
        title: "Export failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string) as BackupData;
        
        if (!data.version || !data.chronicle) {
          throw new Error('Invalid backup file format');
        }

        setPendingImportData(data);
        setShowImportDialog(true);
      } catch (error: any) {
        toast({
          title: "Invalid file",
          description: "The selected file is not a valid backup file.",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
    
    // Reset file input
    event.target.value = '';
  };

  const handleImport = async () => {
    if (!pendingImportData) return;

    setImporting(true);
    setShowImportDialog(false);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const data = pendingImportData;

      // Create ID mappings for references
      const chronicleIdMap = new Map<string, string>();
      const characterIdMap = new Map<string, string>();
      const factionIdMap = new Map<string, string>();
      const coterieIdMap = new Map<string, string>();
      const plotIdMap = new Map<string, string>();

      // 1. Create chronicle
      const { data: newChronicle, error: chronicleError } = await supabase
        .from('chronicles')
        .insert({
          name: `${data.chronicle.name} (Restored)`,
          description: data.chronicle.description,
          setting: data.chronicle.setting,
          user_id: user.id,
        })
        .select()
        .single();

      if (chronicleError) throw chronicleError;
      chronicleIdMap.set(data.chronicle.id, newChronicle.id);

      // 2. Create characters
      for (const char of data.characters) {
        const { id, created_at, updated_at, chronicle_id, user_id, ...charData } = char;
        const { data: newChar, error } = await supabase
          .from('characters')
          .insert({
            ...charData,
            chronicle_id: newChronicle.id,
            user_id: user.id,
          })
          .select()
          .single();

        if (error) {
          console.error('Error creating character:', error);
          continue;
        }
        characterIdMap.set(id, newChar.id);
      }

      // 3. Create factions
      for (const faction of data.factions) {
        const { id, created_at, updated_at, chronicle_id, user_id, ...factionData } = faction;
        const { data: newFaction, error } = await supabase
          .from('factions')
          .insert({
            ...factionData,
            chronicle_id: newChronicle.id,
            user_id: user.id,
          })
          .select()
          .single();

        if (error) {
          console.error('Error creating faction:', error);
          continue;
        }
        factionIdMap.set(id, newFaction.id);
      }

      // 4. Create character-faction relationships
      for (const cf of data.characterFactions) {
        const newCharId = characterIdMap.get(cf.character_id);
        const newFactionId = factionIdMap.get(cf.faction_id);
        if (!newCharId || !newFactionId) continue;

        await supabase.from('character_factions').insert({
          character_id: newCharId,
          faction_id: newFactionId,
          role: cf.role,
        });
      }

      // 5. Create coteries
      for (const coterie of data.coteries) {
        const { id, created_at, updated_at, chronicle_id, user_id, ...coterieData } = coterie;
        const { data: newCoterie, error } = await supabase
          .from('coteries')
          .insert({
            ...coterieData,
            chronicle_id: newChronicle.id,
            user_id: user.id,
          })
          .select()
          .single();

        if (error) {
          console.error('Error creating coterie:', error);
          continue;
        }
        coterieIdMap.set(id, newCoterie.id);
      }

      // 6. Create coterie members
      for (const cm of data.coterieMembers) {
        const newCharId = characterIdMap.get(cm.character_id);
        const newCoterieId = coterieIdMap.get(cm.coterie_id);
        if (!newCharId || !newCoterieId) continue;

        await supabase.from('coterie_members').insert({
          character_id: newCharId,
          coterie_id: newCoterieId,
          role: cm.role,
        });
      }

      // 7. Create relationships
      for (const rel of data.relationships) {
        const newCharId = characterIdMap.get(rel.character_id);
        const newRelatedId = characterIdMap.get(rel.related_character_id);
        if (!newCharId || !newRelatedId) continue;

        const { id, created_at, updated_at, user_id, character_id, related_character_id, ...relData } = rel;
        await supabase.from('relationships').insert({
          ...relData,
          character_id: newCharId,
          related_character_id: newRelatedId,
          user_id: user.id,
        });
      }

      // 8. Create sessions
      for (const session of data.sessions) {
        const { id, created_at, updated_at, chronicle_id, user_id, ...sessionData } = session;
        await supabase.from('sessions').insert({
          ...sessionData,
          chronicle_id: newChronicle.id,
          user_id: user.id,
        });
      }

      // 9. Create plots
      for (const plot of data.plots) {
        const { id, created_at, updated_at, chronicle_id, user_id, ...plotData } = plot;
        const { data: newPlot, error } = await supabase
          .from('plots')
          .insert({
            ...plotData,
            chronicle_id: newChronicle.id,
            user_id: user.id,
          })
          .select()
          .single();

        if (error) {
          console.error('Error creating plot:', error);
          continue;
        }
        plotIdMap.set(id, newPlot.id);
      }

      // 10. Create plot characters
      for (const pc of data.plotCharacters) {
        const newCharId = characterIdMap.get(pc.character_id);
        const newPlotId = plotIdMap.get(pc.plot_id);
        if (!newCharId || !newPlotId) continue;

        await supabase.from('plot_characters').insert({
          character_id: newCharId,
          plot_id: newPlotId,
        });
      }

      // 11. Create notes
      for (const note of data.notes) {
        const { id, created_at, updated_at, chronicle_id, user_id, ...noteData } = note;
        await supabase.from('notes').insert({
          ...noteData,
          chronicle_id: newChronicle.id,
          user_id: user.id,
        });
      }

      toast({
        title: "Import successful",
        description: `Restored chronicle "${newChronicle.name}" with ${characterIdMap.size} characters.`,
      });

      // Reload page to refresh data
      window.location.reload();
    } catch (error: any) {
      console.error('Import error:', error);
      toast({
        title: "Import failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setImporting(false);
      setPendingImportData(null);
    }
  };

  return (
    <>
      <div className="container mx-auto py-8 px-4 max-w-3xl">
        <h1 className="text-3xl font-bold mb-8">Settings</h1>

        <div className="space-y-6">
          {/* AI Generator Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                AI Generator
              </CardTitle>
              <CardDescription>
                Configure how content is generated for characters, stories, and scenes.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="use-local-llm">Use Local LLM (Ollama)</Label>
                  <p className="text-sm text-muted-foreground">
                    Generate content using a local Ollama instance instead of cloud AI.
                  </p>
                </div>
                <Switch
                  id="use-local-llm"
                  checked={generatorSettings.useLocalLLM}
                  onCheckedChange={(checked) => updateGeneratorSettings({ useLocalLLM: checked })}
                />
              </div>

              {generatorSettings.useLocalLLM && (
                <div className="space-y-4 pt-4 border-t border-border">
                  <div className="space-y-2">
                    <Label htmlFor="ollama-url">Ollama URL</Label>
                    <Input
                      id="ollama-url"
                      placeholder="http://localhost:11434"
                      value={generatorSettings.ollamaUrl}
                      onChange={(e) => updateGeneratorSettings({ ollamaUrl: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">
                      Make sure Ollama is running with CORS enabled: <code className="bg-muted px-1 rounded">OLLAMA_ORIGINS=* ollama serve</code>
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ollama-model">Model Name</Label>
                    <Input
                      id="ollama-model"
                      placeholder="llama3.2"
                      value={generatorSettings.ollamaModel}
                      onChange={(e) => updateGeneratorSettings({ ollamaModel: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">
                      The model must be pulled in Ollama: <code className="bg-muted px-1 rounded">ollama pull llama3.2</code>
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Mentions & Cross-References */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AtSign className="h-5 w-5" />
                Mentions & Cross-References
              </CardTitle>
              <CardDescription>
                Link to characters, stories, sessions, and more within your text fields.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium text-sm mb-1">How to use mentions</h4>
                  <p className="text-sm text-muted-foreground">
                    Type <code className="bg-muted px-1.5 py-0.5 rounded text-foreground">@</code> in any supported text field 
                    to open the autocomplete menu. Select an entity to insert a clickable link.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium text-sm mb-1">Supported fields</h4>
                  <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                    <li>Note content</li>
                    <li>Session summaries</li>
                    <li>Story descriptions</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium text-sm mb-1">Mention syntax</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Mentions are stored as: <code className="bg-muted px-1.5 py-0.5 rounded text-foreground">@[Name](type:id)</code>
                  </p>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p><strong>Types:</strong> character, plot, session, note, faction, coterie</p>
                    <p><strong>Example:</strong> <code className="bg-muted px-1 rounded">@[Marcus Blackwood](character:abc-123)</code></p>
                  </div>
                </div>

                <Alert>
                  <AtSign className="h-4 w-4" />
                  <AlertTitle>Forward-only</AlertTitle>
                  <AlertDescription>
                    Mentions work in new or edited content. Existing content stays as plain text 
                    unless you edit it to add mentions.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Export Data
              </CardTitle>
              <CardDescription>
                Download all your chronicle data as a JSON file for backup or transfer.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                This will export your current chronicle including all characters, relationships, 
                factions, coteries, sessions, plots, and notes.
              </p>
              <Button onClick={handleExport} disabled={exporting || !currentChronicle}>
                {exporting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Export Chronicle
                  </>
                )}
              </Button>
              {!currentChronicle && (
                <p className="text-sm text-destructive mt-2">No chronicle selected</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Import Data
              </CardTitle>
              <CardDescription>
                Restore a chronicle from a previously exported backup file.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Important</AlertTitle>
                <AlertDescription>
                  Importing will create a new chronicle with "(Restored)" suffix. 
                  Your existing data will not be modified.
                </AlertDescription>
              </Alert>
              <div>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="import-file"
                  disabled={importing}
                />
                <Button asChild disabled={importing}>
                  <label htmlFor="import-file" className="cursor-pointer">
                    {importing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Select Backup File
                      </>
                    )}
                  </label>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <AlertDialog open={showImportDialog} onOpenChange={setShowImportDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Import</AlertDialogTitle>
              <AlertDialogDescription>
                {pendingImportData && (
                  <div className="space-y-2">
                    <p>You are about to import:</p>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      <li>Chronicle: {pendingImportData.chronicle.name}</li>
                      <li>{pendingImportData.characters.length} characters</li>
                      <li>{pendingImportData.relationships.length} relationships</li>
                      <li>{pendingImportData.factions.length} factions</li>
                      <li>{pendingImportData.sessions.length} sessions</li>
                      <li>{pendingImportData.plots.length} plots</li>
                      <li>{pendingImportData.notes.length} notes</li>
                    </ul>
                    <p className="text-xs text-muted-foreground mt-2">
                      Exported on: {new Date(pendingImportData.exportedAt).toLocaleString()}
                    </p>
                  </div>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleImport}>Import</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </>
  );
}
