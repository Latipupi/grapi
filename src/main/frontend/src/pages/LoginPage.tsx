import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { setCredentials } from '../store/authSlice';
import api from '../api/api';
import { 
  LogIn, 
  Lock, 
  User as UserIcon, 
  AlertCircle, 
  LayoutDashboard, 
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  Eye,
  EyeOff
} from 'lucide-react';

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/login', { username, password });
      dispatch(setCredentials(response.data));
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Username atau password salah');
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
              Partner Terpercaya <br />
              <span className="text-emerald-400">Apotek Anda.</span>
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-emerald-100/70 text-lg leading-relaxed"
            >
              Kelola stok obat, pantau transaksi kasir, dan lihat laporan keuangan dalam satu platform terintegrasi yang aman dan mudah digunakan.
            </motion.p>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-2 gap-6"
          >
            {[
              { icon: <ShieldCheck className="w-5 h-5" />, text: "Data Terenkripsi" },
              { icon: <CheckCircle2 className="w-5 h-5" />, text: "Multi-Cabang" }
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

      {/* Right Pane - Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center p-8 sm:p-12 lg:p-20 relative">
        <motion.button
          whileHover={{ x: -5 }}
          onClick={() => navigate('/')}
          className="absolute top-8 left-8 lg:top-12 lg:left-12 flex items-center gap-2 text-slate-500 hover:text-emerald-600 font-medium transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Kembali ke Home
        </motion.button>

        <div className="max-w-md w-full mx-auto space-y-10">
          <div className="space-y-2 text-center lg:text-left">
            <motion.h1 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl font-extrabold text-slate-900 tracking-tight"
            >
              Selamat Datang.
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-slate-500 font-medium"
            >
              Silakan masuk ke akun Anda untuk melanjutkan.
            </motion.p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
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
            </AnimatePresence>

            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Username</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <UserIcon className="h-5 w-5 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
                  </div>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="block w-full pl-12 pr-4 py-4 bg-slate-50 border-0 rounded-2xl ring-1 ring-slate-200 focus:ring-2 focus:ring-emerald-500 text-slate-900 font-medium transition-all outline-none"
                    placeholder="Masukkan username"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-sm font-bold text-slate-700">Password</label>
                  <button type="button" className="text-xs font-bold text-emerald-600 hover:text-emerald-700">Lupa Password?</button>
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-12 pr-12 py-4 bg-slate-50 border-0 rounded-2xl ring-1 ring-slate-200 focus:ring-2 focus:ring-emerald-500 text-slate-900 font-medium transition-all outline-none"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-emerald-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-bold py-4 rounded-2xl shadow-xl shadow-emerald-200/50 transition-all flex justify-center items-center gap-3"
            >
              {loading ? (
                <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  Masuk Sekarang
                </>
              )}
            </motion.button>
          </form>

          <div className="text-center pt-8">
            <p className="text-sm text-slate-500 font-medium">
              Belum punya akun?{' '}
              <button 
                type="button"
                onClick={() => navigate('/register')} 
                className="text-emerald-600 font-bold hover:underline"
              >
                Daftar Apotek Baru
              </button>
            </p>
          </div>
        </div>

        <div className="mt-auto pt-10 text-center">
          <p className="text-xs text-slate-300 font-medium">
            &copy; 2026 Grapi Pharma Management. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
