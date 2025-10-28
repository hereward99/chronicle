import { Character } from "@/hooks/useCharacters";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CharacterSheetView } from "@/components/character/CharacterSheetView";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ViewCharacterDialogProps {
  character: Character | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ViewCharacterDialog({ character, open, onOpenChange }: ViewCharacterDialogProps) {
  if (!character) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Character Sheet</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[calc(90vh-100px)] pr-4">
          <CharacterSheetView character={character} />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}