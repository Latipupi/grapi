import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/api';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';
import { Button } from '../components/ui/Button';
import { 
  User, 
  Clock, 
  FileText, 
  Printer, 
  AlertTriangle,
  Building
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

const ShiftsReportPage: React.FC = () => {
  const { branchId } = useSelector((state: RootState) => state.auth);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [selectedOperatorId, setSelectedOperatorId] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  // Fetch all shifts
  const { data: shifts, isLoading } = useQuery<any[]>({
    queryKey: ['shifts'],
    queryFn: () => api.get('/shifts').then(res => res.data)
  });

  // Fetch branches for filter
  const { data: branches } = useQuery<any[]>({
    queryKey: ['branches'],
    queryFn: () => api.get('/branches').then(res => res.data),
    enabled: !branchId
  });

  // Unique list of operators from shifts
  const operators = React.useMemo(() => {
    if (!shifts) return [];
    const map = new Map();
    shifts.forEach(s => {
      if (s.user) {
        map.set(s.user.id, s.user.fullName);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [shifts]);

  // Filters logic
  const filteredShifts = React.useMemo(() => {
    if (!shifts) return [];
    return shifts.filter(s => {
      const matchBranch = branchId 
        ? s.branch?.id === branchId 
        : (selectedBranchId ? s.branch?.id === parseInt(selectedBranchId) : true);
      const matchOperator = selectedOperatorId ? s.user?.id === parseInt(selectedOperatorId) : true;
      const matchStatus = selectedStatus ? s.status === selectedStatus : true;
      return matchBranch && matchOperator && matchStatus;
    }).sort((a, b) => b.id - a.id); // Sort by newest shift ID
  }, [shifts, branchId, selectedBranchId, selectedOperatorId, selectedStatus]);

  const handlePrintReceipt = (s: any) => {
    if (!s) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const htmlContent = `
      <html>
        <head>
          <title>Struk Ringkasan Shift - #SHF-${s.id}</title>
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
            <p>${s.branch?.name || 'Cabang Utama'}</p>
          </div>
          <div class="meta">
            <p>Shift ID: #${s.id}</p>
            <p>Kasir: ${s.user?.fullName}</p>
            <p>Mulai: ${new Date(s.startTime).toLocaleString('id-ID')}</p>
            <p>Selesai: ${s.endTime ? new Date(s.endTime).toLocaleString('id-ID') : 'Belum Ditutup'}</p>
          </div>
          <div class="details">
            <div class="row">
              <span>Modal Awal</span>
              <span class="bold">Rp ${s.startingCash?.toLocaleString()}</span>
            </div>
            <div class="row">
              <span>Total Penjualan</span>
              <span class="bold">Rp ${s.totalSales?.toLocaleString() || 0}</span>
            </div>
            <div class="row">
              <span>Ekspektasi Kas</span>
              <span class="bold">Rp ${(s.expectedEndingCash || s.startingCash).toLocaleString()}</span>
            </div>
            <div class="row">
              <span>Kas Aktual</span>
              <span class="bold">${s.endingCash !== null ? `Rp ${s.endingCash.toLocaleString()}` : '-'}</span>
            </div>
            ${s.status === 'CLOSED' ? `
            <div class="row bold">
              <span>Selisih</span>
              <span>Rp ${(s.endingCash - s.expectedEndingCash).toLocaleString()}</span>
            </div>
            ` : ''}
          </div>
          <div class="footer text-center">
            <p>Dicetak ulang pada: ${new Date().toLocaleString('id-ID')}</p>
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
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
            <FileText className="w-8 h-8 text-emerald-600" />
            Laporan Shift Kasir
          </h1>
          <p className="text-slate-500 mt-1 text-sm font-medium">
            Monitor semua sesi pembukaan laci kasir, serah terima shift, dan rekonsiliasi selisih kas fisik.
          </p>
        </div>
      </div>

      {/* Filters Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4">
        {!branchId && (
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cabang</label>
            <select
              className="w-full h-11 px-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold text-slate-700 focus:ring-emerald-500 cursor-pointer"
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
            >
              <option value="">Semua Cabang</option>
              {branches?.map(b => (
                <option key={b.id} value={b.id.toString()}>{b.name}</option>
              ))}
            </select>
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Kasir / Operator</label>
          <select
            className="w-full h-11 px-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold text-slate-700 focus:ring-emerald-500 cursor-pointer"
            value={selectedOperatorId}
            onChange={(e) => setSelectedOperatorId(e.target.value)}
          >
            <option value="">Semua Operator</option>
            {operators.map(o => (
              <option key={o.id} value={o.id.toString()}>{o.name}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</label>
          <select
            className="w-full h-11 px-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold text-slate-700 focus:ring-emerald-500 cursor-pointer"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="">Semua Status</option>
            <option value="OPEN">Shift Aktif (Buka)</option>
            <option value="CLOSED">Shift Selesai (Tutup)</option>
          </select>
        </div>
      </div>

      {/* Shifts List Grid */}
      {isLoading ? (
        <div className="flex h-[30vh] items-center justify-center bg-white rounded-3xl border border-slate-100 shadow-sm">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-slate-500 text-sm font-bold">Memuat riwayat shift kasir...</p>
          </div>
        </div>
      ) : filteredShifts.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-slate-100 shadow-sm text-slate-400 gap-4">
          <AlertTriangle className="w-16 h-16 opacity-20 text-emerald-600" />
          <p className="text-sm font-bold">Tidak ada riwayat shift kasir yang cocok.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredShifts.map((s) => {
            const isClosed = s.status === 'CLOSED';
            const variance = isClosed ? s.endingCash - s.expectedEndingCash : 0;
            
            return (
              <motion.div
                layout
                key={s.id}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-5 relative overflow-hidden"
              >
                {/* Branch / ID Title */}
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                      <Building className="w-3.5 h-3.5" />
                      {s.branch?.name || 'Cabang'}
                    </span>
                    <h3 className="font-extrabold text-slate-800 text-lg">Shift ID #{s.id}</h3>
                  </div>
                  <span className={cn(
                    "text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border shrink-0",
                    isClosed
                      ? "bg-slate-50 border-slate-200 text-slate-500"
                      : "bg-emerald-50 border-emerald-100 text-emerald-600 animate-pulse"
                  )}>
                    {isClosed ? 'CLOSED' : 'OPEN'}
                  </span>
                </div>

                {/* Operator and Dates */}
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="space-y-0.5">
                    <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Operator Kasir</span>
                    <p className="font-bold text-slate-700 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      {s.user?.fullName}
                    </p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Durasi Sesi</span>
                    <p className="font-bold text-slate-700 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {isClosed ? (() => {
                        const start = new Date(s.startTime).getTime();
                        const end = new Date(s.endTime).getTime();
                        const diffMins = Math.round((end - start) / 60000);
                        if (diffMins < 60) return `${diffMins} Menit`;
                        const diffHrs = Math.floor(diffMins / 60);
                        return `${diffHrs} Jam ${diffMins % 60} Menit`;
                      })() : 'Sedang Berlangsung'}
                    </p>
                  </div>
                </div>

                {/* Dates Info */}
                <div className="bg-slate-50/50 p-3 rounded-2xl border border-slate-100/60 grid grid-cols-2 gap-3 text-[10px] font-medium text-slate-500">
                  <div>
                    <span>Mulai:</span>
                    <p className="font-bold text-slate-700 mt-0.5">{new Date(s.startTime).toLocaleString('id-ID')}</p>
                  </div>
                  <div>
                    <span>Selesai:</span>
                    <p className="font-bold text-slate-700 mt-0.5">
                      {s.endTime ? new Date(s.endTime).toLocaleString('id-ID') : '-'}
                    </p>
                  </div>
                </div>

                {/* Reconciliation Metrics */}
                <div className="border-t border-slate-100 pt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  <div className="space-y-0.5">
                    <span className="text-slate-400 font-bold text-[9px] uppercase tracking-wider">Modal Awal</span>
                    <p className="font-extrabold text-slate-700">Rp {s.startingCash?.toLocaleString()}</p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-slate-400 font-bold text-[9px] uppercase tracking-wider">Total Penjualan</span>
                    <p className="font-extrabold text-emerald-600">Rp {(s.totalSales || 0).toLocaleString()}</p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-slate-400 font-bold text-[9px] uppercase tracking-wider">Ekspektasi Kas</span>
                    <p className="font-extrabold text-slate-700">Rp {(s.expectedEndingCash || s.startingCash).toLocaleString()}</p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-slate-400 font-bold text-[9px] uppercase tracking-wider">Kas Aktual</span>
                    <p className="font-extrabold text-slate-700">{s.endingCash !== null ? `Rp ${s.endingCash.toLocaleString()}` : '-'}</p>
                  </div>
                </div>

                {/* Variance Display & Reprint Action */}
                <div className="border-t border-slate-100 pt-4 flex items-center justify-between gap-4">
                  <div>
                    {isClosed ? (
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 font-bold text-[9px] uppercase tracking-wider">Selisih Kas:</span>
                        {variance === 0 ? (
                          <span className="text-xs font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full uppercase tracking-wider">
                            Pas (Rp 0)
                          </span>
                        ) : variance > 0 ? (
                          <span className="text-xs font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full uppercase tracking-wider">
                            Lebih (+Rp {variance.toLocaleString()})
                          </span>
                        ) : (
                          <span className="text-xs font-black text-rose-600 bg-rose-50 border border-rose-100 px-3 py-1 rounded-full uppercase tracking-wider">
                            Kurang (-Rp {Math.abs(variance).toLocaleString()})
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-amber-600 bg-amber-50 border border-amber-100 px-3 py-1.5 rounded-full font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
                        Shift Masih Aktif
                      </span>
                    )}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePrintReceipt(s)}
                    className="h-9 px-3 text-xs font-bold gap-1.5 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Cetak Struk
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ShiftsReportPage;
