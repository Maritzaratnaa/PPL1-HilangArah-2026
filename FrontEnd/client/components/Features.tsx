import {
  Navigation,
  Users,
  AlertCircle,
  Accessibility,
  Clock,
  Shield,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useIsHighContrast } from "@/hooks/useTheme";

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
  accent: string;
  bgLight: string;
  borderAccent: string;
  iconBg: string;
  iconColor: string;
  tag: string;
  tagColor: string;
  pattern: string;
}

const features: Feature[] = [
  {
    icon: Navigation,
    title: 'Rekomendasi Rute',
    description: 'Saran rute personal berdasarkan kebutuhan aksesibilitas Anda. Jalur kursi roda, lokasi lift, area istirahat, dan lebih banyak lagi.',
    accent: '#0891b2',
    bgLight: 'bg-cyan-50 dark:bg-cyan-950/30',
    borderAccent: 'border-cyan-200/60 dark:border-cyan-800/40',
    iconBg: 'bg-cyan-100 dark:bg-cyan-900/40 high-contrast:bg-input',
    iconColor: 'text-cyan-600 dark:text-cyan-400',
    tag: '♿ Aksesibel',
    tagColor: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-300',
    pattern: 'route',
  },
  {
    icon: Users,
    title: 'Pemandu Terverifikasi',
    description: 'Terhubung dengan pemandu terlatih yang berspesialisasi dalam perjalanan inklusif. Semua mitra telah melewati verifikasi keahlian.',
    accent: '#2563eb',
    bgLight: 'bg-blue-50 dark:bg-blue-950/30',
    borderAccent: 'border-blue-200/60 dark:border-blue-800/40',
    iconBg: 'bg-blue-100 dark:bg-blue-900/40 high-contrast:bg-input',
    iconColor: 'text-blue-600 dark:text-blue-400',
    tag: '👮 Terlatih',
    tagColor: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
    pattern: 'people',
  },
  {
    icon: AlertCircle,
    title: 'Laporan Cepat',
    description: 'Laporkan hambatan aksesibilitas secara instan. Tim kami meninjau dan menindaklanjuti setiap laporan dalam waktu 24 jam.',
    accent: '#059669',
    bgLight: 'bg-emerald-50 dark:bg-emerald-950/30',
    borderAccent: 'border-emerald-200/60 dark:border-emerald-800/40',
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/40 high-contrast:bg-input',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    tag: '📢 Real-time',
    tagColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300',
    pattern: 'alert',
  },
  {
    icon: Accessibility,
    title: 'Desain Inklusif',
    description: 'Dibangun memenuhi WCAG 2.1 AA. Mode kontras tinggi, navigasi keyboard, screen reader, dan ukuran sentuh minimal 44×44px.',
    accent: '#7c3aed',
    bgLight: 'bg-violet-50 dark:bg-violet-950/30',
    borderAccent: 'border-violet-200/60 dark:border-violet-800/40',
    iconBg: 'bg-violet-100 dark:bg-violet-900/40 high-contrast:bg-input',
    iconColor: 'text-violet-600 dark:text-violet-400',
    tag: 'WCAG 2.1 AA',
    tagColor: 'bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300',
    pattern: 'a11y',
  },
  {
    icon: Clock,
    title: 'Tersedia 24/7',
    description: 'Akses platform kapan saja dan di mana saja. Pembaruan rute real-time dan dukungan segera untuk kebutuhan perjalanan Anda.',
    accent: '#d97706',
    bgLight: 'bg-amber-50 dark:bg-amber-950/30',
    borderAccent: 'border-amber-200/60 dark:border-amber-800/40',
    iconBg: 'bg-amber-100 dark:bg-amber-900/40 high-contrast:bg-input',
    iconColor: 'text-amber-600 dark:text-amber-400',
    tag: '⏰ Selalu Aktif',
    tagColor: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
    pattern: 'clock',
  },
  {
    icon: Shield,
    title: 'Keamanan Utama',
    description: 'Keamanan Anda adalah prioritas kami. Semua rute diverifikasi, pemandu telah diseleksi ketat, dan data pribadi Anda dilindungi.',
    accent: '#dc2626',
    bgLight: 'bg-rose-50 dark:bg-rose-950/30',
    borderAccent: 'border-rose-200/60 dark:border-rose-800/40',
    iconBg: 'bg-rose-100 dark:bg-rose-900/40 high-contrast:bg-input',
    iconColor: 'text-rose-600 dark:text-rose-400',
    tag: '🔒 Terproteksi',
    tagColor: 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300',
    pattern: 'shield',
  },
];

function CardPattern({ type, accent }: { type: string; accent: string }) {
  const op = 0.07;
  if (type === 'route') return (
    <svg viewBox="0 0 120 80" fill="none" className="absolute bottom-0 right-0 w-28 h-20" aria-hidden="true">
      <path d="M10 70 Q30 20 60 40 Q90 60 110 10" stroke={accent} strokeWidth="2.5" strokeLinecap="round" opacity={op * 2}/>
      <circle cx="10" cy="70" r="5" fill={accent} opacity={op * 3}/>
      <circle cx="110" cy="10" r="5" fill={accent} opacity={op * 3}/>
      <circle cx="60" cy="40" r="3" fill={accent} opacity={op * 2.5}/>
    </svg>
  );
  if (type === 'people') return (
    <svg viewBox="0 0 120 80" fill="none" className="absolute bottom-0 right-0 w-28 h-20" aria-hidden="true">
      {([20, 55, 90] as number[]).map((cx, i) => (
        <g key={i} opacity={op * 2.5}>
          <circle cx={cx} cy="35" r="10" fill={accent}/>
          <ellipse cx={cx} cy="62" rx="13" ry="14" fill={accent}/>
        </g>
      ))}
    </svg>
  );
  if (type === 'alert') return (
    <svg viewBox="0 0 120 80" fill="none" className="absolute bottom-0 right-0 w-28 h-20" aria-hidden="true">
      {([0,1,2,3] as number[]).map(i => (
        <circle key={i} cx={25 + i * 24} cy="40" r={6 + i * 3} fill="none" stroke={accent} strokeWidth="1.5" opacity={op * (1.5 + i * 0.5)}/>
      ))}
    </svg>
  );
  if (type === 'a11y') return (
    <svg viewBox="0 0 120 80" fill="none" className="absolute bottom-0 right-0 w-28 h-20" aria-hidden="true">
      <circle cx="60" cy="40" r="32" fill="none" stroke={accent} strokeWidth="2" opacity={op * 2}/>
      <circle cx="60" cy="40" r="20" fill="none" stroke={accent} strokeWidth="1.5" opacity={op * 2.5}/>
      <circle cx="60" cy="40" r="8" fill={accent} opacity={op * 3}/>
    </svg>
  );
  if (type === 'clock') return (
    <svg viewBox="0 0 120 80" fill="none" className="absolute bottom-0 right-0 w-28 h-20" aria-hidden="true">
      <circle cx="60" cy="40" r="30" fill="none" stroke={accent} strokeWidth="2" opacity={op * 2}/>
      <line x1="60" y1="40" x2="60" y2="18" stroke={accent} strokeWidth="2.5" strokeLinecap="round" opacity={op * 3}/>
      <line x1="60" y1="40" x2="80" y2="48" stroke={accent} strokeWidth="2" strokeLinecap="round" opacity={op * 3}/>
      <circle cx="60" cy="40" r="3" fill={accent} opacity={op * 4}/>
    </svg>
  );
  return (
    <svg viewBox="0 0 120 80" fill="none" className="absolute bottom-0 right-0 w-28 h-20" aria-hidden="true">
      <path d="M60 10 L90 25 L90 50 Q60 72 60 72 Q30 52 30 50 L30 25 Z" fill={accent} opacity={op * 1.8}/>
      <path d="M47 42 L57 52 L75 32" stroke={accent} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity={op * 4}/>
    </svg>
  );
}

function DotGrid({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 120 80" fill="none"
      className="absolute top-0 left-0 w-full h-full opacity-30"
      aria-hidden="true" preserveAspectRatio="xMidYMid slice">
      {Array.from({ length: 6 }, (_, row) =>
        Array.from({ length: 10 }, (_, col) => (
          <circle key={`${row}-${col}`} cx={col * 13 + 6} cy={row * 14 + 7} r="1" fill={color} opacity="0.4"/>
        ))
      )}
    </svg>
  );
}

export function Features() {
  const isHC = useIsHighContrast();
  return (
    <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-muted/50">
      <div className="mx-auto max-w-6xl">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full
            border border-primary/20 bg-primary/5 text-primary text-sm font-semibold mb-4">
            Fitur Unggulan
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Mengapa Memilih <span className="text-primary">ARAHIN</span>?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Setiap fitur dirancang dengan aksesibilitas dan inklusivitas sebagai prioritas utama.
          </p>
        </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <div 
              key={index} 
              className={`
                relative overflow-hidden p-6 rounded-xl border
                hover:shadow-lg hover:-translate-y-1
                transition-all duration-300 ease-out group
                ${isHC 
                  ? 'bg-black border-2 border-[#ffff00]' // 2. Paksa Hitam & Kuning Neon
                  : `${feature.bgLight} ${feature.borderAccent}` // Warna pastel default
                }
              `}
            >
              {/* Sembunyikan pattern dekorasi saat HC agar lebih bersih/readable */}
              {!isHC && <DotGrid color={feature.accent} />}
              {!isHC && <CardPattern type={feature.pattern} accent={feature.accent} />}

              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div className={`
                    w-12 h-12 rounded-xl flex items-center justify-center
                    ${isHC 
                      ? 'bg-black border-2 border-[#ffff00]' 
                      : `${feature.iconBg}`
                    }
                  `}>
                    <Icon className={`h-6 w-6 ${isHC ? 'text-[#ffff00]' : feature.iconColor}`} />
                  </div>
                  
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full 
                    ${isHC 
                      ? 'bg-black border border-[#ffff00] text-[#ffff00]' 
                      : feature.tagColor
                    }`}>
                    {feature.tag}
                  </span>
                </div>

                <h3 className={`text-lg font-bold mb-2 ${isHC ? 'text-[#ffff00]' : 'text-foreground'}`}>
                  {feature.title}
                </h3>
                <p className={`text-sm leading-relaxed ${isHC ? 'text-white' : 'text-muted-foreground'}`}>
                  {feature.description}
                </p>

                <div
                  className="mt-5 h-0.5 w-8 rounded-full group-hover:w-16 transition-all duration-300"
                  style={{ 
                    backgroundColor: isHC ? "#ffff00" : feature.accent, 
                    opacity: isHC ? 1 : 0.5 
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground mb-4">
            Bergabung dengan ribuan pengguna yang sudah merasakan manfaatnya
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            {['♿ Penyandang Disabilitas', '👴 Lansia', '👩 Perempuan', '👶 Anak-anak', '⚠️ Situasi Rentan'].map((tag) => (
              <span key={tag} className="px-3 py-1.5 rounded-full text-sm font-medium
                bg-background border border-border text-foreground/80 shadow-sm">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}