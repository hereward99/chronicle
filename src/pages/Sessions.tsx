import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Calendar, Users, Clock, MapPin } from "lucide-react";

const Sessions = () => {
  const [searchTerm, setSearchTerm] = useState("");

  // Mock data for now - replace with real data later
  const sessions = [
    {
      id: '1',
      title: 'The Prince\'s Court',
      date: '2024-01-15',
      duration: '4 hours',
      players: ['Alice', 'Bob', 'Charlie', 'Diana'],
      location: 'Online - Discord',
      story: 'The Prince\'s Gambit',
      notes: 'The coterie was introduced to Prince Lodin and received their first mission.',
      experience: 2,
    },
    {
      id: '2',
      title: 'Shadows in the Alley',
      date: '2024-01-08',
      duration: '3.5 hours',
      players: ['Alice', 'Bob', 'Charlie'],
      location: 'Mike\'s House',
      story: 'Blood Hunt',
      notes: 'Investigation of the mysterious murders in the warehouse district.',
      experience: 1,
    },
  ];

  const filteredSessions = sessions.filter(session =>
    session.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    session.story.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

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
        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-crimson">
          <Plus className="h-4 w-4 mr-2" />
          Log New Session
        </Button>
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

      {/* Sessions List */}
      <div className="space-y-4">
        {filteredSessions.length > 0 ? (
          filteredSessions.map((session) => (
            <Card key={session.id} className="bg-card border-border shadow-gothic hover:shadow-crimson transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                  <div className="space-y-1">
                    <CardTitle className="text-xl text-foreground">
                      {session.title}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {formatDate(session.date)}
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="w-fit">
                    {session.story}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{session.duration}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{session.players.length} players</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{session.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Badge variant="secondary">
                      {session.experience} XP awarded
                    </Badge>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-foreground">Players:</h4>
                  <div className="flex flex-wrap gap-2">
                    {session.players.map((player) => (
                      <Badge key={player} variant="outline">
                        {player}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-foreground">Session Notes:</h4>
                  <p className="text-sm text-muted-foreground">
                    {session.notes}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))
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
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  <Plus className="h-4 w-4 mr-2" />
                  Log Your First Session
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Sessions;