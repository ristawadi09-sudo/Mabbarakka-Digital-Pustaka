import React from 'react';
import { Users, Monitor, Tablet, Smartphone, Laptop, Sparkles, RefreshCw, Eye } from 'lucide-react';
import { ActiveVisitor } from '../../types/library';

interface ActiveVisitorsWidgetProps {
  visitors: ActiveVisitor[];
  onSimulateNewVisitor: () => void;
  onOpenJournalFromVisitor?: (visitor: ActiveVisitor) => void;
}

export const ActiveVisitorsWidget: React.FC<ActiveVisitorsWidgetProps> = ({
  visitors,
  onSimulateNewVisitor,
}) => {
  const getDeviceIcon = (device: ActiveVisitor['device']) => {
    switch (device) {
      case 'Komputer Lab':
        return <Monitor className="w-3.5 h-3.5 text-blue-500" />;
      case 'Tablet Perpus':
        return <Tablet className="w-3.5 h-3.5 text-purple-500" />;
      case 'Smartphone Siswa':
        return <Smartphone className="w-3.5 h-3.5 text-emerald-500" />;
      case 'Laptop Guru':
        return <Laptop className="w-3.5 h-3.5 text-amber-500" />;
      default:
        return <Monitor className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  const getActivityBadge = (activity: ActiveVisitor['currentActivity']) => {
    switch (activity) {
      case 'Membaca E-Book':
        return 'bg-teal-50 text-teal-700 border-teal-200';
      case 'Mencari Buku':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Jurnal Membaca':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Cek Sirkulasi':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-800 text-sm">
                Anggota Sedang Mengakses Aplikasi
              </h3>
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                {visitors.length} Online
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Pantauan akses real-time siswa dan guru di area perpustakaan & lab
            </p>
          </div>
        </div>

        <button
          onClick={onSimulateNewVisitor}
          title="Simulasikan anggota baru yang login/mengakses"
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all active:scale-95"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
          <span className="hidden sm:inline">Simulasi Akses Baru</span>
        </button>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {visitors.map((visitor) => (
          <div
            key={visitor.id}
            className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-emerald-300 hover:shadow-md transition-all group"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <img
                    src={visitor.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
                    alt={visitor.memberName}
                    className="w-9 h-9 rounded-xl object-cover ring-2 ring-emerald-500/20 group-hover:ring-emerald-500"
                  />
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></span>
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-800 truncate group-hover:text-emerald-700">
                    {visitor.memberName}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">
                    {visitor.gradeClass || visitor.role}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 text-[10px] text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200" title={visitor.device}>
                {getDeviceIcon(visitor.device)}
              </div>
            </div>

            <div className="mt-2.5 pt-2 border-t border-slate-200/60">
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className={`px-2 py-0.5 rounded-md font-semibold border text-[10px] ${getActivityBadge(visitor.currentActivity)}`}>
                  {visitor.currentActivity}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {visitor.onlineSince}
                </span>
              </div>
              {visitor.currentBookTitle && (
                <p className="text-[11px] text-slate-600 truncate italic">
                  &ldquo;{visitor.currentBookTitle}&rdquo;
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
