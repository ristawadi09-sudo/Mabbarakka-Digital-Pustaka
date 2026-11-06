import React, { useState } from 'react';
import { 
  X, 
  BookPlus, 
  Sparkles, 
  Image as ImageIcon, 
  FileText, 
  Plus, 
  Trash2, 
  Check, 
  Layers, 
  Compass, 
  BookOpen,
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import { DigitalBook, BookCategory, BOOK_CATEGORIES } from '../../types/library';

interface AddDigitalBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddDigitalBook: (newBook: DigitalBook) => void;
}

const CATEGORIES: BookCategory[] = BOOK_CATEGORIES;

const CURRICULUM_PRESETS = [
  'Kurikulum Merdeka',
  'Muatan Lokal SMPN 5 Bulukumba',
  'Modul Ajar Digital',
  'Asesmen Kompetensi (AKM)',
  'Buku Pengayaan Remaja',
  'Gerakan Literasi Sekolah (GLS)',
];

const COVER_PRESETS = [
  {
    name: 'Maritim Bulukumba',
    url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=400&q=80',
  },
  {
    name: 'Buku & Literasi',
    url: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=400&q=80',
  },
  {
    name: 'Sains & Alam Nusantara',
    url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=400&q=80',
  },
  {
    name: 'Sejarah & Budaya',
    url: 'https://images.unsplash.com/photo-1461360370896-922624d12aa1?auto=format&fit=crop&w=400&q=80',
  },
  {
    name: 'Teknologi & Masa Depan',
    url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=400&q=80',
  },
];

export const AddDigitalBookModal: React.FC<AddDigitalBookModalProps> = ({
  isOpen,
  onClose,
  onAddDigitalBook,
}) => {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [category, setCategory] = useState<BookCategory>('Karya Umum');
  const [curriculum, setCurriculum] = useState('Kurikulum Merdeka');
  const [totalPages, setTotalPages] = useState<number>(84);
  const [fileSize, setFileSize] = useState('3.8 MB (PDF & E-Pub Interaktif)');
  const [coverUrl, setCoverUrl] = useState(COVER_PRESETS[0].url);
  const [downloadUrl, setDownloadUrl] = useState('');
  const [description, setDescription] = useState('');
  const [activeTab, setActiveTab] = useState<'info' | 'chapters'>('info');

  // Chapters list
  const [chapters, setChapters] = useState<Array<{ id: number; title: string; text: string }>>([
    {
      id: 1,
      title: 'Bab 1: Pendahuluan dan Latar Belakang Materi',
      text: 'Selamat datang dalam modul pembelajaran e-book perpustakaan MABBARAKKA SMP Negeri 5 Bulukumba. Di dalam bab pembuka ini, peserta didik akan mempelajari pokok pemikiran utama serta konsep dasar yang menjadi landasan pembelajaran.',
    },
    {
      id: 2,
      title: 'Bab 2: Pokok Bahasan & Pendalaman Konsep',
      text: 'Pada bab ini diuraikan pembahasan komprehensif, studi kasus kontekstual di wilayah Kabupaten Bulukumba dan Sulawesi Selatan, serta aplikasi praktis dalam kehidupan sehari-hari.',
    },
  ]);

  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddChapter = () => {
    const nextId = chapters.length > 0 ? Math.max(...chapters.map(c => c.id)) + 1 : 1;
    setChapters([
      ...chapters,
      {
        id: nextId,
        title: `Bab ${chapters.length + 1}: Judul Pokok Bahasan Baru`,
        text: '',
      },
    ]);
  };

  const handleUpdateChapter = (id: number, field: 'title' | 'text', value: string) => {
    setChapters(chapters.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const handleRemoveChapter = (id: number) => {
    if (chapters.length <= 1) return;
    setChapters(chapters.filter(c => c.id !== id));
  };

  // Helper to auto-populate sample chapters
  const handleAutoFillSampleChapters = () => {
    const bookTitle = title || 'Materi Literasi Mandiri SMPN 5 Bulukumba';
    setChapters([
      {
        id: 1,
        title: `Bab 1: Pengantar ${bookTitle}`,
        text: `E-Book ini dipersembahkan untuk seluruh civitas akademika SMP Negeri 5 Bulukumba sebagai bahan pengayaan literasi digital.\n\nDalam bab pengantar ini, pembaca diajak memahami urgensi penguasaan kompetensi di bidang ${category}. Mengintegrasikan semangat kearifan lokal Butta Panrita Lopi dengan wawasan global abad 21 menjadi pilar utama dalam modul ini.`,
      },
      {
        id: 2,
        title: 'Bab 2: Konsep Inti & Pembelajaran Kontekstual',
        text: `Materi pada bagian ini menguraikan langkah-langkah sistematis dalam mempelajari konsep secara mendalam.\n\n1. Pemahaman Konseptual: Mengidentifikasi elemen penting dan keterkaitannya dengan lingkungan sekitar.\n2. Analisis Kasus Nyata: Mengamati implementasi nilai-nilai di Bulukumba dan Nusantara.\n3. Diskusi & Refleksi: Mendorong peserta didik mencatat refleksi membaca melalui menu Jurnal Membaca.`,
      },
      {
        id: 3,
        title: 'Bab 3: Rangkuman, Evaluasi Diri & Penutup',
        text: `Melalui pembelajaran ini, diharapkan peserta didik tidak hanya menguasai teori, melainkan mampu mengaplikasikan pemikiran kritis dan karakter profil pelajar Pancasila yang tangguh, mandiri, dan berakhlak mulia.`,
      },
    ]);
    if (!description) {
      setDescription(`E-Book digital pengayaan literasi ${category} untuk siswa dan guru SMP Negeri 5 Bulukumba. Dilengkapi bab interaktif dan catatan refleksi jurnal membaca.`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Mohon masukkan Judul E-Book');
      setActiveTab('info');
      return;
    }
    if (!author.trim()) {
      setError('Mohon masukkan Penulis atau Tim Penyusun');
      setActiveTab('info');
      return;
    }

    const validChapters = chapters.filter(c => c.title.trim() || c.text.trim());
    const finalChapters = validChapters.length > 0 
      ? validChapters.map((c, i) => ({
          id: i + 1,
          title: c.title.trim() || `Bab ${i + 1}`,
          text: c.text.trim() || description.trim() || 'Konten bab sedang dalam proses penyusunan.',
        }))
      : [
          {
            id: 1,
            title: 'Bab 1: Ikhtisar Buku',
            text: description.trim() || `Konten bacaan e-book ${title.trim()} karya ${author.trim()}.`,
          },
        ];

    const newDigitalBook: DigitalBook = {
      id: `dig-${Date.now()}`,
      title: title.trim(),
      author: author.trim(),
      category: category,
      curriculum: curriculum.trim() || undefined,
      description: description.trim() || `E-book koleksi digital perpustakaan MABBARAKKA SMPN 5 Bulukumba bidang ${category}.`,
      coverUrl: coverUrl.trim() || COVER_PRESETS[0].url,
      fileSize: fileSize.trim() || '2.5 MB (PDF Interaktif)',
      totalPages: Number(totalPages) > 0 ? Number(totalPages) : 50,
      readCount: 0,
      rating: 5.0,
      downloadUrl: downloadUrl.trim() || undefined,
      content: {
        chapters: finalChapters,
      },
    };

    onAddDigitalBook(newDigitalBook);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-3xl overflow-hidden my-auto max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 bg-gradient-to-r from-teal-700 via-teal-600 to-emerald-600 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20">
              <BookPlus className="w-5 h-5 text-teal-100" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold tracking-tight">
                Tambah Judul E-Book Digital Baru
              </h2>
              <p className="text-xs text-teal-100/90 font-medium">
                Koleksi E-Perpus MABBARAKKA SMP Negeri 5 Bulukumba
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="px-6 pt-3 pb-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('info')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'info'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              1. Informasi & Berkas E-Book
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('chapters')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'chapters'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>2. Bab & Konten E-Reader ({chapters.length} Bab)</span>
            </button>
          </div>

          {activeTab === 'chapters' && (
            <button
              type="button"
              onClick={handleAutoFillSampleChapters}
              className="text-[11px] font-semibold text-teal-700 hover:text-teal-900 bg-teal-100/70 hover:bg-teal-100 px-2.5 py-1 rounded-lg border border-teal-200 flex items-center gap-1 transition-colors"
              title="Isi draf materi otomatis untuk pengujian cepat"
            >
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              <span className="hidden sm:inline">Isi Contoh Teks Otomatis</span>
              <span className="sm:hidden">Contoh Teks</span>
            </button>
          )}
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mx-6 mt-3 px-3 py-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-rose-500 hover:text-rose-700 font-bold ml-2">
              &times;
            </button>
          </div>
        )}

        {/* Scrollable Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {activeTab === 'info' ? (
            <div className="space-y-4">
              
              {/* Title & Author */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Judul E-Book / Modul Digital <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Modul Kearifan Lokal & Budaya Maritim Bulukumba"
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      if (error) setError(null);
                    }}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 text-slate-800 font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Penulis / Tim Penyusun <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Tim Literasi SMPN 5 Bulukumba"
                    value={author}
                    onChange={(e) => {
                      setAuthor(e.target.value);
                      if (error) setError(null);
                    }}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 text-slate-800"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Kategori Buku Digital <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as BookCategory)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 text-slate-800 bg-white font-medium"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Curriculum & Pages & Size */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5 sm:col-span-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Kurikulum / Label
                  </label>
                  <input
                    type="text"
                    placeholder="Kurikulum Merdeka"
                    value={curriculum}
                    onChange={(e) => setCurriculum(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-teal-500 text-slate-800"
                  />
                  {/* Quick pills */}
                  <div className="flex flex-wrap gap-1 pt-1">
                    {CURRICULUM_PRESETS.slice(0, 3).map((cp) => (
                      <button
                        key={cp}
                        type="button"
                        onClick={() => setCurriculum(cp)}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                      >
                        {cp}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Jumlah Halaman
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={totalPages}
                    onChange={(e) => setTotalPages(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-teal-500 text-slate-800"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Ukuran & Format Berkas
                  </label>
                  <input
                    type="text"
                    value={fileSize}
                    onChange={(e) => setFileSize(e.target.value)}
                    placeholder="3.5 MB (PDF & E-Pub)"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-teal-500 text-slate-800"
                  />
                </div>
              </div>

              {/* Cover Image URL & Presets */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-teal-600" />
                    <span>Gambar Sampul (Cover URL)</span>
                  </label>
                  <span className="text-[11px] text-slate-400">Pilih preset atau masukkan link gambar</span>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-16 h-24 rounded-xl overflow-hidden border border-slate-200 shrink-0 bg-slate-100 shadow-sm relative">
                    <img
                      src={coverUrl || COVER_PRESETS[0].url}
                      alt="Preview Cover"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = COVER_PRESETS[0].url;
                      }}
                    />
                  </div>

                  <div className="flex-1 space-y-2">
                    <input
                      type="url"
                      placeholder="https://..."
                      value={coverUrl}
                      onChange={(e) => setCoverUrl(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-teal-500 text-slate-800 font-mono text-[11px]"
                    />

                    {/* Presets */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] text-slate-400 font-semibold mr-1">Preset Cepat:</span>
                      {COVER_PRESETS.map((preset) => (
                        <button
                          key={preset.name}
                          type="button"
                          onClick={() => setCoverUrl(preset.url)}
                          className={`text-[10px] px-2 py-1 rounded-lg border transition-all ${
                            coverUrl === preset.url
                              ? 'bg-teal-50 border-teal-500 text-teal-800 font-bold'
                              : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'
                          }`}
                        >
                          {preset.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Download URL / External Link */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                  <span>Tautan Unduh Dokumen Asli / Google Drive (Opsional)</span>
                </label>
                <input
                  type="url"
                  placeholder="https://drive.google.com/... atau link berkas PDF"
                  value={downloadUrl}
                  onChange={(e) => setDownloadUrl(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-teal-500 text-slate-800"
                />
              </div>

              {/* Description / Synopsis */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Sinopsis / Ringkasan E-Book
                </label>
                <textarea
                  rows={3}
                  placeholder="Deskripsikan garis besar isi e-book, capaian kompetensi, dan manfaatnya bagi siswa..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-teal-500 text-slate-800 leading-relaxed"
                />
              </div>

            </div>
          ) : (
            /* Chapters & Reader Content Tab */
            <div className="space-y-4">
              <div className="p-3 bg-teal-50 rounded-2xl border border-teal-200 flex items-start gap-3">
                <BookOpen className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                <div className="text-xs text-teal-900 leading-relaxed">
                  <p className="font-bold">E-Reader Interaktif Terintegrasi</p>
                  <p className="text-teal-700 text-[11px] mt-0.5">
                    Siswa dan guru dapat langsung membaca bab-bab materi ini di layar tanpa perlu aplikasi pihak ketiga. Masukkan judul bab dan teks bacaan di bawah ini.
                  </p>
                </div>
              </div>

              {/* Chapters list */}
              <div className="space-y-4">
                {chapters.map((chap, idx) => (
                  <div
                    key={chap.id}
                    className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-2.5 relative group hover:border-teal-300 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 flex-1">
                        <span className="w-6 h-6 rounded-lg bg-teal-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <input
                          type="text"
                          value={chap.title}
                          onChange={(e) => handleUpdateChapter(chap.id, 'title', e.target.value)}
                          placeholder={`Judul Bab ${idx + 1}...`}
                          className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-teal-500 bg-white font-bold text-slate-800"
                        />
                      </div>

                      {chapters.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveChapter(chap.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Hapus Bab Ini"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[11px] font-semibold text-slate-500">
                        Isi Materi Bacaan Bab {idx + 1}
                      </label>
                      <textarea
                        rows={4}
                        value={chap.text}
                        onChange={(e) => handleUpdateChapter(chap.id, 'text', e.target.value)}
                        placeholder={`Tulis atau tempelkan narasi, artikel, atau materi modul untuk Bab ${idx + 1}...`}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-teal-500 bg-white text-slate-800 leading-relaxed font-sans"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Chapter Button */}
              <button
                type="button"
                onClick={handleAddChapter}
                className="w-full py-2.5 px-4 rounded-2xl border-2 border-dashed border-teal-300 hover:border-teal-500 bg-teal-50/50 hover:bg-teal-50 text-teal-700 font-bold text-xs flex items-center justify-center gap-2 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>+ Tambah Bab Selanjutnya</span>
              </button>
            </div>
          )}

          {/* Modal Action Footer */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-[11px] text-slate-400">
              {activeTab === 'info' ? (
                <span>Langkah 1 dari 2 &bull; Lengkapi detail buku digital</span>
              ) : (
                <span>Langkah 2 dari 2 &bull; Siap dibaca langsung di e-Reader</span>
              )}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold text-xs transition-colors"
              >
                Batal
              </button>

              {activeTab === 'info' ? (
                <button
                  type="button"
                  onClick={() => {
                    if (!title.trim()) {
                      setError('Mohon masukkan Judul E-Book terlebih dahulu');
                      return;
                    }
                    if (!author.trim()) {
                      setError('Mohon masukkan Penulis terlebih dahulu');
                      return;
                    }
                    setError(null);
                    setActiveTab('chapters');
                  }}
                  className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-md shadow-teal-700/20 transition-all flex items-center justify-center gap-1.5"
                >
                  <span>Lanjut ke Isi Bab</span>
                  <BookOpen className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="submit"
                  className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-700/20 transition-all flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Simpan E-Book ke Koleksi</span>
                </button>
              )}
            </div>
          </div>
        </form>

      </div>
    </div>
  );
};
