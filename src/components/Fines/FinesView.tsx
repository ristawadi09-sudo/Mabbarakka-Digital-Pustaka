import React, { useState } from 'react';
import { 
  BadgePercent, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  Printer, 
  CreditCard, 
  Sparkles,
  Settings,
  DollarSign
} from 'lucide-react';
import { CirculationRecord, LibrarySettings } from '../../types/library';
import { formatRupiah, formatDateIndo, calculateOverdueDays } from '../../utils/formatters';
import { sounds } from '../../utils/audio';

interface FinesViewProps {
  circulation: CirculationRecord[];
  settings: LibrarySettings;
  onPayFine: (recordId: string) => void;
  onUpdateFineRate: (newRate: number) => void;
}

export const FinesView: React.FC<FinesViewProps> = ({
  circulation,
  settings,
  onPayFine,
  onUpdateFineRate,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPaid, setFilterPaid] = useState<'all' | 'unpaid' | 'paid'>('all');
  const [editingRate, setEditingRate] = useState(false);
  const [newRateValue, setNewRateValue] = useState(settings.finePerDay);

  // Compute all items with fines (either late now or past returned with fines)
  const fineItems = circulation.filter(c => {
    const lateDays = calculateOverdueDays(c.dueDate);
    const hasLateDaysNow = c.status !== 'Dikembalikan' && lateDays > 0;
    const hasPastFine = c.fineAmount > 0;
    return hasLateDaysNow || hasPastFine;
  }).map(c => {
    const lateDays = calculateOverdueDays(c.dueDate);
    const currentLate = c.status !== 'Dikembalikan' ? lateDays : c.fineDays;
    const currentFine = c.status !== 'Dikembalikan' ? currentLate * (c.finePerDay || settings.finePerDay) : c.fineAmount;
    return {
      ...c,
      calculatedLateDays: currentLate,
      calculatedFine: currentFine,
    };
  });

  const filtered = fineItems.filter(item => {
    const q = searchTerm.toLowerCase();
    const matchSearch = !q || item.memberName.toLowerCase().includes(q) || item.bookTitle.toLowerCase().includes(q) || item.memberNumber.toLowerCase().includes(q);
    if (filterPaid === 'unpaid') return matchSearch && !item.finePaid;
    if (filterPaid === 'paid') return matchSearch && item.finePaid;
    return matchSearch;
  });

  const totalUnpaid = fineItems.filter(i => !i.finePaid).reduce((acc, i) => acc + i.calculatedFine, 0);
  const totalPaid = fineItems.filter(i => i.finePaid).reduce((acc, i) => acc + i.calculatedFine, 0);

  const handleSaveRate = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateFineRate(Number(newRateValue));
    setEditingRate(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800">
              Sistem Manajemen Denda Otomatis
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
              Tarif: {formatRupiah(settings.finePerDay)} / Hari
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Penghitungan denda otomatis keterlambatan buku, rekonsiliasi kas perpus, dan kwitansi penerimaan
          </p>
        </div>

        <button
          onClick={() => setEditingRate(!editingRate)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
        >
          <Settings className="w-4 h-4 text-slate-500" />
          <span>Pengaturan Tarif Denda</span>
        </button>
      </div>

      {/* Editing rate form */}
      {editingRate && (
        <form onSubmit={handleSaveRate} className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3 text-xs">
          <span className="font-bold text-amber-900">Tarif Denda per Hari (Rp):</span>
          <input
            type="number"
            min="0"
            step="500"
            value={newRateValue}
            onChange={(e) => setNewRateValue(Number(e.target.value))}
            className="px-3 py-1.5 rounded-xl border border-amber-300 bg-white font-mono font-bold w-32"
          />
          <button
            type="submit"
            className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold"
          >
            Simpan Perubahan
          </button>
          <button
            type="button"
            onClick={() => setEditingRate(false)}
            className="text-slate-500 hover:underline"
          >
            Batal
          </button>
        </form>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Denda Tertunggak</span>
          <div className="text-2xl font-extrabold text-rose-600 mt-1">
            {formatRupiah(totalUnpaid)}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {fineItems.filter(i => !i.finePaid).length} peminjaman belum diselesaikan
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Denda Diterima (Lunas)</span>
          <div className="text-2xl font-extrabold text-emerald-700 mt-1">
            {formatRupiah(totalPaid)}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Telah dibukukan ke kas perpustakaan
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Ketentuan Toleransi Libur</span>
          <div className="text-base font-bold text-slate-800 mt-1">
            Sesuai Kalender Pendidikan
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Hari libur nasional & akhir pekan dapat disesuaikan
          </p>
        </div>
      </div>

      {/* Filter and Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari nama peminjam, buku, NISN..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500 text-slate-800"
            />
          </div>

          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold w-full sm:w-auto">
            <button
              onClick={() => setFilterPaid('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${filterPaid === 'all' ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-600'}`}
            >
              Semua ({fineItems.length})
            </button>
            <button
              onClick={() => setFilterPaid('unpaid')}
              className={`px-3 py-1.5 rounded-lg transition-all ${filterPaid === 'unpaid' ? 'bg-white text-rose-700 shadow-sm font-bold' : 'text-slate-600'}`}
            >
              Belum Lunas ({fineItems.filter(i => !i.finePaid).length})
            </button>
            <button
              onClick={() => setFilterPaid('paid')}
              className={`px-3 py-1.5 rounded-lg transition-all ${filterPaid === 'paid' ? 'bg-white text-emerald-700 shadow-sm font-bold' : 'text-slate-600'}`}
            >
              Sudah Lunas ({fineItems.filter(i => i.finePaid).length})
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4">Peminjam</th>
                <th className="py-3 px-4">Buku & Transaksi</th>
                <th className="py-3 px-4">Tgl Jatuh Tempo</th>
                <th className="py-3 px-4">Keterlambatan</th>
                <th className="py-3 px-4">Nominal Denda</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Tidak ada catatan denda yang sesuai.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-800">{item.memberName}</p>
                      <p className="text-[11px] text-slate-500">{item.memberClass || item.memberRole} &bull; {item.memberNumber}</p>
                    </td>

                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-800 truncate max-w-[180px]">{item.bookTitle}</p>
                      <span className="font-mono text-[10px] text-slate-400">{item.transactionCode}</span>
                    </td>

                    <td className="py-3 px-4">
                      {formatDateIndo(item.dueDate)}
                    </td>

                    <td className="py-3 px-4 font-bold text-rose-600">
                      {item.calculatedLateDays} Hari
                    </td>

                    <td className="py-3 px-4 font-extrabold text-slate-900">
                      {formatRupiah(item.calculatedFine)}
                    </td>

                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        item.finePaid ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {item.finePaid ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                        {item.finePaid ? 'Lunas' : 'Belum Dibayar'}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      {!item.finePaid ? (
                        <button
                          onClick={() => {
                            sounds.playSuccessChime();
                            onPayFine(item.id);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition-all active:scale-95"
                        >
                          Terima Pembayaran
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-medium">
                          Telah Diselesaikan
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
