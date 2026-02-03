import { cn } from "@/lib/utils";

interface TextHighlightProps {
  text: string;
  highlight: string;
  className?: string;
  highlightClassName?: string;
}

export function TextHighlight({ 
  text, 
  highlight, 
  className,
  highlightClassName = "bg-primary/30 text-foreground rounded px-0.5"
}: TextHighlightProps) {
  if (!highlight.trim()) {
    return <span className={className}>{text}</span>;
  }

  const regex = new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);

  return (
    <span className={className}>
      {parts.map((part, index) => 
        regex.test(part) ? (
          <mark key={index} className={cn(highlightClassName)}>
            {part}
          </mark>
        ) : (
          <span key={index}>{part}</span>
        )
      )}
    </span>
  );
}
