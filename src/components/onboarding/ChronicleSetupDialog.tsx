import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skull, BookOpen, MapPin, Sparkles } from "lucide-react";

const settings = [
  "Modern Nights",
  "Dark Ages",
  "Victorian Age",
  "Custom",
];

interface ChronicleSetupDialogProps {
  open: boolean;
  onComplete: (data: { name: string; description: string; setting: string }) => void;
}

export function ChronicleSetupDialog({ open, onComplete }: ChronicleSetupDialogProps) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [setting, setSetting] = useState("Modern Nights");

  const handleComplete = () => {
    onComplete({
      name: name.trim() || "My Chronicle",
      description: description.trim() || "A Vampire: The Masquerade chronicle",
      setting,
    });
  };

  return (
    <Dialog open={open}>
      <DialogContent size="sm" className="[&>button]:hidden" onPointerDownOutside={(e) => e.preventDefault()}>
        {step === 0 && (
          <div className="text-center space-y-6 py-4">
            <div className="w-16 h-16 bg-gradient-blood rounded-2xl flex items-center justify-center mx-auto shadow-crimson">
              <Skull className="h-9 w-9 text-primary-foreground" />
            </div>
            <div>
              <DialogHeader>
                <DialogTitle className="text-2xl text-foreground">Welcome to Chronicle Keeper</DialogTitle>
                <DialogDescription className="text-base mt-2">
                  Your digital companion for running Vampire: The Masquerade 5th Edition games.
                </DialogDescription>
              </DialogHeader>
            </div>

            <div className="grid grid-cols-3 gap-3 text-left">
              <div className="bg-card rounded-lg p-3 border border-border">
                <BookOpen className="h-5 w-5 text-primary mb-2" />
                <p className="text-xs text-muted-foreground">Track stories, sessions, and notes in one place</p>
              </div>
              <div className="bg-card rounded-lg p-3 border border-border">
                <MapPin className="h-5 w-5 text-primary mb-2" />
                <p className="text-xs text-muted-foreground">Map characters, factions, locations, and relationships</p>
              </div>
              <div className="bg-card rounded-lg p-3 border border-border">
                <Sparkles className="h-5 w-5 text-primary mb-2" />
                <p className="text-xs text-muted-foreground">Cross-reference everything with @mentions</p>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              Everything starts with a <strong className="text-foreground">Chronicle</strong> — a container for your entire game world. Let's set yours up.
            </p>

            <Button onClick={() => setStep(1)} className="w-full bg-gradient-blood hover:opacity-90 shadow-crimson">
              Get Started
            </Button>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6">
            <DialogHeader>
              <DialogTitle className="text-foreground">Name Your Chronicle</DialogTitle>
              <DialogDescription>
                This is the name of your game — you can always change it later in Settings.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="chronicle-name">Chronicle Name</Label>
                <Input
                  id="chronicle-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Shadows of Vancouver"
                  className="bg-input border-border"
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="chronicle-setting">Setting</Label>
                <Select value={setting} onValueChange={setSetting}>
                  <SelectTrigger className="bg-input border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {settings.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="chronicle-desc">Description <span className="text-muted-foreground">(optional)</span></Label>
                <Textarea
                  id="chronicle-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="A brief overview of your chronicle's themes or premise..."
                  className="bg-input border-border resize-none"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(0)} className="flex-1">
                Back
              </Button>
              <Button onClick={handleComplete} className="flex-1 bg-gradient-blood hover:opacity-90 shadow-crimson">
                Create Chronicle
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
