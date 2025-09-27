import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, BookOpen, Clock, Users, Loader2 } from "lucide-react";
import { CreatePlotDialog } from "@/components/dialogs/CreatePlotDialog";
import { usePlots } from "@/hooks/usePlots";

const Stories = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const { plots, loading, refetch } = usePlots();

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

  const filteredStories = plots.filter(story =>
    story.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (story.description && story.description.toLowerCase().includes(searchTerm.toLowerCase()))
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
          ) : filteredStories.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredStories.map((story) => (
                <Card key={story.id} className="bg-card border-border shadow-gothic hover:shadow-crimson transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg text-foreground line-clamp-2">
                        {story.title}
                      </CardTitle>
                      <Badge variant={getStatusColor(story.status)} className="ml-2 shrink-0">
                        {story.status}
                      </Badge>
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
                    </div>
                  </CardContent>
                </Card>
              ))}
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

        {/* Other tab contents would filter the same data */}
        <TabsContent value="active">
          <div className="text-center py-8 text-muted-foreground">
            Active stories will be shown here
          </div>
        </TabsContent>

        <TabsContent value="planned">
          <div className="text-center py-8 text-muted-foreground">
            Planned stories will be shown here
          </div>
        </TabsContent>

        <TabsContent value="completed">
          <div className="text-center py-8 text-muted-foreground">
            Completed stories will be shown here
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Stories;
