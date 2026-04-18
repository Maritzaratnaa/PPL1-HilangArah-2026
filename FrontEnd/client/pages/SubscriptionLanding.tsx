import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Card } from '@/components/ui/card';
import { ChevronDown, Check, Star, ArrowRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function SubscriptionLanding() {
  const navigate = useNavigate();
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);

  // --- STATE UNTUK PENGECEKAN API ---
  const [hasSubs, setHasSubs] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  // --- LOGIKA PENGECEKAN STATUS LANGGANAN ---
  useEffect(() => {
    const checkSubscriptionStatus = async () => {
      const token = localStorage.getItem("token");
      
      // Jika belum login, pasti belum punya langganan
      if (!token) {
        setIsChecking(false);
        return;
      }

      try {
        const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
        const res = await fetch(`${apiUrl}/api/subscription/my-subs`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Jika status 200 OK, berarti user sudah punya data di tabel 'subs'
        if (res.ok) {
          setHasSubs(true);
        }
      } catch (error) {
        console.error("Gagal mengecek status langganan:", error);
      } finally {
        setIsChecking(false);
      }
    };

    checkSubscriptionStatus();
  }, []);

  // --- FUNGSI NAVIGASI DINAMIS ---
  const handleActionClick = () => {
    if (hasSubs) {
      navigate("/subscription/Profile"); // Arahkan ke dashboard jika sudah langganan
    } else {
      navigate("/subscription/Form"); // Arahkan ke form jika belum
    }
  };

  const benefits = [
    {
      icon: "🧭",
      title: "Pemandu Pribadi Tersertifikasi",
      description:
        "Pemandu kami telah terlatih dan tersertifikasi untuk mendampingi pengguna dengan berbagai kebutuhan khusus.",
    },
    {
      icon: "🛡️",
      title: "Keamanan Terjamin",
      description:
        "Setiap pemandu melalui verifikasi identitas, pelatihan keselamatan, dan pemeriksaan latar belakang ketat.",
    },
    {
      icon: "🗺️",
      title: "Rute Aksesibel Terencana",
      description:
        "Pemandu membantu merencanakan rute terbaik yang ramah disabilitas sesuai tujuan perjalanan Anda.",
    },
    {
      icon: "📞",
      title: "Kontak Darurat Terintegrasi",
      description:
        "Sistem kontak darurat terintegrasi memastikan bantuan selalu tersedia kapanpun dibutuhkan.",
    },
    {
      icon: "⏰",
      title: "Tersedia Sesuai Jadwal",
      description:
        "Atur jadwal pertemuan dengan pemandu sesuai kebutuhan dan rencana perjalanan Anda.",
    },
    {
      icon: "💬",
      title: "Dukungan 24/7",
      description:
        "Tim support ARAHIN siap membantu Anda setiap saat melalui chat, telepon, maupun email.",
    },
  ];

  const faqItems = [
    {
      question: "Apa itu program berlangganan ARAHIN?",
      answer:
        "Program berlangganan ARAHIN memberikan Anda akses ke layanan pemandu pribadi yang siap menemani perjalanan menggunakan transportasi umum. Pemandu kami telah terlatih untuk mendampingi pengguna dengan berbagai kebutuhan khusus.",
    },
    {
      question: "Bagaimana cara memilih pemandu?",
      answer:
        "Setelah berlangganan, sistem kami akan mencocokkan Anda dengan pemandu yang paling sesuai berdasarkan preferensi, lokasi domisili, dan kebutuhan khusus Anda.",
    },
    {
      question: "Apakah saya bisa membatalkan langganan?",
      answer:
        "Ya, Anda dapat membatalkan langganan kapan saja tanpa biaya tambahan. Akses layanan akan tetap berlaku hingga akhir periode berlangganan yang sudah dibayar.",
    },
    {
      question: "Metode pembayaran apa yang tersedia?",
      answer:
        "Kami menerima pembayaran melalui e-wallet (GoPay, OVO, Dana), transfer bank, dan QRIS.",
    },
    {
      question: "Apakah pemandu tersedia di semua kota?",
      answer:
        "Saat ini layanan pemandu tersedia di Jakarta dan sekitarnya. Kami terus memperluas jangkauan ke kota-kota lain secara bertahap.",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white font-['Atkinson_Hyperlegible',_sans-serif]">
      <Navbar />

      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#005260] via-[#007C8A] to-[#009DAD] pt-20 pb-28 px-6 lg:px-10">
        {/* Decorative Orbs */}
        <div className="absolute -top-20 -right-20 w-[400px] h-[400px] rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute -bottom-16 left-[20%] w-[300px] h-[300px] rounded-full bg-white/5 pointer-events-none" />

        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/15 border border-white/25 rounded-full px-4 py-1.5 text-xs text-white mb-6 font-bold">
              <span className="text-yellow-400">✦</span> Program Unggulan ARAHIN
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold text-white leading-[1.2] mb-5">
              Jalan Lebih Nyaman <br />
              <span className="opacity-85">dengan Pemandu Pribadi</span>
            </h1>
            <p className="text-[#ffffffb8] text-base font-medium leading-relaxed mb-9 max-w-md">
              Dapatkan teman perjalanan yang siap menemani Anda kemanapun
              menggunakan transportasi umum — aman, nyaman, dan penuh perhatian.
            </p>
            <div className="flex flex-wrap gap-3">
              {/* TOMBOL 1: Diubah onClick-nya */}
              <button 
                onClick={handleActionClick}
                disabled={isChecking}
                className="bg-white text-[#007C8A] px-7 py-3.5 rounded-xl font-bold flex items-center gap-2 hover:bg-gray-100 transition-colors disabled:opacity-70"
              >
                {isChecking ? "Mengecek..." : hasSubs ? "Lihat Status Langganan" : "Mulai Berlangganan"} <ArrowRight size={18} />
              </button>
              {/* TOMBOL 2: Diubah agar nge-scroll ke bagian Pricing */}
              <button 
                onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
                className="bg-transparent text-white border border-white/40 px-6 py-3.5 rounded-xl font-bold hover:bg-white/10 transition-colors"
              >
                Pelajari Lebih Lanjut ↓
              </button>
            </div>
          </div>

          {/* Hero Visual Card */}
          <div className="bg-white/10 border border-white/15 rounded-[24px] p-8 flex flex-col gap-4">
            <span className="text-xs font-medium text-white/60">
              Pemandu aktif saat ini
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { val: "500+", label: "Pemandu terverifikasi" },
                { val: "98%", label: "Kepuasan pengguna" },
                { val: "10rb+", label: "Pengguna aktif" },
              ].map((stat, i) => (
                <div
                  key={i}
                  className="bg-white/10 border border-white/15 rounded-xl p-4 text-center min-w-0"
                >
                  <div className="text-xl font-bold text-white truncate">
                    {stat.val}
                  </div>
                  <div className="text-[10px] font-medium text-white/50 leading-tight mt-1 break-words">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-white/12 border border-white/20 rounded-2xl p-4 flex items-center gap-3 sm:gap-4">
              {/* Foto/Inisial tetap ukuran sama */}
              <div className="w-11 h-11 rounded-full bg-white/20 flex-shrink-0 flex items-center justify-center text-white font-bold text-sm">
                RS
              </div>

              {/* Bungkus teks dengan min-w-0 agar bisa mengalah */}
              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold text-white truncate">
                  Rizky Santoso
                </div>
                <div className="text-[11px] font-medium text-white/50 truncate">
                  Pemandu KRL Jabodetabek · ⭐ 4.9
                </div>
              </div>
              {/* Badge Status - Berikan flex-shrink-0 agar tidak gepeng */}
              <div className="flex-shrink-0 bg-green-500/20 border border-green-500/40 rounded-full px-3 py-1 text-[10px] font-bold text-green-300 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <span className="whitespace-nowrap">Aktif</span>
              </div>
            </div>
            <p className="text-[11px] font-medium text-white/40 text-center mt-1">
              Cocokkan pemandu sesuai kebutuhan Anda
            </p>
          </div>
        </div>
      </section>

      {/* Wave Section Divider */}
      <div
        className="h-16 bg-[#F8FAFB] -mt-0.5"
        style={{ clipPath: "polygon(0 100%, 100% 0, 100% 100%)" }}
      />

      {/* BENEFITS SECTION */}
      <section className="bg-[#F8FAFB] py-20 px-6 lg:px-10">
        <div className="max-w-5xl mx-auto">
          <div className="mb-12">
            <span className="text-[11px] font-bold text-[#007C8A] uppercase tracking-widest block mb-2">
              Keunggulan Program
            </span>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Mengapa Berlangganan ARAHIN?
            </h2>
            <p className="text-gray-500 font-medium text-base max-w-md">
              Setiap fitur dirancang khusus untuk kenyamanan dan keamanan
              perjalanan Anda
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {benefits.map((b, i) => (
              <div
                key={i}
                className="bg-white border border-gray-100 p-8 rounded-2xl hover:border-[#007C8A] transition-colors group cursor-default"
              >
                <div className="w-12 h-12 rounded-xl bg-[#E6F4F6] flex items-center justify-center text-xl mb-5 group-hover:scale-110 transition-transform">
                  {b.icon}
                </div>
                <h3 className="text-[15px] font-bold text-gray-900 mb-2">
                  {b.title}
                </h3>
                <p className="text-gray-500 font-medium text-[13px] leading-relaxed">
                  {b.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING SECTION - Tambahkan id="pricing" agar tombol scroll berfungsi */}
      <section id="pricing" className="bg-[#007C8A] py-24 px-6 lg:px-10 relative overflow-hidden text-white">
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-white/5 pointer-events-none" />

        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-6">
            <span className="text-xs font-bold text-white/60 uppercase tracking-widest">
              Investasi Terbaik
            </span>
            <h2 className="text-3xl font-bold leading-tight">
              Satu Langkah Menuju Perjalanan yang Lebih Mudah
            </h2>
            <p className="text-white/70 font-medium max-w-sm">
              Bergabung dengan ribuan pengguna yang sudah merasakan manfaat
              pemandu pribadi ARAHIN setiap harinya.
            </p>
            <div className="space-y-3 mt-8">
              {[
                "Batalkan kapan saja, tanpa biaya",
                "Pemandu cocok otomatis sesuai kebutuhan",
                "Pembayaran aman & terenkripsi",
                "Akses penuh fitur premium ARAHIN",
              ].map((text, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-white/15 flex items-center justify-center flex-shrink-0">
                    <Check size={10} strokeWidth={3} />
                  </div>
                  <span className="text-sm font-medium text-white/90">
                    {text}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <Card className="bg-white border-none rounded-[20px] p-9 shadow-xl text-gray-900 relative z-10">
            <div className="inline-flex items-center gap-1.5 bg-[#E6F4F6] text-[#007C8A] px-3 py-1 rounded-full text-xs font-bold mb-5">
              <Star size={12} fill="currentColor" /> Paling Populer
            </div>
            <div className="text-[13px] font-bold text-gray-500 mb-2 uppercase tracking-wide">
              Paket Bulanan
            </div>
            <div className="text-4xl font-bold text-[#007C8A] flex items-baseline flex-wrap gap-1">
              <span>Rp 299.000</span>
              <span className="text-base text-gray-400 font-medium whitespace-nowrap">
                /bln
              </span>
            </div>
            <div className="text-[12px] font-medium text-gray-400 mt-2 mb-6">
              Tagihan bulanan · batalkan kapan saja
            </div>
            <hr className="border-gray-100 mb-6" />

            <div className="space-y-3.5 mb-8">
              {[
                "1 Pemandu Pribadi Tersertifikasi",
                "Pendampingan perjalanan tak terbatas",
                "Perencanaan rute aksesibel",
                "Kontak darurat terintegrasi",
                "Dukungan prioritas 24/7",
                "Akses fitur premium ARAHIN",
              ].map((feat, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 text-[14px] font-medium"
                >
                  <div className="w-[18px] h-[18px] rounded-full bg-[#E6F4F6] text-[#007C8A] flex items-center justify-center flex-shrink-0">
                    <Check size={10} strokeWidth={4} />
                  </div>
                  {feat}
                </div>
              ))}
            </div>

            {/* TOMBOL 3: Diubah onClick-nya */}
            <button 
              onClick={handleActionClick}
              disabled={isChecking}
              className="w-full bg-[#007C8A] text-white py-4 rounded-xl font-bold hover:bg-[#006874] transition-colors mb-4 text-[18px] disabled:opacity-70"
            >
              {isChecking ? "Memuat..." : hasSubs ? "Lihat Status Anda →" : "Berlangganan Sekarang →"}
            </button>
            <p className="text-center text-[11px] font-medium text-gray-400">
              🔒 Pembayaran aman & terenkripsi · Batalkan kapan saja
            </p>
          </Card>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section className="bg-[#F8FAFB] py-20 px-6">
        <div className="max-w-2xl mx-auto">
          <div className="mb-10">
            <span className="text-[11px] font-bold text-[#007C8A] uppercase tracking-widest block mb-2">
              FAQ
            </span>
            <h2 className="text-3xl font-bold text-gray-900">
              Pertanyaan yang Sering Ditanyakan
            </h2>
          </div>

          <div className="space-y-3">
            {faqItems.map((item, idx) => (
              <div
                key={idx}
                className="bg-white border border-gray-200 rounded-xl overflow-hidden"
              >
                <button
                  onClick={() =>
                    setExpandedFaq(expandedFaq === idx ? null : idx)
                  }
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50/50 transition-colors"
                >
                  <span className="text-[14px] font-bold text-gray-900">
                    {item.question}
                  </span>
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all ${
                      expandedFaq === idx
                        ? "bg-[#E6F4F6] border-[#E6F4F6] text-[#007C8A] rotate-45"
                        : "bg-gray-50 border-gray-200 text-gray-400"
                    }`}
                  >
                    <span className="text-lg leading-none font-medium">+</span>
                  </div>
                </button>
                <div
                  className={`transition-all duration-300 ease-in-out overflow-hidden ${
                    expandedFaq === idx
                      ? "max-h-40 border-t border-gray-100"
                      : "max-h-0"
                  }`}
                >
                  <div className="p-5 text-[13px] font-medium text-gray-500 leading-relaxed">
                    {item.answer}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-[14px] font-medium text-gray-500 mb-3">
              Masih ada pertanyaan?
            </p>
            <button className="border border-[#007C8A] text-[#007C8A] px-6 py-2.5 rounded-lg text-[14px] font-bold hover:bg-[#007C8A] hover:text-white transition-all">
              Hubungi Tim Kami
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
