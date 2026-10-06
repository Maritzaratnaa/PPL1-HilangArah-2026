const { getCacheInsiden } = require('../utils/cronInsiden');
const db = require('../db'); 

const cekRute = async (req, res) => {
    const { route_id, status_lalu_lintas } = req.body;
    let berita_insiden = null;

    try {
  
        const query = `
            SELECT r.route_id, t.type AS jenis_kendaraan 
            FROM routes r 
            JOIN trans t ON r.trans_id = t.trans_id 
            WHERE r.route_id = ? OR r.route_name = ?
        `;
        const [rows] = await db.query(query, [route_id, route_id]);

        if (rows.length === 0) {
            return res.status(404).json({ error: "Rute tidak ditemukan di database." });
        }

        const jenis_kendaraan = rows[0].jenis_kendaraan;
        const actualRouteId = rows[0].route_id;

        const kebalInsiden = (jenis_kendaraan === 'MRT' || jenis_kendaraan === 'LRT');
        const isLancar = (status_lalu_lintas === 'Lancar');

        if (!kebalInsiden && !isLancar) {
            const cache = getCacheInsiden();
            if (cache[actualRouteId] || cache[route_id]) {
                berita_insiden = cache[actualRouteId] || cache[route_id];
            }
        }

        res.json({
            route_id: route_id,
            kendaraan_terdeteksi: jenis_kendaraan,
            berita_insiden: berita_insiden
        });

    } catch (error) {
        console.error("[Controller] Database error:", error);
        res.status(500).json({ error: "Terjadi kesalahan pada server." });
    }
};

module.exports = { cekRute };