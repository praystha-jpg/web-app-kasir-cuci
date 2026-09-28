import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Banknote, 
  QrCode, 
  ArrowRight, 
  X, 
  Check, 
  Tag, 
  Coffee, 
  Car, 
  Bike, 
  Phone, 
  FileText,
  Calculator,
  Users,
  UserCheck,
  Scale,
  AlertCircle
} from 'lucide-react';
import { motion } from 'motion/react';
import { 
  type PaymentMethod, 
  type VehicleType, 
  type VehicleSize, 
  type Drink, 
  type Employee,
  type AssignedEmployee,
  type WageUnitConfig,
  type PaymentStatus,
  INITIAL_WAGE_UNIT_CONFIG,
  calculateSplitUnitWage,
  cn 
} from '../lib/utils';
import { normalizeWhatsAppNumber, formatPhoneNumberDisplay } from '../lib/whatsapp';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmPayment: (paymentDetails: {
    paymentMethod: PaymentMethod;
    paymentStatus?: PaymentStatus;
    amountPaid: number;
    changeAmount: number;
    customerPhone: string;
    notes: string;
    employeeId?: string;
    employeeName?: string;
    employeeWage?: number;
    assignedEmployees?: AssignedEmployee[];
    totalUnitWage?: number;
    wagePerPerson?: number;
    autoSendWhatsApp?: boolean;
  }) => void;
  totalAmount: number;
  selectedVehicle: VehicleType | null;
  selectedSize: VehicleSize | null;
  carCategory: string;
  plateNumber: string;
  drinkCart: { drink: Drink; quantity: number }[];
  employees?: Employee[];
  initialEmployeeId?: string;
  initialEmployeeIds?: string[];
  wageUnitConfig?: WageUnitConfig;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  onConfirmPayment,
  totalAmount,
  selectedVehicle,
  selectedSize,
  carCategory,
  plateNumber,
  drinkCart,
  employees = [],
  initialEmployeeId = '',
  initialEmployeeIds = [],
  wageUnitConfig = INITIAL_WAGE_UNIT_CONFIG,
}) => {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('paid');
  const [cashGiven, setCashGiven] = useState<string>(totalAmount.toString());
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [autoSendWhatsApp, setAutoSendWhatsApp] = useState<boolean>(true);
  const [notes, setNotes] = useState<string>('');
  
  // Multi-employee selection for split unit wage
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>(() => {
    if (initialEmployeeIds && initialEmployeeIds.length > 0) return initialEmployeeIds;
    if (initialEmployeeId) return [initialEmployeeId];
    return [];
  });

  // Sync initialEmployeeId or initialEmployeeIds when opened
  useEffect(() => {
    if (initialEmployeeIds && initialEmployeeIds.length > 0) {
      setSelectedEmployeeIds(initialEmployeeIds);
    } else if (initialEmployeeId) {
      setSelectedEmployeeIds([initialEmployeeId]);
    } else {
      setSelectedEmployeeIds([]);
    }
  }, [initialEmployeeId, initialEmployeeIds, isOpen]);

  // Update default cash given when totalAmount changes
  useEffect(() => {
    if (totalAmount > 0) {
      setCashGiven(totalAmount.toString());
    }
  }, [totalAmount]);

  if (!isOpen) return null;

  const numCashGiven = parseInt(cashGiven.replace(/[^0-9]/g, ''), 10) || 0;
  const changeAmount = Math.max(0, numCashGiven - totalAmount);
  const isCashShort = paymentStatus === 'paid' && paymentMethod === 'cash' && numCashGiven < totalAmount;

  const activeEmployees = employees.filter(e => e.isActive);
  const selectedEmps = employees.filter(e => selectedEmployeeIds.includes(e.id));
  const washPrice = (selectedVehicle && selectedSize) ? (selectedVehicle.prices[selectedSize] || 0) : 0;
  
  // Calculate wage split per unit
  const { totalUnitWage, wagePerPerson } = calculateSplitUnitWage(
    selectedVehicle?.id,
    washPrice,
    selectedEmps.length,
    wageUnitConfig
  );

  const formatCurrency = (val: number) => {
    return 'Rp ' + (val || 0).toLocaleString('id-ID');
  };

  const toggleEmployee = (empId: string) => {
    setSelectedEmployeeIds(prev => 
      prev.includes(empId) ? prev.filter(id => id !== empId) : [...prev, empId]
    );
  };

  const clearEmployees = () => {
    setSelectedEmployeeIds([]);
  };

  // Quick preset cash suggestions
  const cashSuggestions = [
    totalAmount,
    Math.ceil(totalAmount / 10000) * 10000,
    Math.ceil(totalAmount / 50000) * 50000,
    100000,
  ].filter((val, idx, arr) => val >= totalAmount && arr.indexOf(val) === idx);

  const handleConfirm = () => {
    if (isCashShort) return;

    const assignedEmployees: AssignedEmployee[] = selectedEmps.map(emp => ({
      id: emp.id,
      name: emp.name,
      wageEarned: wagePerPerson,
    }));

    onConfirmPayment({
      paymentMethod,
      paymentStatus,
      amountPaid: paymentStatus === 'unpaid' ? 0 : (paymentMethod === 'cash' ? numCashGiven : totalAmount),
      changeAmount: (paymentStatus === 'unpaid' || paymentMethod !== 'cash') ? 0 : changeAmount,
      customerPhone: customerPhone.trim(),
      notes: notes.trim(),
      employeeId: selectedEmps.length > 0 ? selectedEmps.map(e => e.id).join(',') : undefined,
      employeeName: selectedEmps.length > 0 ? selectedEmps.map(e => e.name).join(', ') : undefined,
      employeeWage: selectedEmps.length > 0 ? totalUnitWage : 0,
      assignedEmployees,
      totalUnitWage,
      wagePerPerson,
      autoSendWhatsApp: customerPhone.trim() ? autoSendWhatsApp : false,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
      />

      {/* Dialog */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg z-10 my-auto overflow-hidden flex flex-col max-h-[92vh] border border-slate-100"
      >
        {/* Header */}
        <div className="p-5 sm:p-6 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-md">
              <Banknote size={22} />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg leading-tight">Konfirmasi Pembayaran</h3>
              <p className="text-xs text-slate-400">Pilih metode & hitung uang kembalian</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* Order Snapshot Card */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500 pb-2 border-b border-slate-200">
              <span className="font-semibold uppercase tracking-wider">Ringkasan Order</span>
              {plateNumber && (
                <span className="font-bold font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-100">
                  {plateNumber}
                </span>
              )}
            </div>

            <div className="space-y-1.5 text-xs text-slate-700">
              {selectedVehicle && selectedSize && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {selectedVehicle.id === 'motor' ? <Bike size={14} className="text-slate-400" /> : <Car size={14} className="text-slate-400" />}
                    <span className="font-medium">
                      Cuci {selectedVehicle.name} ({selectedSize})
                      {carCategory && ` • ${carCategory}`}
                    </span>
                  </div>
                  <span className="font-semibold">{formatCurrency(selectedVehicle.prices[selectedSize])}</span>
                </div>
              )}

              {drinkCart.map(item => (
                <div key={item.drink.id} className="flex items-center justify-between text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <Coffee size={14} className="text-slate-400" />
                    <span>{item.drink.name} x{item.quantity}</span>
                  </div>
                  <span>{formatCurrency(item.drink.price * item.quantity)}</span>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-200 flex items-baseline justify-between">
              <span className="font-bold text-slate-800 text-sm">TOTAL TAGIHAN</span>
              <span className="font-display font-bold text-xl text-blue-600">
                {formatCurrency(totalAmount)}
              </span>
            </div>
          </div>

          {/* Petugas Cuci (Karyawan) - Pembagian Upah per Unit Dibagi Rata */}
          {selectedVehicle && activeEmployees.length > 0 && (
            <div className="space-y-2.5 p-3.5 bg-blue-50/50 rounded-2xl border border-blue-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Users size={14} className="text-blue-600" />
                  Petugas Cuci / Washer (Bisa Pilih Lebih dari 1 Orang)
                </label>
                {selectedEmps.length > 0 ? (
                  <span className="text-[11px] font-bold text-blue-700 bg-white px-2 py-0.5 rounded-full border border-blue-200 shadow-2xs">
                    {selectedEmps.length} Petugas • {formatCurrency(wagePerPerson)} / org
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400">Pilih petugas pengerja</span>
                )}
              </div>

              {/* Banner Penjelasan Skema Bagi Rata */}
              <div className="p-2.5 bg-white rounded-xl border border-blue-200/80 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Scale size={16} className="text-blue-600 shrink-0" />
                  <div>
                    <span className="font-bold text-slate-700">
                      Total Upah Unit: {formatCurrency(totalUnitWage || (selectedVehicle.id === 'motor' ? wageUnitConfig.motorUnitWage : wageUnitConfig.carUnitWage))}
                    </span>
                    <p className="text-[11px] text-slate-500">
                      {selectedEmps.length === 0 && 'Belum ada petugas dipilih.'}
                      {selectedEmps.length === 1 && `1 petugas terpilih menerima 100% upah unit (${formatCurrency(totalUnitWage)}).`}
                      {selectedEmps.length > 1 && `Dibagi rata ke ${selectedEmps.length} orang = ${formatCurrency(wagePerPerson)} per orang.`}
                    </p>
                  </div>
                </div>
                {selectedEmps.length > 0 && (
                  <button
                    type="button"
                    onClick={clearEmployees}
                    className="text-[10px] text-slate-400 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50 font-medium transition-colors"
                  >
                    Reset
                  </button>
                )}
              </div>

              {/* Grid Pilihan Petugas (Multi-select) */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                {activeEmployees.map(emp => {
                  const isSelected = selectedEmployeeIds.includes(emp.id);
                  return (
                    <button
                      key={emp.id}
                      type="button"
                      onClick={() => toggleEmployee(emp.id)}
                      className={cn(
                        "p-2.5 rounded-xl border text-xs text-left transition-all relative flex flex-col justify-between",
                        isSelected
                          ? "bg-blue-600 border-blue-600 text-white font-bold shadow-sm"
                          : "bg-white border-slate-200 text-slate-700 hover:border-blue-300"
                      )}
                    >
                      <div className="flex items-start justify-between gap-1 w-full">
                        <p className="truncate font-bold text-xs">{emp.name}</p>
                        {isSelected ? (
                          <span className="w-4 h-4 rounded-full bg-white/25 flex items-center justify-center text-white shrink-0">
                            <Check size={11} strokeWidth={3} />
                          </span>
                        ) : (
                          <span className="w-4 h-4 rounded-full border border-slate-300 shrink-0" />
                        )}
                      </div>
                      <span className={cn(
                        "text-[10px] mt-1 block font-semibold",
                        isSelected ? "text-blue-100" : "text-slate-400"
                      )}>
                        {isSelected ? `Dapat: ${formatCurrency(wagePerPerson)}` : '+ Klik untuk pilih'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Status Pembayaran (Lunas / Belum Lunas) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Status Pembayaran
              </label>
              <span className={cn(
                "text-[10px] font-black uppercase px-2 py-0.5 rounded-full border",
                paymentStatus === 'unpaid'
                  ? "bg-rose-100 text-rose-800 border-rose-300"
                  : "bg-emerald-100 text-emerald-800 border-emerald-300"
              )}>
                {paymentStatus === 'unpaid' ? 'Belum Lunas / Kasbon' : 'Lunas'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentStatus('paid')}
                className={cn(
                  "p-2.5 rounded-xl border text-center transition-all flex items-center justify-center gap-2 cursor-pointer font-black text-xs",
                  paymentStatus === 'paid'
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-sm ring-2 ring-emerald-200"
                    : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                )}
              >
                <Check size={16} />
                <span>Lunas (Dibayar Sekarang)</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentStatus('unpaid')}
                className={cn(
                  "p-2.5 rounded-xl border text-center transition-all flex items-center justify-center gap-2 cursor-pointer font-black text-xs",
                  paymentStatus === 'unpaid'
                    ? "bg-rose-600 text-white border-rose-600 shadow-sm ring-2 ring-rose-200"
                    : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                )}
              >
                <AlertCircle size={16} />
                <span>Belum Lunas (Bayar Nanti)</span>
              </button>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Metode Pembayaran
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setPaymentMethod('cash');
                  if (!cashGiven || numCashGiven === 0) setCashGiven(totalAmount.toString());
                }}
                className={cn(
                  "p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5",
                  paymentMethod === 'cash'
                    ? "bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-200"
                    : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                )}
              >
                <Banknote size={20} />
                <span className="font-bold text-xs">Tunai / Cash</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('qris')}
                className={cn(
                  "p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5",
                  paymentMethod === 'qris'
                    ? "bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-200"
                    : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                )}
              >
                <QrCode size={20} />
                <span className="font-bold text-xs">QRIS</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('transfer')}
                className={cn(
                  "p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5",
                  paymentMethod === 'transfer'
                    ? "bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-200"
                    : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                )}
              >
                <CreditCard size={20} />
                <span className="font-bold text-xs">Transfer Bank</span>
              </button>
            </div>
          </div>

          {/* Cash Payment Details: Input Uang Diterima & Kembalian */}
          {paymentMethod === 'cash' && (
            <div className="p-4 bg-blue-50/70 rounded-2xl border border-blue-100 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Calculator size={14} className="text-blue-600" />
                  Jumlah Uang Diterima (Tunai)
                </label>
                <span className="text-[11px] text-slate-500 font-medium">Uang Pas / Nominal</span>
              </div>

              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-sm font-bold text-slate-400">Rp</span>
                <input
                  type="text"
                  value={cashGiven}
                  onChange={(e) => setCashGiven(e.target.value)}
                  placeholder="0"
                  className="w-full pl-11 pr-4 py-3 bg-white border-2 border-blue-200 focus:border-blue-600 rounded-xl outline-none font-bold text-lg text-slate-800 transition-all"
                />
              </div>

              {/* Quick Cash Presets */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {cashSuggestions.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setCashGiven(amt.toString())}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-bold border transition-all",
                      numCashGiven === amt
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white border-blue-200 text-blue-700 hover:bg-blue-100"
                    )}
                  >
                    {amt === totalAmount ? 'Uang Pas' : formatCurrency(amt)}
                  </button>
                ))}
              </div>

              {/* Change calculation display */}
              <div className="pt-2 border-t border-blue-200/60 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600">Uang Kembalian:</span>
                <span className={cn(
                  "text-lg font-display font-bold",
                  isCashShort ? "text-red-500" : "text-emerald-600"
                )}>
                  {isCashShort 
                    ? `Kurang ${formatCurrency(totalAmount - numCashGiven)}` 
                    : formatCurrency(changeAmount)
                  }
                </span>
              </div>
            </div>
          )}

          {/* Optional Customer Phone for WhatsApp Receipt */}
          <div className="space-y-2 p-3.5 bg-emerald-50/70 rounded-2xl border border-emerald-100">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Phone size={14} className="text-emerald-600" />
                <span>Nomor WhatsApp Pelanggan (Opsional)</span>
              </label>
              {customerPhone.trim() ? (
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                  {formatPhoneNumberDisplay(customerPhone)}
                </span>
              ) : (
                <span className="text-[10px] text-slate-400">Kirim nota via WA</span>
              )}
            </div>
            <input
              type="tel"
              placeholder="Contoh: 08123456789 atau 62812..."
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-emerald-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 rounded-xl outline-none text-xs font-bold text-slate-800 transition-all placeholder:text-slate-400 placeholder:font-normal"
            />
            {customerPhone.trim() && (
              <label className="flex items-center gap-2 cursor-pointer pt-0.5 text-[11px] font-semibold text-emerald-900 select-none">
                <input
                  type="checkbox"
                  checked={autoSendWhatsApp}
                  onChange={(e) => setAutoSendWhatsApp(e.target.checked)}
                  className="rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                />
                <span>Kirim ringkasan nota otomatis via link WhatsApp setelah bayar</span>
              </label>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-white text-xs font-bold transition-all text-center"
          >
            Batal
          </button>

          <button
            type="button"
            disabled={isCashShort}
            onClick={handleConfirm}
            className={cn(
              "w-full sm:w-auto px-8 py-3 rounded-2xl text-white font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg",
              isCashShort 
                ? "bg-slate-300 cursor-not-allowed text-slate-500 shadow-none" 
                : "bg-blue-600 hover:bg-blue-700 shadow-blue-200 active:scale-95"
            )}
          >
            <span>Selesaikan & Cetak Nota</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </motion.div>
    </div>
  );
};
