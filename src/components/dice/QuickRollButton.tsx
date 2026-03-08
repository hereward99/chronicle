import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Die } from "@/components/dice/Die";
import { rollV5Dice, RollResult, getOutcomeLabel, getOutcomeColor } from "@/lib/diceEngine";
import { Dices, Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickRollButtonProps {
  basePool: number;
  hunger?: number;
  label: string;
  difficulty?: number;
}

export function QuickRollButton({ basePool, hunger = 1, label, difficulty = 1 }: QuickRollButtonProps) {
  const [pool, setPool] = useState(basePool);
  const [diff, setDiff] = useState(difficulty);
  const [result, setResult] = useState<RollResult | null>(null);
  const [open, setOpen] = useState(false);

  const handleRoll = useCallback(() => {
    setResult(rollV5Dice(pool, hunger, diff));
  }, [pool, hunger, diff]);

  const handleOpen = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      setPool(basePool);
      setResult(null);
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 opacity-40 hover:opacity-100 transition-opacity"
          title={`Roll ${label}`}
        >
          <Dices className="h-3 w-3" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3" align="end">
        <div className="space-y-3">
          <div className="text-sm font-semibold">{label}</div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground w-8">Pool</span>
              <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => setPool(p => Math.max(1, p - 1))}>
                <Minus className="h-3 w-3" />
              </Button>
              <span className="w-6 text-center font-bold text-sm">{pool}</span>
              <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => setPool(p => Math.min(20, p + 1))}>
                <Plus className="h-3 w-3" />
              </Button>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground w-8">Diff</span>
              <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => setDiff(d => Math.max(1, d - 1))}>
                <Minus className="h-3 w-3" />
              </Button>
              <span className="w-6 text-center font-bold text-sm">{diff}</span>
              <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => setDiff(d => Math.min(10, d + 1))}>
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </div>

          <Button onClick={handleRoll} size="sm" className="w-full bg-gradient-blood hover:opacity-90">
            <Dices className="h-4 w-4 mr-2" />
            Roll {pool}d10 ({hunger}h)
          </Button>

          {result && (
            <div className="space-y-2 pt-1 border-t border-border">
              <div className="flex items-center justify-between">
                <span className={cn("font-semibold text-sm", getOutcomeColor(result.outcome))}>
                  {getOutcomeLabel(result.outcome)}
                </span>
                <span className="text-sm font-bold">{result.totalSuccesses} vs {result.difficulty}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {result.dice.map((die, idx) => (
                  <Die key={idx} die={die} index={idx} animate={false} />
                ))}
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
