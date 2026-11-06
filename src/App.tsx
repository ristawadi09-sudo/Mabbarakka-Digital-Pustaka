import React, { useState, useEffect } from 'react';
import { 
  Book, 
  DigitalBook, 
  Member, 
  CirculationRecord, 
  ReadingJournalEntry, 
  ActiveVisitor, 
  LibrarySettings,
  GASConfig,
  AuthSession,
  AppRole
} from './types/library';
import { storageService } from './services/storageService';
import { gasService } from './services/gasService';
import { initialActiveVisitors } from './data/initialData';
import { Navbar } from './components/Navbar';
import { Sidebar, ActiveTab } from './components/Sidebar';
import { DashboardView } from './components/Dashboard/DashboardView';
import { PrintedBooksView } from './components/Books/PrintedBooksView';
import { DigitalBooksView } from './components/Digital/DigitalBooksView';
import { CirculationView } from './components/Circulation/CirculationView';
import { PersonalLoansView } from './components/Circulation/PersonalLoansView';
import { MembersView } from './components/Members/MembersView';
import { ReportsView } from './components/Reports/ReportsView';
import { ReadingJournalView } from './components/Journal/ReadingJournalView';
import { FinesView } from './components/Fines/FinesView';
import { GASView } from './components/GAS/GASView';
import { BarcodeScannerModal } from './components/Circulation/BarcodeScannerModal';
import { QuickBorrowModal } from './components/Circulation/QuickBorrowModal';
import { NotificationDrawer } from './components/Notifications/NotificationDrawer';
import { LoginModal } from './components/Auth/LoginModal';
import { MemberCardModal } from './components/Members/MemberCardModal';
import { calculateOverdueDays, generateWhatsAppMessage, generateEmailMessage } from './utils/formatters';
import { sounds } from './utils/audio';
import { ShieldAlert, KeyRound, ArrowRight } from 'lucide-react';

export default function App() {
  // Master state with persistent storage
  const [settings, setSettings] = useState<LibrarySettings>(() => storageService.getSettings());
  const [books, setBooks] = useState<Book[]>(() => storageService.getBooks());
  const [digitalBooks, setDigitalBooks] = useState<DigitalBook[]>(() => storageService.getDigitalBooks());
  const [members, setMembers] = useState<Member[]>(() => storageService.getMembers());
  const [circulation, setCirculation] = useState<CirculationRecord[]>(() => storageService.getCirculation());
  const [journals, setJournals] = useState<ReadingJournalEntry[]>(() => storageService.getJournals());
  const [currentUser, setCurrentUser] = useState<Member | null>(() => storageService.getCurrentUser());
  const [authSession, setAuthSession] = useState<AuthSession>(() => storageService.getAuthSession());
  const [gasConfig, setGASConfig] = useState<GASConfig>(() => storageService.getGASConfig());
  const [activeVisitors, setActiveVisitors] = useState<ActiveVisitor[]>(initialActiveVisitors);

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  // Modals state
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isQuickBorrowOpen, setIsQuickBorrowOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [selectedMemberForCard, setSelectedMemberForCard] = useState<Member | null>(null);

  const [preselectedBookForBorrow, setPreselectedBookForBorrow] = useState<Book | null>(null);
  const [preselectedMemberForBorrow, setPreselectedMemberForBorrow] = useState<Member | null>(null);
  const [preselectedBookTitleForJournal, setPreselectedBookTitleForJournal] = useState<string>('');

  // Persist state changes
  useEffect(() => {
    storageService.saveSettings(settings);
  }, [settings]);

  useEffect(() => {
    storageService.saveBooks(books);
  }, [books]);

  useEffect(() => {
    storageService.saveDigitalBooks(digitalBooks);
  }, [digitalBooks]);

  useEffect(() => {
    storageService.saveMembers(members);
  }, [members]);

  useEffect(() => {
    storageService.saveCirculation(circulation);
  }, [circulation]);

  useEffect(() => {
    storageService.saveJournals(journals);
  }, [journals]);

  useEffect(() => {
    storageService.setCurrentUser(currentUser);
  }, [currentUser]);

  useEffect(() => {
    storageService.setAuthSession(authSession);
  }, [authSession]);

  useEffect(() => {
    storageService.saveGASConfig(gasConfig);
  }, [gasConfig]);

  // Derived counts
  const overdueLoans = circulation.filter(c => {
    if (c.status === 'Dikembalikan') return false;
    return c.status === 'Terlambat' || calculateOverdueDays(c.dueDate) > 0;
  });

  const activeLoanCount = circulation.filter(c => c.status !== 'Dikembalikan').length;
  const unpaidFinesCount = circulation.filter(c => !c.finePaid && (c.fineAmount > 0 || (c.status !== 'Dikembalikan' && calculateOverdueDays(c.dueDate) > 0))).length;

  // Handlers for authentication & role switching
  const handleLoginSuccess = (session: AuthSession) => {
    setAuthSession(session);
    storageService.setAuthSession(session);

    if (session.role === 'anggota') {
      const matched = members.find(m => m.id === session.id || m.memberNumber === session.memberNumber);
      if (matched) setCurrentUser(matched);
      // If currently on an admin-restricted tab, auto-switch to member personal loans
      if (['circulation', 'members', 'reports', 'fines', 'gas'].includes(activeTab)) {
        setActiveTab('my_loans');
      }
    } else {
      setCurrentUser(null);
    }
  };

  const handleLogout = () => {
    setIsLoginModalOpen(true);
  };

  const handleSwitchToMember = (member: Member) => {
    const memberSession: AuthSession = {
      id: member.id,
      username: member.memberNumber,
      name: member.name,
      role: 'anggota',
      memberRole: member.role,
      gradeClass: member.gradeClass,
      whatsapp: member.whatsapp,
      email: member.email,
      memberNumber: member.memberNumber,
      avatarUrl: member.avatarUrl,
      source: 'demo_local',
      loginTime: new Date().toISOString()
    };
    setAuthSession(memberSession);
    setCurrentUser(member);
    if (['circulation', 'members', 'reports', 'fines', 'gas'].includes(activeTab)) {
      setActiveTab('my_loans');
    }
    sounds.playSuccessChime();
  };

  const handleSwitchToAdmin = () => {
    const adminSession: AuthSession = {
      id: 'usr-admin-01',
      username: 'admin',
      name: 'Ristawadi, S.Pd. (Pustakawan)',
      role: 'admin',
      email: 'ristawadi09@guru.smp.belajar.id',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      source: 'demo_local',
      loginTime: new Date().toISOString()
    };
    setAuthSession(adminSession);
    setCurrentUser(null);
    sounds.playSuccessChime();
  };

  const handleOpenCurrentMemberCard = () => {
    const member = members.find(m => m.id === authSession.id || m.memberNumber === authSession.memberNumber) || members[0];
    setSelectedMemberForCard(member);
  };

  // Handlers for circulation actions
  const handleBorrowSuccess = (newRecord: CirculationRecord) => {
    setCirculation([newRecord, ...circulation]);

    // Decrease available copies of the book
    setBooks(prev => prev.map(b => {
      if (b.id === newRecord.bookId) {
        return { ...b, availableCopies: Math.max(0, b.availableCopies - 1) };
      }
      return b;
    }));

    // Increase active loan count for member
    setMembers(prev => prev.map(m => {
      if (m.id === newRecord.memberId) {
        return { ...m, activeLoanCount: m.activeLoanCount + 1 };
      }
      return m;
    }));

    // Auto-sync to Google Apps Script if enabled
    if (gasConfig.autoSync && gasConfig.webAppUrl) {
      gasService.sendSingleActionToGAS(gasConfig.webAppUrl, 'saveCirculation', 'record', newRecord);
    }
  };

  const handleReturnBook = (recordId: string) => {
    const todayStr = new Date().toISOString().split('T')[0];
    let bookToReturnId = '';
    let memberId = '';
    let updatedRecord: CirculationRecord | null = null;

    setCirculation(prev => prev.map(c => {
      if (c.id === recordId) {
        bookToReturnId = c.bookId;
        memberId = c.memberId;
        const lateDays = calculateOverdueDays(c.dueDate);
        const fine = lateDays * (c.finePerDay || settings.finePerDay);

        const updated: CirculationRecord = {
          ...c,
          status: 'Dikembalikan',
          returnDate: todayStr,
          fineDays: lateDays,
          fineAmount: fine,
          finePaid: fine === 0 ? true : c.finePaid,
        };
        updatedRecord = updated;
        return updated;
      }
      return c;
    }));

    // Increase available copies back
    if (bookToReturnId) {
      setBooks(prev => prev.map(b => {
        if (b.id === bookToReturnId) {
          return { ...b, availableCopies: Math.min(b.totalCopies, b.availableCopies + 1) };
        }
        return b;
      }));
    }

    // Decrease active loan count
    if (memberId) {
      setMembers(prev => prev.map(m => {
        if (m.id === memberId) {
          return { ...m, activeLoanCount: Math.max(0, m.activeLoanCount - 1) };
        }
        return m;
      }));
    }

    // Auto-sync to Google Apps Script if enabled
    if (gasConfig.autoSync && gasConfig.webAppUrl && updatedRecord) {
      gasService.sendSingleActionToGAS(gasConfig.webAppUrl, 'saveCirculation', 'record', updatedRecord);
    }

    sounds.playSuccessChime();
  };

  const handleExtendLoan = (recordId: string, additionalDays: number) => {
    setCirculation(prev => prev.map(c => {
      if (c.id === recordId) {
        const curDue = new Date(c.dueDate + 'T00:00:00');
        curDue.setDate(curDue.getDate() + additionalDays);
        const newDueStr = curDue.toISOString().split('T')[0];
        return {
          ...c,
          dueDate: newDueStr,
          status: 'Dipinjam',
          notes: `${c.notes || ''} (Diperpanjang +${additionalDays} hari)`.trim(),
        };
      }
      return c;
    }));
    sounds.playSuccessChime();
  };

  const handlePayFine = (recordId: string) => {
    const todayStr = new Date().toISOString().split('T')[0];
    setCirculation(prev => prev.map(c => {
      if (c.id === recordId) {
        return {
          ...c,
          finePaid: true,
          finePaymentDate: todayStr,
        };
      }
      return c;
    }));
    sounds.playSuccessChime();
  };

  const handleUpdateFineRate = (newRate: number) => {
    setSettings(prev => ({
      ...prev,
      finePerDay: newRate
    }));
  };

  // Handlers for adding and batch updating items
  const handleAddBook = (newBook: Book) => {
    setBooks(prev => [newBook, ...prev]);
    sounds.playSuccessChime();
    if (gasConfig.autoSync && gasConfig.webAppUrl) {
      gasService.sendSingleActionToGAS(gasConfig.webAppUrl, 'saveBook', 'book', newBook);
    }
  };

  const handleAddBooksBatch = (newBooks: Book[], mode: 'merge' | 'replace' = 'merge') => {
    if (mode === 'replace') {
      setBooks(newBooks);
    } else {
      setBooks(prev => {
        const existingIds = new Set(prev.map(b => b.barcode));
        const toAdd = newBooks.filter(b => !existingIds.has(b.barcode));
        return [...toAdd, ...prev];
      });
    }
    sounds.playSuccessChime();
  };

  const handleAddDigitalBook = (newDigitalBook: DigitalBook) => {
    setDigitalBooks(prev => [newDigitalBook, ...prev]);
    sounds.playSuccessChime();
    if (gasConfig.autoSync && gasConfig.webAppUrl) {
      gasService.sendSingleActionToGAS(gasConfig.webAppUrl, 'saveDigitalBook', 'digitalBook', newDigitalBook);
    }
  };

  const handleDeleteDigitalBook = (bookId: string) => {
    setDigitalBooks(prev => prev.filter(b => b.id !== bookId));
    sounds.playScanBeep();
  };

  const handleAddDigitalBooksBatch = (newDigitalBooks: DigitalBook[], mode: 'merge' | 'replace' = 'merge') => {
    if (mode === 'replace') {
      setDigitalBooks(newDigitalBooks);
    } else {
      setDigitalBooks(prev => {
        const existingIds = new Set(prev.map(b => b.id));
        const toAdd = newDigitalBooks.filter(b => !existingIds.has(b.id));
        return [...toAdd, ...prev];
      });
    }
    sounds.playSuccessChime();
  };

  const handleAddMember = (newMember: Member) => {
    setMembers(prev => [newMember, ...prev]);
    sounds.playSuccessChime();
    if (gasConfig.autoSync && gasConfig.webAppUrl) {
      gasService.sendSingleActionToGAS(gasConfig.webAppUrl, 'saveMember', 'member', newMember);
    }
  };

  const handleAddJournal = (newEntry: ReadingJournalEntry) => {
    setJournals(prev => [newEntry, ...prev]);
    sounds.playSuccessChime();
    if (gasConfig.autoSync && gasConfig.webAppUrl) {
      gasService.sendSingleActionToGAS(gasConfig.webAppUrl, 'saveJournal', 'journal', newEntry);
    }
  };

  const handleReplaceAllData = (data: {
    books?: Book[];
    digitalBooks?: DigitalBook[];
    members?: Member[];
    circulation?: CirculationRecord[];
    journals?: ReadingJournalEntry[];
    settings?: LibrarySettings;
  }) => {
    if (data.books) setBooks(data.books);
    if (data.digitalBooks) setDigitalBooks(data.digitalBooks);
    if (data.members) setMembers(data.members);
    if (data.circulation) setCirculation(data.circulation);
    if (data.journals) setJournals(data.journals);
    if (data.settings) setSettings(data.settings);
    sounds.playSuccessChime();
  };

  // Barcode scanned item selector
  const handleSelectScannedItem = (scanned: { type: 'book' | 'member'; data: Book | Member }) => {
    setIsScannerOpen(false);
    if (authSession.role !== 'admin') {
      // In student view, if book scanned, open detail
      if (scanned.type === 'book') {
        setActiveTab('printed_books');
      }
      return;
    }

    if (scanned.type === 'book') {
      setPreselectedBookForBorrow(scanned.data as Book);
      setPreselectedMemberForBorrow(null);
      setIsQuickBorrowOpen(true);
    } else {
      setPreselectedMemberForBorrow(scanned.data as Member);
      setPreselectedBookForBorrow(null);
      setIsQuickBorrowOpen(true);
    }
  };

  // Notification action handlers
  const handleMarkNotificationSent = (recordId: string, channel: 'whatsapp' | 'email') => {
    const todayStr = new Date().toISOString().split('T')[0];
    setCirculation(prev => prev.map(c => {
      if (c.id === recordId) {
        return {
          ...c,
          notificationSent: true,
          notificationSentDate: todayStr,
        };
      }
      return c;
    }));
  };

  const handleSendWhatsApp = (record: CirculationRecord) => {
    const { url } = generateWhatsAppMessage(record, settings);
    window.open(url, '_blank');
    handleMarkNotificationSent(record.id, 'whatsapp');
  };

  const handleSendEmail = (record: CirculationRecord) => {
    const { mailtoUrl } = generateEmailMessage(record, settings);
    window.location.href = mailtoUrl;
    handleMarkNotificationSent(record.id, 'email');
  };

  // Visitor simulator
  const handleSimulateNewVisitor = () => {
    if (members.length === 0) return;
    const randomMember = members[Math.floor(Math.random() * members.length)];
    const activities: ('Membaca E-Book' | 'Mencari Buku' | 'Jurnal Membaca' | 'Cek Sirkulasi' | 'Menjelajah Koleksi')[] = [
      'Membaca E-Book',
      'Mencari Buku',
      'Jurnal Membaca',
      'Cek Sirkulasi',
      'Menjelajah Koleksi'
    ];
    const act = activities[Math.floor(Math.random() * activities.length)];
    const devices: ('Komputer Lab' | 'Tablet Perpus' | 'Smartphone Siswa' | 'Laptop Guru')[] = [
      'Komputer Lab',
      'Tablet Perpus',
      'Smartphone Siswa',
      'Laptop Guru'
    ];
    const dev = devices[Math.floor(Math.random() * devices.length)];
    const timeStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const bookTitle = digitalBooks.length > 0 ? digitalBooks[Math.floor(Math.random() * digitalBooks.length)].title : undefined;

    const newVis: ActiveVisitor = {
      id: `vis-${Date.now()}`,
      memberId: randomMember.id,
      memberName: randomMember.name,
      role: randomMember.role,
      gradeClass: randomMember.gradeClass,
      currentActivity: act,
      currentBookTitle: act === 'Membaca E-Book' || act === 'Mencari Buku' ? bookTitle : undefined,
      device: dev,
      onlineSince: timeStr,
      avatarUrl: randomMember.avatarUrl,
    };

    setActiveVisitors([newVis, ...activeVisitors.slice(0, 5)]);
    sounds.playScanBeep();
  };

  // Check admin-restricted tab access
  const isAdminTab = ['circulation', 'members', 'reports', 'fines', 'gas'].includes(activeTab);
  const isAccessDenied = authSession.role === 'anggota' && isAdminTab;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      
      {/* Top Navbar */}
      <Navbar
        settings={settings}
        overdueCount={overdueLoans.length}
        activeVisitorCount={activeVisitors.length}
        currentSession={authSession}
        allMembers={members}
        gasConfig={gasConfig}
        onOpenGAS={() => setActiveTab('gas')}
        onOpenScanner={() => setIsScannerOpen(true)}
        onOpenNotifications={() => setIsNotificationOpen(true)}
        onOpenQuickBorrow={() => {
          setPreselectedBookForBorrow(null);
          setPreselectedMemberForBorrow(null);
          setIsQuickBorrowOpen(true);
        }}
        onOpenLoginModal={() => setIsLoginModalOpen(true)}
        onOpenMemberCard={handleOpenCurrentMemberCard}
        onSwitchToMember={handleSwitchToMember}
        onSwitchToAdmin={handleSwitchToAdmin}
        onLogout={handleLogout}
      />

      {/* Main Body with Sidebar & View Area */}
      <div className="flex-1 flex flex-col lg:flex-row">
        
        {/* Navigation Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          overdueCount={overdueLoans.length}
          activeLoanCount={activeLoanCount}
          unpaidFinesCount={unpaidFinesCount}
          currentSession={authSession}
          onOpenLoginModal={() => setIsLoginModalOpen(true)}
          onLogout={handleLogout}
        />

        {/* Content View Canvas */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          
          {/* Access Restriction Warning Banner for Anggota */}
          {isAccessDenied ? (
            <div className="bg-white rounded-3xl border border-rose-200 p-8 sm:p-12 text-center shadow-lg max-w-2xl mx-auto my-8 space-y-5">
              <div className="w-16 h-16 rounded-3xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100 shadow-sm">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-rose-100 text-rose-800 uppercase tracking-wider">
                  Akses Terbatas &bull; Khusus Administrator
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-slate-800 pt-1">
                  Menu Khusus Petugas Perpustakaan
                </h2>
                <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
                  Akun Anda saat ini masuk sebagai <strong className="text-slate-700">{authSession.name} ({authSession.gradeClass || authSession.memberRole || 'Anggota'})</strong>. Halaman ini memerlukan hak akses Petugas / Administrator Perpustakaan.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
                <button
                  onClick={() => setIsLoginModalOpen(true)}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all active:scale-95"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>Masuk Sebagai Petugas Admin</span>
                </button>
                <button
                  onClick={() => setActiveTab('my_loans')}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
                >
                  <span>Lihat Riwayat Peminjaman Saya</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <DashboardView
                  books={books}
                  digitalBooks={digitalBooks}
                  members={members}
                  circulation={circulation}
                  activeVisitors={activeVisitors}
                  settings={settings}
                  onNavigate={setActiveTab}
                  onOpenScanner={() => setIsScannerOpen(true)}
                  onOpenQuickBorrow={() => {
                    setPreselectedBookForBorrow(null);
                    setPreselectedMemberForBorrow(null);
                    setIsQuickBorrowOpen(true);
                  }}
                  onOpenNotifications={() => setIsNotificationOpen(true)}
                  onSimulateVisitor={handleSimulateNewVisitor}
                  onSendWhatsApp={handleSendWhatsApp}
                  onSendEmail={handleSendEmail}
                />
              )}

              {activeTab === 'printed_books' && (
                <PrintedBooksView
                  books={books}
                  onAddBook={handleAddBook}
                  onAddBooksBatch={handleAddBooksBatch}
                  currentRole={authSession.role}
                  onSelectBookToBorrow={(book) => {
                    setPreselectedBookForBorrow(book);
                    setIsQuickBorrowOpen(true);
                  }}
                />
              )}

              {activeTab === 'digital_books' && (
                <DigitalBooksView
                  digitalBooks={digitalBooks}
                  onAddDigitalBook={handleAddDigitalBook}
                  onDeleteDigitalBook={handleDeleteDigitalBook}
                  onAddDigitalBooksBatch={handleAddDigitalBooksBatch}
                  currentRole={authSession.role}
                  onOpenJournalForBook={(book) => {
                    setPreselectedBookTitleForJournal(book.title);
                    setActiveTab('journal');
                  }}
                />
              )}

              {activeTab === 'my_loans' && (
                <PersonalLoansView
                  currentSession={authSession}
                  circulation={circulation}
                  allBooks={books}
                  onOpenMemberCard={(mId) => {
                    const m = members.find(x => x.id === mId) || members.find(x => x.memberNumber === authSession.memberNumber) || members[0];
                    setSelectedMemberForCard(m);
                  }}
                  onNavigateToCatalog={() => setActiveTab('printed_books')}
                  onNavigateToDigital={() => setActiveTab('digital_books')}
                  onOpenJournalForBookTitle={(title) => {
                    setPreselectedBookTitleForJournal(title);
                    setActiveTab('journal');
                  }}
                />
              )}

              {activeTab === 'circulation' && (
                <CirculationView
                  circulation={circulation}
                  books={books}
                  members={members}
                  settings={settings}
                  onReturnBook={handleReturnBook}
                  onExtendLoan={handleExtendLoan}
                  onOpenQuickBorrow={() => {
                    setPreselectedBookForBorrow(null);
                    setPreselectedMemberForBorrow(null);
                    setIsQuickBorrowOpen(true);
                  }}
                  onOpenScanner={() => setIsScannerOpen(true)}
                  onSendWhatsApp={handleSendWhatsApp}
                  onSendEmail={handleSendEmail}
                  onPayFine={handlePayFine}
                />
              )}

              {activeTab === 'members' && (
                <MembersView
                  members={members}
                  settings={settings}
                  onAddMember={handleAddMember}
                />
              )}

              {activeTab === 'reports' && (
                <ReportsView
                  circulation={circulation}
                  books={books}
                  members={members}
                  settings={settings}
                />
              )}

              {activeTab === 'journal' && (
                <ReadingJournalView
                  journals={journals}
                  books={books}
                  digitalBooks={digitalBooks}
                  currentUser={currentUser}
                  onAddJournal={handleAddJournal}
                  preselectedBookTitle={preselectedBookTitleForJournal}
                />
              )}

              {activeTab === 'fines' && (
                <FinesView
                  circulation={circulation}
                  settings={settings}
                  onPayFine={handlePayFine}
                  onUpdateFineRate={handleUpdateFineRate}
                />
              )}

              {activeTab === 'gas' && (
                <GASView
                  gasConfig={gasConfig}
                  onUpdateGASConfig={setGASConfig}
                  books={books}
                  digitalBooks={digitalBooks}
                  members={members}
                  circulation={circulation}
                  journals={journals}
                  settings={settings}
                  onReplaceAllData={handleReplaceAllData}
                  onAddBooksBatch={handleAddBooksBatch}
                  onAddDigitalBooksBatch={handleAddDigitalBooksBatch}
                />
              )}
            </>
          )}

        </main>
      </div>

      {/* Global Modals */}

      {/* 1. Barcode Scanner Modal */}
      {isScannerOpen && (
        <BarcodeScannerModal
          books={books}
          members={members}
          onClose={() => setIsScannerOpen(false)}
          onSelectScannedItem={handleSelectScannedItem}
        />
      )}

      {/* 2. Quick Borrow Modal */}
      {isQuickBorrowOpen && (
        <QuickBorrowModal
          books={books}
          members={members}
          settings={settings}
          preselectedBook={preselectedBookForBorrow}
          preselectedMember={preselectedMemberForBorrow}
          onClose={() => {
            setIsQuickBorrowOpen(false);
            setPreselectedBookForBorrow(null);
            setPreselectedMemberForBorrow(null);
          }}
          onBorrowSuccess={handleBorrowSuccess}
          onOpenScanner={() => {
            setIsQuickBorrowOpen(false);
            setIsScannerOpen(true);
          }}
        />
      )}

      {/* 3. Notification Drawer */}
      {isNotificationOpen && (
        <NotificationDrawer
          overdueLoans={overdueLoans}
          settings={settings}
          onClose={() => setIsNotificationOpen(false)}
          onMarkNotificationSent={handleMarkNotificationSent}
        />
      )}

      {/* 4. Login Custom Password Modal (GAS Cloud + Demo Fallback) */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        gasConfig={gasConfig}
        allMembers={members}
        currentSession={authSession}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* 5. Official Library Card Modal (Digital Barcode Card) */}
      {selectedMemberForCard && (
        <MemberCardModal
          member={selectedMemberForCard}
          settings={settings}
          onClose={() => setSelectedMemberForCard(null)}
        />
      )}

    </div>
  );
}
