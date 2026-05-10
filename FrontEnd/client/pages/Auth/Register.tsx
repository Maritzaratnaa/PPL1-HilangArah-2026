import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Eye, EyeOff, Loader2 } from "lucide-react";

export default function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [userCategory, setUserCategory] = useState<string>("");
  const [loading, setLoading] = useState(false); // Dipindah ke atas agar lebih rapi
  const navigate = useNavigate();

  const userCategories = [
    { value: "disability", label: "Disabilitas" },
    { value: "elderly", label: "Lansia (60+)" },
    { value: "pregnant", label: "Wanita Hamil" },
    { value: "vulnerable-illness", label: "Penyakit Rentan" },
    { value: "children", label: "Anak-anak" },
    { value: "women", label: "Wanita" },
    { value: "general", label: "Umum" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert("Password dan konfirmasi password tidak sama!");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("http://localhost:3000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: email,
          email,
          password,
          full_name: fullName,
          category_status: userCategory,
        }),
      });
      const json = await res.json();
      
      if (res.ok) {
        // --- PERBAIKAN DI SINI ---
        alert("Registrasi berhasil! Silakan cek email Anda untuk kode OTP.");
        // Arahkan ke halaman verifikasi dan bawa data emailnya
        navigate("/verify-email", { state: { email: email } });
      } else {
        alert(json.message);
      }
    } catch (err: any) {
      alert("Error detail: " + err.message);
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
            <h1 className="text-3xl font-bold mb-2">Buat Akun</h1>
            <p className="text-muted-foreground mb-8">
              Bergabung dengan ARAHIN and mulai perjalanan Anda
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Full Name Field */}
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-base font-semibold">
                  Nama Lengkap
                </Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="h-12 text-base high-contrast:border-2 high-contrast:border-primary"
                  aria-required="true"
                />
              </div>

              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-base font-semibold">
                  Alamat Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12 text-base high-contrast:border-2 high-contrast:border-primary"
                  aria-required="true"
                />
              </div>

              {/* User Category */}
              <div className="space-y-2">
                <Label
                  htmlFor="userCategory"
                  className="text-base font-semibold"
                >
                  Kategori
                </Label>
                <Select value={userCategory} onValueChange={setUserCategory}>
                  <SelectTrigger
                    id="userCategory"
                    className="h-12 text-base high-contrast:border-2 high-contrast:border-primary"
                    aria-required="true"
                  >
                    <SelectValue placeholder="Pilih kategori Anda" />
                  </SelectTrigger>
                  <SelectContent>
                    {userCategories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Ini membantu kami untuk menyesuaikan fitur dengan Anda
                </p>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-base font-semibold">
                  Kata Sandi
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Buat kata sandi yang kuat"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-12 text-base pr-12 high-contrast:border-2 high-contrast:border-primary"
                    aria-required="true"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground h-10 w-10 flex items-center justify-center high-contrast:border high-contrast:border-primary"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-2">
                <Label
                  htmlFor="confirmPassword"
                  className="text-base font-semibold"
                >
                  Konfirmasi Kata Sandi
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Konfirmasi kata sandi Anda"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="h-12 text-base pr-12 high-contrast:border-2 high-contrast:border-primary"
                    aria-required="true"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground h-10 w-10 flex items-center justify-center high-contrast:border high-contrast:border-primary"
                    aria-label={
                      showConfirmPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Terms Checkbox */}
              <div className="flex items-start gap-2">
                <input
                  id="terms"
                  type="checkbox"
                  required
                  className="mt-1 h-5 w-5 rounded border-border cursor-pointer"
                  aria-required="true"
                />
                <Label
                  htmlFor="terms"
                  className="text-sm text-muted-foreground cursor-pointer"
                >
                  Saya setuju dengan Syarat dan Ketentuan Layanan serta Kebijakan Privasi.
                </Label>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                size="lg"
                disabled={loading}
                className="w-full h-12 text-base font-semibold high-contrast:border-2 high-contrast:border-primary"
              >
                {loading ? "Memproses..." : "Buat Akun"}
              </Button>
            </form>

            {/* Login Link */}
            <div className="mt-6 text-center">
              <p className="text-muted-foreground">
                Sudah punya akun?{" "}
                <Link
                  to="/login"
                  className="text-primary font-semibold hover:underline underline-offset-2"
                >
                  Masuk di sini
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}