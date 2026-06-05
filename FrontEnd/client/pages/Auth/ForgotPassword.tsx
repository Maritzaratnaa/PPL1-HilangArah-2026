import { useState } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const customToastStyle = {
    className: "!bg-primary !text-primary-foreground border-none font-medium !text-[16px] !p-4",
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_URL || "http://localhost:3000";
      const res = await fetch(`${apiUrl}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      
      const json = await res.json();
      
      if (res.ok) {
        setIsSubmitted(true);
        toast.success("Tautan reset password berhasil dikirim!", customToastStyle);
      } else {
        toast.error(json.message || "Terjadi kesalahan saat mengirim email.", customToastStyle);
      }
    } catch (err) {
      toast.error("Gagal menghubungi server. Silakan coba lagi nanti.", customToastStyle);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-grow flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-card rounded-lg border border-border p-8 high-contrast:border-4 high-contrast:p-6">
            
            {!isSubmitted ? (
              <>
                <h1 className="text-3xl font-bold mb-2">Lupa Password?</h1>
                <p className="text-muted-foreground mb-8">
                  Masukkan alamat email yang terdaftar. Kami akan mengirimkan tautan untuk mengatur ulang password Anda.
                </p>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-base font-semibold">
                      Alamat Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="anda@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="h-12 text-base high-contrast:border-2 high-contrast:border-primary"
                    />
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    disabled={loading}
                    className="w-full h-12 text-base font-semibold high-contrast:border-2 high-contrast:border-primary"
                  >
                    {loading ? "Mengirim..." : "Kirim Tautan Reset"}
                  </Button>
                </form>
              </>
            ) : (
              <div className="text-center py-6">
                <CheckCircle2 className="mx-auto h-16 w-16 text-green-500 mb-4" />
                <h2 className="text-2xl font-bold mb-2">Periksa Email Anda</h2>
                <p className="text-muted-foreground mb-6">
                  Tautan untuk mengatur ulang password telah dikirim ke <span className="font-semibold text-foreground">{email}</span>. Silakan periksa kotak masuk atau folder spam Anda.
                </p>
              </div>
            )}

            <div className="mt-8 text-center">
              <Link
                to="/login"
                className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Kembali ke halaman Login
              </Link>
            </div>
            
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}