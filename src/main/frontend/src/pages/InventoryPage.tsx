import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import api from '../api/api';
import { Button } from '../components/ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Pagination } from '../components/ui/Pagination';
import { Plus, Search, Package, History, ChevronDown, ChevronRight, Calendar, AlertCircle } from 'lucide-react';
import { Input } from '../components/ui/Input';
import { Dialog } from '../components/ui/Dialog';
import { Link, useSearchParams } from 'react-router-dom';
import { cn } from '../lib/utils';

const adjustmentSchema = z.object({
  productId: z.coerce.number().min(1, 'Pilih produk'),
  type: z.string().min(1, 'Pilih jenis pergerakan'),
  quantity: z.coerce.number().min(0.01, 'Kuantitas harus lebih dari 0'),
  batchNumber: z.string().optional(),
  expiryDate: z.string().optional(),
  referenceNumber: z.string().optional(),
  notes: z.string().optional()
});

type AdjustmentFormValues = z.infer<typeof adjustmentSchema>;

interface Branch {
  id: number;
  name: string;
}

interface Product {
  id: number;
  name: string;
  sku: string;
  sellingPrice: number;
  units: {
    id: number;
    unitName: string;
    conversionToBase: number;
    baseUnit: boolean;
  }[];
}

interface Inventory {
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

const formatStockBreakdown = (totalQty: number, units: any[]) => {
  if (!units || units.length === 0) return totalQty.toLocaleString();
  
  const sortedUnits = [...units].sort((a, b) => b.conversionToBase - a.conversionToBase);
  
  let remaining = totalQty;
  const parts: string[] = [];
  
  sortedUnits.forEach(unit => {
    const count = Math.floor(remaining / unit.conversionToBase);
    if (count > 0) {
      parts.push(`${count} ${unit.unitName}`);
      remaining %= unit.conversionToBase;
    }
  });
  
  return parts.length > 0 ? parts.join(', ') : `0 ${sortedUnits[sortedUnits.length - 1]?.unitName || ''}`;
};

const InventoryRow: React.FC<{
  inv: Inventory;
  selectedBranchId: string;
  handleOpenModal: (p: Product) => void;
}> = ({ inv, selectedBranchId, handleOpenModal }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { role } = useSelector((state: RootState) => state.auth);

  console.log(inv, "data inv")

  const { data: batches, isLoading } = useQuery<InventoryBatch[]>({
    queryKey: ['inventory', selectedBranchId, inv.product.id, 'batches'],
    queryFn: async () => {
      const res = await api.get(`/inventory/branch/${selectedBranchId}/product/${inv.product.id}/batches`);
      return res.data;
    },
    enabled: isExpanded,
  });

  const isExpired = (dateStr: string) => new Date(dateStr) < new Date();
  const isNearExpired = (dateStr: string) => {
    const date = new Date(dateStr);
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
    return date < threeMonthsFromNow && date >= new Date();
  };

  return (
    <>
      <TableRow className={cn("group", isExpanded && "bg-slate-50/50")}>
        <TableCell>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-slate-100 rounded-md transition-colors"
          >
            {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
          </button>
        </TableCell>
        <TableCell className="font-mono text-xs text-slate-500">{inv.product?.sku || '-'}</TableCell>
        <TableCell className="font-medium text-slate-800">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-slate-400" />
            {inv.product?.name || 'Produk Tidak Terdaftar'}
          </div>
        </TableCell>
        <TableCell className="text-right font-bold text-slate-700">
          {inv.stockQuantity?.toLocaleString() || '0'}
        </TableCell>
        <TableCell className="text-left text-xs font-medium text-slate-600">
          <div className="bg-slate-100 px-2 py-1 rounded-md inline-block">
            {formatStockBreakdown(inv.stockQuantity, inv.product?.units)}
          </div>
        </TableCell>
        <TableCell className="text-right text-sm font-medium text-emerald-600">
          {inv.product?.sellingPrice ? (
            <div className="flex flex-col items-end">
              <span>Rp {inv.product.sellingPrice.toLocaleString()}</span>
              <span className="text-[10px] text-slate-400 font-normal">Harga Jual</span>
            </div>
          ) : '-'}
        </TableCell>
        <TableCell className="text-center">
          {role !== 'CASHIER' && role !== 'KASIR' ? (
            <Button
              variant="ghost"
              size="sm"
              className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 h-8"
              onClick={() => handleOpenModal(inv.product)}
            >
              Sesuaikan
            </Button>
          ) : (
            <span className="text-slate-400 font-medium">-</span>
          )}
        </TableCell>
      </TableRow>
      {isExpanded && (
        <TableRow className="bg-slate-50/30 border-t-0">
          <TableCell colSpan={6} className="p-0">
            <div className="px-12 py-3 animate-in slide-in-from-top-2 duration-300">
              <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                <Table>
                  <TableHeader className="bg-slate-50/50">
                    <TableRow>
                      <TableHead className="h-8 text-[10px] uppercase font-bold text-slate-400">Batch Number</TableHead>
                      <TableHead className="h-8 text-[10px] uppercase font-bold text-slate-400">Expired Date</TableHead>
                      <TableHead className="h-8 text-[10px] uppercase font-bold text-slate-400 text-right">Stok</TableHead>
                      <TableHead className="h-8 text-[10px] uppercase font-bold text-slate-400 text-right">Harga Beli</TableHead>
                      <TableHead className="h-8 text-[10px] uppercase font-bold text-slate-400 text-right">Margin</TableHead>
                      <TableHead className="h-8 text-[10px] uppercase font-bold text-slate-400 text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow><TableCell colSpan={6} className="h-12 text-center text-xs text-slate-400">Memuat batch...</TableCell></TableRow>
                    ) : batches?.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="h-12 text-center text-xs text-slate-400">Tidak ada data batch.</TableCell></TableRow>
                    ) : (
                      batches?.map(batch => (
                        <TableRow key={batch.id} className="h-10 hover:bg-slate-50/50">
                          <TableCell className="text-sm font-mono text-slate-600">{batch.batchNumber}</TableCell>
                          <TableCell className="text-sm text-slate-500">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5" />
                              {new Date(batch.expiryDate).toLocaleDateString('id-ID')}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm font-bold text-slate-700 text-right">{batch.currentQuantity.toLocaleString()}</TableCell>
                          <TableCell className="text-sm text-slate-600 text-right">
                            Rp {batch.purchasePrice?.toLocaleString() || '0'}
                          </TableCell>
                          <TableCell className="text-sm text-right">
                            {inv.product.sellingPrice > 0 && batch.purchasePrice > 0 ? (
                              <span className={cn(
                                "font-bold",
                                ((inv.product.sellingPrice - batch.purchasePrice) / inv.product.sellingPrice * 100) > 20 ? "text-emerald-600" : "text-amber-600"
                              )}>
                                {(((inv.product.sellingPrice - batch.purchasePrice) / inv.product.sellingPrice) * 100).toFixed(1)}%
                              </span>
                            ) : '-'}
                          </TableCell>
                          <TableCell className="text-center">
                            {isExpired(batch.expiryDate) ? (
                              <span className="flex items-center justify-center gap-1 text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
                                <AlertCircle className="w-3 h-3" /> EXPIRED
                              </span>
                            ) : isNearExpired(batch.expiryDate) ? (
                              <span className="flex items-center justify-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                                <AlertCircle className="w-3 h-3" /> SEGERA EXP
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">AMAN</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
};

const InventoryPage: React.FC = () => {
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const queryClient = useQueryClient();
  const { role } = useSelector((state: RootState) => state.auth);

  const [searchParams, setSearchParams] = useSearchParams();
  const [stockFilter, setStockFilter] = useState<'ALL' | 'LOW_STOCK'>(() => {
    return searchParams.get('filter') === 'low-stock' ? 'LOW_STOCK' : 'ALL';
  });

  const [currentPage, setCurrentPage] = useState(1);
  const entriesPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, stockFilter, selectedBranchId]);

  const handleFilterChange = (filter: 'ALL' | 'LOW_STOCK') => {
    setStockFilter(filter);
    if (filter === 'LOW_STOCK') {
      setSearchParams({ filter: 'low-stock' });
    } else {
      setSearchParams({});
    }
  };

  const { register, handleSubmit, reset, formState: { errors } } = useForm<AdjustmentFormValues>({
    resolver: zodResolver(adjustmentSchema),
    defaultValues: {
      type: 'IN',
      quantity: 0
    }
  });

  const { data: branches } = useQuery<Branch[]>({
    queryKey: ['branches'],
    queryFn: async () => {
      const res = await api.get('/branches');
      return res.data;
    },
  });

  const { data: products } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await api.get('/products');
      return res.data;
    },
  });

  useEffect(() => {
    if (branches && branches.length > 0 && !selectedBranchId) {
      setSelectedBranchId(branches[0].id.toString());
    }
  }, [branches, selectedBranchId]);

  const { data: inventory, isLoading } = useQuery<Inventory[]>({
    queryKey: ['inventory', selectedBranchId],
    queryFn: async () => {
      if (!selectedBranchId) return [];
      const res = await api.get(`/inventory/branch/${selectedBranchId}`);
      return res.data;
    },
    enabled: !!selectedBranchId,
  });

  const movementMutation = useMutation({
    mutationFn: (data: AdjustmentFormValues) =>
      api.post('/inventory/movement', {
        ...data,
        branchId: Number(selectedBranchId),
        expiryDate: data.expiryDate || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory', selectedBranchId] });
      alert('Mutasi stok berhasil disimpan');
      handleCloseModal();
    },
    onError: (error: any) => {
      alert('Gagal menyimpan mutasi: ' + (error.response?.data?.message || error.message));
    }
  });

  const handleOpenModal = (product?: Product) => {
    reset({
      type: 'IN',
      quantity: 0,
      productId: product?.id || 0,
    });
    setSelectedProductId(product?.id || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProductId(null);
    reset();
  };

  const onSubmit = (data: AdjustmentFormValues) => {
    movementMutation.mutate(data);
  };

  const filteredInventory = inventory?.filter(inv => {
    if (!inv.product) return false;
    
    const search = searchTerm.toLowerCase();
    const nameMatch = inv.product.name?.toLowerCase().includes(search);
    const skuMatch = inv.product.sku?.toLowerCase().includes(search);
    if (!nameMatch && !skuMatch) return false;

    if (stockFilter === 'LOW_STOCK' && inv.stockQuantity >= 10) {
      return false;
    }

    return true;
  }).sort((a, b) => b.id - a.id);

  const totalEntries = filteredInventory?.length || 0;
  const totalPages = Math.ceil(totalEntries / entriesPerPage);
  const indexOfLastEntry = currentPage * entriesPerPage;
  const indexOfFirstEntry = indexOfLastEntry - entriesPerPage;
  const currentEntries = filteredInventory?.slice(indexOfFirstEntry, indexOfLastEntry) || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Inventory & Stok</h1>
          <p className="text-slate-500 text-sm">Kelola stok barang per cabang apotek.</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            className="h-10 px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            value={selectedBranchId}
            onChange={(e) => setSelectedBranchId(e.target.value)}
          >
            <option value="" disabled>Pilih Cabang</option>
            {branches?.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>

          {selectedBranchId && (
            <Link to={`/dashboard/inventory/movements?branch=${selectedBranchId}`}>
              <Button variant="outline" className="flex items-center gap-2">
                <History className="w-4 h-4" />
                Riwayat Mutasi
              </Button>
            </Link>
          )}

          {role !== 'CASHIER' && role !== 'KASIR' && (
            <Button
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-100"
              onClick={() => handleOpenModal()}
              disabled={!selectedBranchId}
            >
              <Plus className="w-4 h-4" />
              Sesuaikan Stok
            </Button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Cari SKU atau nama produk..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-100 self-start sm:self-auto shrink-0">
            <button
              onClick={() => handleFilterChange('ALL')}
              className={cn(
                "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                stockFilter === 'ALL'
                  ? "bg-white text-slate-800 shadow-sm border border-slate-100/50"
                  : "text-slate-500 hover:text-slate-800"
              )}
            >
              Semua Barang
            </button>
            <button
              onClick={() => handleFilterChange('LOW_STOCK')}
              className={cn(
                "px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5",
                stockFilter === 'LOW_STOCK'
                  ? "bg-rose-500 text-white shadow-sm shadow-rose-100"
                  : "text-slate-500 hover:text-rose-500"
              )}
            >
              <AlertCircle className="w-3.5 h-3.5" />
              Stok Menipis (&lt; 10)
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]"></TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Nama Produk</TableHead>
                <TableHead className="text-right">Stok Total</TableHead>
                <TableHead className="text-left">Kemasan (Pecahan)</TableHead>
                <TableHead className="text-right">Harga Jual</TableHead>
                <TableHead className="text-center">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-slate-400">
                    Memuat data...
                  </TableCell>
                </TableRow>
              ) : filteredInventory?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-slate-400">
                    Tidak ada data inventori.
                  </TableCell>
                </TableRow>
              ) : (
                currentEntries?.map((inv) => (
                  <InventoryRow
                    key={inv.id}
                    inv={inv}
                    selectedBranchId={selectedBranchId}
                    handleOpenModal={handleOpenModal}
                  />
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
          label="Inventori"
        />
      </div>

      <Dialog
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title="Penyesuaian Stok"
        footer={
          <>
            <Button variant="outline" onClick={handleCloseModal}>Batal</Button>
            <Button
              onClick={handleSubmit(onSubmit)}
              disabled={movementMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {movementMutation.isPending ? 'Menyimpan...' : 'Simpan Mutasi'}
            </Button>
          </>
        }
      >
        <form className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Produk</label>
            <select
              {...register('productId')}
              className="w-full h-10 px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              disabled={!!selectedProductId}
            >
              <option value="0" disabled>Pilih Produk</option>
              {products?.map(p => (
                <option key={p.id} value={p.id}>{p.sku} - {p.name}</option>
              ))}
            </select>
            {errors.productId && <p className="text-xs text-red-500">{errors.productId.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Tipe Mutasi</label>
              <select
                {...register('type')}
                className="w-full h-10 px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="IN">Masuk (IN)</option>
                <option value="OUT">Keluar (OUT)</option>
                <option value="ADJUSTMENT">Penyesuaian (ADJUSTMENT)</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Kuantitas</label>
              <Input
                type="number"
                step="0.01"
                {...register('quantity')}
                className={errors.quantity ? 'border-red-500' : ''}
              />
              {errors.quantity && <p className="text-xs text-red-500">{errors.quantity.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Nomor Batch (Opsional)</label>
              <Input {...register('batchNumber')} placeholder="Batch..." />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Tanggal Expired (Opsional)</label>
              <Input type="date" {...register('expiryDate')} />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">No. Referensi (Opsional)</label>
            <Input {...register('referenceNumber')} placeholder="PO/Invoice/dll" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Catatan (Opsional)</label>
            <Input {...register('notes')} placeholder="Keterangan mutasi" />
          </div>
        </form>
      </Dialog>
    </div>
  );
};

export default InventoryPage;
