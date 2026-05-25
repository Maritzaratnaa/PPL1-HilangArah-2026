const pool = require('../backend/db');

async function testInsertRoute() {
    try {
        const query = `
            INSERT INTO routes (route_id, route_name, origin_stop_id, destination_stop_id, is_active, trans_id) 
            VALUES (?, ?, ?, ?, ?, ?)`;

        const paddedTransId = 'TR-001                              ';
        await pool.query(query, [
            'RT-999', 'TEST ROUTE', 'STP-001', 'STP-002',
            1,
            paddedTransId
        ]);
        
        console.log("INSERT ROUTE SUCCESS");
        
        const rsQuery = `INSERT INTO route_stops (route_stop_id, route_id, stop_id, stop_order, est_time_minutes) VALUES ?`;
        const rsValues = [
            [null, 'RT-999', 'STP-001', 1, 0]
        ];
        await pool.query(rsQuery, [rsValues]);
        console.log("INSERT ROUTE STOPS SUCCESS");
        
        await pool.query(`DELETE FROM route_stops WHERE route_id = 'RT-999'`);
        await pool.query(`DELETE FROM routes WHERE route_id = 'RT-999'`);
    } catch(e) {
        console.error("ERROR:", e);
    } finally {
        process.exit(0);
    }
}
testInsertRoute();
