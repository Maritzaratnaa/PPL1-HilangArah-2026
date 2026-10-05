const pool = require('../backend/db');

async function testFetchRoutes() {
    try {
        const query =
            `SELECT 
                TRIM(r.route_id) AS route_id, 
                r.route_name, 
                r.is_active,
                TRIM(r.origin_stop_id) AS origin_stop_id, 
                o.name AS origin_stop_name,
                TRIM(r.destination_stop_id) AS destination_stop_id, 
                d.name AS destination_stop_name,
                TRIM(r.trans_id) AS trans_id, 
                t.name AS transport_name, 
                t.type AS transport_type
            FROM routes r
            LEFT JOIN stops o ON r.origin_stop_id = o.stop_id
            LEFT JOIN stops d ON r.destination_stop_id = d.stop_id
            LEFT JOIN trans t ON r.trans_id = t.trans_id
            ORDER BY r.route_name ASC`;

        const [routes] = await pool.query(query);
        console.log("ROUTES FETCHED:", routes.length);
        if (routes.length > 0) {
            console.log("FIRST ROUTE:", routes[0]);
        }
    } catch(e) {
        console.error("ERROR FETCHING ROUTES:", e);
    } finally {
        process.exit(0);
    }
}
testFetchRoutes();
