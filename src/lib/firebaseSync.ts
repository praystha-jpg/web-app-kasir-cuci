import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDocFromServer, 
  collection, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  getDocs,
  writeBatch
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import type { 
  Transaction, 
  Employee, 
  VehicleType, 
  Drink, 
  CarCategoryPreset, 
  WageUnitConfig, 
  SecurityConfig 
} from '../types';

export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
/* CRITICAL: The app will break without this line specifying firestoreDatabaseId */
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Validate connection to Firestore on boot
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Firestore client is offline. Operating in offline cache mode.");
    } else {
      console.log("Connection test complete (note: rules require auth for reads).");
    }
    return false;
  }
}

// -------------------------------------------------------------
// TRANSACTIONS
// -------------------------------------------------------------
export function subscribeTransactions(
  onData: (transactions: Transaction[]) => void,
  onError?: (err: Error) => void
) {
  const path = 'transactions';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const items: Transaction[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as Transaction);
      });
      // Sort newest first
      items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      onData(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (err: any) {
        if (onError) onError(err);
      }
    }
  );
}

export async function syncSaveTransaction(transaction: Transaction) {
  const path = `transactions/${transaction.id}`;
  try {
    await setDoc(doc(db, 'transactions', transaction.id), transaction);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function syncDeleteTransaction(transactionId: string) {
  const path = `transactions/${transactionId}`;
  try {
    await deleteDoc(doc(db, 'transactions', transactionId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// -------------------------------------------------------------
// EMPLOYEES
// -------------------------------------------------------------
export function subscribeEmployees(
  onData: (employees: Employee[]) => void,
  onError?: (err: Error) => void
) {
  const path = 'employees';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const items: Employee[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as Employee);
      });
      onData(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (err: any) {
        if (onError) onError(err);
      }
    }
  );
}

export async function syncSaveEmployee(employee: Employee) {
  const path = `employees/${employee.id}`;
  try {
    await setDoc(doc(db, 'employees', employee.id), employee);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function syncDeleteEmployee(employeeId: string) {
  const path = `employees/${employeeId}`;
  try {
    await deleteDoc(doc(db, 'employees', employeeId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// -------------------------------------------------------------
// VEHICLE TYPES
// -------------------------------------------------------------
export function subscribeVehicleTypes(
  onData: (types: VehicleType[]) => void,
  onError?: (err: Error) => void
) {
  const path = 'vehicleTypes';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const items: VehicleType[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as VehicleType);
      });
      onData(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (err: any) {
        if (onError) onError(err);
      }
    }
  );
}

export async function syncSaveVehicleType(type: VehicleType) {
  const path = `vehicleTypes/${type.id}`;
  try {
    await setDoc(doc(db, 'vehicleTypes', type.id), type);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function syncDeleteVehicleType(typeId: string) {
  const path = `vehicleTypes/${typeId}`;
  try {
    await deleteDoc(doc(db, 'vehicleTypes', typeId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// -------------------------------------------------------------
// DRINKS
// -------------------------------------------------------------
export function subscribeDrinks(
  onData: (drinks: Drink[]) => void,
  onError?: (err: Error) => void
) {
  const path = 'drinks';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const items: Drink[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as Drink);
      });
      onData(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (err: any) {
        if (onError) onError(err);
      }
    }
  );
}

export async function syncSaveDrink(drink: Drink) {
  const path = `drinks/${drink.id}`;
  try {
    await setDoc(doc(db, 'drinks', drink.id), drink);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function syncDeleteDrink(drinkId: string) {
  const path = `drinks/${drinkId}`;
  try {
    await deleteDoc(doc(db, 'drinks', drinkId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// -------------------------------------------------------------
// CATEGORIES & PRESETS
// -------------------------------------------------------------
export function subscribeCarCategories(
  onData: (categories: CarCategoryPreset[]) => void,
  onError?: (err: Error) => void
) {
  const path = 'carCategories';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const items: CarCategoryPreset[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as CarCategoryPreset);
      });
      onData(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (err: any) {
        if (onError) onError(err);
      }
    }
  );
}

export async function syncSaveCarCategory(category: CarCategoryPreset) {
  const path = `carCategories/${category.id}`;
  try {
    await setDoc(doc(db, 'carCategories', category.id), category);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export function subscribeMotorCategories(
  onData: (categories: CarCategoryPreset[]) => void,
  onError?: (err: Error) => void
) {
  const path = 'motorCategories';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const items: CarCategoryPreset[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as CarCategoryPreset);
      });
      onData(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (err: any) {
        if (onError) onError(err);
      }
    }
  );
}

export async function syncSaveMotorCategory(category: CarCategoryPreset) {
  const path = `motorCategories/${category.id}`;
  try {
    await setDoc(doc(db, 'motorCategories', category.id), category);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// -------------------------------------------------------------
// GLOBAL SETTINGS (Shop, Wage Config, Security Config)
// -------------------------------------------------------------
export function subscribeSettings(
  onData: (settings: {
    shop?: { shopName: string; shopAddress: string; shopPhone: string };
    wageConfig?: WageUnitConfig;
    security?: SecurityConfig;
  }) => void,
  onError?: (err: Error) => void
) {
  const path = 'settings';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const result: {
        shop?: { shopName: string; shopAddress: string; shopPhone: string };
        wageConfig?: WageUnitConfig;
        security?: SecurityConfig;
      } = {};

      snapshot.forEach((docSnap) => {
        if (docSnap.id === 'shop') {
          result.shop = docSnap.data() as any;
        } else if (docSnap.id === 'wageConfig') {
          result.wageConfig = docSnap.data() as WageUnitConfig;
        } else if (docSnap.id === 'security') {
          result.security = docSnap.data() as SecurityConfig;
        }
      });

      onData(result);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (err: any) {
        if (onError) onError(err);
      }
    }
  );
}

export async function syncSaveShopProfile(profile: { shopName: string; shopAddress: string; shopPhone: string }) {
  const path = 'settings/shop';
  try {
    await setDoc(doc(db, 'settings', 'shop'), { ...profile, updatedAt: new Date().toISOString() });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function syncSaveWageUnitConfig(config: WageUnitConfig) {
  const path = 'settings/wageConfig';
  try {
    await setDoc(doc(db, 'settings', 'wageConfig'), { ...config, updatedAt: new Date().toISOString() });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function syncSaveSecurityConfig(config: SecurityConfig) {
  const path = 'settings/security';
  try {
    await setDoc(doc(db, 'settings', 'security'), { ...config, updatedAt: new Date().toISOString() });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// -------------------------------------------------------------
// SEED / INITIAL SYNC TO CLOUD
// If cloud is empty, seed it with current local app data
// -------------------------------------------------------------
export async function seedInitialCloudDataIfEmpty(defaults: {
  transactions: Transaction[];
  employees: Employee[];
  vehicleTypes: VehicleType[];
  drinks: Drink[];
  carCategories: CarCategoryPreset[];
  motorCategories: CarCategoryPreset[];
  shopProfile: { shopName: string; shopAddress: string; shopPhone: string };
  wageUnitConfig: WageUnitConfig;
  securityConfig: SecurityConfig;
}) {
  try {
    // Check if transactions exist
    const txSnap = await getDocs(collection(db, 'transactions'));
    if (txSnap.empty && defaults.transactions.length > 0) {
      const batch = writeBatch(db);
      defaults.transactions.slice(0, 100).forEach(tx => {
        batch.set(doc(db, 'transactions', tx.id), tx);
      });
      await batch.commit();
      console.log('Seeded initial transactions to Cloud Firestore');
    }

    // Check if vehicle types exist
    const vtSnap = await getDocs(collection(db, 'vehicleTypes'));
    if (vtSnap.empty && defaults.vehicleTypes.length > 0) {
      const batch = writeBatch(db);
      defaults.vehicleTypes.forEach(vt => {
        batch.set(doc(db, 'vehicleTypes', vt.id), vt);
      });
      await batch.commit();
    }

    // Check if drinks exist
    const drinkSnap = await getDocs(collection(db, 'drinks'));
    if (drinkSnap.empty && defaults.drinks.length > 0) {
      const batch = writeBatch(db);
      defaults.drinks.forEach(d => {
        batch.set(doc(db, 'drinks', d.id), d);
      });
      await batch.commit();
    }

    // Check if employees exist
    const empSnap = await getDocs(collection(db, 'employees'));
    if (empSnap.empty && defaults.employees.length > 0) {
      const batch = writeBatch(db);
      defaults.employees.forEach(emp => {
        batch.set(doc(db, 'employees', emp.id), emp);
      });
      await batch.commit();
    }

    // Check if presets exist
    const ccSnap = await getDocs(collection(db, 'carCategories'));
    if (ccSnap.empty && defaults.carCategories.length > 0) {
      const batch = writeBatch(db);
      defaults.carCategories.forEach(cc => {
        batch.set(doc(db, 'carCategories', cc.id), cc);
      });
      await batch.commit();
    }

    const mcSnap = await getDocs(collection(db, 'motorCategories'));
    if (mcSnap.empty && defaults.motorCategories.length > 0) {
      const batch = writeBatch(db);
      defaults.motorCategories.forEach(mc => {
        batch.set(doc(db, 'motorCategories', mc.id), mc);
      });
      await batch.commit();
    }

    // Settings
    await syncSaveShopProfile(defaults.shopProfile);
    await syncSaveWageUnitConfig(defaults.wageUnitConfig);
    await syncSaveSecurityConfig(defaults.securityConfig);

    return true;
  } catch (err) {
    console.warn('Initial seeding skipped or already initialized:', err);
    return false;
  }
}
