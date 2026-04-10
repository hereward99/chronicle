import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Die } from "@/components/dice/Die";
import {
  rollV5Dice,
  rollRouseCheck,
  rerollWillpower,
  RollResult,
  getOutcomeLabel,
  getOutcomeColor,
} from "@/lib/diceEngine";
import { Dices, RotateCcw, Droplet, Skull, Sparkles, Crown, X, Minus, Plus, BrainCircuit } from "lucide-react";
import { cn } from "@/lib/utils";

interface DiceRollerProps {
  initialPool?: number;
  initialHunger?: number;
  initialDifficulty?: number;
  label?: string;
  compact?: boolean;
}

export function DiceRoller({
  initialPool = 4,
  initialHunger = 1,
  initialDifficulty = 2,
  label,
  compact = false,
}: DiceRollerProps) {
  const [pool, setPool] = useState(initialPool);
  const [hunger, setHunger] = useState(initialHunger);
  const [difficulty, setDifficulty] = useState(initialDifficulty);
  const [result, setResult] = useState<RollResult | null>(null);
  const [rouseResult, setRouseResult] = useState<{ success: boolean; value: number } | null>(null);
  const [rolling, setRolling] = useState(false);
  const [history, setHistory] = useState<RollResult[]>([]);
  const [willpowerMode, setWillpowerMode] = useState(false);
  const [selectedDice, setSelectedDice] = useState<Set<number>>(new Set());

  const handleRoll = useCallback(() => {
    setRolling(true);
    setRouseResult(null);
    setWillpowerMode(false);
    setSelectedDice(new Set());
    setTimeout(() => {
      const newResult = rollV5Dice(pool, hunger, difficulty);
      setResult(newResult);
      setHistory(prev => [newResult, ...prev].slice(0, 20));
      setRolling(false);
    }, 150);
  }, [pool, hunger, difficulty]);

  const handleRouse = useCallback(() => {
    setRouseResult(rollRouseCheck());
  }, []);

  const handleReroll = useCallback(() => {
    if (result) {
      handleRoll();
    }
  }, [result, handleRoll]);

  const handleToggleDie = useCallback((index: number) => {
    setSelectedDice(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else if (next.size < 3) {
        next.add(index);
      }
      return next;
    });
  }, []);

  const handleWillpowerReroll = useCallback(() => {
    if (result && selectedDice.size > 0) {
      const newResult = rerollWillpower(result, Array.from(selectedDice));
      setResult(newResult);
      setHistory(prev => [newResult, ...prev].slice(0, 20));
      setWillpowerMode(false);
      setSelectedDice(new Set());
    }
  }, [result, selectedDice]);

  const adjustValue = (setter: React.Dispatch<React.SetStateAction<number>>, delta: number, min: number, max: number) => {
    setter(prev => Math.max(min, Math.min(max, prev + delta)));
  };

  const getOutcomeIcon = (outcome: string) => {
    switch (outcome) {
      case "bestial-failure": return <Skull className="h-5 w-5" />;
      case "total-failure": return <X className="h-5 w-5" />;
      case "failure": return <Minus className="h-5 w-5" />;
      case "success": return <Sparkles className="h-5 w-5" />;
      case "messy-critical": return <Droplet className="h-5 w-5" />;
      case "critical": return <Crown className="h-5 w-5" />;
      default: return null;
    }
  };

  const getOutcomeBg = (outcome: string) => {
    switch (outcome) {
      case "bestial-failure": return "bg-destructive/10 border-destructive/30";
      case "total-failure": return "bg-destructive/5 border-destructive/20";
      case "failure": return "bg-muted/30 border-border";
      case "success": return "bg-green-500/10 border-green-500/30";
      case "messy-critical": return "bg-orange-500/10 border-orange-500/30";
      case "critical": return "bg-yellow-500/10 border-yellow-500/30";
      default: return "";
    }
  };

  const getOutcomeDescription = (outcome: string) => {
    switch (outcome) {
      case "bestial-failure": return "The Beast rears its ugly head. You fail, and something terrible happens.";
      case "total-failure": return "Complete failure. No successes at all.";
      case "failure": return "You didn't meet the difficulty threshold.";
      case "success": return "You succeeded at your task.";
      case "messy-critical": return "A stunning success — but the Beast leaves its mark. There are consequences.";
      case "critical": return "An extraordinary success! Your critical pairs grant bonus successes.";
      default: return "";
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card className="bg-card border-border shadow-gothic">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Dices className="h-5 w-5 text-primary" />
            {label || "V5 Dice Roller"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Pool, Hunger, Difficulty controls */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            {/* Dice Pool */}
            <div className="space-y-1.5">
              <Label className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider text-center block">Dice Pool</Label>
              <div className="flex items-center justify-center gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 shrink-0"
                  onClick={() => adjustValue(setPool, -1, 1, 30)}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="text-2xl font-bold w-10 text-center tabular-nums">{pool}</span>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 shrink-0"
                  onClick={() => adjustValue(setPool, 1, 1, 30)}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {/* Hunger */}
            <div className="space-y-1.5">
              <Label className="text-[10px] sm:text-xs uppercase tracking-wider flex items-center justify-center gap-1">
                <Droplet className="h-3 w-3 text-destructive" />
                <span className="text-destructive/80">Hunger</span>
              </Label>
              <div className="flex items-center justify-center gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 shrink-0"
                  onClick={() => adjustValue(setHunger, -1, 0, 5)}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="text-2xl font-bold w-10 text-center tabular-nums text-destructive">{hunger}</span>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 shrink-0"
                  onClick={() => adjustValue(setHunger, 1, 0, 5)}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {/* Difficulty */}
            <div className="space-y-1.5">
              <Label className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider text-center block">Difficulty</Label>
              <div className="flex items-center justify-center gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 shrink-0"
                  onClick={() => adjustValue(setDifficulty, -1, 1, 15)}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="text-2xl font-bold w-10 text-center tabular-nums">{difficulty}</span>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 shrink-0"
                  onClick={() => adjustValue(setDifficulty, 1, 1, 15)}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>

          {/* Roll Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={handleRoll}
              disabled={rolling}
              className="flex-1 bg-gradient-blood hover:opacity-90 text-lg h-12 font-semibold"
            >
              <Dices className="h-5 w-5 mr-2" />
              {rolling ? "Rolling…" : "Roll Dice"}
            </Button>
            <Button
              onClick={handleRouse}
              variant="outline"
              className="h-12 border-destructive/50 text-destructive hover:bg-destructive/10"
              title="Rouse Check"
            >
              <Droplet className="h-5 w-5" />
            </Button>
            {result && (
              <Button
                onClick={handleReroll}
                variant="outline"
                className="h-12"
                title="Reroll with same settings"
              >
                <RotateCcw className="h-5 w-5" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Rouse Check Result */}
      {rouseResult && (
        <Card className={cn(
          "border-2 transition-all",
          rouseResult.success
            ? "bg-green-500/5 border-green-500/30"
            : "bg-destructive/5 border-destructive/30"
        )}>
          <CardContent className="py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Droplet className={cn("h-5 w-5", rouseResult.success ? "text-green-400" : "text-destructive")} />
              <div>
                <div className="font-semibold">Rouse Check</div>
                <div className="text-sm text-muted-foreground">
                  {rouseResult.success
                    ? "Success — No Hunger increase"
                    : "Failure — Hunger rises by 1"}
                </div>
              </div>
            </div>
            <div className={cn(
              "w-11 h-11 rounded-lg flex items-center justify-center text-lg font-bold border-2",
              rouseResult.success
                ? "border-green-500 text-green-400 bg-green-500/10"
                : "border-destructive text-destructive bg-destructive/10"
            )}>
              {rouseResult.value}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Roll Result */}
      {result && (
        <Card className={cn("border-2 transition-all", getOutcomeBg(result.outcome))}>
          <CardContent className="py-5 space-y-4">
            {/* Outcome Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-lg", getOutcomeBg(result.outcome))}>
                  <span className={getOutcomeColor(result.outcome)}>
                    {getOutcomeIcon(result.outcome)}
                  </span>
                </div>
                <div>
                  <div className={cn("text-xl font-bold font-[family-name:var(--font-gothic)]", getOutcomeColor(result.outcome))}>
                    {getOutcomeLabel(result.outcome)}
                    {result.willpowerReroll && (
                      <Badge variant="outline" className="ml-2 text-xs font-normal align-middle">
                        <BrainCircuit className="h-3 w-3 mr-1" />
                        Willpower Reroll
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {getOutcomeDescription(result.outcome)}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">{result.totalSuccesses}</div>
                <div className="text-xs text-muted-foreground">
                  vs difficulty {result.difficulty}
                </div>
              </div>
            </div>

            <Separator />

            {/* Willpower Mode Banner */}
            {willpowerMode && (
              <div className="flex items-center gap-2 p-3 rounded-md bg-primary/10 border border-primary/20">
                <BrainCircuit className="h-4 w-4 text-primary shrink-0" />
                <p className="text-sm text-primary flex-1">
                  Select up to 3 non-hunger dice to reroll ({selectedDice.size}/3 selected)
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => { setWillpowerMode(false); setSelectedDice(new Set()); }}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    disabled={selectedDice.size === 0}
                    onClick={handleWillpowerReroll}
                  >
                    Reroll ({selectedDice.size})
                  </Button>
                </div>
              </div>
            )}

            {/* Dice Display */}
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                {result.poolSize - result.hungerDice > 0 && (
                  <span>{result.poolSize - result.hungerDice} regular</span>
                )}
                {result.hungerDice > 0 && (
                  <span className="text-destructive/80">
                    {result.poolSize - result.hungerDice > 0 && " + "}
                    {result.hungerDice} hunger
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {result.dice.map((die, idx) => (
                  <Die
                    key={idx}
                    die={die}
                    index={idx}
                    selectable={willpowerMode}
                    selected={selectedDice.has(idx)}
                    locked={die.isHunger}
                    onToggle={handleToggleDie}
                  />
                ))}
              </div>
            </div>

            {/* Stats breakdown */}
            <div className="flex flex-wrap gap-2 text-sm">
              <Badge variant="secondary">{result.totalSuccesses} successes</Badge>
              {result.criticalPairs > 0 && (
                <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                  {result.criticalPairs} critical pair{result.criticalPairs > 1 ? "s" : ""} (+{result.criticalPairs * 2} bonus)
                </Badge>
              )}
              {result.margin > 0 && (
                <Badge variant="outline" className="text-green-400 border-green-500/30">
                  +{result.margin} margin
                </Badge>
              )}
              {!willpowerMode && !result.willpowerReroll && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs gap-1"
                  onClick={() => setWillpowerMode(true)}
                  title="Spend a Willpower point to reroll up to 3 non-hunger dice"
                >
                  <BrainCircuit className="h-3 w-3" />
                  Spend Willpower
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Roll History */}
      {history.length > 1 && (
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Roll History</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {history.slice(1, 8).map((roll, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm py-1.5 border-b border-border/50 last:border-0">
                <div className="flex items-center gap-2">
                  <span className={cn("text-xs", getOutcomeColor(roll.outcome))}>
                    {getOutcomeIcon(roll.outcome)}
                  </span>
                  <span className={cn("font-medium", getOutcomeColor(roll.outcome))}>
                    {getOutcomeLabel(roll.outcome)}
                  </span>
                </div>
                <div className="text-muted-foreground text-xs">
                  {roll.totalSuccesses} vs {roll.difficulty} · {roll.poolSize}d ({roll.hungerDice}h)
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
