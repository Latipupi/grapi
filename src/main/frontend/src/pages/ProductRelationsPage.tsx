import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/api';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Dialog } from '../components/ui/Dialog';
import { toast } from '../components/ui/Toast';
import { 
  Sparkles, 
  Plus, 
  Trash2, 
  Search, 
  RefreshCw, 
  TrendingUp, 
  Link as LinkIcon, 
  Info,
  X
} from 'lucide-react';
import { cn } from '../lib/utils';

interface Product {
  id: number;
  name: string;
  sku: string;
  unit?: string;
  sellingPrice?: number;
  activeSubstance?: string;
  category?: {
    id: number;
    name: string;
  };
}

interface ProductRecommendation {
  id: number;
  relationType: 'SUBSTITUTION' | 'UP_SELLING' | 'LINK_SELLING';
  notes?: string;
  createdAt: string;
  sourceProduct: Product;
  targetProduct: Product;
}

const ProductSearchSelect: React.FC<{
  label: string;
  products: Product[];
  selectedId: number | null;
  onSelect: (product: Product | null) => void;
  excludeId?: number | null;
}> = ({ label, products, selectedId, onSelect, excludeId }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const selectedProduct = products.find(p => p.id === selectedId);

  const filtered = useMemo(() => {
    return products
      .filter(p => p.id !== excludeId)
      .filter(p => {
        const term = searchTerm.toLowerCase();
        return p.name.toLowerCase().includes(term) || (p.sku && p.sku.toLowerCase().includes(term));
      })
      .slice(0, 50);
  }, [products, searchTerm, excludeId]);

  return (
    <div className="space-y-1.5 relative">
      <label className="text-xs font-bold text-slate-700">{label}</label>
      <div className="relative">
        <Input
          placeholder={selectedProduct ? selectedProduct.name : "Cari nama obat atau SKU..."}
          value={isOpen ? searchTerm : (selectedProduct ? `${selectedProduct.name} (${selectedProduct.sku || '-'})` : '')}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            setSearchTerm('');
            setIsOpen(true);
          }}
          className={cn(
            "pr-8 h-11 rounded-xl text-sm font-medium",
            selectedProduct && !isOpen ? "border-emerald-500 bg-emerald-50/30 text-emerald-900 font-bold" : ""
          )}
        />
        {selectedProduct && !isOpen ? (
          <button
            type="button"
            onClick={() => {
              onSelect(null);
              setSearchTerm('');
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-500"
          >
            <X className="w-4 h-4" />
          </button>
        ) : (
          <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        )}
      </div>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-56 overflow-y-auto p-1 divide-y divide-slate-50">
            {filtered.length === 0 ? (
              <div className="p-3 text-xs text-slate-400 text-center italic">Tidak ada obat ditemukan</div>
            ) : (
              filtered.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className="w-full text-left px-3 py-2.5 text-xs hover:bg-slate-50 rounded-lg flex items-center justify-between transition-colors group"
                  onClick={() => {
                    onSelect(p);
                    setIsOpen(false);
                    setSearchTerm('');
                  }}
                >
                  <div className="min-w-0 pr-2">
                    <p className="font-bold text-slate-800 truncate group-hover:text-emerald-600">{p.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono">SKU: {p.sku} {p.activeSubstance ? `• Zat: ${p.activeSubstance}` : ''}</p>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-600 shrink-0">
                    Rp {p.sellingPrice?.toLocaleString('id-ID') || '0'}
                  </span>
                </button>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
};

const ProductRelationsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'SUBSTITUTION' | 'UP_SELLING' | 'LINK_SELLING'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [sourceProduct, setSourceProduct] = useState<Product | null>(null);
  const [targetProduct, setTargetProduct] = useState<Product | null>(null);
  const [relationType, setRelationType] = useState<'SUBSTITUTION' | 'UP_SELLING' | 'LINK_SELLING'>('SUBSTITUTION');
  const [notes, setNotes] = useState('');

  // Fetch Products
  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: () => api.get('/products').then(res => res.data),
  });

  // Fetch Recommendations
  const { data: recommendations = [], isLoading } = useQuery<ProductRecommendation[]>({
    queryKey: ['product-recommendations'],
    queryFn: () => api.get('/product-recommendations').then(res => res.data),
  });

  // Mutation Create
  const createMutation = useMutation({
    mutationFn: (payload: { sourceProductId: number; targetProductId: number; relationType: string; notes: string }) =>
      api.post('/product-recommendations', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-recommendations'] });
      toast.success('Relasi produk berhasil ditambahkan!');
      setIsModalOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Gagal menambahkan relasi produk.');
    },
  });

  // Mutation Delete
  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/product-recommendations/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-recommendations'] });
      toast.success('Relasi produk berhasil dihapus.');
    },
    onError: () => {
      toast.error('Gagal menghapus relasi produk.');
    },
  });

  const resetForm = () => {
    setSourceProduct(null);
    setTargetProduct(null);
    setRelationType('SUBSTITUTION');
    setNotes('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceProduct || !targetProduct) {
      toast.error('Silakan pilih produk utama dan produk rekomendasi.');
      return;
    }
    if (sourceProduct.id === targetProduct.id) {
      toast.error('Produk rekomendasi tidak boleh sama dengan produk utama.');
      return;
    }
    createMutation.mutate({
      sourceProductId: sourceProduct.id,
      targetProductId: targetProduct.id,
      relationType,
      notes,
    });
  };

  const filteredList = useMemo(() => {
    return recommendations.filter(item => {
      if (activeFilter !== 'ALL' && item.relationType !== activeFilter) return false;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const sName = item.sourceProduct?.name?.toLowerCase() || '';
        const sSku = item.sourceProduct?.sku?.toLowerCase() || '';
        const tName = item.targetProduct?.name?.toLowerCase() || '';
        const tSku = item.targetProduct?.sku?.toLowerCase() || '';
        const n = item.notes?.toLowerCase() || '';
        return sName.includes(term) || sSku.includes(term) || tName.includes(term) || tSku.includes(term) || n.includes(term);
      }
      return true;
    });
  }, [recommendations, activeFilter, searchTerm]);

  const counts = useMemo(() => {
    return {
      all: recommendations.length,
      sub: recommendations.filter(r => r.relationType === 'SUBSTITUTION').length,
      up: recommendations.filter(r => r.relationType === 'UP_SELLING').length,
      link: recommendations.filter(r => r.relationType === 'LINK_SELLING').length,
    };
  }, [recommendations]);

  const getRelationBadge = (type: string) => {
    switch (type) {
      case 'SUBSTITUTION':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <RefreshCw className="w-3 h-3" /> Substitusi Obat
          </span>
        );
      case 'UP_SELLING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <TrendingUp className="w-3 h-3" /> Up-Selling
          </span>
        );
      case 'LINK_SELLING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200">
            <LinkIcon className="w-3 h-3" /> Link-Selling
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-emerald-600" />
            Relasi & Rekomendasi Obat
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Atur rekomendasi otomatis saat kasir POS melayani pelanggan: substitusi obat saat stok kosong, up-selling, dan produk pendamping (link-selling).
          </p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11 px-5 rounded-xl shadow-lg shadow-emerald-500/10 flex items-center gap-2 self-start sm:self-auto shrink-0"
        >
          <Plus className="w-4 h-4" />
          Tambah Relasi Obat
        </Button>
      </div>

      {/* Info Banner */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 rounded-2xl p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-600 space-y-1">
          <p className="font-bold text-emerald-950">Cara Kerja Rekomendasi Pintar di Layar Kasir POS:</p>
          <p>
            • <b>Substitusi Obat</b>: Otomatis muncul di Kasir POS jika kasir memilih obat yang <b>stoknya kosong (0)</b> atau stok menipis, menyarankan alternatif obat pengganti yang stoknya ready di cabang tersebut.
          </p>
          <p>
            • <b>Up-Selling & Link-Selling</b>: Muncul sebagai saran pelengkap di samping keranjang belanja kasir untuk meningkatkan omset dan kelengkapan terapi pasien.
          </p>
        </div>
      </div>

      {/* Metrics & Filter Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          onClick={() => setActiveFilter('ALL')}
          className={cn(
            "p-4 rounded-2xl border text-left transition-all",
            activeFilter === 'ALL'
              ? "bg-slate-900 text-white border-slate-900 shadow-md"
              : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
          )}
        >
          <p className={cn("text-xs font-bold", activeFilter === 'ALL' ? "text-slate-400" : "text-slate-500")}>Total Relasi</p>
          <h3 className="text-2xl font-black mt-1">{counts.all}</h3>
        </button>

        <button
          onClick={() => setActiveFilter('SUBSTITUTION')}
          className={cn(
            "p-4 rounded-2xl border text-left transition-all",
            activeFilter === 'SUBSTITUTION'
              ? "bg-amber-500 text-white border-amber-500 shadow-md"
              : "bg-white text-slate-700 border-slate-200 hover:border-amber-300"
          )}
        >
          <p className={cn("text-xs font-bold", activeFilter === 'SUBSTITUTION' ? "text-amber-100" : "text-amber-600")}>🔄 Substitusi (Stok 0)</p>
          <h3 className="text-2xl font-black mt-1">{counts.sub}</h3>
        </button>

        <button
          onClick={() => setActiveFilter('UP_SELLING')}
          className={cn(
            "p-4 rounded-2xl border text-left transition-all",
            activeFilter === 'UP_SELLING'
              ? "bg-emerald-600 text-white border-emerald-600 shadow-md"
              : "bg-white text-slate-700 border-slate-200 hover:border-emerald-300"
          )}
        >
          <p className={cn("text-xs font-bold", activeFilter === 'UP_SELLING' ? "text-emerald-100" : "text-emerald-600")}>📈 Up-Selling (Hemat/Besar)</p>
          <h3 className="text-2xl font-black mt-1">{counts.up}</h3>
        </button>

        <button
          onClick={() => setActiveFilter('LINK_SELLING')}
          className={cn(
            "p-4 rounded-2xl border text-left transition-all",
            activeFilter === 'LINK_SELLING'
              ? "bg-sky-600 text-white border-sky-600 shadow-md"
              : "bg-white text-slate-700 border-slate-200 hover:border-sky-300"
          )}
        >
          <p className={cn("text-xs font-bold", activeFilter === 'LINK_SELLING' ? "text-sky-100" : "text-sky-600")}>🔗 Link-Selling (Pendamping)</p>
          <h3 className="text-2xl font-black mt-1">{counts.link}</h3>
        </button>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Cari produk utama atau produk rekomendasi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-10 rounded-xl text-sm"
            />
          </div>
          <span className="text-xs font-semibold text-slate-400">
            Menampilkan {filteredList.length} dari {recommendations.length} aturan relasi
          </span>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produk Utama (Sumber)</TableHead>
                <TableHead className="text-center">Tipe Rekomendasi</TableHead>
                <TableHead>Produk Rekomendasi (Tujuan)</TableHead>
                <TableHead>Catatan / Tips Kasir</TableHead>
                <TableHead className="text-center w-20">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-slate-400">
                    Memuat data relasi obat...
                  </TableCell>
                </TableRow>
              ) : filteredList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-slate-400">
                    Belum ada aturan relasi produk yang ditambahkan.
                  </TableCell>
                </TableRow>
              ) : (
                filteredList.map((item) => (
                  <TableRow key={item.id} className="hover:bg-slate-50/50">
                    <TableCell>
                      <div>
                        <p className="font-bold text-slate-800">{item.sourceProduct?.name}</p>
                        <p className="text-xs text-slate-400 font-mono">
                          SKU: {item.sourceProduct?.sku || '-'} {item.sourceProduct?.activeSubstance ? `• Zat: ${item.sourceProduct?.activeSubstance}` : ''}
                        </p>
                      </div>
                    </TableCell>

                    <TableCell className="text-center">
                      {getRelationBadge(item.relationType)}
                    </TableCell>

                    <TableCell>
                      <div>
                        <p className="font-bold text-slate-800">{item.targetProduct?.name}</p>
                        <p className="text-xs text-slate-400 font-mono">
                          SKU: {item.targetProduct?.sku || '-'} • Rp {item.targetProduct?.sellingPrice?.toLocaleString('id-ID') || '0'}
                        </p>
                      </div>
                    </TableCell>

                    <TableCell>
                      <span className="text-xs text-slate-600 italic">
                        {item.notes || '-'}
                      </span>
                    </TableCell>

                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (confirm(`Hapus relasi rekomendasi antara ${item.sourceProduct?.name} dan ${item.targetProduct?.name}?`)) {
                            deleteMutation.mutate(item.id);
                          }
                        }}
                        className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg p-2"
                        title="Hapus Relasi"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Modal Add Relation */}
      <Dialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Tambah Aturan Relasi Obat"
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Source Product */}
          <ProductSearchSelect
            label="1. Pilih Produk Utama (Obat yang dicari pelanggan):"
            products={products}
            selectedId={sourceProduct?.id || null}
            onSelect={setSourceProduct}
            excludeId={targetProduct?.id || null}
          />

          {/* Relation Type */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">2. Pilih Tipe Relasi Rekomendasi:</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setRelationType('SUBSTITUTION')}
                className={cn(
                  "p-3 rounded-xl border text-left flex flex-col items-start gap-1 transition-all",
                  relationType === 'SUBSTITUTION'
                    ? "bg-amber-50 border-amber-500 text-amber-900 ring-2 ring-amber-200"
                    : "border-slate-200 hover:bg-slate-50 text-slate-700"
                )}
              >
                <div className="flex items-center gap-1 font-bold text-xs">
                  <RefreshCw className="w-3.5 h-3.5 text-amber-600" />
                  Substitusi
                </div>
                <span className="text-[10px] text-slate-500 leading-tight">Pengganti saat stok 0 / generik alternatif</span>
              </button>

              <button
                type="button"
                onClick={() => setRelationType('UP_SELLING')}
                className={cn(
                  "p-3 rounded-xl border text-left flex flex-col items-start gap-1 transition-all",
                  relationType === 'UP_SELLING'
                    ? "bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-200"
                    : "border-slate-200 hover:bg-slate-50 text-slate-700"
                )}
              >
                <div className="flex items-center gap-1 font-bold text-xs">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                  Up-Selling
                </div>
                <span className="text-[10px] text-slate-500 leading-tight">Kemasan lebih besar / formula ekstra</span>
              </button>

              <button
                type="button"
                onClick={() => setRelationType('LINK_SELLING')}
                className={cn(
                  "p-3 rounded-xl border text-left flex flex-col items-start gap-1 transition-all",
                  relationType === 'LINK_SELLING'
                    ? "bg-sky-50 border-sky-500 text-sky-900 ring-2 ring-sky-200"
                    : "border-slate-200 hover:bg-slate-50 text-slate-700"
                )}
              >
                <div className="flex items-center gap-1 font-bold text-xs">
                  <LinkIcon className="w-3.5 h-3.5 text-sky-600" />
                  Link-Selling
                </div>
                <span className="text-[10px] text-slate-500 leading-tight">Produk pendamping / komplementer</span>
              </button>
            </div>
          </div>

          {/* Target Product */}
          <ProductSearchSelect
            label="3. Pilih Produk Rekomendasi (Obat yang disarankan kasir):"
            products={products}
            selectedId={targetProduct?.id || null}
            onSelect={setTargetProduct}
            excludeId={sourceProduct?.id || null}
          />

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">4. Catatan / Alasan Saran untuk Kasir (Opsional):</label>
            <Input
              placeholder="Contoh: Kandungan sama 500mg, lebih hemat Rp 5.000, diminum bersama vitamin C"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="h-10 rounded-xl text-xs"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              className="flex-1 rounded-xl"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl"
            >
              {createMutation.isPending ? 'Menyimpan...' : 'Simpan Relasi'}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};

export default ProductRelationsPage;
