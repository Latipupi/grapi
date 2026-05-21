import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/api';
import { Button } from '../components/ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
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
  notes: string;
  details: PurchaseDetailItem[];
}

const PurchaseDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const printFrameRef = React.useRef<HTMLIFrameElement>(null);

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
        <div className="flex items-center gap-3">
          <Button 
            onClick={handlePrintSuratPesanan} 
            className="flex items-center gap-2 bg-white text-emerald-600 border border-emerald-200 hover:bg-emerald-50 font-bold h-10 px-4 rounded-xl shadow-sm"
          >
            <Printer className="w-4 h-4" /> Cetak Surat Pesanan
          </Button>
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
      <iframe ref={printFrameRef} style={{ display: 'none' }} title="Print Surat Pesanan" />
    </div>
  );
};

export default PurchaseDetailPage;
