import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  BarChart3, 
  Users, 
  UserCheck, 
  Zap, 
  FileText, 
  Bus,
  LogOut,
  ChevronUp
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard', icon: <BarChart3 className="h-4 w-4" />, href: '/admin/dashboard' },
  { label: 'Manajemen Pengguna', icon: <Users className="h-4 w-4" />, href: '/admin/users' },
  { label: 'Manajemen Pemandu', icon: <UserCheck className="h-4 w-4" />, href: '/admin/guides' },
  { label: 'Manajemen Subscription', icon: <Zap className="h-4 w-4" />, href: '/admin/subscriptions' },
  { label: 'Manajemen Laporan', icon: <FileText className="h-4 w-4" />, href: '/admin/reports' },
  { label: 'Manajemen Data', icon: <Bus className="h-4 w-4" />, href: '/admin/data' },
];

export function AdminSidebar() {
  const location = useLocation();
  const [isAccountOpen, setIsAccountOpen] = useState(false);

  return (
    <aside className="w-64 flex-shrink-0 border-r border-border bg-muted/30 flex flex-col min-h-screen">
      {/* Logo Section */}
      <div className="p-6 border-b border-border">
        <Link to="/" className="flex items-center gap-2 font-bold text-xl text-primary">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold text-sm">A</div>
          ARAHIN
        </Link>
        <div className="mt-2 text-xs text-muted-foreground font-semibold uppercase tracking-wider">Admin Panel</div>
      </div>

      {/* Navigation Section */}
      <nav className="flex-1 p-4 space-y-1">
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
        {/* Tombol Logout (Muncul jika isAccountOpen true) */}
        {isAccountOpen && (
          <div className="absolute bottom-20 left-4 right-4 bg-card border border-border rounded-xl shadow-lg p-2 mb-2 animate-in fade-in slide-in-from-bottom-2">
            <Link 
              to="/login" 
              className="flex items-center gap-3 px-3 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
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