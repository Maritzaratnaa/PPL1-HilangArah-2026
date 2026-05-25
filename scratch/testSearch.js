const pool = require('../backend/db');

async function testSearchRoutes() {
    try {
        const origin = 'Blok M';
        const destination = 'Kota';
        const searchOrigin = `%${origin}%`;
        const searchDest = `%${destination}%`;

        let directQuery = `
            SELECT 
                r.route_id AS r_id, r.route_name,
                os.name AS origin_stop_name, os.has_ramp AS origin_ramp, os.has_elevator AS origin_elevator,
                ds.name AS destination_stop_name, ds.has_ramp AS dest_ramp, ds.has_elevator AS dest_elevator,
                ABS(d_rs.stop_order - o_rs.stop_order) AS total_stops,
                ABS(d_rs.est_time_minutes - o_rs.est_time_minutes) AS total_time,
                
                t.name AS trans_name, t.type AS trans_type, t.is_low_entry AS trans_low, t.has_wheelchair_slot AS trans_wheel, t.has_priority_seat AS trans_prio, t.has_women_area AS trans_women,
                
                o_rs.stop_order AS r_start, d_rs.stop_order AS r_end
            FROM routes r
            JOIN trans t ON r.trans_id = t.trans_id
            JOIN route_stops o_rs ON r.route_id = o_rs.route_id
            JOIN stops os ON o_rs.stop_id = os.stop_id
            JOIN route_stops d_rs ON r.route_id = d_rs.route_id
            JOIN stops ds ON d_rs.stop_id = ds.stop_id
            WHERE os.name LIKE ? AND ds.name LIKE ? AND o_rs.stop_order != d_rs.stop_order
        `;
        const [directRoutes] = await pool.query(directQuery, [searchOrigin, searchDest]);
        console.log("DIRECT ROUTES FOUND:", directRoutes.length);
        if (directRoutes.length > 0) {
            console.log(directRoutes[0]);
        }
    } catch(e) {
        console.error("ERROR IN SEARCH:", e);
    } finally {
        process.exit(0);
    }
}
testSearchRoutes();
