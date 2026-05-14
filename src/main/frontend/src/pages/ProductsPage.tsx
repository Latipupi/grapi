import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import api from '../api/api';
import { Button } from '../components/ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Plus, Search, Edit2, Trash2, Package, Barcode, Trash, Upload, Download, FileSpreadsheet } from 'lucide-react';
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
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [importData, setImportData] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const queryClient = useQueryClient();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setImportData(text);
      };
      reader.readAsText(file);
    }
  };

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
      alert('Produk berhasil ditambahkan');
      handleCloseModal();
    },
    onError: (error: any) => {
      alert('Gagal menambah produk: ' + (error.response?.data?.message || error.message));
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: number; values: ProductFormValues }) =>
      api.put(`/products/${data.id}`, {
        ...data.values,
        categoryId: data.values.categoryId ? parseInt(data.values.categoryId) : null
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      alert('Data produk berhasil diperbarui');
      handleCloseModal();
    },
    onError: (error: any) => {
      alert('Gagal memperbarui data: ' + (error.response?.data?.message || error.message));
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/products/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const bulkCreateMutation = useMutation({
    mutationFn: (data: any[]) => api.post('/products/bulk', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      alert('Berhasil mengimpor produk');
      setIsImportModalOpen(false);
      setImportData('');
    },
    onError: (error: any) => {
      alert('Gagal impor: ' + (error.response?.data?.message || error.message));
    }
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
    console.log("Payload data ", data);
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
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="flex items-center gap-2 border-slate-200"
            onClick={() => setIsImportModalOpen(true)}
          >
            <Upload className="w-4 h-4" />
            Import
          </Button>
          <Button
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-100"
            onClick={() => handleOpenModal()}
          >
            <Plus className="w-4 h-4" />
            Tambah Produk
          </Button>
        </div>
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
                filtered?.map((product, index) => {
                  const baseUnit = product?.units?.find(u => u.baseUnit);
                  return (
                    <motion.tr 
                      key={product.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="group border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors"
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center shrink-0">
                            <Package className="w-5 h-5 text-slate-400" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-800 truncate">{product.name}</p>
                            <div className="flex flex-wrap gap-1 mt-0.5">
                               <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold uppercase tracking-tight">
                                  {baseUnit?.unitName || '-'}
                               </span>
                               {product.units?.filter(u => !u.baseUnit).map(u => (
                                  <span key={u.id || u.unitName} className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-bold uppercase tracking-tight">
                                     1 {u.unitName} = {u.conversionToBase} {baseUnit?.unitName}
                                  </span>
                               ))}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded-md text-xs font-medium whitespace-nowrap">
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
                            className="h-8 w-8 hover:bg-emerald-50 text-slate-400 hover:text-emerald-600"
                            onClick={() => handleOpenModal(product)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-red-50 text-slate-400 hover:text-red-600"
                            onClick={() => {
                              if (confirm('Hapus produk ini?')) {
                                deleteMutation.mutate(product.id);
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </motion.tr>
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
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
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
                  className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
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
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <label className="text-sm text-slate-700 font-medium">Produk Aktif</label>
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
                        className="w-3 h-3 rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <label className="text-[11px] text-slate-600 font-medium">Jadikan Satuan Dasar</label>
                    </div>
                  </div>
                ))}
              </div>
              {errors.units && <p className="text-xs text-red-500">{errors.units.message}</p>}
            </div>
          </div>
        </form>
      </Dialog>

      {/* Import Modal */}
      <Dialog
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Import Produk (Bulk)"
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsImportModalOpen(false)}>Batal</Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              disabled={bulkCreateMutation.isPending}
              onClick={() => {
                 // Simple CSV parser logic for demo
                 const lines = importData.trim().split('\n');
                 const data = lines.map(line => {
                    const [
                       name, sku, categoryName, barcode,
                       baseUnit, basePrice, 
                       midUnit, midPrice, midConv, 
                       largeUnit, largePrice, largeConv
                    ] = line.split(',');
                    
                    const units = [];
                    // 1. Satuan Dasar
                    units.push({
                       unitName: baseUnit?.trim() || 'PCS',
                       pricePerUnit: parseFloat(basePrice) || 0,
                       conversionToBase: 1,
                       baseUnit: true
                    });

                    // 2. Satuan Tengah (Strip)
                    if (midUnit && midUnit.trim()) {
                       units.push({
                          unitName: midUnit.trim(),
                          pricePerUnit: parseFloat(midPrice) || 0,
                          conversionToBase: parseInt(midConv) || 1,
                          baseUnit: false
                       });
                    }

                    // 3. Satuan Besar (Box)
                    if (largeUnit && largeUnit.trim()) {
                       units.push({
                          unitName: largeUnit.trim(),
                          pricePerUnit: parseFloat(largePrice) || 0,
                          conversionToBase: parseInt(largeConv) || 1,
                          baseUnit: false
                       });
                    }

                    return {
                       name: name?.trim(),
                       sku: sku?.trim(),
                       categoryName: categoryName?.trim(),
                       barcode: barcode?.trim(),
                       units
                    };
                 });
                 bulkCreateMutation.mutate(data);
              }}
            >
              {bulkCreateMutation.isPending ? 'Mengimpor...' : 'Proses Import'}
            </Button>
          </>
        }
      >
        <div className="space-y-6">
           <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex gap-3 text-amber-700 text-sm">
              <Download className="w-5 h-5 shrink-0" />
              <div>
                 <p className="font-bold text-base mb-1">Panduan Import 3 Tingkat (12 Kolom)</p>
                 <p className="opacity-80 leading-relaxed">
                    Format: <b>Nama, SKU, Kategori, Barcode, Sat1, Harga1, Sat2, Harga2, Isi2, Sat3, Harga3, Isi3</b>
                 </p>
                 <div className="mt-3 p-3 bg-white/60 rounded-xl border border-amber-200 text-[11px] space-y-1">
                    <p><b>Contoh:</b> Amoxicillin, AMX01, Obat, 8991234567, Tablet, 1500, Strip, 14000, 10, Box, 135000, 100</p>
                    <p className="text-amber-600 font-medium">*Isi = Jumlah satuan dasar dalam unit tersebut</p>
                 </div>
              </div>
           </div>

           <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Paste Data CSV (12 Kolom) di bawah ini:</label>
              <textarea 
                className="w-full h-48 rounded-2xl border border-slate-200 bg-slate-50 p-4 font-mono text-[10px] focus:ring-2 focus:ring-emerald-500 focus:outline-none focus:bg-white transition-all"
                placeholder="Nama,SKU,Kategori,Barcode,Sat1,Harga1,Sat2,Harga2,Isi2,Sat3,Harga3,Isi3&#10;Amoxicillin,AMX01,Obat,89912345,Tablet,1500,Strip,14000,10,Box,135000,100"
                value={importData}
                onChange={(e) => setImportData(e.target.value)}
              />
           </div>

           <div 
             className="flex items-center justify-center py-10 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50 group hover:border-emerald-500 transition-colors cursor-pointer"
             onClick={() => fileInputRef.current?.click()}
           >
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".csv"
                onChange={handleFileChange}
              />
              <div className="text-center">
                 <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <FileSpreadsheet className="w-8 h-8 text-emerald-600" />
                 </div>
                 <p className="text-sm font-bold text-slate-800">Upload File Excel/CSV</p>
                 <p className="text-xs text-slate-400 mt-1">Hanya mendukung .csv (Max 5MB)</p>
              </div>
           </div>
        </div>
      </Dialog>
    </div>
  );
};

export default ProductsPage;
