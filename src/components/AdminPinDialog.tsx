import React, { useState } from 'react';
import { ShieldAlert, KeyRound, AlertCircle, X, CheckCircle2, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface AdminPinDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  targetFeatureName?: string;
  adminPin: string;
}

export const AdminPinDialog: React.FC<AdminPinDialogProps> = ({
  isOpen,
  onClose,
  onSuccess,
  targetFeatureName = 'Menu Terbatas',
  adminPin,
}) => {
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg('');

    const correctPin = adminPin || '1234';
    if (pin === correctPin) {
      setPin('');
      setErrorMsg('');
      onSuccess();
    } else {
      setErrorMsg('PIN Admin tidak sesuai. Default: 1234');
    }
  };

  const handleKeypadPress = (val: string) => {
    setErrorMsg('');
    if (val === 'clear') {
      setPin('');
    } else if (val === 'backspace') {
      setPin(prev => prev.slice(0, -1));
    } else {
      if (pin.length < 8) {
        setPin(prev => prev + val);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 space-y-5"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <ShieldAlert size={26} />
            </div>
            <div>
              <h3 className="font-display font-bold text-slate-900 text-lg">Akses Khusus Admin</h3>
              <p className="text-xs text-slate-500">{targetFeatureName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            title="Tutup dialog"
          >
            <X size={18} />
          </button>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed bg-amber-50/60 p-3 rounded-2xl border border-amber-100">
          Akun Kasir memiliki batasan akses. Masukkan PIN Admin / Pemilik untuk membuka menu ini.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <KeyRound size={13} />
                <span>PIN Admin</span>
              </label>
            </div>

            <input
              type="password"
              value={pin}
              onChange={(e) => {
                setPin(e.target.value.replace(/\D/g, ''));
                setErrorMsg('');
              }}
              placeholder="Masukkan PIN Admin..."
              maxLength={8}
              autoFocus
              className="w-full py-3 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-center text-xl font-mono tracking-widest text-slate-800 outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
            />

            {errorMsg && (
              <div className="mt-2 p-2 rounded-xl bg-red-50 text-red-700 text-xs flex items-center gap-1.5 border border-red-100">
                <AlertCircle size={14} className="shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>

          {/* Quick Keypad */}
          <div className="grid grid-cols-3 gap-1.5 pt-1">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handleKeypadPress(num.toString())}
                className="py-2.5 bg-slate-50 hover:bg-slate-100 active:bg-amber-100 rounded-xl font-display font-bold text-base text-slate-700 transition-colors active:scale-95"
              >
                {num}
              </button>
            ))}
            <button
              type="button"
              onClick={() => handleKeypadPress('clear')}
              className="py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-500 transition-colors"
            >
              C
            </button>
            <button
              type="button"
              onClick={() => handleKeypadPress('0')}
              className="py-2.5 bg-slate-50 hover:bg-slate-100 active:bg-amber-100 rounded-xl font-display font-bold text-base text-slate-700 transition-colors active:scale-95"
            >
              0
            </button>
            <button
              type="button"
              onClick={() => handleKeypadPress('backspace')}
              className="py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-500 transition-colors flex items-center justify-center"
            >
              ←
            </button>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="w-1/2 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-colors shadow-sm flex items-center justify-center gap-1.5"
            >
              <span>Verifikasi</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
