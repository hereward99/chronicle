import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, RefreshCw, ArrowRight, Bot, Cloud } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useGeneratorSettings } from "@/hooks/useGeneratorSettings";
import { generateWithOllama } from "@/lib/ollama";

type CreationMethod = "full" | "simple" | "general" | "standard";

interface GenerateNPCDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: (data: any, creationMethod: CreationMethod) => void;
}

const CREATION_METHODS = [
  { 
    id: "full" as const, 
    label: "Full V5 Rules", 
    desc: "Complete character with all attributes, skills, and disciplines" 
  },
  { 
    id: "simple" as const, 
    label: "Simple Pool", 
    desc: "Single difficulty number (great for quick antagonists)" 
  },
  { 
    id: "general" as const, 
    label: "General Pool", 
    desc: "Primary/Secondary pools (e.g., 6/4)" 
  },
  { 
    id: "standard" as const, 
    label: "Standard Pools", 
    desc: "Physical/Social/Mental category pools" 
  }
];

const EXAMPLE_PROMPTS = [
  "A cunning Nosferatu information broker",
  "A young Toreador artist struggling with the Beast",
  "An ancient Tremere elder with forbidden knowledge",
  "A mortal detective investigating strange murders"
];

export function GenerateNPCDialog({ open, onOpenChange, onComplete }: GenerateNPCDialogProps) {
  const [step, setStep] = useState<"method" | "prompt" | "generating">("method");
  const [creationMethod, setCreationMethod] = useState<CreationMethod>("full");
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  const { settings: generatorSettings } = useGeneratorSettings();

  const handleMethodSelect = (method: CreationMethod) => {
    setCreationMethod(method);
    setStep("prompt");
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setStep("generating");
    setIsGenerating(true);

    try {
      let data;

      // Modify the prompt based on creation method
      let enhancedPrompt = prompt;
      if (creationMethod !== "full") {
        enhancedPrompt = `${prompt}. Note: This is a quick NPC, focus on concept, personality, and key disciplines. Attributes and skills can be minimal.`;
      }

      if (generatorSettings.useLocalLLM) {
        data = await generateWithOllama(
          enhancedPrompt,
          "npc",
          generatorSettings.ollamaUrl,
          generatorSettings.ollamaModel
        );
      } else {
        const { data: edgeData, error } = await supabase.functions.invoke('generate-content', {
          body: { prompt: enhancedPrompt, contentType: "npc" }
        });

        if (error) {
          throw new Error(error.message || 'Failed to generate content');
        }

        if (edgeData?.error) {
          throw new Error(edgeData.error);
        }

        data = edgeData;
      }

      if (data?.parsed) {
        // Reset dialog state
        setStep("method");
        setPrompt("");
        onOpenChange(false);
        
        // Pass the generated data to the wizard
        onComplete(data.parsed, creationMethod);
      } else {
        throw new Error("Failed to parse generated content");
      }
    } catch (error) {
      console.error('Generation error:', error);
      const errorMessage = error instanceof Error ? error.message : "Failed to generate content. Please try again.";
      
      let description = errorMessage;
      if (generatorSettings.useLocalLLM && errorMessage.includes('Failed to fetch')) {
        description = "Cannot connect to Ollama. Make sure it's running with CORS enabled: OLLAMA_ORIGINS=* ollama serve";
      }
      
      toast({
        title: "Generation Failed",
        description,
        variant: "destructive"
      });
      setStep("prompt");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClose = () => {
    setStep("method");
    setPrompt("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Generate NPC
          </DialogTitle>
          <DialogDescription>
            {step === "method" && "Choose how detailed this NPC should be."}
            {step === "prompt" && "Describe the NPC you want to create."}
            {step === "generating" && "Creating your NPC..."}
          </DialogDescription>
        </DialogHeader>

        {step === "method" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {CREATION_METHODS.map((method) => (
                <Card
                  key={method.id}
                  className={`p-4 cursor-pointer transition-all hover:border-primary/50`}
                  onClick={() => handleMethodSelect(method.id)}
                >
                  <div className="text-center space-y-1">
                    <div className="font-semibold text-sm">{method.label}</div>
                    <div className="text-xs text-muted-foreground">{method.desc}</div>
                  </div>
                </Card>
              ))}
            </div>
            <div className="text-xs text-muted-foreground text-center">
              Dice pool methods skip detailed attributes for faster NPC creation.
            </div>
          </div>
        )}

        {step === "prompt" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Badge variant="outline">
                {CREATION_METHODS.find(m => m.id === creationMethod)?.label}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {generatorSettings.useLocalLLM ? (
                  <>
                    <Bot className="h-3 w-3 mr-1" />
                    Ollama
                  </>
                ) : (
                  <>
                    <Cloud className="h-3 w-3 mr-1" />
                    Cloud AI
                  </>
                )}
              </Badge>
            </div>

            <div className="space-y-2">
              <Label>Describe your NPC</Label>
              <Textarea
                placeholder="A cunning Nosferatu information broker who knows everyone's secrets..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-24 resize-none"
              />
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Quick prompts:</p>
              <div className="flex flex-wrap gap-1">
                {EXAMPLE_PROMPTS.map((example, i) => (
                  <Badge 
                    key={i}
                    variant="outline" 
                    className="text-xs cursor-pointer hover:bg-secondary"
                    onClick={() => setPrompt(example)}
                  >
                    {example.slice(0, 30)}...
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setStep("method")}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={!prompt.trim()}
                className="flex-1 bg-gradient-blood hover:opacity-90"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Generate
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {step === "generating" && (
          <div className="flex flex-col items-center justify-center py-12">
            <RefreshCw className="h-10 w-10 text-primary animate-spin mb-4" />
            <p className="text-muted-foreground">Generating your NPC...</p>
            <p className="text-xs text-muted-foreground mt-2">
              This may take a few moments
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
