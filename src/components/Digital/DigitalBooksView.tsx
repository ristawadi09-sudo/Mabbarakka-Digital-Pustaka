import React, { useState } from 'react';
import { 
  FileText, 
  BookOpen, 
  Star, 
  Eye, 
  Search, 
  Download, 
  Sparkles, 
  CheckCircle, 
  BookOpenText,
  BookmarkPlus,
  Plus,
  Trash2,
  ExternalLink,
  BookX,
  Upload
} from 'lucide-react';
import { DigitalBook, BookCategory, AppRole, BOOK_CATEGORIES } from '../../types/library';
import { EbookReaderModal } from './EbookReaderModal';
import { AddDigitalBookModal } from './AddDigitalBookModal';
import { exportDigitalBooksToCSV, downloadCSVFile, parseDigitalBooksCSV } from '../../utils/csvHelper';
import { sounds } from '../../utils/audio';

interface DigitalBooksViewProps {
  digitalBooks: DigitalBook[];
  onOpenJournalForBook: (book: DigitalBook) => void;
  onAddDigitalBook: (newBook: DigitalBook) => void;
  onDeleteDigitalBook?: (bookId: string) => void;
  onAddDigitalBooksBatch?: (newDigitalBooks: DigitalBook[], mode?: 'merge' | 'replace') => void;
  currentRole?: AppRole;
}

export const DigitalBooksView: React.FC<DigitalBooksViewProps> = ({
  digitalBooks,
  onOpenJournalForBook,
  onAddDigitalBook,
  onDeleteDigitalBook,
  onAddDigitalBooksBatch,
  currentRole = 'admin',
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [activeReadingBook, setActiveReadingBook] = useState<DigitalBook | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [bookToDelete, setBookToDelete] = useState<DigitalBook | null>(null);

  const categories: string[] = [
    'Semua',
    ...BOOK_CATEGORIES
  ];

  const filtered = digitalBooks.filter((b) => {
    const q = searchTerm.toLowerCase();
    const matchQuery = 
      !q || 
      b.title.toLowerCase().includes(q) || 
      b.author.toLowerCase().includes(q) || 
      b.description.toLowerCase().includes(q) ||
      (b.curriculum && b.curriculum.toLowerCase().includes(q));
    const matchCat = selectedCategory === 'Semua' || b.category === selectedCategory;
    return matchQuery && matchCat;
  });

  const handleConfirmDelete = () => {
    if (bookToDelete && onDeleteDigitalBook) {
      onDeleteDigitalBook(bookToDelete.id);
      setBookToDelete(null);
    }
  };

  const handleExportCSV = () => {
    const csv = exportDigitalBooksToCSV(digitalBooks);
    const dateStr = new Date().toISOString().split('T')[0];
    downloadCSVFile(csv, `koleksi_buku_digital_smpn5_${dateStr}.csv`);
    sounds.playSuccessChime();
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      if (content) {
        const parsed = parseDigitalBooksCSV(content);
        if (parsed.length > 0 && onAddDigitalBooksBatch) {
          onAddDigitalBooksBatch(parsed);
          alert(`Berhasil mengimpor ${parsed.length} judul e-book digital ke koleksi!`);
        } else {
          alert('Format berkas CSV tidak memiliki baris e-book yang valid.');
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800">
              Koleksi Digital (E-Perpus)
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-100 text-teal-800 border border-teal-300">
              {digitalBooks.length} E-Book & Modul
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Akses ribuan materi pengayaan digital, modul Kurikulum Merdeka, dan cerita daerah Bulukumba kapan saja
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
            title="Unduh seluruh daftar e-book dalam format CSV / Excel"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>Ekspor CSV</span>
          </button>

          {currentRole === 'admin' && onAddDigitalBooksBatch && (
            <label className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors cursor-pointer" title="Impor daftar e-book dari file CSV">
              <Upload className="w-3.5 h-3.5 text-slate-600" />
              <span>Impor CSV</span>
              <input
                type="file"
                accept=".csv"
                onChange={handleImportCSV}
                className="hidden"
              />
            </label>
          )}

          {currentRole === 'admin' && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-md shadow-teal-700/20 hover:shadow-lg transition-all active:scale-95"
              title="Tambah Judul E-Book Digital Baru"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Tambah Judul E-Book Digital Baru</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Cari materi e-book, kurikulum, modul, atau penulis..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-teal-500 text-slate-800"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto scrollbar-none text-xs">
            {categories.map((cat, i) => (
              <button
                key={i}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl font-medium shrink-0 transition-all ${
                  selectedCategory === cat
                    ? 'bg-teal-600 text-white font-bold shadow-sm'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Digital Book Cards */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-5">
          {filtered.map((book) => (
            <div
              key={book.id}
              className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm hover:border-teal-400 hover:shadow-lg transition-all flex flex-col justify-between group relative"
            >
              <div>
                <div className="flex items-start gap-4">
                  <div className="w-24 sm:w-28 h-36 rounded-2xl overflow-hidden shrink-0 shadow-md relative bg-slate-100">
                    <img
                      src={book.coverUrl || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=400&q=80'}
                      alt={book.title}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=400&q=80';
                      }}
                    />
                    <div className="absolute top-1.5 left-1.5 bg-teal-900/90 text-teal-200 text-[9px] font-bold px-1.5 py-0.5 rounded backdrop-blur-sm">
                      E-Book
                    </div>
                  </div>

                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200 truncate max-w-[180px]">
                          {book.category}
                        </span>
                        {book.curriculum && (
                          <span className="hidden sm:inline-block px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 truncate max-w-[150px]">
                            {book.curriculum}
                          </span>
                        )}
                      </div>

                      {currentRole === 'admin' && onDeleteDigitalBook && (
                        <button
                          onClick={() => setBookToDelete(book)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                          title="Hapus E-Book"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <h3 className="font-extrabold text-slate-800 text-sm sm:text-base leading-snug line-clamp-2">
                      {book.title}
                    </h3>

                    <p className="text-xs text-slate-500 font-medium">
                      {book.author}
                    </p>

                    <div className="flex items-center gap-3 text-xs pt-1">
                      <div className="flex items-center gap-1 text-amber-500 font-bold">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        <span>{book.rating ? book.rating.toFixed(1) : '5.0'}</span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-400 text-[11px]">
                        <Eye className="w-3.5 h-3.5 text-teal-600" />
                        <span>{book.readCount || 0} kali dibaca</span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {book.totalPages || 0} Hal &bull; {book.fileSize || 'PDF'}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-600 mt-3 line-clamp-2 leading-relaxed">
                  {book.description}
                </p>
              </div>

              {/* Actions */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => onOpenJournalForBook(book)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
                  title="Tulis catatan di Jurnal Membaca"
                >
                  <BookOpenText className="w-3.5 h-3.5 text-teal-600" />
                  <span className="hidden sm:inline">Jurnal Buku</span>
                </button>

                {book.downloadUrl && (
                  <a
                    href={book.downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-2.5 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-700 text-xs font-semibold transition-colors border border-teal-200"
                    title="Unduh / Buka Dokumen Asli"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">Unduh</span>
                  </a>
                )}

                <button
                  onClick={() => setActiveReadingBook(book)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-4 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-md shadow-teal-700/20 transition-all active:scale-95"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Baca E-Book Sekarang</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-sm space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto border border-teal-100">
            <BookX className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="font-extrabold text-slate-800 text-base">
              Tidak Ada E-Book yang Ditemukan
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              {searchTerm || selectedCategory !== 'Semua'
                ? 'Tidak ada koleksi e-book yang cocok dengan filter atau kata kunci pencarian Anda.'
                : 'Belum ada judul e-book digital dalam perpustakaan. Klik tombol di bawah untuk menambahkan sekarang.'}
            </p>
          </div>
          <div className="pt-2 flex items-center justify-center gap-3">
            {(searchTerm || selectedCategory !== 'Semua') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('Semua');
                }}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-100 font-semibold text-xs transition-colors"
              >
                Reset Filter
              </button>
            )}
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-md shadow-teal-700/20 transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Judul E-Book Digital Baru</span>
            </button>
          </div>
        </div>
      )}

      {/* Reader Modal */}
      {activeReadingBook && (
        <EbookReaderModal
          book={activeReadingBook}
          onClose={() => setActiveReadingBook(null)}
          onOpenJournalForBook={(book) => {
            setActiveReadingBook(null);
            onOpenJournalForBook(book);
          }}
        />
      )}

      {/* Add Digital Book Modal */}
      <AddDigitalBookModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddDigitalBook={onAddDigitalBook}
      />

      {/* Delete Confirmation Modal */}
      {bookToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-800 text-base">
                Hapus E-Book dari Koleksi?
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Apakah Anda yakin ingin menghapus e-book <span className="font-bold text-slate-700">"{bookToDelete.title}"</span>? Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setBookToDelete(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold text-xs transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md shadow-rose-700/20 transition-all"
              >
                Ya, Hapus E-Book
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
