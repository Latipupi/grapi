import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import api from '../api/api';
import { Button } from '../components/ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Plus, Search, Edit2, Trash2, Package, Barcode, Trash } from 'lucide-react';
import { Input } from '../components/ui/Input';
import { cn } from '../lib/utils';
import { Dialog } from '../components/ui/Dialog';

const productUnitSchema = z.object({
  unitName: z.string().min(1, 'Satuan wajib diisi'),
  conversionToBase: z.number().min(1, 'Minimal 1'),
  baseUnit: z.boolean(),
  pricePerUnit: z.number().min(0, 'Harga minimal 0'),
});

const productSchema = z.object({
  name: z.string().min(3, 'Nama minimal 3 karakter'),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  categoryId: z.string().optional(),
  active: z.boolean().default(true),
  units: z.array(productUnitSchema).min(1, 'Minimal 1 satuan'),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface ProductUnit {
  id?: number;
  unitName: string;
  conversionToBase: number;
  baseUnit: boolean;
  pricePerUnit: number;
}

interface Product {
  id: number;
  name: string;
  sku: string;
  barcode: string;
  category: { id: number; name: string } | null;
  active: boolean;
  units: ProductUnit[];
}

interface Category {
  id: number;
  name: string;
}

const ProductsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  const queryClient = useQueryClient();

  const { register, handleSubmit, control, reset, watch, setValue, formState: { errors } } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      active: true,
      units: [{ unitName: 'PCS', conversionToBase: 1, baseUnit: true, pricePerUnit: 0 }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "units"
  });

  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await api.get('/products');
      return res.data;
    },
  });

  const { data: categories } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await api.get('/categories');
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: ProductFormValues) => api.post('/products', {
      ...data,
      categoryId: data.categoryId ? parseInt(data.categoryId) : null
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      handleCloseModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: number; values: ProductFormValues }) => 
      api.put(`/products/${data.id}`, {
        ...data.values,
        categoryId: data.values.categoryId ? parseInt(data.values.categoryId) : null
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      handleCloseModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/products/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setSelectedProduct(product);
      reset({
        name: product.name,
        sku: product.sku,
        barcode: product.barcode,
        categoryId: product.category?.id.toString(),
        active: product.active,
        units: product.units.map(u => ({
          unitName: u.unitName,
          conversionToBase: u.conversionToBase,
          baseUnit: u.baseUnit,
          pricePerUnit: u.pricePerUnit
        }))
      });
    } else {
      setSelectedProduct(null);
      reset({
        name: '',
        sku: '',
        barcode: '',
        categoryId: '',
        active: true,
        units: [{ unitName: 'PCS', conversionToBase: 1, baseUnit: true, pricePerUnit: 0 }]
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProduct(null);
    reset();
  };

  const onSubmit = (data: ProductFormValues) => {
    if (selectedProduct) {
      updateMutation.mutate({ id: selectedProduct.id, values: data });
    } else {
      createMutation.mutate(data);
    }
  };

  const filtered = products?.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Daftar Produk</h1>
          <p className="text-slate-500 text-sm">Kelola inventori obat dan alat kesehatan.</p>
        </div>
        <Button 
          className="flex items-center gap-2"
          onClick={() => handleOpenModal()}
        >
          <Plus className="w-4 h-4" />
          Tambah Produk
        </Button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Cari nama, SKU, atau barcode..." 
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
                <TableHead>Produk</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>SKU/Barcode</TableHead>
                <TableHead>Harga (Base)</TableHead>
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
              ) : filtered?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-slate-400">
                    Tidak ada data ditemukan.
                  </TableCell>
                </TableRow>
              ) : (
                filtered?.map((product) => {
                  const baseUnit = product.units.find(u => u.baseUnit);
                  return (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center shrink-0">
                            <Package className="w-5 h-5 text-slate-400" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-slate-800 truncate">{product.name}</p>
                            <p className="text-xs text-slate-500">{baseUnit?.unitName || '-'}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded-md text-xs font-medium whitespace-nowrap">
                          {product.category?.name || 'Tanpa Kategori'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 text-xs text-slate-500">
                          <p className="flex items-center gap-1">
                            <span className="font-semibold text-slate-700">SKU:</span> {product.sku || '-'}
                          </p>
                          <p className="flex items-center gap-1">
                            <Barcode className="w-3 h-3" /> {product.barcode || '-'}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-slate-800 whitespace-nowrap">
                        {baseUnit ? `Rp ${baseUnit.pricePerUnit.toLocaleString()}` : '-'}
                      </TableCell>
                      <TableCell>
                        <span className={cn(
                          "px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap",
                          product.active 
                            ? "bg-emerald-50 text-emerald-600 border border-emerald-100" 
                            : "bg-slate-100 text-slate-500 border border-slate-200"
                        )}>
                          {product.active ? 'Aktif' : 'Non-aktif'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => handleOpenModal(product)}
                          >
                            <Edit2 className="w-4 h-4 text-blue-600" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 hover:bg-red-50 group"
                            onClick={() => {
                              if (confirm('Hapus produk ini?')) {
                                deleteMutation.mutate(product.id);
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-slate-400 group-hover:text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={selectedProduct ? 'Edit Produk' : 'Tambah Produk Baru'}
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={handleCloseModal}>Batal</Button>
            <Button 
              onClick={handleSubmit(onSubmit)}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {selectedProduct ? 'Simpan Perubahan' : 'Tambah Produk'}
            </Button>
          </>
        }
      >
        <form className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Nama Produk</label>
                <Input 
                  {...register('name')}
                  placeholder="Contoh: Amoxicillin 500mg"
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">SKU</label>
                  <Input {...register('sku')} placeholder="SKU-XXXX" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Barcode</label>
                  <Input {...register('barcode')} placeholder="899xxxxx" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Kategori</label>
                <select 
                  {...register('categoryId')}
                  className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="">Pilih Kategori</option>
                  {categories?.map(cat => (
                    <option key={cat.id} value={cat.id.toString()}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  {...register('active')}
                  className="w-4 h-4 rounded text-blue-600"
                />
                <label className="text-sm text-slate-700">Produk Aktif</label>
              </div>
            </div>

            <div className="space-y-4 border-l border-slate-100 pl-0 md:pl-6">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-slate-800">Daftar Satuan (Multi-Unit)</label>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  className="h-8"
                  onClick={() => append({ unitName: '', conversionToBase: 1, baseUnit: false, pricePerUnit: 0 })}
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Tambah Satuan
                </Button>
              </div>

              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {fields.map((field, index) => (
                  <div key={field.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <Input 
                        {...register(`units.${index}.unitName` as const)}
                        placeholder="Satuan (Pcs, Box, Strip)"
                        className="h-8"
                      />
                      {fields.length > 1 && (
                        <button 
                          type="button" 
                          onClick={() => remove(index)}
                          className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-md transition-colors"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-slate-400">Harga Jual</label>
                        <Input 
                          type="number" 
                          {...register(`units.${index}.pricePerUnit` as const, { valueAsNumber: true })}
                          placeholder="Rp"
                          className="h-8"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-slate-400">Konversi ke Base</label>
                        <Input 
                          type="number" 
                          {...register(`units.${index}.conversionToBase` as const, { valueAsNumber: true })}
                          placeholder="1"
                          className="h-8"
                          disabled={watch(`units.${index}.baseUnit`)}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        {...register(`units.${index}.baseUnit` as const)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            // Ensure only one base unit
                            fields.forEach((_, i) => {
                              if (i !== index) setValue(`units.${i}.baseUnit`, false);
                            });
                            setValue(`units.${index}.conversionToBase`, 1);
                          }
                        }}
                        className="w-3 h-3 rounded text-blue-600"
                      />
                      <label className="text-[11px] text-slate-600">Jadikan Satuan Dasar</label>
                    </div>
                  </div>
                ))}
              </div>
              {errors.units && <p className="text-xs text-red-500">{errors.units.message}</p>}
            </div>
          </div>
        </form>
      </Dialog>
    </div>
  );
};

export default ProductsPage;
