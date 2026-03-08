import { useState } from "react";
import { EmptyState } from "@/components/onboarding/EmptyState";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Calendar, Loader2, FileText, Download, BookOpen, ChevronDown, ChevronRight, Pencil, ClipboardList, Trash2 } from "lucide-react";
import { CreateSessionDialog } from "@/components/dialogs/CreateSessionDialog";
import { EditSessionDialog } from "@/components/dialogs/EditSessionDialog";
import { useSessions, Session } from "@/hooks/useSessions";
import { usePlots } from "@/hooks/usePlots";
import { useChecklists } from "@/hooks/useChecklists";
import { exportSessionToPDF } from "@/lib/pdfExport";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { MentionText } from "@/components/mentions/MentionText";
import { CreateChecklistDialog } from "@/components/checklists/CreateChecklistDialog";
import { ChecklistCard } from "@/components/checklists/ChecklistCard";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { SessionGroupSkeleton } from "@/components/skeletons/CardSkeleton";

const Sessions = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(["ungrouped", "checklists-ungrouped"]));
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Session | null>(null);
  const { sessions, loading, deleteSession } = useSessions();
  const { plots } = usePlots();
  const { checklists, loading: checklistsLoading, toggleItem, addItem, updateItem, deleteItem, deleteChecklist } = useChecklists();

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

  // Also include stories that have checklists but no sessions
  checklists.forEach(checklist => {
    const groupKey = checklist.plot_id || "ungrouped";
    if (!groupedSessions[groupKey]) {
      groupedSessions[groupKey] = [];
    }
  });

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
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => setDeleteTarget(session)}
            >
              <Trash2 className="h-4 w-4" />
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
        <div className="flex gap-2">
          <CreateChecklistDialog>
            <Button variant="outline">
              <ClipboardList className="h-4 w-4 mr-2" />
              New Checklist
            </Button>
          </CreateChecklistDialog>
          <CreateSessionDialog>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-crimson">
              <Plus className="h-4 w-4 mr-2" />
              Log New Session
            </Button>
          </CreateSessionDialog>
        </div>
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

      {/* Sessions & Checklists List - Grouped by Story */}
      <div className="space-y-4">
        {(loading || checklistsLoading) ? (
          <SessionGroupSkeleton />
        ) : (filteredSessions.length > 0 || checklists.length > 0) ? (
          <>
            {sortedGroupKeys.map((groupKey) => {
              const groupSessions = groupedSessions[groupKey];
              const plotId = groupKey === "ungrouped" ? null : groupKey;
              const groupChecklists = checklists.filter(c => c.plot_id === plotId);
              const isExpanded = expandedGroups.has(groupKey);
              const storyName = getStoryName(plotId);
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
                        {groupChecklists.length > 0 && (
                          <Badge variant="outline" className="text-xs">
                            <ClipboardList className="h-3 w-3 mr-1" />
                            {groupChecklists.length}
                          </Badge>
                        )}
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
                    {/* Checklists for this story */}
                    {groupChecklists.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <ClipboardList className="h-4 w-4" />
                            Prep Checklists
                          </h4>
                          <CreateChecklistDialog defaultPlotId={plotId}>
                            <Button variant="ghost" size="sm" className="h-7 text-xs">
                              <Plus className="h-3 w-3 mr-1" />
                              Add
                            </Button>
                          </CreateChecklistDialog>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          {groupChecklists.map(checklist => (
                            <ChecklistCard key={checklist.id} checklist={checklist} toggleItem={toggleItem} addItem={addItem} updateItem={updateItem} deleteItem={deleteItem} deleteChecklist={deleteChecklist} />
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Sessions for this story */}
                    {groupSessions.length > 0 && (
                      <div className="space-y-3">
                        {groupChecklists.length > 0 && (
                          <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Sessions
                          </h4>
                        )}
                        {groupSessions.map(renderSessionCard)}
                      </div>
                    )}
                    
                    {/* Quick add checklist if none exist */}
                    {groupChecklists.length === 0 && (
                      <CreateChecklistDialog defaultPlotId={plotId}>
                        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                          <ClipboardList className="h-4 w-4 mr-2" />
                          Add Prep Checklist
                        </Button>
                      </CreateChecklistDialog>
                    )}
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
            
            {/* Show any checklists not linked to a story that aren't in ungrouped sessions */}
            {(() => {
              const unlinkedChecklists = checklists.filter(c => 
                c.plot_id === null && !sortedGroupKeys.includes("ungrouped")
              );
              if (unlinkedChecklists.length === 0) return null;
              
              const isExpanded = expandedGroups.has("checklists-ungrouped");
              return (
                <Collapsible
                  open={isExpanded}
                  onOpenChange={() => toggleGroup("checklists-ungrouped")}
                >
                  <CollapsibleTrigger asChild>
                    <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg cursor-pointer hover:bg-secondary/70 transition-colors">
                      {isExpanded ? (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      )}
                      <ClipboardList className="h-5 w-5 text-primary" />
                      <span className="font-semibold text-foreground flex-1">Ungrouped Checklists</span>
                      <Badge variant="outline" className="text-xs">
                        {unlinkedChecklists.length} checklist{unlinkedChecklists.length !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-4 pt-4 pl-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      {unlinkedChecklists.map(checklist => (
                        <ChecklistCard key={checklist.id} checklist={checklist} toggleItem={toggleItem} addItem={addItem} updateItem={updateItem} deleteItem={deleteItem} deleteChecklist={deleteChecklist} />
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              );
            })()}
          </>
        ) : (
          <Card className="bg-card border-border">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                {searchTerm ? 'No sessions found' : 'No sessions logged yet'}
              </h3>
              <p className="text-muted-foreground text-center mb-2">
                {searchTerm 
                  ? 'Try adjusting your search terms'
                  : 'Start tracking your chronicle by logging your first gaming session or prep checklist'
                }
              </p>
              {!searchTerm && (
                <p className="text-xs text-muted-foreground text-center mb-4">
                  💡 Tip: Use <kbd className="px-1 py-0.5 rounded bg-muted text-foreground font-mono text-[10px]">@</kbd> in session summaries to cross-reference characters and stories.
                </p>
              )}
              {!searchTerm && (
                <div className="flex gap-2">
                  <CreateChecklistDialog>
                    <Button variant="outline">
                      <ClipboardList className="h-4 w-4 mr-2" />
                      Create Checklist
                    </Button>
                  </CreateChecklistDialog>
                  <CreateSessionDialog>
                    <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                      <Plus className="h-4 w-4 mr-2" />
                      Log Your First Session
                    </Button>
                  </CreateSessionDialog>
                </div>
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

      {/* Delete Session Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Session</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteTarget?.title}"? This will also remove all character tags for this session. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (deleteTarget) {
                  await deleteSession(deleteTarget.id);
                  setDeleteTarget(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Session
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Sessions;