import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  User, 
  Lock, 
  Eye, 
  EyeOff, 
  Sparkles, 
  Cloud, 
  GraduationCap, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  BookOpen,
  KeyRound,
  LogIn
} from 'lucide-react';
import { Member, GASConfig, AuthSession, AppRole } from '../../types/library';
import { gasService } from '../../services/gasService';
import { sounds } from '../../utils/audio';
import confetti from 'canvas-confetti';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (session: AuthSession) => void;
  gasConfig: GASConfig;
  allMembers: Member[];
  currentSession: AuthSession | null;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  gasConfig,
  allMembers,
  currentSession,
}) => {
  const [roleTab, setRoleTab] = useState<AppRole>('admin');
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleRoleChange = (role: AppRole) => {
    setRoleTab(role);
    setStatusMessage(null);
    if (role === 'admin') {
      setUsername('admin');
      setPassword('admin123');
    } else {
      setUsername('NISN-0091827361');
      setPassword('siswa123');
    }
  };

  const handleSelectQuickAccount = (user: string, pass: string, role: AppRole) => {
    setRoleTab(role);
    setUsername(user);
    setPassword(pass);
    setStatusMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setStatusMessage({ type: 'error', text: 'Username dan kata sandi wajib diisi.' });
      sounds.playErrorBeep();
      return;
    }

    setIsLoading(true);
    setStatusMessage({ 
      type: 'info', 
      text: gasConfig.webAppUrl 
        ? 'Memverifikasi ke basis data Google Spreadsheet Cloud...' 
        : 'Memverifikasi pada Mode Demonstrasi / Preview Lokal...' 
    });

    try {
      const res = await gasService.login(gasConfig.webAppUrl, username, password, allMembers);
      setIsLoading(false);

      if (res.success && res.user) {
        sounds.playSuccessChime();
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 }
        });

        setStatusMessage({
          type: 'success',
          text: res.source === 'cloud_gas'
            ? 'Login Berhasil! Terverifikasi langsung via Google Sheets.'
            : 'Login Berhasil! Terverifikasi via Mode Demonstrasi Lokal.'
        });

        setTimeout(() => {
          onLoginSuccess(res.user!);
          onClose();
        }, 600);
      } else {
        sounds.playErrorBeep();
        setStatusMessage({
          type: 'error',
          text: res.message || 'Username atau kata sandi tidak cocok. Silakan coba kembali.'
        });
      }
    } catch (err) {
      setIsLoading(false);
      sounds.playErrorBeep();
      setStatusMessage({
        type: 'error',
        text: 'Terjadi kendala koneksi. Silakan periksa jaringan Anda.'
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 w-32 bg-indigo-500/10 skew-x-12 pointer-events-none"></div>
          
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-base sm:text-lg">
                  Sistem Masuk Perpustakaan
                </h3>
                <p className="text-xs text-indigo-200 font-medium">
                  MABBARAKKA SMP Negeri 5 Bulukumba
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cloud GAS Status indicator */}
          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-300">
            <span className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${gasConfig.webAppUrl ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
              <span>Backend: {gasConfig.webAppUrl ? 'Cloud GAS Terhubung' : 'Mode Demonstrasi Lokal'}</span>
            </span>
            <span className="text-[10px] text-indigo-300 bg-white/10 px-2 py-0.5 rounded-full">
              Sandi Terverifikasi
            </span>
          </div>
        </div>

        {/* Role Selector Tabs */}
        <div className="p-2 bg-slate-100 border-b border-slate-200 grid grid-cols-2 gap-1.5 text-xs font-bold">
          <button
            type="button"
            onClick={() => handleRoleChange('admin')}
            className={`py-2.5 px-3 rounded-2xl transition-all flex items-center justify-center gap-2 ${
              roleTab === 'admin'
                ? 'bg-white text-emerald-800 shadow-sm'
                : 'text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            <ShieldCheck className={`w-4 h-4 ${roleTab === 'admin' ? 'text-emerald-600' : 'text-slate-400'}`} />
            <span>Petugas (Admin)</span>
          </button>

          <button
            type="button"
            onClick={() => handleRoleChange('anggota')}
            className={`py-2.5 px-3 rounded-2xl transition-all flex items-center justify-center gap-2 ${
              roleTab === 'anggota'
                ? 'bg-white text-indigo-800 shadow-sm'
                : 'text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            <GraduationCap className={`w-4 h-4 ${roleTab === 'anggota' ? 'text-indigo-600' : 'text-slate-400'}`} />
            <span>Anggota (Siswa/Guru)</span>
          </button>
        </div>

        {/* Role description badge */}
        <div className="px-6 pt-4">
          <div className={`p-3 rounded-2xl border text-xs leading-relaxed ${
            roleTab === 'admin' 
              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900' 
              : 'bg-indigo-50/70 border-indigo-200 text-indigo-900'
          }`}>
            <p className="font-bold flex items-center gap-1.5">
              <span>{roleTab === 'admin' ? 'Hak Akses Administrator (Penuh)' : 'Hak Akses Anggota (Baca & Riwayat)'}</span>
            </p>
            <p className="text-[11px] mt-0.5 opacity-80">
              {roleTab === 'admin'
                ? 'Kelola buku cetak, buku digital, transaksi sirkulasi, data anggota, denda, ekspor-impor, dan laporan resmi.'
                : 'Pencarian katalog buku cetak, membaca modul e-book digital, pantau riwayat peminjaman & denda pribadi, dan jurnal membaca.'}
            </p>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Username Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              {roleTab === 'admin' ? 'Nama Pengguna (Username Admin)' : 'Nomor Anggota (NISN / NIP / Username)'}
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={roleTab === 'admin' ? 'Contoh: admin' : 'Contoh: NISN-0091827361'}
                className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-slate-800 font-medium"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700">
                Kata Sandi (Password)
              </label>
              <span className="text-[11px] text-slate-400">Verifikasi Terproteksi</span>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan kata sandi akun..."
                className="w-full pl-10 pr-10 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-slate-800 font-medium"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Status Message */}
          {statusMessage && (
            <div className={`p-3 rounded-2xl border text-xs flex items-center gap-2 ${
              statusMessage.type === 'success' 
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                : statusMessage.type === 'error'
                ? 'bg-rose-50 text-rose-800 border-rose-200'
                : 'bg-blue-50 text-blue-800 border-blue-200'
            }`}>
              {statusMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
              {statusMessage.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
              {statusMessage.type === 'info' && <Cloud className="w-4 h-4 text-blue-600 shrink-0 animate-spin" />}
              <span className="font-semibold">{statusMessage.text}</span>
            </div>
          )}

          {/* Quick Demo Accounts Buttons */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <span className="text-[11px] font-bold text-slate-400 block">
              Pintasan Akun Demonstrasi (Klik untuk Isi Cepat):
            </span>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => handleSelectQuickAccount('admin', 'admin123', 'admin')}
                className={`text-[11px] px-2.5 py-1 rounded-xl border transition-all ${
                  username === 'admin'
                    ? 'bg-emerald-600 text-white font-bold border-emerald-600 shadow-sm'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                }`}
              >
                👑 Petugas Admin (admin / admin123)
              </button>

              <button
                type="button"
                onClick={() => handleSelectQuickAccount('NISN-0091827361', 'siswa123', 'anggota')}
                className={`text-[11px] px-2.5 py-1 rounded-xl border transition-all ${
                  username === 'NISN-0091827361'
                    ? 'bg-indigo-600 text-white font-bold border-indigo-600 shadow-sm'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                }`}
              >
                🎓 Siswa: Andi Reski
              </button>

              <button
                type="button"
                onClick={() => handleSelectQuickAccount('NISN-0092837462', 'siswa123', 'anggota')}
                className={`text-[11px] px-2.5 py-1 rounded-xl border transition-all ${
                  username === 'NISN-0092837462'
                    ? 'bg-indigo-600 text-white font-bold border-indigo-600 shadow-sm'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                }`}
              >
                🎓 Siswa: Nur Aisyah
              </button>

              <button
                type="button"
                onClick={() => handleSelectQuickAccount('NIP-198506122010011005', 'guru123', 'anggota')}
                className={`text-[11px] px-2.5 py-1 rounded-xl border transition-all ${
                  username === 'NIP-198506122010011005'
                    ? 'bg-indigo-600 text-white font-bold border-indigo-600 shadow-sm'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                }`}
              >
                👨‍🏫 Guru: Baharuddin
              </button>
            </div>
          </div>

          {/* Submit Action Button */}
          <div className="pt-3 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-white font-bold text-xs shadow-md transition-all active:scale-95 disabled:opacity-50 ${
                roleTab === 'admin'
                  ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-700/20'
                  : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-700/20'
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>{isLoading ? 'Memverifikasi...' : `Masuk Sebagai ${roleTab === 'admin' ? 'Petugas' : 'Anggota'}`}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
