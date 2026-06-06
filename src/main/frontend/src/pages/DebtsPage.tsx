import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Dialog } from '../components/ui/Dialog';
import { 
  Search, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  DollarSign, 
  Printer, 
  FileText,
  Building
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const DebtsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'payable' | 'receivable'>('receivable'); // default showing Piutang
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [branchFilter, setBranchFilter] = useState('');

  // Payment modal state
  const [selectedDebt, setSelectedDebt] = useState<any>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [paymentNotes, setPaymentNotes] = useState('');

  // Print receipt state
  const [printPayment, setPrintPayment] = useState<any>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage] = useState(10);

  // Queries
  const { data: debts, isLoading } = useQuery<any[]>({
    queryKey: ['debts'],
    queryFn: () => api.get('/debts').then(res => res.data)
  });

  const { data: branches } = useQuery<any[]>({
    queryKey: ['branches'],
    queryFn: () => api.get('/branches').then(res => res.data)
  });

  const { data: paymentsHistory } = useQuery<any[]>({
    queryKey: ['debt-payments', selectedDebt?.id],
    queryFn: () => api.get(`/debts/${selectedDebt?.id}/payments`).then(res => res.data),
    enabled: !!selectedDebt
  });

  // Mutation
  const paymentMutation = useMutation({
    mutationFn: (data: { debtId: number; amount: number; paymentMethod: string; notes: string }) => {
      return api.post(`/debts/${data.debtId}/payments`, {
        amount: data.amount,
        paymentMethod: data.paymentMethod,
        notes: data.notes
      });
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['debts'] });
      queryClient.invalidateQueries({ queryKey: ['debt-payments', selectedDebt?.id] });
      setPrintPayment(res.data); // Open print layout
      setPaymentAmount('');
      setPaymentNotes('');
    },
    onError: (err: any) => {
      alert(err.response?.data || 'Gagal merekam pelunasan');
    }
  });

  // Calculations
  const allDebts = debts || [];
  
  // Filter active type
  const targetType = activeTab === 'receivable' ? 'HUTANG_PENJUALAN' : 'HUTANG_PEMBELIAN';
  let filtered = allDebts.filter(d => d.type === targetType).sort((a, b) => b.id - a.id);

  // Search filter
  if (searchTerm) {
    const search = searchTerm.toLowerCase();
    filtered = filtered.filter(d => {
      const partnerName = d.type === 'HUTANG_PENJUALAN' 
        ? d.sale?.customer?.name?.toLowerCase() || 'umum' 
        : d.purchase?.supplier?.name?.toLowerCase() || '';
      
      const invoiceNum = d.type === 'HUTANG_PENJUALAN'
        ? `sal-${d.sale?.id}`.toLowerCase()
        : d.purchase?.invoiceNumber?.toLowerCase() || '';

      const notes = d.notes?.toLowerCase() || '';

      return partnerName.includes(search) || invoiceNum.includes(search) || notes.includes(search);
    });
  }

  // Status Filter
  if (statusFilter) {
    filtered = filtered.filter(d => d.status === statusFilter);
  }

  // Branch Filter
  if (branchFilter) {
    filtered = filtered.filter(d => d.branch?.id?.toString() === branchFilter);
  }

  // Overview calculations
  const totalReceivables = allDebts
    .filter(d => d.type === 'HUTANG_PENJUALAN')
    .reduce((acc, d) => acc + (d.totalAmount - d.paidAmount), 0);

  const totalPayables = allDebts
    .filter(d => d.type === 'HUTANG_PEMBELIAN')
    .reduce((acc, d) => acc + (d.totalAmount - d.paidAmount), 0);

  const unpaidCount = allDebts
    .filter(d => d.status !== 'PAID')
    .length;

  // Pagination calculation
  const totalEntries = filtered.length;
  const totalPages = Math.ceil(totalEntries / entriesPerPage);
  const indexOfLastEntry = currentPage * entriesPerPage;
  const indexOfFirstEntry = indexOfLastEntry - entriesPerPage;
  const currentEntries = filtered.slice(indexOfFirstEntry, indexOfLastEntry);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handlePaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDebt || !paymentAmount) return;
    paymentMutation.mutate({
      debtId: selectedDebt.id,
      amount: parseFloat(paymentAmount),
      paymentMethod,
      notes: paymentNotes
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Manajemen Hutang & Piutang</h1>
          <p className="text-slate-500 text-sm">Kelola piutang penjualan pelanggan dan hutang pembelian supplier secara real-time.</p>
        </div>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1 */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between relative overflow-hidden group">
          <div className="space-y-2">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">Piutang Penjualan (Customer)</span>
            <h3 className="text-2xl font-black text-emerald-600">Rp {totalReceivables.toLocaleString()}</h3>
            <p className="text-[10px] text-slate-400">Total tagihan jatuh tempo dari pelanggan</p>
          </div>
          <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between relative overflow-hidden group">
          <div className="space-y-2">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">Hutang Pembelian (Supplier)</span>
            <h3 className="text-2xl font-black text-rose-600">Rp {totalPayables.toLocaleString()}</h3>
            <p className="text-[10px] text-slate-400">Total tagihan yang harus dibayar ke supplier</p>
          </div>
          <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600 shrink-0">
            <TrendingDown className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between relative overflow-hidden group">
          <div className="space-y-2">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">Transaksi Belum Lunas</span>
            <h3 className="text-2xl font-black text-amber-500">{unpaidCount} Transaksi</h3>
            <p className="text-[10px] text-slate-400">Menunggu pembayaran cicilan / lunas</p>
          </div>
          <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 shrink-0">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-100 bg-slate-50/50 p-2 gap-2">
          <button
            onClick={() => { setActiveTab('receivable'); setCurrentPage(1); }}
            className={`flex-1 md:flex-none px-6 py-3 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
              activeTab === 'receivable'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-100'
                : 'text-slate-500 hover:bg-white hover:text-emerald-600'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Piutang Penjualan (Customer)
          </button>
          <button
            onClick={() => { setActiveTab('payable'); setCurrentPage(1); }}
            className={`flex-1 md:flex-none px-6 py-3 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
              activeTab === 'payable'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-100'
                : 'text-slate-500 hover:bg-white hover:text-rose-600'
            }`}
          >
            <TrendingDown className="w-4 h-4" />
            Hutang Pembelian (Supplier)
          </button>
        </div>

        {/* Filters */}
        <div className="p-6 border-b border-slate-100 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Cari partner atau no. invoice..."
              className="pl-9 h-10 text-sm rounded-xl"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            />
          </div>

          <div>
            <select
              className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            >
              <option value="">Semua Status</option>
              <option value="UNPAID">Belum Lunas</option>
              <option value="PARTIAL">Cicilan (Partial)</option>
              <option value="PAID">Lunas (Paid)</option>
            </select>
          </div>

          <div>
            <select
              className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              value={branchFilter}
              onChange={(e) => { setBranchFilter(e.target.value); setCurrentPage(1); }}
            >
              <option value="">Semua Cabang</option>
              {branches?.map(b => (
                <option key={b.id} value={b.id.toString()}>{b.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold text-xs uppercase tracking-widest">
                <th className="p-4 pl-6">ID / Ref</th>
                <th className="p-4">Partner</th>
                <th className="p-4">Cabang</th>
                <th className="p-4">Tanggal Buat</th>
                <th className="p-4">Jatuh Tempo</th>
                <th className="p-4 text-right">Total Tagihan</th>
                <th className="p-4 text-right">Terbayar</th>
                <th className="p-4 text-right">Sisa Tagihan</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-center pr-6">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={10} className="p-10 text-center text-slate-400">Loading data hutang...</td>
                </tr>
              ) : currentEntries.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-10 text-center text-slate-400">Tidak ada transaksi ditemukan</td>
                </tr>
              ) : (
                currentEntries.map((d: any) => {
                  const sisa = d.totalAmount - d.paidAmount;
                  const partnerName = d.type === 'HUTANG_PENJUALAN'
                    ? d.sale?.customer?.name || 'Walk-in Customer'
                    : d.purchase?.supplier?.name || 'Supplier';

                  const dateStr = d.createdAt ? d.createdAt.split('T')[0] : '-';
                  const refNum = d.type === 'HUTANG_PENJUALAN'
                    ? `#SAL-${d.sale?.id}`
                    : d.purchase?.invoiceNumber || `#PUR-${d.purchase?.id}`;

                  return (
                    <tr key={d.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 pl-6 font-semibold text-slate-800">{refNum}</td>
                      <td className="p-4">
                        <div className="font-bold text-slate-700">{partnerName}</div>
                        <div className="text-[10px] text-slate-400 uppercase tracking-widest">{d.type === 'HUTANG_PENJUALAN' ? 'Customer' : 'Supplier'}</div>
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full">
                          <Building className="w-3 h-3" />
                          {d.branch?.name}
                        </span>
                      </td>
                      <td className="p-4 text-slate-500">{dateStr}</td>
                      <td className="p-4 text-slate-500 font-semibold">{d.dueDate}</td>
                      <td className="p-4 text-right font-bold text-slate-800">Rp {d.totalAmount.toLocaleString()}</td>
                      <td className="p-4 text-right font-medium text-emerald-600">Rp {d.paidAmount.toLocaleString()}</td>
                      <td className="p-4 text-right font-black text-slate-900">Rp {sisa.toLocaleString()}</td>
                      <td className="p-4 text-center">
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-black tracking-wide uppercase ${
                          d.status === 'PAID'
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                            : d.status === 'PARTIAL'
                            ? 'bg-amber-50 text-amber-600 border border-amber-100'
                            : 'bg-rose-50 text-rose-600 border border-rose-100'
                        }`}>
                          {d.status === 'PAID' ? 'Lunas' : d.status === 'PARTIAL' ? 'Cicilan' : 'Belum Lunas'}
                        </span>
                      </td>
                      <td className="p-4 text-center pr-6">
                        <Button
                          variant={d.status === 'PAID' ? 'outline' : 'primary'}
                          className={`h-8 px-4 rounded-xl text-xs font-bold ${
                            d.status === 'PAID'
                              ? 'border-slate-200 text-slate-500 hover:bg-slate-50'
                              : activeTab === 'receivable'
                              ? 'bg-emerald-600 hover:bg-emerald-700'
                              : 'bg-rose-600 hover:bg-rose-700'
                          }`}
                          onClick={() => setSelectedDebt(d)}
                        >
                          {d.status === 'PAID' ? 'Detail & Histori' : 'Bayar / Cicil'}
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="p-6 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-widest">
              Menampilkan {indexOfFirstEntry + 1} - {Math.min(indexOfLastEntry, totalEntries)} Dari {totalEntries} Transaksi
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-9 px-3 rounded-lg"
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}
              >
                Sebelumnya
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <Button
                  key={p}
                  variant={currentPage === p ? 'primary' : 'outline'}
                  size="sm"
                  className={`h-9 w-9 p-0 rounded-lg font-bold ${
                    currentPage === p 
                      ? activeTab === 'receivable' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                      : ''
                  }`}
                  onClick={() => handlePageChange(p)}
                >
                  {p}
                </Button>
              ))}
              <Button
                variant="outline"
                size="sm"
                className="h-9 px-3 rounded-lg"
                disabled={currentPage === totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
              >
                Berikutnya
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Payment / Detail Dialog */}
      <Dialog
        isOpen={!!selectedDebt}
        onClose={() => { setSelectedDebt(null); setPaymentAmount(''); setPaymentNotes(''); }}
        title={selectedDebt?.status === 'PAID' ? "Detail Pelunasan Hutang" : "Catat Pelunasan / Cicilan"}
        size="md"
      >
        {selectedDebt && (
          <div className="space-y-6">
            {/* Debt Overview Panel */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Mitra / Partner</span>
                <p className="font-bold text-slate-800">
                  {selectedDebt.type === 'HUTANG_PENJUALAN'
                    ? selectedDebt.sale?.customer?.name || 'Walk-in Customer'
                    : selectedDebt.purchase?.supplier?.name || 'Supplier'}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">No. Ref Transaksi</span>
                <p className="font-mono text-xs font-bold text-slate-700">
                  {selectedDebt.type === 'HUTANG_PENJUALAN' ? `#SAL-${selectedDebt.sale?.id}` : selectedDebt.purchase?.invoiceNumber || `#PUR-${selectedDebt.purchase?.id}`}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Hutang</span>
                <p className="font-bold text-slate-800">Rp {selectedDebt.totalAmount.toLocaleString()}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Sisa Tagihan</span>
                <p className="font-black text-rose-600">Rp {(selectedDebt.totalAmount - selectedDebt.paidAmount).toLocaleString()}</p>
              </div>
            </div>

            {/* Input payment form if NOT paid */}
            {selectedDebt.status !== 'PAID' && (
              <form onSubmit={handlePaySubmit} className="space-y-4 pt-2 border-t border-slate-100">
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  Maksimal Pembayaran: Rp {(selectedDebt.totalAmount - selectedDebt.paidAmount).toLocaleString()}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-700">Nominal Pembayaran</label>
                    <Input
                      type="number"
                      placeholder="Contoh: 50000"
                      required
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-700">Cara Pembayaran</label>
                    <select
                      className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    >
                      <option value="CASH">Tunai (Cash)</option>
                      <option value="TRANSFER">Transfer Bank</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700">Catatan Pelunasan</label>
                  <Input
                    placeholder="Tulis keterangan cicilan..."
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={paymentMutation.isPending}
                  className={`w-full h-11 text-white font-bold rounded-xl shadow-lg ${
                    activeTab === 'receivable'
                      ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100'
                      : 'bg-rose-600 hover:bg-rose-700 shadow-rose-100'
                  }`}
                >
                  {paymentMutation.isPending ? "Menyimpan cicilan..." : "Simpan & Cetak Kwitansi"}
                </Button>
              </form>
            )}

            {/* Payment History Logs */}
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-600" />
                Histori Cicilan / Pelunasan
              </h3>
              
              <div className="space-y-2 max-h-48 overflow-y-auto no-scrollbar">
                {paymentsHistory?.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">Belum ada histori pelunasan dicatat</p>
                ) : (
                  paymentsHistory?.map((p: any) => (
                    <div key={p.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between gap-4">
                      <div>
                        <div className="text-xs font-black text-slate-800">Rp {p.amount.toLocaleString()}</div>
                        <div className="text-[10px] text-slate-400">{p.paymentDate.replace('T', ' ').substring(0, 19)} - Method: {p.paymentMethod}</div>
                        {p.notes && <div className="text-[10px] text-slate-500 italic mt-0.5">"{p.notes}"</div>}
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 text-slate-500 hover:text-emerald-600 rounded-lg shrink-0"
                        onClick={() => setPrintPayment(p)}
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </Dialog>

      {/* Cashier Struk Thermal Printer layout */}
      <AnimatePresence>
        {printPayment && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white p-6 rounded-3xl shadow-2xl max-w-sm w-full space-y-6"
            >
              {/* Thermal Invoice View Container */}
              <div className="border border-slate-200 p-4 rounded-xl bg-slate-50/50 shadow-inner font-mono text-slate-800 text-xs leading-relaxed space-y-4">
                <div className="text-center space-y-1">
                  <h3 className="font-extrabold text-base uppercase">G-APOTEK v2</h3>
                  <p className="text-[10px] text-slate-500">Bukti Pelunasan Resmi</p>
                  <div className="border-b border-dashed border-slate-300 my-2" />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>No. Kwitansi</span>
                    <span>#RCP-{printPayment.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tgl Pembayaran</span>
                    <span>{printPayment.paymentDate.split('T')[0]}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Metode</span>
                    <span>{printPayment.paymentMethod}</span>
                  </div>
                </div>

                <div className="border-b border-dashed border-slate-300 my-2" />

                <div className="space-y-2">
                  <div className="text-center font-bold">INFO HUTANG</div>
                  <div className="flex justify-between">
                    <span>Partner</span>
                    <span className="font-bold">
                      {selectedDebt?.type === 'HUTANG_PENJUALAN'
                        ? selectedDebt?.sale?.customer?.name || 'Walk-in Customer'
                        : selectedDebt?.purchase?.supplier?.name || 'Supplier'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Ref Transaksi</span>
                    <span>{selectedDebt?.type === 'HUTANG_PENJUALAN' ? `#SAL-${selectedDebt?.sale?.id}` : selectedDebt?.purchase?.invoiceNumber}</span>
                  </div>
                </div>

                <div className="border-b border-dashed border-slate-300 my-2" />

                <div className="space-y-1.5 text-right text-xs">
                  <div className="flex justify-between font-bold text-slate-900 text-sm">
                    <span>BAYAR CICILAN</span>
                    <span>Rp {printPayment.amount.toLocaleString()}</span>
                  </div>
                  {selectedDebt && (
                    <>
                      <div className="flex justify-between text-slate-500">
                        <span>Total Tagihan</span>
                        <span>Rp {selectedDebt.totalAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-rose-500 font-bold">
                        <span>Sisa Hutang Baru</span>
                        <span>Rp {(selectedDebt.totalAmount - (selectedDebt.paidAmount + (printPayment.debt?.id ? 0 : printPayment.amount))).toLocaleString()}</span>
                      </div>
                    </>
                  )}
                </div>

                <div className="border-b border-dashed border-slate-300 my-2" />

                <div className="text-center text-[10px] text-slate-400 space-y-1">
                  <p>Terima kasih atas pembayaran Anda.</p>
                  <p>Kwitansi ini adalah bukti pembayaran sah.</p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1 h-12" 
                  onClick={() => {
                    const printContent = document.querySelector('.font-mono')?.innerHTML;
                    document.body.innerHTML = `<div style="font-family: monospace; padding: 20px; font-size: 14px;">${printContent}</div>`;
                    window.print();
                    window.location.reload();
                  }}
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Cetak Struk
                </Button>
                <Button 
                  className="flex-1 h-12 bg-slate-900 hover:bg-slate-800" 
                  onClick={() => setPrintPayment(null)}
                >
                  Tutup
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DebtsPage;
