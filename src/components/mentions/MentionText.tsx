import { parseMentions, TextSegment, Mention, MentionType } from '@/lib/mentions';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface MentionTextProps {
  text: string;
  className?: string;
}

const typeColors: Record<MentionType, string> = {
  character: 'text-destructive hover:text-destructive',
  plot: 'text-mention-plot hover:text-mention-plot',
  session: 'text-info hover:text-info',
  note: 'text-crit hover:text-crit',
  faction: 'text-success hover:text-success',
  coterie: 'text-messy hover:text-messy',
   location: 'text-mention-location hover:text-mention-location',
};

const typeRoutes: Record<MentionType, string> = {
  character: '/characters',
  plot: '/stories',
  session: '/sessions',
  note: '/chronicle',
  faction: '/relationships',
  coterie: '/characters',
   location: '/locations',
};

export function MentionText({ text, className }: MentionTextProps) {
  const navigate = useNavigate();
  const segments = parseMentions(text);

  const handleMentionClick = (mention: Mention) => {
    const route = typeRoutes[mention.type];
    if (route) {
      navigate(`${route}?highlight=${mention.id}&q=${encodeURIComponent(mention.name)}`);
    }
  };

  if (segments.length === 0) {
    return <span className={className}>{text}</span>;
  }

  return (
    <span className={className}>
      {segments.map((segment, index) => {
        if (segment.type === 'text') {
          return <span key={index}>{segment.content}</span>;
        }

        if (segment.type === 'mention' && segment.mention) {
          const { mention } = segment;
          return (
            <span
              key={index}
              role="link"
              tabIndex={0}
              onClick={() => handleMentionClick(mention)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleMentionClick(mention); }}
              className={cn(
                'inline font-medium cursor-pointer underline underline-offset-2 transition-colors text-left',
                typeColors[mention.type]
              )}
              title={`${mention.type}: ${mention.name}`}
            >
              @{mention.name}
            </span>
          );
        }

        return null;
      })}
    </span>
  );
}
