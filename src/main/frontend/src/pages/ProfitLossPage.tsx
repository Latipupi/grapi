import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/api';
import { Card } from '../components/ui/Card';
import { Skeleton } from '../components/ui/Skeleton';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Pagination } from '../components/ui/Pagination';
import { TrendingUp, TrendingDown, ShoppingCart, Percent, Calendar, Filter, AlertCircle, Search } from 'lucide-react';
import { Input } from '../components/ui/Input';

interface ItemBreakdown {
  productName: string;
  sku: string;
  quantitySold: number;
  totalRevenue: number;
  totalCost: number;
  grossProfit: number;
}

interface DebtBreakdown {
  id: number;
  invoiceNumber: string;
  supplierName: string;
  branchName: string;
  purchaseDate?: string;
  dueDate?: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: string;
  notes?: string;
}

interface ProfitLossData {
  grossSales?: number;
  totalRefunds?: number;
  totalRevenue: number;
  costOfGoodsSold: number;
  grossProfit: number;
  totalExpenses: number;
  totalPayableDebt?: number;
  totalDeductions?: number;
  netProfit: number;
  expenses: { id?: number; expenseDate?: string; category: string; expenseType?: string; amount: number; notes: string; branch?: { name: string } }[];
  debtsBreakdown?: DebtBreakdown[];
  itemsBreakdown?: ItemBreakdown[];
}

interface Branch {
  id: number;
  name: string;
}

const ProfitLossPage: React.FC = () => {
  const [branchId, setBranchId] = useState<string>('');
  const [startDate, setStartDate] = useState<string>(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const [detailTab, setDetailTab] = useState<'gross' | 'net'>('gross');
  const [itemSearch, setItemSearch] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const [itemPage, setItemPage] = useState(1);
  const entriesPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
    setItemPage(1);
  }, [branchId, startDate, endDate, itemSearch]);

  const { data: branches } = useQuery<Branch[]>({
    queryKey: ['branches'],
    queryFn: async () => {
      const res = await api.get('/branches');
      return res.data;
    },
  });

  const { data: report, isLoading } = useQuery<ProfitLossData>({
    queryKey: ['report', 'finance', 'profit-loss', branchId, startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (branchId) params.append('branchId', branchId);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      const res = await api.get(`/finance/profit-loss?${params.toString()}`);
      return res.data;
    },
    enabled: !!startDate && !!endDate
  });

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Math.round(val || 0));
  };

  const filteredItems = (report?.itemsBreakdown || []).filter(it =>
    !itemSearch ||
    it.productName?.toLowerCase().includes(itemSearch.toLowerCase()) ||
    it.sku?.toLowerCase().includes(itemSearch.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Laporan Laba Rugi</h1>
          <p className="text-slate-500 text-sm">
            Analisis transparan Profit Kotor (Pendapatan - Modal HPP) dan Profit Bersih (dikurangi Biaya Operasional & Sisa Hutang Supplier).
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 px-3 border-r border-slate-100">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              className="h-9 bg-transparent text-sm focus:outline-none focus:ring-0"
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
            >
              <option value="">Semua Cabang</option>
              {branches?.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center gap-2 px-3">
            <Calendar className="w-4 h-4 text-emerald-500" />
            <Input 
              type="date" 
              className="h-8 border-none p-0 text-sm focus-visible:ring-0 w-32 bg-transparent" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <span className="text-slate-300">-</span>
            <Input 
              type="date" 
              className="h-8 border-none p-0 text-sm focus-visible:ring-0 w-32 bg-transparent" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <Card key={i} className="p-6 border-none shadow-sm bg-white space-y-3">
                <div className="flex justify-between items-center">
                  <Skeleton className="h-4 w-24 rounded" />
                  <Skeleton className="w-5 h-5 rounded" />
                </div>
                <Skeleton className="h-8 w-32 rounded" />
                <Skeleton className="h-3 w-16 rounded" />
              </Card>
            ))}
          </div>
        </>
      ) : report ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="p-6 border-none shadow-sm bg-gradient-to-br from-emerald-600 to-emerald-700 text-white relative overflow-hidden group">
               <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all duration-500" />
               <div className="relative z-10 space-y-2">
                 <div className="flex items-center justify-between">
                   <p className="text-emerald-100 text-xs font-bold uppercase tracking-wider">Pendapatan Bersih</p>
                   <ShoppingCart className="w-5 h-5 text-emerald-200" />
                 </div>
                 <h2 className="text-2xl font-black">{formatCurrency(report.totalRevenue)}</h2>
                 <p className="text-emerald-200 text-[10px]">Penjualan dikurangi Retur</p>
               </div>
            </Card>

            <Card
              onClick={() => setDetailTab('gross')}
              className={`p-6 shadow-sm bg-white group cursor-pointer transition-all border-2 ${
                detailTab === 'gross' ? 'border-emerald-500 ring-2 ring-emerald-500/10' : 'border-transparent hover:border-emerald-200'
              }`}
            >
               <div className="space-y-2">
                 <div className="flex items-center justify-between">
                   <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Profit Kotor (Laba Kotor)</p>
                   <div className="p-2 bg-emerald-50 rounded-lg group-hover:bg-emerald-100 transition-colors">
                     <TrendingUp className="w-4 h-4 text-emerald-500" />
                   </div>
                 </div>
                 <h2 className="text-2xl font-black text-emerald-600">{formatCurrency(report.grossProfit)}</h2>
                 <div className="flex items-center justify-between text-[11px]">
                   <span className="text-rose-500 font-semibold">HPP: -{formatCurrency(report.costOfGoodsSold)}</span>
                   <span className="text-emerald-600 font-bold underline">Lihat Rincian HPP →</span>
                 </div>
               </div>
            </Card>

            <Card
              onClick={() => setDetailTab('net')}
              className={`p-6 shadow-sm bg-white group cursor-pointer transition-all border-2 ${
                detailTab === 'net' ? 'border-rose-500 ring-2 ring-rose-500/10' : 'border-transparent hover:border-rose-200'
              }`}
            >
               <div className="space-y-2">
                 <div className="flex items-center justify-between">
                   <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total Pengurangan</p>
                   <div className="p-2 bg-rose-50 rounded-lg group-hover:bg-rose-100 transition-colors">
                     <TrendingDown className="w-4 h-4 text-rose-500" />
                   </div>
                 </div>
                 <h2 className="text-2xl font-black text-rose-600">
                   -{formatCurrency(report.totalDeductions ?? ((report.totalExpenses || 0) + (report.totalPayableDebt || 0)))}
                 </h2>
                 <div className="flex items-center justify-between text-[11px]">
                   <span className="text-slate-500 truncate">
                     Biaya: {formatCurrency(report.totalExpenses)} | Hutang: {formatCurrency(report.totalPayableDebt || 0)}
                   </span>
                   <span className="text-rose-600 font-bold underline shrink-0 ml-1">Rincian →</span>
                 </div>
               </div>
            </Card>

            <Card
              onClick={() => setDetailTab('net')}
              className="p-6 border-none shadow-sm bg-slate-900 text-white relative overflow-hidden group cursor-pointer hover:ring-2 hover:ring-emerald-400/50 transition-all"
            >
               <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-all duration-500" />
               <div className="relative z-10 space-y-2">
                 <div className="flex items-center justify-between">
                   <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Profit Bersih (Laba Bersih)</p>
                   <div className="p-2 bg-slate-800 rounded-lg group-hover:bg-slate-700 transition-colors">
                     <Percent className="w-4 h-4 text-white" />
                   </div>
                 </div>
                 <h2 className={`text-2xl font-black ${report.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                   {formatCurrency(report.netProfit)}
                 </h2>
                 <p className="text-emerald-300 text-[11px] font-semibold">Profit Kotor - Biaya Ops - Hutang Supplier →</p>
               </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Step-by-step P&L Formula */}
            <Card className="overflow-hidden border-none shadow-sm bg-white lg:col-span-1">
              <div className="p-6 border-b border-slate-50">
                <h3 className="font-bold text-slate-800">Alur Hitungan Laba Rugi</h3>
                <p className="text-xs text-slate-400 mt-0.5">Klik baris untuk melihat rincian di sebelah kanan</p>
              </div>
              <div className="p-0">
                <Table>
                  <TableHeader className="bg-slate-50/50">
                    <TableRow>
                      <TableHead>Komponen</TableHead>
                      <TableHead className="text-right">Nilai</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow className="cursor-pointer hover:bg-slate-50" onClick={() => setDetailTab('gross')}>
                      <TableCell className="font-medium text-slate-700">1. Pendapatan Penjualan Bersih</TableCell>
                      <TableCell className="text-right font-bold text-slate-900">{formatCurrency(report.totalRevenue)}</TableCell>
                    </TableRow>
                    <TableRow className="cursor-pointer hover:bg-rose-50/40" onClick={() => setDetailTab('gross')}>
                      <TableCell className="font-medium text-rose-600">
                        2. Dikurangi: Modal Obat (HPP)
                        <span className="block text-[10px] text-slate-400">Klik untuk rincian HPP per obat</span>
                      </TableCell>
                      <TableCell className="text-right font-bold text-rose-600">- {formatCurrency(report.costOfGoodsSold)}</TableCell>
                    </TableRow>
                    <TableRow className="bg-emerald-50/60 cursor-pointer" onClick={() => setDetailTab('gross')}>
                      <TableCell className="font-black text-emerald-800 pl-6">= PROFIT KOTOR (LABA KOTOR)</TableCell>
                      <TableCell className="text-right font-black text-emerald-700">{formatCurrency(report.grossProfit)}</TableCell>
                    </TableRow>
                    <TableRow className="cursor-pointer hover:bg-rose-50/40" onClick={() => setDetailTab('net')}>
                      <TableCell className="font-medium text-rose-600">
                        3. Dikurangi: Biaya Operasional
                        <span className="block text-[10px] text-slate-400">Klik untuk rincian pengeluaran</span>
                      </TableCell>
                      <TableCell className="text-right font-bold text-rose-600">- {formatCurrency(report.totalExpenses)}</TableCell>
                    </TableRow>
                    <TableRow className="cursor-pointer hover:bg-amber-50/40" onClick={() => setDetailTab('net')}>
                      <TableCell className="font-medium text-amber-700">
                        4. Dikurangi: Sisa Hutang Supplier
                        <span className="block text-[10px] text-slate-400">Hutang pembelian obat belum lunas</span>
                      </TableCell>
                      <TableCell className="text-right font-bold text-amber-700">- {formatCurrency(report.totalPayableDebt || 0)}</TableCell>
                    </TableRow>
                    <TableRow className="bg-slate-900 cursor-pointer" onClick={() => setDetailTab('net')}>
                      <TableCell className="font-black text-white pl-6">= PROFIT BERSIH (LABA BERSIH)</TableCell>
                      <TableCell className={`text-right font-black ${report.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {formatCurrency(report.netProfit)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </Card>

            {/* Right: Interactive Breakdown Panel */}
            <Card className="overflow-hidden border-none shadow-sm bg-white lg:col-span-2">
              <div className="p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setDetailTab('gross')}
                    className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                      detailTab === 'gross'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Kenapa Profit Kotor Sekian? (Rincian HPP Obat)
                  </button>
                  <button
                    type="button"
                    onClick={() => setDetailTab('net')}
                    className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                      detailTab === 'net'
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Rincian Pengurangan Biaya & Hutang Supplier
                  </button>
                </div>

                {detailTab === 'gross' && (
                  <div className="relative w-full sm:w-56">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input
                      placeholder="Cari obat..."
                      value={itemSearch}
                      onChange={(e) => setItemSearch(e.target.value)}
                      className="pl-8 h-8 text-xs"
                    />
                  </div>
                )}
              </div>

              {detailTab === 'gross' ? (
                <div className="p-0">
                  <Table>
                    <TableHeader className="bg-slate-50/50">
                      <TableRow>
                        <TableHead>Nama Obat / Produk</TableHead>
                        <TableHead className="text-center">Qty Terjual</TableHead>
                        <TableHead className="text-right">Total Penjualan</TableHead>
                        <TableHead className="text-right">Modal (HPP)</TableHead>
                        <TableHead className="text-right">Profit Kotor</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredItems.length > 0 ? (
                        (() => {
                          const idxLast = itemPage * entriesPerPage;
                          const idxFirst = idxLast - entriesPerPage;
                          const currentItems = filteredItems.slice(idxFirst, idxLast);
                          return currentItems.map((it, idx) => (
                            <TableRow key={idx}>
                              <TableCell>
                                <p className="font-bold text-slate-800">{it.productName}</p>
                                <p className="text-[10px] font-mono text-slate-400">{it.sku}</p>
                              </TableCell>
                              <TableCell className="text-center font-bold text-slate-600">
                                {Number(it.quantitySold || 0).toLocaleString('id-ID')}
                              </TableCell>
                              <TableCell className="text-right font-semibold text-slate-800">
                                {formatCurrency(it.totalRevenue)}
                              </TableCell>
                              <TableCell className="text-right font-semibold text-rose-500">
                                -{formatCurrency(it.totalCost)}
                              </TableCell>
                              <TableCell className="text-right font-black text-emerald-600">
                                {formatCurrency(it.grossProfit)}
                              </TableCell>
                            </TableRow>
                          ));
                        })()
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-6 text-slate-400 text-sm">
                            Tidak ada data penjualan produk pada periode ini.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                  {filteredItems.length > entriesPerPage && (
                    <Pagination
                      currentPage={itemPage}
                      totalPages={Math.ceil(filteredItems.length / entriesPerPage)}
                      onPageChange={setItemPage}
                      totalEntries={filteredItems.length}
                      indexOfFirstEntry={(itemPage - 1) * entriesPerPage}
                      indexOfLastEntry={itemPage * entriesPerPage}
                      label="Produk"
                    />
                  )}
                </div>
              ) : (
                <div className="p-4 space-y-6">
                  {/* Section A: Unpaid Supplier Debts */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between px-2">
                      <div>
                        <h4 className="text-xs font-extrabold uppercase tracking-wider text-amber-800">
                          A. Sisa Hutang Pembelian ke Supplier (Belum Lunas)
                        </h4>
                        <p className="text-[11px] text-slate-400">Faktur pembelian obat tempo (`HUTANG_PEMBELIAN`) yang belum lunas</p>
                      </div>
                      <span className="text-xs font-black text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                        -{formatCurrency(report.totalPayableDebt || 0)}
                      </span>
                    </div>
                    <div className="border border-slate-100 rounded-2xl overflow-hidden">
                      <Table>
                        <TableHeader className="bg-slate-50/50">
                          <TableRow>
                            <TableHead>No. Faktur</TableHead>
                            <TableHead>Supplier</TableHead>
                            <TableHead>Jatuh Tempo</TableHead>
                            <TableHead className="text-right">Total Faktur</TableHead>
                            <TableHead className="text-right">Terbayar</TableHead>
                            <TableHead className="text-right">Sisa Hutang (Pengurang)</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {report.debtsBreakdown && report.debtsBreakdown.length > 0 ? (
                            report.debtsBreakdown.map((d, idx) => (
                              <TableRow key={d.id || idx}>
                                <TableCell className="font-mono font-bold text-slate-800 text-xs">{d.invoiceNumber}</TableCell>
                                <TableCell className="font-bold text-slate-700 text-xs">{d.supplierName}</TableCell>
                                <TableCell className="text-slate-500 text-xs">{d.dueDate || '-'}</TableCell>
                                <TableCell className="text-right text-slate-700 text-xs">{formatCurrency(d.totalAmount)}</TableCell>
                                <TableCell className="text-right text-emerald-600 text-xs">{formatCurrency(d.paidAmount)}</TableCell>
                                <TableCell className="text-right font-black text-amber-700 text-xs">-{formatCurrency(d.remainingAmount)}</TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center py-4 text-slate-400 text-xs">
                                Tidak ada sisa hutang pembelian ke supplier yang belum lunas (Rp 0).
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  {/* Section B: Operational Expenses */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between px-2">
                      <div>
                        <h4 className="text-xs font-extrabold uppercase tracking-wider text-rose-800">
                          B. Pengurangan Biaya Operasional
                        </h4>
                        <p className="text-[11px] text-slate-400">Gaji, listrik, sewa, dan pengeluaran operasional cabang</p>
                      </div>
                      <span className="text-xs font-black text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
                        -{formatCurrency(report.totalExpenses || 0)}
                      </span>
                    </div>
                    <div className="border border-slate-100 rounded-2xl overflow-hidden">
                      <Table>
                        <TableHeader className="bg-slate-50/50">
                          <TableRow>
                            <TableHead>Tanggal</TableHead>
                            <TableHead>Kategori</TableHead>
                            <TableHead>Keterangan</TableHead>
                            <TableHead className="text-right">Nominal Pengurang</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {report.expenses && report.expenses.length > 0 ? (
                            (() => {
                              const indexOfLastEntry = currentPage * entriesPerPage;
                              const indexOfFirstEntry = indexOfLastEntry - entriesPerPage;
                              const currentEntries = report.expenses.slice(indexOfFirstEntry, indexOfLastEntry);
                              return currentEntries.map((expense, idx) => (
                                <TableRow key={idx}>
                                  <TableCell className="text-slate-500 text-xs">
                                    {expense.expenseDate ? new Date(expense.expenseDate).toLocaleDateString('id-ID') : '-'}
                                  </TableCell>
                                  <TableCell className="font-bold text-slate-700 text-xs">{expense.category}</TableCell>
                                  <TableCell className="text-slate-500 text-xs">{expense.notes || '-'}</TableCell>
                                  <TableCell className="text-right font-bold text-rose-600 text-xs">-{formatCurrency(expense.amount)}</TableCell>
                                </TableRow>
                              ));
                            })()
                          ) : (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center py-4 text-slate-400 text-xs">
                                Tidak ada pengeluaran biaya operasional pada periode ini (Rp 0).
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                      {report.expenses && report.expenses.length > entriesPerPage && (
                        <Pagination
                          currentPage={currentPage}
                          totalPages={Math.ceil(report.expenses.length / entriesPerPage)}
                          onPageChange={setCurrentPage}
                          totalEntries={report.expenses.length}
                          indexOfFirstEntry={(currentPage - 1) * entriesPerPage}
                          indexOfLastEntry={currentPage * entriesPerPage}
                          label="Biaya"
                        />
                      )}
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </>
      ) : (
        <div className="h-64 flex flex-col items-center justify-center bg-white rounded-3xl border border-dashed border-slate-200">
           <AlertCircle className="w-8 h-8 text-slate-300 mb-2" />
           <p className="text-slate-400">Gagal memuat data laporan.</p>
        </div>
      )}
    </div>
  );
};

export default ProfitLossPage;
