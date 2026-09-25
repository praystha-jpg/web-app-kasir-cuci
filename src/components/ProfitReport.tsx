import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  Percent, 
  Calendar, 
  Download, 
  ArrowUpRight, 
  ArrowDownRight, 
  PieChart, 
  Car, 
  Bike, 
  Coffee, 
  ChevronDown, 
  CheckCircle2, 
  Receipt,
  FileSpreadsheet,
  Printer
} from 'lucide-react';
import { 
  format, 
  parseISO, 
  isSameDay, 
  isSameWeek, 
  isSameMonth, 
  subDays, 
  startOfMonth, 
  endOfMonth 
} from 'date-fns';
import { id as idLoc } from 'date-fns/locale';
import { type Transaction, type Employee, cn } from '../lib/utils';

interface ProfitReportProps {
  transactions: Transaction[];
  employees: Employee[];
  formatCurrency: (amount: number) => string;
}

type PeriodFilter = 'today' | 'week' | 'month' | 'all';

export const ProfitReport: React.FC<ProfitReportProps> = ({
  transactions,
  employees,
  formatCurrency,
}) => {
  const [period, setPeriod] = useState<PeriodFilter>('today');
  const [drinkCostRate, setDrinkCostRate] = useState<number>(60); // 60% HPP minuman
  const [soapCostPerCar, setSoapCostPerCar] = useState<number>(3000); // Rp 3.000 bahan/sabun per mobil
  const [soapCostPerMotor, setSoapCostPerMotor] = useState<number>(1500); // Rp 1.500 bahan/sabun per motor
  const [showCostSettings, setShowCostSettings] = useState(false);

  // Filter transactions according to selected period
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    return transactions.filter(t => {
      try {
        const date = parseISO(t.timestamp);
        if (period === 'today') return isSameDay(date, now);
        if (period === 'week') return isSameWeek(date, now, { weekStartsOn: 1 });
        if (period === 'month') return isSameMonth(date, now);
        return true;
      } catch {
        return false;
      }
    });
  }, [transactions, period]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    let grossRevenue = 0;
    let totalWashRevenue = 0;
    let totalDrinkRevenue = 0;
    let totalWages = 0;
    let totalCars = 0;
    let totalMotors = 0;

    filteredTransactions.forEach(t => {
      grossRevenue += t.price;

      // Check wash category
      const washItem = t.items.find(i => i.category === 'wash');
      if (washItem) {
        totalWashRevenue += washItem.price;
        if (t.vehicleTypeId === 'motor') {
          totalMotors += 1;
        } else {
          totalCars += 1;
        }
      }

      // Check drink category
      t.items.filter(i => i.category === 'drink').forEach(d => {
        totalDrinkRevenue += (d.price * d.quantity);
      });

      // Wages
      if (t.assignedEmployees && t.assignedEmployees.length > 0) {
        totalWages += t.assignedEmployees.reduce((acc, a) => acc + (a.wageEarned || 0), 0);
      } else if (typeof t.employeeWage === 'number') {
        totalWages += t.employeeWage;
      } else if (t.employeeId) {
        // Fallback calculation if not stored
        const emp = employees.find(e => e.id === t.employeeId);
        if (emp) {
          if (emp.wageType === 'commission_percentage') {
            totalWages += Math.round((washItem?.price || 0) * (emp.wageAmount / 100));
          } else if (emp.wageType === 'commission_fixed') {
            totalWages += t.vehicleTypeId === 'motor' ? (emp.motorWageAmount || 5000) : emp.wageAmount;
          }
        }
      }
    });

    // Material & Operational costs estimation
    const estimatedDrinkHPP = Math.round(totalDrinkRevenue * (drinkCostRate / 100));
    const estimatedSoapCost = (totalCars * soapCostPerCar) + (totalMotors * soapCostPerMotor);
    const totalEstimatedExpenses = totalWages + estimatedDrinkHPP + estimatedSoapCost;
    const estimatedNetProfit = grossRevenue - totalEstimatedExpenses;
    const profitMargin = grossRevenue > 0 ? ((estimatedNetProfit / grossRevenue) * 100) : 0;

    return {
      grossRevenue,
      totalWashRevenue,
      totalDrinkRevenue,
      totalWages,
      totalCars,
      totalMotors,
      estimatedDrinkHPP,
      estimatedSoapCost,
      totalEstimatedExpenses,
      estimatedNetProfit,
      profitMargin,
      totalOrders: filteredTransactions.length,
    };
  }, [filteredTransactions, employees, drinkCostRate, soapCostPerCar, soapCostPerMotor]);

  // Aggregate Payroll Breakdown per Employee
  const employeeRecap = useMemo(() => {
    const recapMap: Record<string, {
      employee: Employee | { id: string; name: string; role: string };
      carsCount: number;
      motorsCount: number;
      totalUnits: number;
      totalWages: number;
      transactions: Transaction[];
    }> = {};

    // Initialize all active employees
    employees.forEach(emp => {
      recapMap[emp.id] = {
        employee: emp,
        carsCount: 0,
        motorsCount: 0,
        totalUnits: 0,
        totalWages: 0,
        transactions: []
      };
    });

    // Bucket: Unassigned / Lainnya
    recapMap['unassigned'] = {
      employee: { id: 'unassigned', name: 'Tanpa Petugas Tertulis', role: 'Umum' },
      carsCount: 0,
      motorsCount: 0,
      totalUnits: 0,
      totalWages: 0,
      transactions: []
    };

    filteredTransactions.forEach(t => {
      const isMotor = t.vehicleTypeId === 'motor';
      const hasWash = t.items.some(i => i.category === 'wash');

      if (t.assignedEmployees && t.assignedEmployees.length > 0) {
        // Multi-employee split unit wage: credit each worker who took part
        t.assignedEmployees.forEach(assigned => {
          const key = assigned.id;
          if (!recapMap[key]) {
            recapMap[key] = {
              employee: { id: key, name: assigned.name, role: 'Washer' },
              carsCount: 0,
              motorsCount: 0,
              totalUnits: 0,
              totalWages: 0,
              transactions: []
            };
          }

          if (hasWash) {
            if (isMotor) {
              recapMap[key].motorsCount += 1;
            } else {
              recapMap[key].carsCount += 1;
            }
            recapMap[key].totalUnits += 1;
          }

          recapMap[key].totalWages += (assigned.wageEarned || 0);
          recapMap[key].transactions.push(t);
        });
      } else {
        // Single employee or unassigned legacy fallback
        const key = t.employeeId && recapMap[t.employeeId] ? t.employeeId : (t.employeeId || 'unassigned');
        if (!recapMap[key]) {
          recapMap[key] = {
            employee: { id: key, name: t.employeeName || 'Karyawan', role: 'Washer' },
            carsCount: 0,
            motorsCount: 0,
            totalUnits: 0,
            totalWages: 0,
            transactions: []
          };
        }

        if (hasWash) {
          if (isMotor) {
            recapMap[key].motorsCount += 1;
          } else {
            recapMap[key].carsCount += 1;
          }
          recapMap[key].totalUnits += 1;
        }

        const wage = typeof t.employeeWage === 'number' ? t.employeeWage : 0;
        recapMap[key].totalWages += wage;
        recapMap[key].transactions.push(t);
      }
    });

    return Object.values(recapMap).filter(item => item.totalUnits > 0 || item.totalWages > 0 || (item.employee as Employee).isActive);
  }, [filteredTransactions, employees]);

  // CSV Exporter for Profit & Wages
  const downloadProfitReportCSV = () => {
    const periodLabel = period === 'today' ? 'Hari_Ini' : period === 'week' ? 'Minggu_Ini' : period === 'month' ? 'Bulan_Ini' : 'Semua';
    const dateStr = format(new Date(), 'yyyy-MM-dd_HHmm');
    
    let csv = `RINGKASAN ESTIMASI KEUNTUNGAN & KEUANGAN (${periodLabel})\n`;
    csv += `Tanggal Dibuat,${format(new Date(), 'dd/MM/yyyy HH:mm')}\n`;
    csv += `Total Transaksi,${metrics.totalOrders}\n`;
    csv += `Total Mobil Dicuci,${metrics.totalCars}\n`;
    csv += `Total Motor Dicuci,${metrics.totalMotors}\n\n`;
    
    csv += `PENDAPATAN & BEBAN,NOMINAL (IDR)\n`;
    csv += `Total Omzet / Pendapatan Kotor,${metrics.grossRevenue}\n`;
    csv += `Pendapatan Cuci Kendaraan,${metrics.totalWashRevenue}\n`;
    csv += `Pendapatan Minuman,${metrics.totalDrinkRevenue}\n`;
    csv += `Total Beban Upah / Komisi Karyawan,-${metrics.totalWages}\n`;
    csv += `Estimasi Biaya Bahan Cuci (Sabun/Air),-${metrics.estimatedSoapCost}\n`;
    csv += `Estimasi Modal Minuman,-${metrics.estimatedDrinkHPP}\n`;
    csv += `TOTAL BEBAN PENGELUARAN,-${metrics.totalEstimatedExpenses}\n`;
    csv += `ESTIMASI LABA BERSIH (NET PROFIT),${metrics.estimatedNetProfit}\n`;
    csv += `MARGIN KEUNTUNGAN (%),${metrics.profitMargin.toFixed(1)}%\n\n`;

    csv += `REKAPITULASI UPAH & KOMISI KARYAWAN\n`;
    csv += `Nama Karyawan,Posisi,Unit Mobil,Unit Motor,Total Unit,Total Upah Diterima (IDR)\n`;
    employeeRecap.forEach(r => {
      csv += `"${r.employee.name}","${r.employee.role}",${r.carsCount},${r.motorsCount},${r.totalUnits},${r.totalWages}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Laporan_Keuntungan_${periodLabel}_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header & Filter Periode */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-card p-5 rounded-3xl">
        <div>
          <h3 className="font-display font-bold text-lg text-slate-800 flex items-center gap-2">
            <TrendingUp className="text-emerald-600" size={22} />
            Laporan & Estimasi Keuntungan Bersih
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Analisis omzet, komisi karyawan, estimasi beban bahan, dan estimasi keuntungan bersih bisnis.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="bg-slate-100 p-1 rounded-2xl flex items-center gap-1 border border-slate-200/60">
            <button
              onClick={() => setPeriod('today')}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-bold transition-all",
                period === 'today' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-800"
              )}
            >
              Hari Ini
            </button>
            <button
              onClick={() => setPeriod('week')}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-bold transition-all",
                period === 'week' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-800"
              )}
            >
              Minggu Ini
            </button>
            <button
              onClick={() => setPeriod('month')}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-bold transition-all",
                period === 'month' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-800"
              )}
            >
              Bulan Ini
            </button>
            <button
              onClick={() => setPeriod('all')}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-bold transition-all",
                period === 'all' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-800"
              )}
            >
              Semua
            </button>
          </div>

          <button
            onClick={downloadProfitReportCSV}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
            title="Unduh Laporan Keuntungan & Slip Komisi ke CSV"
          >
            <Download size={14} />
            <span className="hidden md:inline">Unduh CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Utama */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Omzet Kotor */}
        <div className="glass-card p-5 rounded-3xl relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Pendapatan Kotor</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <DollarSign size={18} />
            </div>
          </div>
          <p className="font-display font-extrabold text-2xl text-slate-800 tracking-tight">
            {formatCurrency(metrics.grossRevenue)}
          </p>
          <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
            <span>{metrics.totalCars} Mobil</span>
            <span>•</span>
            <span>{metrics.totalMotors} Motor</span>
            <span>•</span>
            <span>{metrics.totalOrders} Transaksi</span>
          </div>
        </div>

        {/* Card 2: Beban Upah Karyawan */}
        <div className="glass-card p-5 rounded-3xl relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Beban Upah & Komisi</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Users size={18} />
            </div>
          </div>
          <p className="font-display font-extrabold text-2xl text-amber-600 tracking-tight">
            {formatCurrency(metrics.totalWages)}
          </p>
          <p className="text-xs text-slate-400 mt-2">
            {metrics.grossRevenue > 0 
              ? `${((metrics.totalWages / metrics.grossRevenue) * 100).toFixed(1)}% dari total omzet`
              : '0% dari total omzet'}
          </p>
        </div>

        {/* Card 3: Beban Bahan & Operasional */}
        <div className="glass-card p-5 rounded-3xl relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Estimasi Biaya Bahan</span>
            <button
              onClick={() => setShowCostSettings(!showCostSettings)}
              className="text-[10px] font-bold text-blue-600 hover:underline"
            >
              Atur Rasio
            </button>
          </div>
          <p className="font-display font-extrabold text-2xl text-slate-700 tracking-tight">
            {formatCurrency(metrics.estimatedSoapCost + metrics.estimatedDrinkHPP)}
          </p>
          <div className="flex items-center justify-between text-xs text-slate-400 mt-2">
            <span>Sabun/Air: {formatCurrency(metrics.estimatedSoapCost)}</span>
            <span>HPP: {formatCurrency(metrics.estimatedDrinkHPP)}</span>
          </div>
        </div>

        {/* Card 4: Estimasi Keuntungan Bersih */}
        <div className="glass-card p-5 rounded-3xl relative overflow-hidden bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border-emerald-200">
          <div className="flex items-center justify-between text-emerald-700 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Estimasi Laba Bersih</span>
            <span className="text-xs font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              {metrics.profitMargin.toFixed(1)}%
            </span>
          </div>
          <p className="font-display font-extrabold text-2xl text-emerald-700 tracking-tight">
            {formatCurrency(metrics.estimatedNetProfit)}
          </p>
          <p className="text-xs text-emerald-600 font-medium mt-2 flex items-center gap-1">
            <ArrowUpRight size={14} />
            Laba bersih setelah upah & bahan
          </p>
        </div>
      </div>

      {/* Accordion Pengaturan Parameter Estimasi Biaya */}
      {showCostSettings && (
        <div className="glass-card p-5 rounded-3xl border border-blue-100 bg-blue-50/40 space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-blue-800">
              Parameter Estimasi Pengeluaran Bahan Usaha
            </h4>
            <button 
              onClick={() => setShowCostSettings(false)}
              className="text-xs text-slate-500 hover:text-slate-800 font-semibold"
            >
              Tutup
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="text-slate-600 font-bold block mb-1">Estimasi Sabun & Air Mobil (Rp / Mobil)</label>
              <input 
                type="number" 
                value={soapCostPerCar} 
                onChange={(e) => setSoapCostPerCar(Number(e.target.value))}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800"
              />
            </div>
            <div>
              <label className="text-slate-600 font-bold block mb-1">Estimasi Sabun & Air Motor (Rp / Motor)</label>
              <input 
                type="number" 
                value={soapCostPerMotor} 
                onChange={(e) => setSoapCostPerMotor(Number(e.target.value))}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800"
              />
            </div>
            <div>
              <label className="text-slate-600 font-bold block mb-1">Estimasi HPP Minuman (% dari harga jual)</label>
              <div className="flex items-center gap-2">
                <input 
                  type="number" 
                  value={drinkCostRate} 
                  onChange={(e) => setDrinkCostRate(Number(e.target.value))}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800"
                />
                <span className="font-bold text-slate-600">%</span>
              </div>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 italic">
            * Parameter ini digunakan untuk menghitung estimasi laba bersih secara otomatis tanpa perlu menginput nota belanja setiap hari.
          </p>
        </div>
      )}

      {/* Visualisasi Distribusi Keuangan */}
      <div className="glass-card p-6 rounded-3xl">
        <h4 className="font-display font-bold text-base text-slate-800 mb-3 flex items-center gap-2">
          <PieChart className="text-blue-600" size={18} />
          Distribusi Alokasi Keuangan
        </h4>
        
        {metrics.grossRevenue > 0 ? (
          <div className="space-y-4">
            <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
              <div 
                style={{ width: `${Math.max(0, Math.min(100, (metrics.estimatedNetProfit / metrics.grossRevenue) * 100))}%` }}
                className="bg-emerald-500 h-full transition-all duration-500"
                title={`Keuntungan Bersih: ${formatCurrency(metrics.estimatedNetProfit)}`}
              />
              <div 
                style={{ width: `${Math.max(0, Math.min(100, (metrics.totalWages / metrics.grossRevenue) * 100))}%` }}
                className="bg-amber-400 h-full transition-all duration-500"
                title={`Upah Karyawan: ${formatCurrency(metrics.totalWages)}`}
              />
              <div 
                style={{ width: `${Math.max(0, Math.min(100, ((metrics.estimatedSoapCost + metrics.estimatedDrinkHPP) / metrics.grossRevenue) * 100))}%` }}
                className="bg-blue-400 h-full transition-all duration-500"
                title={`Bahan & HPP: ${formatCurrency(metrics.estimatedSoapCost + metrics.estimatedDrinkHPP)}`}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 flex-shrink-0" />
                <div className="truncate">
                  <span className="text-slate-500">Laba Bersih Toko: </span>
                  <strong className="text-emerald-700">{formatCurrency(metrics.estimatedNetProfit)} ({metrics.profitMargin.toFixed(1)}%)</strong>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 rounded-full bg-amber-400 flex-shrink-0" />
                <div className="truncate">
                  <span className="text-slate-500">Upah Karyawan: </span>
                  <strong className="text-amber-700">{formatCurrency(metrics.totalWages)} ({((metrics.totalWages / metrics.grossRevenue) * 100).toFixed(1)}%)</strong>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 rounded-full bg-blue-400 flex-shrink-0" />
                <div className="truncate">
                  <span className="text-slate-500">Bahan Sabun & HPP: </span>
                  <strong className="text-blue-700">{formatCurrency(metrics.estimatedSoapCost + metrics.estimatedDrinkHPP)} ({(((metrics.estimatedSoapCost + metrics.estimatedDrinkHPP) / metrics.grossRevenue) * 100).toFixed(1)}%)</strong>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-400">Belum ada data pendapatan pada periode yang dipilih.</p>
        )}
      </div>

      {/* Tabel Rekapitulasi Gaji & Upah Karyawan */}
      <div className="glass-card p-6 rounded-3xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h4 className="font-display font-bold text-base text-slate-800 flex items-center gap-2">
              <Users className="text-blue-600" size={20} />
              Rekapitulasi Upah & Komisi Karyawan
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Rincian jumlah unit yang dicuci dan total upah yang berhak diterima setiap pekerja.
            </p>
          </div>
        </div>

        {employeeRecap.length === 0 ? (
          <div className="py-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <Users className="mx-auto text-slate-300 mb-2" size={32} />
            <p className="text-xs font-bold text-slate-500">Tidak ada data pengerjaan cuci pada periode ini.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="pb-3 pl-2">Nama Karyawan</th>
                  <th className="pb-3">Posisi</th>
                  <th className="pb-3 text-center">Cuci Mobil</th>
                  <th className="pb-3 text-center">Cuci Motor</th>
                  <th className="pb-3 text-center">Total Unit</th>
                  <th className="pb-3 text-right pr-2">Total Upah / Komisi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employeeRecap.map((recap, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 pl-2 font-bold text-slate-800">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 font-bold flex items-center justify-center text-[10px]">
                          {recap.employee.name.slice(0, 2).toUpperCase()}
                        </div>
                        <span>{recap.employee.name}</span>
                      </div>
                    </td>
                    <td className="py-3.5 text-slate-500">{recap.employee.role}</td>
                    <td className="py-3.5 text-center font-semibold text-slate-700">
                      {recap.carsCount > 0 ? (
                        <span className="inline-flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md font-bold">
                          <Car size={12} /> {recap.carsCount}
                        </span>
                      ) : (
                        <span className="text-slate-300">0</span>
                      )}
                    </td>
                    <td className="py-3.5 text-center font-semibold text-slate-700">
                      {recap.motorsCount > 0 ? (
                        <span className="inline-flex items-center gap-1 text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md font-bold">
                          <Bike size={12} /> {recap.motorsCount}
                        </span>
                      ) : (
                        <span className="text-slate-300">0</span>
                      )}
                    </td>
                    <td className="py-3.5 text-center font-bold text-slate-800">
                      {recap.totalUnits} unit
                    </td>
                    <td className="py-3.5 text-right pr-2 font-display font-bold text-amber-600 text-sm">
                      {formatCurrency(recap.totalWages)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-200 font-bold bg-slate-50/50">
                  <td className="py-3 pl-2 text-slate-700 uppercase" colSpan={2}>
                    Total Upah Seluruh Tim
                  </td>
                  <td className="py-3 text-center text-blue-600">{metrics.totalCars}</td>
                  <td className="py-3 text-center text-indigo-600">{metrics.totalMotors}</td>
                  <td className="py-3 text-center text-slate-800">{metrics.totalCars + metrics.totalMotors}</td>
                  <td className="py-3 text-right pr-2 font-display font-extrabold text-amber-600 text-base">
                    {formatCurrency(metrics.totalWages)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
