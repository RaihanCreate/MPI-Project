import { useState, type ReactNode } from 'react';
import { Menu, Coffee } from 'lucide-react';
import Sidebar, { type Page } from './Sidebar';

type LayoutProps = {
  current: Page;
  onNavigate: (page: Page) => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
};

export default function Layout({ current, onNavigate, title, subtitle, children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex">
      <Sidebar
        current={current}
        onNavigate={onNavigate}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-coffee-100">
          <div className="flex items-center gap-3 px-4 sm:px-6 lg:px-8 py-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-coffee-100 text-coffee-800"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="lg:hidden flex items-center gap-2 mr-auto">
              <div className="w-8 h-8 rounded-lg bg-coffee-500 flex items-center justify-center">
                <Coffee className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="hidden sm:block mr-auto">
              <h2 className="font-display font-bold text-xl text-coffee-950">{title}</h2>
              {subtitle && <p className="text-coffee-500 text-sm">{subtitle}</p>}
            </div>
            <div className="sm:hidden mr-auto">
              <h2 className="font-display font-bold text-lg text-coffee-950">{title}</h2>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}
