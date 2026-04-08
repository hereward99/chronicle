import { useState, useMemo, useCallback, useEffect } from "react";
import { EmptyState } from "@/components/onboarding/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Plus, Search, Users, Wand2, X, ChevronDown } from "lucide-react";
import { useCharacters, Character } from "@/hooks/useCharacters";
import { useFactions } from "@/hooks/useFactions";
import { useCoteries } from "@/hooks/useCoteries";
import { usePlots } from "@/hooks/usePlots";
import { usePlotCharacters } from "@/hooks/usePlotCharacters";
import { CreateCharacterDialog } from "@/components/dialogs/CreateCharacterDialog";
import { ViewCharacterDialog } from "@/components/dialogs/ViewCharacterDialog";
import { EditCharacterDialog } from "@/components/dialogs/EditCharacterDialog";
import { CharacterWizard } from "@/components/character/CharacterWizard";
import { CharacterCard } from "@/components/characters/CharacterCard";
import { useSearchHighlight } from "@/hooks/useSearchHighlight";

const STORAGE_KEY = "characters-toolbar-state";

interface ToolbarState {
  filterType: string;
  filterClan: string;
  filterStatus: string;
  filterCoterie: string;
  filterFaction: string;
  filterStory: string;
  filterSire: string;
  groupBy: string;
  sortBy: string;
}

const defaultState: ToolbarState = {
  filterType: "__all__",
  filterClan: "__all__",
  filterStatus: "__all__",
  filterCoterie: "__all__",
  filterFaction: "__all__",
  filterStory: "__all__",
  filterSire: "__all__",
  groupBy: "__none__",
  sortBy: "name-asc",
};

function loadToolbarState(): ToolbarState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return { ...defaultState, ...JSON.parse(stored) };
  } catch {}
  return defaultState;
}

function saveToolbarState(state: ToolbarState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

export default function Characters() {
  const [searchTerm, setSearchTerm] = useState("");
  const [viewCharacter, setViewCharacter] = useState<Character | null>(null);
  const [editCharacter, setEditCharacter] = useState<Character | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [toolbar, setToolbar] = useState<ToolbarState>(loadToolbarState);

  const { characters, loading, updateCharacter, deleteCharacter } = useCharacters();
  const { factions, characterFactions } = useFactions();
  const { coteries, allCoterieMembers } = useCoteries();
  const { plots } = usePlots();
  const { plotCharacters } = usePlotCharacters();
  const { searchQuery: highlightQuery } = useSearchHighlight();

  // Persist toolbar state
  useEffect(() => { saveToolbarState(toolbar); }, [toolbar]);

  const setFilter = useCallback((key: keyof ToolbarState, value: string) => {
    setToolbar(prev => ({ ...prev, [key]: value }));
  }, []);

  const clearFilters = useCallback(() => {
    setToolbar(defaultState);
    setSearchTerm("");
  }, []);

  const hasActiveFilters = useMemo(() => {
    return Object.keys(defaultState).some(
      k => toolbar[k as keyof ToolbarState] !== defaultState[k as keyof ToolbarState]
    ) || searchTerm !== "";
  }, [toolbar, searchTerm]);

  // Build lookup maps
  const characterFactionMap = useMemo(() => {
    const map = new Map<string, string[]>(); // characterId -> factionIds
    characterFactions.forEach(cf => {
      const arr = map.get(cf.character_id) || [];
      arr.push(cf.faction_id);
      map.set(cf.character_id, arr);
    });
    return map;
  }, [characterFactions]);

  const characterCoterieMap = useMemo(() => {
    const map = new Map<string, string[]>(); // characterId -> coterieIds
    allCoterieMembers.forEach(cm => {
      const arr = map.get(cm.character_id) || [];
      arr.push(cm.coterie_id);
      map.set(cm.character_id, arr);
    });
    return map;
  }, [allCoterieMembers]);

  const characterPlotMap = useMemo(() => {
    const map = new Map<string, string[]>(); // characterId -> plotIds
    plotCharacters.forEach(pc => {
      const arr = map.get(pc.character_id) || [];
      arr.push(pc.plot_id);
      map.set(pc.character_id, arr);
    });
    return map;
  }, [plotCharacters]);

  // Dynamic filter options
  const filterOptions = useMemo(() => {
    const clans = [...new Set(characters.map(c => c.clan))].sort();
    const statuses = [...new Set(characters.map(c => c.status))].sort();
    const sires = [...new Set(characters.map(c => c.sire).filter(Boolean))].sort() as string[];
    return { clans, statuses, sires };
  }, [characters]);

  // Filter
  const filteredCharacters = useMemo(() => {
    return characters.filter(c => {
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        if (!c.name.toLowerCase().includes(q) && !c.clan.toLowerCase().includes(q)) return false;
      }
      if (toolbar.filterType !== "__all__" && c.type !== toolbar.filterType) return false;
      if (toolbar.filterClan !== "__all__" && c.clan !== toolbar.filterClan) return false;
      if (toolbar.filterStatus !== "__all__" && c.status !== toolbar.filterStatus) return false;
      if (toolbar.filterSire !== "__all__" && c.sire !== toolbar.filterSire) return false;
      if (toolbar.filterCoterie !== "__all__") {
        const memberOfCoteries = characterCoterieMap.get(c.id) || [];
        if (!memberOfCoteries.includes(toolbar.filterCoterie)) return false;
      }
      if (toolbar.filterFaction !== "__all__") {
        const memberOfFactions = characterFactionMap.get(c.id) || [];
        if (!memberOfFactions.includes(toolbar.filterFaction)) return false;
      }
      if (toolbar.filterStory !== "__all__") {
        const inPlots = characterPlotMap.get(c.id) || [];
        if (!inPlots.includes(toolbar.filterStory)) return false;
      }
      return true;
    });
  }, [characters, searchTerm, toolbar, characterCoterieMap, characterFactionMap, characterPlotMap]);

  // Sort
  const sortedCharacters = useMemo(() => {
    const sorted = [...filteredCharacters];
    switch (toolbar.sortBy) {
      case "name-asc": sorted.sort((a, b) => a.name.localeCompare(b.name)); break;
      case "name-desc": sorted.sort((a, b) => b.name.localeCompare(a.name)); break;
      case "clan": sorted.sort((a, b) => a.clan.localeCompare(b.clan) || a.name.localeCompare(b.name)); break;
      case "status": sorted.sort((a, b) => a.status.localeCompare(b.status) || a.name.localeCompare(b.name)); break;
      case "updated": sorted.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()); break;
      case "generation": sorted.sort((a, b) => (a.generation ?? 99) - (b.generation ?? 99) || a.name.localeCompare(b.name)); break;
    }
    return sorted;
  }, [filteredCharacters, toolbar.sortBy]);

  // Group
  const groupedCharacters = useMemo(() => {
    if (toolbar.groupBy === "__none__") return null;

    const groups = new Map<string, Character[]>();
    const getKey = (c: Character): string => {
      switch (toolbar.groupBy) {
        case "clan": return c.clan;
        case "status": return c.status;
        case "type": return c.type;
        case "coterie": {
          const coterieIds = characterCoterieMap.get(c.id) || [];
          if (coterieIds.length === 0) return "No Coterie";
          return coteries.find(ct => ct.id === coterieIds[0])?.name || "Unknown Coterie";
        }
        case "sire": return c.sire || "Unknown Sire";
        case "generation": {
          if (c.clan === "Human" || c.clan === "Ghoul") return "Mortal";
          return c.generation ? `${c.generation}th Generation` : "Unknown Generation";
        }
        default: return "Other";
      }
    };

    sortedCharacters.forEach(c => {
      const key = getKey(c);
      const arr = groups.get(key) || [];
      arr.push(c);
      groups.set(key, arr);
    });

    // Sort group keys
    return new Map([...groups.entries()].sort(([a], [b]) => a.localeCompare(b)));
  }, [sortedCharacters, toolbar.groupBy, characterCoterieMap, coteries]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Characters</h1>
          <p className="text-muted-foreground">Manage your chronicle's characters</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setWizardOpen(true)}
            className="border-primary/50 hover:bg-primary/10"
          >
            <Wand2 className="w-4 h-4 mr-2" />
            Wizard
          </Button>
          <CreateCharacterDialog>
            <Button className="bg-gradient-blood hover:opacity-90 shadow-crimson">
              <Plus className="w-4 h-4 mr-2" />
              Quick Create
            </Button>
          </CreateCharacterDialog>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search characters..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 bg-input border-border"
        />
      </div>

      {/* Filter / Group / Sort Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <Select value={toolbar.filterType} onValueChange={v => setFilter("filterType", v)}>
          <SelectTrigger className="w-[120px] h-9 text-sm bg-input border-border">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Types</SelectItem>
            <SelectItem value="PC">PC</SelectItem>
            <SelectItem value="NPC">NPC</SelectItem>
          </SelectContent>
        </Select>

        <Select value={toolbar.filterClan} onValueChange={v => setFilter("filterClan", v)}>
          <SelectTrigger className="w-[140px] h-9 text-sm bg-input border-border">
            <SelectValue placeholder="Clan" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Clans</SelectItem>
            {filterOptions.clans.map(c => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={toolbar.filterStatus} onValueChange={v => setFilter("filterStatus", v)}>
          <SelectTrigger className="w-[130px] h-9 text-sm bg-input border-border">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Statuses</SelectItem>
            {filterOptions.statuses.map(s => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {coteries.length > 0 && (
          <Select value={toolbar.filterCoterie} onValueChange={v => setFilter("filterCoterie", v)}>
            <SelectTrigger className="w-[140px] h-9 text-sm bg-input border-border">
              <SelectValue placeholder="Coterie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All Coteries</SelectItem>
              {coteries.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {factions.length > 0 && (
          <Select value={toolbar.filterFaction} onValueChange={v => setFilter("filterFaction", v)}>
            <SelectTrigger className="w-[140px] h-9 text-sm bg-input border-border">
              <SelectValue placeholder="Faction" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All Factions</SelectItem>
              {factions.map(f => (
                <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {plots.length > 0 && (
          <Select value={toolbar.filterStory} onValueChange={v => setFilter("filterStory", v)}>
            <SelectTrigger className="w-[140px] h-9 text-sm bg-input border-border">
              <SelectValue placeholder="Story" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All Stories</SelectItem>
              {plots.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {filterOptions.sires.length > 0 && (
          <Select value={toolbar.filterSire} onValueChange={v => setFilter("filterSire", v)}>
            <SelectTrigger className="w-[140px] h-9 text-sm bg-input border-border">
              <SelectValue placeholder="Sire" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All Sires</SelectItem>
              {filterOptions.sires.map(s => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <div className="h-6 w-px bg-border mx-1 hidden sm:block" />

        <Select value={toolbar.groupBy} onValueChange={v => setFilter("groupBy", v)}>
          <SelectTrigger className="w-[140px] h-9 text-sm bg-input border-border">
            <SelectValue placeholder="Group by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">No Grouping</SelectItem>
            <SelectItem value="clan">Group by Clan</SelectItem>
            <SelectItem value="status">Group by Status</SelectItem>
            <SelectItem value="type">Group by Type</SelectItem>
            <SelectItem value="coterie">Group by Coterie</SelectItem>
            <SelectItem value="sire">Group by Sire</SelectItem>
            <SelectItem value="generation">Group by Generation</SelectItem>
          </SelectContent>
        </Select>

        <Select value={toolbar.sortBy} onValueChange={v => setFilter("sortBy", v)}>
          <SelectTrigger className="w-[150px] h-9 text-sm bg-input border-border">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name-asc">Name (A–Z)</SelectItem>
            <SelectItem value="name-desc">Name (Z–A)</SelectItem>
            <SelectItem value="clan">Clan</SelectItem>
            <SelectItem value="status">Status</SelectItem>
            <SelectItem value="updated">Recently Updated</SelectItem>
            <SelectItem value="generation">Generation</SelectItem>
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9 px-2 text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* Results count */}
      {!loading && (
        <p className="text-sm text-muted-foreground">
          Showing {sortedCharacters.length} of {characters.length} characters
        </p>
      )}

      {/* Character Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="bg-gradient-subtle border-border">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : groupedCharacters ? (
        // Grouped view
        <div className="space-y-4">
          {[...groupedCharacters.entries()].map(([group, chars]) => (
            <Collapsible key={group} defaultOpen>
              <CollapsibleTrigger className="flex items-center gap-2 w-full text-left py-2 px-3 rounded-md bg-secondary/50 hover:bg-secondary transition-colors group">
                <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=closed]:-rotate-90" />
                <span className="font-semibold text-foreground">{group}</span>
                <span className="text-sm text-muted-foreground">({chars.length})</span>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-3">
                  {chars.map(character => (
                    <CharacterCard
                      key={character.id}
                      character={character}
                      highlightQuery={highlightQuery}
                      onView={setViewCharacter}
                      onEdit={setEditCharacter}
                    />
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      ) : (
        // Flat view
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedCharacters.map(character => (
            <CharacterCard
              key={character.id}
              character={character}
              highlightQuery={highlightQuery}
              onView={setViewCharacter}
              onEdit={setEditCharacter}
            />
          ))}
        </div>
      )}

      {!loading && sortedCharacters.length === 0 && (
        searchTerm || hasActiveFilters ? (
          <EmptyState
            icon={<Users className="h-7 w-7" />}
            title="No characters found"
            description="Try adjusting your search or filters."
            action={
              <Button variant="outline" onClick={clearFilters}>
                <X className="w-4 h-4 mr-2" />
                Clear Filters
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={<Users className="h-7 w-7" />}
            title="No characters yet"
            description="Characters are the heart of your chronicle — add your PCs and the NPCs they'll encounter."
            tip="Start with 1-2 Player Characters, then add NPCs as your story unfolds. Use the Wizard for guided creation."
            action={
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setWizardOpen(true)} className="border-primary/50">
                  <Wand2 className="w-4 h-4 mr-2" />
                  Character Wizard
                </Button>
                <CreateCharacterDialog>
                  <Button className="bg-gradient-blood hover:opacity-90 shadow-crimson">
                    <Plus className="w-4 h-4 mr-2" />
                    Quick Create
                  </Button>
                </CreateCharacterDialog>
              </div>
            }
          />
        )
      )}

      <ViewCharacterDialog
        character={viewCharacter}
        open={!!viewCharacter}
        onOpenChange={(open) => !open && setViewCharacter(null)}
      />

      <EditCharacterDialog
        character={editCharacter}
        open={!!editCharacter}
        onOpenChange={(open) => !open && setEditCharacter(null)}
        onUpdate={updateCharacter}
        onDelete={deleteCharacter}
      />

      <CharacterWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
      />
    </div>
  );
}
