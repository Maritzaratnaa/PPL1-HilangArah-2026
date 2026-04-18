const pool = require('../db');

const searchRoutes = async (req, res) => {
    try {
        const userId = req.user.user_id; 
        const { origin, destination } = req.query;

        if (!origin || !destination) {
            return res.status(400).json({ message: "Asal dan tujuan wajib diisi!" });
        }

        // Ambil kategori user untuk filter rekomendasi
        const [profiles] = await pool.query('SELECT category_status FROM profiles WHERE user_id = ?', [userId]);
        const userCategory = profiles.length > 0 ? profiles[0].category_status : 'Umum';

        const searchOrigin = `%${origin}%`;
        const searchDest = `%${destination}%`;

        // Setting agar GROUP_CONCAT (untuk path halte) tidak terpotong
        await pool.query("SET SESSION group_concat_max_len = 1000000;");

        // ==========================================
        // CASE 1: RUTE LANGSUNG (DIRECT)
        // ==========================================
        let directQuery = `
            SELECT 
                r.route_id, r.route_name,
                os.name AS origin_stop_name, os.has_ramp AS origin_ramp, os.has_elevator AS origin_elevator,
                ds.name AS destination_stop_name, ds.has_ramp AS dest_ramp, ds.has_elevator AS dest_elevator,
                ABS(d_rs.stop_order - o_rs.stop_order) AS total_stops,
                ABS(d_rs.est_time_minutes - o_rs.est_time_minutes) AS total_time,
                -- Data Kendaraan Langsung dari JOIN tabel trans
                t.name AS trans_name, t.type AS trans_type, t.is_low_entry, t.has_wheelchair_slot, t.has_priority_seat, t.has_women_area,
                -- Path Halte yang dilewati
                (SELECT CONCAT('[', GROUP_CONCAT(JSON_OBJECT(
                    'stop_name', s.name, 
                    'latitude', s.latitude, 
                    'longitude', s.longitude,
                    'has_ramp', IF(s.has_ramp=1, true, false),
                    'has_elevator', IF(s.has_elevator=1, true, false)
                ) ORDER BY rs.stop_order ASC), ']') 
                 FROM route_stops rs JOIN stops s ON rs.stop_id = s.stop_id 
                 WHERE rs.route_id = r.route_id 
                 AND rs.stop_order BETWEEN LEAST(o_rs.stop_order, d_rs.stop_order) AND GREATEST(o_rs.stop_order, d_rs.stop_order)
                ) AS route_path_json
            FROM routes r
            JOIN trans t ON r.trans_id = t.trans_id
            JOIN route_stops o_rs ON r.route_id = o_rs.route_id
            JOIN stops os ON o_rs.stop_id = os.stop_id
            JOIN route_stops d_rs ON r.route_id = d_rs.route_id
            JOIN stops ds ON d_rs.stop_id = ds.stop_id
            WHERE os.name LIKE ? AND ds.name LIKE ? AND o_rs.stop_order != d_rs.stop_order
        `;

        const [directRoutes] = await pool.query(directQuery, [searchOrigin, searchDest]);

        // Fungsi Helper untuk format Transports agar sesuai Frontend
        const formatTransport = (row) => [{
            name: row.trans_name,
            type: row.trans_type,
            facilities: {
                low_entry: row.is_low_entry === 1,
                wheelchair_slot: row.has_wheelchair_slot === 1,
                priority_seat: row.has_priority_seat === 1,
                women_area: row.has_women_area === 1
            }
        }];

        if (directRoutes.length > 0) {
            const results = directRoutes.map(row => ({
                route_type: "direct",
                total_estimated_time: row.total_time,
                is_recommended: true, // Bisa ditambah logika filter di sini
                legs: [{
                    step: 1,
                    route_name: row.route_name,
                    origin_stop: row.origin_stop_name,
                    destination_stop: row.destination_stop_name,
                    transports: formatTransport(row),
                    stops_passed: row.total_stops,
                    estimated_time_minutes: row.total_time,
                    route_path: JSON.parse(row.route_path_json)
                }]
            }));
            return res.status(200).json({ data: results });
        }

        // ==========================================
        // CASE 2: RUTE TRANSIT (VIA HUB_ID)
        // ==========================================
        let transitQuery = `
            SELECT 
                r1.route_name AS r1_name, t1.name AS t1_name, t1.type AS t1_type,
                t1.is_low_entry AS t1_low, t1.has_wheelchair_slot AS t1_wheel, t1.has_priority_seat AS t1_prio, t1.has_women_area AS t1_women,
                os.name AS origin_name, ts1.name AS transit_name,
                
                r2.route_name AS r2_name, t2.name AS t2_name, t2.type AS t2_type,
                t2.is_low_entry AS t2_low, t2.has_wheelchair_slot AS t2_wheel, t2.has_priority_seat AS t2_prio, t2.has_women_area AS t2_women,
                ds.name AS dest_name,
                
                ABS(t_rs1.est_time_minutes - o_rs.est_time_minutes) AS leg1_time,
                ABS(d_rs.est_time_minutes - t_rs2.est_time_minutes) AS leg2_time,
                
                (SELECT CONCAT('[', GROUP_CONCAT(JSON_OBJECT('stop_name', s.name, 'latitude', s.latitude, 'longitude', s.longitude, 'has_ramp', IF(s.has_ramp=1, true, false), 'has_elevator', IF(s.has_elevator=1, true, false)) ORDER BY rs.stop_order ASC), ']') 
                 FROM route_stops rs JOIN stops s ON rs.stop_id = s.stop_id 
                 WHERE rs.route_id = r1.route_id AND rs.stop_order BETWEEN LEAST(o_rs.stop_order, t_rs1.stop_order) AND GREATEST(o_rs.stop_order, t_rs1.stop_order)) AS path1,
                
                (SELECT CONCAT('[', GROUP_CONCAT(JSON_OBJECT('stop_name', s.name, 'latitude', s.latitude, 'longitude', s.longitude, 'has_ramp', IF(s.has_ramp=1, true, false), 'has_elevator', IF(s.has_elevator=1, true, false)) ORDER BY rs.stop_order ASC), ']') 
                 FROM route_stops rs JOIN stops s ON rs.stop_id = s.stop_id 
                 WHERE rs.route_id = r2.route_id AND rs.stop_order BETWEEN LEAST(t_rs2.stop_order, d_rs.stop_order) AND GREATEST(t_rs2.stop_order, d_rs.stop_order)) AS path2

            FROM route_stops o_rs
            JOIN stops os ON o_rs.stop_id = os.stop_id
            JOIN routes r1 ON o_rs.route_id = r1.route_id
            JOIN trans t1 ON r1.trans_id = t1.trans_id
            
            JOIN route_stops t_rs1 ON r1.route_id = t_rs1.route_id
            JOIN stops ts1 ON t_rs1.stop_id = ts1.stop_id
            
            JOIN stops ts2 ON ts1.hub_id = ts2.hub_id AND ts1.hub_id IS NOT NULL
            
            JOIN route_stops t_rs2 ON ts2.stop_id = t_rs2.stop_id AND t_rs2.route_id != r1.route_id
            JOIN routes r2 ON t_rs2.route_id = r2.route_id
            JOIN trans t2 ON r2.trans_id = t2.trans_id
            
            JOIN route_stops d_rs ON r2.route_id = d_rs.route_id
            JOIN stops ds ON d_rs.stop_id = ds.stop_id
            
            WHERE os.name LIKE ? AND ds.name LIKE ?
            LIMIT 3
        `;

        const [transitRoutes] = await pool.query(transitQuery, [searchOrigin, searchDest]);

        if (transitRoutes.length === 0) {
            return res.status(404).json({ message: "Rute tidak ditemukan." });
        }

        const results = transitRoutes.map(row => ({
            route_type: "transit",
            total_estimated_time: row.leg1_time + row.leg2_time,
            legs: [
                {
                    step: 1, route_name: row.r1_name, origin_stop: row.origin_name, destination_stop: row.transit_name,
                    estimated_time_minutes: row.leg1_time,
                    route_path: JSON.parse(row.path1),
                    transports: [{
                        name: row.t1_name, type: row.t1_type,
                        facilities: { women_area: row.t1_women === 1, low_entry: row.t1_low === 1, priority_seat: row.t1_prio === 1, wheelchair_slot: row.t1_wheel === 1 }
                    }]
                },
                {
                    step: 2, route_name: row.r2_name, origin_stop: row.transit_name, destination_stop: row.dest_name,
                    estimated_time_minutes: row.leg2_time,
                    route_path: JSON.parse(row.path2),
                    transports: [{
                        name: row.t2_name, type: row.t2_type,
                        facilities: { women_area: row.t2_women === 1, low_entry: row.t2_low === 1, priority_seat: row.t2_prio === 1, wheelchair_slot: row.t2_wheel === 1 }
                    }]
                }
            ]
        }));

        res.status(200).json({ data: results });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

module.exports = { searchRoutes };