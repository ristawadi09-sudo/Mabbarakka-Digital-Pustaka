import React, { useState } from 'react';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  BookOpen, 
  Bookmark, 
  BookmarkCheck, 
  Type, 
  Sun, 
  Moon, 
  BookOpenText,
  List,
  Sparkles,
  Share2
} from 'lucide-react';
import { DigitalBook } from '../../types/library';

interface EbookReaderModalProps {
  book: DigitalBook;
  onClose: () => void;
  onOpenJournalForBook: (book: DigitalBook) => void;
}

export const EbookReaderModal: React.FC<EbookReaderModalProps> = ({
  book,
  onClose,
  onOpenJournalForBook,
}) => {
  const [currentChapterIdx, setCurrentChapterIdx] = useState(0);
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg' | 'xl'>('base');
  const [theme, setTheme] = useState<'light' | 'sepia' | 'dark'>('light');
  const [bookmarkedChapters, setBookmarkedChapters] = useState<number[]>([]);
  const [showToc, setShowToc] = useState(false);

  const chapters = (book.content && Array.isArray(book.content.chapters) && book.content.chapters.length > 0)
    ? book.content.chapters
    : [{ id: 1, title: 'Bab 1: Ikhtisar Buku', text: book.description || 'Konten bab belum ditambahkan.' }];
  const currentChapter = chapters[currentChapterIdx] || chapters[0];
  const isBookmarked = currentChapter ? bookmarkedChapters.includes(currentChapter.id) : false;

  const toggleBookmark = () => {
    if (!currentChapter) return;
    if (isBookmarked) {
      setBookmarkedChapters(bookmarkedChapters.filter(id => id !== currentChapter.id));
    } else {
      setBookmarkedChapters([...bookmarkedChapters, currentChapter.id]);
    }
  };

  const getFontSizeClass = () => {
    switch (fontSize) {
      case 'sm': return 'text-sm leading-relaxed';
      case 'base': return 'text-base leading-relaxed';
      case 'lg': return 'text-lg leading-loose';
      case 'xl': return 'text-xl leading-loose';
      default: return 'text-base leading-relaxed';
    }
  };

  const getThemeClass = () => {
    switch (theme) {
      case 'dark':
        return 'bg-slate-900 text-slate-200';
      case 'sepia':
        return 'bg-[#fcf8ed] text-[#433422] border-amber-200';
      default:
        return 'bg-white text-slate-800';
    }
  };

  const getHeaderThemeClass = () => {
    switch (theme) {
      case 'dark':
        return 'bg-slate-950 border-slate-800 text-slate-200';
      case 'sepia':
        return 'bg-[#f4ebd0] border-amber-200 text-[#433422]';
      default:
        return 'bg-slate-50 border-slate-200 text-slate-800';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-2 sm:p-4">
      <div className={`w-full max-w-4xl h-[92vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border transition-colors ${getThemeClass()}`}>
        
        {/* Reader Top Navigation Bar */}
        <div className={`px-4 sm:px-6 py-3 border-b flex items-center justify-between gap-3 shrink-0 ${getHeaderThemeClass()}`}>
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              onClick={() => setShowToc(!showToc)}
              className="p-1.5 rounded-lg hover:bg-black/10 transition-colors"
              title="Daftar Isi Bab"
            >
              <List className="w-5 h-5 text-emerald-600" />
            </button>
            <div className="truncate">
              <h3 className="font-bold text-xs sm:text-sm truncate">
                {book.title}
              </h3>
              <p className="text-[11px] opacity-70 truncate">
                {book.author} &bull; {book.curriculum || 'SMPN 5 Bulukumba'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            
            {/* Font Size Picker */}
            <div className="flex items-center bg-black/5 rounded-lg p-0.5">
              <button
                onClick={() => setFontSize('sm')}
                className={`px-2 py-1 text-xs font-bold rounded ${fontSize === 'sm' ? 'bg-white shadow text-emerald-700' : 'opacity-70'}`}
              >
                A-
              </button>
              <button
                onClick={() => setFontSize('base')}
                className={`px-2 py-1 text-xs font-bold rounded ${fontSize === 'base' ? 'bg-white shadow text-emerald-700' : 'opacity-70'}`}
              >
                A
              </button>
              <button
                onClick={() => setFontSize('lg')}
                className={`px-2 py-1 text-xs font-bold rounded ${fontSize === 'lg' ? 'bg-white shadow text-emerald-700' : 'opacity-70'}`}
              >
                A+
              </button>
            </div>

            {/* Reading Mode / Theme Toggle */}
            <div className="flex items-center bg-black/5 rounded-lg p-0.5">
              <button
                onClick={() => setTheme('light')}
                className={`p-1.5 rounded ${theme === 'light' ? 'bg-white shadow text-amber-600' : 'opacity-60'}`}
                title="Mode Terang"
              >
                <Sun className="w-4 h-4" />
              </button>
              <button
                onClick={() => setTheme('sepia')}
                className={`px-2 py-1 text-[11px] font-bold rounded ${theme === 'sepia' ? 'bg-[#e2d5b6] shadow text-amber-900' : 'opacity-60'}`}
                title="Mode Sepia (Nyaman Mata)"
              >
                Sepia
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`p-1.5 rounded ${theme === 'dark' ? 'bg-slate-800 text-yellow-300' : 'opacity-60'}`}
                title="Mode Gelap"
              >
                <Moon className="w-4 h-4" />
              </button>
            </div>

            {/* Bookmark button */}
            <button
              onClick={toggleBookmark}
              className={`p-2 rounded-lg transition-colors ${
                isBookmarked ? 'text-amber-500 bg-amber-500/10' : 'opacity-70 hover:opacity-100'
              }`}
              title={isBookmarked ? 'Ditandai' : 'Tandai Bab Ini'}
            >
              {isBookmarked ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg opacity-70 hover:opacity-100 hover:bg-black/10 transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>

          </div>
        </div>

        {/* Content Layout (TOC Drawer + Text Reader) */}
        <div className="flex-1 flex overflow-hidden relative">
          
          {/* Table of Contents Drawer */}
          {showToc && (
            <div className={`w-64 sm:w-72 border-r p-4 overflow-y-auto shrink-0 transition-all ${
              theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center justify-between pb-3 border-b mb-3">
                <span className="text-xs font-bold uppercase tracking-wider opacity-70">
                  Daftar Bab & Isi
                </span>
                <button onClick={() => setShowToc(false)} className="text-xs opacity-60 hover:opacity-100">
                  Tutup
                </button>
              </div>

              <div className="space-y-1">
                {chapters.map((ch, idx) => (
                  <button
                    key={ch.id}
                    onClick={() => {
                      setCurrentChapterIdx(idx);
                      setShowToc(false);
                    }}
                    className={`w-full text-left p-2.5 rounded-xl text-xs font-medium transition-all flex items-center justify-between ${
                      currentChapterIdx === idx
                        ? 'bg-emerald-600 text-white font-bold'
                        : 'opacity-80 hover:opacity-100 hover:bg-black/5'
                    }`}
                  >
                    <span className="truncate">{ch.title}</span>
                    {bookmarkedChapters.includes(ch.id) && (
                      <Bookmark className="w-3.5 h-3.5 text-amber-300 fill-current shrink-0 ml-1" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Main Reading Canvas */}
          <div className="flex-1 overflow-y-auto px-6 sm:px-16 py-8">
            <div className="max-w-2xl mx-auto space-y-6">
              
              {/* Chapter Header */}
              <div className="pb-4 border-b border-black/10">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">
                  Bagian {currentChapterIdx + 1} dari {chapters.length}
                </span>
                <h1 className="text-xl sm:text-2xl font-extrabold mt-1">
                  {currentChapter.title}
                </h1>
              </div>

              {/* Text content formatted */}
              <div className={`whitespace-pre-line font-serif ${getFontSizeClass()} opacity-95`}>
                {currentChapter.text}
              </div>

              {/* Action Banner to Journal */}
              <div className="mt-8 p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Selesai membaca bab ini? Catat refleksi dan kutipan favoritmu.</span>
                </div>
                <button
                  onClick={() => onOpenJournalForBook(book)}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-sm transition-all shrink-0"
                >
                  <BookOpenText className="w-3.5 h-3.5 inline mr-1" />
                  Buka Jurnal Membaca
                </button>
              </div>

            </div>
          </div>
        </div>

        {/* Reader Bottom Navigation Bar */}
        <div className={`px-4 sm:px-6 py-2.5 border-t flex items-center justify-between shrink-0 text-xs ${getHeaderThemeClass()}`}>
          <button
            onClick={() => setCurrentChapterIdx(Math.max(0, currentChapterIdx - 1))}
            disabled={currentChapterIdx === 0}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl font-semibold transition-all ${
              currentChapterIdx === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-black/10'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Bab Sebelumnya</span>
          </button>

          <span className="font-mono text-[11px] opacity-70">
            Bab {currentChapterIdx + 1} / {chapters.length}
          </span>

          <button
            onClick={() => setCurrentChapterIdx(Math.min(chapters.length - 1, currentChapterIdx + 1))}
            disabled={currentChapterIdx === chapters.length - 1}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl font-semibold transition-all ${
              currentChapterIdx === chapters.length - 1 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-black/10'
            }`}
          >
            <span>Bab Selanjutnya</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
