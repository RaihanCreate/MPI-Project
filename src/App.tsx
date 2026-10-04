import { useState, useCallback } from 'react';
import Layout from '@/components/Layout';
import { type Page } from '@/components/Sidebar';
import Toast from '@/components/Toast';
import Dashboard from '@/pages/Dashboard';
import ProductsPage from '@/pages/ProductsPage';
import CategoriesPage from '@/pages/CategoriesPage';
import TransactionsPage from '@/pages/TransactionsPage';
import ReportsPage from '@/pages/ReportsPage';

const pageMeta: Record<Page, { title: string; subtitle: string }> = {
  dashboard: { title: 'Dashboard', subtitle: 'Ringkasan stok dan aktivitas' },
  products: { title: 'Produk', subtitle: 'Kelola daftar produk dan stok' },
  categories: { title: 'Kategori', subtitle: 'Kelompokkan produk Anda' },
  transactions: { title: 'Stok Masuk/Keluar', subtitle: 'Catat pergerakan stok' },
  reports: { title: 'Laporan', subtitle: 'Riwayat transaksi dan analisis' },
};

export default function App() {
  const [page, setPage] = useState<Page>('dashboard');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error'; show: boolean }>({
    message: '',
    type: 'success',
    show: false,
  });

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type, show: true });
    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 3000);
  }, []);

  const meta = pageMeta[page];

  return (
    <>
      <Layout
        current={page}
        onNavigate={setPage}
        title={meta.title}
        subtitle={meta.subtitle}
      >
        {page === 'dashboard' && <Dashboard onNavigate={setPage} />}
        {page === 'products' && <ProductsPage onToast={showToast} />}
        {page === 'categories' && <CategoriesPage onToast={showToast} />}
        {page === 'transactions' && <TransactionsPage onToast={showToast} />}
        {page === 'reports' && <ReportsPage />}
      </Layout>

      <Toast message={toast.message} type={toast.type} show={toast.show} />
    </>
  );
}
