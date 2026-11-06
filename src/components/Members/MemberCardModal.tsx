import React from 'react';
import { X, Printer, School, ShieldCheck, Sparkles } from 'lucide-react';
import { Member, LibrarySettings } from '../../types/library';
import { BarcodeVisual } from '../Shared/BarcodeVisual';
import { formatDateIndo } from '../../utils/formatters';

interface MemberCardModalProps {
  member: Member;
  settings: LibrarySettings;
  onClose: () => void;
}

export const MemberCardModal: React.FC<MemberCardModalProps> = ({
  member,
  settings,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-slate-200">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <h3 className="font-bold text-slate-800 text-sm">Kartu Anggota Resmi Perpustakaan</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Library Card (CR-80 standard card proportions) */}
        <div className="my-5 rounded-2xl overflow-hidden shadow-xl border border-emerald-700/20 bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900 text-white relative">
          
          {/* Decorative shapes */}
          <div className="absolute right-0 top-0 bottom-0 w-2/5 bg-emerald-500/10 skew-x-12 pointer-events-none"></div>
          <div className="absolute -bottom-10 -left-10 w-36 h-36 bg-teal-500/10 rounded-full blur-2xl pointer-events-none"></div>

          {/* Card Top Header */}
          <div className="px-5 pt-5 pb-3 border-b border-emerald-500/30 flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white p-1 flex items-center justify-center shadow">
                <School className="w-6 h-6 text-emerald-800" />
              </div>
              <div>
                <p className="font-extrabold text-xs tracking-wider uppercase text-emerald-300">
                  {settings.libraryName}
                </p>
                <p className="text-[11px] font-bold text-slate-200">
                  {settings.schoolName}
                </p>
              </div>
            </div>

            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-200 border border-emerald-400/30">
              {member.role}
            </span>
          </div>

          {/* Card Middle: Photo & Details */}
          <div className="p-5 flex items-center gap-4 relative z-10">
            <div className="w-20 h-24 rounded-xl overflow-hidden shrink-0 border-2 border-emerald-400/50 shadow-md bg-slate-800">
              <img
                src={member.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
                alt={member.name}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="min-w-0 flex-1 space-y-1">
              <h4 className="font-extrabold text-sm sm:text-base text-white truncate">
                {member.name}
              </h4>
              <p className="text-xs font-semibold text-emerald-300">
                {member.gradeClass || member.role}
              </p>
              <div className="text-[11px] text-slate-300 space-y-0.5 pt-1">
                <p>No. ID: <span className="font-mono font-bold text-white">{member.memberNumber}</span></p>
                <p>Bergabung: {formatDateIndo(member.joinedDate)}</p>
                <p>Batas Pinjam: {member.maxBorrowLimit} Buku</p>
              </div>
            </div>
          </div>

          {/* Card Bottom Barcode */}
          <div className="px-5 py-3 bg-white text-slate-900 flex flex-col items-center justify-center relative z-10">
            <BarcodeVisual code={member.memberNumber} height={38} />
            <p className="text-[9px] text-slate-500 font-sans mt-0.5">
              Tunjukkan kartu ini kepada petugas saat transaksi peminjaman & pengembalian
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-3 text-xs">
          <button
            onClick={() => window.print()}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Kartu Anggota</span>
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
