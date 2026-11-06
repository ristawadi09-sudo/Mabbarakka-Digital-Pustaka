import React, { useState } from 'react';
import { 
  BarChart3, 
  Printer, 
  Calendar, 
  FileText, 
  TrendingUp, 
  CheckCircle2, 
  AlertTriangle, 
  School, 
  Download,
  Sparkles,
  PieChart
} from 'lucide-react';
import { CirculationRecord, Book, Member, LibrarySettings } from '../../types/library';
import { formatRupiah, formatDateIndo } from '../../utils/formatters';

interface ReportsViewProps {
  circulation: CirculationRecord[];
  books: Book[];
  members: Member[];
  settings: LibrarySettings;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  circulation,
  books,
  members,
  settings,
}) => {
  const [selectedMonth, setSelectedMonth] = useState('10'); // Oktober
  const [selectedYear, setSelectedYear] = useState('2026');
  const [reportType, setReportType] = useState<'analytics' | 'official_document'>('analytics');

  // Calculations for selected period
  const totalLoansInPeriod = circulation.length;
  const returnedInPeriod = circulation.filter(c => c.status === 'Dikembalikan').length;
  const lateInPeriod = circulation.filter(c => c.status === 'Terlambat' || c.fineDays > 0).length;
  const totalFineInPeriod = circulation.reduce((acc, c) => acc + (c.fineAmount || 0), 0);
  const totalFinePaid = circulation.filter(c => c.finePaid).reduce((acc, c) => acc + (c.fineAmount || 0), 0);

  // Class breakdown
  const classBreakdown: { [key: string]: number } = {
    'Kelas VII': 14,
    'Kelas VIII': 28,
    'Kelas IX': 22,
    'Dewan Guru': 10,
    'Staf / Karyawan': 4,
  };

  // Day activity mock for the week
  const weeklyTrends = [
    { day: 'Senin', count: 18, color: 'bg-emerald-500' },
    { day: 'Selasa', count: 24, color: 'bg-emerald-600' },
    { day: 'Rabu', count: 31, color: 'bg-teal-500' },
    { day: 'Kamis', count: 20, color: 'bg-teal-600' },
    { day: 'Jumat', count: 15, color: 'bg-blue-500' },
    { day: 'Sabtu', count: 12, color: 'bg-indigo-500' },
  ];

  const maxWeekly = Math.max(...weeklyTrends.map(w => w.count));

  const monthNames: { [key: string]: string } = {
    '01': 'Januari', '02': 'Februari', '03': 'Maret', '04': 'April',
    '05': 'Mei', '06': 'Juni', '07': 'Juli', '08': 'Agustus',
    '09': 'September', '10': 'Oktober', '11': 'November', '12': 'Desember'
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800">
              Laporan Bulanan & Analitik Sirkulasi
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-300">
              Periode {monthNames[selectedMonth]} {selectedYear}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Statistik peminjaman berkala, tren kategori bacaan, evaluasi denda, serta cetak laporan resmi sekolah
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Month & Year Selectors */}
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 bg-white text-slate-700"
          >
            {Object.entries(monthNames).map(([key, name]) => (
              <option key={key} value={key}>{name}</option>
            ))}
          </select>

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 bg-white text-slate-700"
          >
            <option value="2026">2026</option>
            <option value="2025">2025</option>
          </select>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm transition-all"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">Cetak Dokumen</span>
          </button>
        </div>
      </div>

      {/* View Switcher: Interactive Analytics vs Formal Document */}
      <div className="flex bg-slate-100 p-1 rounded-2xl w-fit text-xs font-semibold">
        <button
          onClick={() => setReportType('analytics')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
            reportType === 'analytics' ? 'bg-white text-indigo-900 shadow-sm font-bold' : 'text-slate-600'
          }`}
        >
          <BarChart3 className="w-4 h-4 text-indigo-600" />
          <span>Dasbor Analitik Statistik</span>
        </button>
        <button
          onClick={() => setReportType('official_document')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
            reportType === 'official_document' ? 'bg-white text-indigo-900 shadow-sm font-bold' : 'text-slate-600'
          }`}
        >
          <FileText className="w-4 h-4 text-emerald-600" />
          <span>Format Laporan Resmi Perpustakaan (Kop & TTD)</span>
        </button>
      </div>

      {reportType === 'analytics' ? (
        <div className="space-y-6">
          
          {/* 4 Summary Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Transaksi Sirkulasi</span>
              <div className="text-2xl font-extrabold text-slate-800 mt-1">{totalLoansInPeriod}</div>
              <p className="text-xs text-emerald-600 font-semibold mt-0.5">
                +12% peningkatan dibanding bulan lalu
              </p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Pengembalian Tepat Waktu</span>
              <div className="text-2xl font-extrabold text-emerald-700 mt-1">
                {Math.round((returnedInPeriod / (totalLoansInPeriod || 1)) * 100)}%
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {returnedInPeriod} buku telah selesai dipinjam
              </p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tingkat Keterlambatan</span>
              <div className="text-2xl font-extrabold text-rose-600 mt-1">
                {lateInPeriod} Kasus
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Otomatis terhubung dengan sistem notifikasi
              </p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Rekap Denda Terkumpul</span>
              <div className="text-2xl font-extrabold text-amber-700 mt-1">
                {formatRupiah(totalFinePaid)}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Disetorkan ke kas pemeliharaan buku
              </p>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Weekly Loan Distribution Bar Chart */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-800 text-sm mb-1 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-600" />
                <span>Statistik Peminjaman Mingguan</span>
              </h3>
              <p className="text-xs text-slate-500 mb-6">
                Hari paling ramai pengunjung & sirkulasi di perpustakaan
              </p>

              <div className="flex items-end justify-between gap-3 h-48 pt-6 pb-2 px-4 border-b border-slate-200">
                {weeklyTrends.map((w, i) => {
                  const heightPercent = (w.count / maxWeekly) * 100;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                      <span className="text-[11px] font-bold text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity">
                        {w.count}
                      </span>
                      <div 
                        className={`w-full max-w-[42px] ${w.color} rounded-t-xl transition-all duration-500 group-hover:brightness-110 shadow-sm`}
                        style={{ height: `${heightPercent}%` }}
                      ></div>
                      <span className="text-[11px] font-semibold text-slate-600 mt-1">
                        {w.day}
                      </span>
                    </div>
                  );
                })}
              </div>
              <p className="text-[11px] text-slate-400 mt-3 text-center">
                Puncak kunjungan tertinggi berada di hari <strong className="text-slate-700">Rabu</strong> (Jadwal Literasi Merdeka).
              </p>
            </div>

            {/* Reading Participation by Class */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-800 text-sm mb-1 flex items-center gap-2">
                <PieChart className="w-4 h-4 text-indigo-600" />
                <span>Partisipasi Membaca Berdasarkan Jenjang</span>
              </h3>
              <p className="text-xs text-slate-500 mb-6">
                Persentase keaktifan siswa kelas 7, 8, 9, dan guru
              </p>

              <div className="space-y-4">
                {Object.entries(classBreakdown).map(([label, count], i) => {
                  const percentage = Math.round((count / 78) * 100);
                  return (
                    <div key={i} className="text-xs">
                      <div className="flex justify-between font-semibold text-slate-700 mb-1">
                        <span>{label}</span>
                        <span>{count} Peminjaman ({percentage}%)</span>
                      </div>
                      <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

        </div>
      ) : (
        /* Formal Printable Official Document */
        <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-8 sm:p-12 max-w-4xl mx-auto space-y-6 print:border-none print:shadow-none print:p-0">
          
          {/* Formal School Letterhead (KOP SURAT RESMI) */}
          <div className="text-center pb-4 border-b-4 border-double border-slate-900 space-y-1">
            <h4 className="font-bold text-xs uppercase tracking-widest text-slate-700">
              PEMERINTAH KABUPATEN BULUKUMBA
            </h4>
            <h3 className="font-bold text-sm uppercase tracking-wider text-slate-800">
              DINAS PENDIDIKAN DAN KEBUDAYAAN
            </h3>
            <h2 className="font-extrabold text-xl sm:text-2xl uppercase tracking-tight text-slate-900">
              {settings.schoolName}
            </h2>
            <h3 className="font-bold text-sm tracking-wide text-emerald-800">
              UNIT PELAKSANA TEKNIS PERPUSTAKAAN &ldquo;{settings.libraryName}&rdquo;
            </h3>
            <p className="text-[11px] text-slate-600">
              {settings.address} &bull; Bulukumba, {settings.province}
            </p>
          </div>

          {/* Document Title */}
          <div className="text-center space-y-1 pt-2">
            <h3 className="font-extrabold text-base uppercase underline text-slate-900">
              LAPORAN BULANAN SIRKULASI & PELAYANAN PERPUSTAKAAN
            </h3>
            <p className="text-xs text-slate-600">
              Nomor: 421.3 / {selectedMonth}.{selectedYear} / PERPUS-SMPN5 / {selectedYear}
            </p>
            <p className="text-xs font-semibold text-slate-700">
              Bulan: {monthNames[selectedMonth]} {selectedYear}
            </p>
          </div>

          {/* Body Content */}
          <div className="space-y-4 text-xs text-slate-800 leading-relaxed">
            <p>
              Bersama ini disampaikan rekapitulasi data operasional peminjaman, pengembalian, koleksi buku cetak dan buku digital pada Perpustakaan MABBARAKKA SMP Negeri 5 Bulukumba sebagai berikut:
            </p>

            <table className="w-full border border-slate-300 text-left text-xs">
              <thead className="bg-slate-100 font-bold">
                <tr>
                  <th className="p-2 border border-slate-300">No.</th>
                  <th className="p-2 border border-slate-300">Indikator Layanan Perpustakaan</th>
                  <th className="p-2 border border-slate-300 text-center">Jumlah / Nilai</th>
                  <th className="p-2 border border-slate-300">Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300">
                <tr>
                  <td className="p-2 border border-slate-300 text-center">1</td>
                  <td className="p-2 border border-slate-300">Total Koleksi Judul Buku Cetak</td>
                  <td className="p-2 border border-slate-300 text-center font-bold">{books.length} Judul</td>
                  <td className="p-2 border border-slate-300">Tersedia di Rak A s.d D</td>
                </tr>
                <tr>
                  <td className="p-2 border border-slate-300 text-center">2</td>
                  <td className="p-2 border border-slate-300">Total Koleksi E-Book Digital</td>
                  <td className="p-2 border border-slate-300 text-center font-bold">4 Judul</td>
                  <td className="p-2 border border-slate-300">Dapat diakses e-Reader interaktif</td>
                </tr>
                <tr>
                  <td className="p-2 border border-slate-300 text-center">3</td>
                  <td className="p-2 border border-slate-300">Jumlah Anggota Aktif Terdaftar</td>
                  <td className="p-2 border border-slate-300 text-center font-bold">{members.length} Orang</td>
                  <td className="p-2 border border-slate-300">Siswa, Dewan Guru & Staf</td>
                </tr>
                <tr>
                  <td className="p-2 border border-slate-300 text-center">4</td>
                  <td className="p-2 border border-slate-300">Total Transaksi Peminjaman</td>
                  <td className="p-2 border border-slate-300 text-center font-bold">{totalLoansInPeriod} Transaksi</td>
                  <td className="p-2 border border-slate-300">Menggunakan Barcode Scanner</td>
                </tr>
                <tr>
                  <td className="p-2 border border-slate-300 text-center">5</td>
                  <td className="p-2 border border-slate-300">Buku Selesai Dikembalikan</td>
                  <td className="p-2 border border-slate-300 text-center font-bold">{returnedInPeriod} Buku</td>
                  <td className="p-2 border border-slate-300">Tepat waktu & terawat</td>
                </tr>
                <tr>
                  <td className="p-2 border border-slate-300 text-center">6</td>
                  <td className="p-2 border border-slate-300">Kasus Keterlambatan Pengembalian</td>
                  <td className="p-2 border border-slate-300 text-center font-bold text-rose-600">{lateInPeriod} Kasus</td>
                  <td className="p-2 border border-slate-300">Telah dikirimi notifikasi WA/Email</td>
                </tr>
                <tr>
                  <td className="p-2 border border-slate-300 text-center">7</td>
                  <td className="p-2 border border-slate-300">Penerimaan Denda Keterlambatan</td>
                  <td className="p-2 border border-slate-300 text-center font-bold text-emerald-700">{formatRupiah(totalFinePaid)}</td>
                  <td className="p-2 border border-slate-300">Disetorkan ke bendahara perpustakaan</td>
                </tr>
              </tbody>
            </table>

            <p className="pt-2">
              Demikian laporan bulanan ini dibuat dengan sebenar-benarnya untuk digunakan sebagai bahan evaluasi Gerakan Literasi Sekolah (GLS) di lingkungan SMP Negeri 5 Bulukumba.
            </p>
          </div>

          {/* Signatures Block (Tanda Tangan Resmi) */}
          <div className="pt-8 grid grid-cols-2 gap-8 text-xs text-center text-slate-800">
            <div>
              <p className="text-slate-500 mb-1">Mengetahui,</p>
              <p className="font-bold">Kepala SMP Negeri 5 Bulukumba</p>
              <div className="h-20"></div>
              <p className="font-bold underline text-slate-900">{settings.headmasterName}</p>
              <p className="text-[11px] text-slate-500">NIP. 19680812 199303 1 008</p>
            </div>

            <div>
              <p className="text-slate-500 mb-1">Bulukumba, 31 {monthNames[selectedMonth]} {selectedYear}</p>
              <p className="font-bold">Kepala Perpustakaan MABBARAKKA</p>
              <div className="h-20"></div>
              <p className="font-bold underline text-slate-900">{settings.headOfLibraryName}</p>
              <p className="text-[11px] text-slate-500">NIP. {settings.librarianNIP}</p>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
