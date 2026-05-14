import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../api/api';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Search, Package, ArrowLeft, ArrowDownRight, ArrowUpRight, AlertCircle } from 'lucide-react';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { cn } from '../lib/utils';
import { format } from 'date-fns';

interface Branch {
  id: number;
  name: string;
}

interface Product {
  id: number;
  name: string;
  sku: string;
}

interface StockMovement {
  id: number;
  type: string;
  quantity: number;
  batchNumber: string;
  expiryDate: string;
  referenceNumber: string;
  notes: string;
  createdAt: string;
  product: Product;
}

const StockMovementsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialBranchId = searchParams.get('branch');
  
  const [selectedBranchId, setSelectedBranchId] = useState<string>(initialBranchId || '');
  const [searchTerm, setSearchTerm] = useState('');

  const { data: branches } = useQuery<Branch[]>({
    queryKey: ['branches'],
    queryFn: async () => {
      const res = await api.get('/branches');
      return res.data;
    },
  });

  useEffect(() => {
    if (branches && branches.length > 0 && !selectedBranchId) {
      setSelectedBranchId(branches[0].id.toString());
    }
  }, [branches, selectedBranchId]);

  const { data: movements, isLoading } = useQuery<StockMovement[]>({
    queryKey: ['movements', selectedBranchId],
    queryFn: async () => {
      if (!selectedBranchId) return [];
      const res = await api.get(`/inventory/branch/${selectedBranchId}/movements`);
      return res.data;
    },
    enabled: !!selectedBranchId,
  });

  const filteredMovements = movements?.filter(mov => 
    mov.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mov.product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (mov.referenceNumber && mov.referenceNumber.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getMovementIcon = (type: string) => {
    if (type === 'IN') return <ArrowDownRight className="w-4 h-4 text-emerald-600" />;
    if (type === 'OUT') return <ArrowUpRight className="w-4 h-4 text-rose-600" />;
    return <AlertCircle className="w-4 h-4 text-amber-600" />;
  };

  const getMovementColor = (type: string) => {
    if (type === 'IN') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (type === 'OUT') return 'bg-rose-50 text-rose-700 border-rose-200';
    return 'bg-amber-50 text-amber-700 border-amber-200';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Link to="/dashboard/inventory">
              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-slate-800">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-slate-800">Riwayat Mutasi Stok</h1>
          </div>
          <p className="text-slate-500 text-sm ml-11">Pantau pergerakan barang masuk, keluar, dan penyesuaian.</p>
        </div>
        <div className="flex items-center gap-3">
          <select 
            className="h-10 px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            value={selectedBranchId}
            onChange={(e) => setSelectedBranchId(e.target.value)}
          >
            <option value="" disabled>Pilih Cabang</option>
            {branches?.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Cari produk, SKU, atau no. referensi..." 
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Waktu</TableHead>
              <TableHead>Produk</TableHead>
              <TableHead>Tipe</TableHead>
              <TableHead className="text-right">Kuantitas</TableHead>
              <TableHead>Batch / Exp</TableHead>
              <TableHead>Referensi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-slate-400">
                  Memuat data...
                </TableCell>
              </TableRow>
            ) : filteredMovements?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-slate-400">
                  Tidak ada data riwayat mutasi.
                </TableCell>
              </TableRow>
            ) : (
              filteredMovements?.map((mov, index) => (
                <motion.tr 
                  key={mov.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors"
                >
                  <TableCell className="text-sm text-slate-500 whitespace-nowrap">
                    {format(new Date(mov.createdAt), 'dd MMM yyyy, HH:mm')}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-slate-800 flex items-center gap-2">
                        <Package className="w-3.5 h-3.5 text-slate-400" />
                        {mov.product.name}
                      </p>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">{mov.product.sku}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className={cn(
                      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border",
                      getMovementColor(mov.type)
                    )}>
                      {getMovementIcon(mov.type)}
                      {mov.type}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-bold text-slate-800">
                    {mov.type === 'OUT' ? '-' : (mov.type === 'IN' ? '+' : '')}{mov.quantity}
                  </TableCell>
                  <TableCell>
                    <div className="text-xs text-slate-600">
                      {mov.batchNumber && <p>Batch: <span className="font-medium">{mov.batchNumber}</span></p>}
                      {mov.expiryDate && <p>Exp: <span className="font-medium">{format(new Date(mov.expiryDate), 'dd/MM/yyyy')}</span></p>}
                      {!mov.batchNumber && !mov.expiryDate && '-'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs text-slate-600 max-w-[150px] truncate">
                      {mov.referenceNumber && <p className="font-medium text-slate-800" title={mov.referenceNumber}>{mov.referenceNumber}</p>}
                      {mov.notes && <p className="text-slate-500 truncate" title={mov.notes}>{mov.notes}</p>}
                      {!mov.referenceNumber && !mov.notes && '-'}
                    </div>
                  </TableCell>
                </motion.tr>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default StockMovementsPage;
