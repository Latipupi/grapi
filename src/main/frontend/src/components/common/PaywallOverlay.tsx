import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../store/authSlice';
import type { RootState } from '../../store';
import { Button } from '../../components/ui/Button';
import { Lock, LogOut, Phone, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

const PaywallOverlay: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { billingStatus, subscriptionPlan, expiredAt, fullName, adminWhatsApp, tenantId } = useSelector(
    (state: RootState) => state.auth
  );

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const getPlanName = (plan: string | null) => {
    if (!plan) return 'FREE_TRIAL (Masa Percobaan)';
    if (plan === 'FREE_TRIAL') return 'FREE TRIAL (Uji Coba 14 Hari)';
    if (plan === 'BASIC_180K') return 'BASIC (Apotek Tunggal Rp 180k/bln)';
    if (plan === 'PRO_300K') return 'PROFESSIONAL (Apotek + Gudang Rp 300k/bln)';
    if (plan === 'PRO_UNLIMITED') return 'ENTERPRISE (Multi-Cabang Rp 500k/bln)';
    return plan;
  };

  const formatExpiryDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });
    } catch (e) {
      return dateStr;
    }
  };

  const isPending = billingStatus === 'PENDING';

  const getWhatsAppMessage = () => {
    if (isPending) {
      return `Halo Admin, saya ingin melakukan konfirmasi aktivasi pendaftaran Apotek baru saya dengan ID Tenant: ${tenantId || ''}`;
    }
    return `Halo Admin, saya ingin melakukan konfirmasi pembayaran iuran berlangganan Apotek saya dengan ID Tenant: ${tenantId || ''}`;
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
        <div className={`absolute top-1/4 left-1/4 w-96 h-96 ${isPending ? 'bg-amber-500/10' : 'bg-rose-500/10'} rounded-full blur-[120px]`} />
        <div className={`absolute bottom-1/4 right-1/4 w-96 h-96 ${isPending ? 'bg-emerald-500/10' : 'bg-amber-500/10'} rounded-full blur-[120px]`} />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="bg-white/90 border border-slate-100 rounded-[2.5rem] shadow-2xl p-8 max-w-lg w-full text-center space-y-8 relative overflow-hidden backdrop-blur-sm"
      >
        {/* Glow lock/clock icon */}
        <div className={`relative w-24 h-24 ${isPending ? 'bg-amber-50 border-amber-100/50 text-amber-500' : 'bg-rose-50 border-rose-100/50 text-rose-500'} rounded-[2rem] flex items-center justify-center mx-auto shadow-inner`}>
          {isPending ? <Clock className="w-10 h-10" /> : <Lock className="w-10 h-10" />}
          <div className={`absolute inset-0 ${isPending ? 'bg-amber-500/5' : 'bg-rose-500/5'} rounded-[2rem] animate-ping`} />
        </div>

        <div className="space-y-3">
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">
            {isPending ? 'Menunggu Aktivasi Akun' : 'Layanan Ditangguhkan'}
          </h2>
          <p className="text-slate-500 text-sm leading-relaxed max-w-sm mx-auto">
            {isPending ? (
              <>
                Halo <span className="font-bold text-slate-800">{fullName}</span>, pendaftaran apotek Anda dengan ID <span className="font-bold text-slate-800">{tenantId}</span> telah berhasil! Akun Anda saat ini sedang menunggu proses konfirmasi aktivasi dari Administrator.
              </>
            ) : (
              <>
                Halo <span className="font-bold text-slate-800">{fullName}</span>, masa aktif berlangganan paket aplikasi Apotek Anda telah habis atau ditangguhkan sementara.
              </>
            )}
          </p>
        </div>

        {/* Subscription Info Card */}
        <div className="bg-slate-50 border border-slate-100 p-5 rounded-3xl text-left text-xs space-y-3 font-semibold text-slate-500">
          <div className="flex justify-between items-center pb-2.5 border-b border-slate-200/50">
            <span>Paket Pilihan</span>
            <span className="font-black text-slate-800 uppercase bg-slate-200 px-2 py-0.5 rounded">
              {getPlanName(subscriptionPlan)}
            </span>
          </div>
          {!isPending && (
            <div className="flex justify-between items-center pb-2.5 border-b border-slate-200/50">
              <span>Tanggal Jatuh Tempo</span>
              <span className="font-black text-rose-600">
                {formatExpiryDate(expiredAt)}
              </span>
            </div>
          )}
          <div className="flex justify-between items-center">
            <span>Status Layanan</span>
            <span className={`font-black px-2 py-0.5 rounded border ${
              isPending 
                ? 'text-amber-700 bg-amber-50 border-amber-100' 
                : 'text-rose-600 bg-rose-50 border-rose-100'
            }`}>
              {isPending ? 'PENDING (Menunggu Aktivasi)' : billingStatus}
            </span>
          </div>
        </div>

        {/* Billing/Activation Guide */}
        <div className={`p-5 rounded-3xl text-left text-xs space-y-2 leading-relaxed ${
          isPending 
            ? 'bg-amber-50/50 border border-amber-100/50 text-amber-800' 
            : 'bg-rose-50/50 border border-rose-100/50 text-rose-800'
        }`}>
          <p className="font-bold">{isPending ? 'Langkah aktivasi apotek:' : 'Langkah re-aktivasi apotek:'}</p>
          <ol className="list-decimal pl-4 space-y-1">
            {isPending ? (
              <>
                <li>Hubungi Administrator via WhatsApp menggunakan tombol di bawah ini.</li>
                <li>Kirimkan konfirmasi pendaftaran beserta ID Apotek Anda ({tenantId}).</li>
                <li>Status apotek Anda akan langsung diaktifkan secara instan oleh Super Admin.</li>
              </>
            ) : (
              <>
                <li>Lakukan pembayaran iuran langganan bulanan ke rekening platform Anda.</li>
                <li>Hubungi Administrator Billing via WhatsApp untuk menyerahkan bukti transfer bank.</li>
                <li>Status apotek Anda akan langsung diaktifkan kembali secara instan oleh Super Admin.</li>
              </>
            )}
          </ol>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button
            onClick={handleLogout}
            variant="outline"
            className="flex-1 h-12 rounded-xl text-slate-600 border-slate-200 flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Keluar Sesi
          </Button>
          <a
            href={`https://wa.me/${adminWhatsApp || '628123456789'}?text=${encodeURIComponent(getWhatsAppMessage())}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1"
          >
            <Button
              className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-100"
            >
              <Phone className="w-4 h-4" />
              {isPending ? 'Aktivasi via WA' : 'Hubungi Admin WA'}
            </Button>
          </a>
        </div>
      </motion.div>
    </div>
  );
};

export default PaywallOverlay;
