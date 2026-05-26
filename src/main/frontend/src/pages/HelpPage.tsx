import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Printer, 
  BookOpen, 
  User, 
  Store, 
  Package, 
  ShoppingCart, 
  ShoppingBag, 
  CreditCard, 
  FileText, 
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Info,
  Calendar,
  Truck
} from 'lucide-react';
import { Button } from '../components/ui/Button';

const HelpPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('hak-akses');
  const [searchQuery, setSearchQuery] = useState('');

  const chapters = [
    { 
      id: 'hak-akses', 
      label: '1. Hak Akses (Roles)', 
      icon: User,
      color: 'text-blue-600 bg-blue-50 border-blue-100',
      activeColor: 'bg-blue-600 text-white shadow-blue-100'
    },
    { 
      id: 'onboarding', 
      label: '2. Setup Awal Apotek', 
      icon: Store,
      color: 'text-purple-600 bg-purple-50 border-purple-100',
      activeColor: 'bg-purple-600 text-white shadow-purple-100'
    },
    { 
      id: 'master-data', 
      label: '3. Master Data (UoM)', 
      icon: Package,
      color: 'text-amber-600 bg-amber-50 border-amber-100',
      activeColor: 'bg-amber-600 text-white shadow-amber-100'
    },
    { 
      id: 'pengadaan', 
      label: '4. Pengadaan (Auto-Reorder)', 
      icon: ShoppingBag,
      color: 'text-rose-600 bg-rose-50 border-rose-100',
      activeColor: 'bg-rose-600 text-white shadow-rose-100'
    },
    { 
      id: 'inventori', 
      label: '5. Stok Kontrol & FEFO', 
      icon: FileText,
      color: 'text-indigo-600 bg-indigo-50 border-indigo-100',
      activeColor: 'bg-indigo-600 text-white shadow-indigo-100'
    },
    { 
      id: 'kasir-pos', 
      label: '6. Kasir POS & Shift', 
      icon: ShoppingCart,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
      activeColor: 'bg-emerald-600 text-white shadow-emerald-100'
    },
    { 
      id: 'laporan', 
      label: '7. Analisis & Laba Rugi', 
      icon: CreditCard,
      color: 'text-teal-600 bg-teal-50 border-teal-100',
      activeColor: 'bg-teal-600 text-white shadow-teal-100'
    },
    { 
      id: 'troubleshoot', 
      label: '8. Troubleshooting', 
      icon: AlertCircle,
      color: 'text-slate-600 bg-slate-50 border-slate-100',
      activeColor: 'bg-slate-700 text-white shadow-slate-100'
    },
  ];

  const handlePrint = () => {
    window.print();
  };

  const filteredChapters = chapters.filter(ch => 
    ch.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-16 print:p-0 print:max-w-full">
      {/* Header (Hidden in Print) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6 print:hidden">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-emerald-600" />
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Pusat Bantuan & Panduan</h1>
          </div>
          <p className="text-slate-500 mt-1.5 text-sm">Pelajari operasional lengkap sistem informasi apotek modern Grapi secara mandiri.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            onClick={handlePrint}
            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 h-11 px-5 rounded-xl font-bold shadow-sm flex items-center gap-2 transition-all"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            Cetak Panduan Fisik (SOP)
          </Button>
        </div>
      </div>

      {/* Kop Cetak Kustom (Only visible during print) */}
      <div className="hidden print:block text-center border-b-2 border-slate-800 pb-4 mb-8">
        <h1 className="text-2xl font-black text-slate-900 uppercase">PANDUAN OPERASIONAL RESMI APOTEK</h1>
        <p className="text-sm text-slate-600 mt-1">Platform Grapi Modern Pharmacy SaaS System v1.0</p>
        <p className="text-xs text-slate-400 mt-0.5">Dokumen ini merupakan SOP resmi penggunaan software apotek untuk seluruh staf.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Navigation Sidebar (Hidden in Print) */}
        <aside className="w-full lg:w-72 space-y-2 flex-shrink-0 print:hidden">
          {/* Search bar */}
          <div className="relative mb-4">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari topik panduan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium bg-white"
            />
          </div>

          <div className="space-y-1.5">
            {filteredChapters.map((ch) => {
              const Icon = ch.icon;
              const isActive = activeTab === ch.id;
              return (
                <button
                  key={ch.id}
                  onClick={() => setActiveTab(ch.id)}
                  className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl font-bold text-xs tracking-wide transition-all duration-200 ${
                    isActive 
                      ? ch.activeColor + ' shadow-md scale-[1.02]' 
                      : 'bg-white border border-slate-100 text-slate-600 hover:bg-slate-50/50 hover:text-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-lg ${isActive ? 'bg-white/20' : 'bg-slate-50'}`}>
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                    </div>
                    <span className="text-left">{ch.label.substring(3)}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 opacity-50" />
                </button>
              );
            })}
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100/50 space-y-2 mt-6">
            <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">Butuh bantuan darurat?</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">Sales representative PBF atau sistem billing SaaS bermasalah? Hubungi Admin Grapi via WhatsApp:</p>
            <a 
              href="https://wa.me/628123456789" 
              target="_blank" 
              rel="noreferrer"
              className="inline-flex w-full items-center justify-center py-2 bg-emerald-50 border border-emerald-100 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-xl transition-all"
            >
              📞 Hubungi Kami (WA)
            </a>
          </div>
        </aside>

        {/* Content Area */}
        <div className="flex-1 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden print:border-none print:shadow-none print:bg-transparent w-full">
          <div className="p-6 md:p-10 space-y-8 text-left print:p-0">
            <AnimatePresence mode="wait">
              {/* Tab 1: Hak Akses */}
              {activeTab === 'hak-akses' && (
                <motion.div
                  key="hak-akses"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  <div className="border-b border-slate-100 pb-4">
                    <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-bold tracking-wider uppercase border border-blue-100">Hak Akses Sistem</span>
                    <h2 className="text-2xl font-black text-slate-800 mt-3 flex items-center gap-2">
                      <User className="w-6 h-6 text-blue-600" />
                      Hak Akses & Peran Pengguna (User Roles)
                    </h2>
                  </div>

                  <p className="text-slate-600 text-sm leading-relaxed">
                    Sistem Grapi menerapkan kontrol keamanan ketat berbasis peran (*Role-Based Access Control / RBAC*). Setiap staf di apotek Anda hanya dapat mengakses menu yang relevan dengan tugas profesinya untuk mencegah kebocoran data dan manipulasi stok.
                  </p>

                  <div className="overflow-x-auto border border-slate-100 rounded-2xl shadow-sm bg-white">
                    <table className="w-full border-collapse text-left text-sm text-slate-600">
                      <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase border-b border-slate-100">
                        <tr>
                          <th className="px-6 py-4">Modul / Fitur</th>
                          <th className="px-4 py-4 text-center">Owner</th>
                          <th className="px-4 py-4 text-center">Apoteker (Staff)</th>
                          <th className="px-4 py-4 text-center">Kasir (Cashier)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white text-xs font-medium">
                        <tr className="hover:bg-slate-50/50">
                          <td className="px-6 py-4 font-bold text-slate-800">Kelola Pengaturan Apotek & Cabang</td>
                          <td className="px-4 py-4 text-center text-emerald-600 font-bold">🟢 Ya</td>
                          <td className="px-4 py-4 text-center text-rose-500">🔴 Tidak</td>
                          <td className="px-4 py-4 text-center text-rose-500">🔴 Tidak</td>
                        </tr>
                        <tr className="hover:bg-slate-50/50">
                          <td className="px-6 py-4 font-bold text-slate-800">Tambah / Edit Akun Pengguna</td>
                          <td className="px-4 py-4 text-center text-emerald-600 font-bold">🟢 Ya</td>
                          <td className="px-4 py-4 text-center text-rose-500">🔴 Tidak</td>
                          <td className="px-4 py-4 text-center text-rose-500">🔴 Tidak</td>
                        </tr>
                        <tr className="hover:bg-slate-50/50">
                          <td className="px-6 py-4 font-bold text-slate-800">Pendaftaran Produk Obat Baru</td>
                          <td className="px-4 py-4 text-center text-emerald-600 font-bold">🟢 Ya</td>
                          <td className="px-4 py-4 text-center text-emerald-600 font-bold">🟢 Ya</td>
                          <td className="px-4 py-4 text-center text-rose-500">🔴 Tidak</td>
                        </tr>
                        <tr className="hover:bg-slate-50/50">
                          <td className="px-6 py-4 font-bold text-slate-800">Buat Surat Pesanan (PO) & Terima Barang</td>
                          <td className="px-4 py-4 text-center text-emerald-600 font-bold">🟢 Ya</td>
                          <td className="px-4 py-4 text-center text-emerald-600 font-bold">🟢 Ya</td>
                          <td className="px-4 py-4 text-center text-rose-500">🔴 Tidak</td>
                        </tr>
                        <tr className="hover:bg-slate-50/50">
                          <td className="px-6 py-4 font-bold text-slate-800">Audit Stock Opname (Penyesuaian)</td>
                          <td className="px-4 py-4 text-center text-emerald-600 font-bold">🟢 Ya</td>
                          <td className="px-4 py-4 text-center text-emerald-600 font-bold">🟢 Ya</td>
                          <td className="px-4 py-4 text-center text-amber-500">🟡 Dibatasi *</td>
                        </tr>
                        <tr className="hover:bg-slate-50/50">
                          <td className="px-6 py-4 font-bold text-slate-800">Transaksi Kasir POS & Shift</td>
                          <td className="px-4 py-4 text-center text-emerald-600 font-bold">🟢 Ya</td>
                          <td className="px-4 py-4 text-center text-emerald-600 font-bold">🟢 Ya</td>
                          <td className="px-4 py-4 text-center text-emerald-600 font-bold">🟢 Ya</td>
                        </tr>
                        <tr className="hover:bg-slate-50/50">
                          <td className="px-6 py-4 font-bold text-slate-800">Laporan Keuangan & Laba Rugi</td>
                          <td className="px-4 py-4 text-center text-emerald-600 font-bold">🟢 Ya</td>
                          <td className="px-4 py-4 text-center text-rose-500">🔴 Tidak</td>
                          <td className="px-4 py-4 text-center text-rose-500">🔴 Tidak</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex gap-3 text-sm text-blue-700">
                    <Info className="w-5 h-5 shrink-0 text-blue-600 mt-0.5" />
                    <div>
                      <span className="font-bold">Ketentuan Kasir Dibatasi (*):</span> Kasir hanya diperbolehkan melihat persediaan stok aktif. Pengajuan koreksi Stock Opname (jika terdapat obat pecah atau hilang) wajib diajukan ke Apoteker/Owner untuk disetujui guna mencegah kecurangan inventori di meja kasir.
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Tab 2: Onboarding */}
              {activeTab === 'onboarding' && (
                <motion.div
                  key="onboarding"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  <div className="border-b border-slate-100 pb-4">
                    <span className="px-3 py-1 bg-purple-50 text-purple-600 rounded-full text-[10px] font-bold tracking-wider uppercase border border-purple-100">Setup Apotek Baru</span>
                    <h2 className="text-2xl font-black text-slate-800 mt-3 flex items-center gap-2">
                      <Store className="w-6 h-6 text-purple-600" />
                      Langkah Awal Onboarding Apotek Baru
                    </h2>
                  </div>

                  <div className="space-y-6 relative border-l border-slate-100 pl-6 ml-3">
                    <div className="relative">
                      <div className="absolute -left-[31px] top-1 w-4 h-4 bg-purple-600 rounded-full border-4 border-white shadow" />
                      <h3 className="font-bold text-slate-800 text-sm">Langkah 1: Registrasi Tenant Baru</h3>
                      <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                        Klik <strong>Daftar Apotek Baru</strong> di halaman depan, lalu tentukan <strong>ID Apotek (Tenant ID)</strong> unik Anda (misal: <code>selafarma</code>) yang akan menjadi pengenal data terisolasi Anda di server. Pilih paket langganan yang paling sesuai.
                      </p>
                    </div>

                    <div className="relative">
                      <div className="absolute -left-[31px] top-1 w-4 h-4 bg-purple-600 rounded-full border-4 border-white shadow" />
                      <h3 className="font-bold text-slate-800 text-sm">Langkah 2: Menunggu Aktivasi SaaS</h3>
                      <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                        Setelah registrasi, akun berstatus <strong>PENDING</strong>. Pengelola apotek diwajibkan melakukan konfirmasi atau menyelesaikan verifikasi pembayaran billing untuk mengaktifkan lisensi apotek.
                      </p>
                    </div>

                    <div className="relative">
                      <div className="absolute -left-[31px] top-1 w-4 h-4 bg-purple-600 rounded-full border-4 border-white shadow" />
                      <h3 className="font-bold text-slate-800 text-sm">Langkah 3: Lengkapi Branding Bisnis (Settings)</h3>
                      <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                        Navigasikan ke menu <strong>Pengaturan (Settings)</strong>. Masukkan Nama Apotek, Email Bisnis, Telepon, NPWP, dan Alamat Lengkap. Informasi ini akan langsung tercetak di kop struk termal belanja kasir dan header Surat Pesanan (PO).
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-purple-50 border border-purple-100 rounded-2xl flex gap-3 text-sm text-purple-700">
                    <CheckCircle2 className="w-5 h-5 shrink-0 text-purple-600 mt-0.5" />
                    <div>
                      <span className="font-bold">Keamanan Data Multitenancy:</span> Data apotek Anda diisolasi secara logis dan fisik di database server. Karyawan dari apotek lain di platform Grapi tidak akan pernah bisa melihat transaksi atau stok obat Anda.
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Tab 3: Master Data */}
              {activeTab === 'master-data' && (
                <motion.div
                  key="master-data"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  <div className="border-b border-slate-100 pb-4">
                    <span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[10px] font-bold tracking-wider uppercase border border-amber-100">Aturan Satuan Dasar</span>
                    <h2 className="text-2xl font-black text-slate-800 mt-3 flex items-center gap-2">
                      <Package className="w-6 h-6 text-amber-600" />
                      Master Data & Aturan Emas Satuan Dasar (Base Unit)
                    </h2>
                  </div>

                  <div className="bg-rose-50 border border-rose-100 text-rose-700 p-6 rounded-2xl space-y-2">
                    <h3 className="text-sm font-black uppercase flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-rose-600" />
                      ⚠️ ATURAN EMAS: SIMPAN DALAM SATUAN TERKECIL (BASE UNIT)
                    </h3>
                    <p className="text-xs leading-relaxed">
                      Grapi menyimpan seluruh saldo inventori di dalam database menggunakan <strong>satuan terkecil</strong> (seperti tablet, kapsul, botol, atau ampul). Jangan pernah mendaftarkan produk dengan satuan terbesar (Box atau Strip) sebagai basis perhitungan database.
                    </p>
                    <div className="bg-white/80 p-3.5 rounded-xl text-xs text-rose-900 border border-rose-100 mt-3 space-y-1 font-mono">
                      <p className="font-bold">Contoh Konversi Obat Paracetamol:</p>
                      <p>• 1 Box = 10 Strip</p>
                      <p>• 1 Strip = 10 Tablet</p>
                      <p className="text-emerald-700 font-bold">👉 Satuan Dasar Terkecil (Base Unit) = TABLET</p>
                      <p className="text-slate-500 mt-1">Saat memesan masuk 2 Box, sistem akan melipatgandakan dan mencatat stok masuk sebanyak 200 Tablet. Kasir akan mengecer dalam unit Tablet.</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-slate-800">Alur Pengisian Master Data:</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100/50 space-y-1.5 text-center">
                        <span className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold text-sm inline-flex items-center justify-center">1</span>
                        <h4 className="font-bold text-slate-800 text-xs">Petakan Kategori</h4>
                        <p className="text-[10px] text-slate-400 leading-relaxed">Kelompokkan obat: Bebas, Bebas Terbatas, Keras, Narkotika, Alkes.</p>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100/50 space-y-1.5 text-center">
                        <span className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold text-sm inline-flex items-center justify-center">2</span>
                        <h4 className="font-bold text-slate-800 text-xs">Petakan Supplier (PBF)</h4>
                        <p className="text-[10px] text-slate-400 leading-relaxed">Daftarkan PBF distributor tempat Anda belanja obat beserta nomor sales.</p>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100/50 space-y-1.5 text-center">
                        <span className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold text-sm inline-flex items-center justify-center">3</span>
                        <h4 className="font-bold text-slate-800 text-xs">Daftarkan Produk Obat</h4>
                        <p className="text-[10px] text-slate-400 leading-relaxed">Isi SKU/Barcode kemasan, batas stok minimal, HPP beli, dan harga jual retail.</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Tab 4: Pengadaan */}
              {activeTab === 'pengadaan' && (
                <motion.div
                  key="pengadaan"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  <div className="border-b border-slate-100 pb-4">
                    <span className="px-3 py-1 bg-rose-50 text-rose-600 rounded-full text-[10px] font-bold tracking-wider uppercase border border-rose-100">Analisis Belanja</span>
                    <h2 className="text-2xl font-black text-slate-800 mt-3 flex items-center gap-2">
                      <ShoppingBag className="w-6 h-6 text-rose-600" />
                      Sistem Pengadaan Barang & Auto-Reorder Pintar
                    </h2>
                  </div>

                  <p className="text-slate-600 text-sm leading-relaxed">
                    Grapi memotong birokrasi pengecekan gudang manual dengan algoritma **Auto-Reorder** yang menghitung performa transaksi kasir Anda secara dinamis.
                  </p>

                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
                    <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                      <Truck className="w-5 h-5 text-rose-600" />
                      Bagaimana Sistem Auto-Reorder Bekerja?
                    </h3>
                    <div className="text-xs text-slate-600 space-y-2.5">
                      <p>
                        1. <strong>Sales Velocity:</strong> Sistem mendata total kuantitas obat yang terjual di kasir selama 30 hari ke belakang, lalu membaginya dengan angka 30 untuk menemukan rata-rata penjualan harian.
                      </p>
                      <p>
                        2. <strong>Reorder Point (ROP):</strong> Peringatan ROP dipicu otomatis jika stok di gudang saat ini kurang dari atau sama dengan:
                      </p>
                      <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-xl text-center text-sm font-bold text-emerald-800 font-mono">
                        ROP = (Rata-rata Penjualan Harian × 3 Hari Lead Time) + Stok Pengaman Minimum
                      </div>
                      <p>
                        3. <strong>Saran Jumlah Belanja:</strong> Sistem otomatis menyarankan jumlah pesanan agar persediaan Anda terisi aman untuk kebutuhan 30 hari ke depan, namun Anda tetap bebas mengubah jumlah tersebut secara fleksibel sebelum mengirim PO.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-sm font-black text-slate-700 uppercase">Alur Terima Fisik Barang (Goods Receipt):</h3>
                    <div className="border border-slate-100 rounded-2xl p-5 bg-white space-y-3 text-xs">
                      <div className="flex gap-3">
                        <div className="w-6 h-6 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 font-bold">1</div>
                        <div>
                          <p className="font-bold text-slate-800">Ketik Nomor Faktur / Invoice Fisik</p>
                          <p className="text-slate-400 mt-0.5">Sesuai dengan lembar kertas faktur dari pengirim PBF.</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <div className="w-6 h-6 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 font-bold">2</div>
                        <div>
                          <p className="font-bold text-slate-800">Catat Nomor Batch Sediaan (Wajib)</p>
                          <p className="text-slate-400 mt-0.5">Penting untuk pelacakan batch obat (BPOM) jika terjadi penarikan obat rusak.</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <div className="w-6 h-6 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 font-bold">3</div>
                        <div>
                          <p className="font-bold text-slate-800">Isi Tanggal Kedaluwarsa / Expire Date (Wajib)</p>
                          <p className="text-slate-400 mt-0.5">Sebagai basis data utama pemotongan inventori FEFO.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Tab 5: Inventori */}
              {activeTab === 'inventori' && (
                <motion.div
                  key="inventori"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  <div className="border-b border-slate-100 pb-4">
                    <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-bold tracking-wider uppercase border border-indigo-100">Kepatuhan Farmasi</span>
                    <h2 className="text-2xl font-black text-slate-800 mt-3 flex items-center gap-2">
                      <FileText className="w-6 h-6 text-indigo-600" />
                      Manajemen Inventori & Kendali FEFO
                    </h2>
                  </div>

                  <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex gap-3 text-sm text-indigo-700">
                    <Info className="w-5 h-5 shrink-0 text-indigo-600 mt-0.5" />
                    <div>
                      <span className="font-bold">Apa itu FEFO (First Expired First Out)?</span> Aturan farmasi wajib di mana obat yang memiliki masa kedaluwarsa paling dekat harus dikeluarkan/dijual terlebih dahulu guna menekan kerugian obat terbuang.
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-slate-800">Fitur Stok Utama Grapi:</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                        <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-indigo-600" />
                          FEFO Engine Otomatis
                        </h4>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          Kasir tidak perlu memilih nomor batch manual saat bertransaksi di POS. Sistem backend otomatis memilih batch obat terdekat kedaluwarsanya di database untuk dikurangi stoknya saat pembayaran selesai.
                        </p>
                      </div>
                      <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                        <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-indigo-600" />
                          Mutasi Kartu Stok (Stock Movements)
                        </h4>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          Setiap penambahan atau pengurangan obat mencatat riwayat log kronologis (Mutasi Masuk/Keluar) lengkap dengan nomor referensi faktur/penjualan untuk transparansi audit.
                        </p>
                      </div>
                      <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                        <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-indigo-600" />
                          Transfer Stok Antar Cabang
                        </h4>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          Pindahkan stok obat dari cabang yang sepi ke cabang yang ramai transaksi secara legal dan tercatat sistemik beserta nomor batch obat yang dipindahkan.
                        </p>
                      </div>
                      <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                        <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-indigo-600" />
                          Audit Stock Opname
                        </h4>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          Audit stok rak fisik bulanan. Masukkan kuantitas aktual, sistem mendeteksi selisih lebih/kurang serta mengoreksi stok sistem secara aman melalui wewenang Apoteker/Owner.
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Tab 6: Kasir POS */}
              {activeTab === 'kasir-pos' && (
                <motion.div
                  key="kasir-pos"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  <div className="border-b border-slate-100 pb-4">
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold tracking-wider uppercase border border-emerald-100">Meja Penjualan</span>
                    <h2 className="text-2xl font-black text-slate-800 mt-3 flex items-center gap-2">
                      <ShoppingCart className="w-6 h-6 text-emerald-600" />
                      Operasional Kasir POS (Point of Sales)
                    </h2>
                  </div>

                  <div className="bg-emerald-50/50 border border-emerald-100 p-5 rounded-2xl space-y-3">
                    <h3 className="font-bold text-emerald-800 text-sm flex items-center gap-1.5">
                      <Calendar className="w-5 h-5 text-emerald-600" />
                      Disiplin Rekonsiliasi Shift Kasir (Bebas Kebocoran)
                    </h3>
                    <p className="text-xs text-emerald-900/80 leading-relaxed">
                      Sistem Grapi mewajibkan kasir membuka dan menutup shift kerja secara ketat guna menekan kebocoran dana keuangan tunai di apotek:
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-emerald-950 mt-2">
                      <div className="bg-white/80 p-3 rounded-xl border border-emerald-100">
                        <p className="font-bold text-emerald-800">1. Pembukaan Shift (Cash In)</p>
                        <p className="mt-1 text-slate-500">Kasir wajib memasukkan jumlah <strong>Uang Modal Awal</strong> (kas kecil) yang tersedia di laci kas untuk kembalian pembeli sebelum memulai transaksi.</p>
                      </div>
                      <div className="bg-white/80 p-3 rounded-xl border border-emerald-100">
                        <p className="font-bold text-emerald-800">2. Penutupan Shift (Cash Out)</p>
                        <p className="mt-1 text-slate-500">Di akhir jam kerja, kasir menghitung manual seluruh fisik uang tunai di laci, lalu mengetik nominalnya untuk dicocokkan otomatis oleh sistem.</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-sm font-black text-slate-700 uppercase">Fitur Cepat di Layar Kasir:</h3>
                    <ul className="space-y-2.5 text-xs text-slate-600">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span><strong>Scan Barcode Cepat:</strong> Cukup tembakkan laser scanner ke kemasan obat, item langsung meluncur ke keranjang belanja kasir.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span><strong>Pencarian Multi-Kriteria:</strong> Ketik nama generik obat, SKU, atau kategori untuk pencarian manual super cepat.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span><strong>Kembalian Presisi:</strong> Masukkan jumlah uang tunai pelanggan, kasir menghitung nominal kembalian instan sehingga tidak ada kesalahan kembalian.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span><strong>Metode Non-Tunai:</strong> Dukungan QRIS, Transfer, dan Debit untuk merangkul era transaksi cashless.</span>
                      </li>
                    </ul>
                  </div>
                </motion.div>
              )}

              {/* Tab 7: Laporan */}
              {activeTab === 'laporan' && (
                <motion.div
                  key="laporan"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  <div className="border-b border-slate-100 pb-4">
                    <span className="px-3 py-1 bg-teal-50 text-teal-600 rounded-full text-[10px] font-bold tracking-wider uppercase border border-teal-100">Eksekutif Bisnis</span>
                    <h2 className="text-2xl font-black text-slate-800 mt-3 flex items-center gap-2">
                      <CreditCard className="w-6 h-6 text-teal-600" />
                      Laporan Keuangan & Analisis Laba Rugi Akurat
                    </h2>
                  </div>

                  <p className="text-slate-600 text-sm leading-relaxed">
                    Grapi menghadirkan modul keuangan standar akuntansi profesional yang mudah dipahami oleh pemilik usaha sekalipun tanpa latar belakang finansial.
                  </p>

                  <div className="bg-slate-50 border border-slate-100 p-6 rounded-2xl space-y-4">
                    <h3 className="font-bold text-slate-800 text-sm">Rumus Laba Rugi Bersih Apotek Grapi:</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3.5 bg-white rounded-xl border border-slate-100 text-xs">
                        <span className="font-bold text-slate-700">1. Pendapatan Kotor (Gross Revenue)</span>
                        <span className="text-slate-500 font-semibold">Total Nilai Penjualan di Kasir (POS)</span>
                      </div>
                      <div className="flex items-center justify-between p-3.5 bg-white rounded-xl border border-slate-100 text-xs">
                        <span className="font-bold text-slate-700">2. Harga Pokok Penjualan (HPP)</span>
                        <span className="text-slate-500 font-semibold">Akumulasi Harga Beli Asli Obat yang Terjual (FEFO Terpilih)</span>
                      </div>
                      <div className="flex items-center justify-between p-3.5 bg-emerald-50 rounded-xl border border-emerald-100 text-xs">
                        <span className="font-bold text-emerald-800">3. Laba Kotor (Gross Profit)</span>
                        <span className="text-emerald-800 font-bold">Pendapatan Kotor − Harga Pokok Penjualan (HPP)</span>
                      </div>
                      <div className="flex items-center justify-between p-3.5 bg-white rounded-xl border border-slate-100 text-xs">
                        <span className="font-bold text-slate-700">4. Beban Operasional (Expenses)</span>
                        <span className="text-slate-500 font-semibold">Biaya Operasional Non-Stok (Gaji Karyawan, Listrik, Sewa, dll.)</span>
                      </div>
                      <div className="flex items-center justify-between p-3.5 bg-emerald-600 rounded-xl text-white text-xs font-bold shadow-lg shadow-emerald-100">
                        <span>5. LABA BERSIH (Net Profit)</span>
                        <span>Laba Kotor − Beban Operasional (Expenses)</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Tab 8: Troubleshoot */}
              {activeTab === 'troubleshoot' && (
                <motion.div
                  key="troubleshoot"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  <div className="border-b border-slate-100 pb-4">
                    <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-[10px] font-bold tracking-wider uppercase border border-slate-200">Bantuan Mandiri</span>
                    <h2 className="text-2xl font-black text-slate-800 mt-3 flex items-center gap-2">
                      <AlertCircle className="w-6 h-6 text-slate-600" />
                      Troubleshooting & Solusi Kendala Umum
                    </h2>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 bg-white rounded-2xl border border-slate-100 space-y-2 shadow-sm text-xs">
                      <h4 className="font-bold text-rose-600 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-rose-500" />
                        Kendala: Transaksi POS Kasir gagal / Stok tidak mencukupi
                      </h4>
                      <p className="text-slate-500 leading-relaxed pl-3.5">
                        <strong>Solusi:</strong> Kuantitas obat di sistem bernilai kosong. Apoteker atau staf diwajibkan melakukan pencatatan penerimaan fisik barang (*Goods Receipt*) di menu pembelian untuk mengonfirmasi masuknya nomor batch obat, atau lakukan audit *Stock Opname* jika terdapat salah hitung stok awal.
                      </p>
                    </div>

                    <div className="p-4 bg-white rounded-2xl border border-slate-100 space-y-2 shadow-sm text-xs">
                      <h4 className="font-bold text-rose-600 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-rose-500" />
                        Kendala: Muncul error 404 saat memuat ulang (refresh) halaman di browser
                      </h4>
                      <p className="text-slate-500 leading-relaxed pl-3.5">
                        <strong>Solusi:</strong> Grapi dikemas sebagai *Single Executable JAR* untuk kenyamanan solo developer. Jika routing React Router Anda kehilangan konteks saat direfresh langsung dari browser, sistem filter *catch-all routing* internal akan menstabilkannya. Harap tidak menghapus filter routing ini di sisi Spring Boot MVC.
                      </p>
                    </div>

                    <div className="p-4 bg-white rounded-2xl border border-slate-100 space-y-2 shadow-sm text-xs">
                      <h4 className="font-bold text-rose-600 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-rose-500" />
                        Kendala: Selisih uang kasir saat melakukan tutup shift kerja
                      </h4>
                      <p className="text-slate-500 leading-relaxed pl-3.5">
                        <strong>Solusi:</strong> Biasanya kasir lupa mencatat pengeluaran operasional menggunakan kas laci (misal: bayar kurir/galon). Selalu disiplinkan kasir mencatat pengeluaran kasir di menu *Expenses* atau catat kas keluar sebelum shift ditutup untuk menghindari selisih pencocokan uang fisik.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpPage;
