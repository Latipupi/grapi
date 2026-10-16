import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import api from '../../api/api';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../ui/Table';
import { Pagination } from '../ui/Pagination';
import { Dialog } from '../ui/Dialog';
import { cn } from '../../lib/utils';
import { 
  Trophy, 
  Award, 
  Gift, 
  Search, 
  Calendar, 
  Download, 
  Printer, 
  MessageCircle, 
  TrendingUp, 
  Users, 
  ShoppingBag, 
  Sparkles
} from 'lucide-react';

interface CustomerSpending {
  customerId: number;
  name: string;
  phone: string;
  address: string;
  email: string;
  active: boolean;
  transactionCount: number;
  totalSpent: number;
  averageSpent: number;
  firstPurchaseDate: string | null;
  lastPurchaseDate: string | null;
}

interface CustomerLoyaltyReport {
  totalCustomers: number;
  activeCustomers: number;
  totalCustomerSpending: number;
  averageSpendingPerCustomer: number;
  topSpenderName: string;
  topSpenderAmount: number;
  mostFrequentCustomerName: string;
  mostFrequentCount: number;
  customers: CustomerSpending[];
}

interface Branch {
  id: number;
  name: string;
}

export const CustomerLoyaltyView: React.FC = () => {
  // Filters State
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [sortBy, setSortBy] = useState<'TOTAL_SPENT' | 'TRANSACTION_COUNT'>('TOTAL_SPENT');
  const [includeAll, setIncludeAll] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // Date Presets
  const now = new Date();
  const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
  
  const [datePreset, setDatePreset] = useState<'1_YEAR' | 'THIS_YEAR' | '6_MONTHS' | 'ALL_TIME' | 'CUSTOM'>('1_YEAR');
  const [startDate, setStartDate] = useState<string>(oneYearAgo.toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState<string>(now.toISOString().split('T')[0]);

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const entriesPerPage = 10;

  // Print Dialog State
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);

  // Queries
  const { data: branches } = useQuery<Branch[]>({
    queryKey: ['branches'],
    queryFn: () => api.get('/branches').then(res => res.data),
  });

  const { data: loyaltyData, isLoading } = useQuery<CustomerLoyaltyReport>({
    queryKey: ['customer-loyalty', selectedBranchId, startDate, endDate, sortBy, includeAll],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedBranchId) params.append('branchId', selectedBranchId);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (sortBy) params.append('sortBy', sortBy);
      if (includeAll) params.append('includeAll', 'true');

      const res = await api.get(`/customers/spending-summary?${params.toString()}`);
      return res.data;
    }
  });

  // Handle Preset Change
  const applyDatePreset = (preset: '1_YEAR' | 'THIS_YEAR' | '6_MONTHS' | 'ALL_TIME' | 'CUSTOM') => {
    setDatePreset(preset);
    setCurrentPage(1);
    const today = new Date();
    
    if (preset === '1_YEAR') {
      const past = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
      setStartDate(past.toISOString().split('T')[0]);
      setEndDate(today.toISOString().split('T')[0]);
    } else if (preset === 'THIS_YEAR') {
      const past = new Date(today.getFullYear(), 0, 1);
      setStartDate(past.toISOString().split('T')[0]);
      setEndDate(today.toISOString().split('T')[0]);
    } else if (preset === '6_MONTHS') {
      const past = new Date(today.getFullYear(), today.getMonth() - 6, today.getDate());
      setStartDate(past.toISOString().split('T')[0]);
      setEndDate(today.toISOString().split('T')[0]);
    } else if (preset === 'ALL_TIME') {
      setStartDate('');
      setEndDate('');
    }
  };

  // Filter and search
  const filteredCustomers = useMemo(() => {
    if (!loyaltyData?.customers) return [];
    let list = loyaltyData.customers;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(c => 
        c.name.toLowerCase().includes(q) ||
        (c.phone && c.phone.toLowerCase().includes(q)) ||
        (c.address && c.address.toLowerCase().includes(q))
      );
    }
    return list;
  }, [loyaltyData?.customers, searchTerm]);

  // Pagination calculation
  const totalEntries = filteredCustomers.length;
  const totalPages = Math.ceil(totalEntries / entriesPerPage);
  const indexOfLastEntry = currentPage * entriesPerPage;
  const indexOfFirstEntry = indexOfLastEntry - entriesPerPage;
  const currentEntries = filteredCustomers.slice(indexOfFirstEntry, indexOfLastEntry);

  // Helper WhatsApp Link
  const getWhatsAppLink = (phone: string, name: string) => {
    if (!phone) return null;
    let clean = phone.replace(/[^0-9]/g, '');
    if (clean.startsWith('0')) {
      clean = '62' + clean.substring(1);
    }
    const message = encodeURIComponent(`Halo Bpk/Ibu ${name}, kami dari Apotek ingin menyampaikan terima kasih banyak atas kepercayaannya menjadi pelanggan setia kami...`);
    return `https://wa.me/${clean}?text=${message}`;
  };

  // Helper Format Currency
  const formatCurrency = (val: number) => {
    return 'Rp ' + Math.round(val || 0).toLocaleString('id-ID');
  };

  // Helper Export CSV
  const handleExportCSV = () => {
    if (!filteredCustomers.length) {
      alert('Tidak ada data untuk diekspor');
      return;
    }

    const headers = [
      'Peringkat',
      'Nama Pelanggan',
      'No. Telepon/WA',
      'Alamat',
      'Email',
      'Jumlah Transaksi',
      'Total Belanja (Rp)',
      'Rata-rata Belanja (Rp)',
      'Transaksi Terakhir'
    ];

    const rows = filteredCustomers.map((c, index) => [
      index + 1,
      `"${c.name.replace(/"/g, '""')}"`,
      `"${(c.phone || '-').replace(/"/g, '""')}"`,
      `"${(c.address || '-').replace(/"/g, '""')}"`,
      `"${(c.email || '-').replace(/"/g, '""')}"`,
      c.transactionCount,
      Math.round(c.totalSpent),
      Math.round(c.averageSpent),
      c.lastPurchaseDate ? c.lastPurchaseDate.split('T')[0] : '-'
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    const branchName = selectedBranchId 
      ? (branches?.find(b => b.id.toString() === selectedBranchId)?.name || 'Cabang').replace(/\s+/g, '_')
      : 'Semua_Cabang';
    
    link.href = url;
    link.setAttribute('download', `Rekap_THR_Pelanggan_${branchName}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs uppercase tracking-wider mb-1">
            <Gift className="w-4 h-4" />
            Program Loyalitas & Acuan THR Pelanggan
          </div>
          <h2 className="text-2xl font-black text-slate-800">Peringkat & Rekap Belanja Pelanggan</h2>
          <p className="text-slate-500 text-sm">
            Lihat akumulasi belanja dan frekuensi pembelian pelanggan setia untuk pembagian THR, bingkisan lebaran, dan reward apotek.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="flex items-center gap-2 text-slate-600 border-slate-200 hover:bg-slate-50"
            onClick={handleExportCSV}
          >
            <Download className="w-4 h-4 text-emerald-600" />
            Ekspor Excel / CSV
          </Button>

          <Button
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white shadow-md"
            onClick={() => setIsPrintModalOpen(true)}
          >
            <Printer className="w-4 h-4" />
            Cetak Rekap THR
          </Button>
        </div>
      </div>

      {/* Top 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Belanja */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Belanja Pelanggan</span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-emerald-600">
            {formatCurrency(loyaltyData?.totalCustomerSpending || 0)}
          </h3>
          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            Dari <b className="text-slate-600">{loyaltyData?.activeCustomers || 0}</b> pelanggan aktif belanja
          </p>
        </div>

        {/* Card 2: Top Spender */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-amber-500 uppercase tracking-wider">Top Spender (Juara 1)</span>
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center">
              <Trophy className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-lg font-black text-slate-800 truncate" title={loyaltyData?.topSpenderName}>
            {loyaltyData?.topSpenderName || '-'}
          </h3>
          <p className="text-xs font-bold text-amber-600 mt-1">
            {loyaltyData?.topSpenderAmount ? formatCurrency(loyaltyData.topSpenderAmount) : 'Rp 0'}
          </p>
        </div>

        {/* Card 3: Paling Sering */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-indigo-500 uppercase tracking-wider">Paling Sering Beli</span>
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-lg font-black text-slate-800 truncate" title={loyaltyData?.mostFrequentCustomerName}>
            {loyaltyData?.mostFrequentCustomerName || '-'}
          </h3>
          <p className="text-xs font-bold text-indigo-600 mt-1 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" />
            {loyaltyData?.mostFrequentCount || 0} kali transaksi
          </p>
        </div>

        {/* Card 4: Rata-rata */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Rata-rata per Pelanggan</span>
            <div className="w-10 h-10 rounded-2xl bg-slate-50 text-slate-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-slate-800">
            {formatCurrency(loyaltyData?.averageSpendingPerCustomer || 0)}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Akumulasi rata-rata per orang
          </p>
        </div>
      </div>

      {/* Main Filter & Leaderboard Container */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        {/* Preset Date Tabs */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-2 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> Periode THR:
            </span>
            <button
              onClick={() => applyDatePreset('1_YEAR')}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-bold transition-all",
                datePreset === '1_YEAR'
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              )}
            >
              1 Tahun Terakhir
            </button>
            <button
              onClick={() => applyDatePreset('THIS_YEAR')}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-bold transition-all",
                datePreset === 'THIS_YEAR'
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              )}
            >
              Tahun Ini (YTD)
            </button>
            <button
              onClick={() => applyDatePreset('6_MONTHS')}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-bold transition-all",
                datePreset === '6_MONTHS'
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              )}
            >
              6 Bulan Terakhir
            </button>
            <button
              onClick={() => applyDatePreset('ALL_TIME')}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-bold transition-all",
                datePreset === 'ALL_TIME'
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              )}
            >
              Semua Waktu
            </button>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-slate-500 cursor-pointer flex items-center gap-2 select-none">
              <input
                type="checkbox"
                checked={includeAll}
                onChange={(e) => { setIncludeAll(e.target.checked); setCurrentPage(1); }}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
              />
              Tampilkan juga yang Rp 0
            </label>
          </div>
        </div>

        {/* Advanced Filters Bar */}
        <div className="p-4 border-b border-slate-100 grid grid-cols-1 md:grid-cols-4 gap-4 bg-white">
          {/* Custom Date Inputs */}
          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setDatePreset('CUSTOM'); setCurrentPage(1); }}
              className="h-10 text-xs rounded-xl"
              title="Tanggal Mulai"
            />
            <span className="text-slate-400 text-xs">s/d</span>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setDatePreset('CUSTOM'); setCurrentPage(1); }}
              className="h-10 text-xs rounded-xl"
              title="Tanggal Selesai"
            />
          </div>

          {/* Branch Filter */}
          <div>
            <select
              value={selectedBranchId}
              onChange={(e) => { setSelectedBranchId(e.target.value); setCurrentPage(1); }}
              className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="">Semua Cabang Apotek</option>
              {branches?.map(b => (
                <option key={b.id} value={b.id.toString()}>{b.name}</option>
              ))}
            </select>
          </div>

          {/* Sort By Filter */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => { setSortBy(e.target.value as any); setCurrentPage(1); }}
              className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="TOTAL_SPENT">Urutkan: Total Belanja Terbanyak (Rp)</option>
              <option value="TRANSACTION_COUNT">Urutkan: Paling Sering Datang (Frekuensi)</option>
            </select>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Cari nama, no WA, atau alamat..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="pl-9 h-10 text-xs rounded-xl"
            />
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                <TableHead className="w-20 text-center pl-6">Peringkat</TableHead>
                <TableHead>Pelanggan</TableHead>
                <TableHead>Kontak & WhatsApp</TableHead>
                <TableHead>Alamat</TableHead>
                <TableHead className="text-center">Frekuensi Beli</TableHead>
                <TableHead className="text-right">Rata-rata / Beli</TableHead>
                <TableHead className="text-right">Total Akumulasi</TableHead>
                <TableHead className="text-center pr-6">Terakhir Beli</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-48 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-7 h-7 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs">Menghitung akumulasi belanja pelanggan...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : currentEntries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-48 text-center text-slate-400">
                    <Gift className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-medium text-slate-600">Belum ada transaksi pelanggan pada kriteria ini</p>
                    <p className="text-xs text-slate-400">Coba ubah rentang tanggal atau pilih "Semua Waktu"</p>
                  </TableCell>
                </TableRow>
              ) : (
                currentEntries.map((customer, idx) => {
                  const globalRank = indexOfFirstEntry + idx + 1;
                  const isTop1 = globalRank === 1;
                  const isTop2 = globalRank === 2;
                  const isTop3 = globalRank === 3;
                  const waLink = getWhatsAppLink(customer.phone, customer.name);

                  return (
                    <motion.tr
                      key={customer.customerId}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.02 }}
                      className={cn(
                        "group border-b border-slate-50 last:border-0 transition-colors",
                        isTop1 ? "bg-amber-50/40 hover:bg-amber-50/70" :
                        isTop2 ? "bg-slate-100/40 hover:bg-slate-100/70" :
                        isTop3 ? "bg-orange-50/30 hover:bg-orange-50/60" :
                        "hover:bg-slate-50/60"
                      )}
                    >
                      {/* Peringkat Badge */}
                      <TableCell className="text-center pl-6">
                        {isTop1 ? (
                          <div className="inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-amber-400 to-yellow-500 text-white rounded-full text-xs font-black shadow-sm">
                            <Trophy className="w-3.5 h-3.5 shrink-0" />
                            #1 Top
                          </div>
                        ) : isTop2 ? (
                          <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-300 text-slate-800 rounded-full text-xs font-bold">
                            🥈 #2
                          </div>
                        ) : isTop3 ? (
                          <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-700/80 text-white rounded-full text-xs font-bold">
                            🥉 #3
                          </div>
                        ) : (
                          <span className="font-bold text-slate-400 text-xs">
                            #{globalRank}
                          </span>
                        )}
                      </TableCell>

                      {/* Nama Pelanggan */}
                      <TableCell>
                        <div className="font-bold text-slate-800 text-sm">
                          {customer.name}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          ID: #{customer.customerId} {customer.active ? '• Aktif' : '• Nonaktif'}
                        </div>
                      </TableCell>

                      {/* Kontak & WhatsApp */}
                      <TableCell>
                        {customer.phone ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-slate-600">{customer.phone}</span>
                            {waLink && (
                              <a
                                href={waLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-colors text-[11px] font-bold"
                                title="Kirim Pesan WhatsApp"
                              >
                                <MessageCircle className="w-3 h-3" />
                                Chat WA
                              </a>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Tanpa nomor</span>
                        )}
                      </TableCell>

                      {/* Alamat */}
                      <TableCell className="max-w-[200px]">
                        <div className="text-xs text-slate-600 truncate" title={customer.address}>
                          {customer.address || '-'}
                        </div>
                      </TableCell>

                      {/* Frekuensi Transaksi */}
                      <TableCell className="text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs">
                          <ShoppingBag className="w-3 h-3 text-slate-400" />
                          {customer.transactionCount}x
                        </span>
                      </TableCell>

                      {/* Rata-rata Belanja */}
                      <TableCell className="text-right font-medium text-slate-600 text-xs">
                        {formatCurrency(customer.averageSpent)}
                      </TableCell>

                      {/* Total Akumulasi Belanja */}
                      <TableCell className="text-right">
                        <div className="font-black text-sm text-emerald-600">
                          {formatCurrency(customer.totalSpent)}
                        </div>
                      </TableCell>

                      {/* Tanggal Belanja Terakhir */}
                      <TableCell className="text-center pr-6">
                        <span className="text-xs text-slate-500 font-medium">
                          {customer.lastPurchaseDate 
                            ? customer.lastPurchaseDate.split('T')[0] 
                            : '-'}
                        </span>
                      </TableCell>
                    </motion.tr>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalEntries={totalEntries}
              indexOfFirstEntry={indexOfFirstEntry}
              indexOfLastEntry={indexOfLastEntry}
              label="Pelanggan"
            />
          </div>
        )}
      </div>

      {/* Print Preview Modal */}
      <Dialog
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        title="Cetak Rekap THR & Bingkisan Pelanggan"
        size="lg"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <Button variant="outline" onClick={() => setIsPrintModalOpen(false)}>
              Tutup
            </Button>
            <Button 
              className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2"
              onClick={() => {
                const printWindow = window.open('', '_blank');
                if (!printWindow) return;
                const printable = document.getElementById('printable-thr-report')?.innerHTML;
                
                printWindow.document.write(`
                  <html>
                    <head>
                      <title>Rekap THR Pelanggan - G-Apotek</title>
                      <style>
                        @page { size: A4 portrait; margin: 15mm; }
                        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 11px; color: #1e293b; margin: 0; padding: 0; }
                        h1 { font-size: 18px; margin: 0 0 4px 0; text-transform: uppercase; }
                        p { margin: 2px 0; color: #64748b; }
                        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
                        th { background-color: #f1f5f9; border: 1px solid #cbd5e1; padding: 7px 8px; text-align: left; font-size: 10px; font-weight: bold; text-transform: uppercase; }
                        td { border: 1px solid #cbd5e1; padding: 6px 8px; font-size: 10.5px; }
                        .text-center { text-align: center; }
                        .text-right { text-align: right; }
                        .font-bold { font-weight: bold; }
                        .signature-box { margin-top: 35px; display: flex; justify-content: space-between; }
                        .signature { width: 200px; text-align: center; }
                        .signature-line { margin-top: 60px; border-bottom: 1px solid #000; }
                      </style>
                    </head>
                    <body>
                      ${printable}
                      <script>
                        window.onload = function() {
                          window.print();
                          setTimeout(function() { window.close(); }, 500);
                        }
                      </script>
                    </body>
                  </html>
                `);
                printWindow.document.close();
              }}
            >
              <Printer className="w-4 h-4" />
              Cetak Sekarang
            </Button>
          </div>
        }
      >
        <div id="printable-thr-report" className="space-y-4 font-sans text-slate-800 p-2 max-h-[65vh] overflow-y-auto">
          {/* Header Report */}
          <div className="border-b-2 border-slate-800 pb-3 text-center">
            <h1 className="text-xl font-black uppercase text-slate-900 tracking-wide">
              DAFTAR PERINGKAT & AKUMULASI BELANJA PELANGGAN
            </h1>
            <p className="text-xs font-semibold text-slate-600">
              ACUAN ALOKASI BINGKISAN / THR PELANGGAN SETIA
            </p>
            <div className="flex justify-between text-[11px] text-slate-500 mt-2 font-medium">
              <span>Cabang: <b>{selectedBranchId ? branches?.find(b => b.id.toString() === selectedBranchId)?.name : 'Semua Cabang'}</b></span>
              <span>Periode: <b>{startDate || 'Awal'} s/d {endDate || 'Sekarang'}</b></span>
              <span>Dicetak: <b>{new Date().toLocaleDateString('id-ID')}</b></span>
            </div>
          </div>

          {/* Table */}
          <table className="w-full text-xs border border-slate-300">
            <thead>
              <tr className="bg-slate-100">
                <th className="border p-2 text-center w-12">No</th>
                <th className="border p-2">Nama Pelanggan</th>
                <th className="border p-2">No. Telepon / WA</th>
                <th className="border p-2">Alamat</th>
                <th className="border p-2 text-center">Frekuensi</th>
                <th className="border p-2 text-right">Total Belanja (Rp)</th>
                <th className="border p-2 text-center w-28">Paraf / Tanda Terima</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((c, index) => (
                <tr key={c.customerId} className={index < 3 ? "bg-amber-50/50 font-semibold" : ""}>
                  <td className="border p-2 text-center">{index + 1}</td>
                  <td className="border p-2 font-bold">{c.name}</td>
                  <td className="border p-2 font-mono">{c.phone || '-'}</td>
                  <td className="border p-2">{c.address || '-'}</td>
                  <td className="border p-2 text-center">{c.transactionCount}x</td>
                  <td className="border p-2 text-right font-bold text-slate-900">
                    Rp {Math.round(c.totalSpent).toLocaleString('id-ID')}
                  </td>
                  <td className="border p-2 text-center"></td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Signature */}
          <div className="pt-6 flex justify-between text-xs">
            <div className="text-center w-48">
              <p>Disiapkan Oleh,</p>
              <div className="h-16" />
              <p className="border-t border-slate-400 font-bold pt-1">Admin / Staf Apotek</p>
            </div>
            <div className="text-center w-48">
              <p>Mengetahui & Menyetujui,</p>
              <div className="h-16" />
              <p className="border-t border-slate-400 font-bold pt-1">Apoteker / Pemilik (Owner)</p>
            </div>
          </div>
        </div>
      </Dialog>
    </div>
  );
};
