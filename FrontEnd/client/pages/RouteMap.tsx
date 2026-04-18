import { useLocation, useNavigate } from "react-router-dom";
import { useState, useCallback, useRef, useEffect } from "react";
import { GoogleMap, useJsApiLoader, DirectionsService, DirectionsRenderer } from "@react-google-maps/api";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, MapPin } from "lucide-react";

const containerStyle = { width: '100%', height: '100%' };

// --- INTERFACES ---
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

// --- HELPER FUNCTIONS ---
function getTransportIcon(type: string) {
  const icons: Record<string, string> = { Bus: "🚌", MRT: "🚇", KRL: "🚈", LRT: "🚅" };
  return icons[type] || "🚍";
}

// Badge Rekomendasi di Header
function getAccessibilityBadge(facilities: Facility, category: string) {
  const safeCategory = (category || "").trim().toLowerCase();
  if (safeCategory === "wanita" || safeCategory === "perempuan" || safeCategory === "women") return null;

  if (facilities?.wheelchair_slot && facilities?.low_entry) {
    return { label: "♿ Aksesibel Penuh", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300" };
  } else if (facilities?.priority_seat) {
    return { label: "🪑 Sebagian Aksesibel", color: "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300" };
  }
  return { label: "Standar", color: "bg-muted text-muted-foreground" };
}

// Badge Fasilitas Kendaraan (Dimunculkan semua yang bernilai true)
function getFacilityTips(facilities: Facility) {
  const tips: { icon: string; label: string; color: string }[] = [];
  if (!facilities) return tips;

  if (facilities.women_area) {
    tips.push({ icon: "👩", label: "Area Wanita", color: "bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-950/30 dark:text-pink-300" });
  }
  if (facilities.low_entry) {
    tips.push({ icon: "🚌", label: "Low Entry", color: "bg-green-100 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-300" });
  }
  if (facilities.wheelchair_slot) {
    tips.push({ icon: "♿", label: "Slot Kursi Roda", color: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300" });
  }
  if (facilities.priority_seat) {
    tips.push({ icon: "🪑", label: "Kursi Prioritas", color: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-950/30 dark:text-orange-300" });
  }
  return tips;
}

// Saran Teks Berdasarkan Kategori
function getCategoryAdvice(category: string, transports: Transport[]): string | null {
  const safeCategory = (category || "").trim().toLowerCase();
  const hasWomenAreaAll = transports.every(t => t.facilities?.women_area);
  const hasWheelchairAll = transports.every(t => t.facilities?.wheelchair_slot);
  const hasLowEntryAll = transports.every(t => t.facilities?.low_entry);
  const hasPriorityAll = transports.every(t => t.facilities?.priority_seat);

  switch (safeCategory) {
    case "disabilitas":
    case "disability":
      if (hasWheelchairAll) return "✅ Seluruh armada rute ini memiliki slot khusus kursi roda.";
      if (hasLowEntryAll) return "✅ Seluruh armada menggunakan low entry sehingga mudah dinaiki.";
      return "✅ Rute ini telah disesuaikan dengan kriteria aksesibilitas armada.";
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
      return "⚠️ Area khusus wanita mungkin tidak tersedia di salah satu armada transit.";
    default:
      return null;
  }
}

// Komponen Badge Fasilitas Halte (Titik Abu-Abu)
function StopBadges({ has_ramp, has_elevator, category }: { has_ramp?: boolean; has_elevator?: boolean; category: string }) {
  const safeCategory = (category || "").trim().toLowerCase();
  if (safeCategory === "wanita" || safeCategory === "perempuan" || safeCategory === "women") return null; 

  const badges = [];
  if (has_ramp) badges.push({ icon: "♿", label: "Ramp", color: "bg-emerald-100 text-emerald-700" });
  if (has_elevator) badges.push({ icon: "🛗", label: "Elevator", color: "bg-blue-100 text-blue-700" });

  if (badges.length === 0) {
    return (
      <div className="flex gap-1 mt-1">
        <span className="text-[9px] px-2 py-0.5 rounded-full font-semibold bg-muted text-muted-foreground/70 border border-border">
          ⚠️ Tanpa Fasilitas
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {badges.map((b, i) => (
        <span key={i} className={`text-[9px] px-2 py-0.5 rounded-full font-semibold ${b.color}`}>
          {b.icon} {b.label}
        </span>
      ))}
    </div>
  );
}

// --- MAIN COMPONENT ---
export default function RouteMap() {
  const location = useLocation();
  const navigate = useNavigate();
  const selectedRoute = location.state?.selectedRoute as RouteResult | undefined;
  const filterCategory = location.state?.filterCategory || "";

  const [response, setResponse] = useState<google.maps.DirectionsResult | null>(null);

  const isMapsEnabled = import.meta.env.VITE_ENABLE_MAPS === 'true';
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: isMapsEnabled ? import.meta.env.VITE_GOOGLE_MAPS_API_KEY : "",
    libraries: ["places"],
  });

  const directionsCallback = useCallback((res: google.maps.DirectionsResult | null, status: google.maps.DirectionsStatus) => {
    if (res !== null && status === 'OK' && !response) {
      setResponse(res);
    }
  }, [response]);

  // Panel Resize Logic
  const MIN_WIDTH = 280;
  const MAX_WIDTH = 640;
  const DEFAULT_WIDTH = 384;
  const [panelWidth, setPanelWidth] = useState(DEFAULT_WIDTH);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(DEFAULT_WIDTH);

  const onMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    startX.current = e.clientX;
    startWidth.current = panelWidth;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const delta = e.clientX - startX.current;
      setPanelWidth(Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidth.current + delta)));
    };
    const onMouseUp = () => {
      if (!isDragging.current) return;
      isDragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  if (!selectedRoute || !selectedRoute.legs) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Silakan pilih rute terlebih dahulu.</p>
        <Button onClick={() => navigate('/home')}>Kembali</Button>
      </div>
    );
  }

  // Data Extraction
  const firstLeg = selectedRoute.legs[0];
  const lastLeg = selectedRoute.legs[selectedRoute.legs.length - 1];
  const firstStopName = firstLeg.origin_stop;
  const finalStopName = lastLeg.destination_stop;

  const allTransports = selectedRoute.legs.flatMap(leg => leg.transports);
  const totalStopsPassed = selectedRoute.legs.reduce((acc, leg) => acc + leg.stops_passed, 0);
  
  const originLat = firstLeg.route_path?.[0]?.latitude;
  const originLng = firstLeg.route_path?.[0]?.longitude;
  const destLat = lastLeg.route_path?.[lastLeg.route_path.length - 1]?.latitude;
  const destLng = lastLeg.route_path?.[lastLeg.route_path.length - 1]?.longitude;

  const mapOrigin = originLat && originLng ? { lat: parseFloat(originLat.toString()), lng: parseFloat(originLng.toString()) } : `${firstStopName}, Jakarta`;
  const mapDestination = destLat && destLng ? { lat: parseFloat(destLat.toString()), lng: parseFloat(destLng.toString()) } : `${finalStopName}, Jakarta`;

  const firstFacilities = allTransports[0]?.facilities || { low_entry: false, wheelchair_slot: false, priority_seat: false, women_area: false };
  const accessBadge = getAccessibilityBadge(firstFacilities, filterCategory);
  const categoryAdvice = getCategoryAdvice(filterCategory, allTransports);

  return (
    <div className="min-h-screen flex flex-col bg-background max-h-screen overflow-hidden">
      <main className="flex-grow flex flex-col md:flex-row h-[calc(100vh-64px)]">
        
        {/* === LEFT PANEL (TIMELINE) === */}
        <div className="relative hidden md:flex flex-col bg-card border-r border-border shadow-lg z-20 overflow-hidden flex-shrink-0" style={{ width: panelWidth }}>
          
          {/* Header */}
          <div className="p-5 border-b border-border bg-muted/20 flex-shrink-0">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-3 -ml-2 text-muted-foreground">
              <ArrowLeft className="h-4 w-4 mr-2" /> Kembali ke Hasil
            </Button>

            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {selectedRoute.legs.map((leg, i) => (
                    <div key={i} className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-xl border-2 border-card shadow-sm flex-shrink-0">
                      {getTransportIcon(leg.transports[0]?.type || "Bus")}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="font-bold text-base leading-tight">
                    {selectedRoute.route_type === "transit" ? "Perjalanan Transit" : firstLeg.route_name}
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-1">
                    {selectedRoute.legs.map((leg) => leg.route_name).join(" ➔ ")}
                  </div>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-2xl font-bold text-primary">{selectedRoute.total_estimated_time} mnt</div>
                <div className="text-[10px] uppercase tracking-tighter text-muted-foreground">{totalStopsPassed} halte</div>
              </div>
            </div>

            {/* Titik Awal -> Tujuan Akhir Line */}
            <div className="flex items-center gap-2 mb-4 text-sm">
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 flex-shrink-0" />
                <span className="font-medium truncate max-w-[110px]">{firstStopName}</span>
              </div>
              <div className="flex-1 border-t-2 border-dashed border-border mx-1" />
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 flex-shrink-0" />
                <span className="font-medium truncate max-w-[110px]">{finalStopName}</span>
              </div>
            </div>

            {/* Badge Rekomendasi Utama */}
            <div className="flex flex-wrap gap-1.5">
              {accessBadge && (
                <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${accessBadge.color}`}>
                  {accessBadge.label}
                </span>
              )}
            </div>
          </div>

          {/* Scrollable Body: TIMELINE */}
          <div className="flex-grow overflow-y-auto p-5">
            {categoryAdvice && (
              <div className="mb-5 p-3 rounded-xl bg-primary/5 border border-primary/15 text-sm text-primary font-medium">
                {categoryAdvice}
              </div>
            )}

            <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">
              Rute Perjalanan
            </div>

            <div className="relative">
              {/* Garis Vertikal Utama */}
              <div className="absolute left-[9px] top-3 bottom-3 w-px bg-border" />

              <div className="space-y-0">
                
                {/* 1. TITIK AWAL */}
                <div className="flex items-start gap-3 relative pb-4">
                  <span className="w-5 h-5 rounded-full bg-emerald-500 z-10 flex items-center justify-center mt-1 ring-4 ring-background">
                    <span className="w-2 h-2 bg-white rounded-full" />
                  </span>
                  <div className="bg-background rounded-lg px-3 py-2 border border-border flex-1 shadow-sm">
                    <div className="text-[10px] text-muted-foreground uppercase font-bold">Titik Awal</div>
                    <div className="text-sm font-semibold">{firstStopName}</div>
                  </div>
                </div>

                {/* 2. LOOP PER LEG */}
                {selectedRoute.legs.map((leg, legIdx) => {
                  
                  // Sorting manual untuk halte (jika mundur)
                  const path = leg.route_path || [];
                  const isReversed = path.length > 1 && path[path.length - 1].stop_name === leg.origin_stop;
                  const orderedPath = isReversed ? [...path].reverse() : path;
                  
                  // Ambil halte di tengah saja (buang awal dan akhir dari leg ini)
                  const intermediateStops = orderedPath.slice(1, -1);

                  return (
                    <div key={legIdx}>
                      
                      {/* --- KOTAK INFO KENDARAAN --- */}
                      {leg.transports.map((t, tIdx) => (
                        <div key={tIdx} className="flex items-start gap-3 relative pb-6">
                          {/* Garis putus-putus untuk area kendaraan */}
                          <div className="absolute left-[9px] top-0 bottom-0 w-0.5 border-l-2 border-dashed border-muted-foreground/30 ml-[-1px]"></div>
                          
                          <div className="bg-card rounded-2xl p-4 border shadow-sm flex-1 ml-6 relative overflow-hidden">
                            {/* Aksen warna di kiri kotak */}
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>
                            
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-xl">{getTransportIcon(t.type)}</span>
                              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                Naik {leg.route_name}
                              </span>
                            </div>

                            <div className="text-sm font-extrabold mb-3">{t.name}</div>

                            {/* Label Fasilitas Kendaraan */}
                            <div className="flex flex-wrap gap-2">
                              {getFacilityTips(t.facilities).map((facility, i) => (
                                <div key={i} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold shadow-sm ${facility.color}`}>
                                  <span>{facility.icon}</span> {facility.label}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* --- DAFTAR HALTE YANG DILEWATI (Tanpa Kotak) --- */}
                      {intermediateStops.length > 0 && (
                        <div className="relative pb-4 space-y-3">
                          {intermediateStops.map((stop, sIdx) => (
                            <div key={sIdx} className="flex items-start gap-3 relative">
                              {/* Titik kecil abu-abu */}
                              <span className="w-5 h-5 z-10 flex items-center justify-center mt-0.5 bg-background">
                                <span className="w-2 h-2 bg-muted-foreground/40 rounded-full" />
                              </span>
                              <div className="flex-1 mt-0.5">
                                <div className="text-xs font-semibold text-muted-foreground/80 leading-tight">
                                  {stop.stop_name}
                                </div>
                                {/* Badge fasilitas Halte (Ramp/Elevator) */}
                                <StopBadges has_ramp={stop.has_ramp} has_elevator={stop.has_elevator} category={filterCategory} />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* --- HALTE TRANSIT (Hanya muncul jika bukan leg terakhir) --- */}
                      {legIdx < selectedRoute.legs.length - 1 && (
                        <div className="flex items-start gap-3 relative pb-4 pt-2">
                          <span className="w-5 h-5 rounded-full bg-blue-500 z-10 flex items-center justify-center mt-1 ring-4 ring-background">
                            <span className="w-2 h-2 bg-white rounded-full" />
                          </span>
                          <div className="bg-blue-50/50 dark:bg-blue-950/20 rounded-lg px-3 py-2 border border-blue-200 dark:border-blue-900 flex-1 shadow-sm">
                            <div className="flex items-center gap-1 text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400">
                              <MapPin className="w-3 h-3" /> Transit / Pindah Rute
                            </div>
                            <div className="text-sm font-semibold">{leg.destination_stop}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* 3. TITIK TUJUAN AKHIR */}
                <div className="flex items-start gap-3 relative pt-1">
                  <span className="w-5 h-5 rounded-full bg-rose-500 z-10 flex items-center justify-center mt-1 ring-4 ring-background">
                    <span className="w-2 h-2 bg-white rounded-full" />
                  </span>
                  <div className="bg-background rounded-lg px-3 py-2 border border-border flex-1 shadow-sm">
                    <div className="text-[10px] text-muted-foreground uppercase font-bold text-rose-600">Tujuan Akhir</div>
                    <div className="text-sm font-semibold">{finalStopName}</div>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* Drag Handle */}
          <div onMouseDown={onMouseDown} className="absolute top-0 right-0 h-full w-4 flex items-center justify-center cursor-col-resize z-30 group">
            <div className="h-16 w-1.5 rounded-full bg-border group-hover:bg-primary/60 group-active:bg-primary transition-all duration-150" />
          </div>
        </div>

        {/* === RIGHT PANEL (AREA PETA) === */}
        <div className="flex-grow relative overflow-hidden bg-muted/10">
          {isLoaded ? (
            <GoogleMap
              mapContainerStyle={containerStyle}
              center={typeof mapOrigin === 'string' ? { lat: -6.200000, lng: 106.816666 } : mapOrigin}
              zoom={13}
              options={{ disableDefaultUI: false, zoomControl: true, styles: [{ featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] }] }}
            >
              <DirectionsService
                options={{ origin: mapOrigin, destination: mapDestination, travelMode: google.maps.TravelMode.TRANSIT }}
                callback={directionsCallback}
              />
              {response && (
                <DirectionsRenderer options={{ directions: response, polylineOptions: { strokeColor: "#006d77", strokeWeight: 6 } }} />
              )}
            </GoogleMap>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          )}
        </div>
      </main>
    </div>
  );
}