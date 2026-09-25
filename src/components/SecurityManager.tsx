import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  KeyRound, 
  UserCheck, 
  LogOut, 
  CheckCircle2, 
  AlertCircle, 
  Eye,
  EyeOff
} from 'lucide-react';
import { cn, type AuthUser, type SecurityConfig } from '../lib/utils';

interface SecurityManagerProps {
  currentUser: AuthUser | null;
  securityConfig: SecurityConfig;
  onUpdateSecurityConfig: (newConfig: SecurityConfig) => void;
  onLogout: () => void;
  onSwitchUser: () => void;
}

export const SecurityManager: React.FC<SecurityManagerProps> = ({
  currentUser,
  securityConfig,
  onUpdateSecurityConfig,
  onLogout,
  onSwitchUser,
}) => {
  const [adminPin, setAdminPin] = useState(securityConfig.adminPin);
  const [cashierPin, setCashierPin] = useState(securityConfig.cashierPin);
  const [showAdminPin, setShowAdminPin] = useState(false);
  const [showCashierPin, setShowCashierPin] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSavePins = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (adminPin.length < 4) {
      setErrorMsg('PIN Admin minimal harus 4 digit angka');
      return;
    }
    if (cashierPin.length < 4) {
      setErrorMsg('PIN Kasir minimal harus 4 digit angka');
      return;
    }

    onUpdateSecurityConfig({
      ...securityConfig,
      adminPin,
      cashierPin,
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Current User Session Status */}
      <div className="glass-card p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className={cn(
            "w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg",
            currentUser?.role === 'admin' 
              ? "bg-amber-100 text-amber-800 border border-amber-200" 
              : "bg-blue-100 text-blue-800 border border-blue-200"
          )}>
            {currentUser?.role === 'admin' ? '👑' : '💳'}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-bold text-slate-800 text-base">{currentUser?.name || 'Pengguna'}</h4>
              <span className={cn(
                "px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider",
                currentUser?.role === 'admin'
                  ? "bg-amber-100 text-amber-900 border border-amber-300"
                  : "bg-blue-100 text-blue-900 border border-blue-300"
              )}>
                {currentUser?.role === 'admin' ? 'Owner / Admin (Akses Penuh)' : 'Kasir (Akses Terbatas)'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Metode Login: {currentUser?.loginMethod === 'google' ? `Google (${currentUser.email || 'OAuth'})` : 'PIN Keamanan Toko'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={onSwitchUser}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
            title="Ganti pengguna / shift kasir"
          >
            <UserCheck size={14} />
            <span>Ganti Pengguna</span>
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
            title="Kunci layar dan keluar"
          >
            <LogOut size={14} />
            <span>Kunci / Logout</span>
          </button>
        </div>
      </div>

      {/* PIN Configuration Form */}
      <div className="glass-card p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <KeyRound size={20} />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-base">Kelola PIN Akses & Keamanan</h3>
            <p className="text-xs text-slate-400">Atur PIN khusus Admin dan PIN Kasir untuk membatasi akses menu</p>
          </div>
        </div>

        {savedSuccess && (
          <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-2xl text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 size={16} />
            <span>PIN Keamanan berhasil diperbarui!</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs font-semibold flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSavePins} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Admin PIN */}
            <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-100 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                  <ShieldCheck size={16} className="text-amber-600" />
                  <span>PIN Owner / Admin</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowAdminPin(!showAdminPin)}
                  className="text-amber-700 hover:text-amber-900 text-xs"
                >
                  {showAdminPin ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              <p className="text-[11px] text-amber-700/80">
                Digunakan untuk membuka semua menu dan otorisasi menu terkunci (Laba, Karyawan, Pengaturan, Backup).
              </p>
              <input
                type={showAdminPin ? "text" : "password"}
                value={adminPin}
                onChange={(e) => setAdminPin(e.target.value.replace(/\D/g, ''))}
                maxLength={8}
                className="w-full px-3.5 py-2.5 bg-white border border-amber-200 rounded-xl text-base font-mono tracking-widest text-slate-800 outline-none focus:ring-2 focus:ring-amber-500 font-bold"
                placeholder="PIN 4-8 angka..."
              />
            </div>

            {/* Cashier PIN */}
            <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                  <Lock size={16} className="text-blue-600" />
                  <span>PIN Kasir / Operator</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowCashierPin(!showCashierPin)}
                  className="text-blue-700 hover:text-blue-900 text-xs"
                >
                  {showCashierPin ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              <p className="text-[11px] text-blue-700/80">
                Diberikan kepada staf kasir. Hanya mengizinkan akses ke Kasir dan Histori Transaksi.
              </p>
              <input
                type={showCashierPin ? "text" : "password"}
                value={cashierPin}
                onChange={(e) => setCashierPin(e.target.value.replace(/\D/g, ''))}
                maxLength={8}
                className="w-full px-3.5 py-2.5 bg-white border border-blue-200 rounded-xl text-base font-mono tracking-widest text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                placeholder="PIN 4-8 angka..."
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95"
            >
              Simpan Perubahan PIN
            </button>
          </div>
        </form>

        {/* Access Rights Comparison Table */}
        <div className="pt-4 border-t border-slate-100 space-y-2">
          <h4 className="font-bold text-slate-800 text-xs sm:text-sm">Matriks Pembatasan Hak Akses</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-2 px-3">Menu / Fitur</th>
                  <th className="py-2 px-3 text-center">💳 Kasir (Staff)</th>
                  <th className="py-2 px-3 text-center">👑 Owner / Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                <tr>
                  <td className="py-2 px-3 font-semibold">Kasir POS (Input Cuci & Minuman, Pembayaran, Cetak Nota)</td>
                  <td className="py-2 px-3 text-center text-green-600 font-bold">✓ Diizinkan</td>
                  <td className="py-2 px-3 text-center text-green-600 font-bold">✓ Diizinkan</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-semibold">Histori Transaksi (Cari Plat, Filter Tanggal, Cetak Ulang)</td>
                  <td className="py-2 px-3 text-center text-green-600 font-bold">✓ Diizinkan</td>
                  <td className="py-2 px-3 text-center text-green-600 font-bold">✓ Diizinkan</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-semibold">Laporan Laba Rugi & Margin Keuntungan Usaha</td>
                  <td className="py-2 px-3 text-center text-red-500 font-bold">🔒 Dikunci</td>
                  <td className="py-2 px-3 text-center text-green-600 font-bold">✓ Diizinkan</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-semibold">Kelola Data Karyawan, Upah & Skema Komisi</td>
                  <td className="py-2 px-3 text-center text-red-500 font-bold">🔒 Dikunci</td>
                  <td className="py-2 px-3 text-center text-green-600 font-bold">✓ Diizinkan</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-semibold">Pengaturan Harga Layanan, Profil Toko & PIN</td>
                  <td className="py-2 px-3 text-center text-red-500 font-bold">🔒 Dikunci</td>
                  <td className="py-2 px-3 text-center text-green-600 font-bold">✓ Diizinkan</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-semibold">Google Drive Backup & Restore Database</td>
                  <td className="py-2 px-3 text-center text-red-500 font-bold">🔒 Dikunci</td>
                  <td className="py-2 px-3 text-center text-green-600 font-bold">✓ Diizinkan</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
