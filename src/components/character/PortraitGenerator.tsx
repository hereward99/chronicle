import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Loader2, X, RefreshCw } from "lucide-react";

interface PortraitGeneratorProps {
  characterName: string;
  clan?: string;
  concept?: string;
  avatarUrl: string | null;
  onPortraitGenerated: (url: string) => void;
  onPortraitRemoved: () => void;
  size?: "sm" | "lg";
}

export function PortraitGenerator({
  characterName,
  clan,
  concept,
  avatarUrl,
  onPortraitGenerated,
  onPortraitRemoved,
  size = "lg",
}: PortraitGeneratorProps) {
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();

  const buildDescription = () => {
    const parts: string[] = [];
    if (characterName) parts.push(`named ${characterName}`);
    if (clan && clan !== "Human" && clan !== "Ghoul") parts.push(`of clan ${clan}`);
    if (concept) parts.push(`described as: ${concept}`);
    return parts.length > 0
      ? `A vampire character ${parts.join(", ")}`
      : "A mysterious vampire character";
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-portrait", {
        body: { characterDescription: buildDescription() },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      if (data?.imageUrl) {
        // Upload base64 to storage
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) throw new Error("Not authenticated");

        const base64 = data.imageUrl.split(",")[1];
        const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
        const fileName = `${userData.user.id}/portraits/${Date.now()}-${Math.random().toString(36).slice(2)}.png`;

        const { error: uploadError } = await supabase.storage
          .from("character-files")
          .upload(fileName, bytes, { contentType: "image/png" });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("character-files")
          .getPublicUrl(fileName);

        onPortraitGenerated(urlData.publicUrl);
        toast({ title: "Portrait generated!", description: "Your character's portrait is ready." });
      }
    } catch (err: any) {
      toast({
        title: "Portrait generation failed",
        description: err.message || "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const avatarSize = size === "lg" ? "h-28 w-28" : "h-16 w-16";

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative group">
        <Avatar className={`${avatarSize} border-2 border-border`}>
          <AvatarImage src={avatarUrl || undefined} alt={characterName || "Portrait"} />
          <AvatarFallback className="text-2xl bg-muted">
            {characterName ? characterName.charAt(0).toUpperCase() : "?"}
          </AvatarFallback>
        </Avatar>
        {avatarUrl && (
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={onPortraitRemoved}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleGenerate}
        disabled={generating}
        className="gap-2"
      >
        {generating ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Generating…
          </>
        ) : avatarUrl ? (
          <>
            <RefreshCw className="h-4 w-4" />
            Regenerate Portrait
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            Generate AI Portrait
          </>
        )}
      </Button>

      {!avatarUrl && (
        <p className="text-xs text-muted-foreground text-center max-w-[200px]">
          Uses your character details to create a unique portrait
        </p>
      )}
    </div>
  );
}
