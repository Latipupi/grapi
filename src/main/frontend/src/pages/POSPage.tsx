import React, { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../store';
import { 
  addToCart, 
  removeFromCart, 
  updateQuantity, 
  updateItemPrice,
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
  LogOut,
  ChevronDown,
  ChevronUp,
  Sparkles,
  RefreshCw,
  TrendingUp,
  Link as LinkIcon,
  Info
} from 'lucide-react';
import { Dialog } from '../components/ui/Dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { toast } from '../components/ui/Toast';

const POSPage: React.FC = () => {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const { cart, customerId, paymentMethod } = useSelector((state: RootState) => state.pos);
  const { branchId, userId, role } = useSelector((state: RootState) => state.auth);
  
  const [searchTerm, setSearchTerm] = useState('');
  
  // Resizable Cart States & Handlers
  const [cartWidth, setCartWidth] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('pos-cart-width');
      return saved ? parseInt(saved, 10) : 400;
    }
    return 400;
  });

  const [isLargeScreen, setIsLargeScreen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024;
    }
    return true;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsLargeScreen(window.innerWidth >= 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleMouseDown = useCallback((mouseDownEvent: React.MouseEvent) => {
    mouseDownEvent.preventDefault();
    const startWidth = cartWidth;
    const startX = mouseDownEvent.clientX;
    let currentWidth = startWidth;

    const doDrag = (mouseMoveEvent: MouseEvent) => {
      const deltaX = startX - mouseMoveEvent.clientX;
      const newWidth = Math.max(320, Math.min(750, startWidth + deltaX));
      currentWidth = newWidth;
      setCartWidth(newWidth);
    };

    const stopDrag = () => {
      localStorage.setItem('pos-cart-width', currentWidth.toString());
      document.removeEventListener('mousemove', doDrag);
      document.removeEventListener('mouseup', stopDrag);
    };

    document.addEventListener('mousemove', doDrag);
    document.addEventListener('mouseup', stopDrag);
  }, [cartWidth]);

  const handleDoubleClick = useCallback(() => {
    setCartWidth(400);
    localStorage.setItem('pos-cart-width', '400');
  }, []);

  const [isPaymentExpanded, setIsPaymentExpanded] = useState<boolean>(false);
  const [isCustomerOpen, setIsCustomerOpen] = useState<boolean>(false);
  const [customerSearch, setCustomerSearch] = useState<string>('');

  const [selectedBranchId, setSelectedBranchId] = useState<string>(branchId?.toString() || '');
  const [successOrder, setSuccessOrder] = useState<any>(null);
  const [unitSelectionProduct, setUnitSelectionProduct] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'products' | 'cart'>('products');
  const [receivedAmount, setReceivedAmount] = useState<string>('');
  const [lastReceivedAmount, setLastReceivedAmount] = useState<number>(0);
  const [changeAmount, setChangeAmount] = useState<number>(0);

  const [startingCash, setStartingCash] = useState<string>('0');
  const [closeShiftModalOpen, setCloseShiftModalOpen] = useState(false);
  const [endingCashInput, setEndingCashInput] = useState<string>('');
  const [closedShiftSummary, setClosedShiftSummary] = useState<any>(null);

  // Zero Stock & Recommendation States
  const [zeroStockProduct, setZeroStockProduct] = useState<any>(null);
  const [recommendationsData, setRecommendationsData] = useState<any>(null);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);

  const [recommendationModalItem, setRecommendationModalItem] = useState<any>(null);
  const [cartRecData, setCartRecData] = useState<any>(null);
  const [isLoadingCartRec, setIsLoadingCartRec] = useState(false);
  const [recActiveTab, setRecActiveTab] = useState<'UP_SELLING' | 'LINK_SELLING' | 'SUBSTITUTION'>('UP_SELLING');

  // Compounded Prescriptions (Obat Racikan) States
  const [isCompoundModalOpen, setIsCompoundModalOpen] = useState(false);
  const [compoundName, setCompoundName] = useState('');
  const [compoundPackageType, setCompoundPackageType] = useState('Puyer');
  const [compoundQuantity, setCompoundQuantity] = useState<number>(10);
  const [compoundDoseRule, setCompoundDoseRule] = useState('');
  const [compoundServiceFee, setCompoundServiceFee] = useState<string>('5000');
  const [compoundIngredients, setCompoundIngredients] = useState<Array<{
    productId: number;
    productName: string;
    unitId: number;
    unitName: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
    availableStock: number;
    conversionToBase: number;
    units: any[];
  }>>([]);
  const [ingredientSearch, setIngredientSearch] = useState('');
  const [isAddingIngredient, setIsAddingIngredient] = useState(false);

  const handleOpenZeroStockModal = async (inv: any) => {
    setZeroStockProduct(inv);
    setIsLoadingRecommendations(true);
    try {
      const effectiveBranch = selectedBranchId || branchId?.toString() || '';
      const res = await api.get(`/product-recommendations/pos-suggestions?productId=${inv.product.id}${effectiveBranch ? `&branchId=${effectiveBranch}` : ''}`);
      setRecommendationsData(res.data);
    } catch (err) {
      console.error(err);
      setRecommendationsData(null);
    } finally {
      setIsLoadingRecommendations(false);
    }
  };

  const handleOpenCartRecommendations = async (item: any) => {
    setRecommendationModalItem(item);
    setRecActiveTab('UP_SELLING');
    setIsLoadingCartRec(true);
    try {
      const effectiveBranch = selectedBranchId || branchId?.toString() || '';
      const res = await api.get(`/product-recommendations/pos-suggestions?productId=${item.productId}${effectiveBranch ? `&branchId=${effectiveBranch}` : ''}`);
      setCartRecData(res.data);
    } catch (err) {
      console.error(err);
      setCartRecData(null);
    } finally {
      setIsLoadingCartRec(false);
    }
  };

  const handleSelectSubstituteProduct = (targetProductId: number) => {
    const targetInv = inventory?.find((i: any) => i.product?.id === targetProductId);
    setZeroStockProduct(null);
    setRecommendationModalItem(null);
    if (targetInv && targetInv.stockQuantity > 0) {
      setUnitSelectionProduct(targetInv);
    } else if (targetInv) {
      toast.error('Stok produk ini juga sedang habis di cabang ini.');
    } else {
      toast.error('Produk tidak ditemukan di inventori cabang ini.');
    }
  };

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
    mutationFn: (endingCashVal: number) => {
      const activeBranch = selectedBranchId || branchId?.toString() || '';
      return api.post(`/shifts/close?userId=${userId}${activeBranch ? `&branchId=${activeBranch}` : ''}`, {
        endingCash: endingCashVal
      });
    },
    onSuccess: (res) => {
      setClosedShiftSummary(res.data);
      queryClient.invalidateQueries({ queryKey: ['activeShift'] });
      setCloseShiftModalOpen(false);
      setEndingCashInput('');
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
    queryFn: () => api.get('/branches').then(res => res.data)
  });

  const { data: customers } = useQuery({
    queryKey: ['customers'],
    queryFn: () => api.get('/customers').then(res => res.data)
  });

  const sortedAndFilteredCustomers = React.useMemo(() => {
    if (!customers) return [];
    const sorted = [...customers].sort((a: any, b: any) => 
      (a.name || '').localeCompare(b.name || '', 'id', { sensitivity: 'base' })
    );
    if (!customerSearch.trim()) return sorted;
    const searchLower = customerSearch.toLowerCase();
    return sorted.filter((c: any) => 
      c.name?.toLowerCase().includes(searchLower) || 
      c.phone?.toLowerCase().includes(searchLower)
    );
  }, [customers, customerSearch]);

  const saleMutation = useMutation({
    mutationFn: (payload: any) => api.post('/sales', payload),
    onSuccess: (res) => {
      setSuccessOrder(res.data);
      dispatch(clearCart());
      setReceivedAmount('');
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
    onError: (err: any) => {
      alert(err.response?.data || "Gagal memproses transaksi");
    }
  });

  const filteredProducts = inventory?.filter((inv: any) => {
    if (inv.product?.active === false) return false;
    const search = searchTerm.toLowerCase();
    const name = inv.product?.name?.toLowerCase() || '';
    const sku = inv.product?.sku?.toLowerCase() || '';
    return name.includes(search) || sku.includes(search);
  });

  const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const handleCheckout = () => {
    if (cart.length === 0) return;
    
    // Smart Expand: jika area detail pembayaran terlipat, buka terlebih dahulu agar kasir bisa konfirmasi
    if (!isPaymentExpanded) {
      setIsPaymentExpanded(true);
      return;
    }

    if (cart.some(item => item.quantity <= 0)) {
      alert("Kuantitas produk dalam keranjang harus lebih besar dari 0!");
      return;
    }
    if (paymentMethod === 'HUTANG' && !customerId) {
      alert("Pelanggan (Customer) wajib dipilih untuk transaksi dengan metode Hutang Tempo!");
      return;
    }

    const paid = parseFloat(receivedAmount);
    if (paymentMethod === 'CASH') {
      if (receivedAmount !== '') {
        if (isNaN(paid) || paid < total) {
          alert("Uang pembayaran kurang dari total akhir!");
          return;
        }
        setLastReceivedAmount(paid);
        setChangeAmount(paid - total);
      } else {
        setLastReceivedAmount(total);
        setChangeAmount(0);
      }
    } else {
      setLastReceivedAmount(total);
      setChangeAmount(0);
    }

    const payload = {
      branchId: parseInt(selectedBranchId || branchId?.toString() || '0'),
      userId,
      customerId,
      paymentMethod,
      items: cart.map(item => {
        if (item.isCompound) {
          return {
            isCompound: true,
            compoundName: item.compoundName,
            packageType: item.packageType,
            doseRule: item.doseRule,
            serviceFee: item.serviceFee || 0,
            quantity: item.quantity || 1,
            unitPrice: item.price,
            ingredients: item.ingredients?.map(ing => ({
              productId: ing.productId,
              unitId: ing.unitId,
              quantity: ing.quantity,
              unitPrice: ing.unitPrice
            }))
          };
        }
        return {
          productId: item.productId,
          unitId: item.unitId,
          quantity: item.quantity,
          unitPrice: item.price
        };
      })
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
            @page { margin: 0; }
            body { 
              font-family: 'Courier New', Courier, monospace; 
              width: 48mm; 
              margin: 0; 
              padding: 1mm 2mm; 
              font-size: 10px; 
              line-height: 1.3; 
              color: #000; 
              background-color: #fff;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .bold { font-weight: bold; }
            .header { border-bottom: 1px dashed #000; padding-bottom: 6px; margin-bottom: 6px; }
            .header h2 { margin: 0; font-size: 14px; text-transform: uppercase; }
            .header p { margin: 2px 0 0; font-size: 9px; }
            .meta { border-bottom: 1px dashed #000; padding-bottom: 6px; margin-bottom: 6px; font-size: 9px; }
            .meta p { margin: 2px 0; }
            .items { border-bottom: 1px dashed #000; padding-bottom: 6px; margin-bottom: 6px; }
            .item-row { margin-bottom: 2px; }
            .item-name { font-weight: bold; font-size: 10px; text-transform: uppercase; }
            .item-details { display: flex; justify-content: space-between; font-size: 9px; padding-left: 4px; }
            .item-batch { font-size: 8px; color: #333; padding-left: 4px; margin-bottom: 4px; }
            .totals { border-bottom: 1px dashed #000; padding-bottom: 6px; margin-bottom: 6px; }
            .total-row { display: flex; justify-content: space-between; margin: 3px 0; font-size: 10px; }
            .footer { font-size: 9px; margin-top: 10px; line-height: 1.2; }
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
              ${detail.isCompound ? `
                <div class="item-row">
                  <div class="item-name">[RACIKAN] ${detail.compoundName || 'Obat Racikan'} (${detail.quantity ? Number(detail.quantity) : 1} ${detail.packageType || 'Bungkus'})</div>
                </div>
                ${detail.doseRule ? `<div style="font-size: 8px; font-style: italic; color: #333; padding-left: 2px;">Aturan: ${detail.doseRule}</div>` : ''}
                <div class="item-details">
                  <span>1 Paket Racikan</span>
                  <span class="bold">Rp ${Number(detail.subtotal).toLocaleString()}</span>
                </div>
                ${detail.ingredients && detail.ingredients.length > 0 ? `
                  <div style="font-size: 8px; color: #444; padding-left: 4px; margin-top: 2px; margin-bottom: 3px; border-left: 1px dotted #888;">
                    ${detail.ingredients.map((ing: any) => `• ${ing.product?.name || 'Bahan'}: ${Number(ing.quantity)} @ Rp ${Number(ing.unitPrice).toLocaleString()}`).join('<br/>')}
                    ${Number(detail.serviceFee) > 0 ? `<br/>• Jasa Racik: Rp ${Number(detail.serviceFee).toLocaleString()}` : ''}
                  </div>
                ` : ''}
              ` : `
                <div class="item-row">
                  <div class="item-name">${detail.product?.name}</div>
                </div>
                <div class="item-details">
                  <span>${detail.quantity ? Number(detail.quantity) : 0} x Rp ${Number(detail.unitPrice).toLocaleString()}</span>
                  <span class="bold">Rp ${Number(detail.subtotal).toLocaleString()}</span>
                </div>
                <div class="item-batch">
                  <span>Batch: ${detail.batch?.batchNumber || '-'}</span>
                </div>
              `}
            `).join('') : '<p class="text-center">Tidak ada item</p>'}
          </div>

          <div class="totals">
            <div class="total-row bold">
              <span>TOTAL</span>
              <span>Rp ${sale.totalAmount.toLocaleString()}</span>
            </div>
            ${sale.paymentMethod === 'CASH' ? `
              <div class="total-row">
                <span>Bayar</span>
                <span>Rp ${lastReceivedAmount.toLocaleString()}</span>
              </div>
              <div class="total-row">
                <span>Kembalian</span>
                <span>Rp ${changeAmount.toLocaleString()}</span>
              </div>
            ` : ''}
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

  const activeBranchId = selectedBranchId || branchId?.toString() || '';
  const currentBranch = branches?.find((b: any) => b.id.toString() === activeBranchId);
  const isWarehouse = currentBranch?.type === 'WAREHOUSE';

  if (isWarehouse) {
    return (
      <div className="flex h-[calc(100vh-100px)] items-center justify-center bg-white rounded-3xl border border-slate-100 shadow-sm p-8 animate-in fade-in duration-300">
        <div className="max-w-md text-center space-y-6">
          <div className="w-20 h-20 bg-rose-50 border border-rose-100 text-rose-600 rounded-3xl flex items-center justify-center mx-auto shadow-sm">
            <Lock className="w-10 h-10 text-rose-600" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-slate-800">Akses Kasir Dibatasi</h2>
            <p className="text-slate-500 text-sm leading-relaxed">
              Cabang <span className="font-extrabold text-slate-800">"{currentBranch?.name}"</span> terdaftar sebagai **Gudang Pusat (Warehouse)**.
              Halaman transaksi kasir (POS) hanya dapat diakses oleh cabang bertipe **Retail**.
            </p>
          </div>
          {!branchId && (
            <div className="pt-2 space-y-3">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block text-left ml-1">Ganti ke Cabang Retail:</label>
              <select
                className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-700 focus:ring-emerald-500 cursor-pointer"
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
              >
                <option value="">Pilih Cabang</option>
                {branches?.map((b: any) => (
                  <option key={b.id} value={b.id.toString()}>{b.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>
    );
  }

  const isShiftActive = !!activeShift;

  return (
    <div className="relative h-[calc(100vh-100px)] flex flex-col overflow-hidden">
      {/* Mobile Tab Switcher */}
      <div className="flex lg:hidden mb-4 bg-slate-100 p-1.5 rounded-2xl shrink-0">
        <button
          onClick={() => setActiveTab('products')}
          className={cn(
            "flex-1 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2",
            activeTab === 'products' ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
          )}
        >
          <Package className="w-4 h-4" />
          Pilih Produk
        </button>
        <button
          onClick={() => setActiveTab('cart')}
          className={cn(
            "flex-1 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 relative",
            activeTab === 'cart' ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
          )}
        >
          <ShoppingCart className="w-4 h-4" />
          Keranjang
          {cart.length > 0 && (
            <span className="absolute top-1 right-2 bg-rose-500 text-white text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
              {cart.reduce((sum, item) => sum + item.quantity, 0)}
            </span>
          )}
        </button>
      </div>

      {/* Background POS UI (Blurred when locked) */}
      <div className={cn(
        "flex-1 flex flex-col lg:flex-row gap-4 lg:gap-0 min-h-0 transition-all duration-500",
        !isShiftActive && "blur-md pointer-events-none select-none opacity-50"
      )}>
        {/* Product Selection Side */}
        <div className={cn(
          "flex-1 flex flex-col min-w-0 bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden",
          activeTab === 'products' ? 'flex' : 'hidden lg:flex'
        )}>
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
                        setEndingCashInput('');
                        setCloseShiftModalOpen(true);
                      }}
                      className="h-7 px-2 border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 text-[9px] font-black gap-1.5 rounded-xl shadow-sm shrink-0 uppercase tracking-wider ml-1"
                    >
                      <LogOut className="w-3 h-3" />
                      Tutup Sesi
                    </Button>
                  </div>
                )}

                {role === 'ADMIN' || role === 'OWNER' || !branchId ? (
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
            <div className="flex gap-2.5 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input 
                  placeholder="Cari SKU atau Nama Produk (Tekan Enter untuk scan)..." 
                  className="pl-11 h-12 bg-slate-50 border-transparent focus:bg-white focus:ring-emerald-500 text-base"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button
                type="button"
                onClick={() => {
                  setCompoundName('');
                  setCompoundPackageType('Puyer');
                  setCompoundQuantity(10);
                  setCompoundDoseRule('');
                  setCompoundServiceFee('5000');
                  setCompoundIngredients([]);
                  setIngredientSearch('');
                  setIsAddingIngredient(false);
                  setIsCompoundModalOpen(true);
                }}
                className="h-12 px-4.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs gap-2 rounded-2xl shadow-sm shrink-0 uppercase tracking-wider flex items-center"
              >
                <Sparkles className="w-4 h-4 text-emerald-200" />
                Racik Obat
              </Button>
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
                  className={cn(
                    "p-4 rounded-2xl border transition-all cursor-pointer group bg-white",
                    inv.stockQuantity > 0 
                      ? "border-slate-100 hover:border-emerald-200 hover:shadow-md" 
                      : "border-rose-100 bg-rose-50/20 hover:border-amber-300 hover:shadow-md"
                  )}
                  onClick={() => {
                     if (inv.stockQuantity > 0) {
                        setUnitSelectionProduct(inv);
                     } else {
                        handleOpenZeroStockModal(inv);
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
                        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                          <p className="text-xs text-slate-500">Stok: {inv.stockQuantity}</p>
                          {inv.stockQuantity <= 0 && (
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 flex items-center gap-1">
                              <Sparkles className="w-2.5 h-2.5 text-amber-600" /> Cek Substitusi
                            </span>
                          )}
                        </div>
                        <p className="text-emerald-600 font-extrabold text-lg">Rp {inv.product.sellingPrice.toLocaleString()}</p>
                      </div>
                      <div className={inv.stockQuantity > 0 ? "text-emerald-500" : "text-amber-500"}>
                         {inv.stockQuantity > 0 ? <Plus className="w-6 h-6" /> : <Sparkles className="w-5 h-5 text-amber-500 group-hover:scale-110 transition-transform" />}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Resizer Handle */}
        {isLargeScreen && (
          <div
            className="hidden lg:flex items-center justify-center w-6 cursor-col-resize transition-all select-none self-stretch shrink-0 group"
            onMouseDown={handleMouseDown}
            onDoubleClick={handleDoubleClick}
            title="Seret untuk mengubah ukuran keranjang, klik 2x untuk reset ke default (400px)"
          >
            <div className="w-1 h-16 bg-slate-200 rounded-full group-hover:bg-emerald-500 group-active:bg-emerald-600 group-hover:h-24 transition-all duration-200 shadow-sm"></div>
          </div>
        )}

        {/* Cart & Checkout Side */}
        <div 
          className={cn(
            "w-full flex-1 lg:flex-none flex flex-col bg-slate-900 rounded-3xl shadow-2xl overflow-hidden text-white lg:shrink-0 min-h-0",
            activeTab === 'cart' ? 'flex' : 'hidden lg:flex',
            !isLargeScreen && "lg:w-[400px]"
          )}
          style={isLargeScreen ? { width: `${cartWidth}px` } : undefined}
        >
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
                item.isCompound ? (
                  <motion.div 
                    key={item.id || `compound-${item.name}`}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="p-3 bg-gradient-to-br from-emerald-950/40 via-teal-950/20 to-slate-900 rounded-2xl border border-teal-500/30 flex flex-col gap-2.5 shadow-sm"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-teal-400/20 text-teal-300 border border-teal-400/30 uppercase tracking-wider">
                            RACIKAN • {item.packageType || 'PUYER'}
                          </span>
                          <span className="text-[10px] text-white/50 font-bold">
                            {item.quantity} Paket
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-white truncate">{item.name}</h4>
                        {item.doseRule && (
                          <p className="text-[10px] text-teal-200/90 italic mt-0.5 font-medium">
                            📌 Aturan: {item.doseRule}
                          </p>
                        )}
                      </div>
                      <button 
                        onClick={() => dispatch(removeFromCart({ id: item.id }))}
                        className="p-1 hover:text-rose-400 text-white/20 transition-colors"
                        title="Hapus Racikan"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Komposisi Bahan */}
                    {item.ingredients && item.ingredients.length > 0 && (
                      <div className="bg-black/20 rounded-xl p-2 space-y-1 border border-white/5">
                        <p className="text-[9px] font-bold text-white/40 uppercase tracking-wider">
                          Komposisi Bahan ({item.ingredients.length} item):
                        </p>
                        {item.ingredients.map((ing: any, idx: number) => (
                          <div key={idx} className="flex justify-between items-center text-[10px]">
                            <span className="text-white/80 truncate pr-2">• {ing.productName} ({ing.quantity} {ing.unitName})</span>
                            <span className="text-white/50 font-mono shrink-0">Rp {Number(ing.subtotal).toLocaleString()}</span>
                          </div>
                        ))}
                        {Number(item.serviceFee) > 0 && (
                          <div className="flex justify-between items-center text-[10px] pt-1 border-t border-white/5 text-teal-300">
                            <span>• Jasa Racik / Tuslah</span>
                            <span className="font-mono">Rp {Number(item.serviceFee).toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-1 border-t border-white/10">
                      <div className="flex items-center bg-white/10 rounded-lg p-0.5">
                        <button 
                          className="p-1 hover:bg-white/10 rounded-md transition-colors"
                          onClick={() => dispatch(updateQuantity({ 
                            id: item.id,
                            productId: item.productId,
                            unitId: item.unitId,
                            quantity: Math.max(1, Number(item.quantity - 1)) 
                          }))}
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-8 text-center text-xs font-bold text-white">{item.quantity}</span>
                        <button 
                          className="p-1 hover:bg-white/10 rounded-md transition-colors"
                          onClick={() => dispatch(updateQuantity({ 
                            id: item.id,
                            productId: item.productId,
                            unitId: item.unitId,
                            quantity: Number(item.quantity + 1) 
                          }))}
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <span className="font-bold text-emerald-400 text-sm">Rp {(item.price * item.quantity).toLocaleString()}</span>
                    </div>
                  </motion.div>
                ) : (
                <motion.div 
                  key={`${item.productId}-${item.unitId}`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="p-3 bg-white/5 rounded-2xl border border-white/5 flex flex-col gap-3"
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-semibold text-white truncate">{item.name}</h4>
                      <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                         <span className="text-[10px] text-emerald-400 font-black uppercase tracking-widest">{item.unitName}</span>
                         <button
                           type="button"
                           onClick={() => handleOpenCartRecommendations(item)}
                           className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[9px] font-bold transition-all border border-amber-500/30"
                           title="Lihat Rekomendasi Up-Selling & Link-Selling"
                         >
                           <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                           Saran Obat
                         </button>
                         {item.additionalPrices && item.additionalPrices.length > 0 ? (
                            <select
                              value={item.selectedPriceLabel}
                              onChange={(e) => {
                                 const label = e.target.value;
                                 const selectedOption = label === 'Utama'
                                    ? { priceLabel: 'Utama', price: item.pricePerUnit }
                                    : item.additionalPrices.find(ap => ap.priceLabel === label);
                                 if (selectedOption) {
                                    dispatch(updateItemPrice({
                                       productId: item.productId,
                                       unitId: item.unitId,
                                       priceLabel: selectedOption.priceLabel,
                                       price: selectedOption.price
                                    }));
                                 }
                              }}
                              className="bg-white/10 text-white border-none rounded-md px-1 py-0.5 text-[9px] font-bold focus:ring-0 cursor-pointer h-5 outline-none hover:bg-white/20 transition-all uppercase tracking-wide"
                            >
                               <option value="Utama" className="text-slate-900">Utama (Rp {item.pricePerUnit.toLocaleString()})</option>
                               {item.additionalPrices.map((ap) => (
                                  <option key={ap.priceLabel} value={ap.priceLabel} className="text-slate-900">
                                     {ap.priceLabel} (Rp {ap.price.toLocaleString()})
                                  </option>
                               ))}
                            </select>
                         ) : (
                            <span className="text-[9px] text-white/40 font-bold uppercase tracking-wider">(Utama)</span>
                         )}
                      </div>
                      <p className="text-[10px] text-white/40 mt-1">Rp {item.price.toLocaleString()}</p>
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
                        onClick={() => dispatch(updateQuantity({ 
                          productId: item.productId, 
                          unitId: item.unitId, 
                          quantity: Math.max(0.0001, Number((item.quantity - 1).toFixed(4))) 
                        }))}
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <input 
                        type="number"
                        step="any"
                        min="0.0001"
                        placeholder="0"
                        className="w-12 bg-transparent text-center text-xs font-bold text-white border-none focus:ring-0 focus:outline-none p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        value={item.quantity}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          if (!isNaN(val) && val >= 0) {
                            dispatch(updateQuantity({ 
                              productId: item.productId, 
                              unitId: item.unitId, 
                              quantity: val 
                            }));
                          }
                        }}
                      />
                      <button 
                        className="p-1 hover:bg-white/10 rounded-md transition-colors"
                        onClick={() => dispatch(updateQuantity({ 
                          productId: item.productId, 
                          unitId: item.unitId, 
                          quantity: Number((item.quantity + 1).toFixed(4)) 
                        }))}
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <span className="font-bold text-emerald-400">Rp {(item.price * item.quantity).toLocaleString()}</span>
                  </div>
                </motion.div>
                )
              ))}
            </AnimatePresence>
            {cart.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-white/20 gap-4 mt-20">
                 <ShoppingCart className="w-16 h-16 opacity-10" />
                 <p className="text-sm font-medium">Keranjang masih kosong</p>
              </div>
            )}
          </div>

          <div className="p-6 bg-white/5 border-t border-white/10 space-y-4">
            {/* Toggle Detail Pembayaran */}
            <button
              type="button"
              onClick={() => setIsPaymentExpanded(!isPaymentExpanded)}
              className="w-full flex items-center justify-between py-1 text-[11px] font-bold text-white/40 hover:text-white transition-colors uppercase tracking-wider select-none outline-none border-b border-white/5 pb-2"
            >
              <span>Detail Pembayaran</span>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] lowercase font-normal">
                  {isPaymentExpanded ? 'sembunyikan' : 'tampilkan'}
                </span>
                {isPaymentExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
              </div>
            </button>

            {/* Collapsible Content */}
            <AnimatePresence initial={false}>
              {isPaymentExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                  style={{ overflow: isPaymentExpanded ? 'visible' : 'hidden' }}
                >
                  <div className="space-y-3 pt-2">
                     <div className="flex items-center gap-2 w-full relative">
                        <User className="w-4 h-4 text-white/40 flex-shrink-0" />
                        
                        <div className="flex-1 relative">
                          <button
                            type="button"
                            onClick={() => setIsCustomerOpen(!isCustomerOpen)}
                            className="w-full flex items-center justify-between bg-transparent border-none text-sm text-white focus:outline-none cursor-pointer py-1.5 px-0"
                          >
                            <span className="truncate text-left flex-1">
                              {customers?.find((c: any) => c.id === customerId)?.name || 'Umum / Walk-in Customer'}
                            </span>
                            <ChevronDown className="w-4 h-4 text-white/40 flex-shrink-0 ml-1" />
                          </button>

                          {isCustomerOpen && (
                            <>
                              <div 
                                className="fixed inset-0 z-40 bg-transparent" 
                                onClick={() => {
                                  setIsCustomerOpen(false);
                                  setCustomerSearch('');
                                }} 
                              />
                              <div className="absolute left-0 right-0 bottom-full mb-2 z-50 bg-slate-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden max-h-64 flex flex-col min-w-[240px]">
                                {/* Search input inside dropdown */}
                                <div className="p-2 border-b border-white/10 flex items-center gap-2 bg-slate-950">
                                  <Search className="w-3.5 h-3.5 text-white/40 flex-shrink-0" />
                                  <input
                                    type="text"
                                    placeholder="Cari nama customer..."
                                    className="w-full bg-transparent border-none p-1 text-xs text-white placeholder-white/30 focus:outline-none focus:ring-0"
                                    value={customerSearch}
                                    onChange={(e) => setCustomerSearch(e.target.value)}
                                    autoFocus
                                  />
                                </div>
                                
                                {/* Dropdown Options List */}
                                <div className="overflow-y-auto divide-y divide-white/5 max-h-48 scrollbar-thin">
                                  {(!customerSearch.trim() || 
                                    'umum'.includes(customerSearch.toLowerCase()) || 
                                    'walk-in'.includes(customerSearch.toLowerCase()) ||
                                    'customer'.includes(customerSearch.toLowerCase())) && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        dispatch(setCustomer(null));
                                        setIsCustomerOpen(false);
                                        setCustomerSearch('');
                                      }}
                                      className={cn(
                                        "w-full text-left px-3 py-2.5 text-xs transition-colors hover:bg-white/5 text-white",
                                        !customerId && "bg-emerald-500/20 text-emerald-400 font-bold"
                                      )}
                                    >
                                      Umum / Walk-in Customer
                                    </button>
                                  )}
                                  
                                  {sortedAndFilteredCustomers.map((c: any) => (
                                    <button
                                      key={c.id}
                                      type="button"
                                      onClick={() => {
                                        dispatch(setCustomer(c.id));
                                        setIsCustomerOpen(false);
                                        setCustomerSearch('');
                                      }}
                                      className={cn(
                                        "w-full text-left px-3 py-2.5 text-xs transition-colors hover:bg-white/5 text-white",
                                        customerId === c.id && "bg-emerald-500/20 text-emerald-400 font-bold"
                                      )}
                                    >
                                      {c.name}
                                    </button>
                                  ))}
                                  
                                  {sortedAndFilteredCustomers.length === 0 && 
                                   !(!customerSearch.trim() || 
                                     'umum'.includes(customerSearch.toLowerCase()) || 
                                     'walk-in'.includes(customerSearch.toLowerCase()) ||
                                     'customer'.includes(customerSearch.toLowerCase())) && (
                                    <div className="px-3 py-3 text-center text-xs text-white/30">
                                      Customer tidak ditemukan
                                    </div>
                                  )}
                                </div>
                              </div>
                            </>
                          )}
                        </div>
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

                  {paymentMethod === 'CASH' && total > 0 && (
                    <div className="space-y-3 pt-4 border-t border-white/10 animate-in slide-in-from-top-2 duration-200">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-white/40 uppercase">Uang Pembayaran</span>
                        <div className="relative w-36">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-white/40">Rp</span>
                          <input
                            type="text"
                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-2.5 py-1.5 text-right text-sm font-black text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                            placeholder="0"
                            value={receivedAmount}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, '');
                              setReceivedAmount(val ? parseInt(val).toString() : '');
                            }}
                          />
                        </div>
                      </div>
                      {receivedAmount !== '' && (
                        <div className="flex justify-between items-center animate-in fade-in duration-200">
                          <span className="text-xs font-bold text-white/40 uppercase">Kembalian</span>
                          <span className={`text-sm font-black ${parseInt(receivedAmount) - total >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {parseInt(receivedAmount) - total >= 0 
                              ? `Rp ${(parseInt(receivedAmount) - total).toLocaleString()}` 
                              : 'Uang Kurang'}
                          </span>
                        </div>
                      )}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        <button
                          type="button"
                          onClick={() => setReceivedAmount(total.toString())}
                          className="px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[10px] font-bold text-white transition-colors"
                        >
                          Uang Pas
                        </button>
                        {[10000, 20000, 50000, 100000].map((val) => {
                          if (val >= total || (val < total && val === 50000 && total <= 50000)) {
                            return (
                              <button
                                key={val}
                                type="button"
                                onClick={() => setReceivedAmount(val.toString())}
                                className="px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[10px] font-bold text-white transition-colors"
                              >
                                Rp {val.toLocaleString()}
                              </button>
                            );
                          }
                          return null;
                        })}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-1 pt-2 border-t border-white/5">
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
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 animate-in fade-in duration-300">
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
              {(role === 'ADMIN' || role === 'OWNER' || !branchId) && (
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
                  const activeBranchId = (role === 'ADMIN' || role === 'OWNER')
                    ? parseInt(selectedBranchId)
                    : (branchId || parseInt(selectedBranchId));
                  if (!activeBranchId) {
                    alert("Pilih cabang terlebih dahulu!");
                    return;
                  }
                  openShiftMutation.mutate(val);
                }}
                disabled={openShiftMutation.isPending || ((role === 'ADMIN' || role === 'OWNER') ? !selectedBranchId : (!branchId && !selectedBranchId))}
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
             <span className="text-2xl font-black text-emerald-600">Rp {changeAmount.toLocaleString()}</span>
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
        title="Pilih Satuan & Harga Jual"
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

           <div className="grid grid-cols-1 gap-4">
              {unitSelectionProduct?.product.units.map((unit: any) => {
                 const isAffordable = unit.conversionToBase <= unitSelectionProduct.stockQuantity;
                 return (
                    <div 
                      key={unit.id} 
                      className={cn(
                        "p-4 rounded-2xl border text-left transition-all bg-white shadow-sm space-y-3",
                        isAffordable ? "border-slate-100" : "opacity-60 bg-slate-50/50"
                      )}
                    >
                       <div className="flex justify-between items-center">
                          <div className="space-y-0.5">
                             <p className="font-extrabold text-slate-800 text-base">{unit.unitName}</p>
                             <p className="text-xs text-slate-400">Isi: {unit.conversionToBase} Satuan Dasar</p>
                          </div>
                          {!isAffordable && <span className="text-[10px] text-rose-500 font-bold bg-rose-50 px-2 py-0.5 rounded-full">Stok Tidak Cukup</span>}
                       </div>
                       
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                          {/* 1. Base Price Option */}
                          <button
                             disabled={!isAffordable}
                             onClick={() => {
                                dispatch(addToCart({
                                   productId: unitSelectionProduct.product.id,
                                   unitId: unit.id,
                                   unitName: unit.unitName,
                                   name: unitSelectionProduct.product.name,
                                   sku: unitSelectionProduct.product.sku,
                                   price: unit.pricePerUnit,
                                   pricePerUnit: unit.pricePerUnit,
                                   additionalPrices: unit.additionalPrices || [],
                                   selectedPriceLabel: 'Utama',
                                   quantity: 1,
                                   availableStock: unitSelectionProduct.stockQuantity,
                                   conversionToBase: unit.conversionToBase
                                }));
                                setUnitSelectionProduct(null);
                             }}
                             className="p-2.5 rounded-xl border border-slate-100 hover:border-emerald-500 hover:bg-emerald-50/30 text-left transition-all flex justify-between items-center group/btn disabled:opacity-50"
                          >
                             <span className="text-xs font-semibold text-slate-500 group-hover/btn:text-emerald-600">Utama</span>
                             <span className="font-extrabold text-sm text-emerald-600">Rp {unit.pricePerUnit.toLocaleString()}</span>
                          </button>

                          {/* 2. Additional Custom Prices */}
                          {unit.additionalPrices?.map((ap: any) => (
                             <button
                                key={ap.id || ap.priceLabel}
                                disabled={!isAffordable}
                                onClick={() => {
                                   dispatch(addToCart({
                                      productId: unitSelectionProduct.product.id,
                                      unitId: unit.id,
                                      unitName: unit.unitName,
                                      name: unitSelectionProduct.product.name,
                                      sku: unitSelectionProduct.product.sku,
                                      price: ap.price,
                                      pricePerUnit: unit.pricePerUnit,
                                      additionalPrices: unit.additionalPrices || [],
                                      selectedPriceLabel: ap.priceLabel,
                                      quantity: 1,
                                      availableStock: unitSelectionProduct.stockQuantity,
                                      conversionToBase: unit.conversionToBase
                                   }));
                                   setUnitSelectionProduct(null);
                                }}
                                className="p-2.5 rounded-xl border border-slate-100 hover:border-emerald-500 hover:bg-emerald-50/30 text-left transition-all flex justify-between items-center group/btn disabled:opacity-50"
                             >
                                <span className="text-xs font-semibold text-slate-500 group-hover/btn:text-emerald-600 truncate mr-2">{ap.priceLabel}</span>
                                <span className="font-extrabold text-sm text-emerald-600">Rp {ap.price.toLocaleString()}</span>
                             </button>
                          ))}
                       </div>
                    </div>
                 );
              })}
           </div>
        </div>
      </Dialog>

      {/* Zero Stock & Substitution Dialog */}
      <Dialog
        isOpen={!!zeroStockProduct}
        onClose={() => setZeroStockProduct(null)}
        title="⚠️ Stok Obat Kosong - Rekomendasi Substitusi"
        size="lg"
      >
        <div className="space-y-4 py-1">
          {/* Source Product Notice */}
          <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest font-mono">
                  {zeroStockProduct?.product?.sku || 'SKU'}
                </span>
                <h4 className="text-base font-bold text-slate-800 leading-tight">
                  {zeroStockProduct?.product?.name}
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Stok fisik di cabang ini: <span className="font-bold text-rose-600">0 Unit (Habis)</span>
                  {zeroStockProduct?.product?.activeSubstance && (
                    <span> • Kandungan: <b className="text-slate-700">{zeroStockProduct.product.activeSubstance}</b></span>
                  )}
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-rose-600 bg-white px-2.5 py-1 rounded-lg border border-rose-200 shrink-0">
              Stok Kosong
            </span>
          </div>

          {/* Section Title */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <h5 className="text-sm font-bold text-slate-800">
                Obat Pengganti / Substitusi yang Tersedia (Ready Stock):
              </h5>
            </div>
            <span className="text-xs text-slate-400">
              {recommendationsData?.substitutions?.filter((s: any) => s.currentStock > 0)?.length || 0} Alternatif Tersedia
            </span>
          </div>

          {/* List of Substitutions */}
          {isLoadingRecommendations ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              Mencari obat substitusi dan ketersediaan stok cabang...
            </div>
          ) : (!recommendationsData?.substitutions || recommendationsData.substitutions.filter((s: any) => s.currentStock > 0).length === 0) ? (
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 text-center space-y-2">
              <Info className="w-6 h-6 text-slate-400 mx-auto" />
              <p className="text-sm font-bold text-slate-600">Tidak ada obat substitusi yang ready stok</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Belum ada obat pengganti sejenis yang memiliki stok &gt; 0 di cabang ini. Anda dapat mengatur aturan relasi di menu <b>Master Data &gt; Rekomendasi Obat</b>.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
              {recommendationsData.substitutions
                .filter((sub: any) => sub.currentStock > 0)
                .map((sub: any) => (
                  <div
                    key={sub.productId}
                    className="p-3.5 bg-white border border-slate-200 rounded-xl hover:border-emerald-500 hover:shadow-md transition-all flex items-center justify-between gap-3 group"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-800 text-sm group-hover:text-emerald-700 transition-colors">
                          {sub.name}
                        </span>
                        {sub.isConfigured ? (
                          <span className="text-[10px] font-bold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200">
                            Rekomendasi Terdaftar
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                            Zat/Kategori Sejenis
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                        <span className="font-mono text-[11px] text-slate-400">SKU: {sub.sku || '-'}</span>
                        <span>•</span>
                        <span>Stok: <b className="text-emerald-600">{sub.currentStock} {sub.unit || 'Unit'}</b></span>
                        <span>•</span>
                        <span className="font-black text-slate-800">Rp {sub.sellingPrice?.toLocaleString('id-ID') || 0}</span>
                      </div>
                      {sub.notes && (
                        <p className="text-[11px] text-slate-500 mt-1 italic">
                          💡 {sub.notes}
                        </p>
                      )}
                    </div>

                    <Button
                      onClick={() => handleSelectSubstituteProduct(sub.productId)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-9 px-4 rounded-xl text-xs flex items-center gap-1.5 shrink-0 shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Pilih Pengganti
                    </Button>
                  </div>
                ))}
            </div>
          )}

          <div className="pt-2 border-t border-slate-100 flex justify-end">
            <Button
              variant="outline"
              onClick={() => setZeroStockProduct(null)}
              className="rounded-xl text-xs"
            >
              Tutup
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Cart Recommendations Dialog (Up-Sell & Link-Sell) */}
      <Dialog
        isOpen={!!recommendationModalItem}
        onClose={() => setRecommendationModalItem(null)}
        title={`💡 Rekomendasi Penjualan: ${recommendationModalItem?.name || ''}`}
        size="lg"
      >
        <div className="space-y-4 py-1">
          <div className="flex border-b border-slate-200">
            <button
              type="button"
              onClick={() => setRecActiveTab('UP_SELLING')}
              className={cn(
                "px-4 py-2 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5",
                recActiveTab === 'UP_SELLING'
                  ? "border-emerald-500 text-emerald-600"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              )}
            >
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
              Up-Selling ({cartRecData?.upSells?.length || 0})
            </button>
            <button
              type="button"
              onClick={() => setRecActiveTab('LINK_SELLING')}
              className={cn(
                "px-4 py-2 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5",
                recActiveTab === 'LINK_SELLING'
                  ? "border-sky-500 text-sky-600"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              )}
            >
              <LinkIcon className="w-3.5 h-3.5 text-sky-600" />
              Link-Selling ({cartRecData?.linkSells?.length || 0})
            </button>
            <button
              type="button"
              onClick={() => setRecActiveTab('SUBSTITUTION')}
              className={cn(
                "px-4 py-2 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5",
                recActiveTab === 'SUBSTITUTION'
                  ? "border-amber-500 text-amber-600"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              )}
            >
              <RefreshCw className="w-3.5 h-3.5 text-amber-600" />
              Substitusi ({cartRecData?.substitutions?.length || 0})
            </button>
          </div>

          {isLoadingCartRec ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              Memuat rekomendasi produk...
            </div>
          ) : (
            (() => {
              const items = recActiveTab === 'UP_SELLING' 
                ? cartRecData?.upSells 
                : recActiveTab === 'LINK_SELLING' 
                  ? cartRecData?.linkSells 
                  : cartRecData?.substitutions;

              if (!items || items.length === 0) {
                return (
                  <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 text-center space-y-1">
                    <p className="text-sm font-bold text-slate-600">Belum ada aturan rekomendasi untuk obat ini</p>
                    <p className="text-xs text-slate-400">
                      Anda dapat mengatur relasi Up-Selling dan Link-Selling di menu <b>Master Data &gt; Rekomendasi Obat</b>.
                    </p>
                  </div>
                );
              }

              return (
                <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                  {items.map((it: any) => (
                    <div
                      key={it.productId}
                      className="p-3.5 bg-white border border-slate-200 rounded-xl hover:border-emerald-500 transition-all flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-slate-800 text-sm">{it.name}</p>
                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                          <span className="font-mono text-[11px] text-slate-400">SKU: {it.sku || '-'}</span>
                          <span>•</span>
                          <span>Stok: <b className={it.currentStock > 0 ? "text-emerald-600" : "text-rose-600"}>{it.currentStock} {it.unit || 'Unit'}</b></span>
                          <span>•</span>
                          <span className="font-black text-slate-800">Rp {it.sellingPrice?.toLocaleString('id-ID') || 0}</span>
                        </div>
                        {it.notes && (
                          <p className="text-[11px] text-slate-500 mt-1 italic">
                            💡 {it.notes}
                          </p>
                        )}
                      </div>

                      <Button
                        disabled={it.currentStock <= 0}
                        onClick={() => handleSelectSubstituteProduct(it.productId)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-9 px-4 rounded-xl text-xs flex items-center gap-1.5 shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Tambah
                      </Button>
                    </div>
                  ))}
                </div>
              );
            })()
          )}

          <div className="pt-2 border-t border-slate-100 flex justify-end">
            <Button
              variant="outline"
              onClick={() => setRecommendationModalItem(null)}
              className="rounded-xl text-xs"
            >
              Tutup
            </Button>
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

              {closedShiftSummary && (
                <div className="grid grid-cols-2 gap-4 text-xs bg-slate-100/70 p-3 rounded-xl border border-slate-200/50">
                  <div>
                    <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">- Penjualan Tunai (Cash)</span>
                    <p className="font-bold text-slate-700 mt-0.5">Rp {(closedShiftSummary.expectedEndingCash - closedShiftSummary.startingCash).toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">- Penjualan Non-Tunai</span>
                    <p className="font-bold text-slate-700 mt-0.5">Rp {(closedShiftSummary.totalSales - (closedShiftSummary.expectedEndingCash - closedShiftSummary.startingCash)).toLocaleString()}</p>
                  </div>
                </div>
              )}

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
                            @page { margin: 0; }
                            body { 
                              font-family: 'Courier New', Courier, monospace; 
                              width: 48mm; 
                              margin: 0; 
                              padding: 1mm 2mm; 
                              font-size: 10px; 
                              line-height: 1.3; 
                              color: #000; 
                              background-color: #fff;
                              -webkit-print-color-adjust: exact;
                              print-color-adjust: exact;
                            }
                            .text-center { text-align: center; }
                            .text-right { text-align: right; }
                            .bold { font-weight: bold; }
                            .header { border-bottom: 1px dashed #000; padding-bottom: 6px; margin-bottom: 6px; }
                            .header h2 { margin: 0; font-size: 14px; text-transform: uppercase; }
                            .header p { margin: 2px 0 0; font-size: 9px; }
                            .meta { border-bottom: 1px dashed #000; padding-bottom: 6px; margin-bottom: 6px; font-size: 9px; }
                            .meta p { margin: 2px 0; }
                            .details { border-bottom: 1px dashed #000; padding-bottom: 6px; margin-bottom: 6px; }
                            .row { display: flex; justify-content: space-between; margin-bottom: 3px; font-size: 10px; }
                            .sub-row { display: flex; justify-content: space-between; margin-bottom: 3px; padding-left: 6px; font-size: 9px; color: #333; }
                            .footer { font-size: 9px; margin-top: 10px; line-height: 1.2; }
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
                            <div class="sub-row">
                              <span>* Tunai (Cash)</span>
                              <span>Rp ${(closedShiftSummary.expectedEndingCash - closedShiftSummary.startingCash).toLocaleString()}</span>
                            </div>
                            <div class="sub-row">
                              <span>* Non-Tunai</span>
                              <span>Rp ${(closedShiftSummary.totalSales - (closedShiftSummary.expectedEndingCash - closedShiftSummary.startingCash)).toLocaleString()}</span>
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

      {/* Modal Racik Obat (Compound Prescriptions) */}
      <Dialog
        isOpen={isCompoundModalOpen}
        onClose={() => setIsCompoundModalOpen(false)}
        title="Racik Obat (Resep Racikan)"
      >
        <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-1 no-scrollbar text-slate-800">
          {/* Header Banner */}
          <div className="p-3 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 rounded-2xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="text-left leading-tight">
              <h4 className="text-sm font-bold text-emerald-950">Formula Obat Racikan</h4>
              <p className="text-xs text-emerald-700/80 mt-0.5">
                Pilih bahan obat dari inventori cabang aktif. Stok bahan akan otomatis dipotong saat transaksi selesai.
              </p>
            </div>
          </div>

          {/* Form Header Racikan */}
          <div className="space-y-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
            <h5 className="text-xs font-black text-slate-400 uppercase tracking-wider">1. Informasi Racikan</h5>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Nama Racikan *</label>
                <Input
                  placeholder="Contoh: Puyer Batuk Pilek Anak"
                  value={compoundName}
                  onChange={(e) => setCompoundName(e.target.value)}
                  className="bg-white border-slate-200 h-10 text-sm font-semibold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Bentuk Sediaan</label>
                <select
                  value={compoundPackageType}
                  onChange={(e) => setCompoundPackageType(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl h-10 px-3 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Puyer">Puyer (Serbuk Terbagi)</option>
                  <option value="Kapsul">Kapsul</option>
                  <option value="Salep">Salep / Krim Racik</option>
                  <option value="Sirup">Sirup / Suspensi Racik</option>
                  <option value="Tetes">Obat Tetes Racik</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Jumlah Kemasan / Bungkus</label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="1"
                    value={compoundQuantity}
                    onChange={(e) => setCompoundQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="bg-white border-slate-200 h-10 text-sm font-bold text-center"
                  />
                  <span className="text-xs font-semibold text-slate-500 shrink-0">
                    {compoundPackageType === 'Kapsul' ? 'Kapsul' : compoundPackageType === 'Salep' ? 'Pot' : compoundPackageType === 'Sirup' ? 'Botol' : 'Bungkus'}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Biaya Jasa Racik / Tuslah (Rp)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Rp</span>
                  <Input
                    type="number"
                    min="0"
                    value={compoundServiceFee}
                    onChange={(e) => setCompoundServiceFee(e.target.value)}
                    className="bg-white border-slate-200 h-10 pl-9 text-sm font-bold text-right"
                  />
                </div>
                <div className="flex gap-1.5 mt-1.5">
                  {[0, 3000, 5000, 10000].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setCompoundServiceFee(val.toString())}
                      className={cn(
                        "px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all border",
                        parseInt(compoundServiceFee || '0') === val 
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-sm" 
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                      )}
                    >
                      {val === 0 ? 'Gratis' : `+${val.toLocaleString()}`}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">Aturan Pakai / Dosis</label>
              <Input
                placeholder="Contoh: 3 x 1 bungkus sesudah makan"
                value={compoundDoseRule}
                onChange={(e) => setCompoundDoseRule(e.target.value)}
                className="bg-white border-slate-200 h-10 text-sm"
              />
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {[
                  "3 x 1 bungkus sesudah makan",
                  "3 x 1 bungkus sebelum makan",
                  "2 x 1 bungkus sesudah makan",
                  "1 x 1 bungkus malam hari",
                  "Oleskan tipis 2-3x sehari",
                  "Bila demam / perlunya"
                ].map((rule) => (
                  <button
                    key={rule}
                    type="button"
                    onClick={() => setCompoundDoseRule(rule)}
                    className="px-2 py-0.5 bg-white hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 border border-slate-200 rounded-lg text-[10px] text-slate-600 font-medium transition-colors"
                  >
                    {rule}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Form Komposisi Bahan */}
          <div className="space-y-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
            <div className="flex items-center justify-between">
              <h5 className="text-xs font-black text-slate-400 uppercase tracking-wider">
                2. Komposisi Bahan Obat ({compoundIngredients.length} Bahan)
              </h5>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddingIngredient(!isAddingIngredient)}
                className="h-8 px-2.5 text-xs font-bold text-emerald-700 border-emerald-200 hover:bg-emerald-50 rounded-xl gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Tambah Bahan
              </Button>
            </div>

            {/* List Bahan Terpilih */}
            {compoundIngredients.length === 0 ? (
              <div className="text-center py-6 border-2 border-dashed border-slate-200 rounded-xl bg-white">
                <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-500">Belum ada bahan obat racikan</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Klik tombol "Tambah Bahan" untuk mencari obat dari stok cabang.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {compoundIngredients.map((ing, idx) => (
                  <div 
                    key={idx}
                    className="p-3 bg-white rounded-xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-black flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <h6 className="text-xs font-bold text-slate-800 truncate">{ing.productName}</h6>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500">
                        <span>Stok: <strong className="text-emerald-600 font-bold">{ing.availableStock}</strong> {ing.unitName}</span>
                        <span>•</span>
                        <span>Harga: Rp {ing.unitPrice.toLocaleString()}/{ing.unitName}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                      {/* Unit Selector if multiple */}
                      {ing.units && ing.units.length > 1 && (
                        <select
                          value={ing.unitId}
                          onChange={(e) => {
                            const newUnitId = parseInt(e.target.value);
                            const selectedU = ing.units?.find((u: any) => u.id === newUnitId);
                            if (selectedU) {
                              setCompoundIngredients(prev => prev.map((item, i) => {
                                if (i !== idx) return item;
                                const newPrice = selectedU.pricePerUnit || item.unitPrice;
                                return {
                                  ...item,
                                  unitId: newUnitId,
                                  unitName: selectedU.unitName,
                                  unitPrice: newPrice,
                                  conversionToBase: selectedU.conversionToBase || 1,
                                  subtotal: item.quantity * newPrice
                                };
                              }));
                            }
                          }}
                          className="h-8 px-2 bg-slate-100 border-none rounded-lg text-xs font-semibold text-slate-700"
                        >
                          {ing.units.map((u: any) => (
                            <option key={u.id} value={u.id}>{u.unitName}</option>
                          ))}
                        </select>
                      )}

                      {/* Quantity Input */}
                      <div className="flex items-center gap-1.5 bg-slate-100 rounded-xl p-1">
                        <button
                          type="button"
                          onClick={() => {
                            const newQty = Math.max(0.1, Number((ing.quantity - 1).toFixed(2)));
                            setCompoundIngredients(prev => prev.map((item, i) => 
                              i === idx ? { ...item, quantity: newQty, subtotal: newQty * item.unitPrice } : item
                            ));
                          }}
                          className="w-6 h-6 rounded-lg bg-white hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <input
                          type="number"
                          step="any"
                          min="0.1"
                          max={ing.availableStock}
                          value={ing.quantity}
                          onChange={(e) => {
                            const newQty = Math.max(0.01, parseFloat(e.target.value) || 0);
                            setCompoundIngredients(prev => prev.map((item, i) => 
                              i === idx ? { ...item, quantity: newQty, subtotal: newQty * item.unitPrice } : item
                            ));
                          }}
                          className="w-14 bg-transparent text-center font-bold text-xs text-slate-800 border-none p-0 focus:ring-0"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newQty = Number((ing.quantity + 1).toFixed(2));
                            if (newQty <= ing.availableStock) {
                              setCompoundIngredients(prev => prev.map((item, i) => 
                                i === idx ? { ...item, quantity: newQty, subtotal: newQty * item.unitPrice } : item
                              ));
                            } else {
                              toast.error(`Kuantitas melebihi stok tersedia (${ing.availableStock})`);
                            }
                          }}
                          className="w-6 h-6 rounded-lg bg-white hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="text-right min-w-[70px]">
                        <p className="text-xs font-black text-emerald-600">Rp {Math.round(ing.subtotal).toLocaleString()}</p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setCompoundIngredients(prev => prev.filter((_, i) => i !== idx));
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 transition-colors"
                        title="Hapus Bahan"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Panel Cari Bahan Baru */}
            {isAddingIngredient && (
              <div className="p-3 bg-white rounded-xl border border-emerald-200 shadow-sm space-y-2.5 animate-in fade-in slide-in-from-top-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Search className="w-3.5 h-3.5 text-emerald-600" />
                    Pilih Bahan dari Stok Cabang
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsAddingIngredient(false)}
                    className="text-[11px] text-slate-400 hover:text-slate-600 font-bold"
                  >
                    Tutup
                  </button>
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Ketik nama obat atau SKU..."
                    value={ingredientSearch}
                    onChange={(e) => setIngredientSearch(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    autoFocus
                  />
                </div>

                <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 rounded-xl border border-slate-100 scrollbar-thin">
                  {inventory
                    ?.filter((inv: any) => {
                      if (inv.product?.active === false || inv.stockQuantity <= 0) return false;
                      const s = ingredientSearch.toLowerCase();
                      const name = inv.product?.name?.toLowerCase() || '';
                      const sku = inv.product?.sku?.toLowerCase() || '';
                      return name.includes(s) || sku.includes(s);
                    })
                    .slice(0, 15)
                    .map((inv: any) => {
                      const alreadyAdded = compoundIngredients.some(ing => ing.productId === inv.product.id);
                      const baseUnit = inv.product?.units?.find((u: any) => u.isBaseUnit) || inv.product?.units?.[0];
                      const unitPrice = baseUnit?.pricePerUnit || 0;

                      return (
                        <div
                          key={inv.id}
                          className="p-2 flex items-center justify-between hover:bg-slate-50 transition-colors"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-slate-800 truncate">{inv.product.name}</p>
                            <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                              <span>Stok: <strong className="text-emerald-600">{inv.stockQuantity}</strong> {baseUnit?.unitName || 'Pcs'}</span>
                              <span>•</span>
                              <span>Rp {unitPrice.toLocaleString()}</span>
                            </div>
                          </div>

                          <Button
                            type="button"
                            size="sm"
                            disabled={alreadyAdded}
                            onClick={() => {
                              setCompoundIngredients(prev => [
                                ...prev,
                                {
                                  productId: inv.product.id,
                                  productName: inv.product.name,
                                  unitId: baseUnit?.id || 0,
                                  unitName: baseUnit?.unitName || 'Pcs',
                                  quantity: 1,
                                  unitPrice: unitPrice,
                                  subtotal: unitPrice,
                                  availableStock: inv.stockQuantity,
                                  conversionToBase: baseUnit?.conversionToBase || 1,
                                  units: inv.product.units || []
                                }
                              ]);
                              toast.success(`Ditambahkan: ${inv.product.name}`);
                            }}
                            className={cn(
                              "h-7 px-2.5 text-[11px] font-bold rounded-lg",
                              alreadyAdded 
                                ? "bg-slate-100 text-slate-400 border-none" 
                                : "bg-emerald-600 hover:bg-emerald-700 text-white"
                            )}
                          >
                            {alreadyAdded ? 'Sudah Ada' : '+ Tambah'}
                          </Button>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>

          {/* Ringkasan Biaya & Kalkulasi */}
          {(() => {
            const totalIngredientsVal = compoundIngredients.reduce((sum, ing) => sum + ing.subtotal, 0);
            const feeVal = parseFloat(compoundServiceFee) || 0;
            const grandTotalVal = totalIngredientsVal + feeVal;

            return (
              <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl space-y-2">
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Subtotal Bahan Obat ({compoundIngredients.length} item)</span>
                  <span className="font-bold">Rp {Math.round(totalIngredientsVal).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Jasa Racik / Tuslah / Embalase</span>
                  <span className="font-bold">Rp {Math.round(feeVal).toLocaleString()}</span>
                </div>
                <div className="pt-2 border-t border-emerald-500/20 flex justify-between items-end">
                  <div>
                    <span className="text-xs font-black text-emerald-800 uppercase tracking-wide block">Total Paket Racikan</span>
                    <span className="text-[11px] text-slate-500 font-medium">
                      ({compoundQuantity} {compoundPackageType} @ Rp {Math.round(grandTotalVal / Math.max(1, compoundQuantity)).toLocaleString()})
                    </span>
                  </div>
                  <span className="text-xl font-black text-emerald-600">
                    Rp {Math.round(grandTotalVal).toLocaleString()}
                  </span>
                </div>
              </div>
            );
          })()}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1 h-11 border-slate-200 text-slate-600 hover:bg-slate-50"
              onClick={() => setIsCompoundModalOpen(false)}
            >
              Batal
            </Button>
            <Button
              type="button"
              className="flex-1 h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 shadow-sm"
              onClick={() => {
                if (!compoundName.trim()) {
                  toast.error('Nama racikan wajib diisi!');
                  return;
                }
                if (compoundIngredients.length === 0) {
                  toast.error('Komposisi bahan obat racikan minimal 1 obat!');
                  return;
                }
                for (const ing of compoundIngredients) {
                  if (ing.quantity <= 0) {
                    toast.error(`Kuantitas untuk ${ing.productName} harus lebih dari 0!`);
                    return;
                  }
                  if (ing.quantity > ing.availableStock) {
                    toast.error(`Kuantitas untuk ${ing.productName} (${ing.quantity}) melebihi stok (${ing.availableStock})!`);
                    return;
                  }
                }

                const totalIngredientsVal = compoundIngredients.reduce((sum, ing) => sum + ing.subtotal, 0);
                const feeVal = parseFloat(compoundServiceFee) || 0;
                const grandTotalVal = totalIngredientsVal + feeVal;

                const newCompoundItem: any = {
                  id: 'compound-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
                  productId: 0,
                  unitId: 0,
                  unitName: compoundPackageType,
                  name: compoundName.trim(),
                  sku: 'RACIKAN-' + compoundPackageType.toUpperCase(),
                  price: grandTotalVal,
                  pricePerUnit: grandTotalVal,
                  additionalPrices: [],
                  selectedPriceLabel: 'Racikan',
                  quantity: 1,
                  availableStock: 9999,
                  conversionToBase: 1,
                  isCompound: true,
                  compoundName: compoundName.trim(),
                  packageType: compoundPackageType,
                  doseRule: compoundDoseRule.trim(),
                  serviceFee: feeVal,
                  ingredients: compoundIngredients.map(ing => ({
                    productId: ing.productId,
                    productName: ing.productName,
                    unitId: ing.unitId,
                    unitName: ing.unitName,
                    quantity: ing.quantity,
                    unitPrice: ing.unitPrice,
                    subtotal: ing.subtotal,
                    availableStock: ing.availableStock
                  }))
                };

                dispatch(addToCart(newCompoundItem));
                setIsCompoundModalOpen(false);
                toast.success(`Obat racikan "${compoundName.trim()}" berhasil ditambahkan ke keranjang!`);
              }}
            >
              <Sparkles className="w-4 h-4" />
              Tambahkan ke Keranjang
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default POSPage;
