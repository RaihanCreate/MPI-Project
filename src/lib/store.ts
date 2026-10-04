import { useEffect, useState, useCallback } from 'react';
import type { Category, Product, StockTransaction } from './types';

const STORAGE_KEYS = {
  categories: 'wlb_categories',
  products: 'wlb_products',
  transactions: 'wlb_transactions',
  seeded: 'wlb_seeded_v1',
};

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as T;
  } catch {
    /* ignore parse errors */
  }
  return fallback;
}

function save<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

function uid(): string {
  return crypto.randomUUID();
}

/* ---- Seed data so the app isn't empty on first load ---- */

function seedIfNeeded(): void {
  if (localStorage.getItem(STORAGE_KEYS.seeded)) return;

  const now = new Date().toISOString();

  const cats: Category[] = [
    { id: uid(), name: 'Minuman', description: 'Kopi, teh, dan minuman lainnya', created_at: now },
    { id: uid(), name: 'Makanan', description: 'Snack dan makanan ringan', created_at: now },
    { id: uid(), name: 'Sembako', description: 'Bahan pokok dan kebutuhan harian', created_at: now },
  ];

  const products: Product[] = [
    { id: uid(), name: 'Kopi Robusta 250g', category_id: cats[0].id, sku: 'KOP-001', unit: 'pcs', stock_quantity: 24, min_stock_level: 10, buy_price: 18000, sell_price: 25000, created_at: now },
    { id: uid(), name: 'Gula Pasir 1kg', category_id: cats[2].id, sku: 'SMB-001', unit: 'pcs', stock_quantity: 8, min_stock_level: 10, buy_price: 14000, sell_price: 16000, created_at: now },
    { id: uid(), name: 'Teh Celup Box', category_id: cats[0].id, sku: 'TEH-001', unit: 'box', stock_quantity: 15, min_stock_level: 5, buy_price: 5000, sell_price: 7000, created_at: now },
    { id: uid(), name: 'Kopi Arabica 250g', category_id: cats[0].id, sku: 'KOP-002', unit: 'pcs', stock_quantity: 3, min_stock_level: 8, buy_price: 35000, sell_price: 48000, created_at: now },
    { id: uid(), name: 'Roti Tawar', category_id: cats[1].id, sku: 'MAK-001', unit: 'pcs', stock_quantity: 12, min_stock_level: 5, buy_price: 12000, sell_price: 15000, created_at: now },
  ];

  const transactions: StockTransaction[] = [
    { id: uid(), product_id: products[0].id, type: 'in', quantity: 30, note: 'Pembelian awal dari supplier', created_at: now },
    { id: uid(), product_id: products[0].id, type: 'out', quantity: 6, note: 'Penjualan harian', created_at: now },
    { id: uid(), product_id: products[1].id, type: 'in', quantity: 15, note: 'Restock', created_at: now },
    { id: uid(), product_id: products[1].id, type: 'out', quantity: 7, note: 'Penjualan', created_at: now },
    { id: uid(), product_id: products[3].id, type: 'in', quantity: 10, note: 'Pembelian dari supplier', created_at: now },
    { id: uid(), product_id: products[3].id, type: 'out', quantity: 7, note: 'Penjualan harian', created_at: now },
  ];

  save(STORAGE_KEYS.categories, cats);
  save(STORAGE_KEYS.products, products);
  save(STORAGE_KEYS.transactions, transactions);
  localStorage.setItem(STORAGE_KEYS.seeded, '1');
}

/* ---- Store ---- */

export function useStore() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<StockTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    seedIfNeeded();
    setCategories(load(STORAGE_KEYS.categories, []));
    setProducts(load(STORAGE_KEYS.products, []));
    setTransactions(load(STORAGE_KEYS.transactions, []));
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const persistCategories = (cats: Category[]) => {
    setCategories(cats);
    save(STORAGE_KEYS.categories, cats);
  };
  const persistProducts = (prods: Product[]) => {
    setProducts(prods);
    save(STORAGE_KEYS.products, prods);
  };
  const persistTransactions = (txs: StockTransaction[]) => {
    setTransactions(txs);
    save(STORAGE_KEYS.transactions, txs);
  };

  /* ---- Categories ---- */

  const addCategory = (data: { name: string; description: string }) => {
    const cat: Category = {
      id: uid(),
      name: data.name,
      description: data.description,
      created_at: new Date().toISOString(),
    };
    persistCategories([...categories, cat].sort((a, b) => a.name.localeCompare(b.name)));
    return cat;
  };

  const updateCategory = (id: string, data: { name: string; description: string }) => {
    persistCategories(
      categories.map((c) => (c.id === id ? { ...c, ...data } : c)).sort((a, b) => a.name.localeCompare(b.name))
    );
  };

  const deleteCategory = (id: string) => {
    persistCategories(categories.filter((c) => c.id !== id));
    persistProducts(products.map((p) => (p.category_id === id ? { ...p, category_id: null } : p)));
  };

  /* ---- Products ---- */

  const addProduct = (data: Omit<Product, 'id' | 'created_at' | 'categories'>) => {
    const prod: Product = {
      ...data,
      id: uid(),
      created_at: new Date().toISOString(),
    };
    persistProducts([...products, prod].sort((a, b) => a.name.localeCompare(b.name)));
    return prod;
  };

  const updateProduct = (id: string, data: Partial<Omit<Product, 'id' | 'created_at' | 'categories'>>) => {
    persistProducts(
      products.map((p) => (p.id === id ? { ...p, ...data } : p)).sort((a, b) => a.name.localeCompare(b.name))
    );
  };

  const deleteProduct = (id: string) => {
    persistProducts(products.filter((p) => p.id !== id));
    persistTransactions(transactions.filter((t) => t.product_id !== id));
  };

  /* ---- Transactions ---- */

  const addTransaction = (data: { product_id: string; type: 'in' | 'out'; quantity: number; note: string }) => {
    const tx: StockTransaction = {
      id: uid(),
      product_id: data.product_id,
      type: data.type,
      quantity: data.quantity,
      note: data.note,
      created_at: new Date().toISOString(),
    };
    persistTransactions([tx, ...transactions]);

    const prod = products.find((p) => p.id === data.product_id);
    if (prod) {
      const delta = data.type === 'in' ? data.quantity : -data.quantity;
      persistProducts(
        products.map((p) =>
          p.id === data.product_id ? { ...p, stock_quantity: p.stock_quantity + delta } : p
        )
      );
    }
    return tx;
  };

  return {
    categories,
    products,
    transactions,
    loading,
    refresh,
    addCategory,
    updateCategory,
    deleteCategory,
    addProduct,
    updateProduct,
    deleteProduct,
    addTransaction,
  };
}
