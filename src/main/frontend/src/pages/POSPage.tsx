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
  AlertTriangle
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

  const { data: inventory } = useQuery({
    queryKey: ['inventory', selectedBranchId],
    queryFn: () => api.get(`/inventory/branch/${selectedBranchId}`).then(res => res.data),
    enabled: !!selectedBranchId
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
    const payload = {
      branchId: parseInt(selectedBranchId),
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

  return (
    <div className="flex h-[calc(100vh-100px)] gap-6 animate-in fade-in duration-500 overflow-hidden">
      {/* Product Selection Side */}
      <div className="flex-1 flex flex-col min-w-0 bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Package className="w-5 h-5 text-emerald-600" />
              Pilih Produk
            </h1>
            <div className="flex items-center gap-2">
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
                <span className="text-xs font-medium text-slate-400 bg-slate-50 px-3 py-1 rounded-full uppercase tracking-wider">
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
      <div className="w-[400px] flex flex-col bg-slate-900 rounded-3xl shadow-2xl overflow-hidden text-white">
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
             <Button variant="outline" className="flex-1 h-12" onClick={() => window.print()}>
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
    </div>
  );
};

export default POSPage;
