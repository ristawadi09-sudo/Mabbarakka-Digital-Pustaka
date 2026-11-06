import React, { useState } from 'react';
import { 
  BookOpenText, 
  Plus, 
  Star, 
  Quote, 
  CheckCircle2, 
  Sparkles, 
  User, 
  X, 
  BookMarked,
  Trophy,
  Target,
  Clock
} from 'lucide-react';
import { ReadingJournalEntry, Book, DigitalBook, Member } from '../../types/library';
import { formatDateIndo } from '../../utils/formatters';
import confetti from 'canvas-confetti';

interface ReadingJournalViewProps {
  journals: ReadingJournalEntry[];
  books: Book[];
  digitalBooks: DigitalBook[];
  currentUser: Member | null;
  onAddJournal: (newJournal: ReadingJournalEntry) => void;
  preselectedBookTitle?: string;
}

export const ReadingJournalView: React.FC<ReadingJournalViewProps> = ({
  journals,
  books,
  digitalBooks,
  currentUser,
  onAddJournal,
  preselectedBookTitle,
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [filterView, setFilterView] = useState<'all' | 'mine'>('all');

  // Form state
  const [formData, setFormData] = useState({
    bookTitle: preselectedBookTitle || '',
    author: '',
    category: 'Sastra',
    rating: 5,
    pagesRead: 150,
    totalPages: 200,
    reviewText: '',
    favoriteQuote: '',
    keyLearnings: '',
    isCompleted: true,
  });

  const allBookTitles = [
    ...books.map(b => ({ title: b.title, author: b.author, category: b.category, pages: b.pages })),
    ...digitalBooks.map(d => ({ title: d.title, author: d.author, category: d.category, pages: d.totalPages }))
  ];

  const handleSelectBook = (title: string) => {
    const found = allBookTitles.find(b => b.title === title);
    if (found) {
      setFormData({
        ...formData,
        bookTitle: found.title,
        author: found.author,
        category: found.category,
        totalPages: found.pages,
        pagesRead: found.pages,
      });
    } else {
      setFormData({ ...formData, bookTitle: title });
    }
  };

  const handleCreateJournal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.bookTitle || !formData.reviewText) return;

    const newJournal: ReadingJournalEntry = {
      id: `jrn-${Date.now()}`,
      memberId: currentUser?.id || 'm-guest',
      memberName: currentUser?.name || 'Siswa Pembaca SMPN 5',
      bookTitle: formData.bookTitle,
      author: formData.author || 'Penulis Buku',
      category: formData.category,
      rating: formData.rating,
      pagesRead: Number(formData.pagesRead) || 100,
      totalPages: Number(formData.totalPages) || 100,
      reviewText: formData.reviewText,
      favoriteQuote: formData.favoriteQuote,
      keyLearnings: formData.keyLearnings
        ? formData.keyLearnings.split('\n').filter(s => s.trim().length > 0)
        : ['Memahami hikmah dan nilai moral cerita'],
      startDate: new Date().toISOString().split('T')[0],
      finishedDate: formData.isCompleted ? new Date().toISOString().split('T')[0] : undefined,
      isCompleted: formData.isCompleted,
      visibility: 'Publik',
      createdAt: new Date().toISOString(),
    };

    onAddJournal(newJournal);
    setIsAddModalOpen(false);

    confetti({
      particleCount: 40,
      spread: 50,
      origin: { y: 0.6 }
    });

    // Reset form
    setFormData({
      bookTitle: '',
      author: '',
      category: 'Fiksi & Sastra',
      rating: 5,
      pagesRead: 150,
      totalPages: 200,
      reviewText: '',
      favoriteQuote: '',
      keyLearnings: '',
      isCompleted: true,
    });
  };

  const filteredJournals = journals.filter((j) => {
    if (filterView === 'mine' && currentUser) {
      return j.memberId === currentUser.id;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800">
              Jurnal Membaca Pribadi
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-300">
              {journals.length} Catatan Refleksi
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Ruang literasi reflektif bagi setiap siswa untuk mencatat rangkuman buku, ulasan bintang, kutipan inspiratif, dan capaian target membaca
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md shadow-purple-700/20 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Tulis Ulasan Jurnal Baru</span>
        </button>
      </div>

      {/* Reading Challenge Banner */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 rounded-3xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-200 text-xs font-bold">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>Tantangan Membaca MABBARAKKA 2026</span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold">
              Target Membaca: 12 Buku dalam 1 Semester
            </h3>
            <p className="text-xs text-purple-200 max-w-xl">
              Tulis ulasan minimal 1 buku setiap dua minggu. Siswa dengan ulasan refleksi terbaik akan mendapatkan apresiasi <strong className="text-white">Duta Literasi Panrita Lopi</strong> pada upacara bendera!
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 text-center min-w-[160px]">
            <span className="text-[11px] text-purple-200 font-medium block">Pencapaian Kolektif</span>
            <div className="text-3xl font-extrabold text-white mt-1">
              {journals.filter(j => j.isCompleted).length}
            </div>
            <span className="text-[11px] text-emerald-400 font-bold block mt-0.5">
              Buku Selesai Dikaji
            </span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex bg-slate-100 p-1 rounded-xl w-fit text-xs font-semibold">
        <button
          onClick={() => setFilterView('all')}
          className={`px-4 py-2 rounded-lg transition-all ${
            filterView === 'all' ? 'bg-white text-purple-900 shadow-sm font-bold' : 'text-slate-600'
          }`}
        >
          Semua Ulasan Siswa ({journals.length})
        </button>
        {currentUser && (
          <button
            onClick={() => setFilterView('mine')}
            className={`px-4 py-2 rounded-lg transition-all ${
              filterView === 'mine' ? 'bg-white text-purple-900 shadow-sm font-bold' : 'text-slate-600'
            }`}
          >
            Jurnal Saya ({journals.filter(j => j.memberId === currentUser.id).length})
          </button>
        )}
      </div>

      {/* Journal Cards Feed */}
      <div className="space-y-4">
        {filteredJournals.map((entry) => (
          <div
            key={entry.id}
            className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:border-purple-300 transition-all space-y-4"
          >
            {/* Entry Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-sm">
                  {entry.memberName.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">{entry.memberName}</h4>
                  <p className="text-[11px] text-slate-400">
                    Ditulis pada {formatDateIndo(entry.createdAt.split('T')[0])}
                  </p>
                </div>
              </div>

              {/* Star Rating */}
              <div className="flex items-center gap-1 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-3.5 h-3.5 ${
                      star <= entry.rating ? 'text-amber-500 fill-current' : 'text-slate-200'
                    }`}
                  />
                ))}
                <span className="text-xs font-bold text-amber-800 ml-1">{entry.rating}/5</span>
              </div>
            </div>

            {/* Book Title & Category */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                  {entry.category}
                </span>
                {entry.isCompleted && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3" /> Selesai Dibaca ({entry.pagesRead}/{entry.totalPages} Hal)
                  </span>
                )}
              </div>
              <h3 className="text-base font-extrabold text-slate-900">
                &ldquo;{entry.bookTitle}&rdquo;
              </h3>
              <p className="text-xs text-slate-500">Oleh: {entry.author}</p>
            </div>

            {/* Review text */}
            <p className="text-xs text-slate-700 leading-relaxed bg-slate-50/60 p-4 rounded-2xl border border-slate-100">
              {entry.reviewText}
            </p>

            {/* Favorite Quote */}
            {entry.favoriteQuote && (
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200/80 flex items-start gap-3 text-xs">
                <Quote className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />
                <div className="italic text-slate-800 font-serif">
                  &ldquo;{entry.favoriteQuote}&rdquo;
                </div>
              </div>
            )}

            {/* Key Learnings List */}
            {entry.keyLearnings && entry.keyLearnings.length > 0 && (
              <div className="pt-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                  Hikmah & Pelajaran Penting:
                </span>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                  {entry.keyLearnings.map((item, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-slate-700 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                      <Sparkles className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                      <span className="truncate">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add Journal Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-xl rounded-3xl p-6 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                  <BookOpenText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">Tulis Jurnal Membaca Pribadi</h3>
                  <p className="text-xs text-slate-500">
                    Penulis: <span className="font-semibold text-purple-700">{currentUser?.name || 'Siswa SMPN 5 Bulukumba'}</span>
                  </p>
                </div>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateJournal} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Pilih Judul Buku / Ketik Judul *</label>
                <input
                  type="text"
                  required
                  list="bookSuggestions"
                  placeholder="Ketik judul buku yang telah kamu baca..."
                  value={formData.bookTitle}
                  onChange={(e) => handleSelectBook(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-purple-500 text-slate-800"
                />
                <datalist id="bookSuggestions">
                  {allBookTitles.map((b, i) => (
                    <option key={i} value={b.title}>{b.author}</option>
                  ))}
                </datalist>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nama Penulis / Pengarang</label>
                  <input
                    type="text"
                    placeholder="Contoh: Andrea Hirata"
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-purple-500 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Rating Penilaian (1-5)</label>
                  <select
                    value={formData.rating}
                    onChange={(e) => setFormData({ ...formData, rating: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-purple-500 text-slate-800 bg-white"
                  >
                    <option value={5}>⭐⭐⭐⭐⭐ (5/5) Sangat Luar Biasa</option>
                    <option value={4}>⭐⭐⭐⭐ (4/5) Sangat Bagus</option>
                    <option value={3}>⭐⭐⭐ (3/5) Cukup Menarik</option>
                    <option value={2}>⭐⭐ (2/5) Biasa Saja</option>
                    <option value={1}>⭐ (1/5) Kurang Menarik</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Ulasan / Resensi Buku *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Ceritakan apa yang kamu sukai dari alur cerita, karakter utama, atau wawasan baru yang kamu peroleh dari buku ini..."
                  value={formData.reviewText}
                  onChange={(e) => setFormData({ ...formData, reviewText: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-purple-500 text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Kutipan / Kalimat Paling Berkesan</label>
                <input
                  type="text"
                  placeholder="Contoh: Man Jadda Wajada (Siapa yang bersungguh-sungguh pasti berhasil)"
                  value={formData.favoriteQuote}
                  onChange={(e) => setFormData({ ...formData, favoriteQuote: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-purple-500 text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Pelajaran / Hikmah (Pisahkan dengan baris baru)</label>
                <textarea
                  rows={2}
                  placeholder="Poin 1: Pentingnya kerja keras&#10;Poin 2: Menghormati orang tua dan guru"
                  value={formData.keyLearnings}
                  onChange={(e) => setFormData({ ...formData, keyLearnings: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-purple-500 text-slate-800"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold shadow-md transition-all active:scale-95"
                >
                  Simpan Jurnal Membaca
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
