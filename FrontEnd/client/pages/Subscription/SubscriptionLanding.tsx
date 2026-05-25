import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Card } from '@/components/ui/card';
import { ChevronDown, Check, Star, ArrowRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIsHighContrast } from "@/hooks/useTheme";

export default function SubscriptionLanding() {
  const navigate = useNavigate();
  const isHC = useIsHighContrast(); 
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);
  const [hasSubs, setHasSubs] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkSubscriptionStatus = async () => {
      const token = localStorage.getItem("token");
      
      if (!token) {
        setIsChecking(false);
        return;
      }

      try {
        const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
        const res = await fetch(`${apiUrl}/api/subscription/my-subs`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
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

  const handleActionClick = () => {
    if (hasSubs) {
      navigate("/subscription/Profile"); 
    } else {
      navigate("/subscription/Form"); 
    }
  };

  const benefits = [
    {
      icon: "🧭",
      title: "Pemandu Pribadi Tersertifikasi",
      description: "Pemandu kami telah terlatih dan tersertifikasi untuk mendampingi pengguna dengan berbagai kebutuhan khusus.",
    },
    {
      icon: "🛡️",
      title: "Keamanan Terjamin",
      description: "Setiap pemandu melalui verifikasi identitas, pelatihan keselamatan, dan pemeriksaan latar belakang ketat.",
    },
    {
      icon: "🗺️",
      title: "Rute Aksesibel Terencana",
      description: "Pemandu membantu merencanakan rute terbaik yang ramah disabilitas sesuai tujuan perjalanan Anda.",
    },
    {
      icon: "📞",
      title: "Kontak Darurat Terintegrasi",
      description: "Sistem kontak darurat terintegrasi memastikan bantuan selalu tersedia kapanpun dibutuhkan.",
    },
    {
      icon: "⏰",
      title: "Tersedia Sesuai Jadwal",
      description: "Atur jadwal pertemuan dengan pemandu sesuai kebutuhan dan rencana perjalanan Anda.",
    },
    {
      icon: "💬",
      title: "Dukungan 24/7",
      description: "Tim support ARAHIN siap membantu Anda setiap saat melalui chat, telepon, maupun email.",
    },
  ];

  const faqItems = [
    { question: "Apa itu program berlangganan ARAHIN?", answer: "Program berlangganan ARAHIN memberikan Anda akses ke layanan pemandu pribadi yang siap menemani perjalanan menggunakan transportasi umum." },
    { question: "Bagaimana cara memilih pemandu?", answer: "Setelah berlangganan, sistem kami akan mencocokkan Anda dengan pemandu yang paling sesuai berdasarkan preferensi, lokasi domisili, dan kebutuhan khusus Anda." },
    { question: "Apakah saya bisa membatalkan langganan?", answer: "Ya, Anda dapat membatalkan langganan kapan saja tanpa biaya tambahan. Akses layanan akan tetap berlaku hingga akhir periode." },
    { question: "Metode pembayaran apa yang tersedia?", answer: "Kami menerima pembayaran melalui e-wallet (GoPay, OVO, Dana), transfer bank, dan QRIS." },
    { question: "Apakah pemandu tersedia di semua kota?", answer: "Saat ini layanan pemandu tersedia di Jakarta dan sekitarnya. Kami terus memperluas jangkauan ke kota-kota lain secara bertahap." },
  ];

  const heroStyle = isHC
    ? { background: "#000000" }
    : { background: "linear-gradient(to bottom right, #005260, #007C8A, #009DAD)" };

  const pricingHeroStyle = isHC
    ? { background: "#000000", borderTop: "2px solid #ffff00" }
    : { background: "#007C8A" };

  const [selectedPlan, setSelectedPlan] = useState<'daily' | 'weekly' | 'monthly'>('monthly');

  const plans = {
    daily: {
      label: 'Paket Harian',
      price: 'Rp 19.900',
      period: '/hari',
      note: 'Berlaku 1 hari · bayar sesuai kebutuhan',
      amount: 19900,
      features: [
        '1 Pemandu Pribadi Tersertifikasi',
        'Pendampingan perjalanan sepanjang hari',
        'Perencanaan rute aksesibel',
        'Kontak darurat terintegrasi',
        'Dukungan prioritas 24/7',
        'Akses fitur premium ARAHIN',
      ],
    },
    weekly: {
      label: 'Paket Mingguan',
      price: 'Rp 89.000',
      period: '/minggu',
      note: 'Berlaku 7 hari · lebih hemat untuk perjalanan singkat',
      amount: 89000,
      features: [
        '1 Pemandu Pribadi Tersertifikasi',
        'Pendampingan perjalanan selama 7 hari',
        'Perencanaan rute aksesibel',
        'Kontak darurat terintegrasi',
        'Dukungan prioritas 24/7',
        'Akses fitur premium ARAHIN',
      ],
    },
    monthly: {
      label: 'Paket Bulanan',
      price: 'Rp 299.000',
      period: '/bulan',
      note: 'Tagihan bulanan · batalkan kapan saja',
      amount: 299000,
      features: [
        '1 Pemandu Pribadi Tersertifikasi',
        'Pendampingan perjalanan tak terbatas',
        'Perencanaan rute aksesibel',
        'Kontak darurat terintegrasi',
        'Dukungan prioritas 24/7',
        'Akses fitur premium ARAHIN',
      ],
    },
  };

  const activePlan = plans[selectedPlan];

  return (
    <div className={`min-h-screen flex flex-col font-['Atkinson_Hyperlegible',_sans-serif] transition-colors ${isHC ? "bg-black" : "bg-white dark:bg-gray-950"}`}>
      <Navbar />
      <section className="relative overflow-hidden pt-20 pb-28 px-6 lg:px-10" style={heroStyle}>
        {!isHC && (
          <>
            <div className="absolute -top-20 -right-20 w-[400px] h-[400px] rounded-full bg-white/5 pointer-events-none" />
            <div className="absolute -bottom-16 left-[20%] w-[300px] h-[300px] rounded-full bg-white/5 pointer-events-none" />
          </>
        )}

        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">
          <div>
            <div className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold mb-6 ${
              isHC ? "bg-black text-[#ffff00] border-2 border-[#ffff00]" : "bg-white/15 border border-white/25 text-white"
            }`}>
              <span className={isHC ? "text-[#ffff00]" : "text-yellow-400"}>✦</span> Program Unggulan ARAHIN
            </div>
            
            <h1 className="text-4xl lg:text-5xl font-bold leading-[1.2] mb-5">
              <span style={{ color: isHC ? "#ffff00" : "#ffffff" }}>Jalan Lebih Nyaman</span> <br />
              <span className={isHC ? "text-[#ffff00]" : "text-white opacity-85"}>dengan Pemandu Pribadi</span>
            </h1>
            
            <p className={`text-base font-medium leading-relaxed mb-9 max-w-md ${isHC ? "text-white" : "text-[#ffffffb8]"}`}>
              Dapatkan teman perjalanan yang siap menemani Anda kemanapun menggunakan transportasi umum — aman, nyaman, dan penuh perhatian.
            </p>
            
            <div className="flex flex-wrap gap-3">
              <button 
                onClick={() => {
                  if (hasSubs) {
                    navigate("/subscription/Profile");
                  } else {
                    document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                disabled={isChecking}
                className={`px-7 py-3.5 rounded-xl font-bold flex items-center gap-2 transition-colors disabled:opacity-70 ${
                  isHC 
                    ? "bg-[#ffff00] text-black border-2 border-[#ffff00] hover:bg-[#ffff00]/90" 
                    : "bg-white text-[#007C8A] hover:bg-gray-100"
                }`}
              >
                {isChecking ? "Mengecek..." : hasSubs ? "Lihat Status Langganan" : "Mulai Berlangganan"} <ArrowRight size={18} />
              </button>
              
              <button 
                onClick={() => document.getElementById('benefits')?.scrollIntoView({ behavior: 'smooth' })}
                className={`px-6 py-3.5 rounded-xl font-bold transition-colors ${
                  isHC 
                    ? "bg-black text-[#ffff00] border-2 border-[#ffff00]" 
                    : "bg-transparent text-white border border-white/40 hover:bg-white/10"
                }`}
              >
                Pelajari Lebih Lanjut ↓
              </button>
            </div>
          </div>

          <div className={`rounded-[24px] p-8 flex flex-col gap-4 ${
            isHC ? "bg-black border-2 border-[#ffff00]" : "bg-white/10 border border-white/15"
          }`}>
            <span className={`text-xs font-medium ${isHC ? "text-[#ffff00]" : "text-white/60"}`}>
              Pemandu aktif saat ini
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { val: "500+", label: "Pemandu terverifikasi" },
                { val: "98%", label: "Kepuasan pengguna" },
                { val: "10rb+", label: "Pengguna aktif" },
              ].map((stat, i) => (
                <div key={i} className={`rounded-xl p-4 text-center min-w-0 ${
                  isHC ? "border-2 border-[#ffff00]" : "bg-white/10 border border-white/15"
                }`}>
                  <div className={`text-xl font-bold truncate ${isHC ? "text-[#ffff00]" : "text-white"}`}>
                    {stat.val}
                  </div>
                  <div className={`text-[10px] font-medium leading-tight mt-1 break-words ${isHC ? "text-white" : "text-white/50"}`}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
            
            <p className={`text-[11px] font-medium text-center mt-1 ${isHC ? "text-white" : "text-white/40"}`}>
              Cocokkan pemandu sesuai kebutuhan Anda
            </p>
          </div>
        </div>
      </section>

      <div
        className={`h-16 -mt-0.5 transition-colors ${isHC ? "bg-black" : "bg-[#F8FAFB] dark:bg-gray-900"}`}
        style={{ clipPath: "polygon(0 100%, 100% 0, 100% 100%)" }}
      />

      <section id="benefits" className={`py-20 px-6 lg:px-10 transition-colors ${isHC ? "bg-black" : "bg-[#F8FAFB] dark:bg-gray-900"}`}>
        <div className="max-w-5xl mx-auto">
          <div className="mb-12">
            <span className={`text-[11px] font-bold uppercase tracking-widest block mb-2 ${isHC ? "text-[#ffff00]" : "text-[#007C8A] dark:text-[#26c6da]"}`}>
              Keunggulan Program
            </span>
            <h2 className={`text-3xl font-bold mb-3 ${isHC ? "text-[#ffff00]" : "text-gray-900 dark:text-white"}`}>
              Mengapa Berlangganan ARAHIN?
            </h2>
            <p className={`font-medium text-base max-w-md ${isHC ? "text-white" : "text-gray-500 dark:text-gray-400"}`}>
              Setiap fitur dirancang khusus untuk kenyamanan dan keamanan perjalanan Anda
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {benefits.map((b, i) => (
              <div key={i} className={`p-8 rounded-2xl group cursor-default transition-colors ${
                isHC 
                  ? "bg-black border-2 border-[#ffff00]" 
                  : "bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:border-[#007C8A]"
              }`}>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl mb-5 group-hover:scale-110 transition-transform ${
                  isHC ? "bg-black text-[#ffff00] border border-[#ffff00]" : "bg-[#E6F4F6] dark:bg-gray-700"
                }`}>
                  {b.icon}
                </div>
                <h3 className={`text-[15px] font-bold mb-2 ${isHC ? "text-[#ffff00]" : "text-gray-900 dark:text-white"}`}>
                  {b.title}
                </h3>
                <p className={`font-medium text-[13px] leading-relaxed ${isHC ? "text-white" : "text-gray-500 dark:text-gray-300"}`}>
                  {b.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="py-24 px-6 lg:px-10 relative overflow-hidden transition-colors" style={pricingHeroStyle}>
        {!isHC && <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-white/5 pointer-events-none" />}

        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <span className={`text-xs font-bold uppercase tracking-widest ${isHC ? "text-[#ffff00]" : "text-white/60"}`}>
              Investasi Terbaik
            </span>
            <h2 className="text-3xl font-bold text-white mt-2 mb-3">
              Satu Langkah Menuju Perjalanan yang Lebih Mudah
            </h2>
            <p className={`font-medium max-w-lg mx-auto ${isHC ? "text-white" : "text-white/70"}`}>
              Bergabung dengan ribuan pengguna yang sudah merasakan manfaat pemandu pribadi ARAHIN setiap harinya.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-10">
            {(Object.entries(plans) as [keyof typeof plans, typeof plans[keyof typeof plans]][]).map(([key, plan]) => {
              const isActive = selectedPlan === key;
              const isPopular = key === 'monthly';
              return (
                <div
                  key={key}
                  onClick={() => setSelectedPlan(key)}
                  className={`relative rounded-2xl p-6 cursor-pointer transition-all duration-200 ${
                    isActive
                      ? isHC
                        ? 'bg-black border-4 border-[#ffff00] shadow-2xl'
                        : 'bg-white dark:bg-gray-900 border-2 border-white shadow-2xl'
                      : isHC
                      ? 'bg-black border-2 border-white/30 hover:border-[#ffff00]/60'
                      : 'bg-white/10 border border-white/20 hover:bg-white/20'
                  }`}
                >
                  {isPopular && (
                    <div className={`absolute -top-3.5 left-1/2 -translate-x-1/2 flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${
                      isHC ? 'bg-[#ffff00] text-black' : 'bg-white text-[#007C8A]'
                    }`}>
                      <Star size={10} fill="currentColor" /> Paling Populer
                    </div>
                  )}

                  {/* Plan name */}
                  <div className={`text-[11px] font-bold uppercase tracking-widest mb-3 ${
                    isActive
                      ? isHC ? 'text-[#ffff00]' : 'text-[#007C8A] dark:text-[#26c6da]'
                      : isHC ? 'text-white/70' : 'text-white/60'
                  }`}>
                    {plan.label}
                  </div>

                  {/* Price */}
                  <div className={`flex items-baseline gap-1 mb-1 ${
                    isActive
                      ? isHC ? 'text-[#ffff00]' : 'text-[#007C8A] dark:text-[#26c6da]'
                      : 'text-white'
                  }`}>
                    <span className="text-3xl font-bold">{plan.price}</span>
                    <span className={`text-sm font-medium ${isActive && !isHC ? 'text-gray-400' : 'text-white/60'}`}>
                      {plan.period}
                    </span>
                  </div>

                  <div className={`text-[11px] font-medium mb-5 ${isActive && !isHC ? 'text-gray-400' : 'text-white/50'}`}>
                    {plan.note}
                  </div>

                  <hr className={`mb-5 ${isHC ? 'border-white/20' : isActive ? 'border-gray-100 dark:border-gray-700' : 'border-white/15'}`} />

                  <div className="space-y-2.5 mb-6">
                    {plan.features.map((feat, i) => (
                      <div key={i} className={`flex items-start gap-2.5 text-[13px] font-medium ${
                        isActive && !isHC ? 'text-gray-800 dark:text-white' : 'text-white/90'
                      }`}>
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          isHC
                            ? 'bg-black text-[#ffff00] border border-[#ffff00]'
                            : isActive
                            ? 'bg-[#E6F4F6] dark:bg-gray-800 text-[#007C8A] dark:text-[#26c6da]'
                            : 'bg-white/20 text-white'
                        }`}>
                          <Check size={8} strokeWidth={4} />
                        </div>
                        {feat}
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (hasSubs) {
                        navigate('/subscription/Profile');
                      } else {
                        navigate('/subscription/Form', {
                          state: { plan: key, amount: plan.amount, planLabel: plan.label }
                        });
                      }
                    }}
                    disabled={isChecking}
                    className={`w-full py-3 rounded-xl font-bold text-[15px] transition-all disabled:opacity-70 ${
                      isActive
                        ? isHC
                          ? 'bg-[#ffff00] text-black hover:bg-[#ffff00]/90'
                          : 'bg-[#007C8A] text-white hover:bg-[#006874]'
                        : isHC
                        ? 'bg-black text-[#ffff00] border-2 border-[#ffff00] hover:bg-[#ffff00] hover:text-black'
                        : 'bg-white/20 text-white hover:bg-white/30 border border-white/30'
                    }`}
                  >
                    {isChecking ? 'Memuat...' : hasSubs ? 'Lihat Status →' : 'Pilih Paket →'}
                  </button>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap justify-center gap-6">
            {[
              "Batalkan kapan saja, tanpa biaya",
              "Pemandu cocok otomatis sesuai kebutuhan",
              "Mendukung berbagai metode pembayaran",
            ].map((text, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${
                  isHC ? "bg-black text-[#ffff00] border border-[#ffff00]" : "bg-white/20 text-white"
                }`}>
                  <Check size={8} strokeWidth={3} />
                </div>
                <span className={`text-sm font-medium ${isHC ? "text-white" : "text-white/80"}`}>
                  {text}
                </span>
              </div>
            ))}
          </div>
          <p className={`text-center text-[11px] font-medium mt-4 ${isHC ? "text-white/60" : "text-white/40"}`}>
            🔒 Pembayaran aman & terenkripsi
          </p>
        </div>
      </section>

      <section className={`py-20 px-6 transition-colors ${isHC ? "bg-black" : "bg-[#F8FAFB] dark:bg-gray-900"}`}>
        <div className="max-w-2xl mx-auto">
          <div className="mb-10">
            <span className={`text-[11px] font-bold uppercase tracking-widest block mb-2 ${isHC ? "text-[#ffff00]" : "text-[#007C8A] dark:text-[#26c6da]"}`}>
              FAQ
            </span>
            <h2 className={`text-3xl font-bold ${isHC ? "text-[#ffff00]" : "text-gray-900 dark:text-white"}`}>
              Pertanyaan yang Sering Ditanyakan
            </h2>
          </div>

          <div className="space-y-3">
            {faqItems.map((item, idx) => (
              <div key={idx} className={`rounded-xl overflow-hidden ${
                isHC ? "bg-black border-2 border-[#ffff00]" : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
              }`}>
                <button
                  onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                  className={`w-full flex items-center justify-between p-5 text-left transition-colors focus:outline-none ${
                    isHC ? "hover:bg-white/10" : "hover:bg-gray-50/50 dark:hover:bg-gray-700/50"
                  }`}
                >
                  <span className={`text-[14px] font-bold ${isHC ? "text-[#ffff00]" : "text-gray-900 dark:text-white"}`}>
                    {item.question}
                  </span>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all ${
                    expandedFaq === idx
                      ? isHC ? "bg-[#ffff00] text-black border-[#ffff00] rotate-45" : "bg-[#E6F4F6] dark:bg-gray-700 border-[#E6F4F6] dark:border-gray-600 text-[#007C8A] dark:text-[#26c6da] rotate-45"
                      : isHC ? "bg-black text-[#ffff00] border-[#ffff00]" : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-400 dark:text-gray-300"
                  }`}>
                    <span className="text-lg leading-none font-medium">+</span>
                  </div>
                </button>
                <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
                  expandedFaq === idx ? (isHC ? "max-h-40 border-t-2 border-[#ffff00]" : "max-h-40 border-t border-gray-100 dark:border-gray-700") : "max-h-0"
                }`}>
                  <div className={`p-5 text-[13px] font-medium leading-relaxed ${isHC ? "text-white" : "text-gray-500 dark:text-gray-300"}`}>
                    {item.answer}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className={`text-[14px] font-medium mb-3 ${isHC ? "text-white" : "text-gray-500 dark:text-gray-400"}`}>
              Masih ada pertanyaan?
            </p>
            <a 
              href="mailto:arahin.support@gmail.com"
              className={`inline-block px-6 py-2.5 rounded-lg text-[14px] font-bold transition-all focus:outline-none ${
                isHC 
                  ? "bg-black border-2 border-[#ffff00] text-[#ffff00] hover:bg-[#ffff00] hover:text-black" 
                  : "border border-[#007C8A] dark:border-[#26c6da] text-[#007C8A] dark:text-[#26c6da] hover:bg-[#007C8A] dark:hover:bg-[#26c6da] hover:text-white dark:hover:text-gray-900"
              }`}
            >
              Hubungi Tim Kami
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}