import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/api';
import { Card } from '../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { TrendingUp, TrendingDown, ShoppingCart, Percent, Calendar, Filter, AlertCircle } from 'lucide-react';
import { Input } from '../components/ui/Input';

interface ProfitLossData {
  totalSales: number;
  totalCost: number;
  grossProfit: number;
  marginPercentage: number;
  transactionCount: number;
}

interface Branch {
  id: number;
  name: string;
}

const ProfitLossPage: React.FC = () => {
  const [branchId, setBranchId] = useState<string>('');
  const [startDate, setStartDate] = useState<string>(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const { data: branches } = useQuery<Branch[]>({
    queryKey: ['branches'],
    queryFn: async () => {
      const res = await api.get('/branches');
      return res.data;
    },
  });

  const { data: report, isLoading } = useQuery<ProfitLossData>({
    queryKey: ['report', 'profit-loss', branchId, startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (branchId) params.append('branchId', branchId);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      const res = await api.get(`/reports/profit-loss?${params.toString()}`);
      return res.data;
    },
  });

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Laporan Laba Rugi</h1>
          <p className="text-slate-500 text-sm">Analisis keuntungan dan margin penjualan.</p>
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
                   <p className="text-emerald-100 text-xs font-bold uppercase tracking-wider">Total Penjualan</p>
                   <ShoppingCart className="w-5 h-5 text-emerald-200" />
                 </div>
                 <h2 className="text-2xl font-black">{formatCurrency(report.totalSales)}</h2>
                 <p className="text-emerald-200 text-[10px]">{report.transactionCount} Transaksi</p>
               </div>
            </Card>

            <Card className="p-6 border-none shadow-sm bg-white group">
               <div className="space-y-2">
                 <div className="flex items-center justify-between">
                   <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total Beban (HPP)</p>
                   <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-slate-100 transition-colors">
                     <TrendingDown className="w-4 h-4 text-slate-400" />
                   </div>
                 </div>
                 <h2 className="text-2xl font-black text-slate-800">{formatCurrency(report.totalCost)}</h2>
                 <p className="text-slate-400 text-[10px]">Harga Pokok Penjualan</p>
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
                 <p className="text-emerald-500/70 text-[10px]">Net Profit from Sales</p>
               </div>
            </Card>

            <Card className="p-6 border-none shadow-sm bg-white group border border-slate-100">
               <div className="space-y-2">
                 <div className="flex items-center justify-between">
                   <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Margin Laba</p>
                   <div className="p-2 bg-emerald-50 rounded-lg group-hover:bg-emerald-100 transition-colors">
                     <Percent className="w-4 h-4 text-emerald-500" />
                   </div>
                 </div>
                 <h2 className="text-2xl font-black text-emerald-600">{report.marginPercentage.toFixed(2)}%</h2>
                 <p className="text-emerald-500/70 text-[10px]">Average Profit Margin</p>
               </div>
            </Card>
          </div>

          <Card className="overflow-hidden border-none shadow-sm bg-white">
            <div className="p-6 border-b border-slate-50">
              <h3 className="font-bold text-slate-800">Ringkasan Performa</h3>
            </div>
            <div className="p-0">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow>
                    <TableHead>Metrik</TableHead>
                    <TableHead className="text-right">Nilai</TableHead>
                    <TableHead>Keterangan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium text-slate-700">Revenue (Pendapatan)</TableCell>
                    <TableCell className="text-right font-bold text-slate-900">{formatCurrency(report.totalSales)}</TableCell>
                    <TableCell className="text-xs text-slate-500">Total uang masuk dari penjualan produk.</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium text-slate-700">COGS (HPP)</TableCell>
                    <TableCell className="text-right font-bold text-rose-600">{formatCurrency(report.totalCost)}</TableCell>
                    <TableCell className="text-xs text-slate-500">Total modal/harga beli barang yang terjual.</TableCell>
                  </TableRow>
                  <TableRow className="bg-emerald-50/30">
                    <TableCell className="font-bold text-emerald-700">Gross Profit</TableCell>
                    <TableCell className="text-right font-black text-emerald-600">{formatCurrency(report.grossProfit)}</TableCell>
                    <TableCell className="text-xs text-emerald-600/70">Keuntungan kotor sebelum beban operasional.</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </Card>
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
