import { useState } from "react";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EntityCard, EntityCardContent, EntityCardHeaderBar, CardIconAction } from "@/components/ui/entity-card";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Users, BookOpen, Calendar, Scroll, Pencil, Trash2 } from "lucide-react";
import { undoableAction } from "@/lib/undoableAction";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useChronicleStats } from "@/hooks/useChronicleStats";
import { usePlots } from "@/hooks/usePlots";
import { useNotes, Note } from "@/hooks/useNotes";
import { useRecentActivity } from "@/hooks/useRecentActivity";
import { useChronicles } from "@/hooks/useChronicles";
import { formatDistanceToNow } from "date-fns";
import { CreateCharacterDialog } from "@/components/dialogs/CreateCharacterDialog";
import { CreatePlotDialog } from "@/components/dialogs/CreatePlotDialog";
import { CreateSessionDialog } from "@/components/dialogs/CreateSessionDialog";
import { CreateNoteDialog } from "@/components/dialogs/CreateNoteDialog";
import { EditNoteDialog } from "@/components/dialogs/EditNoteDialog";
import { MentionText } from "@/components/mentions/MentionText";
import { ChronicleManager } from "@/components/chronicle/ChronicleManager";
import { EmptyState } from "@/components/onboarding/EmptyState";

export default function Chronicle() {
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [headerEditOpen, setHeaderEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editSetting, setEditSetting] = useState("");
  
  const { currentChronicle, updateChronicle } = useChronicles();
  const { stats, loading: statsLoading } = useChronicleStats();
  const { plots, loading: plotsLoading } = usePlots();
  const { notes, loading: notesLoading, deleteNote } = useNotes();
  const { activities, loading: activitiesLoading } = useRecentActivity();

  const openHeaderEdit = () => {
    if (!currentChronicle) return;
    setEditName(currentChronicle.name);
    setEditDescription(currentChronicle.description || "");
    setEditSetting(currentChronicle.setting || "");
    setHeaderEditOpen(true);
  };

  const handleHeaderSave = async () => {
    if (!currentChronicle) return;
    await updateChronicle(currentChronicle.id, { name: editName, description: editDescription, setting: editSetting });
    setHeaderEditOpen(false);
  };

  const handleEditNote = (note: Note) => {
    setEditingNote(note);
    setEditDialogOpen(true);
  };

  const handleDeleteNote = (note: Note) => {
    undoableAction({
      description: `Deleted "${note.title}"`,
      perform: () => deleteNote(note.id),
    });
  };

  return (
    <div className="space-y-8">{/* Header */}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div 
          className="group cursor-pointer flex items-start gap-3"
          onClick={openHeaderEdit}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && openHeaderEdit()}
        >
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2 group-hover:text-primary/80 transition-colors">
              {currentChronicle?.name || "Chronicle Dashboard"}
            </h1>
            <p className="text-lg text-muted-foreground group-hover:text-foreground/70 transition-colors">
              {currentChronicle?.description || "Your Vampire: The Masquerade tabletop roleplaying game chronicle"}
            </p>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Pencil className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 md:mt-3 mt-0 md:opacity-0 opacity-60 transition-opacity shrink-0" />
            </TooltipTrigger>
            <TooltipContent>Edit chronicle details</TooltipContent>
          </Tooltip>
        </div>
        <CreateNoteDialog>
          <Button className="bg-gradient-blood hover:opacity-90 shadow-crimson">
            <Plus className="w-4 h-4 mr-2" />
            New Note
          </Button>
        </CreateNoteDialog>
      </div>

      {/* Edit Chronicle Header Dialog */}
      <Dialog open={headerEditOpen} onOpenChange={setHeaderEditOpen}>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>Edit Chronicle Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="chronicle-name">Name</Label>
              <Input id="chronicle-name" value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="chronicle-description">Description</Label>
              <Textarea id="chronicle-description" value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={3} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="chronicle-setting">Setting</Label>
              <Input id="chronicle-setting" value={editSetting} onChange={(e) => setEditSetting(e.target.value)} placeholder="e.g. Modern Nights" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setHeaderEditOpen(false)}>Cancel</Button>
            <Button onClick={handleHeaderSave} disabled={!editName.trim()}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <EntityCard variant="panel">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Characters</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16 mb-2" />
            ) : (
              <div className="text-2xl font-bold text-foreground">{stats.characters.total}</div>
            )}
            {statsLoading ? (
              <Skeleton className="h-3 w-20" />
            ) : (
              <p className="text-xs text-muted-foreground">{stats.characters.pcs} PCs, {stats.characters.npcs} NPCs</p>
            )}
          </CardContent>
        </EntityCard>

        <EntityCard variant="panel">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Plots</CardTitle>
            <BookOpen className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16 mb-2" />
            ) : (
              <div className="text-2xl font-bold text-foreground">{stats.plots.total}</div>
            )}
            {statsLoading ? (
              <Skeleton className="h-3 w-20" />
            ) : (
              <p className="text-xs text-muted-foreground">{stats.plots.active} active plots</p>
            )}
          </CardContent>
        </EntityCard>

        <EntityCard variant="panel">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Sessions</CardTitle>
            <Calendar className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16 mb-2" />
            ) : (
              <div className="text-2xl font-bold text-foreground">{stats.sessions.total}</div>
            )}
            {statsLoading ? (
              <Skeleton className="h-3 w-20" />
            ) : (
              <p className="text-xs text-muted-foreground">
                {stats.sessions.lastSession 
                  ? `Last: ${formatDistanceToNow(new Date(stats.sessions.lastSession))} ago`
                  : 'No sessions yet'
                }
              </p>
            )}
          </CardContent>
        </EntityCard>

        <EntityCard variant="panel">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Notes</CardTitle>
            <Scroll className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16 mb-2" />
            ) : (
              <div className="text-2xl font-bold text-foreground">{stats.notes.total}</div>
            )}
            {statsLoading ? (
              <Skeleton className="h-3 w-20" />
            ) : (
              <p className="text-xs text-muted-foreground">Chronicle entries</p>
            )}
          </CardContent>
        </EntityCard>
      </div>

      {/* Recent Activity and Active Plots */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <EntityCard variant="panel">
          <CardHeader>
            <CardTitle className="text-foreground">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {activitiesLoading ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center space-x-3">
                  <Skeleton className="w-2 h-2 rounded-full" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              ))
            ) : activities.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground">No recent activity</p>
              </div>
            ) : (
              activities.map((activity) => (
                <div key={activity.id} className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${
                    activity.type === 'character' ? 'bg-primary' :
                    activity.type === 'session' ? 'bg-accent' :
                    activity.type === 'plot' ? 'bg-secondary' :
                    'bg-muted-foreground'
                  }`}></div>
                  <div className="flex-1">
                    <p className="text-sm text-foreground">{activity.action}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(activity.timestamp))} ago
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </EntityCard>

        <EntityCard variant="panel">
          <CardHeader>
            <CardTitle className="text-foreground">Active Plots</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {plotsLoading ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                  <Skeleton className="h-3 w-full" />
                </div>
              ))
            ) : plots.filter(p => p.status === 'Active').length === 0 ? (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground">No active plots</p>
                <CreatePlotDialog>
                  <Button size="sm" className="mt-2" variant="outline">
                    Create your first plot
                  </Button>
                </CreatePlotDialog>
              </div>
            ) : (
              plots.filter(p => p.status === 'Active').map((plot) => (
                <div key={plot.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-foreground">{plot.title}</h4>
                    <Badge variant={
                      plot.status === 'Critical' ? 'destructive' : 
                      plot.status === 'Active' ? 'secondary' : 
                      'outline'
                    }>
                      {plot.status}
                    </Badge>
                  </div>
                  <MentionText 
                    text={plot.summary || plot.description || 'No summary provided'} 
                    className="text-sm text-muted-foreground block line-clamp-2"
                  />
                </div>
              ))
            )}
          </CardContent>
        </EntityCard>
      </div>

      {/* Chronicle Notes */}
      <EntityCard variant="panel">
        <CardHeader>
          <CardTitle className="text-foreground">Chronicle Notes</CardTitle>
        </CardHeader>
        <CardContent>
          {notesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-5 w-20" />
                  </div>
                  <Skeleton className="h-3 w-full" />
                </div>
              ))}
            </div>
          ) : notes.length === 0 ? (
            <EmptyState
              icon={<Scroll className="h-7 w-7" />}
              title="No notes yet"
              description="Notes capture lore, rumours, NPC quirks, and anything that doesn't belong in a session log."
              tip="Use @mentions to link a note back to a character, plot, or session."
              action={
                <CreateNoteDialog>
                  <Button className="bg-gradient-blood hover:opacity-90 shadow-crimson">
                    <Plus className="h-4 w-4 mr-2" /> Create First Note
                  </Button>
                </CreateNoteDialog>
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {notes.map((note) => (
                <EntityCard key={note.id} entityId={note.id}>
                  <EntityCardHeaderBar
                    leading={<Scroll className="h-4 w-4 text-primary" />}
                    title={<span className="text-base">{note.title}</span>}
                    titleClassName="text-base"
                    badge={
                      <Badge variant="outline">
                        {note.category || 'General'}
                      </Badge>
                    }
                    actions={
                      <>
                        <CardIconAction
                          label="Edit note"
                          onClick={() => handleEditNote(note)}
                        >
                          <Pencil className="h-4 w-4" />
                        </CardIconAction>
                        <CardIconAction
                          label="Delete note"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDeleteNote(note)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </CardIconAction>
                      </>
                    }
                  />
                  <EntityCardContent className="pt-0 space-y-2">
                    <MentionText
                      text={note.content || 'No content'}
                      className="text-sm text-muted-foreground line-clamp-3 block"
                    />
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(note.created_at))} ago
                    </p>
                  </EntityCardContent>
                </EntityCard>
              ))}

            </div>
          )}
        </CardContent>
      </EntityCard>

      {/* Quick Actions */}
      <EntityCard variant="panel">
        <CardHeader>
          <CardTitle className="text-foreground">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <CreateCharacterDialog>
              <Button variant="outline" className="h-20 flex-col space-y-2 border-border hover:bg-secondary">
                <Users className="h-6 w-6" />
                <span>Add Character</span>
              </Button>
            </CreateCharacterDialog>
            <CreatePlotDialog>
              <Button variant="outline" className="h-20 flex-col space-y-2 border-border hover:bg-secondary">
                <BookOpen className="h-6 w-6" />
                <span>New Story</span>
              </Button>
            </CreatePlotDialog>
            <CreateSessionDialog>
              <Button variant="outline" className="h-20 flex-col space-y-2 border-border hover:bg-secondary">
                <Calendar className="h-6 w-6" />
                <span>Log Session</span>
              </Button>
            </CreateSessionDialog>
            <CreateNoteDialog>
              <Button variant="outline" className="h-20 flex-col space-y-2 border-border hover:bg-secondary">
                <Scroll className="h-6 w-6" />
                <span>Add Note</span>
              </Button>
            </CreateNoteDialog>
          </div>
        </CardContent>
      </EntityCard>

      {/* Chronicle Management */}
      <ChronicleManager title="Chronicle Management" />

      {/* Edit Note Dialog */}
      <EditNoteDialog note={editingNote} open={editDialogOpen} onOpenChange={setEditDialogOpen} />
    </div>
  );
}