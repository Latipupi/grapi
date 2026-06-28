import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../api/api';
import { Button } from '../components/ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Pagination } from '../components/ui/Pagination';
import { Dialog } from '../components/ui/Dialog';
import { 
  Plus, 
  RotateCcw, 
  Calendar, 
  Search, 
  AlertCircle, 
  CheckCircle2
} from 'lucide-react';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';

interface SaleDetail {
  id: number;
  product: { id: number; name: string };
  batch: { id: number; batchNumber: string; expiryDate: string };
  quantity: number;
  unitPrice: number;
  subtotal: number;
  conversionFactor: number;
}

interface Sale {
  id: number;
  saleDate: string;
  totalAmount: number;
  paymentMethod: string;
  status: string;
  notes: string;
  customer?: { name: string };
  user: { fullName: string };
  details: SaleDetail[];
}

interface SalesReturnDetail {
  id: number;
  product: { name: string };
  quantity: number;
  refundAmount: number;
}

interface SalesReturn {
  id: number;
  sale: { id: number; paymentMethod: string };
  branch: { name: string };
  user: { fullName: string };
  returnDate: string;
  totalRefundAmount: number;
  reason: string;
  details: SalesReturnDetail[];
}

const parseLocalDate = (dateStr: string) => {
  if (!dateStr) return new Date();
  if (dateStr.includes('T')) return new Date(dateStr);
  return new Date(dateStr + 'T00:00:00');
};

const SalesReturnsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { branchId, userId } = useSelector((state: RootState) => state.auth);

  // Lists state
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const entriesPerPage = 10;

  // New return modal state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [searchInvoiceQuery, setSearchInvoiceQuery] = useState('');
  const [searchedSale, setSearchedSale] = useState<Sale | null>(null);
  const [isSearchingSale, setIsSearchingSale] = useState(false);
  const [searchError, setSearchError] = useState('');
  
  // Return quantities and reason
  const [returnQuantities, setReturnQuantities] = useState<Record<number, number>>({});
  const [alreadyReturnedQuantities, setAlreadyReturnedQuantities] = useState<Record<number, number>>({});
  const [returnReason, setReturnReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [submitError, setSubmitError] = useState('');

  // Detail modal state
  const [selectedReturn, setSelectedReturn] = useState<SalesReturn | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Reset page on search
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Fetch returns history
  const { data: returns, isLoading } = useQuery<SalesReturn[]>({
    queryKey: ['sales-returns', branchId],
    queryFn: async () => {
      const params = branchId ? { branchId: branchId } : {};
      const res = await api.get('/sales/returns', { params });
      return res.data;
    }
  });

  // Handle searching for a sale
  const handleSearchSale = async () => {
    if (!searchInvoiceQuery.trim()) return;
    setIsSearchingSale(true);
    setSearchError('');
    setSearchedSale(null);
    setReturnQuantities({});
    setAlreadyReturnedQuantities({});

    try {
      const saleId = searchInvoiceQuery.trim();
      const res = await api.get(`/sales/${saleId}`);
      const saleData: Sale = res.data;

      if (saleData.status === 'CANCELLED') {
        setSearchError('Transaksi ini telah dibatalkan.');
        setIsSearchingSale(false);
        return;
      }

      // Fetch existing returns for this sale to calculate remaining returnable quantity
      const returnsRes = await api.get(`/sales/returns/sale/${saleId}`);
      const existingReturns: SalesReturn[] = returnsRes.data;

      const returnedMap: Record<number, number> = {};
      existingReturns.forEach(ret => {
        ret.details.forEach((det: any) => {
          const detailId = det.saleDetail?.id || det.saleDetailId;
          if (detailId) {
            returnedMap[detailId] = (returnedMap[detailId] || 0) + det.quantity;
          }
        });
      });

      setAlreadyReturnedQuantities(returnedMap);
      setSearchedSale(saleData);

      // Initialize return quantities to 0
      const initialQuantities: Record<number, number> = {};
      saleData.details.forEach(detail => {
        initialQuantities[detail.id] = 0;
      });
      setReturnQuantities(initialQuantities);

    } catch (err: any) {
      console.error(err);
      setSearchError('Transaksi penjualan tidak ditemukan. Pastikan ID transaksi benar.');
    } finally {
      setIsSearchingSale(false);
    }
  };

  // Handle quantity change
  const handleQtyChange = (detailId: number, val: number, max: number) => {
    const qty = Math.max(0, Math.min(max, val));
    setReturnQuantities(prev => ({
      ...prev,
      [detailId]: qty
    }));
  };

  // Calculate total refund
  const calculatedTotalRefund = useMemo(() => {
    if (!searchedSale) return 0;
    return searchedSale.details.reduce((sum, detail) => {
      const qty = returnQuantities[detail.id] || 0;
      return sum + (qty * detail.unitPrice);
    }, 0);
  }, [searchedSale, returnQuantities]);

  // Submit return
  const handleSubmitReturn = async () => {
    if (!searchedSale) return;
    
    const itemsToReturn = Object.entries(returnQuantities)
      .map(([detailId, qty]) => ({
        saleDetailId: parseInt(detailId),
        quantity: qty
      }))
      .filter(item => item.quantity > 0);

    if (itemsToReturn.length === 0) {
      setSubmitError('Pilih minimal satu barang dengan kuantitas lebih dari 0 untuk diretur.');
      return;
    }

    if (!returnReason.trim()) {
      setSubmitError('Alasan retur wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');
    setSubmitSuccess('');

    try {
      const payload = {
        saleId: searchedSale.id,
        branchId: branchId || searchedSale.details[0]?.batch?.id ? 1 : 1, // Fallback if no branch ID
        userId: userId || 1,
        reason: returnReason.trim(),
        items: itemsToReturn
      };

      // Find branch ID from auth or from the sale
      if (branchId) {
        payload.branchId = Number(branchId);
      }

      await api.post('/sales/returns', payload);
      setSubmitSuccess('Retur penjualan berhasil diproses.');
      queryClient.invalidateQueries({ queryKey: ['sales-returns'] });
      
      // Close modal after delay
      setTimeout(() => {
        setIsCreateOpen(false);
        setSearchedSale(null);
        setSearchInvoiceQuery('');
        setReturnReason('');
        setSubmitSuccess('');
      }, 2000);

    } catch (err: any) {
      console.error(err);
      setSubmitError(err.response?.data || 'Gagal memproses retur penjualan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter returns history
  const filteredReturns = useMemo(() => {
    if (!returns) return [];
    let items = returns;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      items = returns.filter(r => {
        const idMatch = r.id.toString().includes(query) || `ret-${r.id}`.includes(query);
        const saleIdMatch = r.sale?.id.toString().includes(query);
        const reasonMatch = r.reason?.toLowerCase().includes(query);
        const branchMatch = r.branch?.name?.toLowerCase().includes(query);
        const userMatch = r.user?.fullName?.toLowerCase().includes(query);
        return idMatch || saleIdMatch || reasonMatch || branchMatch || userMatch;
      });
    }
    return [...items].sort((a, b) => b.id - a.id);
  }, [returns, searchQuery]);

  // Pagination
  const totalEntries = filteredReturns.length;
  const totalPages = Math.ceil(totalEntries / entriesPerPage);
  const indexOfLastEntry = currentPage * entriesPerPage;
  const indexOfFirstEntry = indexOfLastEntry - entriesPerPage;
  const currentEntries = filteredReturns.slice(indexOfFirstEntry, indexOfLastEntry);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Retur Penjualan</h1>
          <p className="text-slate-500 text-sm">Kelola pengembalian barang dari transaksi konsumen.</p>
        </div>
        <div>
          <Button 
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-100 font-bold"
            onClick={() => setIsCreateOpen(true)}
          >
            <Plus className="w-4 h-4" />
            Buat Retur Baru
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
        <div className="flex items-center bg-white px-4 py-2.5 rounded-2xl shadow-sm border border-slate-100 gap-2.5 flex-1 max-w-md">
          <Search className="w-5 h-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Cari ID retur, ID transaksi, alasan, kasir..." 
            className="bg-transparent border-0 outline-none text-sm text-slate-700 placeholder-slate-400 w-full focus:ring-0 focus:outline-none"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID Retur</TableHead>
                <TableHead>ID Penjualan</TableHead>
                <TableHead>Tanggal Retur</TableHead>
                <TableHead>Cabang</TableHead>
                <TableHead>Alasan</TableHead>
                <TableHead>Metode Bayar</TableHead>
                <TableHead>Total Refund</TableHead>
                <TableHead>Kasir</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center text-slate-400">
                    Memuat data...
                  </TableCell>
                </TableRow>
              ) : returns?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center text-slate-400">
                    Belum ada riwayat retur penjualan.
                  </TableCell>
                </TableRow>
              ) : filteredReturns.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center text-slate-400 italic">
                    Tidak ditemukan riwayat retur untuk pencarian "{searchQuery}".
                  </TableCell>
                </TableRow>
              ) : (
                currentEntries.map((ret, index) => (
                  <motion.tr 
                    key={ret.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="cursor-pointer hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0"
                    onClick={() => {
                      setSelectedReturn(ret);
                      setIsDetailOpen(true);
                    }}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center shrink-0">
                          <RotateCcw className="w-4 h-4 text-emerald-600" />
                        </div>
                        <span className="font-bold text-slate-800">RET-{ret.id}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold text-slate-600">
                      #{ret.sale?.id}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-sm text-slate-500">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {parseLocalDate(ret.returnDate).toLocaleString('id-ID')}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">
                      {ret.branch?.name}
                    </TableCell>
                    <TableCell className="text-sm text-slate-600 max-w-xs truncate">
                      {ret.reason}
                    </TableCell>
                    <TableCell>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                        ret.sale?.paymentMethod === 'HUTANG' 
                          ? 'bg-amber-50 text-amber-600 border-amber-100'
                          : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                      }`}>
                        {ret.sale?.paymentMethod}
                      </span>
                    </TableCell>
                    <TableCell className="font-bold text-slate-800">
                      Rp {ret.totalRefundAmount.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">
                      {ret.user?.fullName}
                    </TableCell>
                  </motion.tr>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalEntries={totalEntries}
          indexOfFirstEntry={indexOfFirstEntry}
          indexOfLastEntry={indexOfLastEntry}
          label="Retur"
        />
      </div>

      {/* Modal Buat Retur Baru */}
      <Dialog
        isOpen={isCreateOpen}
        onClose={() => {
          setIsCreateOpen(false);
          setSearchedSale(null);
          setSearchInvoiceQuery('');
          setReturnReason('');
          setSubmitError('');
          setSubmitSuccess('');
        }}
        title="Proses Retur Penjualan Baru"
        size={searchedSale ? "xl" : "md"}
        footer={
          searchedSale ? (
            <>
              <Button 
                variant="outline" 
                className="rounded-xl h-11 font-bold" 
                onClick={() => setSearchedSale(null)}
              >
                Kembali
              </Button>
              <Button
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-11 shadow-lg shadow-emerald-100 font-bold"
                onClick={handleSubmitReturn}
                disabled={isSubmitting || !!submitSuccess}
              >
                {isSubmitting ? "Memproses..." : "Proses Retur"}
              </Button>
            </>
          ) : null
        }
      >
        <div className="space-y-6 text-left">
          {/* Step 1: Search Sale Transaction */}
          {!searchedSale ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Cari ID Transaksi Penjualan
                </label>
                <div className="flex gap-2">
                  <div className="flex-1 flex items-center bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 gap-2">
                    <Search className="w-5 h-5 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Masukkan ID Transaksi (Contoh: 12)" 
                      className="bg-transparent border-0 outline-none text-sm text-slate-700 w-full focus:ring-0"
                      value={searchInvoiceQuery}
                      onChange={(e) => setSearchInvoiceQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearchSale()}
                    />
                  </div>
                  <Button 
                    className="bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold px-5"
                    onClick={handleSearchSale}
                    disabled={isSearchingSale}
                  >
                    {isSearchingSale ? "Mencari..." : "Cari"}
                  </Button>
                </div>
              </div>

              {searchError && (
                <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-2 text-rose-600 text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span className="font-semibold">{searchError}</span>
                </div>
              )}
            </div>
          ) : (
            /* Step 2: Configure Return Items */
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Sale Info Card */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-slate-400 font-bold uppercase text-[10px]">Transaksi</p>
                  <p className="font-bold text-slate-800 mt-0.5">ID Penjualan: #{searchedSale.id}</p>
                  <p className="text-slate-500 text-xs mt-0.5">Tanggal: {parseLocalDate(searchedSale.saleDate).toLocaleString('id-ID')}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-bold uppercase text-[10px]">Pelanggan & Kasir</p>
                  <p className="font-bold text-slate-800 mt-0.5">{searchedSale.customer?.name || 'Umum (Non-Member)'}</p>
                  <p className="text-slate-500 text-xs mt-0.5">Kasir: {searchedSale.user?.fullName}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-bold uppercase text-[10px]">Pembayaran & Total</p>
                  <p className="font-bold text-slate-800 mt-0.5">Metode: {searchedSale.paymentMethod}</p>
                  <p className="font-extrabold text-emerald-600 mt-0.5">Total: Rp {searchedSale.totalAmount.toLocaleString()}</p>
                </div>
              </div>

              {/* Feedback messages */}
              <AnimatePresence>
                {submitSuccess && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2 p-4 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200 text-sm font-semibold"
                  >
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    {submitSuccess}
                  </motion.div>
                )}
                {submitError && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2 p-4 bg-rose-50 text-rose-700 rounded-xl border border-rose-200 text-sm font-semibold"
                  >
                    <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                    {submitError}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Return Items Table */}
              <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead className="font-bold text-xs">Produk</TableHead>
                      <TableHead className="font-bold text-xs text-center">Batch</TableHead>
                      <TableHead className="font-bold text-xs text-center">Beli</TableHead>
                      <TableHead className="font-bold text-xs text-center">Telah Diretur</TableHead>
                      <TableHead className="font-bold text-xs text-center">Sisa</TableHead>
                      <TableHead className="font-bold text-xs text-right">Harga Satuan</TableHead>
                      <TableHead className="font-bold text-xs text-center w-28">Kuantitas Retur</TableHead>
                      <TableHead className="font-bold text-xs text-right w-32">Subtotal Refund</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {searchedSale.details.map((detail) => {
                      const alreadyRet = alreadyReturnedQuantities[detail.id] || 0;
                      const remaining = detail.quantity - alreadyRet;
                      const retQty = returnQuantities[detail.id] || 0;
                      const subtotalRefund = retQty * detail.unitPrice;

                      return (
                        <TableRow key={detail.id} className="hover:bg-slate-50/50">
                          <TableCell className="text-left font-semibold text-slate-700">
                            {detail.product?.name}
                          </TableCell>
                          <TableCell className="text-center font-mono text-xs text-slate-500">
                            {detail.batch?.batchNumber}
                          </TableCell>
                          <TableCell className="text-center text-slate-600 font-medium">
                            {detail.quantity}
                          </TableCell>
                          <TableCell className="text-center text-rose-500 font-medium">
                            {alreadyRet}
                          </TableCell>
                          <TableCell className="text-center text-emerald-600 font-bold">
                            {remaining}
                          </TableCell>
                          <TableCell className="text-right text-slate-600">
                            Rp {detail.unitPrice.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-center">
                            <input
                              type="number"
                              value={retQty}
                              onChange={(e) => handleQtyChange(detail.id, parseFloat(e.target.value) || 0, remaining)}
                              className="w-20 px-2 py-1 text-center font-bold rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none text-xs"
                              disabled={remaining <= 0}
                            />
                          </TableCell>
                          <TableCell className="text-right font-bold text-emerald-600">
                            Rp {subtotalRefund.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Reason & Total Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-slate-700">
                    Alasan Retur
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Contoh: Barang kedaluwarsa, salah dosis, dibatalkan pelanggan..."
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm placeholder-slate-400"
                  />
                </div>
                <div className="bg-emerald-50/50 p-6 rounded-2xl border border-emerald-100/50 space-y-4">
                  <div className="flex justify-between items-center text-emerald-800">
                    <span className="text-sm font-semibold">Metode Pengembalian</span>
                    <span className="font-bold uppercase text-xs px-2.5 py-1 bg-emerald-100 rounded-full">
                      {searchedSale.paymentMethod === 'HUTANG' ? 'Potong Piutang' : 'Cash / Tunai'}
                    </span>
                  </div>
                  <div className="h-px bg-emerald-100/50" />
                  <div className="flex justify-between items-center text-emerald-900">
                    <span className="text-base font-bold">Total Refund</span>
                    <span className="text-2xl font-black text-emerald-600">
                      Rp {calculatedTotalRefund.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </Dialog>

      {/* Modal Detail Retur */}
      <Dialog
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedReturn(null);
        }}
        title={`Detail Retur Penjualan - RET-${selectedReturn?.id}`}
        size="lg"
      >
        {selectedReturn && (
          <div className="space-y-6 text-left">
            {/* Info Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
                <p className="text-slate-400 font-bold uppercase text-[10px]">Informasi Retur</p>
                <p className="text-slate-700"><strong className="text-slate-800">ID Retur:</strong> RET-{selectedReturn.id}</p>
                <p className="text-slate-700"><strong className="text-slate-800">Tanggal:</strong> {parseLocalDate(selectedReturn.returnDate).toLocaleString('id-ID')}</p>
                <p className="text-slate-700"><strong className="text-slate-800">Cabang:</strong> {selectedReturn.branch?.name}</p>
                <p className="text-slate-700"><strong className="text-slate-800">Kasir/Pemroses:</strong> {selectedReturn.user?.fullName}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
                <p className="text-slate-400 font-bold uppercase text-[10px]">Informasi Penjualan Asli</p>
                <p className="text-slate-700"><strong className="text-slate-800">ID Transaksi:</strong> #{selectedReturn.sale?.id}</p>
                <p className="text-slate-700"><strong className="text-slate-800">Metode Bayar Asli:</strong> {selectedReturn.sale?.paymentMethod}</p>
                <p className="text-slate-700"><strong className="text-slate-800">Metode Refund:</strong> {selectedReturn.sale?.paymentMethod === 'HUTANG' ? 'Potong Piutang' : 'Cash / Tunai'}</p>
                <p className="text-slate-700"><strong className="text-slate-800">Alasan Retur:</strong> {selectedReturn.reason || '-'}</p>
              </div>
            </div>

            {/* Returned Items Table */}
            <div className="border border-slate-100 rounded-xl overflow-hidden shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="font-bold text-xs">Produk</TableHead>
                    <TableHead className="font-bold text-xs text-center">Jumlah Diretur</TableHead>
                    <TableHead className="font-bold text-xs text-right">Nilai Refund</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedReturn.details.map((detail) => (
                    <TableRow key={detail.id} className="hover:bg-slate-50/50">
                      <TableCell className="text-left font-semibold text-slate-700">
                        {detail.product?.name}
                      </TableCell>
                      <TableCell className="text-center text-slate-700 font-medium">
                        {detail.quantity}
                      </TableCell>
                      <TableCell className="text-right font-bold text-slate-800">
                        Rp {detail.refundAmount.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Total Refund Card */}
            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 flex justify-between items-center">
              <span className="text-sm font-bold text-emerald-850">Total Dana Direfund</span>
              <span className="text-xl font-black text-emerald-600">
                Rp {selectedReturn.totalRefundAmount.toLocaleString()}
              </span>
            </div>

            {/* Close Button */}
            <div className="flex justify-end">
              <Button 
                className="bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold px-6 h-11"
                onClick={() => {
                  setIsDetailOpen(false);
                  setSelectedReturn(null);
                }}
              >
                Tutup
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
};

export default SalesReturnsPage;
