import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useInventoryStore, Column, ColumnType } from "@/lib/store";
import { useState } from "react";
import { Reorder } from "framer-motion";
import { GripVertical, Plus, Trash2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ColumnConfigProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ColumnConfig({ open, onOpenChange }: ColumnConfigProps) {
  const { columns, addColumn, removeColumn, updateColumn, reorderColumns } = useInventoryStore();
  const [isAdding, setIsAdding] = useState(false);
  const [newColName, setNewColName] = useState("");
  const [newColType, setNewColType] = useState<ColumnType>("text");

  const handleAddColumn = () => {
    if (!newColName) return;
    addColumn({
      label: newColName,
      type: newColType,
      width: 150,
      visible: true,
    });
    setNewColName("");
    setIsAdding(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Manage Columns</DialogTitle>
        </DialogHeader>
        
        <div className="flex items-center gap-2 py-4 border-b">
          <Button variant="outline" size="sm" onClick={() => setIsAdding(!isAdding)}>
            <Plus className="w-4 h-4 mr-2" /> Add Custom Column
          </Button>
        </div>

        {isAdding && (
          <div className="p-4 bg-muted/50 rounded-md space-y-4 animate-in slide-in-from-top-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Column Name</Label>
                <Input value={newColName} onChange={(e) => setNewColName(e.target.value)} placeholder="e.g. Supplier" />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={newColType} onValueChange={(v: ColumnType) => setNewColType(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="number">Number</SelectItem>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="image">Image</SelectItem>
                    <SelectItem value="select">Select Option</SelectItem>
                    <SelectItem value="tags">Tags</SelectItem>
                    <SelectItem value="rating">Rating</SelectItem>
                    <SelectItem value="currency">Currency</SelectItem>
                    <SelectItem value="checkbox">Checkbox</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setIsAdding(false)}>Cancel</Button>
              <Button size="sm" onClick={handleAddColumn}>Create Column</Button>
            </div>
          </div>
        )}

        <ScrollArea className="flex-1 pr-4">
          <Reorder.Group axis="y" values={columns} onReorder={reorderColumns} className="space-y-2 py-2">
            {columns.map((col) => (
              <Reorder.Item key={col.id} value={col}>
                <div className="flex items-center gap-3 p-3 bg-card border rounded-md shadow-sm hover:shadow-md transition-shadow group">
                  <GripVertical className="w-5 h-5 text-muted-foreground cursor-grab active:cursor-grabbing" />
                  
                  <Checkbox 
                    checked={col.visible} 
                    onCheckedChange={(checked) => updateColumn(col.id, { visible: checked === true })}
                  />
                  
                  <div className="flex-1 grid grid-cols-3 gap-4 items-center">
                    <span className="font-medium text-sm">{col.label}</span>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full w-fit">
                      {col.type}
                    </span>
                    <div className="flex items-center gap-2">
                        <Label className="text-xs text-muted-foreground whitespace-nowrap">Width:</Label>
                        <Input 
                            type="number" 
                            className="h-6 w-16 text-xs" 
                            value={col.width} 
                            onChange={(e) => updateColumn(col.id, { width: parseInt(e.target.value) || 100 })}
                        />
                    </div>
                  </div>

                  {!col.system && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => removeColumn(col.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </Reorder.Item>
            ))}
          </Reorder.Group>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
