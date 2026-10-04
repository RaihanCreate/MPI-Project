import { useEffect, useState, useCallback } from 'react';
import { supabase, type Category } from '@/lib/supabase';
import { Plus, Pencil, Trash2, Tags } from 'lucide-react';
import Modal from '@/components/Modal';
import ConfirmDialog from '@/components/ConfirmDialog';

type CategoriesPageProps = {
  onToast: (message: string, type?: 'success' | 'error') => void;
};

export default function CategoriesPage({ onToast }: CategoriesPageProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('categories').select('*').order('name');
    if (!error && data) {
      setCategories(data as Category[]);
      const { data: products } = await supabase.from('products').select('category_id');
      const c: Record<string, number> = {};
      (products ?? []).forEach((p) => {
        const cid = (p as { category_id: string | null }).category_id;
        if (cid) c[cid] = (c[cid] ?? 0) + 1;
      });
      setCounts(c);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const openAdd = () => {
    setEditing(null);
    setName('');
    setDescription('');
    setModalOpen(true);
  };

  const openEdit = (cat: Category) => {
    setEditing(cat);
    setName(cat.name);
    setDescription(cat.description ?? '');
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      onToast('Nama kategori wajib diisi', 'error');
      return;
    }
    setSaving(true);
    if (editing) {
      const { error } = await supabase
        .from('categories')
        .update({ name: name.trim(), description: description.trim() })
        .eq('id', editing.id);
      if (error) onToast('Gagal menyimpan', 'error');
      else {
        onToast('Kategori diperbarui');
        setModalOpen(false);
        fetchCategories();
      }
    } else {
      const { error } = await supabase
        .from('categories')
        .insert({ name: name.trim(), description: description.trim() });
      if (error) onToast('Gagal menambah kategori', 'error');
      else {
        onToast('Kategori ditambahkan');
        setModalOpen(false);
        fetchCategories();
      }
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from('categories').delete().eq('id', deleteId);
    if (error) {
      onToast('Gagal menghapus kategori', 'error');
    } else {
      onToast('Kategori dihapus');
      fetchCategories();
    }
    setDeleteId(null);
  };

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <div className="flex justify-end">
        <button onClick={openAdd} className="btn-primary">
          <Plus className="w-4 h-4" /> Tambah Kategori
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="card p-6 animate-pulse">
              <div className="w-12 h-12 rounded-xl bg-coffee-100 mb-4" />
              <div className="h-5 bg-coffee-100 rounded w-32 mb-2" />
              <div className="h-3 bg-coffee-100 rounded w-20" />
            </div>
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-coffee-100 flex items-center justify-center mx-auto mb-4">
            <Tags className="w-8 h-8 text-coffee-400" />
          </div>
          <p className="text-coffee-600 font-semibold mb-1">Belum ada kategori</p>
          <p className="text-coffee-400 text-sm">Tambahkan kategori untuk mengelompokkan produk</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => (
            <div key={cat.id} className="card p-5 hover:shadow-md transition-shadow group">
              <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 rounded-xl bg-coffee-100 flex items-center justify-center">
                  <Tags className="w-6 h-6 text-coffee-600" />
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(cat)} className="p-2 rounded-lg hover:bg-coffee-100 text-coffee-600">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => setDeleteId(cat.id)} className="p-2 rounded-lg hover:bg-red-50 text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <h3 className="font-display font-bold text-lg text-coffee-950">{cat.name}</h3>
              <p className="text-coffee-500 text-sm mt-1 line-clamp-2 min-h-[2.5rem]">
                {cat.description || 'Tidak ada deskripsi'}
              </p>
              <div className="mt-3 pt-3 border-t border-coffee-50">
                <span className="badge bg-coffee-100 text-coffee-700">
                  {counts[cat.id] ?? 0} produk
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Kategori' : 'Tambah Kategori'}
      >
        <div className="space-y-4">
          <div>
            <label className="label-field">Nama Kategori *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field"
              placeholder="Contoh: Minuman, Makanan, Sembako"
            />
          </div>
          <div>
            <label className="label-field">Deskripsi</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-field resize-none"
              rows={3}
              placeholder="Opsional"
            />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button onClick={() => setModalOpen(false)} className="btn-secondary">Batal</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary">
              {saving ? 'Menyimpan...' : editing ? 'Simpan' : 'Tambah'}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        title="Hapus Kategori"
        message="Yakin ingin menghapus kategori ini? Produk terkait tidak akan dihapus."
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
