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
                r.route_id, r.route_name, t.name AS t_n, t.type AS t_t,
                t.is_low_entry, t.has_wheelchair_slot, t.has_priority_seat, t.has_women_area,
                os.name AS o_s, os.latitude AS o_lat, os.longitude AS o_lng, os.has_ramp AS o_r, os.has_elevator AS o_e,
                ds.name AS d_s, ds.latitude AS d_lat, ds.longitude AS d_lng, ds.has_ramp AS d_r, ds.has_elevator AS d_e,
                (d_rs.stop_order - o_rs.stop_order) AS t_s,
                (d_rs.est_time_minutes - o_rs.est_time_minutes) AS e_t,
                NULL AS transit_json 
            FROM routes r
            JOIN trans t ON r.trans_id = t.trans_id
            JOIN route_stops o_rs ON r.route_id = o_rs.route_id
            JOIN stops os ON o_rs.stop_id = os.stop_id
            JOIN route_stops d_rs ON r.route_id = d_rs.route_id
            JOIN stops ds ON d_rs.stop_id = ds.stop_id
            WHERE os.name LIKE ? AND ds.name LIKE ? 
              AND o_rs.stop_order < d_rs.stop_order AND r.is_active = TRUE

            UNION ALL

            -- 2. RUTE TRANSIT (Sambungan 2 Kendaraan)
            SELECT 
                CONCAT(r1.route_id, '-', r2.route_id) AS route_id,
                CONCAT(r1.route_name, ' ➔ ', r2.route_name) AS route_name,
                CONCAT(t1.name, ' + ', t2.name) AS t_n, 'Transit' AS t_t,
                (t1.is_low_entry AND t2.is_low_entry) AS is_low_entry,
                (t1.has_wheelchair_slot AND t2.has_wheelchair_slot) AS has_wheelchair_slot,
                (t1.has_priority_seat AND t2.has_priority_seat) AS has_priority_seat,
                (t1.has_women_area AND t2.has_women_area) AS has_women_area,
                os.name AS o_s, os.latitude AS o_lat, os.longitude AS o_lng, os.has_ramp AS o_r, os.has_elevator AS o_e,
                ds.name AS d_s, ds.latitude AS d_lat, ds.longitude AS d_lng, ds.has_ramp AS d_r, ds.has_elevator AS d_e,
                ((rs1_d.stop_order - rs1_o.stop_order) + (rs2_d.stop_order - rs2_o.stop_order)) AS t_s,
                ((rs1_d.est_time_minutes - rs1_o.est_time_minutes) + (rs2_d.est_time_minutes - rs2_o.est_time_minutes) + 10) AS e_t,
                JSON_ARRAY(JSON_OBJECT('stop_name', ts.name, 'has_ramp', ts.has_ramp=1, 'has_elevator', ts.has_elevator=1)) AS transit_json
            FROM route_stops rs1_o
            JOIN stops os ON rs1_o.stop_id = os.stop_id
            JOIN routes r1 ON rs1_o.route_id = r1.route_id
            JOIN trans t1 ON r1.trans_id = t1.trans_id
            JOIN route_stops rs1_d ON r1.route_id = rs1_d.route_id
            JOIN stops ts ON rs1_d.stop_id = ts.stop_id
            JOIN route_stops rs2_o ON ts.stop_id = rs2_o.stop_id
            JOIN routes r2 ON rs2_o.route_id = r2.route_id
            JOIN trans t2 ON r2.trans_id = t2.trans_id
            JOIN route_stops rs2_d ON r2.route_id = rs2_d.route_id
            JOIN stops ds ON ds.stop_id = rs2_d.stop_id
            WHERE os.name LIKE ? AND ds.name LIKE ?
              AND rs1_o.stop_order < rs1_d.stop_order AND rs2_o.stop_order < rs2_d.stop_order
              AND r1.route_id <> r2.route_id
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