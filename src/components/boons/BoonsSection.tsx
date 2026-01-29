import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, HandCoins, Scale, BookOpen, Calendar } from "lucide-react";
import { Boon, useBoons } from "@/hooks/useBoons";
import { Character } from "@/hooks/useCharacters";
import { BoonBadge, StatusBadge } from "./BoonBadge";
import { CreateBoonDialog } from "./CreateBoonDialog";
import { EditBoonDialog } from "./EditBoonDialog";
import { usePlots } from "@/hooks/usePlots";
import { useSessions } from "@/hooks/useSessions";

interface BoonsSectionProps {
  character: Character;
  characters: Character[];
  editable?: boolean;
}

export function BoonsSection({ character, characters, editable = false }: BoonsSectionProps) {
  const { boons, getBoonsHeld, getDebtsOwed } = useBoons(character.chronicle_id);
  const { plots } = usePlots();
  const { sessions } = useSessions();
  
  const [createMode, setCreateMode] = useState<"held" | "owed" | null>(null);
  const [editingBoon, setEditingBoon] = useState<Boon | null>(null);

  const boonsHeld = getBoonsHeld(character.id);
  const debtsOwed = getDebtsOwed(character.id);

  const getCharacterName = (id: string) => {
    return characters.find(c => c.id === id)?.name || "Unknown Character";
  };

  const getPlotTitle = (id: string | null) => {
    if (!id) return null;
    return plots.find(p => p.id === id)?.title;
  };

  const getSessionTitle = (id: string | null) => {
    if (!id) return null;
    return sessions.find(s => s.id === id)?.title;
  };

  const renderBoonCard = (boon: Boon, isHeld: boolean) => {
    const otherCharacter = isHeld ? boon.debtor_id : boon.creditor_id;
    const plotTitle = getPlotTitle(boon.plot_id);
    const sessionTitle = getSessionTitle(boon.session_id);

    return (
      <div
        key={boon.id}
        className={`p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors ${editable ? 'cursor-pointer' : ''}`}
        onClick={() => editable && setEditingBoon(boon)}
      >
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <BoonBadge severity={boon.severity} size="sm" />
            <StatusBadge status={boon.status} size="sm" />
          </div>
        </div>
        
        <p className="text-sm font-medium mb-1">{boon.description}</p>
        
        <p className="text-xs text-muted-foreground mb-2">
          {isHeld ? "Owed by: " : "Owed to: "}
          <span className="text-foreground">{getCharacterName(otherCharacter)}</span>
        </p>

        {boon.notes && (
          <p className="text-xs text-muted-foreground italic mb-2">"{boon.notes}"</p>
        )}

        {(plotTitle || sessionTitle) && (
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            {plotTitle && (
              <span className="flex items-center gap-1">
                <BookOpen className="h-3 w-3" />
                {plotTitle}
              </span>
            )}
            {sessionTitle && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {sessionTitle}
              </span>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <Card className="bg-gradient-subtle border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Scale className="h-5 w-5 text-primary" />
            Boons & Debts
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Boons Held (others owe this character) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <HandCoins className="h-4 w-4 text-green-400" />
                Boons Held
                {boonsHeld.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {boonsHeld.filter(b => b.status === "outstanding").length} outstanding
                  </Badge>
                )}
              </h4>
              {editable && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setCreateMode("held")}
                  className="h-7 text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add
                </Button>
              )}
            </div>
            
            {boonsHeld.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">No boons held</p>
            ) : (
              <div className="space-y-2">
                {boonsHeld.map(boon => renderBoonCard(boon, true))}
              </div>
            )}
          </div>

          {/* Debts Owed (this character owes others) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Scale className="h-4 w-4 text-red-400" />
                Debts Owed
                {debtsOwed.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {debtsOwed.filter(b => b.status === "outstanding").length} outstanding
                  </Badge>
                )}
              </h4>
              {editable && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setCreateMode("owed")}
                  className="h-7 text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add
                </Button>
              )}
            </div>
            
            {debtsOwed.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">No debts owed</p>
            ) : (
              <div className="space-y-2">
                {debtsOwed.map(boon => renderBoonCard(boon, false))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Create Dialog */}
      {createMode && (
        <CreateBoonDialog
          open={!!createMode}
          onOpenChange={(open) => !open && setCreateMode(null)}
          characters={characters}
          chronicleId={character.chronicle_id}
          mode={createMode}
          characterId={character.id}
        />
      )}

      {/* Edit Dialog */}
      <EditBoonDialog
        open={!!editingBoon}
        onOpenChange={(open) => !open && setEditingBoon(null)}
        boon={editingBoon}
        characters={characters}
        chronicleId={character.chronicle_id}
      />
    </>
  );
}
