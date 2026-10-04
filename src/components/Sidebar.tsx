import { Coffee, LayoutDashboard, Package, Tags, ArrowLeftRight, ClipboardList, X } from 'lucide-react';

export type Page = 'dashboard' | 'products' | 'categories' | 'transactions' | 'reports';

type SidebarProps = {
  current: Page;
  onNavigate: (page: Page) => void;
  open: boolean;
  onClose: () => void;
};

const navItems: { id: Page; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'products', label: 'Produk', icon: Package },
  { id: 'categories', label: 'Kategori', icon: Tags },
  { id: 'transactions', label: 'Stok Masuk/Keluar', icon: ArrowLeftRight },
  { id: 'reports', label: 'Laporan', icon: ClipboardList },
];

export default function Sidebar({ current, onNavigate, open, onClose }: SidebarProps) {
  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-coffee-950/40 backdrop-blur-sm z-30 lg:hidden animate-fade-in"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-72 bg-coffee-900 z-40
          flex flex-col transition-transform duration-300 lg:translate-x-0
          ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-6 py-6 border-b border-coffee-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-coffee-500 flex items-center justify-center shadow-lg">
              <Coffee className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-display font-bold text-white text-lg leading-tight">Lengkong Baraca</h1>
              <p className="text-coffee-300 text-xs">Manajemen Stok</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden text-coffee-300 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = current === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  onClose();
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold
                  transition-all duration-150 group
                  ${active
                    ? 'bg-coffee-500 text-white shadow-md'
                    : 'text-coffee-300 hover:bg-coffee-800 hover:text-white'
                  }`}
              >
                <Icon className={`w-5 h-5 ${active ? 'text-white' : 'text-coffee-400 group-hover:text-white'}`} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-coffee-800">
          <p className="text-coffee-400 text-xs text-center">
            Warkop Lengkong Baraca &copy; 2026
          </p>
        </div>
      </aside>
    </>
  );
}
