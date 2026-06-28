import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import type { RootState } from '../../store';
import { logout } from '../../store/authSlice';
import { 
  LayoutDashboard, 
  Package, 
  Database, 
  ShoppingCart, 
  FileText, 
  LogOut, 
  Menu, 
  X,
  User,
  Settings,
  Store,
  ChevronDown,
  ShoppingBag,
  CreditCard,
  ShieldAlert,
  HelpCircle,
  Calculator
} from 'lucide-react';
import { cn } from '../../lib/utils';
import PaywallOverlay from '../common/PaywallOverlay';

const SidebarItem = ({ 
  icon: Icon, 
  label, 
  active,
  hasChildren,
  isExpanded
}: { 
  icon: any, 
  label: string, 
  active: boolean,
  hasChildren?: boolean,
  isExpanded?: boolean
}) => (
  <div
    className={cn(
      "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group w-full text-left",
      active 
        ? "bg-emerald-600 text-white shadow-lg shadow-emerald-100" 
        : "text-slate-500 hover:bg-slate-50 hover:text-emerald-600"
    )}
  >
    <Icon className={cn("w-5 h-5 shrink-0", active ? "text-white" : "text-slate-400 group-hover:text-emerald-600")} />
    <span className="font-medium flex-1 truncate">{label}</span>
    {hasChildren && (
      <ChevronDown className={cn(
        "w-4 h-4 transition-transform duration-200",
        isExpanded ? "rotate-180" : "",
        active ? "text-white" : "text-slate-400"
      )} />
    )}
    {!hasChildren && active && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
  </div>
);

const MainLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['Master Data', 'Inventory']); // Default open Master Data & Inventory
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const { fullName, role, tenantId, billingStatus } = useSelector((state: RootState) => state.auth);
  const location = useLocation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  React.useEffect(() => {
    const handleResize = () => {
      setSidebarOpen(window.innerWidth >= 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleNavigation = (to: string) => {
    navigate(to);
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  const toggleMenu = (label: string) => {
    setExpandedMenus(prev => 
      prev.includes(label) 
        ? prev.filter(m => m !== label) 
        : [...prev, label]
    );
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
    setLogoutModalOpen(false);
  };

  const menuItems = [
    { label: 'Dashboard', icon: LayoutDashboard, to: '/dashboard', roles: ['ADMIN', 'OWNER', 'STAFF', 'CASHIER', 'KASIR'] },
    { label: 'Super Admin Panel', icon: ShieldAlert, to: '/dashboard/super-admin', roles: ['ADMIN', 'OWNER'], isSuperAdmin: true },
    { 
      label: 'Penjualan', 
      icon: ShoppingCart, 
      to: '/dashboard/pos',
      roles: ['ADMIN', 'OWNER', 'CASHIER', 'KASIR', 'STAFF'],
      children: [
        { label: 'POS Kasir', to: '/dashboard/pos', roles: ['ADMIN', 'OWNER', 'CASHIER', 'KASIR'] },
        { label: 'Retur Penjualan', to: '/dashboard/sales/returns', roles: ['ADMIN', 'OWNER', 'CASHIER', 'KASIR', 'STAFF'] },
      ]
    },
    { 
      label: 'Inventory', 
      icon: Package, 
      to: '/dashboard/inventory',
      roles: ['ADMIN', 'OWNER', 'STAFF', 'CASHIER', 'KASIR'],
      children: [
        { label: 'Stok Barang', to: '/dashboard/inventory', roles: ['ADMIN', 'OWNER', 'STAFF'] },
        { label: 'Stock Opname', to: '/dashboard/inventory/opname', roles: ['ADMIN', 'OWNER', 'STAFF', 'CASHIER', 'KASIR'] },
        { label: 'Transfer Stok', to: '/dashboard/inventory/transfer', roles: ['ADMIN', 'OWNER', 'STAFF', 'CASHIER', 'KASIR'] },
        { label: 'Riwayat Mutasi', to: '/dashboard/inventory/movements', roles: ['ADMIN', 'OWNER', 'STAFF', 'CASHIER', 'KASIR'] },
      ]
    },
    { 
      label: 'Pembelian', 
      icon: ShoppingBag, 
      to: '/dashboard/purchasing',
      roles: ['ADMIN', 'OWNER', 'STAFF', 'CASHIER', 'KASIR'],
      children: [
        { label: 'Riwayat Pembelian', to: '/dashboard/purchasing', roles: ['ADMIN', 'OWNER', 'STAFF'] },
        { label: 'Input Baru', to: '/dashboard/purchasing/new', roles: ['ADMIN', 'OWNER', 'STAFF', 'CASHIER', 'KASIR'] },
      ]
    },
    { 
      label: 'Master Data', 
      icon: Database, 
      to: '/dashboard/master',
      roles: ['ADMIN', 'OWNER', 'STAFF', 'CASHIER', 'KASIR'],
      children: [
        { label: 'Cabang', to: '/dashboard/master/branches', roles: ['ADMIN', 'OWNER'] },
        { label: 'Kategori', to: '/dashboard/master/categories', roles: ['ADMIN', 'OWNER', 'STAFF'] },
        { label: 'Produk', to: '/dashboard/master/products', roles: ['ADMIN', 'OWNER', 'STAFF', 'CASHIER', 'KASIR'] },
        { label: 'Supplier', to: '/dashboard/master/suppliers', roles: ['ADMIN', 'OWNER', 'STAFF', 'CASHIER', 'KASIR'] },
        { label: 'Pelanggan', to: '/dashboard/master/customers', roles: ['ADMIN', 'OWNER', 'STAFF', 'CASHIER', 'KASIR'] },
        { label: 'Pengguna', to: '/dashboard/master/users', roles: ['ADMIN', 'OWNER'] },
      ]
    },
    { 
      label: 'Laporan', 
      icon: FileText, 
      to: '/dashboard/reports',
      roles: ['ADMIN', 'OWNER', 'STAFF'],
      children: [
        { label: 'Ringkasan Laporan', to: '/dashboard/reports', roles: ['ADMIN', 'OWNER', 'STAFF'] },
        { label: 'Shift Kasir', to: '/dashboard/reports/shifts', roles: ['ADMIN', 'OWNER'] },
        { label: 'Biaya Operasional', to: '/dashboard/finance/expenses', roles: ['ADMIN', 'OWNER', 'STAFF'] },
        { label: 'Laba Rugi', to: '/dashboard/reports/profit-loss', roles: ['ADMIN', 'OWNER'] },
      ]
    },
    { 
      label: 'Hutang & Piutang', 
      icon: CreditCard, 
      to: '/dashboard/debts',
      roles: ['ADMIN', 'OWNER', 'STAFF']
    },
    { 
      label: 'Kalkulator Dosis', 
      icon: Calculator, 
      to: '/dashboard/dosage-calculator',
      roles: ['ADMIN', 'OWNER', 'STAFF', 'CASHIER', 'KASIR']
    },
    { label: 'Pengaturan', icon: Settings, to: '/dashboard/settings', roles: ['ADMIN', 'OWNER'] },
    { label: 'Pusat Bantuan', icon: HelpCircle, to: '/dashboard/help', roles: ['ADMIN', 'OWNER', 'STAFF'] },
  ];

  const getEffectiveTo = (item: any) => {
    if (item.label === 'Penjualan' && (role === 'CASHIER' || role === 'KASIR')) {
      return '/dashboard/pos';
    }
    if (item.label === 'Inventory' && (role === 'CASHIER' || role === 'KASIR')) {
      return '/dashboard/inventory/opname';
    }
    if (item.label === 'Pembelian' && (role === 'CASHIER' || role === 'KASIR')) {
      return '/dashboard/purchasing/new';
    }
    if (item.label === 'Master Data' && (role === 'CASHIER' || role === 'KASIR')) {
      return '/dashboard/master/products';
    }
    return item.to;
  };

  const filteredMenuItems = menuItems.filter(item => {
    if (item.isSuperAdmin && tenantId !== 'SYSTEM') return false;
    return item.roles.includes(role || '');
  }).map(item => ({
    ...item,
    children: item.children ? item.children.filter(child => child.roles.includes(role || '')) : undefined
  })).filter(item => !item.children || item.children.length > 0 || !item.to.includes('/master'));

  return (
    <div className="min-h-screen bg-slate-50 flex overflow-x-hidden">
      {/* Paywall blocker overlay */}
      {tenantId !== 'SYSTEM' && (billingStatus === 'EXPIRED' || billingStatus === 'SUSPENDED' || billingStatus === 'PENDING') && (
        <PaywallOverlay />
      )}

      {/* Sidebar Overlay for Mobile/Tablet */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden animate-in fade-in duration-300" 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed lg:sticky top-0 h-screen bg-white border-r border-slate-100 z-50 transition-all duration-300 ease-in-out",
          sidebarOpen ? "w-72 translate-x-0" : "w-0 -translate-x-full lg:w-20 lg:translate-x-0"
        )}
      >
        <div className="h-full flex flex-col p-4 overflow-hidden">
          <div className="flex items-center gap-3 px-2 mb-10 h-12 shrink-0">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-100 shrink-0">
              <Store className="text-white w-6 h-6" />
            </div>
            {(sidebarOpen || window.innerWidth < 1024) && (
              <span className="text-xl font-bold text-slate-800 whitespace-nowrap">G-Apotek v2</span>
            )}
          </div>

          <nav className="flex-1 space-y-2 overflow-y-auto no-scrollbar">
            {filteredMenuItems.map((item) => {
              const effectiveTo = getEffectiveTo(item);
              const isActive = location.pathname === item.to || (item.to !== '/dashboard' && location.pathname.startsWith(item.to));
              const isExpanded = expandedMenus.includes(item.label);
              
              return (
                <div key={item.label} className="space-y-1">
                  <button
                    onClick={() => {
                      if (item.children) {
                        toggleMenu(item.label);
                        handleNavigation(effectiveTo);
                      } else {
                        handleNavigation(effectiveTo);
                      }
                    }}
                    className="w-full focus:outline-none"
                  >
                    <SidebarItem
                      icon={item.icon}
                      label={sidebarOpen ? item.label : ''}
                      active={isActive}
                      hasChildren={!!item.children && sidebarOpen}
                      isExpanded={isExpanded}
                    />
                  </button>
                  
                  {item.children && sidebarOpen && isExpanded && (
                    <div className="pl-12 space-y-1 animate-in slide-in-from-top-2 duration-300">
                      {item.children.map((child) => (
                        <Link
                          key={child.to}
                          to={child.to}
                          onClick={() => window.innerWidth < 1024 && setSidebarOpen(false)}
                          className={cn(
                            "block py-2 text-sm transition-colors relative",
                            location.pathname === child.to 
                              ? "text-emerald-600 font-semibold" 
                              : "text-slate-500 hover:text-emerald-600"
                          )}
                        >
                          {location.pathname === child.to && (
                            <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-emerald-600 rounded-full" />
                          )}
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          <div className="mt-auto pt-4 border-t border-slate-100">
            <button
              onClick={() => setLogoutModalOpen(true)}
              className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 hover:bg-rose-50 hover:text-rose-600 rounded-xl transition-all duration-200 group"
            >
              <LogOut className="w-5 h-5 text-slate-400 group-hover:text-rose-600" />
              {sidebarOpen && <span className="font-medium">Logout</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="h-16 md:h-20 bg-white border-b border-slate-100 flex items-center justify-between px-4 md:px-8 shrink-0">
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-slate-50 rounded-lg text-slate-500 transition-colors"
          >
            {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          <div className="flex items-center gap-4">
            <Link 
              to="/dashboard/settings" 
              className="flex items-center gap-4 hover:bg-slate-50 p-2 rounded-2xl transition-all group"
            >
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-800 leading-none mb-1 group-hover:text-emerald-600 transition-colors">{fullName}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{role}</p>
              </div>
              <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center shrink-0 border border-emerald-100 group-hover:bg-emerald-100 transition-colors">
                <User className="w-6 h-6 text-emerald-600" />
              </div>
            </Link>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-4 md:p-8 no-scrollbar">
          <Outlet />
        </div>
      </main>

      {/* Logout Confirmation Modal */}
      <Dialog
        isOpen={logoutModalOpen}
        onClose={() => setLogoutModalOpen(false)}
        title="Konfirmasi Logout"
        size="sm"
      >
        <div className="py-4 space-y-6">
          <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto text-rose-600">
             <LogOut className="w-8 h-8" />
          </div>
          <div className="text-center space-y-2">
             <h3 className="text-xl font-bold text-slate-800">Yakin ingin keluar?</h3>
             <p className="text-slate-500 text-sm">Anda akan dialihkan ke halaman login dan harus masuk kembali untuk mengakses sistem.</p>
          </div>
          <div className="flex gap-3">
             <Button variant="outline" className="flex-1 h-12 rounded-xl" onClick={() => setLogoutModalOpen(false)}>Batal</Button>
             <Button className="flex-1 h-12 bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-lg shadow-rose-100" onClick={handleLogout}>Keluar</Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default MainLayout;
