import { Navigation } from "./Navigation";
import { useChronicles } from "@/hooks/useChronicles";
import { useEffect } from "react";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { createDefaultChronicle, currentChronicle, chronicles } = useChronicles();

  useEffect(() => {
    // Create a default chronicle if the user has none
    if (!currentChronicle && chronicles.length === 0) {
      createDefaultChronicle();
    }
  }, [createDefaultChronicle, currentChronicle, chronicles.length]);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="md:ml-64 min-h-screen">
        <div className="p-6 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}