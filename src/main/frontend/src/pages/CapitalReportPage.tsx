import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/api';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { 
  TrendingUp, 
  DollarSign, 
  Percent, 
  Search, 
  Download, 
  Printer, 
  ChevronDown, 
  ChevronRight,
  Calculator,
  Calendar
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
  sellingPrice: number;
}

interface InventoryBatch {
  id: number;
  batchNumber: string;
  expiryDate: string;
  currentQuantity: number;
  purchasePrice: number;
  product: Product;
}

const CapitalReportPage: React.FC = () => {
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedProductIds, setExpandedProductIds] = useState<number[]>([]);

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

  // Toggle expand/collapse for a product's batches
  const toggleProductExpand = (productId: number) => {
    setExpandedProductIds(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId) 
        : [...prev, productId]
    );
  };

  // Group batches by product for the main list
  const productData = useMemo(() => {
    if (!batches) return [];

    const map = new Map<number, {
      product: Product;
      totalStock: number;
      totalCapital: number;
      totalSellingValue: number;
      batches: InventoryBatch[];
    }>();

    batches.forEach(batch => {
      if (!batch.product) return;
      const productId = batch.product.id;
      const qty = batch.currentQuantity || 0;
      const buyPrice = batch.purchasePrice || 0;
      const sellPrice = batch.product.sellingPrice || 0;

      const capitalValue = qty * buyPrice;
      const sellingValue = qty * sellPrice;

      if (!map.has(productId)) {
        map.set(productId, {
          product: batch.product,
          totalStock: 0,
          totalCapital: 0,
          totalSellingValue: 0,
          batches: []
        });
      }

      const entry = map.get(productId)!;
      entry.totalStock += qty;
      entry.totalCapital += capitalValue;
      entry.totalSellingValue += sellingValue;
      entry.batches.push(batch);
    });

    return Array.from(map.values());
  }, [batches]);

  // Filtered product data
  const filteredProducts = useMemo(() => {
    return productData.filter(item => {
      const search = searchTerm.toLowerCase();
      return (
        item.product.name.toLowerCase().includes(search) ||
        item.product.sku.toLowerCase().includes(search)
      );
    });
  }, [productData, searchTerm]);

  // Aggregate metrics
  const metrics = useMemo(() => {
    let totalCapitalValue = 0;
    let totalPotentialRevenue = 0;
    let totalStockUnits = 0;
    let totalActiveSKUs = filteredProducts.length;

    filteredProducts.forEach(item => {
      totalCapitalValue += item.totalCapital;
      totalPotentialRevenue += item.totalSellingValue;
      totalStockUnits += item.totalStock;
    });

    const potentialProfit = totalPotentialRevenue - totalCapitalValue;
    const averageMargin = totalPotentialRevenue > 0 ? (potentialProfit / totalPotentialRevenue) * 100 : 0;

    return {
      totalCapitalValue,
      totalPotentialRevenue,
      potentialProfit,
      averageMargin,
      totalStockUnits,
      totalActiveSKUs
    };
  }, [filteredProducts]);

  const activeBranchName = branches?.find(b => b.id.toString() === selectedBranchId)?.name || 'Cabang';

  // Export to Excel
  const handleExportExcel = () => {
    if (filteredProducts.length === 0) return;

    const headers = [
      'SKU', 'Nama Produk', 'Total Stok', 'Harga Beli Rata-rata (IDR)', 
      'Harga Jual (IDR)', 'Total Nilai Modal (IDR)', 'Total Nilai Jual (IDR)', 
      'Estimasi Profit (IDR)', 'Margin (%)'
    ];

    const rows = filteredProducts.map(item => {
      const avgBuyPrice = item.totalStock > 0 ? item.totalCapital / item.totalStock : 0;
      const profit = item.totalSellingValue - item.totalCapital;
      const margin = item.totalSellingValue > 0 ? (profit / item.totalSellingValue) * 100 : 0;
      return [
        item.product.sku,
        item.product.name,
        item.totalStock,
        Math.round(avgBuyPrice),
        item.product.sellingPrice,
        item.totalCapital,
        item.totalSellingValue,
        profit,
        margin.toFixed(1) + '%'
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
                <x:Name>Laporan Modal</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          th { background-color: #059669; color: white; font-weight: bold; }
          td { border: 0.5px solid #e5e7eb; }
        </style>
      </head>
      <body>
        <h2>Laporan Nilai Modal & Estimasi Profit Aset</h2>
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
            <tr style="font-weight: bold; background-color: #f3f4f6;">
              <td colspan="2">TOTAL</td>
              <td>${metrics.totalStockUnits}</td>
              <td>-</td>
              <td>-</td>
              <td>${metrics.totalCapitalValue}</td>
              <td>${metrics.totalPotentialRevenue}</td>
              <td>${metrics.potentialProfit}</td>
              <td>${metrics.averageMargin.toFixed(1)}%</td>
            </tr>
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([excelTemplate], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Laporan_Modal_${activeBranchName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xls`);
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
          <title>Laporan Modal - ${activeBranchName}</title>
          <style>
            body { font-family: 'Inter', sans-serif; color: #333; padding: 25px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #059669; padding-bottom: 10px; }
            .header h1 { margin: 0; color: #059669; font-size: 22px; }
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
          </style>
        </head>
        <body>
          <div class="header">
            <h1>LAPORAN NILAI MODAL INVENTORI</h1>
            <p>Sistem Manajemen Apotek G-Apotek</p>
          </div>
          <div class="meta">
            <div><strong>Cabang:</strong> ${activeBranchName}</div>
            <div><strong>Waktu Cetak:</strong> ${new Date().toLocaleString('id-ID')}</div>
          </div>
          <div class="stats-grid">
            <div class="stat-card">
              <p>Total Nilai Modal</p>
              <h3>Rp ${metrics.totalCapitalValue.toLocaleString('id-ID')}</h3>
            </div>
            <div class="stat-card">
              <p>Total Nilai Jual</p>
              <h3>Rp ${metrics.totalPotentialRevenue.toLocaleString('id-ID')}</h3>
            </div>
            <div class="stat-card">
              <p>Estimasi Keuntungan</p>
              <h3 style="color: #059669;">Rp ${metrics.potentialProfit.toLocaleString('id-ID')}</h3>
            </div>
            <div class="stat-card">
              <p>Rata-rata Margin</p>
              <h3>${metrics.averageMargin.toFixed(1)}%</h3>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>SKU</th>
                <th>Nama Produk</th>
                <th class="text-right">Stok</th>
                <th class="text-right">Harga Beli Avg</th>
                <th class="text-right">Harga Jual</th>
                <th class="text-right">Total Modal</th>
                <th class="text-right">Total Jual</th>
                <th class="text-right">Est. Profit</th>
              </tr>
            </thead>
            <tbody>
              ${filteredProducts.map(item => {
                const avgBuy = item.totalStock > 0 ? item.totalCapital / item.totalStock : 0;
                const profit = item.totalSellingValue - item.totalCapital;
                return `
                  <tr>
                    <td>${item.product.sku}</td>
                    <td class="font-bold">${item.product.name}</td>
                    <td class="text-right">${item.totalStock}</td>
                    <td class="text-right">Rp ${Math.round(avgBuy).toLocaleString('id-ID')}</td>
                    <td class="text-right">Rp ${item.product.sellingPrice.toLocaleString('id-ID')}</td>
                    <td class="text-right">Rp ${item.totalCapital.toLocaleString('id-ID')}</td>
                    <td class="text-right">Rp ${item.totalSellingValue.toLocaleString('id-ID')}</td>
                    <td class="text-right font-bold">Rp ${profit.toLocaleString('id-ID')}</td>
                  </tr>
                `;
              }).join('')}
              <tr class="font-bold" style="background: #f3f4f6;">
                <td colspan="2">TOTAL KESELURUHAN</td>
                <td class="text-right">${metrics.totalStockUnits}</td>
                <td class="text-right">-</td>
                <td class="text-right">-</td>
                <td class="text-right">Rp ${metrics.totalCapitalValue.toLocaleString('id-ID')}</td>
                <td class="text-right">Rp ${metrics.totalPotentialRevenue.toLocaleString('id-ID')}</td>
                <td class="text-right">Rp ${metrics.potentialProfit.toLocaleString('id-ID')}</td>
              </tr>
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
          <h1 className="text-2xl font-bold text-slate-800">Laporan Modal & Aset</h1>
          <p className="text-slate-500 text-sm">Analisis nilai modal pembelian barang dan potensi keuntungan dari stok saat ini.</p>
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
            <div className="p-3 rounded-xl bg-amber-50 text-amber-600">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Nilai Modal</p>
              <h3 className="text-xl font-black text-slate-800 mt-0.5">Rp {metrics.totalCapitalValue.toLocaleString('id-ID')}</h3>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 h-1 w-full bg-amber-500/10" />
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Potensi Jual</p>
              <h3 className="text-xl font-black text-slate-800 mt-0.5">Rp {metrics.totalPotentialRevenue.toLocaleString('id-ID')}</h3>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 h-1 w-full bg-emerald-500/10" />
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-sky-50 text-sky-600">
              <Calculator className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Estimasi Laba</p>
              <h3 className="text-xl font-black text-emerald-600 mt-0.5">Rp {metrics.potentialProfit.toLocaleString('id-ID')}</h3>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 h-1 w-full bg-sky-500/10" />
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-rose-50 text-rose-600">
              <Percent className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Rata-rata Margin</p>
              <h3 className="text-xl font-black text-slate-800 mt-0.5">{metrics.averageMargin.toFixed(1)}%</h3>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 h-1 w-full bg-rose-500/10" />
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Cari SKU atau nama produk..."
              className="pl-10 h-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <span className="text-xs font-bold text-slate-400">
            {metrics.totalActiveSKUs} SKU Terdaftar
          </span>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]"></TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Nama Produk</TableHead>
                <TableHead className="text-right">Total Stok</TableHead>
                <TableHead className="text-right">Harga Beli Avg</TableHead>
                <TableHead className="text-right">Harga Jual</TableHead>
                <TableHead className="text-right">Total Modal</TableHead>
                <TableHead className="text-right">Total Nilai Jual</TableHead>
                <TableHead className="text-right">Est. Profit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-32 text-center text-slate-400">
                    Memuat data aset modal...
                  </TableCell>
                </TableRow>
              ) : filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-32 text-center text-slate-400">
                    Tidak ada data modal produk.
                  </TableCell>
                </TableRow>
              ) : (
                filteredProducts.map((item) => {
                  const isExpanded = expandedProductIds.includes(item.product.id);
                  const avgBuyPrice = item.totalStock > 0 ? item.totalCapital / item.totalStock : 0;
                  const profit = item.totalSellingValue - item.totalCapital;
                  const margin = item.totalSellingValue > 0 ? (profit / item.totalSellingValue) * 100 : 0;

                  return (
                    <React.Fragment key={item.product.id}>
                      <TableRow className={cn("hover:bg-slate-50/50", isExpanded && "bg-slate-50/30")}>
                        <TableCell>
                          <button
                            onClick={() => toggleProductExpand(item.product.id)}
                            className="p-1 hover:bg-slate-100 rounded-md transition-colors"
                          >
                            {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                          </button>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-slate-500">{item.product.sku}</TableCell>
                        <TableCell className="font-bold text-slate-800">{item.product.name}</TableCell>
                        <TableCell className="text-right font-semibold text-slate-700">{item.totalStock.toLocaleString()}</TableCell>
                        <TableCell className="text-right text-slate-600">Rp {Math.round(avgBuyPrice).toLocaleString()}</TableCell>
                        <TableCell className="text-right text-slate-600">Rp {item.product.sellingPrice.toLocaleString()}</TableCell>
                        <TableCell className="text-right font-bold text-amber-600">Rp {item.totalCapital.toLocaleString()}</TableCell>
                        <TableCell className="text-right font-bold text-emerald-600">Rp {item.totalSellingValue.toLocaleString()}</TableCell>
                        <TableCell className="text-right font-black text-slate-800">
                          <div className="flex flex-col items-end">
                            <span>Rp {profit.toLocaleString()}</span>
                            <span className={cn(
                              "text-[9px] font-bold mt-0.5 px-1.5 py-0.2 rounded-full",
                              margin > 20 ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                            )}>
                              Margin: {margin.toFixed(1)}%
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>

                      {isExpanded && (
                        <TableRow className="bg-slate-50/20 border-t-0">
                          <TableCell colSpan={9} className="p-0">
                            <div className="px-12 py-3 bg-slate-50/30 border-y border-slate-100/50 animate-in slide-in-from-top-2 duration-300">
                              <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                                <Table>
                                  <TableHeader className="bg-slate-50/50">
                                    <TableRow>
                                      <TableHead className="h-8 text-[10px] uppercase font-bold text-slate-400">Nomor Batch</TableHead>
                                      <TableHead className="h-8 text-[10px] uppercase font-bold text-slate-400"><span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Expired Date</span></TableHead>
                                      <TableHead className="h-8 text-[10px] uppercase font-bold text-slate-400 text-right">Stok Batch</TableHead>
                                      <TableHead className="h-8 text-[10px] uppercase font-bold text-slate-400 text-right">Harga Beli Batch</TableHead>
                                      <TableHead className="h-8 text-[10px] uppercase font-bold text-slate-400 text-right">Total Nilai Modal</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {item.batches.map(batch => (
                                      <TableRow key={batch.id} className="h-10 hover:bg-slate-50/50">
                                        <TableCell className="text-xs font-mono text-slate-600">{batch.batchNumber}</TableCell>
                                        <TableCell className="text-xs text-slate-500">
                                          {new Date(batch.expiryDate).toLocaleDateString('id-ID')}
                                        </TableCell>
                                        <TableCell className="text-xs font-bold text-slate-700 text-right">{batch.currentQuantity.toLocaleString()}</TableCell>
                                        <TableCell className="text-xs text-slate-600 text-right">Rp {batch.purchasePrice?.toLocaleString() || '0'}</TableCell>
                                        <TableCell className="text-xs font-bold text-slate-700 text-right">Rp {(batch.currentQuantity * (batch.purchasePrice || 0)).toLocaleString()}</TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
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

export default CapitalReportPage;
