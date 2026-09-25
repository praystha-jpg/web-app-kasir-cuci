import React, { useState, useEffect } from 'react';
import { 
  Cloud, 
  CloudUpload, 
  Download, 
  Trash2, 
  RefreshCw, 
  ExternalLink, 
  FileText, 
  CheckCircle2, 
  AlertCircle,
  FolderSync,
  LogOut,
  FolderCheck,
  HardDrive
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { id as idLoc } from 'date-fns/locale';
import { 
  googleSignIn, 
  logout as authLogout, 
  initAuth, 
  getAccessToken 
} from '../lib/googleAuth';
import { 
  listDriveBackupFiles, 
  uploadFileToDrive, 
  downloadDriveFileContent, 
  deleteDriveFile, 
  type DriveFileItem 
} from '../lib/driveService';
import { type Transaction, type VehicleType, type Drink, type Employee, type WageUnitConfig, type SecurityConfig } from '../lib/utils';
import type { User } from 'firebase/auth';

interface DriveSyncManagerProps {
  transactions: Transaction[];
  vehicleTypes: VehicleType[];
  drinks: Drink[];
  employees?: Employee[];
  wageUnitConfig?: WageUnitConfig;
  securityConfig?: SecurityConfig;
  onRestoreData: (backupData: { 
    transactions?: Transaction[]; 
    vehicleTypes?: VehicleType[]; 
    drinks?: Drink[];
    employees?: Employee[];
    wageUnitConfig?: WageUnitConfig;
    securityConfig?: SecurityConfig;
  }) => void;
}

export const DriveSyncManager: React.FC<DriveSyncManagerProps> = ({
  transactions,
  vehicleTypes,
  drinks,
  employees = [],
  wageUnitConfig,
  securityConfig,
  onRestoreData,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [driveFiles, setDriveFiles] = useState<DriveFileItem[]>([]);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [confirmDeleteModal, setConfirmDeleteModal] = useState<{ fileId: string; fileName: string } | null>(null);
  const [confirmRestoreModal, setConfirmRestoreModal] = useState<{ fileId: string; fileName: string } | null>(null);

  // Monitor auth status
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, accessToken) => {
        setUser(currentUser);
        setToken(accessToken);
      },
      () => {
        setUser(null);
        setToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  // Fetch files when token is available
  const fetchFiles = async () => {
    if (!token) return;
    setIsLoadingFiles(true);
    setStatusMessage(null);
    try {
      const files = await listDriveBackupFiles();
      setDriveFiles(files);
    } catch (err: any) {
      console.error('Error fetching drive files:', err);
      setStatusMessage({ type: 'error', text: err.message || 'Gagal memuat file dari Google Drive.' });
    } finally {
      setIsLoadingFiles(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchFiles();
    }
  }, [token]);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    setStatusMessage(null);
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setToken(res.accessToken);
        setStatusMessage({ type: 'success', text: `Berhasil terhubung dengan Google Drive (${res.user.email})!` });
      }
    } catch (err: any) {
      console.error('Login failed:', err);
      setStatusMessage({ type: 'error', text: 'Gagal menghubungkan akun Google. ' + (err.message || '') });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await authLogout();
    setUser(null);
    setToken(null);
    setDriveFiles([]);
    setStatusMessage({ type: 'info', text: 'Akun Google telah diputus.' });
  };

  // Upload full system backup JSON to Drive
  const handleBackupFullData = async () => {
    if (!token) return;
    setIsUploading(true);
    setStatusMessage(null);
    try {
      const backupPayload = {
        app: "D'CarWash POS",
        version: "1.0",
        exportedAt: new Date().toISOString(),
        data: {
          transactions,
          vehicleTypes,
          drinks,
          employees,
          wageUnitConfig,
          securityConfig,
        },
        stats: {
          totalTransactions: transactions.length,
          totalRevenue: transactions.reduce((sum, t) => sum + (t.price || 0), 0),
        }
      };

      const dateStr = format(new Date(), 'yyyy-MM-dd_HHmm');
      const fileName = `DCarWash_Backup_${dateStr}.json`;
      const fileContent = JSON.stringify(backupPayload, null, 2);

      await uploadFileToDrive(fileName, fileContent, 'application/json');
      setStatusMessage({ 
        type: 'success', 
        text: `Sukses mencadangkan ${transactions.length} transaksi ke Google Drive! (${fileName})` 
      });
      await fetchFiles();
    } catch (err: any) {
      console.error('Backup failed:', err);
      setStatusMessage({ type: 'error', text: err.message || 'Gagal mengunggah cadangan ke Google Drive.' });
    } finally {
      setIsUploading(false);
    }
  };

  // Upload CSV Report to Drive
  const handleBackupCSVToDrive = async () => {
    if (!token) return;
    setIsUploading(true);
    setStatusMessage(null);
    try {
      const headers = ['ID', 'No. Order', 'Waktu', 'No. Plat', 'Jenis Kendaraan', 'Ukuran', 'Model', 'Metode Bayar', 'Jumlah Bayar', 'Kembalian', 'Total (Rp)'];
      const rows = transactions.map(t => [
        t.id,
        t.orderNumber || '-',
        format(parseISO(t.timestamp), 'yyyy-MM-dd HH:mm'),
        `"${t.plateNumber || '-'}"`,
        `"${t.vehicleTypeName || '-'}"`,
        t.size || '-',
        `"${t.carCategory || '-'}"`,
        t.paymentMethod || 'cash',
        t.amountPaid || 0,
        t.changeAmount || 0,
        t.price
      ]);

      const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      const dateStr = format(new Date(), 'yyyy-MM-dd_HHmm');
      const fileName = `Laporan_Transaksi_DCarWash_${dateStr}.csv`;

      await uploadFileToDrive(fileName, csvContent, 'text/csv');
      setStatusMessage({ 
        type: 'success', 
        text: `Laporan CSV berhasil diunggah ke Google Drive! (${fileName})` 
      });
      await fetchFiles();
    } catch (err: any) {
      console.error('CSV backup failed:', err);
      setStatusMessage({ type: 'error', text: err.message || 'Gagal mengunggah CSV ke Google Drive.' });
    } finally {
      setIsUploading(false);
    }
  };

  // Confirm delete destructive action
  const handleExecuteDelete = async () => {
    if (!confirmDeleteModal) return;
    try {
      await deleteDriveFile(confirmDeleteModal.fileId);
      setStatusMessage({ type: 'success', text: `File "${confirmDeleteModal.fileName}" berhasil dihapus dari Google Drive.` });
      setConfirmDeleteModal(null);
      await fetchFiles();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Gagal menghapus file dari Drive.' });
    }
  };

  // Confirm restore data
  const handleExecuteRestore = async () => {
    if (!confirmRestoreModal) return;
    try {
      const contentStr = await downloadDriveFileContent(confirmRestoreModal.fileId);
      const parsed = JSON.parse(contentStr);
      if (!parsed.data || !Array.isArray(parsed.data.transactions)) {
        throw new Error('Format file cadangan tidak valid.');
      }

      onRestoreData(parsed.data);
      setStatusMessage({ 
        type: 'success', 
        text: `Data berhasil dipulihkan dari "${confirmRestoreModal.fileName}"! (${parsed.data.transactions.length} transaksi dimuat)` 
      });
      setConfirmRestoreModal(null);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: 'Gagal memulihkan file: ' + (err.message || 'Format data salah') });
    }
  };

  return (
    <div className="glass-card p-6 rounded-3xl relative overflow-hidden space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/60 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-sm">
            <Cloud size={24} />
          </div>
          <div>
            <h3 className="font-display font-bold text-lg text-slate-900 leading-tight">
              Google Drive Cloud Backup
            </h3>
            <p className="text-xs text-slate-500">
              Sinkronisasi data transaksi, backup otomatis, dan ekspor laporan ke folder Google Drive Anda.
            </p>
          </div>
        </div>

        {/* Auth status & actions */}
        <div>
          {!token ? (
            <button
              onClick={handleLogin}
              disabled={isLoggingIn}
              className="px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-2xl font-bold text-xs shadow-sm flex items-center gap-2.5 transition-all active:scale-95"
            >
              <svg className="w-4 h-4" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
              </svg>
              <span>{isLoggingIn ? 'Menghubungkan...' : 'Hubungkan Google Drive'}</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 px-3 py-1.5 rounded-xl text-xs font-semibold border border-emerald-200">
                <CheckCircle2 size={14} className="text-emerald-600" />
                <span className="truncate max-w-[160px]">{user?.email}</span>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                title="Putus Akun Google"
              >
                <LogOut size={16} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Alert message */}
      {statusMessage && (
        <div className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2 ${
          statusMessage.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
            : statusMessage.type === 'error'
            ? 'bg-red-50 text-red-800 border border-red-200'
            : 'bg-blue-50 text-blue-800 border border-blue-200'
        }`}>
          {statusMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Main Drive Controls (Shown only if logged in) */}
      {token ? (
        <div className="space-y-6">
          {/* Action Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
                <HardDrive size={18} className="text-blue-600" />
                <span>Cadangkan Semua Transaksi</span>
              </div>
              <p className="text-xs text-slate-500">
                Simpan seluruh histori transaksi ({transactions.length} transaksi) dan konfigurasi harga ke file JSON di Google Drive.
              </p>
              <button
                onClick={handleBackupFullData}
                disabled={isUploading}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95 disabled:opacity-50"
              >
                <CloudUpload size={16} />
                <span>{isUploading ? 'Mengunggah...' : 'Cadangkan Sekarang ke Drive'}</span>
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
                <FileText size={18} className="text-emerald-600" />
                <span>Ekspor Laporan CSV ke Drive</span>
              </div>
              <p className="text-xs text-slate-500">
                Unggah lembar laporan transaksi (bisa dibuka langsung di Google Sheets/Excel) ke folder DCarWash Drive.
              </p>
              <button
                onClick={handleBackupCSVToDrive}
                disabled={isUploading}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95 disabled:opacity-50"
              >
                <CloudUpload size={16} />
                <span>{isUploading ? 'Menyimpan...' : 'Simpan Laporan CSV ke Drive'}</span>
              </button>
            </div>
          </div>

          {/* Drive Files List in DCarWash Folder */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderCheck size={18} className="text-slate-700" />
                <h4 className="font-display font-bold text-sm text-slate-800">
                  File Tersimpan di Google Drive (Folder DCarWash_Data_Backup)
                </h4>
              </div>
              <button
                onClick={fetchFiles}
                disabled={isLoadingFiles}
                className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 p-1 rounded hover:bg-blue-50 transition-colors"
                title="Segarkan daftar file"
              >
                <RefreshCw size={14} className={isLoadingFiles ? 'animate-spin' : ''} />
                <span>Segarkan</span>
              </button>
            </div>

            {isLoadingFiles ? (
              <div className="p-8 text-center bg-white rounded-2xl border border-slate-100">
                <RefreshCw size={24} className="animate-spin text-blue-600 mx-auto mb-2" />
                <p className="text-xs text-slate-500 font-semibold">Memuat file dari Google Drive...</p>
              </div>
            ) : driveFiles.length === 0 ? (
              <div className="p-8 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                <FolderSync size={32} className="text-slate-400 mx-auto mb-2 opacity-60" />
                <p className="text-xs font-semibold text-slate-600">Belum ada file cadangan di Google Drive</p>
                <p className="text-[11px] text-slate-400">Klik tombol "Cadangkan Sekarang" untuk membuat file cadangan pertama Anda.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {driveFiles.map((file) => {
                  const isJson = file.name.endsWith('.json');
                  return (
                    <div 
                      key={file.id}
                      className="p-3.5 bg-white border border-slate-200/80 rounded-2xl flex items-center justify-between gap-3 hover:border-slate-300 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          isJson ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'
                        }`}>
                          <FileText size={18} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-xs text-slate-800 truncate">{file.name}</p>
                          <p className="text-[10px] text-slate-400">
                            {file.modifiedTime 
                              ? format(parseISO(file.modifiedTime), 'dd MMM yyyy, HH:mm', { locale: idLoc }) 
                              : '-'}
                            {file.size ? ` • ${(parseInt(file.size, 10) / 1024).toFixed(1)} KB` : ''}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Open in Google Drive / Google Sheets link */}
                        {file.webViewLink && (
                          <a
                            href={file.webViewLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-50 rounded-xl transition-colors"
                            title="Buka di Google Drive"
                          >
                            <ExternalLink size={16} />
                          </a>
                        )}

                        {/* Restore button if JSON */}
                        {isJson && (
                          <button
                            onClick={() => setConfirmRestoreModal({ fileId: file.id, fileName: file.name })}
                            className="px-2.5 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors flex items-center gap-1"
                            title="Pulihkan data dari cadangan ini"
                          >
                            <Download size={14} />
                            <span className="hidden sm:inline">Pulihkan</span>
                          </button>
                        )}

                        {/* Delete button (Destructive - requires confirmation) */}
                        <button
                          onClick={() => setConfirmDeleteModal({ fileId: file.id, fileName: file.name })}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                          title="Hapus file dari Drive"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-5 text-center space-y-3">
          <HardDrive size={32} className="text-slate-400 mx-auto opacity-70" />
          <div className="max-w-md mx-auto space-y-1">
            <p className="text-xs font-bold text-slate-700">Hubungkan Akun Google untuk Fitur Cloud Backup</p>
            <p className="text-[11px] text-slate-500">
              Dengan menghubungkan Google Drive, Anda dapat menyimpan backup berkala transaksi cuci kendaraan, mencadangkan data secara aman, serta memulihkan data kapan pun dibutuhkan.
            </p>
          </div>
          <button
            onClick={handleLogin}
            disabled={isLoggingIn}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-200"
          >
            {isLoggingIn ? 'Memproses...' : 'Masuk dengan Google'}
          </button>
        </div>
      )}

      {/* Mandatory User Confirmation Dialog for Deleting File from Google Drive */}
      {confirmDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 size={24} />
            </div>
            <div className="text-center space-y-1">
              <h4 className="font-display font-bold text-slate-900 text-base">Hapus File dari Google Drive?</h4>
              <p className="text-xs text-slate-500">
                Anda akan menghapus file <strong className="text-slate-800">{confirmDeleteModal.fileName}</strong> secara permanen dari akun Google Drive Anda. Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setConfirmDeleteModal(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 font-bold text-xs text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleExecuteDelete}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 font-bold text-xs text-white shadow-md transition-colors"
              >
                Konfirmasi Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Confirmation Dialog for Restoring Data */}
      {confirmRestoreModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
              <Download size={24} />
            </div>
            <div className="text-center space-y-1">
              <h4 className="font-display font-bold text-slate-900 text-base">Pulihkan Data dari Cadangan?</h4>
              <p className="text-xs text-slate-500">
                Memuat data dari <strong className="text-slate-800">{confirmRestoreModal.fileName}</strong> akan menimpa/memperbarui riwayat transaksi saat ini dengan data dari cadangan tersebut.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setConfirmRestoreModal(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 font-bold text-xs text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleExecuteRestore}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 font-bold text-xs text-white shadow-md transition-colors"
              >
                Konfirmasi Pulihkan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
