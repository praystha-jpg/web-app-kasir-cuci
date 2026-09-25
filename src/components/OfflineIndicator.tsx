import React, { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl bg-slate-900 text-white border border-slate-700 px-3.5 py-2 text-xs font-semibold shadow-xl">
      <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping" />
      <WifiOff size={14} className="text-amber-400 shrink-0" />
      <span>Mode Offline — Aplikasi tetap dapat melayani kasir menggunakan data lokal</span>
    </div>
  );
};
