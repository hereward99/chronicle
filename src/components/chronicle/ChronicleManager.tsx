import { useState } from "react";
import { useChronicles, Chronicle } from "@/hooks/useChronicles";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, Pencil, Trash2, BookMarked } from "lucide-react";

export function ChronicleManager({ title = "Chronicle" }: { title?: string }) {
  const { chronicles, currentChronicle, setCurrentChronicle, createChronicle, updateChronicle, deleteChronicle } = useChronicles();
  const [showCreate, setShowCreate] = useState(false);
  const [editingChronicle, setEditingChronicle] = useState<Chronicle | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Chronicle | null>(null);
  const [form, setForm] = useState({ name: "", description: "", setting: "" });

  const openCreate = () => {
    setForm({ name: "", description: "", setting: "" });
    setShowCreate(true);
  };

  const openEdit = (c: Chronicle) => {
    setForm({ name: c.name, description: c.description || "", setting: c.setting || "" });
    setEditingChronicle(c);
  };

  const handleCreate = async () => {
    if (!form.name.trim()) return;
    await createChronicle({ name: form.name, description: form.description || null, setting: form.setting || null });
    setShowCreate(false);
  };

  const handleUpdate = async () => {
    if (!editingChronicle || !form.name.trim()) return;
    await updateChronicle(editingChronicle.id, { name: form.name, description: form.description || null, setting: form.setting || null });
    setEditingChronicle(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteChronicle(deleteTarget.id);
    setDeleteTarget(null);
  };

  return (
    <>
      <Card className="bg-gradient-subtle border-border shadow-gothic">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-foreground flex items-center gap-2">
            <BookMarked className="h-5 w-5 text-primary" />
            {title}
          </CardTitle>
          <Button size="sm" variant="outline" onClick={openCreate} className="border-border">
            <Plus className="h-4 w-4 mr-1" />
            New
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {chronicles.length > 1 && (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Active Chronicle</Label>
              <Select
                value={currentChronicle?.id || ""}
                onValueChange={(id) => {
                  const c = chronicles.find((ch) => ch.id === id);
                  if (c) setCurrentChronicle(c);
                }}
              >
                <SelectTrigger className="border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {chronicles.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {currentChronicle && (
            <div className="rounded-md border border-border p-3 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-foreground">{currentChronicle.name}</h4>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(currentChronicle)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  {chronicles.length > 1 && (
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteTarget(currentChronicle)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
              {currentChronicle.description && (
                <p className="text-sm text-muted-foreground">{currentChronicle.description}</p>
              )}
              {currentChronicle.setting && (
                <p className="text-xs text-muted-foreground">Setting: {currentChronicle.setting}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit Dialog */}
      <Dialog open={showCreate || !!editingChronicle} onOpenChange={(open) => { if (!open) { setShowCreate(false); setEditingChronicle(null); } }}>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>{editingChronicle ? "Edit Chronicle" : "New Chronicle"}</DialogTitle>
            <DialogDescription>
              {editingChronicle ? "Update your chronicle details." : "Create a new chronicle to manage a separate game."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Shadows of Chicago" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="A brief description of your chronicle" rows={3} />
            </div>
            <div className="space-y-2">
              <Label>Setting</Label>
              <Input value={form.setting} onChange={(e) => setForm({ ...form, setting: e.target.value })} placeholder="e.g. Modern Nights, Dark Ages" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowCreate(false); setEditingChronicle(null); }}>Cancel</Button>
            <Button onClick={editingChronicle ? handleUpdate : handleCreate} disabled={!form.name.trim()}>
              {editingChronicle ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{deleteTarget?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this chronicle and all its characters, sessions, stories, notes, and other associated data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete Chronicle
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
