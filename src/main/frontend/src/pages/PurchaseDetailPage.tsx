import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/api';
import { Button } from '../components/ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Pagination } from '../components/ui/Pagination';
import { ArrowLeft, ShoppingCart, Package, CreditCard, Truck, Calendar, Store, Printer } from 'lucide-react';

interface PurchaseDetailItem {
  id: number;
  product: { 
    id: number; 
    name: string; 
    sku?: string; 
    unit?: string; 
  };
  quantity: number;
  unitPrice: number;
  batchNumber: string;
  expiryDate: string;
  subtotal: number;
}

interface Purchase {
  id: number;
  supplier: { 
    name: string; 
    address?: string; 
    phone?: string; 
    pic?: string; 
  };
  branch: { 
    name: string; 
    address?: string; 
    phone?: string; 
  };
  purchaseDate: string;
  invoiceNumber: string;
  totalAmount: number;
  status: string;
  paymentMethod?: string;
  notes: string;
  details: PurchaseDetailItem[];
}

const PurchaseDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const printFrameRef = React.useRef<HTMLIFrameElement>(null);
  
  const queryClient = useQueryClient();
  const [isReceiveModalOpen, setIsReceiveModalOpen] = React.useState(false);
  const [invoiceNumber, setInvoiceNumber] = React.useState('');
  const [paymentMethod, setPaymentMethod] = React.useState('CASH');
  const [notes, setNotes] = React.useState('');
  const [receivedDetails, setReceivedDetails] = React.useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const entriesPerPage = 5;

  React.useEffect(() => {
    setCurrentPage(1);
  }, [id]);

  const { data: purchase, isLoading, isError } = useQuery<Purchase>({
    queryKey: ['purchase', id],
    queryFn: async () => {
      const res = await api.get(`/purchases/${id}`);
      return res.data;
    },
  });

  const handlePrintSuratPesanan = () => {
    if (!purchase) return;

    const spNumber = `SP/${new Date(purchase.purchaseDate).getFullYear()}/${purchase.id.toString().padStart(4, '0')}`;
    const formattedDate = new Date(purchase.purchaseDate).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const spContent = `
      <html>
        <head>
          <title>Surat Pesanan PBF - ${spNumber}</title>
          <style>
            body { 
              font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; 
              color: #333; 
              padding: 40px; 
              font-size: 13px; 
              line-height: 1.6;
            }
            .header-kop { 
              text-align: center; 
              border-bottom: 2px solid #000; 
              padding-bottom: 8px; 
              margin-bottom: 20px; 
            }
            .header-kop h1 { 
              margin: 0 0 5px; 
              font-size: 20px; 
              font-weight: bold; 
              text-transform: uppercase;
            }
            .header-kop p { 
              margin: 2px 0; 
              font-size: 11px; 
              color: #555; 
            }
            .doc-title { 
              text-align: center; 
              margin: 20px 0; 
            }
            .doc-title h2 { 
              margin: 0 0 5px; 
              font-size: 16px; 
              text-decoration: underline; 
              font-weight: bold;
            }
            .doc-title p { 
              margin: 0; 
              font-family: monospace; 
              font-size: 12px; 
            }
            .meta-section { 
              margin-bottom: 25px; 
            }
            .meta-grid { 
              display: grid; 
              grid-template-columns: 120px 8px 1fr; 
              row-gap: 5px; 
              font-size: 12px;
            }
            .meta-label { 
              font-weight: bold; 
            }
            .statement { 
              margin-bottom: 15px; 
              font-size: 12px;
            }
            table.items-table { 
              width: 100%; 
              border-collapse: collapse; 
              margin: 15px 0; 
              font-size: 12px;
            }
            table.items-table th { 
              border: 1px solid #333; 
              padding: 8px; 
              background-color: #f2f2f2; 
              font-weight: bold; 
              text-align: left;
            }
            table.items-table td { 
              border: 1px solid #333; 
              padding: 8px; 
            }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .signature-container { 
              margin-top: 40px; 
              display: flex; 
              justify-content: space-between; 
              font-size: 12px;
            }
            .sig-box { 
              text-align: center; 
              width: 250px; 
            }
            .sig-line { 
              margin-top: 70px; 
              border-top: 1px solid #333; 
              padding-top: 5px; 
              font-weight: bold; 
            }
            @media print {
              body { padding: 20px; }
              @page { size: A4 portrait; margin: 20mm; }
            }
          </style>
        </head>
        <body>
          <div class="header-kop">
            <h1>${purchase.branch?.name || 'APOTEK SELA FARMA'}</h1>
            <p>${purchase.branch?.address || 'Jl. Raya Apotek No. 1'}</p>
            <p>Telp: ${purchase.branch?.phone || '-'}</p>
            <p style="font-weight: bold; margin-top: 4px;">
              SIA: ............................................................ / SIPA: ............................................................
            </p>
          </div>

          <div class="doc-title">
            <h2>SURAT PESANAN OBAT</h2>
            <p>Nomor: ${spNumber}</p>
          </div>

          <div class="statement">
            <p>Kepada Yth. Pimpinan PBF / Distributor:</p>
            <div style="margin-left: 15px; margin-top: 5px; font-weight: bold;">
              ${purchase.supplier?.name}<br>
              <span style="font-weight: normal; font-size: 11px;">
                Alamat: ${purchase.supplier?.address || '-'}<br>
                Telp: ${purchase.supplier?.phone || '-'}
              </span>
            </div>
          </div>

          <div class="statement">
            <p>Harap dikirimkan obat-obatan untuk keperluan Apotek kami dengan rincian sebagai berikut:</p>
          </div>

          <table class="items-table">
            <thead>
              <tr>
                <th width="40px" class="text-center">No</th>
                <th>Nama Obat / Sediaan</th>
                <th class="text-right" width="80px">Jumlah</th>
                <th width="100px">Satuan</th>
                <th>Keterangan</th>
              </tr>
            </thead>
            <tbody>
              ${purchase.details?.map((item, idx) => `
                <tr>
                  <td class="text-center">${idx + 1}</td>
                  <td><strong>${item.product?.name || `Produk ID: ${item.product?.id}`}</strong></td>
                  <td class="text-right">${item.quantity}</td>
                  <td>${item.product?.unit || 'Pcs'}</td>
                  <td>${item.batchNumber ? `Batch: ${item.batchNumber}` : ''}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="signature-container">
            <div></div>
            <div class="sig-box">
              <p>Tanggal Pemesanan: ${formattedDate}</p>
              <p style="margin-top: 5px; font-weight: bold;">Apoteker Pengelola Apotek (APA)</p>
              <div class="sig-line">
                ( ............................................................ )
                <div style="font-weight: normal; font-size: 10px; margin-top: 4px;">SIPA No: ............................................................</div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    if (printFrameRef.current) {
      const doc = printFrameRef.current.contentDocument || printFrameRef.current.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(spContent);
        doc.close();
        setTimeout(() => {
          printFrameRef.current?.contentWindow?.focus();
          printFrameRef.current?.contentWindow?.print();
        }, 150);
      }
    }
  };



  React.useEffect(() => {
    if (purchase && purchase.details) {
      setReceivedDetails(
        purchase.details.map(item => ({
          id: item.id,
          product: item.product,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          batchNumber: item.batchNumber || '',
          expiryDate: item.expiryDate || '',
          subtotal: item.subtotal
        }))
      );
      setInvoiceNumber(purchase.invoiceNumber || '');
      setPaymentMethod(purchase.paymentMethod || 'CASH');
      setNotes(purchase.notes || '');
    }
  }, [purchase]);

  const handleDetailChange = (index: number, field: string, value: any) => {
    setReceivedDetails(prev => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        [field]: value
      };
      if (field === 'quantity' || field === 'unitPrice') {
        next[index].subtotal = next[index].quantity * next[index].unitPrice;
      }
      return next;
    });
  };

  const calculateGrandTotal = () => {
    return receivedDetails.reduce((sum, item) => sum + (item.subtotal || 0), 0);
  };

  const handleSubmitReceive = async () => {
    if (!invoiceNumber.trim()) {
      alert('Silakan isi Nomor Faktur terlebih dahulu!');
      return;
    }

    for (const item of receivedDetails) {
      if (!item.batchNumber.trim()) {
        alert(`Nomor Batch untuk produk "${item.product?.name}" wajib diisi!`);
        return;
      }
      if (!item.expiryDate) {
        alert(`Tanggal Kedaluwarsa untuk produk "${item.product?.name}" wajib diisi!`);
        return;
      }
    }

    try {
      setIsSubmitting(true);
      const payload = {
        invoiceNumber: invoiceNumber.trim(),
        paymentMethod,
        notes: notes.trim(),
        details: receivedDetails.map(item => ({
          id: item.id,
          product: { id: item.product.id },
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          batchNumber: item.batchNumber.trim().toUpperCase(),
          expiryDate: item.expiryDate
        }))
      };

      await api.put(`/purchases/${id}/receive`, payload);
      alert('Barang berhasil diterima! Stok obat dan catatan hutang/pembayaran telah diperbarui secara otomatis.');
      setIsReceiveModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['purchase', id] });
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
    } catch (err: any) {
      console.error(err);
      alert('Gagal memproses penerimaan barang: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

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
        <div className="flex items-center gap-3">
          {purchase.status === 'DRAFT' && (
            <Button
              onClick={() => setIsReceiveModalOpen(true)}
              className="flex items-center gap-2 bg-emerald-600 text-white hover:bg-emerald-700 font-bold h-10 px-4 rounded-xl shadow-md shadow-emerald-500/10 transition-all duration-200"
            >
              <Package className="w-4 h-4" /> Terima Barang
            </Button>
          )}
          <Button 
            onClick={handlePrintSuratPesanan} 
            className="flex items-center gap-2 bg-white text-emerald-600 border border-emerald-200 hover:bg-emerald-50 font-bold h-10 px-4 rounded-xl shadow-sm"
          >
            <Printer className="w-4 h-4" /> Cetak Surat Pesanan
          </Button>
          <span className={`px-4 py-1.5 rounded-full text-sm font-bold uppercase border ${
            purchase.status === 'RECEIVED' 
              ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
              : purchase.status === 'DRAFT'
                ? 'bg-amber-50 text-amber-600 border-amber-100'
                : 'bg-rose-50 text-rose-600 border-rose-100'
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
                    (() => {
                      const indexOfLastEntry = currentPage * entriesPerPage;
                      const indexOfFirstEntry = indexOfLastEntry - entriesPerPage;
                      const currentEntries = purchase.details.slice(indexOfFirstEntry, indexOfLastEntry);
                      return (
                        <>
                          {currentEntries.map((item) => (
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
                          ))}
                        </>
                      );
                    })()
                  )}
                </TableBody>
              </Table>
              {purchase.details && purchase.details.length > 0 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={Math.ceil(purchase.details.length / entriesPerPage)}
                  onPageChange={setCurrentPage}
                  totalEntries={purchase.details.length}
                  indexOfFirstEntry={(currentPage - 1) * entriesPerPage}
                  indexOfLastEntry={currentPage * entriesPerPage}
                  label="Item"
                />
              )}
            </div>
          </div>
        </div>
      </div>
      <iframe ref={printFrameRef} style={{ display: 'none' }} title="Print Surat Pesanan" />

      {/* Modal Terima Barang */}
      {isReceiveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-5xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
                  <Package className="w-5 h-5 text-emerald-600" />
                  Konfirmasi Penerimaan Barang
                </h2>
                <p className="text-slate-500 text-sm">Lengkapi detail faktur, nomor batch, dan tanggal kedaluwarsa fisik obat.</p>
              </div>
              <button 
                onClick={() => setIsReceiveModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors text-2xl font-bold font-mono px-2"
              >
                &times;
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Info Faktur */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Nomor Faktur / Invoice <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: FAK-99212"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm transition-all bg-white font-medium"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Metode Pembayaran</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm transition-all bg-white font-medium"
                  >
                    <option value="CASH">CASH</option>
                    <option value="TRANSFER">TRANSFER</option>
                    <option value="HUTANG">HUTANG (Tempo 30 Hari)</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Catatan Penerimaan</label>
                  <input
                    type="text"
                    placeholder="Catatan tambahan..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm transition-all bg-white"
                  />
                </div>
              </div>

              {/* Tabel Items */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                  <ShoppingCart className="w-4 h-4 text-emerald-600" />
                  Konfirmasi Detail Obat
                </h3>
                <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left text-sm text-slate-500">
                      <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase border-b border-slate-100">
                        <tr>
                          <th className="px-4 py-3">Nama Produk</th>
                          <th className="px-4 py-3 text-right" style={{ width: '90px' }}>Qty</th>
                          <th className="px-4 py-3 text-right" style={{ width: '130px' }}>Harga Satuan</th>
                          <th className="px-4 py-3" style={{ width: '160px' }}>No. Batch *</th>
                          <th className="px-4 py-3" style={{ width: '170px' }}>Exp. Date *</th>
                          <th className="px-4 py-3 text-right">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {receivedDetails.map((item, index) => (
                          <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-4 py-3 font-semibold text-slate-800">
                              {item.product?.name}
                              <span className="block text-xs font-normal text-slate-400 font-mono mt-0.5">{item.product?.sku || '-'}</span>
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => handleDetailChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                                className="w-full px-2 py-1 text-right border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 font-semibold"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <div className="relative flex items-center">
                                <span className="absolute left-2 text-xs font-semibold text-slate-400">Rp</span>
                                <input
                                  type="number"
                                  min="0"
                                  value={item.unitPrice}
                                  onChange={(e) => handleDetailChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                                  className="w-full pl-7 pr-2 py-1 text-right border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 font-semibold"
                                />
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="text"
                                required
                                placeholder="No Batch"
                                value={item.batchNumber}
                                onChange={(e) => handleDetailChange(index, 'batchNumber', e.target.value)}
                                className="w-full px-2.5 py-1 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 font-mono text-xs uppercase"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="date"
                                required
                                value={item.expiryDate}
                                onChange={(e) => handleDetailChange(index, 'expiryDate', e.target.value)}
                                className="w-full px-2 py-1 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 text-xs"
                              />
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-emerald-600">
                              Rp {item.subtotal?.toLocaleString() || 0}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold text-slate-500">Estimasi Total Akhir:</span>
                <span className="text-lg font-black text-emerald-600">Rp {calculateGrandTotal().toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => setIsReceiveModalOpen(false)}
                  className="h-10 px-4 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 font-bold"
                >
                  Batal
                </Button>
                <Button
                  onClick={handleSubmitReceive}
                  disabled={isSubmitting}
                  className="h-10 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-500/10 flex items-center gap-2"
                >
                  {isSubmitting ? 'Memproses...' : 'Konfirmasi & Terima'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseDetailPage;
