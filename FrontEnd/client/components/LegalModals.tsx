import { useState } from "react";
import { X, ChevronDown, FileText, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

function AccordionItem({
  title,
  content,
  isOpen,
  onClick,
}: {
  title: string;
  content: React.ReactNode;
  isOpen: boolean;
  onClick: () => void;
}) {
  return (
    <div className="border-b border-border last:border-0">
      <button
        onClick={onClick}
        className="w-full flex items-center justify-between py-4 text-left focus:outline-none hover:bg-muted/30 transition-colors px-2 rounded-lg"
      >
        <span className="font-semibold text-sm sm:text-base text-foreground">{title}</span>
        <ChevronDown
          className={`h-4 w-4 text-muted-foreground transition-transform duration-300 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? "max-h-[1000px] opacity-100 mb-4" : "max-h-0 opacity-0"
        }`}
      >
        <div className="px-2 text-sm text-muted-foreground mt-1">{content}</div>
      </div>
    </div>
  );
}

export function PrivacyModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [openSection, setOpenSection] = useState<number | null>(0);

  if (!isOpen) return null;

  const sections = [
    {
      title: "Informasi yang Dikumpulkan",
      content: (
        <>
          <p className="mb-2">ARAHIN mengumpulkan beberapa informasi pengguna, antara lain:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Nama lengkap</li>
            <li>Email</li>
            <li>Nomor telepon</li>
            <li>Data profil pengguna</li>
            <li>Riwayat penggunaan layanan</li>
            <li>Data langganan (subscription)</li>
            <li>Laporan atau pengaduan yang dikirimkan pengguna</li>
          </ul>
        </>
      ),
    },
    {
      title: "Tujuan Pengumpulan Data",
      content: (
        <>
          <p className="mb-2">Data pengguna dikumpulkan untuk:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Membantu memberikan rekomendasi rute transportasi umum yang sesuai</li>
            <li>Menyesuaikan layanan berdasarkan kebutuhan pengguna</li>
            <li>Menyediakan layanan pendampingan perjalanan</li>
            <li>Mengelola sistem langganan</li>
            <li>Menindaklanjuti laporan atau kendala dari pengguna</li>
            <li>Mengembangkan dan meningkatkan kualitas layanan ARAHIN</li>
          </ul>
        </>
      ),
    },
    {
      title: "Perlindungan dan Keamanan Data",
      content: (
        <>
          <p className="mb-2">Kami berupaya menjaga keamanan data pengguna dengan:</p>
          <ul className="list-disc pl-5 space-y-1 mb-3">
            <li>Penyimpanan data sensitif terenkripsi</li>
            <li>Penggunaan sistem autentikasi akun</li>
            <li>Perlindungan akses admin terhadap data pengguna</li>
          </ul>
          <p>Meskipun demikian, pengguna memahami bahwa keamanan sistem digital tidak dapat dijamin sepenuhnya.</p>
        </>
      ),
    },
    {
      title: "Pembagian Informasi",
      content: (
        <>
          <p className="mb-2">ARAHIN tidak menjual data pribadi pengguna kepada pihak lain. Namun, data tertentu dapat dibagikan apabila:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Dibutuhkan untuk proses layanan pendampingan</li>
            <li>Diminta oleh pihak berwenang sesuai ketentuan hukum</li>
          </ul>
        </>
      ),
    },
    {
      title: "Hak Pengguna",
      content: (
        <>
          <p className="mb-2">Pengguna memiliki hak untuk:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Mengakses dan memperbarui data pribadi</li>
            <li>Mengubah informasi akun</li>
            <li>Menghentikan penggunaan layanan</li>
            <li>Mengajukan penghapusan akun dengan menghubungi email ARAHIN</li>
          </ul>
        </>
      ),
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className="relative flex flex-col bg-card rounded-2xl border border-border w-full max-w-2xl shadow-2xl max-h-[85vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-full">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold">Kebijakan Privasi</h2>
              <p className="text-xs text-muted-foreground">Terakhir diperbarui: 24 Mei 2026</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="p-6 overflow-y-auto scrollbar-thin flex-1">
          <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
            Selamat datang di ARAHIN. Privasi dan keamanan data pengguna merupakan hal yang penting bagi kami. Dengan menggunakan layanan ARAHIN, pengguna dianggap telah membaca, memahami, dan menyetujui kebijakan privasi ini.
          </p>
          <div className="flex flex-col">
            {sections.map((section, idx) => (
              <AccordionItem key={idx} title={section.title} content={section.content} isOpen={openSection === idx} onClick={() => setOpenSection(openSection === idx ? null : idx)} />
            ))}
          </div>
        </div>
        <div className="px-6 py-4 border-t border-border bg-muted/30 flex justify-end">
          <Button onClick={onClose} className="w-full sm:w-auto">Saya Mengerti</Button>
        </div>
      </div>
    </div>
  );
}

export function TermsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [openSection, setOpenSection] = useState<number | null>(0);

  if (!isOpen) return null;

  const sections = [
    {
      title: "Ketentuan Umum",
      content: (
        <div className="space-y-2">
          <p>ARAHIN merupakan platform digital yang membantu pengguna mendapatkan rekomendasi rute perjalanan menggunakan transportasi umum serta layanan pendampingan perjalanan.</p>
          <p>ARAHIN bukan penyedia jasa transportasi dan tidak bertanggung jawab atas operasional transportasi umum dan fasilitas yang digunakan pengguna.</p>
        </div>
      ),
    },
    {
      title: "Registrasi dan Akun",
      content: (
        <>
          <p className="mb-2">Pengguna wajib:</p>
          <ul className="list-disc pl-5 space-y-1 mb-3">
            <li>Memberikan informasi yang benar dan akurat</li>
            <li>Menjaga kerahasiaan akun dan password</li>
            <li>Bertanggung jawab atas seluruh aktivitas akun masing-masing</li>
          </ul>
          <p>ARAHIN berhak menangguhkan atau menghapus akun yang terbukti memberikan data palsu atau menyalahgunakan layanan.</p>
        </>
      ),
    },
    {
      title: "Penggunaan Layanan",
      content: (
        <>
          <p className="mb-2">Pengguna setuju untuk:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Menggunakan layanan sesuai hukum yang berlaku</li>
            <li>Tidak menyalahgunakan sistem atau fitur aplikasi</li>
            <li>Tidak mengirimkan laporan palsu, spam, atau informasi yang menyesatkan</li>
            <li>Menghormati pemandu perjalanan dan pengguna lain</li>
          </ul>
        </>
      ),
    },
    {
      title: "Layanan Pendampingan",
      content: (
        <div className="space-y-2">
          <p>Layanan pendampingan hanya tersedia bagi pengguna yang memiliki langganan aktif sesuai ketentuan sistem subscription.</p>
          <p>ARAHIN berupaya menyediakan layanan pendampingan terbaik, namun tidak menjamin ketersediaan pemandu di semua lokasi dan waktu.</p>
        </div>
      ),
    },
    {
      title: "Rekomendasi Rute",
      content: (
        <>
          <p className="mb-2">Rekomendasi rute yang diberikan sistem bersifat bantuan informasi berdasarkan data yang tersedia pada saat penggunaan.</p>
          <p className="mb-2">ARAHIN tidak bertanggung jawab atas:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Perubahan jadwal transportasi umum</li>
            <li>Keterlambatan kendaraan</li>
            <li>Gangguan perjalanan yang disebabkan oleh pihak eksternal</li>
            <li>Kondisi di luar kendali sistem</li>
          </ul>
        </>
      ),
    },
    {
      title: "Laporan dan Pengaduan",
      content: (
        <div className="space-y-2">
          <p>Pengguna dapat mengirimkan laporan terkait kendala transportasi atau layanan melalui fitur pelaporan.</p>
          <p>ARAHIN berhak melakukan peninjauan terhadap seluruh laporan yang dikirimkan pengguna.</p>
        </div>
      ),
    },
    {
      title: "Hak dan Kewenangan ARAHIN",
      content: (
        <>
          <p className="mb-2">ARAHIN berhak untuk:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Memperbarui fitur dan layanan</li>
            <li>Mengubah sistem subscription</li>
            <li>Menangguhkan akses pengguna yang melanggar ketentuan</li>
            <li>Menghapus konten atau laporan yang dianggap tidak sesuai</li>
          </ul>
        </>
      ),
    },
    {
      title: "Batas Tanggung Jawab",
      content: (
        <>
          <p className="mb-2">ARAHIN tidak bertanggung jawab atas:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Kerugian akibat kesalahan penggunaan aplikasi oleh pengguna</li>
            <li>Kehilangan data akibat faktor di luar kendali sistem</li>
            <li>Tindakan pihak ketiga di luar layanan ARAHIN</li>
          </ul>
        </>
      ),
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className="relative flex flex-col bg-card rounded-2xl border border-border w-full max-w-2xl shadow-2xl max-h-[85vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-full">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold">Syarat & Ketentuan</h2>
              <p className="text-xs text-muted-foreground">Terakhir diperbarui: 24 Mei 2026</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="p-6 overflow-y-auto scrollbar-thin flex-1">
          <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
            Dengan membuat akun dan menggunakan layanan ARAHIN, pengguna dianggap telah menyetujui seluruh syarat dan ketentuan berikut.
          </p>
          <div className="flex flex-col">
            {sections.map((section, idx) => (
              <AccordionItem key={idx} title={section.title} content={section.content} isOpen={openSection === idx} onClick={() => setOpenSection(openSection === idx ? null : idx)} />
            ))}
          </div>
        </div>
        <div className="px-6 py-4 border-t border-border bg-muted/30 flex justify-end">
          <Button onClick={onClose} className="w-full sm:w-auto">Saya Mengerti</Button>
        </div>
      </div>
    </div>
  );
}