import { DiceRoller } from "@/components/dice/DiceRoller";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dices, Info } from "lucide-react";

export default function DiceRollerPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-[family-name:var(--font-gothic)] text-foreground flex items-center gap-3">
          <Dices className="h-8 w-8 text-primary" />
          Dice Roller
        </h1>
        <p className="text-muted-foreground mt-1">
          Vampire: The Masquerade 5th Edition dice system
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <DiceRoller />
        </div>

        {/* Quick Reference */}
        <div className="space-y-4">
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Info className="h-4 w-4 text-muted-foreground" />
                V5 Dice Rules
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div>
                <div className="font-semibold text-foreground">Successes</div>
                <p>Each die showing 6+ is one success.</p>
              </div>
              <div>
                <div className="font-semibold text-yellow-400">Critical</div>
                <p>Each pair of 10s generates 4 successes instead of 2.</p>
              </div>
              <div>
                <div className="font-semibold text-orange-400">Messy Critical</div>
                <p>A critical that includes a hunger die 10. You succeed spectacularly, but the Beast makes its presence felt.</p>
              </div>
              <div>
                <div className="font-semibold text-destructive">Bestial Failure</div>
                <p>You fail and a hunger die shows 1. The Beast takes over momentarily.</p>
              </div>
              <div>
                <div className="font-semibold text-destructive/80">Rouse Check</div>
                <p>Roll 1d10. On a 6+, no Hunger increase. On 1-5, Hunger rises by 1.</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Common Pools</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <div className="flex justify-between">
                <span>Physical</span>
                <span>Str/Dex/Sta + Skill</span>
              </div>
              <div className="flex justify-between">
                <span>Social</span>
                <span>Cha/Man/Com + Skill</span>
              </div>
              <div className="flex justify-between">
                <span>Mental</span>
                <span>Int/Wits/Res + Skill</span>
              </div>
              <div className="flex justify-between">
                <span>Discipline</span>
                <span>Varies by power</span>
              </div>
              <div className="flex justify-between">
                <span>Frenzy</span>
                <span>Willpower (⅓ pool)</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
