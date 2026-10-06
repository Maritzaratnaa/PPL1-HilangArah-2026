const cron = require('node-cron');
const db = require('../db');

let cacheInsiden = {};

const daftarBeritaInsiden = [
    "Ada penumpukan massa demonstrasi",
    "Terjadi kecelakaan lalu lintas",
    "Ada perbaikan gorong-gorong/jalan",
    "Pohon tumbang menutup sebagian lajur"
];

// Pisahkan isi logikanya ke fungsi tersendiri
const generateInsiden = async () => {
    cacheInsiden = {}; 
    try {
        const [routes] = await db.query('SELECT route_id FROM routes WHERE is_active = 1');
        
        routes.forEach(route => {
            let chanceInsiden = Math.random();
            // Tes 90%
            if (chanceInsiden <= 0.30) {
                let randomBerita = daftarBeritaInsiden[Math.floor(Math.random() * daftarBeritaInsiden.length)];
                cacheInsiden[route.route_id] = `⚠️ Peringatan: ${randomBerita} di jalur ini.`;
            }
        });
        
        console.log(`[CRON] Update status jalan raya selesai di-generate untuk ${routes.length} rute aktif.`);
    } catch (error) {
        console.error('[CRON] Gagal mengambil data:', error);
    }
};

const mulaiCronInsiden = () => {
    // 1. Jalankan LANGSUNG SEKALI saat server node.js dinyalakan
    generateInsiden();

    // 2. Baru atur jadwal otomatisnya setiap 30 menit
    cron.schedule('*/30 * * * *', generateInsiden);
};

const getCacheInsiden = () => cacheInsiden;

module.exports = { mulaiCronInsiden, getCacheInsiden };