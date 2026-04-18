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
  women_area?: boolean;
}

interface Transport {
  name: string;
  type: string;
  facilities: Facility;
}

interface TransitStop {
  stop_name: string;
  latitude?: number;
  longitude?: number;
}

// INTERFACE BARU: Sesuai dengan JSON Backend yang baru (menggunakan 'legs')
interface JourneyLeg {
  step: number;
  route_name: string;
  origin_stop: string;
  destination_stop: string;
  transports: Transport[];
  stops_passed: number;
  estimated_time_minutes: number;
  route_path: TransitStop[];
}

interface RouteResult {
  route_type: "direct" | "transit";
  total_estimated_time: number;
  is_recommended: boolean;
  legs: JourneyLeg[];
}

const BASE_URL = "http://localhost:3000";

function getFacilityTips(category: string, facilities: Facility) {
  const tips: { icon: string; label: string; color: string }[] = [];
  const safeCategory = (category || "").trim().toLowerCase();
  const isWomanOnly = safeCategory === "wanita" || safeCategory === "perempuan" || safeCategory === "women";

  if ((isWomanOnly || safeCategory === "ibu hamil" || safeCategory === "pregnant") && facilities?.women_area) {
    tips.push({ icon: "👩", label: "Area Wanita", color: "bg-pink-100 text-pink-700 dark:bg-pink-950/30 dark:text-pink-300" });
  }

  if (isWomanOnly) return tips; 

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

function getCategoryAdvice(category: string, transports: Transport[]): string | null {
  if (!transports || transports.length === 0) return null;
  const safeCategory = (category || "").trim().toLowerCase();
  
  const hasWomenAreaAll = transports.every(t => t.facilities.women_area);
  const hasWheelchairAll = transports.every(t => t.facilities.wheelchair_slot);
  const hasLowEntryAll = transports.every(t => t.facilities.low_entry);
  const hasPriorityAll = transports.every(t => t.facilities.priority_seat);

  switch (safeCategory) {
    case "disabilitas":
    case "disability":
      if (hasWheelchairAll) return "✅ Seluruh armada rute ini memiliki slot khusus kursi roda.";
      if (hasLowEntryAll) return "✅ Seluruh armada menggunakan low entry sehingga mudah dinaiki.";
      return "✅ Rute ini telah disesuaikan dengan kriteria aksesibilitas.";
    case "lansia":
    case "elderly":
    case "ibu hamil":
    case "pregnant":
    case "penyakit rentan":
    case "vulnerable-illness":
    case "anak-anak":
    case "children":
      if (hasPriorityAll) return "✅ Tersedia kursi prioritas pada seluruh armada rute ini.";
      return "✅ Tersedia kursi prioritas untuk kenyamanan perjalanan Anda.";
    case "wanita":
    case "perempuan":
    case "women":
      if (hasWomenAreaAll) return "✅ Tersedia area khusus wanita pada seluruh armada rute ini.";
      return "✅ Tersedia area khusus wanita (cek detail per armada).";
    default:
      return null;
  }
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
  const [expandedCard, setExpandedCard] = useState<number | null>(null);

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
    navigate("/route-map", { 
      state: { selectedRoute: route, filterCategory: filterInfo } 
    });
  };

  const getTransportIcon = (type: string) => {
    const icons: Record<string, string> = { Bus: "🚌", MRT: "🚇", KRL: "🚈", LRT: "🚅" };
    return icons[type] || "🚍";
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

      <section className="relative overflow-hidden" style={heroStyle}>
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full -translate-y-1/2 translate-x-1/2" style={{ background: "rgba(255,255,255,0.05)" }} aria-hidden="true" />
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10 relative z-10">
          <Link to="/home">
            <button className={`flex items-center gap-2 text-sm mb-4 transition-colors ${isHC ? 'text-[#ffff00]' : 'text-white/70 hover:text-white'}`}>
              <ArrowLeft className="h-4 w-4" />Kembali
            </button>
          </Link>
          <h1 className={`text-2xl md:text-3xl font-bold mb-3 ${isHC ? 'text-[#ffff00]' : 'text-white'}`}>Hasil Rekomendasi</h1>
          
          {/* SEARCH BOX */}
          <div className="rounded-xl p-4 mt-4" style={searchBoxStyle}>
            <div className="flex items-center gap-3">
              <div className="flex-1 flex items-center gap-3 rounded-lg px-4 py-2.5" style={searchInputStyle}>
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isHC ? 'bg-[#ffff00]' : 'bg-emerald-400'}`} />
                <input 
                  value={originName} onChange={(e) => setOriginName(e.target.value)}
                  placeholder="Ketik halte asal..."
                  className={`bg-transparent text-sm outline-none w-full ${isHC ? 'text-white placeholder:text-white/60' : 'text-white placeholder:text-white/40'}`} 
                />
              </div>
              <span className="text-white/40 text-lg flex-shrink-0">→</span>
              <div className="flex-1 flex items-center gap-3 rounded-lg px-4 py-2.5" style={searchInputStyle}>
                <span className="w-2 h-2 rounded-full bg-rose-400 flex-shrink-0" />
                <input 
                  value={destinationName} onChange={(e) => setDestinationName(e.target.value)}
                  placeholder="Ketik halte tujuan..."
                  className="bg-transparent text-white text-sm outline-none w-full placeholder:text-white/40" 
                />
              </div>
              <button onClick={handleSearchAgain} className={`font-bold text-sm px-5 py-2.5 rounded-lg hover:-translate-y-0.5 transition-all flex-shrink-0 ${isHC ? 'bg-[#ffff00] text-black' : 'bg-white text-[hsl(186,100%,27%)]'}`}>
                Cari
              </button>
            </div>
          </div>
        </div>
      </section>

      <main className="flex-grow px-4 py-8">
        <div className="mx-auto max-w-3xl">
          {loading ? (
            <div className="flex justify-center items-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : errorMsg ? (
            <div className="text-center py-16">
              <div className="text-4xl mb-4">🔍</div>
              <div className="font-bold text-lg mb-2 text-rose-500">{errorMsg}</div>
              <Link to="/home"><Button variant="outline">Kembali ke Beranda</Button></Link>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{routes.length} opsi perjalanan</span>
                  <span className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full font-semibold">Filter: {filterInfo}</span>
                </div>
              </div>

              <div className="space-y-4">
                {routes.map((route, routeIndex) => {
                  // MENGAMBIL SEMUA KENDARAAN DARI SEMUA LEGS (Transit maupun Direct)
                  const allTransports = route.legs.flatMap(leg => leg.transports);
                  const totalStopsPassed = route.legs.reduce((acc, leg) => acc + leg.stops_passed, 0);
                  const isExpanded = expandedCard === routeIndex;
                  
                  // CEK FASILITAS GABUNGAN
                  const combinedFacilities = {
                      low_entry: allTransports.every(t => t.facilities.low_entry),
                      wheelchair_slot: allTransports.every(t => t.facilities.wheelchair_slot),
                      priority_seat: allTransports.every(t => t.facilities.priority_seat),
                      women_area: allTransports.every(t => t.facilities.women_area)
                  };

                  const facilityTips = getFacilityTips(filterInfo, combinedFacilities);
                  const categoryAdvice = getCategoryAdvice(filterInfo, allTransports);
                  
                  // AMBIL TITIK AWAL DAN AKHIR DARI LEGS
                  const firstStop = route.legs[0].origin_stop;
                  const finalStop = route.legs[route.legs.length - 1].destination_stop;

                  return (
                    <div key={routeIndex} className="bg-card rounded-2xl border border-border shadow-sm hover:shadow-md transition-all overflow-hidden">
                      
                      {!route.is_recommended && (
                        <div className="bg-rose-100 text-rose-700 text-xs px-5 py-2 font-bold flex items-center gap-2">
                          <AlertCircle className="h-4 w-4" /> Rute alternatif: Kurang memenuhi kriteria profil Anda.
                        </div>
                      )}
                      
                      {route.route_type === "transit" && (
                        <div className="bg-indigo-100 text-indigo-700 text-xs px-5 py-1.5 font-bold flex items-center gap-2">
                           Rute Transit ({route.legs.length - 1}x pindah kendaraan)
                        </div>
                      )}

                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                         //   <div className="flex -space-x-3">
                              {allTransports.map((t, i) => (
                                <div key={i} className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-2xl border-2 border-white shadow-sm" title={t.name}>
                                  {getTransportIcon(t.type)}
                                </div>
                              ))}
                            </div>
                            <div>
                              <div className="font-bold text-base leading-tight">
                                {route.route_type === "transit" ? "Perjalanan Transit" : route.legs[0].route_name}
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                {allTransports.map(t => t.name).join(" ➔ ")}
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="text-2xl font-bold text-primary">{route.total_estimated_time} mnt</div>
                            <div className="text-[10px] uppercase text-muted-foreground">{totalStopsPassed} halte</div>
                          </div>
                        </div>

                        {/* Rangkuman Halte */}
                        <div className="flex items-center gap-2 mb-4 text-sm">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                          <span className="font-medium">{firstStop}</span>
                          <div className="flex-1 border-t-2 border-dashed border-border mx-2" />
                          <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                          <span className="font-medium">{finalStop}</span>
                        </div>

                        {/* Tips Fasilitas */}
                        <div className="flex flex-wrap gap-2 mb-4">
                          {facilityTips.map((tip, i) => (
                            <span key={i} className={`text-xs px-2.5 py-1 rounded-full font-semibold ${tip.color}`}>{tip.icon} {tip.label}</span>
                          ))}
                        </div>

                        {/* Bottom Actions */}
                        <div className="flex items-center justify-between pt-4 border-t border-border">
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{route.total_estimated_time} mnt</div>
                            <span>·</span>
                            <div className="flex items-center gap-1"><Bus className="h-3.5 w-3.5" />{totalStopsPassed} halte</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button onClick={() => setExpandedCard(isExpanded ? null : routeIndex)} className="flex items-center gap-1 text-xs text-primary font-semibold hover:underline">
                              {isExpanded ? <><ChevronUp className="h-3.5 w-3.5" />Tutup Detail</> : <><ChevronDown className="h-3.5 w-3.5" />Lihat Detail</>}
                            </button>
                            <Button onClick={() => handleSelectRoute(route)} size="sm" className="h-8 px-5 text-xs font-bold">Pilih Rute</Button>
                          </div>
                        </div>
                      </div>

                      {/* Dropdown Detail Perjalanan (Support Transit & Direct) */}
                      {isExpanded && (
                        <div className="border-t border-border px-6 py-5 bg-muted/30 rounded-b-2xl">
                          {categoryAdvice && (
                            <div className="mb-4 p-3 rounded-xl bg-primary/5 border border-primary/15 text-sm text-primary font-medium">
                              {categoryAdvice}
                            </div>
                          )}

                          <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Detail Perjalanan</div>
                          
                          <div className="relative">
                            <div className="absolute left-[9px] top-3 bottom-3 w-px bg-border" />
                            <div className="space-y-4">
                              {route.legs.map((leg, legIndex) => (
                                <div key={legIndex} className="relative z-10 pl-8">
                                  <span className="absolute left-0 w-5 h-5 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center mt-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                                  </span>
                                  
                                  <div className="bg-background rounded-lg p-3 border border-border shadow-sm">
                                    <div className="text-xs text-muted-foreground font-semibold mb-1">
                                      Langkah {leg.step}: Naik {leg.route_name}
                                    </div>
                                    <div className="text-sm">
                                      Dari <b>{leg.origin_stop}</b> ke <b>{leg.destination_stop}</b>
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-2 flex gap-2">
                                      <span>⏳ {leg.estimated_time_minutes} mnt</span>
                                      <span>📍 Melewati {leg.stops_passed} halte</span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                              
                              <div className="relative z-10 pl-8">
                                <span className="absolute left-0 w-5 h-5 rounded-full bg-rose-500 flex items-center justify-center mt-1">
                                  <span className="w-2 h-2 rounded-full bg-white" />
                                </span>
                                <div className="text-sm font-bold text-rose-600 mt-1">
                                  Sampai di Tujuan: {finalStop}
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