import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Loader2, MailCheck } from "lucide-react";

export default function VerifyEmail() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Menangkap email dari halaman Register sebelumnya
  const email = location.state?.email;

  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Jika user iseng buka halaman ini tanpa lewat register, tendang ke login
  useEffect(() => {
    if (!email) {
      navigate('/login');
    }
  }, [email, navigate]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setErrorMsg("Kode OTP harus terdiri dari 6 angka.");
      return;
    }

    setIsLoading(true);
    setErrorMsg("");

    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
      const res = await fetch(`${apiUrl}/api/auth/verify-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp })
      });

      const data = await res.json();

      if (res.ok) {
        alert("Email berhasil diverifikasi! Silakan login.");
        navigate('/login'); // Berhasil? Lempar ke Login!
      } else {
        setErrorMsg(data.message || "Kode OTP salah atau kadaluarsa.");
      }
    } catch (error) {
      setErrorMsg("Terjadi kesalahan jaringan.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!email) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/20 px-4 font-['Atkinson_Hyperlegible',_sans-serif]">
      <div className="bg-card w-full max-w-md p-8 rounded-3xl shadow-lg border border-border text-center">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 text-primary">
          <MailCheck size={32} />
        </div>
        
        <h1 className="text-2xl font-bold mb-2">Verifikasi Email Anda</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Kami telah mengirimkan 6 digit kode OTP ke <br/>
          <span className="font-bold text-foreground">{email}</span>
        </p>

        {errorMsg && (
          <div className="bg-rose-100 text-rose-700 text-sm font-semibold p-3 rounded-lg mb-6">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-6">
          <div>
            <input
              type="text"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))} // Hanya boleh angka
              placeholder="Masukkan 6 Digit OTP"
              className="w-full text-center text-2xl font-bold tracking-[0.5em] py-4 rounded-xl border-2 border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            />
          </div>

          <Button 
            type="submit" 
            disabled={isLoading || otp.length !== 6}
            className="w-full h-12 text-[16px] font-bold rounded-xl"
          >
            {isLoading ? <Loader2 className="animate-spin mr-2" /> : "Verifikasi Sekarang"}
          </Button>
        </form>

        <p className="text-xs text-muted-foreground mt-8">
          Belum menerima email? Coba periksa folder Spam Anda.
        </p>
      </div>
    </div>
  );
}