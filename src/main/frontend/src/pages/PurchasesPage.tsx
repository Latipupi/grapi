import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../api/api';
import { Button } from '../components/ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Pagination } from '../components/ui/Pagination';
import { 
  Plus, 
  ShoppingBag, 
  Calendar, 
  Truck, 
  CreditCard, 
  Search, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle,
  RefreshCw,
  Store
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Dialog } from '../components/ui/Dialog';

const parseLocalDate = (dateStr: string) => {
  if (!dateStr) return new Date();
  if (dateStr.includes('T')) return new Date(dateStr);
  return new Date(dateStr + 'T00:00:00');
};

interface Purchase {
  id: number;
  supplier: { name: string };
  branch: { name: string };
  purchaseDate: string;
  invoiceNumber: string;
  totalAmount: number;
  status: string;
}

interface ReorderItem {
  productId: number;
  productName: string;
  sku: string;
  branchId: number;
  branchName: string;
  currentStock: number;
  minimumStock: number;
  avgDailySales: number;
  reorderPoint: number;
  suggestedQuantity: number;
  lastPurchasePrice: number;
  sellingPrice: number;
}

interface SupplierGroup {
  supplierId: number;
  supplierName: string;
  supplierPhone: string;
  items: ReorderItem[];
}

const PurchasesPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  
  const [currentPage, setCurrentPage] = useState(1);
  const entriesPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedBranchId]);
  
  // Reorder states
  const [isReorderOpen, setIsReorderOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [localGroups, setLocalGroups] = useState<SupplierGroup[]>([]);

  const { data: branches } = useQuery<any[]>({
    queryKey: ['branches'],
    queryFn: async () => {
      const res = await api.get('/branches');
      return res.data;
    },
  });

  const { data: purchases, isLoading } = useQuery<Purchase[]>({
    queryKey: ['purchases', selectedBranchId],
    queryFn: async () => {
      const params = selectedBranchId ? { branchId: selectedBranchId } : {};
      const res = await api.get('/purchases', { params });
      return res.data;
    },
  });

  const { data: recommendations, isLoading: isRecLoading } = useQuery<SupplierGroup[]>({
    queryKey: ['reorder-recommendations'],
    queryFn: async () => {
      const res = await api.get('/purchasing/auto-reorder/recommendations');
      return res.data;
    },
    enabled: isReorderOpen, // Only fetch when modal is open
  });

  // Sync server recommendations into local editable state
  useEffect(() => {
    if (recommendations) {
      setLocalGroups(recommendations);
    }
  }, [recommendations]);

  const handleItemChange = (supplierId: number, productId: number, field: 'suggestedQuantity' | 'lastPurchasePrice', value: number) => {
    setLocalGroups(prevGroups => 
      prevGroups.map(group => {
        if (group.supplierId !== supplierId) return group;
        return {
          ...group,
          items: group.items.map(item => {
            if (item.productId !== productId) return item;
            return {
              ...item,
              [field]: value
            };
          })
        };
      })
    );
  };

  const handleGeneratePOs = async () => {
    if (!localGroups || localGroups.length === 0) return;
    
    setIsGenerating(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await api.post('/purchasing/auto-reorder/generate-pos', localGroups);
      setSuccessMsg(res.data.message || 'Berhasil membuat draf Surat Pesanan (PO).');
      
      // Invalidate purchases query to reload history
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      
      // Close modal after delay
      setTimeout(() => {
        setIsReorderOpen(false);
        setSuccessMsg('');
      }, 2000);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || 'Gagal membuat draf PO otomatis.');
    } finally {
      setIsGenerating(false);
    }
  };

  const filteredPurchases = useMemo(() => {
    if (!purchases) return [];
    let items = purchases;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      items = purchases.filter(p => {
        const invoiceMatch = p.invoiceNumber?.toLowerCase().includes(query);
        const idMatch = p.id.toString().includes(query) || `po-${p.id}`.includes(query) || `sp-${p.id}`.includes(query);
        const supplierMatch = p.supplier?.name?.toLowerCase().includes(query);
        const branchMatch = p.branch?.name?.toLowerCase().includes(query);
        return invoiceMatch || idMatch || supplierMatch || branchMatch;
      });
    }
    return [...items].sort((a, b) => b.id - a.id);
  }, [purchases, searchQuery]);

  const totalEntries = filteredPurchases.length;
  const totalPages = Math.ceil(totalEntries / entriesPerPage);
  const indexOfLastEntry = currentPage * entriesPerPage;
  const indexOfFirstEntry = indexOfLastEntry - entriesPerPage;
  const currentEntries = filteredPurchases.slice(indexOfFirstEntry, indexOfLastEntry);

  const hasRecommendations = useMemo(() => {
    return localGroups && localGroups.some(g => g.supplierId > 0 && g.items.length > 0);
  }, [localGroups]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Riwayat Pembelian</h1>
          <p className="text-slate-500 text-sm">Kelola pengadaan barang dari supplier.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            className="flex items-center gap-2 bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100 shadow-sm font-bold"
            onClick={() => setIsReorderOpen(true)}
          >
            <Sparkles className="w-4 h-4 text-emerald-500 animate-pulse" />
            Rekomendasi Otomatis (Auto-PO)
          </Button>
          <Button 
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-100 font-bold"
            onClick={() => navigate('/dashboard/purchasing/new')}
          >
            <Plus className="w-4 h-4" />
            Tambah Pembelian
          </Button>
        </div>
      </div>

      {/* Pencarian dan Filter Cabang */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
        <div className="flex items-center bg-white px-4 py-2.5 rounded-2xl shadow-sm border border-slate-100 gap-2.5 flex-1 max-w-md">
          <Search className="w-5 h-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Cari nomor invoice, ID SP/PO, supplier, cabang..." 
            className="bg-transparent border-0 outline-none text-sm text-slate-700 placeholder-slate-400 w-full focus:ring-0 focus:outline-none"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center bg-white px-3 py-2.5 rounded-2xl shadow-sm border border-slate-100 gap-2 w-full sm:w-64">
          <Store className="w-4 h-4 text-emerald-600 shrink-0" />
          <select
            value={selectedBranchId}
            onChange={(e) => setSelectedBranchId(e.target.value)}
            className="bg-transparent border-0 outline-none text-sm text-slate-700 w-full focus:ring-0 focus:outline-none font-semibold cursor-pointer"
          >
            <option value="">Semua Cabang</option>
            {branches?.map((b) => (
              <option key={b.id} value={b.id.toString()}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No. Invoice / ID</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>Cabang</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-slate-400">
                    Memuat data...
                  </TableCell>
                </TableRow>
              ) : purchases?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-slate-400">
                    Belum ada riwayat pembelian.
                  </TableCell>
                </TableRow>
              ) : filteredPurchases.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-slate-400 italic">
                    Tidak ditemukan riwayat pembelian untuk pencarian "{searchQuery}".
                  </TableCell>
                </TableRow>
              ) : (
                currentEntries.map((purchase, index) => (
                  <motion.tr 
                    key={purchase.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="cursor-pointer hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0"
                    onClick={() => navigate(`/dashboard/purchasing/${purchase.id}`)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center shrink-0">
                          <ShoppingBag className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-800">{purchase.invoiceNumber || `PO-${purchase.id}`}</p>
                          <p className="text-xs text-slate-500">#{purchase.id}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-sm text-slate-600 font-medium">
                        <Truck className="w-3.5 h-3.5 text-slate-400" />
                        {purchase.supplier?.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-sm text-slate-500">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {parseLocalDate(purchase.purchaseDate).toLocaleDateString('id-ID')}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">
                      {purchase.branch?.name}
                    </TableCell>
                    <TableCell className="font-bold text-slate-800">
                      <div className="flex items-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5 text-emerald-500" />
                        Rp {purchase.totalAmount.toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                        purchase.status === 'RECEIVED' 
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                          : 'bg-amber-50 text-amber-600 border-amber-100'
                      }`}>
                        {purchase.status}
                      </span>
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
          label="Pembelian"
        />
      </div>

      {/* dialog Rekomendasi Otomatis (Auto-PO) */}
      <Dialog
        isOpen={isReorderOpen}
        onClose={() => setIsReorderOpen(false)}
        title="Rekomendasi Pemesanan Otomatis (Auto-PO)"
        size="xl"
        footer={
          <>
            <Button variant="outline" className="rounded-xl h-11 font-bold" onClick={() => setIsReorderOpen(false)}>
              Batal
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-11 shadow-lg shadow-emerald-100 font-bold"
              onClick={handleGeneratePOs}
              disabled={isGenerating || !hasRecommendations || !!successMsg}
            >
              {isGenerating ? "Mengeksekusi..." : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Draf PO Otomatis
                </>
              )}
            </Button>
          </>
        }
      >
        <div className="space-y-6">
          {/* Header info */}
          <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100/50 flex gap-3 text-emerald-800">
            <Sparkles className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-sm text-left">
              <p className="font-bold">Analisis Cerdas Berbasis Sales Velocity (Dapat Diedit)</p>
              <p className="text-emerald-700 mt-1">
                Sistem menghitung rata-rata penjualan harian (*Sales Velocity*) dalam 30 hari terakhir. 
                Obat direkomendasikan untuk dibeli jika stok saat ini kurang dari **Reorder Point (ROP)** (asumsi *lead time* PBF 3 hari + stok pengaman minimum).
                <br />
                <span className="font-semibold text-emerald-800">💡 Tip: Anda dapat langsung mengubah Jumlah Disarankan dan Estimasi Harga Beli di tabel di bawah sebelum membuat PO!</span>
              </p>
            </div>
          </div>

          <AnimatePresence>
            {successMsg && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 p-4 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200 text-sm font-semibold"
              >
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                {successMsg}
              </motion.div>
            )}
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 p-4 bg-rose-50 text-rose-700 rounded-xl border border-rose-200 text-sm font-semibold"
              >
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                {errorMsg}
              </motion.div>
            )}
          </AnimatePresence>

          {isRecLoading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin" />
              <p className="text-sm text-slate-500 font-medium">Menganalisis performa penjualan apotek...</p>
            </div>
          ) : !localGroups || localGroups.length === 0 ? (
            <div className="text-center py-16 text-slate-400 italic">
              Tidak ada produk obat yang perlu dipesan ulang saat ini. Semua stok dalam kondisi aman!
            </div>
          ) : (
            <div className="space-y-8">
              {localGroups.map((group) => {
                const isUnmapped = group.supplierId === 0;
                
                return (
                  <div key={group.supplierId} className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                    {/* Supplier Header */}
                    <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <Truck className="w-5 h-5 text-emerald-600" />
                        <h3 className="font-bold text-slate-800">{group.supplierName}</h3>
                      </div>
                      {group.supplierPhone && (
                        <span className="text-xs font-semibold text-slate-400">Telp: {group.supplierPhone}</span>
                      )}
                      {isUnmapped && (
                        <span className="px-2.5 py-0.5 text-[10px] font-bold text-amber-600 bg-amber-50 rounded-full border border-amber-100">
                          PERLU MAPPING
                        </span>
                      )}
                    </div>

                    {/* Table of items */}
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-white hover:bg-white">
                            <TableHead className="font-bold text-xs">Nama Obat</TableHead>
                            <TableHead className="font-bold text-xs text-center">Stok Saat Ini</TableHead>
                            <TableHead className="font-bold text-xs text-center">Safety Stock (Min)</TableHead>
                            <TableHead className="font-bold text-xs text-center">Avg Jual/Hari</TableHead>
                            <TableHead className="font-bold text-xs text-center">Ambang ROP</TableHead>
                            <TableHead className="font-bold text-xs text-center w-24">Jumlah Disarankan</TableHead>
                            <TableHead className="font-bold text-xs text-right w-36">Est. Harga Beli</TableHead>
                            <TableHead className="font-bold text-xs text-right w-36">Est. Subtotal</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {group.items.map((item) => {
                            const estSubtotal = item.suggestedQuantity * item.lastPurchasePrice;
                            return (
                              <TableRow key={item.productId} className="hover:bg-slate-50/50">
                                <TableCell className="text-left font-semibold text-slate-700">
                                  <div>
                                    <p className="text-sm">{item.productName}</p>
                                    <p className="text-[10px] text-slate-400 font-medium">SKU: {item.sku || '-'}</p>
                                  </div>
                                </TableCell>
                                <TableCell className="text-center font-bold text-slate-700">{item.currentStock}</TableCell>
                                <TableCell className="text-center text-slate-500 font-medium">{item.minimumStock}</TableCell>
                                <TableCell className="text-center text-slate-500 font-medium">{item.avgDailySales}</TableCell>
                                <TableCell className="text-center text-rose-500 font-bold">{item.reorderPoint}</TableCell>
                                <TableCell className="text-center">
                                  <input
                                    type="number"
                                    value={item.suggestedQuantity}
                                    onChange={(e) => handleItemChange(group.supplierId, item.productId, 'suggestedQuantity', parseFloat(e.target.value) || 0)}
                                    className="w-20 px-2 py-1 text-center font-bold rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none text-xs"
                                  />
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex items-center justify-end gap-1">
                                    <span className="text-xs text-slate-400 font-mono">Rp</span>
                                    <input
                                      type="number"
                                      value={item.lastPurchasePrice}
                                      onChange={(e) => handleItemChange(group.supplierId, item.productId, 'lastPurchasePrice', parseFloat(e.target.value) || 0)}
                                      className="w-24 px-2 py-1 text-right font-bold rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none text-xs font-mono"
                                    />
                                  </div>
                                </TableCell>
                                <TableCell className="text-right font-black text-emerald-600">
                                  Rp {estSubtotal.toLocaleString()}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Dialog>
    </div>
  );
};

export default PurchasesPage;
