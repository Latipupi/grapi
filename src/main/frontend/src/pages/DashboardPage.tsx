import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';
import api from '../api/api';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { 
  TrendingUp, 
  ShoppingCart, 
  AlertCircle, 
  Package, 
  ArrowRight,
  Calendar,
  DollarSign
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';

const DashboardPage: React.FC = () => {
  const { fullName, branchId } = useSelector((state: RootState) => state.auth);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard', 'stats', branchId],
    queryFn: () => api.get(`/dashboard/stats?branchId=${branchId || ''}`).then(res => res.data),
  });

  const { data: activities, isLoading: activitiesLoading } = useQuery({
    queryKey: ['dashboard', 'activities', branchId],
    queryFn: () => api.get(`/dashboard/recent-activities?branchId=${branchId || ''}`).then(res => res.data),
  });

  const { data: trend, isLoading: trendLoading } = useQuery({
    queryKey: ['dashboard', 'trend', branchId],
    queryFn: () => api.get(`/reports/sales-trend?branchId=${branchId || ''}`).then(res => res.data),
  });

  const { data: alerts, isLoading: alertsLoading } = useQuery({
    queryKey: ['dashboard', 'alerts', branchId],
    queryFn: () => api.get(`/dashboard/alerts?branchId=${branchId || ''}`).then(res => res.data),
  });

  const formatRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Baru saja';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} menit yang lalu`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} jam yang lalu`;
    return date.toLocaleDateString('id-ID');
  };

  const statCards = [
    { 
      label: 'Penjualan Hari Ini', 
      value: `Rp ${stats?.totalSalesToday?.toLocaleString() || 0}`, 
      icon: DollarSign, 
      color: 'text-emerald-600', 
      bg: 'bg-emerald-50',
      link: '/dashboard/reports'
    },
    { 
      label: 'Transaksi Hari Ini', 
      value: stats?.transactionsToday || 0, 
      icon: ShoppingCart, 
      color: 'text-sky-600', 
      bg: 'bg-sky-50',
      link: '/dashboard/pos'
    },
    { 
      label: 'Obat Expired', 
      value: stats?.expiredProductsCount || 0, 
      icon: AlertCircle, 
      color: 'text-rose-600', 
      bg: 'bg-rose-50',
      link: '/dashboard/inventory' 
    },
    { 
      label: 'Stok Menipis', 
      value: stats?.lowStockProductsCount || 0, 
      icon: Package, 
      color: 'text-amber-600', 
      bg: 'bg-amber-50',
      link: '/dashboard/inventory?filter=low-stock'
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Welcome Header */}
      <div className="relative overflow-hidden bg-slate-900 rounded-3xl p-8 md:p-12 text-white shadow-2xl shadow-slate-200">
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-3xl md:text-4xl font-black mb-4">Selamat Datang, {fullName}! 👋</h1>
          <p className="text-slate-400 text-lg mb-8 leading-relaxed">
            Sistem GApotek siap membantu Anda mengelola inventori dan penjualan secara efisien hari ini.
          </p>
          <div className="flex flex-wrap gap-4">
             <Link to="/dashboard/pos">
                <Button className="bg-emerald-600 hover:bg-emerald-700 h-12 px-8 rounded-xl font-bold shadow-lg shadow-emerald-500/20">
                   Buka Kasir POS
                </Button>
             </Link>
             <Link to="/dashboard/inventory">
                <Button variant="outline" className="border-white/20 hover:bg-white/10 h-12 px-8 rounded-xl font-bold text-white">
                   Cek Stok Barang
                </Button>
             </Link>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-emerald-600/20 to-transparent pointer-events-none" />
        <TrendingUp className="absolute -bottom-10 -right-10 w-64 h-64 text-white/5 rotate-12" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => (
          <Link 
            key={i} 
            to={stat.link}
            className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md hover:border-slate-200 transition-all group relative overflow-hidden block cursor-pointer"
          >
            <div className="flex justify-between items-start mb-4">
              <div className={cn("p-3 rounded-xl", stat.bg)}>
                <stat.icon className={cn("w-6 h-6", stat.color)} />
              </div>
              <div className="text-slate-300 group-hover:text-emerald-600 transition-colors">
                <ArrowRight className="w-5 h-5" />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">{stat.label}</p>
              {statsLoading ? (
                <Skeleton className="h-8 w-28 mt-1" />
              ) : (
                <h3 className="text-2xl font-black text-slate-800">{stat.value}</h3>
              )}
            </div>
            <div className={cn("absolute bottom-0 left-0 h-1 w-full opacity-10", stat.color.replace('text-', 'bg-'))} />
          </Link>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sales Trend Chart */}
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl font-bold text-slate-800">Tren Penjualan</h2>
              <p className="text-sm text-slate-500">7 Hari Terakhir</p>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 bg-slate-50 px-3 py-1.5 rounded-lg">
               <Calendar className="w-3.5 h-3.5" />
               UPDATE OTOMATIS
            </div>
          </div>
          <div className="h-[300px] w-full">
            {trendLoading ? (
               <div className="h-full w-full flex flex-col gap-4">
                 <Skeleton className="h-[240px] w-full rounded-2xl" />
                 <div className="flex justify-between w-full px-2">
                   <Skeleton className="h-4 w-12" />
                   <Skeleton className="h-4 w-12" />
                   <Skeleton className="h-4 w-12" />
                   <Skeleton className="h-4 w-12" />
                   <Skeleton className="h-4 w-12" />
                 </div>
               </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#94a3b8', fontSize: 12}}
                    tickFormatter={(val) => new Date(val).toLocaleDateString('id-ID', { weekday: 'short' })}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#94a3b8', fontSize: 12}}
                    tickFormatter={(val) => `Rp ${val >= 1000000 ? (val/1000000).toFixed(1) + 'jt' : (val/1000).toFixed(0) + 'k'}`}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    formatter={(val: number) => [`Rp ${val.toLocaleString()}`, 'Penjualan']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="total" 
                    stroke="#10b981" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorTotal)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col max-h-[500px]">
          <h2 className="text-xl font-bold text-slate-800 mb-6">Aktivitas Terakhir</h2>
          <div className="flex-1 space-y-6 overflow-y-auto pr-2 no-scrollbar">
             {activitiesLoading ? (
                <div className="space-y-6">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="flex gap-4 items-start">
                      <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4 rounded" />
                        <Skeleton className="h-3 w-1/2 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
             ) : activities?.length === 0 ? (
                <div className="text-slate-400 text-sm italic">Belum ada aktivitas.</div>
             ) : (
                activities.map((activity: any, i: number) => (
                   <div key={i} className="flex gap-4 items-start group">
                       <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors",
                        activity.type === 'IN' ? 'bg-amber-50 text-amber-600' : 
                        activity.type === 'OUT' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'
                      )}>
                         <Package className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                         <p className="text-sm font-bold text-slate-800 truncate group-hover:text-emerald-600 transition-colors">
                           {activity.type === 'IN' ? 'Stok Masuk' : activity.type === 'OUT' ? 'Penjualan' : 'Penyesuaian'}: {activity.productName}
                         </p>
                         <p className="text-xs text-slate-500">
                           {formatRelativeTime(activity.createdAt)} • {activity.branchName}
                         </p>
                         <p className="text-[10px] text-slate-400 mt-1 italic truncate">
                           {activity.notes || 'Tanpa catatan'}
                         </p>
                      </div>
                   </div>
                ))
             )}
          </div>
          <Link to="/dashboard/inventory/movements">
             <Button variant="ghost" className="w-full mt-6 text-emerald-600 font-bold hover:bg-emerald-50">
                Lihat Semua Aktivitas
             </Button>
          </Link>
        </div>
      </div>
      
      {/* Smart Alerts Section */}
      {alertsLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-slate-50/50 p-8 rounded-3xl border border-slate-100 space-y-6">
            <div className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-5 w-40 rounded" />
                <Skeleton className="h-3.5 w-60 rounded" />
              </div>
            </div>
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-100">
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                  <Skeleton className="h-5 w-16" />
                </div>
              ))}
            </div>
          </div>
          <div className="bg-slate-50/50 p-8 rounded-3xl border border-slate-100 space-y-6">
            <div className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-5 w-40 rounded" />
                <Skeleton className="h-3.5 w-60 rounded" />
              </div>
            </div>
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-100">
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                  <Skeleton className="h-5 w-16" />
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        alerts && (alerts.expiringBatches?.length > 0 || alerts.lowStockItems?.length > 0) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Low Stock Alerts */}
            {alerts.lowStockItems?.length > 0 && (
              <div className="bg-amber-50/50 p-8 rounded-3xl shadow-sm border border-amber-100">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">Peringatan Stok Menipis</h2>
                    <p className="text-sm text-slate-500">Produk yang berada di bawah minimum stok</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {alerts.lowStockItems.slice(0, 5).map((item: any) => (
                    <div key={item.id} className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-amber-50">
                      <div>
                        <p className="font-bold text-slate-700">{item.product?.name}</p>
                        <p className="text-xs text-slate-400">Min Stok: {item.minimumStock}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-amber-600">{item.stockQuantity} {item.product?.baseUnit}</p>
                      </div>
                    </div>
                  ))}
                  {alerts.lowStockItems.length > 5 && (
                    <Link to="/dashboard/inventory" className="block text-center text-sm font-bold text-amber-600 hover:text-amber-700 mt-4">
                      Lihat {alerts.lowStockItems.length - 5} produk lainnya...
                    </Link>
                  )}
                </div>
              </div>
            )}

            {/* Expiring Alerts */}
            {alerts.expiringBatches?.length > 0 && (
              <div className="bg-rose-50/50 p-8 rounded-3xl shadow-sm border border-rose-100">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">Peringatan Kadaluarsa</h2>
                    <p className="text-sm text-slate-500">Produk kadaluarsa dalam 90 hari</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {alerts.expiringBatches.slice(0, 5).map((batch: any) => (
                    <div key={batch.id} className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-rose-50">
                      <div>
                        <p className="font-bold text-slate-700">{batch.inventory?.product?.name}</p>
                        <p className="text-xs text-slate-400">Batch: {batch.batchNumber}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-rose-600">{new Date(batch.expiryDate).toLocaleDateString('id-ID')}</p>
                        <p className="text-xs text-rose-400">{batch.currentQuantity} {batch.inventory?.product?.baseUnit}</p>
                      </div>
                    </div>
                  ))}
                  {alerts.expiringBatches.length > 5 && (
                    <Link to="/dashboard/inventory" className="block text-center text-sm font-bold text-rose-600 hover:text-rose-700 mt-4">
                      Lihat {alerts.expiringBatches.length - 5} batch lainnya...
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>
        )
      )}
    </div>
  );
};

export default DashboardPage;
