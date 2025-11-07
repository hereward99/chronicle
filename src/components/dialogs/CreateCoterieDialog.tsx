import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCoteries } from "@/hooks/useCoteries";
import { useChronicles } from "@/hooks/useChronicles";

interface CreateCoterieDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateCoterieDialog({ open, onOpenChange }: CreateCoterieDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [domain, setDomain] = useState("");
  const { createCoterie } = useCoteries();
  const { chronicles } = useChronicles();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) return;

    const chronicleId = chronicles[0]?.id;
    if (!chronicleId) {
      alert("Please create a chronicle first");
      return;
    }

    try {
      await createCoterie({
        name: name.trim(),
        description: description.trim() || null,
        domain: domain.trim() || null,
        chronicle_id: chronicleId,
      });
      
      setName("");
      setDescription("");
      setDomain("");
      onOpenChange(false);
    } catch (error) {
      console.error("Error creating coterie:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create Coterie</DialogTitle>
          <DialogDescription>
            Create a new coterie to organize your characters.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="The Midnight Circle"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A group of vampires working together..."
              rows={3}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="domain">Domain</Label>
            <Input
              id="domain"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="Downtown District"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Coterie</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
