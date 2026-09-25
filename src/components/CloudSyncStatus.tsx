import React, { useState } from 'react';
import { 
  Cloud, 
  CloudCheck, 
  CloudOff, 
  RefreshCw, 
  Smartphone, 
  Laptop, 
  CheckCircle2, 
  AlertCircle, 
  LogIn, 
  LogOut, 
  ArrowRight,
  ShieldCheck,
  Sparkles,
  HelpCircle,
  Database
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { User } from 'firebase/auth';
import { googleSignIn, logout as authLogout } from '../lib/googleAuth';

interface CloudSyncStatusProps {
  currentUserEmail?: string | null;
  firebaseUser: User | null;
  isSyncing: boolean;
  lastSyncedAt: Date | null;
  syncError: string | null;
  onManualSyncRequest?: () => Promise<void>;
  onForceSeedToCloud?: () => Promise<void>;
}

export const CloudSyncStatus: React.FC<CloudSyncStatusProps> = ({
  currentUserEmail,
  firebaseUser,
  isSyncing,
  lastSyncedAt,
  syncError,
  onManualSyncRequest,
  onForceSeedToCloud
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const isConnected = !!firebaseUser;

  const handleGoogleConnect = async () => {
    setIsLoggingIn(true);
    setActionMessage(null);
    try {
      const res = await googleSignIn();
      if (res?.user) {
        setActionMessage({
          type: 'success',
          text: `Berhasil terhubung ke Cloud dengan akun ${res.user.email}! Semua perangkat sekarang tersinkronisasi.`
        });
      }
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: err?.message || 'Gagal login Google. Pastikan izin popup browser diaktifkan.'
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await authLogout();
      setActionMessage({
        type: 'success',
        text: 'Koneksi Cloud diputus. Aplikasi kini beralih ke penyimpanan lokal perangkat ini.'
      });
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: 'Gagal logout.'
      });
    }
  };

  return (
    <>
      {/* Top Header Badge */}
      <button
        onClick={() => setIsOpen(true)}
        type="button"
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all shadow-sm ${
          isConnected
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
            : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 animate-pulse'
        }`}
        title="Status Sinkronisasi Multi-Perangkat Cloud"
      >
        {isConnected ? (
          <>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <Cloud className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline font-semibold">Cloud Sync Aktif</span>
            <span className="sm:hidden font-semibold">Cloud OK</span>
          </>
        ) : (
          <>
            <CloudOff className="w-3.5 h-3.5 text-amber-600" />
            <span className="hidden sm:inline font-semibold">Hubungkan Antar Perangkat</span>
            <span className="sm:hidden font-semibold">Sync Offline</span>
          </>
        )}
      </button>

      {/* Detail Dialog Modal */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200"
            >
              {/* Header */}
              <div className={`p-5 text-white flex items-start justify-between ${
                isConnected ? 'bg-gradient-to-r from-emerald-600 to-teal-700' : 'bg-gradient-to-r from-blue-600 to-indigo-700'
              }`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white">
                    {isConnected ? <CloudCheck className="w-6 h-6" /> : <Cloud className="w-6 h-6" />}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">Sinkronisasi Antar-Perangkat</h3>
                    <p className="text-xs text-white/80">
                      Real-time Database Cloud Firebase
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10"
                >
                  ✕
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
                {actionMessage && (
                  <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    actionMessage.type === 'success' 
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}>
                    {actionMessage.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    )}
                    <span>{actionMessage.text}</span>
                  </div>
                )}

                {/* Connection Status Box */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Status Koneksi</span>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      isConnected 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {isConnected ? '✓ Terhubung Real-Time' : 'Belum Terhubung'}
                    </span>
                  </div>

                  {isConnected ? (
                    <div className="space-y-1.5 text-xs text-slate-600">
                      <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
                        <span className="text-slate-500">Akun Google Pemilik:</span>
                        <span className="font-semibold text-slate-800">{firebaseUser?.email || currentUserEmail || 'praystha@gmail.com'}</span>
                      </div>
                      <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
                        <span className="text-slate-500">Sinkronisasi:</span>
                        <span className="text-emerald-700 font-medium">Otomatis Setiap Ada Perubahan</span>
                      </div>
                      <div className="flex items-center justify-between py-1">
                        <span className="text-slate-500">Terakhir Diperbarui:</span>
                        <span className="text-slate-700">{lastSyncedAt ? lastSyncedAt.toLocaleTimeString('id-ID') : 'Baru saja'}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-600 space-y-2">
                      <p>
                        Aplikasi saat ini hanya menyimpan data di memori browser lokal perangkat ini. Untuk menghubungkan dengan <strong>HP kasir, tablet, dan komputer lain</strong>, hubungkan dengan Akun Google Pemilik.
                      </p>
                      <button
                        onClick={handleGoogleConnect}
                        disabled={isLoggingIn}
                        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium text-xs shadow-sm transition-all disabled:opacity-50"
                      >
                        {isLoggingIn ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Menghubungkan ke Cloud...</span>
                          </>
                        ) : (
                          <>
                            <LogIn className="w-4 h-4" />
                            <span>Hubungkan Google Cloud Sekarang</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {/* Multi-Device Architecture Diagram / Explanation */}
                <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 space-y-3">
                  <div className="flex items-center gap-2 text-blue-900 font-semibold text-xs">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    <span>Bagaimana Cara Kerja Antar Perangkat?</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-[11px] pt-1">
                    <div className="bg-white p-2.5 rounded-lg border border-blue-100 shadow-2xs">
                      <Smartphone className="w-5 h-5 mx-auto text-blue-600 mb-1" />
                      <div className="font-semibold text-slate-800">HP Kasir</div>
                      <div className="text-slate-500 text-[10px]">Input order cuci</div>
                    </div>
                    <div className="bg-white p-2.5 rounded-lg border border-emerald-100 shadow-2xs flex flex-col justify-center items-center">
                      <Database className="w-5 h-5 text-emerald-600 mb-1" />
                      <div className="font-semibold text-emerald-800">Cloud DB</div>
                      <div className="text-emerald-600 text-[10px]">Real-time Sync</div>
                    </div>
                    <div className="bg-white p-2.5 rounded-lg border border-blue-100 shadow-2xs">
                      <Laptop className="w-5 h-5 mx-auto text-blue-600 mb-1" />
                      <div className="font-semibold text-slate-800">Laptop/Tablet</div>
                      <div className="text-slate-500 text-[10px]">Laporan & Rekap</div>
                    </div>
                  </div>

                  <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-4 pt-1">
                    <li>
                      <strong>Semua perangkat terhubung otomatis:</strong> Saat Kasir menambah transaksi di HP/Tablet, Laptop admin langsung menampilkan data tersebut tanpa perlu di-refresh.
                    </li>
                    <li>
                      <strong>Cara sambung perangkat baru:</strong> Buka tautan web aplikasi ini di perangkat lain, lalu klik <em>Hubungkan Cloud</em> dengan akun Google yang sama.
                    </li>
                  </ul>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-2 pt-2">
                  {isConnected && (
                    <>
                      {onForceSeedToCloud && (
                        <button
                          type="button"
                          onClick={async () => {
                            setActionMessage({ type: 'success', text: 'Menyinkronkan semua data lokal ke Cloud...' });
                            await onForceSeedToCloud();
                            setActionMessage({ type: 'success', text: 'Semua data lokal berhasil disinkronkan ke Cloud!' });
                          }}
                          className="flex-1 py-2 px-3 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors text-center"
                        >
                          Sinkron Ulang Data Lokal
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={handleDisconnect}
                        className="py-2 px-3 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-xl border border-rose-200 transition-colors"
                      >
                        Putus Koneksi
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="flex-1 py-2 px-4 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-900 rounded-xl shadow-xs transition-colors"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
