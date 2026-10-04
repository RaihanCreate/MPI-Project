import { useEffect, useState, useCallback } from 'react';
import { supabase, type Product, type Category } from '@/lib/supabase';
import { Plus, Search, Pencil, Trash2, Package } from 'lucide-react';
import Modal from '@/components/Modal';
import ConfirmDialog from '@/components/ConfirmDialog';
import Toast from '@/components/Toast';
import { useCategories } from '@/hooks/useCategories';

type ProductsPageProps = {
  onToast: (message: string, type?: 'success' | 'error') => void;
};

type FormState = {
  name: string;
  category_id: string;
  sku: string;
  unit: string;
  stock_quantity: string;
  min_stock_level: string;
  buy_price: string;
  sell_price: string;
};

const emptyForm: FormState = {
  name: '',
  category_id: '',
  sku: '',
  unit: 'pcs',
  stock_quantity: '0',
  min_stock_level: '0',
  buy_price: '0',
  sell_price: '0',
};

export default function ProductsPage({ onToast }: ProductsPageProps) {
  const { categories } = useCategories();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*, categories(*)')
      .order('name');
    if (!error && data) setProducts(data as Product[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const filtered = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.sku ?? '').toLowerCase().includes(search.toLowerCase());
    const matchesCategory = filterCategory === 'all' || p.category_id === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({
      name: p.name,
      category_id: p.category_id ?? '',
      sku: p.sku ?? '',
      unit: p.unit,
      stock_quantity: String(p.stock_quantity),
      min_stock_level: String(p.min_stock_level),
      buy_price: String(p.buy_price),
      sell_price: String(p.sell_price),
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      onToast('Nama produk wajib diisi', 'error');
      return;
    }
    if (!form.unit.trim()) {
      onToast('Satuan wajib diisi', 'error');
      return;
    }

    setSaving(true);
    const payload = {
      name: form.name.trim(),
      category_id: form.category_id || null,
      sku: form.sku.trim(),
      unit: form.unit.trim(),
      stock_quantity: Number(form.stock_quantity) || 0,
      min_stock_level: Number(form.min_stock_level) || 0,
      buy_price: Number(form.buy_price) || 0,
      sell_price: Number(form.sell_price) || 0,
    };

    if (editing) {
      const { error } = await supabase.from('products').update(payload).eq('id', editing.id);
      if (error) {
        onToast('Gagal menyimpan perubahan', 'error');
      } else {
        onToast('Produk berhasil diperbarui');
        setModalOpen(false);
        fetchProducts();
      }
    } else {
      const { error } = await supabase.from('products').insert(payload);
      if (error) {
        onToast('Gagal menambah produk', 'error');
      } else {
        onToast('Produk berhasil ditambahkan');
        setModalOpen(false);
        fetchProducts();
      }
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from('products').delete().eq('id', deleteId);
    if (error) {
      onToast('Gagal menghapus produk', 'error');
    } else {
      onToast('Produk berhasil dihapus');
      fetchProducts();
    }
    setDeleteId(null);
  };

  const formatRupiah = (n: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

  const categoryName = (p: Product) =>
    (p.categories as unknown as { name: string } | null)?.name ?? '—';

  const isLowStock = (p: Product) => p.min_stock_level > 0 && p.stock_quantity <= p.min_stock_level;

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-coffee-400" />
          <input
            type="text"
            placeholder="Cari produk atau kode..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10"
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="input-field sm:w-52"
        >
          <option value="all">Semua Kategori</option>
          {categories.map((c: Category) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <button onClick={openAdd} className="btn-primary whitespace-nowrap">
          <Plus className="w-4 h-4" /> Tambah Produk
        </button>
      </div>

      {/* Table / cards */}
      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-xl bg-coffee-100" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-coffee-100 rounded w-40" />
                  <div className="h-3 bg-coffee-100 rounded w-24" />
                </div>
                <div className="h-8 bg-coffee-100 rounded w-20" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-coffee-100 flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-coffee-400" />
          </div>
          <p className="text-coffee-600 font-semibold mb-1">Belum ada produk</p>
          <p className="text-coffee-400 text-sm">Klik "Tambah Produk" untuk mulai mencatat stok</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="card overflow-hidden hidden lg:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-coffee-50 text-left text-coffee-600 font-semibold">
                  <th className="px-5 py-3.5">Produk</th>
                  <th className="px-5 py-3.5">Kategori</th>
                  <th className="px-5 py-3.5">Kode</th>
                  <th className="px-5 py-3.5 text-right">Stok</th>
                  <th className="px-5 py-3.5 text-right">Min. Stok</th>
                  <th className="px-5 py-3.5 text-right">Harga Beli</th>
                  <th className="px-5 py-3.5 text-right">Harga Jual</th>
                  <th className="px-5 py-3.5 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-coffee-50">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-coffee-50/50 transition-colors">
                    <td className="px-5 py-4 font-semibold text-coffee-950">{p.name}</td>
                    <td className="px-5 py-4 text-coffee-600">{categoryName(p)}</td>
                    <td className="px-5 py-4 text-coffee-400">{p.sku || '—'}</td>
                    <td className="px-5 py-4 text-right">
                      <span className={`badge ${isLowStock(p) ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                        {p.stock_quantity} {p.unit}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right text-coffee-500">{p.min_stock_level}</td>
                    <td className="px-5 py-4 text-right text-coffee-600">{formatRupiah(p.buy_price)}</td>
                    <td className="px-5 py-4 text-right text-coffee-600">{formatRupiah(p.sell_price)}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => openEdit(p)} className="p-2 rounded-lg hover:bg-coffee-100 text-coffee-600 transition-colors">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => setDeleteId(p.id)} className="p-2 rounded-lg hover:bg-red-50 text-red-500 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="lg:hidden space-y-3">
            {filtered.map((p) => (
              <div key={p.id} className="card p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-coffee-950 truncate">{p.name}</p>
                    <p className="text-xs text-coffee-400">{categoryName(p)} · {p.sku || 'tanpa kode'}</p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={() => openEdit(p)} className="p-2 rounded-lg hover:bg-coffee-100 text-coffee-600">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => setDeleteId(p.id)} className="p-2 rounded-lg hover:bg-red-50 text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex justify-between px-3 py-2 rounded-lg bg-coffee-50">
                    <span className="text-coffee-500">Stok</span>
                    <span className={`font-semibold ${isLowStock(p) ? 'text-amber-600' : 'text-green-600'}`}>
                      {p.stock_quantity} {p.unit}
                    </span>
                  </div>
                  <div className="flex justify-between px-3 py-2 rounded-lg bg-coffee-50">
                    <span className="text-coffee-500">Min.</span>
                    <span className="font-semibold text-coffee-700">{p.min_stock_level}</span>
                  </div>
                  <div className="flex justify-between px-3 py-2 rounded-lg bg-coffee-50">
                    <span className="text-coffee-500">Beli</span>
                    <span className="font-semibold text-coffee-700 text-xs">{formatRupiah(p.buy_price)}</span>
                  </div>
                  <div className="flex justify-between px-3 py-2 rounded-lg bg-coffee-50">
                    <span className="text-coffee-500">Jual</span>
                    <span className="font-semibold text-coffee-700 text-xs">{formatRupiah(p.sell_price)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Add/Edit modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Produk' : 'Tambah Produk'}
      >
        <div className="space-y-4">
          <div>
            <label className="label-field">Nama Produk *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="input-field"
              placeholder="Contoh: Kopi Robusta 250g"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-field">Kategori</label>
              <select
                value={form.category_id}
                onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                className="input-field"
              >
                <option value="">— Pilih —</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-field">Kode (SKU)</label>
              <input
                type="text"
                value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value })}
                className="input-field"
                placeholder="Opsional"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-field">Satuan *</label>
              <input
                type="text"
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
                className="input-field"
                placeholder="pcs, kg, box, botol"
              />
            </div>
            <div>
              <label className="label-field">Stok Awal</label>
              <input
                type="number"
                value={form.stock_quantity}
                onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })}
                className="input-field"
                disabled={!!editing}
              />
              {editing && (
                <p className="text-xs text-coffee-400 mt-1">Stok diatur via transaksi</p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-field">Stok Minimum</label>
              <input
                type="number"
                value={form.min_stock_level}
                onChange={(e) => setForm({ ...form, min_stock_level: e.target.value })}
                className="input-field"
                placeholder="0"
              />
            </div>
            <div />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-field">Harga Beli (Rp)</label>
              <input
                type="number"
                value={form.buy_price}
                onChange={(e) => setForm({ ...form, buy_price: e.target.value })}
                className="input-field"
                placeholder="0"
              />
            </div>
            <div>
              <label className="label-field">Harga Jual (Rp)</label>
              <input
                type="number"
                value={form.sell_price}
                onChange={(e) => setForm({ ...form, sell_price: e.target.value })}
                className="input-field"
                placeholder="0"
              />
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button onClick={() => setModalOpen(false)} className="btn-secondary">Batal</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary">
              {saving ? 'Menyimpan...' : editing ? 'Simpan Perubahan' : 'Tambah Produk'}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        title="Hapus Produk"
        message="Yakin ingin menghapus produk ini? Semua riwayat transaksi terkait juga akan dihapus."
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
