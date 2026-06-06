import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Dialog } from '../components/ui/Dialog';
import { Pagination } from '../components/ui/Pagination';
import { 
  ShieldAlert, 
  Search, 
  TrendingUp, 
  Building2, 
  Calendar, 
  Edit3, 
  AlertTriangle,
  CheckCircle2,
  XCircle
} from 'lucide-react';

interface Tenant {
  id: string;
  name: string;
  active: boolean;
  subscriptionPlan: string;
  billingStatus: string;
  expiredAt: string;
  maxUsers: number;
  maxBranches: number;
  price: number;
  createdAt: string;
}

interface SuperAdminStats {
  totalTenants: number;
  activeTenants: number;
  expiredTenants: number;
  monthlyRecurringRevenue: number;
}

const SuperAdminDashboardPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const entriesPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Form states for billing edit
  const [editPlan, setEditPlan] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [editExpiredAt, setEditExpiredAt] = useState('');
  const [editMaxUsers, setEditMaxUsers] = useState(2);
  const [editMaxBranches, setEditMaxBranches] = useState(1);
  const [editPrice, setEditPrice] = useState(0);
  const [editActive, setEditActive] = useState(true);

  // Fetch tenants
  const { data: tenants, isLoading: isTenantsLoading } = useQuery<Tenant[]>({
    queryKey: ['super-admin-tenants'],
    queryFn: () => api.get('/super-admin/tenants').then(res => res.data),
  });

  // Fetch stats
  const { data: stats } = useQuery<SuperAdminStats>({
    queryKey: ['super-admin-stats'],
    queryFn: () => api.get('/super-admin/stats').then(res => res.data),
  });

  // Update billing mutation
  const updateBillingMutation = useMutation({
    mutationFn: (payload: any) => 
      api.put(`/super-admin/tenants/${selectedTenant?.id}/billing`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['super-admin-tenants'] });
      queryClient.invalidateQueries({ queryKey: ['super-admin-stats'] });
      alert('Billing tenant berhasil diperbarui!');
      setIsEditModalOpen(false);
      setSelectedTenant(null);
    },
    onError: (error: any) => {
      alert('Gagal memperbarui billing: ' + (error.response?.data?.message || error.message));
    }
  });

  // Suspend/Unsuspend mutation
  const suspendMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => 
      api.put(`/super-admin/tenants/${id}/suspend?active=${active}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['super-admin-tenants'] });
      queryClient.invalidateQueries({ queryKey: ['super-admin-stats'] });
      alert('Status aktif tenant berhasil diubah!');
    },
    onError: (error: any) => {
      alert('Gagal mengubah status: ' + (error.response?.data?.message || error.message));
    }
  });

  const handleOpenEdit = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setEditPlan(tenant.subscriptionPlan);
    setEditStatus(tenant.billingStatus);
    // Format LocalDateTime to YYYY-MM-DDThh:mm for datetime-local input
    const formattedDate = tenant.expiredAt ? tenant.expiredAt.substring(0, 16) : '';
    setEditExpiredAt(formattedDate);
    setEditMaxUsers(tenant.maxUsers);
    setEditMaxBranches(tenant.maxBranches);
    setEditPrice(tenant.price);
    setEditActive(tenant.active);
    setIsEditModalOpen(true);
  };

  const handleSaveBilling = () => {
    if (!selectedTenant) return;
    const payload = {
      subscriptionPlan: editPlan,
      billingStatus: editStatus,
      expiredAt: editExpiredAt + ':00', // Append seconds
      maxUsers: Number(editMaxUsers),
      maxBranches: Number(editMaxBranches),
      price: Number(editPrice),
      active: editActive,
    };
    updateBillingMutation.mutate(payload);
  };

  const handleToggleActive = (tenant: Tenant) => {
    const confirmMsg = tenant.active 
      ? `Apakah Anda yakin ingin menangguhkan (SUSPEND) tenant "${tenant.name}"? Pengguna apotek ini tidak akan bisa login.`
      : `Aktifkan kembali tenant "${tenant.name}"?`;
    if (confirm(confirmMsg)) {
      suspendMutation.mutate({ id: tenant.id, active: !tenant.active });
    }
  };

  // Filter tenants (Exclude 'SYSTEM')
  const filteredTenants = tenants
    ?.filter(t => t.id !== 'SYSTEM')
    ?.filter(t => {
      const search = searchTerm.toLowerCase();
      return (
        t.id.toLowerCase().includes(search) ||
        t.name.toLowerCase().includes(search)
      );
    });

  const totalEntries = filteredTenants?.length || 0;
  const totalPages = Math.ceil(totalEntries / entriesPerPage);
  const indexOfLastEntry = currentPage * entriesPerPage;
  const indexOfFirstEntry = indexOfLastEntry - entriesPerPage;
  const currentTenants = filteredTenants?.slice(indexOfFirstEntry, indexOfLastEntry) || [];

  const getPlanBadge = (plan: string) => {
    if (plan === 'FREE_TRIAL') return 'bg-slate-100 text-slate-700 border-slate-200';
    if (plan === 'BASIC_180K') return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    if (plan === 'PRO_300K') return 'bg-sky-50 text-sky-700 border-sky-100';
    return 'bg-purple-50 text-purple-700 border-purple-100';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <ShieldAlert className="w-7 h-7 text-emerald-600" />
            Super Admin Billing Panel
          </h1>
          <p className="text-slate-500 text-sm">Manajemen apotek berlangganan, paket harga, penagihan, dan suspensi akses.</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 relative overflow-hidden group">
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Pendapatan Bulanan (MRR)</p>
            <h3 className="text-xl font-black text-slate-800 mt-0.5">
              Rp {stats?.monthlyRecurringRevenue?.toLocaleString() || '0'}
            </h3>
          </div>
          <div className="absolute bottom-0 left-0 h-1 w-full bg-emerald-500/10" />
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 relative overflow-hidden group">
          <div className="p-3 rounded-xl bg-slate-50 text-slate-600">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Apotek Terdaftar</p>
            <h3 className="text-xl font-black text-slate-800 mt-0.5">{stats?.totalTenants || 0} Apotek</h3>
          </div>
          <div className="absolute bottom-0 left-0 h-1 w-full bg-slate-500/10" />
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 relative overflow-hidden group">
          <div className="p-3 rounded-xl bg-sky-50 text-sky-600">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Apotek Aktif</p>
            <h3 className="text-xl font-black text-slate-800 mt-0.5">{stats?.activeTenants || 0} Tenant</h3>
          </div>
          <div className="absolute bottom-0 left-0 h-1 w-full bg-sky-500/10" />
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 relative overflow-hidden group">
          <div className="p-3 rounded-xl bg-rose-50 text-rose-600">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Apotek Menunggak / Expired</p>
            <h3 className="text-xl font-black text-rose-600 mt-0.5">{stats?.expiredTenants || 0} Tenant</h3>
          </div>
          <div className="absolute bottom-0 left-0 h-1 w-full bg-rose-500/10" />
        </div>
      </div>

      {/* Main Tenant Table List */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-extrabold text-slate-800">Daftar Tenant Apotek Berlangganan</h3>
            <p className="text-xs text-slate-400">Gunakan kolom pencarian untuk memfilter ID Apotek atau Nama apotek.</p>
          </div>

          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Cari ID atau Nama Apotek..."
              className="pl-10 h-10 rounded-xl"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/30">
                <TableHead className="font-bold text-slate-500">ID / Nama Apotek</TableHead>
                <TableHead className="font-bold text-slate-500">Paket Aktif</TableHead>
                <TableHead className="font-bold text-slate-500">Masa Jatuh Tempo</TableHead>
                <TableHead className="font-bold text-slate-500 text-right">Biaya Bulanan</TableHead>
                <TableHead className="font-bold text-slate-500 text-center">Batas User / Cabang</TableHead>
                <TableHead className="font-bold text-slate-500 text-center">Status Billing</TableHead>
                <TableHead className="font-bold text-slate-500 text-center">Status Akses</TableHead>
                <TableHead className="w-24 text-center font-bold text-slate-500">Kelola</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isTenantsLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-40 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-slate-400 text-xs font-bold">Memuat daftar apotek...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredTenants?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-40 text-center text-slate-400 text-xs italic">
                    Tidak ada tenant apotek yang terdaftar.
                  </TableCell>
                </TableRow>
              ) : (
                currentTenants?.map((tenant) => {
                  const isExpired = new Date(tenant.expiredAt) < new Date();
                  return (
                    <TableRow key={tenant.id} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell className="font-bold text-slate-700">
                        <p>{tenant.name}</p>
                        <p className="text-[10px] text-emerald-600 font-mono font-normal">ID: {tenant.id}</p>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black border uppercase tracking-wider ${getPlanBadge(tenant.subscriptionPlan)}`}>
                          {tenant.subscriptionPlan.replace('_', ' ')}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-slate-500">
                        <div className="flex items-center gap-1.5 font-semibold">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span className={isExpired ? "text-rose-600 font-bold" : "text-slate-600"}>
                            {new Date(tenant.expiredAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-black text-slate-700">
                        Rp {tenant.price?.toLocaleString() || '0'}
                      </TableCell>
                      <TableCell className="text-center text-xs font-bold text-slate-600">
                        {tenant.maxUsers} Users / {tenant.maxBranches} Cabang
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wide border ${
                          tenant.billingStatus === 'ACTIVE' 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                            : 'bg-rose-50 text-rose-700 border-rose-100'
                        }`}>
                          {tenant.billingStatus}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wide border ${
                          tenant.active 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}>
                          {tenant.active ? 'AKTIF' : 'SUSPEND'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="w-8 h-8 p-0 rounded-full hover:bg-slate-100 text-slate-500 hover:text-emerald-600"
                            onClick={() => handleOpenEdit(tenant)}
                          >
                            <Edit3 className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className={`w-8 h-8 p-0 rounded-full hover:bg-rose-50 ${
                              tenant.active ? 'text-rose-500' : 'text-slate-400 hover:text-emerald-600'
                            }`}
                            onClick={() => handleToggleActive(tenant)}
                          >
                            {tenant.active ? <XCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
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
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalEntries={totalEntries}
          indexOfFirstEntry={indexOfFirstEntry}
          indexOfLastEntry={indexOfLastEntry}
          label="tenant"
        />
      </div>

      {/* Edit Billing Modal Dialog */}
      <Dialog
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedTenant(null);
        }}
        title={`Kelola Billing: ${selectedTenant?.name}`}
        footer={
          <>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsEditModalOpen(false);
                setSelectedTenant(null);
              }}
            >
              Batal
            </Button>
            <Button
              onClick={handleSaveBilling}
              disabled={updateBillingMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
              {updateBillingMutation.isPending ? 'Menyimpan...' : 'Simpan Billing'}
            </Button>
          </>
        }
      >
        <div className="space-y-4 py-2 text-left">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Paket Langganan</label>
            <select
              className="w-full h-10 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold text-slate-700 cursor-pointer"
              value={editPlan}
              onChange={(e) => {
                const plan = e.target.value;
                setEditPlan(plan);
                if (plan === 'FREE_TRIAL') {
                  setEditMaxUsers(2);
                  setEditMaxBranches(1);
                  setEditPrice(0);
                } else if (plan === 'BASIC_180K') {
                  setEditMaxUsers(2);
                  setEditMaxBranches(1);
                  setEditPrice(180000);
                } else if (plan === 'PRO_300K') {
                  setEditMaxUsers(5);
                  setEditMaxBranches(2);
                  setEditPrice(300000);
                } else if (plan === 'PRO_UNLIMITED') {
                  setEditMaxUsers(9999);
                  setEditMaxBranches(9999);
                  setEditPrice(500000);
                }
              }}
            >
              <option value="FREE_TRIAL">FREE TRIAL (Uji Coba 14 Hari)</option>
              <option value="BASIC_180K">BASIC (Apotek Tunggal Rp 180k/bln)</option>
              <option value="PRO_300K">PROFESSIONAL (Apotek + Gudang Rp 300k/bln)</option>
              <option value="PRO_UNLIMITED">ENTERPRISE (Multi-Cabang Rp 500k/bln)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Status Penagihan</label>
              <select
                className="w-full h-10 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold text-slate-700 cursor-pointer"
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
              >
                <option value="PENDING">PENDING (Menunggu Aktivasi)</option>
                <option value="ACTIVE">ACTIVE (Aktif Lancar)</option>
                <option value="EXPIRED">EXPIRED (Habis Masa Aktif)</option>
                <option value="SUSPENDED">SUSPENDED (Ditangguhkan)</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Status Akses Akun</label>
              <select
                className="w-full h-10 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold text-slate-700 cursor-pointer"
                value={editActive ? 'true' : 'false'}
                onChange={(e) => setEditActive(e.target.value === 'true')}
              >
                <option value="true">Aktif (Open)</option>
                <option value="false">Suspend (Blokir Login)</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Tanggal Jatuh Tempo (Expiry)</label>
            <Input
              type="datetime-local"
              value={editExpiredAt}
              onChange={(e) => setEditExpiredAt(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Batas Maksimal User</label>
              <Input
                type="number"
                value={editMaxUsers}
                onChange={(e) => setEditMaxUsers(Number(e.target.value))}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Batas Maksimal Cabang</label>
              <Input
                type="number"
                value={editMaxBranches}
                onChange={(e) => setEditMaxBranches(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Tarif Tagihan Bulanan (IDR)</label>
            <Input
              type="number"
              value={editPrice}
              onChange={(e) => setEditPrice(Number(e.target.value))}
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default SuperAdminDashboardPage;
