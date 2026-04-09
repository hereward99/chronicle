// V5 Disciplines and Powers — comprehensive reference data
// Sources: Core Rulebook, Camarilla, Anarch, Chicago by Night,
// Cults of the Blood Gods, The Chicago Folios, Sabbat, 
// Blood Sigils, Children of the Blood, Players Guide

export const DISCIPLINES = [
  "Animalism",
  "Auspex",
  "Blood Sorcery",
  "Celerity",
  "Dominate",
  "Fortitude",
  "Obfuscate",
  "Oblivion",
  "Potence",
  "Presence",
  "Protean",
  "Thin-Blood Alchemy",
] as const;

export type DisciplineName = typeof DISCIPLINES[number];

export interface PowerInfo {
  name: string;
  level: number;
  discipline: string;
  /** Sourcebook abbreviation: CR = Core Rulebook, CAM = Camarilla, AN = Anarch, CBN = Chicago by Night, COTBG = Cults of the Blood Gods, SAB = Sabbat, BS = Blood Sigils, PG = Players Guide, COTB = Children of the Blood */
  source?: string;
  /** Amalgam discipline requirement, if any */
  amalgam?: string;
  /** Prerequisite power, if any */
  prerequisite?: string;
}

/**
 * Comprehensive V5 powers by discipline.
 * Includes Core Rulebook + major sourcebook expansions.
 */
export const DISCIPLINE_POWERS: Record<string, PowerInfo[]> = {
  "Animalism": [
    // Core Rulebook
    { name: "Bond Famulus", level: 1, discipline: "Animalism", source: "CR" },
    { name: "Sense the Beast", level: 1, discipline: "Animalism", source: "CR" },
    { name: "Feral Whispers", level: 2, discipline: "Animalism", source: "CR" },
    { name: "Animal Succulence", level: 3, discipline: "Animalism", source: "CR" },
    { name: "Quell the Beast", level: 3, discipline: "Animalism", source: "CR" },
    { name: "Subsume the Spirit", level: 4, discipline: "Animalism", source: "CR" },
    { name: "Unliving Hive", level: 4, discipline: "Animalism", source: "CR" },
    { name: "Drawing Out the Beast", level: 5, discipline: "Animalism", source: "CR" },
    // Sourcebook additions
    { name: "Atavism", level: 2, discipline: "Animalism", source: "PG" },
    { name: "Bestial Identity", level: 3, discipline: "Animalism", source: "PG", amalgam: "Protean 2" },
    { name: "Coursing Terror", level: 3, discipline: "Animalism", source: "PG", amalgam: "Presence 2" },
    { name: "Call the Wild", level: 4, discipline: "Animalism", source: "PG" },
    { name: "Pestilence", level: 4, discipline: "Animalism", source: "COTBG" },
  ],
  "Auspex": [
    { name: "Heightened Senses", level: 1, discipline: "Auspex", source: "CR" },
    { name: "Sense the Unseen", level: 1, discipline: "Auspex", source: "CR" },
    { name: "Premonition", level: 2, discipline: "Auspex", source: "CR" },
    { name: "Scry the Soul", level: 3, discipline: "Auspex", source: "CR" },
    { name: "Share the Senses", level: 3, discipline: "Auspex", source: "CR" },
    { name: "Spirit's Touch", level: 4, discipline: "Auspex", source: "CR" },
    { name: "Clairvoyance", level: 5, discipline: "Auspex", source: "CR" },
    { name: "Possession", level: 5, discipline: "Auspex", source: "CR", amalgam: "Dominate 3" },
    { name: "Telepathy", level: 5, discipline: "Auspex", source: "CR" },
    // Sourcebook additions
    { name: "Obeah", level: 3, discipline: "Auspex", source: "COTBG", amalgam: "Fortitude 1" },
    { name: "Unburdening the Bestial Soul", level: 4, discipline: "Auspex", source: "COTBG", amalgam: "Dominate 2" },
    { name: "The Muse's Whisper", level: 3, discipline: "Auspex", source: "PG" },
    { name: "Predict", level: 4, discipline: "Auspex", source: "PG" },
  ],
  "Blood Sorcery": [
    { name: "Corrosive Vitae", level: 1, discipline: "Blood Sorcery", source: "CR" },
    { name: "A Taste for Blood", level: 1, discipline: "Blood Sorcery", source: "CR" },
    { name: "Extinguish Vitae", level: 2, discipline: "Blood Sorcery", source: "CR" },
    { name: "Blood of Potency", level: 3, discipline: "Blood Sorcery", source: "CR" },
    { name: "Scorpion's Touch", level: 3, discipline: "Blood Sorcery", source: "CR" },
    { name: "Theft of Vitae", level: 4, discipline: "Blood Sorcery", source: "CR" },
    { name: "Baal's Caress", level: 5, discipline: "Blood Sorcery", source: "CR" },
    { name: "Cauldron of Blood", level: 5, discipline: "Blood Sorcery", source: "CR" },
    // Rituals and sourcebook additions
    { name: "Shape the Sanguine Sacrament", level: 2, discipline: "Blood Sorcery", source: "BS" },
    { name: "Haze of Passions", level: 3, discipline: "Blood Sorcery", source: "BS", amalgam: "Presence 2" },
    { name: "One with the Blade", level: 4, discipline: "Blood Sorcery", source: "PG" },
  ],
  "Celerity": [
    { name: "Cat's Grace", level: 1, discipline: "Celerity", source: "CR" },
    { name: "Rapid Reflexes", level: 1, discipline: "Celerity", source: "CR" },
    { name: "Fleetness", level: 2, discipline: "Celerity", source: "CR" },
    { name: "Blink", level: 3, discipline: "Celerity", source: "CR" },
    { name: "Traversal", level: 3, discipline: "Celerity", source: "CR" },
    { name: "Draught of Elegance", level: 4, discipline: "Celerity", source: "CR" },
    { name: "Unerring Aim", level: 4, discipline: "Celerity", source: "CR" },
    { name: "Lightning Strike", level: 5, discipline: "Celerity", source: "CR" },
    { name: "Split Second", level: 5, discipline: "Celerity", source: "CR" },
    // Sourcebook additions
    { name: "Weaving", level: 3, discipline: "Celerity", source: "PG", amalgam: "Auspex 2" },
    { name: "Bullet Time", level: 4, discipline: "Celerity", source: "PG" },
  ],
  "Dominate": [
    { name: "Cloud Memory", level: 1, discipline: "Dominate", source: "CR" },
    { name: "Compel", level: 1, discipline: "Dominate", source: "CR" },
    { name: "Mesmerize", level: 2, discipline: "Dominate", source: "CR" },
    { name: "Dementation", level: 3, discipline: "Dominate", source: "CR", amalgam: "Obfuscate 2" },
    { name: "The Forgetful Mind", level: 3, discipline: "Dominate", source: "CR" },
    { name: "Submerged Directive", level: 4, discipline: "Dominate", source: "CR" },
    { name: "Mass Manipulation", level: 5, discipline: "Dominate", source: "CR" },
    { name: "Terminal Decree", level: 5, discipline: "Dominate", source: "CR" },
    // Sourcebook additions
    { name: "Slavish Devotion", level: 3, discipline: "Dominate", source: "PG" },
    { name: "Rationalize", level: 4, discipline: "Dominate", source: "AN" },
  ],
  "Fortitude": [
    { name: "Resilience", level: 1, discipline: "Fortitude", source: "CR" },
    { name: "Unswayable Mind", level: 1, discipline: "Fortitude", source: "CR" },
    { name: "Toughness", level: 2, discipline: "Fortitude", source: "CR" },
    { name: "Defy Bane", level: 3, discipline: "Fortitude", source: "CR" },
    { name: "Fortify the Inner Facade", level: 3, discipline: "Fortitude", source: "CR" },
    { name: "Draught of Endurance", level: 4, discipline: "Fortitude", source: "CR" },
    { name: "Flesh of Marble", level: 5, discipline: "Fortitude", source: "CR" },
    { name: "Prowess from Pain", level: 5, discipline: "Fortitude", source: "CR" },
    // Sourcebook additions
    { name: "Valeren", level: 3, discipline: "Fortitude", source: "COTBG", amalgam: "Auspex 1" },
    { name: "Armor of the Beast's Hide", level: 4, discipline: "Fortitude", source: "PG", amalgam: "Protean 2" },
    { name: "Seal the Beast's Maw", level: 4, discipline: "Fortitude", source: "PG" },
  ],
  "Obfuscate": [
    { name: "Cloak of Shadows", level: 1, discipline: "Obfuscate", source: "CR" },
    { name: "Silence of Death", level: 1, discipline: "Obfuscate", source: "CR" },
    { name: "Unseen Passage", level: 2, discipline: "Obfuscate", source: "CR" },
    { name: "Ghost in the Machine", level: 3, discipline: "Obfuscate", source: "CR" },
    { name: "Mask of a Thousand Faces", level: 3, discipline: "Obfuscate", source: "CR" },
    { name: "Conceal", level: 4, discipline: "Obfuscate", source: "CR" },
    { name: "Vanish", level: 4, discipline: "Obfuscate", source: "CR" },
    { name: "Cloak the Gathering", level: 5, discipline: "Obfuscate", source: "CR" },
    { name: "Imposter's Guise", level: 5, discipline: "Obfuscate", source: "CR" },
    // Sourcebook additions
    { name: "Chimerstry", level: 2, discipline: "Obfuscate", source: "COTBG", amalgam: "Presence 1" },
    { name: "Fata Morgana", level: 3, discipline: "Obfuscate", source: "COTBG", amalgam: "Presence 2" },
    { name: "Mental Maze", level: 5, discipline: "Obfuscate", source: "PG", amalgam: "Dominate 1" },
  ],
  "Oblivion": [
    // Oblivion Ceremonies & Shadow powers (Core + Cults of the Blood Gods)
    { name: "Ashes to Ashes", level: 1, discipline: "Oblivion", source: "CR" },
    { name: "Oblivion's Sight", level: 1, discipline: "Oblivion", source: "CR" },
    { name: "Shadow Cloak", level: 1, discipline: "Oblivion", source: "CR" },
    { name: "The Binding Fetter", level: 1, discipline: "Oblivion", source: "CR" },
    { name: "Arms of Ahriman", level: 2, discipline: "Oblivion", source: "CR" },
    { name: "Shadow Cast", level: 2, discipline: "Oblivion", source: "CR" },
    { name: "Where the Shroud Thins", level: 2, discipline: "Oblivion", source: "CR" },
    { name: "Aura of Decay", level: 3, discipline: "Oblivion", source: "CR" },
    { name: "Passion Feast", level: 3, discipline: "Oblivion", source: "CR" },
    { name: "Shadow Perspective", level: 3, discipline: "Oblivion", source: "CR" },
    { name: "Touch of Oblivion", level: 3, discipline: "Oblivion", source: "CR" },
    { name: "Necrotic Plague", level: 4, discipline: "Oblivion", source: "CR" },
    { name: "Stygian Shroud", level: 4, discipline: "Oblivion", source: "CR" },
    { name: "Tenebrous Avatar", level: 4, discipline: "Oblivion", source: "CR" },
    { name: "Withering Spirit", level: 5, discipline: "Oblivion", source: "CR" },
    { name: "Skuld Fulfilled", level: 5, discipline: "Oblivion", source: "CR" },
    { name: "Shadow Step", level: 5, discipline: "Oblivion", source: "CR" },
    // Sourcebook additions
    { name: "The Ghostly Presence", level: 3, discipline: "Oblivion", source: "COTBG" },
    { name: "Lure of the Grave", level: 4, discipline: "Oblivion", source: "COTBG" },
  ],
  "Potence": [
    { name: "Lethal Body", level: 1, discipline: "Potence", source: "CR" },
    { name: "Soaring Leap", level: 1, discipline: "Potence", source: "CR" },
    { name: "Prowess", level: 2, discipline: "Potence", source: "CR" },
    { name: "Brutal Feed", level: 3, discipline: "Potence", source: "CR" },
    { name: "Uncanny Grip", level: 3, discipline: "Potence", source: "CR" },
    { name: "Draught of Might", level: 4, discipline: "Potence", source: "CR" },
    { name: "Earthshock", level: 5, discipline: "Potence", source: "CR" },
    { name: "Fist of Caine", level: 5, discipline: "Potence", source: "CR" },
    // Sourcebook additions
    { name: "Savage Thrust", level: 3, discipline: "Potence", source: "PG" },
    { name: "Megastrike", level: 4, discipline: "Potence", source: "PG" },
  ],
  "Presence": [
    { name: "Awe", level: 1, discipline: "Presence", source: "CR" },
    { name: "Daunt", level: 1, discipline: "Presence", source: "CR" },
    { name: "Lingering Kiss", level: 2, discipline: "Presence", source: "CR" },
    { name: "Dread Gaze", level: 3, discipline: "Presence", source: "CR" },
    { name: "Entrancement", level: 3, discipline: "Presence", source: "CR" },
    { name: "Irresistible Voice", level: 4, discipline: "Presence", source: "CR" },
    { name: "Summon", level: 4, discipline: "Presence", source: "CR" },
    { name: "Majesty", level: 5, discipline: "Presence", source: "CR" },
    { name: "Star Magnetism", level: 5, discipline: "Presence", source: "CR" },
    // Sourcebook additions
    { name: "Spark of Rage", level: 3, discipline: "Presence", source: "AN" },
    { name: "No Trace", level: 3, discipline: "Presence", source: "PG", amalgam: "Obfuscate 2" },
  ],
  "Protean": [
    { name: "Eyes of the Beast", level: 1, discipline: "Protean", source: "CR" },
    { name: "Weight of the Feather", level: 1, discipline: "Protean", source: "CR" },
    { name: "Feral Weapons", level: 2, discipline: "Protean", source: "CR" },
    { name: "Earth Meld", level: 3, discipline: "Protean", source: "CR" },
    { name: "Shapechange", level: 3, discipline: "Protean", source: "CR" },
    { name: "Metamorphosis", level: 4, discipline: "Protean", source: "CR" },
    { name: "Mist Form", level: 5, discipline: "Protean", source: "CR" },
    { name: "The Unfettered Heart", level: 5, discipline: "Protean", source: "CR" },
    // Sourcebook additions (including Vicissitude amalgams for Tzimisce)
    { name: "Vicissitude", level: 2, discipline: "Protean", source: "COTBG", amalgam: "Dominate 2" },
    { name: "Fleshcrafting", level: 3, discipline: "Protean", source: "COTBG", amalgam: "Dominate 2" },
    { name: "Horrid Form", level: 4, discipline: "Protean", source: "COTBG", amalgam: "Dominate 2" },
    { name: "One with the Land", level: 5, discipline: "Protean", source: "COTBG" },
  ],
  "Thin-Blood Alchemy": [
    { name: "Far Reach", level: 1, discipline: "Thin-Blood Alchemy", source: "CR" },
    { name: "Haze", level: 1, discipline: "Thin-Blood Alchemy", source: "CR" },
    { name: "Envelop", level: 2, discipline: "Thin-Blood Alchemy", source: "CR" },
    { name: "Profane Hieros Gamos", level: 2, discipline: "Thin-Blood Alchemy", source: "CR" },
    { name: "Airborne Momentum", level: 3, discipline: "Thin-Blood Alchemy", source: "CR" },
    { name: "Defractionate", level: 3, discipline: "Thin-Blood Alchemy", source: "CR" },
    { name: "Awaken the Sleeper", level: 4, discipline: "Thin-Blood Alchemy", source: "CR" },
    { name: "Cauldron of Rebirth", level: 5, discipline: "Thin-Blood Alchemy", source: "CR" },
  ],
};

/**
 * Get powers available for a discipline, optionally filtered by max level.
 */
export function getPowersForDiscipline(discipline: string, maxLevel?: number): PowerInfo[] {
  const powers = DISCIPLINE_POWERS[discipline] || [];
  if (maxLevel !== undefined) {
    return powers.filter(p => p.level <= maxLevel);
  }
  return powers;
}

/**
 * Get a flat list of power names for a discipline up to a given level.
 * Used for backward compatibility with the wizard's simpler format.
 */
export function getPowerNamesForDiscipline(discipline: string, maxLevel: number): string[] {
  return getPowersForDiscipline(discipline, maxLevel).map(p => p.name);
}

/**
 * Get a flat Record<string, Record<number, string[]>> for backward compat with wizard.
 */
export function getDisciplinePowersLegacy(): Record<string, Record<number, string[]>> {
  const result: Record<string, Record<number, string[]>> = {};
  for (const [discipline, powers] of Object.entries(DISCIPLINE_POWERS)) {
    result[discipline] = {};
    for (const power of powers) {
      if (!result[discipline][power.level]) {
        result[discipline][power.level] = [];
      }
      result[discipline][power.level].push(power.name);
    }
  }
  return result;
}

/**
 * Get PowerInfo by name (case-insensitive search across all disciplines).
 */
export function findPowerByName(name: string): PowerInfo | undefined {
  const lower = name.toLowerCase();
  for (const powers of Object.values(DISCIPLINE_POWERS)) {
    const found = powers.find(p => p.name.toLowerCase() === lower);
    if (found) return found;
  }
  return undefined;
}
