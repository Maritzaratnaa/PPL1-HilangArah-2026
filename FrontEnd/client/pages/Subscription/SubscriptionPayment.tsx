import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { Check, ShoppingCart, Loader2, RefreshCcw } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner"; 

export default function SubscriptionPayment() {
  const navigate = useNavigate();
  const location = useLocation();

  const savedPaymentStr = localStorage.getItem("pendingPayment");
  const savedPayment = savedPaymentStr ? JSON.parse(savedPaymentStr) : null;
  const subsId = location.state?.subs_id || savedPayment?.subsId;
  const plan = location.state?.plan || savedPayment?.plan || 'monthly';
  const planAmount = location.state?.amount || savedPayment?.amount || 299000;
  const planLabel = location.state?.planLabel || savedPayment?.planLabel || 'Paket Bulanan';
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [snapToken, setSnapToken] = useState<string | null>(
    (savedPayment && savedPayment.subsId === subsId) ? savedPayment.snapToken : null
  );

  const customToastStyle = {
    className: "!bg-primary !text-primary-foreground border-none font-medium !text-[16px] !p-4",
  };

  useEffect(() => {
    if (!subsId) {
      toast.error("Sesi pembayaran tidak valid atau sudah kadaluarsa.", customToastStyle);
      navigate("/subscription/Form");
    }
  }, [subsId, navigate]);

  const showMidtransPopup = (currentToken: string, jwtToken: string) => {
    const apiUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_URL || "http://localhost:3000";

    (window as any).snap.pay(currentToken, {
      onSuccess: async function (result: any) {
        console.log("✅ Pembayaran Sukses!", result);
        toast.success("Pembayaran berhasil!", customToastStyle);
        localStorage.removeItem("pendingPayment");

        try {
          await fetch(`${apiUrl}/api/subscription/activate`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${jwtToken}`,
            },
            body: JSON.stringify({ subs_id: subsId }),
          });
        } catch (err) {
          console.error("Gagal update database:", err);
        }

        navigate("/subscription/Payment-Confirmation", {
          state: { subs_id: subsId },
        });
      },
      onPending: function (result: any) {
        console.log("⏳ Pembayaran Tertunda:", result);
        toast.info("Jangan lupa selesaikan pembayaran Anda. Anda bisa menekan tombol 'Lanjutkan' kapan saja.", customToastStyle);
        setIsProcessing(false);
      },
      onError: function (result: any) {
        console.log("❌ Pembayaran Error:", result);
        toast.error("Pembayaran gagal diproses!", customToastStyle);
        setIsProcessing(false);
      },
      onClose: function () {
        console.log("⚠️ Popup ditutup oleh user.");
        toast.warning("Anda menutup halaman Midtrans. Klik 'Lanjutkan / Cek Pembayaran' untuk membuka kembali.", customToastStyle);
        setIsProcessing(false);
      },
    });
  };

  const handlePaymentConfirm = async () => {
    setIsProcessing(true);
    const jwtToken = localStorage.getItem("token");

    if (!jwtToken) {
      toast.error("Sesi Anda telah habis. Silakan login kembali.", customToastStyle);
      navigate("/login");
      return;
    }

    if (snapToken) {
      console.log("💳 Membuka ulang tagihan yang tertunda...");
      showMidtransPopup(snapToken, jwtToken);
      return;
    }

    try {
      const apiUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_URL || "http://localhost:3000";

      const res = await fetch(`${apiUrl}/api/subscription/payment-token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwtToken}`,
        },
        body: JSON.stringify({
          subs_id: subsId,
          amount: planAmount,
        }),
      });

      const data = await res.json();

      if (res.ok && data.token) {
        localStorage.setItem("pendingPayment", JSON.stringify({
          subsId: subsId,
          plan: plan,
          amount: planAmount,
          planLabel: planLabel,
          snapToken: data.token
        }));

        setSnapToken(data.token);
        showMidtransPopup(data.token, jwtToken);
      } else {
        toast.error(data.message || "Gagal mendapatkan token pembayaran.", customToastStyle);
        setIsProcessing(false);
      }
    } catch (error) {
      console.error("Payment error:", error);
      toast.error("Terjadi kesalahan jaringan saat memproses pembayaran.", customToastStyle);
      setIsProcessing(false);
    }
  };

  if (!subsId) return null;

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground font-['Atkinson_Hyperlegible',_sans-serif]">
      <Navbar />

      <main className="flex-grow px-6 py-10 lg:px-10">
        <div className="mx-auto max-w-6xl">
          {/* STEPPER */}
          <div className="mb-12">
            <div className="flex items-center justify-between relative max-w-3xl mx-auto">
              <div className="absolute top-5 left-0 right-0 h-px bg-border z-0 mx-10 sm:mx-16" />

              {[
                { num: 1, label: "Isi Data", icon: "📋", active: false, completed: true },
                { num: 2, label: "Pembayaran", icon: "💳", active: true, completed: false },
                { num: 3, label: "Konfirmasi", icon: "✅", active: false, completed: false },
              ].map((step) => (
                <div key={step.num} className="relative z-10 flex flex-col items-center gap-2">
                  <div
                    className={`flex items-center justify-center h-10 w-10 rounded-full border-2 flex-shrink-0 ${
                      step.active
                        ? "bg-primary border-primary text-primary-foreground shadow-lg"
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
                  <div className="text-center">
                    <p className={`text-[10px] sm:text-xs font-bold leading-tight ${step.active ? "text-primary" : "text-muted-foreground"}`}>
                      {step.icon} {step.label}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="max-w-lg mx-auto">
            <Card className="bg-card border-border rounded-[var(--radius)] p-6 shadow-sm">
              <h3 className="text-[18px] font-bold mb-6 flex items-center gap-2 text-foreground">
                <ShoppingCart className="h-5 w-5" />
                Rincian Pembayaran
              </h3>

              <div className="bg-muted/30 rounded-lg p-4 mb-6 border border-border text-center">
                <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">ID Langganan</p>
                <p className="text-[14px] font-mono font-bold text-primary truncate">
                  {subsId.split("-")[0].toUpperCase()}
                </p>
              </div>

              <div className="bg-primary/5 rounded-lg p-3 mb-6 border border-primary/20 text-center">
                <p className="text-sm font-bold text-primary">{planLabel}</p>
              </div>

              <div className="space-y-3 mb-6 pb-6 border-b border-border">
                <div className="flex justify-between text-[16px]">
                  <span className="text-muted-foreground font-medium">{planLabel}</span>
                  <span className="font-bold text-foreground">Rp {planAmount.toLocaleString('id-ID')}</span>
                </div>
              </div>

              <div className="flex justify-between items-center mb-8">
                <span className="font-bold text-foreground text-[16px]">Total</span>
                <span className="text-[24px] font-bold text-primary">Rp {planAmount.toLocaleString('id-ID')}</span>
              </div>

              <Button
                onClick={handlePaymentConfirm}
                disabled={isProcessing}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-auto min-h-[56px] py-3 px-4 rounded-2xl font-bold text-[18px] transition-all active:scale-[0.98] mb-6"
              >
                {isProcessing ? (
                  <div className="flex items-center justify-center flex-wrap gap-2">
                    <Loader2 className="h-5 w-5 animate-spin shrink-0" />
                    <span className="text-center">Memproses...</span>
                  </div>
                ) : snapToken ? (
                  <div className="flex items-center justify-center flex-wrap gap-2 leading-tight">
                    <RefreshCcw className="h-5 w-5 shrink-0" />
                    <span className="text-center">Lanjutkan / Cek Pembayaran</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center flex-wrap gap-2 leading-tight">
                    <span className="text-center">Bayar dengan Midtrans</span>
                    <span className="shrink-0">→</span>
                  </div>
                )}
              </Button>

              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-center gap-2 text-[14px] font-medium text-muted-foreground">
                  <span className="text-lg">🔒</span>
                  <span>SSL Secured & Verified</span>
                </div>
              </div>

              <p className="text-[12px] text-muted-foreground text-center font-medium leading-relaxed">
                Dengan melakukan pembayaran, Anda menyetujui Syarat & Ketentuan ARAHIN
              </p>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}