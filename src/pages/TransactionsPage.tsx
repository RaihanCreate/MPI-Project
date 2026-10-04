import { useState } from 'react';
import { useStore } from '@/lib/store';
import { ArrowDownToLine, ArrowUpFromLine, Search, TrendingUp, TrendingDown } from 'lucide-react';

type TransactionsPageProps = {
  store: ReturnType<typeof useStore>;
  onToast: (message: string, type?: 'success' | 'error') => void;
};

type FormState = {
  product_id: string;
  quantity: string;
  note: string;
};

const emptyForm: FormState = { product_id: '', quantity: '1', note: '' };

export default function TransactionsPage({ store, onToast }: TransactionsPageProps) {
  const { products, transactions } = store;
  const [activeTab, setActiveTab] = useState<'in' | 'out'>('in');
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  const filteredHistory = transactions.filter((tx) => {
    const productName = products.find((p) => p.id === tx.product_id)?.name ?? '';
    return productName.toLowerCase().includes(search.toLowerCase());
  });

  const handleSubmit = () => {
    if (!form.product_id) {
      onToast('Pilih produk terlebih dahulu', 'error');
      return;
    }
    const qty = Number(form.quantity);
    if (!qty || qty <= 0) {
      onToast('Jumlah harus lebih dari 0', 'error');
      return;
    }

    if (activeTab === 'out') {
      const product = products.find((p) => p.id === form.product_id);
      if (product && qty > product.stock_quantity) {
        onToast(`Stok tidak mencukupi. Tersedia: ${product.stock_quantity} ${product.unit}`, 'error');
        return;
      }
    }

    setSaving(true);
    store.addTransaction({
      product_id: form.product_id,
      type: activeTab,
      quantity: qty,
      note: form.note.trim(),
    });
    onToast(activeTab === 'in' ? 'Stok masuk berhasil dicatat' : 'Stok keluar berhasil dicatat');
    setForm(emptyForm);
    setSaving(false);
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const selectedProduct = products.find((p) => p.id === form.product_id);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Transaction form */}
      <div className="card p-6">
        {/* Tabs */}
        <div className="flex gap-2 mb-6 p-1 bg-coffee-50 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab('in')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm transition-all
              ${activeTab === 'in' ? 'bg-green-600 text-white shadow-sm' : 'text-coffee-600 hover:bg-coffee-100'}`}
          >
            <ArrowDownToLine className="w-4 h-4" /> Stok Masuk
          </button>
          <button
            onClick={() => setActiveTab('out')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm transition-all
              ${activeTab === 'out' ? 'bg-red-600 text-white shadow-sm' : 'text-coffee-600 hover:bg-coffee-100'}`}
          >
            <ArrowUpFromLine className="w-4 h-4" /> Stok Keluar
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label-field">Produk *</label>
            <select
              value={form.product_id}
              onChange={(e) => setForm({ ...form, product_id: e.target.value })}
              className="input-field"
            >
              <option value="">— Pilih Produk —</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (Stok: {p.stock_quantity} {p.unit})
                </option>
              ))}
            </select>
            {selectedProduct && (
              <p className="text-xs text-coffee-500 mt-1.5">
                Stok saat ini: <span className="font-semibold">{selectedProduct.stock_quantity} {selectedProduct.unit}</span>
              </p>
            )}
          </div>
          <div>
            <label className="label-field">Jumlah *</label>
            <input
              type="number"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              className="input-field"
              min="1"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label-field">Catatan</label>
            <input
              type="text"
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              className="input-field"
              placeholder={activeTab === 'in' ? 'Contoh: Pembelian dari supplier' : 'Contoh: Penjualan, rusak, expired'}
            />
          </div>
        </div>

        <div className="flex justify-end mt-5">
          <button
            onClick={handleSubmit}
            disabled={saving}
            className={activeTab === 'in' ? 'btn-primary bg-green-600 hover:bg-green-700' : 'btn-primary bg-red-600 hover:bg-red-700'}
          >
            {saving ? 'Menyimpan...' : activeTab === 'in' ? 'Catat Stok Masuk' : 'Catat Stok Keluar'}
          </button>
        </div>
      </div>

      {/* Recent history */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-lg text-coffee-950">Riwayat Terbaru</h3>
          <div className="relative w-48">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-coffee-400" />
            <input
              type="text"
              placeholder="Cari..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-10 text-sm py-2"
            />
          </div>
        </div>

        {store.loading ? (
          <div className="space-y-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-14 bg-coffee-50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-coffee-400 text-sm">Belum ada transaksi</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredHistory.map((tx) => {
              const product = products.find((p) => p.id === tx.product_id);
              const productName = product?.name ?? '—';
              const productUnit = product?.unit ?? '';
              return (
                <div key={tx.id} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-coffee-50 transition-colors border border-coffee-50">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0
                    ${tx.type === 'in' ? 'bg-green-100' : 'bg-red-100'}`}>
                    {tx.type === 'in'
                      ? <TrendingUp className="w-5 h-5 text-green-600" />
                      : <TrendingDown className="w-5 h-5 text-red-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-coffee-950 truncate">{productName}</p>
                    <p className="text-xs text-coffee-400">
                      {formatTime(tx.created_at)}
                      {tx.note ? ` · ${tx.note}` : ''}
                    </p>
                  </div>
                  <div className={`font-bold text-sm flex-shrink-0 ${tx.type === 'in' ? 'text-green-600' : 'text-red-600'}`}>
                    {tx.type === 'in' ? '+' : '−'}{tx.quantity} {productUnit}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
