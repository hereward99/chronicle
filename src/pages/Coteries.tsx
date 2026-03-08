import { useState, useEffect } from "react";
import { EmptyState } from "@/components/onboarding/EmptyState";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useCoteries } from "@/hooks/useCoteries";
import { useCharacters } from "@/hooks/useCharacters";
import { CreateCoterieDialog } from "@/components/dialogs/CreateCoterieDialog";
import { ManageCoterieDialog } from "@/components/dialogs/ManageCoterieDialog";
import { Users, MapPin, Plus, Edit } from "lucide-react";
import type { Coterie } from "@/hooks/useCoteries";

export default function Coteries() {
  const { coteries, loading, getCoterieMembers } = useCoteries();
  const { characters } = useCharacters();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedCoterie, setSelectedCoterie] = useState<Coterie | null>(null);
  const [memberCounts, setMemberCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchMemberCounts = async () => {
      for (const coterie of coteries) {
        const members = await getCoterieMembers(coterie.id);
        setMemberCounts(prev => ({ ...prev, [coterie.id]: members.length }));
      }
    };
    if (coteries.length > 0) {
      fetchMemberCounts();
    }
  }, [coteries]);

  const getCoterieCharacters = (coterieId: string) => {
    return characters.filter(char => 
      memberCounts[coterieId] && char.id // Will be populated after initial load
    );
  };

  return (
    <Layout>
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Coteries</h1>
            <p className="text-muted-foreground">
              Manage your vampire coteries and their members
            </p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Coterie
          </Button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : coteries.length === 0 ? (
          <EmptyState
            icon={<Users className="h-7 w-7" />}
            title="No coteries yet"
            description="Coteries are groups of vampires who band together for survival, politics, or shared goals. Create one and assign characters to it."
            tip="Create your characters first, then group them into coteries. You can assign roles like Leader or Enforcer."
            action={
              <Button onClick={() => setShowCreateDialog(true)} className="bg-gradient-blood hover:opacity-90 shadow-crimson">
                <Plus className="h-4 w-4 mr-2" />
                Create First Coterie
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {coteries.map((coterie) => (
              <Card key={coterie.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        {coterie.name}
                      </CardTitle>
                      {coterie.description && (
                        <CardDescription className="mt-2">
                          {coterie.description}
                        </CardDescription>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSelectedCoterie(coterie)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {coterie.domain && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      {coterie.domain}
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {memberCounts[coterie.id] || 0} members
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <CreateCoterieDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />

      <ManageCoterieDialog
        open={!!selectedCoterie}
        onOpenChange={(open) => !open && setSelectedCoterie(null)}
        coterie={selectedCoterie}
      />
    </Layout>
  );
}
