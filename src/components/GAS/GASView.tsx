import React, { useState, useRef } from 'react';
import { 
  Database, 
  Cloud, 
  CloudUpload, 
  CloudDownload, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Check, 
  ExternalLink, 
  Code2, 
  FileSpreadsheet, 
  Globe, 
  ShieldCheck, 
  Download, 
  Upload, 
  Sparkles,
  Layers,
  ArrowRight,
  BookOpen,
  BookMarked,
  FileText,
  Table,
  CheckCheck,
  FolderDown,
  FolderUp,
  FileDown
} from 'lucide-react';
import { 
  Book, 
  DigitalBook, 
  Member, 
  CirculationRecord, 
  ReadingJournalEntry, 
  GASConfig, 
  LibrarySettings 
} from '../../types/library';
import { gasService, GAS_BACKEND_CODE } from '../../services/gasService';
import { 
  exportBooksToCSV, 
  exportDigitalBooksToCSV, 
  exportAllCatalogToCSV, 
  downloadCSVFile,
  parseBooksCSV,
  parseDigitalBooksCSV
} from '../../utils/csvHelper';
import { sounds } from '../../utils/audio';
import confetti from 'canvas-confetti';

interface GASViewProps {
  gasConfig: GASConfig;
  onUpdateGASConfig: (config: GASConfig) => void;
  books: Book[];
  digitalBooks: DigitalBook[];
  members: Member[];
  circulation: CirculationRecord[];
  journals: ReadingJournalEntry[];
  settings: LibrarySettings;
  onReplaceAllData: (data: { 
    books?: Book[]; 
    digitalBooks?: DigitalBook[]; 
    members?: Member[]; 
    circulation?: CirculationRecord[]; 
    journals?: ReadingJournalEntry[] 
  }) => void;
  onAddBooksBatch?: (newBooks: Book[], mode?: 'merge' | 'replace') => void;
  onAddDigitalBooksBatch?: (newDigitalBooks: DigitalBook[], mode?: 'merge' | 'replace') => void;
}

export const GASView: React.FC<GASViewProps> = ({
  gasConfig,
  onUpdateGASConfig,
  books,
  digitalBooks,
  members,
  circulation,
  journals,
  settings,
  onReplaceAllData,
  onAddBooksBatch,
  onAddDigitalBooksBatch,
}) => {
  const [activeTab, setActiveTab] = useState<'status' | 'export_import' | 'code' | 'blogger'>('status');
  const [webAppUrl, setWebAppUrl] = useState(gasConfig.webAppUrl || '');
  const [autoSync, setAutoSync] = useState(gasConfig.autoSync || false);
  
  // States for actions
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; timestamp?: string } | null>(null);
  
  const [isPushing, setIsPushing] = useState(false);
  const [pushResult, setPushResult] = useState<{ success: boolean; message: string; summary?: any } | null>(null);
  
  const [isPulling, setIsPulling] = useState(false);
  const [pullResult, setPullResult] = useState<{ success: boolean; message: string } | null>(null);

  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedBlogger, setCopiedBlogger] = useState(false);

  // Import State
  const [importTarget, setImportTarget] = useState<'printed' | 'digital'>('printed');
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [importFileName, setImportFileName] = useState('');
  const [parsedImportCount, setParsedImportCount] = useState<number | null>(null);
  const [parsedBooksData, setParsedBooksData] = useState<Book[] | null>(null);
  const [parsedDigitalData, setParsedDigitalData] = useState<DigitalBook[] | null>(null);
  const [importMessage, setImportMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const jsonRestoreInputRef = useRef<HTMLInputElement>(null);

  // Blogger URL source
  const currentAppUrl = typeof window !== 'undefined' ? window.location.href.split('?')[0].split('#')[0] : '';
  const [bloggerAppUrl, setBloggerAppUrl] = useState(currentAppUrl);

  const handleSaveConfig = () => {
    onUpdateGASConfig({
      ...gasConfig,
      webAppUrl: webAppUrl.trim(),
      autoSync: autoSync,
    });
    sounds.playSuccessChime();
  };

  const handleTestConnection = async () => {
    if (!webAppUrl.trim()) {
      setTestResult({
        success: false,
        message: 'Silakan masukkan URL Web App Google Apps Script terlebih dahulu.',
      });
      sounds.playErrorBeep();
      return;
    }

    setIsTesting(true);
    setTestResult(null);
    sounds.playScanBeep();

    const res = await gasService.testConnection(webAppUrl.trim());
    setIsTesting(false);
    setTestResult(res);

    if (res.success) {
      sounds.playSuccessChime();
      onUpdateGASConfig({
        ...gasConfig,
        webAppUrl: webAppUrl.trim(),
        lastSyncStatus: 'success',
        lastSyncTime: res.timestamp || new Date().toISOString(),
        lastSyncMessage: res.message,
      });
    } else {
      sounds.playErrorBeep();
      onUpdateGASConfig({
        ...gasConfig,
        webAppUrl: webAppUrl.trim(),
        lastSyncStatus: 'error',
        lastSyncMessage: res.message,
      });
    }
  };

  const handlePushAll = async () => {
    if (!webAppUrl.trim()) {
      setPushResult({
        success: false,
        message: 'Harap konfigurasi dan simpan URL Web App Google Apps Script terlebih dahulu.',
      });
      sounds.playErrorBeep();
      return;
    }

    setIsPushing(true);
    setPushResult(null);
    sounds.playScanBeep();

    const res = await gasService.syncAllToGAS(webAppUrl.trim(), {
      books,
      digitalBooks,
      members,
      circulation,
      journals,
    });

    setIsPushing(false);
    setPushResult(res);

    if (res.success) {
      sounds.playSuccessChime();
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.6 }
      });
      onUpdateGASConfig({
        ...gasConfig,
        lastSyncStatus: 'success',
        lastSyncTime: new Date().toISOString(),
        lastSyncMessage: res.message,
      });
    } else {
      sounds.playErrorBeep();
      onUpdateGASConfig({
        ...gasConfig,
        lastSyncStatus: 'error',
        lastSyncMessage: res.message,
      });
    }
  };

  const handlePullAll = async () => {
    if (!webAppUrl.trim()) {
      setPullResult({
        success: false,
        message: 'Harap konfigurasi dan simpan URL Web App Google Apps Script terlebih dahulu.',
      });
      sounds.playErrorBeep();
      return;
    }

    const confirmPull = window.confirm('Tarik data dari Google Spreadsheet akan menyinkronkan data lokal (Buku Cetak, Buku Digital, Anggota, Sirkulasi, dan Jurnal). Lanjutkan?');
    if (!confirmPull) return;

    setIsPulling(true);
    setPullResult(null);
    sounds.playScanBeep();

    const res = await gasService.fetchAllFromGAS(webAppUrl.trim());
    setIsPulling(false);

    if (res.success && res.data) {
      sounds.playSuccessChime();
      onReplaceAllData(res.data);
      const bCount = res.data.books?.length || 0;
      const digCount = res.data.digitalBooks?.length || 0;
      const mCount = res.data.members?.length || 0;
      const cCount = res.data.circulation?.length || 0;
      
      setPullResult({
        success: true,
        message: `Berhasil menarik ${bCount} buku cetak, ${digCount} e-book digital, ${mCount} anggota, dan ${cCount} sirkulasi dari Google Spreadsheet!`,
      });
      onUpdateGASConfig({
        ...gasConfig,
        lastSyncStatus: 'success',
        lastSyncTime: new Date().toISOString(),
        lastSyncMessage: 'Data lengkap ditarik dari Spreadsheet',
      });
    } else {
      sounds.playErrorBeep();
      setPullResult({
        success: false,
        message: res.message,
      });
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(GAS_BACKEND_CODE);
    setCopiedCode(true);
    sounds.playSuccessChime();
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const bloggerCode = gasService.generateBloggerEmbedCode(bloggerAppUrl, settings.schoolName);

  const handleCopyBloggerCode = () => {
    navigator.clipboard.writeText(bloggerCode);
    setCopiedBlogger(true);
    sounds.playSuccessChime();
    setTimeout(() => setCopiedBlogger(false), 2500);
  };

  // Export CSV Handlers
  const handleExportPrintedCSV = () => {
    const csv = exportBooksToCSV(books);
    const dateStr = new Date().toISOString().split('T')[0];
    downloadCSVFile(csv, `koleksi_buku_cetak_smpn5_${dateStr}.csv`);
    sounds.playSuccessChime();
  };

  const handleExportDigitalCSV = () => {
    const csv = exportDigitalBooksToCSV(digitalBooks);
    const dateStr = new Date().toISOString().split('T')[0];
    downloadCSVFile(csv, `koleksi_buku_digital_smpn5_${dateStr}.csv`);
    sounds.playSuccessChime();
  };

  const handleExportAllCatalogCSV = () => {
    const csv = exportAllCatalogToCSV(books, digitalBooks);
    const dateStr = new Date().toISOString().split('T')[0];
    downloadCSVFile(csv, `katalog_lengkap_perpus_smpn5_${dateStr}.csv`);
    sounds.playSuccessChime();
  };

  const handleDownloadSamplePrintedCSV = () => {
    const sampleBooks: Book[] = [
      {
        id: 'sample-1',
        barcode: 'SMP5-BK-101',
        isbn: '978-602-01-0001-1',
        title: 'Matematika SMP/MTs Kelas VIII Kurikulum Merdeka',
        author: 'Tim Penulis Kemendikbudristek',
        publisher: 'Pusat Kurikulum dan Perbukuan',
        year: 2024,
        category: 'Mata Pelajaran',
        rackLocation: 'Rak B-02',
        totalCopies: 25,
        availableCopies: 25,
        pages: 240,
        language: 'Bahasa Indonesia',
        description: 'Buku teks utama mata pelajaran matematika siswa kelas VIII SMP.',
        addedDate: new Date().toISOString().split('T')[0]
      },
      {
        id: 'sample-2',
        barcode: 'SMP5-BK-102',
        isbn: '978-602-01-0002-8',
        title: 'Mutiara Bahari Bulukumba: Cerita Rakyat Butta Panrita Lopi',
        author: 'Dra. Hj. Nurhidayah',
        publisher: 'Dinas Kebudayaan Bulukumba',
        year: 2023,
        category: 'Karya Umum',
        rackLocation: 'Rak C-01',
        totalCopies: 5,
        availableCopies: 5,
        pages: 120,
        language: 'Bahasa Indonesia',
        description: 'Kumpulan cerita rakyat, legenda perahu Pinisi, dan kearifan Ammatoa.',
        addedDate: new Date().toISOString().split('T')[0]
      }
    ];
    const csv = exportBooksToCSV(sampleBooks);
    downloadCSVFile(csv, 'template_impor_buku_cetak.csv');
  };

  const handleDownloadSampleDigitalCSV = () => {
    const sampleDigital: DigitalBook[] = [
      {
        id: 'sample-dig-1',
        title: 'Modul Proyek P5: Gaya Hidup Berkelanjutan di Pesisir Bira',
        author: 'Tim Fasilitator P5 SMPN 5 Bulukumba',
        category: 'Karya Umum',
        curriculum: 'Kurikulum Merdeka',
        totalPages: 48,
        fileSize: '3.2 MB (PDF & E-Pub)',
        rating: 5.0,
        readCount: 0,
        description: 'Panduan proyek penguatan profil pelajar Pancasila berbasis lingkungan laut dan terumbu karang Bulukumba.',
        content: {
          chapters: [
            { id: 1, title: 'Bab 1: Pengantar Proyek', text: 'Tujuan dan alur proyek profil pelajar Pancasila.' }
          ]
        }
      }
    ];
    const csv = exportDigitalBooksToCSV(sampleDigital);
    downloadCSVFile(csv, 'template_impor_buku_digital.csv');
  };

  // File Upload & Parsing Handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFileName(file.name);
    setImportMessage(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      if (!content) return;

      try {
        if (file.name.endsWith('.json')) {
          const json = JSON.parse(content);
          if (importTarget === 'printed') {
            const list = Array.isArray(json) ? json : json.books || [];
            if (list.length > 0) {
              setParsedBooksData(list);
              setParsedImportCount(list.length);
              setImportMessage({ type: 'success', text: `Berhasil memuat ${list.length} buku cetak dari file JSON.` });
            } else {
              setImportMessage({ type: 'error', text: 'Tidak ditemukan data buku dalam format JSON tersebut.' });
            }
          } else {
            const list = Array.isArray(json) ? json : json.digitalBooks || [];
            if (list.length > 0) {
              setParsedDigitalData(list);
              setParsedImportCount(list.length);
              setImportMessage({ type: 'success', text: `Berhasil memuat ${list.length} e-book digital dari file JSON.` });
            } else {
              setImportMessage({ type: 'error', text: 'Tidak ditemukan data e-book digital dalam format JSON tersebut.' });
            }
          }
        } else {
          // Parse CSV
          if (importTarget === 'printed') {
            const parsed = parseBooksCSV(content);
            if (parsed.length > 0) {
              setParsedBooksData(parsed);
              setParsedImportCount(parsed.length);
              setImportMessage({ type: 'success', text: `Berhasil membaca ${parsed.length} baris judul buku cetak dari file CSV.` });
            } else {
              setImportMessage({ type: 'error', text: 'Format CSV tidak sesuai atau tidak ada baris data buku yang valid.' });
            }
          } else {
            const parsed = parseDigitalBooksCSV(content);
            if (parsed.length > 0) {
              setParsedDigitalData(parsed);
              setParsedImportCount(parsed.length);
              setImportMessage({ type: 'success', text: `Berhasil membaca ${parsed.length} baris judul buku digital dari file CSV.` });
            } else {
              setImportMessage({ type: 'error', text: 'Format CSV tidak sesuai atau tidak ada baris e-book digital yang valid.' });
            }
          }
        }
      } catch (err) {
        setImportMessage({ type: 'error', text: 'Gagal memproses file. Pastikan format teks CSV atau JSON valid.' });
      }
    };

    reader.readAsText(file);
  };

  // Execute Import
  const handleExecuteImport = () => {
    if (importTarget === 'printed' && parsedBooksData && parsedBooksData.length > 0) {
      if (onAddBooksBatch) {
        onAddBooksBatch(parsedBooksData, importMode);
      } else {
        onReplaceAllData({ books: importMode === 'replace' ? parsedBooksData : [...books, ...parsedBooksData] });
      }
      sounds.playSuccessChime();
      confetti({ particleCount: 50, spread: 60 });
      setImportMessage({
        type: 'success',
        text: `Sukses! ${parsedBooksData.length} buku cetak berhasil di-${importMode === 'replace' ? 'gantikan ke' : 'tambahkan ke'} perpustakaan!`
      });
      setParsedBooksData(null);
      setParsedImportCount(null);
      setImportFileName('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } else if (importTarget === 'digital' && parsedDigitalData && parsedDigitalData.length > 0) {
      if (onAddDigitalBooksBatch) {
        onAddDigitalBooksBatch(parsedDigitalData, importMode);
      } else {
        onReplaceAllData({ digitalBooks: importMode === 'replace' ? parsedDigitalData : [...digitalBooks, ...parsedDigitalData] });
      }
      sounds.playSuccessChime();
      confetti({ particleCount: 50, spread: 60 });
      setImportMessage({
        type: 'success',
        text: `Sukses! ${parsedDigitalData.length} e-book digital berhasil di-${importMode === 'replace' ? 'gantikan ke' : 'tambahkan ke'} koleksi digital perpustakaan!`
      });
      setParsedDigitalData(null);
      setParsedImportCount(null);
      setImportFileName('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Full System JSON Backup & Restore
  const handleDownloadJSONBackup = () => {
    const backupData = {
      appName: 'MABBARAKKA SMPN 5 Bulukumba',
      backupDate: new Date().toISOString(),
      settings,
      books,
      digitalBooks,
      members,
      circulation,
      journals,
      gasConfig,
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_perpus_mabbarakka_smpn5_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    sounds.playSuccessChime();
  };

  const handleRestoreJSONBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const json = JSON.parse(evt.target?.result as string);
        if (json && (json.books || json.digitalBooks || json.members)) {
          const confirmRestore = window.confirm(
            `Pulihkan cadangan tanggal ${json.backupDate || 'sebelumnya'}? Seluruh koleksi buku cetak, e-book, anggota, dan sirkulasi akan diperbarui.`
          );
          if (confirmRestore) {
            onReplaceAllData({
              books: json.books,
              digitalBooks: json.digitalBooks,
              members: json.members,
              circulation: json.circulation,
              journals: json.journals,
            });
            sounds.playSuccessChime();
            confetti({ particleCount: 70, spread: 70 });
            alert('Pemulihan cadangan sistem berhasil dilakukan!');
          }
        } else {
          alert('Format file JSON tidak valid sebagai cadangan MABBARAKKA.');
        }
      } catch (err) {
        alert('File JSON rusak atau tidak dapat dibaca.');
      }
    };
    reader.readAsText(file);
    if (jsonRestoreInputRef.current) jsonRestoreInputRef.current.value = '';
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800">
              Integrasi Cloud GAS & Ekspor Impor
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-300">
              Google Apps Script + Spreadsheet
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Basis data cloud Google Spreadsheet dan pusat ekspor-impor koleksi buku cetak dan e-book digital SMPN 5 Bulukumba
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleDownloadJSONBackup}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
            title="Cadangkan seluruh data lokal ke file JSON"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Cadangan JSON</span>
          </button>

          <label className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors cursor-pointer">
            <Upload className="w-3.5 h-3.5 text-slate-500" />
            <span>Pulihkan JSON</span>
            <input
              ref={jsonRestoreInputRef}
              type="file"
              accept=".json"
              onChange={handleRestoreJSONBackup}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex bg-slate-100 p-1 rounded-2xl w-fit text-xs font-semibold overflow-x-auto gap-1">
        <button
          onClick={() => setActiveTab('status')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all shrink-0 ${
            activeTab === 'status' ? 'bg-white text-emerald-800 shadow-sm font-bold' : 'text-slate-600'
          }`}
        >
          <Database className="w-4 h-4 text-emerald-600" />
          <span>Koneksi & Sinkronisasi GAS</span>
        </button>

        <button
          onClick={() => setActiveTab('export_import')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all shrink-0 ${
            activeTab === 'export_import' ? 'bg-white text-teal-800 shadow-sm font-bold' : 'text-slate-600'
          }`}
        >
          <Table className="w-4 h-4 text-teal-600" />
          <span>Ekspor & Impor Koleksi (Cetak & Digital)</span>
        </button>

        <button
          onClick={() => setActiveTab('code')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all shrink-0 ${
            activeTab === 'code' ? 'bg-white text-indigo-900 shadow-sm font-bold' : 'text-slate-600'
          }`}
        >
          <Code2 className="w-4 h-4 text-indigo-600" />
          <span>Kode Back End GAS (Code.gs)</span>
        </button>

        <button
          onClick={() => setActiveTab('blogger')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all shrink-0 ${
            activeTab === 'blogger' ? 'bg-white text-orange-900 shadow-sm font-bold' : 'text-slate-600'
          }`}
        >
          <Globe className="w-4 h-4 text-orange-600" />
          <span>Deploy ke Blogger (Blogspot)</span>
        </button>
      </div>

      {/* TAB 1: KONEKSI & SINKRONISASI GAS */}
      {activeTab === 'status' && (
        <div className="space-y-6">
          
          {/* URL Configuration Card */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-800">
                    Endpoint Back End Google Apps Script (Web App)
                  </h3>
                  <p className="text-xs text-slate-500">
                    URL Web App yang diperoleh setelah menerapkan (deploy) skrip di Google Spreadsheet akun <code>@guru.smp.belajar.id</code>
                  </p>
                </div>
              </div>

              {gasConfig.lastSyncStatus === 'success' && (
                <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Koneksi Siap</span>
                </span>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  URL Web App Google Apps Script (GAS) *
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="url"
                    placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
                    value={webAppUrl}
                    onChange={(e) => setWebAppUrl(e.target.value)}
                    className="flex-1 px-4 py-2.5 text-xs font-mono rounded-xl border border-slate-300 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-slate-800"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveConfig}
                      className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
                    >
                      Simpan URL
                    </button>
                    <button
                      onClick={handleTestConnection}
                      disabled={isTesting}
                      className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                      <span>{isTesting ? 'Menguji...' : 'Uji Koneksi (Ping)'}</span>
                    </button>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Belum punya URL? Buka tab <strong>&ldquo;Kode Back End GAS (Code.gs)&rdquo;</strong> untuk membuat back end dalam 3 menit.
                </p>
              </div>

              {/* Auto-Sync Toggle */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 text-xs">
                <div>
                  <span className="font-bold text-slate-800 block">
                    Sinkronisasi Otomatis Real-Time (Auto-Sync)
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    Kirim data transaksi peminjaman, penambahan buku, e-book digital, dan jurnal secara otomatis ke Google Spreadsheet saat tersimpan.
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input 
                    type="checkbox" 
                    checked={autoSync} 
                    onChange={(e) => {
                      setAutoSync(e.target.checked);
                      onUpdateGASConfig({
                        ...gasConfig,
                        autoSync: e.target.checked,
                      });
                    }}
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {/* Ping Test Result Alert */}
              {testResult && (
                <div className={`p-4 rounded-2xl border text-xs flex items-start gap-2.5 ${
                  testResult.success
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border-rose-200'
                }`}>
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className="font-bold">{testResult.message}</p>
                    {testResult.timestamp && (
                      <p className="text-[11px] opacity-80 mt-0.5">Waktu respon server: {testResult.timestamp}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sync Operations Card (Push & Pull) */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
            <div>
              <h3 className="font-extrabold text-base text-slate-800">
                Pusat Sinkronisasi Data Aplikasi & Google Spreadsheet
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Kelola aliran data antara memori lokal aplikasi dengan 5 sheet Google Spreadsheet MABBARAKKA SMPN 5 Bulukumba
              </p>
            </div>

            {/* Current Local Data Snapshot - 5 Cards including Digital Books */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100">
                <span className="text-[11px] font-bold text-emerald-700 block">Buku Cetak</span>
                <span className="text-xl font-extrabold text-emerald-900 mt-0.5 block">{books.length}</span>
                <span className="text-[10px] text-slate-500">Judul Fisik</span>
              </div>
              <div className="p-3 bg-teal-50 rounded-2xl border border-teal-100">
                <span className="text-[11px] font-bold text-teal-700 block">E-Book Digital</span>
                <span className="text-xl font-extrabold text-teal-900 mt-0.5 block">{digitalBooks.length}</span>
                <span className="text-[10px] text-slate-500">E-Book & Modul</span>
              </div>
              <div className="p-3 bg-purple-50 rounded-2xl border border-purple-100">
                <span className="text-[11px] font-bold text-purple-700 block">Data Anggota</span>
                <span className="text-xl font-extrabold text-purple-900 mt-0.5 block">{members.length}</span>
                <span className="text-[10px] text-slate-500">Siswa & Guru</span>
              </div>
              <div className="p-3 bg-blue-50 rounded-2xl border border-blue-100">
                <span className="text-[11px] font-bold text-blue-700 block">Sirkulasi</span>
                <span className="text-xl font-extrabold text-blue-900 mt-0.5 block">{circulation.length}</span>
                <span className="text-[10px] text-slate-500">Riwayat Peminjaman</span>
              </div>
              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-100 col-span-2 sm:col-span-1">
                <span className="text-[11px] font-bold text-amber-700 block">Jurnal Membaca</span>
                <span className="text-xl font-extrabold text-amber-900 mt-0.5 block">{journals.length}</span>
                <span className="text-[10px] text-slate-500">Ulasan & Refleksi</span>
              </div>
            </div>

            {/* Push and Pull Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              
              {/* Push Action */}
              <div className="p-4 rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50/50 to-teal-50/50 space-y-3">
                <div className="flex items-center gap-2">
                  <CloudUpload className="w-5 h-5 text-emerald-600" />
                  <h4 className="font-bold text-sm text-slate-800">
                    Kirim Semua Data ke Spreadsheet (Push)
                  </h4>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Menyimpan seluruh katalog buku cetak, buku digital (e-book), data siswa, sirkulasi, dan jurnal membaca ke baris-baris Google Spreadsheet Anda.
                </p>
                <button
                  onClick={handlePushAll}
                  disabled={isPushing}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50"
                >
                  <CloudUpload className={`w-4 h-4 ${isPushing ? 'animate-bounce' : ''}`} />
                  <span>{isPushing ? 'Menyimpan ke Spreadsheet...' : 'Kirim Semua Data Sekarang (Push)'}</span>
                </button>
              </div>

              {/* Pull Action */}
              <div className="p-4 rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 space-y-3">
                <div className="flex items-center gap-2">
                  <CloudDownload className="w-5 h-5 text-blue-600" />
                  <h4 className="font-bold text-sm text-slate-800">
                    Tarik Data dari Spreadsheet (Pull)
                  </h4>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Mengambil pembaruan data terbaru (buku cetak, e-book baru yang dimasukkan tim guru, anggota, dan riwayat) dari Google Spreadsheet.
                </p>
                <button
                  onClick={handlePullAll}
                  disabled={isPulling}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50"
                >
                  <CloudDownload className={`w-4 h-4 ${isPulling ? 'animate-spin' : ''}`} />
                  <span>{isPulling ? 'Menarik Data...' : 'Tarik Data dari Spreadsheet (Pull)'}</span>
                </button>
              </div>

            </div>

            {/* Notification Results */}
            {pushResult && (
              <div className={`p-4 rounded-2xl border text-xs flex items-start gap-2.5 ${
                pushResult.success ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
              }`}>
                {pushResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="font-bold">{pushResult.message}</p>
                  {pushResult.summary && (
                    <p className="text-[11px] opacity-80 mt-1">
                      Rekap tersimpan: {pushResult.summary.books} buku cetak, {pushResult.summary.digitalBooks || 0} e-book digital, {pushResult.summary.members} anggota, {pushResult.summary.circulation} sirkulasi, {pushResult.summary.journals} jurnal.
                    </p>
                  )}
                </div>
              </div>
            )}

            {pullResult && (
              <div className={`p-4 rounded-2xl border text-xs flex items-start gap-2.5 ${
                pullResult.success ? 'bg-blue-50 text-blue-800 border-blue-200' : 'bg-rose-50 text-rose-800 border-rose-200'
              }`}>
                {pullResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <p className="font-bold">{pullResult.message}</p>
              </div>
            )}
          </div>

        </div>
      )}

      {/* TAB 2: EKSPOR & IMPOR KOLEKSI BUKU (CETAK & DIGITAL) */}
      {activeTab === 'export_import' && (
        <div className="space-y-6">
          
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-teal-700 via-teal-800 to-emerald-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl">
            <div className="max-w-3xl space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold">
                <Table className="w-3.5 h-3.5" />
                <span>Pusat Manajemen Berkas Koleksi Buku</span>
              </span>
              <h3 className="text-xl sm:text-2xl font-extrabold">
                Ekspor & Impor Koleksi Buku Cetak & E-Book Digital
              </h3>
              <p className="text-xs text-teal-100 leading-relaxed">
                Kemudahan mengunduh berkas spreadsheet (CSV/Excel) untuk laporan inventaris dan memasukkan data ratusan buku cetak maupun e-book digital secara massal ke dalam sistem perpustakaan SMPN 5 Bulukumba.
              </p>
            </div>
          </div>

          {/* Section 1: Ekspor Koleksi (Download) */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <FolderDown className="w-5 h-5 text-teal-600" />
              <h3 className="font-extrabold text-base text-slate-800">
                1. Ekspor Koleksi Buku (Unduh Berkas CSV / Excel)
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              Format CSV kompatibel dengan Microsoft Excel, Google Sheets, dan LibreOffice Calc. Dilengkapi UTF-8 BOM agar tanda baca terbaca sempurna.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
              
              {/* Ekspor Buku Cetak */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 hover:border-emerald-300 transition-all flex flex-col justify-between space-y-3">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                      <BookMarked className="w-4 h-4" />
                    </span>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      {books.length} Judul
                    </span>
                  </div>
                  <h4 className="font-extrabold text-sm text-slate-800">
                    Koleksi Buku Cetak (Fisik)
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Unduh seluruh data buku fisik, nomor barcode (SMP5-BK-...), ISBN, penerbit, nomor rak, dan jumlah stok.
                  </p>
                </div>

                <button
                  onClick={handleExportPrintedCSV}
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition-all active:scale-95"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh CSV Buku Cetak</span>
                </button>
              </div>

              {/* Ekspor Buku Digital */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 hover:border-teal-300 transition-all flex flex-col justify-between space-y-3">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="w-8 h-8 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-xs">
                      <BookOpen className="w-4 h-4" />
                    </span>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                      {digitalBooks.length} E-Book
                    </span>
                  </div>
                  <h4 className="font-extrabold text-sm text-slate-800">
                    Koleksi E-Book Digital
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Unduh metadata modul ajar, kurikulum, bab interaktif, link unduhan berkas PDF, serta sinopsis e-book.
                  </p>
                </div>

                <button
                  onClick={handleExportDigitalCSV}
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-sm transition-all active:scale-95"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh CSV E-Book Digital</span>
                </button>
              </div>

              {/* Ekspor Seluruh Katalog Terpadu */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 hover:border-indigo-300 transition-all flex flex-col justify-between space-y-3">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                      <Layers className="w-4 h-4" />
                    </span>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                      {books.length + digitalBooks.length} Total
                    </span>
                  </div>
                  <h4 className="font-extrabold text-sm text-slate-800">
                    Katalog Lengkap (Cetak & Digital)
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Rekapitulasi gabungan seluruh judul buku fisik dan digital dalam 1 file CSV untuk pelaporan resmi dinas/sekolah.
                  </p>
                </div>

                <button
                  onClick={handleExportAllCatalogCSV}
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-sm transition-all active:scale-95"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh Katalog Terpadu</span>
                </button>
              </div>

            </div>
          </div>

          {/* Section 2: Impor Koleksi Massal (Upload) */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <FolderUp className="w-5 h-5 text-teal-600" />
                <div>
                  <h3 className="font-extrabold text-base text-slate-800">
                    2. Impor Koleksi Massal dari Berkas CSV / JSON
                  </h3>
                  <p className="text-xs text-slate-500">
                    Tambahkan banyak judul buku sekaligus tanpa perlu menginput satu per satu
                  </p>
                </div>
              </div>

              {/* Template download buttons */}
              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={handleDownloadSamplePrintedCSV}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 flex items-center gap-1"
                >
                  <FileDown className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Format Contoh Buku Cetak</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadSampleDigitalCSV}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 flex items-center gap-1"
                >
                  <FileDown className="w-3.5 h-3.5 text-teal-600" />
                  <span>Format Contoh E-Book</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Target Koleksi Selector */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Target Koleksi yang Akan Diimpor:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setImportTarget('printed');
                      setParsedBooksData(null);
                      setParsedDigitalData(null);
                      setParsedImportCount(null);
                      setImportFileName('');
                    }}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                      importTarget === 'printed'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <BookMarked className="w-4 h-4 text-emerald-600" />
                    <span>Buku Cetak (Fisik)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setImportTarget('digital');
                      setParsedBooksData(null);
                      setParsedDigitalData(null);
                      setParsedImportCount(null);
                      setImportFileName('');
                    }}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                      importTarget === 'digital'
                        ? 'bg-teal-50 border-teal-500 text-teal-800 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <BookOpen className="w-4 h-4 text-teal-600" />
                    <span>Buku Digital (E-Book)</span>
                  </button>
                </div>
              </div>

              {/* Import Mode Selector */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Metode Penggabungan Data:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setImportMode('merge')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                      importMode === 'merge'
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-800 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>Gabungkan (Merge)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setImportMode('replace')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                      importMode === 'replace'
                        ? 'bg-amber-50 border-amber-500 text-amber-800 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>Gantikan Total (Replace)</span>
                  </button>
                </div>
              </div>

            </div>

            {/* File Upload Drop Area */}
            <div className="border-2 border-dashed border-slate-300 hover:border-teal-500 rounded-3xl p-6 text-center transition-all bg-slate-50/50 space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.json"
                onChange={handleFileChange}
                className="hidden"
                id="file-import-collection"
              />
              <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center mx-auto">
                <Upload className="w-6 h-6" />
              </div>

              <div>
                <label
                  htmlFor="file-import-collection"
                  className="cursor-pointer text-xs font-extrabold text-teal-700 hover:text-teal-800 underline decoration-2 underline-offset-4"
                >
                  Pilih Berkas CSV / JSON dari Komputer
                </label>
                <p className="text-[11px] text-slate-400 mt-1">
                  Mendukung berkas CSV hasil ekspor Google Spreadsheet, Excel, atau file JSON inventaris
                </p>
              </div>

              {importFileName && (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-teal-50 border border-teal-200 text-xs font-semibold text-teal-800">
                  <FileSpreadsheet className="w-4 h-4 text-teal-600" />
                  <span>{importFileName}</span>
                  {parsedImportCount !== null && (
                    <span className="font-bold text-teal-700">({parsedImportCount} judul terdeteksi)</span>
                  )}
                </div>
              )}
            </div>

            {/* Import Status Alert */}
            {importMessage && (
              <div className={`p-4 rounded-2xl border text-xs flex items-center justify-between ${
                importMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
              }`}>
                <div className="flex items-center gap-2">
                  {importMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
                  <span className="font-bold">{importMessage.text}</span>
                </div>
                {parsedImportCount && (
                  <button
                    type="button"
                    onClick={handleExecuteImport}
                    className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all active:scale-95"
                  >
                    Simpan ke Koleksi Perpustakaan Sekarang
                  </button>
                )}
              </div>
            )}

          </div>

          {/* Section 3: Struktur Database Google Spreadsheet */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <Table className="w-5 h-5 text-indigo-600" />
              <h3 className="font-extrabold text-base text-slate-800">
                3. Arsitektur Struktur Tabel di Google Spreadsheet
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              Saat disinkronkan ke Google Spreadsheet Anda, sistem otomatis mengorganisir data ke dalam 5 lembar kerja (*sheet*) dengan skema terstandardisasi:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1 text-xs">
              
              {/* Sheet Koleksi Buku Cetak */}
              <div className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    Sheet: Koleksi_Buku
                  </span>
                  <span className="text-[10px] bg-emerald-200/60 text-emerald-800 px-2 py-0.5 rounded-full font-mono font-bold">15 Kolom</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed font-mono">
                  ID, Barcode, ISBN, Judul Buku, Penulis, Penerbit, Tahun, Kategori, Lokasi Rak, Total Stok, Stok Tersedia, Halaman, Bahasa, Deskripsi, Tgl Ditambahkan
                </p>
              </div>

              {/* Sheet Koleksi Buku Digital */}
              <div className="p-4 rounded-2xl border border-teal-200 bg-teal-50/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-teal-900 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-teal-500"></span>
                    Sheet: Koleksi_Buku_Digital
                  </span>
                  <span className="text-[10px] bg-teal-200/60 text-teal-800 px-2 py-0.5 rounded-full font-mono font-bold">14 Kolom</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed font-mono">
                  ID E-Book, Judul E-Book, Penulis / Penyusun, Kategori, Kurikulum / Label, Halaman, Ukuran Berkas, Rating, Kali Dibaca, URL Sampul, Link Unduhan PDF, Sinopsis, Konten Bab E-Reader (JSON), Tgl Ditambahkan
                </p>
              </div>

            </div>
          </div>

        </div>
      )}

      {/* TAB 3: KODE BACK END GOOGLE APPS SCRIPT (Code.gs) */}
      {activeTab === 'code' && (
        <div className="space-y-6">
          
          {/* Step by Step Guide Card */}
          <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Panduan 5 Langkah Deploy Backend Google Spreadsheet</span>
            </div>

            <h3 className="text-xl sm:text-2xl font-extrabold">
              Cara Memasang Back End GAS di Google Spreadsheet
            </h3>
            <p className="text-xs text-indigo-200">
              Versi terbaru skrip ini kini sudah mencakup database <code>Koleksi_Buku_Digital</code> beserta konten bab interaktif e-reader.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 pt-2 text-xs">
              <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 space-y-1">
                <span className="w-6 h-6 rounded-full bg-emerald-500 text-white font-bold text-xs flex items-center justify-center">1</span>
                <p className="font-bold text-white pt-1">Buka Spreadsheet</p>
                <p className="text-[11px] text-slate-300">Buat Spreadsheet baru di Google Drive akun <code>@guru.smp.belajar.id</code> Anda.</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 space-y-1">
                <span className="w-6 h-6 rounded-full bg-emerald-500 text-white font-bold text-xs flex items-center justify-center">2</span>
                <p className="font-bold text-white pt-1">Buka Apps Script</p>
                <p className="text-[11px] text-slate-300">Klik menu <strong>Ekstensi</strong> &gt; pilih <strong>Apps Script</strong>.</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 space-y-1">
                <span className="w-6 h-6 rounded-full bg-emerald-500 text-white font-bold text-xs flex items-center justify-center">3</span>
                <p className="font-bold text-white pt-1">Tempel Kode</p>
                <p className="text-[11px] text-slate-300">Hapus isi file <code>Code.gs</code> bawaan, lalu salin &amp; tempel kode di bawah ini.</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 space-y-1">
                <span className="w-6 h-6 rounded-full bg-emerald-500 text-white font-bold text-xs flex items-center justify-center">4</span>
                <p className="font-bold text-white pt-1">Terapkan (Deploy)</p>
                <p className="text-[11px] text-slate-300">Klik <strong>Terapkan</strong> &gt; <strong>Penerapan baru</strong> &gt; pilih <strong>Aplikasi Web</strong> &gt; Akses: <em>Siapa saja (Anyone)</em>.</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 space-y-1">
                <span className="w-6 h-6 rounded-full bg-emerald-500 text-white font-bold text-xs flex items-center justify-center">5</span>
                <p className="font-bold text-white pt-1">Salin URL</p>
                <p className="text-[11px] text-slate-300">Salin URL Web App dan tempelkan ke tab <em>Koneksi &amp; Sinkronisasi</em> aplikasi ini!</p>
              </div>
            </div>
          </div>

          {/* Code Viewer Card */}
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code2 className="w-5 h-5 text-emerald-400" />
                <span className="font-bold text-sm font-mono">Code.gs (Google Apps Script)</span>
              </div>
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow transition-all active:scale-95"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? 'Tersalin ke Clipboard!' : 'Salin Seluruh Kode (Copy)'}</span>
              </button>
            </div>

            <div className="p-4 bg-slate-950 font-mono text-xs text-slate-200 overflow-x-auto max-h-[500px] leading-relaxed">
              <pre className="whitespace-pre">{GAS_BACKEND_CODE}</pre>
            </div>
          </div>

        </div>
      )}

      {/* TAB 4: DEPLOY KE BLOGGER (BLOGSPOT) */}
      {activeTab === 'blogger' && (
        <div className="space-y-6">
          
          <div className="bg-gradient-to-r from-orange-600 to-amber-700 text-white rounded-3xl p-6 sm:p-8 shadow-xl">
            <div className="max-w-3xl space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold">
                <Globe className="w-3.5 h-3.5" />
                <span>Blogger / Blogspot Deployment Kit</span>
              </span>
              <h3 className="text-xl sm:text-2xl font-extrabold">
                Pasang Aplikasi Perpustakaan ke Blog Sekolah
              </h3>
              <p className="text-xs text-orange-100 leading-relaxed">
                Anda dapat menyematkan (*embed*) seluruh sistem perpustakaan MABBARAKKA SMPN 5 Bulukumba ke dalam postingan atau laman statis Blogger/Blogspot sekolah secara responsif, lengkap dengan dukungan barcode scanner kamera!
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Left: Code Snippet & Instructions */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-extrabold text-sm text-slate-800 flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-orange-600" />
                  <span>Kode HTML Embed untuk Blogger</span>
                </h4>
                <button
                  onClick={handleCopyBloggerCode}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow transition-all active:scale-95"
                >
                  {copiedBlogger ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedBlogger ? 'Tersalin!' : 'Salin Kode HTML'}</span>
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  URL Aplikasi yang Akan Di-embed:
                </label>
                <input
                  type="text"
                  value={bloggerAppUrl}
                  onChange={(e) => setBloggerAppUrl(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-300 text-slate-800"
                />
              </div>

              <div className="p-3 bg-slate-900 text-emerald-400 font-mono text-[11px] rounded-2xl max-h-56 overflow-y-auto leading-relaxed">
                <pre className="whitespace-pre-wrap">{bloggerCode}</pre>
              </div>

              {/* Instructions */}
              <div className="pt-2 border-t border-slate-100 space-y-2 text-xs text-slate-700">
                <h5 className="font-bold text-slate-900">Cara Memasang di Blogger:</h5>
                <ol className="list-decimal pl-4 space-y-1 text-[11px] text-slate-600">
                  <li>Buka <strong>blogger.com</strong> dan masuk ke dashboard blog sekolah Anda.</li>
                  <li>Pilih menu <strong>Laman</strong> (Pages) &gt; klik <strong>+ Laman Baru</strong> (atau buat Postingan Baru).</li>
                  <li>Beri judul, misalnya: <em>&ldquo;Perpustakaan Digital MABBARAKKA&rdquo;</em>.</li>
                  <li>Klik ikon pensil di pojok kiri atas area ketik, lalu ganti ke <strong>&ldquo;Tampilan HTML&rdquo;</strong>.</li>
                  <li>Tempelkan (*paste*) kode di atas.</li>
                  <li>Klik <strong>Publikasikan</strong> (Publish). Selesai! Seluruh siswa &amp; guru dapat mengakses perpustakaan dari blog sekolah.</li>
                </ol>
              </div>
            </div>

            {/* Right: Live Preview Mockup */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-extrabold text-sm text-slate-800 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-emerald-600" />
                  <span>Simulasi Tampilan di Blogger</span>
                </h4>
                <span className="text-[11px] text-slate-400 font-medium">Pratinjau Responsif</span>
              </div>

              {/* Mock Browser Container */}
              <div className="rounded-2xl border border-slate-300 bg-slate-100 overflow-hidden shadow-inner">
                {/* Browser Top Bar */}
                <div className="px-4 py-2 bg-slate-200 border-b border-slate-300 flex items-center gap-2 text-xs">
                  <div className="flex gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-400"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                  </div>
                  <div className="flex-1 bg-white px-3 py-0.5 rounded-md text-[10px] text-slate-500 font-mono text-center truncate">
                    https://smpn5bulukumba.blogspot.com/p/perpustakaan.html
                  </div>
                </div>

                {/* Simulated Blogger Page Body */}
                <div className="p-4 bg-white space-y-3">
                  <div className="border-b pb-2">
                    <h3 className="font-bold text-base text-slate-800">Perpustakaan Digital MABBARAKKA</h3>
                    <p className="text-[10px] text-slate-400">Diposting oleh: Tim Literasi SMPN 5 Bulukumba</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-emerald-950 text-white text-center space-y-2">
                    <span className="text-[10px] font-bold text-emerald-400 tracking-wider uppercase block">
                      Aplikasi Perpustakaan Aktif di Blogger
                    </span>
                    <h4 className="text-sm font-extrabold">MABBARAKKA SMPN 5 BULUKUMBA</h4>
                    <p className="text-[11px] text-slate-300 max-w-sm mx-auto">
                      Koleksi buku cetak, e-reader modul, sirkulasi barcode scanner, dan jurnal membaca siswa beroperasi optimal di dalam blog sekolah.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Mendukung penuh akses kamera HP dan laptop siswa saat scan barcode langsung dari halaman Blogger!</span>
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};
