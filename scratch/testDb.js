const pool = require('../backend/db');

async function test() {
    try {
        const query = `SELECT trans_id FROM trans WHERE trans_id LIKE 'TR-%' ORDER BY trans_id DESC LIMIT 1`;
        const [rows] = await pool.query(query);
        console.log("LAST ID ROWS:", rows);
        
        if (rows.length > 0) {
            const lastId = rows[0].trans_id;
            console.log("LENGTH OF lastId:", lastId.length);
            console.log("lastId:", lastId, "!");
            console.log("trimmed:", lastId.trim());
        }
    } catch(e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
test();
