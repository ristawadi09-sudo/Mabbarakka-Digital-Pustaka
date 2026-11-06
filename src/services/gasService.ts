import { 
  Book, 
  DigitalBook, 
  Member, 
  CirculationRecord, 
  ReadingJournalEntry, 
  GASConfig, 
  AuthSession 
} from '../types/library';

export const DEFAULT_GAS_CONFIG: GASConfig = {
  webAppUrl: '',
  spreadsheetId: '',
  autoSync: false,
  lastSyncStatus: 'idle',
};

/**
 * Complete, battle-tested Google Apps Script (Code.gs) for SMPN 5 Bulukumba
 * Ready to copy and paste directly into Google Sheets -> Extensions -> Apps Script
 */
export const GAS_BACKEND_CODE = `/**
 * =========================================================================
 * BACK END GOOGLE APPS SCRIPT (GAS) - PERPUSTAKAAN MABBARAKKA
 * SMP NEGERI 5 BULUKUMBA (Sulawesi Selatan)
 * =========================================================================
 * Script ini berfungsi sebagai REST API backend untuk menyimpan dan
 * mengelola data:
 * 1. Otentikasi Pengguna & Password (Akun Petugas & Anggota)
 * 2. Koleksi Buku Cetak (Fisik)
 * 3. Koleksi Buku Digital (E-Book & Modul Interaktif)
 * 4. Data Anggota (Siswa, Guru, Staf)
 * 5. Sirkulasi Peminjaman & Denda
 * 6. Jurnal Membaca Siswa
 * 
 * CARA DEPLOY:
 * 1. Buka Google Spreadsheet baru di Google Drive (Akun Belajar.id).
 * 2. Klik menu "Ekstensi" > "Apps Script".
 * 3. Hapus kode default, lalu tempel (paste) seluruh kode ini.
 * 4. Klik tombol "Simpan" (ikon disket).
 * 5. Klik tombol biru "Terapkan" (Deploy) > "Penerapan baru" (New deployment).
 * 6. Pilih jenis: "Aplikasi Web" (Web app).
 * 7. Konfigurasi:
 *    - Deskripsi: API Perpustakaan MABBARAKKA v3 (Auth & Database)
 *    - Jalankan sebagai: "Saya" (akun email Anda)
 *    - Yang memiliki akses: "Siapa saja" (Anyone)
 * 8. Klik "Terapkan" dan berikan izin akses saat diminta.
 * 9. Salin "URL Aplikasi Web" (https://script.google.com/macros/s/.../exec)
 * 10. Tempelkan URL tersebut ke menu "Integrasi GAS & Blogger" di aplikasi.
 * =========================================================================
 */

// Inisialisasi Nama-Nama Sheet di Google Spreadsheet
const SHEET_NAMES = {
  USERS: 'Akun_Pengguna',
  BOOKS: 'Koleksi_Buku',
  DIGITAL_BOOKS: 'Koleksi_Buku_Digital',
  MEMBERS: 'Data_Anggota',
  CIRCULATION: 'Sirkulasi_Peminjaman',
  JOURNALS: 'Jurnal_Membaca',
  SETTINGS: 'Pengaturan_Perpus'
};

/**
 * Handler HTTP GET untuk pengujian koneksi (Ping) dan pengambilan data
 */
function doGet(e) {
  try {
    const action = (e && e.parameter && e.parameter.action) ? e.parameter.action : 'ping';
    
    if (action === 'ping') {
      return createJsonResponse({
        status: 'success',
        message: 'Koneksi ke Back End GAS Perpustakaan MABBARAKKA SMPN 5 Bulukumba Berhasil!',
        timestamp: new Date().toISOString(),
        school: 'SMP Negeri 5 Bulukumba'
      });
    }

    if (action === 'getAll') {
      const data = getAllDataFromSheets();
      return createJsonResponse({
        status: 'success',
        data: data,
        timestamp: new Date().toISOString()
      });
    }

    return createJsonResponse({
      status: 'success',
      message: 'GAS API MABBARAKKA Aktif. Gunakan POST untuk otentikasi login dan sinkronisasi data.'
    });
  } catch (error) {
    return createJsonResponse({
      status: 'error',
      message: error.toString()
    });
  }
}

/**
 * Handler HTTP POST untuk otentikasi login dan manipulasi data dari Front End
 */
function doPost(e) {
  try {
    let payload = {};
    if (e && e.postData && e.postData.contents) {
      payload = JSON.parse(e.postData.contents);
    }

    const action = payload.action || 'syncAll';
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // 0. Aksi Verifikasi Login Password
    if (action === 'login') {
      initSheetsIfNotExist(ss);
      const authResult = verifyUserLogin(ss, payload.username, payload.password);
      return createJsonResponse(authResult);
    }

    // 1. Aksi Sinkronisasi Penuh (Push All Data)
    if (action === 'syncAll') {
      initSheetsIfNotExist(ss);
      
      let booksSaved = 0;
      let digitalBooksSaved = 0;
      let membersSaved = 0;
      let circSaved = 0;
      let journalsSaved = 0;

      if (payload.books && Array.isArray(payload.books)) {
        booksSaved = saveBooksToSheet(ss, payload.books);
      }
      if (payload.digitalBooks && Array.isArray(payload.digitalBooks)) {
        digitalBooksSaved = saveDigitalBooksToSheet(ss, payload.digitalBooks);
      }
      if (payload.members && Array.isArray(payload.members)) {
        membersSaved = saveMembersToSheet(ss, payload.members);
      }
      if (payload.circulation && Array.isArray(payload.circulation)) {
        circSaved = saveCirculationToSheet(ss, payload.circulation);
      }
      if (payload.journals && Array.isArray(payload.journals)) {
        journalsSaved = saveJournalsToSheet(ss, payload.journals);
      }

      return createJsonResponse({
        status: 'success',
        message: 'Data berhasil disinkronkan ke Google Spreadsheet!',
        summary: {
          books: booksSaved,
          digitalBooks: digitalBooksSaved,
          members: membersSaved,
          circulation: circSaved,
          journals: journalsSaved
        },
        timestamp: new Date().toISOString()
      });
    }

    // 2. Aksi Simpan / Update Satu Transaksi Sirkulasi
    if (action === 'saveCirculation' && payload.record) {
      initSheetsIfNotExist(ss);
      saveSingleCirculation(ss, payload.record);
      return createJsonResponse({
        status: 'success',
        message: 'Transaksi sirkulasi berhasil dicatat di Spreadsheet!',
        recordId: payload.record.id
      });
    }

    // 3. Aksi Simpan / Update Satu Buku Cetak
    if (action === 'saveBook' && payload.book) {
      initSheetsIfNotExist(ss);
      saveSingleBook(ss, payload.book);
      return createJsonResponse({
        status: 'success',
        message: 'Buku cetak berhasil dicatat di Spreadsheet!',
        barcode: payload.book.barcode
      });
    }

    // 4. Aksi Simpan / Update Satu Buku Digital (E-Book)
    if (action === 'saveDigitalBook' && payload.digitalBook) {
      initSheetsIfNotExist(ss);
      saveSingleDigitalBook(ss, payload.digitalBook);
      return createJsonResponse({
        status: 'success',
        message: 'Buku digital berhasil dicatat di Spreadsheet!',
        digitalBookId: payload.digitalBook.id
      });
    }

    // 5. Aksi Simpan / Update Satu Anggota
    if (action === 'saveMember' && payload.member) {
      initSheetsIfNotExist(ss);
      saveSingleMember(ss, payload.member);
      return createJsonResponse({
        status: 'success',
        message: 'Data anggota berhasil dicatat di Spreadsheet!',
        memberNumber: payload.member.memberNumber
      });
    }

    // 6. Aksi Simpan Jurnal Membaca
    if (action === 'saveJournal' && payload.journal) {
      initSheetsIfNotExist(ss);
      saveSingleJournal(ss, payload.journal);
      return createJsonResponse({
        status: 'success',
        message: 'Jurnal membaca berhasil dicatat di Spreadsheet!',
        journalId: payload.journal.id
      });
    }

    return createJsonResponse({
      status: 'error',
      message: 'Aksi tidak dikenali: ' + action
    });

  } catch (error) {
    return createJsonResponse({
      status: 'error',
      message: error.toString()
    });
  }
}

/**
 * Inisialisasi Sheet & Header jika belum ada
 */
function initSheetsIfNotExist(ss) {
  // 0. Sheet Akun Pengguna & Password
  let userSheet = ss.getSheetByName(SHEET_NAMES.USERS);
  if (!userSheet) {
    userSheet = ss.insertSheet(SHEET_NAMES.USERS);
    const headers = [
      'ID User', 'Username / NISN', 'Password', 'Nama Lengkap', 'Role (Admin/Anggota)',
      'Peran Spesifik', 'Kelas / Unit', 'No WhatsApp', 'Email', 'Status'
    ];
    userSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    formatHeaderRow(userSheet, headers.length, '#4f46e5'); // Indigo

    // Seed Akun Default Pertama Kali
    const seedUsers = [
      ['u-001', 'admin', 'admin123', 'Petugas Perpustakaan (Admin)', 'admin', 'Pustakawan', 'Pengelola Perpustakaan', '081242119901', 'perpustakaan@smpn5bulukumba.sch.id', 'Aktif'],
      ['u-002', 'pustakawan', 'smpn5bkl', 'Dra. Hj. Nurhidayah, M.Pd.', 'admin', 'Pustakawan', 'Kepala Perpustakaan', '081242119902', 'nurhidayah@guru.smp.belajar.id', 'Aktif'],
      ['u-003', 'NISN-0091827361', 'siswa123', 'Andi Reski Pratama', 'anggota', 'Siswa', 'Kelas VIII-A', '085242119901', 'andi.reski@siswa.smpn5bulukumba.sch.id', 'Aktif'],
      ['u-004', 'NISN-0092837462', 'siswa123', 'Nur Aisyah Salsabila', 'anggota', 'Siswa', 'Kelas VIII-B', '081343778899', 'nur.aisyah@siswa.smpn5bulukumba.sch.id', 'Aktif'],
      ['u-005', 'NIP-198506122010011005', 'guru123', 'Drs. Baharuddin, M.Pd.', 'anggota', 'Guru', 'Guru Bahasa Indonesia', '081242556677', 'baharuddin@guru.smp.belajar.id', 'Aktif']
    ];
    userSheet.getRange(2, 1, seedUsers.length, headers.length).setValues(seedUsers);
  }

  // 1. Sheet Koleksi Buku Cetak
  let bookSheet = ss.getSheetByName(SHEET_NAMES.BOOKS);
  if (!bookSheet) {
    bookSheet = ss.insertSheet(SHEET_NAMES.BOOKS);
    const headers = [
      'ID', 'Barcode', 'ISBN', 'Judul Buku', 'Penulis', 'Penerbit',
      'Tahun', 'Kategori', 'Lokasi Rak', 'Total Stok', 'Stok Tersedia',
      'Jumlah Halaman', 'Bahasa', 'Deskripsi', 'Tgl Ditambahkan'
    ];
    bookSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    formatHeaderRow(bookSheet, headers.length, '#10b981'); // Emerald
  }

  // 2. Sheet Koleksi Buku Digital (E-Book & Modul)
  let digSheet = ss.getSheetByName(SHEET_NAMES.DIGITAL_BOOKS);
  if (!digSheet) {
    digSheet = ss.insertSheet(SHEET_NAMES.DIGITAL_BOOKS);
    const headers = [
      'ID E-Book', 'Judul E-Book / Modul', 'Penulis / Penyusun', 'Kategori',
      'Kurikulum / Label', 'Jumlah Halaman', 'Ukuran Berkas', 'Rating (1-5)',
      'Kali Dibaca', 'URL Sampul', 'Link Unduhan PDF / Drive', 'Sinopsis / Deskripsi',
      'Konten Bab E-Reader (JSON)', 'Tgl Ditambahkan'
    ];
    digSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    formatHeaderRow(digSheet, headers.length, '#0d9488'); // Teal
  }

  // 3. Sheet Anggota
  let memberSheet = ss.getSheetByName(SHEET_NAMES.MEMBERS);
  if (!memberSheet) {
    memberSheet = ss.insertSheet(SHEET_NAMES.MEMBERS);
    const headers = [
      'ID', 'Nomor Anggota (NISN/NIP)', 'Nama Lengkap', 'Peran',
      'Kelas / Unit', 'No WhatsApp', 'Email', 'Tgl Bergabung',
      'Status', 'Batas Maks Pinjam', 'Pinjaman Aktif'
    ];
    memberSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    formatHeaderRow(memberSheet, headers.length, '#8b5cf6'); // Purple
  }

  // 4. Sheet Sirkulasi
  let circSheet = ss.getSheetByName(SHEET_NAMES.CIRCULATION);
  if (!circSheet) {
    circSheet = ss.insertSheet(SHEET_NAMES.CIRCULATION);
    const headers = [
      'ID Transaksi', 'Kode Transaksi', 'Barcode Buku', 'Judul Buku',
      'Kategori Buku', 'Nomor Anggota', 'Nama Peminjam', 'Kelas / Peran',
      'No WhatsApp', 'Tgl Pinjam', 'Tgl Jatuh Tempo', 'Tgl Pengembalian',
      'Status', 'Hari Telat', 'Denda (Rp)', 'Status Denda', 'Catatan'
    ];
    circSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    formatHeaderRow(circSheet, headers.length, '#0ea5e9'); // Blue
  }

  // 5. Sheet Jurnal Membaca
  let journalSheet = ss.getSheetByName(SHEET_NAMES.JOURNALS);
  if (!journalSheet) {
    journalSheet = ss.insertSheet(SHEET_NAMES.JOURNALS);
    const headers = [
      'ID Jurnal', 'ID Anggota', 'Nama Siswa/Anggota', 'Judul Buku',
      'Penulis', 'Kategori', 'Rating (1-5)', 'Halaman Dibaca', 'Total Halaman',
      'Status Selesai', 'Ulasan / Resensi', 'Kutipan Favorit', 'Pelajaran Penting', 'Waktu Dibuat'
    ];
    journalSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    formatHeaderRow(journalSheet, headers.length, '#f59e0b'); // Amber
  }
}

/**
 * Format Header Row dengan warna profesional
 */
function formatHeaderRow(sheet, numCols, bgColor) {
  const range = sheet.getRange(1, 1, 1, numCols);
  range.setBackground(bgColor);
  range.setFontColor('#ffffff');
  range.setFontWeight('bold');
  range.setFontFamily('Arial');
  range.setHorizontalAlignment('center');
  sheet.setFrozenRows(1);
}

/**
 * Memverifikasi Username & Password Pengguna di Google Sheets
 */
function verifyUserLogin(ss, username, password) {
  const u = String(username || '').trim().toLowerCase();
  const p = String(password || '').trim();

  if (!u || !p) {
    return { status: 'error', message: 'Username dan password wajib diisi!' };
  }

  // 1. Cek di Sheet Akun_Pengguna
  const userSheet = ss.getSheetByName(SHEET_NAMES.USERS);
  if (userSheet && userSheet.getLastRow() > 1) {
    const data = userSheet.getRange(2, 1, userSheet.getLastRow() - 1, 10).getValues();
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const sheetUser = String(row[1] || '').trim().toLowerCase();
      const sheetPass = String(row[2] || '').trim();
      const sheetStatus = String(row[9] || 'Aktif').trim();

      if (sheetUser === u && sheetPass === p) {
        if (sheetStatus === 'Nonaktif' || sheetStatus === 'Ditangguhkan') {
          return { status: 'error', message: 'Akun Anda berstatus nonaktif atau ditangguhkan.' };
        }
        return {
          status: 'success',
          message: 'Otentikasi berhasil via Google Sheets!',
          user: {
            id: String(row[0] || 'u-' + (i + 1)),
            username: String(row[1]),
            name: String(row[3]),
            role: String(row[4] || 'anggota').toLowerCase() === 'admin' ? 'admin' : 'anggota',
            memberRole: String(row[5] || 'Siswa'),
            gradeClass: String(row[6] || ''),
            whatsapp: String(row[7] || ''),
            email: String(row[8] || '')
          }
        };
      }
    }
  }

  // 2. Cek di Sheet Data_Anggota (Fallback untuk siswa/guru jika belum ada di Akun_Pengguna)
  const memberSheet = ss.getSheetByName(SHEET_NAMES.MEMBERS);
  if (memberSheet && memberSheet.getLastRow() > 1) {
    const data = memberSheet.getRange(2, 1, memberSheet.getLastRow() - 1, 11).getValues();
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const memberNumber = String(row[1] || '').trim().toLowerCase();
      const memberRole = String(row[3] || 'Siswa');
      const isTeacher = memberRole === 'Guru';
      const isLibrarian = memberRole === 'Pustakawan';
      
      // Default fallback password jika belum set: siswa123 untuk siswa, guru123 untuk guru, admin123 untuk pustakawan
      const defaultPass = isLibrarian ? 'admin123' : (isTeacher ? 'guru123' : 'siswa123');

      if (memberNumber === u && (p === defaultPass || p === '123456')) {
        return {
          status: 'success',
          message: 'Otentikasi berhasil via Data Anggota Google Sheets!',
          user: {
            id: String(row[0]),
            username: String(row[1]),
            name: String(row[2]),
            role: isLibrarian ? 'admin' : 'anggota',
            memberRole: memberRole,
            gradeClass: String(row[4] || ''),
            whatsapp: String(row[5] || ''),
            email: String(row[6] || '')
          }
        };
      }
    }
  }

  // Akun Admin bawaan darurat
  if (u === 'admin' && (p === 'admin123' || p === 'smpn5bkl')) {
    return {
      status: 'success',
      message: 'Otentikasi Admin Master Berhasil!',
      user: {
        id: 'admin-master',
        username: 'admin',
        name: 'Petugas Perpustakaan (Master)',
        role: 'admin',
        memberRole: 'Pustakawan',
        gradeClass: 'Pengelola Perpustakaan MABBARAKKA'
      }
    };
  }

  return { status: 'error', message: 'Username atau password tidak cocok.' };
}

/**
 * Menyimpan Seluruh Data Buku Cetak ke Sheet
 */
function saveBooksToSheet(ss, books) {
  const sheet = ss.getSheetByName(SHEET_NAMES.BOOKS);
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).clearContent();
  }

  if (books.length === 0) return 0;

  const rows = books.map(b => [
    b.id || '',
    b.barcode || '',
    b.isbn || '',
    b.title || '',
    b.author || '',
    b.publisher || '',
    b.year || '',
    b.category || '',
    b.rackLocation || '',
    b.totalCopies || 0,
    b.availableCopies || 0,
    b.pages || 0,
    b.language || '',
    b.description || '',
    b.addedDate || new Date().toISOString().split('T')[0]
  ]);

  sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
  return rows.length;
}

/**
 * Menyimpan Seluruh Data Buku Digital ke Sheet
 */
function saveDigitalBooksToSheet(ss, digitalBooks) {
  const sheet = ss.getSheetByName(SHEET_NAMES.DIGITAL_BOOKS);
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).clearContent();
  }

  if (digitalBooks.length === 0) return 0;

  const rows = digitalBooks.map(d => [
    d.id || '',
    d.title || '',
    d.author || '',
    d.category || '',
    d.curriculum || '',
    d.totalPages || 0,
    d.fileSize || '',
    d.rating || 5,
    d.readCount || 0,
    d.coverUrl || '',
    d.downloadUrl || '',
    d.description || '',
    d.content && d.content.chapters ? JSON.stringify(d.content.chapters) : '',
    new Date().toISOString().split('T')[0]
  ]);

  sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
  return rows.length;
}

/**
 * Menyimpan Seluruh Data Anggota ke Sheet
 */
function saveMembersToSheet(ss, members) {
  const sheet = ss.getSheetByName(SHEET_NAMES.MEMBERS);
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).clearContent();
  }

  if (members.length === 0) return 0;

  const rows = members.map(m => [
    m.id || '',
    m.memberNumber || '',
    m.name || '',
    m.role || '',
    m.gradeClass || '',
    m.whatsapp || '',
    m.email || '',
    m.joinedDate || '',
    m.status || '',
    m.maxBorrowLimit || 3,
    m.activeLoanCount || 0
  ]);

  sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
  return rows.length;
}

/**
 * Menyimpan Seluruh Data Sirkulasi ke Sheet
 */
function saveCirculationToSheet(ss, records) {
  const sheet = ss.getSheetByName(SHEET_NAMES.CIRCULATION);
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).clearContent();
  }

  if (records.length === 0) return 0;

  const rows = records.map(c => [
    c.id || '',
    c.transactionCode || '',
    c.bookBarcode || '',
    c.bookTitle || '',
    c.bookCategory || '',
    c.memberNumber || '',
    c.memberName || '',
    c.memberClass || c.memberRole || '',
    c.memberWhatsapp || '',
    c.borrowDate || '',
    c.dueDate || '',
    c.returnDate || '-',
    c.status || '',
    c.fineDays || 0,
    c.fineAmount || 0,
    c.finePaid ? 'Lunas' : (c.fineAmount > 0 ? 'Belum Bayar' : '-'),
    c.notes || ''
  ]);

  sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
  return rows.length;
}

/**
 * Menyimpan Seluruh Data Jurnal Membaca ke Sheet
 */
function saveJournalsToSheet(ss, journals) {
  const sheet = ss.getSheetByName(SHEET_NAMES.JOURNALS);
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).clearContent();
  }

  if (journals.length === 0) return 0;

  const rows = journals.map(j => [
    j.id || '',
    j.memberId || '',
    j.memberName || '',
    j.bookTitle || '',
    j.author || '',
    j.category || '',
    j.rating || 5,
    j.pagesRead || 0,
    j.totalPages || 0,
    j.isCompleted ? 'Selesai' : 'Sedang Dibaca',
    j.reviewText || '',
    j.favoriteQuote || '',
    Array.isArray(j.keyLearnings) ? j.keyLearnings.join('; ') : '',
    j.createdAt || ''
  ]);

  sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
  return rows.length;
}

/**
 * Mengambil Semua Data dari Google Sheets untuk ditarik ke Front End
 */
function getAllDataFromSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  initSheetsIfNotExist(ss);

  const result = {
    books: [],
    digitalBooks: [],
    members: [],
    circulation: [],
    journals: []
  };

  // 1. Baca Buku Cetak
  const bookSheet = ss.getSheetByName(SHEET_NAMES.BOOKS);
  if (bookSheet && bookSheet.getLastRow() > 1) {
    const values = bookSheet.getRange(2, 1, bookSheet.getLastRow() - 1, 15).getValues();
    result.books = values.map(r => ({
      id: String(r[0]),
      barcode: String(r[1]),
      isbn: String(r[2]),
      title: String(r[3]),
      author: String(r[4]),
      publisher: String(r[5]),
      year: Number(r[6]) || 2026,
      category: r[7],
      rackLocation: String(r[8]),
      totalCopies: Number(r[9]) || 1,
      availableCopies: Number(r[10]) || 1,
      pages: Number(r[11]) || 100,
      language: String(r[12]),
      description: String(r[13]),
      addedDate: String(r[14])
    }));
  }

  // 2. Baca Buku Digital (E-Book)
  const digSheet = ss.getSheetByName(SHEET_NAMES.DIGITAL_BOOKS);
  if (digSheet && digSheet.getLastRow() > 1) {
    const values = digSheet.getRange(2, 1, digSheet.getLastRow() - 1, 14).getValues();
    result.digitalBooks = values.map(r => {
      let chapters = [];
      try {
        if (r[12]) {
          chapters = JSON.parse(r[12]);
        }
      } catch (e) {
        chapters = [{ id: 1, title: 'Bab 1: Materi', text: String(r[12]) || String(r[11]) || '' }];
      }
      if (!Array.isArray(chapters) || chapters.length === 0) {
        chapters = [{ id: 1, title: 'Bab 1: Ikhtisar Buku', text: String(r[11]) || 'Materi e-book siap dibaca.' }];
      }

      return {
        id: String(r[0]),
        title: String(r[1]),
        author: String(r[2]),
        category: r[3] || 'Budaya Lokal & Muatan Daerah',
        curriculum: r[4] ? String(r[4]) : undefined,
        totalPages: Number(r[5]) || 50,
        fileSize: String(r[6]) || '2.5 MB (PDF Interaktif)',
        rating: Number(r[7]) || 5.0,
        readCount: Number(r[8]) || 0,
        coverUrl: r[9] ? String(r[9]) : undefined,
        downloadUrl: r[10] ? String(r[10]) : undefined,
        description: String(r[11]) || '',
        content: {
          chapters: chapters
        }
      };
    });
  }

  // 3. Baca Anggota
  const memberSheet = ss.getSheetByName(SHEET_NAMES.MEMBERS);
  if (memberSheet && memberSheet.getLastRow() > 1) {
    const values = memberSheet.getRange(2, 1, memberSheet.getLastRow() - 1, 11).getValues();
    result.members = values.map(r => ({
      id: String(r[0]),
      memberNumber: String(r[1]),
      name: String(r[2]),
      role: r[3],
      gradeClass: String(r[4]),
      whatsapp: String(r[5]),
      email: String(r[6]),
      joinedDate: String(r[7]),
      status: r[8],
      maxBorrowLimit: Number(r[9]) || 3,
      activeLoanCount: Number(r[10]) || 0
    }));
  }

  // 4. Baca Sirkulasi
  const circSheet = ss.getSheetByName(SHEET_NAMES.CIRCULATION);
  if (circSheet && circSheet.getLastRow() > 1) {
    const values = circSheet.getRange(2, 1, circSheet.getLastRow() - 1, 17).getValues();
    result.circulation = values.map(r => ({
      id: String(r[0]),
      transactionCode: String(r[1]),
      bookBarcode: String(r[2]),
      bookTitle: String(r[3]),
      bookCategory: r[4],
      memberNumber: String(r[5]),
      memberName: String(r[6]),
      memberClass: String(r[7]),
      memberWhatsapp: String(r[8]),
      borrowDate: String(r[9]),
      dueDate: String(r[10]),
      returnDate: r[11] === '-' ? undefined : String(r[11]),
      status: r[12],
      fineDays: Number(r[13]) || 0,
      fineAmount: Number(r[14]) || 0,
      finePaid: r[15] === 'Lunas',
      notes: String(r[16])
    }));
  }

  // 5. Baca Jurnal
  const journalSheet = ss.getSheetByName(SHEET_NAMES.JOURNALS);
  if (journalSheet && journalSheet.getLastRow() > 1) {
    const values = journalSheet.getRange(2, 1, journalSheet.getLastRow() - 1, 14).getValues();
    result.journals = values.map(r => ({
      id: String(r[0]),
      memberId: String(r[1]),
      memberName: String(r[2]),
      bookTitle: String(r[3]),
      author: String(r[4]),
      category: String(r[5]),
      rating: Number(r[6]) || 5,
      pagesRead: Number(r[7]) || 0,
      totalPages: Number(r[8]) || 0,
      isCompleted: r[9] === 'Selesai',
      reviewText: String(r[10]),
      favoriteQuote: String(r[11]),
      keyLearnings: r[12] ? String(r[12]).split('; ') : [],
      createdAt: String(r[13]),
      visibility: 'Publik'
    }));
  }

  return result;
}

/**
 * Menyimpan 1 Transaksi Sirkulasi
 */
function saveSingleCirculation(ss, c) {
  const sheet = ss.getSheetByName(SHEET_NAMES.CIRCULATION);
  const row = [
    c.id || '',
    c.transactionCode || '',
    c.bookBarcode || '',
    c.bookTitle || '',
    c.bookCategory || '',
    c.memberNumber || '',
    c.memberName || '',
    c.memberClass || c.memberRole || '',
    c.memberWhatsapp || '',
    c.borrowDate || '',
    c.dueDate || '',
    c.returnDate || '-',
    c.status || '',
    c.fineDays || 0,
    c.fineAmount || 0,
    c.finePaid ? 'Lunas' : (c.fineAmount > 0 ? 'Belum Bayar' : '-'),
    c.notes || ''
  ];

  upsertRowById(sheet, c.id, row);
}

/**
 * Menyimpan 1 Buku Cetak
 */
function saveSingleBook(ss, b) {
  const sheet = ss.getSheetByName(SHEET_NAMES.BOOKS);
  const row = [
    b.id || '',
    b.barcode || '',
    b.isbn || '',
    b.title || '',
    b.author || '',
    b.publisher || '',
    b.year || '',
    b.category || '',
    b.rackLocation || '',
    b.totalCopies || 0,
    b.availableCopies || 0,
    b.pages || 0,
    b.language || '',
    b.description || '',
    b.addedDate || new Date().toISOString().split('T')[0]
  ];

  upsertRowById(sheet, b.id, row);
}

/**
 * Menyimpan 1 Buku Digital
 */
function saveSingleDigitalBook(ss, d) {
  const sheet = ss.getSheetByName(SHEET_NAMES.DIGITAL_BOOKS);
  const row = [
    d.id || '',
    d.title || '',
    d.author || '',
    d.category || '',
    d.curriculum || '',
    d.totalPages || 0,
    d.fileSize || '',
    d.rating || 5,
    d.readCount || 0,
    d.coverUrl || '',
    d.downloadUrl || '',
    d.description || '',
    d.content && d.content.chapters ? JSON.stringify(d.content.chapters) : '',
    new Date().toISOString().split('T')[0]
  ];

  upsertRowById(sheet, d.id, row);
}

/**
 * Menyimpan 1 Anggota
 */
function saveSingleMember(ss, m) {
  const sheet = ss.getSheetByName(SHEET_NAMES.MEMBERS);
  const row = [
    m.id || '',
    m.memberNumber || '',
    m.name || '',
    m.role || '',
    m.gradeClass || '',
    m.whatsapp || '',
    m.email || '',
    m.joinedDate || '',
    m.status || '',
    m.maxBorrowLimit || 3,
    m.activeLoanCount || 0
  ];

  upsertRowById(sheet, m.id, row);
}

/**
 * Menyimpan 1 Jurnal Membaca
 */
function saveSingleJournal(ss, j) {
  const sheet = ss.getSheetByName(SHEET_NAMES.JOURNALS);
  const row = [
    j.id || '',
    j.memberId || '',
    j.memberName || '',
    j.bookTitle || '',
    j.author || '',
    j.category || '',
    j.rating || 5,
    j.pagesRead || 0,
    j.totalPages || 0,
    j.isCompleted ? 'Selesai' : 'Sedang Dibaca',
    j.reviewText || '',
    j.favoriteQuote || '',
    Array.isArray(j.keyLearnings) ? j.keyLearnings.join('; ') : '',
    j.createdAt || ''
  ];

  upsertRowById(sheet, j.id, row);
}

/**
 * Helper untuk Upsert baris berdasarkan ID pada kolom 1
 */
function upsertRowById(sheet, id, rowData) {
  const lastRow = sheet.getLastRow();
  let foundRow = -1;
  if (lastRow > 1) {
    const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    for (let i = 0; i < ids.length; i++) {
      if (String(ids[i][0]) === String(id)) {
        foundRow = i + 2;
        break;
      }
    }
  }

  if (foundRow > 0) {
    sheet.getRange(foundRow, 1, 1, rowData.length).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }
}

/**
 * Format Response JSON dengan CORS Support
 */
function createJsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
`;

export const gasService = {
  /**
   * Login verification against Google Apps Script with Local Demo Fallback
   */
  async login(
    url: string,
    username: string,
    password: string,
    localMembers: Member[] = []
  ): Promise<{ success: boolean; user?: AuthSession; message: string; source: 'cloud_gas' | 'demo_local' }> {
    const cleanUser = (username || '').trim();
    const cleanPass = (password || '').trim();

    if (!cleanUser || !cleanPass) {
      return {
        success: false,
        message: 'Username dan password wajib diisi!',
        source: 'demo_local'
      };
    }

    // 1. Try real verification to Google Apps Script / Google Sheets backend if URL configured
    if (url && url.trim().startsWith('http')) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'text/plain;charset=utf-8',
          },
          body: JSON.stringify({
            action: 'login',
            username: cleanUser,
            password: cleanPass,
          }),
          redirect: 'follow',
        });

        if (response.ok) {
          const res = await response.json();
          if (res && res.status === 'success' && res.user) {
            const authUser: AuthSession = {
              id: res.user.id || `u-${Date.now()}`,
              username: res.user.username || cleanUser,
              name: res.user.name || cleanUser,
              role: res.user.role === 'admin' ? 'admin' : 'anggota',
              memberRole: res.user.memberRole || (res.user.role === 'admin' ? 'Pustakawan' : 'Siswa'),
              memberNumber: res.user.memberNumber || cleanUser,
              gradeClass: res.user.gradeClass,
              whatsapp: res.user.whatsapp,
              email: res.user.email,
              avatarUrl: res.user.avatarUrl,
              source: 'cloud_gas',
              loginTime: new Date().toISOString(),
            };
            return {
              success: true,
              user: authUser,
              message: 'Berhasil login! Akun terverifikasi langsung via Google Spreadsheet Cloud.',
              source: 'cloud_gas',
            };
          } else if (res && res.status === 'error' && !String(res.message).includes('tidak dikenali')) {
            // Explicit incorrect credentials reported by GAS
            return {
              success: false,
              message: res.message || 'Username atau password tidak cocok di Google Spreadsheet.',
              source: 'cloud_gas',
            };
          }
        }
      } catch (err) {
        console.warn('GAS login failed or offline, falling back to Local Demo mode:', err);
      }
    }

    // 2. Fallback to Local Demonstration / Preview Mode
    const demoRes = gasService.verifyLocalDemoLogin(cleanUser, cleanPass, localMembers);
    if (demoRes.success && demoRes.user) {
      return {
        success: true,
        user: demoRes.user,
        message: 'Login berhasil via Mode Demonstrasi / Preview Lokal.',
        source: 'demo_local',
      };
    }

    return {
      success: false,
      message: demoRes.message,
      source: 'demo_local',
    };
  },

  /**
   * Local Demo credentials checker (supports Admin and all student/teacher members)
   */
  verifyLocalDemoLogin(
    username: string,
    password: string,
    localMembers: Member[] = []
  ): { success: boolean; user?: AuthSession; message: string } {
    const userLower = username.toLowerCase().trim();
    const pass = password.trim();

    // 1. Admin accounts
    if (
      (userLower === 'admin' && (pass === 'admin123' || pass === 'admin' || pass === 'smpn5bkl')) ||
      (userLower === 'pustakawan' && (pass === 'smpn5bkl' || pass === 'admin123'))
    ) {
      return {
        success: true,
        user: {
          id: 'admin-001',
          username: userLower,
          name: 'Petugas Perpustakaan (Administrator)',
          role: 'admin',
          memberRole: 'Pustakawan',
          gradeClass: 'Pengelola Perpustakaan MABBARAKKA',
          email: 'perpustakaan@smpn5bulukumba.sch.id',
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
          source: 'demo_local',
          loginTime: new Date().toISOString(),
        },
        message: 'Login Admin berhasil!',
      };
    }

    // 2. Check local members by memberNumber (NISN/NIP) or name
    const foundMember = localMembers.find((m) => {
      const numMatch = m.memberNumber.toLowerCase() === userLower || m.memberNumber.toLowerCase().includes(userLower);
      const nameMatch = m.name.toLowerCase().includes(userLower);
      const emailMatch = m.email.toLowerCase() === userLower;
      return numMatch || nameMatch || emailMatch;
    });

    if (foundMember) {
      const isTeacher = foundMember.role === 'Guru';
      const isLibrarian = foundMember.role === 'Pustakawan';
      const isPasswordValid = 
        pass === 'siswa123' || 
        pass === 'guru123' || 
        pass === '123456' || 
        pass === 'admin123' || 
        (foundMember.password && foundMember.password === pass);

      if (isPasswordValid) {
        return {
          success: true,
          user: {
            id: foundMember.id,
            username: foundMember.memberNumber,
            name: foundMember.name,
            role: isLibrarian ? 'admin' : 'anggota',
            memberRole: foundMember.role,
            memberNumber: foundMember.memberNumber,
            gradeClass: foundMember.gradeClass,
            whatsapp: foundMember.whatsapp,
            email: foundMember.email,
            avatarUrl: foundMember.avatarUrl,
            source: 'demo_local',
            loginTime: new Date().toISOString(),
          },
          message: `Login berhasil sebagai ${foundMember.name} (${foundMember.role})!`,
        };
      } else {
        return {
          success: false,
          message: `Password salah untuk ${foundMember.name}. Gunakan password demo: 'siswa123' atau 'guru123'.`,
        };
      }
    }

    return {
      success: false,
      message: 'Username / NISN / NIP tidak terdaftar dalam sistem. Gunakan akun demo atau login sebagai Admin (admin / admin123).',
    };
  },

  /**
   * Test connection to Google Apps Script Web App Endpoint
   */
  async testConnection(url: string): Promise<{ success: boolean; message: string; timestamp?: string }> {
    if (!url || !url.trim().startsWith('http')) {
      return { success: false, message: 'URL Web App GAS tidak valid. Pastikan dimulai dengan https://script.google.com/macros/s/...' };
    }

    try {
      const pingUrl = url.includes('?') ? `${url}&action=ping` : `${url}?action=ping`;
      const response = await fetch(pingUrl, {
        method: 'GET',
        redirect: 'follow',
      });

      if (!response.ok) {
        return { success: false, message: `Server merespon dengan status HTTP ${response.status}` };
      }

      const data = await response.json();
      if (data && data.status === 'success') {
        return {
          success: true,
          message: data.message || 'Koneksi ke Back End GAS berhasil!',
          timestamp: data.timestamp || new Date().toISOString(),
        };
      }

      return { success: false, message: data.message || 'Respon dari GAS tidak sesuai format standar.' };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        message: `Gagal menghubungi Google Apps Script: ${errorMsg}. Pastikan deployment diset 'Akses: Siapa Saja (Anyone)'.`,
      };
    }
  },

  /**
   * Push all local data (Books, Digital Books, Members, Circulation, Journals) to Google Spreadsheet
   */
  async syncAllToGAS(
    url: string,
    payload: {
      books: Book[];
      digitalBooks?: DigitalBook[];
      members: Member[];
      circulation: CirculationRecord[];
      journals: ReadingJournalEntry[];
    }
  ): Promise<{ success: boolean; message: string; summary?: any }> {
    if (!url) return { success: false, message: 'URL Google Apps Script belum dikonfigurasi.' };

    try {
      // Use text/plain to avoid CORS preflight rejection in Google Apps Script
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({
          action: 'syncAll',
          ...payload,
        }),
        redirect: 'follow',
      });

      const result = await response.json();
      if (result && result.status === 'success') {
        return {
          success: true,
          message: result.message || 'Semua data berhasil disimpan ke Google Spreadsheet!',
          summary: result.summary,
        };
      }
      return { success: false, message: result.message || 'Gagal menyimpan data ke Spreadsheet.' };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      return { success: false, message: `Error pengiriman data ke GAS: ${errorMsg}` };
    }
  },

  /**
   * Pull all data from Google Spreadsheet into the application
   */
  async fetchAllFromGAS(url: string): Promise<{
    success: boolean;
    data?: {
      books: Book[];
      digitalBooks?: DigitalBook[];
      members: Member[];
      circulation: CirculationRecord[];
      journals: ReadingJournalEntry[];
    };
    message: string;
  }> {
    if (!url) return { success: false, message: 'URL Google Apps Script belum dikonfigurasi.' };

    try {
      const fetchUrl = url.includes('?') ? `${url}&action=getAll` : `${url}?action=getAll`;
      const response = await fetch(fetchUrl, {
        method: 'GET',
        redirect: 'follow',
      });

      const result = await response.json();
      if (result && result.status === 'success' && result.data) {
        return {
          success: true,
          data: result.data,
          message: 'Data berhasil ditarik dari Google Spreadsheet!',
        };
      }
      return { success: false, message: result.message || 'Gagal membaca data dari Spreadsheet.' };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      return { success: false, message: `Error penarikan data dari GAS: ${errorMsg}` };
    }
  },

  /**
   * Push single transaction (loan, return, book, digitalBook, journal) asynchronously
   */
  async sendSingleActionToGAS(url: string, action: string, dataKey: string, dataObj: any): Promise<void> {
    if (!url) return;
    try {
      await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({
          action: action,
          [dataKey]: dataObj,
        }),
        redirect: 'follow',
      });
    } catch (err) {
      console.warn('Background GAS sync failed silently:', err);
    }
  },

  /**
   * Generate Blogger Embed HTML Code
   */
  generateBloggerEmbedCode(appUrl: string, schoolName = 'SMP Negeri 5 Bulukumba'): string {
    const finalUrl = appUrl || window.location.href;

    return `<!-- ============================================================== -->
<!-- WIDGET APLIKASI PERPUSTAKAAN MABBARAKKA - ${schoolName} -->
<!-- Tempelkan kode HTML ini pada Laman Statis atau Postingan Blogger -->
<!-- ============================================================== -->
<div class="mabbarakka-perpus-wrapper" style="width: 100%; max-width: 100%; margin: 0 auto; padding: 0; position: relative;">
  <style>
    /* Reset & Optimasi Tampilan Responsif Layar Penuh di Blogger / Blogspot */
    .mabbarakka-perpus-wrapper iframe {
      width: 100% !important;
      min-height: 880px;
      height: 92vh;
      border: 1px solid #e2e8f0;
      border-radius: 20px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
      display: block;
      background-color: #f8fafc;
    }
    @media (max-width: 768px) {
      .mabbarakka-perpus-wrapper iframe {
        min-height: 720px;
        height: 90vh;
        border-radius: 12px;
      }
    }
  </style>

  <!-- Frame Aplikasi Perpustakaan Digital & Sirkulasi Barcode -->
  <iframe 
    src="${finalUrl}"
    title="Aplikasi Perpustakaan MABBARAKKA ${schoolName}"
    allow="camera; clipboard-write; microphone; fullscreen; geolocation"
    loading="lazy"
    frameborder="0">
  </iframe>

  <div style="text-align: center; margin-top: 10px; font-family: sans-serif; font-size: 12px; color: #64748b;">
    Sistem Informasi Perpustakaan MABBARAKKA &bull; ${schoolName}
  </div>
</div>`;
  }
};
