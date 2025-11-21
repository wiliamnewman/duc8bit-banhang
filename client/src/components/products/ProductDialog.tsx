import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useInventoryStore, Product } from "@/lib/store";
import { useState, useEffect, useRef } from "react";
import { Upload, X } from "lucide-react";

interface ProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
}

export function ProductDialog({ open, onOpenChange, product }: ProductDialogProps) {
  const { addProduct, updateProduct, columns } = useInventoryStore();
  const [formData, setFormData] = useState<Partial<Product>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setFormData(product || {});
    }
  }, [open, product]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (product) {
      updateProduct(product.id, formData);
    } else {
      addProduct(formData);
    }
    onOpenChange(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Filter out system columns like ID, timestamps for the form unless necessary
  const formColumns = columns.filter(c => !['id', 'createdAt', 'updatedAt'].includes(c.id));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{product ? "Edit Product" : "Add New Product"}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto pr-2">
            <div className="grid gap-6 py-4">
                
                {/* Image Upload */}
                <div className="flex justify-center">
                    <div 
                        className="w-32 h-32 border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer hover:border-primary relative group bg-muted/20"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        {formData.image ? (
                            <>
                                <img src={formData.image} className="w-full h-full object-cover rounded-lg" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs">
                                    Change
                                </div>
                            </>
                        ) : (
                            <div className="text-center text-muted-foreground">
                                <Upload className="w-6 h-6 mx-auto mb-1" />
                                <span className="text-xs">Upload Image</span>
                            </div>
                        )}
                        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {formColumns.map((col) => {
                        if (col.id === 'image') return null; // Handled above

                        return (
                            <div key={col.id} className={col.type === 'textarea' || col.type === 'tags' ? 'col-span-2' : ''}>
                                <Label className="mb-1.5 block">{col.label}</Label>
                                
                                {col.type === 'select' && col.options ? (
                                    <Select 
                                        value={formData[col.id] as string} 
                                        onValueChange={(val) => setFormData(prev => ({ ...prev, [col.id]: val }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {col.options.map(opt => (
                                                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                ) : col.type === 'number' || col.type === 'currency' ? (
                                    <Input 
                                        type="number" 
                                        value={formData[col.id] || ''} 
                                        onChange={(e) => setFormData(prev => ({ ...prev, [col.id]: e.target.value }))}
                                    />
                                ) : (
                                    <Input 
                                        value={formData[col.id] || ''} 
                                        onChange={(e) => setFormData(prev => ({ ...prev, [col.id]: e.target.value }))}
                                    />
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                <Button type="submit">{product ? "Save Changes" : "Create Product"}</Button>
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
