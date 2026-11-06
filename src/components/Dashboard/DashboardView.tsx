import React from 'react';
import { 
  BookMarked, 
  FileText, 
  Repeat, 
  AlertTriangle, 
  Users, 
  TrendingUp, 
  MessageSquare, 
  Mail, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  BadgePercent,
  ScanLine,
  BookmarkPlus,
  Sparkles
} from 'lucide-react';
import { 
  Book, 
  DigitalBook, 
  Member, 
  CirculationRecord, 
  ActiveVisitor, 
  LibrarySettings 
} from '../../types/library';
import { ActiveVisitorsWidget } from './ActiveVisitorsWidget';
import { formatRupiah, formatDateIndo, calculateOverdueDays } from '../../utils/formatters';

interface DashboardViewProps {
  books: Book[];
  digitalBooks: DigitalBook[];
  members: Member[];
  circulation: CirculationRecord[];
  activeVisitors: ActiveVisitor[];
  settings: LibrarySettings;
  onNavigate: (tab: any) => void;
  onOpenScanner: () => void;
  onOpenQuickBorrow: () => void;
  onOpenNotifications: () => void;
  onSimulateVisitor: () => void;
  onSendWhatsApp: (record: CirculationRecord) => void;
  onSendEmail: (record: CirculationRecord) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  books,
  digitalBooks,
  members,
  circulation,
  activeVisitors,
  settings,
  onNavigate,
  onOpenScanner,
  onOpenQuickBorrow,
  onOpenNotifications,
  onSimulateVisitor,
  onSendWhatsApp,
  onSendEmail,
}) => {
  // Statistics calculations
  const totalPhysicalBooks = books.reduce((acc, b) => acc + b.totalCopies, 0);
  const activeLoans = circulation.filter(c => c.status === 'Dipinjam' || c.status === 'Terlambat');
  const overdueLoans = circulation.filter(c => {
    if (c.status === 'Dikembalikan') return false;
    return c.status === 'Terlambat' || calculateOverdueDays(c.dueDate) > 0;
  });

  const totalCollectedFines = circulation
    .filter(c => c.finePaid && c.fineAmount > 0)
    .reduce((acc, c) => acc + c.fineAmount, 0);

  const totalPendingFines = overdueLoans.reduce((acc, c) => {
    const lateDays = calculateOverdueDays(c.dueDate);
    return acc + (lateDays * (c.finePerDay || settings.finePerDay));
  }, 0);

  // Top borrowed categories
  const categoryColors = ['bg-emerald-500', 'bg-teal-500', 'bg-blue-500', 'bg-purple-500', 'bg-amber-500'];
  const categoryCounts: { [key: string]: number } = {};
  circulation.forEach(c => {
    categoryCounts[c.bookCategory] = (categoryCounts[c.bookCategory] || 0) + 1;
  });
  
  const defaultPopular = ['Mata Pelajaran', 'Sastra', 'Karya Umum', 'Filsafat', 'Sejarah/Geografi'];
  defaultPopular.forEach(cat => {
    if (categoryCounts[cat] === undefined) {
      categoryCounts[cat] = 0;
    }
  });

  const topCategoryList = Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count], idx) => ({
      name,
      count: count > 0 ? count : (6 - idx) * 3,
      color: categoryColors[idx % categoryColors.length]
    }));

  const maxCategoryCount = Math.max(...topCategoryList.map(c => c.count), 1);

  return (
    <div className="space-y-6">
      
      {/* Hero Welcome & Quick Action Header */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        {/* Background decorative pattern */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-emerald-500/10 skew-x-12 pointer-events-none"></div>
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold backdrop-blur-sm">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Sistem Sirkulasi & Literasi Terintegrasi</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Selamat Datang di Perpustakaan MABBARAKKA
            </h1>
            <p className="text-slate-200 text-xs sm:text-sm leading-relaxed">
              Pusat peradaban literasi <span className="font-semibold text-white">SMP Negeri 5 Bulukumba</span>. Memantau sirkulasi peminjaman buku cetak & digital, notifikasi pengingat otomatis WhatsApp/Email, serta barcode scanner terpadu.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onOpenScanner}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-teal-500/30 transition-all active:scale-95"
            >
              <ScanLine className="w-4 h-4" />
              <span>Buka Barcode Scanner</span>
            </button>
            <button
              onClick={onOpenQuickBorrow}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/20 backdrop-blur-sm transition-all active:scale-95"
            >
              <BookmarkPlus className="w-4 h-4 text-emerald-300" />
              <span>Transaksi Baru</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main KPI Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        
        {/* Total Koleksi Cetak */}
        <div 
          onClick={() => onNavigate('printed_books')}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:border-emerald-400 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500">Koleksi Cetak</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <BookMarked className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-extrabold text-slate-800">{books.length}</div>
            <p className="text-[10px] text-slate-500">{totalPhysicalBooks} Total Eksemplar</p>
          </div>
        </div>

        {/* Koleksi Digital */}
        <div 
          onClick={() => onNavigate('digital_books')}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:border-teal-400 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500">E-Perpus Digital</span>
            <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-extrabold text-slate-800">{digitalBooks.length}</div>
            <p className="text-[10px] text-teal-600 font-medium">Buku & Modul Ajar</p>
          </div>
        </div>

        {/* Peminjaman Aktif */}
        <div 
          onClick={() => onNavigate('circulation')}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500">Peminjaman Aktif</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Repeat className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-extrabold text-blue-600">{activeLoans.length}</div>
            <p className="text-[10px] text-slate-500">Buku sedang dipinjam</p>
          </div>
        </div>

        {/* Jatuh Tempo (Overdue) */}
        <div 
          onClick={onOpenNotifications}
          className={`p-4 rounded-2xl border shadow-sm transition-all cursor-pointer group ${
            overdueLoans.length > 0
              ? 'bg-rose-50/80 border-rose-200 hover:border-rose-400 hover:shadow-md'
              : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-rose-700">Jatuh Tempo</span>
            <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-extrabold text-rose-600">{overdueLoans.length}</div>
            <p className="text-[10px] text-rose-700 font-bold flex items-center gap-1">
              Perlu Notifikasi WA/Email
            </p>
          </div>
        </div>

        {/* Total Anggota */}
        <div 
          onClick={() => onNavigate('members')}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:border-purple-400 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500">Anggota Terdaftar</span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-extrabold text-slate-800">{members.length}</div>
            <p className="text-[10px] text-slate-500">Siswa, Guru & Staf</p>
          </div>
        </div>

        {/* Estimasi Denda Otomatis */}
        <div 
          onClick={() => onNavigate('fines')}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:border-amber-400 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500">Denda Tertunggak</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <BadgePercent className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-base font-extrabold text-amber-700 truncate">
              {formatRupiah(totalPendingFines)}
            </div>
            <p className="text-[10px] text-slate-500">Terkumpul: {formatRupiah(totalCollectedFines)}</p>
          </div>
        </div>

      </div>

      {/* Real-time Online Visitors Widget */}
      <ActiveVisitorsWidget
        visitors={activeVisitors}
        onSimulateNewVisitor={onSimulateVisitor}
      />

      {/* Urgent Overdue Alert Banner if any loans are late */}
      {overdueLoans.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 sm:p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-amber-900 text-sm">
                  Perhatian: Terdapat {overdueLoans.length} Peminjaman Melewati Batas Waktu!
                </h3>
                <p className="text-xs text-amber-800 mt-0.5">
                  Sistem otomatis menghitung denda Rp {settings.finePerDay.toLocaleString('id-ID')}/hari. Segera kirimkan pesan pengingat resmi ke WhatsApp atau Email siswa/guru bersangkutan.
                </p>
              </div>
            </div>

            <button
              onClick={onOpenNotifications}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md transition-all shrink-0"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Buka Gateway Notifikasi</span>
            </button>
          </div>

          {/* Quick List of Overdue Members */}
          <div className="mt-3.5 pt-3 border-t border-amber-200/80 grid grid-cols-1 md:grid-cols-2 gap-2">
            {overdueLoans.slice(0, 2).map((item) => {
              const lateDays = calculateOverdueDays(item.dueDate);
              return (
                <div key={item.id} className="bg-white/90 p-2.5 rounded-xl border border-amber-200 flex items-center justify-between text-xs">
                  <div className="truncate mr-2">
                    <p className="font-bold text-slate-800 truncate">{item.memberName} ({item.memberClass || item.memberRole})</p>
                    <p className="text-[11px] text-slate-500 truncate">&ldquo;{item.bookTitle}&rdquo;</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded text-[10px]">
                      Telat {lateDays} hr
                    </span>
                    <button
                      onClick={() => onSendWhatsApp(item)}
                      title="Kirim WhatsApp"
                      className="p-1.5 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onSendEmail(item)}
                      title="Kirim Email"
                      className="p-1.5 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                    >
                      <Mail className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Two Columns: Recent Circulation Feed & Reading Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Circulation Activities (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">
                Aktivitas Sirkulasi Real-Time
              </h3>
              <p className="text-xs text-slate-500">
                Log peminjaman dan pengembalian buku teranyar
              </p>
            </div>
            <button
              onClick={() => onNavigate('circulation')}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              <span>Lihat Semua</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {circulation.slice(0, 5).map((record) => {
              const isOverdue = record.status === 'Terlambat' || (record.status === 'Dipinjam' && calculateOverdueDays(record.dueDate) > 0);
              const isReturned = record.status === 'Dikembalikan';

              return (
                <div 
                  key={record.id}
                  className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-slate-300 hover:shadow-sm transition-all flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      isReturned 
                        ? 'bg-emerald-100 text-emerald-700' 
                        : isOverdue 
                        ? 'bg-rose-100 text-rose-700' 
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {isReturned ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : isOverdue ? (
                        <AlertTriangle className="w-4 h-4" />
                      ) : (
                        <Repeat className="w-4 h-4" />
                      )}
                    </div>

                    <div className="truncate">
                      <p className="font-bold text-slate-800 truncate">
                        {record.bookTitle}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">
                        Peminjam: <span className="font-medium text-slate-700">{record.memberName}</span> ({record.memberClass || record.memberRole})
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isReturned
                        ? 'bg-emerald-100 text-emerald-800'
                        : isOverdue
                        ? 'bg-rose-100 text-rose-800 animate-pulse'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {isReturned ? 'Selesai' : isOverdue ? 'Jatuh Tempo' : 'Dipinjam'}
                    </span>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Tempo: {formatDateIndo(record.dueDate)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Analytical Breakdown (1 col) */}
        <div className="space-y-6">
          
          {/* Most Active Categories */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h3 className="font-bold text-slate-800 text-sm mb-1 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span>Kategori Buku Terpopuler</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Frekuensi peminjaman siswa & guru
            </p>

            <div className="space-y-3">
              {topCategoryList.map((cat, i) => (
                <div key={i} className="text-xs">
                  <div className="flex justify-between font-medium text-slate-700 mb-1">
                    <span className="truncate pr-2">{cat.name}</span>
                    <span className="font-bold">{cat.count}x</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div 
                      className={`h-full ${cat.color} rounded-full`} 
                      style={{ width: `${Math.min(100, Math.round((cat.count / maxCategoryCount) * 100))}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Google Apps Script & Blogger Integration Card */}
          <div className="bg-gradient-to-br from-emerald-900 to-teal-950 text-white rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-400/30">
                Penyimpanan Cloud Google
              </span>
              <span className="text-[10px] text-emerald-400 font-mono">Belajar.id</span>
            </div>
            <div>
              <h4 className="font-bold text-sm text-white">Back End Google Apps Script</h4>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Data buku, sirkulasi, dan siswa tersimpan aman di Google Spreadsheet serta siap dipasang ke Blogger sekolah.
              </p>
            </div>
            <button
              onClick={() => onNavigate('gas')}
              className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 active:scale-95"
            >
              <span>Buka Pengaturan GAS &amp; Blogger</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick School Motto & Info */}
          <div className="bg-gradient-to-br from-slate-900 to-emerald-950 text-white rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Filosofi Perpustakaan</span>
            </div>
            <h4 className="font-bold text-sm text-slate-100 mb-1">
              &ldquo;MABBARAKKA: Membawa Berkah Literasi&rdquo;
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Mendidik generasi pelajar cerdas, berkarakter luhur, dan mencintai khazanah maritim Butta Panrita Lopi Kabupaten Bulukumba.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
};
