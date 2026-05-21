import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/api';
import { Button } from '../components/ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Plus, Trash2, Calendar, FileText, DollarSign, Tag, Filter } from 'lucide-react';
import { Input } from '../components/ui/Input';

interface Expense {
  id: number;
  category: string;
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [branchId, setBranchId] = useState<string>('');
  
  const [formData, setFormData] = useState({
    branchId: '',
    category: 'GAJI',
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
      // Default to branchId 1 if empty, depending on user structure, but here we require branchId or handle it in backend.
      // Let's assume branchId is required, we use the first branch if not set.
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
      setFormData({ ...formData, amount: '', notes: '' });
    },
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/expenses/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['expenses'] }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createExpenseMutation.mutate({
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

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Biaya Operasional</h1>
          <p className="text-slate-500 text-sm">Kelola pengeluaran harian dan operasional apotek.</p>
        </div>
        <div className="flex gap-3">
          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-sm">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              className="bg-transparent text-sm focus:outline-none focus:ring-0"
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
            >
              {branches?.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
          <Button onClick={() => setIsModalOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm shadow-emerald-200 gap-2">
            <Plus className="w-4 h-4" />
            Tambah Pengeluaran
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow>
              <TableHead>Tanggal</TableHead>
              <TableHead>Kategori</TableHead>
              <TableHead>Cabang</TableHead>
              <TableHead>Keterangan</TableHead>
              <TableHead className="text-right">Jumlah</TableHead>
              <TableHead className="text-center">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-slate-400">Memuat data pengeluaran...</TableCell>
              </TableRow>
            ) : expenses?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-slate-400">Belum ada pengeluaran tercatat.</TableCell>
              </TableRow>
            ) : (
              expenses?.map((expense) => (
                <TableRow key={expense.id} className="group hover:bg-slate-50/50 transition-colors">
                  <TableCell className="font-medium text-slate-700">
                    {new Date(expense.expenseDate).toLocaleDateString('id-ID')}
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700">
                      <Tag className="w-3 h-3" />
                      {expense.category}
                    </span>
                  </TableCell>
                  <TableCell className="text-slate-500">{expense.branch?.name || '-'}</TableCell>
                  <TableCell className="text-slate-500 max-w-[200px] truncate" title={expense.notes}>
                    {expense.notes || '-'}
                  </TableCell>
                  <TableCell className="text-right font-bold text-rose-600">
                    {formatCurrency(expense.amount)}
                  </TableCell>
                  <TableCell className="text-center">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => {
                        if (window.confirm('Hapus pengeluaran ini?')) {
                          deleteExpenseMutation.mutate(expense.id);
                        }
                      }}
                      className="text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-lg font-bold text-slate-800">Catat Pengeluaran Baru</h2>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Cabang</label>
                <select 
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                  value={formData.branchId || (branches?.[0]?.id.toString() || '')}
                  onChange={(e) => setFormData({...formData, branchId: e.target.value})}
                  required
                >
                  {branches?.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400" /> Tanggal
                </label>
                <Input 
                  type="date" 
                  value={formData.expenseDate}
                  onChange={(e) => setFormData({...formData, expenseDate: e.target.value})}
                  required 
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <Tag className="w-4 h-4 text-slate-400" /> Kategori
                </label>
                <select 
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all bg-white"
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  required
                >
                  <option value="GAJI">Gaji Karyawan</option>
                  <option value="LISTRIK">Listrik & Air</option>
                  <option value="SEWA">Sewa Bangunan</option>
                  <option value="MARKETING">Marketing & Promosi</option>
                  <option value="OPERASIONAL">Operasional Harian</option>
                  <option value="LAIN-LAIN">Lain-lain</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-slate-400" /> Nominal
                </label>
                <Input 
                  type="number" 
                  min="0"
                  step="1000"
                  placeholder="Contoh: 150000"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  required 
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-400" /> Keterangan (Opsional)
                </label>
                <textarea 
                  className="w-full min-h-[80px] p-3 rounded-lg border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all resize-y"
                  placeholder="Tambahkan catatan..."
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsModalOpen(false)} 
                  className="w-full"
                >
                  Batal
                </Button>
                <Button 
                  type="submit" 
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
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
