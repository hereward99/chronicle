import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Search, BookOpen, Clock, Users, Loader2, Edit, Trash2, MoreVertical, FileText, Image as ImageIcon } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { CreatePlotDialog } from "@/components/dialogs/CreatePlotDialog";
import { EditPlotDialog } from "@/components/dialogs/EditPlotDialog";
import { usePlots, Plot } from "@/hooks/usePlots";

const Stories = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [editingPlot, setEditingPlot] = useState<Plot | null>(null);
  const { plots, loading, deletePlot, refetch } = usePlots();

  const handleDelete = async (plotId: string) => {
    await deletePlot(plotId);
  };

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

  const getFilteredStories = (status?: string) => {
    let filtered = plots.filter(story =>
      story.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (story.description && story.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (status && status !== 'all') {
      filtered = filtered.filter(story => 
        story.status.toLowerCase() === status.toLowerCase()
      );
    }

    return filtered;
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

  const renderStoryCard = (story: Plot) => (
    <Card key={story.id} className="bg-card border-border shadow-gothic hover:shadow-crimson transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg text-foreground line-clamp-2">
            {story.title}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={getStatusColor(story.status)} className="shrink-0">
              {story.status}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setEditingPlot(story)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Story</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete "{story.title}"? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(story.id)} className="bg-destructive hover:bg-destructive/90">
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <CardDescription className="line-clamp-3">
          {story.description || "No description provided"}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          <div className="flex items-center text-sm text-muted-foreground">
            <Clock className="h-4 w-4 mr-2" />
            0 sessions played
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <Users className="h-4 w-4 mr-2" />
            No characters assigned
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <BookOpen className="h-4 w-4 mr-2" />
            Priority: {story.priority}
          </div>

          {/* Image Thumbnails */}
          {getImageAttachments(story.attachments || []).length > 0 && (
            <div className="flex gap-2 pt-2">
              {getImageAttachments(story.attachments || []).slice(0, 3).map((img, idx) => (
                <div key={idx} className="relative w-16 h-16 rounded overflow-hidden border border-border">
                  <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                </div>
              ))}
              {getImageAttachments(story.attachments || []).length > 3 && (
                <div className="w-16 h-16 rounded border border-border flex items-center justify-center bg-secondary">
                  <span className="text-xs text-muted-foreground">
                    +{getImageAttachments(story.attachments || []).length - 3}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Document Buttons */}
          {getDocumentAttachments(story.attachments || []).length > 0 && (
            <div className="pt-2 space-y-1">
              {getDocumentAttachments(story.attachments || []).map((doc, idx) => (
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
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Stories</h1>
          <p className="text-muted-foreground">
            Manage your chronicle's ongoing and planned storylines
          </p>
        </div>
        <CreatePlotDialog onCreated={refetch}>
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-crimson">
            <Plus className="h-4 w-4 mr-2" />
            New Story
          </Button>
        </CreatePlotDialog>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search stories..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="bg-secondary">
          <TabsTrigger value="all">All Stories</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="planned">Planned</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : getFilteredStories().length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {getFilteredStories().map(renderStoryCard)}
            </div>
          ) : (
            <Card className="bg-card border-border">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  {searchTerm ? 'No stories found' : 'No stories yet'}
                </h3>
                <p className="text-muted-foreground text-center mb-4">
                  {searchTerm 
                    ? 'Try adjusting your search terms'
                    : 'Create your first story to begin weaving tales of darkness and intrigue'
                  }
                </p>
                {!searchTerm && (
                  <CreatePlotDialog onCreated={refetch}>
                    <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Story
                    </Button>
                  </CreatePlotDialog>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : getFilteredStories('active').length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {getFilteredStories('active').map(renderStoryCard)}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No active stories found
            </div>
          )}
        </TabsContent>

        <TabsContent value="planned" className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : getFilteredStories('planned').length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {getFilteredStories('planned').map(renderStoryCard)}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No planned stories found
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : getFilteredStories('completed').length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {getFilteredStories('completed').map(renderStoryCard)}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No completed stories found
            </div>
          )}
        </TabsContent>
      </Tabs>

      {editingPlot && (
        <EditPlotDialog
          plot={editingPlot}
          open={!!editingPlot}
          onOpenChange={(open) => !open && setEditingPlot(null)}
          onUpdated={() => {
            setEditingPlot(null);
            refetch();
          }}
        />
      )}
    </div>
  );
};

export default Stories;
