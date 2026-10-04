import { useMemo } from 'react';
import { type Product } from '@/lib/types';
import { useStore } from '@/lib/store';
import { Package, AlertTriangle, TrendingUp, TrendingDown, Boxes, ArrowLeftRight } from 'lucide-react';
import { type Page } from '@/components/Sidebar';

type DashboardProps = {
  store: ReturnType<typeof useStore>;
  onNavigate: (page: Page) => void;
};

export default function Dashboard({ store, onNavigate }: DashboardProps) {
  const { products, transactions, loading } = store;

  const stats = useMemo(() => {
    const lowStock = products.filter((p) => p.stock_quantity <= p.min_stock_level && p.min_stock_level > 0);
    const stockValue = products.reduce((sum, p) => sum + p.stock_quantity * p.buy_price, 0);
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const todayTx = transactions.filter((t) => new Date(t.created_at) >= startOfToday);
    return {
      totalProducts: products.length,
      lowStock,
      totalStockValue: stockValue,
      todayTransactions: todayTx.length,
    };
  }, [products, transactions]);

  const recentTransactions = useMemo(() => {
    return transactions.slice(0, 8);
  }, [transactions]);

  const formatRupiah = (n: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  const productName = (tx: typeof transactions[number]) =>
    products.find((p) => p.id === tx.product_id)?.name ?? '—';

  const statCards = [
    { label: 'Total Produk', value: stats.totalProducts.toString(), icon: Package, color: 'bg-coffee-700' },
    { label: 'Stok Menipis', value: stats.lowStock.length.toString(), icon: AlertTriangle, color: 'bg-amber-500' },
    { label: 'Nilai Stok', value: formatRupiah(stats.totalStockValue), icon: Boxes, color: 'bg-emerald-600' },
    { label: 'Transaksi Hari Ini', value: stats.todayTransactions.toString(), icon: ArrowLeftRight, color: 'bg-blue-600' },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="card p-6 animate-pulse">
              <div className="w-12 h-12 rounded-xl bg-coffee-100 mb-4" />
              <div className="h-4 bg-coffee-100 rounded w-24 mb-2" />
              <div className="h-6 bg-coffee-100 rounded w-16" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="card p-5 hover:shadow-md transition-shadow">
              <div className={`w-12 h-12 rounded-xl ${card.color} flex items-center justify-center mb-4`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <p className="text-coffee-500 text-sm font-medium">{card.label}</p>
              <p className="font-display font-bold text-xl sm:text-2xl text-coffee-950 mt-1">{card.value}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low stock alerts */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-coffee-950">Stok Menipis</h3>
              <p className="text-coffee-500 text-sm">Produk yang perlu segera diisi</p>
            </div>
          </div>

          {stats.lowStock.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-coffee-400 text-sm">Semua stok aman</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {stats.lowStock.map((p) => {
                const cat = store.categories.find((c) => c.id === p.category_id);
                return (
                  <div key={p.id} className="flex items-center justify-between px-4 py-3 rounded-xl bg-amber-50 border border-amber-100">
                    <div>
                      <p className="font-semibold text-sm text-coffee-950">{p.name}</p>
                      <p className="text-xs text-coffee-500">{cat?.name ?? 'Tanpa kategori'}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm text-amber-700">{p.stock_quantity} {p.unit}</p>
                      <p className="text-xs text-coffee-400">Min: {p.min_stock_level}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {stats.lowStock.length > 0 && (
            <button onClick={() => onNavigate('transactions')} className="btn-primary w-full mt-4">
              <ArrowLeftRight className="w-4 h-4" /> Tambah Stok
            </button>
          )}
        </div>

        {/* Recent transactions */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-coffee-100 flex items-center justify-center">
              <ArrowLeftRight className="w-5 h-5 text-coffee-700" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-coffee-950">Transaksi Terbaru</h3>
              <p className="text-coffee-500 text-sm">Riwayat stok masuk & keluar</p>
            </div>
          </div>

          {recentTransactions.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-coffee-400 text-sm">Belum ada transaksi</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {recentTransactions.map((tx) => (
                <div key={tx.id} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-coffee-50 transition-colors">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0
                    ${tx.type === 'in' ? 'bg-green-100' : 'bg-red-100'}`}>
                    {tx.type === 'in'
                      ? <TrendingUp className="w-4 h-4 text-green-600" />
                      : <TrendingDown className="w-4 h-4 text-red-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-coffee-950 truncate">{productName(tx)}</p>
                    <p className="text-xs text-coffee-400">{formatTime(tx.created_at)}</p>
                  </div>
                  <div className={`font-bold text-sm flex-shrink-0 ${tx.type === 'in' ? 'text-green-600' : 'text-red-600'}`}>
                    {tx.type === 'in' ? '+' : '−'}{tx.quantity}
                  </div>
                </div>
              ))}
            </div>
          )}

          {recentTransactions.length > 0 && (
            <button onClick={() => onNavigate('reports')} className="btn-secondary w-full mt-4">
              Lihat Semua Laporan
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
