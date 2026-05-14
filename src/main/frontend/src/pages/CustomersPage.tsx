import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import api from '../api/api';
import { Button } from '../components/ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Plus, Search, Edit2, Trash2, User, Phone, Mail, MapPin } from 'lucide-react';
import { Input } from '../components/ui/Input';
import { cn } from '../lib/utils';
import { Dialog } from '../components/ui/Dialog';

const customerSchema = z.object({
  name: z.string().min(3, 'Nama minimal 3 karakter'),
  phone: z.string().optional(),
  address: z.string().optional(),
  email: z.string().email('Email tidak valid').optional().or(z.literal('')),
  active: z.boolean().default(true),
});

type CustomerFormValues = z.infer<typeof customerSchema>;

interface Customer {
  id: number;
  name: string;
  phone: string;
  address: string;
  email: string;
  active: boolean;
}

const CustomersPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  
  const queryClient = useQueryClient();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      active: true,
    }
  });

  const { data: customers, isLoading } = useQuery<Customer[]>({
    queryKey: ['customers'],
    queryFn: async () => {
      const res = await api.get('/customers');
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: CustomerFormValues) => api.post('/customers', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      alert('Pelanggan berhasil ditambahkan');
      handleCloseModal();
    },
    onError: (error: any) => {
      alert('Gagal menambah pelanggan: ' + (error.response?.data?.message || error.message));
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: number; values: CustomerFormValues }) => 
      api.put(`/customers/${data.id}`, data.values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      alert('Data pelanggan berhasil diperbarui');
      handleCloseModal();
    },
    onError: (error: any) => {
      alert('Gagal memperbarui data: ' + (error.response?.data?.message || error.message));
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/customers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });

  const handleOpenModal = (customer?: Customer) => {
    if (customer) {
      setSelectedCustomer(customer);
      reset({
        name: customer.name,
        phone: customer.phone,
        address: customer.address,
        email: customer.email,
        active: customer.active,
      });
    } else {
      setSelectedCustomer(null);
      reset({
        name: '',
        phone: '',
        address: '',
        email: '',
        active: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCustomer(null);
    reset();
  };

  const onSubmit = (data: CustomerFormValues) => {
    if (selectedCustomer) {
      updateMutation.mutate({ id: selectedCustomer.id, values: data });
    } else {
      createMutation.mutate(data);
    }
  };

  const filtered = customers?.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Daftar Pelanggan</h1>
          <p className="text-slate-500 text-sm">Kelola data pelanggan apotek.</p>
        </div>
        <Button 
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-100"
          onClick={() => handleOpenModal()}
        >
          <Plus className="w-4 h-4" />
          Tambah Pelanggan
        </Button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Cari nama atau telepon..." 
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pelanggan</TableHead>
                <TableHead>Kontak</TableHead>
                <TableHead>Alamat</TableHead>
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
              ) : filtered?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-slate-400">
                    Tidak ada data ditemukan.
                  </TableCell>
                </TableRow>
                ) : (
                filtered?.map((customer, index) => (
                  <motion.tr 
                    key={customer.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="group border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors"
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center shrink-0">
                          <User className="w-5 h-5 text-slate-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-slate-800 truncate">{customer.name}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 text-xs text-slate-500">
                        {customer.phone && (
                          <p className="flex items-center gap-1">
                            <Phone className="w-3 h-3" /> {customer.phone}
                          </p>
                        )}
                        {customer.email && (
                          <p className="flex items-center gap-1">
                            <Mail className="w-3 h-3" /> {customer.email}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[200px]">
                      <div className="flex items-center gap-1 text-sm text-slate-500 truncate">
                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                        {customer.address || '-'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={cn(
                        "px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap",
                        customer.active 
                          ? "bg-emerald-50 text-emerald-600 border border-emerald-100" 
                          : "bg-slate-100 text-slate-500 border border-slate-200"
                      )}>
                        {customer.active ? 'Aktif' : 'Non-aktif'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 hover:bg-emerald-50 text-slate-400 hover:text-emerald-600"
                          onClick={() => handleOpenModal(customer)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 hover:bg-red-50 text-slate-400 hover:text-red-600"
                          onClick={() => {
                            if (confirm('Hapus pelanggan ini?')) {
                              deleteMutation.mutate(customer.id);
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
      </div>

      <Dialog
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={selectedCustomer ? 'Edit Pelanggan' : 'Tambah Pelanggan Baru'}
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={handleCloseModal}>Batal</Button>
            <Button 
              onClick={handleSubmit(onSubmit)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {selectedCustomer ? 'Simpan Perubahan' : 'Tambah Pelanggan'}
            </Button>
          </>
        }
      >
        <form className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Nama Lengkap</label>
            <Input 
              {...register('name')}
              placeholder="Contoh: Budi Santoso"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Telepon / WhatsApp</label>
              <Input {...register('phone')} placeholder="08xxxxxxx" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Email</label>
              <Input {...register('email')} placeholder="customer@mail.com" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Alamat</label>
            <textarea 
              {...register('address')}
              className="w-full min-h-[80px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              placeholder="Alamat lengkap pelanggan"
            />
          </div>

          <div className="flex items-center gap-2">
            <input 
              type="checkbox" 
              {...register('active')}
              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
            />
            <label className="text-sm text-slate-700 font-medium">Pelanggan Aktif</label>
          </div>
        </form>
      </Dialog>
    </div>
  );
};

export default CustomersPage;
