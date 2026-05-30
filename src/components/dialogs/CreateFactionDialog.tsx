import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MentionInput } from '@/components/mentions/MentionInput';
import { Faction } from '@/hooks/useFactions';

interface CreateFactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chronicleId: string;
  onCreate: (faction: Omit<Faction, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<any>;
}

const factionColors = [
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Green', value: '#10b981' },
  { name: 'Purple', value: '#8b5cf6' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Yellow', value: '#eab308' },
  { name: 'Cyan', value: '#06b6d4' },
  { name: 'Gray', value: '#64748b' },
];

export function CreateFactionDialog({
  open,
  onOpenChange,
  chronicleId,
  onCreate,
}: CreateFactionDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3b82f6',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setLoading(true);
    try {
      await onCreate({
        chronicle_id: chronicleId,
        name: formData.name,
        description: formData.description || null,
        color: formData.color,
      });
      setFormData({ name: '', description: '', color: '#3b82f6' });
      onOpenChange(false);
    } catch (error) {
      // Error handled by hook
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>Create Faction</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Faction Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Camarilla, Anarchs, Sabbat"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <MentionInput
              id="description"
              value={formData.description}
              onChange={(value) => setFormData({ ...formData, description: value })}
              placeholder="Describe the faction's purpose, ideology, or history... Use @ to mention entities"
              className="min-h-20 resize-none"
              maxLength={3000}
            />
            <p className="text-xs text-muted-foreground">Type @ to mention characters, stories, sessions, etc.</p>
          </div>

          <div className="space-y-2">
            <Label>Faction Color</Label>
            <div className="grid grid-cols-5 gap-2">
              {factionColors.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, color: color.value })}
                  className="w-full aspect-square rounded-md border-2 transition-all hover:scale-110"
                  style={{
                    backgroundColor: color.value,
                    borderColor: formData.color === color.value ? 'white' : 'transparent',
                    boxShadow: formData.color === color.value ? '0 0 0 2px hsl(var(--primary))' : 'none',
                  }}
                  title={color.name}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !formData.name.trim()}>
              {loading ? "Creating..." : "Create Faction"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
