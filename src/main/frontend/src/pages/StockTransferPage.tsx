import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Pagination } from '../components/ui/Pagination';
import { 
  Truck, 
  ArrowRight, 
  Search, 
  Plus, 
  Trash2, 
  History, 
  FileText, 
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Branch {
  id: number;
  name: string;
  type: string;
}

interface Product {
  id: number;
  name: string;
  sku: string;
}

interface InventoryItem {
  id: number;
  product: Product;
  stockQuantity: number;
}

interface InventoryBatch {
  id: number;
  batchNumber: string;
  expiryDate: string;
  currentQuantity: number;
  purchasePrice: number;
}

interface DraftItem {
  productId: number;
  productName: string;
  sku: string;
  quantity: number;
  batchNumber: string;
  expiryDate: string;
  maxStock: number;
}

interface StockTransferDetail {
  id: number;
  product: Product;
  quantity: number;
  batchNumber: string;
  expiryDate: string;
}

interface StockTransfer {
  id: number;
  transferDate: string;
  sourceBranch: Branch;
  destinationBranch: Branch;
  user: { fullName: string };
  status: string;
  notes?: string;
  details: StockTransferDetail[];
}

const StockTransferPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'create' | 'history'>('create');
  
  // Create transfer state
  const [sourceBranchId, setSourceBranchId] = useState<string>('');
  const [destinationBranchId, setDestinationBranchId] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [draftItems, setDraftItems] = useState<DraftItem[]>([]);
  
  // Selection states inside create form
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [selectedBatchNumber, setSelectedBatchNumber] = useState<string>('');
  const [transferQty, setTransferQty] = useState<string>('');
  const [productSearch, setProductSearch] = useState<string>('');
  const [isProductListOpen, setIsProductListOpen] = useState<boolean>(false);

  // History states
  const [selectedTransfer, setSelectedTransfer] = useState<StockTransfer | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const entriesPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  // Queries
  const { data: branches } = useQuery<Branch[]>({
    queryKey: ['branches'],
    queryFn: () => api.get('/branches').then(res => res.data),
  });

  // Fetch inventory for selected source branch to populate product list
  const { data: sourceInventory } = useQuery<InventoryItem[]>({
    queryKey: ['inventory', sourceBranchId],
    queryFn: () => api.get(`/inventory/branch/${sourceBranchId}`).then(res => res.data),
    enabled: !!sourceBranchId,
  });

  // Fetch batches for selected product in source branch
  const { data: productBatches, isLoading: isBatchesLoading } = useQuery<InventoryBatch[]>({
    queryKey: ['batches', sourceBranchId, selectedProductId],
    queryFn: () => api.get(`/inventory/branch/${sourceBranchId}/product/${selectedProductId}/batches`).then(res => res.data),
    enabled: !!sourceBranchId && !!selectedProductId,
  });

  // Fetch stock transfer history
  const { data: transferHistory, isLoading: isHistoryLoading } = useQuery<StockTransfer[]>({
    queryKey: ['transfers'],
    queryFn: () => api.get('/transfers').then(res => res.data),
  });

  // Reset dependent selections when source branch changes
  useEffect(() => {
    setDraftItems([]);
    setSelectedProductId('');
    setSelectedBatchNumber('');
    setTransferQty('');
    setProductSearch('');
  }, [sourceBranchId]);

  // Reset batch & quantity when product changes
  useEffect(() => {
    setSelectedBatchNumber('');
    setTransferQty('');
  }, [selectedProductId]);

  const selectedProduct = sourceInventory?.find(
    (inv) => inv.product.id.toString() === selectedProductId
  )?.product;

  const selectedBatch = productBatches?.find(
    (b) => b.batchNumber === selectedBatchNumber
  );

  // Filter products by search query
  const filteredProducts = sourceInventory?.filter((inv) => {
    const search = productSearch.toLowerCase();
    return (
      inv.product.name.toLowerCase().includes(search) ||
      inv.product.sku.toLowerCase().includes(search)
    );
  });

  const handleAddProduct = () => {
    if (!selectedProductId || !selectedBatchNumber || !transferQty) {
      alert('Mohon lengkapi produk, batch, dan jumlah transfer.');
      return;
    }

    const qty = parseFloat(transferQty);
    if (isNaN(qty) || qty <= 0) {
      alert('Kuantitas transfer harus lebih besar dari 0.');
      return;
    }

    if (selectedBatch && qty > selectedBatch.currentQuantity) {
      alert(`Stok tidak mencukupi. Maksimal stok tersedia adalah ${selectedBatch.currentQuantity}`);
      return;
    }

    // Check if product + batch already added in draft
    const existingIndex = draftItems.findIndex(
      (item) => item.productId.toString() === selectedProductId && item.batchNumber === selectedBatchNumber
    );

    if (existingIndex > -1) {
      const updated = [...draftItems];
      const newQty = updated[existingIndex].quantity + qty;
      if (selectedBatch && newQty > selectedBatch.currentQuantity) {
        alert(`Total kuantitas di keranjang (${newQty}) melebihi stok tersedia (${selectedBatch.currentQuantity}).`);
        return;
      }
      updated[existingIndex].quantity = newQty;
      setDraftItems(updated);
    } else {
      if (selectedProduct && selectedBatch) {
        setDraftItems([
          ...draftItems,
          {
            productId: selectedProduct.id,
            productName: selectedProduct.name,
            sku: selectedProduct.sku,
            quantity: qty,
            batchNumber: selectedBatch.batchNumber,
            expiryDate: selectedBatch.expiryDate,
            maxStock: selectedBatch.currentQuantity,
          },
        ]);
      }
    }

    // Reset inputs
    setSelectedProductId('');
    setSelectedBatchNumber('');
    setTransferQty('');
    setProductSearch('');
  };

  const handleRemoveDraftItem = (index: number) => {
    setDraftItems(draftItems.filter((_, i) => i !== index));
  };

  const transferMutation = useMutation({
    mutationFn: (payload: any) => api.post('/transfers', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      alert('Transfer stok berhasil dijalankan!');
      setDraftItems([]);
      setNotes('');
      setSourceBranchId('');
      setDestinationBranchId('');
      setActiveTab('history');
    },
    onError: (error: any) => {
      alert('Gagal memproses transfer stok: ' + (error.response?.data?.message || error.message));
    },
  });

  const handleProcessTransfer = () => {
    if (!sourceBranchId || !destinationBranchId) {
      alert('Mohon pilih cabang asal dan tujuan.');
      return;
    }

    if (sourceBranchId === destinationBranchId) {
      alert('Cabang asal dan tujuan tidak boleh sama.');
      return;
    }

    if (draftItems.length === 0) {
      alert('Mohon tambahkan minimal satu produk ke daftar transfer.');
      return;
    }

    const payload = {
      sourceBranchId: Number(sourceBranchId),
      destinationBranchId: Number(destinationBranchId),
      notes: notes,
      items: draftItems.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        batchNumber: item.batchNumber,
        expiryDate: item.expiryDate,
      })),
    };

    transferMutation.mutate(payload);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Transfer Stok</h1>
          <p className="text-slate-500 text-sm">Kirim dan distribusikan stok antar cabang apotek secara aman.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-100">
        <button
          onClick={() => setActiveTab('create')}
          className={`px-6 py-3 text-sm font-extrabold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'create'
              ? 'border-emerald-500 text-emerald-600'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Truck className="w-4 h-4" />
          Kirim Stok Baru
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-6 py-3 text-sm font-extrabold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'history'
              ? 'border-emerald-500 text-emerald-600'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <History className="w-4 h-4" />
          Riwayat Transfer
        </button>
      </div>

      {activeTab === 'create' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Form Setup Cabang */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
              <h3 className="font-extrabold text-slate-800 flex items-center gap-2">
                <Truck className="w-5 h-5 text-emerald-600" />
                Rute Transfer
              </h3>
              
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Cabang Pengirim (Asal)</label>
                  <select
                    className="w-full h-11 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none font-semibold text-slate-700 cursor-pointer"
                    value={sourceBranchId}
                    onChange={(e) => setSourceBranchId(e.target.value)}
                  >
                    <option value="">Pilih Cabang Asal</option>
                    {branches?.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.type === 'WAREHOUSE' ? 'Gudang' : 'Retail'})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-center py-1">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shadow-sm">
                    <ArrowRight className="w-4 h-4 rotate-90 lg:rotate-0" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Cabang Penerima (Tujuan)</label>
                  <select
                    className="w-full h-11 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none font-semibold text-slate-700 cursor-pointer"
                    value={destinationBranchId}
                    onChange={(e) => setDestinationBranchId(e.target.value)}
                    disabled={!sourceBranchId}
                  >
                    <option value="">Pilih Cabang Tujuan</option>
                    {branches
                      ?.filter((b) => b.id.toString() !== sourceBranchId)
                      ?.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name} ({b.type === 'WAREHOUSE' ? 'Gudang' : 'Retail'})
                        </option>
                      ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Catatan Transfer (Opsional)</label>
                  <Input 
                    placeholder="Contoh: Distribusi rutin bulanan..." 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    disabled={!sourceBranchId}
                  />
                </div>
              </div>
            </div>

            {sourceBranchId && destinationBranchId && (
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                <h3 className="font-extrabold text-slate-800">1. Tambah Obat</h3>
                
                <div className="space-y-4 relative">
                  {/* Searchable Product Dropdown */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Cari Produk Obat</label>
                    <div className="relative">
                      <Input
                        placeholder="Ketik nama obat atau SKU..."
                        value={productSearch}
                        onChange={(e) => {
                          setProductSearch(e.target.value);
                          setIsProductListOpen(true);
                        }}
                        onFocus={() => setIsProductListOpen(true)}
                      />
                      <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    </div>

                    {isProductListOpen && filteredProducts && (
                      <div className="absolute z-10 w-full bg-white border border-slate-100 shadow-xl rounded-2xl max-h-48 overflow-y-auto mt-1 p-1">
                        {filteredProducts.length === 0 ? (
                          <div className="p-3 text-xs text-slate-400 italic text-center">Produk tidak ditemukan di cabang pengirim.</div>
                        ) : (
                          filteredProducts.map((inv) => (
                            <button
                              key={inv.product.id}
                              type="button"
                              className="w-full text-left px-3 py-2 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-700 transition-colors flex justify-between items-center"
                              onClick={() => {
                                setSelectedProductId(inv.product.id.toString());
                                setProductSearch(inv.product.name);
                                setIsProductListOpen(false);
                              }}
                            >
                              <span>{inv.product.name}</span>
                              <span className="font-mono text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100 shrink-0">Stok: {inv.stockQuantity}</span>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>

                  {/* Batch Selection */}
                  {selectedProductId && (
                    <div className="space-y-1.5 animate-in fade-in duration-300">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Pilih Batch & Expiry Date</label>
                      {isBatchesLoading ? (
                        <p className="text-xs text-slate-400">Memuat info batch...</p>
                      ) : (
                        <select
                          className="w-full h-11 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none font-semibold text-slate-700 cursor-pointer"
                          value={selectedBatchNumber}
                          onChange={(e) => setSelectedBatchNumber(e.target.value)}
                        >
                          <option value="">Pilih Batch</option>
                          {productBatches?.map((b) => (
                            <option key={b.id} value={b.batchNumber}>
                              {b.batchNumber} - Exp: {new Date(b.expiryDate).toLocaleDateString('id-ID')} (Stok: {b.currentQuantity})
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  )}

                  {/* Quantity Input */}
                  {selectedBatchNumber && selectedBatch && (
                    <div className="grid grid-cols-2 gap-4 animate-in fade-in duration-300">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Jumlah Transfer</label>
                        <Input
                          type="number"
                          min="0.01"
                          max={selectedBatch.currentQuantity}
                          placeholder="Jumlah..."
                          value={transferQty}
                          onChange={(e) => setTransferQty(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Stok Tersedia</label>
                        <div className="h-11 px-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center text-sm font-black text-slate-700">
                          {selectedBatch.currentQuantity} Unit
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Add Button */}
                  {selectedBatchNumber && (
                    <Button
                      onClick={handleAddProduct}
                      className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-center gap-2 rounded-xl"
                    >
                      <Plus className="w-4 h-4" />
                      Masukkan Keranjang
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* List Item Draft & Kirim */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm min-h-[400px] flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-extrabold text-slate-800">2. Daftar Obat Yang Akan Dikirim</h3>
                  <span className="bg-slate-100 text-slate-600 text-xs font-extrabold px-3 py-1 rounded-full border border-slate-200/50">
                    {draftItems.length} Item
                  </span>
                </div>

                {draftItems.length === 0 ? (
                  <div className="border-2 border-dashed border-slate-100 rounded-3xl p-12 text-center text-slate-400 space-y-2">
                    <Truck className="w-12 h-12 mx-auto text-slate-300 stroke-1" />
                    <p className="text-xs font-bold">Keranjang transfer kosong.</p>
                    <p className="text-[10px] text-slate-400">Silakan pilih cabang pengirim, cabang penerima, lalu tambahkan produk obat yang ingin ditransfer.</p>
                  </div>
                ) : (
                  <div className="border border-slate-100 rounded-2xl overflow-hidden">
                    <Table>
                      <TableHeader className="bg-slate-50/50">
                        <TableRow>
                          <TableHead className="font-bold text-slate-500">Nama Obat</TableHead>
                          <TableHead className="font-bold text-slate-500">Nomor Batch</TableHead>
                          <TableHead className="font-bold text-slate-500 text-center">Exp. Date</TableHead>
                          <TableHead className="font-bold text-slate-500 text-right">Jumlah</TableHead>
                          <TableHead className="w-10"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {draftItems.map((item, index) => (
                          <TableRow key={index} className="hover:bg-slate-50/20">
                            <TableCell className="font-bold text-slate-700">
                              <p>{item.productName}</p>
                              <p className="text-[10px] text-slate-400 font-mono">SKU: {item.sku}</p>
                            </TableCell>
                            <TableCell className="font-mono text-xs text-slate-600">{item.batchNumber}</TableCell>
                            <TableCell className="text-center text-xs text-slate-500">
                              {new Date(item.expiryDate).toLocaleDateString('id-ID')}
                            </TableCell>
                            <TableCell className="text-right font-black text-slate-800">{item.quantity} Unit</TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveDraftItem(index)}
                                className="w-8 h-8 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-full"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>

              {draftItems.length > 0 && (
                <div className="border-t border-slate-50 pt-6 mt-6 flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (confirm('Apakah Anda yakin ingin membatalkan semua draf transfer?')) {
                        setDraftItems([]);
                      }
                    }}
                  >
                    Kosongkan
                  </Button>
                  <Button
                    onClick={handleProcessTransfer}
                    disabled={transferMutation.isPending}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold flex items-center gap-2"
                  >
                    {transferMutation.isPending ? 'Memproses...' : 'Kirim Transfer Stok'}
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50/20">
              <h3 className="font-extrabold text-slate-800">Daftar Pengiriman Stok</h3>
              <p className="text-xs text-slate-400">Semua dokumen mutasi transfer stok antar cabang</p>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/30">
                    <TableHead className="font-bold text-slate-500">ID / Ref Dokumen</TableHead>
                    <TableHead className="font-bold text-slate-500">Tanggal & Waktu</TableHead>
                    <TableHead className="font-bold text-slate-500">Cabang Pengirim</TableHead>
                    <TableHead className="font-bold text-slate-500">Cabang Penerima</TableHead>
                    <TableHead className="font-bold text-slate-500">Penanggung Jawab</TableHead>
                    <TableHead className="font-bold text-slate-500 text-right">Jumlah Item</TableHead>
                    <TableHead className="font-bold text-slate-500 text-center">Status</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isHistoryLoading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-40 text-center">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                          <span className="text-slate-400 text-xs font-bold">Memuat riwayat transfer...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : !transferHistory || transferHistory.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-40 text-center text-slate-400 text-xs italic">
                        Belum ada riwayat transfer stok yang tercatat.
                      </TableCell>
                    </TableRow>
                  ) : (
                    (() => {
                      const sortedHistory = transferHistory ? [...transferHistory].sort((a, b) => b.id - a.id) : [];
                      const totalEntries = sortedHistory.length;
                      const totalPages = Math.ceil(totalEntries / entriesPerPage);
                      const indexOfLastEntry = currentPage * entriesPerPage;
                      const indexOfFirstEntry = indexOfLastEntry - entriesPerPage;
                      const currentEntries = sortedHistory.slice(indexOfFirstEntry, indexOfLastEntry);
                      return (
                        <>
                          {currentEntries.map((transfer) => (
                            <TableRow 
                              key={transfer.id} 
                              className="hover:bg-slate-50/50 cursor-pointer"
                              onClick={() => setSelectedTransfer(transfer)}
                            >
                              <TableCell className="font-mono font-bold text-slate-800">
                                TRF-{String(transfer.id).padStart(6, '0')}
                              </TableCell>
                              <TableCell className="text-slate-500 text-xs">
                                {new Date(transfer.transferDate || new Date()).toLocaleDateString('id-ID', {
                                  day: '2-digit',
                                  month: 'long',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </TableCell>
                              <TableCell>
                                <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-100">
                                  {transfer.sourceBranch.name}
                                </span>
                              </TableCell>
                              <TableCell>
                                <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-100">
                                  {transfer.destinationBranch.name}
                                </span>
                              </TableCell>
                              <TableCell className="text-slate-700 font-bold text-xs">
                                {transfer.user?.fullName || 'Sistem'}
                              </TableCell>
                              <TableCell className="text-right font-black text-slate-700">
                                {transfer.details?.length || 0} Obat
                              </TableCell>
                              <TableCell className="text-center">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wide border bg-emerald-50 text-emerald-700 border-emerald-100">
                                  SUKSES
                                </span>
                              </TableCell>
                              <TableCell onClick={(e) => e.stopPropagation()}>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="w-8 h-8 p-0 hover:bg-slate-100 rounded-full"
                                  onClick={() => setSelectedTransfer(transfer)}
                                >
                                  <ArrowRight className="w-4 h-4 text-slate-400" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                          <TableRow className="hover:bg-transparent border-none">
                            <TableCell colSpan={8} className="p-0 border-none">
                              <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={setCurrentPage}
                                totalEntries={totalEntries}
                                indexOfFirstEntry={indexOfFirstEntry}
                                indexOfLastEntry={indexOfLastEntry}
                                label="Transfer"
                              />
                            </TableCell>
                          </TableRow>
                        </>
                      );
                    })()
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detail Transfer */}
      <AnimatePresence>
        {selectedTransfer && (
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
                  <span className="text-[10px] font-black uppercase text-slate-400">Detail Transfer Stok</span>
                  <div className="flex items-center gap-2.5 mt-1">
                    <h3 className="text-lg font-mono font-bold text-slate-800 uppercase tracking-tighter">
                      TRF-{String(selectedTransfer.id).padStart(6, '0')}
                    </h3>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                      SUKSES
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedTransfer(null)}
                  className="w-9 h-9 p-0 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto space-y-6">
                {/* Meta Route Info */}
                <div className="p-5 bg-slate-50 border border-slate-100 rounded-3xl text-sm flex justify-between items-center relative overflow-hidden">
                  <div className="flex-1">
                    <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Cabang Pengirim</span>
                    <p className="font-extrabold text-slate-800 text-base">{selectedTransfer.sourceBranch.name}</p>
                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Tipe: {selectedTransfer.sourceBranch.type === 'WAREHOUSE' ? 'Gudang Pusat' : 'Retail POS'}</p>
                  </div>
                  <div className="px-4 text-emerald-600 flex flex-col items-center">
                    <Truck className="w-6 h-6 animate-pulse" />
                    <ArrowRight className="w-4 h-4" />
                  </div>
                  <div className="flex-1 text-right">
                    <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Cabang Penerima</span>
                    <p className="font-extrabold text-slate-800 text-base">{selectedTransfer.destinationBranch.name}</p>
                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Tipe: {selectedTransfer.destinationBranch.type === 'WAREHOUSE' ? 'Gudang Pusat' : 'Retail POS'}</p>
                  </div>
                </div>

                {/* Additional Info Grid */}
                <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-slate-500">
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100/50">
                    <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block mb-0.5">Tanggal Mutasi</span>
                    <p className="text-slate-800 font-bold">
                      {new Date(selectedTransfer.transferDate || new Date()).toLocaleDateString('id-ID', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100/50">
                    <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block mb-0.5">Petugas Operator</span>
                    <p className="text-slate-800 font-bold">{selectedTransfer.user?.fullName || 'Sistem'}</p>
                  </div>
                </div>

                {/* Items list */}
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">Daftar Obat Ditransfer</h4>
                  <div className="border border-slate-100 rounded-2xl overflow-hidden">
                    <Table>
                      <TableHeader className="bg-slate-50/50">
                        <TableRow>
                          <TableHead className="font-bold text-slate-500">Nama Produk</TableHead>
                          <TableHead className="font-bold text-slate-500">Nomor Batch</TableHead>
                          <TableHead className="font-bold text-slate-500 text-center">Exp. Date</TableHead>
                          <TableHead className="font-bold text-slate-500 text-right">Jumlah</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedTransfer.details?.map((detail) => (
                          <TableRow key={detail.id} className="hover:bg-slate-50/10">
                            <TableCell className="font-bold text-slate-800">
                              {detail.product.name}
                              <p className="text-[9px] font-mono text-slate-400 font-normal mt-0.5">SKU: {detail.product.sku}</p>
                            </TableCell>
                            <TableCell className="font-mono text-xs text-slate-600">{detail.batchNumber}</TableCell>
                            <TableCell className="text-center text-xs text-slate-500">
                              {detail.expiryDate ? new Date(detail.expiryDate).toLocaleDateString('id-ID') : '-'}
                            </TableCell>
                            <TableCell className="text-right font-black text-slate-800">{detail.quantity} Unit</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Notes if any */}
                {selectedTransfer.notes && (
                  <div className="bg-amber-50/30 border border-amber-100/50 p-4 rounded-2xl text-xs text-amber-800 flex gap-2">
                    <FileText className="w-4 h-4 shrink-0 text-amber-600" />
                    <div>
                      <span className="font-bold block mb-0.5">Catatan/Keterangan Dokumen:</span>
                      {selectedTransfer.notes}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StockTransferPage;
