import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { CheckCircle, Phone, MapPin, Clock, AlertTriangle, Trash2, Loader2, UserX } from 'lucide-react';

// Interface disesuaikan dengan response Backend
interface BackendSubsData {
  subs_id: string;
  status: string;
  start_date: string | null;
  end_date: string | null;
  specific_needs: string;
  emergency_contact_name: string;
  guide_name: string | null;
  guide_phone: string | null;
}

export default function SubscriptionProfile() {
  const navigate = useNavigate();
  const [showCancelModal, setShowCancelModal] = useState(false);
  
  // State API
  const [subscriptionData, setSubscriptionData] = useState<BackendSubsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const fetchMySubscription = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      try {
        const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
        const res = await fetch(`${apiUrl}/api/subscription/my-subs`, {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` }
        });

        const json = await res.json();

        if (res.ok) {
          setSubscriptionData(json.data);
        } else {
          setErrorMsg(json.message);
        }
      } catch (error) {
        console.error("Error fetching subs:", error);
        setErrorMsg("Gagal terhubung ke server.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMySubscription();
  }, [navigate]);

  const handleCancelSubscription = async () => {
    setIsCancelling(true);
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
      const res = await fetch(`${apiUrl}/api/subscription/my-subs`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();

      if (res.ok) {
        setShowCancelModal(false);
        navigate('/subscription'); // Balik ke halaman Landing Page Subs
      } else {
        alert(data.message || "Gagal membatalkan langganan.");
      }
    } catch (error) {
      console.error("Error cancelling subscription:", error);
      alert("Terjadi kesalahan pada server saat membatalkan langganan.");
    } finally {
      setIsCancelling(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // --- STATE 1: LOADING ---
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-grow flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-muted-foreground font-medium">Memuat data langganan...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // --- STATE 2: BELUM PUNYA LANGGANAN (Atau Error) ---
  if (!subscriptionData || errorMsg) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <main className="flex-grow flex items-center justify-center px-4 py-12">
          <Card className="max-w-md p-10 text-center rounded-2xl shadow-sm border-border">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
              <UserX className="h-10 w-10 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold mb-3 text-foreground">Tidak Ada Langganan</h2>
            <p className="text-muted-foreground mb-8">
              {errorMsg || "Anda belum memiliki paket langganan pemandu ARAHIN yang aktif."}
            </p>
            <Button onClick={() => navigate('/subscription')} className="w-full h-12 rounded-xl font-bold text-[16px]">
              Lihat Paket Langganan
            </Button>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  // --- KALKULASI DATA & STATUS ---
  const isPending = subscriptionData.status === 'Pending';
  const hasGuide = subscriptionData.guide_name !== null;

  const startDateStr = subscriptionData.start_date ? formatDate(subscriptionData.start_date) : "Menunggu Aktivasi";
  const endDateStr = subscriptionData.end_date ? formatDate(subscriptionData.end_date) : "-";

  let daysRemaining = 0;
  let progressPercentage = 0;
  
  if (subscriptionData.end_date) {
    const end = new Date(subscriptionData.end_date).getTime();
    const now = new Date().getTime();
    const diff = end - now;
    daysRemaining = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    progressPercentage = Math.min(100, Math.max(0, ((30 - daysRemaining) / 30) * 100));
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <main className="flex-grow px-4 py-12">
        <div className="mx-auto max-w-4xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Langganan Saya</h1>
            <p className="text-gray-600">Kelola dan pantau status langganan ARAHIN Anda</p>
          </div>

          {/* JIKA STATUS MASIH PENDING */}
          {isPending && (
            <div className="bg-amber-100 border border-amber-300 text-amber-800 p-6 rounded-2xl mb-8 flex items-start gap-4">
              <AlertTriangle className="h-6 w-6 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-lg mb-1">Status Langganan: Sedang Diproses (Pending)</h3>
                <p className="text-amber-700">
                  Sistem kami sedang memverifikasi data Anda. Pemandu akan segera dialokasikan setelah status Anda berubah menjadi Aktif.
                </p>
              </div>
            </div>
          )}

          {/* Guide Card */}
          <Card className={`bg-white border-t-4 ${isPending ? 'border-t-amber-400' : 'border-t-primary'} shadow-md rounded-2xl p-8 mb-8`}>
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              👤 Pemandu Anda
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Left - Avatar & Identity */}
              <div className="md:col-span-1">
                <div className="relative mb-6">
                  <div className={`w-24 h-24 rounded-full flex items-center justify-center text-4xl text-white font-bold mx-auto ${hasGuide ? 'bg-gradient-to-br from-primary to-primary/70' : 'bg-gray-300'}`}>
                    {hasGuide ? subscriptionData.guide_name?.charAt(0) : '⏳'}
                  </div>
                  {hasGuide && (
                    <div className="absolute bottom-0 right-1/4 translate-x-1/2 bg-green-500 rounded-full p-2 border-4 border-white">
                      <CheckCircle className="h-5 w-5 text-white" />
                    </div>
                  )}
                </div>

                <h3 className="text-xl font-bold text-center mb-2">
                  {hasGuide ? subscriptionData.guide_name : "Sedang Dialokasikan"}
                </h3>
                
                {hasGuide ? (
                  <>
                    <div className="flex items-center justify-center gap-1 mb-4">
                      <span className="text-yellow-400">★</span>
                      <span className="font-bold">4.9</span>
                    </div>
                    <p className="text-sm text-gray-700 text-center leading-relaxed">
                      Pemandu tersertifikasi ARAHIN yang siap menemani perjalanan Anda.
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-gray-500 text-center italic">
                    Admin kami sedang mencocokkan Anda dengan pemandu terbaik.
                  </p>
                )}
              </div>

              {/* Right - Contact & Info */}
              <div className="md:col-span-2 space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Catatan Kebutuhan</p>
                    <p className="font-semibold text-gray-900">{subscriptionData.specific_needs || "Sesuai rute terencana"}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">No. Pemandu</p>
                    <p className="font-semibold text-gray-900">{hasGuide ? subscriptionData.guide_phone : "Belum tersedia"}</p>
                    {hasGuide && (
                      <Button variant="outline" size="sm" className="mt-2 h-9 border-primary text-primary hover:bg-primary hover:text-white">
                        Hubungi via Telepon
                      </Button>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-semibold text-gray-900">Tersedia Sesuai Jadwal Temu</p>
                  </div>
                </div>

                {hasGuide && (
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-semibold text-gray-900">Tersertifikasi ARAHIN Academy</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Subscription Details Card */}
          <Card className="bg-white border border-gray-200 shadow-sm rounded-2xl p-8 mb-8">
            <h2 className="text-xl font-bold mb-8 flex items-center gap-2">
              📅 Detail Berlangganan
            </h2>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-xs text-gray-600 mb-1">Tanggal Mulai</p>
                <p className="font-bold text-gray-900 text-sm">{startDateStr}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-xs text-gray-600 mb-1">Tanggal Berakhir</p>
                <p className="font-bold text-gray-900 text-sm">{endDateStr}</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <p className="text-xs text-gray-600 mb-1">Sisa Hari</p>
                <p className="text-2xl font-bold text-primary">{isPending ? "-" : daysRemaining}</p>
              </div>
              <div className={`rounded-lg p-4 text-center ${isPending ? 'bg-amber-50' : 'bg-green-50'}`}>
                <p className="text-xs text-gray-600 mb-1">Status</p>
                <p className={`font-bold ${isPending ? 'text-amber-600' : 'text-green-600'}`}>
                  {subscriptionData.status}
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            {!isPending && subscriptionData.end_date && (
              <div className="mb-8">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-gray-900">Progres Berlangganan</span>
                  <span className="text-sm text-gray-600">{30 - daysRemaining} dari 30 hari</span>
                </div>
                <div className="w-full bg-gray-300 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-primary to-primary/70 h-full rounded-full transition-all"
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
                <div className="flex justify-between items-center mt-2 text-sm text-gray-600">
                  <span>{30 - daysRemaining} hari telah berlalu</span>
                  <span className="font-bold text-primary">{daysRemaining} hari tersisa</span>
                </div>
              </div>
            )}
          </Card>

          {/* Package Info Card */}
          <Card className="bg-white border border-gray-200 shadow-sm rounded-2xl p-8 mb-8">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              📋 Paket Berlangganan
            </h2>

            <div className="mb-6 pb-6 border-b border-gray-200">
              <p className="font-bold text-gray-900 mb-1">Paket Bulanan</p>
              <p className="text-2xl font-bold text-primary">Rp 299.000/bulan</p>
              <p className="text-xs font-medium text-muted-foreground mt-1">ID: {subscriptionData.subs_id.split('-')[0].toUpperCase()}</p>
            </div>

            <div className="space-y-3">
              {[
                '1 Pemandu Pribadi Tersertifikasi',
                'Pendampingan perjalanan tak terbatas',
                'Perencanaan rute aksesibel',
                'Kontak darurat terintegrasi',
              ].map((benefit, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                  <span className="text-gray-900 font-medium">{benefit}</span>
                </div>
              ))}
            </div>

            {/* Cancel Button */}
            <Button
              onClick={() => setShowCancelModal(true)}
              variant="outline"
              className="w-full mt-8 h-12 border-2 border-red-500 text-red-500 hover:bg-red-50 font-bold rounded-lg flex items-center justify-center gap-2"
            >
              <Trash2 className="h-5 w-5" />
              Batalkan Langganan
            </Button>
          </Card>
        </div>
      </main>

      {/* Cancel Confirmation Modal */}
      <AlertDialog open={showCancelModal} onOpenChange={setShowCancelModal}>
        <AlertDialogContent className="max-w-md">
          <div className="text-center py-4">
            <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
              <AlertTriangle className="h-8 w-8 text-amber-600" />
            </div>
            <AlertDialogTitle className="text-2xl mb-4">Batalkan Langganan?</AlertDialogTitle>
            <AlertDialogDescription className="text-base mb-4 text-gray-700">
              Apakah Anda yakin ingin membatalkan langganan? Data langganan ini akan dihapus secara permanen dari sistem.
            </AlertDialogDescription>

            {!isPending && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 text-sm text-amber-900 text-left">
                <p className="mb-2">ℹ️ <span className="font-bold">Penting:</span></p>
                <p>
                  Pembatalan tidak akan mengembalikan biaya yang sudah dibayar. Pemandu Anda saat ini akan di-nonaktifkan.
                </p>
              </div>
            )}

            <div className="space-y-3 mt-6">
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault();
                  handleCancelSubscription();
                }}
                disabled={isCancelling}
                className="w-full h-12 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700"
              >
                {isCancelling ? (
                  <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Menghapus...</>
                ) : (
                  "Ya, Batalkan Langganan"
                )}
              </AlertDialogAction>
              <AlertDialogCancel 
                disabled={isCancelling}
                className="w-full h-12 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 mt-2"
              >
                Tidak, Kembali
              </AlertDialogCancel>
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      <Footer />
    </div>
  );
}