import React, { useState } from 'react';
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
});

type BranchFormValues = z.infer<typeof branchSchema>;

interface Branch {
  id: number;
  name: string;
  address: string;
  phone: string;
  active: boolean;
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
      handleCloseModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: number; values: BranchFormValues }) => 
      api.put(`/branches/${data.id}`, data.values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      handleCloseModal();
    },
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
        active: branch.active
      });
    } else {
      setSelectedBranch(null);
      reset({
        name: '',
        address: '',
        phone: '',
        active: true
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
          className="flex items-center gap-2"
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
              <TableHead>Alamat</TableHead>
              <TableHead>Telepon</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-slate-400">
                  Memuat data...
                </TableCell>
              </TableRow>
            ) : filteredBranches?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-slate-400">
                  Tidak ada data ditemukan.
                </TableCell>
              </TableRow>
            ) : (
              filteredBranches?.map((branch) => (
                <TableRow key={branch.id}>
                  <TableCell className="font-medium text-slate-800">{branch.name}</TableCell>
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
                        className="h-8 w-8"
                        onClick={() => handleOpenModal(branch)}
                      >
                        <Edit2 className="w-4 h-4 text-blue-600" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 hover:bg-red-50 group"
                        onClick={() => {
                          if (confirm('Hapus cabang ini?')) {
                            deleteMutation.mutate(branch.id);
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-slate-400 group-hover:text-red-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
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

          <div className="flex items-center gap-2">
            <input 
              type="checkbox" 
              {...register('active')}
              className="w-4 h-4 rounded text-blue-600"
            />
            <label className="text-sm text-slate-700">Cabang Aktif</label>
          </div>
        </form>
      </Dialog>
    </div>
  );
};

export default BranchesPage;
