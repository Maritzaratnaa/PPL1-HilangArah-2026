import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import { SearchableDropdown } from '@/components/ui/SearchableDropdown';
import { useNavigate } from "react-router-dom";
import {
  CheckCircle, AlertCircle, Clock, MessageSquare, Plus, ArrowRight,
  ShieldAlert, Inbox, Sparkles, X, Calendar, Loader2, Phone,
  MapPin, Navigation, Route, ListFilter,
} from "lucide-react";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

interface Report {
  report_id: string;
  category: string;
  description: string;
  status: "Pending" | "Processed" | "Resolved";
  stop_id: string | null;
  stop_name: string | null;
  subs_id: string | null;
  guide_name: string | null;
  guide_phone: string | null;
  user_phone: string | null;
  resolved_by: string | null;
  created_at: string;
}

interface LocationOption {
  id: string;
  name: string;
  type: "stop" | "trans";
  detail?: string;
  latitude?: number | null;
  longitude?: number | null;
}

interface RouteOption {
  id: string;
  name: string;
  trans_name?: string;
  trans_type?: string;
}

interface RouteStop {
  route_id: string;
  stop_id: string;
  stop_name: string;
  stop_detail?: string;
  latitude?: number | null;
  longitude?: number | null;
  stop_order: number;
}

interface GuideSubscription {
  subs_id: string;
  user_phone: string | null;
  employee_id: string | null;
  guide_name: string | null;
  guide_phone: string | null;
}

function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

const reportCategories = [
  { value: "Fasilitas", label: "Fasilitas", icon: "apartment", color: "bg-blue-100 text-blue-700" },
  { value: "Pemandu", label: "Pemandu", icon: "tour", color: "bg-orange-100 text-orange-700" },
];

const statusConfig = {
  Pending:   { label: "Menunggu", color: "bg-amber-100 text-amber-700",  icon: Clock        },
  Processed: { label: "Diproses", color: "bg-blue-100 text-blue-700",    icon: AlertCircle  },
  Resolved:  { label: "Selesai",  color: "bg-green-100 text-green-700",  icon: CheckCircle  },
};

function extractLocationFromDesc(desc: string): { location: string; cleanDesc: string } {
  const match = desc.match(/^\[Lokasi: (.+?)\]\n?/);
  if (match) return { location: match[1], cleanDesc: desc.replace(match[0], "") };
  return { location: "-", cleanDesc: desc };
}

export default function Reporting() {
  const navigate = useNavigate();
  const [showForm, setShowForm]       = useState(false);
  const [category, setCategory]       = useState("");
  const [locationId, setLocationId]   = useState("");
  const [description, setDescription] = useState("");
  const [successMessage, setSuccessMessage] = useState(false);
  const [reports, setReports]         = useState<Report[]>([]);
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [selectedSubsId, setSelectedSubsId] = useState("");
  const [loading, setLoading]         = useState(true);
  const [submitting, setSubmitting]   = useState(false);
  const [errorMsg, setErrorMsg]       = useState("");
  const [isPremium, setIsPremium] = useState<boolean>(false);
  const [guideSubscriptions, setGuideSubscriptions] = useState<GuideSubscription[]>([]);
  const [loadingGuideSubscriptions, setLoadingGuideSubscriptions] = useState(false);
  const [guideSubscriptionError, setGuideSubscriptionError] = useState("");

  const [locationOptions, setLocationOptions]   = useState<LocationOption[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [locationError, setLocationError]       = useState("");

  const [routes, setRoutes]                     = useState<RouteOption[]>([]);
  const [routeStops, setRouteStops]             = useState<RouteStop[]>([]);
  const [selectedRouteId, setSelectedRouteId]   = useState<string>("");
  const [locationMode, setLocationMode]         = useState<"current" | "route" | "all">("route");
  const [isLocating, setIsLocating]             = useState(false);
  const [locationNote, setLocationNote]         = useState<string>("");
  const [detectedAddress, setDetectedAddress]   = useState<string>("");
  const [detectedStopName, setDetectedStopName] = useState<string>("");

  const [existingPhone, setExistingPhone] = useState<string>("");
  const [phoneOption, setPhoneOption]     = useState<"existing" | "new">("existing");
  const [customPhone, setCustomPhone]     = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/login"); return; }
    fetchReports();
    fetchLocations();
    fetchGuideSubscriptions();
    fetchUserProfile(); 
  }, [navigate]);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      const res   = await fetch(`${BASE_URL}/api/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (res.ok && json.data) {
        const phone = json.data.phone_number || "";
        setExistingPhone(phone);
        if (!phone) {
          setPhoneOption("new");
        }
      }
    } catch {
    }
  };

  const fetchReports = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res   = await fetch(`${BASE_URL}/api/reports/my-reports`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (res.ok) {
        setReports(json.data ?? []);
        setIsPremium(json.is_premium ?? false);
      } else {
        setErrorMsg(json.message);
      }
    } catch {
      setErrorMsg("Gagal menghubungi server.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    let phoneToSend = phoneOption === "existing" ? existingPhone : "";
    if (phoneOption === "new") {
      if (!customPhone.trim()) {
        alert("Silakan masukkan nomor telepon kontak baru.");
        return;
      }
      phoneToSend = `+62${customPhone.trim()}`;
    }

    if (!category || !locationId || description.length < 10) return;
    const selectedGuideSubscription = guideSubscriptions.find((subscription) => subscription.subs_id === selectedSubsId);
    if (category === "Pemandu" && !isReportableGuideSubscription(selectedGuideSubscription)) return;

    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const res   = await fetch(`${BASE_URL}/api/reports`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          category,
          description,
          stop_id: locationId,
          ...(category === "Pemandu" ? { subs_id: selectedSubsId } : {}),
        }),
      });
      const json = await res.json();
      if (res.ok) {
        setSuccessMessage(true);
        resetForm();
        setTimeout(() => setSuccessMessage(false), 4000);
        fetchReports();
      } else if (res.status === 403) {
        alert(json.message || "Fitur ini hanya tersedia untuk pengguna premium.");
      } else {
        alert(json.message);
      }
    } catch {
      alert("Gagal menghubungi server.");
    } finally {
      setSubmitting(false);
    }
  };

  const fetchGuideSubscriptions = async () => {
    setLoadingGuideSubscriptions(true);
    setGuideSubscriptionError("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${BASE_URL}/api/reports/guide-options`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();

      if (!res.ok) {
        setGuideSubscriptionError(json.message || "Gagal memeriksa langganan pemandu.");
        return;
      }

      const subscriptions: GuideSubscription[] = json.data ?? [];
      setGuideSubscriptions(subscriptions);
      setIsPremium(json.has_active_subscription === true);
      const firstAvailable = subscriptions.find(isReportableGuideSubscription);
      if (firstAvailable) setSelectedSubsId(firstAvailable.subs_id);
    } catch (err) {
      console.error("Gagal memeriksa langganan pemandu:", err);
      setGuideSubscriptionError("Gagal memeriksa langganan dan kontak pemandu.");
    } finally {
      setLoadingGuideSubscriptions(false);
    }
  };

  const fetchLocations = async () => {
    setLoadingLocations(true);
    setLocationError("");
    try {
      const token = localStorage.getItem("token");
      const res   = await fetch(`${BASE_URL}/api/reports/locations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();

      if (!res.ok) {
        setLocationError("Gagal memuat daftar lokasi. Periksa koneksi Anda.");
        return;
      }

      const stops: LocationOption[] = (json.data?.stops ?? []).map((s: any) => ({
        id:        s.id,
        name:      s.name,
        type:      "stop" as const,
        detail:    s.detail || "",
        latitude:  s.latitude != null ? Number(s.latitude) : null,
        longitude: s.longitude != null ? Number(s.longitude) : null,
      }));

      const trans: LocationOption[] = (json.data?.trans ?? []).map((t: any) => ({
        id:     t.id,
        name:   t.name,
        type:   "trans" as const,
        detail: t.detail || "",
      }));

      const combined = [...stops, ...trans];
      setLocationOptions(combined);

      const rts: RouteOption[] = (json.data?.routes ?? []).map((r: any) => ({
        id:         r.id,
        name:       r.name,
        trans_name: r.trans_name || "",
        trans_type: r.trans_type || "",
      }));
      setRoutes(rts);

      const rStops: RouteStop[] = (json.data?.routeStops ?? []).map((rs: any) => ({
        route_id:    rs.route_id,
        stop_id:     rs.stop_id,
        stop_name:   rs.stop_name,
        stop_detail: rs.stop_detail || "",
        latitude:    rs.latitude != null ? Number(rs.latitude) : null,
        longitude:   rs.longitude != null ? Number(rs.longitude) : null,
        stop_order:  rs.stop_order,
      }));
      setRouteStops(rStops);

      if (combined.length === 0) {
        setLocationError("Belum ada data lokasi aktif. Silakan hubungi admin.");
      }
    } catch (err) {
      console.error("Gagal fetch lokasi:", err);
      setLocationError("Gagal memuat daftar lokasi. Periksa koneksi Anda.");
    } finally {
      setLoadingLocations(false);
    }
  };

  // --- INTEGRASI API DETEKSI LOKASI & HALTE TERDEKAT ---
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Perangkat Anda tidak mendukung fitur lokasi (Geolocation).");
      return;
    }

    setIsLocating(true);
    setLocationNote("");
    setDetectedAddress("");
    setDetectedStopName("");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;

        try {
          const token = localStorage.getItem("token");
          const res = await fetch(`${BASE_URL}/api/location/nearest-stop`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ lat: userLat, lng: userLng }),
          });

          const json = await res.json();

          if (res.ok && json.success && json.nearest_stop) {
            const { stop_id, name, distance_meters } = json.nearest_stop;
            const roundedDist = Math.round(Number(distance_meters));
            const distText =
              roundedDist < 1000
                ? `${roundedDist} meter`
                : `${(roundedDist / 1000).toFixed(1)} km`;

            setLocationId(stop_id);
            setDetectedStopName(name || "");
            setLocationNote(`Terdeteksi ± ${distText} dari posisi GPS Anda`);
            setDetectedAddress(
              json.address && json.address !== "Alamat tidak terdeteksi"
                ? json.address
                : json.nearest_stop.address || ""
            );
            return;
          } else {
            alert(json.message || "Tidak ada halte aktif dengan koordinat yang tersedia.");
          }
        } catch (err) {
          console.error("Gagal menghubungi API nearest-stop, menggunakan fallback lokal:", err);
          // Fallback menggunakan perhitungan Haversine di sisi client jika request ke API gagal
          const stopsWithCoords = locationOptions.filter(
            (s) =>
              s.type === "stop" &&
              s.latitude != null &&
              s.longitude != null &&
              !isNaN(Number(s.latitude)) &&
              !isNaN(Number(s.longitude))
          );

          if (stopsWithCoords.length === 0) {
            alert("Gagal mendeteksi halte terdekat dari server. Silakan pilih rute atau lokasi secara manual.");
            return;
          }

          let nearestStop = stopsWithCoords[0];
          let shortestDist = calculateDistanceMeters(
            userLat,
            userLng,
            Number(nearestStop.latitude),
            Number(nearestStop.longitude)
          );

          for (let i = 1; i < stopsWithCoords.length; i++) {
            const s = stopsWithCoords[i];
            const dist = calculateDistanceMeters(
              userLat,
              userLng,
              Number(s.latitude),
              Number(s.longitude)
            );
            if (dist < shortestDist) {
              shortestDist = dist;
              nearestStop = s;
            }
          }

          setLocationId(nearestStop.id);
          setDetectedStopName(nearestStop.name);
          const distText =
            shortestDist < 1000
              ? `${shortestDist} meter`
              : `${(shortestDist / 1000).toFixed(1)} km`;
          setLocationNote(`Terdeteksi ± ${distText} dari posisi GPS Anda`);
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        setIsLocating(false);
        let errorMsg = "Gagal mendeteksi lokasi saat ini.";
        if (error.code === error.PERMISSION_DENIED) {
          errorMsg = "Izin akses lokasi ditolak oleh browser. Silakan aktifkan izin lokasi di browser atau pilih rute secara manual.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errorMsg = "Informasi lokasi tidak tersedia pada perangkat Anda.";
        } else if (error.code === error.TIMEOUT) {
          errorMsg = "Waktu permintaan lokasi habis. Silakan coba lagi.";
        }
        alert(errorMsg);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  const handleRouteChange = (routeId: string) => {
    setSelectedRouteId(routeId);
    const stopsInRoute = routeStops.filter((rs) => rs.route_id === routeId);
    if (!stopsInRoute.some((rs) => rs.stop_id === locationId)) {
      setLocationId("");
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setCategory("");
    setSelectedSubsId("");
    setLocationId("");
    setSelectedRouteId("");
    setLocationMode("route");
    setLocationNote("");
    setDetectedAddress("");
    setDetectedStopName("");
    setDescription("");
    setCustomPhone("");
    setPhoneOption(existingPhone ? "existing" : "new");
  };

  const isReportableGuideSubscription = (subscription?: GuideSubscription) =>
    Boolean(
      subscription?.employee_id &&
      subscription.guide_name?.trim() &&
      subscription.guide_phone?.trim() &&
      subscription.user_phone?.trim(),
    );

  const availableGuideSubscriptions = guideSubscriptions.filter(isReportableGuideSubscription);
  const selectedGuideSubscription = guideSubscriptions.find((subscription) => subscription.subs_id === selectedSubsId);
  const selectedRoute = routes.find((r) => r.id === selectedRouteId);

  const filteredReports = reports.filter(
    (r) =>
      filterStatus === "all" ||
      (filterStatus === "pending"   && r.status === "Pending")   ||
      (filterStatus === "processed" && r.status === "Processed") ||
      (filterStatus === "resolved"  && r.status === "Resolved"),
  );

  const stats = {
    total:   reports.length,
    pending: reports.filter((r) => r.status === "Pending").length,
    resolved: reports.filter((r) => r.status === "Resolved").length,
  };

  const getLocationDisplay = (report: Report) => {
    if (report.stop_name) return report.stop_name;
    if (report.stop_id) {
      const opt = locationOptions.find((o) => o.id === report.stop_id);
      if (opt) return opt.name;
    }
    const { location } = extractLocationFromDesc(report.description);
    return location;
  };

  return (
    <div className="min-h-screen flex flex-col bg-background font-['Atkinson_Hyperlegible',_sans-serif]">
      <Navbar />

      <main className="flex-grow px-6 py-12 lg:px-10">
        <div className="mx-auto max-w-5xl">

          {successMessage && (
            <div className="mb-8 p-5 bg-green-50 border border-green-200 rounded-[24px] flex items-center justify-between animate-in zoom-in duration-300 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="bg-green-500 text-white p-2 rounded-full shadow-sm"><CheckCircle size={20} /></div>
                <div>
                  <p className="font-bold text-green-800 text-[16px]">Laporan Berhasil Dikirim!</p>
                  <p className="text-green-700 text-[14px]">Terima kasih, tim kami akan segera menindaklanjuti.</p>
                </div>
              </div>
              <Sparkles className="text-green-400" size={24} />
            </div>
          )}

          <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-[32px] font-bold text-foreground leading-tight tracking-tight">Pusat Bantuan ARAHIN</h1>
              <p className="text-muted-foreground text-[16px] font-medium mt-1">Kelola laporan kendala Anda di sini.</p>
            </div>
            {!showForm && (
              <Button
                onClick={() => setShowForm(true)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground h-14 px-8 rounded-2xl font-bold text-[16px] shadow-lg shadow-primary/20 flex items-center gap-2 transition-all active:scale-95">
                <Plus size={20} strokeWidth={3} /> Buat Laporan
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
            {[
              { label: "Total Laporan", value: stats.total,   icon: Inbox,       color: "text-primary"    },
              { label: "Menunggu",      value: stats.pending, icon: Clock,       color: "text-amber-500"  },
              { label: "Selesai",       value: stats.resolved, icon: CheckCircle, color: "text-green-500" },
            ].map((s, i) => (
              <Card key={i} className="p-6 border-border rounded-[24px] flex items-center gap-5 shadow-sm">
                <div className={`p-3 rounded-xl bg-muted/50 ${s.color}`}><s.icon size={24} /></div>
                <div>
                  <p className="text-[12px] font-bold text-muted-foreground uppercase tracking-widest">{s.label}</p>
                  <p className="text-[26px] font-bold text-foreground leading-none mt-1">{s.value}</p>
                </div>
              </Card>
            ))}
          </div>

          {showForm && (
            <Card className="mb-12 bg-card border-primary/20 rounded-[28px] p-8 lg:p-10 shadow-xl border-2 animate-in slide-in-from-top-4">
              <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-primary/10 rounded-2xl text-primary"><ShieldAlert size={24} /></div>
                <h2 className="text-[22px] font-bold text-foreground">Form Laporan Kendala</h2>
              </div>

              <div className="space-y-6">

                <div className="space-y-3">
                  <Label className="text-[15px] font-bold text-foreground ml-1">Kategori Masalah</Label>
                  <Select value={category} onValueChange={setCategory} disabled={submitting}>
                    <SelectTrigger className="h-14 border-border rounded-2xl font-medium text-[16px]">
                      <SelectValue placeholder="Pilih kategori kendala" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl">
                      {reportCategories.map((cat) => {
                        const isCategoryPremium = cat.value === "Pemandu";
                        const isDisabled = isCategoryPremium && !isPremium;

                        return (
                          <SelectItem 
                            key={cat.value} 
                            value={cat.value} 
                            disabled={isDisabled}
                            className="py-3 flex items-center justify-between data-[disabled]:opacity-50 data-[disabled]:pointer-events-none"
                          >
                            <div className="flex items-center gap-2">
                              <span className="material-symbols-outlined text-[20px]">
                                {cat.icon}
                              </span>
                              <span className="font-medium">
                                {cat.label} {isDisabled && (
                                  <span className="text-[13px] font-normal text-muted-foreground ml-2">
                                    (Khusus Langganan)
                                  </span>
                                )}
                              </span>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  {category === "Pemandu" && (
                    <div className="rounded-2xl border border-border bg-muted/20 p-4 text-[14px]">
                      {loadingGuideSubscriptions ? (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Loader2 size={16} className="animate-spin" />
                          Memeriksa langganan dan kontak...
                        </div>
                      ) : guideSubscriptionError ? (
                        <p className="text-rose-600">{guideSubscriptionError}</p>
                      ) : availableGuideSubscriptions.length === 0 ? (
                        <p className="text-muted-foreground">
                          {isPremium
                            ? "Pemandu atau nomor kontak pengguna/pemandu belum tersedia pada langganan aktif."
                            : "Pelaporan pemandu hanya tersedia jika Anda memiliki langganan aktif."}
                        </p>
                      ) : (
                        <div className="space-y-3">
                          <Label className="font-bold text-foreground">Pemandu dari langganan aktif</Label>
                          <Select
                            value={selectedSubsId}
                            onValueChange={setSelectedSubsId}
                            disabled={submitting}
                          >
                            <SelectTrigger className="h-12 rounded-xl bg-background">
                              <SelectValue placeholder="Pilih pemandu langganan" />
                            </SelectTrigger>
                            <SelectContent>
                              {guideSubscriptions.map((subscription) => (
                                <SelectItem
                                  key={subscription.subs_id}
                                  value={subscription.subs_id}
                                  disabled={!isReportableGuideSubscription(subscription)}
                                >
                                  {subscription.guide_name || "Pemandu belum ditetapkan"}
                                  {!isReportableGuideSubscription(subscription) && " (kontak belum tersedia)"}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {isReportableGuideSubscription(selectedGuideSubscription) && (
                            <div className="grid gap-2 text-muted-foreground sm:grid-cols-2">
                              <p>Nomor pengguna: <span className="font-semibold text-foreground">{selectedGuideSubscription.user_phone}</span></p>
                              <p>Nomor pemandu: <span className="font-semibold text-foreground">{selectedGuideSubscription.guide_phone}</span></p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <Label className="text-[15px] font-bold text-foreground ml-1">
                      Lokasi Kejadian
                    </Label>

                    <div className="flex flex-wrap gap-1.5 p-1 bg-muted/50 rounded-xl border border-border w-fit">
                      <button
                        type="button"
                        onClick={() => {
                          setLocationMode("current");
                          handleUseCurrentLocation();
                        }}
                        disabled={submitting || loadingLocations}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          locationMode === "current"
                            ? "bg-card text-primary shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <Navigation size={13} />
                        Gunakan Lokasi Saat Ini
                      </button>
                      <button
                        type="button"
                        onClick={() => setLocationMode("route")}
                        disabled={submitting || loadingLocations}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          locationMode === "route"
                            ? "bg-card text-primary shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <Route size={13} />
                        Pilih Sesuai Rute
                      </button>
                      <button
                        type="button"
                        onClick={() => setLocationMode("all")}
                        disabled={submitting || loadingLocations}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          locationMode === "all"
                            ? "bg-card text-primary shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <ListFilter size={13} />
                        Semua Lokasi
                      </button>
                    </div>
                  </div>

                  {loadingLocations ? (
                    <div className="h-14 border border-border rounded-2xl px-4 flex items-center gap-3 text-muted-foreground">
                      <Loader2 size={18} className="animate-spin text-primary" />
                      <span className="text-[15px]">Memuat daftar lokasi dan rute...</span>
                    </div>
                  ) : locationError ? (
                    <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-sm">
                      {locationError}
                    </div>
                  ) : (
                    <>
                      {locationMode === "current" && (
                        <div className="space-y-3 p-4 rounded-2xl border border-border bg-card/60">
                          {isLocating ? (
                            <div className="h-20 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                              <Loader2 size={22} className="animate-spin text-primary" />
                              <span className="text-sm font-medium">Mendeteksi koordinat GPS dan halte terdekat...</span>
                            </div>
                          ) : (
                            <>
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="flex items-start gap-3">
                                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <MapPin size={20} />
                                  </div>
                                  <div className="space-y-0.5">
                                    <div className="text-sm font-bold text-foreground">
                                      {locationId ? (
                                        locationOptions.find((o) => o.id === locationId)?.name ||
                                        detectedStopName ||
                                        "Halte Terdeteksi"
                                      ) : (
                                        "Belum ada lokasi terdeteksi"
                                      )}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {locationNote || "Klik tombol di samping untuk mendeteksi halte terdekat dari posisi GPS Anda"}
                                    </div>
                                    {detectedAddress && (
                                      <div className="text-[11px] text-primary/80 font-medium pt-0.5">
                                        📍 Sekitar: {detectedAddress}
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={handleUseCurrentLocation}
                                  disabled={isLocating || submitting}
                                  className="gap-1.5 rounded-xl font-semibold flex-shrink-0 w-fit"
                                >
                                  <Navigation size={14} />
                                  {locationId ? "Deteksi Ulang" : "Deteksi Lokasi"}
                                </Button>
                              </div>

                              <div className="pt-3 border-t border-border/60">
                                <Label className="text-xs text-muted-foreground block mb-1.5">
                                  Bukan lokasi yang tepat? Ganti manual dengan halte lain:
                                </Label>
                                <SearchableDropdown
                                  options={locationOptions
                                    .filter((o) => o.type === "stop")
                                    .map((o) => ({
                                      value: o.id,
                                      label: o.name,
                                      detail: o.detail,
                                    }))}
                                  value={locationId}
                                  onChange={(val) => {
                                    setLocationId(val);
                                    setLocationNote("Dipilih manual");
                                  }}
                                  placeholder="Cari atau ganti halte..."
                                  searchPlaceholder="Ketik nama halte..."
                                  disabled={submitting}
                                  triggerClassName="h-11 rounded-xl text-[14px]"
                                />
                              </div>
                            </>
                          )}
                        </div>
                      )}

                      {locationMode === "route" && (
                        <div className="space-y-3 p-4 rounded-2xl border border-border bg-card/60">
                          <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-muted-foreground">
                              1. Pilih Rute Transportasi
                            </Label>
                            <SearchableDropdown
                              options={routes.map((r) => ({
                                value: r.id,
                                label: r.name,
                                group: r.trans_type || r.trans_name || "Rute",
                                detail: [r.trans_name, r.trans_type].filter(Boolean).join(" • "),
                              }))}
                              value={selectedRouteId}
                              onChange={handleRouteChange}
                              placeholder="Pilih rute perjalanan..."
                              searchPlaceholder="Cari rute (misal: Koridor 1, MRT, LRT)..."
                              disabled={submitting}
                              triggerClassName="h-12 rounded-xl text-[15px]"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-muted-foreground">
                              2. Pilih Halte / Stasiun pada Rute
                            </Label>
                            <SearchableDropdown
                              options={
                                selectedRouteId
                                  ? routeStops
                                      .filter((rs) => rs.route_id === selectedRouteId)
                                      .sort((a, b) => a.stop_order - b.stop_order)
                                      .map((rs) => ({
                                        value: rs.stop_id,
                                        label: `${rs.stop_order}. ${rs.stop_name}`,
                                        detail: rs.stop_detail,
                                      }))
                                  : []
                              }
                              value={locationId}
                              onChange={(val) => {
                                setLocationId(val);
                                setLocationNote("");
                              }}
                              placeholder={
                                selectedRouteId
                                  ? "Pilih halte di sepanjang rute ini..."
                                  : "Pilih rute di atas terlebih dahulu"
                              }
                              searchPlaceholder="Cari nama halte pada rute ini..."
                              disabled={submitting || !selectedRouteId}
                              triggerClassName="h-12 rounded-xl text-[15px]"
                            />
                            {selectedRoute && (
                              <p className="text-xs text-muted-foreground ml-1">
                                Menampilkan halte yang dilayani oleh rute <span className="font-semibold text-foreground">{selectedRoute.name}</span>.
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {locationMode === "all" && (
                        <div className="space-y-2">
                          <SearchableDropdown
                            options={[
                              ...locationOptions
                                .filter((o) => o.type === "stop")
                                .map((o) => ({ value: o.id, label: o.name, group: "Halte / Stasiun", detail: o.detail })),
                              ...locationOptions
                                .filter((o) => o.type === "trans")
                                .map((o) => ({ value: o.id, label: o.name, group: "Transportasi", detail: o.detail })),
                            ]}
                            value={locationId}
                            onChange={(val) => {
                              setLocationId(val);
                              setLocationNote("");
                            }}
                            placeholder="Pilih halte atau transportasi..."
                            searchPlaceholder="Cari langsung semua halte atau transportasi..."
                            disabled={submitting}
                            triggerClassName="h-14 rounded-2xl text-[16px] font-medium"
                            dropdownClassName="text-[16px]"
                          />
                          <p className="text-xs text-muted-foreground ml-1">
                            Cari langsung dari seluruh halte, stasiun, atau armada transportasi yang terdaftar.
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div className="space-y-3">
                  <Label className="text-[15px] font-bold text-foreground ml-1">
                    Nomor yang Dapat Dihubungi
                  </Label>

                  <div className="flex flex-wrap gap-2 p-1 bg-muted/50 rounded-xl border border-border w-fit">
                    <button
                      type="button"
                      onClick={() => setPhoneOption("existing")}
                      disabled={!existingPhone}
                      className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                        phoneOption === "existing"
                          ? "bg-card text-primary shadow-sm"
                          : "text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed"
                      }`}>
                      Gunakan Kontak Terdaftar
                    </button>
                    <button
                      type="button"
                      onClick={() => setPhoneOption("new")}
                      className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                        phoneOption === "new"
                          ? "bg-card text-primary shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}>
                      Masukkan Kontak Baru
                    </button>
                  </div>

                  {phoneOption === "existing" ? (
                    existingPhone ? (
                      <div className="h-14 border border-border rounded-2xl px-5 flex items-center justify-between bg-muted/20">
                        <span className="text-[16px] font-semibold text-foreground">{existingPhone}</span>
                        <span className="text-xs text-muted-foreground">dari profil Anda</span>
                      </div>
                    ) : (
                      <div className="h-14 border border-dashed border-border rounded-2xl px-5 flex items-center text-muted-foreground">
                        <span className="text-[14px]">Nomor telepon belum diisi di profil. Gunakan kontak baru.</span>
                      </div>
                    )
                  ) : (
                    <div className="relative">
                      <span
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold border-r border-border pr-3 flex items-center h-5 select-none"
                        style={{ fontSize: "16px" }}
                      >
                        +62
                      </span>
                      <Input
                        type="tel"
                        inputMode="numeric"
                        value={customPhone}
                        onChange={(e) => {
                          let val = e.target.value.replace(/\D/g, "");
                          if (val.startsWith("0")) val = val.substring(1);
                          setCustomPhone(val);
                        }}
                        placeholder="812xxxxxxx"
                        className="h-14 border-border rounded-2xl font-medium text-[16px] md:text-[16px] placeholder:text-[16px]"
                        style={{ fontSize: "16px", paddingLeft: "68px" }}
                        maxLength={13}
                        disabled={submitting}
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <Label className="text-[15px] font-bold text-foreground ml-1">Deskripsi Masalah</Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Ceritakan kendala Anda secara detail..."
                    className="min-h-[140px] border-border rounded-2xl p-5 font-medium text-[16px] leading-relaxed focus:ring-primary"
                    maxLength={500}
                    disabled={submitting}
                  />
                  <p className="text-[13px] text-muted-foreground text-right">{description.length}/500 karakter</p>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-border">
                  <Button
                    variant="ghost"
                    onClick={resetForm}
                    className="h-12 px-6 rounded-xl font-bold"
                    disabled={submitting}>
                    Batal
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={
                      submitting ||
                      !category ||
                      !locationId ||
                      description.length < 10 ||
                      (category === "Pemandu" && (!isReportableGuideSubscription(selectedGuideSubscription) || loadingGuideSubscriptions))
                    }
                    className="bg-primary text-primary-foreground h-12 px-10 rounded-xl font-bold">
                    {submitting
                      ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Mengirim...</>
                      : "Kirim Laporan"}
                  </Button>
                </div>
              </div>
            </Card>
          )}

          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h2 className="text-[20px] font-bold text-foreground flex items-center gap-2">
                <MessageSquare size={20} className="text-primary" /> Riwayat Laporan
              </h2>
              <div className="flex bg-muted/50 p-1.5 rounded-2xl border border-border">
                {[
                  { key: "all",       label: "Semua"    },
                  { key: "pending",   label: "Menunggu" },
                  { key: "processed", label: "Diproses" },
                  { key: "resolved",  label: "Selesai"  },
                ].map((st) => (
                  <button
                    key={st.key}
                    onClick={() => setFilterStatus(st.key)}
                    className={`px-4 py-1.5 rounded-xl text-[13px] font-bold transition-all ${
                      filterStatus === st.key
                        ? "bg-card text-primary shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}>
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : errorMsg ? (
              <Card className="p-12 border-dashed border-2 border-border rounded-[28px] bg-muted/10 text-center">
                <AlertCircle className="text-rose-500 mx-auto mb-4" size={40} />
                <p className="font-bold text-foreground">{errorMsg}</p>
              </Card>
            ) : filteredReports.length === 0 ? (
              <Card className="p-20 border-dashed border-2 border-border rounded-[28px] bg-muted/10 text-center">
                <Inbox className="text-muted-foreground mx-auto mb-4" size={40} />
                <p className="font-bold text-foreground">Belum Ada Laporan</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filteredReports.map((report) => {
                  const cat      = reportCategories.find((c) => c.value === report.category);
                  const status   = statusConfig[report.status] || statusConfig["Pending"];
                  const StatusIcon = status.icon;
                  const { cleanDesc } = extractLocationFromDesc(report.description);
                  const locationDisplay = getLocationDisplay(report);

                  return (
                    <Card
                      key={report.report_id}
                      onClick={() => setSelectedReport(report)}
                      className="bg-card border-border rounded-[24px] p-6 hover:border-primary/50 transition-all shadow-sm group cursor-pointer active:scale-[0.99]">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-start gap-4 min-w-0 flex-1">
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${cat?.color || "bg-gray-100 text-gray-700"}`}>
                            <span className="material-symbols-outlined text-[28px]">{cat?.icon || "assignment"}</span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <span className="text-[12px] font-bold text-muted-foreground uppercase tracking-widest whitespace-nowrap">
                                #{report.report_id.slice(0, 8).toUpperCase()}
                              </span>
                              <Badge className={`${status.color} border-none font-bold text-[11px] rounded-lg px-2.5 py-0.5 flex items-center gap-1.5 whitespace-nowrap`}>
                                <StatusIcon size={12} strokeWidth={3} className="shrink-0" /> {status.label}
                              </Badge>
                            </div>
                            <h3 className="font-bold text-foreground text-[17px] mb-1 group-hover:text-primary transition-colors truncate">
                              {cat?.label || report.category}
                            </h3>
                            {locationDisplay !== "-" && (
                              <p className="text-[13px] text-primary font-semibold mb-1">{locationDisplay}</p>
                            )}
                            <p className="text-muted-foreground text-[15px] font-medium line-clamp-1 break-words">{cleanDesc}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between md:justify-end border-t md:border-t-0 border-border pt-3 md:pt-0 shrink-0">
                          <div className="md:text-right">
                            <p className="text-[14px] font-bold text-foreground whitespace-nowrap">
                              {new Date(report.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                            </p>
                            <p className="text-[12px] font-medium text-muted-foreground whitespace-nowrap">
                              Pukul {new Date(report.created_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                          <ArrowRight className="ml-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0" size={20} />
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      <Dialog open={!!selectedReport} onOpenChange={(open) => !open && setSelectedReport(null)}>
        <DialogContent className="max-w-2xl rounded-[32px] p-8 lg:p-10 border-border bg-card font-['Atkinson_Hyperlegible'] [&>button:last-child]:hidden">
          {selectedReport && (() => {
            const cat    = reportCategories.find((c) => c.value === selectedReport.category);
            const status = statusConfig[selectedReport.status] || statusConfig["Pending"];
            const { cleanDesc } = extractLocationFromDesc(selectedReport.description);
            const locationDisplay = getLocationDisplay(selectedReport);

            return (
              <>
                <DialogHeader className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-[14px] font-bold text-muted-foreground tracking-widest uppercase">
                        #{selectedReport.report_id.slice(0, 8).toUpperCase()}
                      </span>
                      <Badge className={`${status.color} border-none font-bold text-[12px] px-3 py-1 rounded-lg`}>
                        {status.label}
                      </Badge>
                    </div>
                    <button
                      onClick={() => setSelectedReport(null)}
                      className="p-2 hover:bg-muted rounded-full transition-colors">
                      <X size={20} className="text-muted-foreground" />
                    </button>
                  </div>
                  <DialogTitle className="text-[28px] font-bold text-foreground">
                    Detail Laporan {cat?.label || selectedReport.category}
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-muted/30 rounded-2xl border border-border">
                      <p className="text-[11px] font-bold text-muted-foreground uppercase mb-1 flex items-center gap-2">
                        <Calendar size={12} className="text-primary" /> Tanggal Laporan
                      </p>
                      <p className="font-bold text-foreground text-[15px]">
                        {new Date(selectedReport.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                      </p>
                    </div>
                    <div className="p-4 bg-muted/30 rounded-2xl border border-border">
                      <p className="text-[11px] font-bold text-muted-foreground uppercase mb-1 flex items-center gap-2">
                        <ShieldAlert size={12} className="text-primary" /> Kategori
                      </p>
                      <p className="font-bold text-foreground text-[15px]">{cat?.label || selectedReport.category}</p>
                    </div>
                  </div>

                  {locationDisplay !== "-" && (
                    <div className="p-4 bg-primary/5 rounded-2xl border border-primary/15">
                      <p className="text-[11px] font-bold text-muted-foreground uppercase mb-1">Lokasi Kejadian</p>
                      <p className="font-bold text-foreground text-[15px]">{locationDisplay}</p>
                    </div>
                  )}

                  {selectedReport.category === "Pemandu" && (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="p-4 bg-muted/30 rounded-2xl border border-border">
                        <p className="text-[11px] font-bold text-muted-foreground uppercase mb-1">Pemandu</p>
                        <p className="font-bold text-foreground text-[15px]">{selectedReport.guide_name || "Tidak tersedia"}</p>
                        <p className="text-[13px] text-muted-foreground mt-1">{selectedReport.guide_phone || "Nomor tidak tersedia"}</p>
                      </div>
                      <div className="p-4 bg-muted/30 rounded-2xl border border-border">
                        <p className="text-[11px] font-bold text-muted-foreground uppercase mb-1">Nomor Pengguna</p>
                        <p className="font-bold text-foreground text-[15px]">{selectedReport.user_phone || "Tidak tersedia"}</p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    <h4 className="text-[14px] font-bold text-foreground uppercase tracking-widest flex items-center gap-2">
                      <MessageSquare size={14} className="text-primary" /> Deskripsi Lengkap
                    </h4>
                    <div className="p-6 bg-muted/20 border border-border rounded-2xl">
                      <p className="text-[16px] font-medium text-foreground leading-relaxed whitespace-pre-wrap">{cleanDesc}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-5 bg-primary/5 border border-primary/10 rounded-2xl">
                    <div className="p-2 bg-primary/10 rounded-xl text-primary flex-shrink-0"><ShieldAlert size={20} /></div>
                    <div>
                      <p className="text-[15px] font-bold text-foreground">Informasi Penanganan</p>
                      <p className="text-[14px] font-medium text-muted-foreground leading-relaxed mt-1">
                        {selectedReport.status === "Pending"
                          ? "Laporan Anda telah kami terima dan sedang mengantre untuk diperiksa oleh tim Support ARAHIN. Kami akan memprosesnya dalam waktu maksimal 1x24 jam."
                          : selectedReport.status === "Processed"
                          ? "Tim kami sedang menangani kendala ini. Harap tunggu pemberitahuan lebih lanjut."
                          : "Kendala ini telah berhasil diselesaikan. Silakan hubungi pusat bantuan jika masih ada masalah."}
                      </p>
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    onClick={() => setSelectedReport(null)}
                    className="w-full bg-primary text-primary-foreground h-14 rounded-2xl font-bold text-[17px]">
                    Tutup Rincian
                  </Button>
                </DialogFooter>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}