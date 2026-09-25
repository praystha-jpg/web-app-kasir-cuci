/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Car, 
  Bike, 
  History, 
  BarChart3, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  ChevronRight,
  PlusCircle,
  Clock,
  Settings,
  X,
  Download,
  Coffee,
  ShoppingCart,
  Minus,
  Tag,
  Sparkles,
  RotateCcw,
  Edit3,
  Receipt,
  Printer,
  Share2,
  Store,
  Cloud,
  Users,
  UserCheck,
  Scale,
  Search,
  Calendar,
  Filter,
  Lock,
  ShieldCheck,
  LogOut,
  KeyRound
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  format, 
  startOfDay, 
  startOfWeek, 
  startOfMonth, 
  isSameDay, 
  isSameWeek, 
  isSameMonth, 
  subDays,
  parseISO 
} from 'date-fns';
import { id as idLoc } from 'date-fns/locale';
import { 
  cn, 
  type Transaction, 
  type VehicleType, 
  type VehicleSize, 
  type Drink, 
  type CarCategoryPreset,
  type PaymentMethod,
  type Employee,
  type WageUnitConfig,
  type AssignedEmployee,
  type AuthUser,
  type SecurityConfig,
  type UserRole,
  calculateEmployeeWage,
  calculateSplitUnitWage,
  INITIAL_VEHICLE_TYPES,
  INITIAL_DRINKS,
  INITIAL_CAR_CATEGORIES,
  INITIAL_MOTOR_CATEGORIES,
  INITIAL_EMPLOYEES,
  INITIAL_WAGE_UNIT_CONFIG,
  INITIAL_SECURITY_CONFIG
} from './lib/utils';
import { PaymentModal } from './components/PaymentModal';
import { ReceiptModal } from './components/ReceiptModal';
import { DriveSyncManager } from './components/DriveSyncManager';
import { EmployeeManager } from './components/EmployeeManager';
import { ProfitReport } from './components/ProfitReport';
import { LoginScreen } from './components/LoginScreen';
import { AdminPinDialog } from './components/AdminPinDialog';
import { SecurityManager } from './components/SecurityManager';
import { PWAInstallButton } from './components/PWAInstallButton';
import { OfflineIndicator } from './components/OfflineIndicator';
import { detectVehicleSize, getVehicleSuggestions } from './lib/vehicleClassifier';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { 
  auth,
  testConnection, 
  subscribeTransactions, 
  syncSaveTransaction, 
  syncDeleteTransaction,
  subscribeEmployees,
  syncSaveEmployee,
  syncDeleteEmployee,
  subscribeVehicleTypes,
  syncSaveVehicleType,
  subscribeDrinks,
  syncSaveDrink,
  syncDeleteDrink,
  subscribeCarCategories,
  syncSaveCarCategory,
  subscribeMotorCategories,
  syncSaveMotorCategory,
  subscribeSettings,
  syncSaveShopProfile,
  syncSaveWageUnitConfig,
  syncSaveSecurityConfig,
  seedInitialCloudDataIfEmpty
} from './lib/firebaseSync';
import { CloudSyncStatus } from './components/CloudSyncStatus';

export default function App() {
  const [activeTab, setActiveTab] = useState<'cashier' | 'history' | 'reports' | 'employees' | 'settings' | 'drive'>('cashier');
  
  // User Authentication & Access Control States
  const [securityConfig, setSecurityConfig] = useState<SecurityConfig>(() => {
    const saved = localStorage.getItem('securityConfig');
    return saved ? JSON.parse(saved) : INITIAL_SECURITY_CONFIG;
  });

  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem('currentUser');
    return saved ? JSON.parse(saved) : null;
  });

  const [isAdminPinModalOpen, setIsAdminPinModalOpen] = useState(false);
  const [pendingRestrictedTab, setPendingRestrictedTab] = useState<'reports' | 'employees' | 'settings' | 'drive' | null>(null);

  useEffect(() => {
    localStorage.setItem('securityConfig', JSON.stringify(securityConfig));
  }, [securityConfig]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('currentUser');
    }
  }, [currentUser]);

  const handleTabClick = (tab: typeof activeTab) => {
    const isRestricted = ['reports', 'employees', 'settings', 'drive'].includes(tab);
    if (isRestricted && currentUser?.role === 'cashier') {
      setPendingRestrictedTab(tab as any);
      setIsAdminPinModalOpen(true);
      return;
    }
    setActiveTab(tab);
  };

  const handleAdminPinSuccess = () => {
    setIsAdminPinModalOpen(false);
    if (pendingRestrictedTab) {
      setActiveTab(pendingRestrictedTab);
      setPendingRestrictedTab(null);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveTab('cashier');
  };
  
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>(() => {
    const saved = localStorage.getItem('vehicleTypes');
    return saved ? JSON.parse(saved) : INITIAL_VEHICLE_TYPES;
  });
  const [drinks, setDrinks] = useState<Drink[]>(() => {
    const saved = localStorage.getItem('drinks');
    return saved ? JSON.parse(saved) : INITIAL_DRINKS;
  });
  const [carCategories, setCarCategories] = useState<CarCategoryPreset[]>(() => {
    const saved = localStorage.getItem('carCategories');
    return saved ? JSON.parse(saved) : INITIAL_CAR_CATEGORIES;
  });
  const [motorCategories, setMotorCategories] = useState<CarCategoryPreset[]>(() => {
    const saved = localStorage.getItem('motorCategories');
    return saved ? JSON.parse(saved) : INITIAL_MOTOR_CATEGORIES;
  });
  const [employees, setEmployees] = useState<Employee[]>(() => {
    const saved = localStorage.getItem('employees');
    return saved ? JSON.parse(saved) : INITIAL_EMPLOYEES;
  });
  const [wageUnitConfig, setWageUnitConfig] = useState<WageUnitConfig>(() => {
    const saved = localStorage.getItem('wageUnitConfig');
    return saved ? JSON.parse(saved) : INITIAL_WAGE_UNIT_CONFIG;
  });
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('transactions');
    return saved ? JSON.parse(saved) : [];
  });

  // Shop Profile info for receipts
  const [shopName, setShopName] = useState(() => localStorage.getItem('shopName') || "D'CarWash");
  const [shopAddress, setShopAddress] = useState(() => localStorage.getItem('shopAddress') || "Jl. Jelantik Gingsir Sukasada, Layanan Cuci Mobil & Motor");
  const [shopPhone, setShopPhone] = useState(() => localStorage.getItem('shopPhone') || "0812-3456-7890");

  const [selectedVehicle, setSelectedVehicle] = useState<VehicleType | null>(null);
  const [selectedSize, setSelectedSize] = useState<VehicleSize | null>(null);
  const [carCategory, setCarCategory] = useState('');
  const [plateNumber, setPlateNumber] = useState('');
  const [drinkCart, setDrinkCart] = useState<{drink: Drink, quantity: number}[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);

  // Modal states for payment & receipt
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [activeReceiptTransaction, setActiveReceiptTransaction] = useState<Transaction | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  // Filter states for Histori Transaksi
  const [historyPlateQuery, setHistoryPlateQuery] = useState('');
  const [historyDatePreset, setHistoryDatePreset] = useState<'all' | 'today' | 'last7' | 'thisMonth' | 'custom'>('all');
  const [historyStartDate, setHistoryStartDate] = useState('');
  const [historyEndDate, setHistoryEndDate] = useState('');

  // Cloud Sync state (Multi-Device Firestore Synchronization)
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Validate Firestore connection on boot (Mandated by Firebase Skill)
  useEffect(() => {
    testConnection();
  }, []);

  // Firebase Auth listener
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        setIsSyncing(true);
        try {
          await seedInitialCloudDataIfEmpty({
            transactions,
            employees,
            vehicleTypes,
            drinks,
            carCategories,
            motorCategories,
            shopProfile: { shopName, shopAddress, shopPhone },
            wageUnitConfig,
            securityConfig
          });
        } catch (e) {
          console.warn('Initial cloud seed check:', e);
        }
        setIsSyncing(false);
      }
    });
    return () => unsubAuth();
  }, []);

  // Real-time Cloud Firestore Subscriptions across all connected devices
  useEffect(() => {
    if (!firebaseUser) return;

    const unsubs: (() => void)[] = [];

    // 1. Transactions subscription
    const unsubTx = subscribeTransactions(
      (remoteTxs) => {
        setTransactions(remoteTxs);
        setLastSyncedAt(new Date());
      },
      (err) => {
        console.error('Tx sync error:', err);
        setSyncError(err.message);
      }
    );
    unsubs.push(unsubTx);

    // 2. Employees subscription
    const unsubEmp = subscribeEmployees((remoteEmps) => {
      if (remoteEmps && remoteEmps.length > 0) {
        setEmployees(remoteEmps);
      }
    });
    unsubs.push(unsubEmp);

    // 3. Vehicle Types subscription
    const unsubVT = subscribeVehicleTypes((remoteVTs) => {
      if (remoteVTs && remoteVTs.length > 0) {
        setVehicleTypes(remoteVTs);
      }
    });
    unsubs.push(unsubVT);

    // 4. Drinks subscription
    const unsubDrinks = subscribeDrinks((remoteDrinks) => {
      if (remoteDrinks && remoteDrinks.length > 0) {
        setDrinks(remoteDrinks);
      }
    });
    unsubs.push(unsubDrinks);

    // 5. Presets subscriptions
    const unsubCarCat = subscribeCarCategories((remoteCats) => {
      if (remoteCats && remoteCats.length > 0) {
        setCarCategories(remoteCats);
      }
    });
    unsubs.push(unsubCarCat);

    const unsubMotorCat = subscribeMotorCategories((remoteCats) => {
      if (remoteCats && remoteCats.length > 0) {
        setMotorCategories(remoteCats);
      }
    });
    unsubs.push(unsubMotorCat);

    // 6. Settings subscription
    const unsubSettings = subscribeSettings((remoteSettings) => {
      if (remoteSettings.shop) {
        if (remoteSettings.shop.shopName) setShopName(remoteSettings.shop.shopName);
        if (remoteSettings.shop.shopAddress) setShopAddress(remoteSettings.shop.shopAddress);
        if (remoteSettings.shop.shopPhone) setShopPhone(remoteSettings.shop.shopPhone);
      }
      if (remoteSettings.wageConfig) {
        setWageUnitConfig(remoteSettings.wageConfig);
      }
      if (remoteSettings.security) {
        setSecurityConfig(remoteSettings.security);
      }
    });
    unsubs.push(unsubSettings);

    return () => {
      unsubs.forEach(u => u());
    };
  }, [firebaseUser]);

  // Persistence
  useEffect(() => {
    localStorage.setItem('shopName', shopName);
  }, [shopName]);

  useEffect(() => {
    localStorage.setItem('shopAddress', shopAddress);
  }, [shopAddress]);

  useEffect(() => {
    localStorage.setItem('shopPhone', shopPhone);
  }, [shopPhone]);

  // Persistence
  useEffect(() => {
    localStorage.setItem('vehicleTypes', JSON.stringify(vehicleTypes));
  }, [vehicleTypes]);

  useEffect(() => {
    localStorage.setItem('drinks', JSON.stringify(drinks));
  }, [drinks]);

  useEffect(() => {
    localStorage.setItem('carCategories', JSON.stringify(carCategories));
  }, [carCategories]);

  useEffect(() => {
    localStorage.setItem('motorCategories', JSON.stringify(motorCategories));
  }, [motorCategories]);

  useEffect(() => {
    localStorage.setItem('transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('employees', JSON.stringify(employees));
  }, [employees]);

  useEffect(() => {
    localStorage.setItem('wageUnitConfig', JSON.stringify(wageUnitConfig));
  }, [wageUnitConfig]);

  // Handler when clicking any vehicle kind button
  const handleSelectVehicle = (type: VehicleType) => {
    setSelectedVehicle(type);
    if (!selectedSize || selectedVehicle?.id !== type.id) {
      setSelectedSize(type.id === 'motor' ? 'Kecil' : 'Sedang');
    }
  };

  // Auto-categorize when typing vehicle model in Cashier Step 2
  const handleCarCategoryChange = (value: string) => {
    setCarCategory(value);
    const presets = selectedVehicle?.id === 'motor' ? motorCategories : carCategories;
    const match = detectVehicleSize(value, selectedVehicle?.id || 'mobil', presets);
    if (match) {
      setSelectedSize(match.size);
    }
  };

  const detectedMainMatch = useMemo(() => {
    if (!selectedVehicle || !carCategory.trim()) return null;
    const presets = selectedVehicle.id === 'motor' ? motorCategories : carCategories;
    return detectVehicleSize(carCategory, selectedVehicle.id, presets);
  }, [carCategory, selectedVehicle, carCategories, motorCategories]);

  const mainSuggestions = useMemo(() => {
    if (!selectedVehicle || !carCategory.trim()) return [];
    const presets = selectedVehicle.id === 'motor' ? motorCategories : carCategories;
    return getVehicleSuggestions(carCategory, selectedVehicle.id, presets, 4);
  }, [carCategory, selectedVehicle, carCategories, motorCategories]);

  // Calculate current cart total
  const currentTotal = useMemo(() => {
    const washPrice = selectedVehicle && selectedSize ? selectedVehicle.prices[selectedSize] : 0;
    const drinksPrice = drinkCart.reduce((sum, item) => sum + (item.drink.price * item.quantity), 0);
    return washPrice + drinksPrice;
  }, [selectedVehicle, selectedSize, drinkCart]);

  // Open payment popup on clicking "Bayar Sekarang"
  const handleOpenPayment = () => {
    if (!selectedVehicle && drinkCart.length === 0) return;
    if (selectedVehicle && !selectedSize) {
      alert('Silakan pilih ukuran kendaraan terlebih dahulu');
      return;
    }
    setIsPaymentModalOpen(true);
  };

  // Called when payment is confirmed in the popup
  const handleConfirmPayment = (paymentDetails: {
    paymentMethod: PaymentMethod;
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
  }) => {
    if (!selectedVehicle && drinkCart.length === 0) return;

    const items: Transaction['items'] = [];
    let totalPrice = 0;

    if (selectedVehicle && selectedSize) {
      const categoryTag = carCategory.trim() ? ` • ${carCategory.trim()}` : '';
      items.push({
        name: `${selectedVehicle.name} (${selectedSize})${categoryTag}`,
        price: selectedVehicle.prices[selectedSize],
        category: 'wash',
        quantity: 1
      });
      totalPrice += selectedVehicle.prices[selectedSize];
    }

    drinkCart.forEach(item => {
      items.push({
        name: item.drink.name,
        price: item.drink.price,
        category: 'drink',
        quantity: item.quantity
      });
      totalPrice += item.drink.price * item.quantity;
    });

    const now = new Date();
    const orderNumber = `${format(now, 'yyMMdd')}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newTransaction: Transaction = {
      id: crypto.randomUUID(),
      orderNumber,
      vehicleTypeId: selectedVehicle?.id,
      vehicleTypeName: selectedVehicle?.name,
      plateNumber: plateNumber.toUpperCase() || '-',
      carCategory: carCategory.trim() || undefined,
      size: selectedSize || undefined,
      price: totalPrice,
      paymentMethod: paymentDetails.paymentMethod,
      amountPaid: paymentDetails.amountPaid,
      changeAmount: paymentDetails.changeAmount,
      customerPhone: paymentDetails.customerPhone || undefined,
      notes: paymentDetails.notes || undefined,
      items: items,
      employeeId: paymentDetails.employeeId,
      employeeName: paymentDetails.employeeName,
      employeeWage: paymentDetails.employeeWage,
      assignedEmployees: paymentDetails.assignedEmployees,
      totalUnitWage: paymentDetails.totalUnitWage,
      wagePerPerson: paymentDetails.wagePerPerson,
      cashierName: currentUser?.name || 'Kasir',
      timestamp: now.toISOString(),
    };

    setTransactions([newTransaction, ...transactions]);
    if (firebaseUser) {
      syncSaveTransaction(newTransaction).catch(err => console.error('Cloud tx save err:', err));
    }
    setIsPaymentModalOpen(false);

    // Reset cashier form
    setSelectedVehicle(null);
    setSelectedSize(null);
    setCarCategory('');
    setPlateNumber('');
    setDrinkCart([]);
    setSelectedEmployeeId('');
    setSelectedEmployeeIds([]);

    // Open receipt modal right away
    setActiveReceiptTransaction(newTransaction);
    setIsReceiptModalOpen(true);
  };

  const deleteTransaction = (id: string) => {
    if (confirm('Hapus transaksi ini?')) {
      setTransactions(transactions.filter(t => t.id !== id));
      if (firebaseUser) {
        syncDeleteTransaction(id).catch(err => console.error('Cloud tx delete err:', err));
      }
    }
  };

  const handleUpdateEmployees = (newEmployees: Employee[]) => {
    setEmployees(newEmployees);
    if (firebaseUser) {
      newEmployees.forEach(emp => syncSaveEmployee(emp).catch(console.error));
    }
  };

  const handleUpdateWageUnitConfig = (newConfig: WageUnitConfig) => {
    setWageUnitConfig(newConfig);
    if (firebaseUser) {
      syncSaveWageUnitConfig(newConfig).catch(console.error);
    }
  };

  const handleUpdateSecurityConfig = (newConfig: SecurityConfig) => {
    setSecurityConfig(newConfig);
    if (firebaseUser) {
      syncSaveSecurityConfig(newConfig).catch(console.error);
    }
  };

  const handleForceSeedToCloud = async () => {
    await seedInitialCloudDataIfEmpty({
      transactions,
      employees,
      vehicleTypes,
      drinks,
      carCategories,
      motorCategories,
      shopProfile: { shopName, shopAddress, shopPhone },
      wageUnitConfig,
      securityConfig
    });
    setLastSyncedAt(new Date());
  };

  const stats = useMemo(() => {
    const now = new Date();
    const daily = transactions
      .filter(t => isSameDay(parseISO(t.timestamp), now))
      .reduce((acc, t) => acc + t.price, 0);
    const weekly = transactions
      .filter(t => isSameWeek(parseISO(t.timestamp), now))
      .reduce((acc, t) => acc + t.price, 0);
    const monthly = transactions
      .filter(t => isSameMonth(parseISO(t.timestamp), now))
      .reduce((acc, t) => acc + t.price, 0);

    return { daily, weekly, monthly };
  }, [transactions]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const downloadCSV = (data: Transaction[], filename: string) => {
    if (data.length === 0) {
      alert('Tidak ada data untuk diunduh');
      return;
    }
    const headers = ['ID', 'Tipe/Plat', 'Kategori Mobil', 'Detail Pesanan', 'Total Harga', 'Petugas Cuci', 'Komisi Karyawan', 'Tanggal'];
    const rows = data.map(t => [
      t.id,
      t.plateNumber || '-',
      t.carCategory || '-',
      t.items.map(i => `${i.name} x${i.quantity}`).join(" | "),
      t.price,
      t.employeeName || '-',
      t.employeeWage || 0,
      format(parseISO(t.timestamp), 'yyyy-MM-dd HH:mm:ss')
    ]);
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportDaily = () => {
    const now = new Date();
    const filtered = transactions.filter(t => isSameDay(parseISO(t.timestamp), now));
    downloadCSV(filtered, `Laporan_Harian_${format(now, 'yyyy-MM-dd')}`);
  };

  const exportWeekly = () => {
    const now = new Date();
    const filtered = transactions.filter(t => isSameWeek(parseISO(t.timestamp), now));
    downloadCSV(filtered, `Laporan_Mingguan_${format(now, 'yyyy-MM-dd')}`);
  };

  const exportMonthly = () => {
    const now = new Date();
    const filtered = transactions.filter(t => isSameMonth(parseISO(t.timestamp), now));
    downloadCSV(filtered, `Laporan_Bulanan_${format(now, 'yyyy-MM')}`);
  };

  // History Filter logic & presets
  const handleSelectDatePreset = (preset: 'all' | 'today' | 'last7' | 'thisMonth' | 'custom') => {
    setHistoryDatePreset(preset);
    const now = new Date();
    if (preset === 'all') {
      setHistoryStartDate('');
      setHistoryEndDate('');
    } else if (preset === 'today') {
      const todayStr = format(now, 'yyyy-MM-dd');
      setHistoryStartDate(todayStr);
      setHistoryEndDate(todayStr);
    } else if (preset === 'last7') {
      const startStr = format(subDays(now, 6), 'yyyy-MM-dd');
      const endStr = format(now, 'yyyy-MM-dd');
      setHistoryStartDate(startStr);
      setHistoryEndDate(endStr);
    } else if (preset === 'thisMonth') {
      const startStr = format(startOfMonth(now), 'yyyy-MM-dd');
      const endStr = format(now, 'yyyy-MM-dd');
      setHistoryStartDate(startStr);
      setHistoryEndDate(endStr);
    }
  };

  const handleResetHistoryFilter = () => {
    setHistoryPlateQuery('');
    setHistoryDatePreset('all');
    setHistoryStartDate('');
    setHistoryEndDate('');
  };

  const isHistoryFilterActive = Boolean(
    historyPlateQuery.trim() || historyStartDate || historyEndDate || historyDatePreset !== 'all'
  );

  const filteredHistoryTransactions = useMemo(() => {
    return transactions.filter((t) => {
      // 1. Filter Plat Nomor (case-insensitive & space-insensitive)
      if (historyPlateQuery.trim()) {
        const queryNorm = historyPlateQuery.replace(/\s+/g, '').toUpperCase();
        const plateNorm = (t.plateNumber || '').replace(/\s+/g, '').toUpperCase();
        if (!plateNorm.includes(queryNorm)) {
          return false;
        }
      }

      // 2. Filter Rentang Tanggal (format YYYY-MM-DD)
      if (historyStartDate || historyEndDate) {
        const txDateStr = format(parseISO(t.timestamp), 'yyyy-MM-dd');
        if (historyStartDate && txDateStr < historyStartDate) {
          return false;
        }
        if (historyEndDate && txDateStr > historyEndDate) {
          return false;
        }
      }

      return true;
    });
  }, [transactions, historyPlateQuery, historyStartDate, historyEndDate]);

  const historyMetrics = useMemo(() => {
    const totalRevenue = filteredHistoryTransactions.reduce((acc, t) => acc + (t.price || 0), 0);
    const washCount = filteredHistoryTransactions.filter(t => t.items.some(i => i.category === 'wash')).length;
    return {
      count: filteredHistoryTransactions.length,
      totalRevenue,
      washCount,
    };
  }, [filteredHistoryTransactions]);

  const exportFilteredHistory = () => {
    const filename = historyPlateQuery.trim()
      ? `Histori_Plat_${historyPlateQuery.replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd')}`
      : `Histori_Transaksi_${historyStartDate || 'Awal'}_sd_${historyEndDate || 'Akhir'}`;
    downloadCSV(filteredHistoryTransactions, filename);
  };

  // If no user is logged in, show the Login / Access Control Screen
  if (!currentUser) {
    return (
      <LoginScreen
        securityConfig={securityConfig}
        shopName={shopName}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          if (user.role === 'cashier') {
            setActiveTab('cashier');
          }
        }}
      />
    );
  }

  return (
    <div className="min-h-screen pb-24 md:pb-0 md:pl-64 flex flex-col bg-slate-50">
      {/* Sidebar - Desktop */}
      <nav className="fixed left-0 top-0 bottom-0 w-64 glass-card hidden md:flex flex-col p-6 z-20">
        <div className="flex items-center gap-2 mb-8 px-2">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
            <Car className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="font-display font-bold text-xl tracking-tight leading-none text-blue-600">D'CarWash</h1>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Cuci Mobil dan Motor</span>
          </div>
        </div>

        <div className="space-y-2">
          <SidebarLink 
            active={activeTab === 'cashier'} 
            onClick={() => handleTabClick('cashier')} 
            icon={<PlusCircle size={20} />} 
            label="Kasir" 
          />
          <SidebarLink 
            active={activeTab === 'history'} 
            onClick={() => handleTabClick('history')} 
            icon={<History size={20} />} 
            label="Histori" 
          />
          <SidebarLink 
            active={activeTab === 'reports'} 
            onClick={() => handleTabClick('reports')} 
            icon={<BarChart3 size={20} />} 
            label="Laporan & Laba" 
            isLocked={currentUser?.role === 'cashier'}
          />
          <SidebarLink 
            active={activeTab === 'employees'} 
            onClick={() => handleTabClick('employees')} 
            icon={<Users size={20} />} 
            label="Data Karyawan" 
            isLocked={currentUser?.role === 'cashier'}
          />
          <SidebarLink 
            active={activeTab === 'settings'} 
            onClick={() => handleTabClick('settings')} 
            icon={<Settings size={20} />} 
            label="Pengaturan" 
            isLocked={currentUser?.role === 'cashier'}
          />
          <SidebarLink 
            active={activeTab === 'drive'} 
            onClick={() => handleTabClick('drive')} 
            icon={<Cloud size={20} />} 
            label="Google Drive" 
            isLocked={currentUser?.role === 'cashier'}
          />
        </div>

        {/* User Session Info Card */}
        <div className="mt-auto mb-3 glass-card p-3 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className={cn(
                "w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0",
                currentUser.role === 'admin' ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800"
              )}>
                {currentUser.role === 'admin' ? '👑' : '💳'}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-slate-800 truncate">{currentUser.name}</p>
                <p className={cn(
                  "text-[9px] font-extrabold uppercase",
                  currentUser.role === 'admin' ? "text-amber-600" : "text-blue-600"
                )}>
                  {currentUser.role === 'admin' ? 'Owner / Admin' : 'Kasir (Staff)'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0"
              title="Kunci Layar / Logout"
            >
              <LogOut size={14} />
            </button>
          </div>
          <button
            type="button"
            onClick={() => setCurrentUser(null)}
            className="w-full py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg text-[10px] font-bold text-center border border-slate-200/60 transition-colors"
          >
            Ganti Pengguna
          </button>
        </div>

        {/* PWA Desktop Install Button in Sidebar */}
        <PWAInstallButton variant="sidebar" className="mb-3 shrink-0" />

        <div className="glass-card p-4 rounded-2xl bg-blue-50/50 border-blue-100">
          <p className="text-xs text-slate-500 mb-1">Pendapatan Hari Ini</p>
          <p className="font-display font-bold text-lg text-blue-600">
            {formatCurrency(stats.daily)}
          </p>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-5xl mx-auto p-4 md:p-8">
        <header className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-display font-bold text-slate-800 flex items-center gap-3">
              <span>
                {activeTab === 'cashier' && 'Kasir'}
                {activeTab === 'history' && 'Histori Transaksi'}
                {activeTab === 'reports' && 'Laporan & Estimasi Keuntungan'}
                {activeTab === 'employees' && 'Manajemen Karyawan & Upah'}
                {activeTab === 'settings' && 'Pengaturan Toko & Layanan'}
                {activeTab === 'drive' && 'Google Drive Cloud Backup'}
              </span>
              {activeTab === 'history' && (
                <button 
                  onClick={() => isHistoryFilterActive 
                    ? exportFilteredHistory() 
                    : downloadCSV(transactions, `Semua_Transaksi_${format(new Date(), 'yyyy-MM-dd_HHmm')}`)
                  }
                  className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors flex items-center gap-1.5 text-xs font-bold border border-blue-100"
                  title={isHistoryFilterActive ? "Unduh Hasil Filter Transaksi (CSV)" : "Unduh Semua Transaksi (CSV)"}
                >
                  <Download size={16} />
                  <span className="hidden sm:inline">{isHistoryFilterActive ? 'Unduh Hasil Filter' : 'Unduh CSV'}</span>
                </button>
              )}
            </h2>
            <p className="text-slate-500 text-sm mt-1">
              {activeTab === 'cashier' && 'Pilih jenis kendaraan dan ukuran untuk memulai transaksi.'}
              {activeTab === 'history' && 'Semua data transaksi yang telah dilakukan di kasir.'}
              {activeTab === 'reports' && 'Estimasi laba bersih, rincian omzet, beban sabun/minuman, dan rekap upah karyawan.'}
              {activeTab === 'employees' && 'Kelola daftar petugas cuci, komisi per kendaraan, dan sistem gaji harian.'}
              {activeTab === 'settings' && 'Kelola jenis kendaraan, harga, data karyawan, dan profil toko.'}
              {activeTab === 'drive' && 'Sinkronisasi data transaksi, cadangkan ke Google Drive, dan pulihkan kapan saja.'}
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-auto flex-wrap sm:flex-nowrap">
            {/* Install Desktop App Button in Header */}
            <PWAInstallButton variant="header" />

            {/* User Profile Badge */}
            <div className="flex items-center gap-2 p-1.5 pr-3 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
              <div className={cn(
                "w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm shrink-0",
                currentUser.role === 'admin'
                  ? "bg-amber-100 text-amber-800 border border-amber-200"
                  : "bg-blue-100 text-blue-800 border border-blue-200"
              )}>
                {currentUser.role === 'admin' ? '👑' : '💳'}
              </div>
              <div className="text-left">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-xs text-slate-800 max-w-[110px] truncate">{currentUser.name}</span>
                  <span className={cn(
                    "px-1.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase",
                    currentUser.role === 'admin'
                      ? "bg-amber-100 text-amber-900 border border-amber-300"
                      : "bg-blue-100 text-blue-900 border border-blue-300"
                  )}>
                    {currentUser.role === 'admin' ? 'Admin' : 'Kasir'}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 block">
                  {currentUser.role === 'admin' ? 'Akses Penuh' : 'Akses Terbatas'}
                </span>
              </div>
            </div>

            {/* Lock / Switch Button */}
            <button
              type="button"
              onClick={handleLogout}
              className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors text-xs font-bold flex items-center gap-1.5 border border-slate-200"
              title="Kunci Layar / Ganti Pengguna"
            >
              <Lock size={15} />
              <span className="hidden sm:inline">Kunci</span>
            </button>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === 'cashier' && (
            <motion.div 
              key="cashier"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Step 1: Vehicle Type */}
              <section className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">1. Jenis Kendaraan</h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
                  {vehicleTypes.map((type) => {
                    const isSelected = selectedVehicle?.id === type.id;
                    return (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => handleSelectVehicle(type)}
                        className={cn(
                          "p-5 rounded-2xl transition-all duration-200 text-left group relative overflow-hidden border cursor-pointer",
                          isSelected 
                            ? "bg-blue-600 text-white shadow-lg shadow-blue-200 border-blue-600 ring-2 ring-blue-300/50" 
                            : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                        )}
                      >
                        <div className={cn(
                          "w-11 h-11 rounded-xl flex items-center justify-center mb-3 transition-colors",
                          isSelected ? "bg-white/20" : "bg-blue-50 text-blue-600"
                        )}>
                          {type.id === 'motor' ? <Bike size={22} /> : <Car size={22} />}
                        </div>
                        <p className="font-display font-bold text-base">{type.name}</p>

                        <div className={cn(
                          "absolute top-4 right-4 transition-opacity",
                          isSelected ? "opacity-100" : "opacity-0"
                        )}>
                          <CheckCircle2 size={18} />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Step 2: Vehicle Type / Model Input */}
              {selectedVehicle && (
                <motion.section 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Tag size={13} className="text-blue-600" />
                      <span>2. Tipe / Model Kendaraan</span>
                      <span className="text-[11px] font-normal lowercase text-slate-400">(opsional)</span>
                    </h3>
                    {carCategory && (
                      <button 
                        type="button"
                        onClick={() => handleCarCategoryChange('')}
                        className="text-xs text-slate-400 hover:text-red-500 flex items-center gap-1 font-semibold transition-colors"
                      >
                        <X size={12} /> Hapus
                      </button>
                    )}
                  </div>

                  {/* Clean, single-row input card */}
                  <div className="bg-white p-2.5 sm:p-3 rounded-2xl border border-slate-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all shadow-xs space-y-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <Tag size={16} />
                      </div>
                      <input 
                        type="text" 
                        placeholder={selectedVehicle.id === 'mobil' 
                          ? "Ketik tipe mobil (contoh: Avanza, Brio, Innova, HR-V...)" 
                          : "Ketik tipe motor (contoh: Beat, Vario, NMAX, Scoopy...)"}
                        className="w-full bg-transparent outline-none font-semibold text-slate-800 text-sm placeholder:text-slate-300 placeholder:font-normal"
                        value={carCategory}
                        onChange={(e) => handleCarCategoryChange(e.target.value)}
                      />
                      {detectedMainMatch && (
                        <div className="shrink-0 flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-xl border border-blue-200 text-xs font-bold animate-in fade-in">
                          <Sparkles size={12} className="text-amber-500" />
                          <span>Otomatis {detectedMainMatch.size}</span>
                        </div>
                      )}
                      {carCategory && (
                        <button 
                          type="button" 
                          onClick={() => handleCarCategoryChange('')} 
                          className="text-slate-300 hover:text-slate-500 p-1 shrink-0"
                          title="Bersihkan input"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>

                    {/* Quick Suggestions when user is typing */}
                    {mainSuggestions.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap pt-1.5 border-t border-slate-100">
                        <span className="text-[10px] font-semibold text-slate-400">Pilih saran:</span>
                        {mainSuggestions.map((sug) => (
                          <button
                            key={sug.label}
                            type="button"
                            onClick={() => {
                              handleCarCategoryChange(sug.label);
                              setSelectedSize(sug.size);
                            }}
                            className="px-2.5 py-0.5 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-lg text-xs font-medium text-slate-700 hover:text-blue-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                          >
                            <span>{sug.label}</span>
                            <span className="text-[10px] px-1 bg-white rounded text-slate-500 font-bold border border-slate-200">{sug.size}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.section>
              )}

              {/* Step 3: Size Selection */}
              {selectedVehicle && (
                <motion.section 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">3. Ukuran Kendaraan & Tarif</h3>
                    {carCategory && selectedSize && (
                      <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                        Dipilih: {selectedSize}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    {(['Kecil', 'Sedang', 'Besar'] as VehicleSize[]).map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={cn(
                          "p-4 rounded-2xl border-2 transition-all text-center relative",
                          selectedSize === size 
                            ? "border-blue-600 bg-blue-50 text-blue-700 font-bold shadow-sm" 
                            : "border-slate-200 bg-white hover:border-slate-300 text-slate-600"
                        )}
                      >
                        <p className="text-sm">{size}</p>
                        <p className="text-xs opacity-70 mt-1">{formatCurrency(selectedVehicle.prices[size])}</p>
                      </button>
                    ))}
                  </div>
                </motion.section>
              )}

              {/* Step 4: Platform / Plate Entry */}
              {selectedSize && selectedVehicle && (
                <motion.section 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-4"
                >
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">4. Nomor Plat Kendaraan</h3>
                  <div className="glass-card p-2 rounded-2xl bg-white flex items-center gap-2 border border-slate-200/80">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                       <Clock size={20} />
                    </div>
                    <input 
                       type="text" 
                       placeholder="Masukkan Plat Nomor Kendaraan (Contoh: B 1234 ABC)"
                       className="flex-1 bg-transparent p-3 outline-none font-bold text-slate-700 placeholder:text-slate-300 uppercase"
                       value={plateNumber}
                       onChange={(e) => setPlateNumber(e.target.value)}
                    />
                  </div>
                </motion.section>
              )}

              {/* Step 5: Petugas Cuci / Washer (Skema Upah per Unit Dibagi Rata) */}
              {selectedVehicle && selectedSize && employees.filter(e => e.isActive).length > 0 && (() => {
                const cashierSelectedEmps = employees.filter(e => selectedEmployeeIds.includes(e.id));
                const cashierWashPrice = (selectedVehicle && selectedSize) ? (selectedVehicle.prices[selectedSize] || 0) : 0;
                const { totalUnitWage: cTotalWage, wagePerPerson: cWagePerPerson } = calculateSplitUnitWage(
                  selectedVehicle?.id,
                  cashierWashPrice,
                  cashierSelectedEmps.length,
                  wageUnitConfig
                );

                const toggleCashierEmp = (id: string) => {
                  setSelectedEmployeeIds(prev => 
                    prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
                  );
                };

                return (
                  <motion.section 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                        <Users size={14} className="text-blue-600" />
                        5. Petugas Cuci / Washer (Bisa Pilih Lebih dari 1 Orang)
                      </h3>
                      {cashierSelectedEmps.length > 0 ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                            {cashierSelectedEmps.length} Petugas • {formatCurrency(cWagePerPerson)} / org
                          </span>
                          <button
                            type="button"
                            onClick={() => setSelectedEmployeeIds([])}
                            className="text-[11px] text-slate-400 hover:text-red-500 underline"
                          >
                            Reset
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400">Pilih petugas pengerja</span>
                      )}
                    </div>

                    {/* Banner Info Pembagian Upah per Unit */}
                    <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-2xl flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                          <Scale size={16} />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">
                            Total Alokasi Upah: {formatCurrency(cTotalWage || (selectedVehicle.id === 'motor' ? wageUnitConfig.motorUnitWage : wageUnitConfig.carUnitWage))}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {cashierSelectedEmps.length === 0 && 'Upah per unit ini akan dibagi rata ke setiap orang yang dipilih.'}
                            {cashierSelectedEmps.length === 1 && `1 petugas terpilih menerima 100% upah unit (${formatCurrency(cTotalWage)}).`}
                            {cashierSelectedEmps.length > 1 && `Dibagi rata ke ${cashierSelectedEmps.length} pekerja = ${formatCurrency(cWagePerPerson)} / orang.`}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {employees.filter(e => e.isActive).map(emp => {
                        const isSelected = selectedEmployeeIds.includes(emp.id);
                        return (
                          <button
                            key={emp.id}
                            type="button"
                            onClick={() => toggleCashierEmp(emp.id)}
                            className={cn(
                              "p-3 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between",
                              isSelected 
                                ? "border-blue-600 bg-blue-600 text-white ring-2 ring-blue-200 shadow-md" 
                                : "border-slate-200 bg-white text-slate-700 hover:border-blue-300"
                            )}
                          >
                            <div className="flex items-start justify-between gap-1 w-full">
                              <p className={cn("text-xs font-bold truncate", isSelected ? "text-white" : "text-slate-800")}>
                                {emp.name}
                              </p>
                              {isSelected ? (
                                <span className="w-4 h-4 rounded-full bg-white/25 flex items-center justify-center text-white shrink-0">
                                  ✓
                                </span>
                              ) : (
                                <span className="w-4 h-4 rounded-full border border-slate-300 shrink-0" />
                              )}
                            </div>
                            <p className={cn(
                              "text-[10px] font-semibold mt-1.5",
                              isSelected ? "text-blue-100 font-bold" : "text-slate-400"
                            )}>
                              {isSelected ? `Dapat ${formatCurrency(cWagePerPerson)}` : '+ Klik untuk pilih'}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </motion.section>
                );
              })()}

              {/* Step 6: Minuman Section */}
              <section className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">6. Penjualan Minuman (Opsional)</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {drinks.map((drink) => {
                    const cartItem = drinkCart.find(item => item.drink.id === drink.id);
                    return (
                      <div 
                        key={drink.id}
                        className={cn(
                          "glass-card p-4 rounded-2xl flex items-center justify-between transition-all",
                          cartItem ? "border-blue-200 bg-blue-50" : "bg-white"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                            cartItem ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"
                          )}>
                            <Coffee size={20} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-700">{drink.name}</p>
                            <p className="text-xs text-slate-400 font-medium">{formatCurrency(drink.price)}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {cartItem ? (
                            <>
                              <button 
                                onClick={() => {
                                  if (cartItem.quantity > 1) {
                                    setDrinkCart(drinkCart.map(item => 
                                      item.drink.id === drink.id ? {...item, quantity: item.quantity - 1} : item
                                    ));
                                  } else {
                                    setDrinkCart(drinkCart.filter(item => item.drink.id !== drink.id));
                                  }
                                }}
                                className="p-1.5 bg-white text-blue-600 rounded-lg shadow-sm border border-slate-100 hover:bg-slate-50 transition-colors"
                              >
                                <Minus size={14} />
                              </button>
                              <span className="text-sm font-bold w-6 text-center">{cartItem.quantity}</span>
                              <button 
                                onClick={() => {
                                  setDrinkCart(drinkCart.map(item => 
                                    item.drink.id === drink.id ? {...item, quantity: item.quantity + 1} : item
                                  ));
                                }}
                                className="p-1.5 bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 transition-colors"
                              >
                                <Plus size={14} />
                              </button>
                            </>
                          ) : (
                            <button 
                              onClick={() => setDrinkCart([...drinkCart, { drink, quantity: 1 }])}
                              className="p-2 bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                            >
                              <Plus size={20} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Step 5: Checkout */}
              {(selectedSize && selectedVehicle || drinkCart.length > 0) && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="glass-card p-6 rounded-3xl bg-blue-600 text-white flex flex-col sm:flex-row items-center justify-between shadow-2xl shadow-blue-200 gap-6"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                      <ShoppingCart size={28} />
                    </div>
                    <div>
                      <p className="text-white/80 text-sm">Review Pesanan & Total</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {selectedVehicle && (
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-white/10 px-2 py-1 rounded text-white">
                            {selectedVehicle.name} ({selectedSize})
                          </span>
                        )}
                        {carCategory && (
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2 py-1 rounded text-white flex items-center gap-1">
                            <Tag size={10} /> {carCategory}
                          </span>
                        )}
                        {selectedEmployeeIds.length > 0 && (
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-400/30 text-amber-100 border border-amber-300/30 px-2 py-1 rounded flex items-center gap-1">
                            <Users size={10} /> {selectedEmployeeIds.length} Washer: {employees.filter(e => selectedEmployeeIds.includes(e.id)).map(e => e.name).join(', ')}
                          </span>
                        )}
                        {drinkCart.map(item => (
                          <span key={item.drink.id} className="text-[10px] font-bold uppercase tracking-wider bg-white/10 px-2 py-1 rounded text-white">
                            {item.drink.name} x{item.quantity}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end">
                    <div className="text-right">
                      <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest">Total Bayar</p>
                      <p className="text-3xl font-display font-bold">
                        {formatCurrency(currentTotal)}
                      </p>
                    </div>
                    <button
                      onClick={handleOpenPayment}
                      className="bg-white text-blue-600 px-8 py-4 rounded-2xl font-bold hover:bg-slate-50 transition-colors shadow-lg shadow-black/10 active:scale-95 flex items-center gap-2"
                    >
                      Bayar Sekarang
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {activeTab === 'history' && (
            <motion.div 
              key="history"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              {/* Filter Card: Pencarian Plat Nomor & Rentang Tanggal */}
              <div className="glass-card p-4 sm:p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                      <Filter size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-sm sm:text-base">Filter Riwayat Layanan</h3>
                      <p className="text-xs text-slate-400">Cari berdasarkan nomor plat kendaraan & rentang tanggal</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    {isHistoryFilterActive && (
                      <button
                        type="button"
                        onClick={handleResetHistoryFilter}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition-colors flex items-center gap-1.5"
                        title="Reset semua filter pencarian"
                      >
                        <RotateCcw size={13} />
                        <span>Reset Filter</span>
                      </button>
                    )}
                    {filteredHistoryTransactions.length > 0 && (
                      <button
                        type="button"
                        onClick={exportFilteredHistory}
                        className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-colors flex items-center gap-1.5 border border-blue-200"
                        title="Ekspor data hasil filter ke CSV"
                      >
                        <Download size={13} />
                        <span>Ekspor CSV</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-1">
                  {/* Pencarian Plat Nomor */}
                  <div className="md:col-span-5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                      Cari Nomor Plat
                    </label>
                    <div className="relative flex items-center">
                      <div className="absolute left-3.5 text-slate-400 pointer-events-none">
                        <Search size={16} />
                      </div>
                      <input
                        type="text"
                        value={historyPlateQuery}
                        onChange={(e) => setHistoryPlateQuery(e.target.value)}
                        placeholder="Ketik plat (contoh: DK 1234 AB)..."
                        className="w-full pl-9 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 uppercase placeholder:normal-case placeholder:font-normal placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                      />
                      {historyPlateQuery && (
                        <button
                          type="button"
                          onClick={() => setHistoryPlateQuery('')}
                          className="absolute right-3 text-slate-400 hover:text-slate-600 p-0.5"
                          title="Hapus pencarian plat"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Rentang Tanggal: Input Dari & Sampai */}
                  <div className="md:col-span-7">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                      Rentang Tanggal
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="relative flex items-center">
                        <div className="absolute left-3 text-slate-400 pointer-events-none">
                          <Calendar size={15} />
                        </div>
                        <input
                          type="date"
                          value={historyStartDate}
                          onChange={(e) => {
                            setHistoryStartDate(e.target.value);
                            setHistoryDatePreset('custom');
                          }}
                          className="w-full pl-9 pr-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                          title="Dari Tanggal"
                        />
                      </div>
                      <div className="relative flex items-center">
                        <div className="absolute left-3 text-slate-400 pointer-events-none">
                          <Calendar size={15} />
                        </div>
                        <input
                          type="date"
                          value={historyEndDate}
                          onChange={(e) => {
                            setHistoryEndDate(e.target.value);
                            setHistoryDatePreset('custom');
                          }}
                          className="w-full pl-9 pr-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                          title="Sampai Tanggal"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Preset Tombol Rentang Tanggal Cepat */}
                <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-slate-100">
                  <span className="text-[11px] font-semibold text-slate-400 mr-1">Pilihan Cepat:</span>
                  {[
                    { id: 'all', label: 'Semua Tanggal' },
                    { id: 'today', label: 'Hari Ini' },
                    { id: 'last7', label: '7 Hari Terakhir' },
                    { id: 'thisMonth', label: 'Bulan Ini' },
                  ].map((preset) => {
                    const isActive = historyDatePreset === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleSelectDatePreset(preset.id as any)}
                        className={cn(
                          "px-2.5 py-1 rounded-lg text-xs font-bold transition-all",
                          isActive
                            ? "bg-blue-600 text-white shadow-xs"
                            : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                        )}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                  {historyDatePreset === 'custom' && (historyStartDate || historyEndDate) && (
                    <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                      Rentang Kustom
                    </span>
                  )}
                </div>

                {/* Bar Ringkasan Hasil Filter */}
                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-slate-500">
                      Menemukan <strong className="text-slate-800 font-bold">{historyMetrics.count}</strong> dari {transactions.length} transaksi
                    </span>
                    {historyPlateQuery.trim() && (
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full font-bold text-[10px] border border-blue-100 uppercase">
                        Plat: {historyPlateQuery}
                      </span>
                    )}
                    {historyMetrics.washCount > 0 && (
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full font-semibold text-[10px]">
                        {historyMetrics.washCount} Cuci
                      </span>
                    )}
                  </div>
                  <div className="font-bold text-slate-700">
                    Total: <span className="text-blue-600 font-display font-bold text-sm">{formatCurrency(historyMetrics.totalRevenue)}</span>
                  </div>
                </div>
              </div>

              {/* Daftar Transaksi */}
              {transactions.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <History className="text-slate-300" size={32} />
                  </div>
                  <p className="text-slate-400 font-medium">Belum ada transaksi di sistem.</p>
                </div>
              ) : filteredHistoryTransactions.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-200 p-6 space-y-3">
                  <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto">
                    <Search size={26} />
                  </div>
                  <h4 className="font-bold text-slate-800 text-base">Tidak Ditemukan Transaksi</h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                    Tidak ada riwayat layanan yang cocok dengan nomor plat {historyPlateQuery.trim() ? <strong className="text-slate-800">"{historyPlateQuery.toUpperCase()}"</strong> : 'yang dicari'} atau rentang tanggal yang dipilih.
                  </p>
                  <div>
                    <button
                      type="button"
                      onClick={handleResetHistoryFilter}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95"
                    >
                      <RotateCcw size={14} />
                      Reset Filter & Tampilkan Semua
                    </button>
                  </div>
                </div>
              ) : (
                filteredHistoryTransactions.map((t) => (
                  <div key={t.id} className="glass-card p-4 rounded-2xl flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500">
                        {t.items.some(i => i.category === 'wash') ? (
                           t.vehicleTypeId === 'mobil' ? <Car size={20} /> : <Bike size={20} />
                        ) : (
                           <Coffee size={20} />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                           <p className="font-bold text-slate-800">
                             {t.items.filter(i => i.category === 'wash').map(i => i.name).join(', ') || 'Hanya Minuman'}
                           </p>
                           {t.size && (
                             <span className="px-2 py-0.5 bg-slate-100 text-[10px] uppercase font-bold text-slate-500 rounded-full">
                               {t.size}
                             </span>
                           )}
                           {t.carCategory && (
                             <span className="px-2 py-0.5 bg-blue-50 text-[10px] font-bold text-blue-700 rounded-full border border-blue-100 flex items-center gap-1">
                               <Tag size={10} />
                               {t.carCategory}
                             </span>
                           )}
                           {t.assignedEmployees && t.assignedEmployees.length > 0 ? (
                             <span className="px-2 py-0.5 bg-amber-50 text-[10px] font-bold text-amber-800 rounded-full border border-amber-200 flex items-center gap-1">
                               <Users size={10} />
                               {t.assignedEmployees.map(e => `${e.employeeName} (${formatCurrency(e.wageEarned)})`).join(' • ')}
                             </span>
                           ) : t.employeeName ? (
                             <span className="px-2 py-0.5 bg-amber-50 text-[10px] font-bold text-amber-700 rounded-full border border-amber-200 flex items-center gap-1">
                               <Users size={10} />
                               {t.employeeName}
                               {t.employeeWage ? ` (${formatCurrency(t.employeeWage)})` : ''}
                             </span>
                           ) : null}
                        </div>
                        <div className="flex flex-col gap-1">
                           <div className="flex items-center gap-2">
                              {t.plateNumber && t.plateNumber !== '-' && (
                                <p className="text-xs font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded uppercase">{t.plateNumber}</p>
                              )}
                              <p className="text-xs text-slate-400">
                                {format(parseISO(t.timestamp), 'dd MMM yyyy, HH:mm', { locale: idLoc })}
                              </p>
                           </div>
                           {t.items.some(i => i.category === 'drink') && (
                             <div className="flex flex-wrap gap-1">
                               {t.items.filter(i => i.category === 'drink').map((item, idx) => (
                                 <span key={idx} className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded italic">
                                   {item.name} x{item.quantity}
                                 </span>
                               ))}
                             </div>
                           )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="font-display font-bold text-slate-800">{formatCurrency(t.price)}</p>
                        <span className="text-[10px] font-bold uppercase text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                          {t.paymentMethod === 'cash' ? 'Tunai' : t.paymentMethod === 'qris' ? 'QRIS' : t.paymentMethod === 'transfer' ? 'Transfer' : 'Tunai'}
                        </span>
                      </div>
                      <button 
                        type="button"
                        onClick={() => {
                          setActiveReceiptTransaction(t);
                          setIsReceiptModalOpen(true);
                        }}
                        className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors flex items-center gap-1 text-xs font-bold border border-blue-100"
                        title="Lihat & Cetak Nota"
                      >
                        <Receipt size={16} />
                        <span className="hidden sm:inline">Nota</span>
                      </button>
                      <button 
                         onClick={() => deleteTransaction(t.id)}
                         className="p-2 text-slate-300 hover:text-red-500 transition-colors rounded-xl"
                         title="Hapus Transaksi"
                      >
                         <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </motion.div>
          )}

          {activeTab === 'reports' && (
            <motion.div 
              key="reports"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              <ProfitReport 
                transactions={transactions} 
                employees={employees} 
                formatCurrency={formatCurrency} 
              />
            </motion.div>
          )}

          {activeTab === 'employees' && (
            <motion.div 
              key="employees"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              <EmployeeManager 
                employees={employees} 
                onUpdateEmployees={setEmployees} 
                wageUnitConfig={wageUnitConfig}
                onUpdateWageUnitConfig={setWageUnitConfig}
                formatCurrency={formatCurrency} 
              />
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div 
              key="settings"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <div className="glass-card p-6 rounded-3xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 -mr-12 -mt-12 rounded-full blur-3xl opacity-50" />
                <h3 className="font-display font-bold text-lg mb-4">Pengaturan Harga Layanan Cuci</h3>
                <div className="space-y-4">
                  {vehicleTypes.map((type) => (
                    <div key={type.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm border border-slate-100">
                          {type.id === 'mobil' ? <Car size={20} /> : <Bike size={20} />}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{type.name}</p>
                          <p className="text-xs text-slate-500">
                            {formatCurrency(type.prices.Kecil)} - {formatCurrency(type.prices.Besar)}
                          </p>
                        </div>
                      </div>
                      {type.id !== 'motor' && type.id !== 'mobil' && (
                        <button 
                          onClick={() => setVehicleTypes(vehicleTypes.filter(v => v.id !== type.id))}
                          className="text-slate-300 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <AddVehicleForm onAdd={(newType) => setVehicleTypes([...vehicleTypes, newType])} />

              {/* Pengaturan Kategori Mobil */}
              <div className="glass-card p-6 rounded-3xl relative overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div>
                    <h3 className="font-display font-bold text-lg flex items-center gap-2">
                      <Tag className="text-blue-600" size={20} />
                      Pengaturan Kategori Mobil
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Kelola daftar kategori mobil & ukuran rekomendasi untuk mempermudah kasir menentukan tarif.
                    </p>
                  </div>
                  <button 
                    type="button"
                    onClick={() => {
                      if (window.confirm('Kembalikan kategori mobil ke daftar standar bawaan?')) {
                        setCarCategories(INITIAL_CAR_CATEGORIES);
                      }
                    }}
                    className="self-start sm:self-auto px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-all text-xs font-bold flex items-center gap-1.5"
                    title="Reset ke setelan awal"
                  >
                    <RotateCcw size={14} />
                    <span>Reset Standar</span>
                  </button>
                </div>

                <div className="space-y-3 mb-6">
                  {carCategories.map((cat) => (
                    <div key={cat.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm border border-slate-100 text-blue-600 flex-shrink-0">
                          <Car size={18} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-slate-800 text-sm">{cat.name}</p>
                            <span className={cn(
                              "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase",
                              cat.defaultSize === 'Kecil' && "bg-emerald-100 text-emerald-700",
                              cat.defaultSize === 'Sedang' && "bg-blue-100 text-blue-700",
                              cat.defaultSize === 'Besar' && "bg-purple-100 text-purple-700",
                            )}>
                              {cat.defaultSize}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">{cat.examples || '-'}</p>
                        </div>
                      </div>
                      {carCategories.length > 1 && (
                        <button 
                          type="button"
                          onClick={() => setCarCategories(carCategories.filter(c => c.id !== cat.id))}
                          className="text-slate-300 hover:text-red-500 p-2 transition-colors"
                          title="Hapus Kategori"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <AddCarCategoryForm onAdd={(newCat) => setCarCategories([...carCategories, newCat])} />
              </div>

              {/* Pengaturan Kategori Motor */}
              <div className="glass-card p-6 rounded-3xl relative overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div>
                    <h3 className="font-display font-bold text-lg flex items-center gap-2">
                      <Tag className="text-emerald-600" size={20} />
                      Pengaturan Kategori & Tipe Motor
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Kelola daftar tipe motor & ukuran rekomendasi untuk mempermudah kasir menentukan tarif cuci motor.
                    </p>
                  </div>
                  <button 
                    type="button"
                    onClick={() => {
                      if (window.confirm('Kembalikan kategori motor ke daftar standar bawaan?')) {
                        setMotorCategories(INITIAL_MOTOR_CATEGORIES);
                      }
                    }}
                    className="self-start sm:self-auto px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-all text-xs font-bold flex items-center gap-1.5"
                    title="Reset ke setelan awal motor"
                  >
                    <RotateCcw size={14} />
                    <span>Reset Standar</span>
                  </button>
                </div>

                <div className="space-y-3 mb-6">
                  {motorCategories.map((cat) => (
                    <div key={cat.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm border border-slate-100 text-emerald-600 flex-shrink-0">
                          <Bike size={18} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-slate-800 text-sm">{cat.name}</p>
                            <span className={cn(
                              "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase",
                              cat.defaultSize === 'Kecil' && "bg-emerald-100 text-emerald-700",
                              cat.defaultSize === 'Sedang' && "bg-blue-100 text-blue-700",
                              cat.defaultSize === 'Besar' && "bg-purple-100 text-purple-700",
                            )}>
                              {cat.defaultSize}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">{cat.examples || '-'}</p>
                        </div>
                      </div>
                      {motorCategories.length > 1 && (
                        <button 
                          type="button"
                          onClick={() => setMotorCategories(motorCategories.filter(c => c.id !== cat.id))}
                          className="text-slate-300 hover:text-red-500 p-2 transition-colors"
                          title="Hapus Kategori Motor"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <AddMotorCategoryForm onAdd={(newCat) => setMotorCategories([...motorCategories, newCat])} />
              </div>

              <div className="glass-card p-6 rounded-3xl relative overflow-hidden">
                <h3 className="font-display font-bold text-lg mb-4">Pengaturan Harga Minuman</h3>
                <div className="space-y-4 mb-6">
                  {drinks.map((drink) => (
                    <div key={drink.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm border border-slate-100">
                          <Coffee size={20} />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{drink.name}</p>
                          <p className="text-xs text-slate-500">{formatCurrency(drink.price)}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setDrinks(drinks.filter(d => d.id !== drink.id))}
                        className="text-slate-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>
                <AddDrinkForm onAdd={(newDrink) => setDrinks([...drinks, newDrink])} />
              </div>

              {/* Pengaturan Profil Nota Toko */}
              <div className="glass-card p-6 rounded-3xl relative overflow-hidden space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Store size={20} />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-lg leading-tight">Pengaturan Informasi Nota & Toko</h3>
                    <p className="text-xs text-slate-400">Informasi ini akan tercetak otomatis pada struk nota dan teks bagikan WhatsApp</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Nama Usaha / Tempat Cuci</label>
                    <input 
                      type="text" 
                      value={shopName}
                      onChange={(e) => setShopName(e.target.value)}
                      placeholder="Contoh: D'CarWash"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Nomor Kontak / WhatsApp Toko</label>
                    <input 
                      type="text" 
                      value={shopPhone}
                      onChange={(e) => setShopPhone(e.target.value)}
                      placeholder="Contoh: 0812-3456-7890"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Alamat Usaha & Keterangan</label>
                    <input 
                      type="text" 
                      value={shopAddress}
                      onChange={(e) => setShopAddress(e.target.value)}
                      placeholder="Contoh: Jl. Jelantik Gingsir Sukasada, Layanan Cuci Mobil & Motor"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-medium text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Data Karyawan & Skema Upah */}
              <div className="pt-2">
                <EmployeeManager 
                  employees={employees} 
                  onUpdateEmployees={setEmployees} 
                  wageUnitConfig={wageUnitConfig}
                  onUpdateWageUnitConfig={setWageUnitConfig}
                  formatCurrency={formatCurrency} 
                />
              </div>

              {/* Manajemen Hak Akses Pengguna & PIN Keamanan */}
              <div className="pt-2">
                <SecurityManager
                  currentUser={currentUser}
                  securityConfig={securityConfig}
                  onUpdateSecurityConfig={(cfg) => setSecurityConfig(cfg)}
                  onLogout={handleLogout}
                  onSwitchUser={() => setCurrentUser(null)}
                />
              </div>

              {/* Google Drive Integration in Settings */}
              <div className="pt-2">
                <DriveSyncManager
                  transactions={transactions}
                  vehicleTypes={vehicleTypes}
                  drinks={drinks}
                  employees={employees}
                  wageUnitConfig={wageUnitConfig}
                  securityConfig={securityConfig}
                  onRestoreData={(data) => {
                    if (data.transactions) setTransactions(data.transactions);
                    if (data.vehicleTypes) setVehicleTypes(data.vehicleTypes);
                    if (data.drinks) setDrinks(data.drinks);
                    if (data.employees) setEmployees(data.employees);
                    if (data.wageUnitConfig) setWageUnitConfig(data.wageUnitConfig);
                    if (data.securityConfig) setSecurityConfig(data.securityConfig);
                  }}
                />
              </div>

              {/* Install PWA Option in Settings */}
              <div className="pt-2">
                <PWAInstallButton variant="settings" />
              </div>
            </motion.div>
          )}

          {activeTab === 'drive' && (
            <motion.div 
              key="drive"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <DriveSyncManager
                transactions={transactions}
                vehicleTypes={vehicleTypes}
                drinks={drinks}
                employees={employees}
                wageUnitConfig={wageUnitConfig}
                securityConfig={securityConfig}
                onRestoreData={(data) => {
                  if (data.transactions) setTransactions(data.transactions);
                  if (data.vehicleTypes) setVehicleTypes(data.vehicleTypes);
                  if (data.drinks) setDrinks(data.drinks);
                  if (data.employees) setEmployees(data.employees);
                  if (data.wageUnitConfig) setWageUnitConfig(data.wageUnitConfig);
                  if (data.securityConfig) setSecurityConfig(data.securityConfig);
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Modal Popup Pembayaran */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onConfirmPayment={handleConfirmPayment}
        totalAmount={currentTotal}
        selectedVehicle={selectedVehicle}
        selectedSize={selectedSize}
        carCategory={carCategory}
        plateNumber={plateNumber}
        drinkCart={drinkCart}
        employees={employees}
        initialEmployeeId={selectedEmployeeId}
        initialEmployeeIds={selectedEmployeeIds}
        wageUnitConfig={wageUnitConfig}
      />

      {/* Modal Nota & Cetak / Bagikan WhatsApp */}
      <ReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => {
          setIsReceiptModalOpen(false);
          setActiveReceiptTransaction(null);
        }}
        transaction={activeReceiptTransaction}
        shopName={shopName}
        shopAddress={shopAddress}
        shopPhone={shopPhone}
      />

      {/* Dialog Verifikasi PIN Admin untuk Akses Menu Terbatas */}
      <AdminPinDialog
        isOpen={isAdminPinModalOpen}
        onClose={() => {
          setIsAdminPinModalOpen(false);
          setPendingRestrictedTab(null);
        }}
        onSuccess={handleAdminPinSuccess}
        adminPin={securityConfig.adminPin}
        title="Otorisasi Akses Admin"
        description="Menu ini berisi data finansial dan pengaturan toko yang dibatasi untuk staf biasa. Masukkan PIN Admin untuk melanjutkan."
      />

      {/* Mobile Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-100 flex items-center justify-around px-1 z-20 md:hidden">
        <MobileNavLink active={activeTab === 'cashier'} onClick={() => handleTabClick('cashier')} icon={<PlusCircle size={18} />} label="Kasir" />
        <MobileNavLink active={activeTab === 'history'} onClick={() => handleTabClick('history')} icon={<History size={18} />} label="Histori" />
        <MobileNavLink active={activeTab === 'reports'} onClick={() => handleTabClick('reports')} icon={<BarChart3 size={18} />} label="Laba" isLocked={currentUser?.role === 'cashier'} />
        <MobileNavLink active={activeTab === 'employees'} onClick={() => handleTabClick('employees')} icon={<Users size={18} />} label="Karyawan" isLocked={currentUser?.role === 'cashier'} />
        <MobileNavLink active={activeTab === 'settings'} onClick={() => handleTabClick('settings')} icon={<Settings size={18} />} label="Toko" isLocked={currentUser?.role === 'cashier'} />
        <MobileNavLink active={activeTab === 'drive'} onClick={() => handleTabClick('drive')} icon={<Cloud size={18} />} label="Drive" isLocked={currentUser?.role === 'cashier'} />
      </nav>

      {/* Offline Status Toast */}
      <OfflineIndicator />
    </div>
  );
}

function SidebarLink({ active, onClick, icon, label, isLocked }: { 
  active: boolean, 
  onClick: () => void, 
  icon: React.ReactNode, 
  label: string,
  isLocked?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all font-medium",
        active 
          ? "bg-blue-600 text-white shadow-lg shadow-blue-100" 
          : isLocked
            ? "text-slate-400 hover:bg-amber-50/70 hover:text-amber-800"
            : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
      )}
    >
      <div className="flex items-center gap-3">
        {icon}
        <span>{label}</span>
      </div>
      {isLocked && (
        <span className="p-1 rounded-lg bg-amber-100 text-amber-800 text-[10px] font-bold flex items-center gap-0.5" title="Menu Terbatas (Perlu PIN Admin)">
          <Lock size={12} />
        </span>
      )}
    </button>
  );
}

function MobileNavLink({ active, onClick, icon, label, isLocked }: { 
  active: boolean, 
  onClick: () => void, 
  icon: React.ReactNode, 
  label: string,
  isLocked?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1 flex-1 transition-colors relative",
        active ? "text-blue-600" : isLocked ? "text-slate-300" : "text-slate-400"
      )}
    >
      <div className={cn(
        "p-1.5 rounded-xl transition-colors relative",
        active ? "bg-blue-50" : ""
      )}>
        {icon}
        {isLocked && (
          <span className="absolute -top-1 -right-1 p-0.5 bg-amber-500 text-white rounded-full">
            <Lock size={9} />
          </span>
        )}
      </div>
      <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
    </button>
  );
}

function ReportCard({ icon, label, value, color, onDownload }: { 
  icon: React.ReactNode, 
  label: string, 
  value: number,
  color: 'blue' | 'indigo' | 'emerald',
  onDownload?: () => void
}) {
  const colors = {
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100"
  };

  return (
    <div className="glass-card p-6 rounded-3xl group relative overflow-hidden active:scale-95 transition-transform cursor-default">
      <div className="flex justify-between items-start mb-4">
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-colors", colors[color])}>
          {icon}
        </div>
        {onDownload && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onDownload();
            }}
            className="p-2 bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
            title={`Unduh Laporan ${label}`}
          >
            <Download size={18} />
          </button>
        )}
      </div>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-2xl font-display font-bold text-slate-800">
        {new Intl.NumberFormat('id-ID', {
          style: 'currency',
          currency: 'IDR',
          minimumFractionDigits: 0,
        }).format(value)}
      </p>
    </div>
  );
}

function AddVehicleForm({ onAdd }: { onAdd: (type: VehicleType) => void }) {
  const [name, setName] = useState('');
  const [prices, setPrices] = useState<Record<VehicleSize, number>>({
    Kecil: 0,
    Sedang: 0,
    Besar: 0
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    onAdd({
      id: name.toLowerCase().replace(/\s+/g, '-'),
      name,
      prices
    });
    setName('');
    setPrices({ Kecil: 0, Sedang: 0, Besar: 0 });
  };

  return (
    <form onSubmit={handleSubmit} className="glass-card p-6 rounded-3xl space-y-4">
      <h3 className="font-display font-bold text-lg mb-4 flex items-center gap-2">
         <PlusCircle className="text-blue-600" size={20} />
         Tambah Kategori Lain
      </h3>
      <div className="space-y-4">
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Nama Kendaraan</label>
          <input 
            type="text" 
            placeholder="e.g. Bus, Truk, Sepeda"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium text-slate-700"
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-3 gap-3">
          {(['Kecil', 'Sedang', 'Besar'] as VehicleSize[]).map(size => (
            <div key={size}>
              <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Harga {size}</label>
              <input 
                type="number" 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium text-slate-700"
                value={prices[size] || ''}
                onChange={e => setPrices({...prices, [size]: parseInt(e.target.value) || 0})}
              />
            </div>
          ))}
        </div>
        <button 
          type="submit"
          disabled={!name}
          className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors disabled:bg-slate-200 disabled:text-slate-400"
        >
          <Plus size={20} />
          Tambahkan Layanan
        </button>
      </div>
    </form>
  );
}

function AddDrinkForm({ onAdd }: { onAdd: (drink: Drink) => void }) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState<number>(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || price <= 0) return;
    onAdd({
      id: name.toLowerCase().replace(/\s+/g, '-'),
      name,
      price
    });
    setName('');
    setPrice(0);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-4 border-t border-slate-100">
      <h4 className="text-sm font-bold text-slate-500 uppercase">Tambah Minuman Baru</h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Nama Minuman</label>
          <input 
            type="text" 
            placeholder="e.g. Jus Jeruk"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </div>
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Harga Satuan</label>
          <input 
            type="number" 
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
            value={price || ''}
            onChange={e => setPrice(parseInt(e.target.value) || 0)}
          />
        </div>
      </div>
      <button 
        type="submit"
        disabled={!name || price <= 0}
        className="w-full bg-slate-800 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-900 transition-colors disabled:bg-slate-100 disabled:text-slate-300"
      >
        <Plus size={16} />
        Tambah Minuman
      </button>
    </form>
  );
}

function AddCarCategoryForm({ onAdd }: { onAdd: (category: CarCategoryPreset) => void }) {
  const [name, setName] = useState('');
  const [defaultSize, setDefaultSize] = useState<VehicleSize>('Sedang');
  const [examples, setExamples] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd({
      id: name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now().toString().slice(-4),
      name: name.trim(),
      defaultSize,
      examples: examples.trim() || '-'
    });
    setName('');
    setExamples('');
    setDefaultSize('Sedang');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-4 border-t border-slate-100">
      <h4 className="text-sm font-bold text-slate-500 uppercase flex items-center gap-1.5">
        <PlusCircle size={16} className="text-blue-600" />
        Tambah Kategori Mobil Baru
      </h4>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Nama Kategori</label>
          <input 
            type="text" 
            placeholder="Contoh: Sedan Luxury, Mobil Listrik / EV"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm font-medium"
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </div>
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Ukuran Rekomendasi</label>
          <select
            value={defaultSize}
            onChange={e => setDefaultSize(e.target.value as VehicleSize)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm font-medium"
          >
            <option value="Kecil">Kecil</option>
            <option value="Sedang">Sedang</option>
            <option value="Besar">Besar</option>
          </select>
        </div>
      </div>
      <div>
        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Contoh Model / Seri Mobil</label>
        <input 
          type="text" 
          placeholder="Contoh: Ioniq 5, Wuling Air EV, BMW 3 Series"
          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
          value={examples}
          onChange={e => setExamples(e.target.value)}
        />
      </div>
      <button 
        type="submit"
        disabled={!name.trim()}
        className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors disabled:bg-slate-100 disabled:text-slate-300"
      >
        <Plus size={16} />
        Simpan Kategori Mobil
      </button>
    </form>
  );
}

function AddMotorCategoryForm({ onAdd }: { onAdd: (category: CarCategoryPreset) => void }) {
  const [name, setName] = useState('');
  const [defaultSize, setDefaultSize] = useState<VehicleSize>('Kecil');
  const [examples, setExamples] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd({
      id: name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now().toString().slice(-4),
      name: name.trim(),
      defaultSize,
      examples: examples.trim() || '-'
    });
    setName('');
    setExamples('');
    setDefaultSize('Kecil');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-4 border-t border-slate-100">
      <h4 className="text-sm font-bold text-slate-500 uppercase flex items-center gap-1.5">
        <PlusCircle size={16} className="text-emerald-600" />
        Tambah Tipe Motor Baru
      </h4>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Nama Kategori / Tipe Motor</label>
          <input 
            type="text" 
            placeholder="Contoh: Matic Sport, Motor Trail, Supermoto"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-sm font-medium"
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </div>
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Ukuran Rekomendasi</label>
          <select
            value={defaultSize}
            onChange={e => setDefaultSize(e.target.value as VehicleSize)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-sm font-medium"
          >
            <option value="Kecil">Kecil (15.000)</option>
            <option value="Sedang">Sedang (20.000)</option>
            <option value="Besar">Besar (25.000)</option>
          </select>
        </div>
      </div>
      <div>
        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Contoh Model / Seri Motor</label>
        <input 
          type="text" 
          placeholder="Contoh: KLX 150, CRF 150, WR 155, Vespa Matic"
          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-sm"
          value={examples}
          onChange={e => setExamples(e.target.value)}
        />
      </div>
      <button 
        type="submit"
        disabled={!name.trim()}
        className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-700 transition-colors disabled:bg-slate-100 disabled:text-slate-300 shadow-sm"
      >
        <Plus size={16} />
        Simpan Tipe Motor
      </button>
    </form>
  );
}

