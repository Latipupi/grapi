import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/api';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { 
  Package, 
  Calendar, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Search, 
  Download, 
  Printer,
  ChevronDown,
  X
} from 'lucide-react';
import { cn, parseSafeExpiryDate } from '../lib/utils';

interface Branch {
  id: number;
  name: string;
}

interface Product {
  id: number;
  name: string;
  sku: string;
}

interface InventoryBatch {
  id: number;
  batchNumber: string;
  expiryDate: string;
  currentQuantity: number;
  purchasePrice: number;
  product: Product;
}

const ProductSearchSelect: React.FC<{
  products: any[];
  value: string;
  onChange: (value: string) => void;
}> = ({ products, value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const selectedProduct = products.find(p => p.id.toString() === value);
    if (selectedProduct) {
      setSearchTerm(selectedProduct.name);
    } else {
      setSearchTerm('');
    }
  }, [value, products]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        const selectedProduct = products.find(p => p.id.toString() === value);
        setSearchTerm(selectedProduct ? selectedProduct.name : '');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [value, products]);

  const filtered = products.filter(p => {
    if (p.active === false) return false;
    const term = searchTerm.toLowerCase();
    return (
      p.name?.toLowerCase().includes(term) ||
      (p.sku && p.sku.toLowerCase().includes(term))
    );
  });

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          className="w-full h-10 rounded-xl border border-slate-200 bg-white pl-9 pr-8 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none placeholder:text-slate-400 font-semibold"
          placeholder="Cari obat atau SKU..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {value && (
            <button
              type="button"
              onClick={() => {
                onChange('');
                setSearchTerm('');
                setIsOpen(false);
              }}
              className="text-slate-400 hover:text-slate-600 focus:outline-none"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <ChevronDown className="w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto p-1">
          {filtered.length === 0 ? (
            <div className="px-3 py-2.5 text-xs text-slate-400 italic text-center">
              Obat tidak ditemukan
            </div>
          ) : (
            filtered.map((p) => (
              <button
                key={p.id}
                type="button"
                className={`w-full text-left px-3 py-2 text-xs rounded-lg transition-colors flex justify-between items-center ${
                  value === p.id.toString()
                    ? 'bg-emerald-50 text-emerald-700 font-bold'
                    : 'hover:bg-slate-50 text-slate-700 font-semibold'
                }`}
                onClick={() => {
                  onChange(p.id.toString());
                  setSearchTerm(p.name);
                  setIsOpen(false);
                }}
              >
                <div className="flex flex-col">
                  <span>{p.name}</span>
                  {p.sku && <span className="text-[9px] text-slate-400 font-mono">SKU: {p.sku}</span>}
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

const DigitalStockPage: React.FC = () => {
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SAFE' | 'NEAR_EXP' | 'EXPIRED'>('ALL');
  const [activeTab, setActiveTab] = useState<'BATCH' | 'CARD'>('BATCH');
  const [selectedProductId, setSelectedProductId] = useState<string>('');

  const { data: branches } = useQuery<Branch[]>({
    queryKey: ['branches'],
    queryFn: () => api.get('/branches').then(res => res.data),
  });

  const { data: products } = useQuery<any[]>({
    queryKey: ['products'],
    queryFn: () => api.get('/products').then(res => res.data),
  });

  useEffect(() => {
    if (branches && branches.length > 0 && !selectedBranchId) {
      setSelectedBranchId(branches[0].id.toString());
    }
  }, [branches, selectedBranchId]);

  const { data: batches, isLoading } = useQuery<InventoryBatch[]>({
    queryKey: ['inventory-batches', selectedBranchId],
    queryFn: () => api.get(`/inventory/branch/${selectedBranchId}/batches`).then(res => res.data),
    enabled: !!selectedBranchId,
  });

  const { data: movements, isLoading: isMovementsLoading } = useQuery<any[]>({
    queryKey: ['movements', selectedBranchId, selectedProductId],
    queryFn: () => api.get(`/inventory/branch/${selectedBranchId}/product/${selectedProductId}/movements`).then(res => res.data),
    enabled: !!selectedBranchId && !!selectedProductId && activeTab === 'CARD',
  });

  const movementsWithSisa = useMemo(() => {
    if (!movements) return [];
    
    const sorted = [...movements].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    
    let balance = 0;
    return sorted.map((m, index) => {
      const isMasuk = m.type === 'IN' || (m.type === 'ADJUSTMENT' && m.quantity > 0);
      const masukQty = isMasuk ? m.quantity : 0;
      const keluarQty = !isMasuk ? m.quantity : 0;
      
      if (isMasuk) {
        balance += m.quantity;
      } else {
        balance -= m.quantity;
      }
      
      return {
        ...m,
        no: index + 1,
        masuk: masukQty,
        keluar: keluarQty,
        sisa: balance
      };
    });
  }, [movements]);

  const isExpired = (dateStr: string) => parseSafeExpiryDate(dateStr) < new Date();
  
  const isNearExpired = (dateStr: string) => {
    const date = parseSafeExpiryDate(dateStr);
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
    return date < threeMonthsFromNow && date >= new Date();
  };

  const getBatchStatus = (dateStr: string): 'SAFE' | 'NEAR_EXP' | 'EXPIRED' => {
    if (isExpired(dateStr)) return 'EXPIRED';
    if (isNearExpired(dateStr)) return 'NEAR_EXP';
    return 'SAFE';
  };

  // Filter batches
  const filteredBatches = useMemo(() => {
    if (!batches) return [];

    return batches.filter(batch => {
      if (!batch.product) return false;
      
      // Search filter
      const search = searchTerm.toLowerCase();
      const matchSearch = 
        batch.product.name.toLowerCase().includes(search) ||
        batch.product.sku.toLowerCase().includes(search) ||
        batch.batchNumber.toLowerCase().includes(search);
      
      if (!matchSearch) return false;

      // Status filter
      const status = getBatchStatus(batch.expiryDate);
      if (statusFilter !== 'ALL' && status !== statusFilter) {
        return false;
      }

      return true;
    });
  }, [batches, searchTerm, statusFilter]);

  // Aggregate metrics
  const metrics = useMemo(() => {
    if (!batches) return { totalQuantity: 0, safeCount: 0, nearExpCount: 0, expiredCount: 0, totalItems: 0 };

    let totalQuantity = 0;
    let safeCount = 0;
    let nearExpCount = 0;
    let expiredCount = 0;

    batches.forEach(batch => {
      const qty = batch.currentQuantity || 0;
      totalQuantity += qty;

      const status = getBatchStatus(batch.expiryDate);
      if (status === 'EXPIRED') expiredCount++;
      else if (status === 'NEAR_EXP') nearExpCount++;
      else safeCount++;
    });

    return {
      totalQuantity,
      safeCount,
      nearExpCount,
      expiredCount,
      totalItems: batches.length
    };
  }, [batches]);

  const activeBranchName = branches?.find(b => b.id.toString() === selectedBranchId)?.name || 'Cabang';

  // Export to Excel
  const handleExportExcel = () => {
    if (filteredBatches.length === 0) return;

    const headers = [
      'SKU', 'Nama Produk', 'Nomor Batch', 'Tanggal Kadaluarsa', 'Stok Digital', 'Status'
    ];

    const rows = filteredBatches.map(batch => {
      const status = getBatchStatus(batch.expiryDate);
      const statusText = status === 'EXPIRED' ? 'EXPIRED' : status === 'NEAR_EXP' ? 'SEGERA EXP' : 'AMAN';
      return [
        batch.product.sku,
        batch.product.name,
        batch.batchNumber,
        parseSafeExpiryDate(batch.expiryDate).toLocaleDateString('id-ID'),
        batch.currentQuantity,
        statusText
      ];
    });

    const excelTemplate = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Stok Digital</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          th { background-color: #0ea5e9; color: white; font-weight: bold; }
          td { border: 0.5px solid #e5e7eb; }
        </style>
      </head>
      <body>
        <h2>Laporan Status Stok Digital & Expiry Date</h2>
        <p><b>Cabang:</b> ${activeBranchName}</p>
        <p><b>Tanggal Cetak:</b> ${new Date().toLocaleString('id-ID')}</p>
        <br/>
        <table>
          <thead>
            <tr>
              ${headers.map(h => `<th>${h}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${rows.map(row => `
              <tr>
                ${row.map(val => `<td>${val}</td>`).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([excelTemplate], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Stok_Digital_${activeBranchName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print Report
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const htmlContent = `
      <html>
        <head>
          <title>Stok Digital - ${activeBranchName}</title>
          <style>
            body { font-family: 'Inter', sans-serif; color: #333; padding: 25px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #0ea5e9; padding-bottom: 10px; }
            .header h1 { margin: 0; color: #0ea5e9; font-size: 22px; }
            .header p { margin: 5px 0 0; color: #666; font-size: 13px; }
            .meta { display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 11px; color: #555; }
            .stats-grid { display: grid; grid-template-cols: repeat(4, 1fr); gap: 15px; margin-bottom: 25px; }
            .stat-card { border: 1px solid #e5e7eb; padding: 12px; border-radius: 8px; background: #f9fafb; text-align: center; }
            .stat-card p { margin: 0; font-size: 9px; color: #888; text-transform: uppercase; font-weight: bold; }
            .stat-card h3 { margin: 5px 0 0; font-size: 15px; color: #111; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 11px; }
            th { background-color: #f3f4f6; color: #374151; font-weight: bold; text-align: left; padding: 8px; border-bottom: 2px solid #e5e7eb; }
            td { padding: 8px; border-bottom: 1px solid #f3f4f6; }
            .text-right { text-align: right; }
            .font-bold { font-weight: bold; }
            .badge { display: inline-block; padding: 3px 8px; border-radius: 4px; font-size: 9px; font-weight: bold; }
            .badge-safe { background: #ecfdf5; color: #047857; }
            .badge-near { background: #fffbeb; color: #b45309; }
            .badge-expired { background: #fef2f2; color: #b91c1c; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>LAPORAN STOK DIGITAL DAN KADALUARSA</h1>
            <p>Sistem Manajemen Apotek G-Apotek</p>
          </div>
          <div class="meta">
            <div><strong>Cabang:</strong> ${activeBranchName}</div>
            <div><strong>Waktu Cetak:</strong> ${new Date().toLocaleString('id-ID')}</div>
          </div>
          <div class="stats-grid">
            <div class="stat-card">
              <p>Total Batches</p>
              <h3>${filteredBatches.length} Baris</h3>
            </div>
            <div class="stat-card">
              <p>Stok Aman</p>
              <h3 style="color: #047857;">${metrics.safeCount} Batch</h3>
            </div>
            <div class="stat-card">
              <p>Segera Expired</p>
              <h3 style="color: #b45309;">${metrics.nearExpCount} Batch</h3>
            </div>
            <div class="stat-card">
              <p>Expired</p>
              <h3 style="color: #b91c1c;">${metrics.expiredCount} Batch</h3>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>SKU</th>
                <th>Nama Produk</th>
                <th>Nomor Batch</th>
                <th>Expired Date</th>
                <th class="text-right">Stok Digital</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${filteredBatches.map(batch => {
                const status = getBatchStatus(batch.expiryDate);
                const badgeClass = status === 'EXPIRED' ? 'badge-expired' : status === 'NEAR_EXP' ? 'badge-near' : 'badge-safe';
                const statusText = status === 'EXPIRED' ? 'EXPIRED' : status === 'NEAR_EXP' ? 'SEGERA EXP' : 'AMAN';
                return `
                  <tr>
                    <td>${batch.product.sku}</td>
                    <td class="font-bold">${batch.product.name}</td>
                    <td>${batch.batchNumber}</td>
                    <td>${parseSafeExpiryDate(batch.expiryDate).toLocaleDateString('id-ID')}</td>
                    <td class="text-right font-bold">${batch.currentQuantity.toLocaleString('id-ID')}</td>
                    <td><span class="badge ${badgeClass}">${statusText}</span></td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
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

  const handlePrintCard = () => {
    const selectedProduct = products?.find(p => p.id.toString() === selectedProductId);
    if (!selectedProduct) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const rows = movementsWithSisa.map(m => `
      <tr>
        <td style="text-align: center;">${m.no}</td>
        <td>${new Date(m.createdAt).toLocaleDateString('id-ID')} ${new Date(m.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</td>
        <td style="text-align: right; font-weight: bold;">${m.masuk > 0 ? m.masuk.toLocaleString('id-ID') : '-'}</td>
        <td style="text-align: right; font-weight: bold;">${m.keluar > 0 ? m.keluar.toLocaleString('id-ID') : '-'}</td>
        <td style="text-align: right; font-weight: bold; background-color: #f8fafc;">${m.sisa.toLocaleString('id-ID')}</td>
        <td>${m.referenceNumber || ''} - ${m.notes || ''}</td>
      </tr>
    `).join('');

    const minRows = 15;
    let emptyRows = '';
    if (movementsWithSisa.length < minRows) {
      for (let i = movementsWithSisa.length + 1; i <= minRows; i++) {
        emptyRows += `
          <tr>
            <td style="text-align: center; color: #ccc;">${i}</td>
            <td>&nbsp;</td>
            <td>&nbsp;</td>
            <td>&nbsp;</td>
            <td>&nbsp;</td>
            <td>&nbsp;</td>
          </tr>
        `;
      }
    }

    const htmlContent = `
      <html>
        <head>
          <title>Kartu Stok - ${selectedProduct.name}</title>
          <style>
            body { font-family: 'Courier New', Courier, monospace; color: #000; padding: 20px; }
            .card-container { border: 2px solid #000; padding: 20px; max-width: 800px; margin: 0 auto; }
            .title { text-align: center; font-size: 20px; font-weight: bold; text-transform: uppercase; margin-bottom: 20px; letter-spacing: 2px; }
            .info-section { margin-bottom: 20px; line-height: 1.6; }
            .info-row { display: flex; margin-bottom: 4px; }
            .info-label { width: 150px; font-weight: bold; }
            .info-value { border-bottom: 1px dotted #000; flex: 1; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th, td { border: 1px solid #000; padding: 8px; font-size: 12px; }
            th { text-transform: uppercase; font-weight: bold; background-color: #f2f2f2; }
            .footer { margin-top: 30px; display: flex; justify-content: space-between; font-size: 11px; }
          </style>
        </head>
        <body>
          <div class="card-container">
            <div class="title">Kartu Stok Barang</div>
            
            <div class="info-section">
              <div class="info-row">
                <div class="info-label">Nama Barang</div>
                <div class="info-value">: ${selectedProduct.name}</div>
              </div>
              <div class="info-row">
                <div class="info-label">Satuan</div>
                <div class="info-value">: ${selectedProduct.unit || 'PCS'}</div>
              </div>
              <div class="info-row">
                <div class="info-label">Spesifikasi/SKU</div>
                <div class="info-value">: ${selectedProduct.sku || '-'}</div>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th style="width: 50px;">NO.</th>
                  <th style="width: 150px;">TANGGAL</th>
                  <th style="width: 100px;">MASUK</th>
                  <th style="width: 100px;">KELUAR</th>
                  <th style="width: 100px;">SISA</th>
                  <th>KETERANGAN</th>
                </tr>
              </thead>
              <tbody>
                ${rows}
                ${emptyRows}
              </tbody>
            </table>

            <div class="footer">
              <div>Sistem Informasi Apotek G-Apotek</div>
              <div>Dicetak pada: ${new Date().toLocaleString('id-ID')}</div>
            </div>
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

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Stok Digital & Kartu Stok</h1>
          <p className="text-slate-500 text-sm">Monitoring stok digital real-time berdasarkan batch dan penelusuran riwayat kartu stok barang.</p>
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
          {activeTab === 'BATCH' && (
            <>
              <Button onClick={handleExportExcel} variant="outline" className="flex items-center gap-2 h-10 border-slate-200">
                <Download className="w-4 h-4 text-emerald-600" />
                Excel
              </Button>
              <Button onClick={handlePrint} className="flex items-center gap-2 h-10 bg-slate-900">
                <Printer className="w-4 h-4" />
                Cetak
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('BATCH')}
          className={cn(
            "px-6 py-3 text-sm font-bold border-b-2 transition-all",
            activeTab === 'BATCH'
              ? "border-emerald-500 text-emerald-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          )}
        >
          Status Batch & Kadaluarsa
        </button>
        <button
          onClick={() => setActiveTab('CARD')}
          className={cn(
            "px-6 py-3 text-sm font-bold border-b-2 transition-all",
            activeTab === 'CARD'
              ? "border-emerald-500 text-emerald-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          )}
        >
          Kartu Stok Barang
        </button>
      </div>

      {activeTab === 'BATCH' ? (
        <>
          {/* Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-sky-50 text-sky-600">
                  <Package className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Item Digital</p>
                  <h3 className="text-xl font-black text-slate-800 mt-0.5">{metrics.totalQuantity.toLocaleString('id-ID')} Unit</h3>
                </div>
              </div>
              <div className="absolute bottom-0 left-0 h-1 w-full bg-sky-500/10" />
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Batch Status Aman</p>
                  <h3 className="text-xl font-black text-emerald-600 mt-0.5">{metrics.safeCount} Batch</h3>
                </div>
              </div>
              <div className="absolute bottom-0 left-0 h-1 w-full bg-emerald-500/10" />
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-amber-50 text-amber-600">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Segera Kadaluarsa</p>
                  <h3 className="text-xl font-black text-amber-500 mt-0.5">{metrics.nearExpCount} Batch</h3>
                </div>
              </div>
              <div className="absolute bottom-0 left-0 h-1 w-full bg-amber-500/10" />
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-rose-50 text-rose-600">
                  <XCircle className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Sudah Kadaluarsa</p>
                  <h3 className="text-xl font-black text-rose-600 mt-0.5">{metrics.expiredCount} Batch</h3>
                </div>
              </div>
              <div className="absolute bottom-0 left-0 h-1 w-full bg-rose-500/10" />
            </div>
          </div>

          {/* Filter and Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-sm w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Cari SKU, nama produk, atau batch..."
                  className="pl-10 h-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Quick Filters */}
              <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-100 self-start sm:self-auto shrink-0">
                <button
                  onClick={() => setStatusFilter('ALL')}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                    statusFilter === 'ALL'
                      ? "bg-white text-slate-800 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  )}
                >
                  Semua
                </button>
                <button
                  onClick={() => setStatusFilter('SAFE')}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                    statusFilter === 'SAFE'
                      ? "bg-emerald-500 text-white shadow-sm"
                      : "text-slate-500 hover:text-emerald-500"
                  )}
                >
                  Aman
                </button>
                <button
                  onClick={() => setStatusFilter('NEAR_EXP')}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                    statusFilter === 'NEAR_EXP'
                      ? "bg-amber-500 text-white shadow-sm"
                      : "text-slate-500 hover:text-amber-500"
                  )}
                >
                  Hampir Exp
                </button>
                <button
                  onClick={() => setStatusFilter('EXPIRED')}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                    statusFilter === 'EXPIRED'
                      ? "bg-rose-500 text-white shadow-sm"
                      : "text-slate-500 hover:text-rose-500"
                  )}
                >
                  Expired
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead>Nama Produk</TableHead>
                    <TableHead>Nomor Batch</TableHead>
                    <TableHead><span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Expired Date</span></TableHead>
                    <TableHead className="text-right">Stok Digital</TableHead>
                    <TableHead className="text-center">Status Kadaluarsa</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-slate-400">
                        Memuat data stok digital...
                      </TableCell>
                    </TableRow>
                  ) : filteredBatches.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-slate-400">
                        Tidak ada data stok digital yang sesuai filter.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredBatches.map((batch) => {
                      const status = getBatchStatus(batch.expiryDate);

                      return (
                        <TableRow key={batch.id} className="hover:bg-slate-50/50">
                          <TableCell className="font-mono text-xs text-slate-500">{batch.product.sku}</TableCell>
                          <TableCell className="font-bold text-slate-800">{batch.product.name}</TableCell>
                          <TableCell className="font-mono text-xs text-slate-600">{batch.batchNumber}</TableCell>
                          <TableCell className="text-sm text-slate-500">
                            {parseSafeExpiryDate(batch.expiryDate).toLocaleDateString('id-ID')}
                          </TableCell>
                          <TableCell className="text-right font-black text-slate-700">
                            {batch.currentQuantity.toLocaleString('id-ID')}
                          </TableCell>
                          <TableCell className="text-center">
                            {status === 'EXPIRED' ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full">
                                <XCircle className="w-3.5 h-3.5" /> EXPIRED
                              </span>
                            ) : status === 'NEAR_EXP' ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">
                                <AlertTriangle className="w-3.5 h-3.5" /> SEGERA EXP
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                                <CheckCircle2 className="w-3.5 h-3.5" /> AMAN
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="w-full sm:max-w-md">
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Pilih Barang / Obat</label>
              <ProductSearchSelect
                products={products || []}
                value={selectedProductId}
                onChange={setSelectedProductId}
              />
            </div>
            
            {selectedProductId && movementsWithSisa.length > 0 && (
              <Button 
                onClick={handlePrintCard}
                className="flex items-center gap-2 bg-slate-900 self-end sm:self-center"
              >
                <Printer className="w-4 h-4" />
                Cetak Kartu Stok
              </Button>
            )}
          </div>

          {selectedProductId ? (
            isMovementsLoading ? (
              <div className="text-center py-12 text-slate-400">Memuat data kartu stok...</div>
            ) : (
              <div className="space-y-6">
                {/* Info Card Header */}
                {(() => {
                  const prod = products?.find(p => p.id.toString() === selectedProductId);
                  if (!prod) return null;
                  return (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                      <div>
                        <span className="block text-[10px] uppercase font-bold text-slate-400">Nama Barang</span>
                        <span className="text-sm font-bold text-slate-800">{prod.name}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] uppercase font-bold text-slate-400">Satuan</span>
                        <span className="text-sm font-bold text-slate-800">{prod.unit || 'PCS'}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] uppercase font-bold text-slate-400">Spesifikasi / SKU</span>
                        <span className="text-sm font-mono font-bold text-slate-800">{prod.sku || '-'}</span>
                      </div>
                    </div>
                  );
                })()}

                {/* Movements Table */}
                <div className="overflow-x-auto border border-slate-100 rounded-xl">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12 text-center">NO.</TableHead>
                        <TableHead>TANGGAL</TableHead>
                        <TableHead className="text-right">MASUK</TableHead>
                        <TableHead className="text-right">KELUAR</TableHead>
                        <TableHead className="text-right">SISA</TableHead>
                        <TableHead>KETERANGAN</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {movementsWithSisa.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="h-32 text-center text-slate-400">
                            Belum ada riwayat pergerakan stok untuk barang ini.
                          </TableCell>
                        </TableRow>
                      ) : (
                        movementsWithSisa.map((m) => (
                          <TableRow key={m.id} className="hover:bg-slate-50/50">
                            <TableCell className="text-center font-bold text-slate-400">{m.no}</TableCell>
                            <TableCell className="text-slate-600 text-sm">
                              {new Date(m.createdAt).toLocaleDateString('id-ID')} {new Date(m.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                            </TableCell>
                            <TableCell className="text-right font-bold text-emerald-600 text-sm">
                              {m.masuk > 0 ? m.masuk.toLocaleString('id-ID') : '-'}
                            </TableCell>
                            <TableCell className="text-right font-bold text-rose-600 text-sm">
                              {m.keluar > 0 ? m.keluar.toLocaleString('id-ID') : '-'}
                            </TableCell>
                            <TableCell className="text-right font-black text-slate-700 bg-slate-50/50 text-sm">
                              {m.sisa.toLocaleString('id-ID')}
                            </TableCell>
                            <TableCell className="text-slate-600 text-xs font-semibold">
                              <div className="flex flex-col">
                                <span className="font-mono text-slate-400 text-[10px]">{m.referenceNumber}</span>
                                <span>{m.notes}</span>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )
          ) : (
            <div className="text-center py-12 text-slate-400 border border-dashed border-slate-200 rounded-2xl">
              Silakan pilih barang/obat terlebih dahulu untuk melihat kartu stok.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DigitalStockPage;
