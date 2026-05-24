import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/api';
import { 
  UserPlus, 
  Lock, 
  User as UserIcon, 
  Mail,
  Building,
  Phone,
  MapPin,
  AlertCircle, 
  LayoutDashboard, 
  ArrowLeft,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

const RegisterPage: React.FC = () => {
  const [tenantId, setTenantId] = useState('');
  const [tenantName, setTenantName] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await api.post('/auth/register', {
        tenantId,
        tenantName,
        username,
        password,
        email,
        fullName,
        phone,
        address
      });
      
      setSuccess(response.data.message || 'Pendaftaran berhasil!');
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal melakukan pendaftaran. Silakan periksa kembali data Anda.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-white flex overflow-hidden">
      {/* Left Pane - Branding & Illustration */}
      <div className="hidden lg:flex lg:w-1/2 bg-emerald-950 relative items-center justify-center p-12 overflow-hidden">
        {/* Animated Background Gradients */}
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 45, 0],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ duration: 15, repeat: Infinity }}
          className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-600 rounded-full blur-[120px]"
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.3, 1],
            rotate: [0, -45, 0],
            opacity: [0.2, 0.4, 0.2]
          }}
          transition={{ duration: 18, repeat: Infinity }}
          className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-500 rounded-full blur-[100px]"
        />

        <div className="relative z-10 max-w-lg space-y-12">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-2xl">
              <LayoutDashboard className="text-emerald-950 w-7 h-7" />
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">Grapi Pharma</span>
          </motion.div>

          <div className="space-y-6">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-5xl font-extrabold text-white leading-[1.2]"
            >
              Mulai Langkah Baru <br />
              <span className="text-emerald-400">SaaS Apotek.</span>
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-emerald-100/70 text-lg leading-relaxed"
            >
              Daftarkan apotek Anda sekarang dan nikmati kemudahan pengelolaan multitenant secara instan, aman, dan efisien.
            </motion.p>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-2 gap-6"
          >
            {[
              { icon: <ShieldCheck className="w-5 h-5" />, text: "Aman & Terisolasi" },
              { icon: <CheckCircle2 className="w-5 h-5" />, text: "Setup Instan" }
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-emerald-100 font-medium">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-sm">
                  {item.icon}
                </div>
                <span className="text-sm">{item.text}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Right Pane - Registration Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center p-6 sm:p-12 overflow-y-auto relative">
        <motion.button
          whileHover={{ x: -5 }}
          onClick={() => navigate('/login')}
          className="absolute top-6 left-6 flex items-center gap-2 text-slate-500 hover:text-emerald-600 font-medium transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Kembali ke Login
        </motion.button>

        <div className="max-w-xl w-full mx-auto space-y-8 pt-12 pb-6">
          <div className="space-y-2 text-center lg:text-left">
            <motion.h1 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl font-extrabold text-slate-900 tracking-tight"
            >
              Registrasi Apotek Baru.
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-slate-500 font-medium text-sm"
            >
              Sistem SaaS Multi-Tenant siap mengamankan bisnis apotek Anda.
            </motion.p>
          </div>

          <form onSubmit={handleRegister} className="space-y-5">
            <AnimatePresence mode="wait">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3 text-rose-600 text-sm font-medium"
                >
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <p>{error}</p>
                </motion.div>
              )}

              {success && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-start gap-3 text-emerald-600 text-sm font-medium"
                >
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                  <p>{success}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="bg-slate-50 p-5 rounded-3xl space-y-4 border border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">Data Apotek</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 ml-1">ID Apotek (Identifier)</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Building className="h-4.5 w-4.5 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
                    </div>
                    <input
                      type="text"
                      required
                      value={tenantId}
                      onChange={(e) => setTenantId(e.target.value)}
                      className="block w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-slate-900 text-sm font-medium transition-all outline-none"
                      placeholder="e.g. sela-farma"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 ml-1">Nama Apotek</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Building className="h-4.5 w-4.5 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
                    </div>
                    <input
                      type="text"
                      required
                      value={tenantName}
                      onChange={(e) => setTenantName(e.target.value)}
                      className="block w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-slate-900 text-sm font-medium transition-all outline-none"
                      placeholder="e.g. Apotek Sela Farma"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 ml-1">No. HP / Telepon</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Phone className="h-4.5 w-4.5 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
                    </div>
                    <input
                      type="text"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="block w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-slate-900 text-sm font-medium transition-all outline-none"
                      placeholder="e.g. 08123456789"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 ml-1">Alamat Apotek Pusat</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <MapPin className="h-4.5 w-4.5 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
                    </div>
                    <input
                      type="text"
                      required
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="block w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-slate-900 text-sm font-medium transition-all outline-none"
                      placeholder="e.g. Jl. Raya Apotek No. 10"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-5 rounded-3xl space-y-4 border border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">Data Owner & Kredensial</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 ml-1">Nama Lengkap Owner</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <UserIcon className="h-4.5 w-4.5 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
                    </div>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="block w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-slate-900 text-sm font-medium transition-all outline-none"
                      placeholder="e.g. Sela Latipudin"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 ml-1">Email</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Mail className="h-4.5 w-4.5 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-slate-900 text-sm font-medium transition-all outline-none"
                      placeholder="e.g. sela@example.com"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 ml-1">Username Admin</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <UserIcon className="h-4.5 w-4.5 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
                    </div>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="block w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-slate-900 text-sm font-medium transition-all outline-none"
                      placeholder="e.g. sela_admin"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 ml-1">Password</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Lock className="h-4.5 w-4.5 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
                    </div>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-slate-900 text-sm font-medium transition-all outline-none"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading || !!success}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-bold py-3.5 rounded-2xl shadow-xl shadow-emerald-200/50 transition-all flex justify-center items-center gap-3 text-sm mt-3"
            >
              {loading ? (
                <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <UserPlus className="w-4.5 h-4.5" />
                  Daftar Sekarang
                </>
              )}
            </motion.button>
          </form>

          <div className="text-center pt-2">
            <p className="text-xs text-slate-500 font-medium">
              Sudah memiliki akun?{' '}
              <button 
                onClick={() => navigate('/login')} 
                className="text-emerald-600 font-bold hover:underline"
              >
                Masuk ke Apotek
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
