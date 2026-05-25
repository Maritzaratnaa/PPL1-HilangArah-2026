import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle, Loader2, Eye, EyeOff } from 'lucide-react';

const BASE_URL = 'http://localhost:3000';

const userCategories = [
  { value: "disability", label: "Person with Disability" },
  { value: "elderly", label: "Elderly (60+)" },
  { value: "pregnant", label: "Pregnant Women" },
  { value: "vulnerable-illness", label: "Vulnerable Illness" },
  { value: "children", label: "Children" },
  { value: "women", label: "Women" },
  { value: "general", label: "General Traveler" },
];

export default function ProfileEdit() {
  // State untuk Data Profil
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState('');
  const [phone, setPhone] = useState('');
  
  // State untuk Data Password
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // State untuk Toggle Visibility Password
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status Loading & Notifikasi Profil
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Status Loading & Notifikasi Password
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordErrorMsg, setPasswordErrorMsg] = useState<string | null>(null);
  
  const navigate = useNavigate();

  // 1. AMBIL DATA SAAT HALAMAN DIBUKA
  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      try {
        const res = await fetch(`${BASE_URL}/api/profile`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        const json = await res.json();
        
        if (res.ok) {
          setFullName(json.data.full_name);
          setEmail(json.data.email);
          setPhone(json.data.phone_number || '');
          setCategory(json.data.category_status || '');
        } else {
          setErrorMsg(json.message);
        }
      } catch (err) {
        setErrorMsg('Gagal terhubung ke server.');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [navigate]);

  // 2. SIMPAN DATA PROFIL
  const handleSaveProfile = async () => {
    if (!fullName.trim() || !category) {
      setErrorMsg('Nama lengkap dan kategori wajib diisi!');
      return;
    }

    setIsSaving(true);
    setErrorMsg(null);
    const token = localStorage.getItem('token');

    try {
      const res = await fetch(`${BASE_URL}/api/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          full_name: fullName,
          phone_number: phone,
          category_status: category,
          font_size_pref: 'Medium'
        }),
      });

      const json = await res.json();

      if (res.ok) {
        localStorage.setItem('userName', fullName);
        localStorage.setItem('userCategory', category);

        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      } else {
        setErrorMsg(json.message || 'Gagal menyimpan profil.');
      }
    } catch (err) {
      setErrorMsg('Terjadi kesalahan jaringan.');
    } finally {
      setIsSaving(false);
    }
  };

  // 3. SIMPAN PERUBAHAN PASSWORD
  const handleSavePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      setPasswordErrorMsg('Semua kolom password wajib diisi!');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordErrorMsg('Password baru dan konfirmasi tidak cocok!');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordErrorMsg('Password baru minimal 6 karakter!');
      return;
    }

    setIsSavingPassword(true);
    setPasswordErrorMsg(null);
    const token = localStorage.getItem('token');

    try {
      const res = await fetch(`${BASE_URL}/api/profile/password`, { 
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          oldPassword,
          newPassword
        }),
      });

      const json = await res.json();

      if (res.ok) {
        setPasswordSuccess(true);
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setPasswordSuccess(false), 3000);
      } else {
        setPasswordErrorMsg(json.message || 'Gagal memperbarui password.');
      }
    } catch (err) {
      setPasswordErrorMsg('Terjadi kesalahan jaringan.');
    } finally {
      setIsSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-grow flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-grow px-4 py-12">
        <div className="mx-auto max-w-2xl">
          
          <div className="flex items-center gap-4 mb-8">
            <Link to="/profile">
              <Button variant="ghost" size="icon" className="h-11 w-11">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">Edit Profil</h1>
          </div>

          {/* ===================== SECTION 1: PROFIL ===================== */}
          {savedSuccess && (
            <div className="mb-6 p-4 rounded-lg bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800 flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                Profil berhasil diperbarui!
              </span>
            </div>
          )}

          {errorMsg && (
            <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 flex items-center gap-3">
              <span className="text-sm font-medium text-red-700">
                {errorMsg}
              </span>
            </div>
          )}

          <div className="rounded-2xl border border-border bg-card p-8 high-contrast:border-2 high-contrast:border-primary mb-8">
            <h2 className="text-xl font-bold mb-6">Informasi Dasar</h2>
            <div className="space-y-6">

              {/* Nama Lengkap */}
              <div>
                <Label htmlFor="fullName" className="text-base font-semibold mb-2 block">
                  Nama Lengkap
                </Label>
                <Input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Masukkan nama lengkap"
                  className="h-12 text-base high-contrast:border-2 high-contrast:border-primary"
                />
              </div>

              {/* Email */}
              <div>
                <Label htmlFor="email" className="text-base font-semibold mb-2 block">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  disabled
                  className="h-12 text-base bg-muted text-muted-foreground cursor-not-allowed"
                />
                <p className="text-xs text-muted-foreground mt-1">Email tidak dapat diubah.</p>
              </div>

              {/* Nomor Telepon */}
              <div>
                <Label htmlFor="phone" className="text-base font-semibold mb-2 block">
                  Nomor Telepon
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Masukkan nomor telepon"
                  className="h-12 text-base high-contrast:border-2 high-contrast:border-primary"
                />
              </div>

              {/* Kategori Pengguna */}
              <div>
                <Label htmlFor="category" className="text-base font-semibold mb-2 block">
                  Kategori Pengguna
                </Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger 
                    id="category"
                    className="h-12 text-base high-contrast:border-2 high-contrast:border-primary"
                  >
                    <SelectValue placeholder="Pilih kategori pengguna" />
                  </SelectTrigger>
                  <SelectContent>
                    {userCategories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground mt-2">
                  Kategori ini membantu kami memberikan rekomendasi rute yang sesuai.
                </p>
              </div>

              {/* Button Simpan Profil */}
              <div className="flex gap-4 pt-4 border-t border-border">
                <Button 
                  onClick={handleSaveProfile}
                  className="w-full h-12"
                  disabled={isSaving}
                >
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Simpan Profil
                </Button>
              </div>
            </div>
          </div>

          {/* ===================== SECTION 2: PASSWORD ===================== */}
          
          {passwordSuccess && (
            <div className="mb-6 p-4 rounded-lg bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800 flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                Password berhasil diperbarui!
              </span>
            </div>
          )}

          {passwordErrorMsg && (
            <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 flex items-center gap-3">
              <span className="text-sm font-medium text-red-700">
                {passwordErrorMsg}
              </span>
            </div>
          )}

          <div className="rounded-2xl border border-border bg-card p-8 high-contrast:border-2 high-contrast:border-primary mb-8">
            <h2 className="text-xl font-bold mb-6">Ubah Password</h2>
            <div className="space-y-6">

              {/* Password Lama */}
              <div>
                <Label htmlFor="oldPassword" className="text-base font-semibold mb-2 block">
                  Password Lama
                </Label>
                <div className="relative">
                  <Input
                    id="oldPassword"
                    type={showOldPassword ? "text" : "password"}
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="Masukkan password lama"
                    className="h-12 text-base pr-12 high-contrast:border-2 high-contrast:border-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPassword(!showOldPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
                  >
                    {showOldPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Password Baru */}
              <div>
                <Label htmlFor="newPassword" className="text-base font-semibold mb-2 block">
                  Password Baru
                </Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    className="h-12 text-base pr-12 high-contrast:border-2 high-contrast:border-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
                  >
                    {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Konfirmasi Password Baru */}
              <div>
                <Label htmlFor="confirmPassword" className="text-base font-semibold mb-2 block">
                  Konfirmasi Password Baru
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ulangi password baru"
                    className="h-12 text-base pr-12 high-contrast:border-2 high-contrast:border-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Button Simpan Password */}
              <div className="flex gap-4 pt-4 border-t border-border">
                <Button 
                  onClick={handleSavePassword}
                  className="w-full h-12 "
                  disabled={isSavingPassword}
                  variant="default"
                >
                  {isSavingPassword ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Ubah Password
                </Button>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}