import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command';
import { useGlobalSearch, type SearchResult } from '@/hooks/useGlobalSearch';
import {
  Users,
  BookOpen,
  Calendar,
  MapPin,
  StickyNote,
  Shield,
  UsersRound,
  Search,
} from 'lucide-react';

const TYPE_ICONS: Record<SearchResult['type'], React.ElementType> = {
  character: Users,
  plot: BookOpen,
  session: Calendar,
  location: MapPin,
  note: StickyNote,
  faction: Shield,
  coterie: UsersRound,
  boon: BookOpen,
};

const TYPE_LABELS: Record<SearchResult['type'], string> = {
  character: 'Characters',
  plot: 'Stories',
  session: 'Sessions',
  location: 'Locations',
  note: 'Notes',
  faction: 'Factions',
  coterie: 'Coteries',
  boon: 'Boons',
};

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const { results, loading, search } = useGlobalSearch();
  const navigate = useNavigate();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Cmd+K / Ctrl+K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Debounced search
  const handleValueChange = useCallback((value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      search(value);
    }, 250);
  }, [search]);

  const handleSelect = useCallback((result: SearchResult) => {
    setOpen(false);
    setQuery('');
    navigate(result.route);
  }, [navigate]);

  // Group results by type
  const grouped = results.reduce<Record<string, SearchResult[]>>((acc, r) => {
    const key = TYPE_LABELS[r.type];
    if (!acc[key]) acc[key] = [];
    acc[key].push(r);
    return acc;
  }, {});

  return (
    <CommandDialog open={open} onOpenChange={setOpen} shouldFilter={false}>
      <CommandInput
        placeholder="Search characters, stories, sessions, locations..."
        value={query}
        onValueChange={handleValueChange}
      />
      <CommandList>
        {loading && (
          <div className="py-6 text-center text-sm text-muted-foreground">
            Searching...
          </div>
        )}

        {!loading && query.trim() && results.length === 0 && (
          <CommandEmpty>No results found.</CommandEmpty>
        )}

        {!loading && !query.trim() && (
          <div className="py-6 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
            <Search className="h-8 w-8 opacity-30" />
            <p>Type to search across your chronicle</p>
            <p className="text-xs opacity-60">Characters, stories, sessions, locations, notes, factions & coteries</p>
          </div>
        )}

        {Object.entries(grouped).map(([group, items]) => (
          <CommandGroup key={group} heading={group}>
            {items.map(item => {
              const Icon = TYPE_ICONS[item.type];
              return (
                <CommandItem
                  key={`${item.type}-${item.id}`}
                  value={`${item.title} ${item.subtitle || ''}`}
                  onSelect={() => handleSelect(item)}
                  className="cursor-pointer"
                >
                  <Icon className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="flex flex-col min-w-0">
                    <span className="truncate">{item.title}</span>
                    {item.subtitle && (
                      <span className="text-xs text-muted-foreground truncate">{item.subtitle}</span>
                    )}
                  </div>
                </CommandItem>
              );
            })}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  );
}
