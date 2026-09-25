import React, { useState } from 'react';
import { Download, Monitor, Smartphone, Check, X, ShieldCheck } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'header' | 'sidebar' | 'banner' | 'settings';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  className = '',
  variant = 'header',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  // If already running in standalone mode (desktop or mobile app installed)
  if (isInstalled) {
    if (variant === 'settings') {
      return (
        <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-semibold border border-emerald-200">
          <Check size={14} className="text-emerald-600" />
          <span>Aplikasi Desktop Terpasang (Mode Standalone)</span>
        </div>
      );
    }
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      setIsInstalling(true);
      try {
        await install();
      } finally {
        setIsInstalling(false);
      }
    } else {
      // If browser hasn't fired beforeinstallprompt or is desktop browser that requires manual menu click
      setShowGuideModal(true);
    }
  };

  return (
    <>
      {variant === 'header' && (
        <button
          type="button"
          onClick={handleInstallClick}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all active:scale-95 cursor-pointer ${className}`}
          title="Install Aplikasi di Komputer Desktop / Laptop"
        >
          <Download size={14} className="shrink-0" />
          <span className="hidden sm:inline">Install Aplikasi Desktop</span>
          <span className="sm:hidden">Install</span>
        </button>
      )}

      {variant === 'sidebar' && (
        <button
          type="button"
          onClick={handleInstallClick}
          className={`w-full flex items-center justify-between p-3 rounded-2xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-all text-left ${className}`}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
              <Download size={16} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">Install Aplikasi Kasir</p>
              <p className="text-[10px] text-blue-600 font-medium">Buka tanpa browser & lebih cepat</p>
            </div>
          </div>
          <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-md font-bold">
            Pasang
          </span>
        </button>
      )}

      {variant === 'settings' && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-blue-50/60 border border-blue-200 rounded-2xl">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5">
              <Monitor size={18} />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-slate-800">Install Aplikasi di Desktop (PC/Laptop)</h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Jalankan kasir sebagai aplikasi desktop tersendiri dengan ikon di Taskbar/Desktop tanpa bilah alamat browser.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleInstallClick}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shrink-0 cursor-pointer shadow-sm active:scale-95"
          >
            <Download size={14} />
            <span>Install ke Desktop</span>
          </button>
        </div>
      )}

      {/* Installation Instruction Modal for Desktop & iOS */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Monitor size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Panduan Install di Desktop</h3>
                  <p className="text-xs text-slate-400">Jadikan aplikasi native di Windows / Mac / Linux</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                <p className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Monitor size={14} className="text-blue-600" />
                  <span>Untuk Google Chrome & Microsoft Edge di Komputer:</span>
                </p>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-600 pl-1">
                  <li>
                    Lihat ke <strong>ujung kanan bilah alamat (URL bar)</strong> di atas.
                  </li>
                  <li>
                    Klik ikon <strong>Install / Pasang Aplikasi</strong> (ikon monitor atau tanda <span className="font-mono bg-slate-200 px-1 py-0.5 rounded">⊕</span>).
                  </li>
                  <li>
                    Atau klik menu browser (titik 3 di pojok kanan atas) &rarr; pilih <strong>"Simpan dan bagikan" / "Aplikasi"</strong> &rarr; <strong>"Install D'CarWash POS"</strong>.
                  </li>
                  <li>
                    Aplikasi akan langsung terpasang di Desktop & Taskbar komputer Anda!
                  </li>
                </ol>
              </div>

              {isIOS && (
                <div className="p-3 bg-blue-50/60 rounded-2xl border border-blue-200 space-y-2">
                  <p className="font-bold text-blue-900 flex items-center gap-1.5">
                    <Smartphone size={14} className="text-blue-600" />
                    <span>Untuk Pengguna iPhone / iPad (Safari):</span>
                  </p>
                  <ol className="list-decimal list-inside space-y-1 text-slate-600 pl-1">
                    <li>Tekan tombol <strong>Share (Bagikan)</strong> di bilah bawah Safari.</li>
                    <li>Gulir ke bawah dan pilih <strong>"Tambah ke Layar Utama" (Add to Home Screen)</strong>.</li>
                  </ol>
                </div>
              )}

              <div className="flex items-center gap-2 text-[11px] text-slate-500 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                <ShieldCheck size={16} className="text-amber-600 shrink-0" />
                <span>
                  Setelah diinstal, aplikasi dapat dibuka langsung lewat ikon Desktop secara mandiri (standalone) tanpa alamat browser.
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowGuideModal(false)}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
            >
              Mengerti, Terima Kasih
            </button>
          </div>
        </div>
      )}
    </>
  );
};
