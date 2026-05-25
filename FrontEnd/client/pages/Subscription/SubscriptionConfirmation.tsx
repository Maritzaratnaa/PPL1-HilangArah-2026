import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Check, Calendar, CreditCard, ArrowRight, PartyPopper } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';

export default function SubscriptionConfirmation() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Menangkap subs_id yang dikirim dari halaman pembayaran
  const subsId = location.state?.subs_id;

  const planLabel = location.state?.planLabel 
  || localStorage.getItem('activePlanLabel') 
  || 'Paket Bulanan';

  // Memastikan halaman selalu termuat dari posisi paling atas
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Data tanggal hari ini untuk bukti aktivasi
  const today = new Date().toLocaleDateString('id-ID', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground font-['Atkinson_Hyperlegible',_sans-serif]">
      <Navbar />

      <main className="flex-grow px-6 py-10 lg:px-10">
        <div className="mx-auto max-w-6xl">
          
          {/* STEPPER - Responsif (Format sama dengan Form & Payment) */}
          <div className="mb-12">
            <div className="flex items-center justify-between relative max-w-3xl mx-auto">
              <div className="absolute top-5 left-0 right-0 h-px bg-border z-0 mx-10 sm:mx-16" />

              {[
                { num: 1, label: "Isi Data", icon: "📋", active: false, completed: true },
                { num: 2, label: "Pembayaran", icon: "💳", active: false, completed: true },
                { num: 3, label: "Konfirmasi", icon: "✅", active: true, completed: false },
              ].map((step) => (
                <div key={step.num} className="relative z-10 flex flex-col items-center gap-2">
                  <div
                    className={`flex items-center justify-center h-10 w-10 rounded-full border-2 flex-shrink-0 transition-all duration-300 ${
                      step.active
                        ? "bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20"
                        : step.completed
                          ? "bg-green-600 border-green-600 text-white"
                          : "bg-card border-border text-muted-foreground"
                    }`}
                  >
                    {step.completed ? (
                      <Check className="h-4 w-4" strokeWidth={3} />
                    ) : (
                      <span className="font-bold text-sm">{step.num}</span>
                    )}
                  </div>
                  <div className="text-center mt-1">
                    {/* Tambahan whitespace-nowrap agar teks tidak turun ke bawah di HP */}
                    <p className={`text-[10px] sm:text-xs font-bold leading-tight whitespace-nowrap ${
                      step.active || step.completed ? "text-primary" : "text-muted-foreground"
                    }`}>
                      {step.icon} {step.label}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* KONTEN KONFIRMASI */}
          <div className="max-w-3xl mx-auto text-center">
            <Card className="bg-card border-border rounded-[var(--radius)] p-10 lg:p-16 shadow-sm relative overflow-hidden">
              {/* Elemen Dekoratif */}
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/5 rounded-full" />
              
              <div className="relative z-10">
                {/* Icon Sukses */}
                <div className="inline-flex items-center justify-center h-24 w-24 rounded-full bg-green-100 text-green-600 mb-8 animate-bounce">
                  <Check size={48} strokeWidth={3} />
                </div>

                <h1 className="text-[32px] font-bold text-foreground leading-tight mb-4 tracking-tight">
                  Pembayaran Berhasil!
                </h1>
                <p className="text-muted-foreground text-[18px] font-medium mb-12 leading-relaxed">
                  Selamat! Paket langganan Anda telah aktif. Sekarang Anda dapat menikmati pendampingan pemandu pribadi untuk setiap perjalanan Anda.
                </p>

                {/* Ringkasan Transaksi */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left mb-12">
                  <div className="p-5 bg-muted/30 rounded-2xl border border-border flex items-center gap-4">
                    <div className="p-2 bg-background rounded-lg text-primary shadow-sm"><Calendar size={20} /></div>
                    <div>
                      <p className="text-[12px] font-bold text-muted-foreground uppercase tracking-widest">Tanggal Aktivasi</p>
                      <p className="font-bold text-foreground text-[16px]">{today}</p>
                    </div>
                  </div>
                  <div className="p-5 bg-muted/30 rounded-2xl border border-border flex items-center gap-4">
                    <div className="p-2 bg-background rounded-lg text-primary shadow-sm"><CreditCard size={20} /></div>
                    <div>
                      <p className="text-[12px] font-bold text-muted-foreground uppercase tracking-widest">Status Pembayaran</p>
                      <p className="font-bold text-green-600 text-[16px]">LUNAS</p>
                    </div>
                  </div>
                </div>

                {/* Detail Paket */}
                <div className="bg-muted/30 border border-border rounded-2xl p-6 mb-12 text-left">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <span className="font-bold text-foreground text-[18px] block">{planLabel}</span>
                      {subsId && (
                        <span className="text-xs text-muted-foreground font-mono mt-1 block">ID: {subsId.split('-')[0].toUpperCase()}</span>
                      )}
                    </div>
                    <span className="p-2 bg-green-100 text-green-700 rounded-lg text-[12px] font-bold uppercase tracking-wider">Aktif</span>
                  </div>
                  <ul className="space-y-3 text-[16px] text-muted-foreground font-medium">
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      Akses ke pemandu tersertifikasi
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      Perencanaan rute aksesibel prioritas
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      Dukungan darurat 24/7 terintegrasi
                    </li>
                  </ul>
                </div>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button 
                    onClick={() => navigate('/')} 
                    className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 h-14 rounded-2xl font-bold text-[18px]"
                  >
                    Kembali ke Beranda <ArrowRight size={20} className="ml-2" />
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => navigate('/subscription/Profile')}
                    className="flex-1 border-border text-foreground hover:bg-muted/50 h-14 rounded-2xl font-bold text-[18px]"
                  >
                    Lihat Detail Profil
                  </Button>
                </div>
              </div>
            </Card>

            <p className="mt-8 text-[14px] text-muted-foreground font-medium flex items-center justify-center gap-2 text-center">
              <PartyPopper size={16} className="text-primary shrink-0" />
              Satu langkah lebih dekat menuju perjalanan yang inklusif bersama ARAHIN.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}