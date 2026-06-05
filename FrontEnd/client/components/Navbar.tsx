import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, User, BarChart3, Zap, Type, Minus, Plus, Download, Share, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "./ThemeToggle";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Komponen baru untuk mengatur Font Size dengan Plus/Minus
function FontSizeControl() {
  const [isOpen, setIsOpen] = useState(false);
  const [fontSize, setFontSize] = useState(16); // 16px adalah default browser
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Ambil data dari local storage saat pertama kali dimuat
  useEffect(() => {
    const savedSize = localStorage.getItem("globalFontSize");
    if (savedSize) {
      const size = parseInt(savedSize, 10);
      setFontSize(size);
      document.documentElement.style.fontSize = `${size}px`;
    }
  }, []);

  // Menutup popup saat user klik di luar area
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fungsi untuk update font size
  const updateFontSize = (newSize: number) => {
    // Batas minimum 12px dan maksimum 24px agar layout tidak hancur
    if (newSize >= 12 && newSize <= 24) {
      setFontSize(newSize);
      document.documentElement.style.fontSize = `${newSize}px`;
      localStorage.setItem("globalFontSize", newSize.toString());
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Tombol Ikon Utama */}
      <Button
        variant="ghost"
        size="icon"
        className="h-11 w-11 high-contrast:border-2 high-contrast:border-primary"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Atur Ukuran Teks"
        title="Atur Ukuran Teks"
      >
        <Type className="h-5 w-5" />
      </Button>

      {/* Pop-up Panel untuk Plus dan Minus */}
      {isOpen && (
        <div className="absolute right-0 mt-2 p-2 bg-background border border-border rounded-md shadow-lg z-50 flex items-center gap-2 w-max supports-[backdrop-filter]:bg-background/95 backdrop-blur">
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={() => updateFontSize(fontSize - 1)}
            disabled={fontSize <= 12}
          >
            <Minus className="h-3 w-3" />
          </Button>
          <span className="text-xs font-medium w-5 text-center select-none">
            {fontSize}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={() => updateFontSize(fontSize + 1)}
            disabled={fontSize >= 24}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
}

function InstallAppButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallDialog, setShowInstallDialog] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true) {
      setIsStandalone(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsStandalone(true);
      }
      setDeferredPrompt(null);
    } else {
      setShowInstallDialog(true);
    }
  };

  if (isStandalone) return null;

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="h-10 w-10 high-contrast:border-2 high-contrast:border-primary"
        aria-label="Install App"
        title="Install App"
        onClick={handleInstallClick}
      >
        <Download className="h-5 w-5" />
      </Button>

      <Dialog open={showInstallDialog} onOpenChange={setShowInstallDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cara Install Aplikasi</DialogTitle>
            <DialogDescription>
              Browser sedang tidak memunculkan prompt otomatis (mungkin karena sudah pernah diinstall/ditutup). Anda bisa menginstalnya secara manual:
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="flex gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Share className="h-5 w-5 text-primary" />
              </div>
              <p className="text-sm">
                <strong>Di HP (iOS/Android):</strong> Ketuk ikon Bagikan (Share) atau menu titik tiga di browser Anda, lalu pilih <strong>"Tambah ke Layar Utama" (Add to Home Screen)</strong>.
              </p>
            </div>
            <div className="flex gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Download className="h-5 w-5 text-primary" />
              </div>
              <p className="text-sm">
                <strong>Di Laptop/PC (Chrome/Edge):</strong> Klik ikon install (layar/panah bawah) di ujung kanan kolom URL (Address Bar), atau buka menu titik tiga di pojok kanan atas browser lalu pilih <strong>"Install / Tambahkan sebagai Aplikasi"</strong>.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function Navbar() {
  const navigate = useNavigate();
  const [isNavigating, setIsNavigating] = useState(false);

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token"); // Diganti jadi "token" sesuai standar
    if (token) {
      navigate("/home");
    } else {
      navigate("/");
    }
  };

  const handleProfileClick = () => {
    const token = localStorage.getItem("token"); // Diganti jadi "token"
    if (!token) {
      navigate("/login");
    } else {
      navigate("/profile");
    }
  };

  // 👇 FUNGSI BARU UNTUK ROUTING SUBSCRIPTION 👇
  const handleSubscriptionClick = async () => {
    const token = localStorage.getItem("token");
    
    // 1. Cek apakah sudah login
    if (!token) {
      navigate("/login");
      return;
    }

    // 2. Cek apakah ada tagihan yang tertunda (pending payment) di memori lokal
    const pendingPayment = localStorage.getItem("pendingPayment");
    if (pendingPayment) {
      navigate("/subscription/Payment");
      return;
    }

    // 3. Jika sudah login & tidak ada tagihan, cek status langganan ke API
    setIsNavigating(true); // Nyalakan loading (opsional)
    try {
      const apiUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_URL || "http://localhost:3000";
      const res = await fetch(`${apiUrl}/api/subscription/my-subs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Jika response OK berarti dia punya data langganan (Active / Pending)
      if (res.ok) {
        navigate("/subscription/Profile");
      } else {
        // Jika 404 (tidak ketemu), berarti belum langganan sama sekali
        navigate("/subscription");
      }
    } catch (error) {
      console.error("Gagal mengecek status langganan:", error);
      navigate("/subscription"); // Fallback ke landing page jika error
    } finally {
      setIsNavigating(false);
    }
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 high-contrast:border-4">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4 md:gap-8">
          {/* Logo */}
          <Link
            to="/"
            onClick={handleLogoClick}
            className="flex items-center gap-2 font-bold text-xl text-primary hover:opacity-80 transition-opacity flex-shrink-0 high-contrast:border high-contrast:border-primary high-contrast:px-2 high-contrast:py-1"
          >
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold">
              A
            </div>
            <span className="hidden sm:inline">ARAHIN</span>
          </Link>

          {/* Icon Group */}
          <div className="flex items-center gap-1 ml-auto">
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 high-contrast:border-2 high-contrast:border-primary"
              aria-label="Profile"
              onClick={handleProfileClick}
            >
              <User className="h-5 w-5" />
            </Button>
            <Link to="/reporting">
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 high-contrast:border-2 high-contrast:border-primary"
                aria-label="Reports"
              >
                <BarChart3 className="h-5 w-5" />
              </Button>
            </Link>
            
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 high-contrast:border-2 high-contrast:border-primary"
              aria-label="Subscription"
              onClick={handleSubscriptionClick}
              disabled={isNavigating} // Matikan tombol sementara saat fetch API
            >
              {isNavigating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Zap className="h-5 w-5" />}
            </Button>

            <InstallAppButton />
            <ThemeToggle />
            <FontSizeControl />
          </div>
        </div>
      </div>
    </nav>
  );
}