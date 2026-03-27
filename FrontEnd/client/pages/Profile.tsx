import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import { useRef, useState, useEffect } from 'react';
import { Pencil, Mail, Shield, User, Camera, Phone, ArrowLeft } from 'lucide-react';

const BASE_URL = 'http://localhost:3000';

const allStatuses = [
  { label: 'Disabilitas', icon: '♿', color: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-800' },
  { label: 'Lansia', icon: '👴', color: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800' },
  { label: 'Ibu Hamil', icon: '🤰', color: 'bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-950/30 dark:text-pink-300 dark:border-pink-800' },
  { label: 'Penyakit Rentan', icon: '🛡️', color: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-800' },
  { label: 'Anak', icon: '👦', color: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-300 dark:border-purple-800' },
  { label: 'Perempuan', icon: '👩', color: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800' },
];

interface UserProfile {
  email: string;
  full_name: string;
  phone_number: string;
  category_status: string;
  font_size_pref: string;
}

export default function Profile() {
  const [avatar, setAvatar] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      try {
        const res = await fetch(`${BASE_URL}/api/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (res.status === 401) {
          navigate('/login');
          return;
        }
        const json = await res.json();
        if (res.ok) {
          setProfile(json.data);
        } else {
          setError(json.message);
        }
      } catch (err) {
        setError('Gagal menghubungi server.');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [navigate]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setAvatar(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-muted-foreground text-sm">Memuat profil...</div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-destructive text-sm">{error}</div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-grow px-4 py-12">
        <div className="mx-auto max-w-2xl">

          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Link to="/home">
                <Button variant="ghost" size="icon" className="h-11 w-11">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <h1 className="text-2xl font-bold">Profil Saya</h1>
            </div>
            <Link to="/profile/edit">
              <Button variant="outline" className="gap-2 high-contrast:border-2 high-contrast:border-primary">
                <Pencil className="h-4 w-4" />
                Edit Profil
              </Button>
            </Link>
          </div>

          <div className="rounded-2xl border border-border bg-card overflow-hidden mb-5
            high-contrast:border-2 high-contrast:border-primary">
            <div className="h-24 w-full"
              style={{ background: 'linear-gradient(135deg, hsl(186 100% 27%) 0%, hsl(186 100% 18%) 100%)' }} />

            <div className="px-6 pb-6">
              <div className="-mt-10 mb-4">
                <div className="relative w-20 h-20">
                  <div className="w-20 h-20 rounded-full border-4 border-background
                    bg-primary flex items-center justify-center
                    text-white text-2xl font-bold shadow-md overflow-hidden">
                    {avatar
                      ? <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                      : initials
                    }
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 w-7 h-7 rounded-full
                      bg-primary border-2 border-background
                      flex items-center justify-center
                      hover:opacity-90 transition-opacity shadow-sm"
                    aria-label="Ganti foto profil">
                    <Camera className="h-3.5 w-3.5 text-white" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                </div>
              </div>

              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold mb-1">{profile?.full_name}</h2>
                  <p className="text-sm text-muted-foreground">{profile?.email}</p>
                </div>
                <div className="px-3 py-1 rounded-full text-xs font-semibold
                  bg-emerald-100 text-emerald-700 border border-emerald-200
                  dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800">
                  ⭐ Subscriber Aktif
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 mb-5
            high-contrast:border-2 high-contrast:border-primary">
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
              <User className="h-4 w-4" />
              Informasi Akun
            </h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3 py-3 border-b border-border">
                <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                  <User className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-0.5">Nama Lengkap</div>
                  <div className="text-sm font-semibold">{profile?.full_name}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 py-3 border-b border-border">
                <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-0.5">Email</div>
                  <div className="text-sm font-semibold">{profile?.email}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 py-3">
                <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-0.5">Nomor Telepon</div>
                  <div className="text-sm font-semibold">{profile?.phone_number || '-'}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6
            high-contrast:border-2 high-contrast:border-primary">
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Status Pengguna
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Status ini menentukan rekomendasi rute dan fitur aksesibilitas yang kamu dapatkan.
            </p>
            <div className="flex flex-wrap gap-2">
              {allStatuses.map((s) => {
                const isActive = profile?.category_status === s.label;
                return (
                  <div key={s.label}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border transition-all
                      ${isActive
                        ? s.color
                        : 'bg-muted/50 text-muted-foreground border-border opacity-40'
                      }`}>
                    <span>{s.icon}</span>
                    {s.label}
                    {isActive && <span className="w-1.5 h-1.5 rounded-full bg-current ml-1" />}
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              Untuk mengubah status, klik tombol <strong>Edit Profil</strong> di atas.
            </p>
          </div>

        </div>
      </main>
    </div>
  );
}