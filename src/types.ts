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
  carUnitWage: number;
  motorUnitWage: number;
  wageModel: 'fixed_per_unit' | 'percentage_per_unit';
  percentageRate: number;
}

export interface AssignedEmployee {
  id: string;
  name: string;
  wageEarned: number;
}

export interface Employee {
  id: string;
  name: string;
  phone?: string;
  role: string;
  wageType: WageType;
  wageAmount?: number;
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
  price: number;
  paymentMethod?: PaymentMethod;
  amountPaid?: number;
  changeAmount?: number;
  customerPhone?: string;
  notes?: string;
  employeeId?: string;
  employeeName?: string;
  employeeWage?: number;
  assignedEmployees?: AssignedEmployee[];
  totalUnitWage?: number;
  wagePerPerson?: number;
  cashierName?: string;
  items: {
    name: string;
    price: number;
    category: 'wash' | 'drink';
    quantity: number;
  }[];
  timestamp: string;
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
  adminPin: string;
  cashierPin: string;
  cashierNames: string[];
  requireLoginOnOpen: boolean;
}
