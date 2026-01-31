import { parseMentions, TextSegment, Mention, MentionType } from '@/lib/mentions';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface MentionTextProps {
  text: string;
  className?: string;
}

const typeColors: Record<MentionType, string> = {
  character: 'text-red-400 hover:text-red-300',
  plot: 'text-purple-400 hover:text-purple-300',
  session: 'text-blue-400 hover:text-blue-300',
  note: 'text-yellow-400 hover:text-yellow-300',
  faction: 'text-green-400 hover:text-green-300',
  coterie: 'text-orange-400 hover:text-orange-300',
};

const typeRoutes: Record<MentionType, string> = {
  character: '/characters',
  plot: '/stories',
  session: '/sessions',
  note: '/chronicle',
  faction: '/relationships',
  coterie: '/coteries',
};

export function MentionText({ text, className }: MentionTextProps) {
  const navigate = useNavigate();
  const segments = parseMentions(text);

  const handleMentionClick = (mention: Mention) => {
    // Navigate to the entity's page
    // For now, navigate to the section and let the user find it
    // In future, could open a modal or scroll to the entity
    const route = typeRoutes[mention.type];
    if (route) {
      navigate(route);
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
            <button
              key={index}
              onClick={() => handleMentionClick(mention)}
              className={cn(
                'font-medium cursor-pointer underline underline-offset-2 transition-colors',
                typeColors[mention.type]
              )}
              title={`${mention.type}: ${mention.name}`}
            >
              @{mention.name}
            </button>
          );
        }

        return null;
      })}
    </span>
  );
}
