import React, { useRef, useState } from 'react';
import { 
  Printer, 
  Share2, 
  Copy, 
  Check, 
  MessageSquare, 
  X, 
  Car, 
  Bike, 
  Coffee, 
  CheckCircle2, 
  ExternalLink 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, parseISO } from 'date-fns';
import { id as idLoc } from 'date-fns/locale';
import { type Transaction, cn } from '../lib/utils';

interface ReceiptModalProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
  shopName?: string;
  shopAddress?: string;
  shopPhone?: string;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  transaction,
  isOpen,
  onClose,
  shopName = "D'CarWash",
  shopAddress = "Jl. Jelantik Gingsir Sukasada, Layanan Cuci Mobil & Motor",
  shopPhone = "0812-3456-7890"
}) => {
  const [copied, setCopied] = useState(false);
  const [phoneInput, setPhoneInput] = useState('');
  const [showWaInput, setShowWaInput] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !transaction) return null;

  const formatCurrency = (val: number) => {
    return 'Rp ' + (val || 0).toLocaleString('id-ID');
  };

  const getPaymentLabel = (method?: string) => {
    switch (method) {
      case 'cash': return 'Tunai / Cash';
      case 'qris': return 'QRIS';
      case 'transfer': return 'Transfer Bank';
      case 'debit': return 'Kartu Debit';
      default: return 'Tunai';
    }
  };

  const orderNum = transaction.orderNumber || transaction.id.slice(0, 8).toUpperCase();
  const dateStr = format(parseISO(transaction.timestamp), 'dd MMMM yyyy, HH:mm', { locale: idLoc });

  // Generate plain text receipt for sharing (WhatsApp, SMS, Clipboard)
  const generateReceiptText = () => {
    const lines = [
      `=============================`,
      `       *${shopName.toUpperCase()}*`,
      `   ${shopAddress}`,
      `      Telp: ${shopPhone}`,
      `=============================`,
      `No. Nota   : #${orderNum}`,
      `Tanggal    : ${dateStr}`,
      `No. Plat   : ${transaction.plateNumber || '-'}`,
      transaction.carCategory ? `Tipe/Model : ${transaction.carCategory}` : '',
      transaction.size ? `Ukuran     : ${transaction.size}` : '',
      transaction.employeeName ? `Petugas    : ${transaction.employeeName}` : '',
      `Metode     : ${getPaymentLabel(transaction.paymentMethod)}`,
      `-----------------------------`,
      `*RINCIAN LAYANAN:*`,
      ...transaction.items.map(item => {
        const subtotal = item.price * (item.quantity || 1);
        return `${item.name}${item.quantity > 1 ? ` (x${item.quantity})` : ''} : ${formatCurrency(subtotal)}`;
      }),
      `-----------------------------`,
      `*TOTAL TAGIHAN : ${formatCurrency(transaction.price)}*`,
      transaction.amountPaid && transaction.amountPaid > 0 ? `Jumlah Bayar  : ${formatCurrency(transaction.amountPaid)}` : '',
      transaction.changeAmount && transaction.changeAmount > 0 ? `Kembalian     : ${formatCurrency(transaction.changeAmount)}` : '',
      `=============================`,
      `Terima kasih atas kunjungan Anda!`,
      `Kendaraan bersih, hati senang.`,
      `Simpan nota ini sebagai bukti transaksi sah.`,
      `=============================`
    ].filter(Boolean);

    return lines.join('\n');
  };

  const handleCopyText = async () => {
    try {
      const text = generateReceiptText();
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleShareWhatsApp = (customNumber?: string) => {
    const text = encodeURIComponent(generateReceiptText());
    let targetNum = customNumber || phoneInput || transaction.customerPhone || '';
    
    // Normalize Indonesian numbers: 08xxx -> 628xxx
    targetNum = targetNum.replace(/[^0-9]/g, '');
    if (targetNum.startsWith('0')) {
      targetNum = '62' + targetNum.slice(1);
    }

    const waUrl = targetNum 
      ? `https://wa.me/${targetNum}?text=${text}`
      : `https://api.whatsapp.com/send?text=${text}`;
      
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto print:p-0 print:m-0 print:static">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm print:hidden"
      />

      {/* Modal Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md z-10 my-auto overflow-hidden flex flex-col max-h-[92vh] border border-slate-100 print:shadow-none print:border-none print:max-w-none print:w-full print:rounded-none"
      >
        {/* Modal Top Action Bar (hidden when printing) */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} className="text-emerald-400" />
            <div>
              <p className="font-display font-bold text-sm leading-tight">Nota Transaksi Siap</p>
              <p className="text-[10px] text-slate-400">Cetak struk atau bagikan ke pelanggan</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            title="Tutup Nota"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Receipt Preview */}
        <div className="overflow-y-auto p-5 sm:p-6 bg-slate-50/50 print:bg-white print:p-0 print:overflow-visible">
          {/* Paper Receipt Styling */}
          <div 
            ref={receiptRef}
            id="printable-receipt"
            className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/70 font-mono text-slate-800 text-xs relative overflow-hidden print:border-none print:shadow-none print:p-2"
          >
            {/* Top saw-tooth / paper header decorative line */}
            <div className="text-center space-y-1 pb-4 border-b border-dashed border-slate-300">
              <h2 className="font-display font-bold text-lg tracking-tight text-slate-900">{shopName}</h2>
              <p className="text-[11px] text-slate-500 font-sans">{shopAddress}</p>
            </div>

            {/* Meta details */}
            <div className="py-3 border-b border-dashed border-slate-300 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-500">No. Nota:</span>
                <span className="font-bold text-slate-900">#{orderNum}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Waktu:</span>
                <span className="text-slate-700">{dateStr}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">No. Plat:</span>
                <span className="font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-1 rounded">
                  {transaction.plateNumber || '-'}
                </span>
              </div>
              {transaction.carCategory && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Tipe Kendaraan:</span>
                  <span className="font-bold text-slate-800">{transaction.carCategory}</span>
                </div>
              )}
              {transaction.size && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Ukuran / Kelas:</span>
                  <span className="font-bold text-slate-800">{transaction.size}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500">Metode Bayar:</span>
                <span className="font-bold text-slate-800">{getPaymentLabel(transaction.paymentMethod)}</span>
              </div>
              {transaction.employeeName && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Petugas Cuci:</span>
                  <span className="font-bold text-blue-800">{transaction.employeeName}</span>
                </div>
              )}
              {transaction.cashierName && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Kasir:</span>
                  <span className="font-bold text-slate-800">{transaction.cashierName}</span>
                </div>
              )}
            </div>

            {/* Items List */}
            <div className="py-3 border-b border-dashed border-slate-300 space-y-2">
              <p className="text-[10px] uppercase font-bold text-slate-400 font-sans">Rincian Item & Jasa:</p>
              {transaction.items.map((item, index) => (
                <div key={index} className="flex justify-between items-start text-[11px] gap-2">
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900">{item.name}</p>
                    {item.quantity > 1 && (
                      <p className="text-[10px] text-slate-400">
                        {item.quantity} x {formatCurrency(item.price)}
                      </p>
                    )}
                  </div>
                  <p className="font-bold text-slate-900">
                    {formatCurrency(item.price * item.quantity)}
                  </p>
                </div>
              ))}
            </div>

            {/* Totals and Payments */}
            <div className="py-3 border-b border-dashed border-slate-300 space-y-1.5 text-[11px]">
              <div className="flex justify-between text-sm font-bold text-slate-900 pt-1">
                <span>TOTAL AKHIR</span>
                <span className="text-blue-700 font-display">{formatCurrency(transaction.price)}</span>
              </div>
              {transaction.amountPaid !== undefined && transaction.amountPaid > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Bayar ({getPaymentLabel(transaction.paymentMethod)}):</span>
                  <span>{formatCurrency(transaction.amountPaid)}</span>
                </div>
              )}
              {transaction.changeAmount !== undefined && transaction.changeAmount > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Kembalian:</span>
                  <span>{formatCurrency(transaction.changeAmount)}</span>
                </div>
              )}
            </div>

            {/* Footer Notice */}
            <div className="pt-4 text-center space-y-1 text-[10px] text-slate-400 font-sans">
              <p className="font-semibold text-slate-600">Terima kasih atas kunjungan Anda!</p>
              <p>Kendaraan Bersih, Nyaman di Perjalanan</p>
              <p className="text-[9px] text-slate-300 pt-1">Simpan nota ini sebagai tanda bukti pembayaran sah</p>
            </div>
          </div>
        </div>

        {/* Action Controls (Hidden in Print) */}
        <div className="p-4 bg-white border-t border-slate-100 space-y-2.5 print:hidden">
          {/* Quick WhatsApp Input Accordion */}
          {showWaInput ? (
            <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                  <MessageSquare size={14} /> Kirim Langsung ke WhatsApp Pelanggan
                </span>
                <button 
                  onClick={() => setShowWaInput(false)}
                  className="text-emerald-700 text-xs font-bold hover:underline"
                >
                  Batal
                </button>
              </div>
              <div className="flex gap-2">
                <input 
                  type="tel"
                  placeholder="Nomor WA (contoh: 08123456789)"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  className="flex-1 bg-white border border-emerald-300 rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  onClick={() => handleShareWhatsApp(phoneInput)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-all"
                >
                  <ExternalLink size={14} />
                  Kirim
                </button>
              </div>
            </div>
          ) : null}

          {/* Primary Action Buttons */}
          <div className="grid grid-cols-3 gap-2">
            {/* Print Button */}
            <button
              onClick={handlePrint}
              className="py-3 px-2 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold text-xs flex flex-col items-center justify-center gap-1 transition-all shadow-md active:scale-95"
            >
              <Printer size={16} />
              <span>Cetak Nota</span>
            </button>

            {/* WhatsApp Share Button */}
            <button
              onClick={() => {
                if (transaction.customerPhone) {
                  handleShareWhatsApp(transaction.customerPhone);
                } else {
                  setShowWaInput(!showWaInput);
                }
              }}
              className="py-3 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-xs flex flex-col items-center justify-center gap-1 transition-all shadow-md active:scale-95"
            >
              <Share2 size={16} />
              <span>Kirim WA</span>
            </button>

            {/* Copy Text Button */}
            <button
              onClick={handleCopyText}
              className={cn(
                "py-3 px-2 rounded-2xl font-bold text-xs flex flex-col items-center justify-center gap-1 transition-all border",
                copied 
                  ? "bg-emerald-50 border-emerald-400 text-emerald-700" 
                  : "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700"
              )}
            >
              {copied ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
              <span>{copied ? 'Tersalin!' : 'Salin Teks'}</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs transition-colors"
          >
            Selesai / Tutup
          </button>
        </div>
      </motion.div>
    </div>
  );
};
