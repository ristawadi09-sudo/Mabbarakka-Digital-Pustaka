import React, { useState } from 'react';
import { 
  X, 
  MessageSquare, 
  Mail, 
  Send, 
  AlertTriangle, 
  CheckCircle2, 
  ExternalLink, 
  Clock, 
  Sparkles,
  Copy,
  Check
} from 'lucide-react';
import { CirculationRecord, LibrarySettings } from '../../types/library';
import { 
  formatRupiah, 
  formatDateIndo, 
  calculateOverdueDays, 
  generateWhatsAppMessage, 
  generateEmailMessage 
} from '../../utils/formatters';
import { sounds } from '../../utils/audio';

interface NotificationDrawerProps {
  overdueLoans: CirculationRecord[];
  settings: LibrarySettings;
  onClose: () => void;
  onMarkNotificationSent: (recordId: string, channel: 'whatsapp' | 'email') => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  overdueLoans,
  settings,
  onClose,
  onMarkNotificationSent,
}) => {
  const [selectedRecord, setSelectedRecord] = useState<CirculationRecord | null>(overdueLoans[0] || null);
  const [activeChannel, setActiveChannel] = useState<'whatsapp' | 'email'>('whatsapp');
  const [copied, setCopied] = useState(false);
  const [batchSending, setBatchSending] = useState(false);
  const [batchSuccess, setBatchSuccess] = useState(false);

  const activeMessage = selectedRecord 
    ? (activeChannel === 'whatsapp' 
        ? generateWhatsAppMessage(selectedRecord, settings) 
        : generateEmailMessage(selectedRecord, settings))
    : null;

  const handleCopy = () => {
    if (!activeMessage) return;
    const textToCopy = 'text' in activeMessage ? activeMessage.text : activeMessage.body;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendSingle = () => {
    if (!selectedRecord || !activeMessage) return;
    sounds.playScanBeep();

    if (activeChannel === 'whatsapp' && 'url' in activeMessage) {
      window.open(activeMessage.url, '_blank', 'noopener,noreferrer');
      onMarkNotificationSent(selectedRecord.id, 'whatsapp');
    } else if (activeChannel === 'email' && 'mailtoUrl' in activeMessage) {
      window.open(activeMessage.mailtoUrl, '_blank', 'noopener,noreferrer');
      onMarkNotificationSent(selectedRecord.id, 'email');
    }
  };

  const handleBatchSend = () => {
    setBatchSending(true);
    sounds.playScanBeep();
    setTimeout(() => {
      overdueLoans.forEach(loan => {
        onMarkNotificationSent(loan.id, 'whatsapp');
      });
      setBatchSending(false);
      setBatchSuccess(true);
      sounds.playSuccessChime();
      setTimeout(() => setBatchSuccess(false), 4000);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base">Gateway Pengingat Otomatis</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/30 text-rose-300 border border-rose-500/40">
                  {overdueLoans.length} Jatuh Tempo
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Kirim notifikasi pengingat via WhatsApp & Email ke siswa/guru
              </p>
            </div>
          </div>

          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Batch action banner */}
        {overdueLoans.length > 0 && (
          <div className="px-6 py-3 bg-amber-50 border-b border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0 text-xs">
            <div className="flex items-center gap-2 text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                Terdapat <strong>{overdueLoans.length} anggota</strong> yang terlambat mengembalikan buku.
              </span>
            </div>

            <button
              onClick={handleBatchSend}
              disabled={batchSending}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all shadow-sm active:scale-95"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{batchSending ? 'Memproses Antrean...' : 'Kirim Pengingat ke Semua (Batch)'}</span>
            </button>
          </div>
        )}

        {batchSuccess && (
          <div className="px-6 py-2.5 bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-2 shrink-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Berhasil! Pesan pengingat otomatis telah dikirimkan ke seluruh antrean peminjam jatuh tempo.</span>
          </div>
        )}

        {/* Main 2-column layout */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          
          {/* Left: Overdue list */}
          <div className="w-full md:w-80 border-r border-slate-200 bg-slate-50/50 p-4 overflow-y-auto space-y-2 shrink-0">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Daftar Peminjam Jatuh Tempo
            </span>

            {overdueLoans.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
                <p className="font-bold text-slate-700">Semua Peminjaman Tepat Waktu</p>
                <p className="text-[11px] mt-1">Tidak ada buku yang jatuh tempo hari ini.</p>
              </div>
            ) : (
              overdueLoans.map((item) => {
                const lateDays = calculateOverdueDays(item.dueDate);
                const isSelected = selectedRecord?.id === item.id;

                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedRecord(item)}
                    className={`p-3 rounded-2xl border text-xs cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-white border-emerald-500 shadow-md ring-2 ring-emerald-500/20'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <p className="font-bold text-slate-800 truncate">{item.memberName}</p>
                      <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded shrink-0">
                        Telat {lateDays} hr
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 truncate mt-0.5">&ldquo;{item.bookTitle}&rdquo;</p>
                    
                    <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                      <span>{item.memberClass || item.memberRole}</span>
                      {item.whatsappReminderSent && (
                        <span className="text-emerald-600 font-semibold flex items-center gap-0.5">
                          <Check className="w-3 h-3" /> WA Terkirim
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right: Message Preview & Dispatch */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4">
            {selectedRecord ? (
              <>
                {/* Channel Selector */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                    <button
                      onClick={() => setActiveChannel('whatsapp')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                        activeChannel === 'whatsapp' ? 'bg-emerald-600 text-white shadow font-bold' : 'text-slate-600'
                      }`}
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>WhatsApp Gateway</span>
                    </button>
                    <button
                      onClick={() => setActiveChannel('email')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                        activeChannel === 'email' ? 'bg-blue-600 text-white shadow font-bold' : 'text-slate-600'
                      }`}
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>Email Template</span>
                    </button>
                  </div>

                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Tersalin' : 'Salin Pesan'}</span>
                  </button>
                </div>

                {/* Recipient Details */}
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Penerima</span>
                    <p className="font-bold text-slate-800">{selectedRecord.memberName} ({selectedRecord.memberClass || selectedRecord.memberRole})</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Kontak WhatsApp</span>
                    <p className="font-mono text-slate-700">{selectedRecord.memberWhatsapp}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Email Siswa/Guru</span>
                    <p className="text-slate-700">{selectedRecord.memberEmail}</p>
                  </div>
                </div>

                {/* Message Preview Box */}
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Pratinjau Pesan yang Akan Dikirim:
                  </span>
                  <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 font-mono text-xs whitespace-pre-line text-slate-800 leading-relaxed shadow-inner">
                    {'text' in activeMessage! ? activeMessage!.text : activeMessage!.body}
                  </div>
                </div>

                {/* Action button */}
                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    onClick={handleSendSingle}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs text-white shadow-md transition-all active:scale-95 ${
                      activeChannel === 'whatsapp' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-blue-600 hover:bg-blue-500'
                    }`}
                  >
                    <Send className="w-4 h-4" />
                    <span>Buka & Kirim Sekarang Melalui {activeChannel === 'whatsapp' ? 'WhatsApp' : 'Email'}</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                Pilih salah satu peminjam di sisi kiri untuk melihat pratinjau pesan.
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
