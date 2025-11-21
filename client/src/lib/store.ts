import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// --- Types ---

export type ColumnType = 
  | 'text' | 'number' | 'image' | 'date' | 'datetime' | 'email' 
  | 'phone' | 'url' | 'color' | 'checkbox' | 'select' | 'rating' 
  | 'currency' | 'percentage' | 'tags';

export interface Column {
  id: string;
  label: string;
  type: ColumnType;
  width: number;
  visible: boolean;
  system?: boolean; // System columns cannot be deleted (only hidden)
  options?: string[]; // For select/tags
}

export interface Product {
  id: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: any; // Dynamic fields based on columns
}

export interface HistoryEntry {
  id: string;
  action: 'create' | 'update' | 'delete' | 'import' | 'export';
  description: string;
  timestamp: string;
  user: string;
}

interface InventoryState {
  columns: Column[];
  products: Product[];
  history: HistoryEntry[];
  
  // Actions
  addColumn: (column: Omit<Column, 'id'>) => void;
  updateColumn: (id: string, updates: Partial<Column>) => void;
  removeColumn: (id: string) => void;
  reorderColumns: (newColumns: Column[]) => void;
  
  addProduct: (product: Partial<Product>) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  removeProduct: (id: string) => void;
  removeProducts: (ids: string[]) => void;
  duplicateProduct: (id: string) => void;
  
  addHistory: (entry: Omit<HistoryEntry, 'id' | 'timestamp'>) => void;
  clearHistory: () => void;
  
  importData: (data: { columns: Column[], products: Product[] }) => void;
}

// --- Initial Data ---

const INITIAL_COLUMNS: Column[] = [
  { id: 'name', label: 'Product Name', type: 'text', width: 200, visible: true, system: true },
  { id: 'sku', label: 'SKU', type: 'text', width: 120, visible: true, system: true },
  { id: 'price', label: 'Price', type: 'currency', width: 100, visible: true, system: true },
  { id: 'stock', label: 'Stock', type: 'number', width: 80, visible: true, system: true },
  { id: 'status', label: 'Status', type: 'select', width: 120, visible: true, options: ['In Stock', 'Low Stock', 'Out of Stock'] },
  { id: 'image', label: 'Image', type: 'image', width: 100, visible: true },
  { id: 'category', label: 'Category', type: 'tags', width: 150, visible: true },
  { id: 'rating', label: 'Rating', type: 'rating', width: 120, visible: true },
];

const INITIAL_PRODUCTS: Product[] = Array.from({ length: 15 }).map((_, i) => ({
  id: `prod-${i + 1}`,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  name: `Premium Item ${i + 1}`,
  sku: `SKU-${1000 + i}`,
  price: (Math.random() * 100 + 10).toFixed(2),
  stock: Math.floor(Math.random() * 100),
  status: Math.random() > 0.7 ? 'Low Stock' : 'In Stock',
  category: ['Electronics', 'Gadgets'],
  rating: Math.floor(Math.random() * 5) + 1,
}));

// --- Store ---

export const useInventoryStore = create<InventoryState>()(
  persist(
    (set) => ({
      columns: INITIAL_COLUMNS,
      products: INITIAL_PRODUCTS,
      history: [],

      addColumn: (column) => set((state) => ({
        columns: [...state.columns, { ...column, id: `col-${Date.now()}` }]
      })),

      updateColumn: (id, updates) => set((state) => ({
        columns: state.columns.map(c => c.id === id ? { ...c, ...updates } : c)
      })),

      removeColumn: (id) => set((state) => ({
        columns: state.columns.filter(c => c.id !== id)
      })),

      reorderColumns: (newColumns) => set({ columns: newColumns }),

      addProduct: (product) => set((state) => {
        const newProduct = {
          ...product,
          id: `prod-${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as Product;
        return { 
          products: [newProduct, ...state.products],
          history: [{
            id: `hist-${Date.now()}`,
            action: 'create',
            description: `Added product ${newProduct.name || 'Unknown'}`,
            timestamp: new Date().toISOString(),
            user: 'Admin'
          }, ...state.history]
        };
      }),

      updateProduct: (id, updates) => set((state) => ({
        products: state.products.map(p => p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p),
        history: [{
            id: `hist-${Date.now()}`,
            action: 'update',
            description: `Updated product ${id}`,
            timestamp: new Date().toISOString(),
            user: 'Admin'
          }, ...state.history]
      })),

      removeProduct: (id) => set((state) => ({
        products: state.products.filter(p => p.id !== id),
        history: [{
            id: `hist-${Date.now()}`,
            action: 'delete',
            description: `Deleted product ${id}`,
            timestamp: new Date().toISOString(),
            user: 'Admin'
          }, ...state.history]
      })),

      removeProducts: (ids) => set((state) => ({
        products: state.products.filter(p => !ids.includes(p.id)),
        history: [{
            id: `hist-${Date.now()}`,
            action: 'delete',
            description: `Deleted ${ids.length} products`,
            timestamp: new Date().toISOString(),
            user: 'Admin'
          }, ...state.history]
      })),

      duplicateProduct: (id) => set((state) => {
        const original = state.products.find(p => p.id === id);
        if (!original) return {};
        const newItem = {
          ...original,
          id: `prod-${Date.now()}`,
          name: `${original.name} (Copy)`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        return {
          products: [newItem, ...state.products],
           history: [{
            id: `hist-${Date.now()}`,
            action: 'create',
            description: `Duplicated product ${original.name}`,
            timestamp: new Date().toISOString(),
            user: 'Admin'
          }, ...state.history]
        };
      }),

      addHistory: (entry) => set((state) => ({
        history: [{ ...entry, id: `hist-${Date.now()}`, timestamp: new Date().toISOString() }, ...state.history]
      })),

      clearHistory: () => set({ history: [] }),

      importData: (data) => set((state) => ({
        columns: data.columns,
        products: data.products,
         history: [{
            id: `hist-${Date.now()}`,
            action: 'import',
            description: `Imported ${data.products.length} products`,
            timestamp: new Date().toISOString(),
            user: 'Admin'
          }, ...state.history]
      })),
    }),
    {
      name: 'inventory-storage',
    }
  )
);
