const pool = require('../backend/db');

async function testFetchRoutesAll() {
    try {
        const query =
            `SELECT 
                TRIM(r.route_id) AS route_id, 
                r.route_name, 
                TRIM(r.trans_id) AS trans_id, 
                t.name AS transport_name, 
                t.type AS transport_type
            FROM routes r
            LEFT JOIN trans t ON TRIM(r.trans_id) = TRIM(t.trans_id)
            ORDER BY r.route_id DESC LIMIT 5`;

        const [routes] = await pool.query(query);
        console.log("LAST 5 ROUTES:", routes);
    } catch(e) {
        console.error("ERROR FETCHING ROUTES:", e);
    } finally {
        process.exit(0);
    }
}
testFetchRoutesAll();
