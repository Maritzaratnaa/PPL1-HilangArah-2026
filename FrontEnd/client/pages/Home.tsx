import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import {
  MapPin,
  AlertCircle,
  Star,
  UserCheck,
  ArrowRight,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// ── Data dummy ──
const recommendedRoutes = [
  {
    icon: "🚇",
    name: "Sudirman → RS Cipto",
    meta: "MRT + TransJakarta · 45 mnt",
    accessible: true,
    duration: "45 mnt",
  },
  {
    icon: "🚌",
    name: "Blok M → Kota",
    meta: "TransJakarta Kor. 1 · 60 mnt",
    accessible: true,
    duration: "60 mnt",
  },
  {
    icon: "🚈",
    name: "Manggarai → Bogor",
    meta: "KRL Commuterline · 80 mnt",
    accessible: false,
    duration: "80 mnt",
  },
];

const reports = [
  {
    icon: "🛗",
    name: "Lift Stasiun Mati",
    location: "MRT Bundaran HI",
    time: "2 jam lalu",
    status: "Diproses",
    statusColor: "yellow",
  },
  {
    icon: "🚧",
    name: "Trotoar Rusak",
    location: "Jl. Sudirman",
    time: "2 hari lalu",
    status: "Selesai",
    statusColor: "green",
  },
  {
    icon: "♿",
    name: "Ramp Rusak",
    location: "Halte Semanggi",
    time: "3 hari lalu",
    status: "Menunggu",
    statusColor: "yellow",
  },
];

const quickActions = [
  {
    icon: <MapPin className="h-6 w-6" />,
    label: "Cari Rute",
    sub: "Rute aksesibel",
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    color: "text-emerald-600",
    href: "/route-search",
  },
  {
    icon: <UserCheck className="h-6 w-6" />,
    label: "Pesan Pemandu",
    sub: "Tersedia sekarang",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    color: "text-amber-600",
    href: "#",
  },
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
    label: "Subscription",
    sub: "20 hari tersisa",
    bg: "bg-blue-50 dark:bg-blue-950/30",
    color: "text-blue-600",
    href: "/subscription",
  },
];

function Badge({ status }: { status: string }) {
  const map: Record<string, string> = {
    green:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    yellow:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    red: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${map[status]}`}
    >
      {status === "green"
        ? "✅ Selesai"
        : "⏳ " + (status === "yellow" ? "" : "")}
    </span>
  );
}

export default function Home() {
  const [userName, setUserName] = useState("Pengguna");
  const [userCategory, setUserCategory] = useState("");
  const [currentDate, setCurrentDate] = useState("");

  useEffect(() => {
    const name = localStorage.getItem("userName") || "Pengguna";
    const category = localStorage.getItem("userCategory") || "";
    setUserName(name.split(" ")[0]);
    setUserCategory(category);

    const now = new Date();
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    };
    setCurrentDate(now.toLocaleDateString("id-ID", options));
  }, []);

  const navigate = useNavigate();
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");

  const handleSearch = () => {
    if (!origin || !destination) return;
    // Mengirim teks nama halte yang diketik ke halaman hasil
    navigate(`/route-results?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      {/* ── GREETING HERO ── */}
      <section
        className="relative overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, hsl(186 100% 27%) 0%, hsl(186 100% 18%) 100%)",
        }}
      >
        {/* Decorative orbs */}
        <div
          className="absolute top-0 right-0 w-64 h-64 rounded-full -translate-y-1/2 translate-x-1/2"
          style={{ background: "rgba(255,255,255,0.05)" }}
          aria-hidden="true"
        />
        <div
          className="absolute bottom-0 left-1/4 w-32 h-32 rounded-full translate-y-1/2"
          style={{ background: "rgba(255,255,255,0.03)" }}
          aria-hidden="true"
        />

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-12 pb-0">
          <div className="grid lg:grid-cols-[1fr_260px] gap-8 items-end">
            {/* Left: greeting + search */}
            <div>
              <p className="text-white/60 text-sm font-semibold mb-1">
                {currentDate}
              </p>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                Halo, <span style={{ color: "#7dd8a6" }}>{userName}</span> 👋
              </h1>
              <p className="text-white/65 text-sm mb-6">
                Mau ke mana hari ini? Temukan rute aksesibel untuk perjalanan
                Anda.
              </p>
              <div className="flex flex-wrap gap-2 mb-8">
                {userCategory && (
                  <span
                    className="px-3 py-1 rounded-full text-xs font-semibold"
                    style={{
                      background: "rgba(255,255,255,0.12)",
                      color: "rgba(255,255,255,0.85)",
                      border: "1px solid rgba(255,255,255,0.2)",
                    }}
                  >
                    {userCategory}
                  </span>
                )}
                <span
                  className="px-3 py-1 rounded-full text-xs font-semibold"
                  style={{
                    background: "rgba(125,216,166,0.2)",
                    color: "#7dd8a6",
                    border: "1px solid rgba(125,216,166,0.3)",
                  }}
                >
                  ⭐ Subscriber Aktif
                </span>
              </div>

              {/* Search bar */}
              <div
                className="rounded-xl p-4 mb-0"
                style={{
                  background: "rgba(255,255,255,0.1)",
                  border: "1.5px solid rgba(255,255,255,0.18)",
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="flex-1 flex items-center gap-3 rounded-lg px-4 py-2.5"
                    style={{
                      background: "rgba(255,255,255,0.1)",
                      border: "1.5px solid rgba(255,255,255,0.18)",
                    }}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
                    <input
                      value={origin}
                      onChange={(e) => setOrigin(e.target.value)}
                      placeholder="📍 Halte asal..."
                      className="bg-transparent text-white text-sm outline-none w-full placeholder:text-white/40"
                    />
                  </div>
                  <span className="text-white/30 text-lg">→</span>
                  <div
                    className="flex-1 flex items-center gap-3 rounded-lg px-4 py-2.5"
                    style={{
                      background: "rgba(255,255,255,0.1)",
                      border: "1.5px solid rgba(255,255,255,0.18)",
                    }}
                  >
                    <span className="w-2 h-2 rounded-full bg-rose-400 flex-shrink-0" />
                    <input
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      placeholder="🏁 Halte tujuan..."
                      className="bg-transparent text-white text-sm outline-none w-full placeholder:text-white/40"
                    />
                  </div>
                  <Button
                    onClick={handleSearch}
                    disabled={!origin || !destination}
                    className="bg-white font-bold text-sm px-5 h-10 rounded-lg hover:-translate-y-0.5 transition-all disabled:opacity-50"
                    style={{ color: "hsl(186 100% 27%)" }}
                  >
                    Cari Rute
                  </Button>
                </div>
              </div>
            </div>

            {/* Right: subscription card */}
            <div
              className="rounded-xl p-5 mb-0 self-end"
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.15)",
              }}
            >
              <div
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold mb-3"
                style={{
                  background: "rgba(125,216,166,0.2)",
                  color: "#7dd8a6",
                  border: "1px solid rgba(125,216,166,0.3)",
                }}
              >
                ⭐ Aktif
              </div>
              <div className="text-white font-bold text-sm mb-1">
                Paket Bulanan
              </div>
              <div className="text-white/55 text-xs mb-3">
                Berlaku hingga 31 Mar 2026
              </div>
              <div
                className="h-1.5 rounded-full mb-1"
                style={{ background: "rgba(255,255,255,0.15)" }}
              >
                <div
                  className="h-full rounded-full bg-emerald-400"
                  style={{ width: "65%" }}
                />
              </div>
              <div className="text-white/45 text-xs mb-4">20 hari tersisa</div>
              <Link to="/subscription">
                <button
                  className="w-full rounded-lg py-2 text-xs font-bold transition-all hover:opacity-90"
                  style={{
                    background: "rgba(255,255,255,0.15)",
                    color: "#fff",
                    border: "1px solid rgba(255,255,255,0.2)",
                  }}
                >
                  Perpanjang →
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Wave divider */}
        <svg
          viewBox="0 0 1440 48"
          fill="none"
          className="w-full -mb-1 mt-6"
          aria-hidden="true"
        >
          <path
            d="M0 24 Q180 0 360 24 Q540 48 720 24 Q900 0 1080 24 Q1260 48 1440 24 L1440 48 L0 48Z"
            className="fill-background"
          />
        </svg>
      </section>

      {/* ── STATS ── */}
      <section className="bg-muted/50 py-10 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-lg font-bold mb-5">Ringkasan Saya</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                val: "8",
                label: "Rute Digunakan",
                sub: "3 rute minggu ini",
                progress: null,
              },
              {
                val: "3",
                label: "Laporan Aktif",
                sub: "1 sedang diproses",
                progress: null,
              },
              {
                val: "20",
                label: "Hari Subscription",
                sub: "Berlaku hingga 31 Mar",
                progress: 65,
              },
            ].map((s, i) => (
              <div
                key={i}
                className="bg-background rounded-xl border border-border p-5
                high-contrast:border-2 high-contrast:border-primary"
              >
                <div className="text-3xl font-bold text-primary mb-1">
                  {s.val}
                </div>
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                  {s.label}
                </div>
                <div className="text-sm text-muted-foreground">{s.sub}</div>
                {s.progress && (
                  <div className="mt-3 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${s.progress}%` }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── QUICK ACTIONS ── */}
      <section className="bg-background py-10 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-lg font-bold mb-5">Akses Cepat</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map((qa, i) => (
              <Link key={i} to={qa.href}>
                <div
                  className="bg-background rounded-xl border border-border p-5
                  hover:shadow-md hover:-translate-y-0.5 transition-all text-center
                  high-contrast:border-2 high-contrast:border-primary"
                >
                  <div
                    className={`w-12 h-12 rounded-xl ${qa.bg} ${qa.color}
                    flex items-center justify-center mx-auto mb-3`}
                  >
                    {qa.icon}
                  </div>
                  <div className="text-sm font-bold text-foreground">
                    {qa.label}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {qa.sub}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── RUTE + LAPORAN ── */}
      <section className="bg-muted/50 py-10 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Rekomendasi Rute */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold">🗺️ Rekomendasi Rute</h2>
                <Link
                  to="/route-search"
                  className="text-sm font-bold text-primary flex items-center gap-1 hover:underline"
                >
                  Cari Rute <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
              <div
                className="bg-background rounded-xl border border-border divide-y divide-border
    high-contrast:border-2 high-contrast:border-primary"
              >
                {recommendedRoutes.map((r, i) => (
                  <Link key={i} to="/route-search">
                    <div className="flex items-center gap-3 p-4 hover:bg-muted/40 transition-colors">
                      <div
                        className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/30
            flex items-center justify-center text-lg flex-shrink-0"
                      >
                        {r.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold truncate">
                          {r.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {r.meta}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs text-muted-foreground">
                          {r.duration}
                        </span>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                            r.accessible
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                              : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                          }`}
                        >
                          {r.accessible ? "♿ Aksesibel" : "⚠ Sebagian"}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Laporan saya */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold">📢 Laporan Saya</h2>
                <Link
                  to="/reporting"
                  className="text-sm font-bold text-primary flex items-center gap-1 hover:underline"
                >
                  Lihat Semua <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
              <div
                className="bg-background rounded-xl border border-border divide-y divide-border
                high-contrast:border-2 high-contrast:border-primary"
              >
                {reports.map((r, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-4 hover:bg-muted/40 transition-colors"
                  >
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0 ${
                        r.statusColor === "green"
                          ? "bg-emerald-50 dark:bg-emerald-950/30"
                          : r.statusColor === "yellow"
                            ? "bg-amber-50 dark:bg-amber-950/30"
                            : "bg-rose-50 dark:bg-rose-950/30"
                      }`}
                    >
                      {r.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold truncate">
                        {r.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        📍 {r.location} · {r.time}
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold flex-shrink-0 ${
                        r.statusColor === "green"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                          : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                      }`}
                    >
                      {r.statusColor === "green"
                        ? "✅ Selesai"
                        : `⏳ ${r.status}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
