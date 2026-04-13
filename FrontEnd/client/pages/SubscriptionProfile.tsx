import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useState, useEffect } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { CheckCircle, Phone, MapPin, Clock, AlertTriangle, Trash2 } from 'lucide-react';

interface GuideData {
  id: string;
  name: string;
  rating: number;
  bio: string;
  location: string;
  availability: string;
  certified: boolean;
}

interface SubscriptionData {
  startDate: string;
  endDate: string;
  guide: GuideData;
}

const mockGuide: GuideData = {
  id: 'G1',
  name: 'Rizky Santoso',
  rating: 4.9,
  bio: 'Pemandu berpengalaman 3 tahun dengan spesialisasi pendampingan pengguna kursi roda dan lansia. Ramah, sabar, dan hafal rute KRL Jabodetabek dengan baik.',
  location: 'Jakarta Selatan, DKI Jakarta',
  availability: 'Senin–Sabtu, 07.00–20.00',
  certified: true,
};

export default function SubscriptionProfile() {
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [daysRemaining, setDaysRemaining] = useState(20);

  useEffect(() => {
    // Mock subscription data - in real app would fetch from API/localStorage
    setSubscriptionData({
      startDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
      guide: mockGuide,
    });
  }, []);

  const handleCancelSubscription = () => {
    localStorage.removeItem('subscriptionStatus');
    localStorage.removeItem('subscriptionData');
    setShowCancelModal(false);
    // Redirect or show confirmation
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const progressPercentage = ((30 - daysRemaining) / 30) * 100;

  if (!subscriptionData) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-grow flex items-center justify-center">Loading...</main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <main className="flex-grow px-4 py-12">
        <div className="mx-auto max-w-4xl">
          {/* Header */}
          <div className="mb-8">
            <div className="inline-block mb-4">
              {/* <div className="flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="font-semibold text-sm">Langganan Aktif</span>
              </div> */}
            </div>
            <h1 className="text-3xl font-bold mb-2">Langganan Saya</h1>
            <p className="text-gray-600">Kelola dan pantau status langganan ARAHIN Anda</p>
          </div>

          {/* Guide Card */}
          <Card className="bg-white border-t-4 border-t-primary shadow-md rounded-2xl p-8 mb-8">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              👤 Pemandu Anda
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Left - Avatar & Identity */}
              <div className="md:col-span-1">
                <div className="relative mb-6">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-4xl text-white font-bold mx-auto">
                    RS
                  </div>
                  {subscriptionData.guide.certified && (
                    <div className="absolute bottom-0 right-1/4 translate-x-1/2 bg-green-500 rounded-full p-2 border-4 border-white">
                      <CheckCircle className="h-5 w-5 text-white" />
                    </div>
                  )}
                </div>

                <h3 className="text-xl font-bold text-center mb-2">{subscriptionData.guide.name}</h3>
                <div className="flex items-center justify-center gap-1 mb-4">
                  <span className="text-yellow-400">★</span>
                  <span className="font-bold">{subscriptionData.guide.rating}</span>
                </div>

                <p className="text-sm text-gray-700 text-center leading-relaxed">
                  {subscriptionData.guide.bio}
                </p>
              </div>

              {/* Right - Contact & Info */}
              <div className="md:col-span-2 space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-semibold text-gray-900">{subscriptionData.guide.location}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">+62 812 xxxx xxxx</p>
                    <Button variant="outline" size="sm" className="mt-2 h-9 border-primary text-primary hover:bg-primary hover:text-white">
                      Hubungi
                    </Button>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-semibold text-gray-900">Tersedia {subscriptionData.guide.availability}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-semibold text-gray-900">Tersertifikasi ARAHIN 2023</p>
                  </div>
                </div>
              </div>
            </div>

            {/* <Button variant="outline" className="w-full mt-8 h-12 border-primary text-primary hover:bg-primary hover:text-white font-semibold rounded-lg">
              Lihat Profil Lengkap Pemandu →
            </Button> */}
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
                <p className="font-bold text-gray-900">{new Date(subscriptionData.startDate).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' })}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-xs text-gray-600 mb-1">Tanggal Berakhir</p>
                <p className="font-bold text-gray-900">{new Date(subscriptionData.endDate).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' })}</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <p className="text-xs text-gray-600 mb-1">Sisa Hari</p>
                <p className="text-2xl font-bold text-primary">{daysRemaining}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <p className="text-xs text-gray-600 mb-1">Status</p>
                <p className="font-bold text-green-600">Aktif</p>
              </div>
            </div>

            {/* Progress Bar */}
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
                <span>{30 - daysRemaining} hari telah berlalu dari 30 hari</span>
                <span className="font-bold text-primary">{daysRemaining} hari tersisa</span>
              </div>
            </div>
          </Card>

          {/* Package Info Card */}
          <Card className="bg-white border border-gray-200 shadow-sm rounded-2xl p-8 mb-8">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              📋 Paket Berlangganan
            </h2>

            <div className="mb-6 pb-6 border-b border-gray-200">
              <p className="font-bold text-gray-900 mb-1">Paket Bulanan</p>
              <p className="text-2xl font-bold text-primary">Rp 299.000/bulan</p>
            </div>

            <div className="space-y-3">
              {[
                '1 Pemandu Pribadi Tersertifikasi',
                'Pendampingan perjalanan tak terbatas',
                'Perencanaan rute aksesibel',
                'Kontak darurat terintegrasi',
              ].map((benefit, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-primary flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-900">{benefit}</span>
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
              Apakah Anda yakin ingin membatalkan langganan? Akses layanan pemandu akan tetap aktif hingga{' '}
              <span className="font-bold">{new Date(subscriptionData.endDate).toLocaleDateString('id-ID')}</span>
              . Setelah itu, Anda tidak akan mendapat akses pemandu pribadi.
            </AlertDialogDescription>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 text-sm text-amber-900">
              <p className="mb-2">ℹ️ <span className="font-bold">Penting:</span></p>
              <p>
                Langganan Anda masih aktif hingga {new Date(subscriptionData.endDate).toLocaleDateString('id-ID')}. Pembatalan tidak akan mengembalikan biaya yang sudah dibayar.
              </p>
            </div>

            <div className="space-y-3">
              <AlertDialogAction
                onClick={handleCancelSubscription}
                className="w-full h-12 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700"
              >
                Ya, Batalkan Langganan
              </AlertDialogAction>
              <AlertDialogCancel className="w-full h-12 bg-primary text-white font-bold rounded-lg hover:bg-primary/90">
                Tidak, Kembali
              </AlertDialogCancel>
            </div>

            <p className="text-xs text-gray-600 mt-6">
              Butuh bantuan? <a href="#" className="text-primary font-semibold hover:underline">Hubungi support kami</a> sebelum membatalkan
            </p>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      <Footer />
    </div>
  );
}
