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
  Printer
} from 'lucide-react';
import { cn } from '../lib/utils';

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

const DigitalStockPage: React.FC = () => {
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SAFE' | 'NEAR_EXP' | 'EXPIRED'>('ALL');

  const { data: branches } = useQuery<Branch[]>({
    queryKey: ['branches'],
    queryFn: () => api.get('/branches').then(res => res.data),
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

  const isExpired = (dateStr: string) => new Date(dateStr) < new Date();
  
  const isNearExpired = (dateStr: string) => {
    const date = new Date(dateStr);
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
        new Date(batch.expiryDate).toLocaleDateString('id-ID'),
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
                    <td>${new Date(batch.expiryDate).toLocaleDateString('id-ID')}</td>
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

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Stok Digital</h1>
          <p className="text-slate-500 text-sm">Monitoring stok digital real-time berdasarkan batch dan deteksi dini produk kadaluarsa.</p>
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
          <Button onClick={handleExportExcel} variant="outline" className="flex items-center gap-2 h-10 border-slate-200">
            <Download className="w-4 h-4 text-emerald-600" />
            Excel
          </Button>
          <Button onClick={handlePrint} className="flex items-center gap-2 h-10 bg-slate-900">
            <Printer className="w-4 h-4" />
            Cetak
          </Button>
        </div>
      </div>

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
                        {new Date(batch.expiryDate).toLocaleDateString('id-ID')}
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
    </div>
  );
};

export default DigitalStockPage;
