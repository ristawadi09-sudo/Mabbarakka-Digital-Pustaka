import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  CreditCard, 
  Phone, 
  Mail, 
  CheckCircle2, 
  X, 
  UserPlus, 
  Filter,
  ShieldCheck
} from 'lucide-react';
import { Member, MemberRole, LibrarySettings } from '../../types/library';
import { MemberCardModal } from './MemberCardModal';
import { formatDateIndo } from '../../utils/formatters';

interface MembersViewProps {
  members: Member[];
  settings: LibrarySettings;
  onAddMember: (newMember: Member) => void;
  onSelectMemberToBorrow?: (member: Member) => void;
}

export const MembersView: React.FC<MembersViewProps> = ({
  members,
  settings,
  onAddMember,
  onSelectMemberToBorrow,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('Semua');
  const [selectedMemberForCard, setSelectedMemberForCard] = useState<Member | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    memberNumber: '',
    role: 'Siswa' as MemberRole,
    gradeClass: 'Kelas VII-A',
    whatsapp: '',
    email: '',
  });

  const filteredMembers = members.filter((m) => {
    const q = searchTerm.toLowerCase();
    const matchSearch = 
      !q ||
      m.name.toLowerCase().includes(q) ||
      m.memberNumber.toLowerCase().includes(q) ||
      (m.gradeClass && m.gradeClass.toLowerCase().includes(q)) ||
      m.whatsapp.includes(q);

    const matchRole = roleFilter === 'Semua' || m.role === roleFilter;

    return matchSearch && matchRole;
  });

  const handleCreateMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.memberNumber) return;

    const newMember: Member = {
      id: `m-${Date.now()}`,
      name: formData.name,
      memberNumber: formData.memberNumber,
      role: formData.role,
      gradeClass: formData.gradeClass,
      whatsapp: formData.whatsapp || '081234567890',
      email: formData.email || `${formData.name.toLowerCase().replace(/\s+/g, '.')}@smpn5bulukumba.sch.id`,
      joinedDate: new Date().toISOString().split('T')[0],
      status: 'Aktif',
      maxBorrowLimit: formData.role === 'Guru' ? 5 : 3,
      activeLoanCount: 0,
      avatarUrl: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80`,
    };

    onAddMember(newMember);
    setIsAddModalOpen(false);
    setFormData({
      name: '',
      memberNumber: '',
      role: 'Siswa',
      gradeClass: 'Kelas VII-A',
      whatsapp: '',
      email: '',
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800">
              Direktori Keanggotaan Perpustakaan
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-300">
              {members.length} Terdaftar
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Data siswa, dewan guru, dan tenaga kependidikan SMP Negeri 5 Bulukumba beserta pencetakan kartu anggota ber-barcode
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md shadow-purple-700/20 transition-all active:scale-95"
        >
          <UserPlus className="w-4 h-4" />
          <span>Tambah Anggota Baru</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Cari nama anggota, NISN / NIP, kelas, WhatsApp..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-purple-500 text-slate-800"
          />
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-semibold w-full sm:w-auto overflow-x-auto">
          {['Semua', 'Siswa', 'Guru', 'Staf'].map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-1.5 rounded-lg shrink-0 transition-all ${
                roleFilter === r ? 'bg-white text-purple-800 shadow-sm font-bold' : 'text-slate-600'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Member Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMembers.map((member) => (
          <div
            key={member.id}
            className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm hover:border-purple-300 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img
                    src={member.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
                    alt={member.name}
                    className="w-12 h-12 rounded-xl object-cover ring-2 ring-purple-100"
                  />
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">{member.name}</h3>
                    <p className="text-xs text-purple-700 font-semibold">{member.gradeClass || member.role}</p>
                    <p className="font-mono text-[11px] text-slate-400 mt-0.5">{member.memberNumber}</p>
                  </div>
                </div>

                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  {member.status}
                </span>
              </div>

              {/* Contacts */}
              <div className="mt-3.5 pt-3 border-t border-slate-100 space-y-1 text-[11px] text-slate-600">
                <div className="flex items-center gap-2 truncate">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="font-mono">{member.whatsapp}</span>
                </div>
                <div className="flex items-center gap-2 truncate">
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{member.email}</span>
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
              <span className="text-[11px] text-slate-500 font-medium">
                Aktif Pinjam: <strong className="text-slate-800">{member.activeLoanCount}</strong> / {member.maxBorrowLimit}
              </span>

              <button
                onClick={() => setSelectedMemberForCard(member)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold border border-purple-200 transition-colors"
                title="Cetak Kartu Anggota Barcode"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Kartu Anggota</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Member Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">Pendaftaran Anggota Baru</h3>
                  <p className="text-xs text-slate-500">Perpustakaan SMP Negeri 5 Bulukumba</p>
                </div>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMember} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Lengkap *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Andi Muhammad Farhan"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-purple-500 text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Peran / Kategori *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as MemberRole })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-purple-500 text-slate-800 bg-white"
                  >
                    <option value="Siswa">Siswa</option>
                    <option value="Guru">Guru</option>
                    <option value="Staf">Staf Tenaga Kependidikan</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nomor ID (NISN / NIP) *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: NISN-0098172635"
                    value={formData.memberNumber}
                    onChange={(e) => setFormData({ ...formData, memberNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-purple-500 text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Kelas / Unit Mengajar</label>
                <input
                  type="text"
                  placeholder="Contoh: Kelas VII-B atau Guru IPA Terpadu"
                  value={formData.gradeClass}
                  onChange={(e) => setFormData({ ...formData, gradeClass: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-purple-500 text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nomor WhatsApp *</label>
                  <input
                    type="tel"
                    required
                    placeholder="Contoh: 085242119901"
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-purple-500 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="nama@siswa.smpn5bulukumba.sch.id"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-purple-500 text-slate-800"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold shadow-md transition-all active:scale-95"
                >
                  Daftarkan Anggota
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Member Card Modal */}
      {selectedMemberForCard && (
        <MemberCardModal
          member={selectedMemberForCard}
          settings={settings}
          onClose={() => setSelectedMemberForCard(null)}
        />
      )}

    </div>
  );
};
