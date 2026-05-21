import React from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import api from '../api/api';
import { Button } from '../components/ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Plus, ShoppingBag, Calendar, Truck, CreditCard, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Purchase {
  id: number;
  supplier: { name: string };
  branch: { name: string };
  purchaseDate: string;
  invoiceNumber: string;
  totalAmount: number;
  status: string;
}

const PurchasesPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = React.useState('');

  const { data: purchases, isLoading } = useQuery<Purchase[]>({
    queryKey: ['purchases'],
    queryFn: async () => {
      const res = await api.get('/purchases');
      return res.data;
    },
  });

  const filteredPurchases = React.useMemo(() => {
    if (!purchases) return [];
    if (!searchQuery) return purchases;
    const query = searchQuery.toLowerCase();
    return purchases.filter(p => {
      const invoiceMatch = p.invoiceNumber?.toLowerCase().includes(query);
      const idMatch = p.id.toString().includes(query) || `po-${p.id}`.includes(query) || `sp-${p.id}`.includes(query);
      const supplierMatch = p.supplier?.name?.toLowerCase().includes(query);
      const branchMatch = p.branch?.name?.toLowerCase().includes(query);
      return invoiceMatch || idMatch || supplierMatch || branchMatch;
    });
  }, [purchases, searchQuery]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Riwayat Pembelian</h1>
          <p className="text-slate-500 text-sm">Kelola pengadaan barang dari supplier.</p>
        </div>
        <Button 
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-100"
          onClick={() => navigate('/dashboard/purchasing/new')}
        >
          <Plus className="w-4 h-4" />
          Tambah Pembelian
        </Button>
      </div>

      {/* Kotak Pencarian */}
      <div className="flex items-center bg-white px-4 py-2.5 rounded-2xl shadow-sm border border-slate-100 gap-2.5 max-w-md">
        <Search className="w-5 h-5 text-slate-400" />
        <input 
          type="text" 
          placeholder="Cari nomor invoice, ID SP/PO, supplier, cabang..." 
          className="bg-transparent border-0 outline-none text-sm text-slate-700 placeholder-slate-400 w-full focus:ring-0 focus:outline-none"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No. Invoice / ID</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>Cabang</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-slate-400">
                    Memuat data...
                  </TableCell>
                </TableRow>
              ) : purchases?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-slate-400">
                    Belum ada riwayat pembelian.
                  </TableCell>
                </TableRow>
              ) : filteredPurchases.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-slate-400 italic">
                    Tidak ditemukan riwayat pembelian untuk pencarian "{searchQuery}".
                  </TableCell>
                </TableRow>
              ) : (
                filteredPurchases.map((purchase, index) => (
                  <motion.tr 
                    key={purchase.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="cursor-pointer hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0"
                    onClick={() => navigate(`/dashboard/purchasing/${purchase.id}`)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center shrink-0">
                          <ShoppingBag className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-800">{purchase.invoiceNumber || `PO-${purchase.id}`}</p>
                          <p className="text-xs text-slate-500">#{purchase.id}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-sm text-slate-600 font-medium">
                        <Truck className="w-3.5 h-3.5 text-slate-400" />
                        {purchase.supplier?.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-sm text-slate-500">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {new Date(purchase.purchaseDate).toLocaleDateString('id-ID')}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">
                      {purchase.branch?.name}
                    </TableCell>
                    <TableCell className="font-bold text-slate-800">
                      <div className="flex items-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5 text-emerald-500" />
                        Rp {purchase.totalAmount.toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                        purchase.status === 'RECEIVED' 
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                          : 'bg-amber-50 text-amber-600 border-amber-100'
                      }`}>
                        {purchase.status}
                      </span>
                    </TableCell>
                  </motion.tr>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default PurchasesPage;
