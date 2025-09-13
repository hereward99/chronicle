import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Users, BookOpen, Calendar, Scroll } from "lucide-react";
import { useChronicleStats } from "@/hooks/useChronicleStats";
import { usePlots } from "@/hooks/usePlots";
import { formatDistanceToNow } from "date-fns";

export default function Chronicle() {
  const { stats, loading: statsLoading } = useChronicleStats();
  const { plots, loading: plotsLoading } = usePlots();
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Chronicle Dashboard</h1>
          <p className="text-lg text-muted-foreground">Manage your Vampire: The Masquerade chronicle</p>
        </div>
        <Button className="bg-gradient-blood hover:opacity-90 shadow-crimson">
          <Plus className="w-4 h-4 mr-2" />
          New Entry
        </Button>
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

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-gradient-subtle border-border shadow-gothic">
          <CardHeader>
            <CardTitle className="text-foreground">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm text-foreground">Created new NPC: Baron Vex</p>
                <p className="text-xs text-muted-foreground">2 hours ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-accent rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm text-foreground">Updated session notes</p>
                <p className="text-xs text-muted-foreground">1 day ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-muted-foreground rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm text-foreground">Generated new story hook</p>
                <p className="text-xs text-muted-foreground">3 days ago</p>
              </div>
            </div>
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
            ) : plots.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground">No active plots</p>
                <Button size="sm" className="mt-2" variant="outline">
                  Create your first plot
                </Button>
              </div>
            ) : (
              plots.map((plot) => (
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
                  <p className="text-sm text-muted-foreground">
                    {plot.description || 'No description provided'}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="bg-gradient-subtle border-border shadow-gothic">
        <CardHeader>
          <CardTitle className="text-foreground">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex-col space-y-2 border-border hover:bg-secondary">
              <Users className="h-6 w-6" />
              <span>Add Character</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-2 border-border hover:bg-secondary">
              <BookOpen className="h-6 w-6" />
              <span>New Story</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-2 border-border hover:bg-secondary">
              <Calendar className="h-6 w-6" />
              <span>Log Session</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-2 border-border hover:bg-secondary">
              <Scroll className="h-6 w-6" />
              <span>Add Note</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}