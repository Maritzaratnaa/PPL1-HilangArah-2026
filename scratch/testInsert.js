const pool = require('../backend/db');

async function testInsert() {
    try {
        const query = `
            INSERT INTO trans (trans_id, name, type, is_low_entry, has_wheelchair_slot, has_priority_seat, has_women_area, is_active) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

        const [res] = await pool.query(query, [
            'TR-999', 'TEST', 'Bus',
            0, 0,
            0, 0,
            1
        ]);
        console.log("INSERT RESULT:", res);
        
        await pool.query(`DELETE FROM trans WHERE trans_id = 'TR-999'`);
    } catch(e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
testInsert();
