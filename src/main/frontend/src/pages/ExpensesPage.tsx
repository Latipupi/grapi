import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/api';
import { Button } from '../components/ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Pagination } from '../components/ui/Pagination';
import { Plus, Trash2, Calendar, FileText, DollarSign, Tag, Filter, ShieldCheck } from 'lucide-react';
import { Input } from '../components/ui/Input';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';

interface Expense {
  id: number;
  category: string;
  expenseType: string; // HARIAN, OPERASIONAL
  amount: number;
  expenseDate: string;
  notes: string;
  branch: { id: number; name: string };
}

interface Branch {
  id: number;
  name: string;
}

const ExpensesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const auth = useSelector((state: RootState) => state.auth);
  const { role } = auth;
  
  // Kasir & Staff only have access to HARIAN
  const isLimitedRole = ['CASHIER', 'KASIR', 'STAFF'].includes(role || '');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [branchId, setBranchId] = useState<string>('');
  
  const [currentPage, setCurrentPage] = useState(1);
  const entriesPerPage = 10;

  // Filter Tab state
  const [filterType, setFilterType] = useState<'ALL' | 'HARIAN' | 'OPERASIONAL'>(
    isLimitedRole ? 'HARIAN' : 'ALL'
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [filterType, branchId]);

  const [formData, setFormData] = useState({
    branchId: '',
    expenseType: isLimitedRole ? 'HARIAN' : 'HARIAN',
    category: 'ATK',
    amount: '',
    expenseDate: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const { data: branches } = useQuery<Branch[]>({
    queryKey: ['branches'],
    queryFn: async () => {
      const res = await api.get('/branches');
      return res.data;
    },
  });

  const { data: expenses, isLoading } = useQuery<Expense[]>({
    queryKey: ['expenses', branchId],
    queryFn: async () => {
      const effectiveBranchId = branchId || (branches?.[0]?.id?.toString() || '1');
      const res = await api.get(`/expenses?branchId=${effectiveBranchId}`);
      return res.data;
    },
    enabled: !!branches && branches.length > 0
  });

  const createExpenseMutation = useMutation({
    mutationFn: (newExpense: any) => api.post('/expenses', newExpense),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      setIsModalOpen(false);
      setFormData({ 
        ...formData, 
        amount: '', 
        notes: '', 
        expenseType: isLimitedRole ? 'HARIAN' : 'HARIAN',
        category: 'ATK' 
      });
    },
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/expenses/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['expenses'] }),
  });

  // Watch for expenseType changes in form to sync default category
  useEffect(() => {
    if (formData.expenseType === 'HARIAN') {
      setFormData(prev => ({ ...prev, category: 'ATK' }));
    } else {
      setFormData(prev => ({ ...prev, category: 'GAJI' }));
    }
  }, [formData.expenseType]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createExpenseMutation.mutate({
      expenseType: formData.expenseType,
      category: formData.category,
      amount: parseFloat(formData.amount),
      expenseDate: formData.expenseDate,
      notes: formData.notes,
      branch: { id: parseInt(formData.branchId || branches?.[0]?.id.toString() || '1') }
    });
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  // Filter expenses list by role and tab filter
  const displayedExpenses = expenses?.filter(item => {
    // 1. Staf/Kasir can ONLY see HARIAN expenses
    if (isLimitedRole && item.expenseType !== 'HARIAN') {
      return false;
    }
    // 2. Tab Filter
    if (filterType !== 'ALL' && item.expenseType !== filterType) {
      return false;
    }
    return true;
  }).sort((a, b) => b.id - a.id) || [];

  const totalEntries = displayedExpenses.length;
  const totalPages = Math.ceil(totalEntries / entriesPerPage);
  const indexOfLastEntry = currentPage * entriesPerPage;
  const indexOfFirstEntry = indexOfLastEntry - entriesPerPage;
  const currentEntries = displayedExpenses.slice(indexOfFirstEntry, indexOfLastEntry);

  const getCategoryLabel = (cat: string) => {
    const labels: { [key: string]: string } = {
      // Harian
      'ATK': 'Alat Tulis & Kertas',
      'KONSUMSI': 'Galon, Kopi & Konsumsi',
      'KURIR': 'Ongkos Kirim & Kurir',
      'KEBERSIHAN': 'Kebersihan & Keamanan',
      'KERUSAKAN': 'Obat Rusak/Susut Kecil',
      'LAIN_HARIAN': 'Lain-lain Harian',
      // Operasional
      'GAJI': 'Gaji & Bonus Karyawan',
      'LISTRIK_AIR': 'Listrik, Air & Internet',
      'SEWA': 'Sewa Bangunan / Toko',
      'MARKETING': 'Pemasaran & Iklan PBF',
      'PAJAK_LEGAL': 'Pajak & SIA Legalitas',
      'LAIN_OPERASIONAL': 'Lain-lain Operasional'
    };
    return labels[cat] || cat;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Biaya Operasional</h1>
          <p className="text-slate-500 text-sm">
            {isLimitedRole 
              ? 'Pencatatan pengeluaran harian kas kecil apotek.' 
              : 'Kelola pengeluaran harian dan biaya operasional utama apotek.'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-sm">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              className="bg-transparent text-sm focus:outline-none focus:ring-0 font-medium text-slate-600"
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
            >
              {branches?.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
          <Button 
            onClick={() => setIsModalOpen(true)} 
            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md shadow-emerald-500/10 gap-2 font-bold h-10 px-4"
          >
            <Plus className="w-4 h-4" />
            Catat Pengeluaran
          </Button>
        </div>
      </div>

      {/* Tabs Filter (Hidden for Cashier/Staff since they only see HARIAN) */}
      {!isLimitedRole && (
        <div className="flex border-b border-slate-200 gap-6">
          <button 
            onClick={() => setFilterType('ALL')}
            className={`pb-3 font-bold text-sm tracking-wide transition-all border-b-2 relative ${
              filterType === 'ALL' 
                ? 'border-emerald-600 text-emerald-600' 
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            Semua Pengeluaran
          </button>
          <button 
            onClick={() => setFilterType('HARIAN')}
            className={`pb-3 font-bold text-sm tracking-wide transition-all border-b-2 relative ${
              filterType === 'HARIAN' 
                ? 'border-emerald-600 text-emerald-600' 
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            Harian (Kas Kecil)
          </button>
          <button 
            onClick={() => setFilterType('OPERASIONAL')}
            className={`pb-3 font-bold text-sm tracking-wide transition-all border-b-2 relative ${
              filterType === 'OPERASIONAL' 
                ? 'border-emerald-600 text-emerald-600' 
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            Operasional Utama
          </button>
        </div>
      )}

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow>
              <TableHead>Tanggal</TableHead>
              <TableHead>Klasifikasi</TableHead>
              <TableHead>Kategori</TableHead>
              <TableHead>Cabang</TableHead>
              <TableHead>Keterangan</TableHead>
              <TableHead className="text-right">Nominal</TableHead>
              <TableHead className="text-center">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-slate-400">Memuat data pengeluaran...</TableCell>
              </TableRow>
            ) : displayedExpenses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-slate-400 italic">
                  Belum ada pengeluaran tercatat untuk kategori ini.
                </TableCell>
              </TableRow>
            ) : (
              currentEntries.map((expense) => (
                <TableRow key={expense.id} className="group hover:bg-slate-50/50 transition-colors">
                  <TableCell className="font-semibold text-slate-700">
                    {new Date(expense.expenseDate).toLocaleDateString('id-ID', {
                      year: 'numeric', month: 'long', day: 'numeric'
                    })}
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      expense.expenseType === 'HARIAN'
                        ? 'bg-blue-50 text-blue-600 border-blue-100'
                        : 'bg-purple-50 text-purple-600 border-purple-100'
                    }`}>
                      {expense.expenseType === 'HARIAN' ? 'Harian (Kas Kecil)' : 'Operasional Utama'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-700">
                      <Tag className="w-3 h-3" />
                      {getCategoryLabel(expense.category)}
                    </span>
                  </TableCell>
                  <TableCell className="text-slate-500 font-medium">{expense.branch?.name || '-'}</TableCell>
                  <TableCell className="text-slate-500 max-w-[200px] truncate" title={expense.notes}>
                    {expense.notes || '-'}
                  </TableCell>
                  <TableCell className={`text-right font-black text-sm ${
                    expense.expenseType === 'HARIAN' ? 'text-blue-600' : 'text-rose-600'
                  }`}>
                    {formatCurrency(expense.amount)}
                  </TableCell>
                  <TableCell className="text-center">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      disabled={isLimitedRole} // Staff & Cashier cannot delete expenses for safety!
                      onClick={() => {
                        if (window.confirm('Hapus pengeluaran ini?')) {
                          deleteExpenseMutation.mutate(expense.id);
                        }
                      }}
                      className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalEntries={totalEntries}
          indexOfFirstEntry={indexOfFirstEntry}
          indexOfLastEntry={indexOfLastEntry}
          label="Pengeluaran"
        />
      </div>

      {/* Add Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-lg font-extrabold text-slate-800">Catat Pengeluaran Baru</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold font-mono text-xl">
                &times;
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-left">
              {/* Branch Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Cabang Apotek</label>
                <select 
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all text-sm font-medium bg-white"
                  value={formData.branchId || (branches?.[0]?.id.toString() || '')}
                  onChange={(e) => setFormData({...formData, branchId: e.target.value})}
                  required
                >
                  {branches?.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              {/* Date */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-slate-400" /> Tanggal Pengeluaran
                </label>
                <Input 
                  type="date" 
                  value={formData.expenseDate}
                  onChange={(e) => setFormData({...formData, expenseDate: e.target.value})}
                  required 
                />
              </div>

              {/* Expense Type (Hidden / Locked to HARIAN for limited roles) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Klasifikasi Biaya</label>
                {isLimitedRole ? (
                  <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-100 text-blue-700 rounded-xl text-xs font-bold">
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                    Locked: Harian (Kas Kecil Kasir)
                  </div>
                ) : (
                  <select 
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all text-sm font-bold bg-white"
                    value={formData.expenseType}
                    onChange={(e) => setFormData({...formData, expenseType: e.target.value})}
                    required
                  >
                    <option value="HARIAN">Harian (Kas Kecil Kasir)</option>
                    <option value="OPERASIONAL">Operasional Utama (Bulanan/Overhead)</option>
                  </select>
                )}
              </div>

              {/* Category (Filtered based on Type selected) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1.5">
                  <Tag className="w-4 h-4 text-slate-400" /> Kategori
                </label>
                <select 
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all text-sm font-semibold bg-white"
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  required
                >
                  {formData.expenseType === 'HARIAN' ? (
                    <>
                      <option value="ATK">Alat Tulis Kantor & Kertas</option>
                      <option value="KONSUMSI">Galon, Kopi & Konsumsi</option>
                      <option value="KURIR">Ongkos Kirim & Kurir</option>
                      <option value="KEBERSIHAN">Kebersihan & Keamanan</option>
                      <option value="KERUSAKAN">Obat Rusak/Susut Kecil</option>
                      <option value="LAIN_HARIAN">Lain-lain Harian</option>
                    </>
                  ) : (
                    <>
                      <option value="GAJI">Gaji & Bonus Karyawan</option>
                      <option value="LISTRIK_AIR">Listrik, Air & Internet</option>
                      <option value="SEWA">Sewa Bangunan / Toko</option>
                      <option value="MARKETING">Pemasaran & Iklan PBF</option>
                      <option value="PAJAK_LEGAL">Pajak & SIA Legalitas</option>
                      <option value="LAIN_OPERASIONAL">Lain-lain Operasional</option>
                    </>
                  )}
                </select>
              </div>

              {/* Nominal */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-slate-400" /> Nominal
                </label>
                <Input 
                  type="number" 
                  min="0"
                  step="500"
                  placeholder="Contoh: 25000"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  required 
                />
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-slate-400" /> Keterangan Catatan
                </label>
                <textarea 
                  className="w-full min-h-[80px] p-3.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all resize-none text-xs font-medium"
                  placeholder="Contoh: Beli galon isi ulang 2 buah untuk kasir..."
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsModalOpen(false)} 
                  className="w-full h-11 rounded-xl text-slate-500 font-bold border-slate-200"
                >
                  Batal
                </Button>
                <Button 
                  type="submit" 
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-11 rounded-xl font-bold"
                  disabled={createExpenseMutation.isPending}
                >
                  {createExpenseMutation.isPending ? 'Menyimpan...' : 'Simpan'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpensesPage;
