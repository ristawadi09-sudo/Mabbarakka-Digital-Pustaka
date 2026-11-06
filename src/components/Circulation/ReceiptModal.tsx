import React from 'react';
import { X, Printer, CheckCircle2, School } from 'lucide-react';
import { CirculationRecord, LibrarySettings } from '../../types/library';
import { formatDateIndo, formatRupiah } from '../../utils/formatters';
import { BarcodeVisual } from '../Shared/BarcodeVisual';

interface ReceiptModalProps {
  record: CirculationRecord;
  settings: LibrarySettings;
  type: 'borrow' | 'return';
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  record,
  settings,
  type,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-200">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Bukti Transaksi Perpustakaan
          </span>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Struk Card */}
        <div className="my-4 p-5 rounded-2xl border border-slate-200 bg-slate-50 space-y-4 text-xs font-mono">
          
          {/* Header Kop */}
          <div className="text-center pb-3 border-b border-dashed border-slate-300">
            <h4 className="font-extrabold text-sm text-slate-900 uppercase">
              {settings.libraryName}
            </h4>
            <p className="text-[11px] font-bold text-slate-700">
              {settings.schoolName}
            </p>
            <p className="text-[10px] text-slate-500 font-sans">
              {settings.address}
            </p>
          </div>

          {/* Transaction Metadata */}
          <div className="space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-500">No. Transaksi:</span>
              <span className="font-bold text-slate-800">{record.transactionCode}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Tgl Transaksi:</span>
              <span className="text-slate-800">{formatDateIndo(type === 'borrow' ? record.borrowDate : record.returnDate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Jenis:</span>
              <span className="font-bold uppercase text-emerald-800">
                {type === 'borrow' ? 'Peminjaman Buku' : 'Pengembalian Buku'}
              </span>
            </div>
          </div>

          {/* Member Details */}
          <div className="py-2 border-y border-dashed border-slate-300 space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-500">Nama Peminjam:</span>
              <span className="font-bold text-slate-900">{record.memberName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">No. Anggota / NISN:</span>
              <span>{record.memberNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Kelas / Unit:</span>
              <span>{record.memberClass || record.memberRole}</span>
            </div>
          </div>

          {/* Book Details */}
          <div className="space-y-1 text-[11px]">
            <p className="font-bold text-slate-900">{record.bookTitle}</p>
            <div className="flex justify-between text-slate-500">
              <span>Barcode: {record.bookBarcode}</span>
              <span>Kategori: {record.bookCategory}</span>
            </div>
          </div>

          {/* Due date or Fine breakdown */}
          <div className="pt-2 border-t border-dashed border-slate-300 space-y-1">
            <div className="flex justify-between font-bold">
              <span>Tgl Jatuh Tempo:</span>
              <span>{formatDateIndo(record.dueDate)}</span>
            </div>

            {type === 'return' && record.fineAmount > 0 && (
              <div className="pt-2 border-t border-dashed border-slate-300 space-y-1">
                <div className="flex justify-between text-rose-700">
                  <span>Keterlambatan ({record.fineDays} hari):</span>
                  <span>{formatRupiah(record.fineAmount)}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-900">
                  <span>Status Denda:</span>
                  <span className={record.finePaid ? 'text-emerald-700' : 'text-rose-600'}>
                    {record.finePaid ? 'LUNAS' : 'BELUM DIBAYAR'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Barcode bottom */}
          <div className="pt-3 border-t border-dashed border-slate-300 flex justify-center">
            <BarcodeVisual code={record.transactionCode} height={36} />
          </div>

          <p className="text-[10px] text-center text-slate-500 font-sans italic pt-1">
            &ldquo;Rawatlah buku dengan penuh cinta dan kembalikan tepat waktu demi berkahnya ilmu.&rdquo;
          </p>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-between gap-3 text-xs">
          <button
            onClick={() => window.print()}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Struk / Bukti</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-100"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
