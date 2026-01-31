import { useState, useRef, useCallback, useEffect, KeyboardEvent } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { useMentionSearch, MentionOption } from '@/hooks/useMentionSearch';
import { createMention, MentionType } from '@/lib/mentions';
import { cn } from '@/lib/utils';
import { User, BookOpen, Calendar, FileText, Shield, Users } from 'lucide-react';

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  maxLength?: number;
  id?: string;
}

const typeIcons: Record<MentionType, React.ComponentType<{ className?: string }>> = {
  character: User,
  plot: BookOpen,
  session: Calendar,
  note: FileText,
  faction: Shield,
  coterie: Users,
};

const typeLabels: Record<MentionType, string> = {
  character: 'Character',
  plot: 'Story',
  session: 'Session',
  note: 'Note',
  faction: 'Faction',
  coterie: 'Coterie',
};

export function MentionInput({
  value,
  onChange,
  placeholder,
  className,
  maxLength,
  id,
}: MentionInputProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const [mentionStartPos, setMentionStartPos] = useState<number | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  
  const { search } = useMentionSearch();
  const suggestions = search(searchQuery, 8);

  // Find the @ trigger position before cursor
  const findMentionStart = useCallback((text: string, cursorPos: number): number | null => {
    // Look backwards from cursor for @
    for (let i = cursorPos - 1; i >= 0; i--) {
      const char = text[i];
      if (char === '@') {
        // Check if @ is at start or preceded by whitespace
        if (i === 0 || /\s/.test(text[i - 1])) {
          return i;
        }
        return null;
      }
      // Stop if we hit whitespace (no @ in this "word")
      if (/\s/.test(char)) {
        return null;
      }
    }
    return null;
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const newCursorPos = e.target.selectionStart;
    
    onChange(newValue);
    setCursorPosition(newCursorPos);
    
    // Check for @ trigger
    const mentionStart = findMentionStart(newValue, newCursorPos);
    
    if (mentionStart !== null) {
      const query = newValue.slice(mentionStart + 1, newCursorPos);
      setSearchQuery(query);
      setMentionStartPos(mentionStart);
      setShowSuggestions(true);
      setSelectedIndex(0);
    } else {
      setShowSuggestions(false);
      setMentionStartPos(null);
    }
  };

  const insertMention = useCallback((option: MentionOption) => {
    if (mentionStartPos === null) return;
    
    const before = value.slice(0, mentionStartPos);
    const after = value.slice(cursorPosition);
    const mention = createMention(option.name, option.type, option.id);
    
    const newValue = before + mention + ' ' + after;
    onChange(newValue);
    
    // Move cursor after the inserted mention
    const newCursorPos = mentionStartPos + mention.length + 1;
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.selectionStart = newCursorPos;
        textareaRef.current.selectionEnd = newCursorPos;
        textareaRef.current.focus();
      }
    }, 0);
    
    setShowSuggestions(false);
    setMentionStartPos(null);
  }, [mentionStartPos, cursorPosition, value, onChange]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (!showSuggestions || suggestions.length === 0) return;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % suggestions.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
        break;
      case 'Enter':
        if (showSuggestions) {
          e.preventDefault();
          insertMention(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowSuggestions(false);
        break;
      case 'Tab':
        if (showSuggestions) {
          e.preventDefault();
          insertMention(suggestions[selectedIndex]);
        }
        break;
    }
  };

  // Close suggestions on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        textareaRef.current &&
        !textareaRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative">
      <Textarea
        ref={textareaRef}
        id={id}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={className}
        maxLength={maxLength}
      />
      
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 mt-1 w-full max-h-64 overflow-auto rounded-md border border-border bg-popover shadow-lg"
        >
          {suggestions.map((option, index) => {
            const Icon = typeIcons[option.type];
            return (
              <button
                key={`${option.type}-${option.id}`}
                type="button"
                onClick={() => insertMention(option)}
                className={cn(
                  'flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors',
                  index === selectedIndex
                    ? 'bg-accent text-accent-foreground'
                    : 'hover:bg-accent/50'
                )}
              >
                <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{option.name}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {typeLabels[option.type]}
                    {option.subtitle && ` · ${option.subtitle}`}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
