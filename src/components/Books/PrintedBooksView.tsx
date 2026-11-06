import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  BookMarked, 
  BookmarkCheck, 
  Tag, 
  MapPin, 
  Printer, 
  X, 
  Check, 
  Sparkles,
  Barcode as BarcodeIcon,
  ArrowUpDown,
  Download,
  Upload
} from 'lucide-react';
import { Book, BookCategory, AppRole, BOOK_CATEGORIES } from '../../types/library';
import { BarcodeVisual } from '../Shared/BarcodeVisual';
import { exportBooksToCSV, downloadCSVFile, parseBooksCSV } from '../../utils/csvHelper';
import { sounds } from '../../utils/audio';

interface PrintedBooksViewProps {
  books: Book[];
  onAddBook: (newBook: Book) => void;
  onSelectBookToBorrow: (book: Book) => void;
  onAddBooksBatch?: (newBooks: Book[], mode?: 'merge' | 'replace') => void;
  currentRole?: AppRole;
}

export const PrintedBooksView: React.FC<PrintedBooksViewProps> = ({
  books,
  onAddBook,
  onSelectBookToBorrow,
  onAddBooksBatch,
  currentRole = 'admin',
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [selectedAuthor, setSelectedAuthor] = useState<string>('Semua');
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'available' | 'borrowed'>('all');
  const [sortBy, setSortBy] = useState<'title' | 'popular' | 'newest'>('title');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedBookForLabel, setSelectedBookForLabel] = useState<Book | null>(null);

  // Form State for Add Book
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    publisher: '',
    year: 2026,
    isbn: '',
    category: 'Mata Pelajaran' as BookCategory,
    rackLocation: 'Rak A-01',
    totalCopies: 5,
    pages: 200,
    language: 'Bahasa Indonesia',
    description: '',
    coverUrl: '',
  });

  // Extract unique authors
  const uniqueAuthors = useMemo(() => {
    const set = new Set<string>();
    books.forEach(b => set.add(b.author));
    return Array.from(set).sort();
  }, [books]);

  // Categories list
  const categories: (string | BookCategory)[] = [
    'Semua',
    ...BOOK_CATEGORIES
  ];

  // Filtering logic
  const filteredBooks = useMemo(() => {
    return books.filter((b) => {
      // Search text (title, author, isbn, barcode, rack)
      const q = searchTerm.toLowerCase();
      const matchQuery = 
        !q ||
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        b.isbn.toLowerCase().includes(q) ||
        b.barcode.toLowerCase().includes(q) ||
        b.rackLocation.toLowerCase().includes(q);

      // Category filter
      const matchCat = selectedCategory === 'Semua' || b.category === selectedCategory;

      // Author filter
      const matchAuthor = selectedAuthor === 'Semua' || b.author === selectedAuthor;

      // Availability filter
      let matchAvail = true;
      if (availabilityFilter === 'available') matchAvail = b.availableCopies > 0;
      if (availabilityFilter === 'borrowed') matchAvail = b.availableCopies < b.totalCopies;

      return matchQuery && matchCat && matchAuthor && matchAvail;
    }).sort((a, b) => {
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      if (sortBy === 'newest') return b.year - a.year;
      return b.totalCopies - a.totalCopies;
    });
  }, [books, searchTerm, selectedCategory, selectedAuthor, availabilityFilter, sortBy]);

  const handleCreateBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.author) return;

    const nextIdNum = books.length + 1;
    const padded = String(nextIdNum).padStart(3, '0');
    const newBook: Book = {
      id: `b-${Date.now()}`,
      barcode: `SMP5-BK-${padded}`,
      isbn: formData.isbn || `978-602-00-${Math.floor(1000 + Math.random() * 9000)}-1`,
      title: formData.title,
      author: formData.author,
      publisher: formData.publisher || 'SMPN 5 Bulukumba Press',
      year: Number(formData.year) || 2026,
      category: formData.category,
      rackLocation: formData.rackLocation,
      totalCopies: Number(formData.totalCopies) || 1,
      availableCopies: Number(formData.totalCopies) || 1,
      description: formData.description || 'Koleksi buku perpustakaan SMP Negeri 5 Bulukumba.',
      coverUrl: formData.coverUrl || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=400&q=80',
      language: formData.language,
      pages: Number(formData.pages) || 150,
      addedDate: new Date().toISOString().split('T')[0],
    };

    onAddBook(newBook);
    setIsAddModalOpen(false);
    // Reset form
    setFormData({
      title: '',
      author: '',
      publisher: '',
      year: 2026,
      isbn: '',
      category: 'Mata Pelajaran',
      rackLocation: 'Rak A-01',
      totalCopies: 5,
      pages: 200,
      language: 'Bahasa Indonesia',
      description: '',
      coverUrl: '',
    });
  };

  const handleExportCSV = () => {
    const csv = exportBooksToCSV(books);
    const dateStr = new Date().toISOString().split('T')[0];
    downloadCSVFile(csv, `koleksi_buku_cetak_smpn5_${dateStr}.csv`);
    sounds.playSuccessChime();
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      if (content) {
        const parsed = parseBooksCSV(content);
        if (parsed.length > 0 && onAddBooksBatch) {
          onAddBooksBatch(parsed, 'merge');
          alert(`Berhasil mengimpor ${parsed.length} buku cetak ke perpustakaan!`);
        } else {
          alert('Format berkas CSV tidak memiliki baris buku yang valid.');
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800">
              Koleksi Buku Cetak (Fisik)
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
              {filteredBooks.length} Judul
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Katalog lengkap buku cetak, nomor rak perpustakaan, kode barcode, dan ketersediaan stok
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
            title="Unduh seluruh daftar buku cetak dalam format CSV / Excel"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>Ekspor CSV</span>
          </button>

          {currentRole === 'admin' && onAddBooksBatch && (
            <label className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors cursor-pointer" title="Impor daftar buku cetak dari file CSV">
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
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-700/20 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Judul Buku Baru</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          
          {/* Main Search Input */}
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Cari judul buku, penulis, ISBN, barcode (SMP5-BK-...)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-slate-800"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filter Penulis */}
          <div className="md:col-span-3">
            <select
              value={selectedAuthor}
              onChange={(e) => setSelectedAuthor(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 text-slate-700 bg-white"
            >
              <option value="Semua">Semua Penulis ({uniqueAuthors.length})</option>
              {uniqueAuthors.map((author, i) => (
                <option key={i} value={author}>{author}</option>
              ))}
            </select>
          </div>

          {/* Filter Status Ketersediaan */}
          <div className="md:col-span-2">
            <select
              value={availabilityFilter}
              onChange={(e) => setAvailabilityFilter(e.target.value as any)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 text-slate-700 bg-white"
            >
              <option value="all">Status: Semua</option>
              <option value="available">Tersedia Saja</option>
              <option value="borrowed">Sedang Dipinjam</option>
            </select>
          </div>

          {/* Urutan Sort */}
          <div className="md:col-span-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 text-slate-700 bg-white"
            >
              <option value="title">Urut: Judul A-Z</option>
              <option value="newest">Tahun Terbit</option>
              <option value="popular">Jumlah Eksemplar</option>
            </select>
          </div>

        </div>

        {/* Category Horizontal Filter Badges */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 scrollbar-none text-xs">
          <span className="text-[11px] font-bold text-slate-400 shrink-0 mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Kategori:
          </span>
          {categories.map((cat, i) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={i}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl font-medium shrink-0 transition-all ${
                  isSelected
                    ? 'bg-emerald-600 text-white font-bold shadow-sm'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Book Grid Cards */}
      {filteredBooks.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <BookMarked className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-700 text-base">Tidak Ada Buku yang Cocok</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Coba ubah kata kunci pencarian, filter kategori, atau reset filter ketersediaan.
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedCategory('Semua');
              setSelectedAuthor('Semua');
              setAvailabilityFilter('all');
            }}
            className="mt-4 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700"
          >
            Reset Semua Filter
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredBooks.map((book) => {
            const isAvailable = book.availableCopies > 0;

            return (
              <div
                key={book.id}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:border-emerald-300 hover:shadow-lg transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Top Cover Banner */}
                  <div className="relative h-44 overflow-hidden bg-slate-100">
                    <img
                      src={book.coverUrl || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=400&q=80'}
                      alt={book.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent"></div>

                    {/* Category Pill */}
                    <div className="absolute top-2.5 left-2.5">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-900/80 text-emerald-300 backdrop-blur-md border border-slate-700">
                        {book.category}
                      </span>
                    </div>

                    {/* Stock Status Badge */}
                    <div className="absolute top-2.5 right-2.5">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold backdrop-blur-md border ${
                        isAvailable 
                          ? 'bg-emerald-900/80 text-emerald-200 border-emerald-500/40' 
                          : 'bg-rose-900/80 text-rose-200 border-rose-500/40'
                      }`}>
                        {isAvailable ? `${book.availableCopies} Tersedia` : 'Sedang Habis'}
                      </span>
                    </div>

                    {/* Barcode Overlay on bottom of image */}
                    <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between text-white text-[11px] font-mono">
                      <span className="bg-black/60 px-2 py-0.5 rounded backdrop-blur-sm">
                        {book.barcode}
                      </span>
                      <span className="text-[10px] text-slate-300">
                        {book.year} &bull; {book.pages} Hal
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 space-y-2.5">
                    <h3 className="font-bold text-slate-800 text-sm leading-snug line-clamp-2 group-hover:text-emerald-700 transition-colors" title={book.title}>
                      {book.title}
                    </h3>
                    
                    <p className="text-xs text-slate-500 font-medium">
                      Oleh: <span className="text-slate-700">{book.author}</span>
                    </p>

                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 bg-slate-50 p-2 rounded-xl border border-slate-100">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="truncate font-semibold text-slate-700">{book.rackLocation}</span>
                    </div>

                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                      {book.description}
                    </p>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="p-4 pt-0">
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    
                    {/* View Barcode / Label button */}
                    <button
                      onClick={() => setSelectedBookForLabel(book)}
                      title="Lihat & Cetak Label Barcode Buku"
                      className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                    >
                      <BarcodeIcon className="w-4 h-4" />
                    </button>

                    {/* Role-tailored action button */}
                    {currentRole === 'admin' ? (
                      <button
                        onClick={() => onSelectBookToBorrow(book)}
                        disabled={!isAvailable}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                          isAvailable
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-700/20'
                            : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        <BookmarkCheck className="w-3.5 h-3.5" />
                        <span>{isAvailable ? 'Pinjam Sekarang' : 'Tidak Tersedia'}</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => setSelectedBookForLabel(book)}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                          isAvailable
                            ? 'bg-teal-600 hover:bg-teal-500 text-white shadow-md shadow-teal-700/20'
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        }`}
                      >
                        <BarcodeIcon className="w-3.5 h-3.5" />
                        <span>{isAvailable ? 'Cek Barcode & Rak' : 'Info Ketersediaan'}</span>
                      </button>
                    )}

                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Add Book */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-xl rounded-3xl p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">Tambah Koleksi Buku Fisik</h3>
                  <p className="text-xs text-slate-500">Katalogisasi perpustakaan SMP Negeri 5 Bulukumba</p>
                </div>
              </div>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBook} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Judul Buku *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Sang Penjelajah Butta Panrita Lopi"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-emerald-500 text-slate-800"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nama Penulis / Pengarang *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Andrea Hirata / Tim MGMP"
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-emerald-500 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Penerbit</label>
                  <input
                    type="text"
                    placeholder="Contoh: Gramedia / Erlangga / Panrita Press"
                    value={formData.publisher}
                    onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-emerald-500 text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tahun Terbit</label>
                  <input
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-emerald-500 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Jumlah Eksemplar</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.totalCopies}
                    onChange={(e) => setFormData({ ...formData, totalCopies: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-emerald-500 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Jumlah Halaman</label>
                  <input
                    type="number"
                    value={formData.pages}
                    onChange={(e) => setFormData({ ...formData, pages: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-emerald-500 text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kategori Buku</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as BookCategory })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-emerald-500 text-slate-800 bg-white"
                  >
                    {categories.filter(c => c !== 'Semua').map((c, i) => (
                      <option key={i} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Lokasi Rak Simpan</label>
                  <input
                    type="text"
                    placeholder="Contoh: Rak C-02 (Budaya Lokal)"
                    value={formData.rackLocation}
                    onChange={(e) => setFormData({ ...formData, rackLocation: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-emerald-500 text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nomor ISBN</label>
                <input
                  type="text"
                  placeholder="Contoh: 978-602-03-3295-6"
                  value={formData.isbn}
                  onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-emerald-500 text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Deskripsi Singkat / Sinopsis</label>
                <textarea
                  rows={2}
                  placeholder="Ringkasan isi buku atau catatan kurikulum..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-emerald-500 text-slate-800"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-100 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-md transition-all active:scale-95"
                >
                  Simpan ke Katalog
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Barcode Label Preview & Print */}
      {selectedBookForLabel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <BarcodeIcon className="w-4 h-4 text-emerald-600" />
                <span>Label Barcode Perpustakaan</span>
              </h3>
              <button 
                onClick={() => setSelectedBookForLabel(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Label Card */}
            <div className="my-5 p-4 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 text-center space-y-2">
              <p className="font-extrabold text-[11px] tracking-wider text-emerald-800 uppercase">
                PERPUSTAKAAN MABBARAKKA
              </p>
              <p className="text-[10px] font-semibold text-slate-600">
                SMP NEGERI 5 BULUKUMBA
              </p>

              <div className="py-2 flex justify-center">
                <BarcodeVisual code={selectedBookForLabel.barcode} height={52} />
              </div>

              <div className="pt-2 border-t border-slate-200 text-xs">
                <p className="font-bold text-slate-800 truncate">{selectedBookForLabel.title}</p>
                <p className="text-[11px] text-slate-500">{selectedBookForLabel.rackLocation}</p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 text-xs">
              <button
                onClick={() => window.print()}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition-all"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Label Stiker</span>
              </button>
              <button
                onClick={() => setSelectedBookForLabel(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-100"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
