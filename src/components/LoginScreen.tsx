import React, { useState } from 'react';
import { 
  ShieldCheck, 
  UserCheck, 
  Lock, 
  Car, 
  KeyRound, 
  AlertCircle, 
  CheckCircle2, 
  Users, 
  Sparkles,
  ArrowRight,
  Delete
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, type AuthUser, type UserRole, type SecurityConfig } from '../lib/utils';
import { googleSignIn } from '../lib/googleAuth';
import { PWAInstallButton } from './PWAInstallButton';

interface LoginScreenProps {
  securityConfig: SecurityConfig;
  shopName: string;
  onLoginSuccess: (user: AuthUser) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  securityConfig,
  shopName,
  onLoginSuccess,
}) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>('cashier');
  const [pinInput, setPinInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Virtual Keypad click handler
  const handleKeypadPress = (val: string) => {
    setErrorMsg('');
    if (val === 'clear') {
      setPinInput('');
    } else if (val === 'backspace') {
      setPinInput(prev => prev.slice(0, -1));
    } else {
      if (pinInput.length < 8) {
        setPinInput(prev => prev + val);
      }
    }
  };

  const handleLoginWithPin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg('');

      if (selectedRole === 'admin') {
      const correctPin = securityConfig.adminPin || '1234';
      if (pinInput === correctPin) {
        onLoginSuccess({
          id: 'admin-owner',
          name: 'Pemilik / Admin',
          role: 'admin',
          loginMethod: 'pin',
          loginAt: new Date().toISOString(),
        });
      } else {
        setErrorMsg('PIN Admin tidak valid. Silakan periksa kembali PIN Anda.');
      }
    } else {
      // Cashier
      const correctPin = securityConfig.cashierPin || '0000';
      if (pinInput === correctPin) {
        onLoginSuccess({
          id: 'cashier-staff',
          name: 'Kasir',
          role: 'cashier',
          loginMethod: 'pin',
          loginAt: new Date().toISOString(),
        });
      } else {
        setErrorMsg('PIN Kasir salah. Silakan periksa kembali PIN Anda.');
      }
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMsg('');
    setIsGoogleLoading(true);
    try {
      const result = await googleSignIn();
      if (result?.user) {
        onLoginSuccess({
          id: result.user.uid,
          name: result.user.displayName || 'Owner (Google)',
          role: 'admin',
          email: result.user.email || undefined,
          photoURL: result.user.photoURL || undefined,
          loginMethod: 'google',
          loginAt: new Date().toISOString(),
        });
      }
    } catch (err: any) {
      console.error('Google Sign-in failed:', err);
      setErrorMsg(err.message || 'Gagal masuk dengan akun Google. Silakan gunakan PIN Admin.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-blue-950 flex flex-col justify-center items-center p-4 sm:p-6 text-slate-100 select-none">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-blue-600 text-white shadow-xl shadow-blue-500/20 mb-3 border border-blue-400/30">
            <Car className="w-9 h-9" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-extrabold tracking-tight text-white">
            {shopName || "D'CarWash"}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Sistem Kasir & Pembatasan Hak Akses Pengguna
          </p>
        </div>

        {/* Card Container */}
        <div className="bg-slate-800/90 backdrop-blur-xl border border-slate-700/80 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-5">
          {/* Role Tab Selector */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-900/80 rounded-2xl border border-slate-700/50">
            <button
              type="button"
              onClick={() => {
                setSelectedRole('cashier');
                setPinInput('');
                setErrorMsg('');
              }}
              className={cn(
                "py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all",
                selectedRole === 'cashier'
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                  : "text-slate-400 hover:text-white"
              )}
            >
              <UserCheck size={16} />
              <span>Kasir (Staff)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedRole('admin');
                setPinInput('');
                setErrorMsg('');
              }}
              className={cn(
                "py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all",
                selectedRole === 'admin'
                  ? "bg-amber-500 text-white shadow-md shadow-amber-500/30"
                  : "text-slate-400 hover:text-white"
              )}
            >
              <ShieldCheck size={16} />
              <span>Owner / Admin</span>
            </button>
          </div>

          {/* Role Description Badge */}
          <div className={cn(
            "p-3 rounded-2xl text-xs flex items-start gap-2.5 border",
            selectedRole === 'cashier'
              ? "bg-blue-500/10 border-blue-500/20 text-blue-200"
              : "bg-amber-500/10 border-amber-500/20 text-amber-200"
          )}>
            <div className="mt-0.5 shrink-0">
              {selectedRole === 'cashier' ? <Lock size={15} /> : <Sparkles size={15} />}
            </div>
            <div>
              <p className="font-bold text-white mb-0.5">
                {selectedRole === 'cashier' ? 'Akses Operasional Kasir' : 'Akses Penuh Pemilik'}
              </p>
              <p className="text-[11px] leading-relaxed text-slate-300">
                {selectedRole === 'cashier' 
                  ? 'Dapat melayani transaksi cuci & minuman serta melihat histori layanan. Laporan keuangan laba rugi dan pengaturan upah dikunci.'
                  : 'Membuka semua menu: Laporan Laba Rugi, Rekap Karyawan & Skema Upah, Backup Google Drive, dan Pengaturan Sistem.'}
              </p>
            </div>
          </div>

          {/* Form Content */}
          <form onSubmit={handleLoginWithPin} className="space-y-4">
            {/* PIN Input with visual indicator */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <KeyRound size={13} className="text-slate-400" />
                  <span>Masukkan PIN {selectedRole === 'admin' ? 'Admin' : 'Kasir'}</span>
                </label>
              </div>

              {/* Masked PIN Display */}
              <div className="relative flex items-center">
                <input
                  type="password"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                  placeholder={`Masukkan PIN ${selectedRole === 'admin' ? 'Admin' : 'Kasir'}...`}
                  maxLength={8}
                  className="w-full py-3 px-4 bg-slate-900/90 border border-slate-700 rounded-2xl text-center text-lg sm:text-xl font-mono tracking-widest text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              {/* Error Message */}
              {errorMsg && (
                <motion.div 
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-2.5 rounded-xl bg-red-500/20 border border-red-500/30 text-red-200 text-xs flex items-center gap-2"
                >
                  <AlertCircle size={15} className="shrink-0 text-red-400" />
                  <span>{errorMsg}</span>
                </motion.div>
              )}
            </div>

            {/* Virtual Numeric Keypad for POS Touchscreen */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleKeypadPress(num.toString())}
                  className="py-3 bg-slate-700/60 hover:bg-slate-700 active:bg-blue-600 rounded-xl font-display font-bold text-lg text-white transition-colors active:scale-95 shadow-xs"
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                onClick={() => handleKeypadPress('clear')}
                className="py-3 bg-slate-900/80 hover:bg-slate-900 active:bg-slate-950 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-colors"
                title="Hapus semua angka"
              >
                C
              </button>
              <button
                type="button"
                onClick={() => handleKeypadPress('0')}
                className="py-3 bg-slate-700/60 hover:bg-slate-700 active:bg-blue-600 rounded-xl font-display font-bold text-lg text-white transition-colors active:scale-95 shadow-xs"
              >
                0
              </button>
              <button
                type="button"
                onClick={() => handleKeypadPress('backspace')}
                className="py-3 bg-slate-900/80 hover:bg-slate-900 active:bg-slate-950 rounded-xl flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                title="Hapus satu angka"
              >
                <Delete size={18} />
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className={cn(
                "w-full py-3.5 rounded-2xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all shadow-lg active:scale-98 cursor-pointer mt-2",
                selectedRole === 'admin'
                  ? "bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold shadow-amber-500/20"
                  : "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30"
              )}
            >
              <span>Masuk Sebagai {selectedRole === 'admin' ? 'Owner / Admin' : 'Kasir'}</span>
              <ArrowRight size={18} />
            </button>

            {/* Google Sign-in for Cloud Sync */}
            <div className="pt-2">
              <div className="relative flex py-2 items-center">
                <div className="grow border-t border-slate-700"></div>
                <span className="shrink mx-2 text-[10px] text-slate-500 uppercase tracking-widest font-bold">Sinkronisasi Cloud Antar Perangkat</span>
                <div className="grow border-t border-slate-700"></div>
              </div>

              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isGoogleLoading}
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-950 border border-slate-700 hover:border-slate-500 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2.5 transition-colors disabled:opacity-50"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>{isGoogleLoading ? 'Menghubungkan Akun Google...' : 'Hubungkan Cloud dengan Google (Sync Antar-HP)'}</span>
              </button>
              <p className="text-[10px] text-slate-400 text-center mt-2 leading-relaxed">
                💡 Masuk dengan akun Google yang sama di HP/tablet/komputer lain agar semua data kasir langsung terhubung secara otomatis.
              </p>
            </div>
          </form>
        </div>

        {/* Install PWA Prompt for Desktop & Mobile on Login */}
        <div className="flex justify-center mt-4">
          <PWAInstallButton 
            variant="header" 
            className="bg-slate-800/90 hover:bg-slate-700 text-slate-300 border border-slate-700/80 shadow-md py-2 px-4 text-xs" 
          />
        </div>
      </div>
    </div>
  );
};
