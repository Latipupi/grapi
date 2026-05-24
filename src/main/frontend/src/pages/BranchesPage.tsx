import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import api from '../api/api';
import { Button } from '../components/ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Plus, Search, Edit2, Trash2, MapPin, Phone } from 'lucide-react';
import { Input } from '../components/ui/Input';
import { cn } from '../lib/utils';
import { Dialog } from '../components/ui/Dialog';

const branchSchema = z.object({
  name: z.string().min(3, 'Nama minimal 3 karakter'),
  address: z.string().min(5, 'Alamat minimal 5 karakter'),
  phone: z.string().min(10, 'Nomor telepon minimal 10 karakter'),
  active: z.boolean().default(true),
  type: z.string().default('RETAIL'),
});

type BranchFormValues = z.infer<typeof branchSchema>;

interface Branch {
  id: number;
  name: string;
  address: string;
  phone: string;
  active: boolean;
  type: string;
}

const BranchesPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  
  const queryClient = useQueryClient();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<BranchFormValues>({
    resolver: zodResolver(branchSchema),
    defaultValues: {
      active: true
    }
  });

  const { data: branches, isLoading } = useQuery<Branch[]>({
    queryKey: ['branches'],
    queryFn: async () => {
      const res = await api.get('/branches');
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: BranchFormValues) => api.post('/branches', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      alert('Cabang berhasil ditambahkan');
      handleCloseModal();
    },
    onError: (error: any) => {
      alert('Gagal menambah cabang: ' + (error.response?.data?.message || error.message));
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: number; values: BranchFormValues }) => 
      api.put(`/branches/${data.id}`, data.values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      alert('Data cabang berhasil diperbarui');
      handleCloseModal();
    },
    onError: (error: any) => {
      alert('Gagal memperbarui data: ' + (error.response?.data?.message || error.message));
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/branches/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
    },
  });

  const handleOpenModal = (branch?: Branch) => {
    if (branch) {
      setSelectedBranch(branch);
      reset({
        name: branch.name,
        address: branch.address,
        phone: branch.phone,
        active: branch.active,
        type: branch.type || 'RETAIL'
      });
    } else {
      setSelectedBranch(null);
      reset({
        name: '',
        address: '',
        phone: '',
        active: true,
        type: 'RETAIL'
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedBranch(null);
    reset();
  };

  const onSubmit = (data: BranchFormValues) => {
    if (selectedBranch) {
      updateMutation.mutate({ id: selectedBranch.id, values: data });
    } else {
      createMutation.mutate(data);
    }
  };

  const filteredBranches = branches?.filter(b => 
    b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Daftar Cabang</h1>
          <p className="text-slate-500 text-sm">Kelola lokasi dan informasi cabang apotek Anda.</p>
        </div>
        <Button 
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-100"
          onClick={() => handleOpenModal()}
        >
          <Plus className="w-4 h-4" />
          Tambah Cabang
        </Button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Cari cabang..." 
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama Cabang</TableHead>
              <TableHead>Tipe</TableHead>
              <TableHead>Alamat</TableHead>
              <TableHead>Telepon</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-slate-400">
                  Memuat data...
                </TableCell>
              </TableRow>
            ) : filteredBranches?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-slate-400">
                  Tidak ada data ditemukan.
                </TableCell>
              </TableRow>
            ) : (
              filteredBranches?.map((branch, index) => (
                <motion.tr 
                  key={branch.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="group border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors"
                >
                  <TableCell className="font-medium text-slate-800">{branch.name}</TableCell>
                  <TableCell>
                    <span className={cn(
                      "px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider",
                      branch.type === 'WAREHOUSE' 
                        ? "bg-amber-50 text-amber-600 border border-amber-100" 
                        : "bg-blue-50 text-blue-600 border border-blue-100"
                    )}>
                      {branch.type === 'WAREHOUSE' ? 'Gudang' : 'Retail'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-slate-500">
                      <MapPin className="w-3.5 h-3.5" />
                      <span className="truncate max-w-[200px]">{branch.address || '-'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-slate-500">
                      <Phone className="w-3.5 h-3.5" />
                      {branch.phone || '-'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={cn(
                      "px-2.5 py-0.5 rounded-full text-xs font-medium",
                      branch.active 
                        ? "bg-emerald-50 text-emerald-600 border border-emerald-100" 
                        : "bg-slate-100 text-slate-500 border border-slate-200"
                    )}>
                      {branch.active ? 'Aktif' : 'Non-aktif'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 hover:bg-emerald-50 text-slate-400 hover:text-emerald-600"
                        onClick={() => handleOpenModal(branch)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 hover:bg-red-50 text-slate-400 hover:text-red-600"
                        onClick={() => {
                          if (confirm('Hapus cabang ini?')) {
                            deleteMutation.mutate(branch.id);
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </motion.tr>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={selectedBranch ? 'Edit Cabang' : 'Tambah Cabang Baru'}
        footer={
          <>
            <Button variant="outline" onClick={handleCloseModal}>Batal</Button>
            <Button 
              onClick={handleSubmit(onSubmit)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {selectedBranch ? 'Simpan Perubahan' : 'Tambah Cabang'}
            </Button>
          </>
        }
      >
        <form className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Nama Cabang</label>
            <Input 
              {...register('name')}
              placeholder="Contoh: Apotek Kimia Farma - Jakarta"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Alamat</label>
            <Input 
              {...register('address')}
              placeholder="Alamat lengkap cabang"
              className={errors.address ? 'border-red-500' : ''}
            />
            {errors.address && <p className="text-xs text-red-500">{errors.address.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Nomor Telepon</label>
            <Input 
              {...register('phone')}
              placeholder="0812xxxxxx"
              className={errors.phone ? 'border-red-500' : ''}
            />
            {errors.phone && <p className="text-xs text-red-500">{errors.phone.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Tipe Cabang</label>
            <select 
              {...register('type')}
              className="block w-full px-3.5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-slate-900 text-sm font-medium outline-none transition-all"
            >
              <option value="RETAIL">Retail (Penjualan POS + Inventori)</option>
              <option value="WAREHOUSE">Gudang Pusat (Hanya Kelola & Distribusi Stok)</option>
            </select>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input 
              type="checkbox" 
              {...register('active')}
              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
            />
            <label className="text-sm text-slate-700 font-medium">Cabang Aktif</label>
          </div>
        </form>
      </Dialog>
    </div>
  );
};

export default BranchesPage;
