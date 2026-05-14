import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import api from '../api/api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Trash, Plus, ShoppingCart, ArrowLeft, Save, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const detailSchema = z.object({
  productId: z.string().min(1, 'Produk wajib dipilih'),
  quantity: z.number().min(0.0001, 'Qty minimal 0.0001'),
  unitPrice: z.number().min(0, 'Harga minimal 0'),
  batchNumber: z.string().min(1, 'Batch wajib diisi'),
  expiryDate: z.string().min(1, 'Expired date wajib diisi'),
});

const purchaseSchema = z.object({
  supplierId: z.string().min(1, 'Supplier wajib dipilih'),
  branchId: z.string().min(1, 'Cabang wajib dipilih'),
  purchaseDate: z.string().min(1, 'Tanggal wajib diisi'),
  invoiceNumber: z.string().optional(),
  status: z.string().default('RECEIVED'),
  notes: z.string().optional(),
  details: z.array(detailSchema).min(1, 'Minimal 1 item'),
});

type PurchaseFormValues = z.infer<typeof purchaseSchema>;

const NewPurchasePage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { register, control, handleSubmit, watch, formState: { errors } } = useForm<PurchaseFormValues>({
    resolver: zodResolver(purchaseSchema),
    defaultValues: {
      purchaseDate: new Date().toISOString().split('T')[0],
      status: 'RECEIVED',
      details: [{ productId: '', quantity: 0, unitPrice: 0, batchNumber: '', expiryDate: '' }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "details"
  });

  const { data: suppliers } = useQuery({ queryKey: ['suppliers'], queryFn: () => api.get('/suppliers').then(res => res.data) });
  const { data: branches } = useQuery({ queryKey: ['branches'], queryFn: () => api.get('/branches').then(res => res.data) });
  const { data: products } = useQuery({ queryKey: ['products'], queryFn: () => api.get('/products').then(res => res.data) });

  const createMutation = useMutation({
    mutationFn: (data: PurchaseFormValues) => {
      const payload = {
        ...data,
        supplier: { id: parseInt(data.supplierId) },
        branch: { id: parseInt(data.branchId) },
        totalAmount: data.details.reduce((acc, curr) => acc + (curr.quantity * curr.unitPrice), 0),
        details: data.details.map(d => ({
          product: { id: parseInt(d.productId) },
          quantity: d.quantity,
          unitPrice: d.unitPrice,
          batchNumber: d.batchNumber,
          expiryDate: d.expiryDate,
          subtotal: d.quantity * d.unitPrice
        }))
      };
      return api.post('/purchases', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      navigate('/purchasing');
    },
  });

  const detailsValues = watch('details');
  const totalAmount = detailsValues.reduce((acc, curr) => acc + (curr.quantity * curr.unitPrice || 0), 0);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/purchasing')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Tambah Pembelian Baru</h1>
            <p className="text-slate-500 text-sm">Masukkan detail invoice dari supplier.</p>
          </div>
        </div>
        <Button 
          className="bg-emerald-600 hover:bg-emerald-700" 
          onClick={handleSubmit((data) => createMutation.mutate(data))}
          disabled={createMutation.isPending}
        >
          <Save className="w-4 h-4 mr-2" />
          Simpan Transaksi
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Header Section */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-emerald-600" />
              Info Utama
            </h2>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Supplier</label>
                <select 
                  {...register('supplierId')}
                  className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="">Pilih Supplier</option>
                  {suppliers?.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                {errors.supplierId && <p className="text-xs text-red-500">{errors.supplierId.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Cabang Penerima</label>
                <select 
                  {...register('branchId')}
                  className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="">Pilih Cabang</option>
                  {branches?.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
                {errors.branchId && <p className="text-xs text-red-500">{errors.branchId.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Tanggal</label>
                  <Input type="date" {...register('purchaseDate')} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">No. Invoice</label>
                  <Input {...register('invoiceNumber')} placeholder="INV/2024/xxx" />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-slate-500 font-medium">Total Pembelian</span>
                  <span className="text-xl font-black text-emerald-600">Rp {totalAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Details Section */}
        <div className="lg:col-span-2">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Package className="w-5 h-5 text-emerald-600" />
                Daftar Item
              </h2>
              <Button type="button" variant="outline" size="sm" onClick={() => append({ productId: '', quantity: 0, unitPrice: 0, batchNumber: '', expiryDate: '' })}>
                <Plus className="w-4 h-4 mr-1.5" />
                Tambah Item
              </Button>
            </div>

            <div className="space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 relative animate-in zoom-in-95 duration-200">
                  <button 
                    type="button" 
                    onClick={() => remove(index)}
                    className="absolute -top-2 -right-2 w-8 h-8 bg-white border border-slate-200 text-slate-400 hover:text-red-500 rounded-full flex items-center justify-center shadow-sm transition-colors z-10"
                  >
                    <Trash className="w-4 h-4" />
                  </button>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="lg:col-span-2 space-y-1.5">
                      <label className="text-[10px] uppercase font-bold text-slate-400">Produk</label>
                      <select 
                        {...register(`details.${index}.productId` as const)}
                        className="w-full h-9 rounded-lg border border-slate-200 bg-white px-3 py-1 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      >
                        <option value="">Pilih Produk</option>
                        {products?.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-bold text-slate-400">Jumlah (Base Unit)</label>
                      <Input 
                        type="number" 
                        step="0.0001"
                        className="h-9"
                        {...register(`details.${index}.quantity` as const, { valueAsNumber: true })} 
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-bold text-slate-400">Harga Satuan</label>
                      <Input 
                        type="number" 
                        className="h-9 font-mono"
                        {...register(`details.${index}.unitPrice` as const, { valueAsNumber: true })} 
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-bold text-slate-400">Batch Number</label>
                      <Input 
                        className="h-9"
                        {...register(`details.${index}.batchNumber` as const)} 
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-bold text-slate-400">Expired Date</label>
                      <Input 
                        type="date"
                        className="h-9"
                        {...register(`details.${index}.expiryDate` as const)} 
                      />
                    </div>

                    <div className="lg:col-span-2 flex items-end">
                       <div className="w-full h-9 bg-emerald-50/50 rounded-lg flex items-center px-3 justify-between border border-emerald-100/50">
                          <span className="text-[10px] uppercase font-bold text-emerald-500">Subtotal</span>
                          <span className="text-sm font-black text-emerald-600">
                             Rp {((watch(`details.${index}.quantity`) || 0) * (watch(`details.${index}.unitPrice`) || 0)).toLocaleString()}
                          </span>
                       </div>
                    </div>
                  </div>
                </div>
              ))}
              {errors.details && <p className="text-sm text-red-500 text-center">{errors.details.message}</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewPurchasePage;
