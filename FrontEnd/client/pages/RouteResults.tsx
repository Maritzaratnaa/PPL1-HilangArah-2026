import { useEffect, useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { useIsHighContrast } from "@/hooks/useTheme";
import {
  ArrowLeft,
  Clock,
  Bus,
  Loader2,
  ChevronDown,
  ChevronUp,
  AlertCircle
} from "lucide-react";

interface Facility {
  low_entry: boolean;
  wheelchair_slot: boolean;
  priority_seat: boolean;
  women_area?: boolean; // Sesuai nama dari Backend
}

interface TransitStop {
  stop_name: string;
  has_ramp: boolean;
  has_elevator: boolean;
}

interface RouteResult {
  route_id: string;
  is_recommended: boolean;
  route_name: string;
  transport: {
    name: string;
    type: string;
    facilities: Facility;
  };
  journey: {
    origin_stop: string;
    origin_has_ramp?: boolean;
    origin_has_elevator?: boolean;
    destination_stop: string;
    dest_has_ramp?: boolean;
    dest_has_elevator?: boolean;
    stops_passed: number;
    estimated_time_minutes: number;
    transit_stops?: TransitStop[];
    origin_lat?: number;
    origin_lng?: number;
    dest_lat?: number;
    dest_lng?: number;
  };
}

const BASE_URL = "http://localhost:3000";

function getFacilityTips(category: string, facilities: Facility) {
  const tips: { icon: string; label: string; color: string }[] = [];
  
  // Amankan string agar kebal huruf besar/kecil
  const safeCategory = (category || "").trim().toLowerCase();
  const isWomanOnly = safeCategory === "wanita" || safeCategory === "perempuan" || safeCategory === "women";

  // 1. RINGKASAN TRANSPORTASI: Tampilkan badge Wanita di atas jika armada mendukung
  if ((isWomanOnly || safeCategory === "ibu hamil" || safeCategory === "pregnant") && facilities?.women_area) {
    tips.push({ icon: "👩", label: "Area Wanita", color: "bg-pink-100 text-pink-700 dark:bg-pink-950/30 dark:text-pink-300" });
  }

  // JIKA PROFILNYA HANYA WANITA, hentikan di sini.
  if (isWomanOnly) {
    return tips; 
  }

  // 2. KATEGORI LAIN
  if (safeCategory === "disabilitas" || safeCategory === "disability") {
    if (facilities?.low_entry) tips.push({ icon: "🚌", label: "Low Entry", color: "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300" });
    if (facilities?.wheelchair_slot) tips.push({ icon: "♿", label: "Slot Kursi Roda", color: "bg-purple-100 text-purple-700 dark:bg-purple-950/30 dark:text-purple-300" });
  }
  
  const needsPriority = ["lansia", "elderly", "ibu hamil", "pregnant", "penyakit rentan", "vulnerable-illness", "anak-anak", "children"].includes(safeCategory);
  if (needsPriority && facilities?.priority_seat) {
    tips.push({ icon: "🪑", label: "Kursi Prioritas", color: "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300" });
  }
  
  return tips;
}

function getCategoryAdvice(category: string, facilities: Facility): string | null {
  const safeCategory = (category || "").trim().toLowerCase();

  switch (safeCategory) {
    case "disabilitas":
    case "disability":
      if (facilities?.wheelchair_slot) return "✅ Transportasi ini memiliki slot khusus kursi roda di dekat pintu.";
      if (facilities?.low_entry) return "✅ Transportasi ini menggunakan low entry sehingga mudah dinaiki.";
      return null;
    case "lansia":
    case "elderly":
      if (facilities?.priority_seat) return "✅ Tersedia kursi prioritas untuk lansia. Tunjukkan kartu identitas jika diperlukan.";
      return null;
    case "ibu hamil":
    case "pregnant":
      if (facilities?.priority_seat) return "✅ Tersedia kursi prioritas untuk ibu hamil.";
      if (facilities?.low_entry) return "✅ Transportasi low entry memudahkan ibu hamil untuk naik turun.";
      return null;
    case "wanita":
    case "perempuan":
    case "women":
      if (facilities?.women_area) return "✅ Tersedia area khusus wanita pada armada transportasi ini.";
      return null;
    case "anak-anak":
    case "children":
      if (facilities?.priority_seat) return "✅ Tersedia kursi prioritas. Anak di bawah 3 tahun gratis dan tidak memerlukan tempat duduk terpisah.";
      return null;
    case "penyakit rentan":
    case "vulnerable-illness":
      if (facilities?.priority_seat) return "✅ Tersedia kursi prioritas untuk penumpang dengan kondisi kesehatan tertentu.";
      return null;
    default:
      return null;
  }
}

function StopBadges({ has_ramp, has_elevator, category }: { has_ramp: boolean; has_elevator: boolean; category: string }) {
  const safeCategory = (category || "").trim().toLowerCase();
  
  // Jika kategori hanya wanita, sembunyikan informasi fasilitas fisik halte (Ramp/Elevator)
  const isWomanOnly = safeCategory === "wanita" || safeCategory === "perempuan" || safeCategory === "women";
  if (isWomanOnly) return null; 

  const badges = [];
  if (has_ramp) badges.push({ icon: "♿", label: "Ramp", color: "bg-emerald-100 text-emerald-700" });
  if (has_elevator) badges.push({ icon: "🛗", label: "Elevator", color: "bg-blue-100 text-blue-700" });
  
  if (badges.length === 0) {
     badges.push({ icon: "⚠️", label: "Tanpa Fasilitas", color: "bg-muted text-muted-foreground" });
  }

  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {badges.map((b, i) => (
        <span key={i} className={`text-xs px-2 py-0.5 rounded-full font-semibold ${b.color}`}>
          {b.icon} {b.label}
        </span>
      ))}
    </div>
  );
}

export default function RouteResults() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const originQuery = searchParams.get("origin") || "";
  const destQuery = searchParams.get("destination") || "";

  const [originName, setOriginName] = useState(originQuery);
  const [destinationName, setDestinationName] = useState(destQuery);

  const [routes, setRoutes] = useState<RouteResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [filterInfo, setFilterInfo] = useState("Memuat...");
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    if (!originQuery || !destQuery) {
      setErrorMsg("Parameter pencarian tidak lengkap. Silakan kembali ke Beranda.");
      setLoading(false);
      return;
    }

    const fetchRoutes = async () => {
      setLoading(true);
      setErrorMsg("");
      try {
        const res = await fetch(
          `${BASE_URL}/api/search-routes?origin=${encodeURIComponent(originQuery)}&destination=${encodeURIComponent(destQuery)}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const json = await res.json();
        if (res.ok) {
          setRoutes(json.data);
          setFilterInfo(json.filter_applied);
        } else {
          setErrorMsg(json.message);
        }
      } catch (err) {
        setErrorMsg("Gagal terhubung ke server. Pastikan backend menyala.");
      } finally {
        setLoading(false);
      }
    };

    fetchRoutes();
  }, [originQuery, destQuery, navigate]);

  const handleSearchAgain = () => {
    if (!originName || !destinationName) return;
    navigate(`/route-results?origin=${encodeURIComponent(originName)}&destination=${encodeURIComponent(destinationName)}`);
  };

  const handleSelectRoute = (route: RouteResult) => {
    navigate("/route-map", { state: { selectedRoute: route } });
  };

  const getTransportIcon = (type: string) => {
    const icons: Record<string, string> = { Bus: "🚌", MRT: "🚇", KRL: "🚈", LRT: "🚅" };
    return icons[type] || "🚍";
  };

  const getAccessibilityBadge = (facilities: Facility, category: string) => {
      const safeCategory = (category || "").trim().toLowerCase();
      
      // Sembunyikan badge aksesibel penuh/sebagian jika kategori wanita
      if (safeCategory === "wanita" || safeCategory === "perempuan" || safeCategory === "women") return null;

      if (facilities?.wheelchair_slot && facilities?.low_entry) {
        return { label: "♿ Aksesibel Penuh", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300" };
      } else if (facilities?.priority_seat) {
        return { label: "🪑 Sebagian Aksesibel", color: "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300" };
      }
      return { label: "Standar", color: "bg-muted text-muted-foreground" };
    };

  const isHC = useIsHighContrast();

  const heroStyle = isHC
    ? { background: "#000000", borderBottom: "4px solid #ffff00" } 
    : { background: "linear-gradient(135deg, hsl(186 100% 27%) 0%, hsl(186 100% 18%) 100%)" };

  const searchBoxStyle = isHC
    ? { background: "#000000", border: "2px solid #ffff00" } 
    : { background: "rgba(255,255,255,0.1)", border: "1.5px solid rgba(255,255,255,0.18)" };

  const searchInputStyle = isHC
    ? { background: "#000000", border: "2px solid #ffff00" } 
    : { background: "rgba(255,255,255,0.12)", border: "1.5px solid rgba(255,255,255,0.2)" };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden" style={heroStyle}>
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full -translate-y-1/2 translate-x-1/2"
          style={{ background: "rgba(255,255,255,0.05)" }} aria-hidden="true" />

        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10 relative z-10">
          <Link to="/home">
            <button className={`flex items-center gap-2 text-sm mb-4 transition-colors ${isHC ? 'text-[#ffff00]' : 'text-white/70 hover:text-white'}`}>
              <ArrowLeft className="h-4 w-4" />Kembali
            </button>
          </Link>
          <h1 className={`text-2xl md:text-3xl font-bold mb-3 ${isHC ? 'text-[#ffff00]' : 'text-white'}`}>
            Hasil Rekomendasi
          </h1>
          <div className="rounded-xl p-4 mt-4" style={searchBoxStyle}>
            <div className="flex items-center gap-3">
              <div className="flex-1 flex items-center gap-3 rounded-lg px-4 py-2.5" style={searchInputStyle}>
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isHC ? 'bg-[#ffff00]' : 'bg-emerald-400'}`} />
                <input 
                  value={originName} 
                  onChange={(e) => setOriginName(e.target.value)}
                  placeholder="Ketik halte asal..."
                  className={`bg-transparent text-sm outline-none w-full ${isHC ? 'text-white placeholder:text-white/60' : 'text-white placeholder:text-white/40'}`} 
                />
              </div>
              <span className="text-white/40 text-lg flex-shrink-0">→</span>
              <div className="flex-1 flex items-center gap-3 rounded-lg px-4 py-2.5" style={searchInputStyle}>
                <span className="w-2 h-2 rounded-full bg-rose-400 flex-shrink-0" />
                <input value={destinationName} onChange={(e) => setDestinationName(e.target.value)}
                  placeholder="Ketik halte tujuan..."
                  className="bg-transparent text-white text-sm outline-none w-full placeholder:text-white/40" />
              </div>
              <button 
                onClick={handleSearchAgain}
                className={`font-bold text-sm px-5 py-2.5 rounded-lg hover:-translate-y-0.5 transition-all flex-shrink-0 ${
                  isHC ? 'bg-[#ffff00] text-black' : 'bg-white'
                }`}
                style={isHC ? {} : { color: "hsl(186 100% 27%)" }}
              >
                Cari Rute
              </button>
            </div>
          </div>
        </div>

        <svg viewBox="0 0 1440 48" fill="none" className="w-full -mb-1" aria-hidden="true">
          <path d="M0 24 Q180 0 360 24 Q540 48 720 24 Q900 0 1080 24 Q1260 48 1440 24 L1440 48 L0 48Z" className="fill-background" />
        </svg>
      </section>

      <main className="flex-grow px-4 py-8">
        <div className="mx-auto max-w-3xl">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : errorMsg ? (
            <div className="text-center py-16">
              <div className="text-4xl mb-4">🔍</div>
              <div className="font-bold text-lg mb-2 text-rose-500">{errorMsg}</div>
              <div className="text-sm text-muted-foreground mb-6">Silakan periksa kembali nama halte yang Anda ketik.</div>
              <Link to="/home"><Button variant="outline">Kembali ke Beranda</Button></Link>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{routes.length} rute ditemukan</span>
                  <span className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full font-semibold">
                    Filter: {filterInfo}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                {routes.map((route) => {
                  const accessBadge = getAccessibilityBadge(route.transport.facilities, filterInfo);
                  const facilityTips = getFacilityTips(filterInfo, route.transport.facilities);
                  const categoryAdvice = getCategoryAdvice(filterInfo, route.transport.facilities);
                  const isExpanded = expandedCard === route.route_id;

                  // Integrasi langsung dengan API Backend
                  const originHasRamp = route.journey.origin_has_ramp ?? false;
                  const originHasElevator = route.journey.origin_has_elevator ?? false;
                  const destHasRamp = route.journey.dest_has_ramp ?? false;
                  const destHasElevator = route.journey.dest_has_elevator ?? false;
                  const transitStops = route.journey.transit_stops ?? [];

                  return (
                    <div key={route.route_id}
                      className="bg-card rounded-2xl border border-border shadow-sm hover:shadow-md transition-all high-contrast:border-2 high-contrast:border-primary overflow-hidden">

                      {/* Pita Peringatan Rute Alternatif */}
                      {!route.is_recommended && (
                        <div className="bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 text-xs px-5 py-2 font-bold border-b border-rose-200 dark:border-rose-900/50 flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 flex-shrink-0" />
                          Rute alternatif: Kurang memenuhi kriteria profil aksesibilitas Anda.
                        </div>
                      )}

                      <div className="p-6">
                        {/* Top row */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-2xl flex-shrink-0">
                              {getTransportIcon(route.transport.type)}
                            </div>
                            <div>
                              <div className="font-bold text-base">{route.route_name}</div>
                              <div className="text-sm text-muted-foreground">{route.transport.name} · {route.transport.type}</div>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="text-2xl font-bold text-primary">{route.journey.estimated_time_minutes} mnt</div>
                            <div className="text-xs text-muted-foreground">{route.journey.stops_passed} halte</div>
                          </div>
                        </div>

                        {/* Journey line */}
                        <div className="flex items-center gap-2 mb-4 text-sm">
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 flex-shrink-0" />
                            <span className="font-medium">{route.journey.origin_stop}</span>
                          </div>
                          <div className="flex-1 border-t-2 border-dashed border-border mx-2" />
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 flex-shrink-0" />
                            <span className="font-medium">{route.journey.destination_stop}</span>
                          </div>
                        </div>

                        {/* Facilities badges */}
                        <div className="flex flex-wrap gap-2 mb-4">
                          {accessBadge && (
                            <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${accessBadge.color}`}>
                              {accessBadge.label}
                            </span>
                          )}
                          {facilityTips.map((tip, i) => (
                            <span key={i} className={`text-xs px-2.5 py-1 rounded-full font-semibold ${tip.color}`}>{tip.icon} {tip.label}</span>
                          ))}
                        </div>

                        {/* Bottom row */}
                        <div className="flex items-center justify-between pt-4 border-t border-border">
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{route.journey.estimated_time_minutes} menit</div>
                            <span>·</span>
                            <div className="flex items-center gap-1"><Bus className="h-3.5 w-3.5" />{route.journey.stops_passed} halte</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button onClick={() => setExpandedCard(isExpanded ? null : route.route_id)}
                              className="flex items-center gap-1 text-xs text-primary font-semibold hover:underline">
                              {isExpanded
                                ? <><ChevronUp className="h-3.5 w-3.5" />Sembunyikan</>
                                : <><ChevronDown className="h-3.5 w-3.5" />Lihat Detail</>
                              }
                            </button>
                            <Button onClick={() => handleSelectRoute(route)} size="sm"
                              className="h-8 px-5 text-xs font-bold high-contrast:border-2 high-contrast:border-primary">
                              Pilih Rute
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Dropdown detail */}
                      {isExpanded && (
                        <div className="border-t border-border px-6 py-5 bg-muted/30 rounded-b-2xl">
                          {categoryAdvice && (
                            <div className="mb-4 p-3 rounded-xl bg-primary/5 border border-primary/15 text-sm text-primary font-medium">
                              {categoryAdvice}
                            </div>
                          )}
                          <div>
                            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
                              Rute Perjalanan
                            </div>
                            <div className="relative">
                              <div className="absolute left-[9px] top-3 bottom-3 w-px bg-border" />
                              <div className="space-y-2">

                                {/* Halte asal */}
                                <div className="flex items-start gap-3 relative">
                                  <span className="w-5 h-5 rounded-full bg-emerald-500 flex-shrink-0 z-10 flex items-center justify-center mt-1">
                                    <span className="w-2 h-2 rounded-full bg-white" />
                                  </span>
                                  <div className="bg-background rounded-lg px-3 py-2 border border-border flex-1">
                                    <div className="text-xs text-muted-foreground">Halte Asal</div>
                                    <div className="text-sm font-semibold">{route.journey.origin_stop}</div>
                                    <StopBadges has_ramp={originHasRamp} has_elevator={originHasElevator} category={filterInfo} />
                                  </div>
                                </div>

                                {/* Halte transit */}
                                {transitStops.length > 0 ? transitStops.map((stop, idx) => (
                                  <div key={idx} className="flex items-start gap-3 relative">
                                    <span className="w-5 h-5 rounded-full bg-primary/20 border-2 border-primary flex-shrink-0 z-10 flex items-center justify-center mt-1">
                                      <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                                    </span>
                                    <div className="bg-background rounded-lg px-3 py-2 border border-border flex-1">
                                      <div className="text-xs text-muted-foreground">Transit</div>
                                      <div className="text-sm font-semibold">{stop.stop_name}</div>
                                      <StopBadges has_ramp={stop.has_ramp} has_elevator={stop.has_elevator} category={filterInfo} />
                                    </div>
                                  </div>
                                )) : (
                                  <div className="flex items-center gap-3 ml-1 py-1">
                                    <div className="w-px h-5 bg-border ml-1" />
                                    <span className="text-xs text-muted-foreground italic">Tidak ada transit — langsung ke tujuan</span>
                                  </div>
                                )}

                                {/* Halte tujuan */}
                                <div className="flex items-start gap-3 relative">
                                  <span className="w-5 h-5 rounded-full bg-rose-500 flex-shrink-0 z-10 flex items-center justify-center mt-1">
                                    <span className="w-2 h-2 rounded-full bg-white" />
                                  </span>
                                  <div className="bg-background rounded-lg px-3 py-2 border border-border flex-1">
                                    <div className="text-xs text-muted-foreground">Halte Tujuan</div>
                                    <div className="text-sm font-semibold">{route.journey.destination_stop}</div>
                                    <StopBadges has_ramp={destHasRamp} has_elevator={destHasElevator} category={filterInfo} />
                                  </div>
                                </div>

                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}