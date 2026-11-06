import { CirculationRecord, LibrarySettings } from '../types/library';

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDateIndo(dateStr?: string): string {
  if (!dateStr) return '-';
  try {
    const date = new Date(dateStr + (dateStr.length === 10 ? 'T00:00:00' : ''));
    if (isNaN(date.getTime())) return dateStr;
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date);
  } catch {
    return dateStr;
  }
}

export function formatDateTimeIndo(dateStr?: string): string {
  if (!dateStr) return '-';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return dateStr;
  }
}

/**
 * Calculates days difference between today and dueDate.
 * If today > dueDate, returns positive integer (number of late days).
 * If today <= dueDate, returns 0 or negative.
 */
export function calculateOverdueDays(dueDateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const due = new Date(dueDateStr + 'T00:00:00');
  due.setHours(0, 0, 0, 0);
  
  const diffTime = today.getTime() - due.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

/**
 * Generate official WhatsApp reminder message
 */
export function generateWhatsAppMessage(
  record: CirculationRecord, 
  settings: LibrarySettings
): { phone: string; text: string; url: string } {
  // Format phone number to international format 62xxx
  let phone = record.memberWhatsapp.replace(/\D/g, '');
  if (phone.startsWith('0')) {
    phone = '62' + phone.substring(1);
  } else if (!phone.startsWith('62')) {
    phone = '62' + phone;
  }

  const overdueDays = calculateOverdueDays(record.dueDate);
  const totalFine = overdueDays * (record.finePerDay || settings.finePerDay);

  let text = '';
  if (overdueDays > 0) {
    text = 
`*PEMBERITAHUAN KETERLAMBATAN PENGEMBALIAN BUKU*
*Perpustakaan MABBARAKKA - SMP Negeri 5 Bulukumba*
----------------------------------------
Yth. *${record.memberName}* (${record.memberClass || record.memberRole}),

Diberitahukan bahwa buku perpustakaan yang Anda pinjam telah *melewati batas waktu (jatuh tempo)*:

📖 *Judul Buku:* ${record.bookTitle}
🔖 *Barcode:* ${record.bookBarcode}
📅 *Tgl Pinjam:* ${formatDateIndo(record.borrowDate)}
⏰ *Jatuh Tempo:* ${formatDateIndo(record.dueDate)}
⚠️ *Keterlambatan:* ${overdueDays} hari
💰 *Estimasi Denda:* ${formatRupiah(totalFine)} (${formatRupiah(record.finePerDay || settings.finePerDay)}/hari)

Mohon untuk segera mengembalikan buku tersebut ke loket Perpustakaan MABBARAKKA SMPN 5 Bulukumba pada jam operasional sekolah untuk menghindari pertambahan denda dan agar buku dapat dimanfaatkan oleh teman-teman lainnya.

Mari jaga amanah dan rawat budaya literasi sekolah kita.
_Salam Literasi Berkah (Mabbarakka) - Butta Panrita Lopi_ 📚✨

*Petugas Perpustakaan SMPN 5 Bulukumba*`;
  } else {
    text = 
`*PENGINGAT BATAS WAKTU PEMINJAMAN BUKU*
*Perpustakaan MABBARAKKA - SMP Negeri 5 Bulukumba*
----------------------------------------
Halo *${record.memberName}* (${record.memberClass || record.memberRole}),

Peminjaman buku perpustakaan Anda akan segera berakhir:

📖 *Judul Buku:* ${record.bookTitle}
⏰ *Batas Pengembalian:* ${formatDateIndo(record.dueDate)}

Harap mengembalikan atau mengajukan perpanjangan buku sebelum tanggal tersebut ya. Terima kasih telah rajin membaca di Perpustakaan MABBARAKKA!

*Petugas Perpustakaan SMPN 5 Bulukumba*`;
  }

  const encodedText = encodeURIComponent(text);
  const url = `https://api.whatsapp.com/send?phone=${phone}&text=${encodedText}`;

  return { phone, text, url };
}

/**
 * Generate official Email reminder
 */
export function generateEmailMessage(
  record: CirculationRecord,
  settings: LibrarySettings
): { to: string; subject: string; body: string; mailtoUrl: string } {
  const overdueDays = calculateOverdueDays(record.dueDate);
  const totalFine = overdueDays * (record.finePerDay || settings.finePerDay);

  const subject = overdueDays > 0
    ? `[PENTING] Keterlambatan Pengembalian Buku - Perpustakaan MABBARAKKA SMPN 5 Bulukumba`
    : `[PENGINGAT] Batas Waktu Pengembalian Buku - Perpustakaan MABBARAKKA SMPN 5 Bulukumba`;

  const body = 
`Kepada Yth. ${record.memberName} (${record.memberClass || record.memberRole}),

Salam hangat dari Perpustakaan MABBARAKKA SMP Negeri 5 Bulukumba.

Kami mencatat peminjaman buku berikut dalam sistem sirkulasi kami:
- Judul Buku: ${record.bookTitle}
- Kode Barcode: ${record.bookBarcode}
- Tanggal Peminjaman: ${formatDateIndo(record.borrowDate)}
- Batas Jatuh Tempo: ${formatDateIndo(record.dueDate)}
${overdueDays > 0 ? `- Status: Terlambat ${overdueDays} Hari\n- Estimasi Denda Otomatis: ${formatRupiah(totalFine)}` : '- Status: Mendekati Jatuh Tempo'}

Mohon untuk segera mengembalikan buku tersebut ke ruang Perpustakaan MABBARAKKA SMPN 5 Bulukumba. Jika buku masih ingin dibaca, Anda dapat mengajukan perpanjangan jika tidak sedang diantre oleh pembaca lain.

Terima kasih atas kerja samanya dalam memelihara dan menghargai koleksi buku sekolah kita.

Hormat kami,
Pengelola Perpustakaan MABBARAKKA
SMP Negeri 5 Bulukumba
Jl. Pendidikan, Bulukumba, Sulawesi Selatan`;

  const mailtoUrl = `mailto:${record.memberEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  return { to: record.memberEmail, subject, body, mailtoUrl };
}
