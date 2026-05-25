const pool = require('../backend/db');

async function testDescRoutes() {
    try {
        const [rows] = await pool.query(`DESCRIBE routes`);
        console.log(rows);
    } catch(e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
testDescRoutes();
