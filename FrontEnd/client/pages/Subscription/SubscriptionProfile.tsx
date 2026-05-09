import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useIsHighContrast } from "@/hooks/useTheme"; // Import hook high contrast
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  CheckCircle,
  Phone,
  MapPin,
  Clock,
  AlertTriangle,
  Trash2,
  Loader2,
  UserX,
} from "lucide-react";

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
  const isHC = useIsHighContrast(); // Inisialisasi High Contrast Mode
  const activePlanLabel = localStorage.getItem('activePlanLabel') || 'Paket Bulanan';
  const activePlanPeriod = localStorage.getItem('activePlanPeriod') || '1 Bulan';

  // Tentukan harga berdasarkan label
  const getPlanPrice = (label: string) => {
    if (label.includes('Harian')) return { price: 'Rp 19.900', period: '/hari', benefits: ['1 Pemandu Pribadi Tersertifikasi', 'Pendampingan perjalanan sepanjang hari', 'Perencanaan rute aksesibel', 'Kontak darurat terintegrasi'] };
    if (label.includes('Mingguan')) return { price: 'Rp 89.000', period: '/minggu', benefits: ['1 Pemandu Pribadi Tersertifikasi', 'Pendampingan perjalanan selama 7 hari', 'Perencanaan rute aksesibel', 'Kontak darurat terintegrasi'] };
    return { price: 'Rp 299.000', period: '/bulan', benefits: ['1 Pemandu Pribadi Tersertifikasi', 'Pendampingan perjalanan tak terbatas', 'Perencanaan rute aksesibel', 'Kontak darurat terintegrasi'] };
  };

  const planInfo = getPlanPrice(activePlanLabel);
  const [showCancelModal, setShowCancelModal] = useState(false);

  // State API
  const [subscriptionData, setSubscriptionData] =
    useState<BackendSubsData | null>(null);
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
          headers: { Authorization: `Bearer ${token}` },
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
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      if (res.ok) {
        setShowCancelModal(false);
        navigate("/subscription"); // Balik ke halaman Landing Page Subs
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
    return new Date(dateString).toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // --- STATE 1: LOADING ---
  if (isLoading) {
    return (
      <div className={`min-h-screen flex flex-col transition-colors ${isHC ? "bg-black" : "bg-background"}`}>
        <Navbar />
        <main className="flex-grow flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className={`h-10 w-10 animate-spin ${isHC ? "text-[#ffff00]" : "text-primary"}`} />
            <p className={`font-medium ${isHC ? "text-[#ffff00]" : "text-muted-foreground"}`}>
              Memuat data langganan...
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // --- STATE 2: BELUM PUNYA LANGGANAN (Atau Error) ---
  if (!subscriptionData || errorMsg) {
    return (
      <div className={`min-h-screen flex flex-col transition-colors ${isHC ? "bg-black" : "bg-gray-50 dark:bg-gray-950"}`}>
        <Navbar />
        <main className="flex-grow flex items-center justify-center px-4 py-12">
          <Card className={`max-w-md p-10 text-center rounded-2xl shadow-sm ${
            isHC ? "bg-black border-2 border-[#ffff00]" : "bg-white dark:bg-gray-900 border-border"
          }`}>
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${
              isHC ? "bg-black border border-[#ffff00]" : "bg-muted dark:bg-gray-800"
            }`}>
              <UserX className={`h-10 w-10 ${isHC ? "text-[#ffff00]" : "text-muted-foreground"}`} />
            </div>
            <h2 className={`text-2xl font-bold mb-3 ${isHC ? "text-[#ffff00]" : "text-foreground dark:text-white"}`}>
              Tidak Ada Langganan
            </h2>
            <p className={`mb-8 ${isHC ? "text-white" : "text-muted-foreground dark:text-gray-400"}`}>
              {errorMsg || "Anda belum memiliki paket langganan pemandu ARAHIN yang aktif."}
            </p>
            <Button
              onClick={() => navigate("/subscription")}
              className={`w-full h-12 rounded-xl font-bold text-[16px] ${
                isHC ? "bg-[#ffff00] text-black hover:bg-[#ffff00]/90 border-2 border-[#ffff00]" : ""
              }`}
            >
              Lihat Paket Langganan
            </Button>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  // --- KALKULASI DATA & STATUS ---
  const isPending = subscriptionData.status === "Pending";
  const hasGuide = subscriptionData.guide_name !== null;

  const startDateStr = subscriptionData.start_date
    ? formatDate(subscriptionData.start_date)
    : "Menunggu Aktivasi";
  const endDateStr = subscriptionData.end_date
    ? formatDate(subscriptionData.end_date)
    : "-";

  let daysRemaining = 0;
  // let progressPercentage = 0; (Bisa di-uncomment jika dibutuhkan)

  if (subscriptionData.end_date) {
    const end = new Date(subscriptionData.end_date).getTime();
    const now = new Date().getTime();
    const diff = end - now;
    daysRemaining = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    // progressPercentage = Math.min(100, Math.max(0, ((30 - daysRemaining) / 30) * 100));
  }

  return (
    <div className={`min-h-screen flex flex-col transition-colors ${isHC ? "bg-black" : "bg-gray-50 dark:bg-gray-950"}`}>
      <Navbar />

      <main className="flex-grow px-4 py-12">
        <div className="mx-auto max-w-4xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className={`text-3xl font-bold mb-2 ${isHC ? "text-[#ffff00]" : "text-gray-900 dark:text-white"}`}>
              Langganan Saya
            </h1>
            <p className={isHC ? "text-white" : "text-gray-600 dark:text-gray-400"}>
              Kelola dan pantau status langganan ARAHIN Anda
            </p>
          </div>

          {/* JIKA STATUS MASIH PENDING */}
          {isPending && (
            <div className={`p-6 rounded-2xl mb-8 flex items-start gap-4 ${
              isHC 
                ? "bg-black border-2 border-[#ffff00] text-[#ffff00]" 
                : "bg-amber-100 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300"
            }`}>
              <AlertTriangle className={`h-6 w-6 flex-shrink-0 mt-1 ${isHC ? "text-[#ffff00]" : ""}`} />
              <div>
                <h3 className={`font-bold text-lg mb-1 ${isHC ? "text-[#ffff00]" : ""}`}>
                  Status Langganan: Sedang Diproses (Pending)
                </h3>
                <p className={isHC ? "text-white" : "text-amber-700 dark:text-amber-400"}>
                  Sistem kami sedang memverifikasi data Anda. Pemandu akan
                  segera dialokasikan setelah status Anda berubah menjadi Aktif.
                </p>
              </div>
            </div>
          )}

          {/* Guide Card */}
          <Card
            className={`shadow-md rounded-2xl p-8 mb-8 ${
              isHC 
                ? "bg-black border-2 border-[#ffff00] border-t-4 border-t-[#ffff00]" 
                : `bg-white dark:bg-gray-900 border-t-4 ${isPending ? "border-t-amber-400" : "border-t-primary dark:border-t-[#26c6da]"} border-gray-200 dark:border-gray-800`
            }`}
          >
            <h2 className={`text-xl font-bold mb-6 flex items-center gap-2 ${isHC ? "text-[#ffff00]" : "text-gray-900 dark:text-white"}`}>
              👤 Pemandu Anda
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Left - Avatar & Identity */}
              <div className="md:col-span-1">
                <div className="relative mb-6">
                  <div
                    className={`w-24 h-24 rounded-full flex items-center justify-center text-4xl font-bold mx-auto ${
                      isHC 
                        ? "bg-black border-2 border-[#ffff00] text-[#ffff00]" 
                        : (hasGuide ? "bg-gradient-to-br from-primary to-primary/70 dark:from-[#26c6da] dark:to-[#1fa0b0] text-white" : "bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400")
                    }`}
                  >
                    {hasGuide ? subscriptionData.guide_name?.charAt(0) : "⏳"}
                  </div>
                  {hasGuide && (
                    <div className={`absolute bottom-0 right-1/4 translate-x-1/2 rounded-full p-2 border-4 ${
                      isHC ? "bg-black border-[#ffff00]" : "bg-green-500 border-white dark:border-gray-900"
                    }`}>
                      <CheckCircle className={`h-5 w-5 ${isHC ? "text-[#ffff00]" : "text-white"}`} />
                    </div>
                  )}
                </div>

                <h3 className={`text-xl font-bold text-center mb-2 ${isHC ? "text-[#ffff00]" : "text-gray-900 dark:text-white"}`}>
                  {hasGuide
                    ? subscriptionData.guide_name
                    : "Sedang Dialokasikan"}
                </h3>

                {hasGuide ? (
                  <>
                    <div className="flex items-center justify-center gap-1 mb-4">
                      <span className={isHC ? "text-[#ffff00]" : "text-yellow-400"}>★</span>
                      <span className={`font-bold ${isHC ? "text-[#ffff00]" : "text-gray-900 dark:text-white"}`}>4.9</span>
                    </div>
                    <p className={`text-sm text-center leading-relaxed ${isHC ? "text-white" : "text-gray-700 dark:text-gray-300"}`}>
                      Pemandu tersertifikasi ARAHIN yang siap menemani
                      perjalanan Anda.
                    </p>
                  </>
                ) : (
                  <p className={`text-sm text-center italic ${isHC ? "text-white" : "text-gray-500 dark:text-gray-400"}`}>
                    Admin kami sedang mencocokkan Anda dengan pemandu terbaik.
                  </p>
                )}
              </div>

              {/* Right - Contact & Info */}
              <div className="md:col-span-2 space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className={`h-5 w-5 flex-shrink-0 mt-1 ${isHC ? "text-[#ffff00]" : "text-primary dark:text-[#26c6da]"}`} />
                  <div>
                    <p className={`text-xs uppercase tracking-widest font-bold ${isHC ? "text-white" : "text-muted-foreground dark:text-gray-400"}`}>
                      Catatan Kebutuhan
                    </p>
                    <p className={`font-semibold ${isHC ? "text-[#ffff00]" : "text-gray-900 dark:text-white"}`}>
                      {subscriptionData.specific_needs ||
                        "Sesuai rute terencana"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className={`h-5 w-5 flex-shrink-0 mt-1 ${isHC ? "text-[#ffff00]" : "text-primary dark:text-[#26c6da]"}`} />
                  <div className="flex-1">
                    <p className={`text-xs uppercase tracking-widest font-bold ${isHC ? "text-white" : "text-muted-foreground dark:text-gray-400"}`}>
                      No. Pemandu
                    </p>
                    <p className={`font-semibold ${isHC ? "text-[#ffff00]" : "text-gray-900 dark:text-white"}`}>
                      {hasGuide
                        ? subscriptionData.guide_phone
                        : "Belum tersedia"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className={`h-5 w-5 flex-shrink-0 mt-1 ${isHC ? "text-[#ffff00]" : "text-primary dark:text-[#26c6da]"}`} />
                  <div>
                    <p className={`font-semibold ${isHC ? "text-[#ffff00]" : "text-gray-900 dark:text-white"}`}>
                      Tersedia Sesuai Jadwal Temu
                    </p>
                  </div>
                </div>

                {hasGuide && (
                  <div className="flex items-start gap-3">
                    <CheckCircle className={`h-5 w-5 flex-shrink-0 mt-1 ${isHC ? "text-[#ffff00]" : "text-green-500 dark:text-green-400"}`} />
                    <div>
                      <p className={`font-semibold ${isHC ? "text-[#ffff00]" : "text-gray-900 dark:text-white"}`}>
                        Tersertifikasi ARAHIN Academy
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Subscription Details Card */}
          <Card className={`shadow-sm rounded-2xl p-8 mb-8 ${
            isHC ? "bg-black border-2 border-[#ffff00]" : "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
          }`}>
            <h2 className={`text-xl font-bold mb-8 flex items-center gap-2 ${isHC ? "text-[#ffff00]" : "text-gray-900 dark:text-white"}`}>
              📅 Detail Berlangganan
            </h2>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              <div className={`rounded-lg p-4 text-center ${isHC ? "bg-black border border-[#ffff00]" : "bg-gray-50 dark:bg-gray-800"}`}>
                <p className={`text-xs mb-1 ${isHC ? "text-white" : "text-gray-600 dark:text-gray-400"}`}>Tanggal Mulai</p>
                <p className={`font-bold text-sm break-words ${isHC ? "text-[#ffff00]" : "text-gray-900 dark:text-white"}`}>
                  {startDateStr}
                </p>
              </div>
              <div className={`rounded-lg p-4 text-center ${isHC ? "bg-black border border-[#ffff00]" : "bg-gray-50 dark:bg-gray-800"}`}>
                <p className={`text-xs mb-1 ${isHC ? "text-white" : "text-gray-600 dark:text-gray-400"}`}>Tanggal Berakhir</p>
                <p className={`font-bold text-sm break-words ${isHC ? "text-[#ffff00]" : "text-gray-900 dark:text-white"}`}>
                  {endDateStr}
                </p>
              </div>
              <div className={`rounded-lg p-4 text-center ${isHC ? "bg-black border border-[#ffff00]" : "bg-blue-50 dark:bg-blue-900/20"}`}>
                <p className={`text-xs mb-1 ${isHC ? "text-white" : "text-gray-600 dark:text-gray-400"}`}>Sisa Hari</p>
                <p className={`text-2xl font-bold ${isHC ? "text-[#ffff00]" : "text-primary dark:text-[#26c6da]"}`}>
                  {isPending ? "-" : daysRemaining}
                </p>
              </div>
              <div
                className={`rounded-lg p-4 text-center ${
                  isHC 
                    ? "bg-black border border-[#ffff00]" 
                    : (isPending ? "bg-amber-50 dark:bg-amber-900/20" : "bg-green-50 dark:bg-green-900/20")
                }`}
              >
                <p className={`text-xs mb-1 ${isHC ? "text-white" : "text-gray-600 dark:text-gray-400"}`}>Status</p>
                <p
                  className={`font-bold break-words ${
                    isHC 
                      ? "text-[#ffff00]" 
                      : (isPending ? "text-amber-600 dark:text-amber-400" : "text-green-600 dark:text-green-400")
                  }`}
                >
                  {subscriptionData.status}
                </p>
              </div>
            </div>
          </Card>

          {/* Package Info Card */}
          <Card className={`shadow-sm rounded-2xl p-8 mb-8 ${
            isHC ? "bg-black border-2 border-[#ffff00]" : "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
          }`}>
            <h2 className={`text-xl font-bold mb-6 flex items-center gap-2 ${isHC ? "text-[#ffff00]" : "text-gray-900 dark:text-white"}`}>
              📋 Paket Berlangganan
            </h2>

            <div className={`mb-6 pb-6 border-b ${isHC ? "border-[#ffff00]" : "border-gray-200 dark:border-gray-700"}`}>
              <p className={`font-bold mb-1 ${isHC ? "text-white" : "text-gray-900 dark:text-white"}`}>
                {activePlanLabel}
              </p>
              <div className="flex items-baseline gap-1 flex-wrap">
                <p className={`text-2xl font-bold whitespace-nowrap ${isHC ? "text-[#ffff00]" : "text-primary dark:text-[#26c6da]"}`}>
                  {planInfo.price}
                </p>
                <span className={`text-sm font-bold whitespace-nowrap ${isHC ? "text-white" : "text-muted-foreground dark:text-gray-400"}`}>
                  {planInfo.period}
                </span>
              </div>
              <p className={`text-xs font-medium mt-1 uppercase ${isHC ? "text-white" : "text-muted-foreground dark:text-gray-500"}`}>
                ID: {subscriptionData.subs_id.split("-")[0]}
              </p>
            </div>

            <div className="space-y-3">
              {planInfo.benefits.map((benefit, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <CheckCircle className={`w-5 h-5 flex-shrink-0 ${isHC ? "text-[#ffff00]" : "text-primary dark:text-[#26c6da]"}`} />
                  <span className={`font-medium ${isHC ? "text-white" : "text-gray-900 dark:text-white"}`}>{benefit}</span>
                </div>
              ))}
            </div>

            {/* Cancel Button */}
            <Button
              onClick={() => setShowCancelModal(true)}
              variant="outline"
              className={`w-full mt-8 h-12 font-bold rounded-lg flex items-center justify-center gap-2 ${
                isHC
                  ? "bg-black text-[#ffff00] border-2 border-[#ffff00] hover:bg-[#ffff00] hover:text-black"
                  : "border-2 border-red-500 text-red-500 hover:bg-red-50 dark:border-red-600 dark:text-red-500 dark:hover:bg-red-950/50"
              }`}
            >
              <Trash2 className="h-5 w-5" />
              Batalkan Langganan
            </Button>
          </Card>
        </div>
      </main>

      {/* Cancel Confirmation Modal */}
      <AlertDialog open={showCancelModal} onOpenChange={setShowCancelModal}>
        <AlertDialogContent className={`max-w-md ${isHC ? "bg-black border-2 border-[#ffff00]" : "dark:bg-gray-900 dark:border-gray-800"}`}>
          <div className="text-center py-4">
            <div className={`mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full ${
              isHC ? "bg-black border border-[#ffff00]" : "bg-amber-100 dark:bg-amber-900/30"
            }`}>
              <AlertTriangle className={`h-8 w-8 ${isHC ? "text-[#ffff00]" : "text-amber-600 dark:text-amber-400"}`} />
            </div>
            <AlertDialogTitle className={`text-2xl mb-4 ${isHC ? "text-[#ffff00]" : "dark:text-white"}`}>
              Batalkan Langganan?
            </AlertDialogTitle>
            <AlertDialogDescription className={`text-base mb-4 ${isHC ? "text-white" : "text-gray-700 dark:text-gray-300"}`}>
              Apakah Anda yakin ingin membatalkan langganan? Data langganan ini
              akan dihapus secara permanen dari sistem.
            </AlertDialogDescription>

            {!isPending && (
              <div className={`rounded-lg p-4 mb-6 text-sm text-left ${
                isHC 
                  ? "bg-black border border-[#ffff00] text-white" 
                  : "bg-amber-50 border border-amber-200 text-amber-900 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-200"
              }`}>
                <p className="mb-2">
                  ℹ️ <span className="font-bold">Penting:</span>
                </p>
                <p>
                  Pembatalan tidak akan mengembalikan biaya yang sudah dibayar.
                  Pemandu Anda saat ini akan di-nonaktifkan.
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
                className={`w-full h-12 font-bold rounded-lg ${
                  isHC 
                    ? "bg-[#ffff00] text-black hover:bg-[#ffff00]/90 border-2 border-[#ffff00]" 
                    : "bg-red-600 text-white hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800"
                }`}
              >
                {isCancelling ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />{" "}
                    Menghapus...
                  </>
                ) : (
                  "Ya, Batalkan Langganan"
                )}
              </AlertDialogAction>
              <AlertDialogCancel
                disabled={isCancelling}
                className={`w-full h-12 font-bold rounded-lg mt-2 ${
                  isHC 
                    ? "bg-black text-[#ffff00] border-2 border-[#ffff00] hover:bg-[#ffff00] hover:text-black" 
                    : "bg-primary text-white hover:bg-primary/90 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
                }`}
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