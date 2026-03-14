const pool = require('../db');

const searchRoutes = async (req, res) => {
    try {
        const userId = req.user.user_id; 
        const { origin_stop_id, destination_stop_id } = req.query;

        if (!origin_stop_id || !destination_stop_id) {
            return res.status(400).json({ message: "ID Halte asal dan tujuan wajib diisi di parameter pencarian!" });
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
                ds.name AS destination_stop_name,
                (d_rs.stop_order - o_rs.stop_order) AS total_stops,
                (d_rs.est_time_minutes - o_rs.est_time_minutes) AS estimated_time_minutes
            FROM routes r
            JOIN trans t ON r.trans_id = t.trans_id
            JOIN route_stops o_rs ON r.route_id = o_rs.route_id
            JOIN stops os ON o_rs.stop_id = os.stop_id
            JOIN route_stops d_rs ON r.route_id = d_rs.route_id
            JOIN stops ds ON d_rs.stop_id = ds.stop_id
            WHERE os.stop_id = ? 
              AND ds.stop_id = ? 
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
        // Catatan: Jika nanti kamu menambahkan kolom "is_women_friendly" di tabel 'trans', 

        query += ` ORDER BY estimated_time_minutes ASC`;

        const [routes] = await pool.query(query, [origin_stop_id, destination_stop_id]);

        if (routes.length === 0) {
            return res.status(404).json({ 
                message: `Tidak ditemukan rekomendasi transportasi yang sesuai untuk rute ini berdasarkan profil Anda (${userCategory}).` 
            });
        }

        res.status(200).json({
            message: "Rekomendasi transportasi berhasil ditemukan.",
            filter_applied: userCategory,
            total_recommendations: routes.length,
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
                    estimated_time_minutes: route.estimated_time_minutes
                }
            }))
        });

    } catch (error) {
        console.error("Error Search Routes:", error);
        res.status(500).json({ message: "Terjadi kesalahan pada server saat mencari rute." });
    }
};

module.exports = {
    searchRoutes
};