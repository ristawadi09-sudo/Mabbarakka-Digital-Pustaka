import { Book, DigitalBook, BookCategory } from '../types/library';
import { normalizeCategory } from '../services/storageService';

/**
 * Escapes a cell for CSV formatting (handles quotes, commas, newlines)
 */
function escapeCSV(val: any): string {
  if (val === null || val === undefined) return '""';
  const str = String(val);
  if (str.includes('"') || str.includes(',') || str.includes(';') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

/**
 * Parse CSV line respecting quotes
 */
function parseCSVLine(line: string, delimiter = ','): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++; // skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Detect delimiter: comma (,) or semicolon (;) common in Indonesian / European Excel
 */
function detectDelimiter(firstLine: string): string {
  const semicolons = (firstLine.match(/;/g) || []).length;
  const commas = (firstLine.match(/,/g) || []).length;
  return semicolons > commas ? ';' : ',';
}

/**
 * Export Printed Books to CSV string
 */
export function exportBooksToCSV(books: Book[]): string {
  const headers = [
    'Barcode',
    'ISBN',
    'Judul Buku',
    'Penulis',
    'Penerbit',
    'Tahun Terbit',
    'Kategori',
    'Lokasi Rak',
    'Total Stok',
    'Stok Tersedia',
    'Jumlah Halaman',
    'Bahasa',
    'Deskripsi / Sinopsis',
    'URL Sampul',
    'Tanggal Ditambahkan'
  ];

  const rows = books.map((b) => [
    escapeCSV(b.barcode),
    escapeCSV(b.isbn),
    escapeCSV(b.title),
    escapeCSV(b.author),
    escapeCSV(b.publisher),
    escapeCSV(b.year),
    escapeCSV(b.category),
    escapeCSV(b.rackLocation),
    escapeCSV(b.totalCopies),
    escapeCSV(b.availableCopies),
    escapeCSV(b.pages),
    escapeCSV(b.language),
    escapeCSV(b.description),
    escapeCSV(b.coverUrl || ''),
    escapeCSV(b.addedDate || new Date().toISOString().split('T')[0])
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
}

/**
 * Export Digital Books to CSV string
 */
export function exportDigitalBooksToCSV(digitalBooks: DigitalBook[]): string {
  const headers = [
    'ID E-Book',
    'Judul E-Book',
    'Penulis / Penyusun',
    'Kategori',
    'Kurikulum / Label',
    'Jumlah Halaman',
    'Ukuran & Format Berkas',
    'Rating',
    'Jumlah Dibaca',
    'URL Sampul',
    'Link Unduhan / File PDF',
    'Sinopsis / Deskripsi',
    'Jumlah Bab'
  ];

  const rows = digitalBooks.map((d) => [
    escapeCSV(d.id),
    escapeCSV(d.title),
    escapeCSV(d.author),
    escapeCSV(d.category),
    escapeCSV(d.curriculum || 'Kurikulum Merdeka'),
    escapeCSV(d.totalPages),
    escapeCSV(d.fileSize),
    escapeCSV(d.rating),
    escapeCSV(d.readCount),
    escapeCSV(d.coverUrl || ''),
    escapeCSV(d.downloadUrl || ''),
    escapeCSV(d.description),
    escapeCSV(d.content?.chapters?.length || 1)
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
}

/**
 * Export Combined Catalog (Both Printed & Digital) to CSV
 */
export function exportAllCatalogToCSV(books: Book[], digitalBooks: DigitalBook[]): string {
  const headers = [
    'Jenis Koleksi',
    'Kode / ID',
    'Judul Buku / E-Book',
    'Penulis',
    'Penerbit / Kurikulum',
    'Kategori',
    'Lokasi Rak / Format Berkas',
    'Halaman',
    'Ketersediaan / Rating',
    'Deskripsi'
  ];

  const printedRows = books.map((b) => [
    escapeCSV('Buku Cetak (Fisik)'),
    escapeCSV(b.barcode),
    escapeCSV(b.title),
    escapeCSV(b.author),
    escapeCSV(b.publisher),
    escapeCSV(b.category),
    escapeCSV(b.rackLocation),
    escapeCSV(b.pages),
    escapeCSV(`${b.availableCopies}/${b.totalCopies} Tersedia`),
    escapeCSV(b.description)
  ]);

  const digitalRows = digitalBooks.map((d) => [
    escapeCSV('Buku Digital (E-Book)'),
    escapeCSV(d.id),
    escapeCSV(d.title),
    escapeCSV(d.author),
    escapeCSV(d.curriculum || 'Kurikulum Merdeka'),
    escapeCSV(d.category),
    escapeCSV(d.fileSize),
    escapeCSV(d.totalPages),
    escapeCSV(`Rating ${d.rating} (${d.readCount}x dibaca)`),
    escapeCSV(d.description)
  ]);

  return [headers.join(','), ...printedRows.map((r) => r.join(',')), ...digitalRows.map((r) => r.join(','))].join('\r\n');
}

/**
 * Triggers browser download for a CSV string with UTF-8 BOM (so Excel displays Indonesian accents properly)
 */
export function downloadCSVFile(content: string, filename: string): void {
  // \uFEFF is UTF-8 Byte Order Mark for Excel compatibility
  const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Parses user-uploaded CSV text for Printed Books
 */
export function parseBooksCSV(csvText: string): Book[] {
  const lines = csvText.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
  if (lines.length < 2) return [];

  const delimiter = detectDelimiter(lines[0]);
  const headers = parseCSVLine(lines[0], delimiter).map((h) => h.toLowerCase());

  // Helper to find header column index
  const getCol = (possibleNames: string[]): number => {
    for (const name of possibleNames) {
      const idx = headers.findIndex((h) => h.includes(name));
      if (idx !== -1) return idx;
    }
    return -1;
  };

  const titleCol = getCol(['judul', 'title']);
  const authorCol = getCol(['penulis', 'pengarang', 'author']);
  const barcodeCol = getCol(['barcode', 'kode']);
  const isbnCol = getCol(['isbn']);
  const publisherCol = getCol(['penerbit', 'publisher']);
  const yearCol = getCol(['tahun', 'year']);
  const categoryCol = getCol(['kategori', 'category']);
  const rackCol = getCol(['rak', 'lokasi', 'rack']);
  const totalCopiesCol = getCol(['total', 'stok', 'jumlah buku', 'copies']);
  const pagesCol = getCol(['halaman', 'pages']);
  const descCol = getCol(['deskripsi', 'sinopsis', 'description']);

  const parsedBooks: Book[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i], delimiter);
    if (!cols || cols.length === 0) continue;

    const title = titleCol !== -1 && cols[titleCol] ? cols[titleCol].trim() : (cols[2] || cols[0] || '').trim();
    if (!title) continue;

    const author = authorCol !== -1 && cols[authorCol] ? cols[authorCol].trim() : (cols[3] || cols[1] || 'Tim Guru SMPN 5 Bulukumba').trim();
    const barcode = barcodeCol !== -1 && cols[barcodeCol] ? cols[barcodeCol].trim() : `SMP5-BK-${String(parsedBooks.length + 100).padStart(3, '0')}`;
    const isbn = isbnCol !== -1 && cols[isbnCol] ? cols[isbnCol].trim() : `978-602-00-${Math.floor(1000 + Math.random() * 9000)}-1`;
    const publisher = publisherCol !== -1 && cols[publisherCol] ? cols[publisherCol].trim() : 'Kemendikbudristek / Perpustakaan SMPN 5 Bulukumba';
    const year = yearCol !== -1 && cols[yearCol] ? parseInt(cols[yearCol]) || 2026 : 2026;
    const categoryRaw = categoryCol !== -1 && cols[categoryCol] ? cols[categoryCol].trim() : 'Buku Pelajaran & Paket';
    const rackLocation = rackCol !== -1 && cols[rackCol] ? cols[rackCol].trim() : 'Rak A-01';
    const totalCopies = totalCopiesCol !== -1 && cols[totalCopiesCol] ? parseInt(cols[totalCopiesCol]) || 3 : 3;
    const pages = pagesCol !== -1 && cols[pagesCol] ? parseInt(cols[pagesCol]) || 120 : 120;
    const description = descCol !== -1 && cols[descCol] ? cols[descCol].trim() : `Koleksi buku ${title} di perpustakaan MABBARAKKA SMPN 5 Bulukumba.`;

    // Normalize category to the 13 official categories
    const category: BookCategory = normalizeCategory(categoryRaw);

    parsedBooks.push({
      id: `b-imp-${Date.now()}-${i}`,
      barcode: barcode || `SMP5-BK-${String(i).padStart(3, '0')}`,
      isbn: isbn || '-',
      title,
      author,
      publisher,
      year,
      category,
      rackLocation,
      totalCopies,
      availableCopies: totalCopies,
      pages,
      language: 'Bahasa Indonesia',
      description,
      coverUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=400&q=80',
      addedDate: new Date().toISOString().split('T')[0]
    });
  }

  return parsedBooks;
}

/**
 * Parses user-uploaded CSV text for Digital Books
 */
export function parseDigitalBooksCSV(csvText: string): DigitalBook[] {
  const lines = csvText.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
  if (lines.length < 2) return [];

  const delimiter = detectDelimiter(lines[0]);
  const headers = parseCSVLine(lines[0], delimiter).map((h) => h.toLowerCase());

  const getCol = (possibleNames: string[]): number => {
    for (const name of possibleNames) {
      const idx = headers.findIndex((h) => h.includes(name));
      if (idx !== -1) return idx;
    }
    return -1;
  };

  const titleCol = getCol(['judul', 'title', 'ebook']);
  const authorCol = getCol(['penulis', 'author', 'penyusun']);
  const categoryCol = getCol(['kategori', 'category']);
  const curriculumCol = getCol(['kurikulum', 'curriculum', 'label']);
  const pagesCol = getCol(['halaman', 'pages']);
  const sizeCol = getCol(['ukuran', 'format', 'size']);
  const descCol = getCol(['deskripsi', 'sinopsis', 'description']);
  const downloadCol = getCol(['unduh', 'link', 'download', 'drive', 'url']);

  const parsedDigitalBooks: DigitalBook[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i], delimiter);
    if (!cols || cols.length === 0) continue;

    const title = titleCol !== -1 && cols[titleCol] ? cols[titleCol].trim() : (cols[1] || cols[0] || '').trim();
    if (!title) continue;

    const author = authorCol !== -1 && cols[authorCol] ? cols[authorCol].trim() : (cols[2] || 'Tim Guru SMPN 5 Bulukumba').trim();
    const categoryRaw = categoryCol !== -1 && cols[categoryCol] ? cols[categoryCol].trim() : 'Budaya Lokal & Muatan Daerah';
    const curriculum = curriculumCol !== -1 && cols[curriculumCol] ? cols[curriculumCol].trim() : 'Kurikulum Merdeka';
    const totalPages = pagesCol !== -1 && cols[pagesCol] ? parseInt(cols[pagesCol]) || 80 : 80;
    const fileSize = sizeCol !== -1 && cols[sizeCol] ? cols[sizeCol].trim() : '3.5 MB (PDF & E-Pub)';
    const description = descCol !== -1 && cols[descCol] ? cols[descCol].trim() : `Koleksi modul & e-book digital ${title} SMP Negeri 5 Bulukumba.`;
    const downloadUrl = downloadCol !== -1 && cols[downloadCol] ? cols[downloadCol].trim() : undefined;

    // Normalize category to the 13 official categories
    const category: BookCategory = normalizeCategory(categoryRaw);

    parsedDigitalBooks.push({
      id: `dig-imp-${Date.now()}-${i}`,
      title,
      author,
      category,
      curriculum,
      totalPages,
      fileSize,
      rating: 5.0,
      readCount: 0,
      description,
      coverUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=400&q=80',
      downloadUrl: downloadUrl || undefined,
      content: {
        chapters: [
          {
            id: 1,
            title: `Bab 1: Pengantar ${title}`,
            text: `${description}\n\nModul digital e-book ini disajikan untuk mendukung pembelajaran mandiri peserta didik SMP Negeri 5 Bulukumba. Silakan pelajari setiap pokok bahasan dan catat refleksi membaca Anda.`
          },
          {
            id: 2,
            title: 'Bab 2: Pokok Bahasan & Pendalaman Materi',
            text: `Pada bab ini dijabarkan penjelasan rinci, studi kasus kontekstual di wilayah Kabupaten Bulukumba, serta latihan pemahaman untuk mengasah nalar kritis dan literasi digital siswa.`
          }
        ]
      }
    });
  }

  return parsedDigitalBooks;
}
