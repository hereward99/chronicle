import { useState, useMemo, useCallback } from 'react';
import { useCharacters } from '@/hooks/useCharacters';
import { usePlots } from '@/hooks/usePlots';
import { useSessions } from '@/hooks/useSessions';
import { useNotes } from '@/hooks/useNotes';
import { useFactions } from '@/hooks/useFactions';
import { useCoteries } from '@/hooks/useCoteries';
 import { useLocations } from '@/hooks/useLocations';
import { MentionType } from '@/lib/mentions';

export interface MentionOption {
  id: string;
  name: string;
  type: MentionType;
  subtitle?: string;
}

export function useMentionSearch() {
  const { characters } = useCharacters();
  const { plots } = usePlots();
  const { sessions } = useSessions();
  const { notes } = useNotes();
  const { factions } = useFactions();
  const { coteries } = useCoteries();
   const { locations } = useLocations();

  // Build searchable options from all entities
  const allOptions = useMemo((): MentionOption[] => {
    const options: MentionOption[] = [];

    // Characters
    characters.forEach(char => {
      options.push({
        id: char.id,
        name: char.name,
        type: 'character',
        subtitle: char.clan,
      });
    });

    // Plots/Stories
    plots.forEach(plot => {
      options.push({
        id: plot.id,
        name: plot.title,
        type: 'plot',
        subtitle: plot.status,
      });
    });

    // Sessions
    sessions.forEach(session => {
      options.push({
        id: session.id,
        name: session.title,
        type: 'session',
        subtitle: session.date_played,
      });
    });

    // Notes
    notes.forEach(note => {
      options.push({
        id: note.id,
        name: note.title,
        type: 'note',
        subtitle: note.category || undefined,
      });
    });

    // Factions
    factions.forEach(faction => {
      options.push({
        id: faction.id,
        name: faction.name,
        type: 'faction',
        subtitle: 'Faction',
      });
    });

    // Coteries
    coteries.forEach(coterie => {
      options.push({
        id: coterie.id,
        name: coterie.name,
        type: 'coterie',
        subtitle: coterie.domain || 'Coterie',
      });
    });

     // Locations
     locations.forEach(location => {
       options.push({
         id: location.id,
         name: location.name,
         type: 'location',
         subtitle: 'Location',
       });
     });
 
    return options;
   }, [characters, plots, sessions, notes, factions, coteries, locations]);

  const search = useCallback((query: string, limit = 50): MentionOption[] => {
    if (!query.trim()) return allOptions.slice(0, limit);

    const lowerQuery = query.toLowerCase();
    
    return allOptions
      .filter(option => 
        option.name.toLowerCase().includes(lowerQuery) ||
        option.subtitle?.toLowerCase().includes(lowerQuery)
      )
      .slice(0, limit);
  }, [allOptions]);

  return {
    search,
    allOptions,
  };
}
