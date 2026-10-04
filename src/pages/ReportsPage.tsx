import { useMemo, useState } from 'react';
import { useStore } from '@/lib/store';
import { Search, TrendingUp, TrendingDown, FileDown, ClipboardList } from 'lucide-react';

type ReportsPageProps = {
  store: ReturnType<typeof useStore>;
};

export default function ReportsPage({ store }: ReportsPageProps) {
  const { transactions, products, categories } = store;
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'in' | 'out'>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const rows = useMemo(() => {
    return transactions.map((tx) => {
      const product = products.find((p) => p.id === tx.product_id);
      const category = categories.find((c) => c.id === product?.category_id);
      return {
        id: tx.id,
        product_name: product?.name ?? '—',
        product_unit: product?.unit ?? '',
        category_name: category?.name ?? null,
        type: tx.type,
        quantity: tx.quantity,
        note: tx.note ?? '',
        created_at: tx.created_at,
      };
    });
  }, [transactions, products, categories]);

  const filtered = rows.filter((r) => {
    const matchesSearch = r.product_name.toLowerCase().includes(search.toLowerCase()) ||
      r.note.toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === 'all' || r.type === filterType;
    let matchesDate = true;
    if (dateFrom) {
      const from = new Date(dateFrom);
      from.setHours(0, 0, 0, 0);
      matchesDate = new Date(r.created_at) >= from;
    }
    if (dateTo && matchesDate) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      matchesDate = new Date(r.created_at) <= to;
    }
    return matchesSearch && matchesType && matchesDate;
  });

  const totalIn = filtered.filter((r) => r.type === 'in').reduce((s, r) => s + r.quantity, 0);
  const totalOut = filtered.filter((r) => r.type === 'out').reduce((s, r) => s + r.quantity, 0);

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const exportCSV = () => {
    const header = 'Tanggal,Produk,Kategori,Tipe,Jumlah,Satuan,Catatan\n';
    const csv = filtered.map((r) =>
      `${formatTime(r.created_at)},"${r.product_name}","${r.category_name ?? ''}",${r.type === 'in' ? 'Masuk' : 'Keluar'},${r.quantity},"${r.product_unit}","${r.note}"`
    ).join('\n');
    const blob = new Blob([header + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `laporan-stok-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-coffee-100 flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-coffee-700" />
            </div>
            <div>
              <p className="text-coffee-500 text-sm">Total Transaksi</p>
              <p className="font-display font-bold text-2xl text-coffee-950">{filtered.length}</p>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-coffee-500 text-sm">Total Masuk</p>
              <p className="font-display font-bold text-2xl text-green-600">{totalIn}</p>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-coffee-500 text-sm">Total Keluar</p>
              <p className="font-display font-bold text-2xl text-red-600">{totalOut}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-coffee-400" />
            <input
              type="text"
              placeholder="Cari produk atau catatan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as 'all' | 'in' | 'out')}
            className="input-field lg:w-44"
          >
            <option value="all">Semua Tipe</option>
            <option value="in">Stok Masuk</option>
            <option value="out">Stok Keluar</option>
          </select>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="input-field lg:w-40"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="input-field lg:w-40"
          />
          <button onClick={exportCSV} className="btn-secondary whitespace-nowrap">
            <FileDown className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* Table */}
      {store.loading ? (
        <div className="space-y-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="h-14 bg-coffee-50 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-coffee-100 flex items-center justify-center mx-auto mb-4">
            <ClipboardList className="w-8 h-8 text-coffee-400" />
          </div>
          <p className="text-coffee-600 font-semibold mb-1">Tidak ada data</p>
          <p className="text-coffee-400 text-sm">Belum ada transaksi pada periode ini</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-coffee-50 text-left text-coffee-600 font-semibold">
                  <th className="px-5 py-3.5">Tanggal</th>
                  <th className="px-5 py-3.5">Produk</th>
                  <th className="px-5 py-3.5">Kategori</th>
                  <th className="px-5 py-3.5">Tipe</th>
                  <th className="px-5 py-3.5 text-right">Jumlah</th>
                  <th className="px-5 py-3.5">Catatan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-coffee-50">
                {filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-coffee-50/50 transition-colors">
                    <td className="px-5 py-4 text-coffee-500 whitespace-nowrap">{formatTime(r.created_at)}</td>
                    <td className="px-5 py-4 font-semibold text-coffee-950">{r.product_name}</td>
                    <td className="px-5 py-4 text-coffee-500">{r.category_name ?? '—'}</td>
                    <td className="px-5 py-4">
                      <span className={`badge ${r.type === 'in' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {r.type === 'in' ? 'Masuk' : 'Keluar'}
                      </span>
                    </td>
                    <td className={`px-5 py-4 text-right font-bold ${r.type === 'in' ? 'text-green-600' : 'text-red-600'}`}>
                      {r.type === 'in' ? '+' : '−'}{r.quantity} {r.product_unit}
                    </td>
                    <td className="px-5 py-4 text-coffee-500 max-w-xs truncate">{r.note || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
