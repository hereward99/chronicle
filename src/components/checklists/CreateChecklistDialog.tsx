import { useMemo, useState } from "react";
import { useFormDraft } from "@/hooks/useFormDraft";
import { DraftSavedIndicator } from "@/components/DraftSavedIndicator";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MentionInput } from "@/components/mentions/MentionInput";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useChecklists, CHECKLIST_TEMPLATES } from "@/hooks/useChecklists";
import { usePlots } from "@/hooks/usePlots";
import { Plus, Trash2 } from "lucide-react";

interface CreateChecklistDialogProps {
  children: React.ReactNode;
  defaultPlotId?: string | null;
}

export function CreateChecklistDialog({ children, defaultPlotId }: CreateChecklistDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [plotId, setPlotId] = useState<string | null>(defaultPlotId || null);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [items, setItems] = useState<string[]>([]);
  const [newItemText, setNewItemText] = useState("");
  const [templateItemsSelected, setTemplateItemsSelected] = useState<Set<number>>(new Set());

  const { createChecklist } = useChecklists();
  const { plots } = usePlots();

  const draftData = useMemo(
    () => ({ title, notes, plotId, selectedTemplate, items, templateItemsSelected: Array.from(templateItemsSelected) }),
    [title, notes, plotId, selectedTemplate, items, templateItemsSelected],
  );
  const applyDraft = (d: typeof draftData) => {
    setTitle(d.title ?? "");
    setNotes(d.notes ?? "");
    setPlotId(d.plotId ?? null);
    setSelectedTemplate(d.selectedTemplate ?? null);
    setItems(d.items ?? []);
    setTemplateItemsSelected(new Set(d.templateItemsSelected ?? []));
  };
  const { clearDraft, status: draftStatus, lastSavedAt: draftSavedAt } = useFormDraft(
    'create-checklist',
    draftData,
    applyDraft,
    { enabled: open }
  );

  const handleSelectTemplate = (templateKey: string) => {
    setSelectedTemplate(templateKey);
    const template = CHECKLIST_TEMPLATES[templateKey as keyof typeof CHECKLIST_TEMPLATES];
    if (template) {
      setTitle(template.name);
      // Select all template items by default
      setTemplateItemsSelected(new Set(template.items.map((_, i) => i)));
    }
  };

  const toggleTemplateItem = (index: number) => {
    setTemplateItemsSelected(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const addCustomItem = () => {
    if (newItemText.trim()) {
      setItems(prev => [...prev, newItemText.trim()]);
      setNewItemText("");
    }
  };

  const removeCustomItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Combine template items and custom items
    const allItems: string[] = [];
    
    if (selectedTemplate) {
      const template = CHECKLIST_TEMPLATES[selectedTemplate as keyof typeof CHECKLIST_TEMPLATES];
      template.items.forEach((item, index) => {
        if (templateItemsSelected.has(index)) {
          allItems.push(item);
        }
      });
    }
    
    allItems.push(...items);

    const result = await createChecklist(
      { title, notes: notes || undefined, plot_id: plotId },
      allItems
    );

    if (result) {
      setOpen(false);
      resetForm();
    }
  };

  const resetForm = () => {
    setTitle("");
    setNotes("");
    setPlotId(defaultPlotId || null);
    setSelectedTemplate(null);
    setItems([]);
    setNewItemText("");
    setTemplateItemsSelected(new Set());
    clearDraft();
  };

  const currentTemplate = selectedTemplate 
    ? CHECKLIST_TEMPLATES[selectedTemplate as keyof typeof CHECKLIST_TEMPLATES]
    : null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent size="md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Session Prep Checklist</DialogTitle>
            <DialogDescription>
              Start from a template or create a custom checklist for your session.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Template Selection */}
            <div className="grid gap-2">
              <Label>Start from Template (Optional)</Label>
              <Select value={selectedTemplate || ""} onValueChange={handleSelectTemplate}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a template..." />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CHECKLIST_TEMPLATES).map(([key, template]) => (
                    <SelectItem key={key} value={key}>{template.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Title */}
            <div className="grid gap-2">
              <Label htmlFor="title">Checklist Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Session prep for..."
                required
              />
            </div>

            {/* Link to Story */}
            <div className="grid gap-2">
              <Label>Link to Story (Optional)</Label>
              <Select value={plotId || "__none__"} onValueChange={(v) => setPlotId(v === "__none__" ? null : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="No story linked" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">No story linked</SelectItem>
                  {plots.map((plot) => (
                    <SelectItem key={plot.id} value={plot.id}>{plot.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <MentionInput
                id="notes"
                value={notes}
                onChange={(value) => setNotes(value)}
                placeholder="General notes for this prep... Use @ to mention characters"
                className="min-h-[60px] resize-none"
                maxLength={2000}
              />
              <p className="text-xs text-muted-foreground">Type @ to mention characters, stories, etc.</p>
            </div>

            {/* Template Items */}
            {currentTemplate && (
              <div className="grid gap-2">
                <Label>Template Items</Label>
                <div className="border border-border rounded-md p-3 space-y-2 max-h-40 overflow-y-auto">
                  {currentTemplate.items.map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Checkbox
                        id={`template-item-${index}`}
                        checked={templateItemsSelected.has(index)}
                        onCheckedChange={() => toggleTemplateItem(index)}
                      />
                      <label
                        htmlFor={`template-item-${index}`}
                        className="text-sm text-foreground cursor-pointer flex-1"
                      >
                        {item}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Custom Items */}
            <div className="grid gap-2">
              <Label>Custom Items</Label>
              <div className="flex gap-2">
                <Input
                  value={newItemText}
                  onChange={(e) => setNewItemText(e.target.value)}
                  placeholder="Add a custom item..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addCustomItem();
                    }
                  }}
                />
                <Button type="button" variant="outline" size="icon" onClick={addCustomItem}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {items.length > 0 && (
                <div className="border border-border rounded-md p-3 space-y-2 max-h-40 overflow-y-auto">
                  {items.map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span className="text-sm text-foreground flex-1">{item}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => removeCustomItem(index)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="sm:justify-between">
            <DraftSavedIndicator status={draftStatus} lastSavedAt={draftSavedAt} className="self-center" />
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!title.trim()}>
                Create Checklist
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
