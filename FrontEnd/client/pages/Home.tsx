import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { AlertCircle, Star, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsHighContrast } from "@/hooks/useTheme";

const quickActions = [
  { icon: <AlertCircle className="h-6 w-6" />, label: "Buat Laporan", sub: "Laporkan hambatan", bg: "bg-rose-50 dark:bg-rose-950/30", color: "text-rose-600", href: "/reporting" },
  { icon: <Star className="h-6 w-6" />, label: "Subscription", sub: "20 hari tersisa", bg: "bg-blue-50 dark:bg-blue-950/30", color: "text-blue-600", href: "/subscription" },
];

export default function Home() {
  const [userName, setUserName] = useState("Pengguna");
  const [userCategory, setUserCategory] = useState("");
  const [currentDate, setCurrentDate] = useState("");
  const isHC = useIsHighContrast();

  useEffect(() => {
    const name = localStorage.getItem("userName") || "Pengguna";
    const category = localStorage.getItem("userCategory") || "";
    setUserName(name.split(" ")[0]);
    setUserCategory(category);
    const now = new Date();
    setCurrentDate(now.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" }));
  }, []);

  const navigate = useNavigate();
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");

  const handleSearch = () => {
    if (!origin || !destination) return;
    navigate(`/route-results?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`);
  };

  // Style kondisional berdasarkan high contrast
  const heroStyle = isHC
    ? { background: "#000000"}
    : { background: "linear-gradient(135deg, hsl(186 100% 27%) 0%, hsl(186 100% 18%) 100%)" };

  const searchBoxStyle = isHC
    ? { background: "#000000", border: "2px solid #ffff00" }
    : { background: "rgba(255,255,255,0.1)", border: "1.5px solid rgba(255,255,255,0.18)" };

  const searchInputStyle = isHC
    ? { background: "#000000", border: "2px solid 	#ffff00" }
    : { background: "rgba(255,255,255,0.1)", border: "1.5px solid rgba(255,255,255,0.18)" };

  const subCardStyle = isHC
    ? { background: "#000000", border: "2px solid 	#ffff00" }
    : { background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)" };

  const subBadgeStyle = isHC
    ? { background: "#000000", color: "#ffff00", border: "2px solid	#ffff00" }
    : { background: "rgba(125,216,166,0.2)", color: "#7dd8a6", border: "1px solid rgba(125,216,166,0.3)" };

  const subProgressBgStyle = isHC
    ? { background: "	#4d4d4d" }
    : { background: "rgba(255,255,255,0.15)" };

  const subProgressFillStyle = isHC
    ? { background: "#ffff00" }
    : { background: "#7dd8a6" };

  const subButtonStyle = isHC
    ? { background: "#000000", color: "#ffff00", border: "2px solid	#ffff00" }
    : { background: "rgba(255,255,255,0.15)", color: "#fff", border: "1px solid rgba(255,255,255,0.2)" };

  const categoryChipStyle = isHC
    ? { background: "#000000", color: "#ffff00", border: "2px solid #ffff00" }
    : { background: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.85)", border: "1px solid rgba(255,255,255,0.2)" };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <section className="relative overflow-hidden" style={heroStyle}>
        {!isHC && (
          <>
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full -translate-y-1/2 translate-x-1/2"
              style={{ background: "rgba(255,255,255,0.05)" }} aria-hidden="true" />
            <div className="absolute bottom-0 left-1/4 w-32 h-32 rounded-full translate-y-1/2"
              style={{ background: "rgba(255,255,255,0.03)" }} aria-hidden="true" />
          </>
        )}

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-12 pb-0">
          <div className="grid lg:grid-cols-[1fr_260px] gap-8 items-end">
            <div>
              <p className={`text-sm font-semibold mb-1 ${isHC ? 'text-[#ffff00]' : 'text-white/60'}`}>{currentDate}</p>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                <span style={{ color: isHC ? "#ffff00" : "#ffffff" }}>Halo, </span>
                <span style={{ color: isHC ? "#ffff00" : "#7dd8a6" }}>{userName}</span> 👋
              </h1>
              <p className={`text-sm mb-6 ${isHC ? 'text-[#ffff00]' : 'text-white/65'}`}>
                Mau ke mana hari ini? Temukan rute aksesibel untuk perjalanan Anda.
              </p>
              <div className="flex flex-wrap gap-2 mb-8">
                {userCategory && (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold" style={categoryChipStyle}>
                    {userCategory}
                  </span>
                )}
                <span className="px-3 py-1 rounded-full text-xs font-semibold" style={subBadgeStyle}>
                  ⭐ Subscriber Aktif
                </span>
              </div>

              {/* Search bar */}
              <div className="rounded-xl p-4 mb-0" style={searchBoxStyle}>
                <div className="flex items-center gap-3">
                  <div className="flex-1 flex items-center gap-3 rounded-lg px-4 py-2.5" style={searchInputStyle}>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
                    <input value={origin} onChange={(e) => setOrigin(e.target.value)}
                      placeholder="📍 Halte asal..."
                      className="bg-transparent text-white text-sm outline-none w-full placeholder:text-white/40" />
                  </div>
                  <span className={`text-lg ${isHC ? 'text-white' : 'text-white/30'}`}>→</span>
                  <div className="flex-1 flex items-center gap-3 rounded-lg px-4 py-2.5" style={searchInputStyle}>
                    <span className="w-2 h-2 rounded-full bg-rose-400 flex-shrink-0" />
                    <input value={destination} onChange={(e) => setDestination(e.target.value)}
                      placeholder="🏁 Halte tujuan..."
                      className="bg-transparent text-white text-sm outline-none w-full placeholder:text-white/40" />
                  </div>
                  <Button 
                    onClick={handleSearch} 
                    disabled={!origin || !destination}
                    className={`font-bold text-sm px-5 h-10 rounded-lg transition-all disabled:opacity-50 
                      ${isHC 
                        ? 'bg-[#ffff00] text-black border-2 border-[#ffff00] hover:bg-[#ffff00]/90' 
                        : 'bg-white hover:bg-white/90 shadow-sm'
                      }`}
                    style={isHC ? {} : { color: "hsl(186 100% 27%)" }}
                  >
                    Cari Rute
                  </Button>
                </div>
              </div>
            </div>

            {/* Subscription card */}
            <div className="rounded-xl p-5 mb-0 self-end" style={subCardStyle}>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold mb-3" style={subBadgeStyle}>
                ⭐ Aktif
              </div>
              <div className="text-white font-bold text-sm mb-1" style={{ color: isHC ? "#ffff00" : "#ffffff" }}> Paket Bulanan </div>
              <div className={`text-xs mb-3 ${isHC ? 'text-[#ffff00]' : 'text-white/55'}`}>Berlaku hingga 31 Mar 2026</div>
              <div className="h-1.5 rounded-full mb-1" style={subProgressBgStyle}>
                <div className="h-full rounded-full transition-all duration-500" style={{ width: "65%", ...subProgressFillStyle }} />
              </div>  
              <div className={`text-xs mb-4 ${isHC ? 'text-[#ffff00]' : 'text-white/45'}`}>20 hari tersisa</div>
              <Link to="/subscription">
                <button className="w-full rounded-lg py-2 text-xs font-bold transition-all hover:opacity-90" style={subButtonStyle}>
                  Perpanjang →
                </button>
              </Link>
            </div>
          </div>
        </div>

        <svg viewBox="0 0 1440 48" fill="none" className="w-full -mb-1 mt-6" aria-hidden="true">
          <path d="M0 24 Q180 0 360 24 Q540 48 720 24 Q900 0 1080 24 Q1260 48 1440 24 L1440 48 L0 48Z"
            className="fill-background" />
        </svg>
      </section>

      {/* STATS */}
      <section className="bg-muted/50 py-10 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-lg font-bold mb-5">Ringkasan Saya</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { val: "8", label: "Rute Digunakan", sub: "3 rute minggu ini", progress: null },
              { val: "3", label: "Laporan Aktif", sub: "1 sedang diproses", progress: null },
              { val: "20", label: "Hari Subscription", sub: "Berlaku hingga 31 Mar", progress: 65 },
            ].map((s, i) => (
              <div key={i} className="bg-background rounded-xl border border-border p-5 high-contrast:border-2 high-contrast:border-white">
                <div className="text-3xl font-bold text-primary mb-1 high-contrast:text-white">{s.val}</div>
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 high-contrast:text-white">{s.label}</div>
                <div className="text-sm text-muted-foreground high-contrast:text-white">{s.sub}</div>
                {s.progress && (
                  <div className="mt-3 h-1.5 bg-muted rounded-full overflow-hidden high-contrast:bg-white">
                    <div className="h-full bg-primary rounded-full high-contrast:bg-white" style={{ width: `${s.progress}%` }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* QUICK ACTIONS */}
      <section className="bg-background py-10 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-lg font-bold mb-5">Akses Cepat</h2>
          <div className="flex flex-wrap justify-center gap-4">
            {quickActions.map((qa, i) => (
              <Link key={i} to={qa.href} className="w-[calc(50%-0.5rem)] md:w-56">
                <div className="bg-background rounded-xl border border-border p-5
                  hover:shadow-md hover:-translate-y-0.5 transition-all text-center
                  high-contrast:border-2 high-contrast:border-white h-full">
                  <div className={`w-12 h-12 rounded-xl ${qa.bg} ${qa.color}
                    flex items-center justify-center mx-auto mb-3
                    high-contrast:bg-black high-contrast:border-2 high-contrast:border-white`}>
                    {qa.icon}
                  </div>
                  <div className="text-sm font-bold text-foreground high-contrast:text-white">{qa.label}</div>
                  <div className="text-xs text-muted-foreground mt-1 high-contrast:text-white">{qa.sub}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}