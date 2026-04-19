const pool = require('../db');

// --- HELPER: Cek apakah fasilitas kendaraan sesuai dengan profil user ---
const checkRecommendation = (userCategory, transports) => {
    if (transports.length === 0) return false;
    
    const safeCat = (userCategory || '').trim().toLowerCase();

    if (['disability', 'disabilitas', 'tunanetra', 'tuli', 'pengguna kursi roda'].includes(safeCat)) {
        return transports.every(t => t.facilities.low_entry || t.facilities.wheelchair_slot);
    } else if (['elderly', 'pregnant', 'vulnerable', 'children', 'lansia', 'ibu hamil', 'penyakit rentan', 'anak-anak'].includes(safeCat)) {
        return transports.every(t => t.facilities.priority_seat);
    } else if (['women', 'wanita', 'perempuan'].includes(safeCat)) {
        return transports.every(t => t.facilities.women_area);
    }
    return true; 
};

const formatTransport = (prefix, row) => [{
    name: row[`${prefix}_name`], type: row[`${prefix}_type`],
    facilities: {
        low_entry: row[`${prefix}_low`] === 1,
        wheelchair_slot: row[`${prefix}_wheel`] === 1,
        priority_seat: row[`${prefix}_prio`] === 1,
        women_area: row[`${prefix}_women`] === 1
    }
}];

const searchRoutes = async (req, res) => {
    try {
        const userId = req.user.user_id; 
        const { origin, destination } = req.query;

        if (!origin || !destination) {
            return res.status(400).json({ message: "Asal dan tujuan wajib diisi!" });
        }

        const [profiles] = await pool.query('SELECT category_status FROM profiles WHERE user_id = ?', [userId]);
        const userCategory = profiles.length > 0 ? profiles[0].category_status : 'Umum';

        const searchOrigin = `%${origin}%`;
        const searchDest = `%${destination}%`;

        await pool.query("SET SESSION group_concat_max_len = 1000000;");

        console.log(`\n======================================================`);
        console.log(`🔍 [DEBUG] MENCARI RUTE: "${origin}" ➔ "${destination}"`);
        console.log(`======================================================`);

        // ==========================================
        // CASE 1: RUTE LANGSUNG (DIRECT)
        // ==========================================
        console.time("⏱️ [WAKTU] Eksekusi Query Direct");
        let directQuery = `
            SELECT 
                r.route_id, r.route_name,
                os.name AS origin_stop_name, os.has_ramp AS origin_ramp, os.has_elevator AS origin_elevator,
                ds.name AS destination_stop_name, ds.has_ramp AS dest_ramp, ds.has_elevator AS dest_elevator,
                ABS(d_rs.stop_order - o_rs.stop_order) AS total_stops,
                ABS(d_rs.est_time_minutes - o_rs.est_time_minutes) AS total_time,
                
                t.name AS trans_name, t.type AS trans_type, t.is_low_entry AS trans_low, t.has_wheelchair_slot AS trans_wheel, t.has_priority_seat AS trans_prio, t.has_women_area AS trans_women,
                
                (SELECT CONCAT('[', GROUP_CONCAT(JSON_OBJECT('stop_name', s.name, 'latitude', s.latitude, 'longitude', s.longitude, 'has_ramp', IF(s.has_ramp=1, true, false), 'has_elevator', IF(s.has_elevator=1, true, false)) ORDER BY rs.stop_order ASC), ']') 
                 FROM route_stops rs JOIN stops s ON rs.stop_id = s.stop_id 
                 WHERE rs.route_id = r.route_id AND rs.stop_order BETWEEN LEAST(o_rs.stop_order, d_rs.stop_order) AND GREATEST(o_rs.stop_order, d_rs.stop_order)
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
        console.timeEnd("⏱️ [WAKTU] Eksekusi Query Direct");

        if (directRoutes.length > 0) {
            console.log(`✅ Ditemukan ${directRoutes.length} rute langsung!`);
            const results = directRoutes.map(row => {
                const transports = formatTransport('trans', row);
                return {
                    route_type: "direct", total_estimated_time: row.total_time,
                    is_recommended: checkRecommendation(userCategory, transports), 
                    legs: [{
                        step: 1, route_name: row.route_name, origin_stop: row.origin_stop_name, destination_stop: row.destination_stop_name,
                        transports: transports, stops_passed: row.total_stops, estimated_time_minutes: row.total_time,
                        route_path: JSON.parse(row.route_path_json)
                    }]
                };
            });
            return res.status(200).json({ filter_applied: userCategory, data: results });
        }
        console.log(`❌ Rute Langsung tidak ditemukan. Melanjutkan ke pencarian Transit 1x...`);

        // ==========================================
        // CASE 2: RUTE TRANSIT 1x
        // ==========================================
        console.time("⏱️ [WAKTU] Eksekusi Query Transit 1x");
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
                ABS(t_rs1.stop_order - o_rs.stop_order) AS leg1_stops,
                ABS(d_rs.stop_order - t_rs2.stop_order) AS leg2_stops,
                
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
            ORDER BY (leg1_time + leg2_time) ASC
            LIMIT 3
        `;
        const [transitRoutes] = await pool.query(transitQuery, [searchOrigin, searchDest]);
        console.timeEnd("⏱️ [WAKTU] Eksekusi Query Transit 1x");

        if (transitRoutes.length > 0) {
            console.log(`✅ Ditemukan ${transitRoutes.length} rute dengan Transit 1x!`);
            const results = transitRoutes.map(row => {
                const t1 = formatTransport('t1', row);
                const t2 = formatTransport('t2', row);
                return {
                    route_type: "transit", total_estimated_time: row.leg1_time + row.leg2_time,
                    is_recommended: checkRecommendation(userCategory, t1) && checkRecommendation(userCategory, t2),
                    legs: [
                        { step: 1, route_name: row.r1_name, origin_stop: row.origin_name, destination_stop: row.transit_name, estimated_time_minutes: row.leg1_time, stops_passed: row.leg1_stops, route_path: JSON.parse(row.path1), transports: t1 },
                        { step: 2, route_name: row.r2_name, origin_stop: row.transit_name, destination_stop: row.dest_name, estimated_time_minutes: row.leg2_time, stops_passed: row.leg2_stops, route_path: JSON.parse(row.path2), transports: t2 }
                    ]
                };
            });
            return res.status(200).json({ filter_applied: userCategory, data: results });
        }
        console.log(`❌ Rute Transit 1x tidak ditemukan. Mencoba rute Transit 2x (AWAS QUERY BERAT!)...`);

        // ==========================================
        // CASE 3: RUTE TRANSIT 2x (3 Kendaraan)
        // ==========================================
        console.time("⏱️ [WAKTU] Eksekusi Query Transit 2x (SANGAT BERAT)");
        let transit2xQuery = `
            SELECT 
                r1.route_name AS r1_name, t1.name AS t1_name, t1.type AS t1_type,
                t1.is_low_entry AS t1_low, t1.has_wheelchair_slot AS t1_wheel, t1.has_priority_seat AS t1_prio, t1.has_women_area AS t1_women,
                os.name AS origin_name, ts1_out.name AS transit1_name,
                
                r2.route_name AS r2_name, t2.name AS t2_name, t2.type AS t2_type,
                t2.is_low_entry AS t2_low, t2.has_wheelchair_slot AS t2_wheel, t2.has_priority_seat AS t2_prio, t2.has_women_area AS t2_women,
                ts2_out.name AS transit2_name,
                
                r3.route_name AS r3_name, t3.name AS t3_name, t3.type AS t3_type,
                t3.is_low_entry AS t3_low, t3.has_wheelchair_slot AS t3_wheel, t3.has_priority_seat AS t3_prio, t3.has_women_area AS t3_women,
                ds.name AS dest_name,
                
                ABS(t1_rs_out.est_time_minutes - o_rs.est_time_minutes) AS leg1_time,
                ABS(t2_rs_out.est_time_minutes - t2_rs_in.est_time_minutes) AS leg2_time,
                ABS(d_rs.est_time_minutes - t3_rs_in.est_time_minutes) AS leg3_time,

                ABS(t1_rs_out.stop_order - o_rs.stop_order) AS leg1_stops,
                ABS(t2_rs_out.stop_order - t2_rs_in.stop_order) AS leg2_stops,
                ABS(d_rs.stop_order - t3_rs_in.stop_order) AS leg3_stops,

                (SELECT CONCAT('[', GROUP_CONCAT(JSON_OBJECT('stop_name', s.name, 'latitude', s.latitude, 'longitude', s.longitude, 'has_ramp', IF(s.has_ramp=1, true, false), 'has_elevator', IF(s.has_elevator=1, true, false)) ORDER BY rs.stop_order ASC), ']') 
                 FROM route_stops rs JOIN stops s ON rs.stop_id = s.stop_id 
                 WHERE rs.route_id = r1.route_id AND rs.stop_order BETWEEN LEAST(o_rs.stop_order, t1_rs_out.stop_order) AND GREATEST(o_rs.stop_order, t1_rs_out.stop_order)) AS path1,
                 
                (SELECT CONCAT('[', GROUP_CONCAT(JSON_OBJECT('stop_name', s.name, 'latitude', s.latitude, 'longitude', s.longitude, 'has_ramp', IF(s.has_ramp=1, true, false), 'has_elevator', IF(s.has_elevator=1, true, false)) ORDER BY rs.stop_order ASC), ']') 
                 FROM route_stops rs JOIN stops s ON rs.stop_id = s.stop_id 
                 WHERE rs.route_id = r2.route_id AND rs.stop_order BETWEEN LEAST(t2_rs_in.stop_order, t2_rs_out.stop_order) AND GREATEST(t2_rs_in.stop_order, t2_rs_out.stop_order)) AS path2,

                (SELECT CONCAT('[', GROUP_CONCAT(JSON_OBJECT('stop_name', s.name, 'latitude', s.latitude, 'longitude', s.longitude, 'has_ramp', IF(s.has_ramp=1, true, false), 'has_elevator', IF(s.has_elevator=1, true, false)) ORDER BY rs.stop_order ASC), ']') 
                 FROM route_stops rs JOIN stops s ON rs.stop_id = s.stop_id 
                 WHERE rs.route_id = r3.route_id AND rs.stop_order BETWEEN LEAST(t3_rs_in.stop_order, d_rs.stop_order) AND GREATEST(t3_rs_in.stop_order, d_rs.stop_order)) AS path3

            FROM route_stops o_rs
            JOIN stops os ON o_rs.stop_id = os.stop_id
            JOIN routes r1 ON o_rs.route_id = r1.route_id
            JOIN trans t1 ON r1.trans_id = t1.trans_id
            
            -- Transit 1
            JOIN route_stops t1_rs_out ON r1.route_id = t1_rs_out.route_id
            JOIN stops ts1_out ON t1_rs_out.stop_id = ts1_out.stop_id
            JOIN stops ts1_in ON ts1_out.hub_id = ts1_in.hub_id AND ts1_out.hub_id IS NOT NULL
            JOIN route_stops t2_rs_in ON ts1_in.stop_id = t2_rs_in.stop_id AND t2_rs_in.route_id != r1.route_id
            JOIN routes r2 ON t2_rs_in.route_id = r2.route_id
            JOIN trans t2 ON r2.trans_id = t2.trans_id

            -- Transit 2
            JOIN route_stops t2_rs_out ON r2.route_id = t2_rs_out.route_id AND t2_rs_out.stop_order != t2_rs_in.stop_order
            JOIN stops ts2_out ON t2_rs_out.stop_id = ts2_out.stop_id
            JOIN stops ts2_in ON ts2_out.hub_id = ts2_in.hub_id AND ts2_out.hub_id IS NOT NULL
            JOIN route_stops t3_rs_in ON ts2_in.stop_id = t3_rs_in.stop_id AND t3_rs_in.route_id != r2.route_id AND t3_rs_in.route_id != r1.route_id
            JOIN routes r3 ON t3_rs_in.route_id = r3.route_id
            JOIN trans t3 ON r3.trans_id = t3.trans_id

            -- Tujuan
            JOIN route_stops d_rs ON r3.route_id = d_rs.route_id
            JOIN stops ds ON d_rs.stop_id = ds.stop_id
            
            WHERE os.name LIKE ? AND ds.name LIKE ?
            ORDER BY (leg1_time + leg2_time + leg3_time) ASC 
            LIMIT 2
        `;

        const [transit2xRoutes] = await pool.query(transit2xQuery, [searchOrigin, searchDest]);
        console.timeEnd("⏱️ [WAKTU] Eksekusi Query Transit 2x (SANGAT BERAT)");

        if (transit2xRoutes.length > 0) {
            console.log(`✅ Ditemukan ${transit2xRoutes.length} rute dengan Transit 2x!`);
            const results = transit2xRoutes.map(row => {
                const t1 = formatTransport('t1', row);
                const t2 = formatTransport('t2', row);
                const t3 = formatTransport('t3', row);
                return {
                    route_type: "transit", total_estimated_time: row.leg1_time + row.leg2_time + row.leg3_time,
                    is_recommended: checkRecommendation(userCategory, t1) && checkRecommendation(userCategory, t2) && checkRecommendation(userCategory, t3),
                    legs: [
                        { step: 1, route_name: row.r1_name, origin_stop: row.origin_name, destination_stop: row.transit1_name, estimated_time_minutes: row.leg1_time, stops_passed: row.leg1_stops, route_path: JSON.parse(row.path1), transports: t1 },
                        { step: 2, route_name: row.r2_name, origin_stop: row.transit1_name, destination_stop: row.transit2_name, estimated_time_minutes: row.leg2_time, stops_passed: row.leg2_stops, route_path: JSON.parse(row.path2), transports: t2 },
                        { step: 3, route_name: row.r3_name, origin_stop: row.transit2_name, destination_stop: row.dest_name, estimated_time_minutes: row.leg3_time, stops_passed: row.leg3_stops, route_path: JSON.parse(row.path3), transports: t3 }
                    ]
                };
            });
            return res.status(200).json({ filter_applied: userCategory, data: results });
        }

        console.log(`❌ Rute sama sekali tidak ditemukan.`);
        return res.status(404).json({ message: "Rute tidak ditemukan. Pastikan nama halte benar." });

    } catch (error) {
        console.error("❌ ERROR SAAT PENCARIAN:", error);
        res.status(500).json({ message: "Terjadi kesalahan pada server saat mencari rute." });
    }
};

module.exports = { searchRoutes };