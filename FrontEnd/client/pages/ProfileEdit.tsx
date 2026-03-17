import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { ArrowLeft, CheckCircle } from 'lucide-react';

const userCategories = [
  { value: 'disability', label: 'Penyandang Disabilitas' },
  { value: 'elderly', label: 'Lansia (60+)' },
  { value: 'pregnant', label: 'Perempuan Hamil' },
  { value: 'vulnerable-illness', label: 'Situasi Rentan' },
  { value: 'children', label: 'Anak-Anak' },
  { value: 'women', label: 'Perempuan' },
  { value: 'general', label: 'Traveler Umum' },
];

export default function ProfileEdit() {
  const [fullName, setFullName] = useState('Budi Santoso');
  const [email, setEmail] = useState('budi.santoso@email.com');
  const [category, setCategory] = useState('disability');
  const [phone, setPhone] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = () => {
    // Simple validation
    if (!fullName.trim() || !email.trim() || !category) {
      alert('Mohon isi semua field yang diperlukan');
      return;
    }

    // Show success message
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

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

          {savedSuccess && (
            <div className="mb-6 p-4 rounded-lg bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800 flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                Profil berhasil diperbarui!
              </span>
            </div>
          )}

          <div className="rounded-2xl border border-border bg-card p-8 high-contrast:border-2 high-contrast:border-primary">
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
                  aria-required="true"
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
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Masukkan email"
                  className="h-12 text-base high-contrast:border-2 high-contrast:border-primary"
                  aria-required="true"
                />
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
                    aria-required="true"
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
                  Kategori ini membantu kami memberikan rekomendasi rute yang sesuai dengan kebutuhan Anda.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4 border-t border-border">
                <Link to="/profile" className="flex-1">
                  <Button 
                    variant="outline" 
                    className="w-full h-12 high-contrast:border-2 high-contrast:border-primary"
                  >
                    Batal
                  </Button>
                </Link>
                <Button 
                  onClick={handleSave}
                  className="flex-1 h-12"
                >
                  Simpan Perubahan
                </Button>
              </div>

            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
