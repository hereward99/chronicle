import { DieResult } from "@/lib/diceEngine";
import { cn } from "@/lib/utils";

interface DieProps {
  die: DieResult;
  index: number;
  animate?: boolean;
}

export function Die({ die, index, animate = true }: DieProps) {
  const baseClasses = "w-11 h-11 rounded-lg flex items-center justify-center text-lg font-bold border-2 transition-all select-none";
  
  const getClasses = () => {
    if (die.isHunger) {
      // Hunger dice — red themed
      if (die.isCritical) {
        // Hunger 10 — dangerous
        return "bg-destructive/20 border-destructive text-destructive shadow-[0_0_12px_hsl(var(--destructive)/0.4)]";
      }
      if (die.isBestial) {
        // Hunger 1 — bestial
        return "bg-destructive/30 border-destructive text-destructive shadow-[0_0_8px_hsl(var(--destructive)/0.3)]";
      }
      if (die.isSuccess) {
        return "bg-destructive/10 border-destructive/60 text-destructive";
      }
      // Hunger fail (2-5)
      return "bg-destructive/5 border-destructive/30 text-destructive/60";
    }

    // Regular dice
    if (die.isCritical) {
      // Regular 10 — golden critical
      return "bg-yellow-500/20 border-yellow-500 text-yellow-400 shadow-[0_0_12px_hsl(45_100%_50%/0.3)]";
    }
    if (die.isSuccess) {
      return "bg-secondary border-border text-foreground";
    }
    // Regular fail
    return "bg-muted/30 border-border/50 text-muted-foreground/50";
  };

  return (
    <div
      className={cn(
        baseClasses,
        getClasses(),
        animate && "animate-in zoom-in-50 fade-in duration-300"
      )}
      style={animate ? { animationDelay: `${index * 40}ms`, animationFillMode: "backwards" } : undefined}
      title={`${die.isHunger ? "Hunger " : ""}Die: ${die.value}${die.isCritical ? " (Critical)" : die.isBestial ? " (Bestial)" : die.isSuccess ? " (Success)" : " (Fail)"}`}
    >
      {die.value}
    </div>
  );
}
