import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import api from '../api/api';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { 
  FileText, 
  Download, 
  Search, 
  Calendar, 
  Filter,
  CreditCard,
  User,
  ArrowRight
} from 'lucide-react';

interface Sale {
  id: number;
  saleDate: string;
  totalAmount: number;
  paymentMethod: string;
  status: string;
  user: { fullName: string };
  customer?: { name: string };
  branch: { id: number; name: string };
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

  const { data: sales, isLoading } = useQuery<Sale[]>({
    queryKey: ['sales-report'],
    queryFn: () => api.get('/sales').then(res => res.data),
  });

  const { data: branches } = useQuery<any[]>({
    queryKey: ['branches'],
    queryFn: () => api.get('/branches').then(res => res.data),
  });

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

  const filteredSales = sales?.filter(sale => {
    // 1. Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const idMatch = `#sal-${sale.id}`.toLowerCase().includes(search) || `sal-${sale.id}`.toLowerCase().includes(search) || String(sale.id).includes(search);
      const customerMatch = sale.customer?.name?.toLowerCase().includes(search);
      const userMatch = sale.user?.fullName?.toLowerCase().includes(search);
      if (!idMatch && !customerMatch && !userMatch) return false;
    }

    // 2. Status filter
    if (appliedFilters.status && sale.status !== appliedFilters.status) {
      return false;
    }

    // 3. Branch filter
    if (appliedFilters.branch && String(sale.branch?.id) !== appliedFilters.branch) {
      return false;
    }

    // 4. Date range filter
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

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Laporan Penjualan</h1>
          <p className="text-slate-500 text-sm">Analisa performa transaksi apotek Anda.</p>
        </div>
        <div className="flex items-center gap-3">
           <Button variant="outline" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export Excel
           </Button>
           <Button className="flex items-center gap-2 bg-slate-900">
              <FileText className="w-4 h-4" />
              Cetak Laporan
           </Button>
        </div>
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
         <div className="flex gap-2">
            <Button onClick={handleApplyFilters} className="h-10 px-6 bg-emerald-600 hover:bg-emerald-700">Filter</Button>
            {(appliedFilters.start || appliedFilters.end || appliedFilters.status || appliedFilters.branch) && (
              <Button onClick={handleResetFilters} variant="outline" className="h-10 px-4">Reset</Button>
            )}
         </div>
      </div>

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
              Menampilkan <span className="text-slate-800 font-bold">{filteredSales?.length || 0}</span> Transaksi
           </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID / Tanggal</TableHead>
                <TableHead>Cabang</TableHead>
                <TableHead>Customer & Kasir</TableHead>
                <TableHead>Metode Bayar</TableHead>
                <TableHead className="text-right">Total Transaksi</TableHead>
                <TableHead className="text-center">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="h-32 text-center text-slate-400">Memuat data...</TableCell></TableRow>
              ) : filteredSales?.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="h-32 text-center text-slate-400">Tidak ada transaksi ditemukan.</TableCell></TableRow>
              ) : (
                filteredSales?.map((sale, index) => (
                  <motion.tr 
                    key={sale.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="group hover:bg-slate-50/50 border-b border-slate-50 last:border-0"
                  >
                    <TableCell>
                       <div className="min-w-[140px]">
                          <p className="font-mono text-xs font-bold text-emerald-600 uppercase tracking-tighter">#SAL-{sale.id}</p>
                          <p className="text-xs text-slate-500 mt-0.5">
                             {new Date(sale.saleDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                       </div>
                    </TableCell>
                    <TableCell>
                       <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-100">
                          {sale.branch?.name || 'Cabang Utama'}
                       </span>
                    </TableCell>
                    <TableCell>
                       <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-sm font-bold text-slate-800">
                             <User className="w-3.5 h-3.5 text-slate-400" />
                             {sale.customer?.name || 'Umum'}
                          </div>
                          <p className="text-[10px] text-slate-400 uppercase font-black">Kasir: {sale.user?.fullName || 'Sistem'}</p>
                       </div>
                    </TableCell>
                    <TableCell>
                       <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs font-bold">
                          <CreditCard className="w-3.5 h-3.5" />
                          {sale.paymentMethod}
                       </span>
                    </TableCell>
                    <TableCell className="text-right">
                       <p className="text-sm font-black text-slate-800">Rp {sale.totalAmount.toLocaleString()}</p>
                    </TableCell>
                    <TableCell className="text-center">
                       <Button variant="ghost" size="sm" className="w-8 h-8 p-0 rounded-full group-hover:bg-white group-hover:shadow-sm">
                          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600" />
                       </Button>
                    </TableCell>
                  </motion.tr>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
