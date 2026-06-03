import { useMemo, useState } from "react";
import { MentionText } from "@/components/mentions/MentionText";
import { format, parseISO, isValid } from "date-fns";
import { useSessions } from "@/hooks/useSessions";
import { usePlots } from "@/hooks/usePlots";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Scroll, BookOpen, Calendar, Filter, ChevronDown, ChevronUp } from "lucide-react";
import { SessionCardSkeleton } from "@/components/skeletons/CardSkeleton";
import { cn } from "@/lib/utils";
import { formatInGameDate } from "@/components/InGameDateInput";
import { ChronicleDate } from "@/components/ChronicleDate";

interface TimelineEvent {
  id: string;
  type: "session" | "plot";
  title: string;
  date: Date;
  description: string | null;
  status?: string;
  priority?: string;
  plotTitle?: string;
  xp?: number | null;
  inGameDate?: string | null;
  inGameSortKey?: string | null; // for sorting by in-game date
}

/**
 * Try to parse a flexible in-game date string into a sortable key.
 * Supports: "1939", "January 1939", "15 March 1939", "March 15, 1939", "1939-01-15", etc.
 */
function parseInGameDateToSortKey(dateStr?: string | null): string | null {
  if (!dateStr?.trim()) return null;
  const s = dateStr.trim();

  // Try ISO / standard date parse
  const direct = new Date(s);
  if (isValid(direct) && s.length > 4) {
    return format(direct, "yyyy-MM-dd");
  }

  // Year only (e.g. "1939")
  const yearOnly = s.match(/^(\d{4})$/);
  if (yearOnly) return `${yearOnly[1]}-01-01`;

  // Month Year (e.g. "January 1939", "Jan 1939")
  const monthYear = s.match(/^([A-Za-z]+)\s+(\d{4})$/);
  if (monthYear) {
    const d = new Date(`${monthYear[1]} 1, ${monthYear[2]}`);
    if (isValid(d)) return format(d, "yyyy-MM-dd");
  }

  // Day Month Year (e.g. "15 March 1939")
  const dayMonthYear = s.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/);
  if (dayMonthYear) {
    const d = new Date(`${dayMonthYear[2]} ${dayMonthYear[1]}, ${dayMonthYear[3]}`);
    if (isValid(d)) return format(d, "yyyy-MM-dd");
  }

  return null;
}

type SortMode = "real" | "in-game";

export default function Timeline() {
  const { sessions, loading: sessionsLoading } = useSessions();
  const { plots, loading: plotsLoading } = usePlots();
  const [filter, setFilter] = useState<"all" | "session" | "plot">("all");
  const [sortMode, setSortMode] = useState<SortMode>("real");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loading = sessionsLoading || plotsLoading;

  const plotMap = useMemo(() => {
    const map = new Map<string, string>();
    plots.forEach((p) => map.set(p.id, p.title));
    return map;
  }, [plots]);

  const events = useMemo<TimelineEvent[]>(() => {
    const items: TimelineEvent[] = [];

    sessions.forEach((s) => {
      const d = parseISO(s.date_played);
      if (!isValid(d)) return;
      const inGameDisplay = formatInGameDate(s.in_game_date_start, s.in_game_date_end);
      items.push({
        id: s.id,
        type: "session",
        title: s.title,
        date: d,
        description: s.summary,
        plotTitle: s.plot_id ? plotMap.get(s.plot_id) : undefined,
        xp: s.experience_awarded,
        inGameDate: inGameDisplay,
        inGameSortKey: parseInGameDateToSortKey(s.in_game_date_start),
      });
    });

    plots.forEach((p) => {
      const d = parseISO(p.created_at);
      if (!isValid(d)) return;
      const inGameDisplay = formatInGameDate(p.in_game_date_start, p.in_game_date_end);
      items.push({
        id: p.id,
        type: "plot",
        title: p.title,
        date: d,
        description: p.description,
        status: p.status,
        priority: p.priority,
        inGameDate: inGameDisplay,
        inGameSortKey: parseInGameDateToSortKey(p.in_game_date_start),
      });
    });

    if (sortMode === "in-game") {
      // Items with in-game dates first (sorted), then items without (by real date)
      const withDate = items.filter((e) => e.inGameSortKey);
      const withoutDate = items.filter((e) => !e.inGameSortKey);
      withDate.sort((a, b) => a.inGameSortKey!.localeCompare(b.inGameSortKey!));
      withoutDate.sort((a, b) => b.date.getTime() - a.date.getTime());
      return [...withDate, ...withoutDate];
    }

    items.sort((a, b) => b.date.getTime() - a.date.getTime());
    return items;
  }, [sessions, plots, plotMap, sortMode]);

  const filtered = filter === "all" ? events : events.filter((e) => e.type === filter);

  // Group by month-year (real date or in-game date label)
  const grouped = useMemo(() => {
    const groups = new Map<string, TimelineEvent[]>();
    filtered.forEach((e) => {
      let key: string;
      if (sortMode === "in-game" && e.inGameSortKey) {
        const d = parseISO(e.inGameSortKey);
        key = isValid(d) ? format(d, "MMMM yyyy") : "Unknown Date";
      } else {
        key = format(e.date, "MMMM yyyy");
      }
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(e);
    });
    return groups;
  }, [filtered, sortMode]);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold font-[var(--font-gothic)] text-foreground">Timeline</h1>
        <div className="space-y-4">
          <SessionCardSkeleton />
          <SessionCardSkeleton />
          <SessionCardSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-[var(--font-gothic)] text-foreground">Timeline</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Chronological view of your chronicle's sessions and stories
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={sortMode} onValueChange={(v) => setSortMode(v as SortMode)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="real">Real-world date</SelectItem>
              <SelectItem value="in-game">In-game date</SelectItem>
            </SelectContent>
          </Select>
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Events</SelectItem>
              <SelectItem value="session">Sessions</SelectItem>
              <SelectItem value="plot">Stories</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No events yet</h3>
          <p className="text-muted-foreground text-sm">
            Create sessions or stories to see them on the timeline.
          </p>
        </Card>
      ) : (
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-[19px] top-0 bottom-0 w-px bg-border hidden sm:block" />

          <div className="space-y-8">
            {Array.from(grouped.entries()).map(([monthYear, monthEvents]) => (
              <div key={monthYear}>
                {/* Month header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="relative z-10 w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-[var(--shadow-crimson)]">
                    <Calendar className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <h2 className="text-lg font-bold font-[var(--font-gothic)] text-foreground">
                    {monthYear}
                  </h2>
                  <Badge variant="secondary" className="text-xs">
                    {monthEvents.length} event{monthEvents.length !== 1 ? "s" : ""}
                  </Badge>
                </div>

                {/* Events in this month */}
                <div className="space-y-3 sm:pl-[52px]">
                  {monthEvents.map((event) => {
                    const isExpanded = expandedId === event.id;
                    const Icon = event.type === "session" ? Scroll : BookOpen;

                    return (
                      <Card
                        key={event.id}
                        className={cn(
                          "p-4 transition-all duration-200 cursor-pointer hover:border-primary/40",
                          isExpanded && "border-primary/50"
                        )}
                        onClick={() => setExpandedId(isExpanded ? null : event.id)}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={cn(
                              "mt-0.5 w-8 h-8 rounded-md flex items-center justify-center shrink-0",
                              event.type === "session"
                                ? "bg-primary/15 text-primary"
                                : "bg-accent/15 text-accent"
                            )}
                          >
                            <Icon className="h-4 w-4" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-foreground truncate">
                                {event.title}
                              </span>
                              <Badge
                                variant="outline"
                                className="text-[10px] uppercase tracking-wider shrink-0"
                              >
                                {event.type}
                              </Badge>
                              {event.status && (
                                <Badge variant="secondary" className="text-[10px] shrink-0">
                                  {event.status}
                                </Badge>
                              )}
                              {event.priority && (
                                <Badge
                                  variant={
                                    event.priority === "High"
                                      ? "destructive"
                                      : "secondary"
                                  }
                                  className="text-[10px] shrink-0"
                                >
                                  {event.priority}
                                </Badge>
                              )}
                            </div>

                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                              <ChronicleDate value={event.date} />
                              {event.inGameDate && (
                                <ChronicleDate
                                  inGameStart={event.inGameDate}
                                  withIcon
                                />
                              )}
                              {event.plotTitle && (
                                <span className="truncate">
                                  Story: {event.plotTitle}
                                </span>
                              )}
                              {event.xp != null && event.xp > 0 && (
                                <span>+{event.xp} XP</span>
                              )}
                            </div>

                            {isExpanded && event.description && (
                              <div className="mt-3 text-sm text-muted-foreground whitespace-pre-line border-t border-border pt-3">
                                <MentionText text={event.description} />
                              </div>
                            )}
                          </div>

                          <Button variant="ghost" size="icon" className="shrink-0 h-7 w-7">
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
