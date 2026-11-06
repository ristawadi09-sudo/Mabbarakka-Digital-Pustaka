import React, { useState, useMemo } from 'react';
import { 
  Repeat, 
  Search, 
  Filter, 
  Plus, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Calendar, 
  MessageSquare, 
  Mail, 
  Printer, 
  ScanLine, 
  RefreshCw, 
  X,
  FileCheck2,
  BadgePercent
} from 'lucide-react';
import { CirculationRecord, Book, Member, LibrarySettings } from '../../types/library';
import { formatDateIndo, formatRupiah, calculateOverdueDays } from '../../utils/formatters';
import { ReceiptModal } from './ReceiptModal';
import { sounds } from '../../utils/audio';

interface CirculationViewProps {
  circulation: CirculationRecord[];
  books: Book[];
  members: Member[];
  settings: LibrarySettings;
  onReturnBook: (recordId: string) => void;
  onExtendLoan: (recordId: string, additionalDays: number) => void;
  onOpenQuickBorrow: () => void;
  onOpenScanner: () => void;
  onSendWhatsApp: (record: CirculationRecord) => void;
  onSendEmail: (record: CirculationRecord) => void;
  onPayFine: (recordId: string) => void;
}

export const CirculationView: React.FC<CirculationViewProps> = ({
  circulation,
  books,
  members,
  settings,
  onReturnBook,
  onExtendLoan,
  onOpenQuickBorrow,
  onOpenScanner,
  onSendWhatsApp,
  onSendEmail,
  onPayFine,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'overdue' | 'returned'>('all');
  const [selectedReceipt, setSelectedReceipt] = useState<{ record: CirculationRecord; type: 'borrow' | 'return' } | null>(null);

  // Filter records
  const filteredRecords = useMemo(() => {
    return circulation.filter((c) => {
      const q = searchTerm.toLowerCase();
      const matchSearch = 
        !q ||
        c.bookTitle.toLowerCase().includes(q) ||
        c.bookBarcode.toLowerCase().includes(q) ||
        c.memberName.toLowerCase().includes(q) ||
        c.memberNumber.toLowerCase().includes(q) ||
        c.transactionCode.toLowerCase().includes(q);

      const isOverdue = c.status === 'Terlambat' || (c.status === 'Dipinjam' && calculateOverdueDays(c.dueDate) > 0);
      const isReturned = c.status === 'Dikembalikan';
      const isActive = (c.status === 'Dipinjam' || c.status === 'Terlambat') && !isReturned;

      if (activeTab === 'active') return matchSearch && isActive;
      if (activeTab === 'overdue') return matchSearch && isOverdue && !isReturned;
      if (activeTab === 'returned') return matchSearch && isReturned;
      return matchSearch;
    });
  }, [circulation, searchTerm, activeTab]);

  const activeCount = circulation.filter(c => c.status !== 'Dikembalikan').length;
  const overdueCount = circulation.filter(c => c.status !== 'Dikembalikan' && (c.status === 'Terlambat' || calculateOverdueDays(c.dueDate) > 0)).length;
  const returnedCount = circulation.filter(c => c.status === 'Dikembalikan').length;

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800">
              Sirkulasi Peminjaman & Pengembalian
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
              {circulation.length} Transaksi
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manajemen alur sirkulasi buku cetak, perpanjangan masa pinjam, denda keterlambatan, dan barcode scanner
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenScanner}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-sm transition-all active:scale-95"
          >
            <ScanLine className="w-4 h-4 text-teal-400" />
            <span>Scan Barcode</span>
          </button>

          <button
            onClick={onOpenQuickBorrow}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-700/20 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Peminjaman Baru</span>
          </button>
        </div>
      </div>

      {/* Tabs and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-4">
        
        {/* Top bar with search & status tabs */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
          
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-semibold overflow-x-auto w-full lg:w-auto scrollbar-none">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg shrink-0 transition-all ${
                activeTab === 'all' ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua ({circulation.length})
            </button>
            <button
              onClick={() => setActiveTab('active')}
              className={`px-3 py-1.5 rounded-lg shrink-0 transition-all ${
                activeTab === 'active' ? 'bg-white text-blue-800 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Aktif ({activeCount})
            </button>
            <button
              onClick={() => setActiveTab('overdue')}
              className={`px-3 py-1.5 rounded-lg shrink-0 transition-all flex items-center gap-1 ${
                activeTab === 'overdue' ? 'bg-rose-600 text-white shadow-sm font-bold' : 'text-rose-700 hover:bg-rose-50'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Jatuh Tempo ({overdueCount})</span>
            </button>
            <button
              onClick={() => setActiveTab('returned')}
              className={`px-3 py-1.5 rounded-lg shrink-0 transition-all ${
                activeTab === 'returned' ? 'bg-white text-emerald-800 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Dikembalikan ({returnedCount})
            </button>
          </div>

          {/* Search box */}
          <div className="relative w-full lg:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari peminjam, judul buku, kode..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 text-slate-800"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-3 top-2.5 text-slate-400">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

        </div>

      </div>

      {/* Circulation Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4">Kode Transaksi</th>
                <th className="py-3.5 px-4">Buku & Barcode</th>
                <th className="py-3.5 px-4">Peminjam</th>
                <th className="py-3.5 px-4">Tgl Pinjam & Jatuh Tempo</th>
                <th className="py-3.5 px-4">Status & Denda</th>
                <th className="py-3.5 px-4 text-right">Aksi Sirkulasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Repeat className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600">Tidak ada riwayat peminjaman</p>
                    <p className="text-[11px] mt-0.5">Silakan lakukan transaksi peminjaman baru</p>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => {
                  const lateDays = calculateOverdueDays(record.dueDate);
                  const isLate = record.status !== 'Dikembalikan' && (record.status === 'Terlambat' || lateDays > 0);
                  const isReturned = record.status === 'Dikembalikan';
                  const fine = isLate ? lateDays * (record.finePerDay || settings.finePerDay) : record.fineAmount;

                  return (
                    <tr 
                      key={record.id} 
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isLate ? 'bg-rose-50/30' : ''
                      }`}
                    >
                      {/* Code */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                        {record.transactionCode}
                        {record.notes && (
                          <span className="block font-sans text-[10px] text-slate-400 font-normal truncate max-w-[140px]">
                            {record.notes}
                          </span>
                        )}
                      </td>

                      {/* Book */}
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-slate-800 truncate max-w-[200px]" title={record.bookTitle}>
                          {record.bookTitle}
                        </p>
                        <span className="font-mono text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                          {record.bookBarcode}
                        </span>
                      </td>

                      {/* Member */}
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-slate-800">
                          {record.memberName}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {record.memberClass || record.memberRole} &bull; {record.memberNumber}
                        </p>
                      </td>

                      {/* Dates */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>Pinjam: {formatDateIndo(record.borrowDate)}</span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Clock className={`w-3.5 h-3.5 ${isLate ? 'text-rose-600' : 'text-slate-400'}`} />
                          <span className={`font-semibold ${isLate ? 'text-rose-600' : 'text-slate-700'}`}>
                            Tempo: {formatDateIndo(record.dueDate)}
                          </span>
                        </div>
                        {isReturned && record.returnDate && (
                          <p className="text-[10px] text-emerald-600 font-medium">
                            Kembali: {formatDateIndo(record.returnDate)}
                          </p>
                        )}
                      </td>

                      {/* Status & Denda */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          isReturned
                            ? 'bg-emerald-100 text-emerald-800'
                            : isLate
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {isReturned ? (
                            <>
                              <CheckCircle2 className="w-3 h-3" /> Dikembalikan
                            </>
                          ) : isLate ? (
                            <>
                              <AlertTriangle className="w-3 h-3" /> Terlambat {lateDays} Hari
                            </>
                          ) : (
                            <>
                              <Repeat className="w-3 h-3" /> Sedang Dipinjam
                            </>
                          )}
                        </span>

                        {/* Fine info */}
                        {fine > 0 && (
                          <div className="mt-1">
                            <span className="font-bold text-rose-600 text-xs">
                              {formatRupiah(fine)}
                            </span>
                            <span className={`ml-1 text-[10px] font-semibold px-1.5 py-0.2 rounded ${
                              record.finePaid ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {record.finePaid ? 'Lunas' : 'Belum Bayar'}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right space-x-1 whitespace-nowrap">
                        
                        {/* If active, can Return */}
                        {!isReturned && (
                          <button
                            onClick={() => onReturnBook(record.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition-all"
                            title="Proses Pengembalian Buku"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Kembalikan</span>
                          </button>
                        )}

                        {/* If active, can Extend */}
                        {!isReturned && (
                          <button
                            onClick={() => onExtendLoan(record.id, 7)}
                            className="inline-flex items-center gap-1 px-2 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
                            title="Perpanjang 7 Hari"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">+7 Hr</span>
                          </button>
                        )}

                        {/* WhatsApp Reminder if overdue */}
                        {isLate && (
                          <button
                            onClick={() => onSendWhatsApp(record)}
                            className="p-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white transition-colors"
                            title="Kirim Notifikasi Pengingat WhatsApp"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Email Reminder if overdue */}
                        {isLate && (
                          <button
                            onClick={() => onSendEmail(record)}
                            className="p-1.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white transition-colors"
                            title="Kirim Pengingat Email"
                          >
                            <Mail className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Pay fine if unpaid */}
                        {fine > 0 && !record.finePaid && (
                          <button
                            onClick={() => onPayFine(record.id)}
                            className="p-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white transition-colors"
                            title="Bayar Denda"
                          >
                            <BadgePercent className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Print Receipt */}
                        <button
                          onClick={() => setSelectedReceipt({ record, type: isReturned ? 'return' : 'borrow' })}
                          className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                          title="Cetak Bukti Transaksi"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>

                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Printable Receipt Modal */}
      {selectedReceipt && (
        <ReceiptModal
          record={selectedReceipt.record}
          settings={settings}
          type={selectedReceipt.type}
          onClose={() => setSelectedReceipt(null)}
        />
      )}

    </div>
  );
};
