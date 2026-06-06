import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/api';
import { Card } from '../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Pagination } from '../components/ui/Pagination';
import { TrendingUp, TrendingDown, ShoppingCart, Percent, Calendar, Filter, AlertCircle } from 'lucide-react';
import { Input } from '../components/ui/Input';

interface ProfitLossData {
  totalRevenue: number;
  costOfGoodsSold: number;
  grossProfit: number;
  totalExpenses: number;
  netProfit: number;
  expenses: { category: string, amount: number, notes: string }[];
}

interface Branch {
  id: number;
  name: string;
}

const ProfitLossPage: React.FC = () => {
  const [branchId, setBranchId] = useState<string>('');
  const [startDate, setStartDate] = useState<string>(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const [currentPage, setCurrentPage] = useState(1);
  const entriesPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [branchId, startDate, endDate]);

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
      // Default to branch 1 if no branch selected for finance report to avoid errors if required
      if (!branchId && branches?.length) params.append('branchId', branches[0].id.toString());
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      const res = await api.get(`/finance/profit-loss?${params.toString()}`);
      return res.data;
    },
    enabled: !!startDate && !!endDate && (!!branchId || (!!branches && branches.length > 0))
  });

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val || 0);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Laporan Laba Rugi</h1>
          <p className="text-slate-500 text-sm">Analisis pendapatan, beban HPP, dan biaya operasional.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 px-3 border-r border-slate-100">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              className="h-9 bg-transparent text-sm focus:outline-none focus:ring-0"
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
            >
              {branches?.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center gap-2 px-3 border-r border-slate-100">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1,2,3,4].map(i => (
            <Card key={i} className="h-32 animate-pulse bg-slate-50 border-none" />
          ))}
        </div>
      ) : report ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="p-6 border-none shadow-sm bg-gradient-to-br from-emerald-600 to-emerald-700 text-white relative overflow-hidden group">
               <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all duration-500" />
               <div className="relative z-10 space-y-2">
                 <div className="flex items-center justify-between">
                   <p className="text-emerald-100 text-xs font-bold uppercase tracking-wider">Pendapatan Jual</p>
                   <ShoppingCart className="w-5 h-5 text-emerald-200" />
                 </div>
                 <h2 className="text-2xl font-black">{formatCurrency(report.totalRevenue)}</h2>
                 <p className="text-emerald-200 text-[10px]">Total Revenue</p>
               </div>
            </Card>

            <Card className="p-6 border-none shadow-sm bg-white group">
               <div className="space-y-2">
                 <div className="flex items-center justify-between">
                   <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Laba Kotor</p>
                   <div className="p-2 bg-emerald-50 rounded-lg group-hover:bg-emerald-100 transition-colors">
                     <TrendingUp className="w-4 h-4 text-emerald-500" />
                   </div>
                 </div>
                 <h2 className="text-2xl font-black text-emerald-600">{formatCurrency(report.grossProfit)}</h2>
                 <p className="text-emerald-500/70 text-[10px]">Gross Profit (Penjualan - HPP)</p>
               </div>
            </Card>

            <Card className="p-6 border-none shadow-sm bg-white group">
               <div className="space-y-2">
                 <div className="flex items-center justify-between">
                   <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Biaya Operasional</p>
                   <div className="p-2 bg-rose-50 rounded-lg group-hover:bg-rose-100 transition-colors">
                     <TrendingDown className="w-4 h-4 text-rose-500" />
                   </div>
                 </div>
                 <h2 className="text-2xl font-black text-rose-600">{formatCurrency(report.totalExpenses)}</h2>
                 <p className="text-rose-500/70 text-[10px]">Total Operating Expenses</p>
               </div>
            </Card>

            <Card className="p-6 border-none shadow-sm bg-slate-900 text-white relative overflow-hidden group border border-slate-800">
               <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-all duration-500" />
               <div className="relative z-10 space-y-2">
                 <div className="flex items-center justify-between">
                   <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Laba Bersih</p>
                   <div className="p-2 bg-slate-800 rounded-lg group-hover:bg-slate-700 transition-colors">
                     <Percent className="w-4 h-4 text-white" />
                   </div>
                 </div>
                 <h2 className={`text-2xl font-black ${report.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                   {formatCurrency(report.netProfit)}
                 </h2>
                 <p className="text-slate-400 text-[10px]">Net Profit (Bottom Line)</p>
               </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="overflow-hidden border-none shadow-sm bg-white">
              <div className="p-6 border-b border-slate-50">
                <h3 className="font-bold text-slate-800">Ringkasan P&L</h3>
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
                    <TableRow>
                      <TableCell className="font-medium text-slate-700">1. Pendapatan Penjualan (Revenue)</TableCell>
                      <TableCell className="text-right font-bold text-slate-900">{formatCurrency(report.totalRevenue)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium text-slate-700">2. Harga Pokok Penjualan (HPP / COGS)</TableCell>
                      <TableCell className="text-right font-bold text-rose-600">- {formatCurrency(report.costOfGoodsSold)}</TableCell>
                    </TableRow>
                    <TableRow className="bg-slate-50/50">
                      <TableCell className="font-bold text-slate-800 pl-8">Laba Kotor (Gross Profit)</TableCell>
                      <TableCell className="text-right font-bold text-slate-900">{formatCurrency(report.grossProfit)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium text-slate-700">3. Biaya Operasional (Expenses)</TableCell>
                      <TableCell className="text-right font-bold text-rose-600">- {formatCurrency(report.totalExpenses)}</TableCell>
                    </TableRow>
                    <TableRow className="bg-slate-900">
                      <TableCell className="font-bold text-white pl-8">LABA BERSIH (NET PROFIT)</TableCell>
                      <TableCell className={`text-right font-black ${report.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {formatCurrency(report.netProfit)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </Card>

            <Card className="overflow-hidden border-none shadow-sm bg-white">
              <div className="p-6 border-b border-slate-50">
                <h3 className="font-bold text-slate-800">Rincian Biaya Operasional</h3>
              </div>
              <div className="p-0">
                <Table>
                  <TableHeader className="bg-slate-50/50">
                    <TableRow>
                      <TableHead>Kategori</TableHead>
                      <TableHead>Keterangan</TableHead>
                      <TableHead className="text-right">Nominal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.expenses && report.expenses.length > 0 ? (
                      (() => {
                        const indexOfLastEntry = currentPage * entriesPerPage;
                        const indexOfFirstEntry = indexOfLastEntry - entriesPerPage;
                        const currentEntries = report.expenses.slice(indexOfFirstEntry, indexOfLastEntry);
                        return (
                          <>
                            {currentEntries.map((expense, idx) => (
                              <TableRow key={idx}>
                                <TableCell className="font-medium text-slate-700">{expense.category}</TableCell>
                                <TableCell className="text-slate-500 text-sm">{expense.notes || '-'}</TableCell>
                                <TableCell className="text-right text-rose-600">{formatCurrency(expense.amount)}</TableCell>
                              </TableRow>
                            ))}
                          </>
                        );
                      })()
                    ) : (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-4 text-slate-400 text-sm">Tidak ada pengeluaran pada periode ini.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
                {report.expenses && report.expenses.length > 0 && (
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
