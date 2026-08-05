import { systemPrompts } from './ollama';

interface GeminiResponse {
  content: string;
  parsed: any | null;
  contentType: string;
}

export const GOOGLE_MODELS = [
  { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash (fast, cheap)' },
  { value: 'gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash Lite (fastest)' },
  { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro (best quality)' },
];

function cleanJsonResponse(content: string): string {
  let cleaned = content.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3);
  }
  return cleaned.trim();
}

function systemPromptFor(contentType: string): string {
  if (contentType === 'bulk-npc') {
    return `${systemPrompts.npc}
- IMPORTANT: This NPC is part of a group. Make them distinct from the other members. Give them a unique name, personality, and role within the group.`;
  }
  return systemPrompts[contentType] || systemPrompts.scene;
}

function friendlyError(status: number, body: string): Error {
  if (status === 400) {
    return new Error('Google rejected the request — check that your API key is valid and has the Generative Language API enabled.');
  }
  if (status === 401 || status === 403) {
    return new Error('Google denied access — your API key may be invalid, restricted, or lacking permission.');
  }
  if (status === 429) {
    return new Error('Google quota/rate limit reached for your API key. Wait a moment or check your quota in Google AI Studio.');
  }
  return new Error(`Google AI error (${status}): ${body.slice(0, 300)}`);
}

export async function generateWithGoogle(
  prompt: string,
  contentType: string,
  apiKey: string,
  model: string
): Promise<GeminiResponse> {
  if (!apiKey.trim()) {
    throw new Error('No Google API key configured. Add one in Settings > AI Generator.');
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    model || 'gemini-2.5-flash'
  )}:generateContent`;

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey.trim(),
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPromptFor(contentType) }] },
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json' },
      }),
    });
  } catch {
    throw new Error('Could not reach Google AI. Check your internet connection.');
  }

  if (!response.ok) {
    throw friendlyError(response.status, await response.text());
  }

  const data = await response.json();
  let content: string | undefined = data?.candidates?.[0]?.content?.parts
    ?.map((p: { text?: string }) => p.text ?? '')
    .join('');

  if (!content) {
    throw new Error('No content generated from Google AI.');
  }

  content = cleanJsonResponse(content);

  let parsedContent: any = null;
  try {
    parsedContent = JSON.parse(content);
    content = JSON.stringify(parsedContent, null, 2);
  } catch {
    // Return raw content if parsing fails
  }

  return { content, parsed: parsedContent, contentType };
}

/** Lightweight key check used by the "Test key" button in Settings. */
export async function testGoogleKey(apiKey: string, model: string): Promise<void> {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    model || 'gemini-2.5-flash'
  )}:generateContent`;

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey.trim(),
      },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: 'Reply with the single word: ok' }] }],
      }),
    });
  } catch {
    throw new Error('Could not reach Google AI. Check your internet connection.');
  }

  if (!response.ok) {
    throw friendlyError(response.status, await response.text());
  }
}
