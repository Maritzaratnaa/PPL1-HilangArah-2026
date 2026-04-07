const pool = require('../db');
const searchRoutes = async (req, res) => {
    try {
        const userId = req.user.user_id; 
        const { origin, destination } = req.query;

        if (!origin || !destination) {
            return res.status(400).json({ message: "Nama Halte asal dan tujuan wajib diisi!" });
        }

        const [profiles] = await pool.query('SELECT category_status FROM profiles WHERE user_id = ?', [userId]);
        if (profiles.length === 0) {
            return res.status(404).json({ message: "Profil pengguna tidak ditemukan." });
        }
        
        const userCategory = profiles[0].category_status;

        // 1. QUERY SQL: Mengambil daftar armada sebagai JSON Array menggunakan subquery
        let query = `
            SELECT 
                r.route_id, 
                r.route_name,
                
                os.name AS origin_stop_name, 
                os.latitude AS origin_lat, 
                os.longitude AS origin_lng,
                os.has_ramp AS origin_has_ramp,
                os.has_elevator AS origin_has_elevator,
                
                ds.name AS destination_stop_name,
                ds.latitude AS dest_lat,
                ds.longitude AS dest_lng,
                ds.has_ramp AS dest_has_ramp,
                ds.has_elevator AS dest_has_elevator,
                
                (d_rs.stop_order - o_rs.stop_order) AS total_stops,
                (d_rs.est_time_minutes - o_rs.est_time_minutes) AS estimated_time_minutes,
                
                /* MENGAMBIL DAFTAR KENDARAAN (Bisa lebih dari 1) */
                (SELECT CONCAT('[', GROUP_CONCAT(
                    JSON_OBJECT(
                        'name', t.name, 
                        'type', t.type,
                        'facilities', JSON_OBJECT(
                            'low_entry', IF(t.is_low_entry=1, true, false),
                            'wheelchair_slot', IF(t.has_wheelchair_slot=1, true, false),
                            'priority_seat', IF(t.has_priority_seat=1, true, false),
                            'women_area', IF(t.has_women_area=1, true, false)
                        )
                    ) ORDER BY rt.transport_order ASC
                ), ']')
                 FROM route_transports rt
                 JOIN trans t ON rt.trans_id = t.trans_id
                 WHERE rt.route_id = r.route_id
                ) AS transports_json,
                
                /* MENGAMBIL DAFTAR TRANSIT HALTE */
                (SELECT CONCAT('[', GROUP_CONCAT(
                    JSON_OBJECT(
                        'stop_name', s.name, 
                        'has_ramp', IF(s.has_ramp=1, true, false), 
                        'has_elevator', IF(s.has_elevator=1, true, false)
                    ) ORDER BY rs.stop_order ASC
                ), ']')
                 FROM route_stops rs
                 JOIN stops s ON rs.stop_id = s.stop_id
                 WHERE rs.route_id = r.route_id 
                   AND rs.stop_order > o_rs.stop_order 
                   AND rs.stop_order < d_rs.stop_order
                ) AS transit_stops_json

            FROM routes r
            JOIN route_stops o_rs ON r.route_id = o_rs.route_id
            JOIN stops os ON o_rs.stop_id = os.stop_id
            JOIN route_stops d_rs ON r.route_id = d_rs.route_id
            JOIN stops ds ON d_rs.stop_id = ds.stop_id
            WHERE os.name LIKE ? 
              AND ds.name LIKE ? 
              AND o_rs.stop_order < d_rs.stop_order 
              AND r.is_active = TRUE
        `;

        const searchOrigin = `%${origin}%`;
        const searchDest = `%${destination}%`;

        const [routes] = await pool.query(query, [searchOrigin, searchDest]);

        if (routes.length === 0) {
            return res.status(404).json({ 
                message: `Rute dari "${origin}" ke "${destination}" tidak ditemukan.` 
            });
        }

        // 2. LOGIKA JAVASCRIPT
        const processedRoutes = routes.map(route => {
            const parsedTransports = route.transports_json ? JSON.parse(route.transports_json) : [];
            let isRecommended = false;

            // Rute direkomendasikan jika SEMUA armada yang dipakai di rute itu memadai
            if (userCategory === 'Disabilitas') {
                const originAccessible = route.origin_has_ramp || route.origin_has_elevator;
                const destAccessible = route.dest_has_ramp || route.dest_has_elevator;
                // Cek apakah setiap kendaraan punya akses kursi roda / low entry
                const transportsAccessible = parsedTransports.every(t => t.facilities.low_entry || t.facilities.wheelchair_slot);
                
                if (originAccessible && destAccessible && transportsAccessible) {
                    isRecommended = true;
                }
            } else if (['Lansia', 'Ibu Hamil', 'Penyakit Rentan'].includes(userCategory)) {
                // Cek apakah setiap kendaraan punya kursi prioritas
                if (parsedTransports.every(t => t.facilities.priority_seat)) {
                    isRecommended = true;
                }
            } else if (['Ibu Hamil', 'Wanita', 'Perempuan'].includes(userCategory)) {
                 // Cek apakah setiap kendaraan punya gerbong wanita
                 if (parsedTransports.every(t => t.facilities.women_area)) {
                     isRecommended = true;
                 }
            } else {
                isRecommended = true; 
            }

            return {
                route_id: route.route_id,
                is_recommended: isRecommended,
                route_name: route.route_name,
                transports: parsedTransports, // SEKARANG MENGIRIM ARRAY TRANSPORTS []
                journey: {
                    origin_stop: route.origin_stop_name,
                    origin_has_ramp: route.origin_has_ramp === 1,
                    origin_has_elevator: route.origin_has_elevator === 1,
                    destination_stop: route.destination_stop_name,
                    dest_has_ramp: route.dest_has_ramp === 1,
                    dest_has_elevator: route.dest_has_elevator === 1,
                    stops_passed: route.total_stops,
                    estimated_time_minutes: route.estimated_time_minutes,
                    transit_stops: route.transit_stops_json ? JSON.parse(route.transit_stops_json) : [],
                    origin_lat: route.origin_lat,
                    origin_lng: route.origin_lng,
                    dest_lat: route.dest_lat,
                    dest_lng: route.dest_lng
                }
            };
        });

        // 3. SORTING
        processedRoutes.sort((a, b) => {
            if (a.is_recommended !== b.is_recommended) return a.is_recommended ? -1 : 1;
            return a.journey.estimated_time_minutes - b.journey.estimated_time_minutes;
        });

        res.status(200).json({
            message: "Rute berhasil ditemukan.",
            filter_applied: userCategory,
            total_recommendations: processedRoutes.length,
            data: processedRoutes
        });

    } catch (error) {
        console.error("Error Search Routes:", error);
        res.status(500).json({ message: "Terjadi kesalahan pada server saat mencari rute." });
    }
};

module.exports = { searchRoutes };