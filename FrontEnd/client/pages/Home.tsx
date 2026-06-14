import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react"; // Tambah useRef
import { Navbar } from "@/components/Navbar";
import { AlertCircle, Star, MapPin } from "lucide-react"; // Tambah MapPin untuk estetika list
import { Button } from "@/components/ui/button";
import { useIsHighContrast } from "@/hooks/useTheme";

export default function Home() {
  const navigate = useNavigate();
  const isHC = useIsHighContrast();

  const [userName, setUserName] = useState("Pengguna");
  const [userCategory, setUserCategory] = useState("");
  const [currentDate, setCurrentDate] = useState("");
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");

  // --- STATE BARU UNTUK AUTOCOMPLETE ---
  const [originSuggestions, setOriginSuggestions] = useState<any[]>([]);
  const [destSuggestions, setDestSuggestions] = useState<any[]>([]);
  const [isOriginLoading, setIsOriginLoading] = useState(false);
  const [isDestLoading, setIsDestLoading] = useState(false);
  const [showOriginSuggestions, setShowOriginSuggestions] = useState(false);
  const [showDestSuggestions, setShowDestSuggestions] = useState(false);

  const originRef = useRef<HTMLDivElement>(null);
  const destRef = useRef<HTMLDivElement>(null);
  // -------------------------------------

  const [hasSubs, setHasSubs] = useState(false);
  const [subsDays, setSubsDays] = useState(0);
  const [subsStatus, setSubsStatus] = useState("");
  const [subsEndDate, setSubsEndDate] = useState("");
  const [subsDuration, setSubsDuration] = useState("");
  const [hasPendingPayment, setHasPendingPayment] = useState(false);
  const [totalReports, setTotalReports] = useState(0);
  const [processedReports, setProcessedReports] = useState(0);

  const statusMap: Record<string, { label: string; style: string }> = {
    "elderly": { label: "Lansia (60+)", style: "bg-yellow-100/20 text-yellow-300 border-yellow-300/50" },
    "disability": { label: "Disabilitas", style: "bg-blue-100/20 text-blue-300 border-blue-300/50" },
    "pregnant": { label: "Wanita Hamil", style: "bg-pink-100/20 text-pink-300 border-pink-300/50" },
    "vulnerable-illness": { label: "Penyakit Rentan", style: "bg-indigo-100/20 text-indigo-300 border-indigo-300/50" },
    "children": { label: "Anak-anak", style: "bg-orange-100/20 text-orange-300 border-orange-300/50" },
    "women": { label: "Wanita", style: "bg-rose-100/20 text-rose-300 border-rose-300/50" },
    "general": { label: "Umum", style: "bg-slate-100/20 text-slate-300 border-slate-300/50" },
  };

  // MENGHENTIKAN DROPDOWN JIKA KLIK DI LUAR BAR ---
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (originRef.current && !originRef.current.contains(event.target as Node)) {
        setShowOriginSuggestions(false);
      }
      if (destRef.current && !destRef.current.contains(event.target as Node)) {
        setShowDestSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // (ORIGIN) 
  useEffect(() => {
    if (origin.trim().length < 2) {
      setOriginSuggestions([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsOriginLoading(true);
      try {
        const token = localStorage.getItem("token");
        const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
        const res = await fetch(`${apiUrl}/api/search-routes/suggestions?keyword=${encodeURIComponent(origin)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) setOriginSuggestions(data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsOriginLoading(false);
      }
    }, 400); 

    return () => clearTimeout(delayDebounceFn);
  }, [origin]);

  // (DESTINATION) 
  useEffect(() => {
    if (destination.trim().length < 2) {
      setDestSuggestions([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsDestLoading(true);
      try {
        const token = localStorage.getItem("token");
        const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
        const res = await fetch(`${apiUrl}/api/search-routes/suggestions?keyword=${encodeURIComponent(destination)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) setDestSuggestions(data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsDestLoading(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [destination]);

  useEffect(() => {
    const name = localStorage.getItem("userName") || "Pengguna";
    const category = localStorage.getItem("userCategory") || "";
    setUserName(name.split(" ")[0]);
    setUserCategory(category);

    const pendingData = localStorage.getItem("pendingPayment");
    if (pendingData) setHasPendingPayment(true);

    const now = new Date();
    setCurrentDate(
      now.toLocaleDateString("id-ID", {
        weekday: "long", day: "numeric", month: "long", year: "numeric",
      }),
    );

    const fetchReports = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      try {
        const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
        const res = await fetch(`${apiUrl}/api/reports/my-reports`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (res.ok && json.data) {
          const activeCount = json.data.filter((r: any) => r.status === "Pending" || r.status === "Processed").length;
          const processedCount = json.data.filter((r: any) => r.status === "Processed").length;
          setTotalReports(activeCount);
          setProcessedReports(processedCount);
        }
      } catch (error) {
        console.error("Gagal mengambil data laporan:", error);
      }
    };
    fetchReports();

    const fetchSubs = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      try {
        const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
        const res = await fetch(`${apiUrl}/api/subscription/my-subs`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (res.ok && json.data) {
          setHasSubs(true);
          setSubsStatus(json.data.status);
          setSubsDuration(json.data.duration || "");
          if (json.data.end_date) {
            const end = new Date(json.data.end_date).getTime();
            const today = new Date().getTime();
            const diff = end - today;
            setSubsDays(Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24))));
            setSubsEndDate(
              new Date(json.data.end_date).toLocaleDateString("id-ID", {
                day: "numeric", month: "short", year: "numeric",
              }),
            );
          }
        }
      } catch (error) {
        console.error("Gagal mengecek subscription di Home:", error);
      }
    };
    fetchSubs();
  }, []);

  const handleSearch = () => {
    if (!origin || !destination) return;
    navigate(`/route-results?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`);
  };

  const quickActions = [
    {
      icon: <AlertCircle className="h-6 w-6" />,
      label: "Buat Laporan",
      sub: "Laporkan hambatan",
      bg: "bg-rose-50 dark:bg-rose-950/30",
      color: "text-rose-600",
      href: "/reporting",
    },
    {
      icon: <Star className="h-6 w-6" />,
      label: "Langganan",
      sub: hasPendingPayment ? "Lanjutkan pembayaran" : hasSubs ? subsStatus === "Pending" ? "Sedang Diproses" : `${subsDays} hari tersisa` : "Daftar pemandu",
      bg: "bg-blue-50 dark:bg-blue-950/30",
      color: "text-blue-600",
      href: hasPendingPayment ? "/subscription/Payment" : hasSubs ? "/subscription/Profile" : "/subscription",
    },
  ];

  const heroStyle = isHC ? { background: "#000000" } : { background: "linear-gradient(135deg, hsl(186 100% 27%) 0%, hsl(186 100% 18%) 100%)" };
  const searchBoxStyle = isHC ? { background: "#000000", border: "2px solid #ffff00" } : { background: "rgba(255,255,255,0.1)", border: "1.5px solid rgba(255,255,255,0.18)" };
  const searchInputStyle = isHC ? { background: "#000000", border: "2px solid #ffff00" } : { background: "rgba(255,255,255,0.1)", border: "1.5px solid rgba(255,255,255,0.18)" };
  const subCardStyle = isHC ? { background: "#000000", border: "2px solid #ffff00" } : { background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)" };
  const subBadgeStyle = isHC ? { background: "#000000", color: "#ffff00", border: "2px solid #ffff00" } : { background: "rgba(125,216,166,0.2)", color: "#7dd8a6", border: "1px solid rgba(125,216,166,0.3)" };
  const subButtonStyle = isHC ? { background: "#000000", color: "#ffff00", border: "2px solid #ffff00" } : { background: "rgba(255,255,255,0.15)", color: "#fff", border: "1px solid rgba(255,255,255,0.2)" };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <section className="relative overflow-hidden" style={heroStyle}>
        {!isHC && (
          <>
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full -translate-y-1/2 translate-x-1/2" style={{ background: "rgba(255,255,255,0.05)" }} aria-hidden="true" />
            <div className="absolute bottom-0 left-1/4 w-32 h-32 rounded-full translate-y-1/2" style={{ background: "rgba(255,255,255,0.03)" }} aria-hidden="true" />
          </>
        )}

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-12 pb-0">
          <div className="grid lg:grid-cols-[1fr_260px] gap-8 items-end">
            <div>
              <p className={`text-sm font-semibold mb-1 ${isHC ? "text-[#ffff00]" : "text-white/60"}`}>{currentDate}</p>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                <span style={{ color: isHC ? "#ffff00" : "#ffffff" }}>Halo, </span>
                <span style={{ color: isHC ? "#ffff00" : "#7dd8a6" }}>{userName}</span> 👋
              </h1>
              <p className={`text-sm mb-6 ${isHC ? "text-[#ffff00]" : "text-white/65"}`}>
                Mau ke mana hari ini? Temukan rute aksesibel untuk perjalanan Anda.
              </p>

              <div className="flex flex-wrap items-center gap-3 mb-8">
                <div className={`px-4 py-1.5 rounded-full border text-sm font-medium backdrop-blur-sm ${isHC ? "bg-black text-[#ffff00] border-[#ffff00]" : "border-white/20 bg-white/10 text-white"}`}>
                  Pengguna
                </div>

                {userCategory && userCategory.toLowerCase() !== "pengguna" && (
                  <div className={`flex items-center justify-center px-4 py-1.5 rounded-full border text-sm font-medium backdrop-blur-sm ${isHC ? "bg-black text-[#ffff00] border-[#ffff00]" : statusMap[userCategory.toLowerCase()]?.style || "bg-white/10 text-white border-white/20"}`}>
                    <span>{statusMap[userCategory.toLowerCase()]?.label || userCategory}</span>
                  </div>
                )}
                
                {hasSubs && subsStatus === "Active" && (
                  <span className="px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5" style={subBadgeStyle}>
                    ⭐ Langganan Aktif {subsDuration && `(${subsDuration})`}
                  </span>
                )}
              </div>

              <div className="rounded-xl p-3 mb-0" style={searchBoxStyle}>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  
                  {/* INPUT HALTE ASAL */}
                  <div ref={originRef} className="relative flex-1">
                    <div className="flex items-center gap-2 rounded-lg px-3 py-2.5" style={searchInputStyle}>
                      <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
                      <input
                        value={origin}
                        onChange={(e) => {
                          setOrigin(e.target.value);
                          setShowOriginSuggestions(true);
                        }}
                        onFocus={() => setShowOriginSuggestions(true)}
                        placeholder="Halte asal..."
                        className="bg-transparent text-white text-sm outline-none w-full placeholder:text-white/40"
                      />
                    </div>

                    {/* Dropdown Hasil Asal */}
                    {showOriginSuggestions && origin.trim().length >= 2 && (
                      <div className="absolute left-0 right-0 mt-2 bg-popover text-popover-foreground rounded-xl shadow-xl border border-border z-[100] max-h-60 overflow-y-auto overflow-x-hidden p-1.5 animate-in fade-in-50 slide-in-from-top-1 duration-200 isolation-auto">
                        {isOriginLoading ? (
                          <div className="text-xs text-muted-foreground p-3 text-center">Mencari halte...</div>
                        ) : originSuggestions.length > 0 ? (
                          originSuggestions.map((stop) => (
                            <button
                              key={stop.stop_id}
                              onClick={() => {
                                setOrigin(stop.name);
                                setShowOriginSuggestions(false);
                              }}
                              className="w-full text-left px-3 py-2.5 text-sm rounded-lg hover:bg-muted flex items-center gap-2 transition-colors font-medium"
                            >
                              <MapPin className="h-4 w-4 text-emerald-500 shrink-0" />
                              <span className="truncate">{stop.name}</span>
                            </button>
                          ))
                        ) : (
                          <div className="text-xs text-rose-500 font-semibold p-3 text-center bg-rose-500/10 rounded-lg">
                            Halte tidak ditemukan / belum tersedia
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* INPUT HALTE TUJUAN */}
                  <div ref={destRef} className="relative flex-1">
                    <div className="flex items-center gap-2 rounded-lg px-3 py-2.5" style={searchInputStyle}>
                      <span className="w-2 h-2 rounded-full bg-rose-400 flex-shrink-0" />
                      <input
                        value={destination}
                        onChange={(e) => {
                          setDestination(e.target.value);
                          setShowDestSuggestions(true);
                        }}
                        onFocus={() => setShowDestSuggestions(true)}
                        placeholder="Halte tujuan..."
                        className="bg-transparent text-white text-sm outline-none w-full placeholder:text-white/40"
                      />
                    </div>

                    {/* Dropdown Hasil Tujuan */}
                    {showDestSuggestions && destination.trim().length >= 2 && (
                      <div className="absolute left-0 right-0 mt-2 bg-popover text-popover-foreground rounded-xl shadow-xl border border-border z-[100] max-h-60 overflow-y-auto overflow-x-hidden p-1.5 animate-in fade-in-50 slide-in-from-top-1 duration-200 isolation-auto">                        
                          {isDestLoading ? (
                          <div className="text-xs text-muted-foreground p-3 text-center">Mencari halte...</div>
                        ) : destSuggestions.length > 0 ? (
                          destSuggestions.map((stop) => (
                            <button
                              key={stop.stop_id}
                              onClick={() => {
                                setDestination(stop.name);
                                setShowDestSuggestions(false);
                              }}
                              className="w-full text-left px-3 py-2.5 text-sm rounded-lg hover:bg-muted flex items-center gap-2 transition-colors font-medium"
                            >
                              <MapPin className="h-4 w-4 text-rose-500 shrink-0" />
                              <span className="truncate">{stop.name}</span>
                            </button>
                          ))
                        ) : (
                          <div className="text-xs text-rose-500 font-semibold p-3 text-center bg-rose-500/10 rounded-lg">
                            Halte tidak ditemukan / belum tersedia
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={handleSearch}
                    disabled={!origin || !destination}
                    className={`font-bold text-sm px-5 h-10 rounded-lg transition-all disabled:opacity-50 w-full sm:w-auto ${isHC ? "bg-[#ffff00] text-black border-2 border-[#ffff00] hover:bg-[#ffff00]/90" : "bg-white hover:bg-white/90 shadow-sm"}`}
                    style={isHC ? {} : { color: "hsl(186 100% 27%)" }}
                  >
                    Cari Rute
                  </Button>
                </div>
              </div>
            </div>

            {/* Bagian kode langganan dll tetap sama ke bawah... */}
            <div className="rounded-xl p-5 mb-0 self-end" style={subCardStyle}>
              {hasPendingPayment ? (
                <>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold mb-3" style={{ background: "rgba(251, 191, 36, 0.2)", color: "#fbbf24", border: "1px solid rgba(251, 191, 36, 0.4)" }}>
                    ⏳ Menunggu Pembayaran
                  </div>
                  <div className="text-white font-bold text-sm mb-1" style={{ color: isHC ? "#ffff00" : "#ffffff" }}>Selesaikan Transaksi</div>
                  <div className={`text-xs mb-4 ${isHC ? "text-[#ffff00]" : "text-white/55"}`}>Anda memiliki tagihan langganan yang belum dibayar.</div>
                  <Link to="/subscription/Payment">
                    <button className="w-full rounded-lg py-2 text-xs font-bold transition-all hover:opacity-90" style={subButtonStyle}>Lanjut Bayar →</button>
                  </Link>
                </>
              ) : hasSubs ? (
                <>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold mb-3" style={subsStatus === "Pending" ? { ...subBadgeStyle, background: "rgba(251, 191, 36, 0.2)", color: "#fbbf24", borderColor: "rgba(251, 191, 36, 0.4)" } : subBadgeStyle}>
                    {subsStatus === "Pending" ? "⏳ Menunggu Verifikasi" : "⭐ Aktif"}
                  </div>
                  <div className="text-white font-bold text-sm mb-1" style={{ color: isHC ? "#ffff00" : "#ffffff" }}>Paket Bulanan</div>
                  <div className={`text-xs mb-3 ${isHC ? "text-[#ffff00]" : "text-white/55"}`}>{subsEndDate ? `Berlaku hingga ${subsEndDate}` : "Belum ada tanggal aktif"}</div>
                  <div className={`text-xs mb-4 ${isHC ? "text-[#ffff00]" : "text-white/45"}`}>{subsStatus === "Active" ? `${subsDays} hari tersisa` : "Segera dialokasikan"}</div>
                  <Link to="/subscription/Profile">
                    <button className="w-full rounded-lg py-2 text-xs font-bold transition-all hover:opacity-90" style={subButtonStyle}>Lihat Profil →</button>
                  </Link>
                </>
              ) : (
                <>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold mb-3" style={{ background: "rgba(255,255,255,0.1)", color: "#fff", border: "1px solid rgba(255,255,255,0.2)" }}>💡 Info Fitur</div>
                  <div className="text-white font-bold text-sm mb-1" style={{ color: isHC ? "#ffff00" : "#ffffff" }}>Pemandu Pribadi</div>
                  <div className={`text-xs mb-4 ${isHC ? "text-[#ffff00]" : "text-white/55"}`}>Jalan lebih aman dengan pendampingan khusus.</div>
                  <Link to="/subscription">
                    <button className="w-full rounded-lg py-2 text-xs font-bold transition-all hover:opacity-90" style={subButtonStyle}>Cari Tahu →</button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>

        <svg viewBox="0 0 1440 48" fill="none" className="w-full -mb-1 mt-6" aria-hidden="true">
          <path d="M0 24 Q180 0 360 24 Q540 48 720 24 Q900 0 1080 24 Q1260 48 1440 24 L1440 48 L0 48Z" className="fill-background" />
        </svg>
      </section>

      {/* Sisa section bawah (Ringkasan & Akses Cepat) dipertahankan sesuai kode aslimu */}
      <section className="bg-muted/50 py-10 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-lg font-bold mb-5">Ringkasan Saya</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { val: totalReports.toString(), label: "Laporan Aktif", sub: `${processedReports} sedang diproses` },
              { val: hasSubs && subsStatus === "Active" ? subsDays.toString() : "-", label: "Sisa Masa Aktif", sub: hasSubs && subsEndDate ? `Berlaku hingga ${subsEndDate}` : "Belum berlangganan" }
            ].map((s, i) => (
              <div key={i} className="bg-background rounded-xl border border-border p-5 high-contrast:border-2 high-contrast:border-white">
                <div className="text-3xl font-bold text-primary mb-1 high-contrast:text-white">{s.val}</div>
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 high-contrast:text-white">{s.label}</div>
                <div className="text-sm text-muted-foreground high-contrast:text-white">{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-background py-10 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-lg font-bold mb-5">Akses Cepat</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {quickActions.map((qa, i) => (
              <Link key={i} to={qa.href} className="w-full">
                <div className="bg-background rounded-xl border border-border p-5 hover:shadow-md hover:-translate-y-0.5 transition-all text-center high-contrast:border-2 high-contrast:border-white h-full">
                  <div className={`w-12 h-12 rounded-xl ${qa.bg} ${qa.color} flex items-center justify-center mx-auto mb-3 high-contrast:bg-black high-contrast:border-2 high-contrast:border-white`}>
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