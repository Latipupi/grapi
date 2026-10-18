import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Pagination } from '../components/ui/Pagination';
import {
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Percent,
  Calendar,
  Filter,
  AlertCircle,
  Search,
  Printer,
  FileSpreadsheet,
  LayoutDashboard,
  Scale
} from 'lucide-react';
import { Input } from '../components/ui/Input';

interface ItemBreakdown {
  productName: string;
  sku: string;
  quantitySold: number;
  totalRevenue: number;
  totalCost: number;
  grossProfit: number;
}

interface DebtBreakdown {
  id: number;
  invoiceNumber: string;
  supplierName: string;
  customerName?: string;
  branchName: string;
  purchaseDate?: string;
  dueDate?: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: string;
  notes?: string;
}

interface ProfitLossData {
  grossSales?: number;
  totalRefunds?: number;
  totalRevenue: number;
  costOfGoodsSold: number;
  grossProfit: number;
  totalExpenses: number;
  totalPayableDebt?: number;
  totalReceivableDebt?: number;
  totalDeductions?: number;
  netProfit: number;
  cashAndBank?: number;
  inventoryValue?: number;
  totalAssets?: number;
  totalLiabilities?: number;
  autoStockCapital?: number;
  cashPurchasesTotal?: number;
  capitalMode?: string;
  manualCapitalInput?: number;
  capitalModal?: number;
  totalEquity?: number;
  expenses: { id?: number; expenseDate?: string; category: string; expenseType?: string; amount: number; notes: string; branch?: { name: string } }[];
  debtsBreakdown?: DebtBreakdown[];
  receivableDebtsBreakdown?: DebtBreakdown[];
  itemsBreakdown?: ItemBreakdown[];
}

interface Branch {
  id: number;
  name: string;
}

const ProfitLossPage: React.FC = () => {
  const [branchId, setBranchId] = useState<string>('');
  const [startDate, setStartDate] = useState<string>(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const [viewMode, setViewMode] = useState<'standard_doc' | 'interactive'>('standard_doc');
  const [detailTab, setDetailTab] = useState<'gross' | 'net'>('gross');
  const [itemSearch, setItemSearch] = useState('');

  // Customizable report header / cover fields
  const [companyName, setCompanyName] = useState<string>('APOTEK GRAPI INDONESIA');
  const [directorName, setDirectorName] = useState<string>('Direktur Utama');
  const [directorTitle, setDirectorTitle] = useState<string>('DIREKTUR');

  // Capital (Modal) settings state: AUTO_STOCK (Otomatis dari Kulakan/Stok Awal) vs MANUAL
  const [capitalMode, setCapitalMode] = useState<'AUTO_STOCK' | 'MANUAL'>('AUTO_STOCK');
  const [manualCapitalStr, setManualCapitalStr] = useState<string>('0');
  const [isSavingCapital, setIsSavingCapital] = useState<boolean>(false);
  const [capitalSavedMsg, setCapitalSavedMsg] = useState<string>('');

  const [currentPage, setCurrentPage] = useState(1);
  const [itemPage, setItemPage] = useState(1);
  const entriesPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
    setItemPage(1);
  }, [branchId, startDate, endDate, itemSearch]);

  const { data: branches } = useQuery<Branch[]>({
    queryKey: ['branches'],
    queryFn: async () => {
      const res = await api.get('/branches');
      return res.data;
    },
  });

  const { data: settings } = useQuery<any>({
    queryKey: ['settings'],
    queryFn: async () => {
      try {
        const res = await api.get('/settings');
        return res.data;
      } catch {
        return null;
      }
    }
  });

  useEffect(() => {
    if (settings?.pharmacyName) {
      setCompanyName(String(settings.pharmacyName).toUpperCase());
    }
  }, [settings]);

  const { data: report, isLoading, refetch: refetchReport } = useQuery<ProfitLossData>({
    queryKey: ['report', 'finance', 'profit-loss', branchId, startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (branchId) params.append('branchId', branchId);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      const res = await api.get(`/finance/profit-loss?${params.toString()}`);
      return res.data;
    },
    enabled: !!startDate && !!endDate
  });

  useEffect(() => {
    if (report) {
      const mode = report.capitalMode === 'MANUAL' ? 'MANUAL' : 'AUTO_STOCK';
      setCapitalMode(mode);
      setManualCapitalStr(String(Math.round(Number(report.manualCapitalInput || 0))));
    }
  }, [report?.capitalMode, report?.manualCapitalInput, branchId]);

  const handleSaveCapital = async () => {
    try {
      setIsSavingCapital(true);
      setCapitalSavedMsg('');
      const numericAmount = Math.max(0, Number(manualCapitalStr || 0));
      await api.put('/finance/capital', {
        branchId: branchId ? Number(branchId) : null,
        capitalMode,
        manualCapital: numericAmount
      });
      await refetchReport();
      setCapitalSavedMsg('Tersimpan!');
      setTimeout(() => setCapitalSavedMsg(''), 3000);
    } catch (err) {
      console.error('Gagal menyimpan pengaturan modal:', err);
    } finally {
      setIsSavingCapital(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Math.round(val || 0));
  };

  // Format Accurate Accounting number: 17.891.670,00
  const formatAccounting = (val: number) => {
    const num = Number(val || 0);
    return num.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatDateIndo = (dateStr: string) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const filteredItems = (report?.itemsBreakdown || []).filter(it =>
    !itemSearch ||
    it.productName?.toLowerCase().includes(itemSearch.toLowerCase()) ||
    it.sku?.toLowerCase().includes(itemSearch.toLowerCase())
  );

  // Group expenses by category for standard Laba/Rugi display
  const groupedExpenses = React.useMemo(() => {
    const map = new Map<string, number>();
    (report?.expenses || []).forEach(exp => {
      const label = exp.notes
        ? `${exp.category} - ${exp.notes}`
        : (exp.category || 'Biaya Operasional');
      map.set(label, (map.get(label) || 0) + Number(exp.amount || 0));
    });
    return Array.from(map.entries()).map(([name, amount]) => ({ name, amount }));
  }, [report?.expenses]);

  // Group receivable debts by customer for Neraca display
  const groupedReceivables = React.useMemo(() => {
    const map = new Map<string, number>();
    (report?.receivableDebtsBreakdown || []).forEach(d => {
      const name = d.customerName || d.supplierName || 'Piutang Pelanggan';
      map.set(name, (map.get(name) || 0) + Number(d.remainingAmount || 0));
    });
    return Array.from(map.entries()).map(([name, amount]) => ({ name, amount }));
  }, [report?.receivableDebtsBreakdown]);

  // Group payable debts by supplier for Neraca display
  const groupedPayables = React.useMemo(() => {
    const map = new Map<string, number>();
    (report?.debtsBreakdown || []).forEach(d => {
      const name = d.supplierName || 'Hutang Supplier';
      map.set(name, (map.get(name) || 0) + Number(d.remainingAmount || 0));
    });
    return Array.from(map.entries()).map(([name, amount]) => ({ name, amount }));
  }, [report?.debtsBreakdown]);

  // Live Neraca & Modal computation (supports both AUTO_STOCK from Kulakan/Stok Awal and MANUAL input)
  const netProfitVal = report ? (Number(report.grossProfit || 0) - Number(report.totalExpenses || 0)) : 0;
  const receivableVal = Number(report?.totalReceivableDebt ?? 0);
  const inventoryVal = Number(report?.inventoryValue ?? 0);
  const cogsVal = Number(report?.costOfGoodsSold ?? 0);
  const payableVal = Number(report?.totalPayableDebt ?? 0);
  const cashPurchasesVal = Number(report?.cashPurchasesTotal ?? 0);

  const stockBasedCapital = Math.max(0, inventoryVal + cogsVal - payableVal);
  const autoStockCapitalVal = Math.max(
    Number(report?.autoStockCapital ?? 0),
    stockBasedCapital,
    cashPurchasesVal
  );

  const manualInputVal = Math.max(0, Number(manualCapitalStr || 0));
  const totalLiabilities = payableVal;

  let capitalModal = 0;
  let totalEquity = 0;
  let totalAssets = 0;
  let cashVal = 0;

  if (capitalMode === 'MANUAL' && manualInputVal > 0) {
    capitalModal = manualInputVal;
    totalEquity = capitalModal + netProfitVal;
    totalAssets = totalLiabilities + totalEquity;
    cashVal = totalAssets - inventoryVal - receivableVal;
  } else {
    capitalModal = autoStockCapitalVal + manualInputVal;
    totalEquity = capitalModal + netProfitVal;
    totalAssets = totalLiabilities + totalEquity;
    cashVal = totalAssets - inventoryVal - receivableVal;
    if (cashVal < manualInputVal) {
      const deficit = manualInputVal - cashVal;
      capitalModal += deficit;
      totalEquity = capitalModal + netProfitVal;
      totalAssets = totalLiabilities + totalEquity;
      cashVal = manualInputVal;
    }
  }
  const totalCurrentAssets = cashVal + receivableVal + inventoryVal;

  const handlePrintFinancialReport = () => {
    if (!report) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const netProfit = netProfitVal;

    const nowStr = new Date().toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }) + ' - ' + new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    const selectedBranchName = branchId
      ? branches?.find(b => String(b.id) === String(branchId))?.name
      : '';
    const displayCompany = selectedBranchName ? `${companyName} (${selectedBranchName.toUpperCase()})` : companyName;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Laporan Keuangan - ${displayCompany}</title>
        <style>
          @page { size: A4 portrait; margin: 15mm; }
          * { box-sizing: border-box; }
          body { font-family: Arial, Helvetica, sans-serif; color: #111; margin: 0; padding: 0; font-size: 11px; }
          .page { min-height: 255mm; display: flex; flex-direction: column; justify-content: space-between; page-break-after: always; }
          .page:last-child { page-break-after: auto; }
          /* Cover Page */
          .cover-box { border: 1.5px solid #000; height: 255mm; display: flex; flex-direction: column; justify-content: space-between; text-align: center; }
          .cover-top { padding: 35px 20px 10px; font-family: 'Cambria', 'Times New Roman', serif; }
          .cover-top h1 { margin: 0; font-size: 22px; font-weight: bold; letter-spacing: 0.5px; }
          .cover-top h2 { margin: 10px 0 0; font-size: 20px; font-weight: bold; }
          .cover-middle { padding: 20px; font-family: 'Cambria', 'Times New Roman', serif; }
          .cover-period { margin-top: 25px; font-size: 18px; font-weight: bold; line-height: 1.8; }
          .cover-bottom { border-top: 1px solid #000; }
          .cover-approved-label { border-bottom: 1px solid #000; padding: 6px; font-weight: bold; font-size: 12px; font-family: 'Cambria', 'Times New Roman', serif; }
          .cover-sign-box { padding: 55px 20px 18px; font-family: 'Cambria', 'Times New Roman', serif; }
          .cover-sign-name { font-size: 14px; font-weight: bold; }
          .cover-sign-title { font-size: 10px; font-weight: bold; text-transform: uppercase; margin-top: 2px; }

          /* Standard Accurate Report Pages */
          .acc-header { text-align: center; margin-bottom: 18px; }
          .acc-company { font-size: 14px; font-weight: bold; color: #111; }
          .acc-title { font-size: 20px; font-weight: bold; color: #8b1c1c; margin: 4px 0; }
          .acc-subtitle { font-size: 12px; font-weight: bold; color: #111; }
          .acc-table { width: 78%; margin: 0 auto; border-collapse: collapse; font-size: 10.5px; }
          .acc-table th { border-bottom: 1.5px solid #333; padding: 4px 6px; color: #000066; font-weight: bold; }
          .acc-table td { padding: 2.5px 6px; vertical-align: top; }
          .text-left { text-align: left; }
          .text-right { text-align: right; }
          .fw-bold { font-weight: bold; }
          .text-red { color: #cc0000; }
          .indent-1 { padding-left: 14px !important; }
          .indent-2 { padding-left: 28px !important; }
          .indent-3 { padding-left: 42px !important; }
          .indent-4 { padding-left: 56px !important; }
          .line-top { border-top: 1px solid #222; }
          .line-bottom { border-bottom: 1px solid #222; }
          .line-double { border-bottom: 3px double #222; }
          .acc-footer { border-top: 1px solid #999; padding-top: 6px; font-size: 9.5px; color: #333; display: flex; justify-content: space-between; align-items: center; margin-top: 24px; }
        </style>
      </head>
      <body>
        <!-- PAGE 1: COVER -->
        <div class="page">
          <div class="cover-box">
            <div class="cover-top">
              <h1>LAPORAN KEUANGAN</h1>
              <h2>${displayCompany}</h2>
            </div>
            <div class="cover-middle">
              <div style="width: 240px; height: 150px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); color: #334155; font-size: 48px;">
                📊
              </div>
              <div class="cover-period">
                <div>PERIODE :</div>
                <div>${formatDateIndo(startDate).toUpperCase()} - ${formatDateIndo(endDate).toUpperCase()}</div>
              </div>
            </div>
            <div class="cover-bottom">
              <div class="cover-approved-label">DISETUJUI OLEH :</div>
              <div class="cover-sign-box">
                <div class="cover-sign-name">${directorName}</div>
                <div class="cover-sign-title">${directorTitle}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- PAGE 2: NERACA (STANDAR) -->
        <div class="page">
          <div>
            <div class="acc-header">
              <div class="acc-company">${displayCompany}</div>
              <div class="acc-title">Neraca (Standar)</div>
              <div class="acc-subtitle">Per Tgl. ${formatDateIndo(endDate)}</div>
            </div>

            <table class="acc-table">
              <thead>
                <tr>
                  <th class="text-left" style="width: 68%;">Description</th>
                  <th class="text-right" style="width: 32%;">Balance</th>
                </tr>
              </thead>
              <tbody>
                <tr><td class="fw-bold">Aktiva</td><td></td></tr>
                <tr><td class="fw-bold indent-1">Aktiva Lancar</td><td></td></tr>
                <tr><td class="fw-bold indent-2">Kas dan Bank</td><td></td></tr>
                <tr>
                  <td class="fw-bold indent-2">Jumlah Kas dan Bank</td>
                  <td class="text-right fw-bold line-top ${cashVal < 0 ? 'text-red' : ''}">${formatAccounting(cashVal)}</td>
                </tr>

                <tr><td class="fw-bold indent-2">Piutang Dagang</td><td></td></tr>
                ${groupedReceivables.map(r => `
                  <tr>
                    <td class="indent-3">${r.name}</td>
                    <td class="text-right">${formatAccounting(r.amount)}</td>
                  </tr>
                `).join('')}
                <tr>
                  <td class="fw-bold indent-2">Jumlah Piutang Dagang</td>
                  <td class="text-right fw-bold line-top">${formatAccounting(receivableVal)}</td>
                </tr>

                <tr><td class="fw-bold indent-2">Persediaan</td><td></td></tr>
                ${inventoryVal > 0 ? `
                  <tr>
                    <td class="indent-3">Persediaan Obat & Alat Kesehatan</td>
                    <td class="text-right">${formatAccounting(inventoryVal)}</td>
                  </tr>
                ` : ''}
                <tr>
                  <td class="fw-bold indent-2">Jumlah Persediaan</td>
                  <td class="text-right fw-bold line-top">${formatAccounting(inventoryVal)}</td>
                </tr>

                <tr><td class="fw-bold indent-2">Aktiva lancar lainnya</td><td></td></tr>
                <tr>
                  <td class="fw-bold indent-2">Jumlah Aktiva lancar lainnya</td>
                  <td class="text-right fw-bold line-top">0,00</td>
                </tr>

                <tr>
                  <td class="fw-bold indent-1">Jumlah Aktiva Lancar</td>
                  <td class="text-right fw-bold line-top">${formatAccounting(totalCurrentAssets)}</td>
                </tr>

                <tr><td class="fw-bold indent-1">Aktiva Tetap</td><td></td></tr>
                <tr><td class="fw-bold indent-2">Nilai histori</td><td></td></tr>
                <tr>
                  <td class="fw-bold indent-2">Jumlah Nilai histori</td>
                  <td class="text-right fw-bold line-top">0,00</td>
                </tr>
                <tr><td class="fw-bold indent-2">Akumulasi Penyusutan</td><td></td></tr>
                <tr>
                  <td class="fw-bold indent-2">Jumlah Akumulasi Penyusutan</td>
                  <td class="text-right fw-bold line-top">0,00</td>
                </tr>
                <tr>
                  <td class="fw-bold indent-1">Jumlah Aktiva Tetap</td>
                  <td class="text-right fw-bold line-top">0,00</td>
                </tr>

                <tr>
                  <td class="fw-bold">Jumlah Aktiva</td>
                  <td class="text-right fw-bold line-top line-double">${formatAccounting(totalAssets)}</td>
                </tr>

                <tr><td style="height: 8px;" colspan="2"></td></tr>

                <tr><td class="fw-bold">Kewajiban dan Ekuitas</td><td></td></tr>
                <tr><td class="fw-bold indent-1">Kewajiban</td><td></td></tr>
                <tr><td class="fw-bold indent-2">Kewajiban lancar</td><td></td></tr>
                <tr><td class="fw-bold indent-3">Hutang Dagang</td><td></td></tr>
                ${groupedPayables.map(p => `
                  <tr>
                    <td class="indent-4">${p.name}</td>
                    <td class="text-right">${formatAccounting(p.amount)}</td>
                  </tr>
                `).join('')}
                <tr>
                  <td class="fw-bold indent-3">Jumlah Hutang Dagang</td>
                  <td class="text-right fw-bold line-top">${formatAccounting(payableVal)}</td>
                </tr>

                <tr><td class="fw-bold indent-3">Kewajiban lancar lain</td><td></td></tr>
                <tr>
                  <td class="fw-bold indent-3">Jumlah Kewajiban lancar lain</td>
                  <td class="text-right fw-bold line-top">0,00</td>
                </tr>

                <tr>
                  <td class="fw-bold indent-2">Jumlah Kewajiban lancar</td>
                  <td class="text-right fw-bold line-top">${formatAccounting(totalLiabilities)}</td>
                </tr>

                <tr><td class="fw-bold indent-2">Kewajiban jangka panjang</td><td></td></tr>
                <tr>
                  <td class="fw-bold indent-2">Jumlah Kewajiban jangka panjang</td>
                  <td class="text-right fw-bold line-top">0,00</td>
                </tr>

                <tr>
                  <td class="fw-bold indent-1">Jumlah Kewajiban</td>
                  <td class="text-right fw-bold line-top">${formatAccounting(totalLiabilities)}</td>
                </tr>

                <tr><td class="fw-bold indent-1">Ekuitas</td><td></td></tr>
                <tr>
                  <td class="indent-2">Modal & Ekuitas Awal</td>
                  <td class="text-right">${formatAccounting(capitalModal)}</td>
                </tr>
                <tr>
                  <td class="indent-2">Laba tahun/periode ini</td>
                  <td class="text-right ${netProfit < 0 ? 'text-red' : ''}">${formatAccounting(netProfit)}</td>
                </tr>
                <tr>
                  <td class="fw-bold indent-1">Jumlah Ekuitas</td>
                  <td class="text-right fw-bold line-top">${formatAccounting(totalEquity)}</td>
                </tr>

                <tr>
                  <td class="fw-bold">Jumlah Kewajiban dan Ekuitas</td>
                  <td class="text-right fw-bold line-top line-double">${formatAccounting(totalLiabilities + totalEquity)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="acc-footer">
            <span>Cetak di ${nowStr}</span>
            <span>ACCURATE Accounting System Report</span>
            <span>(1)</span>
          </div>
        </div>

        <!-- PAGE 3: LABA/RUGI (STANDAR) -->
        <div class="page">
          <div>
            <div class="acc-header">
              <div class="acc-company">${displayCompany}</div>
              <div class="acc-title">Laba/Rugi (Standar)</div>
              <div class="acc-subtitle">Dari ${formatDateIndo(startDate)} ke ${formatDateIndo(endDate)}</div>
            </div>

            <table class="acc-table">
              <thead>
                <tr>
                  <th class="text-left" style="width: 65%;">Description</th>
                  <th class="text-right" style="width: 35%;">${formatDateIndo(startDate)} - ${formatDateIndo(endDate)}</th>
                </tr>
              </thead>
              <tbody>
                <tr><td class="fw-bold">Pendapatan</td><td></td></tr>
                <tr>
                  <td class="indent-1">Penjualan Obat & Produk</td>
                  <td class="text-right">${formatAccounting(report.grossSales ?? report.totalRevenue)}</td>
                </tr>
                ${(report.totalRefunds || 0) > 0 ? `
                  <tr>
                    <td class="indent-1 text-red">Retur Penjualan</td>
                    <td class="text-right text-red">-${formatAccounting(report.totalRefunds || 0)}</td>
                  </tr>
                ` : ''}
                <tr>
                  <td class="fw-bold">Jumlah Pendapatan</td>
                  <td class="text-right fw-bold line-top line-bottom">${formatAccounting(report.totalRevenue)}</td>
                </tr>

                <tr><td class="fw-bold">Harga Pokok Penjualan</td><td></td></tr>
                <tr>
                  <td class="indent-1">Harga Pokok Penjualan (HPP Obat)</td>
                  <td class="text-right">${formatAccounting(report.costOfGoodsSold)}</td>
                </tr>
                <tr>
                  <td class="fw-bold">Jumlah Harga Pokok Penjualan</td>
                  <td class="text-right fw-bold line-top line-bottom">${formatAccounting(report.costOfGoodsSold)}</td>
                </tr>

                <tr>
                  <td class="fw-bold">LABA KOTOR</td>
                  <td class="text-right fw-bold">${formatAccounting(report.grossProfit)}</td>
                </tr>

                <tr><td class="fw-bold">Beban Operasi</td><td></td></tr>
                <tr>
                  <td class="fw-bold indent-1">Biaya Umum & Administrasi</td>
                  <td class="text-right fw-bold">${formatAccounting(report.totalExpenses)}</td>
                </tr>
                ${groupedExpenses.map(exp => `
                  <tr>
                    <td class="indent-2">${exp.name}</td>
                    <td class="text-right">${formatAccounting(exp.amount)}</td>
                  </tr>
                `).join('')}
                <tr>
                  <td class="fw-bold">Jumlah Beban Operasi</td>
                  <td class="text-right fw-bold line-top line-bottom">${formatAccounting(report.totalExpenses)}</td>
                </tr>

                <tr>
                  <td class="fw-bold">PENDAPATAN OPERASI</td>
                  <td class="text-right fw-bold ${netProfit < 0 ? 'text-red' : ''}">${formatAccounting(netProfit)}</td>
                </tr>

                <tr><td class="fw-bold">Pendapatan dan Beban Lain</td><td></td></tr>
                <tr><td class="fw-bold indent-1">Pendapatan lain</td><td></td></tr>
                <tr>
                  <td class="fw-bold indent-1">Jumlah Pendapatan lain</td>
                  <td class="text-right fw-bold line-top">0,00</td>
                </tr>
                <tr><td class="fw-bold indent-1">Beban lain-lain</td><td></td></tr>
                <tr>
                  <td class="fw-bold indent-1">Jumlah Beban lain-lain</td>
                  <td class="text-right fw-bold line-top">0,00</td>
                </tr>
                <tr>
                  <td class="fw-bold">Jumlah Pendapatan dan Beban Lain</td>
                  <td class="text-right fw-bold line-top line-bottom">0,00</td>
                </tr>

                <tr>
                  <td class="fw-bold">LABA(RUGI) BERSIH (Before Tax)</td>
                  <td class="text-right fw-bold line-bottom ${netProfit < 0 ? 'text-red' : ''}">${formatAccounting(netProfit)}</td>
                </tr>
                <tr>
                  <td class="fw-bold">LABA(RUGI) BERSIH (After Tax)</td>
                  <td class="text-right fw-bold line-double ${netProfit < 0 ? 'text-red' : ''}">${formatAccounting(netProfit)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="acc-footer">
            <span>Cetak di ${nowStr}</span>
            <span>ACCURATE Accounting System Report</span>
            <span>(1)</span>
          </div>
        </div>

        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Laporan Keuangan (Neraca & Laba/Rugi Standar)</h1>
          <p className="text-slate-500 text-sm">
            Sesuai Standar Akuntansi Dasar (PSAK / Format Accurate): Laba Bersih = Laba Kotor - Beban Operasi, serta Neraca Aktiva, Kewajiban & Ekuitas.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap items-center gap-2 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-2 px-3 border-r border-slate-100">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                className="h-9 bg-transparent text-sm focus:outline-none focus:ring-0"
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
              >
                <option value="">Semua Cabang</option>
                {branches?.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 px-3">
              <Calendar className="w-4 h-4 text-emerald-500" />
              <Input
                type="date"
                className="h-8 border-none p-0 text-sm focus-visible:ring-0 w-32 bg-transparent"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <span className="text-slate-300">-</span>
              <Input
                type="date"
                className="h-8 border-none p-0 text-sm focus-visible:ring-0 w-32 bg-transparent"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <Button
            onClick={handlePrintFinancialReport}
            disabled={!report}
            className="h-11 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-2 shadow-sm"
          >
            <Printer className="w-4 h-4" />
            Cetak / PDF Laporan Keuangan (3 Hal)
          </Button>
        </div>
      </div>

      {/* Mode Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setViewMode('standard_doc')}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
              viewMode === 'standard_doc'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            Dokumen Laporan Keuangan Standar (Cover + Neraca + Laba/Rugi)
          </button>
          <button
            type="button"
            onClick={() => setViewMode('interactive')}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
              viewMode === 'interactive'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            Analisis Interaktif (Rincian HPP Obat, Biaya & Neraca)
          </button>
        </div>

        {viewMode === 'standard_doc' && (
          <div className="flex flex-wrap items-center gap-2 text-xs px-2">
            <span className="text-slate-400 font-bold">Nama Perusahaan:</span>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800 w-52"
              placeholder="Nama PT / Apotek"
            />
            <span className="text-slate-400 font-bold ml-1">Penandatangan:</span>
            <input
              type="text"
              value={directorName}
              onChange={(e) => setDirectorName(e.target.value)}
              className="border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800 w-40"
              placeholder="Nama Direktur"
            />
            <input
              type="text"
              value={directorTitle}
              onChange={(e) => setDirectorTitle(e.target.value)}
              className="border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800 w-28"
              placeholder="Jabatan"
            />
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="p-6 border-none shadow-sm bg-white space-y-3">
              <div className="flex justify-between items-center">
                <Skeleton className="h-4 w-24 rounded" />
                <Skeleton className="w-5 h-5 rounded" />
              </div>
              <Skeleton className="h-8 w-32 rounded" />
              <Skeleton className="h-3 w-16 rounded" />
            </Card>
          ))}
        </div>
      ) : report ? (
        <>
          {/* Pengaturan & Hitungan Otomatis Modal Usaha (Neraca) */}
          <Card className="p-4 sm:p-5 border border-indigo-100 bg-gradient-to-r from-indigo-50/60 via-white to-emerald-50/40 rounded-2xl shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Scale className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-xs sm:text-sm font-black text-slate-800 uppercase tracking-wide">
                    Perhitungan Modal Usaha (Neraca — Ekuitas)
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700">
                    {capitalMode === 'AUTO_STOCK' ? 'Otomatis Kulakan / Stok Awal' : 'Input Manual Total Modal'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600">
                  Hitungan Otomatis Modal Kulakan/Stok Awal:{' '}
                  <span className="font-bold text-slate-800">
                    Persediaan ({formatCurrency(inventoryVal)}) + HPP Terjual ({formatCurrency(cogsVal)}) − Hutang Supplier ({formatCurrency(payableVal)})
                  </span>
                  {cashPurchasesVal > stockBasedCapital && (
                    <span className="text-slate-500"> (atau Total Kulakan Tunai/Cicilan {formatCurrency(cashPurchasesVal)})</span>
                  )}{' '}
                  = <span className="font-extrabold text-indigo-700">{formatCurrency(autoStockCapitalVal)}</span>
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex rounded-xl bg-slate-100 p-1">
                  <button
                    type="button"
                    onClick={() => setCapitalMode('AUTO_STOCK')}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      capitalMode === 'AUTO_STOCK'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Otomatis Kulakan/Stok + Kas
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCapitalMode('MANUAL');
                      if (Number(manualCapitalStr || 0) <= 0) {
                        setManualCapitalStr(String(Math.round(autoStockCapitalVal)));
                      }
                    }}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      capitalMode === 'MANUAL'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Input Manual Total Modal
                  </button>
                </div>

                <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-1.5">
                  <span className="text-[11px] font-bold text-slate-500">
                    {capitalMode === 'AUTO_STOCK' ? '+ Modal Kas Awal (Rp):' : 'Total Modal (Rp):'}
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={manualCapitalStr}
                    onChange={(e) => setManualCapitalStr(e.target.value)}
                    className="w-36 text-xs font-extrabold text-slate-900 focus:outline-none text-right"
                    placeholder="0"
                  />
                </div>

                {capitalMode === 'MANUAL' && (
                  <button
                    type="button"
                    onClick={() => setManualCapitalStr(String(Math.round(autoStockCapitalVal)))}
                    className="px-2.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold cursor-pointer"
                    title="Isi dengan nilai modal otomatis dari kulakan/stok awal"
                  >
                    Ambil Nilai Kulakan
                  </button>
                )}

                <Button
                  type="button"
                  onClick={handleSaveCapital}
                  disabled={isSavingCapital}
                  className="h-9 px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer"
                >
                  {isSavingCapital ? 'Menyimpan...' : 'Simpan Modal'}
                </Button>

                {capitalSavedMsg && (
                  <span className="text-xs font-extrabold text-emerald-600">{capitalSavedMsg}</span>
                )}
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-indigo-100/80 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex flex-wrap items-center gap-4">
                <span className="text-slate-600">
                  Total Modal di Neraca (Ekuitas): <strong className="text-indigo-700">{formatCurrency(capitalModal)}</strong>
                </span>
                <span className="text-slate-600">
                  Saldo Kas & Bank (Aktiva Lancar): <strong className="text-emerald-700">{formatCurrency(cashVal)}</strong>
                </span>
                <span className="text-slate-600">
                  Nilai Persediaan Stok: <strong className="text-slate-800">{formatCurrency(inventoryVal)}</strong>
                </span>
              </div>
              <span className="text-[11px] font-bold text-emerald-700">
                ✓ Neraca Seimbang (Aktiva {formatCurrency(totalAssets)} = Pasiva {formatCurrency(totalLiabilities + totalEquity)})
              </span>
            </div>
          </Card>

          {/* Top 4 Summary Cards (Always visible for quick executive overview) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="p-6 border-none shadow-sm bg-gradient-to-br from-emerald-600 to-emerald-700 text-white relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all duration-500" />
              <div className="relative z-10 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-emerald-100 text-xs font-bold uppercase tracking-wider">Jumlah Pendapatan</p>
                  <ShoppingCart className="w-5 h-5 text-emerald-200" />
                </div>
                <h2 className="text-2xl font-black">{formatCurrency(report.totalRevenue)}</h2>
                <p className="text-emerald-200 text-[10px]">Penjualan Bersih (dikurangi Retur)</p>
              </div>
            </Card>

            <Card
              onClick={() => { setViewMode('interactive'); setDetailTab('gross'); }}
              className="p-6 shadow-sm bg-white group cursor-pointer transition-all border border-slate-100 hover:border-emerald-300"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Laba Kotor (Gross Profit)</p>
                  <div className="p-2 bg-emerald-50 rounded-lg group-hover:bg-emerald-100 transition-colors">
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                  </div>
                </div>
                <h2 className="text-2xl font-black text-emerald-600">{formatCurrency(report.grossProfit)}</h2>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-rose-500 font-semibold">HPP: -{formatCurrency(report.costOfGoodsSold)}</span>
                  <span className="text-emerald-600 font-bold underline">Rincian HPP →</span>
                </div>
              </div>
            </Card>

            <Card
              onClick={() => { setViewMode('interactive'); setDetailTab('net'); }}
              className="p-6 shadow-sm bg-white group cursor-pointer transition-all border border-slate-100 hover:border-rose-300"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Jumlah Beban Operasi</p>
                  <div className="p-2 bg-rose-50 rounded-lg group-hover:bg-rose-100 transition-colors">
                    <TrendingDown className="w-4 h-4 text-rose-500" />
                  </div>
                </div>
                <h2 className="text-2xl font-black text-rose-600">-{formatCurrency(report.totalExpenses)}</h2>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 truncate">Biaya Umum, Adm, Sewa, dll.</span>
                  <span className="text-rose-600 font-bold underline shrink-0 ml-1">Rincian →</span>
                </div>
              </div>
            </Card>

            <Card
              onClick={() => { setViewMode('interactive'); setDetailTab('net'); }}
              className="p-6 border-none shadow-sm bg-slate-900 text-white relative overflow-hidden group cursor-pointer hover:ring-2 hover:ring-emerald-400/50 transition-all"
            >
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-all duration-500" />
              <div className="relative z-10 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Laba(Rugi) Bersih</p>
                  <div className="p-2 bg-slate-800 rounded-lg group-hover:bg-slate-700 transition-colors">
                    <Percent className="w-4 h-4 text-white" />
                  </div>
                </div>
                <h2 className={`text-2xl font-black ${netProfitVal >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {formatCurrency(netProfitVal)}
                </h2>
                <div className="pt-1 border-t border-white/10 flex items-center justify-between text-[10px]">
                  <span className="text-slate-300">Laba Kotor - Beban Operasi</span>
                  <span className="text-emerald-300 font-bold">Standar PSAK</span>
                </div>
              </div>
            </Card>
          </div>

          {viewMode === 'standard_doc' ? (
            /* STANDARD ACCOUNTING DOCUMENT VIEW (3 PAGES: COVER, NERACA STANDAR, LABA/RUGI STANDAR) */
            <div className="space-y-8">
              {/* PAGE 1: SAMPUL / COVER LAPORAN KEUANGAN */}
              <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 sm:p-10 max-w-4xl mx-auto">
                <div className="border-2 border-slate-900 flex flex-col justify-between min-h-[540px] text-center font-serif">
                  <div className="pt-10 px-6">
                    <h2 className="text-xl sm:text-2xl font-bold tracking-wide text-slate-900 uppercase">
                      LAPORAN KEUANGAN
                    </h2>
                    <h3 className="text-lg sm:text-xl font-bold text-slate-900 mt-2 uppercase">
                      {companyName}
                    </h3>
                  </div>

                  <div className="py-8 px-6 flex flex-col items-center">
                    <div className="w-64 h-40 rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 via-slate-100 to-amber-50/40 flex flex-col items-center justify-center shadow-inner mb-6">
                      <Scale className="w-14 h-14 text-slate-700 mb-2" />
                      <span className="text-xs font-sans font-bold uppercase tracking-widest text-slate-500">
                        Neraca & Laba/Rugi Standar
                      </span>
                    </div>
                    <div className="text-base sm:text-lg font-bold text-slate-900 space-y-1">
                      <p>PERIODE :</p>
                      <p className="uppercase">{formatDateIndo(startDate)} S/D {formatDateIndo(endDate)}</p>
                    </div>
                  </div>

                  <div className="border-t-2 border-slate-900">
                    <div className="border-b border-slate-900 py-2 text-xs sm:text-sm font-bold text-slate-900 uppercase">
                      DISETUJUI OLEH :
                    </div>
                    <div className="pt-16 pb-6 px-4">
                      <p className="text-sm sm:text-base font-bold text-slate-900 underline decoration-slate-400 underline-offset-4">
                        {directorName}
                      </p>
                      <p className="text-[11px] font-bold text-slate-800 uppercase mt-1">
                        {directorTitle}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* PAGE 2: NERACA (STANDAR) */}
              <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 sm:p-10 max-w-4xl mx-auto font-sans">
                <div className="text-center mb-6">
                  <p className="text-sm font-bold text-slate-900 uppercase">{companyName}</p>
                  <h2 className="text-xl sm:text-2xl font-bold text-[#8b1c1c] my-1">Neraca (Standar)</h2>
                  <p className="text-xs sm:text-sm font-bold text-slate-800">Per Tgl. {formatDateIndo(endDate)}</p>
                </div>

                <div className="max-w-2xl mx-auto overflow-x-auto">
                  <table className="w-full text-xs sm:text-[13px] border-collapse">
                    <thead>
                      <tr className="border-b-2 border-slate-800 text-[#000066]">
                        <th className="py-2 px-2 text-left font-bold">Description</th>
                        <th className="py-2 px-2 text-right font-bold">Balance</th>
                      </tr>
                    </thead>
                    <tbody className="text-slate-900 leading-relaxed">
                      {/* AKTIVA */}
                      <tr><td className="font-bold pt-2">Aktiva</td><td /></tr>
                      <tr><td className="font-bold pl-4">Aktiva Lancar</td><td /></tr>

                      {/* Kas dan Bank */}
                      <tr><td className="font-bold pl-8">Kas dan Bank</td><td /></tr>
                      <tr>
                        <td className="font-bold pl-8 pb-1">Jumlah Kas dan Bank</td>
                        <td className={`text-right font-bold border-t border-slate-800 pb-1 ${cashVal < 0 ? 'text-rose-600' : ''}`}>
                          {formatAccounting(cashVal)}
                        </td>
                      </tr>

                      {/* Piutang Dagang */}
                      <tr><td className="font-bold pl-8 pt-1">Piutang Dagang</td><td /></tr>
                      {groupedReceivables.length > 0 ? (
                        groupedReceivables.map((r, i) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="pl-12 text-slate-700">{r.name}</td>
                            <td className="text-right">{formatAccounting(r.amount)}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td className="pl-12 text-slate-500">Piutang Pelanggan</td>
                          <td className="text-right">0,00</td>
                        </tr>
                      )}
                      <tr>
                        <td className="font-bold pl-8 pb-1">Jumlah Piutang Dagang</td>
                        <td className="text-right font-bold border-t border-slate-800 pb-1">
                          {formatAccounting(receivableVal)}
                        </td>
                      </tr>

                      {/* Persediaan */}
                      <tr><td className="font-bold pl-8 pt-1">Persediaan</td><td /></tr>
                      {inventoryVal > 0 && (
                        <tr>
                          <td className="pl-12 text-slate-700">Persediaan Obat & Alat Kesehatan</td>
                          <td className="text-right">{formatAccounting(inventoryVal)}</td>
                        </tr>
                      )}
                      <tr>
                        <td className="font-bold pl-8 pb-1">Jumlah Persediaan</td>
                        <td className="text-right font-bold border-t border-slate-800 pb-1">
                          {formatAccounting(inventoryVal)}
                        </td>
                      </tr>

                      {/* Aktiva lancar lainnya */}
                      <tr><td className="font-bold pl-8 pt-1">Aktiva lancar lainnya</td><td /></tr>
                      <tr>
                        <td className="font-bold pl-8 pb-1">Jumlah Aktiva lancar lainnya</td>
                        <td className="text-right font-bold border-t border-slate-800 pb-1">0,00</td>
                      </tr>

                      <tr>
                        <td className="font-bold pl-4 py-1">Jumlah Aktiva Lancar</td>
                        <td className="text-right font-bold border-t border-slate-800 py-1">
                          {formatAccounting(totalCurrentAssets)}
                        </td>
                      </tr>

                      {/* Aktiva Tetap */}
                      <tr><td className="font-bold pl-4 pt-1">Aktiva Tetap</td><td /></tr>
                      <tr><td className="font-bold pl-8">Nilai histori</td><td /></tr>
                      <tr>
                        <td className="font-bold pl-8">Jumlah Nilai histori</td>
                        <td className="text-right font-bold border-t border-slate-800">0,00</td>
                      </tr>
                      <tr><td className="font-bold pl-8">Akumulasi Penyusutan</td><td /></tr>
                      <tr>
                        <td className="font-bold pl-8">Jumlah Akumulasi Penyusutan</td>
                        <td className="text-right font-bold border-t border-slate-800">0,00</td>
                      </tr>
                      <tr>
                        <td className="font-bold pl-4">Jumlah Aktiva Tetap</td>
                        <td className="text-right font-bold border-t border-slate-800">0,00</td>
                      </tr>

                      <tr><td className="font-bold pl-4">OTHER ASSETS</td><td /></tr>
                      <tr>
                        <td className="font-bold pl-4">Jumlah OTHER ASSETS</td>
                        <td className="text-right font-bold border-t border-slate-800">0,00</td>
                      </tr>

                      <tr>
                        <td className="font-bold py-1.5">Jumlah Aktiva</td>
                        <td className="text-right font-bold border-t border-b-4 border-double border-slate-900 py-1.5">
                          {formatAccounting(totalAssets)}
                        </td>
                      </tr>

                      {/* KEWAJIBAN DAN EKUITAS */}
                      <tr><td className="font-bold pt-4">Kewajiban dan Ekuitas</td><td /></tr>
                      <tr><td className="font-bold pl-4">Kewajiban</td><td /></tr>
                      <tr><td className="font-bold pl-8">Kewajiban lancar</td><td /></tr>

                      {/* Hutang Dagang */}
                      <tr><td className="font-bold pl-12">Hutang Dagang</td><td /></tr>
                      {groupedPayables.length > 0 ? (
                        groupedPayables.map((p, i) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="pl-16 text-slate-700">{p.name}</td>
                            <td className="text-right">{formatAccounting(p.amount)}</td>
                          </tr>
                        ))
                      ) : null}
                      <tr>
                        <td className="font-bold pl-12 pb-1">Jumlah Hutang Dagang</td>
                        <td className="text-right font-bold border-t border-slate-800 pb-1">
                          {formatAccounting(payableVal)}
                        </td>
                      </tr>

                      {/* Kewajiban lancar lain */}
                      <tr><td className="font-bold pl-12 pt-1">Kewajiban lancar lain</td><td /></tr>
                      <tr>
                        <td className="font-bold pl-12 pb-1">Jumlah Kewajiban lancar lain</td>
                        <td className="text-right font-bold border-t border-slate-800 pb-1">0,00</td>
                      </tr>

                      <tr>
                        <td className="font-bold pl-8 py-1">Jumlah Kewajiban lancar</td>
                        <td className="text-right font-bold border-t border-slate-800 py-1">
                          {formatAccounting(totalLiabilities)}
                        </td>
                      </tr>

                      <tr><td className="font-bold pl-8">Kewajiban jangka panjang</td><td /></tr>
                      <tr>
                        <td className="font-bold pl-8">Jumlah Kewajiban jangka panjang</td>
                        <td className="text-right font-bold border-t border-slate-800">0,00</td>
                      </tr>

                      <tr>
                        <td className="font-bold pl-4 py-1">Jumlah Kewajiban</td>
                        <td className="text-right font-bold border-t border-slate-800 py-1">
                          {formatAccounting(totalLiabilities)}
                        </td>
                      </tr>

                      {/* Ekuitas */}
                      <tr><td className="font-bold pl-4 pt-1">Ekuitas</td><td /></tr>
                      <tr>
                        <td className="pl-8 text-slate-700">Modal</td>
                        <td className="text-right">{formatAccounting(capitalModal)}</td>
                      </tr>
                      <tr>
                        <td className="pl-8 text-slate-700">Laba tahun/periode ini</td>
                        <td className={`text-right font-semibold ${netProfitVal < 0 ? 'text-rose-600' : ''}`}>
                          {formatAccounting(netProfitVal)}
                        </td>
                      </tr>
                      <tr>
                        <td className="font-bold pl-4 py-1">Jumlah Ekuitas</td>
                        <td className="text-right font-bold border-t border-slate-800 py-1">
                          {formatAccounting(totalEquity)}
                        </td>
                      </tr>

                      <tr>
                        <td className="font-bold py-1.5">Jumlah Kewajiban dan Ekuitas</td>
                        <td className="text-right font-bold border-t border-b-4 border-double border-slate-900 py-1.5">
                          {formatAccounting(totalLiabilities + totalEquity)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="mt-8 pt-3 border-t border-slate-300 flex justify-between items-center text-[11px] text-slate-500">
                  <span>Cetak di {new Date().toLocaleDateString('id-ID')}</span>
                  <span className="font-semibold">ACCURATE Accounting System Report</span>
                  <span>(1)</span>
                </div>
              </div>

              {/* PAGE 3: LABA/RUGI (STANDAR) */}
              <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 sm:p-10 max-w-4xl mx-auto font-sans">
                <div className="text-center mb-6">
                  <p className="text-sm font-bold text-slate-900 uppercase">{companyName}</p>
                  <h2 className="text-xl sm:text-2xl font-bold text-[#8b1c1c] my-1">Laba/Rugi (Standar)</h2>
                  <p className="text-xs sm:text-sm font-bold text-slate-800">
                    Dari {formatDateIndo(startDate)} ke {formatDateIndo(endDate)}
                  </p>
                </div>

                <div className="max-w-2xl mx-auto overflow-x-auto">
                  <table className="w-full text-xs sm:text-[13px] border-collapse">
                    <thead>
                      <tr className="border-b-2 border-slate-800 text-[#000066]">
                        <th className="py-2 px-2 text-left font-bold">Description</th>
                        <th className="py-2 px-2 text-right font-bold">
                          {formatDateIndo(startDate)} - {formatDateIndo(endDate)}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="text-slate-900 leading-relaxed">
                      {/* Pendapatan */}
                      <tr><td className="font-bold pt-2">Pendapatan</td><td /></tr>
                      <tr className="hover:bg-slate-50">
                        <td className="pl-4 text-slate-700">Penjualan Obat & Produk</td>
                        <td className="text-right">{formatAccounting(report.grossSales ?? report.totalRevenue)}</td>
                      </tr>
                      {(report.totalRefunds || 0) > 0 && (
                        <tr className="hover:bg-slate-50 text-rose-600">
                          <td className="pl-4">Retur Penjualan</td>
                          <td className="text-right">-{formatAccounting(report.totalRefunds || 0)}</td>
                        </tr>
                      )}
                      <tr>
                        <td className="font-bold py-1">Jumlah Pendapatan</td>
                        <td className="text-right font-bold border-t border-b border-slate-800 py-1">
                          {formatAccounting(report.totalRevenue)}
                        </td>
                      </tr>

                      {/* Harga Pokok Penjualan */}
                      <tr><td className="font-bold pt-2">Harga Pokok Penjualan</td><td /></tr>
                      <tr className="hover:bg-slate-50">
                        <td className="pl-4 text-slate-700">Harga Pokok Penjualan (HPP Obat)</td>
                        <td className="text-right">{formatAccounting(report.costOfGoodsSold)}</td>
                      </tr>
                      <tr>
                        <td className="font-bold py-1">Jumlah Harga Pokok Penjualan</td>
                        <td className="text-right font-bold border-t border-b border-slate-800 py-1">
                          {formatAccounting(report.costOfGoodsSold)}
                        </td>
                      </tr>

                      {/* LABA KOTOR */}
                      <tr>
                        <td className="font-bold py-1.5">LABA KOTOR</td>
                        <td className="text-right font-bold py-1.5">
                          {formatAccounting(report.grossProfit)}
                        </td>
                      </tr>

                      {/* Beban Operasi */}
                      <tr><td className="font-bold pt-1">Beban Operasi</td><td /></tr>
                      <tr>
                        <td className="font-bold pl-4">Biaya Umum & Administrasi</td>
                        <td className="text-right font-bold">{formatAccounting(report.totalExpenses)}</td>
                      </tr>
                      {groupedExpenses.length > 0 ? (
                        groupedExpenses.map((exp, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="pl-8 text-slate-700">{exp.name}</td>
                            <td className="text-right">{formatAccounting(exp.amount)}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td className="pl-8 text-slate-400">Tidak ada beban operasi pada periode ini</td>
                          <td className="text-right">0,00</td>
                        </tr>
                      )}
                      <tr>
                        <td className="font-bold py-1">Jumlah Beban Operasi</td>
                        <td className="text-right font-bold border-t border-b border-slate-800 py-1">
                          {formatAccounting(report.totalExpenses)}
                        </td>
                      </tr>

                      {/* PENDAPATAN OPERASI */}
                      <tr>
                        <td className="font-bold py-1.5">PENDAPATAN OPERASI</td>
                        <td className={`text-right font-bold py-1.5 ${netProfitVal < 0 ? 'text-rose-600' : ''}`}>
                          {formatAccounting(netProfitVal)}
                        </td>
                      </tr>

                      {/* Pendapatan dan Beban Lain */}
                      <tr><td className="font-bold pt-1">Pendapatan dan Beban Lain</td><td /></tr>
                      <tr><td className="font-bold pl-4">Pendapatan lain</td><td /></tr>
                      <tr>
                        <td className="font-bold pl-4">Jumlah Pendapatan lain</td>
                        <td className="text-right font-bold border-t border-slate-800">0,00</td>
                      </tr>
                      <tr><td className="font-bold pl-4">Beban lain-lain</td><td /></tr>
                      <tr>
                        <td className="font-bold pl-4">Jumlah Beban lain-lain</td>
                        <td className="text-right font-bold border-t border-slate-800">0,00</td>
                      </tr>
                      <tr>
                        <td className="font-bold py-1">Jumlah Pendapatan dan Beban Lain</td>
                        <td className="text-right font-bold border-t border-b border-slate-800 py-1">0,00</td>
                      </tr>

                      {/* LABA(RUGI) BERSIH */}
                      <tr>
                        <td className="font-bold py-1">LABA(RUGI) BERSIH (Before Tax)</td>
                        <td className={`text-right font-bold border-b border-slate-800 py-1 ${netProfitVal < 0 ? 'text-rose-600' : ''}`}>
                          {formatAccounting(netProfitVal)}
                        </td>
                      </tr>
                      <tr>
                        <td className="font-bold py-1.5">LABA(RUGI) BERSIH (After Tax)</td>
                        <td className={`text-right font-bold border-b-4 border-double border-slate-900 py-1.5 ${netProfitVal < 0 ? 'text-rose-600' : ''}`}>
                          {formatAccounting(netProfitVal)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="mt-8 pt-3 border-t border-slate-300 flex justify-between items-center text-[11px] text-slate-500">
                  <span>Cetak di {new Date().toLocaleDateString('id-ID')}</span>
                  <span className="font-semibold">ACCURATE Accounting System Report</span>
                  <span>(1)</span>
                </div>
              </div>
            </div>
          ) : (
            /* INTERACTIVE ANALYSIS VIEW */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left: Step-by-step P&L + Balance Sheet Summary */}
              <Card className="overflow-hidden border-none shadow-sm bg-white lg:col-span-1">
                <div className="p-6 border-b border-slate-50">
                  <h3 className="font-bold text-slate-800">Alur Laba/Rugi & Neraca (Standar)</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Klik baris untuk melihat rincian di sebelah kanan</p>
                </div>
                <div className="p-0">
                  <Table>
                    <TableHeader className="bg-slate-50/50">
                      <TableRow>
                        <TableHead>Komponen Laba/Rugi</TableHead>
                        <TableHead className="text-right">Nilai</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow className="cursor-pointer hover:bg-slate-50" onClick={() => setDetailTab('gross')}>
                        <TableCell className="font-medium text-slate-700">1. Jumlah Pendapatan Bersih</TableCell>
                        <TableCell className="text-right font-bold text-slate-900">{formatCurrency(report.totalRevenue)}</TableCell>
                      </TableRow>
                      <TableRow className="cursor-pointer hover:bg-rose-50/40" onClick={() => setDetailTab('gross')}>
                        <TableCell className="font-medium text-rose-600">
                          2. Dikurangi: Harga Pokok Penjualan (HPP)
                          <span className="block text-[10px] text-slate-400">Klik untuk rincian HPP per obat</span>
                        </TableCell>
                        <TableCell className="text-right font-bold text-rose-600">- {formatCurrency(report.costOfGoodsSold)}</TableCell>
                      </TableRow>
                      <TableRow className="bg-emerald-50/60 cursor-pointer" onClick={() => setDetailTab('gross')}>
                        <TableCell className="font-black text-emerald-800 pl-6">= LABA KOTOR</TableCell>
                        <TableCell className="text-right font-black text-emerald-700">{formatCurrency(report.grossProfit)}</TableCell>
                      </TableRow>
                      <TableRow className="cursor-pointer hover:bg-rose-50/40" onClick={() => setDetailTab('net')}>
                        <TableCell className="font-medium text-rose-600">
                          3. Dikurangi: Jumlah Beban Operasi
                          <span className="block text-[10px] text-slate-400">Biaya Umum, Adm, Listrik, Gaji, Sewa</span>
                        </TableCell>
                        <TableCell className="text-right font-bold text-rose-600">- {formatCurrency(report.totalExpenses)}</TableCell>
                      </TableRow>
                      <TableRow className="bg-slate-900 cursor-pointer" onClick={() => setDetailTab('net')}>
                        <TableCell className="font-black text-white pl-6">= LABA(RUGI) BERSIH</TableCell>
                        <TableCell className={`text-right font-black ${netProfitVal >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {formatCurrency(netProfitVal)}
                        </TableCell>
                      </TableRow>

                      {/* Balance Sheet Section */}
                      <TableRow className="bg-indigo-50/50">
                        <TableCell colSpan={2} className="font-extrabold text-[11px] uppercase tracking-wider text-indigo-800 py-2">
                          Komponen Neraca (Aktiva & Kewajiban)
                        </TableCell>
                      </TableRow>
                      <TableRow className="cursor-pointer hover:bg-purple-50/40" onClick={() => setDetailTab('net')}>
                        <TableCell className="font-medium text-purple-700">
                          • Piutang Dagang Customer (Aktiva Lancar)
                          <span className="block text-[10px] text-slate-400">Tagihan customer belum cair (Tidak memotong Laba)</span>
                        </TableCell>
                        <TableCell className="text-right font-bold text-purple-700">{formatCurrency(report.totalReceivableDebt || 0)}</TableCell>
                      </TableRow>
                      <TableRow className="cursor-pointer hover:bg-amber-50/40" onClick={() => setDetailTab('net')}>
                        <TableCell className="font-medium text-amber-700">
                          • Hutang Dagang Supplier (Kewajiban Lancar)
                          <span className="block text-[10px] text-slate-400">Liabilitas ke PBF/Supplier (Tidak memotong Laba)</span>
                        </TableCell>
                        <TableCell className="text-right font-bold text-amber-700">{formatCurrency(report.totalPayableDebt || 0)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium text-slate-700">
                          • Nilai Persediaan Obat (Aktiva Lancar)
                          <span className="block text-[10px] text-slate-400">Nilai stok obat aktif di gudang/cabang</span>
                        </TableCell>
                        <TableCell className="text-right font-bold text-slate-800">{formatCurrency(inventoryVal)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </Card>

              {/* Right: Interactive Breakdown Panel */}
              <Card className="overflow-hidden border-none shadow-sm bg-white lg:col-span-2">
                <div className="p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setDetailTab('gross')}
                      className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                        detailTab === 'gross'
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      1. Rincian HPP Obat & Laba Kotor
                    </button>
                    <button
                      type="button"
                      onClick={() => setDetailTab('net')}
                      className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                        detailTab === 'net'
                          ? 'bg-slate-900 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      2. Rincian Beban Operasi & Posisi Neraca (Hutang/Piutang)
                    </button>
                  </div>

                  {detailTab === 'gross' && (
                    <div className="relative w-full sm:w-56">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <Input
                        placeholder="Cari obat..."
                        value={itemSearch}
                        onChange={(e) => setItemSearch(e.target.value)}
                        className="pl-8 h-8 text-xs"
                      />
                    </div>
                  )}
                </div>

                {detailTab === 'gross' ? (
                  <div className="p-0">
                    <Table>
                      <TableHeader className="bg-slate-50/50">
                        <TableRow>
                          <TableHead>Nama Obat / Produk</TableHead>
                          <TableHead className="text-center">Qty Terjual</TableHead>
                          <TableHead className="text-right">Total Penjualan</TableHead>
                          <TableHead className="text-right">HPP (Modal)</TableHead>
                          <TableHead className="text-right">Laba Kotor</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredItems.length > 0 ? (
                          (() => {
                            const idxLast = itemPage * entriesPerPage;
                            const idxFirst = idxLast - entriesPerPage;
                            const currentItems = filteredItems.slice(idxFirst, idxLast);
                            return currentItems.map((it, idx) => (
                              <TableRow key={idx}>
                                <TableCell>
                                  <p className="font-bold text-slate-800">{it.productName}</p>
                                  <p className="text-[10px] font-mono text-slate-400">{it.sku}</p>
                                </TableCell>
                                <TableCell className="text-center font-bold text-slate-600">
                                  {Number(it.quantitySold || 0).toLocaleString('id-ID')}
                                </TableCell>
                                <TableCell className="text-right font-semibold text-slate-800">
                                  {formatCurrency(it.totalRevenue)}
                                </TableCell>
                                <TableCell className="text-right font-semibold text-rose-500">
                                  -{formatCurrency(it.totalCost)}
                                </TableCell>
                                <TableCell className="text-right font-black text-emerald-600">
                                  {formatCurrency(it.grossProfit)}
                                </TableCell>
                              </TableRow>
                            ));
                          })()
                        ) : (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-6 text-slate-400 text-sm">
                              Tidak ada data penjualan produk pada periode ini.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                    {filteredItems.length > entriesPerPage && (
                      <Pagination
                        currentPage={itemPage}
                        totalPages={Math.ceil(filteredItems.length / entriesPerPage)}
                        onPageChange={setItemPage}
                        totalEntries={filteredItems.length}
                        indexOfFirstEntry={(itemPage - 1) * entriesPerPage}
                        indexOfLastEntry={itemPage * entriesPerPage}
                        label="Produk"
                      />
                    )}
                  </div>
                ) : (
                  <div className="p-4 space-y-6">
                    {/* Section A: Operational Expenses (Laba/Rugi Deduction) */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between px-2">
                        <div>
                          <h4 className="text-xs font-extrabold uppercase tracking-wider text-rose-800">
                            A. Beban Operasi — Pengurang Laba/Rugi Standar
                          </h4>
                          <p className="text-[11px] text-slate-400">Biaya Umum & Administrasi, gaji, listrik, sewa, dan pengeluaran operasional cabang</p>
                        </div>
                        <span className="text-xs font-black text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
                          -{formatCurrency(report.totalExpenses || 0)}
                        </span>
                      </div>
                      <div className="border border-slate-100 rounded-2xl overflow-hidden">
                        <Table>
                          <TableHeader className="bg-slate-50/50">
                            <TableRow>
                              <TableHead>Tanggal</TableHead>
                              <TableHead>Kategori</TableHead>
                              <TableHead>Keterangan</TableHead>
                              <TableHead className="text-right">Nominal Beban</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {report.expenses && report.expenses.length > 0 ? (
                              (() => {
                                const indexOfLastEntry = currentPage * entriesPerPage;
                                const indexOfFirstEntry = indexOfLastEntry - entriesPerPage;
                                const currentEntries = report.expenses.slice(indexOfFirstEntry, indexOfLastEntry);
                                return currentEntries.map((expense, idx) => (
                                  <TableRow key={idx}>
                                    <TableCell className="text-slate-500 text-xs">
                                      {expense.expenseDate ? new Date(expense.expenseDate).toLocaleDateString('id-ID') : '-'}
                                    </TableCell>
                                    <TableCell className="font-bold text-slate-700 text-xs">{expense.category}</TableCell>
                                    <TableCell className="text-slate-500 text-xs">{expense.notes || '-'}</TableCell>
                                    <TableCell className="text-right font-bold text-rose-600 text-xs">-{formatCurrency(expense.amount)}</TableCell>
                                  </TableRow>
                                ));
                              })()
                            ) : (
                              <TableRow>
                                <TableCell colSpan={4} className="text-center py-4 text-slate-400 text-xs">
                                  Tidak ada pengeluaran beban operasional pada periode ini (Rp 0).
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                        {report.expenses && report.expenses.length > entriesPerPage && (
                          <Pagination
                            currentPage={currentPage}
                            totalPages={Math.ceil(report.expenses.length / entriesPerPage)}
                            onPageChange={setCurrentPage}
                            totalEntries={report.expenses.length}
                            indexOfFirstEntry={(currentPage - 1) * entriesPerPage}
                            indexOfLastEntry={currentPage * entriesPerPage}
                            label="Biaya"
                          />
                        )}
                      </div>
                    </div>

                    {/* Section B: Neraca - Kewajiban Lancar (Hutang Dagang Supplier) */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between px-2">
                        <div>
                          <h4 className="text-xs font-extrabold uppercase tracking-wider text-amber-800">
                            B. Neraca (Kewajiban Lancar): Rincian Hutang Dagang ke Supplier
                          </h4>
                          <p className="text-[11px] text-slate-400">Akun Liabilitas Neraca (`HUTANG_PEMBELIAN`) — tidak memotong Laba Bersih secara ganda</p>
                        </div>
                        <span className="text-xs font-black text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                          {formatCurrency(report.totalPayableDebt || 0)}
                        </span>
                      </div>
                      <div className="border border-slate-100 rounded-2xl overflow-hidden">
                        <Table>
                          <TableHeader className="bg-slate-50/50">
                            <TableRow>
                              <TableHead>No. Faktur</TableHead>
                              <TableHead>Supplier</TableHead>
                              <TableHead>Jatuh Tempo</TableHead>
                              <TableHead className="text-right">Total Faktur</TableHead>
                              <TableHead className="text-right">Terbayar</TableHead>
                              <TableHead className="text-right">Sisa Hutang Dagang</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {report.debtsBreakdown && report.debtsBreakdown.length > 0 ? (
                              report.debtsBreakdown.map((d, idx) => (
                                <TableRow key={d.id || idx}>
                                  <TableCell className="font-mono font-bold text-slate-800 text-xs">{d.invoiceNumber}</TableCell>
                                  <TableCell className="font-bold text-slate-700 text-xs">{d.supplierName}</TableCell>
                                  <TableCell className="text-slate-500 text-xs">{d.dueDate || '-'}</TableCell>
                                  <TableCell className="text-right text-slate-700 text-xs">{formatCurrency(d.totalAmount)}</TableCell>
                                  <TableCell className="text-right text-emerald-600 text-xs">{formatCurrency(d.paidAmount)}</TableCell>
                                  <TableCell className="text-right font-black text-amber-700 text-xs">{formatCurrency(d.remainingAmount)}</TableCell>
                                </TableRow>
                              ))
                            ) : (
                              <TableRow>
                                <TableCell colSpan={6} className="text-center py-4 text-slate-400 text-xs">
                                  Tidak ada sisa hutang dagang ke supplier (Rp 0).
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </div>

                    {/* Section C: Neraca - Aktiva Lancar (Piutang Dagang Customer) */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between px-2">
                        <div>
                          <h4 className="text-xs font-extrabold uppercase tracking-wider text-purple-800">
                            C. Neraca (Aktiva Lancar): Rincian Piutang Dagang Customer
                          </h4>
                          <p className="text-[11px] text-slate-400">Akun Aset Piutang Neraca (`HUTANG_PENJUALAN`) — tagihan penjualan tempo customer</p>
                        </div>
                        <span className="text-xs font-black text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200">
                          {formatCurrency(report.totalReceivableDebt || 0)}
                        </span>
                      </div>
                      <div className="border border-slate-100 rounded-2xl overflow-hidden">
                        <Table>
                          <TableHeader className="bg-slate-50/50">
                            <TableRow>
                              <TableHead>No. Invoice</TableHead>
                              <TableHead>Nama Customer</TableHead>
                              <TableHead>Jatuh Tempo</TableHead>
                              <TableHead className="text-right">Total Belanja</TableHead>
                              <TableHead className="text-right">Terbayar</TableHead>
                              <TableHead className="text-right">Sisa Piutang Dagang</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {report.receivableDebtsBreakdown && report.receivableDebtsBreakdown.length > 0 ? (
                              report.receivableDebtsBreakdown.map((d, idx) => (
                                <TableRow key={d.id || idx}>
                                  <TableCell className="font-mono font-bold text-slate-800 text-xs">{d.invoiceNumber}</TableCell>
                                  <TableCell className="font-bold text-slate-700 text-xs">{d.customerName || d.supplierName || 'Customer'}</TableCell>
                                  <TableCell className="text-slate-500 text-xs">{d.dueDate || '-'}</TableCell>
                                  <TableCell className="text-right text-slate-700 text-xs">{formatCurrency(d.totalAmount)}</TableCell>
                                  <TableCell className="text-right text-emerald-600 text-xs">{formatCurrency(d.paidAmount)}</TableCell>
                                  <TableCell className="text-right font-black text-purple-700 text-xs">{formatCurrency(d.remainingAmount)}</TableCell>
                                </TableRow>
                              ))
                            ) : (
                              <TableRow>
                                <TableCell colSpan={6} className="text-center py-4 text-slate-400 text-xs">
                                  Tidak ada sisa piutang dagang customer (Rp 0).
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            </div>
          )}
        </>
      ) : (
        <div className="h-64 flex flex-col items-center justify-center bg-white rounded-3xl border border-dashed border-slate-200">
          <AlertCircle className="w-8 h-8 text-slate-300 mb-2" />
          <p className="text-slate-400">Gagal memuat data laporan.</p>
        </div>
      )}
    </div>
  );
};

export default ProfitLossPage;
