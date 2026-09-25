import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type VehicleSize = 'Kecil' | 'Sedang' | 'Besar';

export interface VehicleType {
  id: string;
  name: string;
  prices: Record<VehicleSize, number>;
}

export interface Drink {
  id: string;
  name: string;
  price: number;
}

export interface CarCategoryPreset {
  id: string;
  name: string;
  defaultSize: VehicleSize;
  examples: string;
}

export type PaymentMethod = 'cash' | 'qris' | 'transfer' | 'debit';

export type WageType = 'split_unit_pool' | 'commission_fixed' | 'commission_percentage' | 'daily';

export interface WageUnitConfig {
  carUnitWage: number; // Alokasi total upah per unit mobil (akan dibagi rata ke pekerja)
  motorUnitWage: number; // Alokasi total upah per unit motor (akan dibagi rata ke pekerja)
  wageModel: 'fixed_per_unit' | 'percentage_per_unit'; // nominal per unit atau persentase dari tarif cuci
  percentageRate: number; // misal 25-30%
}

export const INITIAL_WAGE_UNIT_CONFIG: WageUnitConfig = {
  carUnitWage: 15000, // Rp 15.000 per mobil (dibagi rata ke jumlah washer yang mencuci)
  motorUnitWage: 5000,  // Rp 5.000 per motor (dibagi rata ke jumlah washer yang mencuci)
  wageModel: 'fixed_per_unit',
  percentageRate: 25,
};

export interface AssignedEmployee {
  id: string;
  name: string;
  wageEarned: number; // Porsi upah yang didapat setelah dibagi rata
}

export interface Employee {
  id: string;
  name: string;
  phone?: string;
  role: string;
  wageType: WageType;
  wageAmount?: number; // komisi atau gaji jika skema khusus
  motorWageAmount?: number;
  isActive: boolean;
}

export interface Transaction {
  id: string;
  orderNumber?: string;
  vehicleTypeId?: string;
  vehicleTypeName?: string;
  plateNumber?: string;
  carCategory?: string;
  size?: VehicleSize;
  price: number; // Total price
  paymentMethod?: PaymentMethod;
  amountPaid?: number;
  changeAmount?: number;
  customerPhone?: string;
  notes?: string;
  employeeId?: string;
  employeeName?: string;
  employeeWage?: number; // total alokasi upah transaksi ini
  assignedEmployees?: AssignedEmployee[]; // Rincian pekerja yang mengerjakan dan bagian upah masing-masing
  totalUnitWage?: number; // Total pool upah kendaraan
  wagePerPerson?: number; // Nominal per orang
  cashierName?: string; // Nama kasir/petugas yang memproses transaksi
  items: {
    name: string;
    price: number;
    category: 'wash' | 'drink';
    quantity: number;
  }[];
  timestamp: string;
}

export const INITIAL_CAR_CATEGORIES: CarCategoryPreset[] = [
  { id: 'city-car', name: 'City Car / Hatchback', defaultSize: 'Kecil', examples: 'Brio, Agya, Ayla, Yaris, Jazz, Ignis' },
  { id: 'sedan', name: 'Sedan', defaultSize: 'Sedang', examples: 'Vios, City, Civic, Corolla, Camry' },
  { id: 'mpv', name: 'MPV / Minivan', defaultSize: 'Sedang', examples: 'Avanza, Xenia, Ertiga, Mobilio, Xpander' },
  { id: 'suv-compact', name: 'Compact SUV', defaultSize: 'Sedang', examples: 'HR-V, Creta, Raize, Rocky, WR-V' },
  { id: 'suv-big', name: 'Big SUV', defaultSize: 'Besar', examples: 'Fortuner, Pajero Sport, CR-V, Santa Fe' },
  { id: 'mpv-big', name: 'Big MPV / Premium', defaultSize: 'Besar', examples: 'Innova, Alphard, Vellfire, Carnival' },
  { id: 'pickup', name: 'Pickup / D-Cab', defaultSize: 'Besar', examples: 'Hilux, Triton, Gran Max, Carry' },
];

export const INITIAL_MOTOR_CATEGORIES: CarCategoryPreset[] = [
  { id: 'matic-kecil', name: 'Matic Kecil / Bebek', defaultSize: 'Kecil', examples: 'Beat, Mio, Scoopy, Revo, Vega, Jupiter' },
  { id: 'matic-sedang', name: 'Matic Sedang', defaultSize: 'Sedang', examples: 'Vario 125/160, Fazzio, Filano, Lexi' },
  { id: 'matic-maxi', name: 'Matic Maxi / Besar', defaultSize: 'Besar', examples: 'NMAX, PCX, Aerox, ADV, Forza, XMAX' },
  { id: 'sport-trail', name: 'Motor Sport / Trail', defaultSize: 'Besar', examples: 'CBR, Ninja, R15, GSX, KLX, CRF, WR155' },
  { id: 'moge', name: 'Moge / 250cc+', defaultSize: 'Besar', examples: 'Harley, ZX-25R, MT-25, Rebel, Vespa GTS' },
];

export const INITIAL_DRINKS: Drink[] = [
  { id: 'air-mineral', name: 'Air Mineral', price: 5000 },
  { id: 'teh-botol', name: 'Teh Botol', price: 7000 },
  { id: 'kopi', name: 'Kopi', price: 10000 },
];

export const INITIAL_VEHICLE_TYPES: VehicleType[] = [
  {
    id: 'motor',
    name: 'Motor',
    prices: {
      Kecil: 15000,
      Sedang: 20000,
      Besar: 25000,
    },
  },
  {
    id: 'mobil',
    name: 'Mobil',
    prices: {
      Kecil: 50000,
      Sedang: 55000,
      Besar: 60000,
    },
  },
];

export const INITIAL_EMPLOYEES: Employee[] = [
  {
    id: 'emp-1',
    name: 'Budi Santoso',
    phone: '081234567890',
    role: 'Washer Mobil & Motor',
    wageType: 'split_unit_pool',
    isActive: true,
  },
  {
    id: 'emp-2',
    name: 'Agus Setiawan',
    phone: '081987654321',
    role: 'Washer Mobil & Motor',
    wageType: 'split_unit_pool',
    isActive: true,
  },
  {
    id: 'emp-3',
    name: 'Rudi Pratama',
    phone: '081324354657',
    role: 'Washer Motor & Mobil',
    wageType: 'split_unit_pool',
    isActive: true,
  },
];

/**
 * Menghitung alokasi total upah per unit kendaraan dan membaginya rata ke setiap pekerja
 */
export function calculateSplitUnitWage(
  vehicleTypeId: string | undefined, 
  washPrice: number, 
  assignedCount: number,
  config: WageUnitConfig = INITIAL_WAGE_UNIT_CONFIG
): { totalUnitWage: number; wagePerPerson: number } {
  if (assignedCount <= 0) return { totalUnitWage: 0, wagePerPerson: 0 };

  let totalUnitWage = 0;
  if (config.wageModel === 'percentage_per_unit') {
    totalUnitWage = Math.round((washPrice * (config.percentageRate || 25)) / 100);
  } else {
    if (vehicleTypeId === 'motor') {
      totalUnitWage = config.motorUnitWage !== undefined ? config.motorUnitWage : 5000;
    } else {
      totalUnitWage = config.carUnitWage !== undefined ? config.carUnitWage : 15000;
    }
  }

  // Upah per unit dibagi rata ke setiap orang yang mencuci
  const wagePerPerson = Math.round(totalUnitWage / assignedCount);
  return { totalUnitWage, wagePerPerson };
}

export function calculateEmployeeWage(
  employee: Employee | null | undefined, 
  vehicleTypeId: string | undefined, 
  washPrice: number,
  config: WageUnitConfig = INITIAL_WAGE_UNIT_CONFIG
): number {
  if (!employee) return 0;
  if (employee.wageType === 'split_unit_pool') {
    return vehicleTypeId === 'motor' ? (config.motorUnitWage || 5000) : (config.carUnitWage || 15000);
  }
  if (employee.wageType === 'commission_fixed') {
    if (vehicleTypeId === 'motor') {
      return employee.motorWageAmount !== undefined ? employee.motorWageAmount : (config.motorUnitWage || 5000);
    }
    return employee.wageAmount || (config.carUnitWage || 15000);
  }
  if (employee.wageType === 'commission_percentage') {
    return Math.round((washPrice * (employee.wageAmount || config.percentageRate || 25)) / 100);
  }
  return 0; // Gaji harian dihitung per hari
}

export type UserRole = 'admin' | 'cashier';

export interface AuthUser {
  id: string;
  name: string;
  role: UserRole;
  email?: string;
  photoURL?: string;
  loginMethod: 'pin' | 'google';
  loginAt: string;
}

export interface SecurityConfig {
  adminPin: string; // PIN akses penuh untuk Owner/Manajer (default: 1234)
  cashierPin: string; // PIN akses kasir (default: 0000)
  cashierNames: string[]; // Daftar nama kasir untuk pemilihan cepat
  requireLoginOnOpen: boolean;
}

export const INITIAL_SECURITY_CONFIG: SecurityConfig = {
  adminPin: '1234',
  cashierPin: '0000',
  cashierNames: ['Kasir Utama', 'Shift Pagi', 'Shift Sore'],
  requireLoginOnOpen: true,
};

