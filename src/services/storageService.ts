import { 
  Book, 
  DigitalBook, 
  Member, 
  CirculationRecord, 
  ReadingJournalEntry, 
  ActiveVisitor, 
  LibrarySettings,
  AuthSession,
  BookCategory,
  BOOK_CATEGORIES
} from '../types/library';
import { 
  initialBooks, 
  initialDigitalBooks, 
  initialMembers, 
  initialCirculation, 
  initialJournals, 
  initialActiveVisitors, 
  initialSettings 
} from '../data/initialData';

export function normalizeCategory(cat: any): BookCategory {
  if (!cat) return 'Karya Umum';
  if (BOOK_CATEGORIES.includes(cat as BookCategory)) return cat as BookCategory;
  const lower = String(cat).toLowerCase();
  if (lower.includes('kitab suci') || lower.includes('al-quran') || lower.includes('alkitab') || lower.includes('injil')) return 'Kitab Suci';
  if (lower.includes('agama') || lower.includes('akhlak') || lower.includes('budi pekerti') || lower.includes('islam')) return 'Agama';
  if (lower.includes('filsafat') || lower.includes('motivasi') || lower.includes('pengembangan')) return 'Filsafat';
  if (lower.includes('bahasa') || lower.includes('linguistik')) return 'Bahasa';
  if (lower.includes('ilmu terapan') || lower.includes('teknologi') || lower.includes('pertanian') || lower.includes('rekayasa') || lower.includes('teknik')) return 'Ilmu Terapan';
  if (lower.includes('ilmu murni') || lower.includes('sains') || lower.includes('ipa') || lower.includes('biologi') || lower.includes('fisika') || lower.includes('kimia') || lower.includes('matematika')) return 'Ilmu Murni';
  if (lower.includes('seni') || lower.includes('olahraga') || lower.includes('musik') || lower.includes('lukis')) return 'Seni dan Olahraga';
  if (lower.includes('sastra') || lower.includes('fiksi') || lower.includes('novel') || lower.includes('cerpen') || lower.includes('puisi') || lower.includes('drama')) return 'Sastra';
  if (lower.includes('sejarah') || lower.includes('geografi') || lower.includes('sosial') || lower.includes('ips') || lower.includes('pkn')) return 'Sejarah/Geografi';
  if (lower.includes('ensiklopedia')) return 'Ensiklopedia';
  if (lower.includes('referensi') || lower.includes('kamus') || lower.includes('katalog') || lower.includes('pedoman')) return 'Referensi';
  if (lower.includes('pelajaran') || lower.includes('paket') || lower.includes('kurikulum') || lower.includes('modul')) return 'Mata Pelajaran';
  if (lower.includes('budaya') || lower.includes('maritim') || lower.includes('lokal')) return 'Karya Umum';
  return 'Karya Umum';
}

const KEYS = {
  BOOKS: 'mabbarakka_books_v1',
  DIGITAL_BOOKS: 'mabbarakka_digital_v1',
  MEMBERS: 'mabbarakka_members_v1',
  CIRCULATION: 'mabbarakka_circulation_v1',
  JOURNALS: 'mabbarakka_journals_v1',
  SETTINGS: 'mabbarakka_settings_v1',
  CURRENT_USER: 'mabbarakka_current_user_v1',
  AUTH_SESSION: 'mabbarakka_auth_session_v1',
  GAS_CONFIG: 'mabbarakka_gas_config_v1',
};

export const storageService = {
  getGASConfig(): import('../types/library').GASConfig {
    const raw = localStorage.getItem(KEYS.GAS_CONFIG);
    return raw ? JSON.parse(raw) : {
      webAppUrl: '',
      spreadsheetId: '',
      autoSync: false,
      lastSyncStatus: 'idle',
    };
  },

  saveGASConfig(config: import('../types/library').GASConfig) {
    localStorage.setItem(KEYS.GAS_CONFIG, JSON.stringify(config));
  },

  getSettings(): LibrarySettings {
    const raw = localStorage.getItem(KEYS.SETTINGS);
    return raw ? JSON.parse(raw) : initialSettings;
  },

  saveSettings(settings: LibrarySettings) {
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
  },

  getBooks(): Book[] {
    const raw = localStorage.getItem(KEYS.BOOKS);
    if (!raw) return initialBooks;
    try {
      const parsed: Book[] = JSON.parse(raw);
      return parsed.map(b => ({
        ...b,
        category: normalizeCategory(b.category)
      }));
    } catch {
      return initialBooks;
    }
  },

  saveBooks(books: Book[]) {
    localStorage.setItem(KEYS.BOOKS, JSON.stringify(books));
  },

  getDigitalBooks(): DigitalBook[] {
    const raw = localStorage.getItem(KEYS.DIGITAL_BOOKS);
    if (!raw) return initialDigitalBooks;
    try {
      const parsed: DigitalBook[] = JSON.parse(raw);
      return parsed.map(d => ({
        ...d,
        category: normalizeCategory(d.category)
      }));
    } catch {
      return initialDigitalBooks;
    }
  },

  saveDigitalBooks(books: DigitalBook[]) {
    localStorage.setItem(KEYS.DIGITAL_BOOKS, JSON.stringify(books));
  },

  getMembers(): Member[] {
    const raw = localStorage.getItem(KEYS.MEMBERS);
    return raw ? JSON.parse(raw) : initialMembers;
  },

  saveMembers(members: Member[]) {
    localStorage.setItem(KEYS.MEMBERS, JSON.stringify(members));
  },

  getCirculation(): CirculationRecord[] {
    const raw = localStorage.getItem(KEYS.CIRCULATION);
    if (!raw) return initialCirculation;
    try {
      const parsed: CirculationRecord[] = JSON.parse(raw);
      return parsed.map(c => ({
        ...c,
        bookCategory: normalizeCategory(c.bookCategory)
      }));
    } catch {
      return initialCirculation;
    }
  },

  saveCirculation(records: CirculationRecord[]) {
    localStorage.setItem(KEYS.CIRCULATION, JSON.stringify(records));
  },

  getJournals(): ReadingJournalEntry[] {
    const raw = localStorage.getItem(KEYS.JOURNALS);
    if (!raw) return initialJournals;
    try {
      const parsed: ReadingJournalEntry[] = JSON.parse(raw);
      return parsed.map(j => ({
        ...j,
        category: normalizeCategory(j.category)
      }));
    } catch {
      return initialJournals;
    }
  },

  saveJournals(journals: ReadingJournalEntry[]) {
    localStorage.setItem(KEYS.JOURNALS, JSON.stringify(journals));
  },

  getCurrentUser(): Member | null {
    const raw = localStorage.getItem(KEYS.CURRENT_USER);
    return raw ? JSON.parse(raw) : null;
  },

  setCurrentUser(member: Member | null) {
    if (member) {
      localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(member));
    } else {
      localStorage.removeItem(KEYS.CURRENT_USER);
    }
  },

  getAuthSession(): AuthSession {
    const raw = localStorage.getItem(KEYS.AUTH_SESSION);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch (e) {
        // Fallback to default admin
      }
    }
    return {
      id: 'admin-001',
      username: 'admin',
      name: 'Petugas Perpustakaan (Admin)',
      role: 'admin',
      memberRole: 'Pustakawan',
      source: 'demo_local',
      loginTime: new Date().toISOString(),
    };
  },

  setAuthSession(session: AuthSession | null) {
    if (session) {
      localStorage.setItem(KEYS.AUTH_SESSION, JSON.stringify(session));
    } else {
      localStorage.removeItem(KEYS.AUTH_SESSION);
    }
  },

  resetAllToDefault() {
    localStorage.removeItem(KEYS.BOOKS);
    localStorage.removeItem(KEYS.DIGITAL_BOOKS);
    localStorage.removeItem(KEYS.MEMBERS);
    localStorage.removeItem(KEYS.CIRCULATION);
    localStorage.removeItem(KEYS.JOURNALS);
    localStorage.removeItem(KEYS.SETTINGS);
    localStorage.removeItem(KEYS.CURRENT_USER);
    localStorage.removeItem(KEYS.GAS_CONFIG);
  }
};
