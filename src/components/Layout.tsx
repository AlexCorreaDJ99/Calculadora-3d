import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Calculator,
  Box,
  Package,
  Menu,
  X,
  Printer,
} from 'lucide-react';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/calculator', label: 'Calculadora', icon: Calculator },
  { to: '/pieces', label: 'Pecas', icon: Box },
  { to: '/kits', label: 'Kits', icon: Package },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-surface-200 fixed inset-y-0 z-30">
        <div className="flex items-center gap-3 px-6 h-16 border-b border-surface-200">
          <div className="w-9 h-9 rounded-lg bg-brand-600 flex items-center justify-center">
            <Printer className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-surface-900 leading-tight">
              Custos 3D
            </h1>
            <p className="text-[11px] text-surface-500 leading-tight">
              Calculadora de Custos
            </p>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const active = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  active
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-surface-600 hover:bg-surface-100 hover:text-surface-900'
                }`}
              >
                <item.icon className={`w-5 h-5 ${active ? 'text-brand-600' : ''}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar - Mobile */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-surface-200 transform transition-transform duration-300 lg:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-6 h-16 border-b border-surface-200">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-brand-600 flex items-center justify-center">
              <Printer className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-sm font-bold text-surface-900">Custos 3D</h1>
          </div>
          <button onClick={() => setMobileOpen(false)} className="p-1 text-surface-500">
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const active = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  active
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-surface-600 hover:bg-surface-100 hover:text-surface-900'
                }`}
              >
                <item.icon className={`w-5 h-5 ${active ? 'text-brand-600' : ''}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-1 lg:ml-64">
        {/* Mobile header */}
        <header className="lg:hidden sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-surface-200">
          <div className="flex items-center gap-3 px-4 h-14">
            <button
              onClick={() => setMobileOpen(true)}
              className="p-2 -ml-2 text-surface-600"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-brand-600 flex items-center justify-center">
                <Printer className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-bold text-surface-900">Custos 3D</span>
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto page-enter">
          {children}
        </main>
      </div>
    </div>
  );
}
