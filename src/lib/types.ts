export type Category = {
  id: string;
  name: string;
  description: string;
  created_at: string;
};

export type Product = {
  id: string;
  name: string;
  category_id: string | null;
  sku: string;
  unit: string;
  stock_quantity: number;
  min_stock_level: number;
  buy_price: number;
  sell_price: number;
  created_at: string;
  categories?: Category | null;
};

export type StockTransaction = {
  id: string;
  product_id: string;
  type: 'in' | 'out';
  quantity: number;
  note: string;
  created_at: string;
  products?: Product | null;
};

export type TransactionType = 'in' | 'out';
