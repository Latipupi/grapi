import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import api from '../api/api';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Skeleton } from '../components/ui/Skeleton';
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
  ShoppingBag,
  Gift,
  Loader2
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { CustomerLoyaltyView } from '../components/customers/CustomerLoyaltyView';
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
    product?: { name: string; sku: string };
    batch?: { batchNumber: string };
    quantity: number;
    unitPrice: number;
    subtotal: number;
    purchasePrice?: number;
    isCompound?: boolean;
    compoundName?: string;
  }[];
}

const formatRupiah = (val: number) => {
  return 'Rp ' + Math.round(Number(val) || 0).toLocaleString('id-ID');
};

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

  // Selected branch/report profit breakdown modal
  const [selectedBreakdown, setSelectedBreakdown] = useState<{
    data: any;
    tab: 'gross' | 'net';
  } | null>(null);
  const [breakdownItemSearch, setBreakdownItemSearch] = useState('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const { data: sales, isLoading, isFetching, refetch } = useQuery<Sale[]>({
    queryKey: ['sales-report', appliedFilters],
    queryFn: () => api.get('/sales', {
      params: {
        startDate: appliedFilters.start || undefined,
        endDate: appliedFilters.end || undefined,
        status: appliedFilters.status || undefined,
        branchId: appliedFilters.branch || undefined,
      }
    }).then(res => res.data),
  });

  const { data: salesProfitLoss } = useQuery<any>({
    queryKey: ['sales-profit-loss', appliedFilters.branch, appliedFilters.start, appliedFilters.end],
    queryFn: () => api.get('/reports/profit-loss', {
      params: {
        branchId: appliedFilters.branch || undefined,
        startDate: appliedFilters.start || undefined,
        endDate: appliedFilters.end || undefined,
      }
    }).then(res => res.data),
  });

  const isDataLoading = isLoading || isFetching;

  const { data: branches } = useQuery<any[]>({
    queryKey: ['branches'],
    queryFn: () => api.get('/branches').then(res => res.data),
  });

  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<'sales' | 'consolidation' | 'loyalty'>(() => {
    return searchParams.get('tab') === 'loyalty' ? 'loyalty' : 'sales';
  });

  const handleTabChange = (tab: 'sales' | 'consolidation' | 'loyalty') => {
    setActiveTab(tab);
    setSearchParams(tab === 'loyalty' ? { tab: 'loyalty' } : {});
  };

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
      return {
        grossSales: 0,
        totalRefunds: 0,
        totalSales: 0,
        totalCost: 0,
        totalProfit: 0,
        totalExpenses: 0,
        totalPayableDebt: 0,
        totalReceivableDebt: 0,
        totalDeductions: 0,
        totalNetProfit: 0,
        totalTransactions: 0,
        combinedBreakdown: null
      };
    }
    let grossSales = 0;
    let totalRefunds = 0;
    let totalSales = 0;
    let totalCost = 0;
    let totalProfit = 0;
    let totalExpenses = 0;
    let totalPayableDebt = 0;
    let totalReceivableDebt = 0;
    let totalDeductions = 0;
    let totalNetProfit = 0;
    let totalTransactions = 0;

    const itemMap = new Map<string, any>();
    const allReturns: any[] = [];
    const allExpenses: any[] = [];
    const allDebts: any[] = [];
    const allReceivableDebts: any[] = [];

    branchComparison.forEach(b => {
      grossSales += Number(b.grossSales ?? b.totalSales ?? 0);
      totalRefunds += Number(b.totalRefunds || 0);
      totalSales += Number(b.totalSales || 0);
      totalCost += Number(b.totalCost || 0);
      totalProfit += Number(b.grossProfit || 0);
      const exp = Number(b.totalExpenses || 0);
      const debt = Number(b.totalPayableDebt || 0);
      const recDebt = Number(b.totalReceivableDebt || 0);
      totalExpenses += exp;
      totalPayableDebt += debt;
      totalReceivableDebt += recDebt;
      totalDeductions += Number(b.totalDeductions ?? (exp + debt + recDebt));
      totalNetProfit += Number(b.netProfit ?? (Number(b.grossProfit || 0) - exp - debt - recDebt));
      totalTransactions += Number(b.transactionCount || 0);

      if (Array.isArray(b.itemsBreakdown)) {
        b.itemsBreakdown.forEach((item: any) => {
          const key = `${item.sku || '-'}::${item.productName}`;
          const existing = itemMap.get(key);
          if (!existing) {
            itemMap.set(key, {
              productName: item.productName,
              sku: item.sku,
              quantitySold: Number(item.quantitySold || 0),
              totalRevenue: Number(item.totalRevenue || 0),
              totalCost: Number(item.totalCost || 0),
              grossProfit: Number(item.grossProfit || 0),
            });
          } else {
            existing.quantitySold += Number(item.quantitySold || 0);
            existing.totalRevenue += Number(item.totalRevenue || 0);
            existing.totalCost += Number(item.totalCost || 0);
            existing.grossProfit += Number(item.grossProfit || 0);
          }
        });
      }
      if (Array.isArray(b.returnsBreakdown)) {
        allReturns.push(...b.returnsBreakdown);
      }
      if (Array.isArray(b.expensesBreakdown)) {
        allExpenses.push(...b.expensesBreakdown);
      }
      if (Array.isArray(b.debtsBreakdown)) {
        allDebts.push(...b.debtsBreakdown);
      }
      if (Array.isArray(b.receivableDebtsBreakdown)) {
        allReceivableDebts.push(...b.receivableDebtsBreakdown);
      }
    });

    const combinedItems = Array.from(itemMap.values()).sort((a, b) => b.grossProfit - a.grossProfit);

    return {
      grossSales,
      totalRefunds,
      totalSales,
      totalCost,
      totalProfit,
      totalExpenses,
      totalPayableDebt,
      totalReceivableDebt,
      totalDeductions,
      totalNetProfit,
      totalTransactions,
      combinedBreakdown: {
        branchName: 'Konsolidasi Semua Cabang',
        grossSales,
        totalRefunds,
        totalSales,
        totalCost,
        grossProfit: totalProfit,
        totalExpenses,
        totalPayableDebt,
        totalReceivableDebt,
        totalDeductions,
        netProfit: totalNetProfit,
        transactionCount: totalTransactions,
        itemsBreakdown: combinedItems,
        returnsBreakdown: allReturns,
        expensesBreakdown: allExpenses,
        debtsBreakdown: allDebts,
        receivableDebtsBreakdown: allReceivableDebts,
      }
    };
  }, [branchComparison]);

  // Reset pagination on filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [appliedFilters, searchTerm, pageSize]);

  const handleApplyFilters = () => {
    const nextFilters = {
      start: dateRange.start,
      end: dateRange.end,
      status: statusFilter,
      branch: branchFilter
    };
    setAppliedFilters(nextFilters);
    if (JSON.stringify(nextFilters) === JSON.stringify(appliedFilters)) {
      refetch();
    }
  };

  const handleResetFilters = () => {
    setDateRange({ start: '', end: '' });
    setStatusFilter('');
    setBranchFilter('');
    const reset = { start: '', end: '', status: '', branch: '' };
    setAppliedFilters(reset);
    if (JSON.stringify(reset) === JSON.stringify(appliedFilters)) {
      refetch();
    }
  };

  const handlePresetDate = (type: 'today' | '7days' | 'this_month' | 'all') => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    let startStr = '';
    let endStr = '';

    if (type === 'today') {
      startStr = todayStr;
      endStr = todayStr;
    } else if (type === '7days') {
      const d = new Date();
      d.setDate(today.getDate() - 7);
      startStr = d.toISOString().split('T')[0];
      endStr = todayStr;
    } else if (type === 'this_month') {
      const d = new Date(today.getFullYear(), today.getMonth(), 1);
      startStr = d.toISOString().split('T')[0];
      endStr = todayStr;
    } else if (type === 'all') {
      startStr = '';
      endStr = '';
    }

    setDateRange({ start: startStr, end: endStr });
    const nextFilters = {
      ...appliedFilters,
      start: startStr,
      end: endStr
    };
    setAppliedFilters(nextFilters);
    if (JSON.stringify(nextFilters) === JSON.stringify(appliedFilters)) {
      refetch();
    }
  };

  // 1. Client-side Search and Fallback Filtering
  const filteredSales = React.useMemo(() => {
    if (!sales) return [];
    return sales.filter(sale => {
      // Search filter
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const idMatch = `#sal-${sale.id}`.toLowerCase().includes(search) || `sal-${sale.id}`.toLowerCase().includes(search) || String(sale.id).includes(search);
        const customerMatch = sale.customer?.name?.toLowerCase().includes(search);
        const userMatch = sale.user?.fullName?.toLowerCase().includes(search);
        if (!idMatch && !customerMatch && !userMatch) return false;
      }
      return true;
    });
  }, [sales, searchTerm]);

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
        totalRevenue += Number(s.totalAmount) || 0;
        completedCount++;
        if (s.details) {
          s.details.forEach(d => totalItemsSold += Number(d.quantity) || 0);
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
    
    const headers = [
      'ID Transaksi', 'Tanggal', 'Cabang', 'Pelanggan', 'Kasir', 
      'Metode Pembayaran', 'Total Transaksi (IDR)', 'Status',
      'Nama Barang', 'SKU', 'Batch', 'Qty', 'Harga Satuan', 'Subtotal Item'
    ];
    
    const rows: any[] = [];
    sortedSales.forEach(sale => {
      if (sale.details && sale.details.length > 0) {
        sale.details.forEach(detail => {
          rows.push([
            `#SAL-${sale.id}`,
            new Date(sale.saleDate).toLocaleString('id-ID'),
            sale.branch?.name || 'Cabang Utama',
            sale.customer?.name || 'Umum',
            sale.user?.fullName || 'Sistem',
            sale.paymentMethod,
            sale.totalAmount,
            sale.status === 'COMPLETED' ? 'Berhasil' : 'Dibatalkan',
            detail.product?.name || '',
            detail.product?.sku || '',
            detail.batch?.batchNumber || '-',
            detail.quantity,
            detail.unitPrice,
            detail.subtotal
          ]);
        });
      } else {
        rows.push([
          `#SAL-${sale.id}`,
          new Date(sale.saleDate).toLocaleString('id-ID'),
          sale.branch?.name || 'Cabang Utama',
          sale.customer?.name || 'Umum',
          sale.user?.fullName || 'Sistem',
          sale.paymentMethod,
          sale.totalAmount,
          sale.status === 'COMPLETED' ? 'Berhasil' : 'Dibatalkan',
          '-',
          '-',
          '-',
          0,
          0,
          0
        ]);
      }
    });
    
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
            <p>Sistem Informasi Manajemen Apotek - G-Apotek</p>
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

    const received = Number(sale.paymentMethod === 'CASH' ? ((sale as any).receivedAmount || sale.totalAmount || 0) : sale.totalAmount);
    const change = Number(sale.paymentMethod === 'CASH' ? ((sale as any).changeAmount || 0) : 0);

    const htmlContent = `
      <html>
        <head>
          <title>Struk Belanja - #SAL-${sale.id}</title>
          <style>
            @page { 
              size: 58mm auto; 
              margin: 0; 
            }
            * { 
              box-sizing: border-box; 
              margin: 0; 
              padding: 0; 
            }
            html, body {
              width: 100%;
              margin: 0;
              padding: 0;
            }
            body { 
              font-family: 'Consolas', 'Courier New', Courier, monospace; 
              width: 44mm; 
              max-width: 44mm; 
              margin: 0; 
              padding: 1.5mm 1mm 16mm 1mm; 
              font-size: 8.5px; 
              line-height: 1.25; 
              color: #000; 
              background-color: #fff;
              word-break: break-word;
              overflow-wrap: break-word;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .bold { font-weight: bold; }
            .header { border-bottom: 1px dashed #000; padding-bottom: 4px; margin-bottom: 4px; }
            .header h2 { margin: 0; font-size: 13px; text-transform: uppercase; font-weight: bold; }
            .header p { margin: 1px 0 0; font-size: 8px; }
            .meta { border-bottom: 1px dashed #000; padding-bottom: 4px; margin-bottom: 4px; font-size: 8px; }
            .meta p { margin: 1.5px 0; }
            .items { border-bottom: 1px dashed #000; padding-bottom: 4px; margin-bottom: 4px; }
            .item-row { margin-bottom: 1.5px; }
            .item-name { font-weight: bold; font-size: 8.5px; text-transform: uppercase; line-height: 1.2; }
            .item-details { display: flex; justify-content: space-between; align-items: flex-start; font-size: 8px; gap: 4px; }
            .item-details span:first-child { flex: 1; }
            .item-details span:last-child { white-space: nowrap; flex-shrink: 0; text-align: right; font-weight: bold; }
            .item-batch { font-size: 7.5px; color: #444; margin-bottom: 3px; }
            .totals { border-bottom: 1px dashed #000; padding-bottom: 4px; margin-bottom: 4px; }
            .total-row { display: flex; justify-content: space-between; align-items: flex-start; margin: 2px 0; font-size: 8.5px; gap: 4px; }
            .total-row span:first-child { flex: 1; }
            .total-row span:last-child { white-space: nowrap; flex-shrink: 0; text-align: right; }
            .total-row.bold { font-weight: bold; font-size: 9.5px; }
            .footer { font-size: 8px; margin-top: 6px; line-height: 1.25; }
            .footer p { margin: 1px 0; }
            .feed-space { height: 16mm; }
          </style>
        </head>
        <body>
          <div class="header text-center">
            <h2>G-APOTEK</h2>
            <p>${sale.branch?.name || 'Cabang Utama'}</p>
            ${(sale.branch as any)?.address ? `<p>${(sale.branch as any).address}</p>` : ''}
            <p>${(sale.branch as any)?.phone ? 'Telp: ' + (sale.branch as any).phone : 'Telp: (021) 1234567'}</p>
          </div>
          
          <div class="meta">
            <p>No: #SAL-${sale.id}</p>
            <p>Tgl: ${new Date(sale.saleDate || (sale as any).createdAt || Date.now()).toLocaleString('id-ID')}</p>
            <p>Kasir: ${sale.user?.fullName || 'Kasir'}</p>
            <p>Pelanggan: ${sale.customer?.name || 'Umum'}</p>
          </div>

          <div class="items">
            ${sale.details ? sale.details.map((detail: any) => `
              ${detail.isCompound ? `
                <div class="item-row">
                  <div class="item-name">[RACIKAN] ${detail.compoundName || 'Obat Racikan'} (${detail.quantity ? Number(detail.quantity) : 1} ${detail.packageType || 'Bungkus'})</div>
                </div>
                ${detail.doseRule ? `<div style="font-size: 7.5px; font-style: italic; color: #333;">Aturan: ${detail.doseRule}</div>` : ''}
                <div class="item-details">
                  <span>1 Paket Racikan</span>
                  <span class="bold">Rp ${Number(detail.subtotal).toLocaleString('id-ID')}</span>
                </div>
                ${detail.ingredients && detail.ingredients.length > 0 ? `
                  <div style="font-size: 7.5px; color: #444; padding-left: 4px; margin-top: 1px; margin-bottom: 2px; border-left: 1px dotted #888;">
                    ${detail.ingredients.map((ing: any) => `• ${ing.product?.name || 'Bahan'}: ${Number(ing.quantity)} @ Rp ${Number(ing.unitPrice).toLocaleString('id-ID')}`).join('<br/>')}
                    ${Number(detail.serviceFee) > 0 ? `<br/>• Jasa Racik: Rp ${Number(detail.serviceFee).toLocaleString('id-ID')}` : ''}
                  </div>
                ` : ''}
              ` : `
                <div class="item-row">
                  <div class="item-name">${detail.product?.name}</div>
                </div>
                <div class="item-details">
                  <span>${detail.quantity ? Number(detail.quantity) : 0} x Rp ${Number(detail.unitPrice).toLocaleString('id-ID')}</span>
                  <span class="bold">Rp ${Number(detail.subtotal).toLocaleString('id-ID')}</span>
                </div>
                <div class="item-batch">
                  <span>Batch: ${detail.batch?.batchNumber || '-'}</span>
                </div>
              `}
            `).join('') : '<p class="text-center">Tidak ada item</p>'}
          </div>

          <div class="totals">
            <div class="total-row bold">
              <span>TOTAL</span>
              <span>Rp ${Number(sale.totalAmount).toLocaleString('id-ID')}</span>
            </div>
            ${sale.paymentMethod === 'CASH' ? `
              <div class="total-row">
                <span>Bayar</span>
                <span>Rp ${received.toLocaleString('id-ID')}</span>
              </div>
              <div class="total-row">
                <span>Kembalian</span>
                <span>Rp ${change.toLocaleString('id-ID')}</span>
              </div>
            ` : ''}
            <div class="total-row">
              <span>Metode Bayar</span>
              <span>${sale.paymentMethod || 'CASH'}</span>
            </div>
            <div class="total-row">
              <span>Status</span>
              <span>${sale.status === 'COMPLETED' ? 'LUNAS' : (sale.status || 'LUNAS')}</span>
            </div>
          </div>

          <div class="footer text-center">
            <p>Terima Kasih atas Kunjungan Anda</p>
            <p>Semoga Lekas Sembuh</p>
          </div>

          <div class="feed-space"></div>

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
          <h1 className="text-2xl font-bold text-slate-800">
            {activeTab === 'loyalty' ? 'Peringkat Pelanggan & THR' : 'Laporan Penjualan'}
          </h1>
          <p className="text-slate-500 text-sm">
            {activeTab === 'loyalty' 
              ? 'Analisa pelanggan loyal, total belanja, dan persiapan alokasi THR.' 
              : 'Analisa performa transaksi apotek Anda.'}
          </p>
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
          onClick={() => handleTabChange('sales')}
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
          onClick={() => handleTabChange('consolidation')}
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
        <button
          onClick={() => handleTabChange('loyalty')}
          className={cn(
            "px-6 py-3 text-sm font-extrabold border-b-2 transition-all flex items-center gap-2",
            activeTab === 'loyalty'
              ? "border-emerald-500 text-emerald-600"
              : "border-transparent text-slate-400 hover:text-slate-600"
          )}
        >
          <Gift className="w-4 h-4 text-amber-500" />
          Peringkat Pelanggan & THR
        </button>
      </div>

      {activeTab !== 'loyalty' && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
           {/* Presets Bar for Sales & Consolidation */}
           {(activeTab === 'sales' || activeTab === 'consolidation') && (
             <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
               <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold">
                 <span>Periode Cepat:</span>
                 <div className="flex flex-wrap gap-1.5">
                   <button
                     type="button"
                     onClick={() => handlePresetDate('today')}
                     className={cn(
                       "px-3 py-1 rounded-lg text-xs font-bold border transition-colors",
                       appliedFilters.start === new Date().toISOString().split('T')[0] && appliedFilters.end === new Date().toISOString().split('T')[0]
                         ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                         : "border-slate-200 hover:bg-slate-50 text-slate-700"
                     )}
                   >
                     Hari Ini
                   </button>
                   <button
                     type="button"
                     onClick={() => handlePresetDate('7days')}
                     className="px-3 py-1 rounded-lg text-xs font-bold border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors"
                   >
                     7 Hari Terakhir
                   </button>
                   <button
                     type="button"
                     onClick={() => handlePresetDate('this_month')}
                     className="px-3 py-1 rounded-lg text-xs font-bold border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors"
                   >
                     Bulan Ini
                   </button>
                   <button
                     type="button"
                     onClick={() => handlePresetDate('all')}
                     className={cn(
                       "px-3 py-1 rounded-lg text-xs font-bold border transition-colors",
                       !appliedFilters.start && !appliedFilters.end
                         ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                         : "border-slate-200 hover:bg-slate-50 text-slate-700"
                     )}
                   >
                     Semua Waktu
                   </button>
                 </div>
               </div>

               {(isDataLoading || isComparisonLoading) && (
                 <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full animate-pulse border border-emerald-200">
                   <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                   <span>Memuat data dari server...</span>
                 </div>
               )}
             </div>
           )}

           <div className="flex flex-wrap gap-4 items-end">
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
                 <Button 
                   onClick={handleApplyFilters} 
                   disabled={isDataLoading}
                   className="h-10 px-6 bg-emerald-600 hover:bg-emerald-700 flex items-center gap-2 font-bold shadow-sm"
                 >
                   {isDataLoading ? (
                     <>
                       <Loader2 className="w-4 h-4 animate-spin text-white" />
                       Memuat...
                     </>
                   ) : (
                     <>
                       <Filter className="w-4 h-4" />
                       Filter
                     </>
                   )}
                 </Button>
                 {(appliedFilters.start || appliedFilters.end || (activeTab === 'sales' && (appliedFilters.status || appliedFilters.branch))) && (
                   <Button onClick={handleResetFilters} variant="outline" disabled={isDataLoading} className="h-10 px-4">Reset</Button>
                 )}
              </div>
           </div>
        </div>
      )}

      {activeTab === 'sales' && (
        <>
          {showCharts && (
            <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
              {/* Highlight Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3.5 relative overflow-hidden group">
                  <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Pendapatan</p>
                    {isDataLoading ? (
                      <div className="h-7 w-28 bg-slate-200 animate-pulse rounded-lg mt-1" />
                    ) : (
                      <h3 className="text-lg font-black text-slate-800 mt-0.5 truncate">{formatRupiah(metrics.totalRevenue)}</h3>
                    )}
                    <p className="text-[10px] text-slate-400 mt-0.5">{metrics.completedCount} Transaksi Lunas</p>
                  </div>
                  <div className="absolute bottom-0 left-0 h-1 w-full bg-emerald-500/10" />
                </div>

                {/* Profit Kotor Card (Clickable) */}
                <button
                  type="button"
                  onClick={() => {
                    if (salesProfitLoss) {
                      setBreakdownItemSearch('');
                      setSelectedBreakdown({ data: salesProfitLoss, tab: 'gross' });
                    }
                  }}
                  className="text-left bg-white p-5 rounded-2xl border border-emerald-100 hover:border-emerald-300 hover:shadow-md transition-all flex items-center gap-3.5 relative overflow-hidden group cursor-pointer"
                >
                  <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors shrink-0">
                    <BarChart3 className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Profit Kotor</p>
                      <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md">Lihat HPP →</span>
                    </div>
                    {isDataLoading ? (
                      <div className="h-7 w-28 bg-slate-200 animate-pulse rounded-lg mt-1" />
                    ) : (
                      <h3 className="text-lg font-black text-emerald-600 mt-0.5 truncate">
                        {formatRupiah(salesProfitLoss?.grossProfit || 0)}
                      </h3>
                    )}
                    <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                      Modal HPP: -{formatRupiah(salesProfitLoss?.totalCost || 0)}
                    </p>
                  </div>
                  <div className="absolute bottom-0 left-0 h-1 w-full bg-emerald-500/30" />
                </button>

                {/* Profit Bersih Card (Clickable) */}
                <button
                  type="button"
                  onClick={() => {
                    if (salesProfitLoss) {
                      setBreakdownItemSearch('');
                      setSelectedBreakdown({ data: salesProfitLoss, tab: 'net' });
                    }
                  }}
                  className="text-left bg-slate-900 p-5 rounded-2xl border border-slate-800 hover:border-emerald-500/50 hover:shadow-md transition-all flex items-center gap-3.5 relative overflow-hidden group cursor-pointer text-white"
                >
                  <div className="p-2.5 rounded-xl bg-slate-800 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-colors shrink-0">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Profit Bersih</p>
                      <span className="text-[9px] font-bold text-emerald-300 bg-slate-800 px-1.5 py-0.5 rounded-md">Rincian →</span>
                    </div>
                    {isDataLoading ? (
                      <div className="h-7 w-28 bg-slate-700 animate-pulse rounded-lg mt-1" />
                    ) : (
                      <h3 className={cn(
                        "text-lg font-black mt-0.5 truncate",
                        (salesProfitLoss?.netProfit || 0) >= 0 ? "text-emerald-400" : "text-rose-400"
                      )}>
                        {formatRupiah(salesProfitLoss?.netProfit || 0)}
                      </h3>
                    )}
                    <p className="text-[10px] text-rose-300/90 mt-0.5 truncate">
                      Pengurangan: -{formatRupiah(salesProfitLoss?.totalDeductions ?? ((salesProfitLoss?.totalExpenses || 0) + (salesProfitLoss?.totalPayableDebt || 0) + (salesProfitLoss?.totalReceivableDebt || 0)))}
                    </p>
                  </div>
                </button>

                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3.5 relative overflow-hidden group">
                  <div className="p-2.5 rounded-xl bg-sky-50 text-sky-600 shrink-0">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Rata-rata Tiket</p>
                    {isDataLoading ? (
                      <div className="h-7 w-28 bg-slate-200 animate-pulse rounded-lg mt-1" />
                    ) : (
                      <h3 className="text-lg font-black text-slate-800 mt-0.5 truncate">{formatRupiah(metrics.avgTicket)}</h3>
                    )}
                    <p className="text-[10px] text-slate-400 mt-0.5">Per Transaksi</p>
                  </div>
                  <div className="absolute bottom-0 left-0 h-1 w-full bg-sky-500/10" />
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3.5 relative overflow-hidden group">
                  <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 shrink-0">
                    <PackageCheck className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Item Terjual</p>
                    {isDataLoading ? (
                      <div className="h-7 w-24 bg-slate-200 animate-pulse rounded-lg mt-1" />
                    ) : (
                      <h3 className="text-lg font-black text-slate-800 mt-0.5 truncate">{metrics.totalItemsSold} Item</h3>
                    )}
                    <p className="text-[10px] text-slate-400 mt-0.5">Unit Keluar</p>
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
                    {isDataLoading ? (
                      <div className="h-full flex flex-col items-center justify-center gap-2 text-slate-400">
                        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                        <span className="text-xs font-semibold text-slate-500">Memuat visualisasi grafik...</span>
                      </div>
                    ) : dailyTrendData.length === 0 ? (
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
                    {isDataLoading ? (
                      <div className="h-full flex flex-col items-center justify-center gap-2 text-slate-400">
                        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                        <span className="text-xs font-semibold text-slate-500">Memuat distribusi pembayaran...</span>
                      </div>
                    ) : paymentMethodData.length === 0 ? (
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
               <div className="text-sm font-medium text-slate-500 flex items-center gap-2">
                  {isDataLoading && <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />}
                  Menampilkan <span className="text-slate-800 font-bold">{isDataLoading ? '...' : totalItems}</span> Transaksi
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
                  {isDataLoading ? (
                    [1, 2, 3, 4, 5].map(i => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-5 w-20 rounded" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-28 rounded" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-24 rounded" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-24 rounded" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-24 rounded" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-16 rounded" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-5 w-20 ml-auto rounded" /></TableCell>
                        <TableCell className="text-center"><Skeleton className="h-6 w-16 mx-auto rounded-full" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-8 rounded-full" /></TableCell>
                      </TableRow>
                    ))
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 relative overflow-hidden group">
                  <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Pendapatan</p>
                    <h3 className="text-xl font-black text-slate-800 mt-0.5 truncate">{formatRupiah(consolidationMetrics.totalSales)}</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">{consolidationMetrics.totalTransactions} Transaksi Gabungan</p>
                  </div>
                  <div className="absolute bottom-0 left-0 h-1 w-full bg-emerald-500/10" />
                </div>

                {/* Clickable Total Profit Kotor */}
                <button
                  type="button"
                  onClick={() => {
                    if (consolidationMetrics.combinedBreakdown) {
                      setBreakdownItemSearch('');
                      setSelectedBreakdown({ data: consolidationMetrics.combinedBreakdown, tab: 'gross' });
                    }
                  }}
                  className="text-left bg-white p-6 rounded-2xl border border-emerald-100 hover:border-emerald-300 hover:shadow-md transition-all flex items-center gap-4 relative overflow-hidden group cursor-pointer"
                >
                  <div className="p-3 rounded-xl bg-sky-50 text-sky-600 group-hover:bg-sky-600 group-hover:text-white transition-colors shrink-0">
                    <BarChart3 className="w-6 h-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Profit Kotor</p>
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">Klik Rincian HPP →</span>
                    </div>
                    <h3 className="text-xl font-black text-emerald-600 mt-0.5 truncate">{formatRupiah(consolidationMetrics.totalProfit)}</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                      Modal Obat (HPP): -{formatRupiah(consolidationMetrics.totalCost)}
                    </p>
                  </div>
                  <div className="absolute bottom-0 left-0 h-1 w-full bg-sky-500/20" />
                </button>

                {/* Clickable Total Pengurangan (Biaya + Hutang Supplier + Hutang Customer) */}
                <button
                  type="button"
                  onClick={() => {
                    if (consolidationMetrics.combinedBreakdown) {
                      setBreakdownItemSearch('');
                      setSelectedBreakdown({ data: consolidationMetrics.combinedBreakdown, tab: 'net' });
                    }
                  }}
                  className="text-left bg-white p-6 rounded-2xl border border-rose-100 hover:border-rose-300 hover:shadow-md transition-all flex items-center gap-4 relative overflow-hidden group cursor-pointer"
                >
                  <div className="p-3 rounded-xl bg-rose-50 text-rose-600 group-hover:bg-rose-600 group-hover:text-white transition-colors shrink-0">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Pengurangan</p>
                      <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md">Lihat Detail →</span>
                    </div>
                    <h3 className="text-xl font-black text-rose-600 mt-0.5 truncate">-{formatRupiah(consolidationMetrics.totalDeductions)}</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                      Biaya: -{formatRupiah(consolidationMetrics.totalExpenses)} • Hutang: -{formatRupiah(consolidationMetrics.totalPayableDebt + consolidationMetrics.totalReceivableDebt)}
                    </p>
                  </div>
                  <div className="absolute bottom-0 left-0 h-1 w-full bg-rose-500/20" />
                </button>

                {/* Clickable Total Profit Bersih */}
                <button
                  type="button"
                  onClick={() => {
                    if (consolidationMetrics.combinedBreakdown) {
                      setBreakdownItemSearch('');
                      setSelectedBreakdown({ data: consolidationMetrics.combinedBreakdown, tab: 'net' });
                    }
                  }}
                  className="text-left bg-slate-900 p-6 rounded-2xl border border-slate-800 hover:border-emerald-500/50 hover:shadow-md transition-all flex items-center gap-4 relative overflow-hidden group cursor-pointer text-white"
                >
                  <div className="p-3 rounded-xl bg-slate-800 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-colors shrink-0">
                    <PackageCheck className="w-6 h-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Profit Bersih</p>
                      <span className="text-[10px] font-bold text-emerald-300 bg-slate-800 px-2 py-0.5 rounded-md">Klik Detail →</span>
                    </div>
                    <h3 className={cn(
                      "text-xl font-black mt-0.5 truncate",
                      consolidationMetrics.totalNetProfit >= 0 ? "text-emerald-400" : "text-rose-400"
                    )}>
                      {formatRupiah(consolidationMetrics.totalNetProfit)}
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">Profit Kotor - Biaya - Hutang Supplier & Customer</p>
                  </div>
                </button>
              </div>

              {/* Chart Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                  <div>
                    <h3 className="font-extrabold text-slate-800">Perbandingan Kinerja Cabang</h3>
                    <p className="text-xs text-slate-400">Komparasi visual Pendapatan, Profit Kotor, dan Profit Bersih antar cabang</p>
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
                          formatter={(val: number) => [formatRupiah(val)]}
                        />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', paddingTop: '10px' }} />
                        <Bar dataKey="totalSales" name="Pendapatan" fill="#10b981" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="grossProfit" name="Profit Kotor" fill="#0284c7" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="netProfit" name="Profit Bersih" fill="#6366f1" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col space-y-4">
                  <div>
                    <h3 className="font-extrabold text-slate-800">Ringkasan Margin Cabang</h3>
                    <p className="text-xs text-slate-400">Klik cabang untuk melihat rincian HPP, biaya & hutang</p>
                  </div>
                  <div className="flex-1 overflow-auto">
                    <div className="space-y-3">
                      {branchComparison.map((branch: any) => {
                        const margin = branch.totalSales > 0 ? (branch.grossProfit / branch.totalSales) * 100 : 0;
                        const netProfitVal = branch.netProfit ?? branch.grossProfit ?? 0;
                        return (
                          <div
                            key={branch.branchId}
                            onClick={() => {
                              setBreakdownItemSearch('');
                              setSelectedBreakdown({ data: branch, tab: 'gross' });
                            }}
                            className="p-3.5 bg-slate-50/70 hover:bg-emerald-50/40 border border-slate-100 hover:border-emerald-200 rounded-2xl flex justify-between items-center cursor-pointer transition-all"
                          >
                            <div>
                              <p className="text-xs font-bold text-slate-800">{branch.branchName}</p>
                              <p className="text-[10px] text-slate-400 font-semibold">{branch.transactionCount} Transaksi • Klik untuk detail</p>
                            </div>
                            <div className="text-right">
                              <span className="inline-block px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 text-[10px] font-black border border-emerald-100/50">
                                Margin Kotor: {margin.toFixed(1)}%
                              </span>
                              <p className="text-xs font-black text-emerald-600 mt-1">Kotor: {formatRupiah(branch.grossProfit)}</p>
                              <p className="text-[11px] font-bold text-indigo-600">Bersih: {formatRupiah(netProfitVal)}</p>
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
                <div className="p-5 border-b border-slate-100 bg-slate-50/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="font-extrabold text-slate-800">Detail Kontribusi Cabang</h3>
                    <p className="text-xs text-slate-400">
                      Klik angka <span className="font-bold text-emerald-600">Profit Kotor</span> untuk melihat asal hitungan & HPP obat, atau klik <span className="font-bold text-indigo-600">Profit Bersih</span> untuk melihat rincian pengurangan biaya, hutang supplier & hutang customer.
                    </p>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50/30">
                        <TableHead className="font-bold text-slate-500">Nama Cabang</TableHead>
                        <TableHead className="font-bold text-slate-500 text-right">Total Pendapatan</TableHead>
                        <TableHead className="font-bold text-slate-500 text-right">Modal Obat (HPP)</TableHead>
                        <TableHead className="font-bold text-slate-500 text-right">Profit Kotor</TableHead>
                        <TableHead className="font-bold text-slate-500 text-right">Pengurangan (Biaya & Hutang)</TableHead>
                        <TableHead className="font-bold text-slate-500 text-right">Profit Bersih</TableHead>
                        <TableHead className="font-bold text-slate-500 text-right">Margin</TableHead>
                        <TableHead className="font-bold text-slate-500 text-center">Transaksi</TableHead>
                        <TableHead className="font-bold text-slate-500 text-center">Detail</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {branchComparison.map((branch: any) => {
                        const margin = branch.totalSales > 0 ? (branch.grossProfit / branch.totalSales) * 100 : 0;
                        const totalCostVal = branch.totalCost ?? (branch.totalSales - branch.grossProfit);
                        const totalExpensesVal = Number(branch.totalExpenses ?? 0);
                        const totalPayableDebtVal = Number(branch.totalPayableDebt ?? 0);
                        const totalReceivableDebtVal = Number(branch.totalReceivableDebt ?? 0);
                        const totalDeductionsVal = Number(branch.totalDeductions ?? (totalExpensesVal + totalPayableDebtVal + totalReceivableDebtVal));
                        const netProfitVal = Number(branch.netProfit ?? (branch.grossProfit - totalDeductionsVal));
                        return (
                          <TableRow key={branch.branchId} className="hover:bg-slate-50/50 transition-colors">
                            <TableCell className="font-bold text-slate-700">{branch.branchName}</TableCell>
                            <TableCell className="text-right font-bold text-slate-800">{formatRupiah(branch.totalSales)}</TableCell>
                            <TableCell className="text-right font-semibold text-rose-500">
                              <button
                                type="button"
                                onClick={() => {
                                  setBreakdownItemSearch('');
                                  setSelectedBreakdown({ data: branch, tab: 'gross' });
                                }}
                                className="hover:underline cursor-pointer text-right"
                                title="Klik untuk melihat rincian HPP obat terjual"
                              >
                                -{formatRupiah(totalCostVal)}
                              </button>
                            </TableCell>
                            <TableCell className="text-right">
                              <button
                                type="button"
                                onClick={() => {
                                  setBreakdownItemSearch('');
                                  setSelectedBreakdown({ data: branch, tab: 'gross' });
                                }}
                                className="inline-flex flex-col items-end px-2.5 py-1 rounded-xl bg-emerald-50/70 hover:bg-emerald-100 border border-emerald-200/60 transition-colors cursor-pointer"
                                title="Klik untuk lihat kenapa jumlah Profit Kotor segini"
                              >
                                <span className="font-black text-emerald-700">{formatRupiah(branch.grossProfit)}</span>
                                <span className="text-[10px] font-bold text-emerald-600">Lihat HPP →</span>
                              </button>
                            </TableCell>
                            <TableCell className="text-right font-semibold text-rose-600">
                              <button
                                type="button"
                                onClick={() => {
                                  setBreakdownItemSearch('');
                                  setSelectedBreakdown({ data: branch, tab: 'net' });
                                }}
                                className="hover:underline cursor-pointer text-right inline-flex flex-col items-end"
                                title="Klik untuk melihat rincian biaya operasional, hutang supplier & hutang customer"
                              >
                                <span className="font-bold">-{formatRupiah(totalDeductionsVal)}</span>
                                <span className="text-[10px] text-slate-400 font-medium">
                                  Biaya: {formatRupiah(totalExpensesVal)} | Hutang: {formatRupiah(totalPayableDebtVal + totalReceivableDebtVal)}
                                </span>
                              </button>
                            </TableCell>
                            <TableCell className="text-right">
                              <button
                                type="button"
                                onClick={() => {
                                  setBreakdownItemSearch('');
                                  setSelectedBreakdown({ data: branch, tab: 'net' });
                                }}
                                className={cn(
                                  "inline-flex flex-col items-end px-2.5 py-1 rounded-xl border transition-colors cursor-pointer",
                                  netProfitVal >= 0
                                    ? "bg-indigo-50/70 hover:bg-indigo-100 border-indigo-200/60 text-indigo-700"
                                    : "bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-700"
                                )}
                                title="Klik untuk lihat rincian pengurangan & Profit Bersih"
                              >
                                <span className="font-black">{formatRupiah(netProfitVal)}</span>
                                <span className="text-[10px] font-bold opacity-80">Lihat Pengurangan →</span>
                              </button>
                            </TableCell>
                            <TableCell className="text-right font-black text-slate-700">{margin.toFixed(2)}%</TableCell>
                            <TableCell className="text-center font-bold text-slate-600">{branch.transactionCount}</TableCell>
                            <TableCell className="text-center">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setBreakdownItemSearch('');
                                  setSelectedBreakdown({ data: branch, tab: 'gross' });
                                }}
                                className="h-8 px-3 text-xs font-bold border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                              >
                                Rincian
                              </Button>
                            </TableCell>
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

      {activeTab === 'loyalty' && (
        <div className="pt-2">
          <CustomerLoyaltyView />
        </div>
      )}

      {/* Modal Rincian Profit Kotor & Profit Bersih */}
      <AnimatePresence>
        {selectedBreakdown && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    Transparansi Perhitungan Laba Rugi
                  </span>
                  <h3 className="text-xl font-black text-slate-800 mt-2">
                    Rincian Profit: {selectedBreakdown.data.branchName || 'Semua Cabang'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Periode: {appliedFilters.start ? `${appliedFilters.start} s/d ${appliedFilters.end || 'Sekarang'}` : 'Semua Waktu'} • {selectedBreakdown.data.transactionCount || 0} Transaksi
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedBreakdown(null)}
                  className="w-9 h-9 p-0 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Tab Switcher inside Modal */}
              <div className="px-6 pt-4 bg-white border-b border-slate-100 flex gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedBreakdown({ ...selectedBreakdown, tab: 'gross' })}
                  className={cn(
                    "pb-3 px-4 text-xs sm:text-sm font-extrabold border-b-2 transition-all flex items-center gap-2 cursor-pointer",
                    selectedBreakdown.tab === 'gross'
                      ? "border-emerald-600 text-emerald-700"
                      : "border-transparent text-slate-400 hover:text-slate-600"
                  )}
                >
                  <span>1. Kenapa Profit Kotor Sekian? (Rincian HPP Obat)</span>
                  <span className="px-2 py-0.5 rounded-full text-[11px] bg-emerald-50 text-emerald-700 font-black">
                    {formatRupiah(selectedBreakdown.data.grossProfit || 0)}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedBreakdown({ ...selectedBreakdown, tab: 'net' })}
                  className={cn(
                    "pb-3 px-4 text-xs sm:text-sm font-extrabold border-b-2 transition-all flex items-center gap-2 cursor-pointer",
                    selectedBreakdown.tab === 'net'
                      ? "border-indigo-600 text-indigo-700"
                      : "border-transparent text-slate-400 hover:text-slate-600"
                  )}
                >
                  <span>2. Rincian Profit Bersih (Pengurangan Biaya & Hutang)</span>
                  <span className="px-2 py-0.5 rounded-full text-[11px] bg-indigo-50 text-indigo-700 font-black">
                    {formatRupiah(selectedBreakdown.data.netProfit ?? selectedBreakdown.data.grossProfit ?? 0)}
                  </span>
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1">
                {selectedBreakdown.tab === 'gross' ? (
                  <>
                    {/* Step-by-step Gross Profit Formula Box */}
                    <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/80 space-y-3">
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">
                        Alur Perhitungan Profit Kotor (Laba Kotor)
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between items-center py-1.5 border-b border-slate-200/60">
                          <span className="text-slate-600 font-medium">1. Total Penjualan Kotor (Harga Jual Barang Keluar)</span>
                          <span className="font-bold text-slate-800">
                            {formatRupiah(selectedBreakdown.data.grossSales ?? selectedBreakdown.data.totalSales ?? 0)}
                          </span>
                        </div>
                        {(selectedBreakdown.data.totalRefunds || 0) > 0 && (
                          <div className="flex justify-between items-center py-1.5 border-b border-slate-200/60 text-rose-600">
                            <span className="font-medium">2. Dikurangi: Retur Penjualan (Barang Dikembalikan Pembeli)</span>
                            <span className="font-bold">-{formatRupiah(selectedBreakdown.data.totalRefunds || 0)}</span>
                          </div>
                        )}
                        <div className="flex justify-between items-center py-1.5 border-b border-slate-200/60 bg-white px-3 rounded-xl">
                          <span className="font-bold text-slate-700">Total Pendapatan Bersih (Omset)</span>
                          <span className="font-black text-slate-900">{formatRupiah(selectedBreakdown.data.totalSales || 0)}</span>
                        </div>
                        <div className="flex justify-between items-center py-1.5 border-b border-slate-200/60 text-rose-600">
                          <div>
                            <span className="font-bold">Dikurangi: Total Modal Obat Terjual (HPP / Harga Beli Batch)</span>
                            <p className="text-[11px] text-slate-400">Akumulasi (Harga Beli per Batch × Jumlah Obat Terjual)</p>
                          </div>
                          <span className="font-black">
                            -{formatRupiah(selectedBreakdown.data.totalCost ?? ((selectedBreakdown.data.totalSales || 0) - (selectedBreakdown.data.grossProfit || 0)))}
                          </span>
                        </div>
                        <div className="flex justify-between items-center pt-2 px-3 py-2.5 bg-emerald-600 text-white rounded-xl shadow-sm">
                          <span className="font-black uppercase tracking-wide text-xs sm:text-sm">HASIL: PROFIT KOTOR (LABA KOTOR)</span>
                          <span className="text-lg font-black">{formatRupiah(selectedBreakdown.data.grossProfit || 0)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Items Breakdown Table */}
                    <div className="space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <h4 className="text-sm font-extrabold text-slate-800">
                            Rincian Modal (HPP) & Profit Kotor per Obat Terjual
                          </h4>
                          <p className="text-xs text-slate-400">
                            Daftar produk yang membentuk angka Pendapatan, Modal HPP, dan Profit Kotor di atas
                          </p>
                        </div>
                        <div className="relative w-full sm:w-64">
                          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <Input
                            placeholder="Cari nama obat / SKU..."
                            value={breakdownItemSearch}
                            onChange={(e) => setBreakdownItemSearch(e.target.value)}
                            className="pl-8 h-9 text-xs"
                          />
                        </div>
                      </div>

                      <div className="border border-slate-100 rounded-2xl overflow-hidden max-h-80 overflow-y-auto">
                        <table className="w-full text-xs sm:text-sm">
                          <thead className="bg-slate-50 sticky top-0 border-b border-slate-100 text-slate-500 font-bold">
                            <tr>
                              <th className="py-2.5 px-4 text-left">Nama Obat / Produk</th>
                              <th className="py-2.5 px-3 text-center">Qty Terjual</th>
                              <th className="py-2.5 px-4 text-right">Total Harga Jual</th>
                              <th className="py-2.5 px-4 text-right">Modal Obat (HPP)</th>
                              <th className="py-2.5 px-4 text-right">Profit Kotor</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {(() => {
                              const items: any[] = selectedBreakdown.data.itemsBreakdown || [];
                              const filtered = items.filter(it =>
                                !breakdownItemSearch ||
                                it.productName?.toLowerCase().includes(breakdownItemSearch.toLowerCase()) ||
                                it.sku?.toLowerCase().includes(breakdownItemSearch.toLowerCase())
                              );
                              if (filtered.length === 0) {
                                return (
                                  <tr>
                                    <td colSpan={5} className="py-8 text-center text-slate-400 italic">
                                      Tidak ada rincian produk yang cocok.
                                    </td>
                                  </tr>
                                );
                              }
                              return filtered.map((item, idx) => (
                                <tr key={idx} className="hover:bg-slate-50/60">
                                  <td className="py-2.5 px-4">
                                    <p className="font-bold text-slate-800">{item.productName}</p>
                                    <p className="text-[10px] font-mono text-slate-400">{item.sku}</p>
                                  </td>
                                  <td className="py-2.5 px-3 text-center font-bold text-slate-600">
                                    {Number(item.quantitySold || 0).toLocaleString('id-ID')}
                                  </td>
                                  <td className="py-2.5 px-4 text-right font-semibold text-slate-800">
                                    {formatRupiah(item.totalRevenue)}
                                  </td>
                                  <td className="py-2.5 px-4 text-right font-semibold text-rose-500">
                                    -{formatRupiah(item.totalCost)}
                                  </td>
                                  <td className="py-2.5 px-4 text-right font-black text-emerald-600">
                                    {formatRupiah(item.grossProfit)}
                                  </td>
                                </tr>
                              ));
                            })()}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Step-by-step Net Profit Formula Box */}
                    <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/80 space-y-3">
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">
                        Alur Perhitungan Profit Bersih & Pengurangan (Biaya + Hutang Supplier + Hutang Customer)
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between items-center py-1.5 border-b border-slate-200/60">
                          <div>
                            <span className="font-bold text-slate-700">1. Profit Kotor (Pendapatan Bersih - Modal HPP Obat)</span>
                            <p className="text-[11px] text-slate-400">Keuntungan penjualan obat sebelum biaya & hutang</p>
                          </div>
                          <span className="font-black text-emerald-600">{formatRupiah(selectedBreakdown.data.grossProfit || 0)}</span>
                        </div>
                        <div className="flex justify-between items-center py-1.5 border-b border-slate-200/60 text-rose-600">
                          <div>
                            <span className="font-bold">2. Dikurangi: Total Biaya Operasional / Pengeluaran</span>
                            <p className="text-[11px] text-slate-400">Gaji, listrik, sewa, operasional harian, dll. pada periode ini</p>
                          </div>
                          <span className="font-black">-{formatRupiah(selectedBreakdown.data.totalExpenses || 0)}</span>
                        </div>
                        <div className="flex justify-between items-center py-1.5 border-b border-slate-200/60 text-amber-700">
                          <div>
                            <span className="font-bold">3. Dikurangi: Sisa Hutang Pembelian ke Supplier (Belum Lunas)</span>
                            <p className="text-[11px] text-slate-400">Total sisa tagihan faktur pembelian obat ke supplier yang belum dibayar</p>
                          </div>
                          <span className="font-black">-{formatRupiah(selectedBreakdown.data.totalPayableDebt || 0)}</span>
                        </div>
                        <div className="flex justify-between items-center py-1.5 border-b border-slate-200/60 text-purple-700">
                          <div>
                            <span className="font-bold">4. Dikurangi: Sisa Hutang Customer / Piutang Penjualan (Belum Lunas)</span>
                            <p className="text-[11px] text-slate-400">Total sisa tagihan belanja tempo customer yang belum dibayar lunas</p>
                          </div>
                          <span className="font-black">-{formatRupiah(selectedBreakdown.data.totalReceivableDebt || 0)}</span>
                        </div>
                        <div className="flex justify-between items-center pt-2 px-3 py-2.5 bg-slate-900 text-white rounded-xl shadow-sm">
                          <span className="font-black uppercase tracking-wide text-xs sm:text-sm">HASIL: PROFIT BERSIH (LABA BERSIH)</span>
                          <span className={cn(
                            "text-lg font-black",
                            (selectedBreakdown.data.netProfit ?? selectedBreakdown.data.grossProfit ?? 0) >= 0 ? "text-emerald-400" : "text-rose-400"
                          )}>
                            {formatRupiah(selectedBreakdown.data.netProfit ?? selectedBreakdown.data.grossProfit ?? 0)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Supplier Debts Breakdown Table */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-extrabold text-slate-800">
                            A. Rincian Pengurangan Sisa Hutang Pembelian ke Supplier (Belum Lunas)
                          </h4>
                          <p className="text-xs text-slate-400">
                            Daftar faktur pembelian obat tempo (`HUTANG_PEMBELIAN`) yang masih memiliki sisa tagihan
                          </p>
                        </div>
                        <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 text-xs font-black">
                          Total Hutang Supplier: -{formatRupiah(selectedBreakdown.data.totalPayableDebt || 0)}
                        </span>
                      </div>

                      <div className="border border-slate-100 rounded-2xl overflow-hidden max-h-64 overflow-y-auto">
                        <table className="w-full text-xs sm:text-sm">
                          <thead className="bg-slate-50 sticky top-0 border-b border-slate-100 text-slate-500 font-bold">
                            <tr>
                              <th className="py-2.5 px-4 text-left">No. Faktur</th>
                              <th className="py-2.5 px-4 text-left">Supplier</th>
                              <th className="py-2.5 px-4 text-left">Cabang</th>
                              <th className="py-2.5 px-4 text-left">Jatuh Tempo</th>
                              <th className="py-2.5 px-4 text-right">Total Tagihan</th>
                              <th className="py-2.5 px-4 text-right">Sudah Dibayar</th>
                              <th className="py-2.5 px-4 text-right">Sisa Hutang (Pengurang)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {selectedBreakdown.data.debtsBreakdown && selectedBreakdown.data.debtsBreakdown.length > 0 ? (
                              selectedBreakdown.data.debtsBreakdown.map((debt: any, idx: number) => (
                                <tr key={debt.id || idx} className="hover:bg-slate-50/60">
                                  <td className="py-2.5 px-4 font-mono font-bold text-slate-800">{debt.invoiceNumber}</td>
                                  <td className="py-2.5 px-4 font-bold text-slate-700">{debt.supplierName}</td>
                                  <td className="py-2.5 px-4 text-slate-600">{debt.branchName || '-'}</td>
                                  <td className="py-2.5 px-4 text-slate-500">{debt.dueDate || '-'}</td>
                                  <td className="py-2.5 px-4 text-right font-semibold text-slate-700">{formatRupiah(debt.totalAmount)}</td>
                                  <td className="py-2.5 px-4 text-right font-medium text-emerald-600">{formatRupiah(debt.paidAmount)}</td>
                                  <td className="py-2.5 px-4 text-right font-black text-amber-700">
                                    -{formatRupiah(debt.remainingAmount)}
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={7} className="py-6 text-center text-slate-400 italic">
                                  Tidak ada sisa hutang pembelian ke supplier yang belum lunas (Rp 0).
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Customer Receivable Debts Breakdown Table */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-extrabold text-slate-800">
                            B. Rincian Pengurangan Sisa Hutang Customer / Piutang Penjualan (Belum Lunas)
                          </h4>
                          <p className="text-xs text-slate-400">
                            Daftar transaksi belanja tempo customer (`HUTANG_PENJUALAN`) yang belum dibayar lunas
                          </p>
                        </div>
                        <span className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 border border-purple-200 text-xs font-black">
                          Total Hutang Customer: -{formatRupiah(selectedBreakdown.data.totalReceivableDebt || 0)}
                        </span>
                      </div>

                      <div className="border border-slate-100 rounded-2xl overflow-hidden max-h-64 overflow-y-auto">
                        <table className="w-full text-xs sm:text-sm">
                          <thead className="bg-slate-50 sticky top-0 border-b border-slate-100 text-slate-500 font-bold">
                            <tr>
                              <th className="py-2.5 px-4 text-left">No. Invoice</th>
                              <th className="py-2.5 px-4 text-left">Nama Customer</th>
                              <th className="py-2.5 px-4 text-left">Cabang</th>
                              <th className="py-2.5 px-4 text-left">Jatuh Tempo</th>
                              <th className="py-2.5 px-4 text-right">Total Belanja</th>
                              <th className="py-2.5 px-4 text-right">Sudah Dibayar</th>
                              <th className="py-2.5 px-4 text-right">Sisa Hutang Customer (Pengurang)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {selectedBreakdown.data.receivableDebtsBreakdown && selectedBreakdown.data.receivableDebtsBreakdown.length > 0 ? (
                              selectedBreakdown.data.receivableDebtsBreakdown.map((debt: any, idx: number) => (
                                <tr key={debt.id || idx} className="hover:bg-slate-50/60">
                                  <td className="py-2.5 px-4 font-mono font-bold text-slate-800">{debt.invoiceNumber}</td>
                                  <td className="py-2.5 px-4 font-bold text-slate-700">{debt.customerName}</td>
                                  <td className="py-2.5 px-4 text-slate-600">{debt.branchName || '-'}</td>
                                  <td className="py-2.5 px-4 text-slate-500">{debt.dueDate || '-'}</td>
                                  <td className="py-2.5 px-4 text-right font-semibold text-slate-700">{formatRupiah(debt.totalAmount)}</td>
                                  <td className="py-2.5 px-4 text-right font-medium text-emerald-600">{formatRupiah(debt.paidAmount)}</td>
                                  <td className="py-2.5 px-4 text-right font-black text-purple-700">
                                    -{formatRupiah(debt.remainingAmount)}
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={7} className="py-6 text-center text-slate-400 italic">
                                  Tidak ada sisa hutang customer / piutang penjualan yang belum lunas (Rp 0).
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Expenses Breakdown Table */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-extrabold text-slate-800">
                            C. Rincian Pengurangan Biaya Operasional
                          </h4>
                          <p className="text-xs text-slate-400">
                            Daftar pengeluaran operasional yang mengurangi Profit Kotor pada periode ini
                          </p>
                        </div>
                        <span className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 text-xs font-black">
                          Total Biaya: -{formatRupiah(selectedBreakdown.data.totalExpenses || 0)}
                        </span>
                      </div>

                      <div className="border border-slate-100 rounded-2xl overflow-hidden max-h-64 overflow-y-auto">
                        <table className="w-full text-xs sm:text-sm">
                          <thead className="bg-slate-50 sticky top-0 border-b border-slate-100 text-slate-500 font-bold">
                            <tr>
                              <th className="py-2.5 px-4 text-left">Tanggal</th>
                              <th className="py-2.5 px-4 text-left">Cabang</th>
                              <th className="py-2.5 px-4 text-left">Kategori</th>
                              <th className="py-2.5 px-4 text-left">Keterangan</th>
                              <th className="py-2.5 px-4 text-right">Nominal Pengurang</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {selectedBreakdown.data.expensesBreakdown && selectedBreakdown.data.expensesBreakdown.length > 0 ? (
                              selectedBreakdown.data.expensesBreakdown.map((exp: any, idx: number) => (
                                <tr key={exp.id || idx} className="hover:bg-slate-50/60">
                                  <td className="py-2.5 px-4 font-medium text-slate-600">
                                    {exp.expenseDate ? new Date(exp.expenseDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                                  </td>
                                  <td className="py-2.5 px-4 font-bold text-slate-700">{exp.branchName || '-'}</td>
                                  <td className="py-2.5 px-4">
                                    <span className="inline-block px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 text-[11px] font-bold border border-rose-100">
                                      {exp.category}
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-4 text-slate-600">{exp.notes || '-'}</td>
                                  <td className="py-2.5 px-4 text-right font-black text-rose-600">
                                    -{formatRupiah(exp.amount)}
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={5} className="py-6 text-center text-slate-400 italic">
                                  Belum ada catatan pengeluaran / biaya operasional pada periode ini (Rp 0).
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-slate-100 bg-slate-50/60 flex justify-end">
                <Button onClick={() => setSelectedBreakdown(null)} className="px-6 bg-slate-800 hover:bg-slate-900 text-white font-bold">
                  Tutup Rincian
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Detail Transaksi */}
      <AnimatePresence>
        {selectedSale && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]"
            >
               {/* Header */}
               <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <div>
                     <span className="text-[10px] font-black uppercase text-slate-400">Detail Transaksi & Laba Kotor Struk</span>
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

                  {/* Items Table with HPP & Profit Kotor */}
                  <div>
                     <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">Daftar Item & Rincian Profit Kotor</h4>
                     <div className="border border-slate-100 rounded-2xl overflow-hidden">
                        <table className="w-full text-xs sm:text-sm">
                           <thead>
                              <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-400 font-bold">
                                 <th className="py-2.5 px-4 text-left font-semibold">Nama Produk</th>
                                 <th className="py-2.5 px-3 text-center font-semibold">Qty</th>
                                 <th className="py-2.5 px-3 text-right font-semibold">Harga Jual</th>
                                 <th className="py-2.5 px-3 text-right font-semibold">Subtotal</th>
                                 <th className="py-2.5 px-3 text-right font-semibold">Modal (HPP)</th>
                                 <th className="py-2.5 px-4 text-right font-semibold">Profit Kotor</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-slate-50 text-slate-700">
                              {selectedSale.details && selectedSale.details.length > 0 ? (
                                selectedSale.details.map((detail) => {
                                   const itemCost = (Number(detail.purchasePrice) || 0) * (Number(detail.quantity) || 0);
                                   const itemProfit = (Number(detail.subtotal) || 0) - itemCost;
                                   return (
                                     <tr key={detail.id} className="hover:bg-slate-50/20">
                                        <td className="py-3 px-4">
                                           <p className="font-bold text-slate-800">
                                             {detail.isCompound ? `[Racikan] ${detail.compoundName || 'Obat Racikan'}` : detail.product?.name}
                                           </p>
                                           {detail.batch && (
                                             <p className="text-[10px] text-slate-400 font-mono mt-0.5">Batch: {detail.batch.batchNumber}</p>
                                           )}
                                        </td>
                                        <td className="py-3 px-3 text-center font-bold text-slate-600">{detail.quantity}</td>
                                        <td className="py-3 px-3 text-right text-slate-500">{formatRupiah(detail.unitPrice)}</td>
                                        <td className="py-3 px-3 text-right font-bold text-slate-800">{formatRupiah(detail.subtotal)}</td>
                                        <td className="py-3 px-3 text-right font-semibold text-rose-500">-{formatRupiah(itemCost)}</td>
                                        <td className="py-3 px-4 text-right font-black text-emerald-600">{formatRupiah(itemProfit)}</td>
                                     </tr>
                                   );
                                })
                              ) : (
                                <tr>
                                   <td colSpan={6} className="py-8 text-center text-slate-400">Tidak ada detail item.</td>
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
               {(() => {
                 const totalHpp = (selectedSale.details || []).reduce(
                   (acc, d) => acc + (Number(d.purchasePrice) || 0) * (Number(d.quantity) || 0),
                   0
                 );
                 const totalGrossProfit = (Number(selectedSale.totalAmount) || 0) - totalHpp;
                 return (
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
                      <div className="flex items-center gap-6 text-right">
                         <div>
                            <span className="text-[10px] uppercase font-black text-slate-400">Modal HPP</span>
                            <p className="text-sm font-bold text-rose-500">-{formatRupiah(totalHpp)}</p>
                         </div>
                         <div>
                            <span className="text-[10px] uppercase font-black text-slate-400">Profit Kotor</span>
                            <p className="text-base font-black text-emerald-600">{formatRupiah(totalGrossProfit)}</p>
                         </div>
                         <div>
                            <span className="text-[10px] uppercase font-black text-slate-400">Total Transaksi</span>
                            <p className="text-xl font-black text-slate-900">{formatRupiah(selectedSale.totalAmount)}</p>
                         </div>
                      </div>
                   </div>
                 );
               })()}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ReportsPage;
