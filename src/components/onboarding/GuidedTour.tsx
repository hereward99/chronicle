import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, ArrowRight, ArrowLeft, Users, BookOpen, Scroll, MapPin, Network, AtSign } from "lucide-react";
import { cn } from "@/lib/utils";

interface TourStep {
  title: string;
  description: string;
  icon: React.ReactNode;
  highlight?: string; // CSS selector hint (informational only)
}

const tourSteps: TourStep[] = [
  {
    title: "Chronicle Dashboard",
    description: "This is your home base. You'll see stats, recent activity, and quick-create buttons for notes. Everything rolls up here.",
    icon: <BookOpen className="h-5 w-5" />,
  },
  {
    title: "Characters",
    description: "Create PCs and NPCs with full V5 character sheets — attributes, skills, disciplines, and trackers. Use the Wizard for guided creation or Quick Create for speed.",
    icon: <Users className="h-5 w-5" />,
  },
  {
    title: "Stories & Sessions",
    description: "Stories are your ongoing storylines. Sessions are the individual game nights. Link sessions to stories to keep everything organized.",
    icon: <Scroll className="h-5 w-5" />,
  },
  {
    title: "Locations & Relationships",
    description: "Map out your game world with Locations, and track how characters relate to each other with the Relationships graph.",
    icon: <MapPin className="h-5 w-5" />,
  },
  {
    title: "Cross-Reference with @Mentions",
    description: "In any text field, type @ to link to characters, stories, sessions, factions, and more. Mentions become clickable links that connect your entire chronicle.",
    icon: <AtSign className="h-5 w-5" />,
  },
];

interface GuidedTourProps {
  open: boolean;
  onClose: () => void;
}

export function GuidedTour({ open, onClose }: GuidedTourProps) {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (open) setCurrentStep(0);
  }, [open]);

  if (!open) return null;

  const step = tourSteps[currentStep];
  const isLast = currentStep === tourSteps.length - 1;
  const isFirst = currentStep === 0;

  return (
    <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />

      {/* Tour card */}
      <div className="relative z-10 w-full max-w-md bg-card border border-border rounded-xl shadow-deep p-6 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Close tour"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Progress dots */}
        <div className="flex items-center gap-1.5 justify-center">
          {tourSteps.map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                i === currentStep ? "w-6 bg-primary" : "w-1.5 bg-border"
              )}
            />
          ))}
        </div>

        {/* Icon + content */}
        <div className="text-center space-y-3">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto text-primary">
            {step.icon}
          </div>
          <h3 className="text-lg font-semibold text-foreground">{step.title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
        </div>

        {/* Navigation */}
        <div className="flex gap-3 pt-2">
          {!isFirst && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentStep(currentStep - 1)}
              className="flex-1"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          )}
          {isFirst && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="flex-1 text-muted-foreground"
            >
              Skip tour
            </Button>
          )}
          <Button
            size="sm"
            onClick={() => {
              if (isLast) {
                onClose();
              } else {
                setCurrentStep(currentStep + 1);
              }
            }}
            className="flex-1 bg-gradient-blood hover:opacity-90"
          >
            {isLast ? "Start Building" : (
              <>
                Next
                <ArrowRight className="h-4 w-4 ml-1" />
              </>
            )}
          </Button>
        </div>

        {/* Step counter */}
        <p className="text-xs text-muted-foreground text-center">
          {currentStep + 1} of {tourSteps.length}
        </p>
      </div>
    </div>
  );
}
