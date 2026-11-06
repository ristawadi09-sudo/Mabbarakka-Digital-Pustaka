import React, { useState } from 'react';
import { 
  BookMarked, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  CreditCard, 
  BookOpenText, 
  Search, 
  ArrowRight,
  ShieldCheck,
  GraduationCap,
  Sparkles,
  Barcode as BarcodeIcon,
  BadgeAlert
} from 'lucide-react';
import { CirculationRecord, AuthSession, Book, Member } from '../../types/library';
import { formatDateIndo, formatRupiah, calculateOverdueDays } from '../../utils/formatters';

interface PersonalLoansViewProps {
  currentSession: AuthSession;
  circulation: CirculationRecord[];
  allBooks: Book[];
  onOpenMemberCard: (memberId: string) => void;
  onNavigateToCatalog: () => void;
  onNavigateToDigital: () => void;
  onOpenJournalForBookTitle: (title: string) => void;
}

export const PersonalLoansView: React.FC<PersonalLoansViewProps> = ({
  currentSession,
  circulation,
  allBooks,
  onOpenMemberCard,
  onNavigateToCatalog,
  onNavigateToDigital,
  onOpenJournalForBookTitle,
}) => {
  const [filterTab, setFilterTab] = useState<'active' | 'history'>('active');

  // Filter records belonging to this member (by memberNumber, memberId, or name)
  const myRecords = circulation.filter((c) => {
    const matchNum = currentSession.memberNumber && c.memberNumber.toLowerCase() === currentSession.memberNumber.toLowerCase();
    const matchId = currentSession.id && c.memberId === currentSession.id;
    const matchName = c.memberName.toLowerCase().includes(currentSession.name.toLowerCase()) || 
                      currentSession.name.toLowerCase().includes(c.memberName.toLowerCase());
    return matchNum || matchId || matchName;
  });

  const activeLoans = myRecords.filter(c => c.status !== 'Dikembalikan');
  const pastLoans = myRecords.filter(c => c.status === 'Dikembalikan');

  const overdueCount = activeLoans.filter(c => calculateOverdueDays(c.dueDate) > 0).length;
  const totalUnpaidFine = myRecords
    .filter(c => !c.finePaid && c.fineAmount > 0)
    .reduce((acc, c) => acc + c.fineAmount, 0);

  return (
    <div className="space-y-6">
      
      {/* Member Hero Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-indigo-500/10 skew-x-12 pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden ring-4 ring-indigo-400/30 shrink-0 bg-indigo-800">
              <img 
                src={currentSession.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'} 
                alt={currentSession.name} 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold">
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Panel Anggota Perpustakaan</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white">
                {currentSession.name}
              </h2>
              <p className="text-xs text-indigo-200">
                {currentSession.gradeClass || currentSession.memberRole} &bull; No. Anggota: <span className="font-mono font-bold text-white">{currentSession.memberNumber || currentSession.username}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => onOpenMemberCard(currentSession.id)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs backdrop-blur-sm transition-all active:scale-95"
            >
              <BarcodeIcon className="w-4 h-4 text-indigo-300" />
              <span>Kartu Anggota Digital Saya</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Snapshot */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <span className="text-[11px] font-bold text-slate-500 block">Sedang Dipinjam</span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-2xl font-extrabold text-indigo-900">{activeLoans.length}</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <BookMarked className="w-4 h-4" />
            </div>
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">Batas pinjam 3 buku</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <span className="text-[11px] font-bold text-slate-500 block">Buku Terlambat</span>
          <div className="flex items-center justify-between mt-1">
            <span className={`text-2xl font-extrabold ${overdueCount > 0 ? 'text-rose-600' : 'text-slate-800'}`}>
              {overdueCount}
            </span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              overdueCount > 0 ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-400'
            }`}>
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">
            {overdueCount > 0 ? 'Harap segera dikembalikan' : 'Status pinjaman aman'}
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <span className="text-[11px] font-bold text-slate-500 block">Riwayat Peminjaman</span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-2xl font-extrabold text-emerald-800">{pastLoans.length}</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">Buku selesai dibaca</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <span className="text-[11px] font-bold text-slate-500 block">Tagihan Denda</span>
          <div className="flex items-center justify-between mt-1">
            <span className={`text-lg sm:text-xl font-extrabold ${totalUnpaidFine > 0 ? 'text-rose-600' : 'text-slate-700'}`}>
              {totalUnpaidFine > 0 ? formatRupiah(totalUnpaidFine) : 'Rp 0'}
            </span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              totalUnpaidFine > 0 ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-400'
            }`}>
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">
            {totalUnpaidFine > 0 ? 'Belum dibayar' : 'Bebas tunggakan'}
          </span>
        </div>
      </div>

      {/* Tabs Filter */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex bg-slate-100 p-1 rounded-2xl text-xs font-bold">
          <button
            onClick={() => setFilterTab('active')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
              filterTab === 'active'
                ? 'bg-white text-indigo-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookMarked className="w-4 h-4 text-indigo-600" />
            <span>Sedang Dipinjam ({activeLoans.length})</span>
          </button>

          <button
            onClick={() => setFilterTab('history')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
              filterTab === 'history'
                ? 'bg-white text-indigo-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Riwayat Selesai ({pastLoans.length})</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onNavigateToCatalog}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
          >
            <Search className="w-3.5 h-3.5 text-slate-500" />
            <span>Cari Buku Baru</span>
          </button>
          <button
            onClick={onNavigateToDigital}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 font-semibold text-xs transition-colors border border-teal-200"
          >
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            <span>Baca E-Book Digital</span>
          </button>
        </div>
      </div>

      {/* Content Area */}
      {filterTab === 'active' ? (
        activeLoans.length > 0 ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeLoans.map((loan) => {
                const book = allBooks.find(b => b.barcode === loan.bookBarcode || b.title === loan.bookTitle);
                const lateDays = calculateOverdueDays(loan.dueDate);
                const isOverdue = lateDays > 0;

                return (
                  <div 
                    key={loan.id}
                    className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm hover:border-indigo-300 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start gap-4">
                        <div className="w-20 h-28 rounded-xl overflow-hidden shrink-0 bg-slate-100 border border-slate-200 shadow-sm">
                          <img
                            src={book?.coverUrl || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=400&q=80'}
                            alt={loan.bookTitle}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        <div className="min-w-0 flex-1 space-y-1">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            {loan.bookCategory}
                          </span>
                          <h3 className="font-extrabold text-sm text-slate-800 line-clamp-2 leading-snug">
                            {loan.bookTitle}
                          </h3>
                          <p className="text-xs text-slate-500 font-mono">
                            Barcode: {loan.bookBarcode}
                          </p>

                          <div className="pt-1.5 flex items-center gap-2">
                            {isOverdue ? (
                              <span className="px-2 py-0.5 rounded-lg text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3 text-rose-600" />
                                <span>Terlambat {lateDays} Hari</span>
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                                <Clock className="w-3 h-3 text-emerald-600" />
                                <span>Tenggat: {formatDateIndo(loan.dueDate)}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="mt-3.5 pt-3 border-t border-slate-100 text-xs text-slate-500 space-y-1">
                        <div className="flex justify-between">
                          <span>Tanggal Peminjaman:</span>
                          <span className="font-semibold text-slate-700">{formatDateIndo(loan.borrowDate)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Batas Akhir Pengembalian:</span>
                          <span className={`font-bold ${isOverdue ? 'text-rose-600' : 'text-slate-800'}`}>
                            {formatDateIndo(loan.dueDate)}
                          </span>
                        </div>
                        {isOverdue && loan.fineAmount > 0 && (
                          <div className="flex justify-between text-rose-600 font-bold">
                            <span>Akumulasi Denda Keterlambatan:</span>
                            <span>{formatRupiah(loan.fineAmount)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <p className="text-[11px] text-slate-400 italic">
                        Pengembalian fisik dilakukan di meja petugas perpus.
                      </p>
                      <button
                        onClick={() => onOpenJournalForBookTitle(loan.bookTitle)}
                        className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center gap-1 transition-colors shrink-0"
                      >
                        <BookOpenText className="w-3.5 h-3.5" />
                        <span>Catat di Jurnal</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <span>
                <strong>Petunjuk Anggota:</strong> Tunjukkan buku dan Kartu Anggota Digital Anda kepada petugas perpustakaan ketika ingin memperpanjang masa pinjam atau mengembalikan buku ke rak.
              </span>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-sm space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto border border-indigo-100">
              <BookMarked className="w-8 h-8" />
            </div>
            <div className="max-w-md mx-auto">
              <h3 className="font-extrabold text-slate-800 text-base">
                Tidak Ada Buku yang Sedang Dipinjam
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Anda saat ini tidak memiliki pinjaman buku fisik. Jelajahi ribuan koleksi buku cetak perpustakaan atau baca modul digital e-Perpus!
              </p>
            </div>
            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                onClick={onNavigateToCatalog}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
              >
                <Search className="w-4 h-4" />
                <span>Jelajahi Katalog Buku Cetak</span>
              </button>
              <button
                onClick={onNavigateToDigital}
                className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Baca E-Book Digital</span>
              </button>
            </div>
          </div>
        )
      ) : (
        /* History Returned Loans */
        pastLoans.length > 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h3 className="font-extrabold text-xs text-slate-700 uppercase tracking-wider">
                Daftar Buku yang Telah Dikembalikan ({pastLoans.length} Judul)
              </h3>
              <span className="text-[11px] text-slate-400">Arsip Peminjaman Mandiri</span>
            </div>

            <div className="divide-y divide-slate-100">
              {pastLoans.map((loan) => (
                <div key={loan.id} className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
                  <div className="space-y-1">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                      {loan.bookCategory}
                    </span>
                    <h4 className="font-extrabold text-sm text-slate-800">
                      {loan.bookTitle}
                    </h4>
                    <p className="text-xs text-slate-400 font-mono">
                      Dipinjam: {formatDateIndo(loan.borrowDate)} &bull; Kembali: {loan.returnDate ? formatDateIndo(loan.returnDate) : '-'}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Selesai Dikembalikan</span>
                    </span>

                    <button
                      onClick={() => onOpenJournalForBookTitle(loan.bookTitle)}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1 transition-colors"
                    >
                      <BookOpenText className="w-3.5 h-3.5 text-teal-600" />
                      <span>Resensi Buku</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-sm">
            <p className="text-xs text-slate-500">Belum ada riwayat pengembalian buku lampau.</p>
          </div>
        )
      )}

    </div>
  );
};
