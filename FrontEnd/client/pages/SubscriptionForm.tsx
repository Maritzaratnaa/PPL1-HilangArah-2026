import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/card';
import { useState } from 'react';
import { User, AlertCircle, ShieldCheck, ArrowRight, Heart, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function SubscriptionForm() {
  const navigate = useNavigate();
  
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('');
  const [domicile, setDomicile] = useState('');
  const [specificNeeds, setSpecificNeeds] = useState('');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');
  const [termsAgreed, setTermsAgreed] = useState(false);
  
  // STATE BARU: Untuk menampilkan efek loading saat tombol diklik
  const [isSubmitting, setIsSubmitting] = useState(false);

  // FUNGSI INTEGRASI API DIUPDATE
  const handleProceedToPayment = async () => {
    // 1. Validasi Frontend
    if (!fullName || !phone || !gender || !domicile || !emergencyContactName || !emergencyContactPhone) {
      alert('Mohon isi semua field yang wajib (*)');
      return;
    }
    if (!termsAgreed) {
      alert('Anda harus menyetujui syarat dan ketentuan');
      return;
    }

    // 2. Ambil Token JWT
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Sesi Anda telah habis atau Anda belum login. Silakan login kembali.");
      navigate("/login");
      return;
    }

    setIsSubmitting(true);

    try {
      // 3. Tembak API Backend
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
      const res = await fetch(`${apiUrl}/api/subscription`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          // Pastikan nama key sesuai dengan yang ditangkap req.body di backend!
          phone_number: phone,
          emergency_contact_name: emergencyContactName,
          emergency_contact_phone: emergencyContactPhone,
          domicile: domicile,
          specific_needs: specificNeeds
        })
      });

      const data = await res.json();

      if (res.ok) {
        // 4. Jika sukses (201), lempar subs_id ke halaman Payment
        navigate('/subscription/Payment', { 
          state: { subs_id: data.subs_id } 
        });
      } else {
        // 5. Jika gagal (misal: 400 karena sudah punya langganan aktif)
        alert(data.message);
        // Opsi tambahan: Jika error-nya karena sudah punya, langsung lempar ke profil
        if (data.message.includes('sudah memiliki langganan')) {
          navigate('/subscription/Profile');
        }
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      alert("Terjadi kesalahan pada server. Silakan coba lagi nanti.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground font-['Atkinson_Hyperlegible',_sans-serif]">
      <Navbar />

      <main className="flex-grow px-6 py-10 lg:px-10">
        <div className="mx-auto max-w-6xl">
          
          {/* STEPPER */}
          <div className="mb-16 relative">
            <div className="absolute top-6 left-0 w-full h-[1px] bg-border z-0" />
            
            <div className="relative z-10 flex justify-between items-start">
              {[
                { num: 1, label: 'Isi Data', icon: '📋', active: true },
                { num: 2, label: 'Pembayaran', icon: '💳', active: false },
                { num: 3, label: 'Konfirmasi', icon: '✅', active: false },
              ].map((step, idx) => (
                <div 
                  key={step.num} 
                  className={`flex items-center gap-4 bg-background px-4 ${
                    idx === 0 ? 'pl-0' : idx === 2 ? 'pr-0' : ''
                  }`}
                >
                  <div className={`flex items-center justify-center h-12 w-12 rounded-full border-2 flex-shrink-0 transition-all duration-300 ${
                    step.active 
                      ? 'bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20' 
                      : 'bg-card border-border text-muted-foreground'
                  }`}>
                    <span className="font-bold text-[18px]">{step.num}</span>
                  </div>
                  
                  <div className="flex flex-col">
                    <p className={`text-[12px] uppercase tracking-wider font-bold ${step.active ? 'text-primary' : 'text-muted-foreground'}`}>
                      Langkah {step.num}
                    </p>
                    <p className={`text-[16px] font-bold leading-tight ${step.active ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {step.icon} {step.label}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-10">
            <h1 className="text-[32px] font-bold text-foreground leading-tight mb-2 tracking-tight">Lengkapi Profil Anda</h1>
            <p className="text-muted-foreground text-[16px] font-medium">Informasi ini membantu kami mencocokkan Anda dengan pemandu yang paling kompeten.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            <div className="lg:col-span-8">
              <Card className="bg-card border-border rounded-[var(--radius)] p-8 lg:p-10 shadow-sm">
                <div className="space-y-10">
                  <section>
                    <div className="flex items-center gap-4 mb-8">
                      <div className="p-2.5 bg-accent/10 rounded-xl text-primary"><User size={24} /></div>
                      <h2 className="text-[20px] font-bold text-foreground">Informasi Pribadi</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="font-bold text-foreground text-[16px]">Nama Lengkap *</Label>
                        <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Contoh: Budi Santoso" className="h-12 border-input rounded-xl font-medium text-[16px]" disabled={isSubmitting} />
                      </div>
                      <div className="space-y-2">
                        <Label className="font-bold text-foreground text-[16px]">Nomor Telepon *</Label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold border-r pr-3 text-[16px]">+62</span>
                          <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="812xxxxxx" className="h-12 pl-16 border-input rounded-xl font-medium text-[16px]" disabled={isSubmitting} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="font-bold text-foreground text-[16px]">Jenis Kelamin *</Label>
                        <Select value={gender} onValueChange={setGender} disabled={isSubmitting}>
                          <SelectTrigger className="h-12 border-input rounded-xl font-medium text-[16px]">
                            <SelectValue placeholder="Pilih jenis kelamin" />
                          </SelectTrigger>
                          <SelectContent><SelectItem value="laki-laki">Laki-laki</SelectItem><SelectItem value="perempuan">Perempuan</SelectItem></SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="font-bold text-foreground text-[16px]">Domisili *</Label>
                        <Input value={domicile} onChange={(e) => setDomicile(e.target.value)} placeholder="Contoh: Jakarta Pusat" className="h-12 border-input rounded-xl font-medium text-[16px]" disabled={isSubmitting} />
                      </div>
                    </div>
                  </section>

                  <hr className="border-border" />

                  <section>
                    <div className="flex items-center gap-4 mb-6">
                      <div className="p-2.5 bg-accent/10 rounded-xl text-primary"><AlertCircle size={24} /></div>
                      <h2 className="text-[20px] font-bold text-foreground">Detail Kebutuhan</h2>
                    </div>
                    <Textarea value={specificNeeds} onChange={(e) => setSpecificNeeds(e.target.value)} placeholder="Ceritakan bantuan khusus yang Anda perlukan..." className="min-h-[120px] border-input rounded-xl p-4 font-medium text-[16px]" disabled={isSubmitting} />
                  </section>

                  <hr className="border-border" />

                  <section>
                    <div className="flex items-center gap-4 mb-8">
                      <div className="p-2.5 bg-accent/10 rounded-xl text-primary"><Heart size={24} /></div>
                      <h2 className="text-[20px] font-bold text-foreground">Kontak Darurat</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="font-bold text-foreground text-[16px]">Nama Kontak Darurat *</Label>
                        <Input value={emergencyContactName} onChange={(e) => setEmergencyContactName(e.target.value)} placeholder="Nama keluarga" className="h-12 border-input rounded-xl font-medium text-[16px]" disabled={isSubmitting} />
                      </div>
                      <div className="space-y-2">
                        <Label className="font-bold text-foreground text-[16px]">Nomor Telepon Darurat *</Label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold border-r pr-3 text-[16px]">+62</span>
                          <Input value={emergencyContactPhone} onChange={(e) => setEmergencyContactPhone(e.target.value)} placeholder="812xxxxxx" className="h-12 pl-16 border-input rounded-xl font-medium text-[16px]" disabled={isSubmitting} />
                        </div>
                      </div>
                    </div>
                  </section>

                  <div className="space-y-6 pt-4">
                    <div className="flex items-start gap-4 bg-muted/30 p-6 rounded-2xl border border-border">
                      <Checkbox id="terms" checked={termsAgreed} onCheckedChange={(c) => setTermsAgreed(c as boolean)} className="mt-1" disabled={isSubmitting} />
                      <Label htmlFor="terms" className="font-medium text-muted-foreground text-[16px] cursor-pointer">
                        Saya menyetujui <span className="text-primary font-bold underline underline-offset-4">Syarat & Ketentuan</span> serta <span className="text-primary font-bold underline underline-offset-4">Kebijakan Privasi</span> ARAHIN.
                      </Label>
                    </div>
                    
                    {/* TOMBOL KONFIRMASI DIUPDATE */}
                    <Button 
                      onClick={handleProceedToPayment} 
                      disabled={isSubmitting}
                      className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-14 rounded-2xl font-bold text-[18px]"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Memproses Data...
                        </>
                      ) : (
                        <>Konfirmasi & Lanjut ke Pembayaran <ArrowRight size={20} className="ml-2" /></>
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            </div>

            <div className="lg:col-span-4 lg:sticky lg:top-10">
              <Card className="bg-card border-border rounded-[var(--radius)] p-7 shadow-sm flex flex-col">
                <h3 className="text-[18px] font-bold text-foreground mb-6">Ringkasan Langganan</h3>
                <div className="flex items-center gap-4 mb-8 p-5 bg-muted/30 rounded-2xl border border-border">
                  <div className="w-14 h-14 bg-background rounded-xl shadow-sm flex items-center justify-center text-[24px]">🧭</div>
                  <div>
                    <p className="text-[12px] font-bold text-primary uppercase tracking-wider">Paket Bulanan</p>
                    <p className="font-bold text-foreground text-[16px]">Akses Pemandu Pribadi</p>
                  </div>
                </div>
                <div className="space-y-4 mb-8">
                  <div className="flex justify-between items-center text-muted-foreground font-medium text-[16px]">
                    <span>Harga Paket</span>
                    <span className="font-bold text-foreground">Rp 299.000</span>
                  </div>
                  <div className="flex justify-between items-center text-muted-foreground font-medium text-[16px]">
                    <span>Durasi</span>
                    <span className="font-bold text-foreground">1 Bulan</span>
                  </div>
                  <div className="pt-4 border-t border-dashed border-border flex justify-between items-center">
                    <span className="font-bold text-foreground text-[16px]">Total Tagihan</span>
                    <span className="text-[22px] font-bold text-primary">Rp 299.000</span>
                  </div>
                </div>
                <div className="space-y-3.5 pt-6 border-t border-border">
                  {['1 Pemandu Terverifikasi', 'Perjalanan Tak Terbatas', 'Support Prioritas 24/7'].map((b, i) => (
                    <div key={i} className="flex items-center gap-3 text-[14px] font-bold text-muted-foreground">
                      <ShieldCheck size={18} className="text-primary" />
                      {b}
                    </div>
                  ))}
                </div>
              </Card>
            </div>

          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}