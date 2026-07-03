import { useState } from "react";
import { useParams } from "react-router-dom";
import { BookOpen, Flag, Users, FileText, Image as ImageIcon, Edit } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { usePlots } from "@/hooks/usePlots";
import { useCharacters } from "@/hooks/useCharacters";
import { usePlotCharacters } from "@/hooks/usePlotCharacters";
import { EditPlotDialog } from "@/components/dialogs/EditPlotDialog";
import { PdfExportButton } from "@/components/PdfExportButton";
import { exportPlotToPDF, type PdfTheme } from "@/lib/pdfExport";
import { MentionText } from "@/components/mentions/MentionText";
import { ChronicleDate } from "@/components/ChronicleDate";
import { DetailPageHeader, DetailNotFound } from "@/components/DetailPageHeader";

export default function PlotDetail() {
  const { id } = useParams<{ id: string }>();
  const { plots, loading } = usePlots();
  const { characters } = useCharacters();
  const [editOpen, setEditOpen] = useState(false);
  const plot = plots.find(p => p.id === id);
  const { getCharactersForPlot } = usePlotCharacters(plot?.id);

  if (loading) return <Skeleton className="h-96 w-full" />;
  if (!plot) return <DetailNotFound label="Story" backTo="/stories" />;

  const assignedIds = getCharactersForPlot(plot.id);
  const assigned = characters.filter(c => assignedIds.includes(c.id));

  const statusColor = (s: string) =>
    ({ active: "default", completed: "secondary", planned: "outline", critical: "destructive" } as const)[s.toLowerCase()] ||
    "outline";
  const priorityColor = (p: string) =>
    ({ critical: "destructive", high: "default", medium: "secondary", low: "outline" } as const)[p.toLowerCase()] ||
    "outline";

  const images = (plot.attachments || []).filter((a: any) => a.type?.startsWith("image/"));
  const docs = (plot.attachments || []).filter(
    (a: any) =>
      a.type?.includes("pdf") ||
      a.type?.includes("document") ||
      a.type?.includes("text") ||
      a.name?.match(/\.(pdf|doc|docx|txt|rtf)$/i),
  );

  const handleExport = (theme: PdfTheme) =>
    exportPlotToPDF(plot, assigned.map(c => ({ name: c.name, clan: c.clan })), theme);

  return (
    <div>
      <DetailPageHeader
        title={plot.title}
        backTo="/stories"
        actions={
          <>
            <PdfExportButton onExport={handleExport} />
            <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
              <Edit className="h-4 w-4 mr-1" /> Edit
            </Button>
          </>
        }
      />

      <div className="space-y-6 max-w-4xl">
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-muted-foreground" />
            <Badge variant={statusColor(plot.status)}>{plot.status}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Flag className="h-4 w-4 text-muted-foreground" />
            <Badge variant={priorityColor(plot.priority)}>{plot.priority} Priority</Badge>
          </div>
        </div>

        <ChronicleDate
          inGameStart={plot.in_game_date_start}
          inGameEnd={plot.in_game_date_end}
          prefix="Set in"
          withIcon
          as="div"
          className="text-sm text-muted-foreground"
        />

        {plot.summary && (
          <section className="space-y-2">
            <h3 className="text-sm font-medium">Summary</h3>
            <MentionText text={plot.summary} className="text-sm text-muted-foreground whitespace-pre-wrap" />
          </section>
        )}

        {plot.description && (
          <section className="space-y-2">
            <h3 className="text-sm font-medium">Description</h3>
            <MentionText text={plot.description} className="text-sm text-muted-foreground whitespace-pre-wrap" />
          </section>
        )}

        <section className="space-y-2">
          <h3 className="text-sm font-medium flex items-center gap-2">
            <Users className="h-4 w-4" /> Assigned Characters
          </h3>
          {assigned.length ? (
            <div className="flex flex-wrap gap-2">
              {assigned.map(c => (
                <Badge key={c.id} variant="outline">{c.name} ({c.clan})</Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No characters assigned</p>
          )}
        </section>

        {images.length > 0 && (
          <section className="space-y-2">
            <h3 className="text-sm font-medium flex items-center gap-2"><ImageIcon className="h-4 w-4" /> Images</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {images.map((img: any, i: number) => (
                <div key={i} className="relative aspect-video rounded-lg overflow-hidden border border-border cursor-pointer hover:opacity-80" onClick={() => window.open(img.url, "_blank")}>
                  <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </section>
        )}

        {docs.length > 0 && (
          <section className="space-y-2">
            <h3 className="text-sm font-medium flex items-center gap-2"><FileText className="h-4 w-4" /> Documents</h3>
            <div className="space-y-2">
              {docs.map((doc: any, i: number) => (
                <Button key={i} variant="outline" className="w-full justify-start" onClick={() => window.open(doc.url, "_blank")}>
                  <FileText className="h-4 w-4 mr-2" />
                  <span className="truncate">{doc.name}</span>
                </Button>
              ))}
            </div>
          </section>
        )}

        <div className="pt-4 border-t border-border text-xs text-muted-foreground flex justify-between">
          <ChronicleDate value={plot.created_at} prefix="Created" />
          <ChronicleDate value={plot.updated_at} prefix="Updated" />
        </div>
      </div>

      {editOpen && <EditPlotDialog plot={plot} open={editOpen} onOpenChange={setEditOpen} />}
    </div>
  );
}
