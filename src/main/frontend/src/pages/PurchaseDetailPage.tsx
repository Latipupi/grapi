import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/api';
import { Button } from '../components/ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { ArrowLeft, ShoppingCart, Package, CreditCard, Truck, Calendar, Store } from 'lucide-react';

interface PurchaseDetailItem {
  id: number;
  product: { id: number; name: string };
  quantity: number;
  unitPrice: number;
  batchNumber: string;
  expiryDate: string;
  subtotal: number;
}

interface Purchase {
  id: number;
  supplier: { name: string };
  branch: { name: string };
  purchaseDate: string;
  invoiceNumber: string;
  totalAmount: number;
  status: string;
  notes: string;
  details: PurchaseDetailItem[];
}

const PurchaseDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: purchase, isLoading, isError } = useQuery<Purchase>({
    queryKey: ['purchase', id],
    queryFn: async () => {
      const res = await api.get(`/purchases/${id}`);
      return res.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-500">Memuat data pembelian...</p>
      </div>
    );
  }

  if (isError || !purchase) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-red-500">Gagal memuat data pembelian.</p>
        <Button onClick={() => navigate('/dashboard/purchasing')} variant="outline">
          Kembali
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/purchasing')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              Detail Pembelian {purchase.invoiceNumber ? `#${purchase.invoiceNumber}` : `#PO-${purchase.id}`}
            </h1>
            <p className="text-slate-500 text-sm">Informasi lengkap riwayat pembelian.</p>
          </div>
        </div>
        <div>
           <span className={`px-4 py-1.5 rounded-full text-sm font-bold uppercase border ${
            purchase.status === 'RECEIVED' 
              ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
              : 'bg-amber-50 text-amber-600 border-amber-100'
          }`}>
            {purchase.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info Utama */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-6">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-4">
              <ShoppingCart className="w-5 h-5 text-emerald-600" />
              Info Utama
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center shrink-0">
                  <Truck className="w-5 h-5 text-slate-500" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Supplier</p>
                  <p className="text-slate-800 font-medium">{purchase.supplier?.name || '-'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center shrink-0">
                  <Store className="w-5 h-5 text-slate-500" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Cabang</p>
                  <p className="text-slate-800 font-medium">{purchase.branch?.name || '-'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center shrink-0">
                  <Calendar className="w-5 h-5 text-slate-500" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Tanggal Pembelian</p>
                  <p className="text-slate-800 font-medium">
                    {new Date(purchase.purchaseDate).toLocaleDateString('id-ID', {
                      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
              
              {purchase.notes && (
                <div className="mt-4 p-4 bg-amber-50/50 border border-amber-100 rounded-xl">
                  <p className="text-xs font-bold text-amber-600/70 uppercase mb-1">Catatan</p>
                  <p className="text-sm text-amber-800">{purchase.notes}</p>
                </div>
              )}

              <div className="pt-4 border-t border-slate-100">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-slate-500 font-medium flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4" /> Total Pembelian
                  </span>
                  <span className="text-xl font-black text-emerald-600">Rp {purchase.totalAmount?.toLocaleString() || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Daftar Item */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col h-full">
             <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Package className="w-5 h-5 text-emerald-600" />
                Daftar Item
              </h2>
            </div>
            <div className="overflow-x-auto flex-1">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produk</TableHead>
                    <TableHead>Batch & Exp</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Harga Satuan</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchase.details?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-32 text-center text-slate-400">
                        Tidak ada detail item.
                      </TableCell>
                    </TableRow>
                  ) : (
                    purchase.details?.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="font-medium text-slate-800">{item.product?.name || `Product ID: ${item.product?.id}`}</div>
                        </TableCell>
                        <TableCell>
                           <div className="text-sm">
                             <span className="font-mono text-slate-600">{item.batchNumber || '-'}</span>
                             <br />
                             <span className="text-xs text-slate-400">Exp: {item.expiryDate ? new Date(item.expiryDate).toLocaleDateString('id-ID') : '-'}</span>
                           </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {item.quantity}
                        </TableCell>
                        <TableCell className="text-right">
                          Rp {item.unitPrice?.toLocaleString() || 0}
                        </TableCell>
                        <TableCell className="text-right font-bold text-emerald-600">
                          Rp {item.subtotal?.toLocaleString() || 0}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchaseDetailPage;
