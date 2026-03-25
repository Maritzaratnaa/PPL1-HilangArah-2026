import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Clock, MapPin, Bus } from 'lucide-react';

interface Facility {
  low_entry: boolean;
  wheelchair_slot: boolean;
  priority_seat: boolean;
}

interface RouteResult {
  route_id: string;
  route_name: string;
  transport: {
    name: string;
    type: string;
    facilities: Facility;
  };
  journey: {
    origin_stop: string;
    destination_stop: string;
    stops_passed: number;
    estimated_time_minutes: number;
  };
}

const dummyResults = {
  filter_applied: 'Penyandang Disabilitas',
  total_recommendations: 3,
  data: [
    {
      route_id: '1',
      route_name: 'Koridor 1 - Blok M - Kota',
      transport: {
        name: 'TransJakarta',
        type: 'Bus',
        facilities: { low_entry: true, wheelchair_slot: true, priority_seat: true },
      },
      journey: {
        origin_stop: 'Halte Sudirman',
        destination_stop: 'Halte Kota',
        stops_passed: 8,
        estimated_time_minutes: 35,
      },
    },
    {
      route_id: '2',
      route_name: 'MRT Jakarta Selatan - Utara',
      transport: {
        name: 'MRT Jakarta',
        type: 'MRT',
        facilities: { low_entry: true, wheelchair_slot: true, priority_seat: true },
      },
      journey: {
        origin_stop: 'Stasiun Sudirman',
        destination_stop: 'Stasiun Bundaran HI',
        stops_passed: 3,
        estimated_time_minutes: 12,
      },
    },
    {
      route_id: '3',
      route_name: 'KRL Commuter Bogor - Jakarta Kota',
      transport: {
        name: 'KRL Commuterline',
        type: 'KRL',
        facilities: { low_entry: false, wheelchair_slot: false, priority_seat: true },
      },
      journey: {
        origin_stop: 'Stasiun Manggarai',
        destination_stop: 'Stasiun Jakarta Kota',
        stops_passed: 5,
        estimated_time_minutes: 45,
      },
    },
  ],
};

export default function RouteResults() {
  const [originName, setOriginName] = useState('Halte Sudirman');
  const [destinationName, setDestinationName] = useState('Halte Kota');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }

    // Ambil dari sessionStorage kalau ada (dari RouteSearch)
    const stored = sessionStorage.getItem('originName');
    const storedDest = sessionStorage.getItem('destinationName');
    if (stored) setOriginName(stored);
    if (storedDest) setDestinationName(storedDest);
  }, [navigate]);

  const getTransportIcon = (type: string) => {
    const icons: Record<string, string> = {
      'Bus': '🚌', 'MRT': '🚇', 'KRL': '🚈', 'LRT': '🚅',
    };
    return icons[type] || '🚍';
  };

  const getAccessibilityBadge = (facilities: Facility) => {
    if (facilities.wheelchair_slot && facilities.low_entry) {
      return { label: '♿ Aksesibel Penuh', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300' };
    } else if (facilities.priority_seat) {
      return { label: '🪑 Sebagian Aksesibel', color: 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300' };
    }
    return { label: 'Standar', color: 'bg-muted text-muted-foreground' };
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, hsl(186 100% 27%) 0%, hsl(186 100% 18%) 100%)' }}>
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full -translate-y-1/2 translate-x-1/2"
          style={{ background: 'rgba(255,255,255,0.05)' }} aria-hidden="true" />

        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10 relative z-10">
          <Link to="/route-search">
            <button className="flex items-center gap-2 text-white/70 hover:text-white text-sm mb-4 transition-colors">
              <ArrowLeft className="h-4 w-4" />
              Cari rute lain
            </button>
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-3">
            Hasil Rekomendasi
          </h1>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm"
            style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)' }}>
            <MapPin className="h-4 w-4 text-white/70 flex-shrink-0" />
            <span className="text-white font-semibold">{originName}</span>
            <span className="text-white/50">→</span>
            <span className="text-white font-semibold">{destinationName}</span>
          </div>
        </div>

        <svg viewBox="0 0 1440 48" fill="none" className="w-full -mb-1" aria-hidden="true">
          <path d="M0 24 Q180 0 360 24 Q540 48 720 24 Q900 0 1080 24 Q1260 48 1440 24 L1440 48 L0 48Z"
            className="fill-background" />
        </svg>
      </section>

      <main className="flex-grow px-4 py-8">
        <div className="mx-auto max-w-3xl">

          {/* Summary bar */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">
                {dummyResults.total_recommendations} rute ditemukan
              </span>
              <span className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full font-semibold">
                Filter: {dummyResults.filter_applied}
              </span>
            </div>
          </div>

          {/* Route cards */}
          <div className="space-y-4">
            {dummyResults.data.map((route, i) => {
              const accessBadge = getAccessibilityBadge(route.transport.facilities);
              return (
                <div key={route.route_id}
                  className="bg-card rounded-2xl border border-border p-6 shadow-sm
                    hover:shadow-md hover:-translate-y-0.5 transition-all
                    high-contrast:border-2 high-contrast:border-primary">

                  {/* Top row */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/30
                        flex items-center justify-center text-2xl flex-shrink-0">
                        {getTransportIcon(route.transport.type)}
                      </div>
                      <div>
                        <div className="font-bold text-base">{route.route_name}</div>
                        <div className="text-sm text-muted-foreground">{route.transport.name} · {route.transport.type}</div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-2xl font-bold text-primary">
                        {route.journey.estimated_time_minutes} mnt
                      </div>
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

                  {/* Facilities */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${accessBadge.color}`}>
                      {accessBadge.label}
                    </span>
                    {route.transport.facilities.low_entry && (
                      <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300 px-2.5 py-1 rounded-full font-semibold">
                        🚌 Low Entry
                      </span>
                    )}
                    {route.transport.facilities.wheelchair_slot && (
                      <span className="text-xs bg-purple-100 text-purple-700 dark:bg-purple-950/30 dark:text-purple-300 px-2.5 py-1 rounded-full font-semibold">
                        ♿ Slot Kursi Roda
                      </span>
                    )}
                    {route.transport.facilities.priority_seat && (
                      <span className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300 px-2.5 py-1 rounded-full font-semibold">
                        🪑 Kursi Prioritas
                      </span>
                    )}
                  </div>

                  {/* Bottom row */}
                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {route.journey.estimated_time_minutes} menit
                      </div>
                      <span>·</span>
                      <div className="flex items-center gap-1">
                        <Bus className="h-3.5 w-3.5" />
                        {route.journey.stops_passed} halte
                      </div>
                    </div>
                    <Button size="sm"
                      className="h-8 px-5 text-xs font-bold
                        high-contrast:border-2 high-contrast:border-primary">
                      Pilih Rute
                    </Button>
                  </div>

                </div>
              );
            })}
          </div>

          {/* No result fallback */}
          {dummyResults.data.length === 0 && (
            <div className="text-center py-16">
              <div className="text-4xl mb-4">🔍</div>
              <div className="font-bold text-lg mb-2">Rute tidak ditemukan</div>
              <div className="text-sm text-muted-foreground mb-6">
                Tidak ada rute yang sesuai dengan profil aksesibilitas Anda.
              </div>
              <Link to="/route-search">
                <Button variant="outline">Coba Rute Lain</Button>
              </Link>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}