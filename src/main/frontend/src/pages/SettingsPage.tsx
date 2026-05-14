import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Shield, 
  Bell, 
  Store, 
  Save,
  CheckCircle2
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';

const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('general');
  const { fullName, role, username } = useSelector((state: RootState) => state.auth);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }, 1000);
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
              className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 font-medium text-sm"
            >
              <CheckCircle2 className="w-4 h-4" />
              Perubahan disimpan!
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Navigation Sidebar */}
        <aside className="w-full md:w-64 space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
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
                className="space-y-8"
              >
                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-slate-800">Branding Apotek</h3>
                  <p className="text-sm text-slate-500">Informasi ini akan muncul di struk dan laporan.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Nama Apotek</label>
                    <Input defaultValue="GApotek Utama" placeholder="Masukkan nama apotek" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Email Bisnis</label>
                    <Input defaultValue="contact@gapotek.id" type="email" placeholder="email@bisnis.com" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Nomor Telepon</label>
                    <Input defaultValue="021-555-1234" placeholder="021xxxx" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">No. Pajak / NPWP</label>
                    <Input defaultValue="12.345.678.9-012.000" placeholder="xx.xxx.xxx.x-xxx.xxx" />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Alamat Lengkap</label>
                    <textarea 
                      className="w-full min-h-[100px] rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
                      placeholder="Masukkan alamat lengkap apotek..."
                      defaultValue="Jl. Kesehatan No. 88, Kebayoran Baru, Jakarta Selatan"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'profile' && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                <div className="flex items-center gap-6 pb-6 border-b border-slate-100">
                  <div className="w-24 h-24 bg-emerald-50 rounded-3xl flex items-center justify-center text-emerald-600 relative group cursor-pointer overflow-hidden">
                    <User className="w-12 h-12" />
                    <div className="absolute inset-0 bg-emerald-600/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold uppercase">
                      Ganti Foto
                    </div>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-slate-800">{fullName}</h3>
                    <p className="text-slate-500 font-medium uppercase tracking-wider text-xs">{role}</p>
                    <div className="mt-2 flex gap-2">
                      <span className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-600 text-[10px] font-bold border border-emerald-100">ONLINE</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Nama Lengkap</label>
                    <Input defaultValue={fullName} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Username</label>
                    <Input defaultValue={username} disabled />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Nomor WhatsApp</label>
                    <Input defaultValue="081234567890" />
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'security' && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-slate-800">Ubah Password</h3>
                  <p className="text-sm text-slate-500">Pastikan password Anda kuat dan unik.</p>
                </div>

                <div className="max-w-md space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Password Saat Ini</label>
                    <Input type="password" placeholder="••••••••" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Password Baru</label>
                    <Input type="password" placeholder="••••••••" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Konfirmasi Password Baru</label>
                    <Input type="password" placeholder="••••••••" />
                  </div>
                </div>
              </motion.div>
            )}

            <div className="pt-8 border-t border-slate-100 flex justify-end">
              <Button 
                onClick={handleSave}
                disabled={isSaving}
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
