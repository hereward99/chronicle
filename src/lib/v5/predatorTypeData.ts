// V5 Predator Type Reference Data — Vampire: The Masquerade 5th Edition

export interface PredatorTypeInfo {
  summary: string;
  creationBonuses: string[];
  gameplayEffects: string[];
}

export const PREDATOR_TYPE_DATA: Record<string, PredatorTypeInfo> = {
  Alleycat: {
    summary: "Aggressive hunter who feeds through violence and intimidation in back alleys and dark streets.",
    creationBonuses: [
      "Add one dot of Celerity or Potence",
      "Add one dot of Intimidation or Brawl",
      "Gain Criminal Contacts (••) advantage",
      "Gain Prey Exclusion (•) flaw (e.g. the extorted, the ## helpless)",
    ],
    gameplayEffects: [
      "Humanity starts at 8 (−1 from default)",
      "Feeding style: Aggressive, public-risk hunting — stalking and overpowering victims",
    ],
  },
  Bagger: {
    summary: "Feeds from stolen or acquired blood bags rather than hunting live prey.",
    creationBonuses: [
      "Add one dot of Blood Sorcery or Obfuscate",
      "Add one dot of Larceny or Streetwise",
      "Gain Iron Gullet (•••) merit — can feed from cold or animal blood",
      "Gain Enemy (•) flaw — someone who noticed the blood bag thefts",
    ],
    gameplayEffects: [
      "Feeding style: Steals or procures blood bags from hospitals, blood banks, or the black market",
      "Iron Gullet allows feeding from cold, stale, or animal blood without penalty",
    ],
  },
  "Blood Leech": {
    summary: "Feeds exclusively from other vampires, a dangerous and despised practice.",
    creationBonuses: [
      "Add one dot of Celerity or Protean",
      "Add one dot of Brawl or Stealth",
      "Gain Diablerist (•••) flaw or Dark Secret (•) flaw — feeding from Kindred",
      "Lose one dot of Humanity (starts at 8)",
    ],
    gameplayEffects: [
      "Humanity starts at 8 (−1 from default)",
      "Feeding style: Preys on other vampires — universally reviled if discovered",
      "Cannot reduce Hunger below 2 from mortal blood",
    ],
  },
  Cleaver: {
    summary: "Maintains a mortal family or household and feeds from them, risking the Masquerade.",
    creationBonuses: [
      "Add one dot of Dominate or Animalism",
      "Add one dot of Subterfuge or Persuasion",
      "Gain Herd (•) advantage — the family",
      "Gain Dark Secret (•) flaw — maintaining a mortal family",
    ],
    gameplayEffects: [
      "Feeding style: Feeds from close family or household members",
      "Significant Masquerade risk — authorities or Kindred may investigate the double life",
    ],
  },
  Consensualist: {
    summary: "Feeds only from willing victims who know what they are giving.",
    creationBonuses: [
      "Add one dot of Auspex or Fortitude",
      "Add one dot of Medicine or Persuasion",
      "Gain Masquerade Breaker (•) flaw — willing vessels know about vampires",
      "Gain one extra dot of Humanity (starts at 10)",
    ],
    gameplayEffects: [
      "Humanity starts at 10 (+1 from default)",
      "Feeding style: Consensual — requires willing, aware vessels",
      "Stain on conscience if feeding without consent (ST discretion)",
    ],
  },
  Farmer: {
    summary: "Feeds exclusively from animals, avoiding human blood entirely.",
    creationBonuses: [
      "Add one dot of Animalism or Protean",
      "Add one dot of Animal Ken or Survival",
      "Gain Vegan (••) flaw — animal blood only",
      "Gain one extra dot of Humanity (starts at 10)",
    ],
    gameplayEffects: [
      "Humanity starts at 10 (+1 from default)",
      "Feeding style: Animal blood only — cannot reduce Hunger below 2",
      "Vegan flaw: drinking human blood causes revulsion",
    ],
  },
  Osiris: {
    summary: "Cult leader or celebrity who feeds from devoted followers and fans.",
    creationBonuses: [
      "Add one dot of Blood Sorcery or Presence",
      "Add one dot of Performance or Subterfuge",
      "Gain Fame (•) or Herd (•) advantage — the following",
      "Gain Enemies (•) flaw — a jealous rival or investigator",
    ],
    gameplayEffects: [
      "Feeding style: Feeds from devoted followers, fans, or cult members",
      "Public profile creates both opportunity and Masquerade risk",
    ],
  },
  Sandman: {
    summary: "Feeds from sleeping victims, slipping in and out without their knowledge.",
    creationBonuses: [
      "Add one dot of Auspex or Obfuscate",
      "Add one dot of Medicine or Stealth",
      "Gain Resources (•) advantage",
      "Gain Prey Exclusion (•) flaw (e.g. the awake, the aware)",
    ],
    gameplayEffects: [
      "Feeding style: Breaks into homes and feeds from sleeping victims",
      "Low Masquerade risk but high criminal risk — breaking and entering",
    ],
  },
  "Scene Queen": {
    summary: "Feeds in the context of a social scene — clubs, parties, events — blending feeding with socializing.",
    creationBonuses: [
      "Add one dot of Dominate or Presence",
      "Add one dot of Etiquette or Leadership",
      "Gain Fame (•) or Contact (•) advantage — within the scene",
      "Gain Prey Exclusion (•) flaw (e.g. outside the subculture) or Influence Thin (•) flaw",
    ],
    gameplayEffects: [
      "Feeding style: Feeds within a specific social scene or subculture",
      "Dependent on access to the scene — disruptions cut off feeding",
    ],
  },
  Siren: {
    summary: "Seduces victims and feeds during or after intimate encounters.",
    creationBonuses: [
      "Add one dot of Fortitude or Presence",
      "Add one dot of Persuasion or Subterfuge",
      "Gain Beautiful (••) merit",
      "Gain Enemy (•) flaw — a spurned lover or jealous partner",
    ],
    gameplayEffects: [
      "Feeding style: Seduction — feeds during or after intimate encounters",
      "Dependent on social situations and personal magnetism",
    ],
  },
};

/**
 * Get predator type data, or null for "None" / unknown types
 */
export function getPredatorTypeData(predatorType: string | null | undefined): PredatorTypeInfo | null {
  if (!predatorType || predatorType === "None") return null;
  return PREDATOR_TYPE_DATA[predatorType] ?? null;
}
