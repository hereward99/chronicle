// Mention syntax: @[Display Name](type:uuid)
// Example: @[Marcus Blackwood](character:abc123)

export type MentionType = 'character' | 'plot' | 'session' | 'note' | 'faction' | 'coterie';

export interface Mention {
  raw: string;
  name: string;
  type: MentionType;
  id: string;
}

export interface TextSegment {
  type: 'text' | 'mention';
  content: string;
  mention?: Mention;
}

// Regex to match @[Name](type:id)
const MENTION_REGEX = /@\[([^\]]+)\]\((\w+):([a-f0-9-]+)\)/g;

/**
 * Parse text containing mentions into segments
 */
export function parseMentions(text: string): TextSegment[] {
  if (!text) return [];
  
  const segments: TextSegment[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  
  // Reset regex state
  MENTION_REGEX.lastIndex = 0;
  
  while ((match = MENTION_REGEX.exec(text)) !== null) {
    // Add text before this match
    if (match.index > lastIndex) {
      segments.push({
        type: 'text',
        content: text.slice(lastIndex, match.index),
      });
    }
    
    // Add the mention
    segments.push({
      type: 'mention',
      content: match[0],
      mention: {
        raw: match[0],
        name: match[1],
        type: match[2] as MentionType,
        id: match[3],
      },
    });
    
    lastIndex = match.index + match[0].length;
  }
  
  // Add remaining text
  if (lastIndex < text.length) {
    segments.push({
      type: 'text',
      content: text.slice(lastIndex),
    });
  }
  
  return segments;
}

/**
 * Create a mention string
 */
export function createMention(name: string, type: MentionType, id: string): string {
  return `@[${name}](${type}:${id})`;
}

/**
 * Extract all mentions from text
 */
export function extractMentions(text: string): Mention[] {
  if (!text) return [];
  
  const mentions: Mention[] = [];
  let match: RegExpExecArray | null;
  
  MENTION_REGEX.lastIndex = 0;
  
  while ((match = MENTION_REGEX.exec(text)) !== null) {
    mentions.push({
      raw: match[0],
      name: match[1],
      type: match[2] as MentionType,
      id: match[3],
    });
  }
  
  return mentions;
}

/**
 * Check if text contains any mentions
 */
export function hasMentions(text: string): boolean {
  if (!text) return false;
  MENTION_REGEX.lastIndex = 0;
  return MENTION_REGEX.test(text);
}
