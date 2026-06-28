import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  ShoppingBag, 
  Package, 
  BarChart3, 
  Users, 
  ShieldCheck, 
  Zap,
  ArrowRight,
  CheckCircle2,
  LayoutDashboard
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import heroImage from '../assets/hero-premium.png';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.6, ease: "easeOut" }
    }
  };

  const features = [
    {
      icon: <ShoppingBag className="w-6 h-6 text-emerald-600" />,
      title: "Point of Sale (POS)",
      description: "Transaksi cepat dan mudah dengan integrasi stok otomatis dan manajemen kasir."
    },
    {
      icon: <Package className="w-6 h-6 text-emerald-500" />,
      title: "Manajemen Inventaris",
      description: "Lacak stok, batch, dan tanggal kadaluarsa obat secara real-time di semua cabang."
    },
    {
      icon: <BarChart3 className="w-6 h-6 text-amber-600" />,
      title: "Laporan Keuangan",
      description: "Analisis laba rugi, perputaran stok, dan performa penjualan dengan dashboard interaktif."
    },
    {
      icon: <Users className="w-6 h-6 text-purple-600" />,
      title: "Manajemen Pengguna",
      description: "Kontrol hak akses untuk Admin, Owner, Kasir, dan Staff dengan sistem keamanan berlapis."
    }
  ];

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 overflow-x-hidden">
      {/* Decorative Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div 
          className="absolute -top-24 -left-24 w-96 h-96 bg-emerald-50 rounded-full blur-3xl opacity-60"
        />
        <div 
          className="absolute top-1/2 -right-24 w-80 h-80 bg-emerald-50 rounded-full blur-3xl opacity-50"
        />
      </div>

      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200">
                <LayoutDashboard className="text-white w-6 h-6" />
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-emerald-800">
                Grapi
              </span>
            </div>
            
            <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
              <a href="#features" className="hover:text-emerald-600 transition-colors">Fitur</a>
              <a href="#about" className="hover:text-emerald-600 transition-colors">Tentang</a>
              <a href="#pricing" className="hover:text-emerald-600 transition-colors">Harga</a>
              <Button 
                variant="outline" 
                onClick={() => navigate('/login')}
                className="border-emerald-600 text-emerald-600 hover:bg-emerald-50"
              >
                Masuk
              </Button>
              <Button 
                onClick={() => navigate('/login')}
                className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-100"
              >
                Coba Sekarang
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={containerVariants}
              className="space-y-8"
            >
              <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-bold uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5" />
                Solusi Farmasi Modern #1 di Indonesia
              </motion.div>
              
              <motion.h1 variants={itemVariants} className="text-5xl lg:text-7xl font-extrabold text-slate-900 leading-[1.1]">
                Kelola Apotek Anda <br />
                <span className="text-emerald-600">Lebih Cerdas.</span>
              </motion.h1>
              
              <motion.p variants={itemVariants} className="text-lg text-slate-600 leading-relaxed max-w-xl">
                Grapi adalah platform manajemen apotek modular yang membantu Anda mengotomatisasi inventaris, mempercepat transaksi kasir, dan memberikan laporan akurat secara real-time.
              </motion.p>
              
              <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg"
                  onClick={() => navigate('/login')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-6 rounded-2xl text-lg shadow-xl shadow-emerald-200/50 group"
                >
                  Mulai Sekarang
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button 
                  size="lg"
                  variant="outline"
                  className="px-8 py-6 rounded-2xl text-lg border-slate-200 hover:bg-slate-50"
                >
                  Lihat Demo
                </Button>
              </motion.div>

              <motion.div variants={itemVariants} className="flex items-center gap-6 pt-4">
                <div className="flex -space-x-3">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-400">
                      U{i}
                    </div>
                  ))}
                </div>
                <p className="text-sm text-slate-500">
                  Bergabung dengan <span className="font-bold text-slate-900">500+</span> apotek lainnya
                </p>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8, x: 50 }}
              whileInView={{ opacity: 1, scale: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="relative"
            >
              <div className="absolute inset-0 bg-emerald-500/10 rounded-3xl blur-3xl -z-10" />
              <img 
                src={heroImage} 
                alt="Grapi Dashboard Preview" 
                className="w-full h-auto rounded-3xl shadow-2xl border border-white/50"
              />
              
              {/* Floating Badge */}
              <motion.div 
                animate={{ y: [0, -15, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -bottom-6 -left-6 bg-white p-4 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-3"
              >
                <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center">
                  <Zap className="text-emerald-600 w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Auto-Stock Update</p>
                  <p className="text-sm font-bold text-slate-900">Real-time Sync</p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-32 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
            <h2 className="text-emerald-600 font-bold uppercase tracking-widest text-sm">Fitur Unggulan</h2>
            <h3 className="text-4xl font-extrabold text-slate-900">Segala yang Anda Butuhkan Untuk Mengelola Apotek</h3>
            <p className="text-slate-600">Platform kami dirancang khusus untuk memenuhi kebutuhan operasional apotek modern, dari manajemen stok hingga kepatuhan regulasi.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, idx) => (
              <motion.div
                key={idx}
                whileHover={{ y: -10 }}
                className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300"
              >
                <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mb-6">
                  {feature.icon}
                </div>
                <h4 className="text-xl font-bold text-slate-900 mb-4">{feature.title}</h4>
                <p className="text-slate-600 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section / Social Proof */}
      <section id="about" className="py-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div className="order-2 lg:order-1 relative">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="bg-emerald-600 h-64 rounded-3xl flex flex-col justify-end p-6 text-white">
                    <p className="text-4xl font-bold">99.9%</p>
                    <p className="text-sm opacity-80 font-medium">Uptime Server</p>
                  </div>
                  <div className="bg-slate-100 h-48 rounded-3xl p-6 flex flex-col justify-center gap-4">
                    <CheckCircle2 className="text-emerald-600 w-8 h-8" />
                    <p className="text-slate-800 font-bold">Terintegrasi Dengan BPJS</p>
                  </div>
                </div>
                <div className="space-y-4 pt-12">
                  <div className="bg-emerald-50 h-48 rounded-3xl p-6 flex flex-col justify-center gap-4">
                    <CheckCircle2 className="text-emerald-500 w-8 h-8" />
                    <p className="text-slate-800 font-bold">Laporan Pajak Otomatis</p>
                  </div>
                  <div className="bg-amber-50 h-64 rounded-3xl p-6 flex flex-col justify-end text-amber-900">
                    <p className="text-4xl font-bold">15rb+</p>
                    <p className="text-sm opacity-80 font-medium">Transaksi Harian</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="order-1 lg:order-2 space-y-8">
              <h2 className="text-emerald-600 font-bold uppercase tracking-widest text-sm">Mengapa Grapi?</h2>
              <h3 className="text-4xl font-extrabold text-slate-900 leading-tight">Membangun Masa Depan Farmasi Digital</h3>
              <p className="text-slate-600 leading-relaxed">
                Kami mengerti bahwa mengelola apotek memiliki tantangan tersendiri—mulai dari manajemen ribuan SKU hingga pelacakan tanggal kadaluarsa yang kritis. Grapi hadir dengan filosofi "Efisien & Akurat", memastikan setiap data yang Anda masukkan dapat dipertanggungjawabkan.
              </p>
              
              <ul className="space-y-4">
                {[
                  "Keamanan data setara standar perbankan",
                  "Mendukung multi-cabang (Centralized Database)",
                  "Pelatihan gratis untuk staff apotek Anda",
                  "Dukungan teknis 24/7 via WhatsApp"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-800 font-medium">
                    <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="text-emerald-600 w-4 h-4" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>

              <Button 
                variant="ghost" 
                className="text-emerald-600 font-bold p-0 hover:bg-transparent hover:text-emerald-700 group"
              >
                Pelajari Lebih Lanjut 
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Comparison Section */}
      <section id="pricing" className="py-32 bg-slate-50/50 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
            <h2 className="text-emerald-600 font-bold uppercase tracking-widest text-sm">Paket Harga</h2>
            <h3 className="text-4xl font-extrabold text-slate-900">Pilihan Paket Langganan Sesuai Kebutuhan Apotek Anda</h3>
            <p className="text-slate-600">Investasi hemat dengan fitur terlengkap untuk membantu digitalisasi operasional apotek Anda.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 items-stretch">
            {/* Basic Plan */}
            <motion.div 
              whileHover={{ y: -8 }}
              className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-between relative overflow-hidden group"
            >
              <div className="space-y-6">
                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-slate-400">Apotek Mandiri</span>
                  <h4 className="text-2xl font-black text-slate-800 mt-1">Paket BASIC</h4>
                  <p className="text-xs text-slate-400 mt-1">Cocok untuk apotek tunggal skala kecil/menengah.</p>
                </div>
                
                <div className="flex items-baseline gap-1 text-slate-800">
                  <span className="text-sm font-extrabold">Rp</span>
                  <span className="text-4xl font-black">180.000</span>
                  <span className="text-xs text-slate-400 font-semibold">/ bulan</span>
                </div>

                <div className="border-t border-slate-50 pt-6 space-y-4">
                  <div className="flex items-center gap-2 text-xs font-extrabold text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Maksimal 1 Cabang</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-extrabold text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Maksimal 2 User (Owner + Kasir)</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>POS Kasir Retail Standar</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Inventori & Stok Dasar</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Laporan Penjualan Dasar</span>
                  </div>
                </div>
              </div>

              <div className="pt-8">
                <Button 
                  onClick={() => navigate('/login')}
                  className="w-full h-12 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold rounded-xl transition-all"
                >
                  Coba Gratis 14 Hari
                </Button>
              </div>
            </motion.div>

            {/* Professional Plan (Popular Option) */}
            <motion.div 
              whileHover={{ y: -8 }}
              className="bg-white p-8 rounded-[2rem] border-2 border-emerald-500 shadow-xl shadow-emerald-500/5 flex flex-col justify-between relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[9px] font-black uppercase tracking-widest px-4 py-1.5 rounded-bl-2xl">
                Terpopuler ⭐
              </div>

              <div className="space-y-6">
                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-600">Apotek + Gudang</span>
                  <h4 className="text-2xl font-black text-slate-800 mt-1">Paket PROFESSIONAL</h4>
                  <p className="text-xs text-slate-400 mt-1">Sangat direkomendasikan untuk apotek dengan satu gudang terpisah.</p>
                </div>
                
                <div className="flex items-baseline gap-1 text-emerald-600">
                  <span className="text-sm font-extrabold">Rp</span>
                  <span className="text-4xl font-black">300.000</span>
                  <span className="text-xs text-emerald-500/80 font-semibold">/ bulan</span>
                </div>

                <div className="border-t border-slate-50 pt-6 space-y-4">
                  <div className="flex items-center gap-2 text-xs font-extrabold text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Maksimal 2 Cabang (Apotek + Gudang Pusat)</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-extrabold text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Maksimal 5 User (Owner, Kasir, Gudang, Admin)</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Transfer Stok Antar Cabang (Atomik)</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Laporan Komparasi Cabang Visual</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Sistem Shift Kasir Komplet</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Semua Fitur Paket Basic</span>
                  </div>
                </div>
              </div>

              <div className="pt-8">
                <Button 
                  onClick={() => navigate('/login')}
                  className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl shadow-lg shadow-emerald-200/50 transition-all"
                >
                  Mulai Langganan
                </Button>
              </div>
            </motion.div>

            {/* Enterprise Plan */}
            <motion.div 
              whileHover={{ y: -8 }}
              className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-between relative overflow-hidden group"
            >
              <div className="space-y-6">
                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-slate-400">Jaringan Apotek</span>
                  <h4 className="text-2xl font-black text-slate-800 mt-1">Paket ENTERPRISE</h4>
                  <p className="text-xs text-slate-400 mt-1">Untuk apotek skala besar dengan banyak cabang.</p>
                </div>
                
                <div className="flex items-baseline gap-1 text-slate-800">
                  <span className="text-sm font-extrabold">Rp</span>
                  <span className="text-4xl font-black">500.000</span>
                  <span className="text-xs text-slate-400 font-semibold">/ bulan</span>
                </div>

                <div className="border-t border-slate-50 pt-6 space-y-4">
                  <div className="flex items-center gap-2 text-xs font-extrabold text-emerald-600">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Unlimited Cabang (Tanpa Batas)</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-extrabold text-emerald-600">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Unlimited User (Tanpa Batas)</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Laporan Analisis Laba Rugi Komprehensif</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Dukungan Prioritas WhatsApp 24/7</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Semua Fitur Paket Professional</span>
                  </div>
                </div>
              </div>

              <div className="pt-8">
                <Button 
                  onClick={() => navigate('/login')}
                  className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white font-extrabold rounded-xl transition-all"
                >
                  Hubungi Penjualan
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Footer Section */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            whileHover={{ scale: 1.01 }}
            className="bg-emerald-950 rounded-[3rem] p-12 lg:p-20 text-center space-y-8 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-600/20 blur-[100px] rounded-full" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 blur-[100px] rounded-full" />
            
            <h3 className="text-4xl lg:text-5xl font-bold text-white leading-tight">Siap Mendigitalkan <br /> Apotek Anda?</h3>
            <p className="text-emerald-100/70 max-w-xl mx-auto">Daftar sekarang dan nikmati gratis penggunaan selama 14 hari. Tanpa perlu kartu kredit.</p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button 
                size="lg"
                onClick={() => navigate('/login')}
                className="bg-white text-emerald-950 hover:bg-emerald-50 px-10 py-7 rounded-2xl text-lg font-bold shadow-xl group"
              >
                Coba Gratis Sekarang
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <footer className="py-12 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex justify-center items-center gap-2 mb-6">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
              <LayoutDashboard className="text-white w-5 h-5" />
            </div>
            <span className="text-lg font-bold text-slate-800">Grapi</span>
          </div>
          <p className="text-slate-400 text-sm">&copy; 2026 Grapi Pharma Management. Dibuat dengan cinta untuk Indonesia.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
