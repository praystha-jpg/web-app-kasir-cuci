import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Save, 
  Car, 
  Bike, 
  Coffee, 
  Users, 
  CreditCard, 
  Banknote, 
  QrCode, 
  Plus, 
  Minus, 
  Trash2, 
  Calendar, 
  Clock, 
  Check, 
  FileText, 
  Phone,
  Share2,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, parseISO } from 'date-fns';
import { 
  type Transaction, 
  type VehicleType, 
  type VehicleSize, 
  type Drink, 
  type Employee, 
  type AssignedEmployee,
  type PaymentMethod,
  type PaymentStatus,
  type WageUnitConfig,
  type CarCategoryPreset,
  INITIAL_WAGE_UNIT_CONFIG,
  calculateSplitUnitWage,
  cn 
} from '../lib/utils';
import { detectVehicleSize } from '../lib/vehicleClassifier';
import { openWhatsAppReceipt, formatPhoneNumberDisplay } from '../lib/whatsapp';

interface EditTransactionModalProps {
  isOpen: boolean;
  transaction: Transaction | null;
  onClose: () => void;
  onSave: (updatedTransaction: Transaction) => void;
  vehicleTypes: VehicleType[];
  employees: Employee[];
  drinks: Drink[];
  carCategories?: CarCategoryPreset[];
  motorCategories?: CarCategoryPreset[];
  wageUnitConfig?: WageUnitConfig;
}

export const EditTransactionModal: React.FC<EditTransactionModalProps> = ({
  isOpen,
  transaction,
  onClose,
  onSave,
  vehicleTypes,
  employees,
  drinks,
  carCategories = [],
  motorCategories = [],
  wageUnitConfig = INITIAL_WAGE_UNIT_CONFIG,
}) => {
  if (!isOpen || !transaction) return null;

  return (
    <EditTransactionModalForm
      key={transaction.id}
      transaction={transaction}
      onClose={onClose}
      onSave={onSave}
      vehicleTypes={vehicleTypes}
      employees={employees}
      drinks={drinks}
      carCategories={carCategories}
      motorCategories={motorCategories}
      wageUnitConfig={wageUnitConfig}
    />
  );
};

interface EditFormProps {
  transaction: Transaction;
  onClose: () => void;
  onSave: (updatedTransaction: Transaction) => void;
  vehicleTypes: VehicleType[];
  employees: Employee[];
  drinks: Drink[];
  carCategories: CarCategoryPreset[];
  motorCategories: CarCategoryPreset[];
  wageUnitConfig: WageUnitConfig;
}

const EditTransactionModalForm: React.FC<EditFormProps> = ({
  transaction,
  onClose,
  onSave,
  vehicleTypes,
  employees,
  drinks,
  carCategories,
  motorCategories,
  wageUnitConfig,
}) => {
  // Determine initial vehicle category
  const initialWashItem = transaction.items.find(i => i.category === 'wash');
  const hasWash = !!initialWashItem || !!transaction.vehicleTypeId;

  const [hasWashService, setHasWashService] = useState<boolean>(hasWash);
  const [vehicleTypeId, setVehicleTypeId] = useState<string>(transaction.vehicleTypeId || 'mobil');
  const [size, setSize] = useState<VehicleSize>(transaction.size || 'Sedang');
  const [carCategory, setCarCategory] = useState<string>(transaction.carCategory || '');
  const [plateNumber, setPlateNumber] = useState<string>(transaction.plateNumber && transaction.plateNumber !== '-' ? transaction.plateNumber : '');
  
  // Custom wash price (defaults to standard price from vehicleTypes)
  const currentVehicleType = vehicleTypes.find(v => v.id === vehicleTypeId);
  const defaultWashPrice = currentVehicleType ? currentVehicleType.prices[size] || 0 : (initialWashItem?.price || 0);
  const [washPrice, setWashPrice] = useState<number>(initialWashItem ? initialWashItem.price : defaultWashPrice);
  const [isCustomWashPrice, setIsCustomWashPrice] = useState<boolean>(
    initialWashItem ? initialWashItem.price !== defaultWashPrice : false
  );

  // Drinks items
  const initialDrinkItems = transaction.items.filter(i => i.category === 'drink');
  const [drinkItems, setDrinkItems] = useState<{ name: string; price: number; quantity: number }[]>(
    initialDrinkItems.map(d => ({ name: d.name, price: d.price, quantity: d.quantity || 1 }))
  );
  const [selectedDrinkToAdd, setSelectedDrinkToAdd] = useState<string>('');

  // Assigned Employees
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>(() => {
    if (transaction.assignedEmployees && transaction.assignedEmployees.length > 0) {
      return transaction.assignedEmployees.map(e => e.id);
    }
    if (transaction.employeeId) {
      return [transaction.employeeId];
    }
    return [];
  });

  // Payment details
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(transaction.paymentMethod || 'cash');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(transaction.paymentStatus || 'paid');
  const [amountPaid, setAmountPaid] = useState<number>(transaction.amountPaid || transaction.price);
  const [customerPhone, setCustomerPhone] = useState<string>(transaction.customerPhone || '');
  const [notes, setNotes] = useState<string>(transaction.notes || '');
  const [cashierName, setCashierName] = useState<string>(transaction.cashierName || 'Kasir');

  // Timestamp
  const formatIsoForDatetimeLocal = (isoString: string) => {
    try {
      const d = parseISO(isoString);
      return format(d, "yyyy-MM-dd'T'HH:mm");
    } catch {
      return format(new Date(), "yyyy-MM-dd'T'HH:mm");
    }
  };
  const [datetimeLocal, setDatetimeLocal] = useState<string>(formatIsoForDatetimeLocal(transaction.timestamp));

  // Auto update wash price when vehicle type or size changes (unless custom price enabled)
  useEffect(() => {
    if (!isCustomWashPrice && currentVehicleType) {
      setWashPrice(currentVehicleType.prices[size] || 0);
    }
  }, [vehicleTypeId, size, isCustomWashPrice, currentVehicleType]);

  // Suggestions for vehicle model
  const handleModelChange = (val: string) => {
    setCarCategory(val);
    if (!isCustomWashPrice) {
      const presets = vehicleTypeId === 'motor' ? motorCategories : carCategories;
      const detected = detectVehicleSize(val, vehicleTypeId, presets);
      if (detected) {
        setSize(detected.size);
      }
    }
  };

  // Drinks handlers
  const handleAddDrink = () => {
    if (!selectedDrinkToAdd) return;
    const drinkObj = drinks.find(d => d.id === selectedDrinkToAdd);
    if (!drinkObj) return;

    setDrinkItems(prev => {
      const existingIdx = prev.findIndex(item => item.name === drinkObj.name);
      if (existingIdx >= 0) {
        const next = [...prev];
        next[existingIdx].quantity += 1;
        return next;
      } else {
        return [...prev, { name: drinkObj.name, price: drinkObj.price, quantity: 1 }];
      }
    });
    setSelectedDrinkToAdd('');
  };

  const handleUpdateDrinkQuantity = (idx: number, delta: number) => {
    setDrinkItems(prev => {
      const next = [...prev];
      const newQty = next[idx].quantity + delta;
      if (newQty <= 0) {
        return next.filter((_, i) => i !== idx);
      }
      next[idx].quantity = newQty;
      return next;
    });
  };

  const handleRemoveDrink = (idx: number) => {
    setDrinkItems(prev => prev.filter((_, i) => i !== idx));
  };

  // Employee toggle
  const toggleEmployee = (empId: string) => {
    setSelectedEmployeeIds(prev => 
      prev.includes(empId) ? prev.filter(id => id !== empId) : [...prev, empId]
    );
  };

  // Computations
  const totalDrinksPrice = drinkItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const effectiveWashPrice = hasWashService ? washPrice : 0;
  const totalPrice = effectiveWashPrice + totalDrinksPrice;

  // Wage split calculation
  const selectedEmps = employees.filter(e => selectedEmployeeIds.includes(e.id));
  const { totalUnitWage, wagePerPerson } = useMemo(() => {
    if (!hasWashService || selectedEmps.length === 0) {
      return { totalUnitWage: 0, wagePerPerson: 0 };
    }
    return calculateSplitUnitWage(
      vehicleTypeId,
      effectiveWashPrice,
      selectedEmps.length,
      wageUnitConfig
    );
  }, [hasWashService, vehicleTypeId, effectiveWashPrice, selectedEmps.length, wageUnitConfig]);

  const changeAmount = paymentMethod === 'cash' ? Math.max(0, amountPaid - totalPrice) : 0;

  const formatCurrency = (val: number) => 'Rp ' + (val || 0).toLocaleString('id-ID');

  const handleSave = () => {
    const updatedItems: Transaction['items'] = [];

    if (hasWashService) {
      const selectedTypeObj = vehicleTypes.find(v => v.id === vehicleTypeId);
      const vehicleLabel = selectedTypeObj ? selectedTypeObj.name : (vehicleTypeId === 'motor' ? 'Motor' : 'Mobil');
      const categoryTag = carCategory.trim() ? ` • ${carCategory.trim()}` : '';

      updatedItems.push({
        name: `${vehicleLabel} (${size})${categoryTag}`,
        price: washPrice,
        category: 'wash',
        quantity: 1,
      });
    }

    drinkItems.forEach(item => {
      updatedItems.push({
        name: item.name,
        price: item.price,
        category: 'drink',
        quantity: item.quantity,
      });
    });

    const assignedEmployees: AssignedEmployee[] = selectedEmps.map(emp => ({
      id: emp.id,
      name: emp.name,
      wageEarned: wagePerPerson,
    }));

    // Convert local datetime to ISO string
    let finalTimestamp = transaction.timestamp;
    try {
      const parsedDate = new Date(datetimeLocal);
      if (!isNaN(parsedDate.getTime())) {
        finalTimestamp = parsedDate.toISOString();
      }
    } catch {
      // keep existing timestamp if invalid
    }

    const updatedTx: Transaction = {
      ...transaction,
      vehicleTypeId: hasWashService ? vehicleTypeId : undefined,
      vehicleTypeName: hasWashService ? (currentVehicleType?.name || (vehicleTypeId === 'motor' ? 'Motor' : 'Mobil')) : undefined,
      plateNumber: plateNumber.trim().toUpperCase() || '-',
      carCategory: hasWashService && carCategory.trim() ? carCategory.trim() : undefined,
      size: hasWashService ? size : undefined,
      price: totalPrice,
      paymentMethod,
      paymentStatus,
      amountPaid: paymentMethod === 'cash' ? amountPaid : totalPrice,
      changeAmount,
      customerPhone: customerPhone.trim() || undefined,
      notes: notes.trim() || undefined,
      items: updatedItems,
      employeeId: assignedEmployees.length > 0 ? assignedEmployees[0].id : undefined,
      employeeName: assignedEmployees.length > 0 ? assignedEmployees.map(e => e.name).join(', ') : undefined,
      employeeWage: totalUnitWage > 0 ? totalUnitWage : undefined,
      assignedEmployees: assignedEmployees.length > 0 ? assignedEmployees : undefined,
      totalUnitWage: totalUnitWage > 0 ? totalUnitWage : undefined,
      wagePerPerson: wagePerPerson > 0 ? wagePerPerson : undefined,
      cashierName: cashierName.trim() || 'Kasir',
      timestamp: finalTimestamp,
    };

    onSave(updatedTx);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 15 }}
        className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-200">
              <FileText size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-800 text-base sm:text-lg">Edit Transaksi</h3>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold text-xs border border-blue-200">
                  #{transaction.orderNumber || transaction.id.slice(0, 8).toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Perbaiki kesalahan input plat, tipe kendaraan, upah petugas, atau tarif
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 text-slate-800">
          
          {/* Section 1: Layanan Cuci & Kendaraan */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Car size={14} className="text-blue-600" />
                <span>1. Layanan Cuci & Kendaraan</span>
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setHasWashService(!hasWashService)}
                  className={cn(
                    "text-xs px-2.5 py-1 rounded-lg font-bold border transition-colors cursor-pointer",
                    hasWashService 
                      ? "bg-blue-50 text-blue-700 border-blue-200" 
                      : "bg-slate-100 text-slate-500 border-slate-200"
                  )}
                >
                  {hasWashService ? '✓ Layanan Cuci Aktif' : '+ Aktifkan Cuci'}
                </button>
              </div>
            </div>

            {hasWashService && (
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-4">
                {/* Jenis Kendaraan Tabs */}
                <div>
                  <span className="text-[11px] font-bold text-slate-500 block mb-1.5">Pilih Jenis Kendaraan:</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setVehicleTypeId('mobil')}
                      className={cn(
                        "py-2.5 px-3 rounded-xl border font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer",
                        vehicleTypeId === 'mobil'
                          ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                      )}
                    >
                      <Car size={16} />
                      <span>Mobil</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setVehicleTypeId('motor')}
                      className={cn(
                        "py-2.5 px-3 rounded-xl border font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer",
                        vehicleTypeId === 'motor'
                          ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                      )}
                    >
                      <Bike size={16} />
                      <span>Motor</span>
                    </button>
                  </div>
                </div>

                {/* Plat & Tipe Model */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 block mb-1">
                      Nomor Plat Kendaraan:
                    </label>
                    <input
                      type="text"
                      value={plateNumber}
                      onChange={(e) => setPlateNumber(e.target.value.toUpperCase())}
                      placeholder="Contoh: DK 1234 AB"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800 uppercase focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-500 block mb-1">
                      Tipe / Model Kendaraan:
                    </label>
                    <input
                      type="text"
                      value={carCategory}
                      onChange={(e) => handleModelChange(e.target.value)}
                      placeholder={vehicleTypeId === 'mobil' ? 'Contoh: Avanza, Brio, Innova' : 'Contoh: Beat, Vario, NMAX'}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>

                {/* Ukuran Kendaraan */}
                <div>
                  <span className="text-[11px] font-bold text-slate-500 block mb-1.5">Ukuran Kendaraan:</span>
                  <div className="grid grid-cols-3 gap-2">
                    {(['Kecil', 'Sedang', 'Besar'] as VehicleSize[]).map((s) => {
                      const isSelected = size === s;
                      const sizePrice = currentVehicleType?.prices[s] || 0;
                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() => {
                            setSize(s);
                            if (!isCustomWashPrice && currentVehicleType) {
                              setWashPrice(currentVehicleType.prices[s] || 0);
                            }
                          }}
                          className={cn(
                            "p-2.5 rounded-xl border text-center transition-all cursor-pointer",
                            isSelected
                              ? "bg-blue-50 border-blue-500 text-blue-700 ring-2 ring-blue-200"
                              : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700"
                          )}
                        >
                          <p className="font-bold text-xs sm:text-sm">{s}</p>
                          <p className="text-[11px] font-semibold text-slate-500">{formatCurrency(sizePrice)}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Tarif Cuci & Custom Price */}
                <div className="pt-2 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-600">Tarif Layanan Cuci:</span>
                    <button
                      type="button"
                      onClick={() => {
                        const next = !isCustomWashPrice;
                        setIsCustomWashPrice(next);
                        if (!next && currentVehicleType) {
                          setWashPrice(currentVehicleType.prices[size] || 0);
                        }
                      }}
                      className="text-[11px] text-blue-600 hover:underline font-semibold"
                    >
                      {isCustomWashPrice ? 'Gunakan Tarif Standar' : 'Ubah Tarif Manual'}
                    </button>
                  </div>

                  {isCustomWashPrice ? (
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-400">Rp</span>
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        value={washPrice}
                        onChange={(e) => setWashPrice(Math.max(0, parseInt(e.target.value, 10) || 0))}
                        className="w-32 px-2.5 py-1.5 bg-white border border-blue-400 rounded-xl text-sm font-bold text-blue-700 text-right outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  ) : (
                    <span className="text-sm font-bold text-blue-700">
                      {formatCurrency(washPrice)}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Produk Tambahan / Minuman */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Coffee size={14} className="text-amber-600" />
              <span>2. Produk Tambahan / Minuman (F&B)</span>
            </label>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
              {drinkItems.length === 0 ? (
                <p className="text-xs text-slate-400 italic">Tidak ada item minuman di transaksi ini.</p>
              ) : (
                <div className="space-y-2">
                  {drinkItems.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200 text-xs">
                      <div>
                        <span className="font-bold text-slate-800">{item.name}</span>
                        <span className="text-slate-400 ml-2">(@{formatCurrency(item.price)})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                          <button
                            type="button"
                            onClick={() => handleUpdateDrinkQuantity(idx, -1)}
                            className="p-1 hover:bg-slate-200 text-slate-600"
                            title="Kurang satu"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="px-2 font-bold text-slate-700">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => handleUpdateDrinkQuantity(idx, 1)}
                            className="p-1 hover:bg-slate-200 text-slate-600"
                            title="Tambah satu"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                        <span className="font-bold text-slate-700 min-w-[70px] text-right">
                          {formatCurrency(item.price * item.quantity)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveDrink(idx)}
                          className="p-1 text-slate-400 hover:text-red-500 rounded"
                          title="Hapus item"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Drink Selector */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
                <select
                  value={selectedDrinkToAdd}
                  onChange={(e) => setSelectedDrinkToAdd(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none"
                >
                  <option value="">-- Tambah Minuman / Item --</option>
                  {drinks.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({formatCurrency(d.price)})
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleAddDrink}
                  disabled={!selectedDrinkToAdd}
                  className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Tambah</span>
                </button>
              </div>
            </div>
          </div>

          {/* Section 3: Petugas Cuci / Washer */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Users size={14} className="text-blue-600" />
                <span>3. Petugas Cuci (Washer)</span>
              </label>
              {selectedEmps.length > 0 && (
                <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                  {selectedEmps.length} Petugas Dipilih
                </span>
              )}
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
              <p className="text-xs text-slate-500">
                Pilih petugas yang mengerjakan kendaraan ini. Upah per unit ({formatCurrency(totalUnitWage)}) akan dibagi rata secara otomatis.
              </p>

              <div className="flex flex-wrap gap-2">
                {employees.map(emp => {
                  const isAssigned = selectedEmployeeIds.includes(emp.id);
                  return (
                    <button
                      key={emp.id}
                      type="button"
                      onClick={() => toggleEmployee(emp.id)}
                      className={cn(
                        "px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer",
                        isAssigned
                          ? "bg-amber-500 text-white border-amber-500 shadow-xs"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                      )}
                    >
                      {isAssigned && <Check size={13} />}
                      <span>{emp.name}</span>
                    </button>
                  );
                })}
              </div>

              {selectedEmps.length > 0 && totalUnitWage > 0 && (
                <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/70 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-amber-900">
                  <span>Alokasi Upah: <strong>{formatCurrency(totalUnitWage)}</strong></span>
                  <span className="font-bold">
                    = {formatCurrency(wagePerPerson)} / orang ({selectedEmps.length} washer)
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Section 4: Pembayaran & Data Pelanggan */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Banknote size={14} className="text-emerald-600" />
              <span>4. Rincian Pembayaran & Info Tambahan</span>
            </label>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
              {/* Status Pembayaran (Lunas / Belum Lunas) */}
              <div>
                <span className="text-[11px] font-bold text-slate-700 block mb-1.5 flex items-center justify-between">
                  <span>Status Pembayaran:</span>
                  <span className={cn(
                    "text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border",
                    paymentStatus === 'unpaid'
                      ? "bg-rose-100 text-rose-800 border-rose-300"
                      : "bg-emerald-100 text-emerald-800 border-emerald-300"
                  )}>
                    {paymentStatus === 'unpaid' ? 'Belum Lunas' : 'Lunas'}
                  </span>
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentStatus('paid')}
                    className={cn(
                      "py-2.5 px-3 rounded-xl border text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer",
                      paymentStatus === 'paid'
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-200 ring-2 ring-emerald-300/40"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                    )}
                  >
                    <Check size={15} />
                    <span>Lunas (Sudah Bayar)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentStatus('unpaid')}
                    className={cn(
                      "py-2.5 px-3 rounded-xl border text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer",
                      paymentStatus === 'unpaid'
                        ? "bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-200 ring-2 ring-rose-300/40"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                    )}
                  >
                    <AlertCircle size={15} />
                    <span>Belum Lunas (Kasbon/Pending)</span>
                  </button>
                </div>
              </div>

              {/* Metode Pembayaran */}
              <div>
                <span className="text-[11px] font-bold text-slate-500 block mb-1.5">Metode Pembayaran:</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'cash', label: 'Tunai', icon: Banknote },
                    { id: 'qris', label: 'QRIS', icon: QrCode },
                    { id: 'transfer', label: 'Transfer', icon: CreditCard },
                    { id: 'debit', label: 'Debit', icon: CreditCard },
                  ].map(method => {
                    const isSelected = paymentMethod === method.id;
                    const Icon = method.icon;
                    return (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => setPaymentMethod(method.id as PaymentMethod)}
                        className={cn(
                          "py-2 px-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer",
                          isSelected
                            ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                        )}
                      >
                        <Icon size={14} />
                        <span>{method.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Cash Given & Change if cash */}
              {paymentMethod === 'cash' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 block mb-1">
                      Nominal Diterima:
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      value={amountPaid}
                      onChange={(e) => setAmountPaid(parseInt(e.target.value, 10) || 0)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 block mb-1">
                      Kembalian:
                    </label>
                    <div className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-sm font-bold text-slate-700">
                      {formatCurrency(changeAmount)}
                    </div>
                  </div>
                </div>
              )}

              {/* Tanggal & Waktu, Pelanggan, Kasir */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="text-[11px] font-bold text-slate-500 flex items-center gap-1 mb-1">
                    <Calendar size={12} />
                    <span>Waktu & Tanggal Transaksi:</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={datetimeLocal}
                    onChange={(e) => setDatetimeLocal(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                      <Phone size={12} className="text-emerald-600" />
                      <span>WhatsApp Pelanggan:</span>
                    </label>
                    {customerPhone.trim() && (
                      <button
                        type="button"
                        onClick={() => openWhatsAppReceipt({
                          ...transaction,
                          customerPhone: customerPhone.trim(),
                        }, {
                          shopName: "D'CarWash",
                          shopAddress: "Jl. Jelantik Gingsir Sukasada",
                          shopPhone: "0812-3456-7890"
                        })}
                        className="text-[10px] text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1 cursor-pointer"
                        title="Kirim Nota via WhatsApp"
                      >
                        <Share2 size={11} /> Kirim Nota WA
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="Contoh: 08123456789 atau 62812..."
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-[11px] font-bold text-slate-500 block mb-1">
                    Nama Kasir:
                  </label>
                  <input
                    type="text"
                    value={cashierName}
                    onChange={(e) => setCashierName(e.target.value)}
                    placeholder="Nama Kasir"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-500 block mb-1">
                    Catatan Khusus:
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Catatan tambahan..."
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer with Summary & Buttons */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
            <span className="text-xs text-slate-500 font-semibold">Total Tagihan Baru:</span>
            <span className="text-xl font-display font-bold text-blue-600">
              {formatCurrency(totalPrice)}
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-md shadow-blue-200 cursor-pointer active:scale-95"
            >
              <Save size={15} />
              <span>Simpan Perubahan</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
