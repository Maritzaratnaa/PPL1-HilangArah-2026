const pool = require('../db');

const searchRoutes = async (req, res) => {
    try {
        const userId = req.user.user_id; 
        // 1. Tangkap nama dari frontend (bukan ID lagi)
        const { origin, destination } = req.query;

        if (!origin || !destination) {
            return res.status(400).json({ message: "Nama Halte asal dan tujuan wajib diisi!" });
        }

        const [profiles] = await pool.query('SELECT category_status FROM profiles WHERE user_id = ?', [userId]);
        if (profiles.length === 0) {
            return res.status(404).json({ message: "Profil pengguna tidak ditemukan." });
        }
        
        const userCategory = profiles[0].category_status;

        let query = `
            SELECT 
                r.route_id, 
                r.route_name,
                t.name AS transport_name, 
                t.type AS transport_type,
                t.is_low_entry,
                t.has_wheelchair_slot,
                t.has_priority_seat,
                os.name AS origin_stop_name, 
                os.latitude AS origin_lat, 
                os.longitude AS origin_lng,
                ds.name AS destination_stop_name,
                ds.latitude AS dest_lat,
                ds.longitude AS dest_lng,
                (d_rs.stop_order - o_rs.stop_order) AS total_stops,
                (d_rs.est_time_minutes - o_rs.est_time_minutes) AS estimated_time_minutes
            FROM routes r
            JOIN trans t ON r.trans_id = t.trans_id
            JOIN route_stops o_rs ON r.route_id = o_rs.route_id
            JOIN stops os ON o_rs.stop_id = os.stop_id
            JOIN route_stops d_rs ON r.route_id = d_rs.route_id
            JOIN stops ds ON d_rs.stop_id = ds.stop_id
            /* 2. UBAH BAGIAN INI: Cari berdasarkan nama yang mengandung teks inputan */
            WHERE os.name LIKE ? 
              AND ds.name LIKE ? 
              AND o_rs.stop_order < d_rs.stop_order 
              AND r.is_active = TRUE
        `;

        if (userCategory === 'Disabilitas') {
            query += ` AND (os.has_ramp = TRUE OR os.has_elevator = TRUE)`;
            query += ` AND (ds.has_ramp = TRUE OR ds.has_elevator = TRUE)`;
            query += ` AND (t.is_low_entry = TRUE OR t.has_wheelchair_slot = TRUE)`;
        } 
        else if (userCategory === 'Lansia' || userCategory === 'Ibu Hamil' || userCategory === 'Penyakit Rentan') {
            query += ` AND t.has_priority_seat = TRUE`;
        }

        query += ` ORDER BY estimated_time_minutes ASC`;

        // 3. Tambahkan tanda % agar SQL mencari kata yang mirip (contoh: ketik "blok m" akan ketemu "Halte Blok M")
        const searchOrigin = `%${origin}%`;
        const searchDest = `%${destination}%`;

        const [routes] = await pool.query(query, [searchOrigin, searchDest]);

        if (routes.length === 0) {
            return res.status(404).json({ 
                message: `Rute dari "${origin}" ke "${destination}" tidak ditemukan atau tidak sesuai profil Anda.` 
            });
        }

        res.status(200).json({
            message: "Rekomendasi transportasi berhasil ditemukan.",
            filter_applied: userCategory,
            total_recommendations: routes.length,
            // ... (Bagian mapping data routes.map(...) tetap sama persis seperti sebelumnya)
            data: routes.map(route => ({
                route_id: route.route_id,
                route_name: route.route_name,
                transport: {
                    name: route.transport_name,
                    type: route.transport_type,
                    facilities: {
                        low_entry: route.is_low_entry === 1,
                        wheelchair_slot: route.has_wheelchair_slot === 1,
                        priority_seat: route.has_priority_seat === 1
                    }
                },
                journey: {
                    origin_stop: route.origin_stop_name,
                    destination_stop: route.destination_stop_name,
                    stops_passed: route.total_stops,
                    estimated_time_minutes: route.estimated_time_minutes,
                    origin_lat: route.origin_lat,
                    origin_lng: route.origin_lng,
                    dest_lat: route.dest_lat,
                    dest_lng: route.dest_lng
                }
            }))
        });

    } catch (error) {
        console.error("Error Search Routes:", error);
        res.status(500).json({ message: "Terjadi kesalahan pada server saat mencari rute." });
    }
};

module.exports = { searchRoutes };