import { useLocation, useNavigate } from "react-router-dom";
import { useState, useCallback, useRef, useEffect } from "react";
import {
  GoogleMap,
  useJsApiLoader,
  DirectionsService,
  DirectionsRenderer,
} from "@react-google-maps/api";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Loader2,
  MapPin,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Clock,
  Users,
  Cloud,
  Car,
  AlertTriangle,
} from "lucide-react";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
const containerStyle = { width: "100%", height: "100%" };
const GOOGLE_MAPS_LIBRARIES: ("places")[] = ["places"];

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

interface RealTimeInfo {
  status_lalu_lintas: string;
  eta_kedatangan_menit: number;
  waktu_tempuh_menit: number;
  cuaca: string;
  kursi_umum_terisi: number;
  kursi_umum_total: number;
  kursi_prioritas_terisi: number;
  kursi_prioritas_total: number;
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
  const tips: { label: string; color: string }[] = [];
  if (!facilities) return tips;

  const safeCategory = (category || "").trim().toLowerCase();

  if (["wanita", "perempuan", "women"].includes(safeCategory)) {
    if (facilities.women_area) {
      tips.push({
        label: "Area Wanita",
        color:
          "bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-950/30 dark:text-pink-300",
      });
    }
  } else if (["ibu hamil", "pregnant"].includes(safeCategory)) {
    if (facilities.women_area) {
      tips.push({
        label: "Area Wanita",
        color:
          "bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-950/30 dark:text-pink-300",
      });
    }
    if (facilities.priority_seat) {
      tips.push({
        label: "Kursi Prioritas",
        color:
          "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300",
      });
    }
  } else if (
    ["disabilitas", "disability", "tunanetra", "tuli", "pengguna kursi roda"].includes(
      safeCategory
    )
  ) {
    if (facilities.low_entry) {
      tips.push({
        label: "Low Entry",
        color:
          "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300",
      });
    }
    if (facilities.wheelchair_slot) {
      tips.push({
        label: "Slot Kursi Roda",
        color:
          "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-300",
      });
    }
  } else if (
    ["lansia", "elderly", "penyakit rentan", "vulnerable", "anak-anak", "children"].includes(
      safeCategory
    )
  ) {
    if (facilities.priority_seat) {
      tips.push({
        label: "Kursi Prioritas",
        color:
          "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300",
      });
    }
  }

  return tips;
}

function getCategoryAdvice(category: string, transports: Transport[]): string | null {
  if (!transports || transports.length === 0) return null;
  const safeCategory = (category || "").trim().toLowerCase();

  const hasWomenAreaAll = transports.every((t) => t.facilities?.women_area);
  const hasWheelchairAll = transports.every((t) => t.facilities?.wheelchair_slot);
  const hasLowEntryAll = transports.every((t) => t.facilities?.low_entry);
  const hasPriorityAll = transports.every((t) => t.facilities?.priority_seat);

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

function StopBadges({
  has_ramp,
  has_elevator,
  category,
}: {
  has_ramp?: boolean;
  has_elevator?: boolean;
  category: string;
}) {
  const safeCategory = (category || "").trim().toLowerCase();

  let showRamp = false;
  let showElevator = false;

  if (
    ["disabilitas", "disability", "tunanetra", "tuli", "pengguna kursi roda"].includes(
      safeCategory
    )
  ) {
    showRamp = true;
    showElevator = true;
  } else if (
    ["lansia", "elderly", "ibu hamil", "pregnant", "penyakit rentan", "vulnerable"].includes(
      safeCategory
    )
  ) {
    showElevator = true;
  }

  const badges: { icon: string; label: string; color: string }[] = [];
  if (showRamp && has_ramp)
    badges.push({ icon: "♿", label: "Ramp", color: "bg-emerald-100 text-emerald-700 border-emerald-200" });
  if (showElevator && has_elevator)
    badges.push({ icon: "🛗", label: "Lift", color: "bg-blue-100 text-blue-700 border-blue-200" });

  if (badges.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5 mt-1">
      {badges.map((b, i) => (
        <span
          key={i}
          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${b.color}`}
        >
          {b.icon} {b.label}
        </span>
      ))}
    </div>
  );
}

// --- Real-time info card, dibuat rapi & reusable ---
function RealTimeInfoCard({
  info,
  legIdx,
  isRefreshing,
  onRefresh,
}: {
  info: RealTimeInfo;
  legIdx: number;
  isRefreshing: boolean;
  onRefresh: (legIdx: number) => void;
}) {
  return (
    <div className="mt-3 pt-3 border-t border-border">
      <div className="flex items-center justify-between mb-2.5">
        <p className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          Info Real-time
        </p>
        <button
          onClick={() => onRefresh(legIdx)}
          disabled={isRefreshing}
          className="flex items-center gap-1.5 text-[10px] font-bold text-primary bg-primary/10 hover:bg-primary/20 px-2.5 py-1 rounded-md transition-colors disabled:opacity-50"
        >
          <RefreshCw size={11} className={isRefreshing ? "animate-spin" : ""} />
          Perbarui
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-muted/50 border border-border/60 p-2.5 flex items-start gap-2">
          <div className="rounded-full bg-blue-100 dark:bg-blue-950/40 p-1.5 shrink-0">
            <Clock size={12} className="text-blue-600 dark:text-blue-400" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-muted-foreground">Waktu & ETA</p>
            <p className="text-xs font-bold truncate">
              {info.waktu_tempuh_menit} mnt (ETA {info.eta_kedatangan_menit}m)
            </p>
          </div>
        </div>

        <div className="rounded-lg bg-muted/50 border border-border/60 p-2.5 flex items-start gap-2">
          <div className="rounded-full bg-orange-100 dark:bg-orange-950/40 p-1.5 shrink-0">
            <Car size={12} className="text-orange-600 dark:text-orange-400" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-muted-foreground">Lalu Lintas</p>
            <p className="text-xs font-bold truncate">{info.status_lalu_lintas}</p>
          </div>
        </div>

        {/* Kursi Terisi (kiri) & Cuaca (kanan) sebaris */}
        <div className="rounded-lg bg-muted/50 border border-border/60 p-2.5 flex items-start gap-2">
          <div className="rounded-full bg-purple-100 dark:bg-purple-950/40 p-1.5 shrink-0">
            <Users size={12} className="text-purple-600 dark:text-purple-400" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-muted-foreground">Kursi Terisi</p>
            <p className="text-xs font-bold leading-tight">
              Prioritas: {info.kursi_prioritas_terisi}/{info.kursi_prioritas_total}
            </p>
            <p className="text-xs font-bold leading-tight">
              Umum: {info.kursi_umum_terisi}/{info.kursi_umum_total}
            </p>
          </div>
        </div>

        <div className="rounded-lg bg-muted/50 border border-border/60 p-2.5 flex items-start gap-2">
          <div className="rounded-full bg-sky-100 dark:bg-sky-950/40 p-1.5 shrink-0">
            <Cloud size={12} className="text-sky-600 dark:text-sky-400" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-muted-foreground">Cuaca</p>
            <p className="text-xs font-bold truncate">{info.cuaca}</p>
          </div>
        </div>
      </div>
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

  const [realTimeInfo, setRealTimeInfo] = useState<Record<number, RealTimeInfo>>({});
  const [isRefreshing, setIsRefreshing] = useState<Record<number, boolean>>({});
  const [expandedStops, setExpandedStops] = useState<Record<number, boolean>>({});

  const isMapsEnabled = import.meta.env.VITE_ENABLE_MAPS === "true";
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: isMapsEnabled ? import.meta.env.VITE_GOOGLE_MAPS_API_KEY : "",
    libraries: GOOGLE_MAPS_LIBRARIES, 
  });

  const directionsCallback = useCallback(
    (res: google.maps.DirectionsResult | null, status: google.maps.DirectionsStatus) => {
      if (res !== null && status === "OK" && !response) {
        setResponse(res);
      }
    },
    [response]
  );

  const MIN_WIDTH = 280;
  const MAX_WIDTH = 640;
  const DEFAULT_WIDTH = 384;
  const [panelWidth, setPanelWidth] = useState(DEFAULT_WIDTH);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(DEFAULT_WIDTH);

  const generateMockData = (): RealTimeInfo => {
    const kursiUmumTotal = Math.floor(Math.random() * 20) + 15;
    const kursiPrioTotal = Math.floor(Math.random() * 4) + 4;

    return {
      status_lalu_lintas: ["Lancar", "Padat Merayap", "Macet"][Math.floor(Math.random() * 3)],
      eta_kedatangan_menit: Math.floor(Math.random() * 10) + 2,
      waktu_tempuh_menit: Math.floor(Math.random() * 25) + 10,
      cuaca: ["Cerah", "Berawan", "Hujan Ringan"][Math.floor(Math.random() * 3)],
      kursi_umum_total: kursiUmumTotal,
      kursi_umum_terisi: Math.floor(Math.random() * kursiUmumTotal),
      kursi_prioritas_total: kursiPrioTotal,
      kursi_prioritas_terisi: Math.floor(Math.random() * kursiPrioTotal),
    };
  };

  const getTrafficFromGoogleDirections = (
    leg: JourneyLeg,
    gmapResponse: google.maps.DirectionsResult | null
  ): "Lancar" | "Padat Merayap" | "Macet" => {
    try {
      if (gmapResponse?.routes?.[0]?.legs?.[0]?.duration?.value) {
        const gmapDurationMinutes = Math.round(
          gmapResponse.routes[0].legs[0].duration.value / 60
        );
        const baseDuration = leg.estimated_time_minutes || 15;

        const ratio = gmapDurationMinutes / baseDuration;

        if (ratio >= 1.25) return "Macet";
        if (ratio >= 1.05) return "Padat Merayap";
        return "Lancar";
      }
    } catch {
    }
    return "Lancar";
  };

  const fetchETA = async (leg: JourneyLeg, currentRealTimeInfo?: RealTimeInfo): Promise<number> => {
    try {
      const token = localStorage.getItem("token");

      const statusLaluLintas = currentRealTimeInfo?.status_lalu_lintas 
        || ["Lancar", "Padat Merayap", "Macet"][Math.floor(Math.random() * 3)];
      const kondisiCuaca = currentRealTimeInfo?.cuaca
        || ["Cerah", "Berawan", "Hujan Ringan"][Math.floor(Math.random() * 3)];
      const waktuTempuh = leg.estimated_time_minutes;

      const res = await fetch(`${BASE_URL}/api/predict-eta`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status_lalu_lintas: statusLaluLintas,
          kondisi_cuaca: kondisiCuaca,
          waktu_tempuh_menit: waktuTempuh,
        }),
      });

      const json = await res.json();
      if (json.success) return Math.round(json.eta_minutes);
      return leg.estimated_time_minutes;
    } catch {
      return leg.estimated_time_minutes;
    }
  };

  const mockTrafficNews = "Ada penutupan jalan di area Sudirman akibat perbaikan utilitas.";

  useEffect(() => {
    if (selectedRoute?.legs) {
      const updateData = async () => {
        const initialData: Record<number, RealTimeInfo> = {};
        for (let idx = 0; idx < selectedRoute.legs.length; idx++) {
          const leg = selectedRoute.legs[idx];
          
          const trafficStatus = getTrafficFromGoogleDirections(leg, response);
          
          const mockBase = {
            ...generateMockData(),
            status_lalu_lintas: trafficStatus,
          };
          
          const etaMinutes = await fetchETA(leg, mockBase);
          initialData[idx] = {
            ...mockBase,
            eta_kedatangan_menit: etaMinutes,
            waktu_tempuh_menit: leg.estimated_time_minutes,
          };
        }
        setRealTimeInfo(initialData);
      };
      updateData();
    }
  }, [selectedRoute, response]);

  const handleRefreshRealtime = async (legIdx: number) => {
    setIsRefreshing((prev) => ({ ...prev, [legIdx]: true }));
    try {
      const leg = selectedRoute.legs[legIdx];
      const trafficStatus = getTrafficFromGoogleDirections(leg, response);
      const mockBase = {
        ...generateMockData(),
        status_lalu_lintas: trafficStatus,
      };
      const etaMinutes = await fetchETA(leg, mockBase);
      setRealTimeInfo((prev) => ({
        ...prev,
        [legIdx]: {
          ...mockBase,
          eta_kedatangan_menit: etaMinutes,
          waktu_tempuh_menit: leg.estimated_time_minutes,
        },
      }));
    } finally {
      setIsRefreshing((prev) => ({ ...prev, [legIdx]: false }));
    }
  };

  const toggleStops = (legIdx: number) => {
    setExpandedStops((prev) => ({ ...prev, [legIdx]: !prev[legIdx] }));
  };

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
      <div className="flex flex-col items-center justify-center h-screen gap-4 text-center px-6">
        <p className="text-muted-foreground font-medium">
          Silakan pilih rute terlebih dahulu.
        </p>
        <Button onClick={() => navigate("/home")}>Kembali</Button>
      </div>
    );
  }

  const firstLeg = selectedRoute.legs[0];
  const lastLeg = selectedRoute.legs[selectedRoute.legs.length - 1];
  const firstStopName = firstLeg.origin_stop;
  const finalStopName = lastLeg.destination_stop;

  const allTransports = selectedRoute.legs.flatMap((leg) => leg.transports);

  const originLat = firstLeg.route_path?.[0]?.latitude;
  const originLng = firstLeg.route_path?.[0]?.longitude;
  const destLat = lastLeg.route_path?.[lastLeg.route_path.length - 1]?.latitude;
  const destLng = lastLeg.route_path?.[lastLeg.route_path.length - 1]?.longitude;

  const mapOrigin =
    originLat && originLng
      ? { lat: parseFloat(originLat.toString()), lng: parseFloat(originLng.toString()) }
      : `${firstStopName}, Jakarta`;
  const mapDestination =
    destLat && destLng
      ? { lat: parseFloat(destLat.toString()), lng: parseFloat(destLng.toString()) }
      : `${finalStopName}, Jakarta`;

  const firstFacilities = allTransports[0]?.facilities || {
    low_entry: false,
    wheelchair_slot: false,
    priority_seat: false,
    women_area: false,
  };
  const accessBadge = getAccessibilityBadge(firstFacilities, filterCategory);
  const categoryAdvice = getCategoryAdvice(filterCategory, allTransports);

  const originStopData =
    firstLeg.route_path?.find((s) => s.stop_name === firstStopName) || firstLeg.route_path?.[0];
  const finalStopData =
    lastLeg.route_path?.find((s) => s.stop_name === finalStopName) ||
    lastLeg.route_path?.[lastLeg.route_path.length - 1];

  // --- Konten sidebar (dipakai untuk desktop & mobile bottom-sheet) ---
  const sidebarContent = (
    <>
      {!isMobile && (
        <div className="flex items-center justify-between mb-2">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="font-bold text-muted-foreground -ml-2 h-8"
          >
            <ArrowLeft size={16} className="mr-1" />
            Kembali
          </Button>
        </div>
      )}

      {/* HEADER CARD */}
      <div className="rounded-xl border border-border p-4 space-y-3 bg-background">
        <div className="flex items-center gap-2">
          {selectedRoute.legs.map((leg, i) => (
            <span key={i} className="text-2xl">
              {getTransportIcon(leg.transports[0]?.type || "Bus")}
            </span>
          ))}
        </div>

        <div>
          <h1 className="text-lg font-bold">
            {selectedRoute.route_type === "transit" ? "Perjalanan Transit" : firstLeg.route_name}
          </h1>
          <p className="text-xs text-muted-foreground">
            {selectedRoute.legs.map((leg) => leg.route_name).join(" ➔ ")}
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-sm font-bold text-primary">
          <Clock size={14} />
          {selectedRoute.total_estimated_time} mnt
        </div>

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin size={12} />
          {firstStopName} <span>→</span> {finalStopName}
        </div>

        {accessBadge && (
          <span
            className={`inline-block text-xs font-bold px-2.5 py-1 rounded-full ${accessBadge.color}`}
          >
            {accessBadge.label}
          </span>
        )}

        {mockTrafficNews && (
          <div className="flex items-start gap-2 text-xs bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900 rounded-lg p-2.5">
            <AlertTriangle size={14} className="mt-0.5 shrink-0" />
            <span>Info: {mockTrafficNews}</span>
          </div>
        )}

        {categoryAdvice && (
          <div className="text-xs bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900 rounded-lg p-2.5">
            {categoryAdvice}
          </div>
        )}
      </div>

      {/* ROUTE TIMELINE */}
      <div className="space-y-4 mt-4">
        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wide">
          Rute Perjalanan
        </h2>

        <div className="flex gap-3">
          <div className="flex flex-col items-center">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <div className="w-px flex-1 bg-border" />
          </div>
          <div className="pb-4">
            <p className="text-xs text-muted-foreground font-bold">Titik Awal</p>
            <p className="text-sm font-bold">{firstStopName}</p>
            {originStopData && (
              <StopBadges
                has_ramp={originStopData.has_ramp}
                has_elevator={originStopData.has_elevator}
                category={filterCategory}
              />
            )}
          </div>
        </div>

        {selectedRoute.legs.map((leg, legIdx) => {
          const path = leg.route_path || [];
          const isReversed =
            path.length > 1 && path[path.length - 1].stop_name === leg.origin_stop;
          const orderedPath = isReversed ? [...path].reverse() : path;
          const intermediateStops = orderedPath.slice(1, -1);
          const transitStopData =
            leg.route_path?.find((s) => s.stop_name === leg.destination_stop) ||
            orderedPath[orderedPath.length - 1];
          const info = realTimeInfo[legIdx];

          return (
            <div key={legIdx} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 rounded-full bg-muted-foreground" />
                <div className="w-px flex-1 bg-border" />
              </div>

              <div className="pb-4 flex-1 space-y-3">
                {leg.transports.map((t, tIdx) => (
                  <div key={tIdx} className="rounded-lg border border-border p-3 bg-background">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{getTransportIcon(t.type)}</span>
                      <div>
                        <p className="text-xs text-muted-foreground font-bold">
                          Naik {leg.route_name}
                        </p>
                        <p className="text-sm font-bold">{t.name}</p>
                      </div>
                    </div>

                    {getFacilityTips(t.facilities, filterCategory).length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {getFacilityTips(t.facilities, filterCategory).map((facility, i) => (
                          <span
                            key={i}
                            className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${facility.color}`}
                          >
                            {facility.label}
                          </span>
                        ))}
                      </div>
                    )}

                    {info && (
                      <RealTimeInfoCard
                        info={info}
                        legIdx={legIdx}
                        isRefreshing={!!isRefreshing[legIdx]}
                        onRefresh={handleRefreshRealtime}
                      />
                    )}
                  </div>
                ))}

                {intermediateStops.length > 0 && (
                  <div>
                    <button
                      onClick={() => toggleStops(legIdx)}
                      className="flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground bg-background border border-border px-3.5 py-1.5 rounded-full transition-colors shadow-sm"
                    >
                      {expandedStops[legIdx] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      {intermediateStops.length} Halte Dilewati (Detail)
                    </button>

                    {expandedStops[legIdx] && (
                      <div className="mt-2 pl-2 space-y-1.5 border-l-2 border-dashed border-border">
                        {intermediateStops.map((stop, sIdx) => (
                          <div key={sIdx} className="pl-3 text-xs text-muted-foreground">
                            {stop.stop_name}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {legIdx < selectedRoute.legs.length - 1 && (
                  <div className="rounded-lg bg-muted/50 border border-dashed border-border p-2.5">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">
                      Transit / Pindah Rute
                    </p>
                    <p className="text-sm font-bold">{leg.destination_stop}</p>
                    {transitStopData && (
                      <StopBadges
                        has_ramp={transitStopData.has_ramp}
                        has_elevator={transitStopData.has_elevator}
                        category={filterCategory}
                      />
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        <div className="flex gap-3">
          <div className="w-3 h-3 rounded-full bg-destructive mt-1" />
          <div>
            <p className="text-xs text-muted-foreground font-bold">Tujuan Akhir</p>
            <p className="text-sm font-bold">{finalStopName}</p>
            {finalStopData && (
              <StopBadges
                has_ramp={finalStopData.has_ramp}
                has_elevator={finalStopData.has_elevator}
                category={filterCategory}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );

  const mapView = (
    <>
      {isLoaded ? (
        <GoogleMap mapContainerStyle={containerStyle} center={{ lat: -6.2, lng: 106.816666 }} zoom={13}>
          <DirectionsService
            options={{
              origin: mapOrigin,
              destination: mapDestination,
              travelMode: google.maps.TravelMode.TRANSIT,
            }}
            callback={directionsCallback}
          />
          {response && <DirectionsRenderer options={{ directions: response }} />}
        </GoogleMap>
      ) : (
        <div className="flex items-center justify-center h-full">
          <Loader2 className="animate-spin text-muted-foreground" size={32} />
        </div>
      )}
    </>
  );

  // ================= DESKTOP LAYOUT =================
  if (!isMobile) {
    return (
      <div className="flex h-screen w-full overflow-hidden bg-background">
        {/* SIDEBAR — KIRI */}
        <div
          style={{ width: panelWidth }}
          className="h-full overflow-y-auto border-r border-border bg-card p-4 shrink-0"
        >
          {sidebarContent}
        </div>

        {/* RESIZE HANDLE */}
        <div
          onMouseDown={onMouseDown}
          className="w-1.5 cursor-col-resize bg-border hover:bg-primary/40 transition-colors shrink-0"
        />

        {/* MAP — KANAN */}
        <div className="relative flex-1 h-full">{mapView}</div>
      </div>
    );
  }

  // ================= MOBILE LAYOUT =================
  return (
    <div className="relative h-screen w-full overflow-hidden bg-background">
      {/* MAP full-screen di belakang */}
      <div className="absolute inset-0">{mapView}</div>

      {/* Tombol kembali mengambang */}
      <button
        onClick={() => navigate(-1)}
        className="absolute top-4 left-4 z-20 bg-card border border-border rounded-full p-2.5 shadow-lg"
      >
        <ArrowLeft size={18} />
      </button>

      {/* BOTTOM SHEET — peek kecil, bisa di-expand */}
      <div
        className={`absolute left-0 right-0 bottom-0 z-30 bg-card rounded-t-2xl shadow-[0_-4px_20px_rgba(0,0,0,0.15)] border-t border-border flex flex-col transition-all duration-300 ease-out ${
          showPanel ? "h-[75vh]" : "h-28"
        }`}
      >
        {/* Header sheet — selalu terlihat, klik untuk toggle */}
        <button
          onClick={() => setShowPanel(!showPanel)}
          className="shrink-0 pt-2.5 pb-2 px-4 text-left"
        >
          <div className="w-10 h-1.5 rounded-full bg-border mx-auto mb-2.5" />
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-sm font-bold truncate">
                {selectedRoute.route_type === "transit" ? "Perjalanan Transit" : firstLeg.route_name}
              </p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock size={11} />
                {selectedRoute.total_estimated_time} mnt • {firstStopName} → {finalStopName}
              </p>
            </div>
            {showPanel ? (
              <ChevronDown size={18} className="text-muted-foreground shrink-0 ml-2" />
            ) : (
              <ChevronUp size={18} className="text-muted-foreground shrink-0 ml-2" />
            )}
          </div>
        </button>

        {/* Konten sheet — scroll sendiri, hanya render saat expanded */}
        {showPanel && (
          <div className="flex-1 overflow-y-auto px-4 pb-6">{sidebarContent}</div>
        )}
      </div>
    </div>
  );
}