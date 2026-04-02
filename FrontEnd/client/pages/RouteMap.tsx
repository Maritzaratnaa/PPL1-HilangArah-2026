import { useLocation, useNavigate } from "react-router-dom";
import { useState, useCallback } from "react";
import { GoogleMap, useJsApiLoader, DirectionsService, DirectionsRenderer } from "@react-google-maps/api";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Navigation, Info, Clock, Bus, Loader2 } from "lucide-react";

const containerStyle = {
  width: '100%',
  height: '100%'
};

export default function RouteMap() {
  const location = useLocation();
  const navigate = useNavigate();
  const selectedRoute = location.state?.selectedRoute;

  // State untuk menyimpan hasil perhitungan rute dari Google
  const [response, setResponse] = useState<google.maps.DirectionsResult | null>(null);

  // Load Google Maps Script
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: "AIzaSyB4CMpdrMz4FCvhLXif57QdN2NkElD87PY"
  });

  // Fungsi callback untuk menangkap hasil pencarian rute
  const directionsCallback = useCallback((res: google.maps.DirectionsResult | null, status: google.maps.DirectionsStatus) => {
    if (res !== null && status === 'OK' && !response) {
      setResponse(res);
    }
  }, [response]);

  if (!selectedRoute) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Silakan pilih rute terlebih dahulu.</p>
        <Button onClick={() => navigate('/home')} className="ml-4">Kembali</Button>
      </div>
    );
  }

  // Koordinat dari backend
  const origin = { 
    lat: parseFloat(selectedRoute.journey.origin_lat), 
    lng: parseFloat(selectedRoute.journey.origin_lng) 
  };
  const destination = { 
    lat: parseFloat(selectedRoute.journey.dest_lat), 
    lng: parseFloat(selectedRoute.journey.dest_lng) 
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-grow flex flex-col h-[calc(100vh-64px)]">
        {/* INFO BAR ATAS */}
        <div className="bg-card border-b border-border p-4 shadow-sm z-10 relative">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="h-9 w-9">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="font-bold text-lg">{selectedRoute.route_name}</h1>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                   <Bus className="h-3 w-3" /> {selectedRoute.transport.name} · {selectedRoute.transport.type}
                </p>
              </div>
            </div>
            <div className="bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2">
                <Clock className="h-4 w-4" /> {selectedRoute.journey.estimated_time_minutes} mnt
            </div>
          </div>
        </div>

        {/* AREA PETA */}
        <div className="flex-grow relative overflow-hidden bg-muted/20">
          {isLoaded ? (
            <GoogleMap
              mapContainerStyle={containerStyle}
              center={origin}
              zoom={13}
              options={{
                disableDefaultUI: true,
                zoomControl: true,
                styles: [
                  { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] }
                ]
              }}
            >
              {/* Meminta rute ke Google */}
              <DirectionsService
                options={{
                  origin: origin,
                  destination: destination,
                  travelMode: google.maps.TravelMode.TRANSIT, // Mode transportasi umum
                }}
                callback={directionsCallback}
              />

              {/* Menggambar rute di peta */}
              {response && (
                <DirectionsRenderer
                  options={{
                    directions: response,
                    polylineOptions: {
                      strokeColor: "#006d77", // Warna khas ARAHIN
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

          {/* FLOATING ACTION PANEL */}
          <div className="absolute bottom-6 left-4 right-4 max-w-lg mx-auto z-10">
             <div className="bg-card/95 backdrop-blur-sm border border-border rounded-2xl p-5 shadow-2xl">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-primary/10 rounded-full flex-shrink-0">
                        <Info className="h-5 w-5 text-primary" />
                    </div>
                    <p className="text-sm font-medium">
                        Rute aksesibel dengan fasilitas <strong>{selectedRoute.transport.facilities.low_entry ? 'Low Entry' : 'Kursi Prioritas'}</strong>.
                    </p>
                </div>
                <Button size="lg" className="w-full rounded-xl font-bold gap-2">
                    <Navigation className="h-5 w-5" />
                    Mulai Navigasi
                </Button>
             </div>
          </div>
        </div>
      </main>
    </div>
  );
}