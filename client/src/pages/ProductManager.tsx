import { useState, useMemo } from "react";
import { useInventoryStore, Product, Column } from "@/lib/store";
import { 
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { 
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
    Search, Plus, MoreHorizontal, SlidersHorizontal, 
    Download, Upload, Trash2, Copy, Eye, ArrowUpDown 
} from "lucide-react";
import { ColumnConfig } from "@/components/products/ColumnConfig";
import { ProductDialog } from "@/components/products/ProductDialog";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";

export default function ProductManager() {
  const { 
    products, columns, removeProduct, removeProducts, 
    duplicateProduct, importData, clearHistory 
  } = useInventoryStore();

  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isColumnConfigOpen, setIsColumnConfigOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [imageModal, setImageModal] = useState<string | null>(null);

  // --- Computed Data ---
  const visibleColumns = columns.filter(c => c.visible);

  const filteredProducts = useMemo(() => {
    let data = [...products];
    
    if (searchQuery) {
      const lower = searchQuery.toLowerCase();
      data = data.filter(p => 
        Object.values(p).some(val => String(val).toLowerCase().includes(lower))
      );
    }

    if (sortConfig) {
      data.sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return data;
  }, [products, searchQuery, sortConfig]);

  // --- Handlers ---

  const handleSort = (columnId: string) => {
    setSortConfig(current => ({
      key: columnId,
      direction: current?.key === columnId && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(filteredProducts.map(p => p.id));
    } else {
      setSelectedRows([]);
    }
  };

  const handleRowSelect = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedRows(prev => [...prev, id]);
    } else {
      setSelectedRows(prev => prev.filter(rowId => rowId !== id));
    }
  };

  const handleExport = () => {
    const dataStr = JSON.stringify({ products, columns }, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory-backup-${new Date().toISOString()}.json`;
    a.click();
    toast({ title: "Export Successful", description: "Data downloaded as JSON" });
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.products && data.columns) {
          importData(data);
          toast({ title: "Import Successful", description: `Loaded ${data.products.length} products` });
        }
      } catch (err) {
        toast({ title: "Import Failed", description: "Invalid JSON file", variant: "destructive" });
      }
    };
    reader.readAsText(file);
  };

  const handleDeleteSelected = () => {
    if (confirm(`Delete ${selectedRows.length} items?`)) {
      removeProducts(selectedRows);
      setSelectedRows([]);
      toast({ title: "Deleted", description: "Selected items removed" });
    }
  };

  // --- Renderers ---

  const renderCell = (product: Product, column: Column) => {
    const value = product[column.id];
    
    switch (column.type) {
      case 'image':
        return value ? (
            <div 
                className="w-10 h-10 rounded overflow-hidden border bg-muted cursor-zoom-in hover:ring-2 ring-primary transition-all"
                onClick={() => setImageModal(value)}
            >
                <img src={value} alt="Product" className="w-full h-full object-cover" />
            </div>
        ) : <div className="w-10 h-10 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground">No Img</div>;
      
      case 'rating':
        return <div className="flex text-yellow-500">{"★".repeat(Number(value) || 0)}{"☆".repeat(5 - (Number(value) || 0))}</div>;
      
      case 'currency':
        return <span className="font-mono font-medium">${Number(value).toFixed(2)}</span>;
        
      case 'status': 
      case 'select':
        return (
          <Badge variant={value === 'In Stock' ? 'default' : value === 'Out of Stock' ? 'destructive' : 'secondary'}>
            {value}
          </Badge>
        );

      case 'tags':
        return Array.isArray(value) ? (
            <div className="flex flex-wrap gap-1">
                {value.slice(0, 2).map((tag: string) => (
                    <Badge key={tag} variant="outline" className="text-[10px] px-1 h-5">{tag}</Badge>
                ))}
                {value.length > 2 && <span className="text-[10px] text-muted-foreground">+{value.length - 2}</span>}
            </div>
        ) : value;

      default:
        return <span className="truncate block" title={String(value)}>{String(value)}</span>;
    }
  };

  return (
    <div className="h-full flex flex-col p-6 space-y-4 animate-in fade-in duration-500">
      
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Products</h1>
            <p className="text-muted-foreground">Manage your inventory and listings</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" onClick={() => document.getElementById('import-input')?.click()}>
                <Upload className="w-4 h-4 mr-2" /> Import
            </Button>
            <input id="import-input" type="file" className="hidden" accept=".json" onChange={handleImport} />
            
            <Button variant="outline" onClick={handleExport}>
                <Download className="w-4 h-4 mr-2" /> Export
            </Button>
            <Button onClick={() => { setEditingProduct(null); setIsProductDialogOpen(true); }}>
                <Plus className="w-4 h-4 mr-2" /> Add Product
            </Button>
        </div>
      </div>

      {/* Filters & Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-card p-3 rounded-lg border shadow-sm">
        <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-72">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder="Search products..." 
                    className="pl-8" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {selectedRows.length > 0 && (
                <Button variant="destructive" size="sm" onClick={handleDeleteSelected}>
                    <Trash2 className="w-4 h-4 mr-2" /> Delete ({selectedRows.length})
                </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => setIsColumnConfigOpen(true)}>
                <SlidersHorizontal className="w-4 h-4 mr-2" /> Columns
            </Button>
        </div>
      </div>

      {/* Data Table */}
      <div className="flex-1 rounded-md border bg-card shadow-sm overflow-hidden relative flex flex-col">
        <div className="overflow-auto flex-1">
            <Table>
                <TableHeader className="sticky top-0 bg-secondary/50 z-10 backdrop-blur-sm">
                    <TableRow>
                        <TableHead className="w-[40px]">
                            <Checkbox 
                                checked={selectedRows.length === filteredProducts.length && filteredProducts.length > 0}
                                onCheckedChange={handleSelectAll}
                            />
                        </TableHead>
                        {visibleColumns.map((col) => (
                            <TableHead 
                                key={col.id} 
                                style={{ minWidth: col.width }}
                                className="cursor-pointer hover:bg-muted/50 transition-colors select-none"
                                onClick={() => handleSort(col.id)}
                            >
                                <div className="flex items-center gap-1">
                                    {col.label}
                                    {sortConfig?.key === col.id && (
                                        <ArrowUpDown className="w-3 h-3 ml-1 opacity-50" />
                                    )}
                                </div>
                            </TableHead>
                        ))}
                        <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredProducts.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={visibleColumns.length + 2} className="h-24 text-center text-muted-foreground">
                                No products found.
                            </TableCell>
                        </TableRow>
                    ) : (
                        filteredProducts.map((product) => (
                            <TableRow key={product.id} className="group hover:bg-muted/30 transition-colors">
                                <TableCell>
                                    <Checkbox 
                                        checked={selectedRows.includes(product.id)}
                                        onCheckedChange={(checked) => handleRowSelect(product.id, checked === true)}
                                    />
                                </TableCell>
                                {visibleColumns.map((col) => (
                                    <TableCell key={col.id} className="py-2">
                                        {renderCell(product, col)}
                                    </TableCell>
                                ))}
                                <TableCell>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <span className="sr-only">Open menu</span>
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => { setEditingProduct(product); setIsProductDialogOpen(true); }}>
                                                Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => duplicateProduct(product.id)}>
                                                <Copy className="w-4 h-4 mr-2" /> Duplicate
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem className="text-destructive" onClick={() => removeProduct(product.id)}>
                                                Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
        <div className="p-4 border-t bg-muted/10 text-xs text-muted-foreground flex justify-between">
            <span>Showing {filteredProducts.length} products</span>
            <span>{selectedRows.length} selected</span>
        </div>
      </div>

      {/* Modals */}
      <ColumnConfig open={isColumnConfigOpen} onOpenChange={setIsColumnConfigOpen} />
      
      <ProductDialog 
        open={isProductDialogOpen} 
        onOpenChange={setIsProductDialogOpen} 
        product={editingProduct}
      />

      {/* Image Zoom Modal */}
      <Dialog open={!!imageModal} onOpenChange={() => setImageModal(null)}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden bg-black/95 border-none">
            <div className="relative w-full h-[80vh] flex items-center justify-center">
                <img src={imageModal || ''} alt="Zoom" className="max-w-full max-h-full object-contain" />
            </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
