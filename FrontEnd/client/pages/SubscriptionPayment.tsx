import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { Check, ShoppingCart, Loader2 } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

export default function SubscriptionPayment() {
  const navigate = useNavigate();
  const location = useLocation();

  // Tangkap subs_id dari state
  const subsId = location.state?.subs_id;

  const [isProcessing, setIsProcessing] = useState(false); // State untuk efek loading

  useEffect(() => {
    // Jika tidak ada subsId (user iseng ngetik URL manual), tendang balik ke form
    if (!subsId) {
      alert("Sesi pembayaran tidak valid atau sudah kadaluarsa.");
      navigate("/subscription/Form");
    }
  }, [subsId, navigate]);

  // --- FUNGSI PEMBAYARAN MIDTRANS ---
  const handlePaymentConfirm = async () => {
    setIsProcessing(true);
    const token = localStorage.getItem("token");

    // 🛑 DEBUG 1: Cek apakah Token JWT (Login) berhasil diambil
    console.log("🔑 [DEBUG 1] Token JWT User:", token);

    if (!token) {
      alert("Sesi Anda telah habis. Silakan login kembali.");
      navigate("/login");
      return;
    }

    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";

      // Tembak API backend untuk meminta Token Transaksi Midtrans
      const res = await fetch(`${apiUrl}/api/subscription/payment-token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          subs_id: subsId,
          amount: 278100,
        }),
      });

      const data = await res.json();

      // 🛑 DEBUG 2: Cek apa balasan dari Backend
      console.log("📦 [DEBUG 2] Balasan dari Backend:", data);

      if (res.ok && data.token) {
        // 🛑 DEBUG 3: Cek Token Snap Midtrans
        console.log("💳 [DEBUG 3] Token Midtrans Berhasil Didapat:", data.token);

        // Panggil popup Midtrans Snap
        (window as any).snap.pay(data.token, {
          onSuccess: async function (result: any) {
            // 🛑 DEBUG 4: Cek hasil sukses dari Midtrans
            console.log("✅ [DEBUG 4] Pembayaran Sukses! Data dari Midtrans:", result);

            try {
              await fetch(`${apiUrl}/api/subscription/activate`, {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
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
            console.log("⏳ [DEBUG] Pembayaran Tertunda:", result);
            alert("Menunggu pembayaran Anda diselesaikan!");
            navigate("/subscription/Profile");
          },
          onError: function (result: any) {
            console.log("❌ [DEBUG] Pembayaran Error:", result);
            alert("Pembayaran gagal diproses!");
            setIsProcessing(false);
          },
          onClose: function () {
            console.log("⚠️ [DEBUG] Popup ditutup oleh user.");
            alert("Anda menutup popup tanpa menyelesaikan pembayaran.");
            setIsProcessing(false);
          },
        });
      } else {
        alert(data.message || "Gagal mendapatkan token pembayaran.");
        setIsProcessing(false);
      }
    } catch (error) {
      console.error("Payment error:", error);
      alert("Terjadi kesalahan jaringan saat memproses pembayaran.");
      setIsProcessing(false);
    }
  };

  // Jika subsId tidak ada (sedang proses redirect), render kosong agar tidak error
  if (!subsId) return null;

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground font-['Atkinson_Hyperlegible',_sans-serif]">
      <Navbar />

      <main className="flex-grow px-6 py-10 lg:px-10">
        <div className="mx-auto max-w-6xl">
          {/* STEPPER */}
          <div className="mb-12">
            <div className="flex items-center justify-between relative max-w-3xl mx-auto">
              {/* Garis penghubung */}
              <div className="absolute top-5 left-0 right-0 h-px bg-border z-0 mx-10 sm:mx-16" />

              {[
                {
                  num: 1,
                  label: "Isi Data",
                  icon: "📋",
                  active: false,
                  completed: true,
                },
                {
                  num: 2,
                  label: "Pembayaran",
                  icon: "💳",
                  active: true,
                  completed: false,
                },
                {
                  num: 3,
                  label: "Konfirmasi",
                  icon: "✅",
                  active: false,
                  completed: false,
                },
              ].map((step) => (
                <div
                  key={step.num}
                  className="relative z-10 flex flex-col items-center gap-2"
                >
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
                    <p
                      className={`text-[10px] sm:text-xs font-bold leading-tight ${step.active ? "text-primary" : "text-muted-foreground"}`}
                    >
                      {step.icon} {step.label}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Main Content Layout - Centered Order Summary */}
          <div className="max-w-lg mx-auto">
            <Card className="bg-card border-border rounded-[var(--radius)] p-6 shadow-sm">
              <h3 className="text-[18px] font-bold mb-6 flex items-center gap-2 text-foreground">
                <ShoppingCart className="h-5 w-5" />
                Rincian Pembayaran
              </h3>

              {/* ID Referensi Langganan */}
              <div className="bg-muted/30 rounded-lg p-4 mb-6 border border-border text-center">
                <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">
                  ID Langganan
                </p>
                <p className="text-[14px] font-mono font-bold text-primary truncate">
                  {subsId.split("-")[0].toUpperCase()}
                </p>
              </div>

              {/* Price Breakdown */}
              <div className="space-y-3 mb-6 pb-6 border-b border-border">
                <div className="flex justify-between text-[16px]">
                  <span className="text-muted-foreground font-medium">
                    Paket Bulanan
                  </span>
                  <span className="font-bold text-foreground">Rp 299.000</span>
                </div>
                <div className="flex justify-between text-[16px]">
                  <span className="text-muted-foreground font-medium">
                    Biaya Admin
                  </span>
                  <span className="font-bold text-foreground">Rp 10.000</span>
                </div>
                <div className="flex justify-between text-[16px]">
                  <span className="text-muted-foreground font-medium">
                    Diskon
                  </span>
                  <span className="font-bold text-green-600">- Rp 30.900</span>
                </div>
              </div>

              {/* Total */}
              <div className="flex justify-between items-center mb-8">
                <span className="font-bold text-foreground text-[16px]">
                  Total
                </span>
                <span className="text-[24px] font-bold text-primary">
                  Rp 278.100
                </span>
              </div>

              {/* Payment Button */}
              <Button
                onClick={handlePaymentConfirm}
                disabled={isProcessing}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-auto min-h-[56px] py-3 px-4 rounded-2xl font-bold text-[18px] transition-all active:scale-[0.98] mb-6"
              >
                {isProcessing ? (
                  <div className="flex items-center justify-center flex-wrap gap-2">
                    <Loader2 className="h-5 w-5 animate-spin shrink-0" />
                    <span className="text-center">Memproses Pembayaran...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center flex-wrap gap-2 leading-tight">
                    <span className="text-center">Bayar dengan Midtrans</span>
                    <span className="shrink-0">→</span>
                  </div>
                )}
              </Button>

              {/* Security Badges */}
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