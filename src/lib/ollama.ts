// Templates matching the import schema
export const characterTemplate = {
  name: "Character Name",
  clan: "Brujah",
  generation: 13,
  type: "NPC",
  status: "Active",
  concept: "",
  sire: "",
  predator_type: "",
  ambition: "",
  desire: "",
  resonance: "",
  appearance: "",
  distinguishing_features: "",
  history: "",
  notes: "",
  strength: 2,
  dexterity: 2,
  stamina: 2,
  charisma: 2,
  manipulation: 2,
  composure: 2,
  intelligence: 2,
  wits: 2,
  resolve: 2,
  skills: {
    athletics: 0, brawl: 0, craft: 0, drive: 0, firearms: 0, melee: 0,
    larceny: 0, stealth: 0, survival: 0, animal_ken: 0, etiquette: 0,
    insight: 0, intimidation: 0, leadership: 0, performance: 0, persuasion: 0,
    streetwise: 0, subterfuge: 0, academics: 0, awareness: 0, finance: 0,
    investigation: 0, medicine: 0, occult: 0, politics: 0, science: 0, technology: 0
  },
  disciplines: [],
  advantages: [],
  flaws: [],
  convictions: [],
  touchstones: [],
  loresheets: [],
  blood_potency: 1,
  humanity: 7,
  hunger: 1,
  experience_total: 0,
  experience_spent: 0
};

export const storyTemplate = {
  title: "Story Title",
  description: "",
  status: "Active",
  priority: "Medium"
};

export const systemPrompts: Record<string, string> = {
  scene: `You are a creative writer for Vampire: The Masquerade 5th Edition. Generate a scene that can be saved as a Story/Plot.

Return ONLY valid JSON matching this exact structure (no markdown, no explanation):
${JSON.stringify(storyTemplate, null, 2)}

- "title": A compelling scene title
- "description": A detailed 2-3 paragraph scene description with atmospheric details, sensory elements, and Gothic horror. Include who's present, what's happening, and the tension/stakes.
- "status": Always "Active"
- "priority": "High", "Medium", or "Low" based on urgency`,

  npc: `You are a character designer for Vampire: The Masquerade 5th Edition. Create a detailed NPC character.

Return ONLY valid JSON matching this exact structure (no markdown, no explanation):
${JSON.stringify(characterTemplate, null, 2)}

Requirements:
- Use a valid clan: Human (for mortals), Brujah, Gangrel, Malkavian, Nosferatu, Toreador, Tremere, Ventrue, Caitiff, Thin-Blood, Lasombra, Tzimisce, Hecata, Ravnos, Salubri, Ministry, or Banu Haqim
- For Human characters: set generation to null, omit sire/predator_type/resonance/disciplines/hunger/blood_potency
- Attributes 1-5 (average human is 2)
- Skills 0-5 (0 is untrained)
- Include 1-3 disciplines with appropriate powers for the clan (vampires only)
- predator_type options: None (for humans), Alleycat, Bagger, Blood Leech, Cleaver, Consensualist, Farmer, Graverobber, Osiris, Sandman, Scene Queen, Siren
- resonance options: Choleric, Melancholic, Phlegmatic, Sanguine, Animal, or empty string (vampires only)
- Generation typically 12-16 for modern vampires (null for humans)
- Include meaningful history, appearance, and personality in notes
- Add at least one conviction and touchstone`,

  story: `You are a story writer for Vampire: The Masquerade 5th Edition. Create a compelling story hook/plot.

Return ONLY valid JSON matching this exact structure (no markdown, no explanation):
${JSON.stringify(storyTemplate, null, 2)}

- "title": A catchy, evocative title
- "description": A detailed plot summary (3-4 paragraphs) including:
  * The hook/premise
  * Key NPCs involved and their motivations
  * 2-3 complications or twists
  * Potential revelations or outcomes
  * How it connects to Kindred politics/society
- "status": Always "Active"
- "priority": "High", "Medium", or "Low" based on plot importance`,

  location: `You are a location designer for Vampire: The Masquerade 5th Edition. Create a detailed location.

Return ONLY valid JSON matching this exact structure (no markdown, no explanation):
${JSON.stringify(storyTemplate, null, 2)}

- "title": The location name
- "description": A detailed description (3-4 paragraphs) including:
  * Type (haven, Elysium, feeding ground, mortal business, etc.)
  * Atmospheric description with Gothic elements
  * Key areas and features
  * Security measures and access
  * Notable NPCs who frequent it
  * Potential story hooks connected to this location
- "status": Always "Active"
- "priority": "Medium"`
};

interface OllamaResponse {
  content: string;
  parsed: any | null;
  contentType: string;
}

function cleanJsonResponse(content: string): string {
  let cleaned = content.trim();
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith("```")) {
    cleaned = cleaned.slice(0, -3);
  }
  return cleaned.trim();
}

export async function generateWithOllama(
  prompt: string,
  contentType: string,
  ollamaUrl: string,
  ollamaModel: string
): Promise<OllamaResponse> {
  const systemPrompt = systemPrompts[contentType] || systemPrompts.scene;

  const response = await fetch(`${ollamaUrl}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: ollamaModel,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt }
      ],
      stream: false,
      format: "json"
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Ollama error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  let content = data.message?.content;

  if (!content) {
    throw new Error("No content generated from Ollama");
  }

  content = cleanJsonResponse(content);

  let parsedContent = null;
  try {
    parsedContent = JSON.parse(content);
    content = JSON.stringify(parsedContent, null, 2);
  } catch {
    // Return raw content if parsing fails
  }

  return {
    content,
    parsed: parsedContent,
    contentType
  };
}
