import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Edit3, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  Banknote, 
  Phone, 
  Tag, 
  Plus, 
  Check, 
  X,
  AlertCircle,
  Car,
  Bike,
  Sliders,
  Sparkles,
  Scale
} from 'lucide-react';
import { 
  type Employee, 
  type WageType, 
  type WageUnitConfig, 
  INITIAL_WAGE_UNIT_CONFIG,
  cn 
} from '../lib/utils';

interface EmployeeManagerProps {
  employees: Employee[];
  onUpdateEmployees: (employees: Employee[]) => void;
  wageUnitConfig?: WageUnitConfig;
  onUpdateWageUnitConfig?: (config: WageUnitConfig) => void;
  formatCurrency: (amount: number) => string;
}

export const EmployeeManager: React.FC<EmployeeManagerProps> = ({
  employees,
  onUpdateEmployees,
  wageUnitConfig = INITIAL_WAGE_UNIT_CONFIG,
  onUpdateWageUnitConfig,
  formatCurrency,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  // Wage Pool Config local editing
  const [isEditingScheme, setIsEditingScheme] = useState(false);
  const [carWage, setCarWage] = useState<number>(wageUnitConfig.carUnitWage || 15000);
  const [motorWage, setMotorWage] = useState<number>(wageUnitConfig.motorUnitWage || 5000);
  const [wageModel, setWageModel] = useState<'fixed_per_unit' | 'percentage_per_unit'>(wageUnitConfig.wageModel || 'fixed_per_unit');
  const [percentageRate, setPercentageRate] = useState<number>(wageUnitConfig.percentageRate || 25);

  // Sync when prop updates
  useEffect(() => {
    setCarWage(wageUnitConfig.carUnitWage || 15000);
    setMotorWage(wageUnitConfig.motorUnitWage || 5000);
    setWageModel(wageUnitConfig.wageModel || 'fixed_per_unit');
    setPercentageRate(wageUnitConfig.percentageRate || 25);
  }, [wageUnitConfig]);

  // Form states for individual employee
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('Washer Mobil & Motor');
  const [wageType, setWageType] = useState<WageType>('split_unit_pool');
  const [wageAmount, setWageAmount] = useState<number>(15000);
  const [motorWageAmount, setMotorWageAmount] = useState<number>(5000);
  const [isActive, setIsActive] = useState(true);

  const openAddModal = () => {
    setEditingEmployee(null);
    setName('');
    setPhone('');
    setRole('Washer Mobil & Motor');
    setWageType('split_unit_pool');
    setWageAmount(15000);
    setMotorWageAmount(5000);
    setIsActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (emp: Employee) => {
    setEditingEmployee(emp);
    setName(emp.name);
    setPhone(emp.phone || '');
    setRole(emp.role || 'Washer Mobil & Motor');
    setWageType(emp.wageType || 'split_unit_pool');
    setWageAmount(emp.wageAmount || 0);
    setMotorWageAmount(emp.motorWageAmount || 0);
    setIsActive(emp.isActive);
    setIsModalOpen(true);
  };

  const handleSaveScheme = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdateWageUnitConfig) {
      onUpdateWageUnitConfig({
        carUnitWage: Number(carWage) || 15000,
        motorUnitWage: Number(motorWage) || 5000,
        wageModel,
        percentageRate: Number(percentageRate) || 25,
      });
    }
    setIsEditingScheme(false);
  };

  const handleSaveEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Nama karyawan wajib diisi');
      return;
    }

    if (editingEmployee) {
      const updated = employees.map(emp => 
        emp.id === editingEmployee.id
          ? {
              ...emp,
              name: name.trim(),
              phone: phone.trim(),
              role: role.trim(),
              wageType,
              wageAmount: Number(wageAmount) || 0,
              motorWageAmount: Number(motorWageAmount) || 0,
              isActive,
            }
          : emp
      );
      onUpdateEmployees(updated);
    } else {
      const newEmp: Employee = {
        id: `emp-${Date.now()}`,
        name: name.trim(),
        phone: phone.trim(),
        role: role.trim(),
        wageType,
        wageAmount: Number(wageAmount) || 0,
        motorWageAmount: Number(motorWageAmount) || 0,
        isActive,
      };
      onUpdateEmployees([...employees, newEmp]);
    }

    setIsModalOpen(false);
  };

  const handleDelete = (id: string, empName: string) => {
    if (confirm(`Hapus data karyawan "${empName}"?`)) {
      onUpdateEmployees(employees.filter(e => e.id !== id));
    }
  };

  const handleToggleActive = (id: string) => {
    onUpdateEmployees(
      employees.map(e => e.id === id ? { ...e, isActive: !e.isActive } : e)
    );
  };

  const currentCarPool = wageUnitConfig.carUnitWage || 15000;
  const currentMotorPool = wageUnitConfig.motorUnitWage || 5000;

  return (
    <div className="space-y-6">
      {/* Kartu Utama: Skema Pembagian Upah per Unit (Bagi Rata) */}
      <div className="glass-card p-6 rounded-3xl relative overflow-hidden border border-blue-200/70 bg-gradient-to-br from-blue-50/50 via-white to-slate-50 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-blue-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-blue-600 text-white shadow-md shadow-blue-200">
                <Scale size={20} />
              </span>
              <div>
                <h3 className="font-display font-bold text-lg text-slate-800 flex items-center gap-2">
                  Skema Upah per Unit (Bagi Rata ke Setiap Orang)
                </h3>
                <p className="text-xs text-slate-500">
                  Upah per unit cucian tidak tetap per orang, melainkan dialokasikan per kendaraan lalu <strong>dibagi rata</strong> ke seluruh pekerja yang mencuci unit tersebut.
                </p>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsEditingScheme(!isEditingScheme)}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 rounded-xl font-bold text-xs shadow-sm transition-all self-start sm:self-auto"
          >
            <Sliders size={15} />
            {isEditingScheme ? 'Tutup Pengaturan' : 'Ubah Alokasi Upah'}
          </button>
        </div>

        {/* Panel Edit Alokasi Upah Unit */}
        {isEditingScheme && (
          <form onSubmit={handleSaveScheme} className="my-5 p-4 bg-white rounded-2xl border border-blue-200 shadow-sm space-y-4 animate-in fade-in duration-200">
            <h4 className="text-xs font-bold uppercase tracking-wider text-blue-700 flex items-center gap-2">
              <Sparkles size={14} /> Atur Total Alokasi Upah per Kendaraan
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Alokasi Upah Cuci Mobil (Total per Unit)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">Rp</span>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={carWage}
                    onChange={(e) => setCarWage(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2 text-sm font-bold text-blue-700 outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Total dana upah 1 mobil. Jika dicuci 2 orang = {formatCurrency(Math.round(carWage / 2))}/orang.
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Alokasi Upah Cuci Motor (Total per Unit)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">Rp</span>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={motorWage}
                    onChange={(e) => setMotorWage(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2 text-sm font-bold text-indigo-700 outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Total dana upah 1 motor. Jika dicuci 2 orang = {formatCurrency(Math.round(motorWage / 2))}/orang.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsEditingScheme(false)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-100 rounded-xl"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm"
              >
                Simpan Alokasi Upah
              </button>
            </div>
          </form>
        )}

        {/* Ringkasan Parameter & Simulasi Pembagian Rata */}
        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card Parameter Mobil */}
          <div className="p-4 bg-white/90 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-lg bg-blue-50 text-blue-600">
                  <Car size={18} />
                </span>
                <div>
                  <h4 className="font-bold text-sm text-slate-800">Unit Cuci Mobil</h4>
                  <p className="text-[11px] text-slate-400">Alokasi Total Upah per Kendaraan</p>
                </div>
              </div>
              <span className="font-display font-extrabold text-blue-600 text-base">
                {formatCurrency(currentCarPool)}
              </span>
            </div>

            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Simulasi Pembagian Upah (Dibagi Rata):
              </p>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-white p-2 rounded-lg border border-slate-100">
                  <p className="text-[10px] text-slate-400">1 Orang</p>
                  <p className="font-bold text-slate-700">{formatCurrency(currentCarPool)}</p>
                  <span className="text-[9px] text-blue-600 font-semibold">100%</span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-blue-200 bg-blue-50/30">
                  <p className="text-[10px] text-slate-400">2 Orang</p>
                  <p className="font-bold text-blue-700">{formatCurrency(Math.round(currentCarPool / 2))}</p>
                  <span className="text-[9px] text-blue-600 font-semibold">50% / orang</span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-100">
                  <p className="text-[10px] text-slate-400">3 Orang</p>
                  <p className="font-bold text-slate-700">{formatCurrency(Math.round(currentCarPool / 3))}</p>
                  <span className="text-[9px] text-blue-600 font-semibold">33.3% / orang</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card Parameter Motor */}
          <div className="p-4 bg-white/90 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                  <Bike size={18} />
                </span>
                <div>
                  <h4 className="font-bold text-sm text-slate-800">Unit Cuci Motor</h4>
                  <p className="text-[11px] text-slate-400">Alokasi Total Upah per Kendaraan</p>
                </div>
              </div>
              <span className="font-display font-extrabold text-indigo-600 text-base">
                {formatCurrency(currentMotorPool)}
              </span>
            </div>

            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Simulasi Pembagian Upah (Dibagi Rata):
              </p>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-white p-2 rounded-lg border border-slate-100">
                  <p className="text-[10px] text-slate-400">1 Orang</p>
                  <p className="font-bold text-slate-700">{formatCurrency(currentMotorPool)}</p>
                  <span className="text-[9px] text-indigo-600 font-semibold">100%</span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-indigo-200 bg-indigo-50/30">
                  <p className="text-[10px] text-slate-400">2 Orang</p>
                  <p className="font-bold text-indigo-700">{formatCurrency(Math.round(currentMotorPool / 2))}</p>
                  <span className="text-[9px] text-indigo-600 font-semibold">50% / orang</span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-100">
                  <p className="text-[10px] text-slate-400">3 Orang</p>
                  <p className="font-bold text-slate-700">{formatCurrency(Math.round(currentMotorPool / 3))}</p>
                  <span className="text-[9px] text-indigo-600 font-semibold">33.3% / orang</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bagian Daftar Karyawan */}
      <div className="glass-card p-6 rounded-3xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="font-display font-bold text-lg flex items-center gap-2 text-slate-800">
              <Users className="text-blue-600" size={22} />
              Daftar Karyawan Pencuci
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Petugas aktif dapat dipilih (bisa lebih dari satu) di kasir saat kendaraan selesai dicuci untuk pembagian komisi otomatis.
            </p>
          </div>
          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-xs shadow-md shadow-blue-200 transition-all active:scale-95"
          >
            <UserPlus size={16} />
            Tambah Karyawan
          </button>
        </div>

        {employees.length === 0 ? (
          <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <Users className="mx-auto text-slate-300 mb-2" size={36} />
            <p className="text-sm font-bold text-slate-600">Belum ada data karyawan</p>
            <p className="text-xs text-slate-400 mt-1">Klik tombol di atas untuk mendaftarkan karyawan pencuci pertama Anda.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {employees.map((emp) => (
              <div 
                key={emp.id}
                className={cn(
                  "p-4 rounded-2xl border transition-all flex flex-col justify-between relative group",
                  emp.isActive 
                    ? "bg-white border-slate-200/80 shadow-sm hover:border-blue-300 hover:shadow-md" 
                    : "bg-slate-50/80 border-slate-200 opacity-70"
                )}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 font-bold flex items-center justify-center text-sm border border-blue-100">
                        {emp.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm">{emp.name}</h4>
                        <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                          <Tag size={10} />
                          {emp.role || 'Washer'}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleToggleActive(emp.id)}
                      className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-full border transition-colors",
                        emp.isActive 
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                          : "bg-slate-100 text-slate-400 border-slate-200"
                      )}
                      title="Klik untuk mengubah status aktif"
                    >
                      {emp.isActive ? 'Aktif' : 'Nonaktif'}
                    </button>
                  </div>

                  {emp.phone && (
                    <p className="text-xs text-slate-500 flex items-center gap-1.5 mb-3">
                      <Phone size={12} className="text-slate-400" />
                      <span>{emp.phone}</span>
                    </p>
                  )}

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1.5 mt-2">
                    <div className="flex items-center justify-between text-slate-500">
                      <span>Sistem Komisi:</span>
                      <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                        {emp.wageType === 'split_unit_pool' || !emp.wageType ? 'Bagi Rata per Unit' : 'Kustom'}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-600 pt-1 border-t border-slate-200/60 leading-relaxed">
                      Menerima pembagian rata dari total upah unit mobil ({formatCurrency(currentCarPool)}) & motor ({formatCurrency(currentMotorPool)}) saat bertugas.
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 mt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => openEditModal(emp)}
                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-xs font-semibold flex items-center gap-1"
                  >
                    <Edit3 size={14} />
                    <span>Ubah</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(emp.id, emp.name)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors text-xs font-semibold flex items-center gap-1"
                  >
                    <Trash2 size={14} />
                    <span>Hapus</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Tambah / Edit Karyawan */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <h4 className="font-display font-bold text-lg text-slate-800 flex items-center gap-2">
                <Users className="text-blue-600" size={20} />
                {editingEmployee ? 'Ubah Data Karyawan' : 'Tambah Karyawan Baru'}
              </h4>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEmployee} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Nama Lengkap Karyawan *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Budi Santoso"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Nomor WhatsApp / HP</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="081234567890"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Peran / Posisi</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  >
                    <option value="Washer Mobil & Motor">Washer Mobil & Motor</option>
                    <option value="Washer Mobil">Washer Khusus Mobil</option>
                    <option value="Washer Motor">Washer Khusus Motor</option>
                    <option value="Operator Pengering / Finishing">Operator Pengering / Finishing</option>
                    <option value="Kasir & Front Office">Kasir & Front Office</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Skema Upah Karyawan</label>
                <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                      <CheckCircle size={14} className="text-blue-600" />
                      Sistem Bagi Rata per Unit Kendaraan
                    </span>
                    <span className="text-[10px] bg-blue-600 text-white font-bold px-2 py-0.5 rounded-full">
                      Standar Car Wash
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Setiap unit yang dicuci bersama rekan tim akan dibagi rata secara adil sesuai alokasi unit ({formatCurrency(currentCarPool)} untuk mobil, {formatCurrency(currentMotorPool)} untuk motor).
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isActiveCheck"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="isActiveCheck" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Karyawan ini aktif dan dapat dipilih di kasir
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-xl text-xs font-bold transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-200 transition-all"
                >
                  {editingEmployee ? 'Simpan Perubahan' : 'Tambahkan Karyawan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
