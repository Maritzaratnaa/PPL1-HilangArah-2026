const pool = require('../backend/db');

async function ensureTransId() {
    try {
        await pool.query(`ALTER TABLE route_stops ADD COLUMN trans_id CHAR(36)`);
        console.log("Column trans_id added to route_stops");
    } catch(e) {
        if (e.code === 'ER_DUP_FIELDNAME') {
            console.log("Column trans_id already exists.");
        } else {
            console.error("Error:", e.message);
        }
    } finally {
        process.exit(0);
    }
}
ensureTransId();
