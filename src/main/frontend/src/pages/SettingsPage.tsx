import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Shield, 
  Bell, 
  Store, 
  Save,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../store';
import { setCredentials } from '../store/authSlice';
import api from '../api/api';

const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('general');
  const dispatch = useDispatch();
  const auth = useSelector((state: RootState) => state.auth);
  const { fullName, role, username, tenantId, userId } = auth;
  
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // General Tab States
  const [tenantName, setTenantName] = useState('');
  const [emailBisnis, setEmailBisnis] = useState(() => localStorage.getItem(`settings_email_${tenantId}`) || 'contact@gapotek.id');
  const [telepon, setTelepon] = useState(() => localStorage.getItem(`settings_phone_${tenantId}`) || '021-555-1234');
  const [npwp, setNpwp] = useState(() => localStorage.getItem(`settings_npwp_${tenantId}`) || '12.345.678.9-012.000');
  const [alamat, setAlamat] = useState(() => localStorage.getItem(`settings_address_${tenantId}`) || 'Jl. Kesehatan No. 88, Kebayoran Baru, Jakarta Selatan');

  // Profile Tab States
  const [userFullName, setUserFullName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPhone, setUserPhone] = useState(() => localStorage.getItem(`settings_userphone_${userId}`) || '081234567890');

  // Security Tab States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Fetch settings from API
  useEffect(() => {
    // Fetch tenant current name
    api.get('/tenants/current')
      .then(res => {
        setTenantName(res.data.name);
      })
      .catch(err => console.error("Gagal memuat info tenant: ", err));

    // Fetch user current profile info
    if (userId) {
      api.get(`/users/${userId}`)
        .then(res => {
          setUserFullName(res.data.fullName || '');
          setUserEmail(res.data.email || '');
        })
        .catch(err => console.error("Gagal memuat profil user: ", err));
    }
  }, [userId]);

  const handleSave = async () => {
    setIsSaving(true);
    setErrorMsg('');
    try {
      if (activeTab === 'general') {
        // Save tenant name to database
        const res = await api.put('/tenants/current', { name: tenantName });
        setTenantName(res.data.name);
        
        // Save mock business info locally
        localStorage.setItem(`settings_email_${tenantId}`, emailBisnis);
        localStorage.setItem(`settings_phone_${tenantId}`, telepon);
        localStorage.setItem(`settings_npwp_${tenantId}`, npwp);
        localStorage.setItem(`settings_address_${tenantId}`, alamat);
        
        // Update local Redux so context is updated if needed
        dispatch(setCredentials({
          ...auth,
          token: auth.token || '',
          userId: auth.userId || 0,
          username: auth.username || '',
          role: auth.role || '',
          fullName: auth.fullName || '',
          branchId: auth.branchId || 0,
          tenantId: auth.tenantId || '',
        }));

      } else if (activeTab === 'profile') {
        // Save user profile details to database
        const res = await api.put(`/users/${userId}`, {
          username,
          email: userEmail,
          fullName: userFullName,
          role,
          branchId: auth.branchId
        });
        
        setUserFullName(res.data.fullName);
        setUserEmail(res.data.email);

        // Update Redux state to display the new full name in Layout header immediately
        dispatch(setCredentials({
          ...auth,
          token: auth.token || '',
          userId: auth.userId || 0,
          username: auth.username || '',
          role: auth.role || '',
          fullName: res.data.fullName,
          branchId: auth.branchId || 0,
          tenantId: auth.tenantId || '',
        }));

        localStorage.setItem(`settings_userphone_${userId}`, userPhone);

      } else if (activeTab === 'security') {
        if (!currentPassword) {
          throw new Error('Password saat ini harus diisi.');
        }
        if (!newPassword) {
          throw new Error('Password baru harus diisi.');
        }
        if (newPassword !== confirmPassword) {
          throw new Error('Password baru dan konfirmasi password tidak cocok.');
        }

        // Save password update to database
        await api.put(`/users/${userId}`, {
          username,
          email: userEmail,
          fullName: userFullName,
          role,
          branchId: auth.branchId,
          password: newPassword
        });

        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || err.message || 'Gagal menyimpan perubahan.');
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { id: 'general', label: 'Umum', icon: Store },
    { id: 'profile', label: 'Profil Saya', icon: User },
    { id: 'security', label: 'Keamanan', icon: Shield },
    { id: 'notifications', label: 'Notifikasi', icon: Bell },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Pengaturan</h1>
          <p className="text-slate-500">Kelola preferensi aplikasi dan akun Anda.</p>
        </div>
        <AnimatePresence>
          {showSuccess && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 font-medium text-sm font-semibold"
            >
              <CheckCircle2 className="w-4 h-4" />
              Perubahan disimpan!
            </motion.div>
          )}
          {errorMsg && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-600 rounded-xl border border-rose-100 font-semibold text-sm"
            >
              <AlertCircle className="w-4 h-4" />
              {errorMsg}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Navigation Sidebar */}
        <aside className="w-full md:w-64 space-y-1 flex-shrink-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setErrorMsg('');
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${
                activeTab === tab.id 
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100' 
                  : 'text-slate-500 hover:bg-white hover:text-emerald-600'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              <span className="font-semibold">{tab.label}</span>
            </button>
          ))}
        </aside>

        {/* Content Area */}
        <div className="flex-1 bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-8 md:p-12 space-y-10">
            {activeTab === 'general' && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8 text-left"
              >
                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-slate-800">Branding Apotek</h3>
                  <p className="text-sm text-slate-500">Informasi ini akan muncul di struk dan laporan.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1 block">Nama Apotek</label>
                    <Input value={tenantName} onChange={e => setTenantName(e.target.value)} placeholder="Masukkan nama apotek" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1 block">Email Bisnis</label>
                    <Input value={emailBisnis} onChange={e => setEmailBisnis(e.target.value)} type="email" placeholder="email@bisnis.com" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1 block">Nomor Telepon</label>
                    <Input value={telepon} onChange={e => setTelepon(e.target.value)} placeholder="021xxxx" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1 block">No. Pajak / NPWP</label>
                    <Input value={npwp} onChange={e => setNpwp(e.target.value)} placeholder="xx.xxx.xxx.x-xxx.xxx" />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1 block">Alamat Lengkap</label>
                    <textarea 
                      className="w-full min-h-[100px] rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
                      placeholder="Masukkan alamat lengkap apotek..."
                      value={alamat}
                      onChange={e => setAlamat(e.target.value)}
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'profile' && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8 text-left"
              >
                <div className="flex items-center gap-6 pb-6 border-b border-slate-100">
                  <div className="w-24 h-24 bg-emerald-50 rounded-3xl flex items-center justify-center text-emerald-600 relative group cursor-pointer overflow-hidden flex-shrink-0">
                    <User className="w-12 h-12" />
                    <div className="absolute inset-0 bg-emerald-600/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold uppercase">
                      Ganti Foto
                    </div>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-slate-800">{userFullName || fullName}</h3>
                    <p className="text-slate-500 font-medium uppercase tracking-wider text-xs font-semibold">{role}</p>
                    <div className="mt-2 flex gap-2">
                      <span className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-600 text-[10px] font-black border border-emerald-100 tracking-wider">ONLINE</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1 block">Nama Lengkap</label>
                    <Input value={userFullName} onChange={e => setUserFullName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1 block">Username</label>
                    <Input value={username || ''} disabled />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1 block">Email Akun</label>
                    <Input value={userEmail} onChange={e => setUserEmail(e.target.value)} type="email" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1 block">Nomor WhatsApp</label>
                    <Input value={userPhone} onChange={e => setUserPhone(e.target.value)} />
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'security' && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8 text-left"
              >
                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-slate-800">Ubah Password</h3>
                  <p className="text-sm text-slate-500">Pastikan password Anda kuat dan unik.</p>
                </div>

                <div className="max-w-md space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1 block">Password Saat Ini</label>
                    <Input type="password" placeholder="••••••••" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1 block">Password Baru</label>
                    <Input type="password" placeholder="••••••••" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1 block">Konfirmasi Password Baru</label>
                    <Input type="password" placeholder="••••••••" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'notifications' && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8 text-left"
              >
                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-slate-800">Notifikasi & Peringatan</h3>
                  <p className="text-sm text-slate-500">Atur bagaimana Anda menerima peringatan stok dan keuangan.</p>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div>
                      <p className="font-bold text-slate-800 text-sm">Notifikasi Peringatan Kadaluwarsa Obat</p>
                      <p className="text-xs text-slate-400">Terima alarm otomatis saat obat mendekati masa kadaluwarsa.</p>
                    </div>
                    <input type="checkbox" defaultChecked className="w-5 h-5 accent-emerald-600 rounded-lg cursor-pointer" />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div>
                      <p className="font-bold text-slate-800 text-sm">Notifikasi Laporan Shift Kasir Harian</p>
                      <p className="text-xs text-slate-400">Kirim email ringkasan omzet otomatis saat shift ditutup.</p>
                    </div>
                    <input type="checkbox" defaultChecked className="w-5 h-5 accent-emerald-600 rounded-lg cursor-pointer" />
                  </div>
                </div>
              </motion.div>
            )}

            <div className="pt-8 border-t border-slate-100 flex justify-end">
              <Button 
                onClick={handleSave}
                disabled={isSaving || activeTab === 'notifications'}
                className="bg-emerald-600 hover:bg-emerald-700 h-12 px-10 rounded-2xl font-bold shadow-xl shadow-emerald-200"
              >
                {isSaving ? "Menyimpan..." : (
                  <>
                    <Save className="w-5 h-5 mr-2" />
                    Simpan Perubahan
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
