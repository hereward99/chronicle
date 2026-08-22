import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDevNotes } from '@/hooks/useDevNotes';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { ChronicleDate } from '@/components/ChronicleDate';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { useGeneratorSettings, type AIProvider } from '@/hooks/useGeneratorSettings';
import { GOOGLE_MODELS, testGoogleKey } from '@/lib/gemini';
import { notify } from '@/lib/notify';
import { Bot, AtSign, ClipboardList, Plus, X, Check, RotateCcw, FlaskConical, Eye, EyeOff } from 'lucide-react';
import { GuidedTour } from '@/components/onboarding/GuidedTour';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';



export default function Settings() {
  const { settings: generatorSettings, updateSettings: updateGeneratorSettings } = useGeneratorSettings();
  const { requireOnline } = useOnlineStatus();
  const [showTour, setShowTour] = useState(false);
  const [showGoogleKey, setShowGoogleKey] = useState(false);
  const [testingKey, setTestingKey] = useState(false);

  const handleTestGoogleKey = async () => {
    setTestingKey(true);
    try {
      await testGoogleKey(generatorSettings.googleApiKey, generatorSettings.googleModel);
      notify.success('Key works', 'Google AI accepted your API key.');
    } catch (error) {
      notify.error('Key test failed', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setTestingKey(false);
    }
  };


  // Dev notes (Supabase-backed)
  const { devNotes, addNote, toggleNote, removeNote } = useDevNotes();
  const [newNoteText, setNewNoteText] = useState('');
  type DevNoteCategory = 'fix' | 'feature' | 'change' | 'idea';
  const [newNoteCategory, setNewNoteCategory] = useState<DevNoteCategory>('idea');

  const addDevNote = () => {
    if (!newNoteText.trim()) return;
    if (!requireOnline('Add note')) return;
    addNote.mutate({ text: newNoteText.trim(), category: newNoteCategory });
    setNewNoteText('');
  };

  const toggleDevNote = (id: string) => {
    if (!requireOnline('Toggle note')) return;
    const note = devNotes.find(n => n.id === id);
    if (note) toggleNote.mutate({ id, done: !note.done });
  };

  const removeDevNote = (id: string) => {
    if (!requireOnline('Remove note')) return;
    removeNote.mutate(id);
  };

  const categoryColors: Record<DevNoteCategory, string> = {
    fix: 'bg-destructive/15 text-destructive border-destructive/30',
    feature: 'bg-primary/15 text-primary border-primary/30',
    change: 'bg-accent text-accent-foreground border-border',
    idea: 'bg-secondary text-secondary-foreground border-border',
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
              <div className="space-y-2">
                <Label htmlFor="ai-provider">AI Provider</Label>
                <Select
                  value={generatorSettings.provider}
                  onValueChange={(value) => updateGeneratorSettings({ provider: value as AIProvider })}
                >
                  <SelectTrigger id="ai-provider">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lovable">Built-in AI (no setup needed)</SelectItem>
                    <SelectItem value="google">Google AI (your own API key)</SelectItem>
                    <SelectItem value="ollama">Local LLM (Ollama)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  {generatorSettings.provider === 'lovable' && 'Uses the app’s shared AI service. Nothing to configure.'}
                  {generatorSettings.provider === 'google' && 'Calls Google Gemini directly from your browser using your own key, billed to your Google account.'}
                  {generatorSettings.provider === 'ollama' && 'Runs generation against a local Ollama instance on your machine.'}
                </p>
              </div>

              {generatorSettings.provider === 'google' && (
                <div className="space-y-4 pt-4 border-t border-border">
                  <div className="space-y-2">
                    <Label htmlFor="google-api-key">Google API Key</Label>
                    <div className="flex gap-2">
                      <Input
                        id="google-api-key"
                        type={showGoogleKey ? 'text' : 'password'}
                        autoComplete="off"
                        placeholder="AIza..."
                        value={generatorSettings.googleApiKey}
                        onChange={(e) => updateGeneratorSettings({ googleApiKey: e.target.value })}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        aria-label={showGoogleKey ? 'Hide API key' : 'Show API key'}
                        onClick={() => setShowGoogleKey((v) => !v)}
                      >
                        {showGoogleKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Get a free key at{' '}
                      <a
                        href="https://aistudio.google.com/app/apikey"
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary underline underline-offset-2"
                      >
                        aistudio.google.com
                      </a>
                      . Stored in this browser only — never sent to our servers or database. Anyone with access to this
                      browser profile can read it, so restrict the key in Google AI Studio.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="google-model">Model</Label>
                    <Select
                      value={generatorSettings.googleModel}
                      onValueChange={(value) => updateGeneratorSettings({ googleModel: value })}
                    >
                      <SelectTrigger id="google-model">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {GOOGLE_MODELS.map((m) => (
                          <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    disabled={testingKey || !generatorSettings.googleApiKey.trim()}
                    onClick={handleTestGoogleKey}
                  >
                    {testingKey ? 'Testing…' : 'Test key'}
                  </Button>
                </div>
              )}

              {generatorSettings.provider === 'ollama' && (
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
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-sm mb-1">How to use mentions</h4>
                  <p className="text-sm text-muted-foreground">
                    Type <kbd className="bg-muted px-1.5 py-0.5 rounded text-foreground font-mono text-xs">@</kbd> in any supported text field 
                    to open the autocomplete menu. Select an entity to insert a clickable link that navigates directly to that item.
                  </p>
                </div>

                <div>
                  <h4 className="font-medium text-sm mb-2">Quick examples</h4>
                  <div className="bg-muted/50 rounded-lg p-3 space-y-2 text-sm">
                    <p className="text-muted-foreground">
                      <span className="text-foreground font-medium">Session summary:</span> "The coterie met with <span className="text-primary font-medium">@Marcus Blackwood</span> at <span className="text-primary font-medium">@The Elysium</span> to discuss the threat from <span className="text-primary font-medium">@The Sabbat Incursion</span>."
                    </p>
                    <p className="text-muted-foreground">
                      <span className="text-foreground font-medium">Character notes:</span> "Owes a major boon to <span className="text-primary font-medium">@Prince Valeria</span>. See <span className="text-primary font-medium">@Session 3</span> for details."
                    </p>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-sm mb-1">Supported fields</h4>
                  <div className="grid grid-cols-2 gap-1">
                    {[
                      "Session summaries", "Story descriptions & summaries", "Note content", 
                      "Character history & notes", "Relationship descriptions", "Location descriptions",
                      "Faction descriptions", "Coterie descriptions", "Boon notes"
                    ].map(field => (
                      <p key={field} className="text-sm text-muted-foreground flex items-center gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-primary shrink-0" />
                        {field}
                      </p>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-sm mb-1">Mentionable entity types</h4>
                  <div className="flex flex-wrap gap-2">
                    {["Characters", "Stories", "Sessions", "Notes", "Factions", "Coteries", "Locations"].map(type => (
                      <span key={type} className="text-xs bg-muted px-2 py-1 rounded-full text-muted-foreground">{type}</span>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-sm mb-1">Mention syntax (advanced)</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Mentions are stored as: <code className="bg-muted px-1.5 py-0.5 rounded text-foreground">@[Name](type:id)</code>
                  </p>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p><strong>Types:</strong> character, plot, session, note, faction, coterie, location</p>
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


          {/* Guided Tour */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RotateCcw className="h-5 w-5" />
                Guided Tour
              </CardTitle>
              <CardDescription>
                Re-watch the onboarding walkthrough that introduces the main features of Chronicle Keeper.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" onClick={() => setShowTour(true)}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Replay Guided Tour
              </Button>
            </CardContent>
          </Card>

          {/* Dev Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                Dev Notes
              </CardTitle>
              <CardDescription>
                Track developments, changes, fixes, and ideas for this app.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Textarea
                  placeholder="Describe a fix, feature, change, or idea..."
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  className="min-h-[60px] flex-1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                      e.preventDefault();
                      addDevNote();
                    }
                  }}
                />
              </div>
              <div className="flex items-center gap-2">
                <ToggleGroup
                  type="single"
                  value={newNoteCategory}
                  onValueChange={(value) => value && setNewNoteCategory(value as DevNoteCategory)}
                  className="flex-1 flex-wrap justify-start"
                >
                  {(['idea', 'feature', 'fix', 'change'] as const).map(cat => (
                    <ToggleGroupItem
                      key={cat}
                      value={cat}
                      size="sm"
                      className={cn(
                        "rounded-full text-xs font-medium border capitalize transition-all data-[state=off]:opacity-60 data-[state=off]:hover:opacity-100",
                        categoryColors[cat]
                      )}
                    >
                      {cat}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
                <Button size="sm" onClick={addDevNote} disabled={!newNoteText.trim()}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>

              {devNotes.length > 0 && (
                <div className="max-h-[400px] overflow-y-auto rounded-md">
                  <div className="space-y-2 pr-2">
                    {devNotes.map(note => (
                      <div
                        key={note.id}
                        className={`flex items-start gap-2 p-3 rounded-md border bg-card transition-opacity ${note.done ? 'opacity-50' : ''}`}
                      >
                        <button
                          onClick={() => toggleDevNote(note.id)}
                          className={`mt-0.5 shrink-0 h-4 w-4 rounded border flex items-center justify-center transition-colors ${note.done ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground/40 hover:border-primary'}`}
                        >
                          {note.done && <Check className="h-3 w-3" />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm whitespace-pre-wrap break-words ${note.done ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                            {note.text}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border capitalize ${categoryColors[note.category]}`}>
                              {note.category}
                            </span>
                            <ChronicleDate value={note.created_at} className="text-[10px] text-muted-foreground" />
                          </div>
                        </div>
                        <button
                          onClick={() => removeDevNote(note.id)}
                          className="shrink-0 text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {devNotes.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No notes yet. Add your first development note above.
                </p>
              )}

              {import.meta.env.DEV && (
                <div className="pt-2 border-t border-border">
                  <Link
                    to="/dev/kitchen-sink"
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    <FlaskConical className="h-4 w-4" />
                    Open kitchen-sink component reference
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </div>

      <GuidedTour open={showTour} onClose={() => setShowTour(false)} />
    </>
  );
}
