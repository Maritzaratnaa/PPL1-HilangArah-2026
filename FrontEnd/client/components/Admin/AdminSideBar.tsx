import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  BarChart3, 
  Users, 
  UserCheck, 
  Zap, 
  FileText, 
  Bus,
  Shield, // <-- Icon baru untuk Manajemen Admin
  LogOut,
  ChevronUp,
  Sun,    // <-- Icon untuk Light Mode
  Moon    // <-- Icon untuk Dark Mode
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard', icon: <BarChart3 className="h-4 w-4" />, href: '/admin/dashboard' },
  { label: 'Manajemen Pengguna', icon: <Users className="h-4 w-4" />, href: '/admin/users' },
  { label: 'Manajemen Pemandu', icon: <UserCheck className="h-4 w-4" />, href: '/admin/guides' },
  { label: 'Manajemen Subscription', icon: <Zap className="h-4 w-4" />, href: '/admin/subscriptions' },
  { label: 'Manajemen Laporan', icon: <FileText className="h-4 w-4" />, href: '/admin/reports' },
  { label: 'Manajemen Data', icon: <Bus className="h-4 w-4" />, href: '/admin/data' },
  // Tambahan Menu Manajemen Admin
  { label: 'Manajemen Admin', icon: <Shield className="h-4 w-4" />, href: '/admin/manage' },
];

export function AdminSidebar() {
  const location = useLocation();
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Efek untuk memuat tema dari localStorage saat komponen pertama kali di-render
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // Fungsi untuk mengganti tema (Light <-> Dark)
  const toggleTheme = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDarkMode(true);
    }
  };

  return (
    <aside className="w-64 flex-shrink-0 border-r border-border bg-muted/30 flex flex-col h-screen sticky top-0">
      
      {/* Logo Section */}
      <div className="p-6 border-b border-border">
        <Link to="/" className="flex items-center gap-2 font-bold text-xl text-primary">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold text-sm">A</div>
          ARAHIN
        </Link>
        <div className="mt-2 text-xs text-muted-foreground font-semibold uppercase tracking-wider">Admin Panel</div>
      </div>

      {/* Navigation Section */}
      {/* Menambahkan overflow-y-auto di sini agar isi navigasi bisa discroll jika kepanjangan */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link key={item.href} to={item.href}>
              <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors
                ${isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}>
                {item.icon}
                {item.label}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Admin Account Section with Logout Pop-up */}
      <div className="p-4 border-t border-border relative">
        
        {/* Pop-up Menu (Logout & Theme Toggle) */}
        {isAccountOpen && (
          <div className="absolute bottom-20 left-4 right-4 bg-card border border-border rounded-xl shadow-lg p-2 mb-2 flex flex-col gap-1 animate-in fade-in slide-in-from-bottom-2">
            
            {/* Tombol Toggle Tema */}
            <button 
              onClick={toggleTheme}
              className="flex items-center justify-between px-3 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors w-full"
            >
              <div className="flex items-center gap-3">
                {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                {isDarkMode ? 'Mode Terang' : 'Mode Gelap'}
              </div>
            </button>

            <div className="h-px bg-border my-1" /> {/* Garis pemisah */}

            {/* Tombol Logout */}
            <Link 
              to="/login" 
              className="flex items-center gap-3 px-3 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Keluar Panel
            </Link>
          </div>
        )}

        {/* Profil Admin */}
        <button 
          onClick={() => setIsAccountOpen(!isAccountOpen)}
          className={`w-full flex items-center justify-between p-2 rounded-xl transition-colors hover:bg-muted/50 ${isAccountOpen ? 'bg-muted/50' : ''}`}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold shadow-sm">
              AD
            </div>
            <div className="text-left">
              <div className="text-sm font-semibold">Admin</div>
              <div className="text-[10px] text-muted-foreground">admin@arahin.com</div>
            </div>
          </div>
          <ChevronUp className={`h-4 w-4 text-muted-foreground transition-transform ${isAccountOpen ? 'rotate-0' : 'rotate-180'}`} />
        </button>
      </div>
    </aside>
  );
}