const pool = require('../backend/db');

async function testDesc() {
    try {
        const [rows] = await pool.query(`DESCRIBE route_stops`);
        console.log(rows);
    } catch(e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
testDesc();
