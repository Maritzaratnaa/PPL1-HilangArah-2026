const pool = require('../db');

const autoExpireSubscriptions = async () => {
    try {
        // 1. Bebaskan pemandu (set is_available = 1) yang terikat pada langganan yang sudah kedaluwarsa
        await pool.query(`
            UPDATE guides g
            JOIN subs s ON g.employee_id = s.employee_id
            SET g.is_available = 1
            WHERE s.status = 'Active' AND s.end_date < CURRENT_DATE()
        `);

        // 2. Ubah status langganan tersebut menjadi Expired
        await pool.query(`
            UPDATE subs 
            SET status = 'Expired' 
            WHERE status = 'Active' AND end_date < CURRENT_DATE()
        `);
    } catch (error) {
        console.error("Error executing Lazy Auto-Expire Subs:", error);
    }
};

module.exports = autoExpireSubscriptions;
