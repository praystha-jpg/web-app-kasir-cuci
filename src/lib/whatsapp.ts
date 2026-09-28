import { format, parseISO } from 'date-fns';
import { id as idLoc } from 'date-fns/locale';
import type { Transaction } from '../types';

/**
 * Normalizes phone number into international WhatsApp format (without '+' or non-digit characters)
 * Example: 
 *   '08123456789' -> '628123456789'
 *   '+62 812-3456-789' -> '628123456789'
 *   '8123456789' -> '628123456789'
 */
export function normalizeWhatsAppNumber(phone: string): string {
  if (!phone) return '';
  let clean = phone.replace(/[^0-9]/g, '');
  if (!clean) return '';

  if (clean.startsWith('0')) {
    clean = '62' + clean.slice(1);
  } else if (clean.startsWith('8')) {
    clean = '62' + clean;
  }

  return clean;
}

/**
 * Formats phone number for clean UI display (e.g. +62 812-3456-7890)
 */
export function formatPhoneNumberDisplay(phone: string): string {
  const normalized = normalizeWhatsAppNumber(phone);
  if (!normalized) return phone || '';
  if (normalized.startsWith('62')) {
    const rest = normalized.slice(2);
    if (rest.length >= 7) {
      return `+62 ${rest.slice(0, 3)}-${rest.slice(3, 7)}-${rest.slice(7)}`;
    }
    return `+62 ${rest}`;
  }
  return phone;
}

export interface ShopProfile {
  shopName: string;
  shopAddress: string;
  shopPhone: string;
}

/**
 * Generates formatted text message for WhatsApp receipt
 */
export function generateWhatsAppReceiptText(
  transaction: Transaction,
  shop: ShopProfile
): string {
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
  let dateStr = '';
  try {
    dateStr = format(parseISO(transaction.timestamp), 'dd MMMM yyyy, HH:mm', { locale: idLoc });
  } catch {
    dateStr = format(new Date(), 'dd MMMM yyyy, HH:mm', { locale: idLoc });
  }

  const lines: string[] = [
    `🚗✨ *${(shop.shopName || "D'CARWASH").toUpperCase()}* ✨🚗`,
    `_${shop.shopAddress || "Layanan Cuci Mobil & Motor"}_`,
    shop.shopPhone ? `📞 Telp/WA: ${shop.shopPhone}` : '',
    `━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `*NOTA TRANSAKSI PEMBAYARAN*`,
    `No. Nota    : *#${orderNum}*`,
    `Waktu       : ${dateStr}`,
    transaction.plateNumber && transaction.plateNumber !== '-' 
      ? `No. Plat    : *${transaction.plateNumber.toUpperCase()}*` 
      : '',
    transaction.carCategory 
      ? `Tipe/Model  : ${transaction.carCategory}` 
      : '',
    transaction.size 
      ? `Ukuran      : ${transaction.size}` 
      : '',
    transaction.employeeName 
      ? `Petugas Cuci: ${transaction.employeeName}` 
      : '',
    transaction.cashierName 
      ? `Kasir       : ${transaction.cashierName}` 
      : '',
    `━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `*RINCIAN ITEM & JASA:*`,
    ...transaction.items.map((item, idx) => {
      const subtotal = item.price * (item.quantity || 1);
      const qtyStr = item.quantity > 1 ? ` (x${item.quantity})` : '';
      return `${idx + 1}. ${item.name}${qtyStr} : *${formatCurrency(subtotal)}*`;
    }),
    `━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `*TOTAL TAGIHAN : ${formatCurrency(transaction.price)}*`,
    `Status Bayar   : *${transaction.paymentStatus === 'unpaid' ? '⚠️ BELUM LUNAS' : '✅ LUNAS'}*`,
    `Metode Bayar   : ${getPaymentLabel(transaction.paymentMethod)}`,
    transaction.amountPaid !== undefined && transaction.amountPaid > 0
      ? `Jumlah Diterima: ${formatCurrency(transaction.amountPaid)}`
      : '',
    transaction.changeAmount !== undefined && transaction.changeAmount > 0
      ? `Uang Kembalian : ${formatCurrency(transaction.changeAmount)}`
      : '',
    transaction.notes ? `Catatan        : _${transaction.notes}_` : '',
    `━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `Terima kasih telah mempercayakan perawatan kendaraan Anda kepada kami! 🙏`,
    `Kendaraan bersih, hati senang & nyaman di perjalanan. 🧼✨`,
    `_Simpan pesan ini sebagai bukti transaksi sah._`
  ];

  return lines.filter(line => line !== '').join('\n');
}

/**
 * Creates direct WhatsApp URL for sending receipt
 */
export function generateWhatsAppReceiptUrl(
  transaction: Transaction,
  shop: ShopProfile,
  customPhone?: string
): string {
  const targetRaw = customPhone || transaction.customerPhone || '';
  const normalizedPhone = normalizeWhatsAppNumber(targetRaw);
  const message = generateWhatsAppReceiptText(transaction, shop);
  const encodedText = encodeURIComponent(message);

  if (normalizedPhone) {
    return `https://wa.me/${normalizedPhone}?text=${encodedText}`;
  }
  return `https://api.whatsapp.com/send?text=${encodedText}`;
}

/**
 * Triggers opening WhatsApp in a new tab/window
 */
export function openWhatsAppReceipt(
  transaction: Transaction,
  shop: ShopProfile,
  customPhone?: string
): string | null {
  const url = generateWhatsAppReceiptUrl(transaction, shop, customPhone);
  if (!url) return null;

  try {
    // Attempt anchor tag click to avoid iframe popup blockers
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch {
    try {
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      console.warn('Could not auto-open WhatsApp link:', err);
    }
  }

  return url;
}
