import React from 'react';
import { 
  LayoutDashboard, 
  BookMarked, 
  FileText, 
  Repeat, 
  Users, 
  BarChart3, 
  BookOpenText, 
  BadgePercent, 
  Sparkles, 
  School, 
  ExternalLink, 
  Cloud,
  GraduationCap,
  ShieldCheck,
  BookmarkCheck,
  LogOut,
  LogIn,
  KeyRound,
  BookOpen
} from 'lucide-react';
import { Member, AuthSession, AppRole } from '../types/library';

export type ActiveTab = 
  | 'dashboard'
  | 'printed_books'
  | 'digital_books'
  | 'circulation'
  | 'my_loans'
  | 'members'
  | 'reports'
  | 'journal'
  | 'fines'
  | 'gas';

interface SidebarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  overdueCount: number;
  activeLoanCount: number;
  unpaidFinesCount: number;
  currentSession: AuthSession;
  onOpenLoginModal: () => void;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  overdueCount,
  activeLoanCount,
  unpaidFinesCount,
  currentSession,
  onOpenLoginModal,
  onLogout,
}) => {
  const isAdmin = currentSession.role === 'admin';

  // Admin Menu Items (Full CRUD & Operations)
  const adminMenuItems = [
    {
      id: 'dashboard' as ActiveTab,
      label: 'Dashboard & Mading',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'printed_books' as ActiveTab,
      label: 'Koleksi Buku Cetak',
      icon: BookMarked,
      badge: null,
    },
    {
      id: 'digital_books' as ActiveTab,
      label: 'Koleksi Digital (E-Perpus)',
      icon: FileText,
      badge: 'Interaktif',
      badgeColor: 'bg-teal-500/10 text-teal-700 border-teal-300',
    },
    {
      id: 'circulation' as ActiveTab,
      label: 'Sirkulasi & Barcode',
      icon: Repeat,
      badge: overdueCount > 0 ? `${overdueCount} Telat` : `${activeLoanCount} Aktif`,
      badgeColor: overdueCount > 0 ? 'bg-rose-100 text-rose-700 border-rose-300 font-bold' : 'bg-emerald-100 text-emerald-800 border-emerald-300',
    },
    {
      id: 'members' as ActiveTab,
      label: 'Kelola Keanggotaan',
      icon: Users,
      badge: null,
    },
    {
      id: 'reports' as ActiveTab,
      label: 'Cetak Laporan & Analitik',
      icon: BarChart3,
      badge: 'Bulanan',
      badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    },
    {
      id: 'fines' as ActiveTab,
      label: 'Manajemen Denda',
      icon: BadgePercent,
      badge: unpaidFinesCount > 0 ? `${unpaidFinesCount} Tertunggak` : null,
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
    },
    {
      id: 'journal' as ActiveTab,
      label: 'Jurnal Membaca Siswa',
      icon: BookOpenText,
      badge: null,
    },
    {
      id: 'gas' as ActiveTab,
      label: 'Integrasi GAS & Blogger',
      icon: Cloud,
      badge: 'Cloud',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold',
    },
  ];

  // Anggota Menu Items (Restricted Read-Only & Personal View)
  const memberMenuItems = [
    {
      id: 'dashboard' as ActiveTab,
      label: 'Dashboard & Mading Literasi',
      icon: LayoutDashboard,
      badge: 'Mading',
      badgeColor: 'bg-indigo-100 text-indigo-700 border-indigo-300',
    },
    {
      id: 'printed_books' as ActiveTab,
      label: 'Katalog Buku Cetak (Fisik)',
      icon: BookMarked,
      badge: 'Katalog',
      badgeColor: 'bg-emerald-100 text-emerald-700 border-emerald-300',
    },
    {
      id: 'digital_books' as ActiveTab,
      label: 'Koleksi Digital (E-Perpus)',
      icon: FileText,
      badge: 'Baca Online',
      badgeColor: 'bg-teal-100 text-teal-800 border-teal-300 font-bold',
    },
    {
      id: 'my_loans' as ActiveTab,
      label: 'Peminjaman & Riwayat Saya',
      icon: Repeat,
      badge: 'Riwayat',
      badgeColor: 'bg-purple-100 text-purple-700 border-purple-300',
    },
    {
      id: 'journal' as ActiveTab,
      label: 'Jurnal Membaca Pribadi',
      icon: BookOpenText,
      badge: 'Catatan',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
    },
  ];

  const menuItems = isAdmin ? adminMenuItems : memberMenuItems;

  return (
    <aside className="w-64 bg-white border-r border-slate-200 min-h-[calc(100vh-61px)] flex flex-col justify-between p-4 shadow-sm select-none shrink-0">
      <div>
        
        {/* User Identity Banner in Sidebar */}
        <div className={`mb-4 p-3.5 rounded-2xl border transition-all ${
          isAdmin 
            ? 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200' 
            : 'bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden ring-2 ring-white shadow-sm shrink-0 bg-slate-200">
              <img 
                src={currentSession.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'} 
                alt={currentSession.name} 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="overflow-hidden min-w-0 flex-1">
              <span className={`text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md inline-block ${
                isAdmin 
                  ? 'bg-emerald-600 text-white shadow-xs' 
                  : 'bg-indigo-600 text-white shadow-xs'
              }`}>
                {isAdmin ? '🛡️ Petugas Admin' : `🎓 ${currentSession.memberRole || 'Anggota'}`}
              </span>
              <p className="font-extrabold text-slate-800 text-xs truncate mt-1">
                {currentSession.name}
              </p>
              <p className="text-[10px] text-slate-500 truncate">
                {currentSession.gradeClass || (isAdmin ? 'Pustakawan Sekolah' : currentSession.username)}
              </p>
            </div>
          </div>

          {/* Quick Switch / Login CTA */}
          <div className="mt-2.5 pt-2 border-t border-black/5 flex items-center justify-between text-[11px]">
            <span className="text-[10px] text-slate-500 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>{currentSession.source === 'cloud_gas' ? 'GAS Cloud' : 'Mode Demo'}</span>
            </span>

            <button
              onClick={onOpenLoginModal}
              className={`font-bold transition-colors flex items-center gap-1 ${
                isAdmin ? 'text-emerald-700 hover:text-emerald-900' : 'text-indigo-700 hover:text-indigo-900'
              }`}
            >
              <KeyRound className="w-3 h-3" />
              <span>Ganti Akun</span>
            </button>
          </div>
        </div>

        {/* Navigation Category Label */}
        <div className="flex items-center justify-between px-3 mb-2">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
            {isAdmin ? 'Menu Administrator' : 'Menu Layanan Siswa'}
          </span>
          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
            isAdmin ? 'text-emerald-700 bg-emerald-50' : 'text-indigo-700 bg-indigo-50'
          }`}>
            {isAdmin ? 'Akses Penuh' : 'Akses Baca'}
          </span>
        </div>

        {/* Navigation Menu List */}
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? isAdmin 
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-700/20 translate-x-1'
                      : 'bg-indigo-600 text-white shadow-md shadow-indigo-700/20 translate-x-1'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                    isActive ? 'bg-white/20 text-white border-white/30' : item.badgeColor
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* School Footer Information Card */}
      <div className="pt-4 border-t border-slate-100 space-y-2">
        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-slate-700 text-xs">
          <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs mb-1">
            <School className="w-4 h-4 text-emerald-600" />
            <span className="truncate">SMPN 5 Bulukumba</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2">
            Perpustakaan MABBARAKKA &bull; Butta Panrita Lopi
          </p>
          <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-400 font-medium">
            <span>Sistem v3.0 Auth</span>
            <span className="inline-flex items-center text-emerald-600 font-bold">
              <Sparkles className="w-3 h-3 mr-0.5" /> Terkoneksi
            </span>
          </div>
        </div>

        {/* Quick logout / relogin button */}
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-slate-200 hover:bg-rose-50 hover:border-rose-200 text-slate-500 hover:text-rose-600 font-semibold text-xs transition-colors"
          title="Keluar dari sesi saat ini"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Keluar Sesi</span>
        </button>
      </div>
    </aside>
  );
};
