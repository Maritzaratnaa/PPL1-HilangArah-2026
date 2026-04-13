import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useState, useEffect } from 'react';
import { Clock, Check, ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function SubscriptionPayment() {
  const navigate = useNavigate();
  const [selectedPayment, setSelectedPayment] = useState('gopay');
  const [timeRemaining, setTimeRemaining] = useState(23 * 60 + 45 * 60 + 30);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')} : ${minutes.toString().padStart(2, '0')} : ${secs.toString().padStart(2, '0')}`;
  };

  const handlePaymentConfirm = () => {
    localStorage.setItem('subscriptionStatus', 'active');
    localStorage.setItem('subscriptionStartDate', new Date().toISOString());
    navigate('/subscription-confirmation');
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground font-['Atkinson_Hyperlegible',_sans-serif]">
      <Navbar />

      <main className="flex-grow px-6 py-10 lg:px-10">
        <div className="mx-auto max-w-6xl">
          
          {/* STEPPER - Full Width sejajar kontainer max-w-6xl */}
          <div className="mb-16 relative">
            <div className="absolute top-6 left-0 w-full h-[1px] bg-border z-0" />
            
            <div className="relative z-10 flex justify-between items-start">
              {[
                { num: 1, label: 'Isi Data', icon: '📋', active: false, completed: true },
                { num: 2, label: 'Pembayaran', icon: '💳', active: true, completed: false },
                { num: 3, label: 'Konfirmasi', icon: '✅', active: false, completed: false },
              ].map((step, idx) => (
                <div 
                  key={step.num} 
                  className={`flex items-center gap-4 bg-background px-4 ${
                    idx === 0 ? 'pl-0' : idx === 2 ? 'pr-0' : ''
                  }`}
                >
                  <div
                    className={`flex items-center justify-center h-12 w-12 rounded-full font-bold text-lg flex-shrink-0 transition-all ${
                      step.active
                        ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20'
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

          {/* Deadline Banner - Menggunakan Variabel Tema */}
          <Card className="bg-amber-50 border-l-4 border-l-amber-400 rounded-[var(--radius)] p-6 mb-8 flex items-center gap-5 shadow-sm">
            <Clock className="h-8 w-8 text-amber-500 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-bold text-amber-900 text-[16px]">Selesaikan pembayaran sebelum:</p>
              <p className="font-bold text-[28px] text-primary mt-1 tracking-tight">{formatTime(timeRemaining)}</p>
              <p className="text-[14px] text-amber-800 mt-1 font-medium">Pesanan akan otomatis dibatalkan jika melewati batas waktu</p>
            </div>
          </Card>

          {/* Main Content Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2">
              <Card className="bg-card border-border rounded-[var(--radius)] p-8 shadow-sm">
                <h2 className="text-[22px] font-bold mb-8 text-foreground">Pilih Metode Pembayaran</h2>

                <div className="space-y-10">
                  {/* E-Wallet Group */}
                  <div>
                    <h3 className="text-[12px] font-bold text-muted-foreground uppercase tracking-widest mb-4">E-Wallet</h3>
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { id: 'gopay', name: 'GoPay', color: 'bg-green-100', borderColor: 'border-green-400' },
                        { id: 'ovo', name: 'OVO', color: 'bg-purple-100', borderColor: 'border-purple-400' },
                        { id: 'dana', name: 'DANA', color: 'bg-blue-100', borderColor: 'border-blue-400' },
                      ].map((wallet) => (
                        <button
                          key={wallet.id}
                          onClick={() => setSelectedPayment(wallet.id)}
                          className={`p-6 rounded-2xl border-2 transition-all text-center ${
                            selectedPayment === wallet.id
                              ? `${wallet.borderColor} ${wallet.color} ring-2 ring-primary`
                              : 'border-border hover:border-primary bg-background'
                          }`}
                        >
                          <div className="text-3xl mb-2">💳</div>
                          <p className="font-bold text-[16px] text-foreground">{wallet.name}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Transfer Bank Group */}
                  <div>
                    <h3 className="text-[12px] font-bold text-muted-foreground uppercase tracking-widest mb-4">Transfer Bank</h3>
                    <div className="space-y-3">
                      {['BCA Virtual Account', 'Mandiri Virtual Account', 'BNI Virtual Account'].map((bank) => (
                        <button
                          key={bank}
                          onClick={() => setSelectedPayment(bank.toLowerCase().split(' ')[0])}
                          className={`w-full p-5 rounded-xl border-2 transition-all flex items-center gap-3 text-left ${
                            selectedPayment === bank.toLowerCase().split(' ')[0]
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary bg-background'
                          }`}
                        >
                          <input type="radio" checked={selectedPayment === bank.toLowerCase().split(' ')[0]} readOnly className="h-5 w-5 accent-primary" />
                          <div>
                            <p className="font-bold text-[16px] text-foreground">{bank}</p>
                            <p className="text-[14px] text-muted-foreground font-medium">Virtual Account</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-muted/30 border border-border rounded-xl p-6 mt-8">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-lg">ℹ️</span>
                      <h3 className="font-bold text-foreground">Cara Pembayaran</h3>
                    </div>
                    <p className="text-[16px] text-muted-foreground font-medium">Ikuti instruksi pembayaran melalui aplikasi yang Anda pilih.</p>
                  </div>

                  <Button onClick={handlePaymentConfirm} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-14 rounded-2xl font-bold text-[18px] mt-8 transition-all active:scale-[0.98]">
                    Konfirmasi Pembayaran →
                  </Button>
                </div>
              </Card>
            </div>

            {/* Right Column - Order Summary (SAMA PERSIS DENGAN KONTEN ASLI ANDA) */}
            <div className="lg:col-span-1">
              <Card className="bg-card border-border rounded-[var(--radius)] p-6 sticky top-24 shadow-sm">
                <h3 className="text-[18px] font-bold mb-6 flex items-center gap-2 text-foreground">
                  <ShoppingCart className="h-5 w-5" />
                  Rincian Pembayaran
                </h3>

                {/* Customer Info */}
                <div className="bg-muted/30 rounded-lg p-4 mb-6 border border-border">
                  <p className="text-[16px]">
                    <span className="font-bold text-foreground">Budi Santoso</span>
                    <span className="text-muted-foreground ml-2">budi@email.com</span>
                  </p>
                </div>

                {/* Price Breakdown */}
                <div className="space-y-3 mb-6 pb-6 border-b border-border">
                  <div className="flex justify-between text-[16px]">
                    <span className="text-muted-foreground font-medium">Paket Berlangganan Bulanan</span>
                    <span className="font-bold text-foreground">Rp 299.000</span>
                  </div>
                  <div className="flex justify-between text-[16px]">
                    <span className="text-muted-foreground font-medium">Biaya Administrasi</span>
                    <span className="font-bold text-foreground">Rp 10.000</span>
                  </div>
                  <div className="flex justify-between text-[16px]">
                    <span className="text-muted-foreground font-medium">Diskon Pengguna Baru</span>
                    <span className="font-bold text-green-600">- Rp 30.900</span>
                  </div>
                </div>

                {/* Total */}
                <div className="flex justify-between items-center mb-6 pb-6 border-b border-border">
                  <span className="font-bold text-foreground text-[16px]">Total Pembayaran</span>
                  <span className="text-[24px] font-bold text-primary">Rp 278.100</span>
                </div>

                {/* Subscription Period */}
                <div className="space-y-3 mb-6 pb-6 border-b border-border">
                  <div>
                    <p className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider">Periode Aktif</p>
                    <p className="font-bold text-foreground text-[16px]">1 Bulan</p>
                  </div>
                  <div>
                    <p className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider">Berlaku Hingga</p>
                    <p className="font-bold text-foreground text-[16px]">{new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('id-ID')}</p>
                  </div>
                </div>

                {/* Security Badges */}
                <div className="space-y-2 mb-6">
                  <div className="flex items-center gap-2 text-[14px] font-medium text-muted-foreground">
                    <span className="text-lg">🔒</span>
                    <span>SSL Secured</span>
                  </div>
                  <div className="flex items-center gap-2 text-[14px] font-medium text-muted-foreground">
                    <span className="text-lg">✓</span>
                    <span>Verified</span>
                  </div>
                  <div className="flex items-center gap-2 text-[14px] font-medium text-muted-foreground">
                    <span className="text-lg">🛡️</span>
                    <span>Protected</span>
                  </div>
                </div>

                {/* Terms */}
                <p className="text-[12px] text-muted-foreground text-center font-medium leading-relaxed">
                  Dengan melakukan pembayaran, Anda menyetujui{' '}
                  <a href="#" className="text-primary font-bold hover:underline underline-offset-4">
                    Syarat & Ketentuan
                  </a>{' '}
                  ARAHIN
                </p>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}