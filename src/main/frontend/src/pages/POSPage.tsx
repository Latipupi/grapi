import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../store';
import { 
  addToCart, 
  removeFromCart, 
  updateQuantity, 
  clearCart, 
  setCustomer, 
  setPaymentMethod 
} from '../store/posSlice';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { 
  Search, 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  User, 
  CreditCard, 
  Receipt, 
  Package,
  CheckCircle2,
  AlertTriangle,
  Lock,
  LogOut
} from 'lucide-react';
import { Dialog } from '../components/ui/Dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

const POSPage: React.FC = () => {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const { cart, customerId, paymentMethod } = useSelector((state: RootState) => state.pos);
  const { branchId, userId } = useSelector((state: RootState) => state.auth);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBranchId, setSelectedBranchId] = useState<string>(branchId?.toString() || '');
  const [successOrder, setSuccessOrder] = useState<any>(null);
  const [unitSelectionProduct, setUnitSelectionProduct] = useState<any>(null);

  // Shift Management States
  const [startingCash, setStartingCash] = useState<string>('0');
  const [closeShiftModalOpen, setCloseShiftModalOpen] = useState(false);
  const [endingCashInput, setEndingCashInput] = useState<string>('0');
  const [closedShiftSummary, setClosedShiftSummary] = useState<any>(null);

  // Query Active Shift
  const { data: activeShift, isLoading: isLoadingShift } = useQuery({
    queryKey: ['activeShift', userId, selectedBranchId],
    queryFn: () => {
      const activeBranch = selectedBranchId || branchId?.toString() || '';
      return api.get(`/shifts/current?userId=${userId}${activeBranch ? `&branchId=${activeBranch}` : ''}`).then(res => {
        return res.status === 204 ? null : res.data;
      });
    },
    enabled: !!userId
  });

  // Open Shift Mutation
  const openShiftMutation = useMutation({
    mutationFn: (startingCashVal: number) => api.post('/shifts/open', {
      userId,
      branchId: parseInt(selectedBranchId || branchId?.toString() || '0'),
      startingCash: startingCashVal
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeShift'] });
      setStartingCash('0');
    },
    onError: (err: any) => {
      alert(err.response?.data || "Gagal membuka shift");
    }
  });

  // Close Shift Mutation
  const closeShiftMutation = useMutation({
    mutationFn: (endingCashVal: number) => api.post(`/shifts/close?userId=${userId}`, {
      endingCash: endingCashVal
    }),
    onSuccess: (res) => {
      setClosedShiftSummary(res.data);
      queryClient.invalidateQueries({ queryKey: ['activeShift'] });
      setCloseShiftModalOpen(false);
      setEndingCashInput('0');
      dispatch(clearCart());
    },
    onError: (err: any) => {
      alert(err.response?.data || "Gagal menutup shift");
    }
  });

  const { data: inventory } = useQuery({
    queryKey: ['inventory', selectedBranchId],
    queryFn: () => api.get(`/inventory/branch/${selectedBranchId}`).then(res => res.data),
    enabled: !!selectedBranchId && !!activeShift
  });

  const { data: branches } = useQuery<any[]>({
    queryKey: ['branches'],
    queryFn: () => api.get('/branches').then(res => res.data),
    enabled: !branchId
  });

  const { data: customers } = useQuery({
    queryKey: ['customers'],
    queryFn: () => api.get('/customers').then(res => res.data)
  });

  const saleMutation = useMutation({
    mutationFn: (payload: any) => api.post('/sales', payload),
    onSuccess: (res) => {
      setSuccessOrder(res.data);
      dispatch(clearCart());
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
    onError: (err: any) => {
      alert(err.response?.data || "Gagal memproses transaksi");
    }
  });

  const filteredProducts = inventory?.filter((inv: any) => {
    const search = searchTerm.toLowerCase();
    const name = inv.product?.name?.toLowerCase() || '';
    const sku = inv.product?.sku?.toLowerCase() || '';
    return name.includes(search) || sku.includes(search);
  });

  const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const handleCheckout = () => {
    if (cart.length === 0) return;
    if (paymentMethod === 'HUTANG' && !customerId) {
      alert("Pelanggan (Customer) wajib dipilih untuk transaksi dengan metode Hutang Tempo!");
      return;
    }
    const payload = {
      branchId: parseInt(selectedBranchId || branchId?.toString() || '0'),
      userId,
      customerId,
      paymentMethod,
      items: cart.map(item => ({
        productId: item.productId,
        unitId: item.unitId,
        quantity: item.quantity,
        unitPrice: item.price
      }))
    };
    saleMutation.mutate(payload);
  };

  const handlePrintReceipt = (sale: any) => {
    if (!sale) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const htmlContent = `
      <html>
        <head>
          <title>Struk Belanja - #SAL-${sale.id}</title>
          <style>
            body { font-family: 'Courier New', Courier, monospace; width: 300px; margin: 0 auto; padding: 20px; font-size: 12px; line-height: 1.4; color: #000; }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .bold { font-weight: bold; }
            .header { border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
            .header h2 { margin: 0; font-size: 16px; }
            .header p { margin: 3px 0 0; font-size: 10px; }
            .meta { border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 10px; font-size: 10px; }
            .meta p { margin: 3px 0; }
            .items { border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
            .item-row { display: flex; justify-content: space-between; margin-bottom: 5px; }
            .item-name { width: 60%; }
            .item-sub { display: flex; justify-content: space-between; font-size: 9px; margin-top: -3px; color: #555; }
            .totals { border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
            .total-row { display: flex; justify-content: space-between; margin: 3px 0; }
            .footer { font-size: 10px; margin-top: 15px; }
          </style>
        </head>
        <body>
          <div class="header text-center">
            <h2>G-APOTEK</h2>
            <p>${sale.branch?.name || 'Cabang Utama'}</p>
            <p>Telp: (021) 1234567</p>
          </div>
          
          <div class="meta">
            <p>No: #SAL-${sale.id}</p>
            <p>Tgl: ${new Date(sale.saleDate || sale.createdAt).toLocaleString('id-ID')}</p>
            <p>Kasir: ${sale.user?.fullName || 'Kasir'}</p>
            <p>Pelanggan: ${sale.customer?.name || 'Umum'}</p>
          </div>

          <div class="items">
            ${sale.details ? sale.details.map((detail: any) => `
              <div class="item-row">
                <span class="item-name">${detail.product?.name}</span>
                <span class="bold">Rp ${detail.subtotal.toLocaleString()}</span>
              </div>
              <div class="item-sub">
                <span>${detail.quantity} x Rp ${detail.unitPrice.toLocaleString()}</span>
                <span>Batch: ${detail.batch?.batchNumber || '-'}</span>
              </div>
            `).join('') : '<p class="text-center">Tidak ada item</p>'}
          </div>

          <div class="totals">
            <div class="total-row bold">
              <span>TOTAL</span>
              <span>Rp ${sale.totalAmount.toLocaleString()}</span>
            </div>
            <div class="total-row">
              <span>Metode Bayar</span>
              <span>${sale.paymentMethod}</span>
            </div>
            <div class="total-row">
              <span>Status</span>
              <span>${sale.status === 'COMPLETED' ? 'LUNAS' : 'DIBATALKAN'}</span>
            </div>
          </div>

          <div class="footer text-center">
            <p>Terima Kasih atas Kunjungan Anda</p>
            <p>Semoga Lekas Sembuh</p>
          </div>

          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  if (isLoadingShift) {
    return (
      <div className="flex h-[calc(100vh-100px)] items-center justify-center bg-white rounded-3xl border border-slate-100 shadow-sm">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-500 text-sm font-bold">Memuat status sesi kasir...</p>
        </div>
      </div>
    );
  }

  const isShiftActive = !!activeShift;

  return (
    <div className="relative h-[calc(100vh-100px)] overflow-hidden">
      {/* Background POS UI (Blurred when locked) */}
      <div className={cn(
        "flex h-full gap-6 transition-all duration-500",
        !isShiftActive && "blur-md pointer-events-none select-none opacity-50"
      )}>
        {/* Product Selection Side */}
        <div className="flex-1 flex flex-col min-w-0 bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Package className="w-5 h-5 text-emerald-600" />
                Pilih Produk
              </h1>
              <div className="flex items-center gap-2">
                {activeShift && (
                  <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-2xl shadow-sm shrink-0">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
                    <div className="text-left leading-tight shrink-0 hidden sm:block">
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Sesi Kasir Aktif</p>
                      <p className="text-[10px] font-black text-emerald-800">Rp {activeShift.startingCash?.toLocaleString()}</p>
                    </div>
                    <Button 
                      variant="outline"
                      onClick={() => {
                        setEndingCashInput('0');
                        setCloseShiftModalOpen(true);
                      }}
                      className="h-7 px-2 border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 text-[9px] font-black gap-1.5 rounded-xl shadow-sm shrink-0 uppercase tracking-wider ml-1"
                    >
                      <LogOut className="w-3 h-3" />
                      Tutup Sesi
                    </Button>
                  </div>
                )}

                {!branchId ? (
                  <select
                    className="h-8 px-2 bg-slate-100 border-none rounded-lg text-xs font-bold text-slate-600 focus:ring-0 cursor-pointer"
                    value={selectedBranchId}
                    onChange={(e) => setSelectedBranchId(e.target.value)}
                  >
                    <option value="">Pilih Cabang</option>
                    {branches?.map(b => (
                      <option key={b.id} value={b.id.toString()}>{b.name}</option>
                    ))}
                  </select>
                ) : (
                  <span className="text-xs font-medium text-slate-400 bg-slate-50 px-3 py-1 rounded-full uppercase tracking-wider shrink-0">
                     Branch ID: {branchId}
                  </span>
                )}
              </div>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input 
                placeholder="Cari SKU atau Nama Produk (Tekan Enter untuk scan)..." 
                className="pl-11 h-12 bg-slate-50 border-transparent focus:bg-white focus:ring-emerald-500 text-base"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 no-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredProducts?.map((inv: any) => (
                <motion.div 
                  layout
                  key={inv.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2 }}
                  whileHover={{ y: -4, shadow: "0 10px 25px -5px rgba(16, 185, 129, 0.1)" }}
                  className="p-4 rounded-2xl border border-slate-100 hover:border-emerald-200 hover:shadow-md transition-all cursor-pointer group bg-white"
                  onClick={() => {
                     if (inv.stockQuantity > 0) {
                        setUnitSelectionProduct(inv);
                     }
                  }}
                >
                  <div className="flex flex-col h-full justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{inv.product.sku}</span>
                      <h3 className="font-bold text-slate-800 line-clamp-2 leading-tight group-hover:text-emerald-600 transition-colors">{inv.product.name}</h3>
                    </div>
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Stok: {inv.stockQuantity}</p>
                        <p className="text-emerald-600 font-extrabold text-lg">Rp {inv.product.sellingPrice.toLocaleString()}</p>
                      </div>
                      <div className={inv.stockQuantity > 0 ? "text-emerald-500" : "text-rose-500"}>
                         {inv.stockQuantity > 0 ? <Plus className="w-6 h-6" /> : <AlertTriangle className="w-5 h-5" />}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Cart & Checkout Side */}
        <div className="w-[400px] flex flex-col bg-slate-900 rounded-3xl shadow-2xl overflow-hidden text-white shrink-0">
          <div className="p-6 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <ShoppingCart className="w-5 h-5 text-white" />
               </div>
               <h2 className="font-bold text-lg">Keranjang</h2>
            </div>
            <button 
              onClick={() => dispatch(clearCart())}
              className="text-xs text-white/40 hover:text-rose-400 transition-colors uppercase font-bold tracking-widest"
            >
              Bersihkan
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
            <AnimatePresence initial={false}>
              {cart.map((item) => (
                <motion.div 
                  key={`${item.productId}-${item.unitId}`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="p-3 bg-white/5 rounded-2xl border border-white/5 flex flex-col gap-3"
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0">
                      <h4 className="text-sm font-semibold text-white truncate">{item.name}</h4>
                      <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">{item.unitName}</p>
                      <p className="text-[10px] text-white/40">Rp {item.price.toLocaleString()}</p>
                    </div>
                    <button 
                      onClick={() => dispatch(removeFromCart({ productId: item.productId, unitId: item.unitId }))}
                      className="p-1 hover:text-rose-400 text-white/20 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center bg-white/10 rounded-lg p-0.5">
                      <button 
                        className="p-1 hover:bg-white/10 rounded-md transition-colors"
                        onClick={() => dispatch(updateQuantity({ productId: item.productId, unitId: item.unitId, quantity: Math.max(1, item.quantity - 1) }))}
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-8 text-center text-xs font-bold">{item.quantity}</span>
                      <button 
                        className="p-1 hover:bg-white/10 rounded-md transition-colors"
                        onClick={() => dispatch(updateQuantity({ productId: item.productId, unitId: item.unitId, quantity: item.quantity + 1 }))}
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <span className="font-bold text-emerald-400">Rp {(item.price * item.quantity).toLocaleString()}</span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {cart.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-white/20 gap-4 mt-20">
                 <ShoppingCart className="w-16 h-16 opacity-10" />
                 <p className="text-sm font-medium">Keranjang masih kosong</p>
              </div>
            )}
          </div>

          <div className="p-6 bg-white/5 border-t border-white/10 space-y-6">
            <div className="space-y-3">
               <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-white/40" />
                  <select 
                    className="flex-1 bg-transparent border-none text-sm focus:ring-0 cursor-pointer"
                    value={customerId || ''}
                    onChange={(e) => dispatch(setCustomer(e.target.value ? parseInt(e.target.value) : null))}
                  >
                    <option value="" className="text-slate-900">Umum / Walk-in Customer</option>
                    {customers?.map((c: any) => (
                      <option key={c.id} value={c.id} className="text-slate-900">{c.name}</option>
                    ))}
                  </select>
               </div>
               <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-white/40" />
                  <select 
                    className="flex-1 bg-transparent border-none text-sm focus:ring-0 cursor-pointer"
                    value={paymentMethod}
                    onChange={(e) => dispatch(setPaymentMethod(e.target.value))}
                  >
                    <option value="CASH" className="text-slate-900">Tunai (Cash)</option>
                    <option value="TRANSFER" className="text-slate-900">Transfer Bank</option>
                    <option value="QRIS" className="text-slate-900">QRIS</option>
                    <option value="HUTANG" className="text-slate-900">Hutang Tempo</option>
                  </select>
               </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-white/60 text-sm">
                <span>Subtotal</span>
                <span>Rp {total.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-end pt-2">
                <span className="text-lg font-bold">Total Akhir</span>
                <span className="text-3xl font-black text-emerald-400">Rp {total.toLocaleString()}</span>
              </div>
            </div>

            <Button 
              className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-lg rounded-2xl shadow-xl shadow-emerald-500/20 active:scale-95 transition-all"
              disabled={cart.length === 0 || saleMutation.isPending}
              onClick={handleCheckout}
            >
              {saleMutation.isPending ? "Memproses..." : "Bayar Sekarang"}
            </Button>
          </div>
        </div>
      </div>

      {/* Lock Overlay / Starting Cash Dialog */}
      {!isShiftActive && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/20 backdrop-blur-sm animate-in fade-in duration-300">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-md bg-white rounded-3xl p-8 border border-slate-100 shadow-2xl space-y-6"
          >
            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                <Lock className="w-8 h-8 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-black text-slate-800">Sesi Kasir Belum Aktif</h2>
              <p className="text-sm text-slate-500 leading-relaxed">
                Anda perlu membuka shift baru dan menyetor saldo modal awal laci kasir (*starting cash*) sebelum dapat melakukan transaksi penjualan.
              </p>
            </div>

            <div className="space-y-4">
              {!branchId && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Pilih Cabang</label>
                  <select
                    className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-700 focus:ring-emerald-500 cursor-pointer"
                    value={selectedBranchId}
                    onChange={(e) => setSelectedBranchId(e.target.value)}
                  >
                    <option value="">Pilih Cabang</option>
                    {branches?.map(b => (
                      <option key={b.id} value={b.id.toString()}>{b.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Modal Awal Laci Kasir (Rp)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-extrabold text-lg">Rp</span>
                  <Input 
                    type="number"
                    min="0"
                    placeholder="0" 
                    className="pl-12 h-14 bg-slate-50 border-slate-200 focus:bg-white focus:ring-emerald-500 font-black text-xl text-slate-800 rounded-2xl"
                    value={startingCash}
                    onChange={(e) => setStartingCash(e.target.value)}
                  />
                </div>
              </div>

              <Button 
                onClick={() => {
                  const val = parseFloat(startingCash);
                  if (isNaN(val) || val < 0) {
                    alert("Masukkan nilai modal awal yang valid!");
                    return;
                  }
                  const activeBranchId = branchId || parseInt(selectedBranchId);
                  if (!activeBranchId) {
                    alert("Pilih cabang terlebih dahulu!");
                    return;
                  }
                  openShiftMutation.mutate(val);
                }}
                disabled={openShiftMutation.isPending || (!branchId && !selectedBranchId)}
                className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-lg rounded-2xl shadow-xl shadow-emerald-500/20 active:scale-95 transition-all mt-2"
              >
                {openShiftMutation.isPending ? "Membuka Shift..." : "Buka Shift & Sesi Baru"}
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Success Modal */}
      <Dialog 
        isOpen={!!successOrder} 
        onClose={() => setSuccessOrder(null)}
        title="Transaksi Berhasil"
      >
        <div className="text-center py-6 space-y-6">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
             <CheckCircle2 className="w-12 h-12 text-emerald-600" />
          </div>
          <div className="space-y-2">
             <h3 className="text-2xl font-bold text-slate-800">Pembayaran Diterima</h3>
             <p className="text-slate-500">ID Transaksi: <span className="font-mono text-slate-800">#SAL-{successOrder?.id}</span></p>
          </div>
          <div className="bg-slate-50 p-4 rounded-2xl flex justify-between items-center">
             <span className="text-slate-500 font-medium">Total Kembalian</span>
             <span className="text-2xl font-black text-emerald-600">Rp 0</span>
          </div>
          <div className="flex gap-4">
             <Button variant="outline" className="flex-1 h-12" onClick={() => handlePrintReceipt(successOrder)}>
                <Receipt className="w-4 h-4 mr-2" />
                Cetak Struk
             </Button>
             <Button className="flex-1 h-12 bg-emerald-600 hover:bg-emerald-700" onClick={() => setSuccessOrder(null)}>
                Transaksi Baru
             </Button>
          </div>
        </div>
      </Dialog>

      {/* Unit Selection Dialog */}
      <Dialog
        isOpen={!!unitSelectionProduct}
        onClose={() => setUnitSelectionProduct(null)}
        title="Pilih Satuan Jual"
      >
        <div className="space-y-4">
           <div className="p-4 bg-slate-50 rounded-2xl flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                 <Package className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{unitSelectionProduct?.product.sku}</p>
                 <h4 className="font-bold text-slate-800">{unitSelectionProduct?.product.name}</h4>
              </div>
           </div>

           <div className="grid grid-cols-1 gap-3">
              {unitSelectionProduct?.product.units.map((unit: any) => {
                 const isAffordable = unit.conversionToBase <= unitSelectionProduct.stockQuantity;
                 return (
                    <button
                      key={unit.id}
                      disabled={!isAffordable}
                      onClick={() => {
                         dispatch(addToCart({
                            productId: unitSelectionProduct.product.id,
                            unitId: unit.id,
                            unitName: unit.unitName,
                            name: unitSelectionProduct.product.name,
                            sku: unitSelectionProduct.product.sku,
                            price: unit.pricePerUnit,
                            quantity: 1,
                            availableStock: unitSelectionProduct.stockQuantity,
                            conversionToBase: unit.conversionToBase
                         }));
                         setUnitSelectionProduct(null);
                      }}
                      className={cn(
                        "p-4 rounded-2xl border text-left transition-all flex items-center justify-between group",
                        isAffordable 
                          ? "border-slate-100 hover:border-emerald-500 hover:bg-emerald-50" 
                          : "opacity-50 grayscale cursor-not-allowed bg-slate-50 border-transparent"
                      )}
                    >
                       <div className="space-y-1">
                          <p className="font-black text-slate-800 group-hover:text-emerald-700">{unit.unitName}</p>
                          <p className="text-xs text-slate-500">Isi: {unit.conversionToBase} Satuan Dasar</p>
                       </div>
                       <div className="text-right">
                          <p className="font-black text-emerald-600">Rp {unit.pricePerUnit.toLocaleString()}</p>
                          {!isAffordable && <p className="text-[10px] text-rose-500 font-bold">Stok Tidak Cukup</p>}
                       </div>
                    </button>
                 );
              })}
           </div>
        </div>
      </Dialog>

      {/* Close Shift Modal */}
      <Dialog
        isOpen={closeShiftModalOpen}
        onClose={() => setCloseShiftModalOpen(false)}
        title="Tutup Shift & Sesi Kasir"
        size="sm"
      >
        <div className="space-y-6 py-2">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
              <LogOut className="w-8 h-8 text-rose-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-800">Hitung Uang Fisik Di Laci</h3>
            <p className="text-xs text-slate-500">
              Harap hitung seluruh uang kertas dan koin aktual yang ada di laci kasir saat ini, lalu masukkan nominalnya di bawah.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col gap-2.5">
            <div className="flex justify-between text-xs font-medium text-slate-500">
              <span>Waktu Mulai:</span>
              <span className="font-bold text-slate-800">
                {activeShift ? new Date(activeShift.startTime).toLocaleString('id-ID') : '-'}
              </span>
            </div>
            <div className="flex justify-between text-xs font-medium text-slate-500">
              <span>Modal Awal Sesi:</span>
              <span className="font-extrabold text-slate-800">
                Rp {activeShift?.startingCash?.toLocaleString() || '0'}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Uang Fisik Aktual (Rp)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-extrabold text-lg">Rp</span>
              <Input 
                type="number"
                min="0"
                placeholder="0" 
                className="pl-12 h-14 bg-slate-50 border-slate-200 focus:bg-white focus:ring-rose-500 font-black text-xl text-slate-800 rounded-2xl"
                value={endingCashInput}
                onChange={(e) => setEndingCashInput(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-4 pt-2">
            <Button variant="outline" className="flex-1 h-12 rounded-xl" onClick={() => setCloseShiftModalOpen(false)}>
              Batal
            </Button>
            <Button 
              className="flex-1 h-12 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-lg shadow-rose-100 active:scale-95 transition-all"
              disabled={closeShiftMutation.isPending}
              onClick={() => {
                const val = parseFloat(endingCashInput);
                if (isNaN(val) || val < 0) {
                  alert("Masukkan nominal uang akhir yang valid!");
                  return;
                }
                closeShiftMutation.mutate(val);
              }}
            >
              {closeShiftMutation.isPending ? "Menutup..." : "Tutup Sesi"}
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Shift Summary Success Modal */}
      <Dialog
        isOpen={!!closedShiftSummary}
        onClose={() => setClosedShiftSummary(null)}
        title="Shift Selesai & Ditutup"
        size="md"
      >
        <div className="space-y-6 py-2 text-slate-800">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            </div>
            <h3 className="text-2xl font-black text-slate-800">Sesi Kasir Berhasil Ditutup</h3>
            <p className="text-sm text-slate-500">
              Rekonsiliasi kas shift Anda telah sukses dicatat di sistem untuk audit pemilik.
            </p>
          </div>

          <div className="border border-slate-100 rounded-2xl overflow-hidden bg-slate-50">
            <div className="p-4 border-b border-slate-100 bg-white flex justify-between items-center">
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">ID Shift / Operator</p>
                <p className="text-xs font-bold text-slate-700">#{closedShiftSummary?.id} - {closedShiftSummary?.user?.fullName}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Durasi Shift</p>
                <p className="text-xs font-bold text-slate-700">
                  {closedShiftSummary ? (() => {
                    const start = new Date(closedShiftSummary.startTime).getTime();
                    const end = new Date(closedShiftSummary.endTime).getTime();
                    const diffMins = Math.round((end - start) / 60000);
                    if (diffMins < 60) return `${diffMins} Menit`;
                    const diffHrs = Math.floor(diffMins / 60);
                    return `${diffHrs} Jam ${diffMins % 60} Menit`;
                  })() : '-'}
                </p>
              </div>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-400 font-semibold text-xs uppercase tracking-wider">Modal Awal Sesi</span>
                  <p className="font-extrabold text-slate-700 mt-0.5">Rp {closedShiftSummary?.startingCash?.toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold text-xs uppercase tracking-wider">Total Penjualan Sesi</span>
                  <p className="font-extrabold text-emerald-600 mt-0.5">Rp {closedShiftSummary?.totalSales?.toLocaleString()}</p>
                </div>
              </div>

              <div className="h-px bg-slate-200/60 my-2"></div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-400 font-semibold text-xs uppercase tracking-wider">Ekspektasi Kas Laci</span>
                  <p className="font-extrabold text-slate-700 mt-0.5">Rp {closedShiftSummary?.expectedEndingCash?.toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold text-xs uppercase tracking-wider">Uang Kas Aktual (Fisik)</span>
                  <p className="font-extrabold text-slate-700 mt-0.5">Rp {closedShiftSummary?.endingCash?.toLocaleString()}</p>
                </div>
              </div>

              <div className="h-px bg-slate-200/60 my-2"></div>

              <div className="flex justify-between items-center p-3 rounded-xl bg-white border border-slate-100">
                <span className="text-slate-500 font-bold text-xs uppercase tracking-wider">Selisih Kas (Variance)</span>
                {closedShiftSummary && (() => {
                  const variance = closedShiftSummary.endingCash - closedShiftSummary.expectedEndingCash;
                  if (variance === 0) {
                    return (
                      <span className="text-sm font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full uppercase tracking-wider">
                        Pas (Rp 0)
                      </span>
                    );
                  } else if (variance > 0) {
                    return (
                      <span className="text-sm font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full uppercase tracking-wider">
                        Lebih (+Rp {variance.toLocaleString()})
                      </span>
                    );
                  } else {
                    return (
                      <span className="text-sm font-black text-rose-600 bg-rose-50 border border-rose-100 px-3 py-1 rounded-full uppercase tracking-wider">
                        Kurang (-Rp {Math.abs(variance).toLocaleString()})
                      </span>
                    );
                  }
                })()}
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <Button 
              variant="outline" 
              className="flex-1 h-12 rounded-xl"
              onClick={() => {
                if (closedShiftSummary) {
                  const printWindow = window.open('', '_blank');
                  if (printWindow) {
                    const htmlContent = `
                      <html>
                        <head>
                          <title>Struk Ringkasan Shift - #SHF-${closedShiftSummary.id}</title>
                          <style>
                            body { font-family: 'Courier New', Courier, monospace; width: 300px; margin: 0 auto; padding: 20px; font-size: 12px; line-height: 1.4; color: #000; }
                            .text-center { text-align: center; }
                            .text-right { text-align: right; }
                            .bold { font-weight: bold; }
                            .header { border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
                            .header h2 { margin: 0; font-size: 16px; }
                            .header p { margin: 3px 0 0; font-size: 10px; }
                            .meta { border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 10px; font-size: 10px; }
                            .meta p { margin: 3px 0; }
                            .details { border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
                            .row { display: flex; justify-content: space-between; margin-bottom: 5px; }
                            .footer { font-size: 10px; margin-top: 15px; }
                          </style>
                        </head>
                        <body>
                          <div class="header text-center">
                            <h2>RINGKASAN SHIFT</h2>
                            <p>${closedShiftSummary.branch?.name || 'Cabang Utama'}</p>
                          </div>
                          <div class="meta">
                            <p>Shift ID: #${closedShiftSummary.id}</p>
                            <p>Kasir: ${closedShiftSummary.user?.fullName}</p>
                            <p>Mulai: ${new Date(closedShiftSummary.startTime).toLocaleString('id-ID')}</p>
                            <p>Selesai: ${new Date(closedShiftSummary.endTime).toLocaleString('id-ID')}</p>
                          </div>
                          <div class="details">
                            <div class="row">
                              <span>Modal Awal</span>
                              <span class="bold">Rp ${closedShiftSummary.startingCash?.toLocaleString()}</span>
                            </div>
                            <div class="row">
                              <span>Total Penjualan</span>
                              <span class="bold">Rp ${closedShiftSummary.totalSales?.toLocaleString()}</span>
                            </div>
                            <div class="row">
                              <span>Ekspektasi Kas</span>
                              <span class="bold">Rp ${closedShiftSummary.expectedEndingCash?.toLocaleString()}</span>
                            </div>
                            <div class="row">
                              <span>Kas Aktual</span>
                              <span class="bold">Rp ${closedShiftSummary.endingCash?.toLocaleString()}</span>
                            </div>
                            <div class="row bold">
                              <span>Selisih</span>
                              <span>Rp ${(closedShiftSummary.endingCash - closedShiftSummary.expectedEndingCash).toLocaleString()}</span>
                            </div>
                          </div>
                          <div class="footer text-center">
                            <p>Dicetak pada: ${new Date().toLocaleString('id-ID')}</p>
                            <p>Simpan struk ini untuk serah terima laci kasir</p>
                          </div>
                          <script>
                            window.onload = function() {
                              window.print();
                              setTimeout(function() { window.close(); }, 500);
                            };
                          </script>
                        </body>
                      </html>
                    `;
                    printWindow.document.write(htmlContent);
                    printWindow.document.close();
                  }
                }
              }}
            >
              <Receipt className="w-4 h-4 mr-2" />
              Cetak Struk Shift
            </Button>
            <Button 
              className="flex-1 h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl"
              onClick={() => {
                setClosedShiftSummary(null);
                window.location.href = '/dashboard';
              }}
            >
              Kembali ke Dashboard
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default POSPage;
