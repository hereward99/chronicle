import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Calendar, Loader2, FileText, Download, BookOpen, ChevronDown, ChevronRight, Pencil } from "lucide-react";
import { CreateSessionDialog } from "@/components/dialogs/CreateSessionDialog";
import { EditSessionDialog } from "@/components/dialogs/EditSessionDialog";
import { useSessions, Session } from "@/hooks/useSessions";
import { usePlots } from "@/hooks/usePlots";
import { exportSessionToPDF } from "@/lib/pdfExport";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { MentionText } from "@/components/mentions/MentionText";

const Sessions = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(["ungrouped"]));
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const { sessions, loading } = useSessions();
  const { plots } = usePlots();

  const filteredSessions = sessions.filter(session =>
    session.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (session.summary && session.summary.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Group sessions by story
  const groupedSessions = filteredSessions.reduce((acc, session) => {
    const groupKey = session.plot_id || "ungrouped";
    if (!acc[groupKey]) {
      acc[groupKey] = [];
    }
    acc[groupKey].push(session);
    return acc;
  }, {} as Record<string, Session[]>);

  // Get story name by id
  const getStoryName = (plotId: string | null) => {
    if (!plotId) return "Ungrouped Sessions";
    const plot = plots.find(p => p.id === plotId);
    return plot?.title || "Unknown Story";
  };

  // Sort group keys: stories first (alphabetically), then ungrouped
  const sortedGroupKeys = Object.keys(groupedSessions).sort((a, b) => {
    if (a === "ungrouped") return 1;
    if (b === "ungrouped") return -1;
    return getStoryName(a).localeCompare(getStoryName(b));
  });

  const toggleGroup = (groupKey: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupKey)) {
        next.delete(groupKey);
      } else {
        next.add(groupKey);
      }
      return next;
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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

  const renderSessionCard = (session: Session) => (
    <Card key={session.id} className="bg-card border-border shadow-gothic hover:shadow-crimson transition-shadow">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
          <div className="space-y-1">
            <CardTitle className="text-xl text-foreground">
              {session.title}
            </CardTitle>
            <CardDescription className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {formatDate(session.date_played)}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {session.experience_awarded && (
              <Badge variant="secondary" className="w-fit">
                {session.experience_awarded} XP awarded
              </Badge>
            )}
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setEditingSession(session)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => exportSessionToPDF(session)}
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {session.summary && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-foreground">Session Summary:</h4>
            <MentionText 
              text={session.summary} 
              className="text-sm text-muted-foreground block whitespace-pre-wrap"
            />
          </div>
        )}

        {/* Image Thumbnails */}
        {getImageAttachments(session.attachments || []).length > 0 && (
          <div className="flex gap-2">
            {getImageAttachments(session.attachments || []).slice(0, 3).map((img, idx) => (
              <div key={idx} className="relative w-16 h-16 rounded overflow-hidden border border-border">
                <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
              </div>
            ))}
            {getImageAttachments(session.attachments || []).length > 3 && (
              <div className="w-16 h-16 rounded border border-border flex items-center justify-center bg-secondary">
                <span className="text-xs text-muted-foreground">
                  +{getImageAttachments(session.attachments || []).length - 3}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Document Buttons */}
        {getDocumentAttachments(session.attachments || []).length > 0 && (
          <div className="space-y-1">
            {getDocumentAttachments(session.attachments || []).map((doc, idx) => (
              <Button
                key={idx}
                size="sm"
                variant="outline"
                className="w-full justify-start"
                onClick={() => window.open(doc.url, '_blank')}
              >
                <FileText className="h-3 w-3 mr-2" />
                <span className="truncate text-xs">{doc.name}</span>
              </Button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Sessions</h1>
          <p className="text-muted-foreground">
            Track your gaming sessions and chronicle progress
          </p>
        </div>
        <CreateSessionDialog>
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-crimson">
            <Plus className="h-4 w-4 mr-2" />
            Log New Session
          </Button>
        </CreateSessionDialog>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search sessions..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Sessions List - Grouped by Story */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredSessions.length > 0 ? (
          sortedGroupKeys.map((groupKey) => {
            const groupSessions = groupedSessions[groupKey];
            const isExpanded = expandedGroups.has(groupKey);
            const storyName = getStoryName(groupKey === "ungrouped" ? null : groupKey);
            const totalXP = groupSessions.reduce((sum, s) => sum + (s.experience_awarded || 0), 0);

            return (
              <Collapsible
                key={groupKey}
                open={isExpanded}
                onOpenChange={() => toggleGroup(groupKey)}
              >
                <CollapsibleTrigger asChild>
                  <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg cursor-pointer hover:bg-secondary/70 transition-colors">
                    {isExpanded ? (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    )}
                    <BookOpen className="h-5 w-5 text-primary" />
                    <span className="font-semibold text-foreground flex-1">{storyName}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {groupSessions.length} session{groupSessions.length !== 1 ? 's' : ''}
                      </Badge>
                      {totalXP > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {totalXP} XP
                        </Badge>
                      )}
                    </div>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4 pt-4 pl-4">
                  {groupSessions.map(renderSessionCard)}
                </CollapsibleContent>
              </Collapsible>
            );
          })
        ) : (
          <Card className="bg-card border-border">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                {searchTerm ? 'No sessions found' : 'No sessions logged yet'}
              </h3>
              <p className="text-muted-foreground text-center mb-4">
                {searchTerm 
                  ? 'Try adjusting your search terms'
                  : 'Start tracking your chronicle by logging your first gaming session'
                }
              </p>
              {!searchTerm && (
                <CreateSessionDialog>
                  <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    <Plus className="h-4 w-4 mr-2" />
                    Log Your First Session
                  </Button>
                </CreateSessionDialog>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit Session Dialog */}
      {editingSession && (
        <EditSessionDialog
          session={editingSession}
          open={!!editingSession}
          onOpenChange={(open) => !open && setEditingSession(null)}
        />
      )}
    </div>
  );
};

export default Sessions;