import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  BarChart3, 
  Users, 
  UserCheck, 
  Zap, 
  FileText, 
  Bus,
  Shield, 
  LogOut,
  ChevronUp,
  Sun,    
  Moon,
  X,
  Eye,
  EyeOff,
  Loader2,
  KeyRound
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const navItems = [
  { label: 'Dashboard', icon: <BarChart3 className="h-4 w-4" />, href: '/admin/dashboard' },
  { label: 'Manajemen Pengguna', icon: <Users className="h-4 w-4" />, href: '/admin/users' },
  { label: 'Manajemen Pemandu', icon: <UserCheck className="h-4 w-4" />, href: '/admin/guides' },
  { label: 'Manajemen Subscription', icon: <Zap className="h-4 w-4" />, href: '/admin/subscriptions' },
  { label: 'Manajemen Laporan', icon: <FileText className="h-4 w-4" />, href: '/admin/reports' },
  { label: 'Manajemen Data', icon: <Bus className="h-4 w-4" />, href: '/admin/data' },
  { label: 'Manajemen Admin', icon: <Shield className="h-4 w-4" />, href: '/admin/manage' },
];

function EditPasswordModal({ onClose }: { onClose: () => void }) {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async () => {
    setErrorMsg('');
    if (!oldPassword || !newPassword || !confirmPassword) {
      setErrorMsg('Semua field wajib diisi.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('Password baru dan konfirmasi tidak sama.');
      return;
    }
    if (newPassword.length < 6) {
      setErrorMsg('Password baru minimal 6 karakter.');
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${BASE_URL}/api/admin/change-password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
      });
      const json = await res.json();
      if (res.ok) {
        setSuccessMsg('Password berhasil diubah!');
        setTimeout(() => onClose(), 1500);
      } else {
        setErrorMsg(json.message || 'Gagal mengubah password.');
      }
    } catch {
      setErrorMsg('Gagal menghubungi server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-card rounded-2xl border border-border p-6 w-full max-w-sm mx-4 shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold">Ubah Password</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 mb-5">
          <div>
            <Label className="text-sm font-semibold mb-1.5 block">Password Lama</Label>
            <div className="relative">
              <Input type={showOld ? 'text' : 'password'} value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="Masukkan password lama" className="h-10 pr-10" />
              <button type="button" onClick={() => setShowOld(!showOld)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {showOld ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div>
            <Label className="text-sm font-semibold mb-1.5 block">Password Baru</Label>
            <div className="relative">
              <Input type={showNew ? 'text' : 'password'} value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min. 8 karakter" className="h-10 pr-10" />
              <button type="button" onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div>
            <Label className="text-sm font-semibold mb-1.5 block">Konfirmasi Password Baru</Label>
            <div className="relative">
              <Input type={showConfirm ? 'text' : 'password'} value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ulangi password baru" className="h-10 pr-10" />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">{errorMsg}</div>
        )}
        {successMsg && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs">{successMsg}</div>
        )}

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={loading}>Batal</Button>
          <Button className="flex-1" onClick={handleSubmit} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Simpan
          </Button>
        </div>
      </div>
    </div>
  );
}

export function AdminSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const adminName = localStorage.getItem('userName') || 'Admin';
  const adminEmail = localStorage.getItem('userEmail') || 'admin@arahin.com';

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

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('role');
    navigate('/login');
  };

  return (
    <>
      <aside className="w-64 flex-shrink-0 border-r border-border bg-muted/30 flex flex-col h-screen sticky top-0">
        <div className="p-6 border-b border-border">
          <Link to="/" className="flex items-center gap-2 font-bold text-xl text-primary">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold text-sm">A</div>
            ARAHIN
          </Link>
          <div className="mt-2 text-xs text-muted-foreground font-semibold uppercase tracking-wider">Admin Panel</div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => {
            if (item.label === 'Manajemen Admin' && adminEmail !== 'arahin.support@gmail.com') return null;
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

        <div className="p-4 border-t border-border relative flex-shrink-0">
          
          {isAccountOpen && (
            <div className="absolute bottom-full left-4 right-4 mb-2 bg-card border border-border rounded-xl shadow-lg p-2 flex flex-col gap-1 animate-in fade-in slide-in-from-bottom-2 z-50">
              
              <button 
                onClick={toggleTheme}
                className="flex items-center gap-3 px-3 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors w-full"
              >
                {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                {isDarkMode ? 'Mode Terang' : 'Mode Gelap'}
              </button>

              <button
                onClick={() => { setIsAccountOpen(false); setShowEditPassword(true); }}
                className="flex items-center gap-3 px-3 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors w-full"
              >
                <KeyRound className="h-4 w-4" />
                Ubah Password
              </button>

              <div className="h-px bg-border my-1" />

              <button 
                onClick={handleLogout}
                className="flex items-center gap-3 px-3 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors w-full"
              >
                <LogOut className="h-4 w-4" />
                Keluar Panel
              </button>

            </div>
          )}

          <button
            onClick={() => setIsAccountOpen(!isAccountOpen)}
            className={`w-full flex items-center justify-between p-2 rounded-xl transition-colors hover:bg-muted/50 ${isAccountOpen ? 'bg-muted/50' : ''}`}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold shadow-sm">
                {adminName.slice(0, 2).toUpperCase()}
              </div>
              <div className="text-left">
                <div className="text-sm font-semibold capitalize">{adminName}</div>
                <div className="text-[10px] text-muted-foreground truncate max-w-[120px]">{adminEmail}</div>
              </div>
            </div>
            <ChevronUp className={`h-4 w-4 text-muted-foreground transition-transform ${isAccountOpen ? 'rotate-0' : 'rotate-180'}`} />
          </button>
        </div>
      </aside>

      {showEditPassword && <EditPasswordModal onClose={() => setShowEditPassword(false)} />}
    </>
  );
}