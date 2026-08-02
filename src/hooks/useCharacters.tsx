import { useEntityCrud } from './useEntityCrud';

// Dice Pool types for Storyteller Characters
export interface SimpleDicePool {
  type: 'simple';
  difficulty: number;
}

export interface GeneralDicePool {
  type: 'general';
  primary: number;
  secondary: number;
}

export interface ExceptionalPool {
  name: string;
  pool: number;
}

export interface StandardDicePool {
  type: 'standard';
  physical: number;
  social: number;
  mental: number;
  exceptional: ExceptionalPool[];
}

export interface CombinedDicePool {
  type: 'combined';
  general: { primary: number; secondary: number };
  standard: { physical: number; social: number; mental: number; exceptional: ExceptionalPool[] };
}

export type DicePoolConfig = SimpleDicePool | GeneralDicePool | StandardDicePool | CombinedDicePool;

export interface Character {
  id: string;
  name: string;
  clan: string;
  generation: number | null;
  type: 'PC' | 'NPC';
  status: string;
  concept: string | null;
  sire: string | null;
  coterie: string | null;
  avatar_url: string | null;
  chronicle_id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  attachments?: Array<{ id: string; name: string; url: string; type: string; size: number; uploaded_at: string }>;

  use_dice_pools?: boolean;
  skip_attributes?: boolean;
  dice_pools?: DicePoolConfig | null;

  strength?: number;
  dexterity?: number;
  stamina?: number;
  charisma?: number;
  manipulation?: number;
  composure?: number;
  intelligence?: number;
  wits?: number;
  resolve?: number;

  skills?: Record<string, { rating: number; specialty?: string }>;
  disciplines?: Array<{ name: string; level: number }>;
  powers?: Array<{ name: string; discipline: string; level: number; cost?: string; description?: string }>;

  predator_type?: string;
  chronicle_tenets?: string[];

  advantages?: Array<{ name: string; type: string; rating?: number; description?: string }>;
  flaws?: Array<{ name: string; rating?: number; description?: string }>;
  loresheets?: Array<{ name: string; benefits: string[] }>;

  convictions?: string[];
  touchstones?: Array<{ name: string; conviction?: string; description?: string }>;
  ambition?: string;
  desire?: string;

  health_max?: number;
  health_superficial?: number;
  health_aggravated?: number;
  willpower_max?: number;
  willpower_superficial?: number;
  willpower_aggravated?: number;
  humanity?: number;
  hunger?: number;
  blood_potency?: number;

  experience_total?: number;
  experience_spent?: number;

  appearance?: string;
  distinguishing_features?: string;
  history?: string;
  notes?: string;
  resonance?: string;
}

export function useCharacters() {
  const { items: characters, loading, create, update, remove, refetch } = useEntityCrud<Character>({
    table: 'characters',
    queryKey: 'characters',
    label: 'Character',
    orderBy: { column: 'created_at', ascending: false },
    transform: (row: any) => ({ ...row, attachments: row.attachments || [] }),
  });

  const createCharacter = async (character: Omit<Character, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    return create(character);
  };

  const updateCharacter = async (id: string, updates: Partial<Character>) => {
    return update(id, updates);
  };

  const deleteCharacter = async (id: string) => {
    return remove(id);
  };

  return {
    characters,
    loading,
    createCharacter,
    updateCharacter,
    deleteCharacter,
    refetch,
  };
}
