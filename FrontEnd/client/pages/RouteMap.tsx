import { useLocation, useNavigate } from "react-router-dom";
import { useState, useCallback, useRef, useEffect } from "react";
import {
  GoogleMap,
  useJsApiLoader,
  DirectionsService,
  DirectionsRenderer,
} from "@react-google-maps/api";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, MapPin } from "lucide-react";

const containerStyle = { width: '100%', height: '100%' };

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
  route_path: TransitStop[];
}

interface RouteResult {
  route_type: "direct" | "transit";
  total_estimated_time: number;
  is_recommended: boolean;
  legs: JourneyLeg[];
}

function getTransportIcon(type: string) {
  const icons: Record<string, string> = {
    Bus: "🚌",
    MRT: "🚇",
    KRL: "🚈",
    LRT: "🚅",
  };
  return icons[type] || "🚍";
}

function getAccessibilityBadge(facilities: Facility, category: string) {
  const safeCategory = (category || "").trim().toLowerCase();
  if (["wanita", "perempuan", "women"].includes(safeCategory)) return null;

  if (facilities?.wheelchair_slot && facilities?.low_entry) {
    return {
      label: "♿ Aksesibel Penuh",
      color:
        "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300",
    };
  } else if (facilities?.priority_seat) {
    return {
      label: "🪑 Sebagian Aksesibel",
      color:
        "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300",
    };
  }
  return { label: "Standar", color: "bg-muted text-muted-foreground" };
}

function getFacilityTips(facilities: Facility, category: string) {
  const tips: {label: string; color: string }[] = [];
  if (!facilities) return tips;

  const safeCategory = (category || "").trim().toLowerCase();

  if (["wanita", "perempuan", "women"].includes(safeCategory)) {
    if (facilities.women_area) {
      tips.push({label: "Area Wanita", color: "bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-950/30 dark:text-pink-300" });
    }
  } 
  else if (["ibu hamil", "pregnant"].includes(safeCategory)) {
    if (facilities.women_area) {
      tips.push({label: "Area Wanita", color: "bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-950/30 dark:text-pink-300" });
    }
    if (facilities.priority_seat) {
      tips.push({label: "Kursi Prioritas", color: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300" });
    }
  } 
  else if (["disabilitas", "disability", "tunanetra", "tuli", "pengguna kursi roda"].includes(safeCategory)) {
    if (facilities.low_entry) {
      tips.push({label: "Low Entry", color: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300" });
    }
    if (facilities.wheelchair_slot) {
      tips.push({label: "Slot Kursi Roda", color: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-300" });
    }
  } 
  else if (["lansia", "elderly", "penyakit rentan", "vulnerable", "anak-anak", "children"].includes(safeCategory)) {
    if (facilities.priority_seat) {
      tips.push({label: "Kursi Prioritas", color: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300" });
    }
  }

  return tips;
}

function getCategoryAdvice(category: string, transports: Transport[]): string | null {
  if (!transports || transports.length === 0) return null;
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
    case "vulnerable":
    case "anak-anak":
    case "children":
      if (hasPriorityAll)
        return "✅ Tersedia kursi prioritas pada seluruh armada rute ini.";
      return "✅ Tersedia kursi prioritas untuk kenyamanan perjalanan Anda.";
    case "wanita":
    case "perempuan":
    case "women":
      if (hasWomenAreaAll)
        return "✅ Tersedia area khusus wanita pada seluruh armada rute ini.";
      return "⚠️ Area khusus wanita mungkin tidak tersedia di salah satu armada transit.";
    default:
      return null;
  }
}

function StopBadges({ has_ramp, has_elevator, category }: { has_ramp?: boolean; has_elevator?: boolean; category: string }) {
  const safeCategory = (category || "").trim().toLowerCase();
  
  let showRamp = false;
  let showElevator = false;

  if (["disabilitas", "disability", "tunanetra", "tuli", "pengguna kursi roda"].includes(safeCategory)) {
    showRamp = true;
    showElevator = true;
  } 
  else if (["lansia", "elderly", "ibu hamil", "pregnant", "penyakit rentan", "vulnerable"].includes(safeCategory)) {
    showElevator = true;
  }

  const badges = [];
  if (showRamp && has_ramp) badges.push({ icon: "♿", label: "Ramp", color: "bg-emerald-100 text-emerald-700 border-emerald-200" });
  if (showElevator && has_elevator) badges.push({ icon: "🛗", label: "Lift", color: "bg-blue-100 text-blue-700 border-blue-200" });

  if (badges.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1 mt-1.5">
      {badges.map((b, i) => (
        <span key={i} className={`text-[10px] px-2 py-0.5 rounded-md font-bold border shadow-sm ${b.color}`}>
          {b.icon} {b.label}
        </span>
      ))}
    </div>
  );
}

export default function RouteMap() {
  const location = useLocation();
  const navigate = useNavigate();
  const selectedRoute = location.state?.selectedRoute as RouteResult | undefined;
  const filterCategory = location.state?.filterCategory || "";

  const [response, setResponse] = useState<google.maps.DirectionsResult | null>(null);

  const [isMobile, setIsMobile] = useState(false);
  const [showPanel, setShowPanel] = useState(false);

  const isMapsEnabled = import.meta.env.VITE_ENABLE_MAPS === 'true';
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: isMapsEnabled
      ? import.meta.env.VITE_GOOGLE_MAPS_API_KEY
      : "",
    libraries: ["places"],
  });

  const directionsCallback = useCallback(
    (
      res: google.maps.DirectionsResult | null,
      status: google.maps.DirectionsStatus,
    ) => {
      if (res !== null && status === "OK" && !response) {
        setResponse(res);
      }
    },
    [response],
  );

  const MIN_WIDTH = 280;
  const MAX_WIDTH = 640;
  const DEFAULT_WIDTH = 384;
  const [panelWidth, setPanelWidth] = useState(DEFAULT_WIDTH);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(DEFAULT_WIDTH);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

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
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 font-['Atkinson_Hyperlegible',_sans-serif]">
        <p className="text-muted-foreground font-semibold">Silakan pilih rute terlebih dahulu.</p>
        <Button onClick={() => navigate('/home')}>Kembali</Button>
      </div>
    );
  }

  const firstLeg = selectedRoute.legs[0];
  const lastLeg = selectedRoute.legs[selectedRoute.legs.length - 1];
  const firstStopName = firstLeg.origin_stop;
  const finalStopName = lastLeg.destination_stop;

  const allTransports = selectedRoute.legs.flatMap(leg => leg.transports);
  
  const originLat = firstLeg.route_path?.[0]?.latitude;
  const originLng = firstLeg.route_path?.[0]?.longitude;
  const destLat = lastLeg.route_path?.[lastLeg.route_path.length - 1]?.latitude;
  const destLng = lastLeg.route_path?.[lastLeg.route_path.length - 1]?.longitude;

  const mapOrigin = originLat && originLng ? { lat: parseFloat(originLat.toString()), lng: parseFloat(originLng.toString()) } : `${firstStopName}, Jakarta`;
  const mapDestination = destLat && destLng ? { lat: parseFloat(destLat.toString()), lng: parseFloat(destLng.toString()) } : `${finalStopName}, Jakarta`;

  const firstFacilities = allTransports[0]?.facilities || { low_entry: false, wheelchair_slot: false, priority_seat: false, women_area: false };
  const accessBadge = getAccessibilityBadge(firstFacilities, filterCategory);
  const categoryAdvice = getCategoryAdvice(filterCategory, allTransports);

  const originStopData = firstLeg.route_path?.find(s => s.stop_name === firstStopName) || firstLeg.route_path?.[0];
  const finalStopData = lastLeg.route_path?.find(s => s.stop_name === finalStopName) || lastLeg.route_path?.[lastLeg.route_path.length - 1];

  return (
    <div className="min-h-screen flex flex-col bg-background max-h-screen overflow-hidden font-['Atkinson_Hyperlegible',_sans-serif]">
      <main className="flex-grow flex flex-col md:flex-row relative" style={{ height: "calc(100vh - 64px)" }}>
        
        <div 
          className="relative flex-grow overflow-hidden bg-muted/10 w-full"
          style={{ height: isMobile ? (showPanel ? "45vh" : "100%") : "100%" }}
        >
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

          {isMobile && (
            <button
              onClick={() => setShowPanel(!showPanel)}
              className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 bg-card border border-border rounded-full px-5 py-2.5 text-sm font-bold shadow-lg flex items-center gap-2"
            >
              {showPanel ? "🗺️ Lihat Peta Penuh" : "📋 Lihat Detail Rute"}
            </button>
          )}
        </div>

        <div 
          className={`bg-card border-border flex flex-col overflow-hidden shadow-xl
            ${isMobile 
              ? `fixed bottom-0 left-0 right-0 z-30 transition-transform duration-300 rounded-t-3xl border-t-2 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] ${showPanel ? "translate-y-0" : "translate-y-full"}` 
              : "relative border-r flex-shrink-0 z-20 order-first"
            }`} 
          style={isMobile ? { height: "60vh" } : { width: `${panelWidth}px` }}
        >
          
          <div className="p-4 sm:p-5 border-b border-border bg-muted/20 flex-shrink-0">
            <div className="flex items-center justify-between mb-3">
              <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="font-bold text-muted-foreground -ml-2 h-8">
                <ArrowLeft className="h-4 w-4 mr-2" /> Kembali
              </Button>
              {isMobile && (
                <button onClick={() => setShowPanel(false)} className="text-xs text-muted-foreground font-bold bg-muted px-3 py-1.5 rounded-full border border-border">
                  Tutup ✕
                </button>
              )}
            </div>

            <div className="flex items-start justify-between mb-4 gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex -space-x-2 flex-shrink-0">
                  {selectedRoute.legs.map((leg, i) => (
                    <div key={i} className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-xl border-2 border-card shadow-sm flex-shrink-0">
                      {getTransportIcon(leg.transports[0]?.type || "Bus")}
                    </div>
                  ))}
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-base leading-tight truncate">
                    {selectedRoute.route_type === "transit" ? "Perjalanan Transit" : firstLeg.route_name}
                  </div>
                  <div className="text-[10px] font-semibold text-muted-foreground mt-1 truncate">
                    {selectedRoute.legs.map((leg) => leg.route_name).join(" ➔ ")}
                  </div>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-2xl font-bold text-primary">{selectedRoute.total_estimated_time} <span className="text-sm">mnt</span></div>
              </div>
            </div>

            <div className="flex items-center gap-2 mb-4 text-xs sm:text-sm">
              <div className="flex items-center gap-1.5 flex-shrink-0 max-w-[40%]">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 flex-shrink-0" />
                <span className="font-bold truncate">{firstStopName}</span>
              </div>
              <div className="flex-1 border-t-2 border-dashed border-border mx-1" />
              <div className="flex items-center gap-1.5 flex-shrink-0 max-w-[40%] justify-end">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 flex-shrink-0" />
                <span className="font-bold truncate text-right">{finalStopName}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {accessBadge && (
                <span className={`text-[11px] sm:text-xs px-2.5 py-1 rounded-full font-bold ${accessBadge.color}`}>
                  {accessBadge.label}
                </span>
              )}
            </div>
          </div>

          <div className="flex-grow overflow-y-auto p-4 sm:p-5">
            {categoryAdvice && (
              <div className="mb-5 p-3 rounded-xl bg-primary/5 border border-primary/15 text-xs sm:text-sm text-primary font-semibold">
                {categoryAdvice}
              </div>
            )}

            <div className="text-[11px] sm:text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">
              Rute Perjalanan
            </div>
            <div className="relative">
              <div className="absolute left-[9px] top-3 bottom-3 w-px bg-border" />

              <div className="space-y-0">
                <div className="flex items-start gap-3 relative pb-4">
                  <span className="w-5 h-5 rounded-full bg-emerald-500 z-10 flex items-center justify-center mt-1 ring-4 ring-background">
                    <span className="w-2 h-2 bg-white rounded-full" />
                  </span>
                  <div className="bg-background rounded-lg px-3 py-2 border border-border flex-1 shadow-sm">
                    <div className="text-[10px] text-muted-foreground uppercase font-bold">Titik Awal</div>
                    <div className="text-sm font-bold text-foreground">{firstStopName}</div>
                    {originStopData && (
                      <StopBadges has_ramp={originStopData.has_ramp} has_elevator={originStopData.has_elevator} category={filterCategory} />
                    )}
                  </div>
                </div>

                {selectedRoute.legs.map((leg, legIdx) => {
                  const path = leg.route_path || [];
                  const isReversed = path.length > 1 && path[path.length - 1].stop_name === leg.origin_stop;
                  const orderedPath = isReversed ? [...path].reverse() : path;
                  const intermediateStops = orderedPath.slice(1, -1);
                  const transitStopData = leg.route_path?.find(s => s.stop_name === leg.destination_stop) || orderedPath[orderedPath.length - 1];

                  return (
                    <div key={legIdx}>
                      {leg.transports.map((t, tIdx) => (
                        <div key={tIdx} className="flex items-start gap-3 relative pb-6">
                          <div className="absolute left-[9px] top-0 bottom-0 w-0.5 border-l-2 border-dashed border-muted-foreground/30 ml-[-1px]"></div>
                          
                          <div className="bg-card rounded-2xl p-4 border shadow-sm flex-1 ml-6 relative overflow-hidden">
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-xl">{getTransportIcon(t.type)}</span>
                              <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                Naik {leg.route_name}
                              </span>
                            </div>
                            <div className="text-sm font-extrabold mb-3">{t.name}</div>

                            <div className="flex flex-wrap gap-2">
                              {getFacilityTips(t.facilities, filterCategory).map((facility, i) => (
                                <div key={i} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold shadow-sm ${facility.color}`}>
                                  {facility.label}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}

                      {intermediateStops.length > 0 && (
                        <div className="relative pb-4 space-y-3">
                          {intermediateStops.map((stop, sIdx) => (
                            <div key={sIdx} className="flex items-start gap-3 relative">
                              <span className="w-5 h-5 z-10 flex items-center justify-center mt-0.5 bg-background">
                                <span className="w-2 h-2 bg-muted-foreground/40 rounded-full" />
                              </span>
                              <div className="flex-1 mt-0.5">
                                <div className="text-xs font-semibold text-muted-foreground/80 leading-tight">
                                  {stop.stop_name}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {legIdx < selectedRoute.legs.length - 1 && (
                        <div className="flex items-start gap-3 relative pb-4 pt-2">
                          <span className="w-5 h-5 rounded-full bg-blue-500 z-10 flex items-center justify-center mt-1 ring-4 ring-background">
                            <span className="w-2 h-2 bg-white rounded-full" />
                          </span>
                          <div className="bg-blue-50/50 dark:bg-blue-950/20 rounded-lg px-3 py-2 border border-blue-200 dark:border-blue-900 flex-1 shadow-sm">
                            <div className="flex items-center gap-1 text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400">
                              <MapPin className="w-3 h-3" /> Transit / Pindah Rute
                            </div>
                            <div className="text-sm font-bold text-foreground">{leg.destination_stop}</div>
                            {transitStopData && (
                              <StopBadges has_ramp={transitStopData.has_ramp} has_elevator={transitStopData.has_elevator} category={filterCategory} />
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                <div className="flex items-start gap-3 relative pt-1 pb-4">
                  <span className="w-5 h-5 rounded-full bg-rose-500 z-10 flex items-center justify-center mt-1 ring-4 ring-background">
                    <span className="w-2 h-2 bg-white rounded-full" />
                  </span>
                  <div className="bg-background rounded-lg px-3 py-2 border border-border flex-1 shadow-sm">
                    <div className="text-[10px] text-muted-foreground uppercase font-bold text-rose-600">Tujuan Akhir</div>
                    <div className="text-sm font-bold text-foreground">{finalStopName}</div>
                    {finalStopData && (
                      <StopBadges has_ramp={finalStopData.has_ramp} has_elevator={finalStopData.has_elevator} category={filterCategory} />
                    )}
                  </div>
                </div>

              </div>
            </div>
          </div>

          {!isMobile && (
            <div onMouseDown={onMouseDown} className="absolute top-0 right-0 h-full w-4 flex items-center justify-center cursor-col-resize z-30 group">
              <div className="h-16 w-1.5 rounded-full bg-border group-hover:bg-primary/60 group-active:bg-primary transition-all duration-150" />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
