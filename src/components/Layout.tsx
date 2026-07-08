import { Navigation } from "./Navigation";
import { MobileBottomNav } from "./MobileBottomNav";
import { OfflineBanner } from "./OfflineBanner";
import { CommandPalette } from "./CommandPalette";
import { KeyboardShortcuts } from "./KeyboardShortcuts";
import { useChronicles } from "@/hooks/useChronicles";
import { useEffect, useRef, useState } from "react";
import { ChronicleSetupDialog } from "./onboarding/ChronicleSetupDialog";
import { GuidedTour } from "./onboarding/GuidedTour";

interface LayoutProps {
  children: React.ReactNode;
}

const ONBOARDING_KEY = "chronicle-keeper-onboarded";

export function Layout({ children }: LayoutProps) {
  const { createChronicle, currentChronicle, chronicles, loading } = useChronicles();
  const hasCreatedChronicle = useRef(false);
  const [showSetup, setShowSetup] = useState(false);
  const [showTour, setShowTour] = useState(false);

  useEffect(() => {
    // Show setup dialog if user has no chronicles and hasn't been onboarded
    if (!loading && !currentChronicle && chronicles.length === 0 && !hasCreatedChronicle.current) {
      const wasOnboarded = localStorage.getItem(ONBOARDING_KEY);
      if (!wasOnboarded) {
        setShowSetup(true);
      } else {
        // Returning user who deleted chronicles — silently create default
        hasCreatedChronicle.current = true;
        createChronicle({
          name: "My Chronicle",
          description: "Your Vampire: The Masquerade tabletop roleplaying game chronicle",
          setting: "Modern Nights",
        });
      }
    }
  }, [loading, currentChronicle, chronicles.length]);

  const handleSetupComplete = async (data: { name: string; description: string; setting: string }) => {
    hasCreatedChronicle.current = true;
    setShowSetup(false);
    await createChronicle(data);
    localStorage.setItem(ONBOARDING_KEY, "true");
    setShowTour(true);
  };

  const handleTourClose = () => {
    setShowTour(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <CommandPalette />
      <OfflineBanner />
      <a href="#main-content" className="skip-to-content">
        Skip to content
      </a>
      <Navigation />
      <main id="main-content" role="main" className="md:ml-64 min-h-screen pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-0">
        <div className="p-4 sm:p-6 md:p-8">
          {children}
        </div>
      </main>

      <MobileBottomNav />

      <ChronicleSetupDialog open={showSetup} onComplete={handleSetupComplete} />
      <GuidedTour open={showTour} onClose={handleTourClose} />
    </div>
  );
}
