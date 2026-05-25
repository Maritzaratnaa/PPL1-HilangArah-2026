const pool = require('../backend/db');

async function testFetchRoutes() {
    try {
        const query =
            `SELECT 
                r.route_id, 
                r.trans_id, 
                t.name AS transport_name, 
                t.type AS transport_type
            FROM routes r
            LEFT JOIN trans t ON r.trans_id = t.trans_id
            ORDER BY r.route_id DESC LIMIT 5`;

        const [rows] = await pool.query(query);
        console.log(rows);
    } catch(e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
testFetchRoutes();
