const { getCacheInsiden } = require('../utils/cronInsiden');
const db = require('../db'); // Pastikan import koneksi database MySQL-mu

const cekRute = async (req, res) => {
    // Frontend sekarang cukup mengirim 2 data ini saja:
    const { route_id, status_lalu_lintas } = req.body;
    let berita_insiden = null;

    try {
  
        const query = `
            SELECT t.type AS jenis_kendaraan 
            FROM routes r 
            JOIN trans t ON r.trans_id = t.trans_id 
            WHERE r.route_id = ?
        `;
        const [rows] = await db.query(query, [route_id]);

        // Jika rute tidak ditemukan di database
        if (rows.length === 0) {
            return res.status(404).json({ error: "Rute tidak ditemukan di database." });
        }

        const jenis_kendaraan = rows[0].jenis_kendaraan;

        // 2. Terapkan Logika Rule-Based Interceptor
        // Cek kebal insiden berdasarkan data dari database
        const kebalInsiden = (jenis_kendaraan === 'MRT' || jenis_kendaraan === 'LRT');
        const isLancar = (status_lalu_lintas === 'Lancar');

        if (!kebalInsiden && !isLancar) {
            const cache = getCacheInsiden();
            if (cache[route_id]) {
                berita_insiden = cache[route_id];
            }
        }

        // 3. Kirim Response
        res.json({
            route_id: route_id,
            kendaraan_terdeteksi: jenis_kendaraan, // Mengembalikan info armada dari DB
            berita_insiden: berita_insiden
        });

    } catch (error) {
        console.error("[Controller] Database error:", error);
        res.status(500).json({ error: "Terjadi kesalahan pada server." });
    }
};

module.exports = { cekRute };