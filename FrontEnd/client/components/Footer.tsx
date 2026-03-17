import { Mail, Phone, Facebook, Twitter, Instagram, Linkedin, MapPin, ArrowRight } from 'lucide-react';

export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-border mt-16 high-contrast:border-4">
      {/* Background gradient */}
      <div className="absolute inset-0 -z-10"
        style={{
          background:
            'linear-gradient(160deg, hsl(186 100% 27% / 0.06) 0%, hsl(186 100% 27% / 0.02) 50%, transparent 100%)',
        }}
      />
      {/* Dot grid texture */}
      <div className="absolute inset-0 -z-10 opacity-[0.025]"
        style={{
          backgroundImage:
            'radial-gradient(circle, hsl(186 100% 27%) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-14 pb-8">

        {/* Top CTA strip */}
        <div className="rounded-2xl mb-12 px-8 py-7 flex flex-col sm:flex-row items-center justify-between gap-4"
          style={{
            background: 'linear-gradient(135deg, hsl(186 100% 27%) 0%, hsl(207 100% 36%) 100%)',
          }}>
          <div>
            <div className="text-white font-bold text-lg mb-1">Siap memulai perjalanan inklusif?</div>
            <div className="text-white/75 text-sm">Daftar gratis dan temukan rute aksesibel di sekitar Anda.</div>
          </div>
          <a href="/register"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full
              bg-white text-primary font-semibold text-sm whitespace-nowrap
              hover:bg-white/90 transition-all hover:-translate-y-0.5 shadow-lg">
            Mulai Sekarang
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">

          {/* Brand column */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-white text-sm font-bold">A</span>
              </div>
              <span className="font-bold text-xl">ARAHIN</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed mb-5 max-w-xs">
              Mewujudkan perjalanan yang inklusif dan aksesibel untuk semua orang —
              penyandang disabilitas, lansia, perempuan, dan situasi rentan.
            </p>
          </div>

          {/* Contact column */}
          <div>
            <h4 className="font-bold text-sm uppercase tracking-wider text-foreground mb-4">Kontak</h4>
            <div className="space-y-3 text-sm">
              <a href="mailto:support@arahin.com"
                className="flex items-center gap-2.5 text-muted-foreground hover:text-primary transition-colors group">
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0
                  group-hover:bg-primary/10 transition-colors">
                  <Mail className="h-3.5 w-3.5" />
                </div>
                support@arahin.com
              </a>
              <a href="tel:+1234567890"
                className="flex items-center gap-2.5 text-muted-foreground hover:text-primary transition-colors group">
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0
                  group-hover:bg-primary/10 transition-colors">
                  <Phone className="h-3.5 w-3.5" />
                </div>
                +1 (234) 567-890
              </a>
              <div className="flex items-center gap-2.5 text-muted-foreground">
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                  <MapPin className="h-3.5 w-3.5" />
                </div>
                Jakarta, Indonesia
              </div>
            </div>
          </div>

          {/* Social column */}
          <div>
            <h4 className="font-bold text-sm uppercase tracking-wider text-foreground mb-4">Ikuti Kami</h4>
            <div className="grid grid-cols-2 gap-2">
              {[
                { icon: Facebook, label: 'Facebook', color: 'hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/40' },
                { icon: Twitter, label: 'Twitter', color: 'hover:bg-sky-50 hover:text-sky-500 dark:hover:bg-sky-950/40' },
                { icon: Instagram, label: 'Instagram', color: 'hover:bg-pink-50 hover:text-pink-600 dark:hover:bg-pink-950/40' },
                { icon: Linkedin, label: 'LinkedIn', color: 'hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-950/40' },
              ].map(({ icon: Icon, label, color }) => (
                <a key={label} href="#"
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border border-border
                    text-muted-foreground text-xs font-medium transition-all ${color}
                    high-contrast:border-2 high-contrast:border-primary`}
                  aria-label={label}>
                  <Icon className="h-3.5 w-3.5 flex-shrink-0" />
                  {label}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            &copy; 2026 ARAHIN. All rights reserved.
          </p>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <a href="#" className="hover:text-primary transition-colors">Privasi</a>
            <a href="#" className="hover:text-primary transition-colors">Syarat & Ketentuan</a>
            <a href="#" className="hover:text-primary transition-colors">Buku Panduan</a>
          </div>
        </div>

      </div>
    </footer>
  );
}