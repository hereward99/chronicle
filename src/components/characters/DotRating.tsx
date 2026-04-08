import { cn } from "@/lib/utils";

interface DotRatingProps {
  value: number;
  max?: number;
  onChange?: (value: number) => void;
  label?: string;
  className?: string;
}

export function DotRating({ value, max = 5, onChange, label, className }: DotRatingProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {label && <span className="text-sm text-muted-foreground min-w-[80px]">{label}</span>}
      <div className="flex gap-1">
        {Array.from({ length: max }, (_, i) => (
          <button
            key={i}
            type="button"
            disabled={!onChange}
            onClick={() => onChange?.(i + 1 === value ? 0 : i + 1)}
            className={cn(
              "h-4 w-4 rounded-full border-2 transition-colors",
              i < value
                ? "bg-primary border-primary"
                : "bg-transparent border-muted-foreground/40",
              onChange && "cursor-pointer hover:border-primary/70",
              !onChange && "cursor-default"
            )}
            aria-label={`${i + 1} of ${max}`}
          />
        ))}
      </div>
    </div>
  );
}
