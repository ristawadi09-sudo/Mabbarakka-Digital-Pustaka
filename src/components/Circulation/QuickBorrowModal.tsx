import React, { useState, useEffect } from 'react';
import { 
  X, 
  BookmarkCheck, 
  User, 
  BookMarked, 
  Calendar, 
  AlertCircle, 
  CheckCircle2, 
  ScanLine,
  Sparkles
} from 'lucide-react';
import { Book, Member, CirculationRecord, LibrarySettings } from '../../types/library';
import { sounds } from '../../utils/audio';
import confetti from 'canvas-confetti';

interface QuickBorrowModalProps {
  books: Book[];
  members: Member[];
  settings: LibrarySettings;
  preselectedBook?: Book | null;
  preselectedMember?: Member | null;
  onClose: () => void;
  onBorrowSuccess: (newRecord: CirculationRecord) => void;
  onOpenScanner: () => void;
}

export const QuickBorrowModal: React.FC<QuickBorrowModalProps> = ({
  books,
  members,
  settings,
  preselectedBook,
  preselectedMember,
  onClose,
  onBorrowSuccess,
  onOpenScanner,
}) => {
  const [selectedBookId, setSelectedBookId] = useState<string>(preselectedBook?.id || '');
  const [selectedMemberId, setSelectedMemberId] = useState<string>(preselectedMember?.id || '');
  const [borrowDays, setBorrowDays] = useState<number>(7);
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync when preselected changes
  useEffect(() => {
    if (preselectedBook) setSelectedBookId(preselectedBook.id);
  }, [preselectedBook]);

  useEffect(() => {
    if (preselectedMember) {
      setSelectedMemberId(preselectedMember.id);
      // Automatically adjust days for teacher/staff
      if (preselectedMember.role === 'Guru' || preselectedMember.role === 'Staf') {
        setBorrowDays(settings.staffBorrowDays);
      } else {
        setBorrowDays(settings.studentBorrowDays);
      }
    }
  }, [preselectedMember, settings]);

  const currentBook = books.find(b => b.id === selectedBookId);
  const currentMember = members.find(m => m.id === selectedMemberId);

  // Auto update borrow days when member changes
  const handleMemberChange = (id: string) => {
    setSelectedMemberId(id);
    const m = members.find(mem => mem.id === id);
    if (m?.role === 'Guru' || m?.role === 'Staf') {
      setBorrowDays(settings.staffBorrowDays);
    } else {
      setBorrowDays(settings.studentBorrowDays);
    }
  };

  const calculateDueDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + borrowDays);
    return d.toISOString().split('T')[0];
  };

  const handleBorrowSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!currentBook) {
      setErrorMsg('Pilih buku yang hendak dipinjam.');
      return;
    }
    if (!currentMember) {
      setErrorMsg('Pilih anggota peminjam (siswa/guru/staf).');
      return;
    }
    if (currentBook.availableCopies <= 0) {
      setErrorMsg(`Buku "${currentBook.title}" saat ini sedang habis dipinjam.`);
      return;
    }
    if (currentMember.status !== 'Aktif') {
      setErrorMsg(`Status anggota ${currentMember.name} sedang ${currentMember.status}.`);
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const dueStr = calculateDueDate();

    const newRecord: CirculationRecord = {
      id: `tr-${Date.now()}`,
      transactionCode: `TR-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${Math.floor(100 + Math.random() * 900)}`,
      bookId: currentBook.id,
      bookBarcode: currentBook.barcode,
      bookTitle: currentBook.title,
      bookCategory: currentBook.category,
      memberId: currentMember.id,
      memberNumber: currentMember.memberNumber,
      memberName: currentMember.name,
      memberRole: currentMember.role,
      memberClass: currentMember.gradeClass,
      memberWhatsapp: currentMember.whatsapp,
      memberEmail: currentMember.email,
      borrowDate: todayStr,
      dueDate: dueStr,
      status: 'Dipinjam',
      notes: notes || 'Peminjaman sirkulasi buku perpustakaan',
      finePerDay: settings.finePerDay,
      fineDays: 0,
      fineAmount: 0,
      finePaid: false,
      whatsappReminderSent: false,
      emailReminderSent: false,
    };

    sounds.playSuccessChime();
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 }
    });

    onBorrowSuccess(newRecord);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-slate-200">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <BookmarkCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">Form Peminjaman Buku Cepat</h3>
              <p className="text-xs text-slate-500">Sirkulasi Perpustakaan MABBARAKKA SMPN 5 Bulukumba</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error notification */}
        {errorMsg && (
          <div className="mt-3 p-3 rounded-xl bg-rose-50 text-rose-700 text-xs flex items-center gap-2 border border-rose-200">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleBorrowSubmit} className="mt-4 space-y-4 text-xs">
          
          {/* Select Book */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-bold text-slate-700 flex items-center gap-1.5">
                <BookMarked className="w-3.5 h-3.5 text-emerald-600" />
                <span>Pilih Buku Cetak *</span>
              </label>
              <button
                type="button"
                onClick={onOpenScanner}
                className="text-[11px] font-semibold text-teal-700 hover:underline flex items-center gap-1"
              >
                <ScanLine className="w-3 h-3" />
                <span>Scan Barcode Buku</span>
              </button>
            </div>

            <select
              required
              value={selectedBookId}
              onChange={(e) => setSelectedBookId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-emerald-500 text-slate-800 bg-white"
            >
              <option value="">-- Pilih Judul Buku dari Katalog --</option>
              {books.map((b) => (
                <option key={b.id} value={b.id} disabled={b.availableCopies <= 0}>
                  {b.barcode} - {b.title} ({b.availableCopies}/{b.totalCopies} Tersedia)
                </option>
              ))}
            </select>

            {currentBook && (
              <div className="mt-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-[11px]">
                <span className="text-slate-600 font-medium">Lokasi: {currentBook.rackLocation}</span>
                <span className={`font-bold ${currentBook.availableCopies > 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                  Sisa {currentBook.availableCopies} Eksemplar
                </span>
              </div>
            )}
          </div>

          {/* Select Member */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-bold text-slate-700 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-600" />
                <span>Pilih Anggota Peminjam *</span>
              </label>
              <button
                type="button"
                onClick={onOpenScanner}
                className="text-[11px] font-semibold text-blue-700 hover:underline flex items-center gap-1"
              >
                <ScanLine className="w-3 h-3" />
                <span>Scan Kartu Anggota</span>
              </button>
            </div>

            <select
              required
              value={selectedMemberId}
              onChange={(e) => handleMemberChange(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-emerald-500 text-slate-800 bg-white"
            >
              <option value="">-- Pilih Siswa / Guru / Staf --</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.memberNumber} - {m.name} ({m.gradeClass || m.role})
                </option>
              ))}
            </select>

            {currentMember && (
              <div className="mt-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-[11px]">
                <span className="text-slate-600">WhatsApp: {currentMember.whatsapp}</span>
                <span className="text-emerald-700 font-bold">Status: {currentMember.status}</span>
              </div>
            )}
          </div>

          {/* Borrow Duration */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Lama Peminjaman
              </label>
              <select
                value={borrowDays}
                onChange={(e) => setBorrowDays(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-emerald-500 text-slate-800 bg-white"
              >
                <option value={7}>7 Hari (Standar Siswa)</option>
                <option value={14}>14 Hari (Standar Guru)</option>
                <option value={3}>3 Hari (Buku Referensi/Kilat)</option>
                <option value={21}>21 Hari (Pengayaan Khusus)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Batas Waktu (Jatuh Tempo)
              </label>
              <div className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-100 font-mono text-slate-800 flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>{calculateDueDate()}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Catatan Peminjaman</label>
            <input
              type="text"
              placeholder="Contoh: Tugas projek literasi kelas VIII-A"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-emerald-500 text-slate-800"
            />
          </div>

          {/* Submit buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-100"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-md shadow-emerald-700/20 transition-all active:scale-95"
            >
              Proses Transaksi Peminjaman
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
