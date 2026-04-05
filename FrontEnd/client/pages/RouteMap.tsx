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
}

function getTransportIcon(type: string) {
  const icons: Record<string, string> = { Bus: "🚌", MRT: "🚇", KRL: "🚈", LRT: "🚅" };
  return icons[type] || "🚍";
}

function getAccessibilityBadge(facilities: Facility) {
  if (facilities?.wheelchair_slot && facilities?.low_entry) {
    return { label: "♿ Aksesibel Penuh", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300" };
  } else if (facilities?.priority_seat) {
    return { label: "🪑 Sebagian Aksesibel", color: "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300" };
  }
  return { label: "Standar", color: "bg-muted text-muted-foreground" };
}

function getFacilityTips(category: string, facilities: Facility) {
  const tips: { icon: string; label: string; color: string }[] = [];
  if (facilities?.low_entry) tips.push({ icon: "🚌", label: "Low Entry", color: "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300" });
  if (facilities?.wheelchair_slot) tips.push({ icon: "♿", label: "Slot Kursi Roda", color: "bg-purple-100 text-purple-700 dark:bg-purple-950/30 dark:text-purple-300" });
  if (facilities?.priority_seat) tips.push({ icon: "🪑", label: "Kursi Prioritas", color: "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300" });
  if (category === "women" || category === "pregnant") tips.push({ icon: "👩", label: "Gerbong Wanita", color: "bg-pink-100 text-pink-700 dark:bg-pink-950/30 dark:text-pink-300" });
  return tips;
}

function getCategoryAdvice(category: string, facilities: Facility): string | null {
  switch (category) {
    case "disability":
      if (facilities?.wheelchair_slot) return "✅ Transportasi ini memiliki slot khusus kursi roda di dekat pintu.";
      if (facilities?.low_entry) return "✅ Transportasi ini menggunakan low entry sehingga mudah dinaiki.";
      return null;
    case "elderly":
      if (facilities?.priority_seat) return "✅ Tersedia kursi prioritas untuk lansia. Tunjukkan kartu identitas jika diperlukan.";
      return null;
    case "pregnant":
      if (facilities?.priority_seat) return "✅ Tersedia kursi prioritas untuk ibu hamil.";
      if (facilities?.low_entry) return "✅ Transportasi low entry memudahkan ibu hamil untuk naik turun.";
      return null;
    case "women":
      return "✅ Tersedia gerbong khusus wanita. Biasanya berada di gerbong paling depan atau belakang.";
    case "children":
      if (facilities?.priority_seat) return "✅ Tersedia kursi prioritas. Anak di bawah 3 tahun gratis dan tidak memerlukan tempat duduk terpisah.";
      return null;
    case "vulnerable-illness":
      if (facilities?.priority_seat) return "✅ Tersedia kursi prioritas untuk penumpang dengan kondisi kesehatan tertentu.";
      return null;
    default:
      return null;
  }
}

function StopBadges({ has_ramp, has_elevator }: { has_ramp?: boolean; has_elevator?: boolean }) {
  const badges = [];
  if (has_ramp) badges.push({ icon: "♿", label: "Ramp", color: "bg-emerald-100 text-emerald-700" });
  if (has_elevator) badges.push({ icon: "🛗", label: "Elevator", color: "bg-blue-100 text-blue-700" });

  if (badges.length === 0) {
    return (
      <div className="flex gap-1 mt-1">
        <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-muted text-muted-foreground">
          ⚠️ Tanpa Fasilitas
        </span>
      </div>
    );
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

  const transitStops = selectedRoute.journey.transit_stops || [];
  const facilities: Facility = selectedRoute.transport.facilities;
  const filterCategory: string = selectedRoute.filter_applied || "";

  const accessBadge = getAccessibilityBadge(facilities);
  const facilityTips = getFacilityTips(filterCategory, facilities);
  const categoryAdvice = getCategoryAdvice(filterCategory, facilities);

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

            {/* Transport card — matches RouteResults top row */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-2xl flex-shrink-0">
                  {getTransportIcon(selectedRoute.transport.type)}
                </div>
                <div>
                  <div className="font-bold text-base leading-tight">{selectedRoute.route_name}</div>
                  <div className="text-sm text-muted-foreground">{selectedRoute.transport.name} · {selectedRoute.transport.type}</div>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-2xl font-bold text-primary">{selectedRoute.journey.estimated_time_minutes} mnt</div>
                <div className="text-xs text-muted-foreground">{selectedRoute.journey.stops_passed} halte</div>
              </div>
            </div>

            {/* Journey line — origin → destination */}
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

            {/* Facility badges */}
            <div className="flex flex-wrap gap-1.5">
              <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${accessBadge.color}`}>
                {accessBadge.label}
              </span>
              {facilityTips.map((tip, i) => (
                <span key={i} className={`text-xs px-2.5 py-1 rounded-full font-semibold ${tip.color}`}>
                  {tip.icon} {tip.label}
                </span>
              ))}
            </div>
          </div>

          {/* Scrollable body */}
          <div className="flex-grow overflow-y-auto p-5">

            {/* Category advice */}
            {categoryAdvice && (
              <div className="mb-5 p-3 rounded-xl bg-primary/5 border border-primary/15 text-sm text-primary font-medium">
                {categoryAdvice}
              </div>
            )}

            {/* Timeline */}
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">
              Rute Perjalanan
            </div>

            <div className="relative">
              {/* Vertical connector line */}
              <div className="absolute left-[9px] top-3 bottom-3 w-px bg-border" />

              <div className="space-y-3">

                {/* Halte Asal */}
                <div className="flex items-start gap-3 relative">
                  <span className="w-5 h-5 rounded-full bg-emerald-500 flex-shrink-0 z-10 flex items-center justify-center mt-1">
                    <span className="w-2 h-2 rounded-full bg-white" />
                  </span>
                  <div className="bg-background rounded-lg px-3 py-2 border border-border flex-1 shadow-sm">
                    <div className="text-xs text-muted-foreground">Halte Asal</div>
                    <div className="text-sm font-semibold leading-tight">{selectedRoute.journey.origin_stop}</div>
                    <StopBadges
                      has_ramp={selectedRoute.journey.origin_has_ramp}
                      has_elevator={selectedRoute.journey.origin_has_elevator}
                    />
                  </div>
                </div>

                {/* Halte Transit */}
                {transitStops.length > 0 ? transitStops.map((stop: any, idx: number) => (
                  <div key={idx} className="flex items-start gap-3 relative">
                    <span className="w-5 h-5 rounded-full bg-primary/20 border-2 border-primary flex-shrink-0 z-10 flex items-center justify-center mt-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    </span>
                    <div className="bg-background rounded-lg px-3 py-2 border border-border flex-1 shadow-sm">
                      <div className="text-xs text-muted-foreground">Transit</div>
                      <div className="text-sm font-semibold leading-tight">{stop.stop_name}</div>
                      <StopBadges has_ramp={stop.has_ramp} has_elevator={stop.has_elevator} />
                    </div>
                  </div>
                )) : (
                  <div className="flex items-center gap-3 ml-1 py-1">
                    <div className="w-px h-5 bg-border ml-1" />
                    <span className="text-xs text-muted-foreground italic">Tidak ada transit — langsung ke tujuan</span>
                  </div>
                )}

                {/* Halte Tujuan */}
                <div className="flex items-start gap-3 relative">
                  <span className="w-5 h-5 rounded-full bg-rose-500 flex-shrink-0 z-10 flex items-center justify-center mt-1">
                    <span className="w-2 h-2 rounded-full bg-white" />
                  </span>
                  <div className="bg-background rounded-lg px-3 py-2 border border-border flex-1 shadow-sm">
                    <div className="text-xs text-muted-foreground">Halte Tujuan</div>
                    <div className="text-sm font-semibold leading-tight">{selectedRoute.journey.destination_stop}</div>
                    <StopBadges
                      has_ramp={selectedRoute.journey.dest_has_ramp}
                      has_elevator={selectedRoute.journey.dest_has_elevator}
                    />
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
