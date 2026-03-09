import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Users, BookOpen, Calendar, Scroll, Pencil, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
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

export default function Chronicle() {
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  
  const { currentChronicle } = useChronicles();
  const { stats, loading: statsLoading } = useChronicleStats();
  const { plots, loading: plotsLoading } = usePlots();
  const { notes, loading: notesLoading, deleteNote } = useNotes();
  const { activities, loading: activitiesLoading } = useRecentActivity();

  const handleEditNote = (note: Note) => {
    setEditingNote(note);
    setEditDialogOpen(true);
  };

  const handleDeleteNote = async (id: string) => {
    await deleteNote(id);
  };

  return (
    <div className="space-y-8">{/* Header */}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">
            {currentChronicle?.name || "Chronicle Dashboard"}
          </h1>
          <p className="text-lg text-muted-foreground">
            {currentChronicle?.description || "Manage your Vampire: The Masquerade chronicle"}
          </p>
        </div>
        <CreateNoteDialog>
          <Button className="bg-gradient-blood hover:opacity-90 shadow-crimson">
            <Plus className="w-4 h-4 mr-2" />
            New Entry
          </Button>
        </CreateNoteDialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-subtle border-border shadow-gothic">
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
        </Card>

        <Card className="bg-gradient-subtle border-border shadow-gothic">
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
        </Card>

        <Card className="bg-gradient-subtle border-border shadow-gothic">
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
        </Card>

        <Card className="bg-gradient-subtle border-border shadow-gothic">
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
        </Card>
      </div>

      {/* Recent Activity and Active Plots */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-gradient-subtle border-border shadow-gothic">
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
        </Card>

        <Card className="bg-gradient-subtle border-border shadow-gothic">
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
        </Card>
      </div>

      {/* Chronicle Notes */}
      <Card className="bg-gradient-subtle border-border shadow-gothic">
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
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">No notes yet</p>
              <CreateNoteDialog>
                <Button size="sm" className="mt-2" variant="outline">
                  Create your first note
                </Button>
              </CreateNoteDialog>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {notes.map((note) => (
                <Card key={note.id} className="border-border">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-base text-foreground">{note.title}</CardTitle>
                      <div className="flex items-center gap-1 ml-2">
                        <Badge variant="outline">
                          {note.category || 'General'}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <MentionText 
                      text={note.content || 'No content'} 
                      className="text-sm text-muted-foreground line-clamp-3 block"
                    />
                    <div className="flex items-center justify-between pt-2">
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(note.created_at))} ago
                      </p>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditNote(note)}
                          className="h-7 w-7 p-0"
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:text-destructive">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Note</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{note.title}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteNote(note.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="bg-gradient-subtle border-border shadow-gothic">
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
      </Card>

      {/* Chronicle Management */}
      <ChronicleManager title="Chronicle Management" />

      {/* Edit Note Dialog */}
      <EditNoteDialog note={editingNote} open={editDialogOpen} onOpenChange={setEditDialogOpen} />
    </div>
  );
}