import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Loader2, X, RefreshCw } from "lucide-react";

export interface PortraitCharacterDetails {
  name?: string;
  clan?: string;
  concept?: string;
  appearance?: string | null;
  distinguishingFeatures?: string | null;
  predatorType?: string | null;
  // Attributes for physical descriptors
  strength?: number | null;
  dexterity?: number | null;
  stamina?: number | null;
  charisma?: number | null;
  manipulation?: number | null;
  composure?: number | null;
  intelligence?: number | null;
  wits?: number | null;
  resolve?: number | null;
  // Other
  generation?: number | null;
  characterType?: string; // "vampire" | "ghoul" | "human"
}

interface PortraitGeneratorProps {
  details: PortraitCharacterDetails;
  avatarUrl: string | null;
  onPortraitGenerated: (url: string) => void;
  onPortraitRemoved: () => void;
  size?: "sm" | "lg";
}

// Clan-based visual stereotypes for VtM
const CLAN_AESTHETICS: Record<string, string> = {
  "Banu Haqim": "Middle-Eastern heritage, intense piercing gaze, disciplined warrior bearing",
  "Brujah": "rebellious punk aesthetic, fierce expression, leather or street-tough style",
  "Gangrel": "feral animalistic features, wild unkempt appearance, scars or bestial traits",
  "Hecata": "gaunt deathly pallor, sunken eyes, funereal Victorian or gothic attire",
  "Lasombra": "aristocratic Mediterranean features, commanding presence, shadows seem to cling to them",
  "Malkavian": "unsettling otherworldly gaze, slightly off-putting beauty, eyes that see too much",
  "Ministry": "exotic serpentine allure, hypnotic eyes, opulent or cultish style",
  "Nosferatu": "grotesque monstrous features, bald or deformed, repulsive inhuman appearance",
  "Ravnos": "roguish Romani-inspired look, charming trickster vibe, eclectic style",
  "Salubri": "serene angelic features, a faint third-eye mark on forehead, gentle ethereal beauty",
  "Toreador": "stunningly beautiful, flawless features, fashion-forward elegant appearance",
  "Tremere": "scholarly austere look, sharp calculating eyes, formal or occult-tinged attire",
  "Tzimisce": "Eastern European noble features, unsettlingly perfect or subtly inhuman, old-world aristocracy",
  "Ventrue": "commanding executive presence, immaculate grooming, expensive tailored clothing",
  "Caitiff": "unremarkable vampiric features, no distinct clan markers, could blend into any crowd",
  "Thin-Blood": "almost human-looking, very subtle vampiric pallor, youthful appearance",
};

const PREDATOR_AESTHETICS: Record<string, string> = {
  "Alleycat": "aggressive streetwise look, predatory stance",
  "Bagger": "clinical detached appearance, medical or professional vibe",
  "Blood Leech": "parasitic desperate hunger visible in the eyes",
  "Cleaver": "deceptively normal suburban appearance, hiding darkness beneath",
  "Consensualist": "gentle approachable demeanor, trustworthy face",
  "Farmer": "humble unassuming look, avoids drawing attention",
  "Osiris": "magnetic cult-leader presence, mesmerizing aura",
  "Sandman": "stealthy shadow-dweller, quiet and unnoticed",
  "Scene Queen": "glamorous socialite, center of attention, fashionable",
  "Siren": "intensely seductive, smoldering gaze, alluring beauty",
};

function buildAttributeDescriptors(details: PortraitCharacterDetails): string[] {
  const descriptors: string[] = [];
  const { strength, dexterity, stamina, charisma, composure, intelligence, wits } = details;

  // Physical build from Strength + Stamina
  const physicalPower = ((strength || 1) + (stamina || 1)) / 2;
  if (physicalPower >= 4) descriptors.push("powerfully muscular build");
  else if (physicalPower >= 3) descriptors.push("athletic well-built frame");
  else if (physicalPower <= 1.5) descriptors.push("frail thin frame");

  // Grace from Dexterity
  if ((dexterity || 1) >= 4) descriptors.push("graceful fluid posture");
  else if ((dexterity || 1) <= 1) descriptors.push("stiff awkward posture");

  // Social presence from Charisma
  if ((charisma || 1) >= 4) descriptors.push("magnetically attractive, striking presence");
  else if ((charisma || 1) >= 3) descriptors.push("naturally charming features");
  else if ((charisma || 1) <= 1) descriptors.push("plain unremarkable features");

  // Composure affects expression
  if ((composure || 1) >= 4) descriptors.push("perfectly composed unreadable expression");
  else if ((composure || 1) <= 1) descriptors.push("visibly anxious or twitchy demeanor");

  // Intelligence + Wits affect the eyes
  const mentalAcuity = ((intelligence || 1) + (wits || 1)) / 2;
  if (mentalAcuity >= 4) descriptors.push("sharp intelligent eyes that miss nothing");
  else if (mentalAcuity >= 3) descriptors.push("keen observant gaze");

  return descriptors;
}

export function buildPortraitDescription(details: PortraitCharacterDetails): string {
  const parts: string[] = [];

  // Base creature type
  const creatureType = details.characterType === "human"
    ? "mortal human"
    : details.characterType === "ghoul"
    ? "ghoul (blood-bound servant of a vampire)"
    : "vampire";

  parts.push(`A ${creatureType} character`);

  if (details.name) parts.push(`named ${details.name}`);

  // Clan aesthetic
  if (details.clan && CLAN_AESTHETICS[details.clan]) {
    parts.push(`of clan ${details.clan} (${CLAN_AESTHETICS[details.clan]})`);
  } else if (details.clan && details.clan !== "Human" && details.clan !== "Ghoul") {
    parts.push(`of clan ${details.clan}`);
  }

  // Concept gives personality/role context
  if (details.concept) parts.push(`whose concept is: ${details.concept}`);

  // Appearance field — most important, user-written description
  if (details.appearance) parts.push(`Appearance: ${details.appearance}`);

  // Distinguishing features
  if (details.distinguishingFeatures) parts.push(`Distinguishing features: ${details.distinguishingFeatures}`);

  // Predator type aesthetic
  if (details.predatorType && details.predatorType !== "None" && PREDATOR_AESTHETICS[details.predatorType]) {
    parts.push(`Predator type vibe: ${PREDATOR_AESTHETICS[details.predatorType]}`);
  }

  // Attribute-derived physical descriptors
  const attrDescriptors = buildAttributeDescriptors(details);
  if (attrDescriptors.length > 0) {
    parts.push(`Physical traits: ${attrDescriptors.join(", ")}`);
  }

  // Generation affects age/power feel
  if (details.generation && details.generation <= 8) {
    parts.push("ancient powerful elder vampire with an aura of immense age and authority");
  } else if (details.generation && details.generation <= 10) {
    parts.push("experienced vampire with a subtle aura of age and power");
  }

  return parts.join(". ") + ".";
}

export function PortraitGenerator({
  details,
  avatarUrl,
  onPortraitGenerated,
  onPortraitRemoved,
  size = "lg",
}: PortraitGeneratorProps) {
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const description = buildPortraitDescription(details);
      
      const { data, error } = await supabase.functions.invoke("generate-portrait", {
        body: { characterDescription: description },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      if (data?.imageUrl) {
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
        notify.success("Portrait generated!", "Your character's portrait is ready.");
      }
    } catch (err: any) {
      notify.error("Portrait generation failed", err.message || "Please try again later.");
    } finally {
      setGenerating(false);
    }
  };

  const avatarSize = size === "lg" ? "h-28 w-28" : "h-16 w-16";
  const displayName = details.name || "Portrait";

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative group">
        <Avatar className={`${avatarSize} border-2 border-border`}>
          <AvatarImage src={avatarUrl || undefined} alt={displayName} />
          <AvatarFallback className="text-2xl bg-muted">
            {details.name ? details.name.charAt(0).toUpperCase() : "?"}
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
