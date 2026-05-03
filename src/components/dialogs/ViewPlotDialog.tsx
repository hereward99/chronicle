import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plot } from "@/hooks/usePlots";
import { useCharacters } from "@/hooks/useCharacters";
import { usePlotCharacters } from "@/hooks/usePlotCharacters";
import { BookOpen, Clock, Users, Flag, FileText, Image as ImageIcon, Download, Calendar } from "lucide-react";
import { formatInGameDate } from "@/components/InGameDateInput";
import { Button } from "@/components/ui/button";
import { exportPlotToPDF } from "@/lib/pdfExport";
import { PdfExportButton } from "@/components/PdfExportButton";
import type { PdfTheme } from "@/lib/pdfExport";
import { MentionText } from "@/components/mentions/MentionText";

interface ViewPlotDialogProps {
  plot: Plot | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ViewPlotDialog({ plot, open, onOpenChange }: ViewPlotDialogProps) {
  const { characters } = useCharacters();
  const { getCharactersForPlot } = usePlotCharacters(plot?.id);

  if (!plot) return null;

  const assignedCharacterIds = getCharactersForPlot(plot.id);
  const assignedCharacters = characters.filter(c => assignedCharacterIds.includes(c.id));
  
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'default';
      case 'completed':
        return 'secondary';
      case 'planned':
        return 'outline';
      case 'critical':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'default';
      case 'medium':
        return 'secondary';
      case 'low':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getImageAttachments = (attachments: any[]) => {
    return attachments?.filter(att => att.type?.startsWith('image/')) || [];
  };

  const getDocumentAttachments = (attachments: any[]) => {
    return attachments?.filter(att => 
      att.type?.includes('pdf') || 
      att.type?.includes('document') || 
      att.type?.includes('text') ||
      att.name?.match(/\.(pdf|doc|docx|txt|rtf)$/i)
    ) || [];
  };

  const handleExportPDF = (theme: PdfTheme) => {
    exportPlotToPDF(plot, assignedCharacters.map(c => ({ name: c.name, clan: c.clan })), theme);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] bg-gradient-subtle border-border">
        <DialogHeader className="flex flex-row items-center justify-between pr-8">
          <DialogTitle className="text-2xl text-foreground">{plot.title}</DialogTitle>
          <PdfExportButton onExport={handleExportPDF} />
        </DialogHeader>
        
        <ScrollArea className="max-h-[calc(90vh-120px)] pr-4">
          <div className="space-y-6">
            {/* Status and Priority */}
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                <Badge variant={getStatusColor(plot.status)}>{plot.status}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <Flag className="h-4 w-4 text-muted-foreground" />
                <Badge variant={getPriorityColor(plot.priority)}>{plot.priority} Priority</Badge>
              </div>
            </div>

            {/* In-Game Date */}
            {formatInGameDate(plot.in_game_date_start, plot.in_game_date_end) && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Set in: {formatInGameDate(plot.in_game_date_start, plot.in_game_date_end)}
                </span>
              </div>
            )}

            {/* Summary */}
            {plot.summary && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-foreground">Summary</h3>
                <MentionText text={plot.summary} className="text-sm text-muted-foreground whitespace-pre-wrap" />
              </div>
            )}

            {/* Description */}
            {plot.description && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-foreground">Description</h3>
                <MentionText text={plot.description} className="text-sm text-muted-foreground whitespace-pre-wrap" />
              </div>
            )}

            {/* Assigned Characters */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                <Users className="h-4 w-4" />
                Assigned Characters
              </h3>
              {assignedCharacters.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {assignedCharacters.map((character) => (
                    <Badge key={character.id} variant="outline">
                      {character.name} ({character.clan})
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No characters assigned</p>
              )}
            </div>

            {/* Image Attachments */}
            {getImageAttachments(plot.attachments || []).length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  Images
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {getImageAttachments(plot.attachments || []).map((img, idx) => (
                    <div 
                      key={idx} 
                      className="relative aspect-video rounded-lg overflow-hidden border border-border cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => window.open(img.url, '_blank')}
                    >
                      <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Document Attachments */}
            {getDocumentAttachments(plot.attachments || []).length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Documents
                </h3>
                <div className="space-y-2">
                  {getDocumentAttachments(plot.attachments || []).map((doc, idx) => (
                    <Button
                      key={idx}
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => window.open(doc.url, '_blank')}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      <span className="truncate">{doc.name}</span>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Metadata */}
            <div className="pt-4 border-t border-border text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>Created: {new Date(plot.created_at).toLocaleDateString()}</span>
                <span>Updated: {new Date(plot.updated_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
