import { Mail, Phone, Facebook, Twitter, Instagram, Linkedin, MapPin, ArrowRight } from 'lucide-react';
import { useIsHighContrast } from "@/hooks/useTheme";

export function Footer() {
  const isHC = useIsHighContrast();
  return (
      <footer className={`relative overflow-hidden border-t mt-0 ${isHC ? 'border-t-4 border-[#ffff00] bg-black' : 'border-border'}`}>
        
        {!isHC && (
          <div className="absolute inset-0 -z-10"
            style={{
              background:
                'linear-gradient(160deg, hsl(186 100% 27% / 0.06) 0%, hsl(186 100% 27% / 0.02) 50%, transparent 100%)',
            }}
          />
        )}
      
        {!isHC && (
          <div className="absolute inset-0 -z-10 opacity-[0.025]"
            style={{
              backgroundImage:
                'radial-gradient(circle, hsl(186 100% 27%) 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />
        )}

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-14 pb-8">

          {/* Main grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">

            {/* Brand column */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isHC ? 'bg-[#ffff00]' : 'bg-primary'}`}>
                  <span className={`${isHC ? 'text-black' : 'text-white'} text-sm font-bold`}>A</span>
                </div>
                <span className={`font-bold text-xl ${isHC ? 'text-[#ffff00]' : 'text-foreground'}`}>ARAHIN</span>
              </div>
              <p className={`text-sm leading-relaxed mb-5 max-w-xs ${isHC ? 'text-white' : 'text-muted-foreground'}`}>
                Mewujudkan perjalanan yang inklusif dan aksesibel untuk semua orang —
                penyandang disabilitas, lansia, perempuan, dan situasi rentan.
              </p>
            </div>

            {/* Contact column */}
            <div>
              <h4 className={`font-bold text-sm uppercase tracking-wider mb-4 ${isHC ? 'text-[#ffff00]' : 'text-foreground'}`}>Kontak</h4>
              <div className="space-y-3 text-sm">
                <a href="mailto:support@arahin.com"
                  className={`flex items-center gap-2.5 transition-colors group ${isHC ? 'text-white' : 'text-muted-foreground hover:text-primary'}`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors
                    ${isHC ? 'bg-black border border-[#ffff00]' : 'bg-muted group-hover:bg-primary/10'}`}>
                    <Mail className={`h-3.5 w-3.5 ${isHC ? 'text-[#ffff00]' : ''}`} />
                  </div>
                  support@arahin.com
                </a>
                <a href="tel:+1234567890"
                  className={`flex items-center gap-2.5 transition-colors group ${isHC ? 'text-white' : 'text-muted-foreground hover:text-primary'}`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors
                    ${isHC ? 'bg-black border border-[#ffff00]' : 'bg-muted group-hover:bg-primary/10'}`}>
                    <Phone className={`h-3.5 w-3.5 ${isHC ? 'text-[#ffff00]' : ''}`} />
                  </div>
                  +1 (234) 567-890
                </a>
              </div>
            </div>

            {/* Social column */}
            <div>
              <h4 className={`font-bold text-sm uppercase tracking-wider mb-4 ${isHC ? 'text-[#ffff00]' : 'text-foreground'}`}>Ikuti Kami</h4>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { icon: Facebook, label: 'Facebook', color: 'hover:bg-blue-50 hover:text-blue-600' },
                  { icon: Twitter, label: 'Twitter', color: 'hover:bg-sky-50 hover:text-sky-500' },
                  { icon: Instagram, label: 'Instagram', color: 'hover:bg-pink-50 hover:text-pink-600' },
                  { icon: Linkedin, label: 'LinkedIn', color: 'hover:bg-blue-50 hover:text-blue-700' },
                ].map(({ icon: Icon, label, color }) => (
                  <a key={label} href="#"
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-all
                      ${isHC 
                        ? 'border-[#ffff00] text-white bg-black hover:bg-[#ffff00] hover:text-black' 
                        : `border-border text-muted-foreground ${color}`
                      }`}
                    aria-label={label}>
                    <Icon className="h-3.5 w-3.5 flex-shrink-0" />
                    {label}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className={`pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-3 ${isHC ? 'border-[#ffff00]' : 'border-border'}`}>
            <p className={`text-xs ${isHC ? 'text-white' : 'text-muted-foreground'}`}>
              &copy; 2026 ARAHIN. All rights reserved.
            </p>
            <div className={`flex gap-4 text-xs ${isHC ? 'text-[#ffff00]' : 'text-muted-foreground'}`}>
              <a href="#" className="hover:underline transition-colors">Privasi</a>
              <a href="#" className="hover:underline transition-colors">Syarat & Ketentuan</a>
              <a href="#" className="hover:underline transition-colors">Buku Panduan</a>
            </div>
          </div>

        </div>
      </footer>
    );
  }