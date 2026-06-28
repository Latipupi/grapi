import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';
import api from '../api/api';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Pagination } from '../components/ui/Pagination';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { 
  ClipboardList, 
  Plus, 
  Save, 
  CheckCircle2, 
  ArrowLeft, 
  Printer, 
  Search, 
  Calendar,
  TrendingDown,
  TrendingUp,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Batch {
  id: number;
  batchNumber: string;
  expiryDate: string;
  currentQuantity: number;
  purchasePrice: number;
  product: {
    id: number;
    name: string;
    sku: string;
    baseUnit: string;
  };
}

interface OpnameDetail {
  id: number;
  inventoryBatch: Batch;
  product: {
    id: number;
    name: string;
    sku: string;
    baseUnit: string;
  };
  systemQuantity: number;
  physicalQuantity: number;
  difference: number;
  reason?: string;
}

interface OpnameSession {
  id: number;
  opnameDate: string;
  status: string;
  notes: string;
  branch: { name: string };
  user: { fullName: string };
  details: OpnameDetail[];
}

const StockOpnamePage: React.FC = () => {
  const { branchId: authBranchId, userId, role } = useSelector((state: RootState) => state.auth);
  
  const [selectedBranchId, setSelectedBranchId] = useState<string>(authBranchId ? authBranchId.toString() : '');
  
  const [currentHistoryPage, setCurrentHistoryPage] = useState(1);
  const historyEntriesPerPage = 10;

  const [currentSheetPage, setCurrentSheetPage] = useState(1);
  const sheetEntriesPerPage = 10;

  useEffect(() => {
    setCurrentHistoryPage(1);
  }, [selectedBranchId]);


  const { data: branches } = useQuery<any[]>({
    queryKey: ['branches'],
    queryFn: () => api.get('/branches').then(res => res.data),
    enabled: role === 'ADMIN' || role === 'OWNER' || !authBranchId
  });

  React.useEffect(() => {
    if (branches && branches.length > 0 && !selectedBranchId) {
      setSelectedBranchId(branches[0].id.toString());
    }
  }, [branches, selectedBranchId]);

  const branchId = selectedBranchId ? Number(selectedBranchId) : null;
  const queryClient = useQueryClient();

  // Screen state: 'LIST' or 'WORKBENCH'
  const [screen, setScreen] = useState<'LIST' | 'WORKBENCH'>('LIST');
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);

  useEffect(() => {
    setCurrentSheetPage(1);
  }, [activeSessionId]);
  
  // Opname parameters
  const [opnameType, setOpnameType] = useState<'FULL' | 'PARTIAL'>('PARTIAL');
  const [opnameNotes, setOpnameNotes] = useState('');
  
  // Search products for partial opname adding
  const [searchProductQuery, setSearchProductQuery] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);

  // Print iframe reference
  const printFrameRef = useRef<HTMLIFrameElement>(null);

  // Queries
  const { data: sessions, isLoading: sessionsLoading } = useQuery<OpnameSession[]>({
    queryKey: ['opname-sessions', branchId],
    queryFn: () => api.get(`/inventory/opnames/branch/${branchId || ''}`).then(res => res.data),
    enabled: !!branchId
  });

  const { data: activeSession, isLoading: activeSessionLoading } = useQuery<OpnameSession>({
    queryKey: ['opname-session-detail', activeSessionId],
    queryFn: () => api.get(`/inventory/opnames/${activeSessionId}`).then(res => res.data),
    enabled: !!activeSessionId
  });

  const { data: availableBatches } = useQuery<Batch[]>({
    queryKey: ['branch-batches', branchId],
    queryFn: () => api.get(`/inventory/branch/${branchId}/batches`).then(res => res.data),
    enabled: screen === 'WORKBENCH' && opnameType === 'PARTIAL' && !!branchId
  });

  // Local state for workspace physical counts
  const [detailDrafts, setDetailDrafts] = useState<{[key: number]: { physicalQty: number; reason: string }}>({});

  // Synchronize local draft states when session is loaded
  React.useEffect(() => {
    if (activeSession && activeSession.details) {
      const drafts: {[key: number]: { physicalQty: number; reason: string }} = {};
      activeSession.details.forEach(d => {
        drafts[d.id] = {
          physicalQty: d.physicalQuantity,
          reason: d.reason || ''
        };
      });
      setDetailDrafts(drafts);
      setOpnameNotes(activeSession.notes || '');
    }
  }, [activeSession]);

  // Mutations
  const startSessionMutation = useMutation({
    mutationFn: (type: 'FULL' | 'PARTIAL') => {
      if (!branchId) {
        throw new Error('Cabang belum dipilih. Silakan pilih cabang terlebih dahulu!');
      }
      return api.post(`/inventory/opnames/branch/${branchId}/start?userId=${userId}&type=${type}`).then(res => res.data);
    },
    onSuccess: (data) => {
      setActiveSessionId(data.id);
      setOpnameType((data.details?.length || 0) > 0 ? 'FULL' : 'PARTIAL');
      setScreen('WORKBENCH');
      setDetailDrafts({});
      setOpnameNotes('');
      queryClient.invalidateQueries({ queryKey: ['opname-sessions'] });
    },
    onError: (err: any) => {
      alert(err.response?.data || err.message || 'Gagal memulai sesi stock opname.');
    }
  });

  const addBatchMutation = useMutation({
    mutationFn: (batchId: number) => 
      api.post(`/inventory/opnames/${activeSessionId}/add-batch?batchId=${batchId}`).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opname-session-detail', activeSessionId] });
      setSearchProductQuery('');
      setShowProductDropdown(false);
    }
  });

  const saveDraftMutation = useMutation({
    mutationFn: () => {
      const draftsPayload = Object.entries(detailDrafts).map(([detailId, val]) => ({
        detailId: Number(detailId),
        physicalQuantity: val.physicalQty,
        reason: val.reason
      }));
      return api.put(`/inventory/opnames/${activeSessionId}/save`, {
        drafts: draftsPayload,
        notes: opnameNotes
      }).then(res => res.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opname-session-detail', activeSessionId] });
      alert('Draf opname berhasil disimpan!');
    }
  });

  const finalizeMutation = useMutation({
    mutationFn: () => api.post(`/inventory/opnames/${activeSessionId}/finalize`).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opname-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['branch-batches'] });
      alert('Sesi Stock Opname berhasil difinalisasi dan stok telah disesuaikan secara real-time!');
      setScreen('LIST');
      setActiveSessionId(null);
    },
    onError: (err: any) => {
      alert(err.response?.data || 'Gagal melakukan finalisasi opname.');
    }
  });

  // Autocomplete products
  const filteredAvailableBatches = availableBatches?.filter(b => {
    if (!searchProductQuery) return false;
    const query = searchProductQuery.toLowerCase();
    const nameMatch = b.product.name.toLowerCase().includes(query);
    const skuMatch = b.product.sku.toLowerCase().includes(query);
    const batchMatch = b.batchNumber.toLowerCase().includes(query);
    
    // Do not show batches already added
    const alreadyAdded = (activeSession?.details || []).some(d => d.inventoryBatch.id === b.id);
    
    return (nameMatch || skuMatch || batchMatch) && !alreadyAdded;
  }).slice(0, 5);

  const handleUpdateDraftCount = (detailId: number, qty: number) => {
    setDetailDrafts(prev => ({
      ...prev,
      [detailId]: {
        ...prev[detailId],
        physicalQty: isNaN(qty) ? 0 : qty
      }
    }));
  };

  const handleUpdateDraftReason = (detailId: number, reason: string) => {
    setDetailDrafts(prev => ({
      ...prev,
      [detailId]: {
        ...prev[detailId],
        reason
      }
    }));
  };

  const handlePrintWorksheet = () => {
    if (!activeSession) return;
    
    const printContent = `
      <html>
        <head>
          <title>LEMBAR KERJA STOCK OPNAME - #${activeSession.id}</title>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; padding: 30px; font-size: 13px; }
            .header { text-align: center; border-bottom: 3px double #10b981; padding-bottom: 12px; margin-bottom: 25px; }
            .header h1 { margin: 0 0 5px; color: #10b981; font-size: 22px; }
            .meta-grid { display: grid; grid-template-columns: 1fr 1fr; margin-bottom: 20px; font-size: 11px; color: #555; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th { background-color: #f3f4f6; color: #374151; font-weight: bold; border: 1px solid #d1d5db; padding: 8px; text-align: left; }
            td { border: 1px solid #e5e7eb; padding: 8px; }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .signature { margin-top: 50px; display: flex; justify-content: space-between; }
            .sig-box { text-align: center; width: 200px; border-top: 1px solid #333; padding-top: 5px; font-size: 11px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>LEMBAR STOCK OPNAME FISIK</h1>
            <p>Sesi Rekonsiliasi Inventori G-Apotek</p>
          </div>
          <div class="meta-grid">
            <div>
              <strong>No. Dokumen:</strong> #SO-${activeSession.id}<br>
              <strong>Cabang:</strong> ${activeSession.branch?.name || '-'}<br>
              <strong>Tipe:</strong> ${(activeSession.details?.length || 0) > 0 ? 'Full (Seluruh Obat)' : 'Parsial (Opname Cicilan)'}
            </div>
            <div class="text-right">
              <strong>Tanggal Draf:</strong> ${new Date(activeSession.opnameDate).toLocaleString('id-ID')}<br>
              <strong>Petugas:</strong> ${activeSession.user?.fullName || '-'}<br>
              <strong>Status:</strong> ${activeSession.status}
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th width="40px" class="text-center">No</th>
                <th>Nama Produk / SKU</th>
                <th class="text-center">No. Batch</th>
                <th class="text-center">Tgl ED</th>
                <th class="text-right">Kuantitas Sistem</th>
                <th class="text-center" width="120px">Kuantitas Fisik</th>
                <th class="text-center" width="150px">Paraf Auditor</th>
              </tr>
            </thead>
            <tbody>
              ${(activeSession.details || []).map((detail, idx) => `
                <tr>
                  <td class="text-center">${idx + 1}</td>
                  <td><strong>${detail.product.name}</strong><br><small style="color:#777">${detail.product.sku}</small></td>
                  <td class="text-center">${detail.inventoryBatch.batchNumber}</td>
                  <td class="text-center">${new Date(detail.inventoryBatch.expiryDate).toLocaleDateString('id-ID')}</td>
                  <td class="text-right">${detail.systemQuantity} ${detail.product.baseUnit}</td>
                  <td style="border: 2px solid #555;"></td>
                  <td></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="signature">
            <div class="sig-box" style="margin-top: 50px;">Apoteker Pendamping / Supervisor</div>
            <div class="sig-box" style="margin-top: 50px;">Petugas Hitung / Auditor</div>
          </div>
          
          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `;

    if (printFrameRef.current) {
      const doc = printFrameRef.current.contentDocument || printFrameRef.current.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(printContent);
        doc.close();
      }
    }
  };

  // Compute live variance analytics inside workbench
  const workbenchStats = React.useMemo(() => {
    if (!activeSession || !activeSession.details) return { totalItems: 0, matched: 0, deficit: 0, surplus: 0 };
    
    let totalItems = 0;
    let matched = 0;
    let deficit = 0;
    let surplus = 0;

    activeSession.details.forEach(d => {
      totalItems++;
      const draft = detailDrafts[d.id];
      if (draft) {
        const diff = draft.physicalQty - d.systemQuantity;
        if (diff === 0) matched++;
        else if (diff < 0) deficit++;
        else surplus++;
      }
    });

    return { totalItems, matched, deficit, surplus };
  }, [activeSession, detailDrafts]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <iframe ref={printFrameRef} style={{ display: 'none' }} title="Print Worksheet" />

      {/* 1. Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <ClipboardList className="w-7 h-7 text-emerald-600" />
            Stock Opname Fisik
          </h1>
          <p className="text-slate-500 text-sm">Rekonsiliasi pencocokan stok komputer dengan stok rak secara cicilan/parsial.</p>
        </div>
        
        <div className="flex items-center gap-3">
          {screen === 'LIST' && (role === 'ADMIN' || role === 'OWNER' || !authBranchId) && (
            <select
              className="h-10 px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
            >
              <option value="" disabled>Pilih Cabang</option>
              {branches?.map(b => (
                <option key={b.id} value={b.id.toString()}>{b.name}</option>
              ))}
            </select>
          )}

          {screen === 'WORKBENCH' && (
            <Button 
              onClick={() => {
                if (activeSession?.status === 'DRAFT' && confirm('Apakah Anda ingin keluar dari lembar kerja? Perubahan draf yang belum disimpan mungkin akan hilang.')) {
                  setScreen('LIST');
                  setActiveSessionId(null);
                } else if (activeSession?.status !== 'DRAFT') {
                  setScreen('LIST');
                  setActiveSessionId(null);
                }
              }} 
              variant="outline" 
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Kembali ke Daftar
            </Button>
          )}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {screen === 'LIST' ? (
          <motion.div 
            key="list-screen"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {/* Start Opname Trigger Box */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div>
                <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                  <Plus className="w-5 h-5 text-emerald-600" />
                  Mulai Sesi Stock Opname Baru
                </h3>
                <p className="text-sm text-slate-400 mt-1 leading-relaxed">
                  Pilih tipe opname di bawah ini. Anda dapat memilih **Opname Parsial** agar apotek tetap melayani kasir tanpa perlu tutup!
                </p>
                <div className="flex gap-4 mt-4">
                  <label className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100 cursor-pointer text-sm font-bold text-slate-600 hover:bg-slate-100 transition-all">
                    <input 
                      type="radio" 
                      name="opname-init-type" 
                      checked={opnameType === 'PARTIAL'} 
                      onChange={() => setOpnameType('PARTIAL')} 
                      className="text-emerald-600 focus:ring-emerald-500" 
                    />
                    Parsial / Cycle Count (Direkomendasikan)
                  </label>
                  <label className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100 cursor-pointer text-sm font-bold text-slate-600 hover:bg-slate-100 transition-all">
                    <input 
                      type="radio" 
                      name="opname-init-type" 
                      checked={opnameType === 'FULL'} 
                      onChange={() => setOpnameType('FULL')} 
                      className="text-emerald-600 focus:ring-emerald-500" 
                    />
                    Full (Semua Batch Aktif)
                  </label>
                </div>
              </div>
              <div className="flex justify-end">
                <Button 
                  onClick={() => startSessionMutation.mutate(opnameType)}
                  disabled={startSessionMutation.isPending || !branchId}
                  className="bg-emerald-600 hover:bg-emerald-700 h-12 px-8 rounded-xl font-bold text-white shadow-lg shadow-emerald-500/20"
                >
                  {startSessionMutation.isPending ? 'Memulai...' : 'Buat Sesi Opname'}
                </Button>
              </div>
            </div>

            {/* Sesi Opname History Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-5 border-b border-slate-100 bg-slate-50/20">
                <h3 className="font-extrabold text-slate-800">Riwayat Stock Opname Cabang</h3>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID Sesi</TableHead>
                      <TableHead>Tanggal Sesi</TableHead>
                      <TableHead>Petugas</TableHead>
                      <TableHead>Tipe Opname</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Catatan</TableHead>
                      <TableHead className="text-center">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sessionsLoading ? (
                      <TableRow><TableCell colSpan={7} className="h-32 text-center text-slate-400">Memuat riwayat...</TableCell></TableRow>
                    ) : sessions?.length === 0 ? (
                      <TableRow><TableCell colSpan={7} className="h-32 text-center text-slate-400 italic">Belum ada sesi stock opname di cabang ini.</TableCell></TableRow>
                    ) : (
                      (() => {
                        const sortedSessions = sessions ? [...sessions].sort((a, b) => b.id - a.id) : [];
                        const indexHistoryLast = currentHistoryPage * historyEntriesPerPage;
                        const indexHistoryFirst = indexHistoryLast - historyEntriesPerPage;
                        const currentHistorySessions = sortedSessions.slice(indexHistoryFirst, indexHistoryLast);

                        return (
                          <>
                            {currentHistorySessions.map((session) => (
                              <TableRow 
                                key={session.id} 
                                className="hover:bg-slate-50/30 cursor-pointer"
                                onClick={() => {
                                  setActiveSessionId(session.id);
                                  setOpnameType(session.details && session.details.length > 0 && session.status === 'DRAFT' ? 'FULL' : 'PARTIAL');
                                  setScreen('WORKBENCH');
                                }}
                              >
                                <TableCell className="font-mono text-xs font-bold text-emerald-600">#SO-{session.id}</TableCell>
                                <TableCell className="text-xs font-medium text-slate-500">
                                  {new Date(session.opnameDate).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </TableCell>
                                <TableCell className="text-sm font-bold text-slate-700">{session.user?.fullName}</TableCell>
                                <TableCell>
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
                                    {session.details && session.details.length > 0 ? 'Full' : 'Parsial'}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <span className={cn(
                                    "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold",
                                    session.status === 'COMPLETED'
                                      ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                      : "bg-amber-50 text-amber-700 border border-amber-100"
                                  )}>
                                    {session.status === 'COMPLETED' ? 'Selesai' : 'Draf (Sedang Dihitung)'}
                                  </span>
                                </TableCell>
                                <TableCell className="text-xs text-slate-400 max-w-[200px] truncate">{session.notes || '-'}</TableCell>
                                <TableCell className="text-center">
                                  <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveSessionId(session.id);
                                      setOpnameType(session.details && session.details.length > 0 && session.status === 'DRAFT' ? 'FULL' : 'PARTIAL');
                                      setScreen('WORKBENCH');
                                    }}
                                    className="text-emerald-600 font-bold hover:bg-emerald-50"
                                  >
                                    Lihat Detail
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </>
                        );
                      })()
                    )}
                  </TableBody>
                </Table>
              </div>
              {sessions && sessions.length > 0 && (
                <Pagination
                  currentPage={currentHistoryPage}
                  totalPages={Math.ceil(sessions.length / historyEntriesPerPage)}
                  onPageChange={setCurrentHistoryPage}
                  totalEntries={sessions.length}
                  indexOfFirstEntry={(currentHistoryPage - 1) * historyEntriesPerPage}
                  indexOfLastEntry={currentHistoryPage * historyEntriesPerPage}
                  label="Sesi"
                />
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="workbench-screen"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {activeSessionLoading ? (
              <div className="bg-white p-12 rounded-3xl shadow-sm border border-slate-100 text-center text-slate-400">
                Memuat lembar kerja opname...
              </div>
            ) : activeSession && (
              <>
                {/* 2. Workbench Header Card */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black uppercase text-slate-400">Lembar Kerja</span>
                      <span className="font-mono text-sm font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">#SO-{activeSession.id}</span>
                      <span className={cn(
                        "text-xs font-bold px-2 py-0.5 rounded-full",
                        activeSession.status === 'COMPLETED' ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-amber-50 text-amber-700 border border-amber-100"
                      )}>
                        {activeSession.status === 'COMPLETED' ? 'Selesai & Direkonsiliasi' : 'Draf Perhitungan'}
                      </span>
                    </div>
                    <p className="text-slate-500 text-xs mt-1">
                      <strong>Operator:</strong> {activeSession.user?.fullName} • <strong>Cabang:</strong> {activeSession.branch?.name} • <strong>Tgl:</strong> {new Date(activeSession.opnameDate).toLocaleString('id-ID')}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <Button 
                      onClick={handlePrintWorksheet} 
                      variant="outline" 
                      className="flex items-center gap-2"
                    >
                      <Printer className="w-4 h-4 text-slate-400" /> Cetak Lembar Hitung
                    </Button>
                    
                    {activeSession.status === 'DRAFT' && (
                      <>
                        <Button 
                          onClick={() => saveDraftMutation.mutate()} 
                          disabled={saveDraftMutation.isPending}
                          variant="outline" 
                          className="flex items-center gap-2 border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                        >
                          <Save className="w-4 h-4" /> Simpan Draf
                        </Button>
                        <Button 
                          onClick={() => {
                            if (confirm('Apakah Anda yakin ingin memfinalisasi Stock Opname ini? Data stok di sistem akan langsung disesuaikan secara real-time dan log mutasi stock movement akan direkam secara permanen.')) {
                              finalizeMutation.mutate();
                            }
                          }}
                          disabled={finalizeMutation.isPending}
                          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                        >
                          <CheckCircle2 className="w-4 h-4" /> Finalisasi Rekonsiliasi
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {/* 3. Real-time Live Auditing Stats Panel */}
                {activeSession.status === 'DRAFT' && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm text-center">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Obat Dihitung</p>
                      <h4 className="text-lg font-black text-slate-700 mt-1">{workbenchStats.totalItems} Batch</h4>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm text-center">
                      <p className="text-[10px] font-bold text-emerald-600 uppercase">Stok Pas</p>
                      <h4 className="text-lg font-black text-emerald-600 mt-1">{workbenchStats.matched} Batch</h4>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm text-center">
                      <p className="text-[10px] font-bold text-rose-500 uppercase">Stok Kurang (Defisit)</p>
                      <h4 className="text-lg font-black text-rose-500 mt-1 flex items-center justify-center gap-1">
                        {workbenchStats.deficit} Batch {workbenchStats.deficit > 0 && <TrendingDown className="w-4 h-4" />}
                      </h4>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm text-center">
                      <p className="text-[10px] font-bold text-emerald-500 uppercase">Stok Lebih (Surplus)</p>
                      <h4 className="text-lg font-black text-emerald-500 mt-1 flex items-center justify-center gap-1">
                        {workbenchStats.surplus} Batch {workbenchStats.surplus > 0 && <TrendingUp className="w-4 h-4" />}
                      </h4>
                    </div>
                  </div>
                )}

                {/* 4. Partial Opname Dynamic Batch Search Adder */}
                {activeSession.status === 'DRAFT' && (
                  <div className="bg-white p-6 rounded-3xl border border-emerald-50 shadow-sm space-y-4">
                    <div>
                      <h4 className="font-extrabold text-slate-800 flex items-center gap-1.5 text-sm">
                        <Plus className="w-4 h-4 text-emerald-600" />
                        Tambah Obat untuk Dihitung (Opname Parsial / Cycle Counting)
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">Scan barcode obat atau cari nama obat untuk dimasukkan ke draf hitung di bawah.</p>
                    </div>

                    <div className="relative">
                      <div className="relative w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input 
                          placeholder="Ketik nama obat, SKU, atau nomor batch..." 
                          className="pl-10 h-10 border-slate-200 focus:border-emerald-500 focus:ring-emerald-500" 
                          value={searchProductQuery}
                          onChange={(e) => {
                            setSearchProductQuery(e.target.value);
                            setShowProductDropdown(true);
                          }}
                          onFocus={() => setShowProductDropdown(true)}
                        />
                        {searchProductQuery && (
                          <button 
                            onClick={() => { setSearchProductQuery(''); setShowProductDropdown(false); }} 
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {/* Dropdown search results */}
                      <AnimatePresence>
                        {showProductDropdown && searchProductQuery && filteredAvailableBatches && (
                          <motion.div 
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 5 }}
                            className="absolute z-20 w-full bg-white border border-slate-100 rounded-2xl shadow-xl mt-1.5 overflow-hidden divide-y divide-slate-50"
                          >
                            {filteredAvailableBatches.length === 0 ? (
                              <div className="p-4 text-xs text-slate-400 italic text-center">Tidak ada batch obat ditemukan yang belum dimasukkan.</div>
                            ) : (
                              filteredAvailableBatches.map(b => (
                                <div 
                                  key={b.id} 
                                  onClick={() => addBatchMutation.mutate(b.id)}
                                  className="p-3.5 hover:bg-slate-50/50 cursor-pointer flex items-center justify-between group transition-colors"
                                >
                                  <div>
                                    <p className="text-sm font-bold text-slate-700 group-hover:text-emerald-600 transition-colors">{b.product.name}</p>
                                    <p className="text-[10px] font-mono text-slate-400 uppercase mt-0.5">Batch: {b.batchNumber} • ED: {new Date(b.expiryDate).toLocaleDateString('id-ID')}</p>
                                  </div>
                                  <div className="text-right flex items-center gap-3">
                                    <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">Stok Sistem: {b.currentQuantity} {b.product.baseUnit}</span>
                                    <Button size="sm" className="h-8 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border-none font-bold">
                                      <Plus className="w-3.5 h-3.5 mr-1" /> Tambah
                                    </Button>
                                  </div>
                                </div>
                              ))
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                )}

                {/* 5. Main Count Sheet Table */}
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                  <div className="p-5 border-b border-slate-100 bg-slate-50/10 flex justify-between items-center">
                    <h3 className="font-extrabold text-slate-800 text-sm">Lembar Kerja Hitung Fisik</h3>
                    <span className="text-xs text-slate-400">Total: {activeSession.details?.length || 0} Batch Obat</span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-slate-700">
                      <thead>
                        <tr className="bg-slate-50/30 text-slate-400 font-bold border-b border-slate-100 text-xs">
                          <th className="py-3 px-4 text-left font-semibold">Nama Obat & SKU</th>
                          <th className="py-3 px-4 text-center font-semibold">Detail Batch</th>
                          <th className="py-3 px-4 text-right font-semibold">Kuantitas Sistem</th>
                          <th className="py-3 px-4 text-center font-semibold" style={{ width: '160px' }}>Kuantitas Fisik</th>
                          <th className="py-3 px-4 text-center font-semibold">Selisih</th>
                          <th className="py-3 px-4 text-left font-semibold" style={{ width: '220px' }}>Keterangan / Alasan Selisih</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {!activeSession.details || activeSession.details.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-12 text-center text-slate-400 italic text-xs">
                              {activeSession.status === 'DRAFT' 
                                ? 'Belum ada obat dimasukkan. Silakan ketik nama obat di kolom pencarian di atas untuk memulai opname parsial!' 
                                : 'Tidak ada detail obat.'
                              }
                            </td>
                          </tr>
                        ) : (
                          (() => {
                            const indexOfLastEntry = currentSheetPage * sheetEntriesPerPage;
                            const indexOfFirstEntry = indexOfLastEntry - sheetEntriesPerPage;
                            const currentEntries = activeSession.details.slice(indexOfFirstEntry, indexOfLastEntry);
                            return (
                              <>
                                {currentEntries.map((detail) => {
                                  const draft = detailDrafts[detail.id] || { physicalQty: detail.physicalQuantity, reason: detail.reason || '' };
                                  const diff = activeSession.status === 'DRAFT' 
                                    ? draft.physicalQty - detail.systemQuantity 
                                    : detail.difference;
                                  
                                  return (
                                    <tr key={detail.id} className="hover:bg-slate-50/20 transition-all">
                                      <td className="py-4 px-4">
                                        <p className="font-bold text-slate-800">{detail.product.name}</p>
                                        <p className="text-[10px] font-mono text-slate-400 uppercase tracking-tighter mt-0.5">SKU: {detail.product.sku}</p>
                                      </td>
                                      <td className="py-4 px-4 text-center">
                                        <span className="inline-block px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-600 font-mono text-[10px] font-bold">
                                          {detail.inventoryBatch.batchNumber}
                                        </span>
                                        <p className="text-[9px] text-slate-400 mt-1 flex items-center justify-center gap-1">
                                          <Calendar className="w-3.5 h-3.5 text-slate-300" />
                                          ED: {new Date(detail.inventoryBatch.expiryDate).toLocaleDateString('id-ID')}
                                        </p>
                                      </td>
                                      <td className="py-4 px-4 text-right font-bold text-slate-600">
                                        {detail.systemQuantity} {detail.product.baseUnit}
                                      </td>
                                      <td className="py-4 px-4 text-center">
                                        {activeSession.status === 'DRAFT' ? (
                                          <div className="flex items-center justify-center gap-2">
                                            <Input 
                                              type="number" 
                                              step="any"
                                              min="0"
                                              className="w-24 h-9 text-center font-bold border-slate-200 focus:border-emerald-500 focus:ring-emerald-500"
                                              value={draft.physicalQty}
                                              onChange={(e) => handleUpdateDraftCount(detail.id, parseFloat(e.target.value))}
                                            />
                                            <span className="text-xs text-slate-400 font-bold">{detail.product.baseUnit}</span>
                                          </div>
                                        ) : (
                                          <span className="font-bold text-slate-800">{detail.physicalQuantity} {detail.product.baseUnit}</span>
                                        )}
                                      </td>
                                      <td className="py-4 px-4 text-center">
                                        {diff === 0 ? (
                                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">PAS</span>
                                        ) : diff > 0 ? (
                                          <span className="inline-flex items-center gap-0.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                                            +{diff} {detail.product.baseUnit}
                                          </span>
                                        ) : (
                                          <span className="inline-flex items-center gap-0.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-100 animate-pulse">
                                            {diff} {detail.product.baseUnit}
                                          </span>
                                        )}
                                      </td>
                                      <td className="py-4 px-4">
                                        {activeSession.status === 'DRAFT' ? (
                                          <select
                                            value={draft.reason}
                                            disabled={diff === 0}
                                            onChange={(e) => handleUpdateDraftReason(detail.id, e.target.value)}
                                            className="w-full h-9 px-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none disabled:opacity-50"
                                          >
                                            <option value="">-- Alasan Selisih --</option>
                                            <option value="RUSAK">Barang Rusak</option>
                                            <option value="HILANG">Barang Hilang</option>
                                            <option value="LEBIH">Kelebihan Penerimaan</option>
                                            <option value="KADALUARSA">Kadaluarsa (ED)</option>
                                            <option value="SALAH_INPUT">Salah Input Data</option>
                                          </select>
                                        ) : (
                                          <span className="text-xs font-bold text-slate-500">{detail.reason || '-'}</span>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </>
                            );
                          })()
                        )}
                      </tbody>
                    </table>
                  </div>
                  {activeSession.details && activeSession.details.length > 0 && (
                    <Pagination
                      currentPage={currentSheetPage}
                      totalPages={Math.ceil(activeSession.details.length / sheetEntriesPerPage)}
                      onPageChange={setCurrentSheetPage}
                      totalEntries={activeSession.details.length}
                      indexOfFirstEntry={(currentSheetPage - 1) * sheetEntriesPerPage}
                      indexOfLastEntry={currentSheetPage * sheetEntriesPerPage}
                      label="Item"
                    />
                  )}

                  {/* 6. Opname Session Footer Notes */}
                  <div className="p-6 border-t border-slate-100 bg-slate-50/20 space-y-3">
                    <label className="text-xs uppercase font-bold text-slate-400 flex items-center gap-1.5">Catatan Sesi Rekonsiliasi</label>
                    {activeSession.status === 'DRAFT' ? (
                      <textarea
                        value={opnameNotes}
                        onChange={(e) => setOpnameNotes(e.target.value)}
                        placeholder="Tambahkan catatan khusus audit, misal: 'Opname khusus rak depan kategori antibiotik'"
                        className="w-full min-h-[70px] p-3 text-sm bg-white border border-slate-200 rounded-2xl focus:ring-1 focus:ring-emerald-500 focus:outline-none placeholder:text-slate-300"
                      />
                    ) : (
                      <p className="text-sm text-slate-500 bg-white p-3 rounded-2xl border border-slate-100 italic">{activeSession.notes || 'Tidak ada catatan.'}</p>
                    )}
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StockOpnamePage;

// Helper function to concatenate classNames
function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
