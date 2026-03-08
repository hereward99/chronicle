import { useState } from "react";
import { EmptyState } from "@/components/onboarding/EmptyState";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, BookOpen, Clock, Users, Eye, Edit, FileText, Image as ImageIcon, Calendar } from "lucide-react";
import { formatInGameDate } from "@/components/InGameDateInput";
import { StoryCardSkeleton } from "@/components/skeletons/CardSkeleton";
import { CreatePlotDialog } from "@/components/dialogs/CreatePlotDialog";
import { EditPlotDialog } from "@/components/dialogs/EditPlotDialog";
import { ViewPlotDialog } from "@/components/dialogs/ViewPlotDialog";
import { usePlots, Plot } from "@/hooks/usePlots";
import { usePlotCharacters } from "@/hooks/usePlotCharacters";
import { useSessions } from "@/hooks/useSessions";
import { MentionText } from "@/components/mentions/MentionText";
import { TextHighlight } from "@/components/ui/text-highlight";

const Stories = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [viewingPlot, setViewingPlot] = useState<Plot | null>(null);
  const [editingPlot, setEditingPlot] = useState<Plot | null>(null);
  const { plots, loading, refetch } = usePlots();
  const { getCharactersForPlot } = usePlotCharacters();
  const { sessions } = useSessions();

  const getCharacterCountForPlot = (plotId: string) => {
    return getCharactersForPlot(plotId).length;
  };

  const getSessionCountForPlot = (plotId: string) => {
    return sessions.filter(session => session.plot_id === plotId).length;
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
      (story.summary && story.summary.toLowerCase().includes(searchTerm.toLowerCase())) ||
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
    return attachments?.filter(att => {
      if (att.type?.startsWith('image/')) return true;
      const name = att.name?.toLowerCase() || '';
      // Fallback by extension for cases where content-type is missing or generic
      return /(\.(png|jpe?g|gif|webp|bmp|svg|heic|heif|tif|tiff))$/i.test(name);
    }) || [];
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
            <TextHighlight text={story.title} highlight={searchTerm} />
          </CardTitle>
          <Badge variant={getStatusColor(story.status)} className="shrink-0">
            {story.status}
          </Badge>
        </div>
        {searchTerm ? (
          <TextHighlight 
            text={story.summary || story.description || "No summary provided"} 
            className="text-sm text-muted-foreground line-clamp-3 block"
            highlight={searchTerm}
          />
        ) : (
          <MentionText 
            text={story.summary || story.description || "No summary provided"} 
            className="text-sm text-muted-foreground line-clamp-3 block"
          />
        )}
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          <div className="flex items-center text-sm text-muted-foreground">
            <Clock className="h-4 w-4 mr-2" />
            {getSessionCountForPlot(story.id)} session{getSessionCountForPlot(story.id) !== 1 ? 's' : ''} played
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <Users className="h-4 w-4 mr-2" />
            {getCharacterCountForPlot(story.id)} character{getCharacterCountForPlot(story.id) !== 1 ? 's' : ''} assigned
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

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => setViewingPlot(story)}
            >
              <Eye className="h-4 w-4 mr-2" />
              View
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => setEditingPlot(story)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </div>
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
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => <StoryCardSkeleton key={i} />)}
            </div>
          ) : getFilteredStories().length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {getFilteredStories().map(renderStoryCard)}
            </div>
          ) : searchTerm ? (
            <EmptyState
              icon={<BookOpen className="h-7 w-7" />}
              title="No stories found"
              description="Try adjusting your search terms."
            />
          ) : (
            <EmptyState
              icon={<BookOpen className="h-7 w-7" />}
              title="No stories yet"
              description="Stories are the plotlines driving your chronicle — political schemes, ancient mysteries, or personal vendettas."
              tip="Create a story, then link sessions and characters to it. Use @ in descriptions to cross-reference entities."
              action={
                <CreatePlotDialog onCreated={refetch}>
                  <Button className="bg-gradient-blood hover:opacity-90 shadow-crimson">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Story
                  </Button>
                </CreatePlotDialog>
              }
            />
          )}
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          {loading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(3)].map((_, i) => <StoryCardSkeleton key={i} />)}
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
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(3)].map((_, i) => <StoryCardSkeleton key={i} />)}
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
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(3)].map((_, i) => <StoryCardSkeleton key={i} />)}
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

      <ViewPlotDialog
        plot={viewingPlot}
        open={!!viewingPlot}
        onOpenChange={(open) => !open && setViewingPlot(null)}
      />

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
