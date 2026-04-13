import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Check, Calendar, CreditCard, ArrowRight, PartyPopper } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function SubscriptionConfirmation() {
  const navigate = useNavigate();
  
  // Data simulasi (bisa diambil dari localStorage jika diperlukan)
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
          
          {/* STEPPER - Full Width (Langkah 1 & 2 Selesai, Langkah 3 Aktif) */}
          <div className="mb-16 relative">
            <div className="absolute top-6 left-0 w-full h-[1px] bg-border z-0" />
            
            <div className="relative z-10 flex justify-between items-start">
              {[
                { num: 1, label: 'Isi Data', icon: '📋', active: false, completed: true },
                { num: 2, label: 'Pembayaran', icon: '💳', active: false, completed: true },
                { num: 3, label: 'Konfirmasi', icon: '✅', active: true, completed: false },
              ].map((step, idx) => (
                <div 
                  key={step.num} 
                  className={`flex items-center gap-4 bg-background px-4 ${
                    idx === 0 ? 'pl-0' : idx === 2 ? 'pr-0' : ''
                  }`}
                >
                  <div
                    className={`flex items-center justify-center h-12 w-12 rounded-full border-2 transition-all duration-300 flex-shrink-0 ${
                      step.active
                        ? 'bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20'
                        : step.completed
                        ? 'bg-green-600 border-green-600 text-white'
                        : 'bg-card border-border text-muted-foreground'
                    }`}
                  >
                    {step.completed ? <Check className="h-6 w-6" strokeWidth={3} /> : <span className="font-bold text-[18px]">{step.num}</span>}
                  </div>

                  <div className="flex flex-col">
                    <p className={`text-[12px] uppercase font-bold tracking-wider ${step.active || step.completed ? 'text-primary' : 'text-muted-foreground'}`}>
                      Langkah {step.num}
                    </p>
                    <p className={`text-[16px] font-bold leading-tight ${step.active || step.completed ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {step.icon} {step.label}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* KONTIEN KONFIRMASI */}
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
                      <p className="text-[12px] font-bold text-muted-foreground uppercase tracking-widest">Metode Pembayaran</p>
                      <p className="font-bold text-foreground text-[16px]">E-Wallet (GoPay)</p>
                    </div>
                  </div>
                </div>

                {/* Detail Paket */}
                <div className="bg-muted/30 border border-border rounded-2xl p-6 mb-12 text-left">
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-bold text-foreground text-[18px]">Paket Bulanan (Premium)</span>
                    <span className="p-2 bg-green-100 text-green-700 rounded-lg text-[12px] font-bold uppercase tracking-wider">Aktif</span>
                  </div>
                  <ul className="space-y-3 text-[16px] text-muted-foreground font-medium">
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      Akses tak terbatas ke pemandu tersertifikasi
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
                    onClick={() => navigate('/home')} 
                    className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 h-14 rounded-2xl font-bold text-[18px]"
                  >
                    Mulai Cari Rute <ArrowRight size={20} className="ml-2" />
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => navigate('/subscription-profile')}
                    className="flex-1 border-border text-foreground hover:bg-muted/50 h-14 rounded-2xl font-bold text-[18px]"
                  >
                    Lihat Detail Profil
                  </Button>
                </div>
              </div>
            </Card>

            <p className="mt-8 text-[14px] text-muted-foreground font-medium flex items-center justify-center gap-2">
              <PartyPopper size={16} className="text-primary" />
              Satu langkah lebih dekat menuju perjalanan yang inklusif bersama ARAHIN.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}