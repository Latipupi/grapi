import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
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
  Store
} from 'lucide-react';
import { cn } from '../../lib/utils';

const SidebarItem = ({ 
  icon: Icon, 
  label, 
  to, 
  active 
}: { 
  icon: any, 
  label: string, 
  to: string, 
  active: boolean 
}) => (
  <Link
    to={to}
    className={cn(
      "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
      active 
        ? "bg-blue-600 text-white shadow-lg shadow-blue-100" 
        : "text-slate-500 hover:bg-slate-50 hover:text-blue-600"
    )}
  >
    <Icon className={cn("w-5 h-5", active ? "text-white" : "text-slate-400 group-hover:text-blue-600")} />
    <span className="font-medium">{label}</span>
    {active && <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full" />}
  </Link>
);

const MainLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { fullName, role } = useSelector((state: RootState) => state.auth);
  const location = useLocation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleNavigation = (to: string) => {
    navigate(to);
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const menuItems = [
    { label: 'Dashboard', icon: LayoutDashboard, to: '/' },
    { label: 'POS Kasir', icon: ShoppingCart, to: '/pos' },
    { 
      label: 'Master Data', 
      icon: Database, 
      to: '/master',
      children: [
        { label: 'Cabang', to: '/master/branches' },
        { label: 'Kategori', to: '/master/categories' },
        { label: 'Produk', to: '/master/products' },
      ]
    },
    { label: 'Inventory', icon: Package, to: '/inventory' },
    { label: 'Laporan', icon: FileText, to: '/reports' },
    { label: 'Pengaturan', icon: Settings, to: '/settings' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex overflow-x-hidden">
      {/* Sidebar Overlay for Mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-300" 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed md:sticky top-0 h-screen bg-white border-r border-slate-100 z-50 transition-all duration-300 ease-in-out",
          sidebarOpen ? "w-72 translate-x-0" : "w-0 -translate-x-full md:w-20 md:translate-x-0"
        )}
      >
        <div className="h-full flex flex-col p-4 overflow-hidden">
          <div className="flex items-center gap-3 px-2 mb-10 h-12 shrink-0">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-100 shrink-0">
              <Store className="text-white w-6 h-6" />
            </div>
            {(sidebarOpen || window.innerWidth < 768) && (
              <span className="text-xl font-bold text-slate-800 whitespace-nowrap">G-Apotek</span>
            )}
          </div>

          <nav className="flex-1 space-y-2 overflow-y-auto no-scrollbar">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to));
              
              return (
                <div key={item.label} className="space-y-1">
                  <button
                    onClick={() => item.children ? null : handleNavigation(item.to)}
                    className="w-full"
                  >
                    <SidebarItem
                      icon={item.icon}
                      label={sidebarOpen ? item.label : ''}
                      to={item.children ? '#' : item.to}
                      active={isActive}
                    />
                  </button>
                  
                  {item.children && sidebarOpen && isActive && (
                    <div className="pl-12 space-y-1 animate-in slide-in-from-top-2 duration-300">
                      {item.children.map((child) => (
                        <Link
                          key={child.to}
                          to={child.to}
                          onClick={() => window.innerWidth < 768 && setSidebarOpen(false)}
                          className={cn(
                            "block py-2 text-sm transition-colors",
                            location.pathname === child.to 
                              ? "text-blue-600 font-semibold" 
                              : "text-slate-500 hover:text-blue-600"
                          )}
                        >
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
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all duration-200 group"
            >
              <LogOut className="w-5 h-5 text-slate-400 group-hover:text-red-600" />
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
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-slate-800 leading-none mb-1">{fullName}</p>
              <p className="text-xs text-slate-500">{role}</p>
            </div>
            <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center shrink-0">
              <User className="w-6 h-6 text-slate-400" />
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-4 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
