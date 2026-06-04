import { DieResult } from "@/lib/diceEngine";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface DieProps {
  die: DieResult;
  index: number;
  animate?: boolean;
  selectable?: boolean;
  selected?: boolean;
  locked?: boolean; // hunger dice are locked during willpower mode
  onToggle?: (index: number) => void;
}

export function Die({ die, index, animate = true, selectable = false, selected = false, locked = false, onToggle }: DieProps) {
  const baseClasses = "w-11 h-11 rounded-lg flex items-center justify-center text-lg font-bold border-2 transition-all select-none relative";
  
  const getClasses = () => {
    if (die.isHunger) {
      if (die.isCritical) {
        return "bg-destructive/20 border-destructive text-destructive shadow-[0_0_12px_hsl(var(--destructive)/0.4)]";
      }
      if (die.isBestial) {
        return "bg-destructive/30 border-destructive text-destructive shadow-[0_0_8px_hsl(var(--destructive)/0.3)]";
      }
      if (die.isSuccess) {
        return "bg-destructive/10 border-destructive/60 text-destructive";
      }
      return "bg-destructive/5 border-destructive/30 text-destructive/60";
    }

    if (die.isCritical) {
      return "bg-crit/20 border-crit text-crit shadow-[0_0_12px_hsl(var(--crit)/0.3)]";
    }
    if (die.isSuccess) {
      return "bg-secondary border-border text-foreground";
    }
    return "bg-muted/30 border-border/50 text-muted-foreground/50";
  };

  const handleClick = () => {
    if (selectable && !locked && onToggle) {
      onToggle(index);
    }
  };

  return (
    <div
      className={cn(
        baseClasses,
        getClasses(),
        animate && "animate-in zoom-in-50 fade-in duration-300",
        selectable && !locked && "cursor-pointer hover:ring-2 hover:ring-primary/50",
        selectable && locked && "opacity-40 cursor-not-allowed",
        selected && "ring-2 ring-primary shadow-[0_0_12px_hsl(var(--primary)/0.4)]",
      )}
      style={animate ? { animationDelay: `${index * 40}ms`, animationFillMode: "backwards" } : undefined}
      title={`${die.isHunger ? "Hunger " : ""}Die: ${die.value}${die.isCritical ? " (Critical)" : die.isBestial ? " (Bestial)" : die.isSuccess ? " (Success)" : " (Fail)"}${locked ? " — Cannot reroll hunger dice" : ""}`}
      onClick={handleClick}
    >
      {die.value}
      {selected && (
        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
          <Check className="h-3 w-3 text-primary-foreground" />
        </div>
      )}
    </div>
  );
}
