import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Camera, 
  ScanLine, 
  Keyboard, 
  CheckCircle2, 
  AlertCircle, 
  BookMarked, 
  User, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { Book, Member } from '../../types/library';
import { sounds } from '../../utils/audio';

interface BarcodeScannerModalProps {
  books: Book[];
  members: Member[];
  onClose: () => void;
  onSelectScannedItem: (item: { type: 'book' | 'member'; data: Book | Member }) => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  books,
  members,
  onClose,
  onSelectScannedItem,
}) => {
  const [activeMode, setActiveMode] = useState<'camera' | 'laser'>('camera');
  const [manualCode, setManualCode] = useState('');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [lastScannedResult, setLastScannedResult] = useState<{
    code: string;
    type: 'book' | 'member';
    item: Book | Member;
  } | null>(null);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = 'qr-reader-container';

  // Handle detection from camera or manual input
  const processBarcodeValue = (rawCode: string) => {
    const code = rawCode.trim();
    if (!code) return;

    // Check if it's a book
    const foundBook = books.find(
      b => b.barcode.toLowerCase() === code.toLowerCase() || 
           b.isbn.replace(/-/g, '') === code.replace(/-/g, '')
    );

    if (foundBook) {
      sounds.playScanBeep();
      setLastScannedResult({
        code,
        type: 'book',
        item: foundBook,
      });
      return;
    }

    // Check if it's a member
    const foundMember = members.find(
      m => m.memberNumber.toLowerCase() === code.toLowerCase() ||
           m.id.toLowerCase() === code.toLowerCase()
    );

    if (foundMember) {
      sounds.playScanBeep();
      setLastScannedResult({
        code,
        type: 'member',
        item: foundMember,
      });
      return;
    }

    // Unknown code
    sounds.playErrorBeep();
    setCameraError(`Barcode "${code}" tidak ditemukan dalam database perpustakaan.`);
  };

  // Setup camera scanner
  useEffect(() => {
    let html5QrCode: Html5Qrcode | null = null;

    if (activeMode === 'camera') {
      try {
        html5QrCode = new Html5Qrcode(scannerContainerId);
        scannerRef.current = html5QrCode;

        html5QrCode
          .start(
            { facingMode: 'environment' },
            {
              fps: 10,
              qrbox: { width: 280, height: 160 },
              aspectRatio: 1.777778,
            },
            (decodedText) => {
              processBarcodeValue(decodedText);
            },
            () => {
              // scanning silently...
            }
          )
          .then(() => {
            setIsScanning(true);
            setCameraError(null);
          })
          .catch((err) => {
            console.warn('Camera failed to start:', err);
            setCameraError('Kamera tidak dapat diakses atau izin ditolak. Anda dapat menggunakan mode Scanner Laser / Input Cepat di bawah.');
            setActiveMode('laser');
          });
      } catch (err) {
        console.warn('Scanner error:', err);
        setCameraError('Gunakan mode input keyboard scanner barcode.');
        setActiveMode('laser');
      }
    }

    return () => {
      if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().then(() => {
          html5QrCode?.clear();
        }).catch(() => {});
      }
    };
  }, [activeMode]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    processBarcodeValue(manualCode);
  };

  const handleConfirmResult = () => {
    if (!lastScannedResult) return;
    sounds.playSuccessChime();
    onSelectScannedItem({
      type: lastScannedResult.type,
      data: lastScannedResult.item,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
              <ScanLine className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">Barcode Scanner Perpustakaan</h3>
              <p className="text-xs text-slate-500">Scan Barcode Buku atau Kartu Anggota</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Toggle: Camera vs Quick Laser */}
        <div className="flex bg-slate-100 p-1 rounded-xl my-4 text-xs font-semibold">
          <button
            onClick={() => {
              setActiveMode('camera');
              setCameraError(null);
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all ${
              activeMode === 'camera' ? 'bg-white text-teal-800 shadow-sm font-bold' : 'text-slate-600'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Kamera Live Scanner</span>
          </button>
          <button
            onClick={() => {
              setActiveMode('laser');
              if (scannerRef.current && scannerRef.current.isScanning) {
                scannerRef.current.stop().catch(() => {});
              }
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all ${
              activeMode === 'laser' ? 'bg-white text-teal-800 shadow-sm font-bold' : 'text-slate-600'
            }`}
          >
            <Keyboard className="w-4 h-4" />
            <span>Laser Scanner / Manual</span>
          </button>
        </div>

        {/* Scanner View Area */}
        {activeMode === 'camera' ? (
          <div className="relative rounded-2xl overflow-hidden bg-slate-900 aspect-video flex items-center justify-center border-2 border-dashed border-teal-500/50">
            <div id={scannerContainerId} className="w-full h-full"></div>
            
            {/* Visual Red Laser Guide */}
            <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 h-0.5 bg-rose-500 shadow-[0_0_8px_#f43f5e] animate-pulse pointer-events-none"></div>

            <div className="absolute bottom-2 left-2 right-2 text-center pointer-events-none">
              <span className="bg-black/70 text-white text-[11px] px-3 py-1 rounded-full backdrop-blur-sm">
                Arahkan barcode buku atau kartu anggota ke kotak pandu
              </span>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
            <p className="text-xs text-slate-600 leading-relaxed">
              Gunakan barcode gun laser USB atau ketikkan kode barcode di bawah ini:
            </p>

            <form onSubmit={handleManualSubmit} className="flex gap-2">
              <input
                type="text"
                autoFocus
                placeholder="Contoh: SMP5-BK-001 atau NISN-0091827361"
                value={manualCode}
                onChange={(e) => {
                  setManualCode(e.target.value);
                  setCameraError(null);
                }}
                className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-teal-500 uppercase font-mono text-slate-800"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
              >
                Scan
              </button>
            </form>

            {/* Quick barcode test shortcuts */}
            <div className="pt-2">
              <span className="text-[11px] text-slate-400 font-semibold block mb-1.5">
                Pilih Contoh Cepat untuk Uji Coba:
              </span>
              <div className="flex flex-wrap gap-1.5 text-[11px]">
                {books.slice(0, 3).map(b => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => processBarcodeValue(b.barcode)}
                    className="px-2 py-1 bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 rounded-lg border border-slate-200 font-mono"
                  >
                    {b.barcode} (Buku)
                  </button>
                ))}
                {members.slice(0, 2).map(m => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => processBarcodeValue(m.memberNumber)}
                    className="px-2 py-1 bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-lg border border-slate-200 font-mono"
                  >
                    {m.memberNumber} (Kartu)
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Error message */}
        {cameraError && (
          <div className="mt-3 p-3 bg-rose-50 text-rose-700 rounded-xl text-xs flex items-center gap-2 border border-rose-200">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{cameraError}</span>
          </div>
        )}

        {/* Last Scanned Match Card */}
        {lastScannedResult && (
          <div className="mt-4 p-4 rounded-2xl bg-emerald-50 border border-emerald-300 transition-all">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  lastScannedResult.type === 'book' ? 'bg-emerald-200 text-emerald-800' : 'bg-blue-200 text-blue-800'
                }`}>
                  {lastScannedResult.type === 'book' ? (
                    <BookMarked className="w-5 h-5" />
                  ) : (
                    <User className="w-5 h-5" />
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-200/80 text-emerald-900">
                      Terdeteksi: {lastScannedResult.type === 'book' ? 'Buku Koleksi' : 'Kartu Anggota'}
                    </span>
                    <span className="font-mono text-xs font-bold text-slate-700">
                      {lastScannedResult.code}
                    </span>
                  </div>

                  <p className="font-extrabold text-sm text-slate-800 mt-1 truncate">
                    {lastScannedResult.type === 'book'
                      ? (lastScannedResult.item as Book).title
                      : (lastScannedResult.item as Member).name}
                  </p>

                  <p className="text-xs text-slate-600">
                    {lastScannedResult.type === 'book'
                      ? `Penulis: ${(lastScannedResult.item as Book).author} • Lokasi: ${(lastScannedResult.item as Book).rackLocation}`
                      : `${(lastScannedResult.item as Member).gradeClass || (lastScannedResult.item as Member).role} • ${(lastScannedResult.item as Member).memberNumber}`}
                  </p>
                </div>
              </div>

              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            </div>

            <div className="mt-3 pt-3 border-t border-emerald-200/80 flex items-center justify-end gap-2">
              <button
                onClick={handleConfirmResult}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs shadow-md transition-all active:scale-95"
              >
                <span>Proses di Menu Sirkulasi</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
