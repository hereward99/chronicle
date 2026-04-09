import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DotRating } from "./DotRating";
import { Plus, X } from "lucide-react";

export interface DotRatedItem {
  name: string;
  dots: number;
}

interface DotRatedListProps {
  items: DotRatedItem[];
  onChange: (items: DotRatedItem[]) => void;
  label?: string;
  placeholder?: string;
  maxDots?: number;
}

export function parseDotRatedItems(value: string | null): DotRatedItem[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    // Legacy plain-text fallback: treat as single item with 0 dots
    if (value.trim()) return [{ name: value.trim(), dots: 0 }];
  }
  return [];
}

export function serializeDotRatedItems(items: DotRatedItem[]): string | null {
  const filtered = items.filter(i => i.name.trim());
  if (filtered.length === 0) return null;
  return JSON.stringify(filtered);
}

export function DotRatedList({ items, onChange, label, placeholder = "Merit name...", maxDots = 5 }: DotRatedListProps) {
  const [newName, setNewName] = useState("");

  const addItem = () => {
    if (!newName.trim()) return;
    onChange([...items, { name: newName.trim(), dots: 1 }]);
    setNewName("");
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const updateDots = (index: number, dots: number) => {
    const updated = [...items];
    updated[index] = { ...updated[index], dots };
    onChange(updated);
  };

  const updateName = (index: number, name: string) => {
    const updated = [...items];
    updated[index] = { ...updated[index], name };
    onChange(updated);
  };

  return (
    <div className="space-y-2">
      {label && <span className="text-sm font-medium">{label}</span>}
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <Input
            value={item.name}
            onChange={e => updateName(i, e.target.value)}
            className="flex-1 h-8 text-sm"
          />
          <DotRating value={item.dots} max={maxDots} onChange={v => updateDots(i, v)} />
          <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => removeItem(i)}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      ))}
      <div className="flex items-center gap-2">
        <Input
          value={newName}
          onChange={e => setNewName(e.target.value)}
          placeholder={placeholder}
          className="flex-1 h-8 text-sm"
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addItem(); } }}
        />
        <Button type="button" variant="outline" size="sm" className="h-8" onClick={addItem} disabled={!newName.trim()}>
          <Plus className="h-3 w-3 mr-1" /> Add
        </Button>
      </div>
    </div>
  );
}

/** Read-only display of dot-rated items */
export function DotRatedDisplay({ value, label }: { value: string | null; label?: string }) {
  const items = parseDotRatedItems(value);
  if (items.length === 0) return null;

  return (
    <div className="space-y-1">
      {label && <span className="text-sm text-muted-foreground">{label}:</span>}
      {items.map((item, i) => (
        <DotRating key={i} value={item.dots} label={item.name} />
      ))}
    </div>
  );
}
