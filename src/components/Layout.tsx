import { Navigation } from "./Navigation";
import { MobileBottomNav } from "./MobileBottomNav";
import { useChronicles } from "@/hooks/useChronicles";
import { useEffect, useRef } from "react";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { createDefaultChronicle, currentChronicle, chronicles, loading } = useChronicles();
  const hasCreatedChronicle = useRef(false);

  useEffect(() => {
    if (!loading && !currentChronicle && chronicles.length === 0 && !hasCreatedChronicle.current) {
      hasCreatedChronicle.current = true;
      createDefaultChronicle();
    }
  }, [loading, currentChronicle, chronicles.length]);

  return (
    <div className="min-h-screen bg-background">
      <a href="#main-content" className="skip-to-content">
        Skip to content
      </a>
      <Navigation />
      <main id="main-content" role="main" className="md:ml-64 min-h-screen pb-20 md:pb-0">
        <div className="p-6 md:p-8">
          {children}
        </div>
      </main>
      <MobileBottomNav />
    </div>
  );
}
