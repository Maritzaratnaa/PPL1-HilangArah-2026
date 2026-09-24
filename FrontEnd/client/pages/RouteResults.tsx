import { useEffect, useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { useIsHighContrast } from "@/hooks/useTheme";
import {
  ArrowLeft, Clock, Loader2, ChevronDown, ChevronUp, AlertCircle,
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
  has_ramp?: boolean;
  has_elevator?: boolean;
}

interface JourneyLeg {
  step: number;
  route_name: string;
  origin_stop: string;
  destination_stop: string;
  transports: Transport[];
  stops_passed?: number;
  estimated_time_minutes: number;
  fare?: number;
  route_path: TransitStop[];
}

interface RouteResult {
  route_type: "direct" | "transit";
  total_estimated_time: number;
  total_cost?: number;     
  total_stops_passed?: number;
  is_recommended: boolean;
  is_best?: boolean; 
  legs: JourneyLeg[];
}

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

function formatCost(cost?: number): string {
  if (!cost && cost !== 0) return '-';
  return `Rp ${cost.toLocaleString('id-ID')}`;
}

function getFacilityTips(category: string, facilities: Facility) {
  const tips: { label: string; color: string }[] = [];
  if (!facilities) return tips;
  const safeCategory = (category || "").trim().toLowerCase();
  if (["wanita", "perempuan", "women"].includes(safeCategory)) {
    if (facilities.women_area) tips.push({ label: "Area Wanita", color: "bg-pink-100 text-pink-700 dark:bg-pink-950/30 dark:text-pink-300" });
  } else if (["ibu hamil", "pregnant"].includes(safeCategory)) {
    if (facilities.women_area) tips.push({ label: "Area Wanita", color: "bg-pink-100 text-pink-700 dark:bg-pink-950/30 dark:text-pink-300" });
    if (facilities.priority_seat) tips.push({ label: "Kursi Prioritas", color: "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300" });
  } else if (["disabilitas", "disability", "tunanetra", "tuli", "pengguna kursi roda"].includes(safeCategory)) {
    if (facilities.low_entry) tips.push({ label: "Low Entry", color: "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300" });
    if (facilities.wheelchair_slot) tips.push({ label: "Slot Kursi Roda", color: "bg-purple-100 text-purple-700 dark:bg-purple-950/30 dark:text-purple-300" });
  } else if (["lansia", "elderly", "penyakit rentan", "vulnerable", "anak-anak", "children"].includes(safeCategory)) {
    if (facilities.priority_seat) tips.push({ label: "Kursi Prioritas", color: "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300" });
  }
  return tips;
}

function StopBadges({ has_ramp, has_elevator, category }: { has_ramp?: boolean; has_elevator?: boolean; category: string }) {
  const safeCategory = (category || "").trim().toLowerCase();
  let showRamp = false, showElevator = false;
  if (["disabilitas", "disability", "tunanetra", "tuli", "pengguna kursi roda"].includes(safeCategory)) { showRamp = true; showElevator = true; }
  else if (["lansia", "elderly", "ibu hamil", "pregnant", "penyakit rentan", "vulnerable"].includes(safeCategory)) { showElevator = true; }
  const badges = [];
  if (showRamp && has_ramp) badges.push({ icon: "♿", label: "Ramp", color: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300" });
  if (showElevator && has_elevator) badges.push({ icon: "🛗", label: "Lift", color: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300" });
  if (badges.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5 mt-1.5">
      {badges.map((b, i) => (
        <span key={i} className={`text-[10px] px-2 py-0.5 rounded-md font-bold border ${b.color}`}>{b.icon} {b.label}</span>
      ))}
    </div>
  );
}

function getCategoryAdvice(category: string, transports: Transport[]): string | null {
  if (!transports || transports.length === 0) return null;
  const safeCategory = (category || "").trim().toLowerCase();
  const hasWomenAreaAll = transports.every(t => t.facilities.women_area);
  const hasWheelchairAll = transports.every(t => t.facilities.wheelchair_slot);
  const hasLowEntryAll = transports.every(t => t.facilities.low_entry);
  const hasPriorityAll = transports.every(t => t.facilities.priority_seat);
  switch (safeCategory) {
    case "disabilitas": case "disability":
      if (hasWheelchairAll) return "Seluruh armada rute ini memiliki slot khusus kursi roda.";
      if (hasLowEntryAll) return "Seluruh armada menggunakan low entry sehingga mudah dinaiki.";
      return "Rute ini telah disesuaikan dengan kriteria aksesibilitas.";
    case "lansia": case "elderly": case "ibu hamil": case "pregnant": case "penyakit rentan": case "vulnerable": case "anak-anak": case "children":
      if (hasPriorityAll) return "Tersedia kursi prioritas pada seluruh armada rute ini.";
      return "Tersedia kursi prioritas untuk kenyamanan perjalanan Anda.";
    case "wanita": case "perempuan": case "women":
      if (hasWomenAreaAll) return "Tersedia area khusus wanita pada seluruh armada rute ini.";
      return "Tersedia area khusus wanita (cek detail per armada).";
    default: return null;
  }
}

function getTransportIcon(type: string): string {
  const icons: Record<string, string> = { Bus: "🚌", MRT: "🚇", LRT: "🚅", Train: "🚆" };
  return icons[type] || "🚍";
}

export default function RouteResults() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isHC = useIsHighContrast();

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
    if (!token) { navigate("/login"); return; }
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
          setFilterInfo(json.filter_applied ? json.filter_applied : "Umum");
        } else {
          setErrorMsg(json.message);
        }
      } catch {
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
    navigate("/route-map", { state: { selectedRoute: route, filterCategory: filterInfo } });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <section className="relative overflow-hidden"
        style={{ background: isHC ? "#000" : "linear-gradient(135deg, hsl(186 100% 27%) 0%, hsl(186 100% 18%) 100%)" }}>
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 relative z-10">
          <Link to="/home">
            <button className="flex items-center gap-2 text-white/70 hover:text-white text-sm mb-4 transition-colors">
              <ArrowLeft className="h-4 w-4" /> Kembali
            </button>
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-4">Hasil Rekomendasi</h1>
          <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.1)", border: "1.5px solid rgba(255,255,255,0.18)" }}>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="flex-1 flex items-center gap-2 rounded-lg px-3 py-2.5" style={{ background: "rgba(255,255,255,0.12)", border: "1.5px solid rgba(255,255,255,0.2)" }}>
                <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
                <input value={originName} onChange={(e) => setOriginName(e.target.value)} placeholder="Halte asal..." className="bg-transparent text-white text-sm outline-none w-full placeholder:text-white/40" />
              </div>
              <span className="text-white/40 text-lg hidden sm:block">→</span>
              <div className="flex-1 flex items-center gap-2 rounded-lg px-3 py-2.5" style={{ background: "rgba(255,255,255,0.12)", border: "1.5px solid rgba(255,255,255,0.2)" }}>
                <span className="w-2 h-2 rounded-full bg-rose-400 flex-shrink-0" />
                <input value={destinationName} onChange={(e) => setDestinationName(e.target.value)} placeholder="Halte tujuan..." className="bg-transparent text-white text-sm outline-none w-full placeholder:text-white/40" />
              </div>
              <button onClick={handleSearchAgain} className="bg-white font-bold text-sm px-5 py-2.5 rounded-lg hover:-translate-y-0.5 transition-all w-full sm:w-auto" style={{ color: "hsl(186 100% 27%)" }}>
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
        <div className="mx-auto max-w-4xl">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : errorMsg ? (
            <div className="text-center py-16">
              <div className="text-4xl mb-4">🔍</div>
              <div className="font-bold text-lg mb-2 text-rose-500">{errorMsg}</div>
              <div className="text-sm text-muted-foreground mb-6">Silakan periksa kembali nama halte.</div>
              <Link to="/home"><Button variant="outline">Kembali ke Beranda</Button></Link>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-6">
                <span className="text-sm font-semibold">{routes.length} opsi perjalanan</span>
                <span className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full font-semibold">
                  Filter: {filterInfo}
                </span>
              </div>

              <div className="space-y-4">
                {routes.map((route, routeIndex) => {
                  const allTransports = route.legs.flatMap(leg => leg.transports);
                  const isExpanded = expandedCard === routeIndex;
                  const combinedFacilities: Facility = {
                    low_entry: allTransports.some(t => t.facilities.low_entry),
                    wheelchair_slot: allTransports.some(t => t.facilities.wheelchair_slot),
                    priority_seat: allTransports.some(t => t.facilities.priority_seat),
                    women_area: allTransports.some(t => t.facilities.women_area),
                  };
                  const facilityTips = getFacilityTips(filterInfo, combinedFacilities);
                  const categoryAdvice = getCategoryAdvice(filterInfo, allTransports);
                  const firstStop = route.legs[0].origin_stop;
                  const finalStop = route.legs[route.legs.length - 1].destination_stop;

                  const isBest = route.is_best ?? (routeIndex === 0 && route.is_recommended);

                  return (
                    <div key={routeIndex} className={`bg-card rounded-2xl border shadow-sm hover:shadow-md transition-all overflow-hidden ${
                      isBest ? 'border-primary/40 ring-1 ring-primary/20' : 'border-border'
                    }`}>

                      {isBest && (
                        <div className={`px-5 py-2 flex items-center gap-2 text-xs font-bold ${
                          isHC ? 'bg-[#ffff00] text-black' : 'bg-primary text-primary-foreground'
                        }`}>
                          ⭐ Rute Terbaik
                        </div>
                      )}

                      {!isBest && !route.is_recommended && (
                        <div className="bg-rose-100 text-rose-700 text-xs px-5 py-2 font-bold flex items-start sm:items-center gap-2">
                          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5 sm:mt-0" />
                          <span>Rute alternatif: Kurang memenuhi kriteria profil Anda.</span>
                        </div>
                      )}

                      {!isBest && route.is_recommended && (
                        <div className="bg-muted/60 text-muted-foreground text-xs px-5 py-2 font-semibold flex items-center gap-2">
                          <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" /> Rute Alternatif
                        </div>
                      )}

                      {route.route_type === "transit" && (
                        <div className="bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 text-xs px-5 py-1.5 font-bold flex items-center gap-2 border-t border-indigo-100 dark:border-indigo-900">
                          🔄 Rute Transit ({route.legs.length - 1}x pindah kendaraan)
                        </div>
                      )}

                      <div className="p-4 sm:p-6">
                        <div className="flex items-start justify-between mb-4 gap-2">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="flex -space-x-2 flex-shrink-0">
                              {allTransports.map((t, i) => (
                                <div key={i} className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-xl sm:text-2xl border-2 border-white dark:border-background shadow-sm" title={t.name}>
                                  {getTransportIcon(t.type)}
                                </div>
                              ))}
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-sm sm:text-base leading-tight truncate">
                                {route.route_type === "transit" ? "Perjalanan Transit" : route.legs[0].route_name}
                              </div>
                              <div className="text-xs font-semibold text-muted-foreground mt-1 truncate">
                                {allTransports.map(t => t.name).join(" ➔ ")}
                              </div>
                            </div>
                          </div>

                          <div className="text-right flex-shrink-0">
                            <div className="text-xl sm:text-2xl font-bold text-primary">
                              {route.total_estimated_time} <span className="text-sm font-semibold">mnt</span>
                            </div>
                            {route.total_cost !== undefined && (
                              <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                                {formatCost(route.total_cost)}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 mb-4 text-xs sm:text-sm font-semibold">
                          <div className="flex items-center gap-1.5 flex-shrink-0 max-w-[40%]">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 flex-shrink-0" />
                            <span className="truncate">{firstStop}</span>
                          </div>
                          <div className="flex-1 border-t-2 border-dashed border-border mx-1" />
                          <div className="flex items-center gap-1.5 flex-shrink-0 max-w-[40%] justify-end">
                            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 flex-shrink-0" />
                            <span className="truncate text-right">{finalStop}</span>
                          </div>
                        </div>

                        {facilityTips.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-4">
                            {facilityTips.map((tip, i) => (
                              <span key={i} className={`text-[11px] sm:text-xs px-2.5 py-1 rounded-full font-bold border border-transparent shadow-sm ${tip.color}`}>
                                {tip.label}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-4 border-t border-border gap-3">
                          <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground flex-wrap">
                            <div className="flex items-center gap-1.5 bg-muted px-2.5 py-1 rounded-md">
                              <Clock className="h-3.5 w-3.5 text-primary" /> {route.total_estimated_time} Menit
                            </div>
                            {route.total_cost !== undefined && (
                              <div className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 px-2.5 py-1 rounded-md">
                                💳 {formatCost(route.total_cost)}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
                            <button onClick={() => setExpandedCard(isExpanded ? null : routeIndex)} className="flex items-center gap-1 text-xs text-primary font-bold hover:underline">
                              {isExpanded ? <><ChevronUp className="h-4 w-4" />Tutup Detail</> : <><ChevronDown className="h-4 w-4" />Lihat Detail</>}
                            </button>
                            <Button onClick={() => handleSelectRoute(route)} size="sm" className="h-9 px-6 text-sm font-bold rounded-lg shadow-sm">
                              Pilih Rute
                            </Button>
                          </div>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="border-t border-border px-4 sm:px-6 py-5 sm:py-6 bg-muted/20 rounded-b-2xl">
                          {categoryAdvice && (
                            <div className="mb-5 p-4 rounded-xl bg-primary/5 border border-primary/20 text-sm text-primary font-semibold">
                              {categoryAdvice}
                            </div>
                          )}
                          <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Detail Perjalanan</div>
                          <div className="relative">
                            <div className="absolute left-[9px] top-3 bottom-3 w-[2px] bg-border/60" />
                            <div className="space-y-6">
                              {route.legs.map((leg, legIndex) => {
                                const path = leg.route_path || [];
                                const isReversed = path.length > 1 && path[path.length - 1].stop_name === leg.origin_stop;
                                const orderedPath = isReversed ? [...path].reverse() : path;
                                const displayStops = orderedPath.filter((_, sIdx) => sIdx === 0 || sIdx === orderedPath.length - 1);
                                return (
                                  <div key={legIndex} className="relative z-10 pl-6 sm:pl-8">
                                    <span className="absolute left-0 w-5 h-5 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center mt-1.5 ml-[-1px]">
                                      <span className="w-2 h-2 rounded-full bg-primary" />
                                    </span>
                                    <div className="bg-background rounded-xl border border-border shadow-sm overflow-hidden">
                                      <div className="bg-muted/40 p-3 sm:p-3.5 border-b border-border flex items-center justify-between">
                                        <div className="text-[11px] sm:text-xs text-primary font-bold uppercase tracking-wide">
                                          Langkah {leg.step}: Naik {leg.route_name}
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <div className="text-[10px] sm:text-xs font-bold text-muted-foreground flex items-center gap-1.5 bg-background px-2.5 py-1 rounded-md border border-border/50 shadow-sm">
                                            <Clock className="w-3.5 h-3.5" /> {leg.estimated_time_minutes} mnt
                                          </div>
                                          {leg.fare !== undefined && (
                                            <div className="text-[10px] sm:text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-1 rounded-md border border-emerald-200 dark:border-emerald-800 shadow-sm">
                                              {formatCost(leg.fare)}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                      <div className="p-4 sm:p-5 relative">
                                        {displayStops.length > 1 && (
                                          <div className="absolute left-[21px] sm:left-[26px] top-8 bottom-8 w-0.5 bg-border/60 border-l-2 border-dashed border-border" />
                                        )}
                                        <div className="space-y-6">
                                          {displayStops.map((stop, sIdx) => {
                                            const isFirst = sIdx === 0;
                                            return (
                                              <div key={sIdx} className="relative z-10 flex gap-3 sm:gap-4">
                                                <div className="flex flex-col items-center mt-1">
                                                  <span className={`w-3 h-3 rounded-full ring-4 ring-background shadow-sm ${isFirst ? 'bg-emerald-500' : 'bg-indigo-500'}`} />
                                                </div>
                                                <div className="-mt-0.5">
                                                  <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">
                                                    {isFirst ? 'Naik Dari' : 'Turun Di'}
                                                  </div>
                                                  <div className="text-sm font-bold text-foreground">{stop.stop_name}</div>
                                                  <StopBadges has_ramp={stop.has_ramp} has_elevator={stop.has_elevator} category={filterInfo} />
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                              <div className="relative z-10 pl-6 sm:pl-8 pt-2">
                                <span className="absolute left-0 w-5 h-5 rounded-full bg-rose-500 flex items-center justify-center mt-1 ml-[-1px]">
                                  <span className="w-2 h-2 rounded-full bg-white" />
                                </span>
                                <div className="text-xs sm:text-sm font-bold text-rose-600 mt-1 bg-rose-50 dark:bg-rose-950/30 px-3 sm:px-4 py-2.5 rounded-xl border border-rose-200 inline-block shadow-sm">
                                  Tiba di Tujuan Akhir: {finalStop}
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