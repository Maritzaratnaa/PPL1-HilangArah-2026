import { useLocation, useNavigate } from "react-router-dom";
import { useState, useCallback, useRef, useEffect } from "react";
import { GoogleMap, useJsApiLoader, DirectionsService, DirectionsRenderer } from "@react-google-maps/api";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";

const containerStyle = {
  width: '100%',
  height: '100%'
};

interface Facility {
  low_entry: boolean;
  wheelchair_slot: boolean;
  priority_seat: boolean;
  women_area?: boolean; 
}

// 1. WAJIB ADA: Tambahkan interface Transport
interface Transport {
  name: string;
  type: string;
  facilities: Facility;
}

function getTransportIcon(type: string) {
  const icons: Record<string, string> = { Bus: "🚌", MRT: "🚇", KRL: "🚈", LRT: "🚅" };
  return icons[type] || "🚍";
}

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

function getFacilityTips(category: string, facilities: Facility) {
  const tips: { icon: string; label: string; color: string }[] = [];
  
  const safeCategory = (category || "").trim().toLowerCase();
  
  // Deteksi kategori yang lebih fleksibel (asalkan mengandung kata kuncinya)
  const isWomanOnly = safeCategory.includes("wanita") || safeCategory.includes("perempuan") || safeCategory.includes("women") && !safeCategory.includes("pregnant");
  const isPregnant = safeCategory.includes("hamil") || safeCategory.includes("pregnant");
  const isDisability = safeCategory.includes("disabilitas") || safeCategory.includes("disability");
  const needsPriority = isPregnant || safeCategory.includes("lansia") || safeCategory.includes("elderly") || safeCategory.includes("rentan") || safeCategory.includes("anak") || safeCategory.includes("children");

  // 1. Tag Area Wanita
  if ((isWomanOnly || isPregnant) && facilities?.women_area) {
    tips.push({ icon: "👩", label: "Area Wanita", color: "bg-pink-100 text-pink-700 dark:bg-pink-950/30 dark:text-pink-300" });
  }

  if (isWomanOnly) return tips; 

  // 2. Tag Disabilitas
  if (isDisability) {
    if (facilities?.low_entry) tips.push({ icon: "🚌", label: "Low Entry", color: "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300" });
    if (facilities?.wheelchair_slot) tips.push({ icon: "♿", label: "Slot Kursi Roda", color: "bg-purple-100 text-purple-700 dark:bg-purple-950/30 dark:text-purple-300" });
  }
  
  // 3. Tag Kursi Prioritas
  if (needsPriority && facilities?.priority_seat) {
    tips.push({ icon: "🪑", label: "Kursi Prioritas", color: "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300" });
  }
  
  return tips;
}
// 2. PERBAIKAN: Fungsi ini SEKARANG MENERIMA Transport[] (ARRAY)
function getCategoryAdvice(category: string, transports: Transport[]): string | null {
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
      return "✅ Rute ini telah disesuaikan dengan kriteria aksesibilitas armada dan halte.";
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

function StopBadges({ has_ramp, has_elevator, category }: { has_ramp?: boolean; has_elevator?: boolean; category: string }) {
  const safeCategory = (category || "").trim().toLowerCase();
  
  const isWomanOnly = safeCategory === "wanita" || safeCategory === "perempuan" || safeCategory === "women";
  if (isWomanOnly) return null; 

  const badges = [];
  if (has_ramp) badges.push({ icon: "♿", label: "Ramp", color: "bg-emerald-100 text-emerald-700" });
  if (has_elevator) badges.push({ icon: "🛗", label: "Elevator", color: "bg-blue-100 text-blue-700" });

  if (badges.length === 0) {
    return (
      <div className="flex gap-1 mt-1">
        <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-muted text-muted-foreground">
          ⚠️ Tanpa Fasilitas
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {badges.map((b, i) => (
        <span key={i} className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${b.color}`}>
          {b.icon} {b.label}
        </span>
      ))}
    </div>
  );
}

export default function RouteMap() {
  const location = useLocation();
  const navigate = useNavigate();
  const selectedRoute = location.state?.selectedRoute;
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
      const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidth.current + delta));
      setPanelWidth(newWidth);
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

  if (!selectedRoute) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Silakan pilih rute terlebih dahulu.</p>
        <Button onClick={() => navigate('/home')} className="ml-4">Kembali</Button>
      </div>
    );
  }

  const origin = {
    lat: parseFloat(selectedRoute.journey.origin_lat),
    lng: parseFloat(selectedRoute.journey.origin_lng)
  };
  const destination = {
    lat: parseFloat(selectedRoute.journey.dest_lat),
    lng: parseFloat(selectedRoute.journey.dest_lng)
  };

  // 3. PERBAIKAN: Akses fasilitas dari array kendaraan pertama untuk ringkasan header
  const firstTransport = selectedRoute.transports?.[0];
  const firstFacilities = firstTransport?.facilities || { 
    low_entry: false, 
    wheelchair_slot: false, 
    priority_seat: false, 
    women_area: false 
  };

  const filterCategory = location.state?.filterCategory || "";
  const transitStops = selectedRoute.journey.transit_stops || [];

  const accessBadge = getAccessibilityBadge(firstFacilities, filterCategory);
  
  // 4. PERBAIKAN: Fungsi pemanggilan array
  const categoryAdvice = getCategoryAdvice(filterCategory, selectedRoute.transports);

  return (
    <div className="min-h-screen flex flex-col bg-background max-h-screen overflow-hidden">
      <main className="flex-grow flex flex-col md:flex-row h-[calc(100vh-64px)]">
        {/* PANEL DETAIL RUTE */}
        <div
          className="relative hidden md:flex flex-col bg-card border-r border-border shadow-lg z-20 overflow-hidden flex-shrink-0"
          style={{ width: panelWidth }}
        >
          {/* Header */}
          <div className="p-5 border-b border-border bg-muted/20 flex-shrink-0">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-3 -ml-2 text-muted-foreground">
              <ArrowLeft className="h-4 w-4 mr-2" /> Kembali ke Hasil
            </Button>

            {/* Transport card */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                {/* Loop Ikon Transportasi (Berjejer jika transit) */}
                <div className="flex -space-x-2">
                  {selectedRoute.transports.map((t: any, i: number) => (
                    <div key={i} className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-xl border-2 border-card shadow-sm flex-shrink-0">
                      {getTransportIcon(t.type)}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="font-bold text-base leading-tight">{selectedRoute.route_name}</div>
                  <div className="text-[10px] text-muted-foreground mt-1">
                    {/* Menggabungkan nama: "Bus A ➔ MRT B" */}
                    {selectedRoute.transports.map((t: any) => t.name).join(" ➔ ")}
                  </div>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-2xl font-bold text-primary">{selectedRoute.journey.estimated_time_minutes} mnt</div>
                <div className="text-[10px] uppercase tracking-tighter text-muted-foreground">{selectedRoute.journey.stops_passed} halte</div>
              </div>
            </div>

            {/* Journey line */}
            <div className="flex items-center gap-2 mb-4 text-sm">
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 flex-shrink-0" />
                <span className="font-medium truncate max-w-[110px]">{selectedRoute.journey.origin_stop}</span>
              </div>
              <div className="flex-1 border-t-2 border-dashed border-border mx-1" />
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 flex-shrink-0" />
                <span className="font-medium truncate max-w-[110px]">{selectedRoute.journey.destination_stop}</span>
              </div>
            </div>

            {/* Facility badges (Ringkasan Header) */}
            <div className="flex flex-wrap gap-1.5">
              {accessBadge && (
                <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${accessBadge.color}`}>
                  {accessBadge.label}
                </span>
              )}
              {getFacilityTips(filterCategory, firstFacilities).map((tip, i) => (
                <span key={i} className={`text-xs px-2.5 py-1 rounded-full font-semibold ${tip.color}`}>
                  {tip.icon} {tip.label}
                </span>
              ))}
            </div>
          </div>

          {/* Scrollable body */}
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
              <div className="absolute left-[9px] top-3 bottom-3 w-px bg-border" />

              <div className="space-y-4">
                {/* 1. HALTE ASAL */}
                <div className="flex items-start gap-3 relative">
                  <span className="w-5 h-5 rounded-full bg-emerald-500 z-10 flex items-center justify-center mt-1">
                    <span className="w-2 h-2 bg-white rounded-full" />
                  </span>
                  <div className="bg-background rounded-lg px-3 py-2 border border-border flex-1 shadow-sm">
                    <div className="text-[10px] text-muted-foreground uppercase font-bold">Titik Awal</div>
                    <div className="text-sm font-semibold">{selectedRoute.journey.origin_stop}</div>
                    <StopBadges has_ramp={selectedRoute.journey.origin_has_ramp} has_elevator={selectedRoute.journey.origin_has_elevator} category={filterCategory} />
                  </div>
                </div>

                {/* 2. LOOP KENDARAAN & TRANSIT */}
                {selectedRoute.transports.map((t: any, idx: number) => (
                  <div key={idx} className="space-y-4">
                {/* KOTAK KENDARAAN */}
                <div className="flex items-start gap-3 relative py-1">
                  <div className="bg-primary/10 rounded-xl px-3 py-3 border border-dashed border-primary/30 flex-1 ml-6 shadow-sm">
                    <div className="text-[10px] font-bold text-primary uppercase mb-1">
                      {getTransportIcon(t.type)} Naik {t.type}
                    </div>
                    <div className="text-sm font-extrabold">{t.name}</div>
                    {/* 5. PERBAIKAN: Tag fasilitas muncul di sini per kendaraan */}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {getFacilityTips(filterCategory, t.facilities).map((tip, i) => (
                        <span key={i} className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${tip.color}`}>{tip.icon} {tip.label}</span>
                      ))}
                    </div>
                  </div>
                </div>

                    {/* HALTE TRANSIT (Hanya muncul jika bukan kendaraan terakhir) */}
                    {idx < selectedRoute.transports.length - 1 && transitStops[idx] && (
                      <div className="flex items-start gap-3 relative">
                        <span className="w-5 h-5 rounded-full bg-blue-500 z-10 flex items-center justify-center mt-1">
                          <span className="w-2 h-2 bg-white rounded-full" />
                        </span>
                        <div className="bg-background rounded-lg px-3 py-2 border border-border flex-1 shadow-sm">
                          <div className="text-[10px] text-muted-foreground uppercase font-bold">Transit / Ganti Kendaraan</div>
                          <div className="text-sm font-semibold">{transitStops[idx].stop_name}</div>
                          <StopBadges has_ramp={transitStops[idx].has_ramp} has_elevator={transitStops[idx].has_elevator} category={filterCategory} />
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {/* 3. HALTE TUJUAN */}
                <div className="flex items-start gap-3 relative">
                  <span className="w-5 h-5 rounded-full bg-rose-500 z-10 flex items-center justify-center mt-1">
                    <span className="w-2 h-2 bg-white rounded-full" />
                  </span>
                  <div className="bg-background rounded-lg px-3 py-2 border border-border flex-1 shadow-sm">
                    <div className="text-[10px] text-muted-foreground uppercase font-bold">Tujuan Akhir</div>
                    <div className="text-sm font-semibold">{selectedRoute.journey.destination_stop}</div>
                    <StopBadges has_ramp={selectedRoute.journey.dest_has_ramp} has_elevator={selectedRoute.journey.dest_has_elevator} category={filterCategory} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Drag handle */}
          <div
            onMouseDown={onMouseDown}
            className="absolute top-0 right-0 h-full w-4 flex items-center justify-center cursor-col-resize z-30 group"
            title="Seret untuk mengubah lebar panel"
          >
            <div className="h-16 w-1.5 rounded-full bg-border group-hover:bg-primary/60 group-active:bg-primary transition-all duration-150" />
          </div>
        </div>

        {/* AREA PETA */}
        <div className="flex-grow relative overflow-hidden bg-muted/10">
          {isLoaded ? (
            <GoogleMap
              mapContainerStyle={containerStyle}
              center={origin}
              zoom={13}
              options={{
                disableDefaultUI: false,
                zoomControl: true,
                styles: [
                  { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] }
                ]
              }}
            >
              <DirectionsService
                options={{
                  origin: origin,
                  destination: destination,
                  travelMode: google.maps.TravelMode.TRANSIT,
                }}
                callback={directionsCallback}
              />
              {response && (
                <DirectionsRenderer
                  options={{
                    directions: response,
                    polylineOptions: {
                      strokeColor: "#006d77",
                      strokeWeight: 6,
                    }
                  }}
                />
              )}
            </GoogleMap>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}