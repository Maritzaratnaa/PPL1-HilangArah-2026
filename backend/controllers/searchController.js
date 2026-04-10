const pool = require('../db');

const searchRoutes = async (req, res) => {
    try {
        const userId = req.user.user_id; 
        const { origin, destination } = req.query;

        if (!origin || !destination) {
            return res.status(400).json({ message: "Nama Halte asal dan tujuan wajib diisi!" });
        }

        const [profiles] = await pool.query('SELECT category_status FROM profiles WHERE user_id = ?', [userId]);
        const userCategory = profiles.length > 0 ? profiles[0].category_status : 'Umum';

        const searchOrigin = `%${origin.trim()}%`;
        const searchDest = `%${destination.trim()}%`;

        // QUERY SQL: Menggunakan UNION agar rute Transit (Lebak Bulus - Cawang) bisa ketemu
        let query = `
            -- 1. RUTE LANGSUNG (DIRECT)
            SELECT 
                r.route_id, 
                r.route_name, 
                GROUP_CONCAT(t.name ORDER BY rt.transport_order SEPARATOR ' + ') AS t_n, 
                IF(COUNT(t.trans_id) > 1, 'Transit', MAX(t.type)) AS t_t,
                MIN(t.is_low_entry) AS is_low_entry, 
                MIN(t.has_wheelchair_slot) AS has_wheelchair_slot, 
                MIN(t.has_priority_seat) AS has_priority_seat, 
                MIN(t.has_women_area) AS has_women_area,
                os.name AS o_s, os.latitude AS o_lat, os.longitude AS o_lng, os.has_ramp AS o_r, os.has_elevator AS o_e,
                ds.name AS d_s, ds.latitude AS d_lat, ds.longitude AS d_lng, ds.has_ramp AS d_r, ds.has_elevator AS d_e,
                (d_rs.stop_order - o_rs.stop_order) AS t_s,
                (d_rs.est_time_minutes - o_rs.est_time_minutes) AS e_t,
                (
                    SELECT JSON_ARRAYAGG(JSON_OBJECT('stop_name', ms.name, 'has_ramp', ms.has_ramp=1, 'has_elevator', ms.has_elevator=1))
                    FROM route_stops mrs
                    JOIN stops ms ON mrs.stop_id = ms.stop_id
                    WHERE mrs.route_id = r.route_id 
                      AND mrs.stop_order > o_rs.stop_order 
                      AND mrs.stop_order < d_rs.stop_order
                ) AS transit_json
            FROM routes r
            JOIN route_transports rt ON r.route_id = rt.route_id
            JOIN trans t ON rt.trans_id = t.trans_id
            JOIN route_stops o_rs ON r.route_id = o_rs.route_id
            JOIN stops os ON o_rs.stop_id = os.stop_id
            JOIN route_stops d_rs ON r.route_id = d_rs.route_id
            JOIN stops ds ON d_rs.stop_id = ds.stop_id
            WHERE os.name LIKE ? AND ds.name LIKE ? 
              AND o_rs.stop_order < d_rs.stop_order AND r.is_active = TRUE
            GROUP BY 
                r.route_id, r.route_name, 
                o_s, o_lat, o_lng, o_r, o_e,
                d_s, d_lat, d_lng, d_r, d_e,
                o_rs.stop_order, d_rs.stop_order, o_rs.est_time_minutes, d_rs.est_time_minutes
        `;

        const [dbRoutes] = await pool.query(query, [searchOrigin, searchDest, searchOrigin, searchDest]);

        if (dbRoutes.length === 0) {
            return res.status(404).json({ message: "Rute tidak ditemukan." });
        }

        const processedRoutes = dbRoutes.map(route => {
            // Logika Rekomendasi
            let recommended = false;
            const cat = userCategory.toLowerCase();
            const hasAcc = (route.o_r || route.o_e) && (route.is_low_entry || route.has_wheelchair_slot);
            
            if (cat === 'disabilitas') recommended = hasAcc;
            else if (['lansia', 'ibu hamil', 'penyakit rentan'].includes(cat)) recommended = route.has_priority_seat === 1;
            else recommended = true;

            return {
                route_id: String(route.route_id),
                is_recommended: recommended,
                route_name: route.route_name,
                // DISESUAIKAN: transport (Objek Tunggal) sesuai interface RouteResult kamu
                transport: {
                    name: route.t_n,
                    type: route.t_t,
                    facilities: {
                        low_entry: route.is_low_entry === 1,
                        wheelchair_slot: route.has_wheelchair_slot === 1,
                        priority_seat: route.has_priority_seat === 1,
                        women_area: route.has_women_area === 1
                    }
                },
                journey: {
                    origin_stop: route.o_s,
                    origin_has_ramp: route.o_r === 1,
                    origin_has_elevator: route.o_e === 1,
                    destination_stop: route.d_s,
                    dest_has_ramp: route.d_r === 1,
                    dest_has_elevator: route.d_e === 1,
                    stops_passed: route.t_s,
                    estimated_time_minutes: route.e_t,
                    // Parse transit stops agar muncul di detail dropdown
                    transit_stops: route.transit_json ? (typeof route.transit_json === 'string' ? JSON.parse(route.transit_json) : route.transit_json) : [],
                    origin_lat: route.o_lat, origin_lng: route.o_lng,
                    dest_lat: route.d_lat, dest_lng: route.d_lng
                }
            };
        });

        res.status(200).json({
            message: "Success",
            filter_applied: userCategory,
            data: processedRoutes
        });

    } catch (error) {
        console.error("LOG ERROR:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

module.exports = { searchRoutes };