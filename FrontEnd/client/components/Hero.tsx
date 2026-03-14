import { Link } from 'react-router-dom';
import { MapPin, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

function TransportScene() {
  return (
    <svg viewBox="0 0 600 320" fill="none" xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full" aria-hidden="true">
      <defs>
        <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0e7490" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#e0f2fe" stopOpacity="0.2" />
        </linearGradient>
        <linearGradient id="busGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0891b2" />
          <stop offset="100%" stopColor="#0e7490" />
        </linearGradient>
        <linearGradient id="roadGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#94a3b8" />
          <stop offset="100%" stopColor="#64748b" />
        </linearGradient>
        <linearGradient id="rampGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#0891b2" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
        <filter id="cardShadow" x="-15%" y="-15%" width="130%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="#0e7490" floodOpacity="0.15" />
        </filter>
        <filter id="figShadow" x="-20%" y="-20%" width="140%" height="150%">
          <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#000" floodOpacity="0.1" />
        </filter>
      </defs>

      <rect width="600" height="320" fill="url(#skyGrad)" />

      <rect x="0" y="255" width="600" height="65" fill="url(#roadGrad)" />
      <rect x="0" y="282" width="600" height="3" fill="white" opacity="0.2" />
      {([30, 100, 170, 240, 310, 380, 450, 520] as number[]).map((x, i) => (
        <rect key={i} x={x} y="293" width="48" height="5" rx="2" fill="white" opacity="0.25" />
      ))}

      <rect x="0" y="228" width="600" height="27" fill="#e2e8f0" />
      <rect x="0" y="228" width="600" height="2.5" fill="#cbd5e1" />
      {([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] as number[]).map(i => (
        <rect key={i} x={i * 50 + 2} y="231" width="42" height="12" rx="2" fill="#fbbf24" opacity="0.45" />
      ))}

      <g filter="url(#cardShadow)">
        <rect x="50" y="108" width="288" height="148" rx="14" fill="url(#busGrad)" />
        <rect x="50" y="108" width="288" height="22" rx="14" fill="#0e7490" opacity="0.45" />
        <rect x="50" y="170" width="288" height="7" fill="white" opacity="0.12" />
        <rect x="50" y="140" width="288" height="3" fill="white" opacity="0.08" />
        {([[72, 126, 46, 36], [122, 126, 46, 36], [172, 126, 46, 36], [222, 126, 46, 36], [272, 126, 40, 36]] as number[][]).map(([x, y, w, h], i) => (
          <g key={i}>
            <rect x={x} y={y} width={w} height={h} rx="6" fill="#e0f2fe" opacity="0.92" />
            <rect x={x + 4} y={y + 4} width={w * 0.35} height="4" rx="2" fill="white" opacity="0.5" />
          </g>
        ))}
        <rect x="71" y="180" width="50" height="74" rx="5" fill="#0c4a6e" opacity="0.45" />
        <line x1="96" y1="182" x2="96" y2="252" stroke="white" strokeWidth="1.5" opacity="0.3" />
        <polygon points="71,256 121,256 121,268 62,268" fill="url(#rampGrad)" opacity="0.9" />
        <rect x="62" y="265" width="59" height="3" rx="1.5" fill="#06b6d4" opacity="0.6" />
        <line x1="68" y1="258" x2="68" y2="266" stroke="white" strokeWidth="1.5" opacity="0.4" />
        <line x1="116" y1="258" x2="116" y2="264" stroke="white" strokeWidth="1.5" opacity="0.4" />
        <circle cx="250" cy="208" r="17" fill="white" opacity="0.12" />
        <text x="250" y="213" textAnchor="middle" fontSize="18" fill="white" opacity="0.65">♿</text>
        <rect x="296" y="118" width="42" height="46" rx="8" fill="#0c4a6e" opacity="0.35" />
        <rect x="305" y="183" width="22" height="14" rx="5" fill="#fef9c3" opacity="0.85" />
        {([108, 272] as number[]).map((cx, i) => (
          <g key={i}>
            <circle cx={cx} cy="268" r="18" fill="#1e293b" />
            <circle cx={cx} cy="268" r="11" fill="#334155" />
            <circle cx={cx} cy="268" r="4.5" fill="#64748b" />
            {([0, 60, 120, 180, 240, 300] as number[]).map((a, j) => (
              <line key={j} x1={cx} y1="268"
                x2={cx + 9 * Math.cos(a * Math.PI / 180)}
                y2={268 + 9 * Math.sin(a * Math.PI / 180)}
                stroke="#4b5563" strokeWidth="1.2" />
            ))}
          </g>
        ))}
      </g>

      <g filter="url(#figShadow)">
        <circle cx="44" cy="254" r="9.5" fill="none" stroke="#0891b2" strokeWidth="2.5" />
        <circle cx="44" cy="254" r="3.5" fill="#0891b2" />
        <circle cx="65" cy="254" r="9.5" fill="none" stroke="#0891b2" strokeWidth="2.5" />
        <circle cx="65" cy="254" r="3.5" fill="#0891b2" />
        <rect x="38" y="227" width="36" height="22" rx="4" fill="#0891b2" opacity="0.85" />
        <rect x="38" y="225" width="36" height="5" rx="2" fill="#075985" />
        <rect x="72" y="222" width="3" height="25" rx="1.5" fill="#075985" />
        <rect x="36" y="247" width="8" height="14" rx="2" fill="#0891b2" opacity="0.7" />
        <rect x="35" y="258" width="14" height="4" rx="2" fill="#0891b2" opacity="0.5" />
        <rect x="73" y="222" width="2.5" height="28" rx="1.5" fill="#0e7490" />
        <rect x="71" y="220" width="7" height="3" rx="1.5" fill="#0e7490" />
        <circle cx="55" cy="214" r="10.5" fill="#fbbf24" />
        <path d="M45 212 Q55 204 65 212 Q64 207 55 206 Q46 207 45 212Z" fill="#92400e" />
        <circle cx="52" cy="213" r="2" fill="white" opacity="0.3" />
        <path d="M46 223 Q55 220 64 223 L66 238 Q55 242 44 238Z" fill="#dc2626" opacity="0.9" />
        <path d="M51 223 L55 228 L59 223" stroke="white" strokeWidth="1.5" fill="none" opacity="0.5" />
        <rect x="47" y="236" width="8" height="11" rx="3" fill="#1e3a8a" opacity="0.85" />
        <rect x="57" y="236" width="8" height="11" rx="3" fill="#1e3a8a" opacity="0.85" />
        <line x1="63" y1="226" x2="76" y2="216" stroke="#fbbf24" strokeWidth="3.5" strokeLinecap="round" />
        <circle cx="77" cy="215" r="4.5" fill="#fbbf24" />
      </g>

      <g filter="url(#figShadow)" transform="translate(148,0)">
        <line x1="221" y1="258" x2="232" y2="233" stroke="#78716c" strokeWidth="2.5" strokeLinecap="round" />
        <ellipse cx="221" cy="259" rx="4" ry="2.5" fill="#78716c" opacity="0.4" />
        <circle cx="222" cy="208" r="8.5" fill="#e2e8f0" />
        <circle cx="219" cy="206" r="4" fill="#f1f5f9" />
        <circle cx="222" cy="212" r="10.5" fill="#fde68a" />
        <path d="M212 222 Q222 218 232 222 L234 250 Q222 254 210 250Z" fill="#7c3aed" opacity="0.85" />
        <path d="M217 222 Q222 226 227 222" stroke="#a78bfa" strokeWidth="2" fill="none" />
        <rect x="216" y="248" width="5.5" height="13" rx="2.5" fill="#374151" />
        <rect x="223" y="248" width="5.5" height="13" rx="2.5" fill="#374151" />
        <ellipse cx="219" cy="262" rx="6" ry="3" fill="#1f2937" />
        <ellipse cx="226" cy="262" rx="6" ry="3" fill="#1f2937" />
        <line x1="232" y1="228" x2="232" y2="244" stroke="#fde68a" strokeWidth="3" strokeLinecap="round" />
      </g>

      <g filter="url(#figShadow)">
        <circle cx="386" cy="210" r="11" fill="#fcd34d" />
        <path d="M377 207 Q383 200 392 206" stroke="#b45309" strokeWidth="3.5" fill="none" strokeLinecap="round" />
        <circle cx="395" cy="205" r="4.5" fill="#b45309" />
        <path d="M375 221 Q386 217 397 221 L399 250 Q386 254 373 250Z" fill="#0891b2" opacity="0.9" />
        <path d="M381 221 L386 226 L391 221" stroke="white" strokeWidth="1.5" fill="none" opacity="0.5" />
        <line x1="374" y1="227" x2="361" y2="236" stroke="#fcd34d" strokeWidth="3.5" strokeLinecap="round" />
        <circle cx="360" cy="237" r="4.5" fill="#fcd34d" />
        <rect x="379" y="248" width="5.5" height="14" rx="2.5" fill="#374151" />
        <rect x="387" y="248" width="5.5" height="14" rx="2.5" fill="#374151" />
        <ellipse cx="382" cy="263" rx="6.5" ry="3" fill="#1f2937" />
        <ellipse cx="390" cy="263" rx="6.5" ry="3" fill="#1f2937" />
      </g>

      <g opacity="0.78">
        <circle cx="146" cy="144" r="9" fill="#fde68a" />
        <rect x="139" y="152" width="13" height="11" rx="3" fill="#f97316" opacity="0.9" />
        <path d="M138 141 Q146 134 154 141" fill="#b45309" opacity="0.8" />
        <line x1="152" y1="149" x2="159" y2="143" stroke="#fde68a" strokeWidth="2.5" strokeLinecap="round" />
      </g>
      <g opacity="0.4">
        <circle cx="170" cy="140" r="9" fill="#6b7280" />
        <rect x="163" y="148" width="13" height="13" rx="3" fill="#6b7280" />
      </g>

      <g filter="url(#cardShadow)" transform="translate(448,122)">
        <rect width="96" height="30" rx="15" fill="white" opacity="0.96" />
        <circle cx="15" cy="15" r="11" fill="#dcfce7" />
        <text x="15" y="19.5" textAnchor="middle" fontSize="12">♿</text>
        <text x="57" y="20" textAnchor="middle" fontSize="10.5" fill="#166534" fontWeight="bold">Aksesibel</text>
      </g>
      <g filter="url(#cardShadow)" transform="translate(458,165)">
        <rect width="86" height="30" rx="15" fill="white" opacity="0.96" />
        <circle cx="15" cy="15" r="11" fill="#dbeafe" />
        <text x="15" y="19.5" textAnchor="middle" fontSize="12">🛗</text>
        <text x="51" y="20" textAnchor="middle" fontSize="10.5" fill="#1e40af" fontWeight="bold">Inklusif</text>
      </g>
      <g filter="url(#cardShadow)" transform="translate(463,208)">
        <rect width="102" height="30" rx="15" fill="white" opacity="0.96" />
        <circle cx="15" cy="15" r="11" fill="#fef9c3" />
        <text x="15" y="19.5" textAnchor="middle" fontSize="12">⬛</text>
        <text x="58" y="20" textAnchor="middle" fontSize="10" fill="#854d0e" fontWeight="bold">Terjangkau</text>
      </g>

      <circle cx="545" cy="48" r="44" fill="#06b6d4" opacity="0.055" />
      <circle cx="22" cy="78" r="58" fill="#0891b2" opacity="0.045" />
      <circle cx="308" cy="18" r="26" fill="#0e7490" opacity="0.065" />
    </svg>
  );
}

function StatPill({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full
      bg-background/85 backdrop-blur-sm border border-border/70
      shadow-sm text-sm font-medium text-foreground whitespace-nowrap">
      <span className="text-base">{icon}</span>
      <span>{label}</span>
    </div>
  );
}

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10" aria-hidden="true"
        style={{
          background:
            'radial-gradient(ellipse 80% 55% at 50% -5%, hsl(186 100% 27% / 0.13) 0%, transparent 68%), ' +
            'radial-gradient(ellipse 40% 35% at 88% 85%, hsl(186 100% 27% / 0.07) 0%, transparent 55%)',
        }}
      />
      <div className="absolute inset-0 -z-10 opacity-[0.03]" aria-hidden="true"
        style={{
          backgroundImage:
            'linear-gradient(hsl(186 100% 27%) 1px, transparent 1px), linear-gradient(90deg, hsl(186 100% 27%) 1px, transparent 1px)',
          backgroundSize: '44px 44px',
        }}
      />

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-12 pb-0">
        <div className="grid lg:grid-cols-2 gap-10 items-center">

          <div className="text-center lg:text-left">

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-5
              text-foreground leading-[1.1] tracking-tight">
              Perjalanan{' '}
              <span className="relative inline-block">
                <span className="text-primary">Aman</span>
                <svg className="absolute -bottom-1.5 left-0 w-full" viewBox="0 0 180 8"
                  fill="none" aria-hidden="true">
                  <path d="M2 6 Q45 2 90 5 Q135 8 178 3"
                    stroke="hsl(186 100% 27%)" strokeWidth="2.5"
                    strokeLinecap="round" opacity="0.45" />
                </svg>
              </span>
              {' '}untuk{' '}
              <span className="text-primary">Semua</span>
            </h1>

            <p className="text-lg text-muted-foreground mb-7 max-w-lg mx-auto lg:mx-0 leading-relaxed">
              Temukan rute aksesibel, hubungkan diri dengan pemandu terverifikasi, dan laporkan
              hambatan — untuk penyandang disabilitas, lansia, perempuan, dan situasi rentan.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start mb-8">
              <Link to="/route-search">
                <Button size="lg"
                  className="h-12 px-7 font-semibold text-base shadow-lg shadow-primary/25
                    hover:shadow-primary/40 hover:-translate-y-0.5 transition-all
                    high-contrast:border-2 high-contrast:border-primary">
                  <MapPin className="mr-2 h-5 w-5" />
                  Cari Rute Sekarang
                </Button>
              </Link>
              <Link to="/register">
                <Button variant="outline" size="lg"
                  className="h-12 px-7 font-semibold text-base hover:bg-primary/5
                    hover:-translate-y-0.5 transition-all
                    high-contrast:border-2 high-contrast:border-primary">
                  Daftar Gratis
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>

          <div className="relative flex items-end justify-center lg:justify-end">
            <div className="absolute inset-x-8 bottom-0 top-8 rounded-3xl -z-10 blur-2xl"
              aria-hidden="true"
              style={{ background: 'hsl(186 100% 27% / 0.07)' }}
            />
            <div className="relative w-full max-w-[580px] rounded-2xl overflow-hidden
              ring-1 ring-primary/15 shadow-xl shadow-primary/8">
              <div className="absolute inset-0 -z-10" style={{
                background:
                  'linear-gradient(155deg, hsl(186 100% 27% / 0.06) 0%, hsl(210 40% 96% / 0.35) 100%)',
              }} />
              <TransportScene />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 -mb-1" aria-hidden="true">
        <svg viewBox="0 0 1440 50" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
          <path
            d="M0 25 Q180 0 360 25 Q540 50 720 25 Q900 0 1080 25 Q1260 50 1440 25 L1440 50 L0 50Z"
            className="fill-muted/50"
          />
        </svg>
      </div>
    </section>
  );
}