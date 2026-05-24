import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import api from '../api/api';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { cn } from '../lib/utils';
import { 
  FileText, 
  Download, 
  Search, 
  Calendar, 
  Filter,
  CreditCard,
  ArrowRight,
  X,
  Printer,
  BarChart3,
  TrendingUp,
  PackageCheck,
  ShoppingBag
} from 'lucide-react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as ChartTooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from 'recharts';

interface Sale {
  id: number;
  saleDate: string;
  totalAmount: number;
  paymentMethod: string;
  status: string;
  notes?: string;
  user: { fullName: string };
  customer?: { name: string };
  branch: { id: number; name: string };
  details?: {
    id: number;
    product: { name: string; sku: string };
    batch?: { batchNumber: string };
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }[];
}

const ReportsPage: React.FC = () => {
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [statusFilter, setStatusFilter] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [appliedFilters, setAppliedFilters] = useState({
    start: '',
    end: '',
    status: '',
    branch: ''
  });

  // Selected sale for detail modal
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const { data: sales, isLoading } = useQuery<Sale[]>({
    queryKey: ['sales-report'],
    queryFn: () => api.get('/sales').then(res => res.data),
  });

  const { data: branches } = useQuery<any[]>({
    queryKey: ['branches'],
    queryFn: () => api.get('/branches').then(res => res.data),
  });

  const [activeTab, setActiveTab] = useState<'sales' | 'consolidation'>('sales');

  const { data: branchComparison, isLoading: isComparisonLoading } = useQuery<any[]>({
    queryKey: ['branch-comparison', appliedFilters.start, appliedFilters.end],
    queryFn: () => api.get('/reports/branch-comparison', {
      params: {
        startDate: appliedFilters.start || undefined,
        endDate: appliedFilters.end || undefined
      }
    }).then(res => res.data),
  });

  const consolidationMetrics = React.useMemo(() => {
    if (!branchComparison || branchComparison.length === 0) {
      return { totalSales: 0, totalProfit: 0, totalTransactions: 0 };
    }
    let totalSales = 0;
    let totalProfit = 0;
    let totalTransactions = 0;
    branchComparison.forEach(b => {
      totalSales += b.totalSales || 0;
      totalProfit += b.grossProfit || 0;
      totalTransactions += b.transactionCount || 0;
    });
    return { totalSales, totalProfit, totalTransactions };
  }, [branchComparison]);

  // Reset pagination on filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [appliedFilters, searchTerm, pageSize]);

  const handleApplyFilters = () => {
    setAppliedFilters({
      start: dateRange.start,
      end: dateRange.end,
      status: statusFilter,
      branch: branchFilter
    });
  };

  const handleResetFilters = () => {
    setDateRange({ start: '', end: '' });
    setStatusFilter('');
    setBranchFilter('');
    setAppliedFilters({ start: '', end: '', status: '', branch: '' });
  };

  // 1. Filtering
  const filteredSales = sales?.filter(sale => {
    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const idMatch = `#sal-${sale.id}`.toLowerCase().includes(search) || `sal-${sale.id}`.toLowerCase().includes(search) || String(sale.id).includes(search);
      const customerMatch = sale.customer?.name?.toLowerCase().includes(search);
      const userMatch = sale.user?.fullName?.toLowerCase().includes(search);
      if (!idMatch && !customerMatch && !userMatch) return false;
    }

    // Status filter
    if (appliedFilters.status && sale.status !== appliedFilters.status) {
      return false;
    }

    // Branch filter
    if (appliedFilters.branch && String(sale.branch?.id) !== appliedFilters.branch) {
      return false;
    }

    // Date range filter
    if (appliedFilters.start) {
      const startDate = new Date(appliedFilters.start);
      startDate.setHours(0, 0, 0, 0);
      if (new Date(sale.saleDate) < startDate) return false;
    }
    if (appliedFilters.end) {
      const endDate = new Date(appliedFilters.end);
      endDate.setHours(23, 59, 59, 999);
      if (new Date(sale.saleDate) > endDate) return false;
    }

    return true;
  });

  const [showCharts, setShowCharts] = useState(true);

  // 4. Calculate Aggregate Metrics
  const metrics = React.useMemo(() => {
    if (!filteredSales || filteredSales.length === 0) {
      return { totalRevenue: 0, avgTicket: 0, completedCount: 0, cancelledCount: 0, totalItemsSold: 0 };
    }
    let totalRevenue = 0;
    let completedCount = 0;
    let cancelledCount = 0;
    let totalItemsSold = 0;

    filteredSales.forEach(s => {
      if (s.status === 'COMPLETED') {
        totalRevenue += s.totalAmount;
        completedCount++;
        if (s.details) {
          s.details.forEach(d => totalItemsSold += d.quantity);
        }
      } else {
        cancelledCount++;
      }
    });

    const avgTicket = completedCount > 0 ? totalRevenue / completedCount : 0;
    return { totalRevenue, avgTicket, completedCount, cancelledCount, totalItemsSold };
  }, [filteredSales]);

  // 5. Calculate Daily Trend for AreaChart
  const dailyTrendData = React.useMemo(() => {
    if (!filteredSales) return [];
    const map = new Map<string, number>();
    
    // Sort transactions by date ascending first
    const sorted = [...filteredSales].sort((a, b) => new Date(a.saleDate).getTime() - new Date(b.saleDate).getTime());
    
    sorted.forEach(s => {
      if (s.status === 'COMPLETED') {
        const dateKey = new Date(s.saleDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
        map.set(dateKey, (map.get(dateKey) || 0) + s.totalAmount);
      }
    });

    return Array.from(map.entries()).map(([date, amount]) => ({ date, omset: amount }));
  }, [filteredSales]);

  // 6. Calculate Payment Method Distribution for PieChart
  const paymentMethodData = React.useMemo(() => {
    if (!filteredSales) return [];
    const map = new Map<string, number>();
    
    filteredSales.forEach(s => {
      if (s.status === 'COMPLETED') {
        const method = s.paymentMethod || 'Lainnya';
        map.set(method, (map.get(method) || 0) + 1);
      }
    });

    const colors = ['#10b981', '#0ea5e9', '#f59e0b', '#ec4899', '#8b5cf6'];
    return Array.from(map.entries()).map(([method, count], idx) => ({
      name: method,
      value: count,
      color: colors[idx % colors.length]
    }));
  }, [filteredSales]);

  // 2. Sorting: Descending order (latest transaction first)
  const sortedSales = filteredSales ? [...filteredSales].sort((a, b) => {
    return new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime();
  }) : [];

  // 3. Paginating
  const totalItems = sortedSales.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedSales = sortedSales.slice(startIndex, startIndex + pageSize);

  // XML-HTML Excel Export (avoids comma issue and shows actual cells in MS Excel)
  const handleExportExcel = () => {
    if (!sortedSales || sortedSales.length === 0) return;
    
    const headers = ['ID Transaksi', 'Tanggal', 'Cabang', 'Pelanggan', 'Kasir', 'Metode Pembayaran', 'Total Transaksi (IDR)', 'Status'];
    
    const rows = sortedSales.map(sale => [
      `#SAL-${sale.id}`,
      new Date(sale.saleDate).toLocaleString('id-ID'),
      sale.branch?.name || 'Cabang Utama',
      sale.customer?.name || 'Umum',
      sale.user?.fullName || 'Sistem',
      sale.paymentMethod,
      sale.totalAmount,
      sale.status === 'COMPLETED' ? 'Berhasil' : 'Dibatalkan'
    ]);
    
    // Generate Microsoft Excel HTML XML Workbook content
    const excelTemplate = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Laporan Penjualan</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          th { background-color: #10b981; color: white; font-weight: bold; }
          td { border: 0.5px solid #e5e7eb; }
        </style>
      </head>
      <body>
        <table>
          <thead>
            <tr>
              ${headers.map(h => `<th>${h}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${rows.map(row => `
              <tr>
                ${row.map(val => `<td>${val}</td>`).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([excelTemplate], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Laporan_Penjualan_${new Date().toISOString().split('T')[0]}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    if (!sortedSales || sortedSales.length === 0) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const totalAmountSum = sortedSales.reduce((acc, sale) => acc + sale.totalAmount, 0);

    const htmlContent = `
      <html>
        <head>
          <title>Laporan Penjualan - G-Apotek</title>
          <style>
            body { font-family: 'Inter', sans-serif; color: #333; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #10b981; padding-bottom: 10px; }
            .header h1 { margin: 0; color: #10b981; font-size: 24px; }
            .header p { margin: 5px 0 0; color: #666; font-size: 14px; }
            .meta { display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 12px; color: #555; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
            th { background-color: #f3f4f6; color: #374151; font-weight: bold; text-align: left; padding: 10px; border-bottom: 1px solid #e5e7eb; }
            td { padding: 10px; border-bottom: 1px solid #f3f4f6; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .badge { display: inline-block; padding: 3px 8px; border-radius: 4px; font-size: 10px; font-weight: bold; }
            .badge-success { background-color: #ecfdf5; color: #047857; }
            .badge-danger { background-color: #fef2f2; color: #b91c1c; }
            .badge-branch { background-color: #f0fdf4; color: #15803d; border: 1px solid #dcfce7; }
            .summary { margin-top: 30px; display: flex; justify-content: flex-end; }
            .summary-card { background-color: #f9fafb; border: 1px solid #e5e7eb; padding: 15px; border-radius: 8px; min-width: 250px; }
            .summary-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px; }
            .summary-row.total { font-weight: bold; font-size: 15px; color: #10b981; border-top: 1px solid #e5e7eb; padding-top: 8px; margin-top: 8px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>LAPORAN PENJUALAN</h1>
            <p>Sistem Informasi Manajemen Apotek - G-Apotek v2</p>
          </div>
          <div class="meta">
            <div>
              <strong>Tanggal Cetak:</strong> ${new Date().toLocaleString('id-ID')}
            </div>
            <div>
              <strong>Jumlah Transaksi:</strong> ${sortedSales.length}
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>ID Transaksi</th>
                <th>Tanggal</th>
                <th>Cabang</th>
                <th>Pelanggan</th>
                <th>Kasir</th>
                <th>Metode Bayar</th>
                <th>Status</th>
                <th class="text-right">Total Transaksi</th>
              </tr>
            </thead>
            <tbody>
              ${sortedSales.map(sale => `
                <tr>
                  <td><strong>#SAL-${sale.id}</strong></td>
                  <td>${new Date(sale.saleDate).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                  <td><span class="badge badge-branch">${sale.branch?.name || 'Cabang Utama'}</span></td>
                  <td>${sale.customer?.name || 'Umum'}</td>
                  <td>${sale.user?.fullName || 'Sistem'}</td>
                  <td>${sale.paymentMethod}</td>
                  <td>
                    <span class="badge ${sale.status === 'COMPLETED' ? 'badge-success' : 'badge-danger'}">
                      ${sale.status === 'COMPLETED' ? 'Berhasil' : 'Dibatalkan'}
                    </span>
                  </td>
                  <td class="text-right"><strong>Rp ${sale.totalAmount.toLocaleString()}</strong></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="summary">
            <div class="summary-card">
              <div class="summary-row">
                <span>Total Transaksi</span>
                <span>${sortedSales.length}</span>
              </div>
              <div class="summary-row total">
                <span>Total Penjualan</span>
                <span>Rp ${totalAmountSum.toLocaleString()}</span>
              </div>
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const handlePrintReceipt = (sale: Sale) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const htmlContent = `
      <html>
        <head>
          <title>Struk Belanja - #SAL-${sale.id}</title>
          <style>
            body { font-family: 'Courier New', Courier, monospace; width: 300px; margin: 0 auto; padding: 20px; font-size: 12px; line-height: 1.4; color: #000; }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .bold { font-weight: bold; }
            .header { border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
            .header h2 { margin: 0; font-size: 16px; }
            .header p { margin: 3px 0 0; font-size: 10px; }
            .meta { border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 10px; font-size: 10px; }
            .meta p { margin: 3px 0; }
            .items { border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
            .item-row { display: flex; justify-content: space-between; margin-bottom: 5px; }
            .item-name { width: 60%; }
            .item-sub { display: flex; justify-content: space-between; font-size: 9px; margin-top: -3px; color: #555; }
            .totals { border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
            .total-row { display: flex; justify-content: space-between; margin: 3px 0; }
            .footer { font-size: 10px; margin-top: 15px; }
          </style>
        </head>
        <body>
          <div class="header text-center">
            <h2>G-APOTEK</h2>
            <p>${sale.branch?.name || 'Cabang Utama'}</p>
            <p>Telp: (021) 1234567</p>
          </div>
          
          <div class="meta">
            <p>No: #SAL-${sale.id}</p>
            <p>Tgl: ${new Date(sale.saleDate).toLocaleString('id-ID')}</p>
            <p>Kasir: ${sale.user?.fullName || 'Sistem'}</p>
            <p>Pelanggan: ${sale.customer?.name || 'Umum'}</p>
          </div>

          <div class="items">
            ${sale.details ? sale.details.map(detail => `
              <div class="item-row">
                <span class="item-name">${detail.product?.name}</span>
                <span class="bold">Rp ${detail.subtotal.toLocaleString()}</span>
              </div>
              <div class="item-sub">
                <span>${detail.quantity} x Rp ${detail.unitPrice.toLocaleString()}</span>
                <span>Batch: ${detail.batch?.batchNumber || '-'}</span>
              </div>
            `).join('') : '<p class="text-center">Tidak ada item</p>'}
          </div>

          <div class="totals">
            <div class="total-row bold">
              <span>TOTAL</span>
              <span>Rp ${sale.totalAmount.toLocaleString()}</span>
            </div>
            <div class="total-row">
              <span>Metode Bayar</span>
              <span>${sale.paymentMethod}</span>
            </div>
            <div class="total-row">
              <span>Status</span>
              <span>${sale.status === 'COMPLETED' ? 'LUNAS' : 'DIBATALKAN'}</span>
            </div>
          </div>

          <div class="footer text-center">
            <p>Terima Kasih atas Kunjungan Anda</p>
            <p>Semoga Lekas Sembuh</p>
          </div>

          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Laporan Penjualan</h1>
          <p className="text-slate-500 text-sm">Analisa performa transaksi apotek Anda.</p>
        </div>
        <div className="flex items-center gap-3">
           {activeTab === 'sales' && (
             <>
               <Button onClick={() => setShowCharts(!showCharts)} variant="outline" className="flex items-center gap-2 border-slate-200">
                  <BarChart3 className="w-4 h-4 text-emerald-600" />
                  {showCharts ? 'Sembunyikan Grafik' : 'Tampilkan Grafik'}
               </Button>
               <Button onClick={handleExportExcel} variant="outline" className="flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Export Excel
               </Button>
               <Button onClick={handlePrint} className="flex items-center gap-2 bg-slate-900">
                  <FileText className="w-4 h-4" />
                  Cetak Laporan
               </Button>
             </>
           )}
        </div>
      </div>

      {/* Premium Tab Bar */}
      <div className="flex border-b border-slate-100">
        <button
          onClick={() => setActiveTab('sales')}
          className={cn(
            "px-6 py-3 text-sm font-extrabold border-b-2 transition-all flex items-center gap-2",
            activeTab === 'sales'
              ? "border-emerald-500 text-emerald-600"
              : "border-transparent text-slate-400 hover:text-slate-600"
          )}
        >
          <ShoppingBag className="w-4 h-4" />
          Transaksi Penjualan
        </button>
        <button
          onClick={() => setActiveTab('consolidation')}
          className={cn(
            "px-6 py-3 text-sm font-extrabold border-b-2 transition-all flex items-center gap-2",
            activeTab === 'consolidation'
              ? "border-emerald-500 text-emerald-600"
              : "border-transparent text-slate-400 hover:text-slate-600"
          )}
        >
          <BarChart3 className="w-4 h-4" />
          Laporan Konsolidasi Cabang
        </button>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-wrap gap-4 items-end">
         <div className="space-y-1.5 flex-1 min-w-[150px]">
            <label className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1.5">
               <Calendar className="w-3 h-3" /> Tanggal Mulai
            </label>
            <Input type="date" value={dateRange.start} onChange={(e) => setDateRange({...dateRange, start: e.target.value})} />
         </div>
         <div className="space-y-1.5 flex-1 min-w-[150px]">
            <label className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1.5">
               <Calendar className="w-3 h-3" /> Tanggal Akhir
            </label>
            <Input type="date" value={dateRange.end} onChange={(e) => setDateRange({...dateRange, end: e.target.value})} />
         </div>
         
         {activeTab === 'sales' && (
           <>
             <div className="space-y-1.5 flex-1 min-w-[150px]">
                <label className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1.5">
                   <Filter className="w-3 h-3" /> Status
                </label>
                <select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full h-10 px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                   <option value="">Semua Status</option>
                   <option value="COMPLETED">Berhasil</option>
                   <option value="CANCELLED">Dibatalkan</option>
                </select>
             </div>
             <div className="space-y-1.5 flex-1 min-w-[150px]">
                <label className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1.5">
                   <Filter className="w-3 h-3" /> Cabang
                </label>
                <select 
                  value={branchFilter}
                  onChange={(e) => setBranchFilter(e.target.value)}
                  className="w-full h-10 px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                   <option value="">Semua Cabang</option>
                   {branches?.map(b => (
                     <option key={b.id} value={b.id}>{b.name}</option>
                   ))}
                </select>
             </div>
           </>
         )}

         <div className="flex gap-2">
            <Button onClick={handleApplyFilters} className="h-10 px-6 bg-emerald-600 hover:bg-emerald-700">Filter</Button>
            {(appliedFilters.start || appliedFilters.end || (activeTab === 'sales' && (appliedFilters.status || appliedFilters.branch))) && (
              <Button onClick={handleResetFilters} variant="outline" className="h-10 px-4">Reset</Button>
            )}
         </div>
      </div>

      {activeTab === 'sales' && (
        <>
          {showCharts && (
            <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
              {/* Highlight Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 relative overflow-hidden group">
                  <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Pendapatan</p>
                    <h3 className="text-xl font-black text-slate-800 mt-0.5">Rp {metrics.totalRevenue.toLocaleString()}</h3>
                  </div>
                  <div className="absolute bottom-0 left-0 h-1 w-full bg-emerald-500/10" />
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 relative overflow-hidden group">
                  <div className="p-3 rounded-xl bg-sky-50 text-sky-600">
                    <ShoppingBag className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Rata-rata Transaksi</p>
                    <h3 className="text-xl font-black text-slate-800 mt-0.5">Rp {Math.round(metrics.avgTicket).toLocaleString()}</h3>
                  </div>
                  <div className="absolute bottom-0 left-0 h-1 w-full bg-sky-500/10" />
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 relative overflow-hidden group">
                  <div className="p-3 rounded-xl bg-amber-50 text-amber-600">
                    <PackageCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Item Terjual</p>
                    <h3 className="text-xl font-black text-slate-800 mt-0.5">{metrics.totalItemsSold} Item</h3>
                  </div>
                  <div className="absolute bottom-0 left-0 h-1 w-full bg-amber-500/10" />
                </div>
              </div>

              {/* Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Sales Daily Omset Trend */}
                <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                  <div>
                    <h3 className="font-extrabold text-slate-800">Tren Pendapatan Harian</h3>
                    <p className="text-xs text-slate-400">Total omset bersih harian dari filter aktif</p>
                  </div>
                  <div className="h-[260px] w-full">
                    {dailyTrendData.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-slate-400 text-xs italic">
                        Belum ada data penjualan selesai untuk dirender.
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={dailyTrendData}>
                          <defs>
                            <linearGradient id="colorOmset" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis 
                            dataKey="date" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{fill: '#94a3b8', fontSize: 10}}
                          />
                          <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{fill: '#94a3b8', fontSize: 10}}
                            tickFormatter={(val) => `Rp ${val >= 1000000 ? (val/1000000).toFixed(1) + 'Jt' : (val/1000).toFixed(0) + 'k'}`}
                          />
                          <ChartTooltip 
                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                            formatter={(val: number) => [`Rp ${val.toLocaleString()}`, 'Omset Harian']}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="omset" 
                            stroke="#10b981" 
                            strokeWidth={3}
                            fillOpacity={1} 
                            fill="url(#colorOmset)" 
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                {/* Payment Method Pie Chart */}
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="font-extrabold text-slate-800">Distribusi Metode Pembayaran</h3>
                    <p className="text-xs text-slate-400">Proporsi metode bayar dari filter aktif</p>
                  </div>
                  
                  <div className="flex-1 min-h-[180px] w-full flex items-center justify-center relative">
                    {paymentMethodData.length === 0 ? (
                      <div className="text-slate-400 text-xs italic">Tidak ada data.</div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={paymentMethodData}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={70}
                            paddingAngle={4}
                            dataKey="value"
                          >
                            {paymentMethodData.map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <ChartTooltip 
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 12px -2px rgb(0 0 0 / 0.1)' }}
                            formatter={(val: number) => [`${val} Transaksi`, 'Jumlah']}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </div>

                  {/* Legends list */}
                  <div className="grid grid-cols-2 gap-2 text-[10px] font-bold text-slate-500 border-t border-slate-50 pt-3">
                    {paymentMethodData.map((item: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-1.5 shrink-0 truncate">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                        <span className="truncate">{item.name} ({item.value})</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
               <div className="relative w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input 
                    placeholder="Cari ID, Customer atau Kasir..." 
                    className="pl-10 h-9" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
               </div>
               <div className="text-sm font-medium text-slate-500">
                  Menampilkan <span className="text-slate-800 font-bold">{totalItems}</span> Transaksi
               </div>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/50">
                    <TableHead className="font-bold text-slate-500">ID Penjualan</TableHead>
                    <TableHead className="font-bold text-slate-500">Tanggal</TableHead>
                    <TableHead className="font-bold text-slate-500">Cabang</TableHead>
                    <TableHead className="font-bold text-slate-500">Kasir</TableHead>
                    <TableHead className="font-bold text-slate-500">Pelanggan</TableHead>
                    <TableHead className="font-bold text-slate-500">Metode</TableHead>
                    <TableHead className="font-bold text-slate-500 text-right">Total Transaksi</TableHead>
                    <TableHead className="font-bold text-slate-500 text-center">Status</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={9} className="h-40 text-center">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                          <span className="text-slate-400 text-xs font-bold">Memuat data laporan...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : paginatedSales.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="h-40 text-center text-slate-400 text-xs italic">
                        Tidak ada transaksi penjualan yang cocok dengan kriteria filter.
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedSales.map((sale) => (
                      <TableRow key={sale.id} className="hover:bg-slate-50/40 cursor-pointer" onClick={() => setSelectedSale(sale)}>
                        <TableCell className="font-mono font-bold text-slate-800">#SAL-{sale.id}</TableCell>
                        <TableCell className="text-slate-500 text-xs">
                          {new Date(sale.saleDate).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-100">
                            {sale.branch?.name || 'Cabang Utama'}
                          </span>
                        </TableCell>
                        <TableCell className="text-slate-700 font-bold text-xs">{sale.user?.fullName || 'Sistem'}</TableCell>
                        <TableCell className="text-slate-600 text-xs font-semibold">{sale.customer?.name || 'Umum'}</TableCell>
                        <TableCell>
                          <span className="text-[10px] font-extrabold uppercase text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                            {sale.paymentMethod}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-black text-slate-800">Rp {sale.totalAmount.toLocaleString()}</TableCell>
                        <TableCell className="text-center">
                          <span className={cn(
                            "inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wide border",
                            sale.status === 'COMPLETED' 
                              ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
                              : "bg-rose-50 text-rose-700 border-rose-100"
                          )}>
                            {sale.status === 'COMPLETED' ? 'LUNAS' : 'DIBATAL'}
                          </span>
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="sm" className="w-8 h-8 p-0 hover:bg-slate-100 rounded-full" onClick={() => setSelectedSale(sale)}>
                            <ArrowRight className="w-4 h-4 text-slate-400" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-slate-50 bg-slate-50/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                 <div className="text-xs font-bold text-slate-400">
                    Menampilkan {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, totalItems)} dari {totalItems} Transaksi
                 </div>
                 <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-3 h-8 text-xs font-bold"
                    >
                       Sebelumnya
                    </Button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                      const isNear = Math.abs(currentPage - page) <= 1 || page === 1 || page === totalPages;
                      const showEllipsis = (page === 2 && currentPage > 3) || (page === totalPages - 1 && currentPage < totalPages - 2);

                      if (!isNear && !showEllipsis) return null;

                      return (
                        <React.Fragment key={page}>
                           {showEllipsis && <span className="px-2 text-slate-400 text-xs">...</span>}
                           <Button
                             variant={currentPage === page ? 'primary' : 'outline'}
                             size="sm"
                             onClick={() => setCurrentPage(page)}
                             className={cn(
                               "w-8 h-8 p-0 text-xs font-bold",
                               currentPage === page 
                                 ? "bg-emerald-600 text-white hover:bg-emerald-700"
                                 : ""
                             )}
                           >
                              {page}
                           </Button>
                        </React.Fragment>
                      );
                    })}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="px-3 h-8 text-xs font-bold"
                    >
                       Berikutnya
                    </Button>
                 </div>
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === 'consolidation' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {isComparisonLoading ? (
            <div className="flex h-64 items-center justify-center bg-white rounded-3xl border border-slate-100 shadow-sm">
              <div className="text-center space-y-4">
                <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-slate-500 text-sm font-bold">Memuat laporan konsolidasi...</p>
              </div>
            </div>
          ) : !branchComparison || branchComparison.length === 0 ? (
            <div className="flex h-64 items-center justify-center bg-white rounded-3xl border border-slate-100 shadow-sm">
              <p className="text-slate-400 text-sm italic">Belum ada data transaksi untuk konsolidasi cabang.</p>
            </div>
          ) : (
            <>
              {/* Highlight Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 relative overflow-hidden group">
                  <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Pendapatan Konsolidasi</p>
                    <h3 className="text-xl font-black text-slate-800 mt-0.5">Rp {consolidationMetrics.totalSales.toLocaleString()}</h3>
                  </div>
                  <div className="absolute bottom-0 left-0 h-1 w-full bg-emerald-500/10" />
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 relative overflow-hidden group">
                  <div className="p-3 rounded-xl bg-sky-50 text-sky-600">
                    <BarChart3 className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Profit Kotor</p>
                    <h3 className="text-xl font-black text-slate-800 mt-0.5">Rp {consolidationMetrics.totalProfit.toLocaleString()}</h3>
                  </div>
                  <div className="absolute bottom-0 left-0 h-1 w-full bg-sky-500/10" />
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 relative overflow-hidden group">
                  <div className="p-3 rounded-xl bg-amber-50 text-amber-600">
                    <PackageCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Transaksi Gabungan</p>
                    <h3 className="text-xl font-black text-slate-800 mt-0.5">{consolidationMetrics.totalTransactions} Transaksi</h3>
                  </div>
                  <div className="absolute bottom-0 left-0 h-1 w-full bg-amber-500/10" />
                </div>
              </div>

              {/* Chart Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                  <div>
                    <h3 className="font-extrabold text-slate-800">Perbandingan Kinerja Cabang</h3>
                    <p className="text-xs text-slate-400">Komparasi visual pendapatan vs profit kotor antar cabang aktif</p>
                  </div>
                  <div className="h-[320px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={branchComparison} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis 
                          dataKey="branchName" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{fill: '#94a3b8', fontSize: 10}}
                        />
                        <YAxis 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{fill: '#94a3b8', fontSize: 10}}
                          tickFormatter={(val) => `Rp ${val >= 1000000 ? (val/1000000).toFixed(1) + 'Jt' : (val/1000).toFixed(0) + 'k'}`}
                        />
                        <ChartTooltip 
                          contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                          formatter={(val: number) => [`Rp ${val.toLocaleString()}`]}
                        />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', paddingTop: '10px' }} />
                        <Bar dataKey="totalSales" name="Pendapatan" fill="#10b981" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="grossProfit" name="Profit Kotor" fill="#0284c7" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col space-y-4">
                  <div>
                    <h3 className="font-extrabold text-slate-800">Ringkasan Margin Cabang</h3>
                    <p className="text-xs text-slate-400">Efisiensi operasional dan profit margin per cabang</p>
                  </div>
                  <div className="flex-1 overflow-auto">
                    <div className="space-y-4">
                      {branchComparison.map((branch: any) => {
                        const margin = branch.totalSales > 0 ? (branch.grossProfit / branch.totalSales) * 100 : 0;
                        return (
                          <div key={branch.branchId} className="p-3 bg-slate-50/50 border border-slate-100 rounded-2xl flex justify-between items-center">
                            <div>
                              <p className="text-xs font-bold text-slate-700">{branch.branchName}</p>
                              <p className="text-[10px] text-slate-400 font-semibold">{branch.transactionCount} Transaksi</p>
                            </div>
                            <div className="text-right">
                              <span className="inline-block px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 text-[10px] font-black border border-emerald-100/50">
                                Margin: {margin.toFixed(1)}%
                              </span>
                              <p className="text-xs font-black text-slate-800 mt-1">Rp {branch.grossProfit.toLocaleString()}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Detailed Consolidation Table */}
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100 bg-slate-50/20">
                  <h3 className="font-extrabold text-slate-800">Detail Kontribusi Cabang</h3>
                  <p className="text-xs text-slate-400">Laporan tabulasi komprehensif performa per cabang</p>
                </div>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50/30">
                        <TableHead className="font-bold text-slate-500">Nama Cabang</TableHead>
                        <TableHead className="font-bold text-slate-500 text-right">Total Pendapatan</TableHead>
                        <TableHead className="font-bold text-slate-500 text-right">Profit Kotor</TableHead>
                        <TableHead className="font-bold text-slate-500 text-right">Margin Profit</TableHead>
                        <TableHead className="font-bold text-slate-500 text-center">Jumlah Transaksi</TableHead>
                        <TableHead className="font-bold text-slate-500 text-right">Rata-rata Tiket</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {branchComparison.map((branch: any) => {
                        const margin = branch.totalSales > 0 ? (branch.grossProfit / branch.totalSales) * 100 : 0;
                        const avgTicket = branch.transactionCount > 0 ? branch.totalSales / branch.transactionCount : 0;
                        return (
                          <TableRow key={branch.branchId} className="hover:bg-slate-50/50 transition-colors">
                            <TableCell className="font-bold text-slate-700">{branch.branchName}</TableCell>
                            <TableCell className="text-right font-bold text-slate-800">Rp {branch.totalSales.toLocaleString()}</TableCell>
                            <TableCell className="text-right font-bold text-emerald-600">Rp {branch.grossProfit.toLocaleString()}</TableCell>
                            <TableCell className="text-right font-black text-slate-700">{margin.toFixed(2)}%</TableCell>
                            <TableCell className="text-center font-bold text-slate-600">{branch.transactionCount}</TableCell>
                            <TableCell className="text-right font-bold text-slate-800">Rp {Math.round(avgTicket).toLocaleString()}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Modal Detail Transaksi */}
      <AnimatePresence>
        {selectedSale && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
               {/* Header */}
               <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <div>
                     <span className="text-[10px] font-black uppercase text-slate-400">Detail Transaksi</span>
                     <div className="flex items-center gap-2.5 mt-1">
                        <h3 className="text-lg font-mono font-bold text-slate-800 uppercase tracking-tighter">#SAL-{selectedSale.id}</h3>
                        <span className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold",
                          selectedSale.status === 'COMPLETED' 
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                            : "bg-rose-50 text-rose-700 border border-rose-100"
                        )}>
                           {selectedSale.status === 'COMPLETED' ? 'Berhasil' : 'Dibatalkan'}
                        </span>
                     </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setSelectedSale(null)}
                    className="w-9 h-9 p-0 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500"
                  >
                     <X className="w-5 h-5" />
                  </Button>
               </div>

               {/* Content */}
               <div className="p-6 overflow-y-auto space-y-6">
                  {/* Meta Grid */}
                  <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-sm">
                     <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400">Cabang</p>
                        <p className="font-bold text-slate-700 mt-0.5">{selectedSale.branch?.name || 'Cabang Utama'}</p>
                     </div>
                     <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400">Tanggal & Waktu</p>
                        <p className="font-bold text-slate-700 mt-0.5">
                           {new Date(selectedSale.saleDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                     </div>
                     <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400">Pelanggan</p>
                        <p className="font-bold text-slate-700 mt-0.5">{selectedSale.customer?.name || 'Umum'}</p>
                     </div>
                     <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400">Kasir</p>
                        <p className="font-bold text-slate-700 mt-0.5">{selectedSale.user?.fullName || 'Sistem'}</p>
                     </div>
                  </div>

                  {/* Items Table */}
                  <div>
                     <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">Daftar Item</h4>
                     <div className="border border-slate-100 rounded-2xl overflow-hidden">
                        <table className="w-full text-sm">
                           <thead>
                              <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-400 font-bold">
                                 <th className="py-2.5 px-4 text-left font-semibold">Nama Produk</th>
                                 <th className="py-2.5 px-4 text-center font-semibold">Qty</th>
                                 <th className="py-2.5 px-4 text-right font-semibold">Harga</th>
                                 <th className="py-2.5 px-4 text-right font-semibold">Subtotal</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-slate-50 text-slate-700">
                              {selectedSale.details && selectedSale.details.length > 0 ? (
                                selectedSale.details.map((detail) => (
                                   <tr key={detail.id} className="hover:bg-slate-50/20">
                                      <td className="py-3 px-4">
                                         <p className="font-bold text-slate-800">{detail.product?.name}</p>
                                         {detail.batch && (
                                           <p className="text-[10px] text-slate-400 font-mono mt-0.5">Batch: {detail.batch.batchNumber}</p>
                                         )}
                                      </td>
                                      <td className="py-3 px-4 text-center font-bold text-slate-600">{detail.quantity}</td>
                                      <td className="py-3 px-4 text-right text-slate-500">Rp {detail.unitPrice.toLocaleString()}</td>
                                      <td className="py-3 px-4 text-right font-bold text-slate-800">Rp {detail.subtotal.toLocaleString()}</td>
                                   </tr>
                                ))
                              ) : (
                                <tr>
                                   <td colSpan={4} className="py-8 text-center text-slate-400">Tidak ada detail item.</td>
                                </tr>
                              )}
                           </tbody>
                        </table>
                     </div>
                  </div>

                  {/* Notes if any */}
                  {selectedSale.notes && (
                    <div className="bg-amber-50/30 border border-amber-100 p-4 rounded-2xl text-xs text-amber-800">
                       <span className="font-bold block mb-1">Catatan Transaksi:</span>
                       {selectedSale.notes}
                    </div>
                  )}
               </div>

               {/* Footer Summary */}
               <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                     <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white text-slate-600 text-xs font-bold border border-slate-100 shadow-sm">
                        <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                        {selectedSale.paymentMethod}
                     </span>
                     <Button 
                       onClick={() => handlePrintReceipt(selectedSale)} 
                       variant="outline" 
                       className="flex items-center gap-1.5 h-9 text-xs font-bold"
                     >
                        <Printer className="w-3.5 h-3.5" />
                        Cetak Struk
                     </Button>
                  </div>
                  <div className="text-right">
                     <span className="text-[10px] uppercase font-black text-slate-400">Total Transaksi</span>
                     <p className="text-xl font-black text-emerald-600">Rp {selectedSale.totalAmount.toLocaleString()}</p>
                  </div>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ReportsPage;
