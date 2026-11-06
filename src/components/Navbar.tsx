import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Bell, 
  ScanLine, 
  Clock, 
  Sparkles, 
  ShieldCheck, 
  ChevronDown, 
  LogOut,
  Users,
  CreditCard,
  KeyRound,
  GraduationCap,
  Cloud,
  CheckCircle2
} from 'lucide-react';
import { Member, LibrarySettings, GASConfig, AuthSession } from '../types/library';

interface NavbarProps {
  settings: LibrarySettings;
  overdueCount: number;
  activeVisitorCount: number;
  currentSession: AuthSession;
  allMembers: Member[];
  gasConfig?: GASConfig;
  onOpenGAS?: () => void;
  onOpenScanner: () => void;
  onOpenNotifications: () => void;
  onOpenQuickBorrow: () => void;
  onOpenLoginModal: () => void;
  onOpenMemberCard?: () => void;
  onSwitchToMember?: (member: Member) => void;
  onSwitchToAdmin?: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  settings,
  overdueCount,
  activeVisitorCount,
  currentSession,
  allMembers,
  gasConfig,
  onOpenGAS,
  onOpenScanner,
  onOpenNotifications,
  onOpenQuickBorrow,
  onOpenLoginModal,
  onOpenMemberCard,
  onSwitchToMember,
  onSwitchToAdmin,
  onLogout,
}) => {
  const [time, setTime] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const isAdmin = currentSession.role === 'admin';

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setDate(now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-30 bg-slate-900 border-b border-slate-800 text-white shadow-md">
      <div className="px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
        
        {/* Brand & School Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white font-bold ring-2 ring-emerald-400/30">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base sm:text-lg tracking-wider text-emerald-400 font-mono">
                MABBARAKKA
              </span>
              <span className="hidden md:inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <Sparkles className="w-3 h-3 mr-1" /> Panrita Lopi
              </span>
            </div>
            <p className="text-xs text-slate-300 font-medium">
              {settings.schoolName} &bull; {settings.district}
            </p>
          </div>
        </div>

        {/* Live Active Visitor Counter Pill & Clock */}
        <div className="hidden lg:flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/80 text-slate-300">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <Users className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-semibold text-white">{activeVisitorCount}</span>
            <span className="text-slate-400">Pengunjung Aktif</span>
          </div>

          <div className="flex items-center gap-1.5 text-slate-300 font-mono bg-slate-800/60 px-3 py-1.5 rounded-full border border-slate-700">
            <Clock className="w-3.5 h-3.5 text-teal-400" />
            <span>{date}</span>
            <span className="text-emerald-400 font-bold">{time}</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Google Apps Script & Cloud Spreadsheet Button (Admin only) */}
          {isAdmin && onOpenGAS && (
            <button
              onClick={onOpenGAS}
              title={gasConfig?.webAppUrl ? 'Back End GAS & Spreadsheet Terhubung' : 'Integrasi Back End GAS & Blogger'}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all active:scale-95 ${
                gasConfig?.lastSyncStatus === 'success'
                  ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40 hover:bg-emerald-900/80'
                  : gasConfig?.webAppUrl
                  ? 'bg-blue-950/60 text-blue-300 border-blue-500/40 hover:bg-blue-900/80'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              <div className="relative">
                <Cloud className="w-4 h-4 text-emerald-400" />
                <span className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ${
                  gasConfig?.lastSyncStatus === 'success' ? 'bg-emerald-400' : 'bg-amber-400'
                }`}></span>
              </div>
              <span className="hidden md:inline">GAS Cloud</span>
            </button>
          )}

          {/* Quick Barcode Scanner Button */}
          <button
            onClick={onOpenScanner}
            title="Buka Barcode Scanner Kamera"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 hover:text-white border border-teal-500/30 hover:border-teal-400 transition-all text-xs font-semibold shadow-sm active:scale-95"
          >
            <ScanLine className="w-4 h-4 text-teal-400" />
            <span className="hidden sm:inline">Scan Barcode</span>
          </button>

          {/* Role-specific button: Pinjam Cepat (Admin) vs Kartu Saya (Anggota) */}
          {isAdmin ? (
            <button
              onClick={onOpenQuickBorrow}
              title="Transaksi Peminjaman Cepat"
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md shadow-emerald-700/30 hover:shadow-emerald-600/50 transition-all active:scale-95"
            >
              <BookOpen className="w-4 h-4" />
              <span>Pinjam Cepat</span>
            </button>
          ) : (
            onOpenMemberCard && (
              <button
                onClick={onOpenMemberCard}
                title="Tampilkan Kartu Anggota Digital Saya"
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-700/30 hover:shadow-indigo-600/50 transition-all active:scale-95"
              >
                <CreditCard className="w-4 h-4" />
                <span>Kartu Saya</span>
              </button>
            )
          )}

          {/* Overdue Notification Bell */}
          <button
            onClick={onOpenNotifications}
            title={`${overdueCount} Buku Jatuh Tempo`}
            className="relative p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all"
          >
            <Bell className="w-5 h-5" />
            {overdueCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-md animate-pulse">
                {overdueCount}
              </span>
            )}
          </button>

          {/* User Session Profile & Role Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className={`flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl border text-left transition-all ${
                isAdmin 
                  ? 'bg-emerald-950/40 border-emerald-500/30 hover:bg-emerald-900/50' 
                  : 'bg-indigo-950/40 border-indigo-500/30 hover:bg-indigo-900/50'
              }`}
            >
              <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-teal-300 font-bold overflow-hidden ring-1 ring-white/10">
                {currentSession.avatarUrl ? (
                  <img src={currentSession.avatarUrl} alt={currentSession.name} className="w-full h-full object-cover" />
                ) : isAdmin ? (
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                ) : (
                  <GraduationCap className="w-4 h-4 text-indigo-400" />
                )}
              </div>
              <div className="hidden sm:block text-xs leading-tight">
                <div className="flex items-center gap-1.5">
                  <p className="font-bold text-slate-100 truncate max-w-[130px]">
                    {currentSession.name}
                  </p>
                  <span className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded ${
                    isAdmin ? 'bg-emerald-500/20 text-emerald-300' : 'bg-indigo-500/20 text-indigo-300'
                  }`}>
                    {isAdmin ? 'ADMIN' : 'ANGGOTA'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 truncate max-w-[130px]">
                  {isAdmin ? 'Petugas Perpustakaan' : (currentSession.gradeClass || currentSession.memberRole || 'Siswa SMPN 5')}
                </p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Dropdown Menu */}
            {showUserDropdown && (
              <div 
                className="absolute right-0 mt-2 w-72 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl py-2 z-50 text-xs"
                onClick={() => setShowUserDropdown(false)}
              >
                {/* User Info Header */}
                <div className="px-4 py-2.5 border-b border-slate-800">
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isAdmin 
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                        : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                    }`}>
                      {isAdmin ? '🛡️ Administrator Perpus' : '🎓 Anggota Perpustakaan'}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {currentSession.source === 'cloud_gas' ? '☁️ GAS Cloud' : '💾 Demo Lokal'}
                    </span>
                  </div>
                  <p className="text-slate-100 text-xs font-bold truncate">
                    {currentSession.name}
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono">
                    Username: @{currentSession.username}
                  </p>
                </div>

                {/* Primary Button: Open Custom Password Login / Switch Account */}
                <div className="p-2">
                  <button
                    onClick={onOpenLoginModal}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md transition-all active:scale-95"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Masuk dengan Sandi GAS</span>
                  </button>
                </div>

                {/* Quick Simulation / Demo Switch for testing */}
                <div className="py-1 border-t border-slate-800">
                  <div className="px-4 py-1 text-[10px] uppercase font-bold tracking-wider text-slate-500">
                    Beralih Cepat (Demo Preview)
                  </div>

                  {/* Switch to Admin */}
                  {onSwitchToAdmin && (
                    <button
                      onClick={onSwitchToAdmin}
                      className={`w-full flex items-center gap-3 px-4 py-2 text-left transition-colors ${
                        isAdmin ? 'bg-emerald-950/40 text-emerald-300 font-bold' : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                        <ShieldCheck className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-100 text-xs">Pustakawan Admin</p>
                        <p className="text-[10px] text-slate-400">Akses penuh CRUD sirkulasi & buku</p>
                      </div>
                    </button>
                  )}

                  {/* Switch to Sample Members */}
                  {onSwitchToMember && allMembers.slice(0, 3).map((member) => (
                    <button
                      key={member.id}
                      onClick={() => onSwitchToMember(member)}
                      className={`w-full flex items-center gap-3 px-4 py-1.5 text-left transition-colors ${
                        !isAdmin && currentSession.id === member.id ? 'bg-indigo-950/40 text-indigo-300 font-bold' : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <img 
                        src={member.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'} 
                        alt={member.name} 
                        className="w-6 h-6 rounded-lg object-cover ring-1 ring-slate-700" 
                      />
                      <div className="truncate">
                        <p className="font-semibold text-slate-200 text-xs truncate">{member.name}</p>
                        <p className="text-[10px] text-slate-400">{member.gradeClass || member.role} &bull; {member.memberNumber}</p>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Footer Logout */}
                <div className="pt-1 border-t border-slate-800">
                  <button
                    onClick={onLogout}
                    className="w-full flex items-center gap-2 px-4 py-2 text-rose-400 hover:bg-rose-950/30 font-medium transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Keluar dari Akun</span>
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>
    </header>
  );
};
