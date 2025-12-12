import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, Copy, RefreshCw, Users, BookOpen, MapPin, Scroll } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function Generator() {
  const [prompt, setPrompt] = useState("");
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState("scene");
  const { toast } = useToast();

  const generateContent = async () => {
    if (!prompt.trim()) return;
    
    setIsGenerating(true);
    setGeneratedContent(null);

    try {
      const { data, error } = await supabase.functions.invoke('generate-content', {
        body: { prompt, contentType: activeTab }
      });

      if (error) {
        throw new Error(error.message || 'Failed to generate content');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      setGeneratedContent(data.content);
    } catch (error) {
      console.error('Generation error:', error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate content. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    if (generatedContent) {
      navigator.clipboard.writeText(generatedContent);
    }
  };

  const generatorTypes = [
    { id: "scene", label: "Scene", icon: MapPin },
    { id: "npc", label: "NPC", icon: Users },
    { id: "story", label: "Story Hook", icon: BookOpen },
    { id: "location", label: "Location", icon: Scroll }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Content Generator</h1>
          <p className="text-muted-foreground">Generate scenes, NPCs, and stories for your chronicle</p>
        </div>
      </div>

      {/* Generator Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
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
                    <div className="space-y-1">
                      {type.id === "scene" && (
                        <>
                          <Badge variant="outline" className="text-xs cursor-pointer hover:bg-secondary" 
                                 onClick={() => setPrompt("A tense Elysium gathering where accusations fly")}>
                            Tense Elysium gathering
                          </Badge>
                          <Badge variant="outline" className="text-xs cursor-pointer hover:bg-secondary ml-2"
                                 onClick={() => setPrompt("A feeding scene in a crowded nightclub")}>
                            Nightclub feeding scene
                          </Badge>
                        </>
                      )}
                      {type.id === "npc" && (
                        <>
                          <Badge variant="outline" className="text-xs cursor-pointer hover:bg-secondary"
                                 onClick={() => setPrompt("A cunning Nosferatu information broker")}>
                            Nosferatu broker
                          </Badge>
                          <Badge variant="outline" className="text-xs cursor-pointer hover:bg-secondary ml-2"
                                 onClick={() => setPrompt("A young Toreador artist struggling with the Beast")}>
                            Struggling Toreador
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
                    {generatedContent && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={copyToClipboard}
                        className="border-border hover:bg-secondary"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
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
                  ) : generatedContent ? (
                    <div className="prose prose-invert max-w-none">
                      <pre className="whitespace-pre-wrap text-sm text-foreground font-body leading-relaxed">
                        {generatedContent}
                      </pre>
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
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}