import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MentionText } from "@/components/mentions/MentionText";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { SessionChecklist, useChecklists } from "@/hooks/useChecklists";
import { EditChecklistDialog } from "@/components/checklists/EditChecklistDialog";
import { exportChecklistToPDF } from "@/lib/pdfExport";
import { 
  MoreVertical, 
  Plus, 
  Download, 
  Trash2, 
  CheckSquare,
  Square,
  Pencil,
  X,
  Check
} from "lucide-react";

interface ChecklistCardProps {
  checklist: SessionChecklist;
  toggleItem: (itemId: string, isCompleted: boolean) => Promise<void>;
  addItem: (checklistId: string, text: string) => Promise<any>;
  updateItem: (itemId: string, text: string) => Promise<void>;
  deleteItem: (itemId: string) => Promise<void>;
  updateChecklist: (id: string, updates: { title?: string; notes?: string; plot_id?: string | null }) => Promise<void>;
  deleteChecklist: (id: string) => Promise<void>;
}

export function ChecklistCard({ checklist, toggleItem, addItem, updateItem, deleteItem, deleteChecklist }: ChecklistCardProps) {
  const [newItemText, setNewItemText] = useState("");
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingItemText, setEditingItemText] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const completedCount = checklist.items.filter(item => item.is_completed).length;
  const totalCount = checklist.items.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const handleAddItem = async () => {
    if (newItemText.trim()) {
      await addItem(checklist.id, newItemText.trim());
      setNewItemText("");
      setIsAddingItem(false);
    }
  };

  const handleStartEdit = (itemId: string, text: string) => {
    setEditingItemId(itemId);
    setEditingItemText(text);
  };

  const handleSaveEdit = async () => {
    if (editingItemId && editingItemText.trim()) {
      await updateItem(editingItemId, editingItemText.trim());
      setEditingItemId(null);
      setEditingItemText("");
    }
  };

  const handleCancelEdit = () => {
    setEditingItemId(null);
    setEditingItemText("");
  };

  const handleDeleteChecklist = async () => {
    await deleteChecklist(checklist.id);
    setDeleteDialogOpen(false);
  };

  const handleMarkAllComplete = () => {
    checklist.items.forEach(item => {
      if (!item.is_completed) {
        toggleItem(item.id, true);
      }
    });
  };

  const handleMarkAllIncomplete = () => {
    checklist.items.forEach(item => {
      if (item.is_completed) {
        toggleItem(item.id, false);
      }
    });
  };

  return (
    <>
      <Card className="bg-card border-border shadow-gothic">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg text-foreground truncate">
                {checklist.title}
              </CardTitle>
              {checklist.notes && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  <MentionText text={checklist.notes} />
                </p>
              )}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleMarkAllComplete}>
                  <CheckSquare className="h-4 w-4 mr-2" />
                  Mark All Complete
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleMarkAllIncomplete}>
                  <Square className="h-4 w-4 mr-2" />
                  Mark All Incomplete
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportChecklistToPDF(checklist)}>
                  <Download className="h-4 w-4 mr-2" />
                  Export to PDF
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setDeleteDialogOpen(true)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Checklist
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Progress */}
          <div className="flex items-center gap-3 mt-3">
            <Progress value={progress} className="flex-1 h-2" />
            <Badge variant={progress === 100 ? "default" : "secondary"} className="shrink-0">
              {completedCount}/{totalCount}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="pt-2">
          {/* Items List */}
          <div className="space-y-1">
            {checklist.items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-2 py-1.5 group"
              >
                <Checkbox
                  checked={item.is_completed}
                  onCheckedChange={(checked) => toggleItem(item.id, checked as boolean)}
                  className="shrink-0"
                />
                
                {editingItemId === item.id ? (
                  <div className="flex-1 flex items-center gap-1">
                    <Input
                      value={editingItemText}
                      onChange={(e) => setEditingItemText(e.target.value)}
                      className="h-7 text-sm"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveEdit();
                        if (e.key === 'Escape') handleCancelEdit();
                      }}
                    />
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleSaveEdit}>
                      <Check className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleCancelEdit}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <span
                      className={`flex-1 text-sm ${
                        item.is_completed 
                          ? 'text-muted-foreground line-through' 
                          : 'text-foreground'
                      }`}
                    >
                      <MentionText text={item.text} />
                    </span>
                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleStartEdit(item.id, item.text)}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive hover:text-destructive"
                        onClick={() => deleteItem(item.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Add Item */}
          {isAddingItem ? (
            <div className="flex items-center gap-2 mt-2">
              <Input
                value={newItemText}
                onChange={(e) => setNewItemText(e.target.value)}
                placeholder="New item..."
                className="h-8 text-sm"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddItem();
                  if (e.key === 'Escape') {
                    setIsAddingItem(false);
                    setNewItemText("");
                  }
                }}
              />
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleAddItem}>
                <Check className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7"
                onClick={() => {
                  setIsAddingItem(false);
                  setNewItemText("");
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="w-full mt-2 text-muted-foreground hover:text-foreground"
              onClick={() => setIsAddingItem(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Checklist</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{checklist.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteChecklist} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
