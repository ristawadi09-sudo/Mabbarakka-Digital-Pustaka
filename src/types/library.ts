export type BookCategory = 
  | 'Karya Umum'
  | 'Filsafat'
  | 'Agama'
  | 'Bahasa'
  | 'Ilmu Murni'
  | 'Ilmu Terapan'
  | 'Seni dan Olahraga'
  | 'Sastra'
  | 'Sejarah/Geografi'
  | 'Referensi'
  | 'Ensiklopedia'
  | 'Kitab Suci'
  | 'Mata Pelajaran';

export const BOOK_CATEGORIES: BookCategory[] = [
  'Karya Umum',
  'Filsafat',
  'Agama',
  'Bahasa',
  'Ilmu Murni',
  'Ilmu Terapan',
  'Seni dan Olahraga',
  'Sastra',
  'Sejarah/Geografi',
  'Referensi',
  'Ensiklopedia',
  'Kitab Suci',
  'Mata Pelajaran',
];

export type BookStatus = 'Tersedia' | 'Dipinjam' | 'Perbaikan' | 'Hilang';

export interface Book {
  id: string;
  barcode: string; // e.g. SMP5-BK-001
  isbn: string;
  title: string;
  author: string;
  publisher: string;
  year: number;
  category: BookCategory;
  rackLocation: string; // e.g. Rak A-02, Rak B-01
  totalCopies: number;
  availableCopies: number;
  description: string;
  coverUrl?: string;
  language: string;
  pages: number;
  addedDate: string;
}

export interface DigitalBook {
  id: string;
  title: string;
  author: string;
  category: BookCategory;
  description: string;
  coverUrl?: string;
  fileSize: string;
  totalPages: number;
  readCount: number;
  downloadUrl?: string;
  curriculum?: string; // e.g. Kurikulum Merdeka
  rating: number;
  content: {
    chapters: {
      id: number;
      title: string;
      text: string;
    }[];
  };
}

export type MemberRole = 'Siswa' | 'Guru' | 'Staf' | 'Pustakawan';

export type AppRole = 'admin' | 'anggota';

export interface AuthSession {
  id: string;
  username: string;
  name: string;
  role: AppRole; // 'admin' (Petugas/Administrator) | 'anggota' (Siswa/Guru/Staf)
  memberRole?: MemberRole;
  memberNumber?: string;
  gradeClass?: string;
  whatsapp?: string;
  email?: string;
  avatarUrl?: string;
  source: 'cloud_gas' | 'demo_local';
  loginTime: string;
}

export interface Member {
  id: string;
  memberNumber: string; // e.g. NISN / NIP or SMP5-ANG-001
  name: string;
  role: MemberRole;
  password?: string; // Optional custom password for GAS/Local authentication
  gradeClass?: string; // e.g. "Kelas VIII-A", "Guru IPA", "Staf TU"
  whatsapp: string; // e.g. 6281234567890
  email: string;
  joinedDate: string;
  status: 'Aktif' | 'Nonaktif' | 'Ditangguhkan';
  avatarUrl?: string;
  maxBorrowLimit: number;
  activeLoanCount: number;
}

export type LoanStatus = 'Dipinjam' | 'Dikembalikan' | 'Terlambat';

export interface CirculationRecord {
  id: string;
  transactionCode: string; // e.g. TR-202610-001
  bookId: string;
  bookBarcode: string;
  bookTitle: string;
  bookCategory: BookCategory;
  memberId: string;
  memberNumber: string;
  memberName: string;
  memberRole: MemberRole;
  memberClass?: string;
  memberWhatsapp: string;
  memberEmail: string;
  borrowDate: string; // YYYY-MM-DD
  dueDate: string;    // YYYY-MM-DD
  returnDate?: string; // YYYY-MM-DD
  status: LoanStatus;
  notes?: string;
  finePerDay: number; // default Rp 1000
  fineDays: number;
  fineAmount: number;
  finePaid: boolean;
  finePaymentDate?: string;
  whatsappReminderSent?: boolean;
  whatsappReminderDate?: string;
  emailReminderSent?: boolean;
}

export interface ReadingJournalEntry {
  id: string;
  memberId: string;
  memberName: string;
  bookTitle: string;
  author: string;
  category: string;
  rating: number; // 1-5
  pagesRead: number;
  totalPages: number;
  reviewText: string;
  favoriteQuote?: string;
  keyLearnings: string[];
  startDate: string;
  finishedDate?: string;
  isCompleted: boolean;
  visibility: 'Publik' | 'Pribadi';
  createdAt: string;
}

export interface ActiveVisitor {
  id: string;
  memberId: string;
  memberName: string;
  role: MemberRole;
  gradeClass?: string;
  currentActivity: 'Membaca E-Book' | 'Mencari Buku' | 'Jurnal Membaca' | 'Cek Sirkulasi' | 'Menjelajah Koleksi';
  currentBookTitle?: string;
  device: 'Komputer Lab' | 'Tablet Perpus' | 'Smartphone Siswa' | 'Laptop Guru';
  onlineSince: string; // HH:mm:ss
  avatarUrl?: string;
}

export interface LibrarySettings {
  schoolName: string;
  libraryName: string;
  district: string;
  province: string;
  address: string;
  headmasterName: string;
  headOfLibraryName: string;
  librarianNIP: string;
  finePerDay: number; // e.g. 1000
  studentBorrowDays: number; // e.g. 7
  staffBorrowDays: number;   // e.g. 14
  studentMaxBorrow: number;  // e.g. 3
  staffMaxBorrow: number;    // e.g. 5
}

export interface GASConfig {
  webAppUrl: string;
  spreadsheetId?: string;
  autoSync: boolean;
  lastSyncTime?: string;
  lastSyncStatus?: 'success' | 'error' | 'idle';
  lastSyncMessage?: string;
}

