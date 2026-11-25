export interface StepItem {
  target: string; // CSS selector untuk elemen yang disorot
  title: string;
  description: string;
  position?: "top" | "bottom" | "left" | "right" | "auto";
  highlightPadding?: number;
  clickableTarget?: boolean;
}

export interface ModuleGuideConfig {
  moduleName: string;
  moduleTitle: string;
  steps: StepItem[];
}

// Langkah khusus untuk Modul Peta di Perangkat Ponsel (Mobile)
export const ROUTE_MAP_MOBILE_STEPS: StepItem[] = [
  {
    target: '[data-guide="mobile-panel-handle"]',
    title: "Detail Perjalanan",
    description: "Tarik atau ketuk panel ini ke atas untuk melihat rincian rute dan prediksi.",
    position: "top",
    highlightPadding: 4,
  },
  {
    target: '[data-guide="route-summary-panel"]',
    title: "Rincian Rute",
    description: "Moda transportasi dan fasilitas aksesibel di setiap halte.",
    position: "top",
    highlightPadding: 4,
  },
  {
    target: '[data-guide="realtime-prediction-container"]',
    title: "Prediksi Perjalanan",
    description: "Pantau estimasi waktu, lalu lintas, dan kepadatan armada secara real-time.",
    position: "top",
    highlightPadding: 4,
  },
  {
    target: '[data-guide="prediction-eta-traffic"]',
    title: "ETA & Lalu Lintas",
    description: "Estimasi kedatangan bus dan pantauan kondisi jalan.",
    position: "top",
    highlightPadding: 4,
  },
  {
    target: '[data-guide="prediction-crowd-weather"]',
    title: "Kepadatan & Cuaca",
    description: "Prediksi keterisian kursi armada dan perkiraan cuaca.",
    position: "top",
    highlightPadding: 4,
  },
  {
    target: '[data-guide="prediction-refresh-btn"]',
    title: "Perbarui Prediksi",
    description: "Segarkan data estimasi perjalanan secara langsung.",
    position: "bottom",
    highlightPadding: 4,
  },
  {
    target: '[data-guide="map-controls"]',
    title: "Kontrol Peta",
    description: "Pusatkan peta ke halte awal atau posisi GPS Anda.",
    position: "top",
    highlightPadding: 4,
  },
];

// Langkah khusus untuk Modul Peta di Desktop
export const ROUTE_MAP_DESKTOP_STEPS: StepItem[] = [
  {
    target: '[data-guide="route-summary-panel"]',
    title: "Ringkasan Rute",
    description: "Daftar tahapan transportasi dan fasilitas aksesibel di setiap halte.",
    position: "right",
  },
  {
    target: '[data-guide="realtime-prediction-container"]',
    title: "Prediksi Perjalanan",
    description: "Pantau estimasi waktu tempuh, lalu lintas, dan kepadatan secara real-time.",
    position: "right",
  },
  {
    target: '[data-guide="prediction-eta-traffic"]',
    title: "ETA & Lalu Lintas",
    description: "Estimasi kedatangan kendaraan dan status arus lalu lintas.",
    position: "right",
  },
  {
    target: '[data-guide="prediction-crowd-weather"]',
    title: "Kepadatan & Cuaca",
    description: "Prediksi keterisian kursi penumpang dan prakiraan cuaca rute.",
    position: "right",
  },
  {
    target: '[data-guide="prediction-refresh-btn"]',
    title: "Perbarui Prediksi",
    description: "Segarkan data estimasi perjalanan terkini secara langsung.",
    position: "left",
  },
  {
    target: '[data-guide="map-controls"]',
    title: "Kontrol Peta",
    description: "Pusatkan peta ke halte keberangkatan atau lokasi GPS Anda.",
    position: "left",
  },
];

export const MODULE_GUIDES: Record<string, ModuleGuideConfig> = {
  // Halaman Utama / Beranda: Step hanya mengenalkan setiap tombol secara ringkas
  home: {
    moduleName: "home",
    moduleTitle: "Panduan Beranda",
    steps: [
      {
        target: '[data-guide="btn-profile"]',
        title: "Profil Pengguna",
        description: "Lihat dan perbarui data akun serta preferensi aksesibilitas.",
        position: "bottom",
      },
      {
        target: '[data-guide="btn-reports"]',
        title: "Laporan Fasilitas",
        description: "Pantau status dan laporkan kendala fasilitas umum.",
        position: "bottom",
      },
      {
        target: '[data-guide="btn-accessibility"]',
        title: "Pengaturan Tampilan",
        description: "Atur ukuran teks serta tema kontras tinggi atau gelap.",
        position: "bottom",
      },
      {
        target: '[data-guide="input-origin"]',
        title: "Halte Asal",
        description: "Tentukan halte awal keberangkatan perjalanan Anda.",
        position: "bottom",
      },
      {
        target: '[data-guide="input-destination"]',
        title: "Halte Tujuan",
        description: "Tentukan halte tujuan akhir perjalanan Anda.",
        position: "bottom",
      },
      {
        target: '[data-guide="btn-search-route"]',
        title: "Cari Rute",
        description: "Temukan rekomendasi rute perjalanan ramah aksesibilitas.",
        position: "bottom",
      },
      {
        target: '[data-guide="btn-quick-report"]',
        title: "Buat Laporan",
        description: "Jalan pintas untuk melaporkan kendala fasilitas publik.",
        position: "top",
      },
      {
        target: '[data-guide="btn-quick-subscription"]',
        title: "Langganan Pemandu",
        description: "Pintasan cepat untuk mendaftar atau mengelola langganan pemandu.",
        position: "top",
      },
    ],
  },

  // Modul Rute & Peta (default fallback jika customSteps tidak diberikan)
  "route-map": {
    moduleName: "route-map",
    moduleTitle: "Panduan Rute",
    steps: ROUTE_MAP_DESKTOP_STEPS,
  },

  // Modul Hasil Pencarian Rute
  "route-results": {
    moduleName: "route-results",
    moduleTitle: "Hasil Rekomendasi",
    steps: [
      {
        target: '[data-guide="results-search-bar"]',
        title: "Pencarian Rute",
        description: "Ubah halte asal atau tujuan untuk mencari ulang rute.",
        position: "bottom",
      },
      {
        target: '[data-guide="results-route-card"]',
        title: "Rekomendasi Rute",
        description: "Pilihan rute ramah aksesibilitas sesuai kebutuhan Anda.",
        position: "top",
      },
      {
        target: '[data-guide="results-view-map-btn"]',
        title: "Lihat Rute",
        description: "Buka visualisasi peta dan prediksi perjalanan real-time.",
        position: "top",
      },
    ],
  },

  // Modul Pelaporan
  reporting: {
    moduleName: "reporting",
    moduleTitle: "Panduan Laporan",
    steps: [
      {
        target: '[data-guide="btn-add-report"]',
        title: "Tambah Laporan",
        description: "Buka formulir untuk melaporkan kendala baru.",
        position: "bottom",
        clickableTarget: true,
      },
      {
        target: '[data-guide="reporting-form-category"]',
        title: "Kategori Kendala",
        description: "Pilih jenis fasilitas publik yang bermasalah.",
        position: "bottom",
      },
      {
        target: '[data-guide="reporting-form-stop"]',
        title: "Lokasi Halte",
        description: "Pilih lokasi halte tempat kendala ditemukan.",
        position: "bottom",
      },
      {
        target: '[data-guide="reporting-form-desc"]',
        title: "Deskripsi Kendala",
        description: "Jelaskan hambatan secara singkat dan lampirkan foto.",
        position: "top",
      },
      {
        target: '[data-guide="reporting-submit-btn"]',
        title: "Kirim Laporan",
        description: "Kirim laporan agar segera ditindaklanjuti petugas.",
        position: "top",
      },
    ],
  },

  // Modul Langganan Pemandu
  subscription: {
    moduleName: "subscription",
    moduleTitle: "Panduan Langganan",
    steps: [
      {
        target: '[data-guide="subscription-header-banner"]',
        title: "Pemandu Pribadi",
        description: "Pendampingan perjalanan langsung oleh pemandu terlatih.",
        position: "bottom",
      },
      {
        target: '[data-guide="subscription-package-list"]',
        title: "Pilihan Paket",
        description: "Pilih paket harian, mingguan, atau bulanan sesuai kebutuhan.",
        position: "top",
      },
      {
        target: '[data-guide="subscription-cta-btn"]',
        title: "Mulai Langganan",
        description: "Lanjutkan ke pendaftaran dan pembayaran langganan.",
        position: "top",
      },
    ],
  },

  // Modul Profil
  profile: {
    moduleName: "profile",
    moduleTitle: "Panduan Profil",
    steps: [
      {
        target: '[data-guide="profile-info-card"]',
        title: "Profil Akun",
        description: "Data profil dan status kebutuhan aksesibilitas Anda.",
        position: "bottom",
      },
      {
        target: '[data-guide="profile-edit-btn"]',
        title: "Edit Profil",
        description: "Ubah data akun atau kategori kebutuhan khusus Anda.",
        position: "left",
      },
      {
        target: '[data-guide="profile-logout-btn"]',
        title: "Keluar Akun",
        description: "Keluar dari sesi akun ARAHIN dengan aman.",
        position: "top",
      },
    ],
  },
};
